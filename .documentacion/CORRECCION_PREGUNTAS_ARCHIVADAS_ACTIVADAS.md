# 🔧 Corrección: Preguntas Archivadas Se Activaban Al Generar Preguntas del Documento Completo

## 📋 **Resumen del Problema**

**Problema reportado**: Al generar preguntas para el documento completo, las preguntas archivadas pasaban a mostrarse como activas.

**Causa raíz identificada**: Múltiples funciones llamaban a `fetchDocQuestions()` sin especificar el parámetro `showArchived`, lo que causaba que el filtro se perdiera y las preguntas archivadas aparecieran mezcladas con las activas.

## 🔍 **Análisis Técnico**

### **Funciones Problemáticas Identificadas:**

1. **`useEffect` principal** (línea 988):
   ```typescript
   // ❌ ANTES: No mantenía el filtro
   useEffect(() => {
     if (documentId) fetchDocQuestions();
   }, [documentId]);
   ```

2. **`useEffect` conflictivo** (línea 213):
   ```typescript
   // ❌ ANTES: Forzaba showArchived a false siempre
   useEffect(() => {
     if (documentId && currentDocument) {
       fetchDocQuestions({ 
         page: 1, 
         reset: true, 
         showArchived: false // Forzaba false
       });
     }
   }, [documentId, currentDocument]);
   ```

3. **Función `restoreAllDocQuestions`** (línea 820):
   ```typescript
   // ❌ ANTES: No especificaba showArchived
   fetchDocQuestions({ page: 1, reset: true });
   ```

4. **Función `handleSearchQuestions`** (línea 838):
   ```typescript
   // ❌ ANTES: No especificaba showArchived
   fetchDocQuestions({ page: 1, reset: true, search: term });
   ```

5. **Función `loadMoreQuestions`** (línea 793):
   ```typescript
   // ❌ ANTES: No especificaba showArchived
   fetchDocQuestions({ page: currentPage + 1 });
   ```

6. **Función `archiveAllDocQuestions`** (línea 804):
   ```typescript
   // ❌ ANTES: No especificaba showArchived
   fetchDocQuestions({ page: 1, reset: true });
   ```

7. **Botón de archivar individual** en `DocumentSectionSelector.tsx` (línea 897):
   ```typescript
   // ❌ ANTES: No especificaba showArchived
   fetchDocQuestions({ page: 1, reset: true });
   ```

8. **Botón de guardar edición** en `DocumentSectionSelector.tsx` (línea 966):
   ```typescript
   // ❌ ANTES: No especificaba showArchived
   fetchDocQuestions({ page: 1, reset: true });
   ```

## ✅ **Soluciones Implementadas**

### **1. useEffect Principal Corregido:**
```typescript
// ✅ DESPUÉS: Mantiene el filtro actual
useEffect(() => {
  if (documentId) fetchDocQuestions({ showArchived: showArchivedQuestions });
}, [documentId, showArchivedQuestions]);
```

### **2. useEffect Conflictivo Eliminado:**
```typescript
// ✅ ELIMINADO: Se eliminó completamente para evitar conflictos
```

### **3. Funciones de Gestión de Preguntas Corregidas:**
```typescript
// ✅ restoreAllDocQuestions
fetchDocQuestions({ page: 1, reset: true, showArchived: showArchivedQuestions });

// ✅ handleSearchQuestions
fetchDocQuestions({ page: 1, reset: true, search: term, showArchived: showArchivedQuestions });

// ✅ loadMoreQuestions
fetchDocQuestions({ page: currentPage + 1, showArchived: showArchivedQuestions });

// ✅ archiveAllDocQuestions
fetchDocQuestions({ page: 1, reset: true, showArchived: showArchivedQuestions });
```

### **4. Botones en DocumentSectionSelector.tsx Corregidos:**
```typescript
// ✅ Botón de archivar individual
fetchDocQuestions({ page: 1, reset: true, showArchived: showArchivedQuestions });

// ✅ Botón de guardar edición
fetchDocQuestions({ page: 1, reset: true, showArchived: showArchivedQuestions });
```

## 🎯 **Resultado Final**

### **✅ Comportamiento Corregido:**

1. **Al generar preguntas del documento completo**: Las nuevas preguntas se crean como activas y aparecen inmediatamente en la vista activa
2. **Las preguntas archivadas**: Se mantienen archivadas y solo aparecen cuando el usuario activa el filtro "Mostrar archivadas"
3. **Consistencia del filtro**: El estado del filtro se mantiene en todas las operaciones (buscar, cargar más, archivar, etc.)
4. **Sin conflictos**: Se eliminó el useEffect que forzaba `showArchived: false`

### **🔧 Funcionalidades Preservadas:**

- ✅ **Archivado de preguntas**: Sigue funcionando correctamente
- ✅ **Restauración de preguntas**: Mantiene el filtro actual
- ✅ **Búsqueda**: Respeta el filtro activo/archivado
- ✅ **Paginación**: Funciona con ambos tipos de preguntas
- ✅ **Persistencia en BD**: Todas las preguntas se mantienen en la base de datos

### **🚀 Beneficios:**

1. **Experiencia de usuario consistente**: No se muestran preguntas archivadas sin que el usuario lo solicite
2. **Filtros confiables**: El estado del filtro se mantiene en toda la aplicación
3. **Sin pérdida de datos**: Las preguntas archivadas se conservan intactas
4. **Flujo predecible**: Generar preguntas nuevas no afecta las preguntas archivadas

## 📝 **Archivos Modificados**

1. **`src/app/documents/[id]/page.tsx`**:
   - Corregidos 6 llamadas a `fetchDocQuestions`
   - Eliminado 1 `useEffect` conflictivo
   - Mejorado 1 `useEffect` principal

2. **`src/components/DocumentSectionSelector.tsx`**:
   - Corregidas 2 llamadas a `fetchDocQuestions`

## 🧪 **Pruebas Recomendadas**

Para verificar que la corrección funciona:

1. **Genera preguntas nuevas** para el documento completo
2. **Verifica** que solo aparecen las preguntas activas
3. **Activa el filtro** "Mostrar archivadas"
4. **Confirma** que las preguntas archivadas aparecen separadamente
5. **Desactiva el filtro** y confirma que vuelven a ocultarse
6. **Prueba** operaciones como buscar, cargar más, y archivar individual

---

**✅ Problema resuelto**: Las preguntas archivadas ya no se activan automáticamente al generar preguntas nuevas para el documento completo. 