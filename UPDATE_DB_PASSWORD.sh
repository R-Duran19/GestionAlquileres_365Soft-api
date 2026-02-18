#!/bin/bash

# Script para actualizar la contraseña de PostgreSQL
# Ejecutar como usuario postgres o con sudo

echo "🔐 Actualizando contraseña de PostgreSQL..."

# Opción 1: Si tienes acceso a postgres user
sudo -u postgres psql -c "ALTER USER gestion_user WITH PASSWORD 'utrF1JGWOrVOLvKrPRS9lQ==';"

# Opción 2: Si postgres no requiere password
# psql -U postgres -c "ALTER USER gestion_user WITH PASSWORD 'utrF1JGWOrVOLvKrPRS9lQ==';"

echo "✅ Contraseña actualizada"
echo ""
echo "Para verificar, ejecuta:"
echo "PGPASSWORD='utrF1JGWOrVOLvKrPRS9lQ==' psql -h localhost -p 5432 -U gestion_user -d gestion_alquileres -c 'SELECT current_user;'"
