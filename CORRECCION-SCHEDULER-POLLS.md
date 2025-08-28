# Corrección del Sistema de Scheduler de Polls

## Problema Detectado

Se identificó un problema en el sistema de envío automático de polls (preguntas) donde:

- Las preguntas se estaban enviando cada 5 minutos en lugar de cada hora
- El script `tournament-notifications.ts` se ejecutaba múltiples veces después de cada envío de poll
- Esto generaba un exceso de notificaciones y consumo de recursos

## Cambios Realizados

### 1. Modificación de la Configuración

Se actualizó el archivo `scheduler-config.json` para cambiar la frecuencia de los polls:

```json
"dailyPolls": {
  "enabled": true,
  "time": "0 * * * *",      // Cambiado de "*/5 * * * *" a "0 * * * *" (cada hora en punto)
  "frequency": "hourly",    // Cambiado de "custom" a "hourly"
  "customMinutes": 60,      // Cambiado de 5 a 60 minutos
  "startHour": 8,
  "startMinute": 0,
  "endHour": 22,
  "endMinute": 0
}
```

### 2. Optimización del Scheduler de Notificaciones

Se modificó el archivo `notification-scheduler.ts` para:

- Ejecutar el script `tournament-notifications.ts` una sola vez después de cada poll
- Cambiar la frecuencia del scheduler de notificaciones de torneos de cada minuto a cada 10 minutos
- Mejorar los logs para facilitar el diagnóstico
- Actualizar la función `getStatus()` para mostrar información más detallada

### 3. Scripts de Reinicio

Se crearon dos scripts para facilitar el reinicio del scheduler:

- `reiniciar-scheduler.ps1` (PowerShell)
- `reiniciar-scheduler.bat` (Batch)

## Cómo Verificar la Corrección

1. Ejecuta uno de los scripts de reinicio:
   ```
   .\reiniciar-scheduler.ps1
   ```
   o
   ```
   .\reiniciar-scheduler.bat
   ```

2. Verifica el estado del scheduler:
   ```
   npx tsx scripts/notification-scheduler.ts --status
   ```

3. Monitorea los logs para confirmar que:
   - Los polls se envían cada hora en punto
   - Las notificaciones de torneos se ejecutan cada 10 minutos
   - No hay ejecuciones múltiples del script `tournament-notifications.ts`

## Solución de Problemas Futuros

Si se presentan problemas similares en el futuro:

1. Verifica la configuración en `scheduler-config.json`
2. Revisa los logs para identificar patrones de ejecución anormales
3. Asegúrate de que no haya múltiples instancias del scheduler ejecutándose simultáneamente
4. Utiliza los scripts de reinicio para aplicar cambios de configuración

## Notas Adicionales

- El sistema ahora ejecuta las notificaciones de torneos de forma más eficiente
- Se ha mejorado la información de estado para facilitar el diagnóstico
- Los cambios de configuración se aplican automáticamente al reiniciar el scheduler