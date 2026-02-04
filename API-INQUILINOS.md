# API Documentation - Inquilinos (Portal de Usuarios)

Esta documentación está diseñada para el equipo de frontend que trabajará en el portal de usuarios/inquilinos. Aquí los usuarios pueden ver propiedades disponibles y gestionar su cuenta.

**Base URL:** `http://localhost:3000`

---

## Índice

1. [Autenticación y Registro](#1-autenticación-y-registro)
2. [Gestión de Perfil](#2-gestión-de-perfil)
3. [Catálogo de Propiedades Disponibles](#3-catálogo-de-propiedades-disponibles)
4. [Ver Detalle de Propiedad](#4-ver-detalle-de-propiedad)
5. [Gestión de Contratos](#5-gestión-de-contratos)

---

## 1. Autenticación y Registro

### 1.1 Registrar Nuevo Usuario (Registro Público)

Los usuarios se registran dentro de una organización/tenant específica identificado por su `slug`.

**Endpoint:** `POST /auth/:slug/register`
**Auth:** No requerida (pública)

**URL Params:**
- `slug` - El slug de la organización/tenant (ej: "mi-inmobiliaria")

**Request Body:**
```json
{
  "name": "María González",
  "email": "maria.gonzalez@email.com",
  "password": "password123",  // Mínimo 6 caracteres
  "phone": "+5491198765432"   // Opcional
}
```

**Response (201):**
```json
{
  "id": 5,
  "name": "María González",
  "email": "maria.gonzalez@email.com",
  "role": "USER",
  "phone": "+591 78547855",
  "tenant_id": 1,
  "created_at": "2026-01-30T16:00:00.000Z"
}
```

**Notas:**
- El usuario se registra automáticamente dentro del tenant especificado por el slug
- El rol asignado es automáticamente "USER" (inquilino)
- No se requiere token para esta operación
- El password debe tener mínimo 6 caracteres

---

### 1.2 Login de Usuario

**Endpoint:** `POST /auth/:slug/login`
**Auth:** No requerida (pública)

**URL Params:**
- `slug` - El slug de la organización/tenant (ej: "mi-inmobiliaria")

**Request Body:**
```json
{
  "email": "maria.gonzalez@email.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "name": "María González",
    "email": "maria.gonzalez@email.com",
    "role": "USER",
    "tenant_id": 1,
    "phone": "+5491198765432"
  }
}
```

**Importante:** Guarda el `access_token` - deberás usarlo en las siguientes requests como header `Authorization: Bearer <token>`

---

### 1.3 Obtener Perfil del Usuario Autenticado

**Endpoint:** `GET /auth/me`
**Auth:** Requerida - `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 5,
  "name": "María González",
  "email": "maria.gonzalez@email.com",
  "role": "USER",
  "tenant_id": 1,
  "phone": "+5491198765432",
  "created_at": "2026-01-30T16:00:00.000Z"
}
```

**Uso recomendado:**
- Mostrar información del usuario en el header/perfil
- Verificar si el usuario está autenticado
- Obtener el tenant_id del usuario actual

---

## 2. Gestión de Perfil

### 2.1 Ver Mis Datos

Usa el endpoint `GET /auth/me` para obtener tus datos actuales.

**Ejemplo de uso en el frontend:**

```javascript
// Verificar si el usuario está autenticado al cargar la app
const getProfile = async () => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    // Usuario no autenticado - redirigir a login
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Token inválido o expirado
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      return;
    }

    const user = await response.json();

    // Guardar datos del usuario en el estado/contexto
    setUser(user);
    return user;

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
};
```

---

## 3. Catálogo de Propiedades Disponibles

### 3.1 Listar Propiedades Disponibles (Público)

Esta endpoint permite a los usuarios (autenticados o no) ver las propiedades disponibles de una organización específica.

**Endpoint:** `GET /catalog/:slug/properties`
**Auth:** No requerida (pública)

**URL Params:**
- `slug` - El slug de la organización/tenant (ej: "mi-inmobiliaria")

**Query Params (Todos opcionales - para filtrado y búsqueda):**
```
?status=DISPONIBLE
&property_type_id=1
&property_subtype_id=2
&city=Buenos Aires
&country=Argentina
&search=apartamento
&sort_by=created_at
&sort_order=DESC
&page=1
&limit=20
```

**Descripción de filtros:**
- `status` - Filtra por estado (recomendado usar "DISPONIBLE" para el catálogo público)
- `property_type_id` - Filtra por tipo de propiedad (1=Apartamento, 2=Casa, etc.)
- `property_subtype_id` - Filtra por subtipo (1=Studio, 2=1 Dormitorio, etc.)
- `city` - Filtra por ciudad
- `country` - Filtra por país
- `search` - Busca texto en título y descripción
- `sort_by` - Campo de ordenación (created_at, updated_at, title)
- `sort_order` - Orden ascendente o descendente (ASC, DESC)
- `page` - Número de página (para paginación)
- `limit` - Cantidad de resultados por página (default: 20, max: 100)

---

### Ejemplos de Uso del Catálogo

#### Ejemplo 1: Listado básico de propiedades disponibles
```http
GET /catalog/mi-inmobiliaria/properties
```
Devuelve todas las propiedades disponibles de la organización "mi-inmobiliaria".

#### Ejemplo 2: Filtrar por tipo y ciudad
```http
GET /catalog/mi-inmobiliaria/properties?property_type_id=1&city=Buenos Aires
```
Devuelve apartamentos en Buenos Aires.

#### Ejemplo 3: Búsqueda de texto
```http
GET /catalog/mi-inmobiliaria/properties?search=moderno&status=DISPONIBLE
```
Devuelve propiedades disponibles que contengan "moderno" en título o descripción.

#### Ejemplo 4: Con paginación y ordenamiento
```http
GET /catalog/mi-inmobiliaria/properties?page=1&limit=10&sort_by=created_at&sort_order=DESC
```
Devuelve las 10 propiedades más recientes (página 1).

#### Ejemplo 5: Búsqueda avanzada combinada
```http
GET /catalog/mi-inmobiliaria/properties?property_type_id=1&property_subtype_id=2&city=Buenos Aires&status=DISPONIBLE&sort_by=title&sort_order=ASC&page=1&limit=20
```
Devuelve apartamentos de 1 dormitorio en Buenos Aires, disponibles, ordenados alfabéticamente.

---

### Response (200) - Listado de Propiedades

```json
[
  {
    "id": 1,
    "title": "Apartamento Moderno en Centro",
    "property_type_id": 1,
    "property_subtype_id": 2,
    "status": "DISPONIBLE",
    "description": "Hermoso apartamento totalmente amoblado con vista al río. Ubicado en el corazón de Buenos Aires, cerca de todo.",
    "security_deposit_amount": 5000,
    "latitude": -34.6037,
    "longitude": -58.3816,
    "images": [
      "/storage/properties/photo1.jpg",
      "/storage/properties/photo2.jpg",
      "/storage/properties/photo3.jpg"
    ],
    "amenities": [
      "WiFi de alta velocidad",
      "TV Cable",
      "Aire Acondicionado",
      "Calefacción central",
      "Gimnasio en el edificio"
    ],
    "included_items": [
      "Toallas",
      "Ropa de Cama",
      "Vajilla completa",
      "Utensilios de cocina"
    ],
    "created_at": "2026-01-30T15:20:30.000Z",
    "updated_at": "2026-01-30T15:25:30.000Z",
    "property_type": {
      "id": 1,
      "name": "Apartamento",
      "description": "Unidades residenciales en edificios"
    },
    "property_subtype": {
      "id": 2,
      "name": "1 Dormitorio",
      "description": "Apartamento con 1 dormitorio"
    },
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
    ]
  },
  {
    "id": 2,
    "title": "Studio con Vista al Río",
    "property_type_id": 1,
    "property_subtype_id": 1,
    "status": "DISPONIBLE",
    "description": "Acogedor studio moderno con ventanales panoramicos",
    "images": ["/storage/properties/photo4.jpg"],
    "amenities": ["WiFi", "Aire Acondicionado"],
    "included_items": ["Toallas"],
    "property_type": {
      "id": 1,
      "name": "Apartamento"
    },
    "property_subtype": {
      "id": 1,
      "name": "Studio/Loft"
    },
    "addresses": [
      {
        "street_address": "Av. Corrientes 567, 3º Piso",
        "city": "Buenos Aires",
        "country": "Argentina"
      }
    ]
  }
]
```

---

### Ejemplo de Implementación en Frontend

#### React Hook para listar propiedades

```javascript
import { useState, useEffect } from 'react';

const useProperties = (slug, filters = {}) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);

      // Construir query params
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      try {
        const response = await fetch(
          `http://localhost:3000/catalog/${slug}/properties?${queryParams}`
        );

        if (!response.ok) {
          throw new Error('Error al cargar propiedades');
        }

        const data = await response.json();
        setProperties(data);
        setError(null);

      } catch (err) {
        setError(err.message);
        setProperties([]);

      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [slug, JSON.stringify(filters)]);

  return { properties, loading, error };
};

// Uso:
function PropertiesCatalog() {
  const { properties, loading, error } = useProperties('mi-inmobiliaria', {
    status: 'DISPONIBLE',
    property_type_id: 1,
    city: 'Buenos Aires',
    page: 1,
    limit: 20
  });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="properties-grid">
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
```

---

#### Componente de Filtros de Búsqueda

```javascript
function PropertyFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    property_type_id: '',
    city: '',
    search: '',
    status: 'DISPONIBLE'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="filters">
      <input
        type="text"
        name="search"
        placeholder="Buscar propiedades..."
        value={filters.search}
        onChange={handleChange}
      />

      <select
        name="property_type_id"
        value={filters.property_type_id}
        onChange={handleChange}
      >
        <option value="">Todos los tipos</option>
        <option value="1">Apartamento</option>
        <option value="2">Casa</option>
        <option value="3">Oficina</option>
        <option value="4">Local Comercial</option>
      </select>

      <input
        type="text"
        name="city"
        placeholder="Ciudad"
        value={filters.city}
        onChange={handleChange}
      />
    </div>
  );
}
```

---

## 4. Ver Detalle de Propiedad

### 4.1 Obtener Detalle Completo de una Propiedad

**Endpoint:** `GET /catalog/:slug/properties/:id`
**Auth:** No requerida (pública)

**URL Params:**
- `slug` - El slug de la organización/tenant (ej: "mi-inmobiliaria")
- `id` - El ID de la propiedad (ej: 1)

**Response (200):**

```json
{
  "id": 1,
  "title": "Apartamento Moderno en Centro",
  "property_type_id": 1,
  "property_subtype_id": 2,
  "status": "DISPONIBLE",
  "description": "Hermoso apartamento totalmente amoblado con vista al río. Ubicado en el corazón de Buenos Aires, a pasos de los principales puntos de interés. Edificio con amenities de primer nivel incluyendo gimnasio, piscina y sauna.",
  "security_deposit_amount": 5000,
  "latitude": -34.6037,
  "longitude": -58.3816,
  "images": [
    "/storage/properties/abc123.jpg",
    "/storage/properties/def456.jpg",
    "/storage/properties/ghi789.jpg",
    "/storage/properties/jkl012.jpg"
  ],
  "amenities": [
    "WiFi de alta velocidad (200Mbps)",
    "Smart TV 55' 4K con cable",
    "Aire Acondicionado split frio/calor",
    "Calefacción central",
    "Gimnasio en el edificio (24hs)",
    "Piscina en la terraza (temporada)",
    "Sauna",
    "Laundry en cada piso",
    "Seguridad 24hs",
    "Baulera individual"
  ],
  "included_items": [
    "Toallas blancas premium",
    "Ropa de cama 100% algodón",
    "Vajilla completa para 4 personas",
    "Utensilios de cocina completos",
    "Cafetera eléctrica",
    "Tostadora",
    "Microondas",
    "Plancha a vapor y tabla de planchar",
    "Secador de pelo",
    "Servilletas y manteles"
  ],
  "created_at": "2026-01-30T15:20:30.000Z",
  "updated_at": "2026-01-30T15:25:30.000Z",
  "property_type": {
    "id": 1,
    "name": "Apartamento",
    "description": "Unidades residenciales en edificios"
  },
  "property_subtype": {
    "id": 2,
    "name": "1 Dormitorio",
    "description": "Apartamento con 1 dormitorio"
  },
  "addresses": [
    {
      "id": 1,
      "property_id": 1,
      "address_type": "address_1",
      "street_address": "Av. Libertador 1234, Piso 5, Depto A",
      "city": "Buenos Aires",
      "state": "Capital Federal",
      "zip_code": "1001",
      "country": "Argentina"
    },
    {
      "id": 2,
      "property_id": 1,
      "address_type": "address_2",
      "street_address": "Av. Libertador 1234, Piso 5, Depto A (Alternativa)",
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
      "secondary_email": "carlos.alt@email.com",
      "secondary_phone": "+5491198765433",
      "notes": "Dueño principal, contacto preferente",
      "ownership_percentage": 100,
      "is_primary": true
    }
  ],
  "account_number": "123-456-789",
  "account_type": "Ahorros",
  "account_holder_name": "Carlos González"
}
```

---

### Ejemplo de Componente de Detalle de Propiedad

```javascript
function PropertyDetail({ propertyId, tenantSlug }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/catalog/${tenantSlug}/properties/${propertyId}`
        );

        if (!response.ok) {
          throw new Error('Propiedad no encontrada');
        }

        const data = await response.json();
        setProperty(data);
        setError(null);

      } catch (err) {
        setError(err.message);
        setProperty(null);

      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, tenantSlug]);

  if (loading) return <div>Cargando propiedad...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!property) return <div>Propiedad no encontrada</div>;

  return (
    <div className="property-detail">
      {/* Galería de imágenes */}
      <div className="property-gallery">
        {property.images && property.images.length > 0 ? (
          property.images.map((imageUrl, index) => (
            <img
              key={index}
              src={`http://localhost:3000${imageUrl}`}
              alt={`${property.title} - Foto ${index + 1}`}
            />
          ))
        ) : (
          <div className="no-images">Sin imágenes</div>
        )}
      </div>

      {/* Información principal */}
      <h1>{property.title}</h1>

      <div className="property-meta">
        <span className="badge">{property.property_type.name}</span>
        <span className="badge">{property.property_subtype.name}</span>
        <span className={`status ${property.status.toLowerCase()}`}>
          {property.status}
        </span>
      </div>

      {/* Descripción */}
      <section className="description">
        <h2>Descripción</h2>
        <p>{property.description || 'Sin descripción'}</p>
      </section>

      {/* Ubicación */}
      <section className="location">
        <h2>Ubicación</h2>
        {property.addresses && property.addresses.length > 0 && (
          <div>
            <p><strong>Dirección:</strong> {property.addresses[0].street_address}</p>
            <p>
              {property.addresses[0].city}, {property.addresses[0].state}, {property.addresses[0].country}
            </p>
            {property.latitude && property.longitude && (
              <div className="map">
                {/* Integrar mapa con latitud/longitud */}
                <p>Coordenadas: {property.latitude}, {property.longitude}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <section className="amenities">
          <h2>Amenities</h2>
          <ul>
            {property.amenities.map((amenity, index) => (
              <li key={index}>✓ {amenity}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Ítems incluidos */}
      {property.included_items && property.included_items.length > 0 && (
        <section className="included-items">
          <h2>Lo que está incluido</h2>
          <ul>
            {property.included_items.map((item, index) => (
              <li key={index}>✓ {item}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Información de depósito */}
      {property.security_deposit_amount && (
        <section className="deposit">
          <h2>Depósito de seguridad</h2>
          <p className="amount">${property.security_deposit_amount}</p>
        </section>
      )}

      {/* Información de contacto del dueño */}
      {property.owners && property.owners.length > 0 && (
        <section className="owner-info">
          <h2>Información de contacto</h2>
          {property.owners.map(owner => (
            <div key={owner.id} className="owner">
              <p><strong>Nombre:</strong> {owner.name}</p>
              <p><strong>Email:</strong> {owner.primary_email}</p>
              <p><strong>Teléfono:</strong> {owner.phone_number}</p>
              {owner.notes && <p><strong>Notas:</strong> {owner.notes}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Botones de acción */}
      <div className="actions">
        <button className="btn-contact">Contactar</button>
        <button className="btn-reserve">Reservar</button>
      </div>
    </div>
  );
}
```

---

## Flujo de Usuario Recomendado

### 1. Pantalla de Login/Registro
```
1. Usuario llega a la página pública
2. Puede ver propiedades SIN autenticarse
3. Si quiere reservar/contactar, debe registrarse o hacer login
```

### 2. Registro de Nuevo Usuario
```
1. Usuario completa formulario de registro
   - Nombre completo
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Teléfono (opcional)
2. Se crea usuario con rol "USER" en el tenant
3. Se redirige al catálogo con el usuario autenticado
```

### 3. Navegación del Catálogo
```
1. Usuario ve listado de propiedades disponibles
2. Puede filtrar por:
   - Tipo de propiedad
   - Ciudad
   - Búsqueda de texto
   - Estado (recomendado: DISPONIBLE)
3. Hace clic en una propiedad para ver detalles
```

### 4. Vista de Detalle
```
1. Usuario ve toda la información de la propiedad
   - Galería de imágenes
   - Descripción completa
   - Amenities
   - Ítems incluidos
   - Ubicación con mapa
   - Información de contacto del dueño
2. Puede contactar al dueño o reservar (requiere autenticación)
```

---

## Notas Importantes para el Frontend

### 1. Autenticación
- **No todas las endpoints requieren autenticación** - el catálogo es público
- Solo el perfil (`/auth/me`) requiere token
- Guarda el token en `localStorage` o `cookies`
- Incluye el header `Authorization: Bearer <token>` en requests autenticadas

### 2. URLs de Imágenes
- Las URLs de imágenes son relativas: `/storage/properties/abc123.jpg`
- Debes prependear la base URL: `http://localhost:3000/storage/properties/abc123.jpg`
- Verifica siempre si el array de imágenes existe y tiene elementos antes de renderizar

### 3. Estados de Propiedad
- Muestra solo propiedades con status `DISPONIBLE` en el catálogo público
- Otros estados (OCUPADO, MANTENIMIENTO, RESERVADO) no deberían mostrarse

### 4. Manejo de Datos Opcionales
Siempre verifica que los datos existan antes de renderizar:
```javascript
{property.description && <p>{property.description}</p>}
{property.addresses?.length > 0 && <AddressComponent addresses={property.addresses} />}
{property.images?.length > 0 ? <Gallery images={property.images} /> : <NoImages />}
```

### 5. Slug del Tenant
- El slug identifica la organización en la URL
- Todas las requests del catálogo incluyen el slug: `/catalog/:slug/properties`
- Puedes obtener el slug de la URL actual o desde configuración

### 6. Paginación
- Usa los parámetros `page` y `limit` para implementar paginación
- Default limit: 20, máximo: 100
- Muestra un contador de resultados y controles de navegación

---

## Ejemplo Completo de Implementación

### App Principal con Contexto de Autenticación

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, tenantSlug }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          localStorage.removeItem('access_token');
          setLoading(false);
          return;
        }

        const userData = await response.json();
        setUser(userData);

      } catch (error) {
        console.error('Error checking auth:', error);
        localStorage.removeItem('access_token');

      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await fetch(
      `http://localhost:3000/auth/${tenantSlug}/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }
    );

    if (!response.ok) {
      throw new Error('Credenciales inválidas');
    }

    const { access_token, user } = await response.json();
    localStorage.setItem('access_token', access_token);
    setUser(user);
    return user;
  };

  const register = async (name, email, password, phone) => {
    const response = await fetch(
      `http://localhost:3000/auth/${tenantSlug}/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      }
    );

    if (!response.ok) {
      throw new Error('Error al registrar');
    }

    const userData = await response.json();

    // Después de registrar, hacer login automáticamente
    return await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

**Fin de la Documentación de Inquilinos**

---

## 5. Gestión de Contratos

Como inquilino logueado, puedes gestionar tus contratos de alquiler, ver su estado y realizar la firma digital (aceptación).

### 5.1 Listar Mis Contratos

**Endpoint:** `GET /tenant/contracts/my-contracts`
**Auth:** Requerida - `Authorization: Bearer <token>`

**Query Params:**
- `status` (opcional): Filtra por estado (ACTIVO, BORRADOR, FINALIZADO)

**Response (200):**
```json
[
  {
    "id": 1,
    "contract_number": "CTR-2026-0001",
    "status": "ACTIVO",
    "start_date": "2026-02-01",
    "end_date": "2027-02-01",
    "monthly_rent": 1200.00,
    "property": {
      "title": "Apartamento Moderno en Centro",
      "addresses": [...]
    }
  }
]
```

---

### 5.2 Obtener Mi Contrato Actual

Muestra el contrato que está actualmente vigente (estado ACTIVO).

**Endpoint:** `GET /tenant/contracts/current`
**Auth:** Requerida - `Authorization: Bearer <token>`

---

### 5.3 Firma Digital (Aceptación de Términos)

Este endpoint se utiliza para que el inquilino acepte el contrato. Al hacerlo, el estado cambia a `ACTIVO` y se registra la IP y fecha de firma.

**Endpoint:** `POST /tenant/contracts/my-contracts/:id/sign`
**Auth:** Requerida - `Authorization: Bearer <token>`

**Request Body:** (Vacío o con confirmación)
```json
{}
```

**Response (200):**
```json
{
  "message": "Contrato firmado exitosamente",
  "contract": {
    "id": 1,
    "status": "ACTIVO",
    "tenant_signature_date": "2026-02-03T14:30:00Z"
  }
}
```

---

### 5.4 Descargar PDF del Contrato

Una vez que el contrato está firmado, puedes descargar la versión oficial en PDF.

**Endpoint:** `GET /tenant/contracts/my-contracts/:id/pdf`
**Auth:** Requerida - `Authorization: Bearer <token>`

**Notas:**
- Se recomienda que el frontend genere una previsualización dinámica usando los datos del contrato.
- Este endpoint descarga el archivo oficial generado por el servidor.

---
