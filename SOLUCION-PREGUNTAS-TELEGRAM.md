# Solución: Problema de Envío de Preguntas a Telegram

## Problema Identificado

El sistema de envío automático de preguntas a Telegram no estaba enviando las 10 preguntas configuradas cada hora. En su lugar, enviaba cantidades variables (5, 2, o ninguna pregunta).

## Causa Raíz

### 1. Configuración Incorrecta en el Script
- El archivo `scripts/auto-send-daily-poll.ts` tenía valores por defecto incorrectos
- La función `loadSchedulerConfig()` usaba `questionsPerSend: 1` como valor por defecto
- No leía correctamente la configuración de `scheduler-config.json`

### 2. Validación Demasiado Estricta
- Las preguntas eran rechazadas por tener explicaciones o opciones demasiado largas
- No había truncado automático para ajustar el contenido a los límites de Telegram
- Límites de Telegram:
  - Pregunta: máximo 300 caracteres
  - Opciones: máximo 100 caracteres cada una
  - Explicación: máximo 200 caracteres

## Soluciones Implementadas

### 1. Corrección de la Configuración

**Archivo modificado:** `scripts/auto-send-daily-poll.ts`

```typescript
// ANTES (incorrecto)
return { dailyPolls: { enabled: true, questionsPerSend: 1 } };

// DESPUÉS (corregido)
return { dailyPolls: { enabled: true, questionsPerSend: 10 } };
```

**Mejoras adicionales:**
- Agregado logging para verificar la carga de configuración
- Interfaz `SchedulerConfig` expandida con todas las propiedades necesarias
- Manejo mejorado de errores en la carga de configuración

### 2. Implementación de Truncado Automático

**Nueva función agregada:**
```typescript
function truncateOption(option: string, maxLength: number = 100): string {
  // Trunca opciones largas manteniendo palabras completas
}
```

**Modificación en `parseQuestionData()`:**
- Truncado automático de explicaciones a 200 caracteres
- Truncado automático de opciones a 100 caracteres
- Preservación de palabras completas al truncar

### 3. Aplicación de Cambios en Archivos Relacionados

**Archivos actualizados:**
- `scripts/auto-send-daily-poll.ts` - Script principal
- `scripts/analyze-table-selection.ts` - Script de análisis

## Configuración Actual

**En `scheduler-config.json`:**
```json
"dailyPolls": {
  "enabled": true,
  "time": "0 * * * *",        // Cada hora en punto
  "frequency": "hourly",
  "customMinutes": 60,
  "questionsPerSend": 10,      // 10 preguntas por envío
  "startHour": 8,              // Desde las 8:00 AM
  "startMinute": 0,
  "endHour": 22,               // Hasta las 22:00 PM
  "endMinute": 0
}
```

## Verificación de la Solución

### Prueba Manual Exitosa
```bash
npx tsx scripts/auto-send-daily-poll.ts
```

**Resultado:**
- ✅ Configuración cargada correctamente: `questionsPerSend = 10`
- ✅ 10/10 preguntas enviadas exitosamente
- ✅ Truncado automático funcionando
- ✅ Todas las preguntas válidas para Telegram

### Estado del Scheduler
```
🗳️ Polls diarios: ✅ ACTIVO
   ⏰ Programación: 0 * * * * (hourly)
   🕒 Horario activo: 08:00 - 22:00
```

## Funcionamiento Esperado

A partir de ahora, el sistema:

1. **Enviará 10 preguntas cada hora** (de 8:00 AM a 22:00 PM)
2. **Truncará automáticamente** contenido largo para cumplir límites de Telegram
3. **Seleccionará preguntas** de todas las tablas disponibles de forma equilibrada
4. **Mezclará las opciones** aleatoriamente en cada envío
5. **Actualizará contadores** de envío para rotación equitativa

## Monitoreo

Para verificar el funcionamiento:

```bash
# Ver estado del scheduler
npx tsx scripts/notification-scheduler.ts --status

# Ejecutar envío manual de prueba
npx tsx scripts/auto-send-daily-poll.ts

# Monitorear logs del sistema
npx tsx scripts/monitor-system.ts
```

## Fecha de Corrección

**Fecha:** 4 de agosto de 2025  
**Estado:** ✅ RESUELTO  
**Verificado:** ✅ FUNCIONANDO CORRECTAMENTE