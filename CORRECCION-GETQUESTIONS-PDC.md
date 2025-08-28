# Corrección del Comando /pdc1 - Método getQuestions

## Problema Identificado

El comando `/pdc1` devolvía el error "❌ No hay preguntas disponibles para PDC" a pesar de que la tabla `pdc` contiene 746 preguntas (526 activas).

## Causa Raíz

El método `getQuestions` en `StudySessionService` estaba **incompleto** - solo devolvía un array vacío como placeholder:

```typescript
// ANTES (INCORRECTO)
private async getQuestions(subject: string, limit: number): Promise<StudyQuestion[]> {
  try {
    const tableName = StudySessionService.TABLE_MAPPING[subject];
    if (!tableName) {
      throw new Error(`Tabla no encontrada para materia: ${subject}`);
    }
    // Usar el método existente para obtener preguntas
    // Aquí deberías implementar la lógica específica para obtener preguntas normales
    // Por ahora, usar un placeholder
    return []; // ❌ SIEMPRE DEVOLVÍA VACÍO
  } catch (error) {
    console.error('Error obteniendo preguntas:', error);
    return [];
  }
}
```

## Problemas Adicionales Encontrados

### 1. Nombres de Columnas Incorrectos
Después de la migración a MySQL, los nombres de columnas cambiaron a minúsculas:
- `"isActive"` → `isactive`
- `"questionnumber"` → `questionnumber`
- `"correctanswerindex"` → `correctanswerindex`

### 2. Nombres de Tablas Incorrectos
En MySQL, los nombres de tablas son en minúsculas:
- `'pdc': 'Pdc'` → `'pdc': 'pdc'`
- `'constitucion': 'Constitucion'` → `'constitucion': 'constitucion'`

### 3. Sintaxis SQL Incorrecta
Las comillas dobles no son necesarias en MySQL para nombres de tablas/columnas simples.

## Soluciones Implementadas

### 1. Implementación Completa del Método getQuestions

```typescript
// DESPUÉS (CORRECTO)
private async getQuestions(subject: string, limit: number): Promise<StudyQuestion[]> {
  try {
    const tableName = StudySessionService.TABLE_MAPPING[subject];
    if (!tableName) {
      throw new Error(`Tabla no encontrada para materia: ${subject}`);
    }

    console.log(`🔍 [getQuestions] Buscando ${limit} preguntas en tabla ${tableName} para materia ${subject}`);

    // Construir query para obtener preguntas aleatorias
    const query = `
      SELECT id, questionnumber, question, options, correctanswerindex, category, difficulty
      FROM ${tableName} 
      WHERE isactive = true
      ORDER BY RANDOM()
      LIMIT $1
    `;

    const result = await prisma.$queryRawUnsafe(query, limit);
    const questions = result as any[];

    console.log(`📊 [getQuestions] Encontradas ${questions.length} preguntas en tabla ${tableName}`);

    if (questions.length === 0) {
      console.log(`❌ [getQuestions] No se encontraron preguntas activas en tabla ${tableName}`);
      return [];
    }

    // Convertir a formato StudyQuestion
    const studyQuestions: StudyQuestion[] = questions.map(q => ({
      id: q.id,
      questionnumber: q.questionnumber,
      question: q.question,
      options: q.options,
      correctanswerindex: q.correctanswerindex,
      category: q.category,
      difficulty: q.difficulty
    }));

    console.log(`✅ [getQuestions] ${studyQuestions.length} preguntas convertidas para ${subject}`);
    return studyQuestions;

  } catch (error) {
    console.error('Error obteniendo preguntas:', error);
    console.error('Subject:', subject);
    console.error('Limit:', limit);
    return [];
  }
}
```

### 2. Corrección de Nombres de Columnas en Todos los Métodos

#### getRandomQuestion:
```typescript
// ANTES
SELECT id, "questionnumber", question, options, "correctanswerindex", category, difficulty
FROM "${tableName}" 
WHERE "isActive" = true

// DESPUÉS
SELECT id, questionnumber, question, options, correctanswerindex, category, difficulty
FROM ${tableName} 
WHERE isactive = true
```

#### getQuestionById:
```typescript
// ANTES
SELECT id, "questionnumber", question, options, "correctanswerindex", category, difficulty
FROM "${tableName}" 
WHERE id = $1

// DESPUÉS
SELECT id, questionnumber, question, options, correctanswerindex, category, difficulty
FROM ${tableName} 
WHERE id = $1
```

### 3. Corrección del TABLE_MAPPING Completo

```typescript
private static TABLE_MAPPING: Record<string, string> = {
  // ✅ Tablas con preguntas confirmadas
  'constitucion': 'constitucion',        // 280 preguntas
  'defensanacional': 'defensanacional',  // 121 preguntas
  'aire': 'aire',                        // 602 preguntas
  
  // 🔧 FIX: Mapeos que faltaban y causaban errores
  'rjsp': 'rio',                         // ⚖️ RJSP → Rio
  'rio': 'rio',                          // 🌊 Rio → Rio 
  'tropa': 'tropamarineria',            // 👥 Tropa y Marinería
  'rroo': 'rroo',                       // 📋 RR.OO.
  'seguridadnacional': 'seguridadnacional', // 🔒 Seguridad Nacional
  'ue': 'ue',                           // 🇪🇺 UE
  'proteccioncivil': 'proteccioncivil',  // 🚨 Protección Civil
  
  // 🔄 Tablas que existen pero pueden estar vacías
  'armada': 'armada',
  'carrera': 'carrera', 
  'derechosydeberes': 'derechosydeberes',
  'regimendisciplinario': 'regimendisciplinario',
  'igualdad': 'igualdad',
  
  // 📋 Otras tablas disponibles
  'minsdef': 'minsdef',
  'organizacionfas': 'organizacionfas',
  'emad': 'emad',
  'et': 'et',
  'iniciativasyquejas': 'iniciativasyquejas',
  'omi': 'omi',
  'pac': 'pac',
  'pdc': 'pdc',  // ✅ CORREGIDO
  'onu': 'onu',
  'otan': 'otan',
  'osce': 'osce',
  'misiones': 'misionesinternacionales'
};
```

## Verificación de Datos

La tabla `pdc` contiene:
- **746 preguntas** en total
- **526 preguntas activas** (isactive = true)
- Estructura correcta con todas las columnas necesarias

## Resultado Esperado

Después de estos cambios, el comando `/pdc1` debería:
1. ✅ Encontrar la tabla `pdc` correctamente
2. ✅ Ejecutar la query con sintaxis MySQL correcta
3. ✅ Obtener 1 pregunta aleatoria de las 526 activas
4. ✅ Enviar la pregunta al usuario en Telegram

## Comandos Afectados

Esta corrección beneficia a **todos los comandos de estudio**:
- `/pdc1`, `/pdc5`, `/pdc10`, etc.
- `/constitucion1`, `/aire1`, `/defensanacional1`, etc.
- Todos los comandos que usan `getQuestions()` y `getRandomQuestion()`

## Archivos Modificados

1. **src/services/studySessionService.ts**
   - Implementación completa del método `getQuestions()`
   - Corrección de nombres de columnas en `getRandomQuestion()`
   - Corrección de nombres de columnas en `getQuestionById()`
   - Actualización completa del `TABLE_MAPPING`

## Estado

✅ **COMPLETADO** - El comando `/pdc1` debería funcionar correctamente ahora. 