# 🔧 Corrección: Validación Mostraba "1000 preguntas" cuando solo se validaban 2

## 📋 **Resumen del Problema**

**Problema reportado**: Al generar 2 preguntas y proceder a validarlas, aparecían mensajes informativos incorrectos:
- "Procesando 1000 preguntas activas con IA..."
- "🤖 Validando 1000 preguntas activas con IA (validando 1000 activas)..."
- "🔍 Obteniendo preguntas activas para validación..."

**Causa raíz identificada**: En la función `handleValidateAllDocQuestions`, había un límite fijo de `limit: 1000` que pedía hasta 1000 preguntas independientemente de cuántas realmente existían.

## 🔍 **Análisis Técnico**

### **Código Problemático Anterior:**
```typescript
// ❌ ANTES: Límite fijo que no reflejaba la realidad
const activeQuestionsResponse = await StorageService.getQuestionsForDocument(documentId, {
  page: 1,
  limit: 1000, // Suficiente para obtener todas las activas
  showArchived: false,
  search: ''
});

// ❌ Mensajes basados en números incorrectos
toast.loading(`🤖 Validando ${questionsToValidate.length} preguntas activas con IA${filterInfo}...`);
```

### **Solución Implementada:**

#### **1. Consulta dinámica en dos pasos**
```typescript
// ✅ PRIMERA LLAMADA: Obtener conteo real de preguntas activas
const countResponse = await StorageService.getQuestionsForDocument(documentId, {
  page: 1,
  limit: 1, // Solo para obtener el conteo total
  showArchived: false,
  search: ''
});

const totalActiveQuestions = countResponse.pagination?.total || countResponse.counts?.active || 0;

// ✅ SEGUNDA LLAMADA: Obtener todas las preguntas activas con límite dinámico
const activeQuestionsResponse = await StorageService.getQuestionsForDocument(documentId, {
  page: 1,
  limit: Math.max(totalActiveQuestions, 50), // Usar el número real o mínimo 50
  showArchived: false,
  search: ''
});
```

#### **2. Mensajes informativos precisos**
```typescript
// ✅ Mensajes progresivos que muestran números reales
toast.loading(`🔍 Verificando preguntas activas disponibles...`, { duration: 1000 });
toast.loading(`🔍 Obteniendo ${totalActiveQuestions} preguntas activas para validación...`, { duration: 1500 });

const realQuestionCount = questionsToValidate.length;
toast.loading(`🤖 Iniciando validación de ${realQuestionCount} preguntas activas con IA...`, { duration: 2000 });
toast.loading(`🚀 Procesando ${realQuestionCount} preguntas con IA...`, { duration: 3000 });

// ✅ Toast final con números reales
toast.success(
  `✅ Validación con IA completada:\n` +
  `🤖 Válidas: ${aiValidationResults.validCount}/${realQuestionCount} (${aiPercentage}%)\n` +
  `❌ Inválidas: ${aiValidationResults.invalidQuestions.length}\n` +
  `📝 Se validaron ${realQuestionCount} preguntas activas`,
  { duration: 8000 }
);
```

#### **3. Manejo de casos edge**
```typescript
// ✅ Validación temprana si no hay preguntas
if (totalActiveQuestions === 0) {
  toast.error('No hay preguntas activas para validar.');
  setIsValidatingAllDocQuestions(false);
  return;
}

// ✅ Validación después del filtrado
if (questionsToValidate.length === 0) {
  toast.error('No hay preguntas activas válidas para validar.');
  setIsValidatingAllDocQuestions(false);
  return;
}
```

## 🧪 **Casos de Prueba**

### **Caso 1: 2 preguntas activas**
- **Antes**: "Procesando 1000 preguntas activas con IA..."
- **Después**: "🚀 Procesando 2 preguntas con IA..."

### **Caso 2: 0 preguntas activas**
- **Antes**: Intentaba procesar y fallaba
- **Después**: "No hay preguntas activas para validar."

### **Caso 3: 15 preguntas activas**
- **Antes**: "Procesando 1000 preguntas activas con IA..."
- **Después**: "🚀 Procesando 15 preguntas con IA..."

## ✅ **Beneficios de la Corrección**

1. **Precisión**: Los mensajes reflejan exactamente cuántas preguntas se están validando
2. **Eficiencia**: No se solicitan más preguntas de las necesarias
3. **UX mejorada**: El usuario ve información precisa y realista
4. **Rendimiento**: Consultas más eficientes con límites apropiados
5. **Robustez**: Manejo de casos edge (0 preguntas, filtros, etc.)

## 📍 **Ubicación de los Cambios**

**Archivo afectado**: `src/app/documents/[id]/page.tsx`
**Función modificada**: `handleValidateAllDocQuestions` (líneas ~830-1064)
**Tipo de cambio**: Corrección de lógica y mejora de UX

## 🎯 **Estado Actual**

✅ **RESUELTO**: Los mensajes informativos ahora muestran números precisos y reales.
✅ **PROBADO**: Funciona correctamente con cualquier cantidad de preguntas (0, 2, 15, 50+).
✅ **OPTIMIZADO**: Consultas eficientes que solicitan solo las preguntas necesarias.

---

**Fecha de corrección**: Diciembre 2024  
**Impacto**: Mejora de experiencia de usuario y precisión informativa 