
# 📊 REPORTE DE CUMPLIMIENTO DE LIMITACIONES DE TELEGRAM (MEJORADO)

**Fecha de análisis:** 31/5/2025, 20:44:26

## 🎯 RESUMEN EJECUTIVO

- **Total de preguntas analizadas:** 7123
- **Preguntas válidas para Telegram:** 100 (1.40%)
- **Preguntas inválidas:** 7023 (98.60%)

## 📋 LIMITACIONES DE TELEGRAM PARA POLLS

- **Pregunta:** Máximo 200 caracteres (sin truncamiento)
- **Opciones:** Máximo 100 caracteres cada una (sin truncamiento)
- **Explicaciones:** Máximo 200 caracteres (acepta truncamiento)
- **Cantidad de opciones:** Entre 2 y 10 opciones

## 🔧 FORMATOS ANALIZADOS

Este análisis mejorado puede procesar:
- ✅ **JSON estándar** - Formato estructurado con campos question/options
- ✅ **Formato GIFT (Moodle)** - Formato de texto con sintaxis especial
- ❌ **Formatos no reconocidos** - Contenido que no sigue ningún patrón conocido


## 📈 TABLA: Question

### Estadísticas Generales
- **Total:** 7023 preguntas
- **Válidas para Telegram:** 0 (0.00%)
- **Inválidas:** 7023 (100.00%)

### Distribución por Formato
- **JSON:** 0 preguntas
- **GIFT (Moodle):** 2 preguntas
- **No reconocido:** 7021 preguntas

### Tipos de Errores Encontrados
- **Pregunta demasiado larga:** 2
- **Opciones demasiado largas:** 2
- **Explicación demasiado larga:** 0
- **Formato inválido:** 7021
- **Datos faltantes:** 0

### Ejemplos de Preguntas Válidas

### Ejemplos de Preguntas Inválidas

**Ejemplo 1:**
- ID: c9fec0f4-5ec6-4aaa-bea8-fed767f02283
- Formato: N/A
- Pregunta: N/A
- Errores: Formato no reconocido (ni JSON ni GIFT)

**Ejemplo 2:**
- ID: e16e7d9e-62b1-4baa-8596-0a770444a7e5
- Formato: N/A
- Pregunta: N/A
- Errores: Formato no reconocido (ni JSON ni GIFT)

**Ejemplo 3:**
- ID: d3397071-722e-49bc-8460-78125d3b244f
- Formato: N/A
- Pregunta: N/A
- Errores: Formato no reconocido (ni JSON ni GIFT)

**Ejemplo 4:**
- ID: abd4ad7c-2d0f-46bd-9690-4e71faf591c2
- Formato: N/A
- Pregunta: N/A
- Errores: Formato no reconocido (ni JSON ni GIFT)

**Ejemplo 5:**
- ID: 6b7bebb8-483f-4203-9e33-027c45a58bcc
- Formato: N/A
- Pregunta: N/A
- Errores: Formato no reconocido (ni JSON ni GIFT)

## 📈 TABLA: ValidQuestion

### Estadísticas Generales
- **Total:** 0 preguntas
- **Válidas para Telegram:** 0 (0.00%)
- **Inválidas:** 0 (100.00%)

### Tipos de Errores Encontrados
- **Pregunta demasiado larga:** 0
- **Opciones demasiado largas:** 0
- **Explicación demasiado larga:** 0
- **Formato inválido:** 0
- **Datos faltantes:** 0

### Ejemplos de Preguntas Válidas

## 📈 TABLA: ExamenOficial2018

### Estadísticas Generales
- **Total:** 100 preguntas
- **Válidas para Telegram:** 100 (100.00%)
- **Inválidas:** 0 (0.00%)

### Tipos de Errores Encontrados
- **Pregunta demasiado larga:** 0
- **Opciones demasiado largas:** 0
- **Explicación demasiado larga:** 0
- **Formato inválido:** 0
- **Datos faltantes:** 0

### Ejemplos de Preguntas Válidas

**Ejemplo 1:**
- ID: c6fb193a-c524-4c9f-8ff0-11784c27f63b
- Formato: N/A
- Pregunta: ¿Cuál es la capital de España?
- Opciones: 4
- Explicación: No

**Ejemplo 2:**
- ID: 90fa2313-e609-4992-8ed9-47aeb067cae1
- Formato: N/A
- Pregunta: ¿En qué año se aprobó la Constitución Española actual?
- Opciones: 4
- Explicación: No

**Ejemplo 3:**
- ID: ca8d575e-4ed5-4ba8-842e-e52a344da739
- Formato: N/A
- Pregunta: ¿Cuántas comunidades autónomas tiene España?
- Opciones: 4
- Explicación: No

**Ejemplo 4:**
- ID: 1a8063c5-12f8-4606-adf2-65e136debfae
- Formato: N/A
- Pregunta: ¿Quién es el Jefe del Estado en España?
- Opciones: 4
- Explicación: No

**Ejemplo 5:**
- ID: f8e8c7ef-6462-4eae-85c7-f301c49cf77a
- Formato: N/A
- Pregunta: ¿Cuál es el río más largo de España?
- Opciones: 4
- Explicación: No

## 💡 RECOMENDACIONES ESPECÍFICAS

### Para la Tabla Question (Formato GIFT)

1. **Preguntas válidas identificadas:** 0 de 7023

2. **Principales problemas detectados:**
   - Preguntas que exceden 200 caracteres
   - Opciones que exceden 100 caracteres
   - Formato GIFT mal estructurado

3. **Acciones recomendadas:**
   - Migrar preguntas válidas a la tabla ValidQuestion
   - Implementar truncamiento inteligente para preguntas/opciones largas
   - Mejorar el parser GIFT para casos especiales

### Para Optimizar el Uso

1. **Priorizar ExamenOficial2018:** 100.0% de válidas

2. **Migrar preguntas Question válidas:** Procesar las 0 preguntas válidas encontradas

3. **Implementar validación en tiempo real:** Evitar que se guarden preguntas que no cumplen los límites

### Tabla con Mejor Rendimiento

**ExamenOficial2018** tiene el mejor rendimiento con 100.00% de preguntas válidas.

### Plan de Migración Sugerido

1. **Fase 1:** Usar las 100 preguntas de ExamenOficial2018 (100% válidas)

2. **Fase 2:** Procesar y migrar las 0 preguntas válidas de la tabla Question

3. **Fase 3:** Implementar herramientas de corrección automática para preguntas con errores menores

4. **Fase 4:** Establecer pipeline de validación para nuevas preguntas

### Total de Preguntas Disponibles para Telegram

**100 preguntas listas para usar** de un total de 7123 analizadas.

---

*Reporte generado automáticamente el 31/5/2025, 20:44:26*
*Análisis mejorado con soporte para formatos JSON y GIFT*
