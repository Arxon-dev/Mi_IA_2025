#!/bin/bash

# Script para restaurar la base de datos desde backup
# Configuración de la base de datos
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASSWORD="admin123"
DB_NAME="mi_ia_db"

# Ruta del archivo de backup
BACKUP_FILE="/f/Permanencia/Perma2024/PROYECTOS_OPOMELILLA/Mi_IA_11_38_Telegram_Moodle/backups/backup-full-2025-06-26T18-30-24-830Z.sql"

echo "=== RESTAURACIÓN DE BASE DE DATOS ==="
echo "Archivo de backup: $BACKUP_FILE"

# Verificar que el archivo de backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: El archivo de backup no existe en la ruta especificada"
    exit 1
fi

# Configurar variable de entorno para la contraseña
export PGPASSWORD="$DB_PASSWORD"

echo "Paso 1: Terminando conexiones activas a la base de datos..."
# Terminar conexiones activas a la base de datos
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" 2>/dev/null

echo "✓ Conexiones terminadas"

echo "Paso 2: Eliminando base de datos existente..."
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" --if-exists
echo "✓ Base de datos eliminada"

echo "Paso 3: Creando nueva base de datos..."
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
if [ $? -ne 0 ]; then
    echo "✗ Error al crear la base de datos"
    exit 1
fi
echo "✓ Base de datos creada"

echo "Paso 4: Restaurando datos desde backup..."
echo "Esto puede tomar varios minutos..."

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"
if [ $? -ne 0 ]; then
    echo "✗ Error durante la restauración"
    exit 1
fi
echo "✓ Datos restaurados exitosamente"

echo "Paso 5: Aplicando migraciones de Prisma..."
cd "/f/Permanencia/Perma2024/PROYECTOS_OPOMELILLA/Mi_IA_11_38_Telegram_Moodle"
npx prisma db push --accept-data-loss
echo "✓ Migraciones aplicadas"

echo ""
echo "=== RESTAURACIÓN COMPLETADA ==="
echo "La base de datos ha sido restaurada desde el backup."
echo "Puedes verificar el resultado ejecutando: npx prisma studio"

# Limpiar variable de entorno
unset PGPASSWORD 