# Errores de Migración PostgreSQL → MySQL - Soluciones

## Resumen
Este documento contiene todos los errores encontrados después de migrar de PostgreSQL a MySQL y sus respectivas soluciones.

## Errores Corregidos ✅

### 1. Propiedades de UserResponse
**Error**: `responsetime` no existe en tipo `UserResponse`
**Solución**: Cambiar `responsetime` por `responseTime` (camelCase)

### 2. Propiedades de TelegramUserStats
**Error**: Propiedades como `telegramuserid`, `firstname`, `totalpoints` no existen
**Solución**: Usar camelCase: `telegramUserId`, `firstName`, `totalPoints`

### 3. Propiedades de SimulacroQuestion
**Error**: `questionnumber`, `correctanswerindex` no existen
**Solución**: Usar camelCase: `questionNumber`, `correctAnswerIndex`

### 4. Relaciones de Prisma
**Error**: `include: { achievement: true }` no funciona en MySQL con relationMode="prisma"
**Solución**: Remover el `include` y hacer consultas separadas si es necesario

### 5. Propiedades de resultado de simulacro
**Error**: `result.iscorrect` no existe
**Solución**: Usar `result.isCorrect`

## Errores Pendientes ⏳

### Variables de Scope
- `pollId` vs `pollid`
- `isCorrect` vs `iscorrect`
- `userId` vs `userid`
- `fromUser` vs `fromtelegramuser`

### Propiedades de DuelStats
- `questionscount` → `questionsCount`

### Propiedades de Base de Datos
- `lastSuccessfulSendAt` → `lastsuccessfulsendat`
- `timeLimit` → `timelimit`
- `questionId` → `questionid`
- `isCorrect` → `iscorrect`

### Tipos de Prisma
- Campos faltantes en `simulacroresponseCreateManyInput`
- Tipos de array vs string en opciones de poll

## Patrón de Corrección

1. **Nombres de Propiedades**: MySQL usa snake_case, TypeScript usa camelCase
2. **Relaciones**: En MySQL con relationMode="prisma", las relaciones deben manejarse manualmente
3. **Variables de Scope**: Asegurar que las variables estén definidas en el contexto correcto
4. **Tipos de Prisma**: Regenerar tipos después de cambios de esquema

## Comandos Útiles

```bash
# Regenerar cliente de Prisma
npx prisma generate

# Verificar esquema
npx prisma db pull

# Validar migraciones
npx prisma migrate status
```

## Notas de Implementación

- Los errores se concentran principalmente en `src/app/api/telegram/webhook/route.ts`
- La mayoría son inconsistencias entre naming conventions
- Algunos errores requieren cambios en el esquema de Prisma
- Las funciones de duelo y simulacro son las más afectadas 