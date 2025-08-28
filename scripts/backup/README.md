# Sistema de Backup Mi-IA-24

Este sistema proporciona diferentes tipos de backup para asegurar la integridad de tu proyecto.

## Tipos de Backup

1. **Backup Completo**
   - Incluye código, base de datos y configuración
   - Uso: `.\scripts\backup\backup.ps1`
   - Ubicación: `backups/backup_[fecha]`

2. **Backup de Base de Datos**
   - Solo base de datos (formato binario y SQL)
   - Uso: `.\scripts\db\backup_db.ps1`
   - Ubicación: `backups/database`
   - Genera tres archivos:
     * `backup_[fecha].dump` (formato binario)
     * `backup_[fecha].sql` (formato SQL)
     * `backup_[fecha].json` (metadata)

## Cómo Hacer Backup

### Backup Completo
```powershell
# 1. Abrir PowerShell en la raíz del proyecto
cd scripts/backup

# 2. Ejecutar el script de backup
.\backup.ps1

# 3. Verificar los archivos generados en:
#    backups/backup_[fecha]/
```

### Backup Solo Base de Datos
```powershell
# 1. Abrir PowerShell en la raíz del proyecto
cd scripts/db

# 2. Ejecutar el script de backup
.\backup_db.ps1

# 3. Verificar los archivos generados en:
#    backups/database/
```

## Restauración

### Restaurar Base de Datos
```powershell
# 1. Abrir PowerShell en la raíz del proyecto
cd scripts/db

# 2. Ejecutar el script de restauración
.\restore_db.ps1

# 3. Seguir los pasos:
#    - Seleccionar el número del backup a restaurar
#    - Confirmar la restauración escribiendo 's'
```

### Restaurar Backup Completo
```powershell
# 1. Abrir PowerShell en la raíz del proyecto
cd scripts/backup

# 2. Ejecutar el script de restauración
.\restore.ps1

# 3. Seguir los pasos:
#    - Seleccionar el backup a restaurar
#    - Confirmar la restauración
```

## Estructura de Directorios
backups/
├── backup_[fecha]/
│ ├── code/ # Código fuente
│ ├── database/ # Backup de BD
│ ├── config/ # Configuraciones
│ └── metadata.json # Información del backup
└── database/ # Backups individuales de BD
├── backup_[fecha].dump # Backup binario
├── backup_[fecha].sql # Backup SQL
└── backup_[fecha].json # Metadata

## Recomendaciones

1. **Cuándo hacer backup**:
   - Antes de cambios importantes en el código
   - Antes de actualizaciones de dependencias
   - Antes de migraciones de base de datos
   - Periódicamente (ej: diario o semanal)

2. **Mantener copias en**:
   - Repositorio local
   - Almacenamiento externo (USB/Disco duro)
   - Servicio en la nube (OneDrive/Google Drive)

3. **Buenas prácticas**:
   - Verificar backups periódicamente
   - Mantener al menos 3 versiones anteriores
   - Documentar cambios importantes en cada backup
   - Probar la restauración en un entorno de prueba

4. **Solución de problemas**:
   - Si hay error de permisos: Ejecutar PowerShell como administrador
   - Si falla la conexión: Verificar DATABASE_URL en .env
   - Si falla la restauración: Verificar que no hay conexiones activas

## Notas Importantes

- Los backups binarios (.dump) son más eficientes para restaurar
- Los backups SQL (.sql) son más portables y legibles
- La metadata (.json) contiene información sobre el backup
- Siempre verificar que el backup se completó correctamente
- Mantener el archivo .env actualizado con las credenciales correctas