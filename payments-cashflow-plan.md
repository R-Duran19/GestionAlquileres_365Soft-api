# 📋 Plan de Implementación - Módulo Payments & Cashflow

**Fecha:** 06-02-2026
**Versión:** 1.0 - DEMO MVP
**Autor:** Backend Team

---

## 🎯 Objetivo

Implementar un sistema básico de gestión financiera (pagos y flujo de caja) que sea:
- **Simple** para la demo del stakeholder
- **Escalable** para futuras funcionalidades
- **Robusto** con sistema de auditoría

---

## 📚 Requerimientos Funcionales

### **1. Ciclo de Vida del Contrato**

#### **Estados del Contrato:**
- `BORRADOR` - Estado inicial, editable sin restricciones
- `ACTIVO` - Firmado por inquilino, bloqueado, con pagos creados
- `FINALIZADO` - Contrato terminado
- `CANCELADO` - Contrato cancelado

#### **Reglas de Bloqueo:**
1. **Campos BLOQUEADOS al firmar (is_locked = true):**
   - monthly_rent
   - payment_day
   - grace_days
   - late_fee_percentage
   - start_date
   - end_date
   - duration_months

2. **Campos EDITABLES sin justificación:**
   - bank_account_number
   - bank_name
   - bank_account_type
   - bank_account_holder
   - payment_method (preferencia)

3. **Campos EDITABLES con justificación + auditoría:**
   - Cualquier campo bloqueado (requiere desbloqueo previo)
   - Requiere reinicio del proceso de firma por inquilino

---

### **2. Sistema de Pagos (Payments)**

#### **Entidad Payment - Campos:**
```
- id: number
- contract_id: number
- tenant_id: number
- property_id: number
- amount: decimal(10,2)
- due_date: date
- grace_period_end_date: date
- payment_date: timestamp (nullable)
- payment_method: enum (CASH, TRANSFER, ONLINE, OTHER)
- status: enum (PENDIENTE, EN_GRACIA, PAGADO, VENCIDO)
- penalty_fee: decimal(10,2) default 0
- penalty_days: int default 0
- paid_amount: decimal(10,2)
- notes: text (nullable)
- is_penalty_applied: boolean default false
- created_at, updated_at
```

#### **Cálculo de Fechas (usando campos de Contract):**
```
payment_day: Día del mes de vencimiento (default: 5)
grace_days: Días de gracia antes de mora (default: 0)
late_fee_percentage: Porcentaje de recargo (default: 0)

Ejemplo:
- Contract: start_date 2025-01-01, payment_day 5, grace_days 3
- Pago 1: due_date 2025-01-05, grace_period_end_date 2025-01-08
- Pago 2: due_date 2025-02-05, grace_period_end_date 2025-02-08
```

#### **Reglas de Negocio:**
1. **Creación de pagos:** Se crean TODOS al momento de firmar el contrato
2. **Recálculo:** NO se recalculan pagos existentes si se modifica el contrato
3. **Estados automáticos:**
   - `PENDIENTE` - Creado, fecha futura
   - `EN_GRACIA` - Vencido pero dentro de periodo de gracia
   - `VENCIDO` - Pasó el periodo de gracia
   - `PAGADO` - Pagado completamente

4. **Cálculo de moras:**
   - penalty_days = días_actuales - grace_period_end_date
   - penalty_fee = amount * late_fee_percentage / 100

---

### **3. Sistema de Flujo de Caja (Cashflow)**

#### **Entidad Cashflow - Campos:**
```
- id: number
- type: enum (INGRESO, EGRESO)
- category: enum (RENTA, MANTENIMIENTO, SERVICIO, OTROS)
- amount: decimal(10,2)
- description: text
- reference_type: enum (PAYMENT, MAINTENANCE, MANUAL)
- reference_id: number (nullable)
- transaction_date: date
- created_at, updated_at
```

#### **Movimientos Automáticos:**
1. **Al registrar pago:**
   - Type: INGRESO
   - Category: RENTA
   - Amount: paid_amount (incluye mora si aplica)
   - Reference: PAYMENT → payment_id

2. **Al crear mantenimiento con costo:**
   - Type: EGRESO
   - Category: MANTENIMIENTO
   - Amount: maintenance.estimated_cost
   - Reference: MAINTENANCE → maintenance_id

3. **Manual (admin):**
   - Type y Category definidos por admin
   - Reference: MANUAL
   - Para gastos varios, servicios, etc.

---

### **4. Auditoría de Contratos**

#### **Campo `modification_log` en Contract:**
```typescript
modification_log: [
  {
    modified_at: Date,
    modified_by: number, // user_id
    user_role: string, // 'ADMIN' o 'INQUILINO'
    user_name: string,
    changed_fields: string[], // ['payment_day', 'grace_days']
    justification: string,
    previous_values: { payment_day: 5, grace_days: 0 },
    new_values: { payment_day: 10, grace_days: 3 }
  }
]
```

#### **Flujo de Modificación con Auditoría:**
1. Admin solicita desbloquear con justificación
2. Sistema guarda estado anterior en modification_log
3. Sistema aplica cambios
4. Contract vuelve a estado BORRADOR temporalmente
5. Inquilino debe firmar nuevamente para confirmar cambios
6. Al firmar: se registra en modification_log como confirmado

