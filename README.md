# 🏢 Sistema de Gestión de Alquileres 365 Soft - API

Sistema **multitenancy** tipo Buildium para gestión de propiedades inmobiliarias. Desarrollado con NestJS, TypeScript y PostgreSQL.

## 🎯 Características Principales

- **Multitenancy por Schema** - Cada inmobiliaria tiene su propio schema en PostgreSQL
- **Catálogo Público** - Interesados pueden ver propiedades sin autenticarse
- **Gestión de Contratos** - Creación y generación automática de PDFs
- **Sistema de Pagos** - Control de vencimientos, historial y simulación de pagos online
- **Notificaciones** - Sistema automático de notificaciones por eventos
- **Dashboards** - Métricas y reportes financieros en tiempo real


## 🛠️ Stack Tecnológico

- **Framework**: NestJS 11.0.1
- **Lenguaje**: TypeScript 5.7
- **Base de datos**: PostgreSQL 18
- **ORM**: TypeORM 0.3.28
- **Autenticación**: JWT (jsonwebtoken)
- **PDF Generation**: PDFKit
- **Validación**: class-validator, class-transformer
- **Documentación**: Swagger/OpenAPI

## Configuración Inicial

### Prerrequisitos

- Node.js (v22 o superior)
- PostgreSQL (v18 o superior)
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install
```

### Variables de Entorno

Copiar el archivo `.env.example` a `.env` y configurar las variables:

```bash
cp .env.example .env
```

Configurar las siguientes variables en `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=tu_password
DB_DATABASE=build

# App
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRATION=7d
```

## Comandos de Desarrollo

### Ejecutar la aplicación

```bash
# Modo desarrollo (con hot reload)
npm run start:dev

# Modo debug
npm run start:debug

# Modo producción
npm run build
npm run start:prod
```

### Code Quality

```bash
# Formatear código
npm run format

# Linter con auto-fix
npm run lint

# Compilar
npm run build
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🌐 Endpoints Principales

### **Públicos (sin autenticación)**
```bash
GET  /catalog/:slug/properties              # Catálogo de propiedades
GET  /catalog/:slug/properties/:id          # Detalle de propiedad
POST /catalog/:slug/properties/:id/apply    # Aplicar a propiedad
POST /auth/:slug/register                   # Registro (interesado → inquilino)
POST /auth/:slug/login                      # Login
```

### **Admin (requiere JWT + rol ADMIN)**
```bash
# Properties
GET/POST    /admin/properties               # CRUD propiedades
POST        /admin/properties/:id/images    # Subir imágenes

# Contracts
GET/POST    /admin/contracts                # CRUD contratos
GET         /admin/contracts/:id/pdf        # Descargar PDF

# Payments & Financial
GET         /admin/payments                 # Ver todos los pagos
GET         /admin/cashflow                 # Flujo de caja
GET         /admin/reports/*                # Reportes financieros

# Requests
GET         /admin/tenant-requests          # Solicitudes pendientes
PATCH       /admin/tenant-requests/:id/approve # Aprobar solicitud

# Maintenance
GET/POST    /admin/maintenance              # CRUD mantenimiento

# Dashboard
GET         /admin/dashboard                # Métricas generales
```

### **Inquilino (requiere JWT + rol INQUILINO)**
```bash
GET  /tenant/contracts                     # Mis contratos
GET  /tenant/contracts/:id/pdf             # Descargar mi contrato
GET  /tenant/payments                      # Mis pagos
POST /tenant/payments/:id/pay              # Pagar
POST /tenant/payments/:id/pay-online       # Pagar online (simulado)
POST /tenant/maintenance                   # Reportar problema
GET  /tenant/notifications                 # Mis notificaciones
GET  /tenant/dashboard                     # Mi dashboard
```

### **Health Check**
```bash
GET /health
```

Respuesta:
```json
{
  "status": "ok",
  "database": { "connected": true }
}
```

📖 **Documentación completa de APIs**: Ver [docs/api/API-FRONTEND.md](docs/api/API-FRONTEND.md)

## 📁 Estructura del Proyecto

