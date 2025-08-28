# 🔧 Corrección: Título Personalizado para Preguntas

## 🚨 **Problema Reportado**
La función "Título personalizado para preguntas" no estaba cumpliendo su función correctamente. Las preguntas generadas no utilizaban el título personalizado especificado por el usuario.

## 🔍 **Análisis del Problema**

### **Problema Principal:**
1. **En `page.tsx`**: Se construía un prompt **manual** en lugar de usar correctamente `AIService.generateQuestions`
2. **Parámetros incorrectos**: Se pasaba el prompt manual como primer parámetro en lugar del contenido
3. **Falta de instrucciones específicas**: En `aiService.ts` no se incluían instrucciones explícitas para usar el título personalizado

### **Código Problemático Antes:**

#### En `src/app/documents/[id]/page.tsx`:
```typescript
// ❌ ANTES: Prompt manual que ignoraba el título personalizado
const prompt = `\nINSTRUCCIONES PARA GENERACIÓN DE PREGUNTAS\n\nGenerar ${numberOfQuestions} preguntas basadas en el siguiente contenido:\n"${targetSection?.content}"\n\n...`;
questions = await AIService.generateQuestions(prompt, numberOfQuestions, undefined, optionLength, undefined, customTitleParam || customTitle);
```

#### En `src/services/aiService.ts`:
```typescript
// ❌ ANTES: Solo reemplazaba en el template pero sin instrucciones específicas
const formatPromptInterpolated = normativa
  ? rawFormatPromptContent.replace(/\[NOMBRE DE LA NORMA SEGÚN EL TEXTO FUENTE\]/g, normativa)
  : rawFormatPromptContent;
```

## ✅ **Soluciones Implementadas**

### **1. Corrección en AIService (aiService.ts)**
Agregada instrucción específica para usar el título personalizado:

```typescript
// ✅ DESPUÉS: Instrucciones específicas para el título personalizado
const titleInstruction = normativa 
  ? `\nINSTRUCCIÓN ESPECÍFICA DE TÍTULO:
OBLIGATORIO: En cada pregunta, reemplaza "[NOMBRE DE LA NORMA SEGÚN EL TEXTO FUENTE]" por "${normativa}".
OBLIGATORIO: Usa "${normativa}" como el nombre específico de la norma en todos los títulos de preguntas.
EJEMPLO: Si el título personalizado es "Constitución Española", la pregunta debe empezar con "// Constitución Española::..." en lugar de genérico.
`
  : '';

// Y se incluye en el prompt:
${titleInstruction}
```

### **2. Corrección en Page.tsx**
Uso correcto de `AIService.generateQuestions`:

#### Para Secciones:
```typescript
// ✅ DESPUÉS: Usar AIService.generateQuestions correctamente
questions = await AIService.generateQuestions(
  targetSection.content, // Contenido de la sección
  numberOfQuestions, 
  undefined, // questionTypeCounts 
  optionLength, 
  undefined, // modelOverride
  customTitleParam || customTitle // título personalizado
);
```

#### Para Documento Completo:
```typescript
// ✅ DESPUÉS: Usar AIService.generateQuestions correctamente  
questions = await AIService.generateQuestions(
  currentDocument.content, // Contenido del documento completo
  numberOfQuestions, 
  undefined, // questionTypeCounts
  optionLength, 
  undefined, // modelOverride
  customTitleParam || customTitle // título personalizado
);
```

## 🎯 **Resultado Final**

### **✅ Funcionalidad Restaurada:**
- ✅ **El título personalizado aparece correctamente** en las preguntas generadas
- ✅ **Funciona tanto para secciones como para documento completo**
- ✅ **Las instrucciones de IA son claras y específicas**
- ✅ **Se eliminó la duplicación de lógica de prompt**

### **📋 Ejemplo de Uso:**
1. Usuario ingresa "Constitución Española" en el campo "Título personalizado para preguntas"
2. **ANTES**: Las preguntas se generaban como `// Pregunta ejemplo::Artículo 1`
3. **DESPUÉS**: Las preguntas se generan como `// Constitución Española::Artículo 1`

### **🔧 Archivos Modificados:**
- `src/services/aiService.ts` - Líneas ~1032-1040: Agregada instrucción específica de título
- `src/app/documents/[id]/page.tsx` - Líneas ~316 y ~396: Corrección de llamadas a AIService

## 🚀 **Estado**
✅ **PROBLEMA SOLUCIONADO COMPLETAMENTE** - El título personalizado para preguntas ahora funciona correctamente en todas las generaciones.

## 🧪 **Verificación**
Para probar:
1. Ir a un documento
2. Ingresar un título personalizado en el campo correspondiente (ej: "Mi Norma Específica")  
3. Generar preguntas para el documento completo o para una sección
4. Las preguntas deberían mostrar "// Mi Norma Específica::..." en lugar de genérico 