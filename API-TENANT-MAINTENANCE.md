# API Documentation - Inquilinos - Módulo de Mantenimiento

Esta documentación está diseñada para el equipo de frontend que trabajará en el portal de inquilinos. Aquí los usuarios pueden reportar problemas de mantenimiento, hacer consultas generales y dar seguimiento a sus solicitudes.

**Base URL:** `http://localhost:3000`

**⚠️ IMPORTANTE - Formato de Rutas:**
Todas las rutas ahora incluyen el **slug del tenant** como primer parámetro:
- `/:slug/tenant/maintenance/*` - Rutas para inquilinos
- `/:slug/admin/maintenance/*` - Rutas para administradores

Ejemplo: `http://localhost:3000/mi-empresa/tenant/maintenance`

---

## Índice

1. [Crear Solicitud de Mantenimiento](#1-crear-solicitud-de-mantenimiento)
2. [Crear Consulta General](#2-crear-consulta-general)
3. [Mis Solicitudes - Listado](#3-mis-solicitudes---listado)
4. [Ver Detalle de Solicitud](#4-ver-detalle-de-solicitud)
5. [Sistema de Mensajería](#5-sistema-de-mensajería)
6. [Mis Estadísticas](#6-mis-estadísticas)
7. [Estados y Flujo](#7-estados-y-flujo)

---

## 1. Crear Solicitud de Mantenimiento

### 1.1 Crear Nueva Solicitud de Mantenimiento

Los inquilinos pueden reportar problemas de mantenimiento en su propiedad. Hay 8 categorías disponibles.

**Endpoint:** `POST /:slug/tenant/maintenance`

**URL Params:**
- `slug` - El slug del tenant (ejemplo: `mi-empresa`)
**Auth:** Requerida - `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "request_type": "MAINTENANCE",
  "category": "PLOMERIA",
  "title": "Fuga en el baño principal",
  "description": "Hay una fuga constante en el lavamanos del baño principal. El agua gotea incluso con el grifo cerrado.",
  "permission_to_enter": "YES",
  "has_pets": true,
  "entry_notes": "La llave está debajo de la maceta. Tengo un perro pequeño.",
  "files": [
    "/storage/maintenance/fuga_bano_1.jpg",
    "/storage/maintenance/dano_gabinete.jpg"
  ],
  "property_id": 10
}
```

---

### Descripción de Campos

**Campos requeridos:**
- `request_type` - Siempre `"MAINTENANCE"` para solicitudes de mantenimiento
- `category` - Una de las 8 categorías disponibles
- `title` - Título corto del problema (máx. 200 caracteres)
- `description` - Descripción detallada del problema

**Campos opcionales:**
- `permission_to_enter` - `"YES"`, `"NO"` o `"NOT_APPLICABLE"` (default: `"NOT_APPLICABLE"`)
- `has_pets` - `true` o `false` (solo relevante si permission_to_enter = "YES")
- `entry_notes` - Notas para el acceso (solo si permission_to_enter = "YES")
- `files` - Array de URLs de archivos adjuntos (máximo 3)

---

### Categorías Disponibles

| Categoría | Descripción | Ejemplos |
|-----------|-------------|----------|
| `GENERAL` | Problemas generales | Reparaciones varias |
| `ACCESORIOS` | Accesorios y fittings | Grifos, llaves, interruptores |
| `ELECTRICO` | Problemas eléctricos | Tomas, luces, cortocircuitos |
| `CLIMATIZACION` | Aire y calefacción | Aire acondicionado, calefacción |
| `LLAVE_CERRADURA` | Cerraduras y llaves | Puertas, ventanas, cerraduras |
| `ILUMINACION` | Iluminación | Lámparas, focos, LED |
| `AFUERA` | Áreas exteriores | Jardín, patio, entrada |
| `PLOMERIA` | Agua y desagües | Cañerías, grifos, desagües |

---

### Ejemplos de Solicitudes

#### Ejemplo 1: Problema de plomería
```json
{
  "request_type": "MAINTENANCE",
  "category": "PLOMERIA",
  "title": "Fuga en el lavamanos",
  "description": "El lavamanos del baño principal gotea constantemente incluso cuando está cerrado.",
  "permission_to_enter": "YES",
  "has_pets": false,
  "property_id": 10
}
```

#### Ejemplo 2: Problema eléctrico con autorización de entrada
```json
{
  "request_type": "MAINTENANCE",
  "category": "ELECTRICO",
  "title": "Toma de cocina no funciona",
  "description": "La toma eléctrica de la cocina dejó de funcionar. Probé varios aparatos y ninguno enciende.",
  "permission_to_enter": "YES",
  "has_pets": true,
  "entry_notes": "Tengo un gato. Por favor llamar antes de entrar al 555-1234. Pueden entrar entre 9AM y 6PM de lunes a viernes.",
  "files": ["/storage/maintenance/toma_cocina.jpg"],
  "property_id": 10
}
```

#### Ejemplo 3: Aire acondicionado sin autorización
```json
{
  "request_type": "MAINTENANCE",
  "category": "CLIMATIZACION",
  "title": "El aire acondicionado no enfría",
  "description": "El aire de la sala solo tira aire, no enfría. Hace un ruido extraño cuando lo enciendo.",
  "permission_to_enter": "NO",
  "files": [],
  "property_id": 10
}
```

#### Ejemplo 4: Problema simple (sin necesidad de entrar)
```json
{
  "request_type": "MAINTENANCE",
  "category": "LLAVE_CERRADURA",
  "title": "Cerradura de la puerta principal atascada",
  "description": "La cerradura de la puerta principal se atasca a veces. Hay que girar la llave varias veces para que abra.",
  "permission_to_enter": "NOT_APPLICABLE",
  "property_id": 10
}
```

---

### Response (201)

```json
{
  "id": 15,
  "ticket_number": "MNT-2024-7A3F9B2",
  "request_type": "MAINTENANCE",
  "category": "PLOMERIA",
  "title": "Fuga en el baño principal",
  "description": "Hay una fuga constante en el lavamanos...",
  "permission_to_enter": "YES",
  "has_pets": true,
  "entry_notes": "La llave está debajo de la maceta...",
  "status": "NEW",
  "priority": "NORMAL",
  "due_date": null,
  "tenant_id": 5,
  "property_id": 10,
  "assigned_to": 1,
  "created_at": "2024-02-03T14:30:00.000Z",
  "updated_at": "2024-02-03T14:30:00.000Z"
}
```

**Nota:**
- Se genera automáticamente un `ticket_number` único
- El estado inicial siempre es `"NEW"`
- La prioridad por defecto es `"NORMAL"`

---

## 2. Crear Consulta General

### 2.1 Crear Nueva Consulta General

Las consultas generales son para preguntas, dudas o solicitudes que no son problemas de mantenimiento técnico.

**Endpoint:** `POST /:slug/tenant/maintenance`
**Auth:** Requerida

**Request Body:**

```json
{
  "request_type": "GENERAL",
  "title": "Duda sobre renovación de contrato",
  "description": "Quisiera saber cuánto tiempo antes debo notificar si quiero renovar mi contrato. Actualmente estoy en el tercer mes de un contrato de 12 meses.",
  "files": [],
  "property_id": 10
}
```

---

### Descripción de Campos

**Campos requeridos:**
- `request_type` - Siempre `"GENERAL"` para consultas
- `title` - Título corto de la consulta
- `description` - Descripción detallada

**Campos opcionales:**
- `files` - Array de URLs de archivos adjuntos (máximo 3)

**NOTA IMPORTANTE:**
- Las consultas generales **NO tienen** categoría
- Las consultas generales **NO tienen** campos de autorización de entrada
- El `category` debe ser `null` o no enviarlo

---

### Ejemplos de Consultas Generales

#### Ejemplo 1: Consulta sobre contrato
```json
{
  "request_type": "GENERAL",
  "title": "Pregunta sobre cláusula del contrato",
  "description": "No entiendo la cláusula 3.2 sobre las penalidades por pago tardío. ¿Podrían explicármela?",
  "property_id": 10
}
```

#### Ejemplo 2: Solicitud de mejora
```json
{
  "request_type": "GENERAL",
  "title": "Sugerencia para mejorar el edificio",
  "description": "Sería útil tener iluminación automática en el pasillo. Muchos vecinos están de acuerdo.",
  "files": ["/storage/maintenance/plano_iluminacion.pdf"],
  "property_id": 10
}
```

#### Ejemplo 3: Consulta sobre servicios
```json
{
  "request_type": "GENERAL",
  "title": "Información sobre servicio de internet",
  "description": "¿Podrían indicarme cómo contacto al proveedor de internet para cambiar el plan?",
  "property_id": 10
}
```

---

## 3. Mis Solicitudes - Listado

### 3.1 Obtener Todas Mis Solicitudes

**Endpoint:** `GET /:slug/tenant/maintenance/my-requests`
**Auth:** Requerida

**Query Params (no disponibles - devuelve todas):**

**Response (200):**

```json
[
  {
    "id": 10,
    "ticket_number": "MNT-2024-1A2B3C4",
    "request_type": "MAINTENANCE",
    "category": "ELECTRICO",
    "title": "Toma de cocina no funciona",
    "description": "La toma eléctrica de la cocina dejó de funcionar...",
    "status": "IN_PROGRESS",
    "priority": "NORMAL",
    "created_at": "2024-02-01T10:00:00.000Z",
    "updated_at": "2024-02-03T11:30:00.000Z",
    "property": {
      "id": 10,
      "title": "Apartamento 5B"
    }
  },
  {
    "id": 11,
    "ticket_number": "MNT-2024-5D6E7F8",
    "request_type": "MAINTENANCE",
    "category": "PLOMERIA",
    "title": "Grifo del baño gotea",
    "description": "El grifo del baño principal tiene un goteo constante...",
    "status": "NEW",
    "priority": "LOW",
    "created_at": "2024-02-02T15:30:00.000Z",
    "updated_at": "2024-02-02T15:30:00.000Z",
    "property": {
      "id": 10,
      "title": "Apartamento 5B"
    }
  },
  {
    "id": 12,
    "ticket_number": "MNT-2024-9G0H1I2",
    "request_type": "GENERAL",
    "category": null,
    "title": "Duda sobre contrato",
    "description": "Tengo una pregunta sobre la cláusula de renovación...",
    "status": "COMPLETED",
    "priority": "NORMAL",
    "created_at": "2024-01-20T09:00:00.000Z",
    "updated_at": "2024-01-25T14:00:00.000Z",
    "property": {
      "id": 10,
      "title": "Apartamento 5B"
    }
  }
]
```

---

### Ejemplo de Componente - Lista de Mis Solicitudes

```javascript
import { useState, useEffect } from 'react';

const MyRequestsList = ({ tenantSlug }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`http://localhost:3000/${tenantSlug}/tenant/maintenance/my-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setRequests(data);
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'NEW': { label: 'Nueva', color: 'bg-blue-100 text-blue-800' },
      'IN_PROGRESS': { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-800' },
      'COMPLETED': { label: 'Completada', color: 'bg-green-100 text-green-800' },
      'DEFERRED': { label: 'Diferida', color: 'bg-orange-100 text-orange-800' },
      'CLOSED': { label: 'Cerrada', color: 'bg-gray-100 text-gray-800' }
    };
    return badges[status] || { label: status, color: 'bg-gray-100' };
  };

  const getCategoryLabel = (category) => {
    if (!category) return 'Consulta General';
    const labels = {
      'GENERAL': 'General',
      'ACCESORIOS': 'Accesorios',
      'ELECTRICO': 'Eléctrico',
      'CLIMATIZACION': 'Climatización',
      'LLAVE_CERRADURA': 'Cerraduras',
      'ILUMINACION': 'Iluminación',
      'AFUERA': 'Exterior',
      'PLOMERIA': 'Plomería'
    };
    return labels[category] || category;
  };

  if (loading) return <div>Cargando tus solicitudes...</div>;

  return (
    <div className="my-requests">
      <h2>Mis Solicitudes</h2>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No tienes solicitudes de mantenimiento.</p>
          <button onClick={() => navigate('/crear-solicitud')}>
            Crear Primera Solicitud
          </button>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <span className="ticket-number">{request.ticket_number}</span>
                <span className={`badge ${getStatusBadge(request.status).color}`}>
                  {getStatusBadge(request.status).label}
                </span>
              </div>

              <h3>{request.title}</h3>
              <p className="description">
                {request.description.substring(0, 150)}
                {request.description.length > 150 ? '...' : ''}
              </p>

              <div className="request-meta">
                <span className="category">
                  {getCategoryLabel(request.category)}
                </span>
                <span className="date">
                  Creado: {new Date(request.created_at).toLocaleDateString()}
                </span>
                {request.updated_at !== request.created_at && (
                  <span className="updated">
                    Actualizado: {new Date(request.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <button
                onClick={() => viewDetail(request.id)}
                className="btn-view-detail"
              >
                Ver Detalle
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 4. Ver Detalle de Solicitud

### 4.1 Obtener Detalle Completo

**Endpoint:** `GET /:slug/tenant/maintenance/:id`
**Auth:** Requerida

**URL Params:**
- `id` - El ID de la solicitud

**Response (200):**

```json
{
  "id": 10,
  "ticket_number": "MNT-2024-1A2B3C4",
  "request_type": "MAINTENANCE",
  "category": "ELECTRICO",
  "title": "Toma de cocina no funciona",
  "description": "La toma eléctrica de la cocina dejó de funcionar. Probé varios aparatos y ninguno enciende. Creo que puede ser el interruptor general.",
  "permission_to_enter": "YES",
  "has_pets": false,
  "entry_notes": "Pueden entrar entre 9AM y 6PM de lunes a viernes.",
  "status": "IN_PROGRESS",
  "priority": "NORMAL",
  "due_date": "2024-02-10",
  "created_at": "2024-02-01T10:00:00.000Z",
  "updated_at": "2024-02-03T11:30:00.000Z",
  "property": {
    "id": 10,
    "title": "Apartamento 5B"
  },
  "messages": [
    {
      "id": 25,
      "user_id": 5,
      "message": "Reporto el problema de la toma de cocina.",
      "send_to_resident": true,
      "created_at": "2024-02-01T10:00:00.000Z",
      "attachments": []
    },
    {
      "id": 26,
      "user_id": 1,
      "message": "Hola, recibimos tu reporte. ¿Podrías confirmarnos si otros enchufes de la cocina funcionan? Esto nos ayudaría a identificar si es el enchufe o el circuito.",
      "send_to_resident": true,
      "created_at": "2024-02-03T09:00:00.000Z",
      "attachments": []
    },
    {
      "id": 27,
      "user_id": 5,
      "message": "Los otros enchufes sí funcionan. Solo ese tomacorriente tiene problema.",
      "send_to_resident": true,
      "created_at": "2024-02-03T09:30:00.000Z",
      "attachments": []
    },
    {
      "id": 28,
      "user_id": 1,
      "message": "Perfecto, gracias por confirmar. Enviaremos a un eléctrico este lunes. El técnico llegará entre 9-11AM. ¿Podrás estar?",
      "send_to_resident": true,
      "created_at": "2024-02-03T11:30:00.000Z",
      "attachments": []
    }
  ],
  "attachments": [
    {
      "id": 45,
      "file_url": "/storage/maintenance/toma_cocina.jpg",
      "file_name": "toma_cocina.jpg",
      "file_type": "image",
      "created_at": "2024-02-01T10:00:00.000Z"
    }
  ]
}
```

---

### Componente de Ejemplo - Detalle de Solicitud

```javascript
const RequestDetail = ({ tenantSlug, requestId }) => {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  const fetchRequestDetail = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `http://localhost:3000/${tenantSlug}/tenant/maintenance/${requestId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setRequest(data);
    setLoading(false);
  };

  const getStatusInfo = (status) => {
    const info = {
      'NEW': { label: 'Nueva', description: 'Tu solicitud está siendo revisada' },
      'IN_PROGRESS': { label: 'En Progreso', description: 'Estamos trabajando en tu solicitud' },
      'COMPLETED': { label: 'Completada', description: 'El problema fue resuelto' },
      'DEFERRED': { label: 'Diferida', description: 'La solicitud fue pospuesta' },
      'CLOSED': { label: 'Cerrada', description: 'La solicitud fue cerrada' }
    };
    return info[status] || { label: status, description: '' };
  };

  const canSendMessage = (status) => {
    return !['COMPLETED', 'CLOSED'].includes(status);
  };

  if (loading) return <div>Cargando detalle...</div>;
  if (!request) return <div>Solicitud no encontrada</div>;

  const statusInfo = getStatusInfo(request.status);

  return (
    <div className="request-detail">
      {/* Header con estado */}
      <div className="detail-header">
        <div>
          <span className="ticket-number">{request.ticket_number}</span>
          <h1>{request.title}</h1>
        </div>
        <div className={`status-badge ${request.status.toLowerCase()}`}>
          {statusInfo.label}
        </div>
      </div>

      {/* Información de estado */}
      <div className="status-info">
        <p>{statusInfo.description}</p>
        {request.due_date && (
          <p className="due-date">
            Fecha prevista: {new Date(request.due_date).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Detalles de la solicitud */}
      <div className="request-info">
        <h2>Detalles de la Solicitud</h2>

        <div className="info-row">
          <span className="label">Tipo:</span>
          <span>{request.request_type === 'MAINTENANCE' ? 'Mantenimiento' : 'Consulta General'}</span>
        </div>

        {request.category && (
          <div className="info-row">
            <span className="label">Categoría:</span>
            <span>{request.category}</span>
          </div>
        )}

        <div className="info-row">
          <span className="label">Propiedad:</span>
          <span>{request.property?.title}</span>
        </div>

        <div className="info-row">
          <span className="label">Prioridad:</span>
          <span className={`priority-${request.priority.toLowerCase()}`}>
            {request.priority}
          </span>
        </div>

        <div className="description-box">
          <span className="label">Descripción:</span>
          <p>{request.description}</p>
        </div>

        {/* Información de acceso si aplica */}
        {request.request_type === 'MAINTENANCE' && (
          <>
            {request.permission_to_enter !== 'NOT_APPLICABLE' && (
              <div className="access-info">
                <h3>Información de Acceso</h3>
                <p>
                  <strong>Autoriza entrada:</strong>{' '}
                  {request.permission_to_enter === 'YES' ? 'Sí' : 'No'}
                </p>
                {request.has_pets && (
                  <p><strong>Tiene mascotas:</strong> Sí</p>
                )}
                {request.entry_notes && (
                  <div className="entry-notes">
                    <strong>Notas de entrada:</strong>
                    <p>{request.entry_notes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Archivos adjuntos */}
        {request.attachments && request.attachments.length > 0 && (
          <div className="attachments">
            <h3>Archivos Adjuntos</h3>
            <div className="files-grid">
              {request.attachments.map(file => (
                <div key={file.id} className="file-item">
                  <a
                    href={`http://localhost:3000${file.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={`http://localhost:3000${file.file_url}`}
                      alt={file.file_name}
                      className="thumbnail"
                    />
                    <span>{file.file_name}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Historial de mensajes */}
      <div className="messages-section">
        <h2>Historial de Comunicación</h2>

        <div className="messages-list">
          {request.messages.map(message => (
            <div
              key={message.id}
              className={`message ${message.user_id === 5 ? 'mine' : 'admin'}`}
            >
              <div className="message-header">
                <span className="sender">
                  {message.user_id === 5 ? 'Tú' : 'Administración'}
                </span>
                <span className="timestamp">
                  {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
              <p className="message-text">{message.message}</p>

              {message.attachments && message.attachments.length > 0 && (
                <div className="message-attachments">
                  {message.attachments.map(attachment => (
                    <a
                      key={attachment.id}
                      href={`http://localhost:3000${attachment.file_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="attachment-link"
                    >
                      📎 {attachment.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {canSendMessage(request.status) && (
          <MessageForm requestId={request.id} />
        )}
      </div>
    </div>
  );
};
```

---

## 5. Sistema de Mensajería

### 5.1 Obtener Mensajes de una Solicitud

**Endpoint:** `GET /:slug/tenant/maintenance/:id/messages`
**Auth:** Requerida

**URL Params:**
- `id` - El ID de la solicitud

**Response (200):**

```json
[
  {
    "id": 25,
    "maintenance_request_id": 10,
    "user_id": 5,
    "message": "Reporto el problema de la toma de cocina.",
    "send_to_resident": true,
    "created_at": "2024-02-01T10:00:00.000Z",
    "attachments": []
  },
  {
    "id": 26,
    "maintenance_request_id": 10,
    "user_id": 1,
    "message": "Hola, recibimos tu reporte. ¿Podrías confirmarnos si otros enchufes funcionan?",
    "send_to_resident": true,
    "created_at": "2024-02-03T09:00:00.000Z",
    "attachments": []
  }
]
```

**Nota:**
- Solo ves mensajes donde `send_to_resident = true`
- Las notas internas del admin no se muestran

---

### 5.2 Enviar Mensaje

**Endpoint:** `POST /:slug/tenant/maintenance/:id/messages`
**Auth:** Requerida

**URL Params:**
- `id` - El ID de la solicitud

**Request Body:**

```json
{
  "message": "Los otros enchufes sí funcionan. Solo ese tomacorriente tiene problema.",
  "files": []
}
```

**Descripción de campos:**
- `message` - Texto del mensaje (requerido)
- `files` - Array de URLs de archivos adjuntos (opcional, máximo 3)

**Importante:**
- Solo puedes enviar mensajes si la solicitud NO está en estado `COMPLETED` o `CLOSED`
- Todos tus mensajes son visibles para el admin
- No puedes enviar mensajes privados/solo para admin

---

### Ejemplos de Mensajes

#### Ejemplo 1: Respuesta a pregunta del admin
```json
{
  "message": "Sí, los otros enchufes de la cocina funcionan bien. El problema es solo con ese tomacorriente."
}
```

#### Ejemplo 2: Agregar más información
```json
{
  "message": "Quería agregar que a veces cuando lo uso salta chispa. Por eso ya no lo uso.",
  "files": ["/storage/maintenance/chispa_toma.jpg"]
}
```

#### Ejemplo 3: Confirmación de visita
```json
{
  "message": "Sí, puedo estar el lunes entre 9 y 11 AM. Perfecto."
}
```

---

### Response (201)

```json
{
  "id": 27,
  "maintenance_request_id": 10,
  "user_id": 5,
  "message": "Los otros enchufes sí funcionan...",
  "send_to_resident": true,
  "created_at": "2024-02-03T09:30:00.000Z",
  "attachments": []
}
```

---

### Componente de Ejemplo - Formulario de Mensajes

```javascript
const MessageForm = ({ tenantSlug, requestId }) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `http://localhost:3000/${tenantSlug}/tenant/maintenance/${requestId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          files
        })
      }
    );

    if (response.ok) {
      setMessage('');
      setFiles([]);
      // Recargar mensajes o actualizar estado
      window.location.reload();
    }
    setSending(false);
  };

  return (
    <form className="message-form" onSubmit={handleSubmit}>
      <h3>Enviar Mensaje</h3>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe tu mensaje aquí..."
        required
        rows={4}
      />

      {/* File upload simplificado */}
      <div className="file-upload">
        <label>Adjuntar archivos (máximo 3):</label>
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files);
            if (selectedFiles.length <= 3) {
              setFiles(selectedFiles);
            }
          }}
        />
        <span className="file-count">{files.length}/3</span>
      </div>

      <button
        type="submit"
        disabled={sending || !message}
        className="btn-send"
      >
        {sending ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
    </form>
  );
};
```

---

## 6. Mis Estadísticas

### 6.1 Obtener Mis Estadísticas

**Endpoint:** `GET /:slug/tenant/maintenance/stats`
**Auth:** Requerida

**Response (200):**

```json
{
  "total": 8,
  "active": 2,
  "completed": 5
}
```

**Descripción de métricas:**
- `total` - Total de solicitudes que has creado
- `active` - Solicitudes actualmente en progreso
- `completed` - Solicitudes completadas

---

### Ejemplo de Dashboard de Inquilino

```javascript
const TenantDashboard = ({ tenantSlug }) => {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    fetchStatsAndRequests();
  }, []);

  const fetchStatsAndRequests = async () => {
    const token = localStorage.getItem('access_token');

    // Fetch stats
    const statsResponse = await fetch(`http://localhost:3000/${tenantSlug}/tenant/maintenance/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const statsData = await statsResponse.json();
    setStats(statsData);

    // Fetch recent requests
    const requestsResponse = await fetch(`http://localhost:3000/${tenantSlug}/tenant/maintenance/my-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const requestsData = await requestsResponse.json();
    setRecentRequests(requestsData.slice(0, 5)); // Solo las 5 más recientes
  };

  return (
    <div className="tenant-dashboard">
      <h1>Mi Panel de Mantenimiento</h1>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card total">
          <h3>Total Solicitudes</h3>
          <p className="stat-number">{stats?.total || 0}</p>
        </div>

        <div className="stat-card active">
          <h3>En Proceso</h3>
          <p className="stat-number">{stats?.active || 0}</p>
        </div>

        <div className="stat-card completed">
          <h3>Completadas</h3>
          <p className="stat-number">{stats?.completed || 0}</p>
        </div>
      </div>

      {/* Solicitudes recientes */}
      <div className="recent-requests">
        <h2>Mis Solicitudes Recientes</h2>

        {recentRequests.length === 0 ? (
          <p>No tienes solicitudes recientes.</p>
        ) : (
          <ul>
            {recentRequests.map(request => (
              <li key={request.id}>
                <span className={`status ${request.status.toLowerCase()}`}>
                  {request.status}
                </span>
                <span className="title">{request.title}</span>
                <span className="date">
                  {new Date(request.updated_at).toLocaleDateString()}
                </span>
                <button onClick={() => viewDetail(request.id)}>
                  Ver
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => navigate('/crear-solicitud')}
          className="btn-new-request"
        >
          + Nueva Solicitud
        </button>
      </div>
    </div>
  );
};
```

---

## 7. Estados y Flujo

### 7.1 Flujo de una Solicitud

```
1. NEW (Nueva)
   ↓ (inquilino crea solicitud)
2. IN_PROGRESS (En Progreso)
   ↓ (admin está trabajando)
3. COMPLETED (Completada) o CLOSED (Cerrada)
   ↓ (solicitud finalizada)
```

### Estados y Lo Que Significan Para Ti

| Estado | Significado | ¿Puedes enviar mensajes? |
|--------|-------------|------------------------|
| `NEW` | Tu solicitud es nueva y el admin aún no la ha visto | ✅ Sí |
| `IN_PROGRESS` | El admin está trabajando en tu solicitud | ✅ Sí |
| `COMPLETED` | El problema fue resuelto exitosamente | ❌ No (solo lectura) |
| `DEFERRED` | La solicitud fue pospuesta temporalmente | ✅ Sí |
| `CLOSED` | La solicitud fue cerrada | ❌ No (solo lectura) |

---

## Formulario de Ejemplo - Crear Solicitud

```javascript
import { useState } from 'react';

const CreateMaintenanceRequest = ({ tenantSlug }) => {
  const [requestType, setRequestType] = useState('MAINTENANCE');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [permissionToEnter, setPermissionToEnter] = useState('NOT_APPLICABLE');
  const [hasPets, setHasPets] = useState(false);
  const [entryNotes, setEntryNotes] = useState('');
  const [files, setFiles] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token');

    const requestBody = {
      request_type: requestType,
      title,
      description
    };

    // Agregar campos específicos de mantenimiento
    if (requestType === 'MAINTENANCE') {
      requestBody.category = category;
      requestBody.permission_to_enter = permissionToEnter;

      if (permissionToEnter === 'YES') {
        requestBody.has_pets = hasPets;
        if (hasPets && entryNotes) {
          requestBody.entry_notes = entryNotes;
        }
      }

      if (files.length > 0) {
        requestBody.files = files;
      }
    }

    const response = await fetch(`http://localhost:3000/${tenantSlug}/tenant/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const data = await response.json();
      alert(`Solicitud creada exitosamente\nNúmero de ticket: ${data.ticket_number}`);
      // Redirigir a mis solicitudes
      window.location.href = '/mis-solicitudes';
    }
  };

  const maintenanceCategories = [
    'GENERAL', 'ACCESORIOS', 'ELECTRICO', 'CLIMATIZACION',
    'LLAVE_CERRADURA', 'ILUMINACION', 'AFUERA', 'PLOMERIA'
  ];

  return (
    <div className="create-request">
      <h1>Crear Nueva Solicitud</h1>

      <form onSubmit={handleSubmit}>
        {/* Tipo de solicitud */}
        <div className="form-group">
          <label>Tipo de Solicitud:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="MAINTENANCE"
                checked={requestType === 'MAINTENANCE'}
                onChange={(e) => setRequestType(e.target.value)}
              />
              Solicitud de Mantenimiento
            </label>
            <label>
              <input
                type="radio"
                value="GENERAL"
                checked={requestType === 'GENERAL'}
                onChange={(e) => setRequestType(e.target.value)}
              />
              Consulta General
            </label>
          </div>
        </div>

        {/* Categoría (solo para mantenimiento) */}
        {requestType === 'MAINTENANCE' && (
          <div className="form-group">
            <label htmlFor="category">Categoría:</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Selecciona una categoría</option>
              {maintenanceCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {/* Título */}
        <div className="form-group">
          <label htmlFor="title">Título:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Fuga en el baño principal"
            required
            maxLength={200}
          />
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label htmlFor="description">Descripción detallada:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el problema con el mayor detalle posible..."
            required
            rows={5}
          />
        </div>

        {/* Campos específicos de mantenimiento */}
        {requestType === 'MAINTENANCE' && (
          <>
            <div className="form-group">
              <label htmlFor="permission">¿Autorizas entrada sin aviso previo?</label>
              <select
                id="permission"
                value={permissionToEnter}
                onChange={(e) => setPermissionToEnter(e.target.value)}
              >
                <option value="NOT_APPLICABLE">No Aplica</option>
                <option value="YES">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>

            {permissionToEnter === 'YES' && (
              <>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={hasPets}
                      onChange={(e) => setHasPets(e.target.checked)}
                    />
                    ¿Tienes mascotas?
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="entryNotes">Notas de entrada (opcional):</label>
                  <textarea
                    id="entryNotes"
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    placeholder="Ej: La llave está debajo de la maceta. Tengo un perro pequeño."
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Adjuntar archivos */}
            <div className="form-group">
              <label htmlFor="files">Adjuntar fotos o documentos (máximo 3):</label>
              <input
                id="files"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => {
                  const selectedFiles = Array.from(e.target.files);
                  if (selectedFiles.length <= 3) {
                    setFiles(selectedFiles);
                  }
                }}
              />
              <small>{files.length}/3 archivos seleccionados</small>
            </div>
          </>
        )}

        <button type="submit" className="btn-submit">
          Enviar Solicitud
        </button>
      </form>
    </div>
  );
};
```

---

## Notas Importantes para el Frontend

### 1. Autenticación
- Todas las endpoints requieren token válido
- Incluye siempre el header `Authorization: Bearer <token>`

### 2. Estados Finales
- Cuando la solicitud está en `COMPLETED` o `CLOSED`, no puedes enviar más mensajes
- Estos estados son de solo lectura para el inquilino

### 3. Permisos de Entrada
- Solo aplica a solicitudes de mantenimiento (`MAINTENANCE`)
- `NOT_APPLICABLE` = No es necesario entrar (ej: cerradura)
- Si autorizas (`YES`), puedes especificar si tienes mascotas y notas de acceso

### 4. Archivos Adjuntos
- Máximo 3 archivos por solicitud/mensaje
- Formatos permitidos: imágenes (JPG, PNG), PDF
- Las URLs son relativas: `/storage/maintenance/...`

### 5. Número de Ticket
- Se genera automáticamente cuando creas la solicitud
- Guárdalo para referencia futura
- Formato: `MNT-2024-7A3F9B2`

### 6. Consultas Generales vs Mantenimiento
- `MAINTENANCE`: Problemas técnicos que necesitan reparación
- `GENERAL`: Preguntas, dudas, consultas que no son mantenimiento
- Las consultas generales no tienen categoría ni campos de autorización

---

**Fin de la Documentación de Mantenimiento - Inquilinos**
