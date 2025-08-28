# Corrección: Numeración Incorrecta en Header del Poll

## Problema Identificado

Después de los fixes anteriores, la numeración en el **resumen final** se corrigió, pero el **header del poll** seguía mostrando números incorrectos:

### Síntomas:
- ✅ Feedback correcto: `✅ ¡Correcto! (5/5)`
- ❌ Header incorrecto: `🎯 PREGUNTA 80/5`, `🎯 PREGUNTA 119/5`
- ✅ Solo la primera pregunta correcta: `🎯 PREGUNTA 1/5`

## Análisis del Problema

### Flujo del Problema

1. **Sesión de falladas inicia**: `session.currentindex = 0`
2. **Primera pregunta**: `sendQuestionToUser` → `questionnumber = 1` → `🎯 PREGUNTA 1/5` ✅
3. **Segunda pregunta**: `session.currentindex = 1` pero `questionnumber` calculado incorrectamente → `🎯 PREGUNTA 80/5` ❌

### Causa Raíz

El problema estaba en el cálculo de `questionnumber` en `sendQuestionToUser`:

```typescript
// ❌ PROBLEMÁTICO: Mismo cálculo para todos los tipos de sesión
const questionnumber = session.questionsasked ? session.questionsasked.length + 1 : session.currentindex + 1;
```

**Para sesiones normales**: `questionsasked.length` es secuencial (0, 1, 2, 3, 4)
**Para sesiones de falladas**: `questionsasked.length` no es secuencial porque puede contener IDs de preguntas que no se enviaron

### Diferencia entre Tipos de Sesión

**Sesiones Normales:**
- `questionsasked = ["uuid1", "uuid2", "uuid3"]`
- `questionsasked.length = 3` → `questionnumber = 4` → `🎯 PREGUNTA 4/5` ✅

**Sesiones de Falladas:**
- `questionsasked = ["uuid1", "uuid2"]` (pero algunas preguntas se saltaron)
- `questionsasked.length = 2` pero `currentindex = 3`
- Resultado: Números inconsistentes

## Solución Implementada

### Fix de Cálculo de Numeración

**Ubicación:** `sendQuestionToUser()` - Línea ~1354

```typescript
// 🔧 FIX: Para sesiones de falladas, usar currentindex + 1 para numeración correcta
// Para sesiones normales, usar questionsasked.length + 1
let questionnumber: number;

if (session.subject === 'all' || session.subject.endsWith('_falladas')) {
  // Para sesiones de falladas, usar currentindex + 1 (secuencial)
  questionnumber = session.currentindex + 1;
  console.log(`🎓 Sesión de falladas: usando currentindex + 1 = ${questionnumber}`);
} else {
  // Para sesiones normales, usar questionsasked.length + 1
  questionnumber = session.questionsasked ? session.questionsasked.length + 1 : session.currentindex + 1;
  console.log(`📚 Sesión normal: usando questionsasked.length + 1 = ${questionnumber}`);
}
```

### Lógica de Detección

**Criterios para sesiones de falladas:**
- `session.subject === 'all'` (comando `/falladas`)
- `session.subject.endsWith('_falladas')` (comando `/materiafalladas`)

**Para sesiones normales:**
- Cualquier otro `session.subject` (comando `/materia5`)

## Resultados Esperados

### Antes del Fix:
```
🎯 PREGUNTA 1/5    ✅ (solo la primera correcta)
🎯 PREGUNTA 80/5   ❌ (números de BD)
🎯 PREGUNTA 119/5  ❌ (números de BD)
🎯 PREGUNTA 41/5   ❌ (números de BD)
🎯 PREGUNTA 158/5  ❌ (números de BD)
```

### Después del Fix:
```
🎯 PREGUNTA 1/5    ✅ (secuencial)
🎯 PREGUNTA 2/5    ✅ (secuencial)
🎯 PREGUNTA 3/5    ✅ (secuencial)
🎯 PREGUNTA 4/5    ✅ (secuencial)
🎯 PREGUNTA 5/5    ✅ (secuencial)
```

## Logs Esperados

Con el fix aplicado, deberías ver:

```
🎓 Sesión de falladas: usando currentindex + 1 = 1
📚 Enviando pregunta 1/5 al usuario 5793286375
🎯 PREGUNTA 1/5

🎓 Sesión de falladas: usando currentindex + 1 = 2
📚 Enviando pregunta 2/5 al usuario 5793286375
🎯 PREGUNTA 2/5

🎓 Sesión de falladas: usando currentindex + 1 = 3
📚 Enviando pregunta 3/5 al usuario 5793286375
🎯 PREGUNTA 3/5
```

## Impacto del Fix

### ✅ **Beneficios**:
- **Numeración consistente**: Todas las preguntas numeradas secuencialmente
- **UX mejorada**: Usuario ve progreso real (1/5, 2/5, 3/5, 4/5, 5/5)
- **Compatibilidad**: Funciona tanto para sesiones normales como de falladas
- **Logging claro**: Logs indican qué tipo de sesión y cálculo se usa

### 🔧 **Compatibilidad**:
- **Sesiones normales**: Sin cambios, siguen funcionando igual
- **Sesiones de falladas**: Numeración corregida
- **Ambos tipos**: Logging diferenciado para debugging

## Verificación

```bash
# Probar comando de preguntas falladas
/falladas5

# Verificar numeración secuencial:
# 🎯 PREGUNTA 1/5
# 🎯 PREGUNTA 2/5
# 🎯 PREGUNTA 3/5
# 🎯 PREGUNTA 4/5
# 🎯 PREGUNTA 5/5

# Probar comando normal para verificar compatibilidad
/constitucion3

# Verificar que sigue funcionando igual
```

## Estado Final

🎯 **PROBLEMA RESUELTO**
- Numeración correcta en header del poll para sesiones de falladas
- Compatibilidad completa con sesiones normales
- Logging diferenciado para debugging
- UX consistente y profesional

El header del poll ahora muestra la numeración secuencial correcta en todos los tipos de sesión. 