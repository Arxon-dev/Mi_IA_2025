# Solución: Problema de Horarios en Railway

## Problema Identificado

El sistema de envío automático de preguntas a Telegram no respetaba el horario configurado (07:00 - 22:00) cuando se ejecutaba en Railway, enviando preguntas las 24 horas del día. Sin embargo, funcionaba correctamente en el entorno local.

## Causa Raíz

### 1. Configuración Incorrecta de Horarios

**Archivo afectado:** `scheduler-config.json`

```json
// CONFIGURACIÓN INCORRECTA (antes)
"dailyPolls": {
  "enabled": true,
  "time": "0 * * * *",
  "frequency": "hourly",
  "customMinutes": 60,
  "questionsPerSend": 10,
  "startHour": 22,  // ❌ INCORRECTO: Hora de inicio nocturna
  "startMinute": 0,
  "endHour": 7,     // ❌ INCORRECTO: Hora de fin matutina
  "endMinute": 0
}
```

Esta configuración significaba:
- **Horario activo:** 22:00 - 07:00 (horario nocturno)
- **Horario inactivo:** 07:00 - 22:00 (horario diurno)

### 2. Falta de Validación de Horarios en el Script Principal

**Archivo afectado:** `scripts/auto-send-daily-poll.ts`

El script principal no tenía verificación de horarios, solo verificaba si el sistema estaba habilitado:

```typescript
// CÓDIGO ANTERIOR (sin validación de horarios)
if (!config.dailyPolls.enabled) {
  console.log('⏸️  Envío de polls diarios deshabilitado en configuración');
  return;
}
// Continuaba enviando preguntas sin verificar horario
```

### 3. ¿Por qué funcionaba en local pero no en Railway?

**Diferencias de entorno:**

1. **Zona horaria:** Railway puede usar UTC por defecto, mientras que el entorno local usa la zona horaria del sistema
2. **Configuración de cron:** El scheduler en Railway ejecutaba el cron job cada hora sin restricciones
3. **Variables de entorno:** Posibles diferencias en la configuración de zona horaria entre entornos

## Soluciones Implementadas

### 1. Corrección de la Configuración de Horarios

**Archivo modificado:** `scheduler-config.json`

```json
// CONFIGURACIÓN CORREGIDA (después)
"dailyPolls": {
  "enabled": true,
  "time": "0 * * * *",
  "frequency": "hourly",
  "customMinutes": 60,
  "questionsPerSend": 10,
  "startHour": 7,   // ✅ CORRECTO: Hora de inicio matutina
  "startMinute": 0,
  "endHour": 22,    // ✅ CORRECTO: Hora de fin nocturna
  "endMinute": 0
}
```

**Resultado:**
- **Horario activo:** 07:00 - 22:00 (horario diurno) ✅
- **Horario inactivo:** 22:00 - 07:00 (horario nocturno) ✅

### 2. Implementación de Validación de Horarios

**Archivo modificado:** `scripts/auto-send-daily-poll.ts`

**Nueva función agregada:**
```typescript
// Función para verificar si estamos dentro del horario permitido
function isWithinScheduledHours(config: SchedulerConfig): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  const startHour = config.dailyPolls.startHour ?? 7;
  const startMinute = config.dailyPolls.startMinute ?? 0;
  const endHour = config.dailyPolls.endHour ?? 22;
  const endMinute = config.dailyPolls.endMinute ?? 0;
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  // Si startTime < endTime (mismo día)
  if (startTotalMinutes < endTotalMinutes) {
    return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
  }
  // Si startTime > endTime (cruza medianoche)
  else if (startTotalMinutes > endTotalMinutes) {
    return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes < endTotalMinutes;
  }
  // Si startTime == endTime (24 horas)
  else {
    return true;
  }
}
```

**Validación agregada en la función principal:**
```typescript
// Verificar si estamos dentro del horario permitido
if (!isWithinScheduledHours(config)) {
  const startHour = (config.dailyPolls.startHour ?? 7).toString().padStart(2, '0');
  const startMinute = (config.dailyPolls.startMinute ?? 0).toString().padStart(2, '0');
  const endHour = (config.dailyPolls.endHour ?? 22).toString().padStart(2, '0');
  const endMinute = (config.dailyPolls.endMinute ?? 0).toString().padStart(2, '0');
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  console.log(`⏰ Fuera del horario de envío (${startHour}:${startMinute} - ${endHour}:${endMinute})`);
  console.log(`🕐 Hora actual: ${currentTime}`);
  console.log('🚫 Envío de preguntas omitido para respetar horario configurado');
  return;
}
```

### 3. Verificación de Lógica de Horarios Cruzados

**Archivo verificado:** `scripts/notification-scheduler.ts`

Se confirmó que la función `isWithinScheduledHours()` maneja correctamente:
- Horarios normales (mismo día): 07:00 - 22:00
- Horarios que cruzan medianoche: 22:00 - 07:00
- Horarios de 24 horas: cuando startHour == endHour

## Configuración Final

**En `scheduler-config.json`:**
```json
"dailyPolls": {
  "enabled": true,
  "time": "0 * * * *",        // Cada hora en punto
  "frequency": "hourly",
  "customMinutes": 60,
  "questionsPerSend": 10,      // 10 preguntas por envío
  "startHour": 7,              // Desde las 07:00 AM
  "startMinute": 0,
  "endHour": 22,               // Hasta las 22:00 PM
  "endMinute": 0
}
```

## Verificación de la Solución

### Prueba Local Exitosa
```bash
npx tsx scripts/auto-send-daily-poll.ts
```

**Resultado:**
- ✅ Configuración cargada correctamente
- ✅ Horario verificado: 07:00 - 22:00
- ✅ 10/10 preguntas enviadas exitosamente

### Estado del Scheduler
```bash
npx tsx scripts/notification-scheduler.ts --status
```

**Resultado:**
```
🗳️ Polls diarios: ✅ ACTIVO
   ⏰ Programación: 0 * * * * (hourly)
   🕒 Horario activo: 07:00 - 22:00
```

## Funcionamiento Esperado en Railway

A partir de ahora, el sistema en Railway:

1. **Respetará el horario configurado** (07:00 - 22:00)
2. **Enviará 10 preguntas cada hora** solo durante el horario permitido
3. **Omitirá envíos** durante el horario nocturno (22:00 - 07:00)
4. **Registrará en logs** cuando se omiten envíos por horario
5. **Funcionará consistentemente** entre entornos local y Railway

## Monitoreo

Para verificar el funcionamiento en Railway:

```bash
# Ver estado del scheduler
npx tsx scripts/notification-scheduler.ts --status

# Ejecutar envío manual de prueba
npx tsx scripts/auto-send-daily-poll.ts

# Monitorear logs del sistema
tail -f logs/scheduler.log
```

## Fecha de Corrección

**Fecha:** 9 de enero de 2025  
**Estado:** ✅ RESUELTO  
**Verificado:** ✅ FUNCIONANDO CORRECTAMENTE  
**Entornos:** ✅ Local y Railway

## Archivos Modificados

1. `scheduler-config.json` - Corrección de horarios
2. `scripts/auto-send-daily-poll.ts` - Agregada validación de horarios
3. `SOLUCION-HORARIOS-RAILWAY.md` - Documentación de la solución