```
src/
├── main.ts                          # Entry point
├── app.module.ts                    # Root module
├── common/                          # Utilidades compartidas
│   ├── config/                     # Configuración
│   ├── decorators/                 # @Tenant, @CurrentUser, @Roles
│   ├── guards/                     # Auth, Tenant, Roles guards
│   ├── middleware/                 # Multitenancy middleware
│   └── dto/                        # DTOs comunes
├── tenants/                         # Módulo global (tabla de inmobiliarias)
├── auth/                            # Autenticación JWT
├── users/                           # Usuarios (Admin, Inquilino)
├── properties/                      # Propiedades + Imágenes
├── tenant-requests/                 # Solicitudes de inquilinos
├── contracts/                       # Contratos + PDF
├── payments/                        # Pagos + Records
├── maintenance/                     # Solicitudes de mantenimiento
├── notifications/                   # Sistema de notificaciones
├── cashflow/                        # Flujo de caja
├── reports/                         # Reportes financieros
└── dashboard/                       # Dashboards admin/inquilino

docs/                                # Documentación completa
├── PROJECT-SUMMARY.md               # Resumen ejecutivo
├── architecture/                    # Arquitectura técnica
├── database/                        # Modelo de datos
├── api/                             # API docs para frontend
└── roadmap-6-days.md                # Plan de desarrollo
```

📖 **Estructura detallada**: Ver [docs/architecture/project-structure.md](docs/architecture/project-structure.md)

## ⚙️ Configuración de Base de Datos

Sistema **multitenancy por schema**:

- **Tabla global**: `public.tenants` (una sola tabla para todas las inmobiliarias)
- **Schemas por tenant**: `tenant_{slug}` (cada inmobiliaria tiene su schema)
- **Auto-sincronización**: Activada en desarrollo
- **Logging**: Activado en desarrollo
- **Entidades**: Se cargan automáticamente desde `**/*.entity{.ts,.js}`

## 🎯 Estado del Progreso

### **✅ v2.0.0 - Limpieza de Arquitectura (29/01/2026):**
- ✅ Eliminado módulo `users` (tabla global de usuarios)
- ✅ Eliminado endpoint `POST /tenants` (crear tenant sin admin)
- ✅ Actualizado `AuthService` para usar queries SQL directas
- ✅ Unificado flujo de creación: solo `/auth/register-admin`
- ✅ Arquitectura más limpia y consistente

### **✅ v1.0.0 - Día 1 Completado (29/01/2026):**
- ✅ Módulo Multitenancy (detección por slug, schemas dinámicos)
- ✅ Módulo Auth & Users (JWT, login, registro, roles)
- ✅ TenantContextMiddleware (aislamiento de datos)
- ✅ Guards y Decorators (@Public, @Roles, @CurrentUser)
- ✅ CRUD completo de usuarios
- ✅ Integración auth con multitenancy

📖 **Documentación Completa**: [docs/COMPLETE-DOCUMENTATION.md](docs/COMPLETE-DOCUMENTATION.md)
🚀 **Guía Rápida**: [docs/QUICKSTART.md](docs/QUICKSTART.md)

### **🚧 Próximos Módulos (Días 2-6):**
- [ ] Módulo Properties (Día 2)
- [ ] Módulo Contracts + PDF (Día 3)
- [ ] Módulo Payments (Día 4)
- [ ] Módulo Maintenance (Día 5)
- [ ] Módulo Notifications (Día 5)
- [ ] Módulo Cashflow & Reports (Día 5)

📅 **Roadmap completo**: [docs/roadmap-6-days.md](docs/roadmap-6-days.md)

## 📖 Recursos y Documentación

### **Técnica:**
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### **Del Proyecto:**
- **Documentación técnica**: `/docs` folder
- **Swagger API Docs**: `http://localhost:3000/api/docs` (al iniciar la app)
- **Postman Collection**: Se generará en el Día 6

## 👥 Equipo

- **Backend**: 3 desarrolladores
- **Frontend**: 3 desarrolladores (Angular - repositorio separado)

## 📝 Notas Importantes

- **Multitenancy**: El sistema aísla completamente los datos de cada inmobiliaria
- **Catálogo Público**: Los interesados NO necesitan registrarse para ver propiedades
- **Registro**: Los interesados al registrarse se convierten automáticamente en inquilinos
- **Simulación**: La pasarela de pagos está simulada para el MVP (no procesa pagos reales)

---

**Fecha de inicio**: 29/01/2026
**Fecha de entrega MVP**: 06/02/2026 (6 días hábiles)
**Versión**: 2.0.0 - Limpieza de Arquitectura
**Última actualización**: 29/01/2026

## 📄 Licencia

UNLICENSED
