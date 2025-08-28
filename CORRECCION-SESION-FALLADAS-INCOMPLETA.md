# Corrección: Sesiones de Falladas Incompletas

## Problema Identificado

Las sesiones de preguntas falladas se iniciaban correctamente pero **solo enviaban la primera pregunta** en lugar de las 5 solicitadas.

### Síntomas:
- Usuario envía `/falladas5`
- Bot confirma: "📊 Preguntas falladas: 5"
- Bot envía: "🎯 PREGUNTA 1/5"
- Usuario responde correctamente
- Bot envía feedback: "❌ Incorrecto (1/5)"
- **❌ No se envía la PREGUNTA 2/5**

## Análisis del Problema

### Flujo Correcto vs Problemático

**✅ Flujo Esperado:**
```
1. /falladas5 → getFailedQuestions() → [pregunta1, pregunta2, pregunta3, pregunta4, pregunta5]
2. sendNextFailedQuestion(sessionId, failedQuestions) → Envía pregunta1
3. Usuario responde → processPollAnswer() → sendNextFailedQuestion() → Envía pregunta2
4. Usuario responde → processPollAnswer() → sendNextFailedQuestion() → Envía pregunta3
5. ...continúa hasta completar las 5
```

**❌ Flujo Problemático:**
```
1. /falladas5 → getFailedQuestions() → [pregunta1, pregunta2, pregunta3, pregunta4, pregunta5]
2. sendNextFailedQuestion(sessionId, failedQuestions) → Envía pregunta1
3. Usuario responde → processPollAnswer() → sendNextQuestion() → ❌ MÉTODO INCORRECTO
4. sendNextQuestion() busca preguntas normales → No encuentra más → Termina sesión
```

### Causa Raíz

En `processPollAnswer()` y `handleQuestionTimeout()`, cuando se necesita enviar la siguiente pregunta, el sistema llamaba a:

```typescript
await this.sendNextQuestion(sessionIdForNext); // ❌ INCORRECTO para sesiones de falladas
```

En lugar de:

```typescript
await this.sendNextFailedQuestion(sessionIdForNext, failedQuestions); // ✅ CORRECTO
```

**Problema:** `sendNextQuestion()` está diseñado para sesiones normales que obtienen preguntas aleatorias de la base de datos. Para sesiones de falladas, necesita usar el array específico de preguntas falladas.

## Solución Implementada

### 1. Detección de Sesiones de Falladas

Agregada lógica para detectar sesiones de falladas basándose en el `subject`:

```typescript
// 🔧 FIX: Para sesiones de falladas, usar método especializado
const sessionForNext = await prisma.userstudysession.findUnique({
  where: { id: sessionIdForNext }
});

if (sessionForNext && (sessionForNext.subject === 'all' || sessionForNext.subject.endsWith('_falladas'))) {
  // Es una sesión de falladas
}
```

**Criterios de detección:**
- `subject === 'all'` (para `/falladas` general)
- `subject.endsWith('_falladas')` (para `/constitucionfalladas`, etc.)

### 2. Reconstrucción del Array de Preguntas Falladas

Para sesiones de falladas, el sistema ahora reconstruye el array de preguntas:

```typescript
// Es una sesión de falladas, necesitamos reconstruir el array de preguntas falladas
console.log(`🎓 Sesión de falladas detectada, reconstruyendo preguntas...`);

const originalSubject = sessionForNext.subject === 'all' ? 'all' : sessionForNext.subject.replace('_falladas', '');
const failedQuestions = await this.getFailedQuestions(sessionForNext.userid, originalSubject, sessionForNext.totalquestions);

console.log(`🎓 Preguntas falladas reconstruidas: ${failedQuestions.length}`);
await this.sendNextFailedQuestion(sessionIdForNext, failedQuestions);
```

### 3. Ubicaciones Corregidas

