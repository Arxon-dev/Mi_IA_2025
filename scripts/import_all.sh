#!/bin/bash

# Este script importa todas las tablas de un archivo de respaldo de PostgreSQL,
# limpiando las tablas antes de la importación y corrigiendo problemas de formato.

# Detiene la ejecución si cualquier comando falla
set -e

# --- Configuración ---
DB_URL="postgresql://postgres:admin123@localhost:5432/mi_ia_db"
SOURCE_FILE="scripts/data/Datos_BD.c"
FIX_SCRIPT="scripts/fix_arrays.ts"
TEMP_DIR="scripts/data/temp_import"
# --- Fin de la Configuración ---

echo "--- Iniciando el proceso de importación masiva ---"

# Crear un directorio temporal si no existe
mkdir -p "$TEMP_DIR"

# 1. Obtener la lista de todas las tablas desde el schema de Prisma (método robusto)
echo "Paso 1: Obteniendo la lista de tablas desde prisma/schema.prisma..."
TABLE_LIST=$(grep '^model ' prisma/schema.prisma | awk '{print $2}')

# Convertir la cadena de tablas en un array para poder iterar
TABLES=($TABLE_LIST)

echo "Se encontraron ${#TABLES[@]} tablas para procesar."

# 2. Iterar sobre cada tabla encontrada
for TABLE_NAME in "${TABLES[@]}"; do
  # Saltar las tablas que queremos preservar (no se tocarán)
  if [[ "$TABLE_NAME" == "AIConfig" || "$TABLE_NAME" == "Aire" ]]; then
    echo ""
    echo "--- Saltando la tabla: $TABLE_NAME (datos a preservar) ---"
    continue
  fi

  echo ""
  echo "--- Procesando la tabla: $TABLE_NAME ---"

  # Definir nombres de archivo temporales para esta tabla
  TEMP_RAW_SQL="$TEMP_DIR/raw_${TABLE_NAME}.sql"
  TEMP_FIXED_SQL="$TEMP_DIR/fixed_${TABLE_NAME}.sql"

  # 3. Limpiar la tabla en la base de datos antes de la importación
  echo "  -> Limpiando la tabla en la base de datos..."
  psql -d "$DB_URL" -v ON_ERROR_STOP=1 -c "TRUNCATE public.\"$TABLE_NAME\" RESTART IDENTITY CASCADE;"

  # 4. Aislar los datos para la tabla actual desde el archivo fuente
  echo "  -> Aislando los datos de la tabla..."
  awk "/COPY public.\"$TABLE_NAME\"/,/\\\\./" "$SOURCE_FILE" > "$TEMP_RAW_SQL"

  # Comprobación de depuración: verificar si el archivo extraído tiene contenido
  if [ ! -s "$TEMP_RAW_SQL" ]; then
    echo "  -> ¡¡¡ERROR!!! No se pudo extraer ningún dato para la tabla $TABLE_NAME. El archivo temporal está vacío."
    echo "  -> El script se detendrá. Es probable que el formato de 'COPY' para esta tabla en Datos_BD.c sea diferente."
    exit 1
  fi

  # 5. Ejecutar el script de Node.js para corregir el formato de los arrays
  echo "  -> Corrigiendo el formato de los datos..."
  npx ts-node "$FIX_SCRIPT" "$TEMP_RAW_SQL" "$TEMP_FIXED_SQL"

  # 6. Importar el archivo SQL ya corregido y limpio
  echo "  -> Importando los datos corregidos..."
  psql -d "$DB_URL" -v ON_ERROR_STOP=1 -f "$TEMP_FIXED_SQL"

  echo "--- ¡Tabla $TABLE_NAME importada con éxito! ---"
done

# 7. Limpieza de archivos temporales
echo ""
echo "--- Proceso de importación completado. Limpiando archivos temporales... ---"
rm -rf "$TEMP_DIR"

echo "--- ¡Todo listo! ---" 