# Corrección de Sintaxis MySQL - Parámetros de Consulta

## Problema Identificado

Después de implementar el método `getQuestions()`, apareció un nuevo error:

```
Error: Raw query failed. Code: `1327`. Message: `Undeclared variable: $1`
```

## Causa Raíz

El código estaba usando **sintaxis de PostgreSQL** para parámetros (`$1`, `$2`, etc.) pero la base de datos ahora es **MySQL** que usa `?` para parámetros.

## Cambios Realizados

### 1. Método getQuestions()
```typescript
// ANTES (PostgreSQL)
LIMIT $1

// DESPUÉS (MySQL)
LIMIT ?
```

### 2. Método getRandomQuestion()
```typescript
// ANTES (PostgreSQL)
const placeholders = excludeIds.map((_, index) => `$${index + 1}`).join(',');

// DESPUÉS (MySQL)
const placeholders = excludeIds.map(() => '?').join(',');
```

### 3. Método getQuestionById()
```typescript
// ANTES (PostgreSQL)
WHERE id = $1

// DESPUÉS (MySQL)
WHERE id = ?
```

### 4. Método hasUserEverStudied()
```typescript
// ANTES (PostgreSQL)
WHERE "userid" = $1

// DESPUÉS (MySQL)
WHERE userid = ?
```

### 5. Método getFailedQuestions()
```typescript
// ANTES (PostgreSQL)
WHERE sr."userid" = $1 
AND sr2."userid" = $1 
LIMIT $2

// DESPUÉS (MySQL)
WHERE sr.userid = ? 
AND sr2.userid = ? 
LIMIT ?

// Y el llamado cambió a:
await prisma.$queryRawUnsafe(query, userid, userid, limit)
```

### 6. Método checkIfQuestionJustGraduated()
```typescript
// ANTES (PostgreSQL)
WHERE sr2."userid" = ${userid}
'1970-01-01'::timestamp

// DESPUÉS (MySQL)
WHERE sr2.userid = ${userid}
'1970-01-01'
```

### 7. Método findQuestionByPollId()
```typescript
// ANTES (PostgreSQL)
SELECT * FROM "${tableName}" WHERE id = $1

// DESPUÉS (MySQL)
SELECT * FROM ${tableName} WHERE id = ?
```

## Correcciones Adicionales de Nombres de Tablas/Columnas

### Nombres de Tablas
- `"StudyResponse"` → `studyresponse`
- `"${tableName}"` → `${tableName}` (sin comillas)

### Nombres de Columnas
- `"userid"` → `userid`
- `"questionid"` → `questionid`
- `"iscorrect"` → `iscorrect`
- `"answeredAt"` → `answeredat`

## Resultado

Después de estos cambios, el comando `/pdc1` debería funcionar correctamente con MySQL.

## Archivos Modificados

1. **src/services/studySessionService.ts**
   - Todos los métodos que usan `$queryRawUnsafe`
   - Corrección de sintaxis de parámetros PostgreSQL → MySQL
   - Corrección de nombres de tablas y columnas

## Estado

✅ **COMPLETADO** - Sintaxis MySQL corregida en todos los métodos. 