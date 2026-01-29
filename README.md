# Gestión de Alquileres 365 Soft - API

Sistema de gestión de alquileres desarrollado con NestJS, TypeScript y PostgreSQL.

## Stack Tecnológico

- **Framework**: NestJS 11.0.1
- **Lenguaje**: TypeScript 5.7
- **Base de datos**: PostgreSQL 18
- **ORM**: TypeORM 0.3.28
- **Validación**: class-validator, class-transformer

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

## Endpoints

### Health Check

Verificar el estado de la aplicación y conexión a la base de datos:

```bash
GET http://localhost:3000/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "timestamp": "2026-01-29T15:22:09.709Z",
  "database": {
    "connected": true,
    "database": "build",
    "host": "localhost",
    "port": 5432,
    "version": "PostgreSQL 18.1 on x86_64-windows"
  }
}
```

## Estructura del Proyecto

```
src/
├── common/              # Módulos compartidos
│   ├── config/         # Configuración de entorno
│   └── health/         # Health checks
├── main.ts             # Punto de entrada
└── app.module.ts       # Módulo raíz
```

## Configuración de Base de Datos

La aplicación usa TypeORM con las siguientes características:

- **Auto-sincronización**: Activada en desarrollo
- **Logging**: Activado en desarrollo
- **Entidades**: Se cargan automáticamente desde `**/*.entity{.ts,.js}`

## Recursos

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Estado del Proyecto

✅ Configuración inicial completada
✅ Conexión a base de datos establecida
✅ Health check implementado
✅ Estructura modular configurada

## Licencia

UNLICENSED
