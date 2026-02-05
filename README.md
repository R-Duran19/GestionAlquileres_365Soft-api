# 🏢 Sistema de Gestión de Alquileres 365 Soft - API

Sistema **multitenancy** para gestión de propiedades inmobiliarias. Desarrollado con NestJS, TypeScript y PostgreSQL.

## 🛠️ Stack Tecnológico

- **Framework**: NestJS 11.0.1
- **Lenguaje**: TypeScript 5.7
- **Base de datos**: PostgreSQL 18
- **ORM**: TypeORM 0.3.28
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: class-validator, class-transformer

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v22 o superior) - [Descargar](https://nodejs.org/)
- **PostgreSQL** (v18 o superior) - [Descargar](https://www.postgresql.org/download/)
- **npm** (viene con Node.js) o **yarn**

---

## 🚀 Guía de Instalación Rápida

### 1. Clonar el repositorio (si aplica)

```bash
git clone <tu-repositorio>
cd gestion-alquileres_365-soft-api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar PostgreSQL

#### Opción A: Usar Laragon (Windows) - RECOMENDADO para Producción

Crear un **usuario dedicado** para la aplicación (mejor práctica de seguridad):

1. Abre Laragon e inicia PostgreSQL
2. Abre la terminal de Laragon o usa PowerShell/Git Bash
3. Conéctate como superusuario:

```bash
psql -U postgres
```

4. Crea el usuario dedicado y la base de datos:

```sql
-- Crear usuario para la aplicación
CREATE USER gestion_user WITH PASSWORD 'tu_contraseña_segura';

-- Crear la base de datos con este usuario como owner
CREATE DATABASE gestion_alquileres OWNER gestion_user;

-- Conectar a la base de datos
\c gestion_alquileres

-- Conceder todos los privilegios al usuario
GRANT ALL PRIVILEGES ON DATABASE gestion_alquileres TO gestion_user;

-- Salir
\q
```

**¿Por qué esta opción?**
- ✅ Mejor seguridad (no usas el superusuario `postgres`)
- ✅ Permisos limitados a esta base de datos
- ✅ Recomendado para producción
- ✅ Si se compromete el usuario, el daño está contenido

---

#### Opción B: Usar usuario postgres (Solo Desarrollo)

Si estás en **desarrollo local** y quieres algo rápido:

```bash
# En Windows (Git Bash o PowerShell con PostgreSQL en PATH)
psql -U postgres

# Luego en el prompt de PostgreSQL:
CREATE DATABASE gestion_alquileres;
\q
```

⚠️ **Nota:** Esta opción es menos segura. Úsala solo para desarrollo local.

---

#### Opción C: Terminal/Consola (Alternativa)

Si prefieres usar comandos directos sin entrar al prompt de PostgreSQL:

```bash
# Crear usuario y base de datos en una sola línea
psql -U postgres -c "CREATE USER gestion_user WITH PASSWORD 'tu_contraseña_segura';"
psql -U postgres -c "CREATE DATABASE gestion_alquileres OWNER gestion_user;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE gestion_alquileres TO gestion_user;"
```

### 4. Configurar variables de entorno

Crea el archivo `.env` en la raíz del proyecto:

```bash
# En Windows (Git Bash)
touch .env

# O en PowerShell
New-Item -Path .env -ItemType File
```

**Contenido del archivo `.env`:**

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=gestion_user
DB_PASSWORD=tu_contraseña_segura
DB_DATABASE=gestion_alquileres

# App
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=clave_super_secreta_cambiala_en_produccion
JWT_EXPIRATION=7d
```

⚠️ **IMPORTANTE:**
- **Si usas Opción A** (usuario dedicado): usa `gestion_user` y tu contraseña segura
- **Si usas Opción B** (usuario postgres): usa `postgres` y tu contraseña de postgres
- Cambia `JWT_SECRET` por una clave segura en producción
- Nunca compartas el archivo `.env` (está en `.gitignore`)

### 5. Verificar conexión a la base de datos

Antes de iniciar, asegúrate de que:
- PostgreSQL está corriendo
- La base de datos `gestion_alquileres` existe
- Las credenciales en `.env` son correctas

**Verificación rápida:**

```bash
# Si creaste usuario dedicado (Opción A):
psql -U gestion_user -d gestion_alquileres

# Si usas usuario postgres (Opción B):
psql -U postgres -d gestion_alquileres

# Si conecta correctamente, verás el prompt:
gestion_alquileres=#
```

**Prueba de conexión:**
```bash
# Verificar que el usuario tiene privilegios
\conninfo

# Debería mostrar algo como:
# You are connected to database "gestion_alquileres" as user "gestion_user"
```

### 6. Iniciar la aplicación en modo desarrollo

```bash
npm run start:dev
```

**Deberías ver:**
```
[Nest] xxxxx - LOG [NestFactory] Starting Nest application...
[Nest] xxxxx - LOG [InstanceLoader] AppModule dependencies initialized +xxxms
[Nest] xxxxx - LOG [RoutesResolver] AppController {/}: +xxms
[Nest] xxxxx - LOG [RouterExplorer] Mapped {/, GET} route +xxms
[Nest] xxxxx - LOG [NestApplication] Nest application successfully started +xxxms
```

La aplicación estará corriendo en: **http://localhost:3000**

---

## ✅ Verificar Instalación

### 1. Health Check

Abre tu navegador o usa curl:

```bash
curl http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy"
    }
  }
}
```

### 2. Crear primer admin y tenant

```bash
curl -X POST http://localhost:3000/auth/register-admin \
  -H "Content-Type: application/json" \
  -d "{\"company_name\": \"Mi Inmobiliaria\", \"slug\": \"mi-inmobiliaria\", \"name\": \"Admin\", \"email\": \"admin@mi-inmobiliaria.com\", \"password\": \"password123\", \"currency\": \"BO\", \"locale\": \"es\"}"
```

**Respuesta esperada:**
```json
{
  "message": "Administrador y tenant registrados exitosamente",
  "tenant": {
    "id": 1,
    "company_name": "Mi Inmobiliaria",
    "slug": "mi-inmobiliaria",
    "currency": "BO",
    "locale": "es"
  },
  "access_token": "eyJhbGci..."
}
```

¡Si ves esto, **tu instalación está funcionando correctamente!** 🎉

---

## 📂 Comandos Disponibles

### Desarrollo

```bash
# Modo desarrollo (con hot reload) - RECOMENDADO
npm run start:dev

# Modo debug
npm run start:debug

# Modo producción (requiere build primero)
npm run build
npm run start:prod
```

### Calidad de Código

```bash
# Formatear código con Prettier
npm run format

# Ejecutar ESLint con auto-fix
npm run lint

# Compilar TypeScript a JavaScript
npm run build
```

### Testing

```bash
# Ejecutar unit tests
npm run test

# Ejecutar tests e2e
npm run test:e2e

# Generar reporte de cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch
```

---

## 🌐 URLs Importantes

Una vez iniciada la aplicación:

- **API Base URL**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/health`
- **API Root**: `http://localhost:3000/`

---

## 🔧 Solución de Problemas Comunes

### Error: "Connection refused" o "ECONNREFUSED"

**Problema:** PostgreSQL no está corriendo.

**Solución:**
```bash
# En Windows con Laragon:
# 1. Abre Laragon
# 2. Click derecho en PostgreSQL → Start

# O inicia el servicio de PostgreSQL:
# Win + R → services.msc → PostgreSQL → Iniciar
```

---

### Error: "database "gestion_alquileres" does not exist"

**Problema:** La base de datos no está creada.

**Solución:**
```bash
psql -U postgres

# En el prompt de PostgreSQL:
CREATE DATABASE gestion_alquileres;
\q
```

---

### Error: "password authentication failed for user"

**Problema:** Contraseña incorrecta en `.env`.

**Solución:**
1. Verifica tu contraseña real de PostgreSQL
2. Actualiza `DB_PASSWORD` en el archivo `.env`
3. Reinicia la aplicación: `Ctrl+C` y luego `npm run start:dev`

---

### Error: "port 3000 is already in use"

**Problema:** El puerto 3000 ya está siendo usado.

**Solución:**
```bash
# Opción 1: Cambiar el puerto en .env
PORT=3001

# Opción 2: Matar el proceso en el puerto 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <el_pid_que_aparece> /F
```

---

### Error: Module not found

**Problema:** Dependencias no instaladas.

**Solución:**
```bash
# Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

---

## 📁 Estructura del Proyecto

```
gestion-alquileres_365-soft-api/
├── src/
│   ├── main.ts                    # Punto de entrada
│   ├── app.module.ts              # Módulo raíz
│   ├── common/                    # Utilidades compartidas
│   ├── tenants/                   # Módulo de organizaciones
│   ├── auth/                      # Autenticación y registro
│   ├── users/                     # Usuarios del sistema
│   └── properties/                # Gestión de propiedades
├── .env                           # Variables de entorno (crear este archivo)
├── .env.example                   # Ejemplo de variables
├── package.json                   # Dependencias y scripts
└── README.md                      # Este archivo
```

---

## 🔐 Seguridad en Producción

Antes de desplegar en producción:

1. **Cambiar JWT_SECRET** a una clave fuerte y única
2. **Usar variables de entorno** para datos sensibles
3. **Configurar CORS** correctamente para tu dominio frontend
4. **Usar HTTPS** en producción
5. **Limitar rate** de requests para prevenir abuso
6. **Configurar firewall** en la base de datos

---

## 📖 Recursos de Referencia

- **Documentación de NestJS**: https://docs.nestjs.com
- **Documentación de TypeORM**: https://typeorm.io
- **Documentación de PostgreSQL**: https://www.postgresql.org/docs
- **Documentación de TypeScript**: https://www.typescriptlang.org/docs

---

## ❓ Preguntas Frecuentes

**¿Puedo usar otra base de datos además de PostgreSQL?**

No necesariamente. El sistema usa **schemas específicos de PostgreSQL** para el multitenancy. Podría adaptarse a otras bases de datos, pero requeriría modificar la arquitectura.

**¿Necesito crear schemas manualmente?**

No. El sistema crea automáticamente los schemas por tenant cuando se registra un nuevo admin/tenant.

**¿Puedo cambiar el puerto?**

Sí, edita la variable `PORT` en tu archivo `.env`.

**¿Dónde se guardan las imágenes subidas?**

En `storage/properties/` en la raíz del proyecto. Asegúrate de configurar el servidor para servir archivos estáticos desde esta ruta.

**¿Es obligatorio crear un usuario dedicado (gestion_user)?**

No es obligatorio, pero **altamente recomendado** para producción. Para desarrollo rápido puedes usar `postgres`, pero en producción siempre crea un usuario con permisos limitados.

**¿Qué ventajas tiene usar un usuario dedicado vs postgres?**

| Aspecto | Usuario dedicado ✅ | Usuario postgres ❌ |
|---------|-------------------|-------------------|
| **Seguridad** | Permisos limitados | Superusuario total |
| **Daño potencial** | Solo esta BD | Todo el servidor |
| **Producción** | Recomendado | No recomendado |
| **Desarrollo** | Bueno | Aceptable |

---

## 💡 Tips de Desarrollo

1. **Usa `npm run start:dev`** para desarrollo con hot reload
2. **Verifica el health check** después de cada cambio importante
3. **Revisa los logs** en la consola para detectar errores
4. **Usa el archivo `.env`** para configuración local (no lo subas a Git)
5. **Mantén PostgreSQL corriendo** antes de iniciar la aplicación

---

## 📝 Notas

- El sistema usa **multitenancy por schema**, cada organización tiene su propio schema en PostgreSQL
- El endpoint `/:slug/catalog/properties` es **público** (no requiere autenticación)
- Los usuarios al registrarse se crean dentro de un tenant específico (identificado por el slug)

---

**Versión**: 1.0.0
**Última actualización**: 30/01/2026
