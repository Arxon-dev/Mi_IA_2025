# Corrección Error Table 'Pdc' doesn't exist

## Problema Identificado

A pesar de haber corregido los errores anteriores, persistía el error:

```
Raw query failed. Code: `1146`. Message: `Table 'u449034524_moodel_telegra.Pdc' doesn't exist`
```

## Causa Raíz

El problema era una **inconsistencia en el mapeo de tablas**:

1. ✅ `getQuestions()` usaba `TABLE_MAPPING` correctamente → encontraba tabla `pdc` (minúscula)
2. ❌ `getRandomQuestion()` recibía nombre de tabla desde `STUDY_COMMANDS` → buscaba tabla `Pdc` (mayúscula)

### Mapeos Conflictivos:
```typescript
// STUDY_COMMANDS (PascalCase - INCORRECTO para MySQL)
'/pdc': 'Pdc'

// TABLE_MAPPING (lowercase - CORRECTO para MySQL)  
'pdc': 'pdc'
```

## Cambios Realizados

### 1. Corrección en `sendNextQuestion()`
```typescript
// ANTES (INCORRECTO)
const commandKey = `/${session.subject}`;
const tableName = STUDY_COMMANDS[commandKey as keyof typeof STUDY_COMMANDS];

// DESPUÉS (CORRECTO)
const tableName = StudySessionService.TABLE_MAPPING[session.subject];
```

### 2. Corrección en bloque de pregunta alternativa
```typescript
// ANTES (INCORRECTO)
const commandKey = `/${session.subject}`;
const tableName = STUDY_COMMANDS[commandKey as keyof typeof STUDY_COMMANDS];

// DESPUÉS (CORRECTO)
const tableName = StudySessionService.TABLE_MAPPING[session.subject];
```

## Resultado

- ✅ Ambos métodos ahora usan `TABLE_MAPPING` consistentemente
- ✅ Todos los nombres de tablas son lowercase (compatible con MySQL)
- ✅ Se elimina la inconsistencia entre `getQuestions()` y `getRandomQuestion()`

## Próximo Paso

Ahora el comando `/pdc1` debería funcionar completamente sin errores de tabla inexistente. 