---

### **5. Firma de Contrato**

#### **Endpoint:**
```
POST /tenant/contracts/:id/sign
```

#### **Validaciones:**
1. Contrato debe existir
2. Contrato debe estar en estado BORRADOR
3. Usuario autenticado debe ser el tenant_id del contrato
4. Campos obligatorios deben estar completos:
   - tenant_id
   - property_id
   - monthly_rent
   - payment_day
   - grace_days
   - late_fee_percentage
   - start_date
   - end_date

#### **Acciones al firmar:**
1. Cambiar status a ACTIVO
2. Establecer is_locked = true
3. Establecer tenant_signature_date = now()
4. **Crear todos los pagos del plan** (mes a mes desde start_date hasta end_date)
5. Crear notificación para admin
6. Retornar contrato con resumen de pagos creados

---

### **6. Cron Job de Actualización de Estados**

#### **Scheduler Configuration:**
```
Ejecución: Todos los días a las 00:00 hora Bolivia (UTC-4)
Cron: '0 0 4 * * *'
```

#### **Acciones:**
1. Actualizar estados de pagos:
   - PAGOS con due_date < hoy y status PENDIENTE → VENCIDO
   - PAGOS con due_date < hoy <= grace_period_end_date → EN_GRACIA

2. Calcular penalty_fee y penalty_days para pagos vencidos

3. Crear notificaciones:
   - Pagos vencidos (para admin e inquilino)
   - Pagos próximos a vencer (3 días antes, opcional)

4. Actualizar contratos próximos a vencer (30 días antes)

---

### **7. Notificaciones Automáticas**

#### **Eventos que generan notificaciones:**

**Para Inquilino:**
- Contrato creado (BORRADOR)
- Contrato modificado (requiere re-firma)
- Pago creado (plan de pagos)
- Pago próximo a vencer (3 días antes)
- Pago vencido
- Pago recibido (confirmación)

**Para Admin:**
- Contrato firmado por inquilino
- Pago vencido
- Pago recibido
- Contrato próximo a vencer (30 días antes)
- Modificación de contrato con auditoría

---

## 📡 Endpoints a Implementar

### **Admin - Contracts:**
```
PATCH  /admin/contracts/:id/unlock-and-edit
  - Desbloquear contrato con justificación
  - Requiere reinicio de firma por inquilino

GET    /admin/contracts/:id/audit-log
  - Ver historial de modificaciones
```

### **Tenant - Contracts:**
```
POST   /tenant/contracts/:id/sign
  - Firmar contrato (aceptar términos)
  - Crea plan de pagos completo
```

### **Admin - Payments:**
```
GET    /admin/payments
  - Listar todos los pagos
  - Filtros: status, tenant_id, property_id, date_range

GET    /admin/payments/summary
  - Resumen financiero
  - { total_pending, total_paid, total_overdue, count }

GET    /admin/payments/overdue
  - Solo pagos vencidos

GET    /admin/payments/:id
  - Detalle de pago

POST   /admin/payments/:id/pay
  - Registrar pago manualmente
  - Body: { payment_method, notes, amount }
```

### **Tenant - Payments:**
```
GET    /tenant/payments
  - Mis pagos

GET    /tenant/payments/:id
  - Detalle de mi pago

POST   /tenant/payments/:id/pay
  - Pagar mi renta
  - Body: { payment_method, notes }
```

### **Admin - Cashflow:**
```
GET    /admin/cashflow
  - Todos los movimientos
  - Filtros: type, category, date_range

POST   /admin/cashflow
  - Registrar movimiento manual
  - Body: { type, category, amount, description, transaction_date }

GET    /admin/cashflow/balance
  - Balance actual
  - { total_income, total_expenses, current_balance }

GET    /admin/cashflow/summary
  - Resumen por categoría
```

---

## 🏗️ Arquitectura Técnica

### **Nuevos Módulos:**
```
src/
├── payments/
│   ├── entities/
│   │   └── payment.entity.ts
│   ├── dto/
│   │   ├── create-payment.dto.ts
│   │   ├── pay-payment.dto.ts
│   │   ├── filter-payments.dto.ts
│   │   └── payment-summary.dto.ts
│   ├── enums/
│   │   ├── payment-status.enum.ts
│   │   └── payment-method.enum.ts
│   ├── payments.controller.ts
│   ├── payments.service.ts
│   ├── payments.module.ts
│   └── payments.scheduler.ts
│
└── cashflow/
    ├── entities/
    │   └── cashflow.entity.ts
    ├── dto/
    │   ├── create-cashflow.dto.ts
    │   └── cashflow-summary.dto.ts
    ├── enums/
    │   └── cashflow-type.enum.ts
    ├── cashflow.controller.ts
    ├── cashflow.service.ts
    └── cashflow.module.ts
```

### **Modificaciones a Módulos Existentes:**

