# Nueva Función Básica - Solución a Errores de Base de Datos

## Problema Identificado

Las funciones `debug_sql_queries()` y `ultra_simple_process()` estaban fallando con el error:
```
"Error al leer de la base de datos"
```

El error se producía específicamente cuando intentábamos acceder a la tabla `question`:
```php
$question = $DB->get_record('question', ['id' => $qa->questionid], 'id, name, category');
```

## Solución Implementada

### Nueva Función: `basic_process()`

Creé una nueva función que **evita completamente** el acceso a la tabla `question`, que parece ser la fuente del problema.

**Características principales:**

1. **Sin acceso a la tabla question**: No intenta leer información de nombres o categorías de preguntas
2. **Usa categoryid = 0**: Establece la categoría como 0 temporalmente para evitar el error
3. **Procesamiento directo**: Solo usa las tablas que sabemos que funcionan
4. **Información detallada**: Proporciona estados de cada pregunta para debug

### Flujo de la Nueva Función

```php
function basic_process($userid = null) {
    // 1. Obtener el intento de quiz más reciente
    $attempt = $DB->get_record_sql("SELECT * FROM {quiz_attempts} ...");
    
    // 2. Obtener question_attempts usando el uniqueid
    $qas = $DB->get_records('question_attempts', ['questionusageid' => $attempt->uniqueid]);
    
    // 3. Para cada question_attempt:
    foreach ($qas as $qa) {
        // 3a. Obtener el step más reciente
        $step = $DB->get_record_sql("SELECT * FROM {question_attempt_steps} ...");
        
        // 3b. Determinar si falló basado en el estado del step
        $is_failed = (strpos(strtolower($step->state), 'wrong') !== false || 
                     strpos(strtolower($step->state), 'incorrect') !== false ||
                     strpos(strtolower($step->state), 'partial') !== false);
        
        // 3c. Si falló, insertar en local_fqr_failed_questions
        if ($is_failed) {
            // SIN acceder a la tabla question
            $record->categoryid = 0; // Temporal
            $DB->insert_record('local_fqr_failed_questions', $record);
        }
    }
}
```

## Información de Debug Proporcionada

La función devuelve información completa para diagnóstico:

```json
{
  "user_id": "2",
  "attempt": "1714",
  "quiz": "61",
  "uniqueid": "1785",
  "question_attempts_found": 20,
  "states": [
    {
      "qa_id": "36212",
      "question_id": "16478",
      "state": "gradedwrong",
      "is_failed": true
    }
  ],
  "summary": {
    "total_question_attempts": 20,
    "failed_found": 17,
    "total_inserted": 17
  },
  "final_count": 17
}
```

## Cómo Usar

1. **Ir al plugin**: https://permanencia.opomelilla.com/local/failed_questions_recovery/index.php
2. **Buscar el botón**: 🎯 Básico (color azul primario)
3. **Hacer clic**: La función procesará el quiz más reciente
4. **Revisar resultados**: Debe mostrar cuántas preguntas falladas encontró e insertó

## Ventajas de esta Función

✅ **Evita errores de base de datos** al no acceder a la tabla problemática
✅ **Procesamiento directo** sin dependencias complejas de librerías de Moodle
✅ **Información detallada** para debug y verificación
✅ **Segura** - solo lee y escribe en tablas que sabemos que funcionan

## Limitaciones Temporales

❌ **categoryid = 0**: Las preguntas se guardan sin categoría específica
❌ **Solo nombres de ID**: No se guardan nombres legibles de preguntas

## Próximos Pasos

Si esta función funciona correctamente:

1. **Procesar todos los intentos históricos** con esta función segura
2. **Investigar** por qué la tabla `question` causa problemas
3. **Actualizar categorías** posteriormente una vez resuelto el problema principal
4. **Implementar el observer** usando esta lógica segura

## Versión del Plugin

- **Versión actualizada**: 2024122706 (v1.0.6)
- **Cambios**: Nueva función `basic_process()` y botón correspondiente

---

**Recomendación**: Probar la función "🎯 Básico" para verificar que puede capturar las 17 preguntas falladas sin errores de base de datos. 