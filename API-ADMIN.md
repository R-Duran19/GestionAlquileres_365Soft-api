# API Documentation - Admin Panel

Esta documentación está diseñada específicamente para el equipo de frontend que trabajará en el panel de administración. Todas las endpoints requieren autenticación mediante JWT token (excepto donde se indique).

**Base URL:** `http://localhost:3000`

---

## Índice

1. [Autenticación y Registro Inicial](#1-autenticación-y-registro-inicial)
2. [Gestión de Tenants](#2-gestión-de-tenants)
3. [Gestión de Propiedades - CRU Básico](#3-gestión-de-propiedades---crud-básico)
4. [Gestión de Propiedades - Detalles Avanzados](#4-gestión-de-propiedades---detalles-avanzados)
5. [Gestión de Imágenes](#5-gestión-de-imágenes)
6. [Dueños de Propiedades (Rental Owners)](#6-dueños-de-propiedades-rental-owners)
7. [Catálogos y Referencias](#7-catálogos-y-referencias)
8. [Usuarios](#8-usuarios)

---

## 🆕 Actualización Fase 1 - Febrero 2026

**Nuevos campos en Propiedades:**
- ✅ **Pricing:** `monthly_rent`, `currency` (crítico para cotizaciones)
- ✅ **Características:** `square_meters`, `bedrooms`, `bathrooms`, `parking_spaces`, `year_built`, `is_furnished`
- ✅ **Reglas:** `property_rules` (JSON flexible: pets_allowed, smoking_allowed, etc.)
- ✅ **Auto-owner:** Si no se especifican propietarios, el admin se asigna automáticamente

**Endpoints optimizados:**
- `GET /:slug/admin/properties` devuelve `first_image` + nuevos campos
- `GET /:slug/admin/properties/:id` devuelve todas las imágenes + campos completos
- `POST /:slug/admin/properties/with-images` crea propiedad + imágenes en un solo request

📖 Ver: `PROPERTY-IMAGES-API.md` y `FASE-1-IMPLEMENTACION.md` para detalles completos.

---

## 1. Autenticación y Registro Inicial

### 1.1 Registrar Admin (Crear nueva organización/tenant)

Esta es la PRIMERA operación que se debe realizar para crear una nueva organización. Crea el tenant y el usuario administrador simultáneamente.

**Endpoint:** `POST /auth/register-admin`
**Auth:** No requerida (pública)

**Request Body:**
```json
{
  "company_name": "Mi Inmobiliaria S.A.",
  "slug": "mi-inmobiliaria",  // Opcional - si no se envía, se genera automáticamente
  "currency": "BO",          // Opcional - default: "BO"
  "locale": "es",             // Opcional - default: "es"
  "name": "Juan Pérez",
  "email": "juan@mi-inmobiliaria.com",
  "password": "password123",  // Mínimo 6 caracteres
  "phone": "+5491112345678"   // Opcional
}
```

**Response (201):**
```json
{
  "message": "Administrador y tenant registrados exitosamente",
  "tenant": {
    "id": 1,
    "company_name": "Mi Inmobiliaria S.A.",
    "slug": "mi-inmobiliaria",
    "currency": "BO",
    "locale": "es",
    "is_active": true,
    "created_at": "2026-01-30T15:20:30.000Z"
  },
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@mi-inmobiliaria.com",
    "role": "ADMIN",
    "tenant_id": 1,
    "phone": "+5491112345678",
    "created_at": "2026-01-30T15:20:30.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Importante:** Guarda el `access_token` - deberás usarlo en las siguientes requests como header `Authorization: Bearer <token>`

---

### 1.2 Login de Admin

**Endpoint:** `POST /auth/:slug/login`
**Auth:** No requerida (pública)

**URL Params:**
- `slug` - El slug del tenant (ej: "mi-inmobiliaria")

**Request Body:**
```json
{
  "email": "juan@mi-inmobiliaria.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@mi-inmobiliaria.com",
    "role": "ADMIN",
    "tenant_id": 1
  }
}
```

---

### 1.3 Obtener Perfil del Usuario Autenticado

**Endpoint:** `GET /auth/me`
**Auth:** Requerida - `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@mi-inmobiliaria.com",
  "role": "ADMIN",
  "tenant_id": 1,
  "phone": "+5491112345678",
  "created_at": "2026-01-30T15:20:30.000Z"
}
```

---

## 2. Gestión de Tenants

### 2.1 Listar Todos los Tenants

**Endpoint:** `GET /tenants`
**Auth:** Requerida

**Response (200):**
```json
[
  {
    "id": 1,
    "company_name": "Mi Inmobiliaria S.A.",
    "slug": "mi-inmobiliaria",
    "currency": "USD",
    "locale": "es",
    "is_active": true,
    "logo_url": null,
    "created_at": "2026-01-30T15:20:30.000Z",
    "updated_at": "2026-01-30T15:20:30.000Z"
  }
]
```

---

### 2.2 Obtener Tenant por ID

**Endpoint:** `GET /tenants/:id`
**Auth:** Requerida

**Response (200):**
```json
{
  "id": 1,
  "company_name": "Mi Inmobiliaria S.A.",
  "slug": "mi-inmobiliaria",
  "currency": "USD",
  "locale": "es",
  "is_active": true,
  "logo_url": null,
  "created_at": "2026-01-30T15:20:30.000Z"
}
```

---

### 2.3 Obtener Tenant por Slug

**Endpoint:** `GET /tenants/slug/:slug`
**Auth:** Requerida

**Response (200):**
```json
{
  "id": 1,
  "company_name": "Mi Inmobiliaria S.A.",
  "slug": "mi-inmobiliaria",
  "currency": "USD",
  "locale": "es",
  "is_active": true
}
```

---

### 2.4 Actualizar Tenant

**Endpoint:** `PATCH /tenants/:id`
**Auth:** Requerida

**Request Body:**
```json
{
  "company_name": "Mi Inmobiliaria Actualizada S.A.",
  "currency": "EUR",
  "locale": "es",
  "is_active": true,
  "logo_url": "https://example.com/logo.png"
}
```

**Response (200):**
```json
{
  "id": 1,
  "company_name": "Mi Inmobiliaria Actualizada S.A.",
  "slug": "mi-inmobiliaria",
  "currency": "EUR",
  "locale": "es",
  "is_active": true,
  "logo_url": "https://example.com/logo.png"
}
```

---

### 2.5 Eliminar Tenant

**Endpoint:** `DELETE /tenants/:id`
**Auth:** Requerida

**Response (204):** No content

---

## 3. Gestión de Propiedades - CRUD Básico

⚠️ **IMPORTANTE - Flujo de Creación de Propiedades:**

1. **Paso 1 (Crear):** Crear la propiedad con información básica (título, tipo, subtype, direcciones, dueños)
2. **Paso 2 (Editar):** Actualizar detalles adicionales (descripción, amenities, imágenes, etc.)
3. **Paso 3 (Imágenes):** Subir imágenes de forma individual

---

### 3.1 Obtener Tipos de Propiedad (Catálogo)

Antes de crear una propiedad, necesitas obtener los tipos disponibles.

**Endpoint:** `GET /admin/property-types`
**Auth:** Requerida

**Response (200):**
```json
  [
    {
        "id": 2,
        "name": "Comercial",
        "code": "COMMERCIAL",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.005Z",
        "updated_at": "2026-01-30T17:50:30.005Z"
    },
    {
        "id": 1,
        "name": "Residencial",
        "code": "RESIDENTIAL",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.005Z",
        "updated_at": "2026-01-30T17:50:30.005Z"
    }
]
```

---

### 3.2 Obtener Subtipos de Propiedad (Catálogo)

Los subtipos dependen del tipo seleccionado. Puedes filtrar por `typeId`.

**Endpoint:** `GET /admin/property-subtypes?typeId=1`
**Auth:** Requerida

**Query Params:**
- `typeId` (opcional) - Filtra subtipos por tipo de propiedad

**Response (200):**
```json
[
    {
        "id": 6,
        "property_type_id": 2,
        "name": "Alquiler",
        "code": "RENTAL",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.048Z",
        "updated_at": "2026-01-30T17:50:30.048Z",
        "property_type_name": "Comercial",
        "property_type_code": "COMMERCIAL"
    },
    {
        "id": 8,
        "property_type_id": 2,
        "name": "Bodega/Depósito",
        "code": "STORAGE",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.048Z",
        "updated_at": "2026-01-30T17:50:30.048Z",
        "property_type_name": "Comercial",
        "property_type_code": "COMMERCIAL"
    },
    {
        "id": 7,
        "property_type_id": 2,
        "name": "Centro Comercial",
        "code": "SHOPPING_CENTER",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.048Z",
        "updated_at": "2026-01-30T17:50:30.048Z",
        "property_type_name": "Comercial",
        "property_type_code": "COMMERCIAL"
    },
    {
        "id": 1,
        "property_type_id": 1,
        "name": "Condominio/Townhouse",
        "code": "CONDO_TOWNHOME",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.021Z",
        "updated_at": "2026-01-30T17:50:30.021Z",
        "property_type_name": "Residencial",
        "property_type_code": "RESIDENTIAL"
    },
    {
        "id": 9,
        "property_type_id": 2,
        "name": "Estacionamiento",
        "code": "PARKING_SPACE",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.048Z",
        "updated_at": "2026-01-30T17:50:30.048Z",
        "property_type_name": "Comercial",
        "property_type_code": "COMMERCIAL"
    },
    {
        "id": 4,
        "property_type_id": 2,
        "name": "Industrial",
        "code": "INDUSTRIAL",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.048Z",
        "updated_at": "2026-01-30T17:50:30.048Z",
        "property_type_name": "Comercial",
        "property_type_code": "COMMERCIAL"
    },
    {
        "id": 2,
        "property_type_id": 1,
        "name": "Multifamiliar",
        "code": "MULTI_FAMILY",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.021Z",
        "updated_at": "2026-01-30T17:50:30.021Z",
        "property_type_name": "Residencial",
        "property_type_code": "RESIDENTIAL"
    },
    {
        "id": 5,
        "property_type_id": 2,
        "name": "Oficina",
        "code": "OFFICE",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.048Z",
        "updated_at": "2026-01-30T17:50:30.048Z",
        "property_type_name": "Comercial",
        "property_type_code": "COMMERCIAL"
    },
    {
        "id": 3,
        "property_type_id": 1,
        "name": "Unifamiliar",
        "code": "SINGLE_FAMILY",
        "is_active": true,
        "created_at": "2026-01-30T17:50:30.021Z",
        "updated_at": "2026-01-30T17:50:30.021Z",
        "property_type_name": "Residencial",
        "property_type_code": "RESIDENTIAL"
    }
]
```

**Si no envías typeId, devuelve todos los subtipos de todos los tipos.**

---

### 3.3 Crear Propiedad (Paso 1 - Básico)

Esta es la creación INICIAL de la propiedad con los campos mínimos requeridos.

**Endpoint:** `POST /admin/properties`
**Auth:** Requerida

**⚠️ IMPORTANTE - Auto-asignación de Propietario:**
Si NO proporcionas ni `existing_owners` ni `new_owners`, el sistema automáticamente asignará al usuario administrador como propietario principal de la propiedad (100% ownership). Esto previene propiedades huérfanas.

**Campos Opcionales de Fase 1 (Información de Alquiler):**
- `monthly_rent` (number): Alquiler mensual - **Importante para cotizaciones**
- `currency` (string): Código de moneda ISO 4217 (ej: "BOB", "USD", "EUR") - Default: "BOB"
- `square_meters` (number): Superficie en metros cuadrados
- `bedrooms` (number): Número de dormitorios
- `bathrooms` (number): Número de baños (permite decimales, ej: 2.5)
- `parking_spaces` (number): Espacios de estacionamiento
- `year_built` (number): Año de construcción (mínimo: 1800)
- `is_furnished` (boolean): Si está amoblada/amueblada
- `property_rules` (object): Reglas en formato JSON (ej: pets_allowed, smoking_allowed, max_occupants)
- `latitude` (number): Latitud GPS (rango: **-90 a 90**)
- `longitude` (number): Longitud GPS (rango: **-180 a 180**)

**⚠️ Validaciones Importantes:**
- `latitude`: Debe estar entre **-90 y 90** (coordenadas geográficas válidas). Bolivia: ≈ -10 a -23
- `longitude`: Debe estar entre **-180 y 180** (coordenadas geográficas válidas). Bolivia: ≈ -57 a -69
- `year_built`: Debe ser ≥ 1800
- `monthly_rent`, `square_meters`, `bedrooms`, `bathrooms`, `parking_spaces`: Deben ser positivos

**Request Body (MÍNIMO REQUERIDO):**
```json
{
  "title": "Apartamento Moderno en Centro",
  "property_type_id": 1,          // ID del tipo (ej: 1 = Apartamento)
  "property_subtype_id": 2,       // ID del subtipo (ej: 2 = 1 Dormitorio)
  "addresses": [
    {
      "address_type": "address_1",  // Opciones: "address_1", "address_2", "address_3"
      "street_address": "Av. Libertador 1234, Piso 5, Depto A",
      "city": "Buenos Aires",
      "state": "Capital Federal",
      "zip_code": "1001",
      "country": "Argentina"
    }
  ]
}
```

**Request Body (CON DUEÑO EXISTENTE):**
```json
{
  "title": "Apartamento Moderno en Centro",
  "property_type_id": 1,
  "property_subtype_id": 2,
  "addresses": [
    {
      "address_type": "address_1",
      "street_address": "Av. Libertador 1234, Piso 5, Depto A",
      "city": "Buenos Aires",
      "state": "Capital Federal",
      "zip_code": "1001",
      "country": "Argentina"
    }
  ],
  "existing_owners": [
    {
      "rental_owner_id": 5,           // ID del dueño existente
      "ownership_percentage": 100,    // Porcentaje de propiedad (0-100)
      "is_primary": true              // Marcar como dueño principal
    }
  ]
}
```

**Request Body (CREANDO NUEVO DUEÑO):**
```json
{
  "title": "Apartamento Moderno en Centro",
  "property_type_id": 1,
  "property_subtype_id": 2,
  "addresses": [
    {
      "address_type": "address_1",
      "street_address": "Av. Libertador 1234, Piso 5, Depto A",
      "city": "Buenos Aires",
      "state": "Capital Federal",
      "zip_code": "1001",
      "country": "Argentina"
    }
  ],
  "new_owners": [
    {
      "name": "Carlos González",
      "company_name": "",                    // Opcional - si es empresa
      "is_company": false,                   // true si es empresa
      "primary_email": "carlos@email.com",
      "phone_number": "+5491198765432",
      "secondary_email": "carlos2@email.com", // Opcional
      "secondary_phone": "+5491198765433",    // Opcional
      "notes": "Dueño principal, contacto preferente" // Opcional
    }
  ]
}
```

**Request Body (COMPLETO - TODO INCLUIDO CON FASE 1):**
```json
{
  "title": "Apartamento Moderno en Centro",
  "property_type_id": 1,
  "property_subtype_id": 2,
  "description": "Hermoso apartamento con vista panorámica",
  "monthly_rent": 2500,
  "currency": "BOB",
  "square_meters": 85.5,
  "bedrooms": 3,
  "bathrooms": 2,
  "parking_spaces": 1,
  "year_built": 2020,
  "is_furnished": true,
  "property_rules": {
    "pets_allowed": true,
    "pet_types": ["dogs", "cats"],
    "smoking_allowed": false,
    "max_occupants": 4,
    "min_lease_months": 6
  },
  "addresses": [
    {
      "address_type": "address_1",
      "street_address": "Av. Libertador 1234, Piso 5, Depto A",
      "city": "La Paz",
      "state": "La Paz",
      "zip_code": "1001",
      "country": "Bolivia"
    }
  ],
  "existing_owners": [
    {
      "rental_owner_id": 5,
      "ownership_percentage": 50,
      "is_primary": true
    }
  ],
  "new_owners": [
    {
      "name": "María López",
      "primary_email": "maria@email.com",
      "phone_number": "+5491198765444"
    }
  ],
  "description": "Hermoso apartamento totalmente amoblado con vista al río",
  "security_deposit_amount": 5000,
  "account_number": "123-456-789",
  "account_type": "Ahorros",
  "account_holder_name": "Carlos González"
}
```

**Response (201):**
```json
{
  "id": 1,
  "title": "Apartamento Moderno en Centro",
  "property_type_id": 1,
  "property_subtype_id": 2,
  "status": "DISPONIBLE",
  "description": "Hermoso apartamento con vista panorámica",
  "monthly_rent": 2500,
  "currency": "BOB",
  "square_meters": 85.5,
  "bedrooms": 3,
  "bathrooms": 2,
  "parking_spaces": 1,
  "year_built": 2020,
  "is_furnished": true,
  "property_rules": {
    "pets_allowed": true,
    "smoking_allowed": false,
    "max_occupants": 4
  },
  "security_deposit_amount": 5000,
  "account_number": "123-456-789",
  "account_type": "Ahorros",
  "account_holder_name": "Carlos González",
  "latitude": -16.5000,
  "longitude": -68.1500,
  "images": [],
  "amenities": [],
  "included_items": [],
  "created_at": "2026-01-30T15:20:30.000Z",
  "updated_at": "2026-01-30T15:20:30.000Z",
  "addresses": [
    {
      "id": 1,
      "property_id": 1,
      "address_type": "address_1",
      "street_address": "Av. Libertador 1234, Piso 5, Depto A",
      "city": "La Paz",
      "state": "La Paz",
      "zip_code": "1001",
      "country": "Bolivia",
      "created_at": "2026-01-30T15:20:30.000Z"
    }
  ],
  "owners": [
    {
      "id": 1,
      "rental_owner_id": 5,
      "property_id": 1,
      "ownership_percentage": 100,
      "is_primary": true,
      "rental_owner": {
        "id": 5,
        "name": "Carlos González",
        "primary_email": "carlos@email.com"
      }
    }
  ],
  "property_type": {
    "id": 1,
    "name": "Residencial",
    "code": "RESIDENTIAL"
  },
  "property_subtype": {
    "id": 2,
    "name": "Unifamiliar",
    "code": "SINGLE_FAMILY"
  }
}
```

**Nota:** El endpoint devuelve TODAS las imágenes en el array `images` para mostrar en una galería completa.

---

### 3.4 Listar Propiedades

**Endpoint:** `GET /:slug/admin/properties`
**Auth:** Requerida

**Query Params (Todos opcionales - para filtrado):**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `status` | string | Filtrar por estado | `DISPONIBLE`, `OCUPADA`, `MANTENIMIENTO` |
| `property_type_id` | number | Filtrar por tipo de propiedad | `1` |
| `property_subtype_id` | number | Filtrar por subtipo | `2` |
| `city` | string | Filtrar por ciudad (búsqueda parcial) | `La Paz` |
| `country` | string | Filtrar por país | `Bolivia` |
| `search` | string | Búsqueda por título o descripción | `apartamento` |
| `sort_by` | string | Ordenar por campo | `created_at`, `title`, `monthly_rent` |
| `sort_order` | string | Orden ascendente/descendente | `ASC`, `DESC` (default) |
| `page` | number | Número de página | `1` (default) |
| `limit` | number | Resultados por página | `10` (default, max: 100) |

**Ejemplo completo:**
```
GET /:slug/admin/properties?status=DISPONIBLE&property_type_id=1&city=La Paz&page=1&limit=20&sort_by=monthly_rent&sort_order=ASC
```

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Apartamento Moderno en Centro",
      "description": "Hermoso departamento en zona céntrica",
      "property_type_id": 1,
      "property_subtype_id": 2,
      "status": "DISPONIBLE",
      "first_image": "storage/properties/mi-inmobiliaria/1/photo1.jpg",
      "monthly_rent": 2500,
      "currency": "BOB",
      "square_meters": 85.5,
      "bedrooms": 3,
      "bathrooms": 2,
      "parking_spaces": 1,
      "year_built": 2020,
      "is_furnished": true,
      "latitude": -16.5000,
      "longitude": -68.1500,
      "created_at": "2026-01-30T15:20:30.000Z",
      "property_type_name": "Residencial",
      "property_type_code": "RESIDENTIAL",
      "property_subtype_name": "1 Dormitorio",
      "property_subtype_code": "SINGLE_FAMILY"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10,
  "pages": 5
}
```

**Nota:** El campo `first_image` contiene solo la primera imagen para optimizar el listado. Para ver todas las imágenes, usa el endpoint de detalle individual.

---

### 3.5 Obtener una Propiedad por ID

**Endpoint:** `GET /admin/properties/:id`
**Auth:** Requerida

**Response (200):**
```json
{
  "id": 1,
  "title": "Apartamento Moderno en Centro",
  "property_type_id": 1,
  "property_subtype_id": 2,
  "status": "DISPONIBLE",
  "description": "Hermoso apartamento totalmente amoblado con vista al río",
  "monthly_rent": 2500,
  "currency": "BOB",
  "square_meters": 85.5,
  "bedrooms": 3,
  "bathrooms": 2,
  "parking_spaces": 1,
  "year_built": 2020,
  "is_furnished": true,
  "property_rules": {
    "pets_allowed": true,
    "smoking_allowed": false,
    "max_occupants": 4
  },
  "security_deposit_amount": 5000,
  "account_number": "123-456-789",
  "account_type": "Ahorros",
  "account_holder_name": "Carlos González",
  "latitude": -34.6037,
  "longitude": -58.3816,
  "images": [
    "storage/properties/mi-inmobiliaria/1/photo1.jpg",
    "storage/properties/mi-inmobiliaria/1/photo2.jpg",
    "storage/properties/mi-inmobiliaria/1/photo3.jpg"
  ],
  "amenities": ["WiFi", "TV Cable", "Aire Acondicionado", "Gimnasio"],
  "included_items": ["Toallas", "Ropa de Cama", "Vajilla"],
  "created_at": "2026-01-30T15:20:30.000Z",
  "updated_at": "2026-01-30T15:25:30.000Z",
  "addresses": [
    {
      "id": 1,
      "address_type": "address_1",
      "street_address": "Av. Libertador 1234, Piso 5, Depto A",
      "city": "Buenos Aires",
      "state": "Capital Federal",
      "zip_code": "1001",
      "country": "Argentina"
    }
  ],
  "owners": [
    {
      "id": 5,
      "name": "Carlos González",
      "primary_email": "carlos@email.com",
      "phone_number": "+5491198765432",
      "ownership_percentage": 100,
      "is_primary": true
    }
  ],
  "property_type": {
    "id": 1,
    "name": "Apartamento",
    "description": "Unidades residenciales en edificios"
  },
  "property_subtype": {
    "id": 2,
    "name": "1 Dormitorio",
    "description": "Apartamento con 1 dormitorio"
  }
}
```

---

### 3.6 Actualizar Propiedad (Edición Básica)

Actualiza campos principales de la propiedad.

**Endpoint:** `PATCH /admin/properties/:id`
**Auth:** Requerida

**Request Body (todos los campos son opcionales):**
```json
{
  "title": "Apartamento Moderno en Centro - ACTUALIZADO",
  "property_type_id": 1,
  "property_subtype_id": 3,
  "addresses": [
    {
      "address_type": "address_1",
      "street_address": "Av. Libertador 1234, Piso 5, Depto B",
      "city": "Buenos Aires",
      "state": "Capital Federal",
      "zip_code": "1001",
      "country": "Argentina"
    }
  ],
  "existing_owners": [
    {
      "rental_owner_id": 5,
      "ownership_percentage": 100,
      "is_primary": true
    }
  ],
  "description": "Nueva descripción actualizada",
  "security_deposit_amount": 6000,
  "account_number": "987-654-321",
  "account_type": "Corriente",
  "account_holder_name": "Carlos González"
}
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Apartamento Moderno en Centro - ACTUALIZADO",
  "property_type_id": 1,
  "property_subtype_id": 3,
  "status": "DISPONIBLE",
  "description": "Nueva descripción actualizada",
  "security_deposit_amount": 6000,
  "account_number": "987-654-321",
  "account_type": "Corriente",
  "updated_at": "2026-01-30T15:30:00.000Z"
}
```

---

### 3.7 Eliminar Propiedad

**Endpoint:** `DELETE /admin/properties/:id`
**Auth:** Requerida

**Response (204):** No content

---

## 4. Gestión de Propiedades - Detalles Avanzados

⚠️ **IMPORTANTE:** Esta operación se utiliza para agregar detalles adicionales DESPUÉS de crear la propiedad básica.

### 4.1 Actualizar Detalles de Propiedad

**Endpoint:** `PATCH /admin/properties/:id/details`
**Auth:** Requerida

**Request Body (todos los campos son opcionales - envía solo los que quieres actualizar):**
```json
{
  "title": "Título Actualizado",
  "description": "Descripción detallada de la propiedad con todas las características principales",
  "latitude": -34.6037,
  "longitude": -58.3816,
  "images": [
    "/storage/properties/photo1.jpg",
    "/storage/properties/photo2.jpg",
    "/storage/properties/photo3.jpg"
  ],
  "amenities": [
    "WiFi de alta velocidad",
    "TV Cable con cable HDMI",
    "Aire Acondicionado frio/calor",
    "Calefacción central",
    "Gimnasio en el edificio",
    "Piscina en la terraza",
    "Sauna",
    "Laundry en el piso"
  ],
  "included_items": [
    "Toallas blancas",
    "Ropa de cama premium",
    "Vajilla completa para 4 personas",
    "Utensilios de cocina",
    "Cafetera",
    "Tostadora",
    "Microondas",
    "Plancha y tabla de planchar"
  ],
  "security_deposit_amount": 7500,
  "status": "DISPONIBLE",
  "account_number": "123-456-789",
  "account_type": "Ahorros",
  "account_holder_name": "Carlos González"
}
```

**Response (200):**
```json
{
  "id": 1,
  "title": "Título Actualizado",
  "description": "Descripción detallada...",
  "latitude": -34.6037,
  "longitude": -58.3816,
  "images": ["/storage/properties/photo1.jpg", "/storage/properties/photo2.jpg"],
  "amenities": ["WiFi", "TV Cable"],
  "included_items": ["Toallas", "Ropa de Cama"],
  "security_deposit_amount": 7500,
  "status": "DISPONIBLE",
  "updated_at": "2026-01-30T15:35:00.000Z"
}
```

**Posibles valores de status:**
- `DISPONIBLE` - Propiedad disponible para alquilar
- `OCUPADO` - Propiedad actualmente ocupada
- `MANTENIMIENTO` - Propiedad en mantenimiento
- `RESERVADO` - Propiedad reservada temporalmente
- `INACTIVO` - Propiedad inactiva (no se muestra)

---

## 5. Gestión de Imágenes

### 5.1 Subir Imagen a Propiedad

Las imágenes se suben un por una a la vez. Cada vez que subes una imagen, se agrega al array de imágenes de la propiedad.

**Endpoint:** `POST /admin/properties/:id/images`
**Auth:** Requerida
**Content-Type:** `multipart/form-data`

**Form Data:**
```
file: [archivo de imagen]
```

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/admin/properties/1/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Response (200):**
```json
{
  "id": 1,
  "images": [
    "/storage/properties/abc123.jpg",
    "/storage/properties/def456.jpg"
  ]
}
```

**Nota:** La imagen se guarda en `/storage/properties/` con un nombre único generado automáticamente.

---

### 5.2 Eliminar Imagen de Propiedad

Elimina una imagen específica del array de imágenes.

**Endpoint:** `DELETE /admin/properties/:id/images`
**Auth:** Requerida

**Request Body:**
```json
{
  "image_url": "/storage/properties/abc123.jpg"
}
```

**Response (200):**
```json
{
  "id": 1,
  "images": [
    "/storage/properties/def456.jpg"
  ]
}
```

---

### 5.3 Cómo Obtener y Mostrar Imágenes en el Frontend

#### Estructura de Rutas

Cuando subes una imagen a una propiedad, el backend devuelve rutas relativas en este formato:

```
storage/properties/{tenant-slug}/{property-id}/filename.jpg
```

**Ejemplo:**
```
storage/properties/mi-inmobiliaria/1/photo1.jpg
```

#### URL Completa para Consumir las Imágenes

**Endpoint de Imágenes (Público - NO requiere autenticación):**
```
GET http://localhost:3000/storage/properties/{tenant-slug}/{property-id}/{filename}
```

**Ejemplo real:**
```
GET http://localhost:3000/storage/properties/mi-inmobiliaria/1/photo1.jpg
```

⚠️ **IMPORTANTE:** La ruta `/storage` está excluida del middleware de tenant, por lo que puedes acceder directamente sin necesidad de incluir el slug en la URL base.

#### Implementación en el Frontend

```javascript
// Configuración base
const API_BASE = 'http://localhost:3000';

// Cuando obtienes una propiedad, recibes las imágenes así:
{
  "id": 1,
  "title": "Apartamento Moderno",
  "images": [
    "storage/properties/mi-inmobiliaria/1/photo1.jpg",
    "storage/properties/mi-inmobiliaria/1/photo2.jpg",
    "storage/properties/mi-inmobiliaria/1/photo3.jpg"
  ]
}

// Para mostrar las imágenes, construye la URL completa:
const imageUrl = `${API_BASE}/${property.images[0]}`;
// Resultado: http://localhost:3000/storage/properties/mi-inmobiliaria/1/photo1.jpg

// Ejemplo en React:
function PropertyGallery({ property }) {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  
  return (
    <div className="gallery">
      {property.images.map((imagePath, index) => (
        <img 
          key={index}
          src={`${API_BASE}/${imagePath}`}
          alt={`${property.title} - Foto ${index + 1}`}
          onError={(e) => {
            // Manejo de error si la imagen no carga
            e.target.src = '/placeholder-image.png';
          }}
        />
      ))}
    </div>
  );
}

// Ejemplo en Vue:
<template>
  <div class="gallery">
    <img 
      v-for="(imagePath, index) in property.images" 
      :key="index"
      :src="`${apiBase}/${imagePath}`"
      :alt="`${property.title} - Foto ${index + 1}`"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      apiBase: process.env.VUE_APP_API_URL || 'http://localhost:3000'
    }
  }
}
</script>
```

#### URL en Producción

Cuando despliegues a producción, simplemente actualiza el `API_BASE`:

```javascript
// Desarrollo
const API_BASE = 'http://localhost:3000';

// Producción
const API_BASE = 'https://api.tudominio.com';

// Mejor práctica: Usar variables de entorno
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```

---

## 6. Dueños de Propiedades (Rental Owners)

### 6.1 Crear Nuevo Dueño (Rental Owner)

**Endpoint:** `POST /admin/rental-owners`
**Auth:** Requerida

**Request Body:**
```json
{
  "name": "Ana Martínez",
  "company_name": "",                // Opcional - dejar vacío si es persona
  "is_company": false,               // true si es empresa, false si es persona
  "primary_email": "ana@email.com",
  "phone_number": "+5491155555555",
  "secondary_email": "ana.work@email.com",  // Opcional
  "secondary_phone": "+5491155555556",      // Opcional
  "notes": "Prefiere contacto por WhatsApp" // Opcional
}
```

**Response (201):**
```json
{
  "id": 6,
  "name": "Ana Martínez",
  "company_name": null,
  "is_company": false,
  "primary_email": "ana@email.com",
  "phone_number": "+5491155555555",
  "secondary_email": "ana.work@email.com",
  "secondary_phone": "+5491155555556",
  "notes": "Prefiere contacto por WhatsApp",
  "created_at": "2026-01-30T15:40:00.000Z"
}
```

---

### 6.2 Listar Todos los Dueños

**Endpoint:** `GET /admin/rental-owners`
**Auth:** Requerida

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Carlos González",
    "company_name": null,
    "is_company": false,
    "primary_email": "carlos@email.com",
    "phone_number": "+5491198765432",
    "created_at": "2026-01-30T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Inversiones SA",
    "company_name": "Inversiones SA",
    "is_company": true,
    "primary_email": "contacto@inversionessa.com",
    "phone_number": "+5491111111111",
    "created_at": "2026-01-30T11:00:00.000Z"
  }
]
```

---

### 6.3 Obtener Dueño por ID

**Endpoint:** `GET /admin/rental-owners/:id`
**Auth:** Requerida

**Response (200):**
```json
{
  "id": 1,
  "name": "Carlos González",
  "company_name": null,
  "is_company": false,
  "primary_email": "carlos@email.com",
  "phone_number": "+5491198765432",
  "secondary_email": "carlos2@email.com",
  "secondary_phone": "+5491198765433",
  "notes": "Dueño principal, contacto preferente",
  "created_at": "2026-01-30T10:00:00.000Z",
  "updated_at": "2026-01-30T10:00:00.000Z"
}
```

---

## 7. Catálogos y Referencias

### 7.1 Obtener Tipos de Propiedad

**Endpoint:** `GET /admin/property-types`
**Auth:** Requerida

Ver [Sección 3.1](#31-obtener-tipos-de-propiedad-catálogo) para detalle.

---

### 7.2 Obtener Subtipos de Propiedad

**Endpoint:** `GET /admin/property-subtypes?typeId=1`
**Auth:** Requerida

Ver [Sección 3.2](#32-obtener-subtipos-de-propiedad-catálogo) para detalle.

---

## 8. Usuarios

### 8.1 Listar Usuarios del Tenant

Solo disponible para usuarios con rol ADMIN.

**Endpoint:** `GET /users`
**Auth:** Requerida (Solo ADMIN)

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@mi-inmobiliaria.com",
    "role": "ADMIN",
    "phone": "+5491112345678",
    "created_at": "2026-01-30T15:20:30.000Z"
  },
  {
    "id": 2,
    "name": "María López",
    "email": "maria@mi-inmobiliaria.com",
    "role": "USER",
    "phone": "+5491198765432",
    "created_at": "2026-01-30T16:00:00.000Z"
  }
]
```

---

## Flujo Completo Recomendado de Creación de Propiedad

### Opción A: Creación con Imágenes en un Solo Paso (RECOMENDADO - Fase 1)

**Más eficiente y completo:**

1. **Preparación:**
   - Obtener tipos: `GET /:slug/admin/property-types`
   - Obtener subtipos: `GET /:slug/admin/property-subtypes?typeId=1`
   - Obtener dueños existentes (opcional): `GET /:slug/admin/rental-owners`

2. **Crear propiedad con TODO incluido (imágenes + datos + pricing):**
```bash
POST /:slug/admin/properties/with-images
Content-Type: multipart/form-data

# Campos básicos
title: "Apartamento Moderno"
property_type_id: 1
property_subtype_id: 2

# Fase 1: Pricing y Características
monthly_rent: 2500
currency: BOB
square_meters: 85.5
bedrooms: 3
bathrooms: 2
parking_spaces: 1
year_built: 2020
is_furnished: true

# JSON fields
addresses: [{"address_type":"address_1","street_address":"...","city":"La Paz","country":"Bolivia"}]
property_rules: {"pets_allowed":true,"smoking_allowed":false,"max_occupants":4}

# Imágenes (hasta 10)
images: [file1.jpg]
images: [file2.jpg]
images: [file3.jpg]
```

**Ventajas:**
- ✅ Un solo request
- ✅ Menos código
- ✅ Transacción atómica (si falla algo, no se crea nada)
- ✅ Incluye auto-asignación de admin como propietario si no se especifica

📖 **Ver documentación completa:** `PROPERTY-IMAGES-API.md`

---

### Opción B: Creación Paso a Paso (Legacy)

### Paso 1: Preparación
1. Obtener tipos de propiedad: `GET /admin/property-types`
2. Obtener subtipos (filtrado por tipo): `GET /admin/property-subtypes?typeId=1`
3. Obtener lista de dueños existentes: `GET /admin/rental-owners`

### Paso 2: Crear Propiedad Básica
```json
POST /admin/properties
{
  "title": "Apartamento Moderno en Centro",
  "property_type_id": 1,
  "property_subtype_id": 2,
  "addresses": [...],
  "existing_owners": [...] // o "new_owners": [...]
}
```

### Paso 3: Agregar Detalles Adicionales
```json
PATCH /admin/properties/:id/details
{
  "description": "...",
  "amenities": [...],
  "included_items": [...],
  "latitude": -34.6037,
  "longitude": -58.3816
}
```

### Paso 4: Subir Imágenes (una por una)
```bash
POST /admin/properties/:id/images
Content-Type: multipart/form-data
file: [imagen1]

POST /admin/properties/:id/images
Content-Type: multipart/form-data
file: [imagen2]

... repetir para cada imagen
```

### Paso 5: Actualizar Estado (opcional)
```json
PATCH /admin/properties/:id/details
{
  "status": "DISPONIBLE"
}
```

---

## Códigos de Estado HTTP Comunes

- `200 OK` - Request exitosa
- `201 Created` - Recurso creado exitosamente
- `204 No Content` - Eliminación exitosa (no retorna contenido)
- `400 Bad Request` - Error de validación en los datos enviados
- `401 Unauthorized` - No autorizado (token inválido o ausente)
- `403 Forbidden` - Prohibido (sin permisos suficientes)
- `404 Not Found` - Recurso no encontrado
- `500 Internal Server Error` - Error del servidor

---

## Autenticación para Todas las Requests

Para todas las endpoints que requieren autenticación, incluye el header:

```
Authorization: Bearer <tu_access_token>
```

**Ejemplo:**
```bash
curl -X GET http://localhost:3000/admin/properties \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Notas Importantes para el Frontend

1. **Slug del Tenant:** El slug se usa para identificar la organización/empresa en URLs públicas (ej: `mi-inmobiliaria` en `midominio.com/catalog/mi-inmobiliaria/properties`)

2. **Multitenancy:** Cada usuario/propiedad pertenece a un tenant específico. El JWT token incluye el `tenant_id` automáticamente.

3. **Manejo de Imágenes:** Las imágenes se guardan localmente en `/storage/properties/`. Asegúrate de configurar el servidor para servir archivos estáticos desde esta ruta.

4. **Validaciones:**
   - Emails: deben ser formato email válido
   - Passwords: mínimo 6 caracteres
   - Latitud: -90 a 90
   - Longitud: -180 a 180
   - Ownership percentage: 0 a 100

5. **Estados de Propiedad:** Usa los estados correctamente para controlar el flujo de alquileres (DISPONIBLE → RESERVADO → OCUPADO → DISPONIBLE)

---

## Ejemplos de Implementación

### Ejemplo 1: Crear Propiedad Completa con JavaScript/Fetch

```javascript
// 1. Login y obtener token
const loginResponse = await fetch('http://localhost:3000/auth/mi-inmobiliaria/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@mi-inmobiliaria.com',
    password: 'password123'
  })
});
const { access_token } = await loginResponse.json();

// 2. Crear propiedad básica
const propertyResponse = await fetch('http://localhost:3000/admin/properties', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    title: 'Apartamento Moderno',
    property_type_id: 1,
    property_subtype_id: 2,
    addresses: [{
      address_type: 'address_1',
      street_address: 'Av. Libertador 1234',
      city: 'Buenos Aires',
      country: 'Argentina'
    }]
  })
});
const property = await propertyResponse.json();

// 3. Actualizar detalles
await fetch(`http://localhost:3000/admin/properties/${property.id}/details`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    description: 'Hermoso apartamento...',
    amenities: ['WiFi', 'TV Cable'],
    included_items: ['Toallas', 'Ropa de Cama']
  })
});

// 4. Subir imagen
const formData = new FormData();
formData.append('file', imageFile);
await fetch(`http://localhost:3000/admin/properties/${property.id}/images`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`
  },
  body: formData
});
```

---

**Fin de la Documentación de Admin**