**Contracts:**
- Agregar campo `is_locked` a Contract entity
- Agregar campo `modification_log` a Contract entity
- Nuevo endpoint `POST /tenant/contracts/:id/sign`
- Nuevo endpoint `PATCH /admin/contracts/:id/unlock-and-edit`
- Nuevo endpoint `GET /admin/contracts/:id/audit-log`
- Integración con Payments al firmar

**Maintenance:**
- Integración con Cashflow al crear mantenimiento con costo

**Notifications:**
- Nuevos tipos de notificación:
  - CONTRACT_SIGNED
  - CONTRACT_MODIFIED
  - PAYMENT_DUE_SOON
  - PAYMENT_OVERDUE
  - PAYMENT_RECEIVED

---

## ⏱️ Orden de Implementación

1. ✅ **Payments Module**
   - Entity, DTOs, Enums
   - Service (CRUD + lógica de pagos)
   - Controller (admin + tenant)

2. ✅ **Integración Contract ↔ Payments**
   - Campo `is_locked` en Contract
   - Campo `modification_log` en Contract
   - Endpoint para firmar contrato
   - Creación de pagos al firmar

3. ✅ **Payments Scheduler**
   - Configurar zona horaria La Paz (UTC-4)
   - Cron job diario
   - Actualización de estados
   - Cálculo de moras

4. ✅ **Cashflow Module**
   - Entity, DTOs, Enums
   - Service (CRUD + balance)
   - Controller

5. ✅ **Integraciones**
   - Payment → Cashflow (al pagar)
   - Maintenance → Cashflow (al crear con costo)
   - Notificaciones automáticas

6. ✅ **Testing & Documentation**
   - Verificar todos los flujos
   - Actualizar documentación de APIs

---

## 🎯 Casos de Uso Principales

### **CU1: Creación y Firma de Contrato**
```
1. Admin crea contrato (BORRADOR)
2. Admin edita campos (payment_day, grace_days, etc.)
3. Inquilino accede a POST /tenant/contracts/:id/sign
4. Sistema valida campos obligatorios
5. Sistema crea plan de pagos completo (mes a mes)
6. Contrato pasa a ACTIVO, is_locked = true
7. Notificación para admin e inquilino
```

### **CU2: Modificación de Contrato con Auditoría**
```
1. Admin solicita PATCH /admin/contracts/:id/unlock-and-edit
2. Admin proporciona justificación
3. Sistema guarda estado anterior en modification_log
4. Sistema aplica cambios, is_locked = false, status = BORRADOR
5. Notificación para inquilino: "El contrato fue modificado, por favor revise y firme nuevamente"
6. Inquilino firma nuevamente
7. Sistema registra confirmación en modification_log
8. is_locked = true, status = ACTIVO
```

### **CU3: Pago de Renta**
```
1. Inquilino accede a GET /tenant/payments
2. Ve pagos con colores:
   - Verde: PAGADO
   - Amarillo: EN_GRACIA
   - Rojo: VENCIDO
3. Inquilino paga renta: POST /tenant/payments/:id/pay
4. Sistema marca pago como PAGADO
5. Sistema crea Cashflow.INGRESO (category: RENTA)
6. Notificación de confirmación para ambos
```

### **CU4: Vencimiento Automático**
```
1. Cron job ejecuta todos los días a las 00:00
2. Actualiza pagos PENDIENTE → VENCIDO o EN_GRACIA
3. Calcula penalty_fee para pagos vencidos
4. Crea notificaciones de pago vencido
```

---

## ✅ Criterios de Aceptación

- [ ] Contrato se crea en estado BORRADOR
- [ ] Contrato solo crea pagos al firmar por inquilino
- [ ] Campos críticos se bloquean al firmar
- [ ] Modificación de contrato bloqueado requiere justificación
- [ ] Modificación de contrato requiere re-firma de inquilino
- [ ] Historial de auditoría se guarda correctamente
- [ ] Pagos se crean con fechas correctas (payment_day del contrato)
- [ ] Pagos no se recalculan si se modifica el contrato
- [ ] Estados de pagos se actualizan automáticamente (cron job)
- [ ] Moras se calculan correctamente (penalty_fee y penalty_days)
- [ ] Flujo de caja registra ingresos al pagar
- [ ] Flujo de caja registra egresos al crear mantenimiento
- [ ] Notificaciones se crean para eventos importantes
- [ ] Balance de caja es correcto
- [ ] Zona horaria del scheduler está en La Paz (UTC-4)

---

## 📝 Notas Importantes

1. **No se implementarán:** Pasarelas de pago, periodos contables cerrados, reconciliación bancaria
2. **Para futuro:** Pagos parciales, notas de crédito, reportes avanzados PDF
3. **Prioridad:** Funcionalidad básica para demo, no optimización
4. **Auditoría:** Simplificada con JSON en Contract, no tabla separada
5. **Zona horaria:** Todo en UTC-4 (America/La_Paz)

---

## 🚀 Próximos Pasos

Una vez completado este módulo:
1. Crear seed data con contratos de ejemplo
2. Preparar demo para stakeholder
3. Documentar APIs para frontend
4. Testing final de integración

---

**Documento de Planificación - v1.0**
**Status:** PENDIENTE DE IMPLEMENTACIÓN
