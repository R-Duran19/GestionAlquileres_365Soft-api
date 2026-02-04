# API Documentation - Admin - Módulo de Mantenimiento

Esta documentación está diseñada para el equipo de frontend que trabajará en el panel de administración del módulo de mantenimiento. Permite a los administradores gestionar las solicitudes de mantenimiento y consultas generales de los inquilinos.

**Base URL:** `http://localhost:3000`

**⚠️ IMPORTANTE - Formato de Rutas:**
Todas las rutas ahora incluyen el **slug del tenant** como primer parámetro:
- `/:slug/admin/maintenance/*` - Rutas para administradores
- `/:slug/tenant/maintenance/*` - Rutas para inquilinos

Ejemplo: `http://localhost:3000/mi-empresa/admin/maintenance`

---

## Índice

1. [Listado y Filtrado de Solicitudes](#1-listado-y-filtrado-de-solicitudes)
2. [Ver Detalle de Solicitud](#2-ver-detalle-de-solicitud)
3. [Actualizar Solicitudes](#3-actualizar-solicitudes)
4. [Sistema de Mensajería](#4-sistema-de-mensajería)
5. [Estadísticas y Dashboard](#5-estadísticas-y-dashboard)
6. [Gestión por Propiedad/Inquilino](#6-gestión-por-propiedadinquilino)
7. [Crear Solicitudes (Admin)](#7-crear-solicitudes-admin)
8. [Eliminar Solicitudes](#8-eliminar-solicitudes)

---

## 1. Listado y Filtrado de Solicitudes

### 1.1 Obtener Todas las Solicitudes

**Endpoint:** `GET /:slug/admin/maintenance`
**Auth:** Requerida - `Authorization: Bearer <token>`

**Query Params (Todos opcionales - para filtrado):**
```
?status=NEW
&priority=HIGH
&request_type=MAINTENANCE
&tenant_id=5
&property_id=10
```

**Descripción de filtros:**
- `status` - Filtra por estado (NEW, IN_PROGRESS, COMPLETED, DEFERRED, CLOSED)
- `priority` - Filtra por prioridad (LOW, NORMAL, HIGH)
- `request_type` - Filtra por tipo (MAINTENANCE, GENERAL)
- `tenant_id` - Filtra por inquilino específico
- `property_id` - Filtra por propiedad específica

---

### Ejemplos de Uso

#### Ejemplo 1: Todas las solicitudes
```http
GET /mi-empresa/admin/maintenance
```
Devuelve todas las solicitudes del sistema.

#### Ejemplo 2: Solo solicitudes nuevas
```http
GET /mi-empresa/admin/maintenance?status=NEW
```
Devuelve solo las solicitudes con estado "NUEVO" (sin revisar).

#### Ejemplo 3: Solicitudes urgentes en progreso
```http
GET /mi-empresa/admin/maintenance?priority=HIGH&status=IN_PROGRESS
```
Devuelve solicitudes urgentes que están siendo atendidas.

#### Ejemplo 4: Solicitudes de una propiedad específica
```http
GET /mi-empresa/admin/maintenance?property_id=10
```
Devuelve todas las solicitudes de la propiedad con ID 10.

---

### Response (200)

```json
[
  {
    "id": 1,
    "ticket_number": "MNT-2024-7A3F9B2",
    "request_type": "MAINTENANCE",
    "category": "PLOMERIA",
    "title": "Fuga en el baño principal",
    "description": "Hay una fuga constante en el lavamanos del baño principal...",
    "permission_to_enter": "YES",
    "has_pets": true,
    "entry_notes": "La llave está debajo de la maceta. Tengo un perro pequeño",
    "status": "NEW",
    "priority": "HIGH",
    "due_date": null,
    "assigned_to": 1,
    "tenant_id": 5,
    "property_id": 10,
    "created_at": "2024-02-03T10:30:00.000Z",
    "updated_at": "2024-02-03T10:30:00.000Z",
    "property": {
      "id": 10,
      "title": "Apartamento 5B"
    }
  },
  {
    "id": 2,
    "ticket_number": "MNT-2024-3C8D2E1",
    "request_type": "GENERAL",
    "category": null,
    "title": "Consulta sobre contrato",
    "description": "Tengo una duda sobre la cláusula 3.2 del contrato...",
    "permission_to_enter": "NOT_APPLICABLE",
    "has_pets": false,
    "entry_notes": null,
    "status": "IN_PROGRESS",
    "priority": "NORMAL",
    "due_date": "2024-02-10",
    "assigned_to": 1,
    "tenant_id": 5,
    "property_id": 10,
    "created_at": "2024-02-03T09:15:00.000Z",
    "updated_at": "2024-02-03T11:00:00.000Z",
    "property": {
      "id": 10,
      "title": "Apartamento 5B"
    }
  }
]
```

---

## 2. Ver Detalle de Solicitud

### 2.1 Obtener Detalle Completo

**Endpoint:** `GET /:slug/admin/maintenance/:id`
**Auth:** Requerida

**URL Params:**
- `id` - El ID de la solicitud (ej: 1)

**Response (200):**

```json
{
  "id": 1,
  "ticket_number": "MNT-2024-7A3F9B2",
  "request_type": "MAINTENANCE",
  "category": "PLOMERIA",
  "title": "Fuga en el baño principal",
  "description": "Hay una fuga constante en el lavamanos del baño principal. El agua gotea incluso con el grifo cerrado. Esto ya causó un pequeño daño en el gabinete.",
  "permission_to_enter": "YES",
  "has_pets": true,
  "entry_notes": "La llave está debajo de la maceta verde en la entrada. Tengo un perro pequeño de raza chihuahua, muy tranquilo. Pueden entrar sin aviso previo.",
  "status": "NEW",
  "priority": "HIGH",
  "due_date": null,
  "assigned_to": 1,
  "tenant_id": 5,
  "property_id": 10,
  "created_at": "2024-02-03T10:30:00.000Z",
  "updated_at": "2024-02-03T10:30:00.000Z",
  "property": {
    "id": 10,
    "title": "Apartamento 5B",
    "status": "OCUPADO"
  },
  "messages": [
    {
      "id": 1,
      "maintenance_request_id": 1,
      "user_id": 5,
      "message": "Reporto la fuga del lavamanos. Ayer noche se hizo más grande el problema.",
      "send_to_resident": true,
      "created_at": "2024-02-03T10:30:00.000Z",
      "attachments": [
        {
          "id": 1,
          "file_url": "/storage/maintenance/fuga_bano_1.jpg",
          "file_name": "fuga_bano_1.jpg",
          "file_type": "image",
          "created_at": "2024-02-03T10:30:00.000Z"
        },
        {
          "id": 2,
          "file_url": "/storage/maintenance/dano_gabinete.jpg",
          "file_name": "dano_gabinete.jpg",
          "file_type": "image",
          "created_at": "2024-02-03T10:30:00.000Z"
        }
      ]
    }
  ],
  "attachments": [
    {
      "id": 3,
      "file_url": "/storage/maintenance/fuga_bano_2.jpg",
      "file_name": "fuga_bano_2.jpg",
      "file_type": "image",
      "created_at": "2024-02-03T10:30:00.000Z"
    }
  ]
}
```

**Nota:** El detalle incluye:
- Todos los campos de la solicitud
- Información de la propiedad
- Historial completo de mensajes con archivos adjuntos
- Archivos adjuntos directamente a la solicitud

---

## 3. Actualizar Solicitudes

### 3.1 Actualizar Estado, Prioridad, Fecha de Vencimiento o Asignación

**Endpoint:** `PATCH /:slug/admin/maintenance/:id`
**Auth:** Requerida

**URL Params:**
- `id` - El ID de la solicitud

**Request Body (todos los campos son opcionales):**

```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "due_date": "2024-02-10",
  "assigned_to": 2
}
```

**Descripción de campos:**
- `status` - Nuevo estado (NEW, IN_PROGRESS, COMPLETED, DEFERRED, CLOSED)
- `priority` - Nueva prioridad (LOW, NORMAL, HIGH)
- `due_date` - Fecha límite para resolver (formato YYYY-MM-DD)
- `assigned_to` - ID del admin asignado

---

### Ejemplos de Actualización

#### Ejemplo 1: Cambiar a "En Progreso"
```json
{
  "status": "IN_PROGRESS"
}
```

#### Ejemplo 2: Asignar fecha límite y cambiar prioridad
```json
{
  "priority": "HIGH",
  "due_date": "2024-02-10"
}
```

#### Ejemplo 3: Reasignar a otro admin
```json
{
  "assigned_to": 3
}
```

#### Ejemplo 4: Completar solicitud
```json
{
  "status": "COMPLETED"
}
```

---

### Response (200)

```json
{
  "id": 1,
  "ticket_number": "MNT-2024-7A3F9B2",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "due_date": "2024-02-10",
  "assigned_to": 2,
  "updated_at": "2024-02-03T12:00:00.000Z",
  // ... resto de los campos
}
```

---

## 4. Sistema de Mensajería

### 4.1 Obtener Mensajes de una Solicitud

**Endpoint:** `GET /:slug/admin/maintenance/:id/messages`
**Auth:** Requerida

**URL Params:**
- `id` - El ID de la solicitud

**Response (200):**

```json
[
  {
    "id": 1,
    "maintenance_request_id": 1,
    "user_id": 5,
    "message": "Reporto la fuga del lavamanos. Ayer noche se hizo más grande el problema.",
    "send_to_resident": true,
    "created_at": "2024-02-03T10:30:00.000Z",
    "attachments": [
      {
        "id": 1,
        "file_url": "/storage/maintenance/fuga_bano_1.jpg",
        "file_name": "fuga_bano_1.jpg",
        "file_type": "image"
      }
    ]
  },
  {
    "id": 2,
    "maintenance_request_id": 1,
    "user_id": 1,
    "message": "Hola, ya revisamos el problema. Enviaremos a un plomero mañana.",
    "send_to_resident": true,
    "created_at": "2024-02-03T11:00:00.000Z",
    "attachments": []
  },
  {
    "id": 3,
    "maintenance_request_id": 1,
    "user_id": 1,
    "message": "Nota interna: El plomero cobra $50 por visita. Aprobar primero con el dueño.",
    "send_to_resident": false,
    "created_at": "2024-02-03T11:05:00.000Z",
    "attachments": []
  }
]
```

**Nota:**
- `send_to_resident: true` - El inquilino puede ver este mensaje
- `send_to_resident: false` - Nota interna (solo visible para admins)

---

### 4.2 Enviar Mensaje

**Endpoint:** `POST /:slug/admin/maintenance/:id/messages`
**Auth:** Requerida

**URL Params:**
- `id` - El ID de la solicitud

**Request Body:**

```json
{
  "message": "El plomero vendrá el martes entre 9:00 y 11:00 AM. ¿Podrás estar?",
  "send_to_resident": true,
  "files": [
    "/storage/maintenance/presupuesto_plomero.pdf"
  ]
}
```

**Descripción de campos:**
- `message` - Texto del mensaje (requerido)
- `send_to_resident` - `true` para enviar también al inquilino, `false` para nota interna (default: `true`)
- `files` - Array de URLs de archivos adjuntos (opcional, máximo 3)

---

### Ejemplos de Mensajes

#### Ejemplo 1: Mensaje visible para el inquilino
```json
{
  "message": "Ya agendamos la visita del técnico para el martes. Te confirmaré la hora.",
  "send_to_resident": true
}
```

#### Ejemplo 2: Nota interna (solo admins)
```json
{
  "message": "El inquilino menciona que el problema viene de antes. Investigar si es responsabilidad del dueño.",
  "send_to_resident": false
}
```

#### Ejemplo 3: Mensaje con archivos
```json
{
  "message": "Adjunto el presupuesto del plomero para tu aprobación.",
  "send_to_resident": true,
  "files": [
    "/storage/maintenance/presupuesto_1.pdf",
    "/storage/maintenance/presupuesto_2.pdf"
  ]
}
```

---

### Response (201)

```json
{
  "id": 4,
  "maintenance_request_id": 1,
  "user_id": 1,
  "message": "El plomero vendrá el martes entre 9:00 y 11:00 AM. ¿Podrás estar?",
  "send_to_resident": true,
  "created_at": "2024-02-03T12:30:00.000Z",
  "attachments": [
    {
      "id": 10,
      "file_url": "/storage/maintenance/presupuesto_plomero.pdf",
      "file_name": "presupuesto_plomero.pdf",
      "file_type": "pdf"
    }
  ]
}
```

---

## 5. Estadísticas y Dashboard

### 5.1 Obtener Estadísticas de Mantenimiento

**Endpoint:** `GET /:slug/admin/maintenance/stats`
**Auth:** Requerida

**Response (200):**

```json
{
  "total": 45,
  "byStatus": {
    "NEW": 8,
    "IN_PROGRESS": 12,
    "COMPLETED": 20,
    "DEFERRED": 3,
    "CLOSED": 2
  },
  "byPriority": {
    "LOW": 15,
    "NORMAL": 20,
    "HIGH": 10
  },
  "newRequests": 8,
  "urgentRequests": 5
}
```

**Descripción de métricas:**
- `total` - Total de solicitudes en el sistema
- `byStatus` - Cantidad de solicitudes por estado
- `byPriority` - Cantidad de solicitudes por prioridad
- `newRequests` - Solicitudes sin revisar (status = NEW)
- `urgentRequests` - Solicitudes urgentes en progreso (priority = HIGH, status = IN_PROGRESS)

---

### Ejemplo de Uso en Dashboard

```javascript
const MaintenanceDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('http://localhost:3000/admin/maintenance/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    };
    fetchStats();
  }, []);

  return (
    <div className="maintenance-dashboard">
      <div className="stat-card">
        <h3>Total Solicitudes</h3>
        <p className="stat-number">{stats?.total || 0}</p>
      </div>

      <div className="stat-card warning">
        <h3>Nuevas</h3>
        <p className="stat-number">{stats?.newRequests || 0}</p>
      </div>

      <div className="stat-card danger">
        <h3>Urgentes</h3>
        <p className="stat-number">{stats?.urgentRequests || 0}</p>
      </div>

      <div className="chart">
        <h3>Por Estado</h3>
        {stats?.byStatus && (
          <ul>
            <li>Nuevas: {stats.byStatus.NEW}</li>
            <li>En Progreso: {stats.byStatus.IN_PROGRESS}</li>
            <li>Completadas: {stats.byStatus.COMPLETED}</li>
          </ul>
        )}
      </div>
    </div>
  );
};
```

---

## 6. Gestión por Propiedad/Inquilino

### 6.1 Obtener Solicitudes por Propiedad

**Endpoint:** `GET /:slug/admin/maintenance/property/:propertyId`
**Auth:** Requerida

**URL Params:**
- `propertyId` - El ID de la propiedad (ej: 10)

**Response (200):**

```json
[
  {
    "id": 1,
    "ticket_number": "MNT-2024-7A3F9B2",
    "request_type": "MAINTENANCE",
    "category": "PLOMERIA",
    "title": "Fuga en el baño principal",
    "status": "COMPLETED",
    "priority": "HIGH",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T15:00:00.000Z"
  },
  {
    "id": 5,
    "ticket_number": "MNT-2024-9B2C3F4",
    "request_type": "GENERAL",
    "title": "Consulta sobre contrato",
    "status": "NEW",
    "priority": "NORMAL",
    "created_at": "2024-02-01T09:00:00.000Z",
    "updated_at": "2024-02-01T09:00:00.000Z"
  }
]
```

---

### 6.2 Obtener Solicitudes por Inquilino

**Endpoint:** `GET /:slug/admin/maintenance/tenant/:tenantId`
**Auth:** Requerida

**URL Params:**
- `tenantId` - El ID del inquilino (ej: 5)

**Response (200):**

```json
[
  {
    "id": 1,
    "ticket_number": "MNT-2024-7A3F9B2",
    "request_type": "MAINTENANCE",
    "title": "Fuga en el baño principal",
    "status": "COMPLETED",
    "priority": "HIGH",
    "created_at": "2024-01-15T10:30:00.000Z",
    "property": {
      "id": 10,
      "title": "Apartamento 5B"
    }
  },
  {
    "id": 2,
    "ticket_number": "MNT-2024-3C8D2E1",
    "request_type": "MAINTENANCE",
    "title": "Aire acondicionado no enfría",
    "status": "NEW",
    "priority": "NORMAL",
    "created_at": "2024-02-03T09:15:00.000Z",
    "property": {
      "id": 10,
      "title": "Apartamento 5B"
    }
  }
]
```

---

## 7. Crear Solicitudes (Admin)

### 7.1 Crear Solicitud en nombre de un Inquilino

**Endpoint:** `POST /:slug/admin/maintenance`
**Auth:** Requerida

**Request Body (Solicitud de Mantenimiento):**

```json
{
  "request_type": "MAINTENANCE",
  "category": "ELECTRICO",
  "title": "Toma de cocina no funciona",
  "description": "La toma eléctrica de la cocina dejó de funcionar. Probé varios aparatos y ninguno enciende.",
  "permission_to_enter": "YES",
  "has_pets": false,
  "entry_notes": "Pueden entrar entre 9AM y 6PM. Llamar antes al 555-1234",
  "tenant_id": 5,
  "property_id": 10
}
```

**Request Body (Solicitud General):**

```json
{
  "request_type": "GENERAL",
  "title": "Duda sobre renovación de contrato",
  "description": "Quisiera saber cuánto tiempo antes debo notificar si quiero renovar mi contrato.",
  "tenant_id": 5,
  "property_id": 10
}
```

---

### Response (201)

```json
{
  "id": 10,
  "ticket_number": "MNT-2024-1A2B3C4",
  "request_type": "MAINTENANCE",
  "category": "ELECTRICO",
  "title": "Toma de cocina no funciona",
  "description": "La toma eléctrica de la cocina dejó de funcionar...",
  "permission_to_enter": "YES",
  "has_pets": false,
  "entry_notes": "Pueden entrar entre 9AM y 6PM...",
  "status": "NEW",
  "priority": "NORMAL",
  "tenant_id": 5,
  "property_id": 10,
  "assigned_to": 1,
  "created_at": "2024-02-03T14:00:00.000Z",
  "updated_at": "2024-02-03T14:00:00.000Z"
}
```

---

## 8. Eliminar Solicitudes

### 8.1 Eliminar Solicitud

**Endpoint:** `DELETE /:slug/admin/maintenance/:id`
**Auth:** Requerida

**URL Params:**
- `id` - El ID de la solicitud

**Response (204):** No content

**Nota:** Esta operación elimina permanentemente la solicitud y todos sus mensajes/archivos asociados.

---

## Estados y Prioridades - Guía de Uso

### Estados (Status)

| Estado | Descripción | Cuándo Usar |
|--------|-------------|-------------|
| `NEW` | Nuevo / Sin revisar | Recién creada, el admin aún no la ha visto |
| `IN_PROGRESS` | En Progreso | El admin está trabajando en resolverla |
| `COMPLETED` | Completada | El trabajo fue terminado exitosamente |
| `DEFERRED` | Diferida | Se pospone o cancela temporalmente |
| `CLOSED` | Cerrada | Se cierra definitivamente |

**Flujo recomendado:**
```
NEW → IN_PROGRESS → COMPLETED
                  → DEFERRED → IN_PROGRESS
                  → CLOSED
```

### Prioridades (Priority)

| Prioridad | Descripción | Ejemplos |
|-----------|-------------|----------|
| `LOW` | Baja | Cambio de focillo, pintura pequeña |
| `NORMAL` | Normal (default) | Aire acondicionado, lavamanos |
| `HIGH` | Alta | Fuga de agua, sin electricidad, sin agua caliente |

### Categorías de Mantenimiento

- `GENERAL` - Problemas generales
- `ACCESORIOS` - Accesorios y fittings
- `ELECTRICO` - Problemas eléctricos
- `CLIMATIZACION` - Aire acondicionado, calefacción
- `LLAVE_CERRADURA` - Cerraduras y llaves
- `ILUMINACION` - Luces y lámparas
- `AFUERA` - Áreas exteriores, jardín
- `PLOMERIA` - Problemas de agua, desagües

---

## Ejemplo Completo de Flujo de Trabajo

### Escenario: Administrar una Solicitud de Mantenimiento

#### Paso 1: Ver nuevas solicitudes
```javascript
const response = await fetch('http://localhost:3000/admin/maintenance?status=NEW', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const newRequests = await response.json();

// Mostrar lista de solicitudes nuevas
```

#### Paso 2: Ver detalle de una solicitud
```javascript
const detailResponse = await fetch(`http://localhost:3000/admin/maintenance/${requestId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const request = await detailResponse.json();

// Mostrar formulario con detalles de la solicitud
```

#### Paso 3: Actualizar estado y asignar fecha
```javascript
await fetch(`http://localhost:3000/admin/maintenance/${requestId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    due_date: '2024-02-10'
  })
});
```

#### Paso 4: Enviar mensaje al inquilino
```javascript
await fetch(`http://localhost:3000/admin/maintenance/${requestId}/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'Ya revisamos el problema. Enviaremos a un plomero mañana entre 9-11 AM. ¿Podrás estar?',
    send_to_resident: true
  })
});
```

#### Paso 5: Crear nota interna
```javascript
await fetch(`http://localhost:3000/admin/maintenance/${requestId}/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'El plomero cobra $50 por visita + repuestos. Aprobar con dueño primero.',
    send_to_resident: false  // Solo visible para admins
  })
});
```

#### Paso 6: Completar solicitud
```javascript
await fetch(`http://localhost:3000/admin/maintenance/${requestId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    status: 'COMPLETED'
  })
});
```

#### Paso 7: Enviar mensaje final
```javascript
await fetch(`http://localhost:3000/admin/maintenance/${requestId}/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'El problema fue resuelto exitosamente. El plomero cambió el sifón y ahora todo funciona correctamente. El costo fue de $80.',
    send_to_resident: true
  })
});
```

---

## Componente de Ejemplo - Lista de Solicitudes

```javascript
import { useState, useEffect } from 'react';

const MaintenanceList = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, NEW, IN_PROGRESS, COMPLETED

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    const url = filter === 'ALL'
      ? 'http://localhost:3000/admin/maintenance'
      : `http://localhost:3000/admin/maintenance?status=${filter}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();
    setRequests(data);
  };

  const getStatusColor = (status) => {
    const colors = {
      'NEW': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'DEFERRED': 'bg-orange-100 text-orange-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'text-green-600',
      'NORMAL': 'text-yellow-600',
      'HIGH': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="maintenance-list">
      {/* Filtros */}
      <div className="filters mb-4">
        <button
          className={filter === 'ALL' ? 'active' : ''}
          onClick={() => setFilter('ALL')}
        >
          Todas ({requests.length})
        </button>
        <button
          className={filter === 'NEW' ? 'active' : ''}
          onClick={() => setFilter('NEW')}
        >
          Nuevas
        </button>
        <button
          className={filter === 'IN_PROGRESS' ? 'active' : ''}
          onClick={() => setFilter('IN_PROGRESS')}
        >
          En Progreso
        </button>
        <button
          className={filter === 'COMPLETED' ? 'active' : ''}
          onClick={() => setFilter('COMPLETED')}
        >
          Completadas
        </button>
      </div>

      {/* Tabla de solicitudes */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Título</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Propiedad</th>
            <th>Actualizado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(request => (
            <tr key={request.id}>
              <td className="font-mono text-sm">{request.ticket_number}</td>
              <td>{request.title}</td>
              <td>{request.category || '-'}</td>
              <td>
                <span className={`px-2 py-1 rounded ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </td>
              <td className={getPriorityColor(request.priority)}>
                {request.priority}
              </td>
              <td>{request.property?.title}</td>
              <td>{new Date(request.updated_at).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => viewDetail(request.id)}
                  className="btn-view"
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Notas Importantes para el Frontend

### 1. Número de Ticket
- El `ticket_number` es único y aleatorio
- Úsalo como referencia en la UI (más profesional que el ID)
- Formato: `MNT-2024-7A3F9B2`

### 2. Estados Finales
- `COMPLETED` y `CLOSED` son estados finales
- En estos estados, el inquilino NO puede enviar más mensajes
- El admin SIEMPRE puede enviar mensajes

### 3. Mensajes Privados
- `send_to_resident: false` = nota interna (solo admins)
- `send_to_resident: true` = visible para inquilino
- Filtra los mensajes en la UI del admin para mostrar claramente cuáles son internos

### 4. Archivos Adjuntos
- Máximo 3 archivos por carga
- Tipos permitidos: imágenes (JPG, PNG), PDF
- Las URLs son relativas: `/storage/maintenance/...`

### 5. Fecha de Vencimiento
- Formato: `YYYY-MM-DD`
- Es opcional (`null` si no está asignada)
- El admin la asigna manualmente

### 6. Permisos de Entrada
- `YES` - El inquilino autoriza entrada sin aviso
- `NO` - No autoriza entrada sin aviso
- `NOT_APPLICABLE` - No es necesario entrar (solo aplicable a maintenance)
- Si `permission_to_enter = "YES"`, revisar `has_pets` y `entry_notes`

---

**Fin de la Documentación de Mantenimiento - Admin**
