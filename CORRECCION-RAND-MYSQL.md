# Corrección de Función RANDOM() → RAND() para MySQL

## Problema Identificado

Después de corregir la sintaxis de parámetros, apareció un nuevo error:

```
Error: FUNCTION u449034524_moodel_telegra.RANDOM does not exist
```

## Causa Raíz

El código estaba usando `RANDOM()` que es la función de PostgreSQL para obtener resultados aleatorios, pero en **MySQL** la función correcta es `RAND()`.

## Cambios Realizados

### 1. Método getQuestions()
```sql
-- ANTES (PostgreSQL)
ORDER BY RANDOM()

-- DESPUÉS (MySQL)
ORDER BY RAND()
```

### 2. Método getRandomQuestion()
```sql
-- ANTES (PostgreSQL)
ORDER BY RANDOM() LIMIT 1

-- DESPUÉS (MySQL)
ORDER BY RAND() LIMIT 1
```

### 3. Método getRandomUnusedQuestion()
```sql
-- ANTES (PostgreSQL)
ORDER BY RANDOM() LIMIT 1

-- DESPUÉS (MySQL)
ORDER BY RAND() LIMIT 1
```

### 4. MilitarySimulationService
```sql
-- ANTES (PostgreSQL)
ORDER BY RANDOM()
LIMIT $1

-- DESPUÉS (MySQL)
ORDER BY RAND()
LIMIT ?
```

## Diferencias entre PostgreSQL y MySQL

| Función | PostgreSQL | MySQL |
|---------|------------|-------|
| Ordenar aleatoriamente | `ORDER BY RANDOM()` | `ORDER BY RAND()` |
| Parámetros | `$1, $2, $3` | `?, ?, ?` |
| Nombres de columnas | `"columnName"` | `columnname` |
| Cast de tipos | `'date'::timestamp` | `'date'` |

## Archivos Modificados

1. **src/services/studySessionService.ts**
   - `getQuestions()`: `RANDOM()` → `RAND()`
   - `getRandomQuestion()`: `RANDOM()` → `RAND()`
   - `getRandomUnusedQuestion()`: `RANDOM()` → `RAND()`

2. **src/services/militarySimulationService.ts**
   - `selectQuestionsWithDistribution()`: `RANDOM()` → `RAND()`

## Resultado Esperado

Después de estos cambios, el comando `/pdc1` debería:
1. ✅ Encontrar la tabla `pdc` correctamente
2. ✅ Usar parámetros MySQL (`?`) correctamente
3. ✅ Usar función `RAND()` correctamente
4. ✅ Obtener 1 pregunta aleatoria de las 526 activas
5. ✅ Enviar la pregunta al usuario en Telegram

## Estado

✅ **COMPLETADO** - Función RANDOM() corregida a RAND() para MySQL. 