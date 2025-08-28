# 🔧 Solución: Preguntas no aparecían después de generarlas

## 🚨 **Problema Reportado**
Cuando se generan preguntas para el documento completo, las preguntas no se muestran automáticamente en la interfaz hasta que se refresca la página manualmente.

## 🔍 **Causa del Problema**
En la función `handleGenerateQuestions()` (línea ~487 de `src/app/documents/[id]/page.tsx`), después de guardar las nuevas preguntas en la base de datos, **NO se estaba actualizando el estado local** que contiene las preguntas para mostrar en la UI.

### **Código Problemático (ANTES)**:
```typescript
// Guardar en la base de datos SOLO en Question (sectionId: null)
const newDocQuestions = validDocQuestions.map((q: string) => ({ 
  documentId, content: q, type: 'gift', difficulty: 'medium', 
  bloomLevel: null, sectionId: null, archived: false, lastScheduledSendAt: null 
}));
await Promise.all(newDocQuestions.map(q => StorageService.addQuestion(q)));
setIsGenerating(false); // ❌ Faltaba actualizar el estado de preguntas
```

## ✅ **Solución Implementada**

Agregada llamada a `fetchDocQuestions()` para actualizar el estado después de guardar las preguntas:

### **Código Corregido (DESPUÉS)**:
```typescript
// Guardar en la base de datos SOLO en Question (sectionId: null)
const newDocQuestions = validDocQuestions.map((q: string) => ({ 
  documentId, content: q, type: 'gift', difficulty: 'medium', 
  bloomLevel: null, sectionId: null, archived: false, lastScheduledSendAt: null 
}));
await Promise.all(newDocQuestions.map(q => StorageService.addQuestion(q)));

// ✅ CORRECCIÓN: Actualizar la lista de preguntas después de generar nuevas
await fetchDocQuestions({ page: 1, reset: true });

setIsGenerating(false);
```

## 🎯 **Resultado**
- ✅ **Las preguntas aparecen inmediatamente** después de generarlas
- ✅ **No es necesario refrescar** la página manualmente
- ✅ **El estado se actualiza correctamente** con las nuevas preguntas
- ✅ **La paginación se resetea** para mostrar desde la primera página

## 📝 **Explicación Técnica**

1. **Generación**: Se generan y validan las preguntas del documento
2. **Guardado**: Se guardan en la base de datos usando `StorageService.addQuestion()`
3. **Actualización**: Se llama a `fetchDocQuestions({ page: 1, reset: true })` para:
   - Recargar las preguntas desde la BD
   - Resetear la paginación a la página 1
   - Actualizar el estado `docQuestionsDB`
4. **Visualización**: La UI se re-renderiza automáticamente con las nuevas preguntas

## 🔧 **Archivo Modificado**
- `src/app/documents/[id]/page.tsx` - Línea ~490

## 🚀 **Estado**
✅ **PROBLEMA SOLUCIONADO** - Las preguntas del documento completo ahora aparecen inmediatamente después de la generación. 