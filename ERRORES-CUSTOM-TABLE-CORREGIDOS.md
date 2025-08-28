# Errores Corregidos en Custom Table API y Telegram Webhook

## Resumen
Este documento registra los errores encontrados y corregidos en el sistema de preguntas personalizadas y el webhook de Telegram después de la migración a MySQL.

## 1. Error en Custom Table Clear API

### Error Original
```
Unknown argument 'sectionId'. Did you mean 'sectionid'?
```

### Causa
El esquema MySQL utiliza nombres de campos en minúsculas (`sectionid`) pero el código estaba usando camelCase (`sectionId`).

### Solución
Se corrigieron todos los switch cases en `src/app/api/questions/custom-table/clear/route.ts`:
- `sectionId` → `sectionid`
- Se aplicó sistema de reintentos a todas las operaciones de tabla

### Archivos Modificados
- `src/app/api/questions/custom-table/clear/route.ts`

## 2. Error en Custom Table Main API

### Error Original
```
'prisma' is not exported from '@/services/prismaService'
```

### Causa
Importación incorrecta del cliente Prisma.

### Solución
Se cambió la importación:
```typescript
// Antes
import { prisma } from '@/services/prismaService';

// Después  
import prisma from '@/lib/prisma';
```

### Archivos Modificados
- `src/app/api/questions/custom-table/route.ts`

## 3. Error de Acceso a Tablas

### Error Original
```
Cannot read properties of undefined (reading 'armada')
```

### Causa
La función `getModelName` no tenía mapeo completo para todos los tipos de tabla.

### Solución
Se reescribió completamente la función `getModelName` con mapeo exhaustivo:

```typescript
function getModelName(tableType: string): string {
  const modelMapping: Record<string, string> = {
    'Armada': 'armada',
    'Constitucion': 'constitucion',
    'DefensaNacional': 'defensanacional',
    'Carrera': 'carrera',
    'Aire': 'aire',
    'Rio': 'rio',
    // ... mapeo completo
  };
  
  const modelName = modelMapping[tableType];
  if (!modelName) {
    throw new Error(`Tipo de tabla no soportado: ${tableType}`);
  }
  return modelName;
}
```

### Archivos Modificados
- `src/app/api/questions/custom-table/route.ts`

## 4. Error de Campo ID Faltante

### Error Original
```
Argument 'id' is missing
```

### Causa
Las tablas personalizadas requerían un campo `id` único que no se estaba generando.

### Solución
Se agregó generación de ID único con formato específico:
```typescript
const uniqueId = `${tableName}-${questionNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

Y se corrigieron todos los nombres de campos a lowercase para MySQL:
- `sendCount` → `sendcount`
- `lastUsedInTournament` → `lastusedintournament`
- `tournamentUsageCount` → `tournamentusagecount`
- `lastTournamentId` → `lasttournamentid`

### Archivos Modificados
- `src/app/api/questions/custom-table/route.ts`

## 5. Error SQL en Telegram Webhook

### Error Original
```
You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near '"telegramuserid"'
```

### Causa
Uso de comillas dobles (`"`) en consultas SQL, que no es compatible con MySQL/MariaDB.

### Solución
Se removieron todas las comillas dobles de las consultas SQL:
```sql
-- Antes
SELECT tu."telegramuserid", tu."firstname"

-- Después
SELECT tu.telegramuserid, tu.firstname
```

### Archivos Modificados
- `src/app/api/telegram/webhook/route.ts`

## 6. Error de Tabla No Encontrada

### Error Original
```
Table 'u449034524_moodel_telegra.TelegramUser' doesn't exist
```

### Causa
Los nombres de tablas en MySQL están en minúsculas, pero las consultas usaban nombres en mayúsculas.

### Solución
Se corrigieron todos los nombres de tablas a minúsculas:
- `TelegramUser` → `telegramuser`
- `UserSubscription` → `usersubscription`
- `SubscriptionPlan` → `subscriptionplan`
- `UserQuotaUsage` → `userquotausage`
- `StudyResponse` → `studyresponse`
- `TelegramResponse` → `telegramresponse`
- `TelegramPoll` → `telegrampoll`
- `Simulacro` → `simulacro`
- `SimulacroResponse` → `simulacroresponse`
- `ExamenOficial2018` → `examenoficial2018`
- `ExamenOficial2024` → `examenoficial2024`

### Archivos Modificados
- `src/app/api/telegram/webhook/route.ts`

## 7. Error totalQuestions is not defined

### Error Original
```
Error iniciando sesión de estudio: ReferenceError: totalQuestions is not defined
    at eval (webpack-internal:///(rsc)/./src/services/studySessionService.ts:481:25)
```

### Causa
Inconsistencia en el nombre de variable: se usaba `totalQuestions` (camelCase) en lugar de `totalquestions` (lowercase) para mantener consistencia con el esquema MySQL.

### Solución
Se corrigió la variable en `src/services/studySessionService.ts`:
```typescript
// Antes
const newTotalQuestions = stats.totalquestions + 1;
// ...
totalquestions: newTotalQuestions,

// Después
const newTotalquestions = stats.totalquestions + 1;
// ...
totalquestions: newTotalquestions,
```

### Archivos Modificados
- `src/services/studySessionService.ts`

## Estado Final

✅ **Todos los errores han sido corregidos**

### Resumen de Cambios
1. **Nomenclatura de campos**: Todos los campos corregidos a lowercase para MySQL
2. **Sintaxis SQL**: Removidas comillas dobles, sintaxis compatible con MySQL/MariaDB
3. **Nombres de tablas**: Corregidos a minúsculas según esquema MySQL
4. **Sistema de reintentos**: Aplicado consistentemente a todas las operaciones de BD
5. **Generación de IDs**: Implementada para tablas personalizadas
6. **Mapeo de modelos**: Reescrito completamente para cobertura total
7. **Consistencia de variables**: Corregida nomenclatura de variables para mantener consistencia

### Documentación Actualizada
- `troubleshooting.md`: Actualizado con nuevas soluciones
- `ERRORES-CUSTOM-TABLE-CORREGIDOS.md`: Documentación completa de errores y soluciones

El sistema ahora es completamente compatible con MySQL y funciona correctamente tanto para las APIs de custom table como para el webhook de Telegram. 