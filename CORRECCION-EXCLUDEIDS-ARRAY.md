# Corrección Error `excludeIds.map is not a function`

## Problema Identificado

Después de corregir las funciones MySQL, apareció un nuevo error:

```
Error obteniendo pregunta aleatoria: TypeError: excludeIds.map is not a function
```

## Causa Raíz

El método `getRandomQuestion` esperaba recibir un array de IDs, pero estaba recibiendo un **string JSON** directamente desde `stats.questionscompleted`.

## Cambios Realizados

### 1. Parseo de `questionscompleted` en `sendNextQuestion()`
```typescript
// ANTES (INCORRECTO)
const question = await this.getRandomQuestion(tableName, stats.questionscompleted);

// DESPUÉS (CORRECTO)
// Parsear questionscompleted como array
let completedQuestions: string[] = [];
try {
  completedQuestions = JSON.parse(stats.questionscompleted || "[]");
} catch (error) {
  console.error('Error parsing questionscompleted:', error);
  completedQuestions = [];
}

const question = await this.getRandomQuestion(tableName, completedQuestions);
```

### 2. Corrección en bloque de pregunta alternativa
```typescript
// ANTES (INCORRECTO)
const nextQuestion = await this.getRandomQuestion(tableName, stats.questionscompleted);

// DESPUÉS (CORRECTO)
// Parsear questionscompleted como array
let completedQuestions: string[] = [];
try {
  completedQuestions = JSON.parse(stats.questionscompleted || "[]");
} catch (error) {
  console.error('Error parsing questionscompleted:', error);
  completedQuestions = [];
}

const nextQuestion = await this.getRandomQuestion(tableName, completedQuestions);
```

## Resultado

- ✅ El método `getRandomQuestion` ahora recibe correctamente un array de strings
- ✅ Se maneja el error de parsing JSON de forma segura
- ✅ Se evita el error `excludeIds.map is not a function`

## Próximo Paso

Ahora el comando `/pdc1` debería poder obtener preguntas correctamente sin errores de tipo de datos. 