**A. `processPollAnswer()` - Línea ~802:**
```typescript
// Realizar acciones DESPUÉS de que la transacción se confirme
if (shouldSendNextQuestion) {
  console.log(`🚀 Enviando siguiente pregunta para sesión ${sessionIdForNext}...`);
  
  // 🔧 FIX: Para sesiones de falladas, usar método especializado
  const sessionForNext = await prisma.userstudysession.findUnique({
    where: { id: sessionIdForNext }
  });
  
  if (sessionForNext && (sessionForNext.subject === 'all' || sessionForNext.subject.endsWith('_falladas'))) {
    // Es una sesión de falladas, necesitamos reconstruir el array de preguntas falladas
    console.log(`🎓 Sesión de falladas detectada, reconstruyendo preguntas...`);
    
    const originalSubject = sessionForNext.subject === 'all' ? 'all' : sessionForNext.subject.replace('_falladas', '');
    const failedQuestions = await this.getFailedQuestions(sessionForNext.userid, originalSubject, sessionForNext.totalquestions);
    
    console.log(`🎓 Preguntas falladas reconstruidas: ${failedQuestions.length}`);
    await this.sendNextFailedQuestion(sessionIdForNext, failedQuestions);
  } else {
    // Sesión normal
    await this.sendNextQuestion(sessionIdForNext);
  }
}
```

**B. `handleQuestionTimeout()` - Línea ~1523:**
```typescript
} else {
  // Enviar siguiente pregunta fuera de la transacción
  
  // 🔧 FIX: Para sesiones de falladas, usar método especializado
  const sessionForNext = await prisma.userstudysession.findUnique({
    where: { id: sessionid }
  });
  
  if (sessionForNext && (sessionForNext.subject === 'all' || sessionForNext.subject.endsWith('_falladas'))) {
    // Es una sesión de falladas, necesitamos reconstruir el array de preguntas falladas
    console.log(`🎓 Timeout - Sesión de falladas detectada, reconstruyendo preguntas...`);
    
    const originalSubject = sessionForNext.subject === 'all' ? 'all' : sessionForNext.subject.replace('_falladas', '');
    const failedQuestions = await this.getFailedQuestions(sessionForNext.userid, originalSubject, sessionForNext.totalquestions);
    
    console.log(`🎓 Timeout - Preguntas falladas reconstruidas: ${failedQuestions.length}`);
    await this.sendNextFailedQuestion(sessionid, failedQuestions);
  } else {
    // Sesión normal
    await this.sendNextQuestion(sessionid);
  }
}
```

## Beneficios del Fix

✅ **Sesiones Completas**: Ahora se envían todas las preguntas solicitadas (1/5, 2/5, 3/5, 4/5, 5/5)
✅ **Detección Automática**: Sistema detecta automáticamente tipo de sesión
✅ **Compatibilidad**: Funciona tanto para `/falladas` general como `/materiafalladas` específica
✅ **Timeouts**: Maneja correctamente timeouts en sesiones de falladas
✅ **Logging**: Logs informativos para debugging

## Logs Esperados

Con el fix aplicado, deberías ver logs como:

```
🚀 Enviando siguiente pregunta para sesión 57a931f2-4703-4ade-bf7e-0ca3cb374aed...
🎓 Sesión de falladas detectada, reconstruyendo preguntas...
🎓 Preguntas falladas reconstruidas: 5
📚 Enviando pregunta 2/5 al usuario 5793286375
```

## Verificación

```bash
# Probar comando de preguntas falladas
/falladas5

# Verificar que se envían todas las preguntas:
# 🎯 PREGUNTA 1/5 → Responder → 🎯 PREGUNTA 2/5 → Responder → ... → 🎯 PREGUNTA 5/5
```

## Estado Final

🎯 **PROBLEMA RESUELTO**
- Sesiones de falladas ahora envían todas las preguntas solicitadas
- Sistema detecta automáticamente el tipo de sesión
- Funciona tanto para respuestas normales como timeouts
- Compatibilidad completa con sesiones normales

El comando `/falladas5` ahora funciona correctamente enviando las 5 preguntas completas. 