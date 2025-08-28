# Troubleshooting

## 2025-08-10 – Errores en `route.ts`

- Problema: "Expected ',', got 'let'" en `src/app/api/telegram/webhook/route.ts` alrededor de la línea 580.
- Causa raíz: Objeto `botMock` sin cierre `};` antes de seguir con lógica de usuario.
- Solución: Añadido `};` tras la definición de `botMock`.
- Verificación: `next dev` compila, el webhook vuelve a responder.

## 2025-08-10 – Simulacros Militares Premium

- Problema 1: Al responder la primera pregunta de `/simulacro_premium_et` salía "No se encontró simulacro militar activo" y se borraba el `poll`.
- Causa raíz: Desajuste de `userid` al buscar el simulacro activo. La creación usa el `telegramuserid` (ID de Telegram), pero la búsqueda usaba el `id` interno de BD en algunos puntos.
- Solución: En `route.ts`, al procesar respuestas de simulacros militares, la consulta de `simulacro.findFirst` ahora usa `userid: user.id.toString()` (ID Telegram) para alinear con la creación en `MilitarySimulationService.createMilitarySimulation`.

- Problema 2: “Bad Request: chat not found” al intentar enviar la siguiente pregunta.
- Causa raíz: se pasaba `userFound.id.toString()` (UUID interno) como `userid` al `MilitarySimulationService.processAnswer`, que luego usa ese `userid` para `sendTelegramPoll`. Telegram requiere el chat id real (ID de Telegram), no el UUID.
- Solución: cambiar el último parámetro de `processAnswer` a `user.id.toString()` (ID de Telegram) en `route.ts`.
- Archivos afectados:
  - `src/app/api/telegram/webhook/route.ts`
- Verificación: responder primera pregunta debe enviar la segunda correctamente (sin `chat not found`).

## Comandos y herramientas usadas

- `npm run dev` (Next.js) para compilar y probar.
- Lector de linter integrado (VS Code/TS) para ubicar errores de sintaxis.

## Referencias

- Lógica de creación de simulacros: `src/services/militarySimulationService.ts`
- Manejo de respuestas de `poll`: `src/app/api/telegram/webhook/route.ts`

## 2025-08-19 – Opciones truncadas y orden predecible en simulacros

- Problema 1: Las opciones de respuesta superaban el límite de 100 caracteres de Telegram y se cortaban con "..."
- Problema 2: La respuesta correcta siempre aparecía en la primera posición

- Causa raíz: 
  - El servicio militar no truncaba las opciones antes de enviarlas
  - No se aleatorizaba el orden de las opciones

- ~~Solución inicial (descartada)~~:
  1. Truncado inteligente de opciones largas

- **Solución final implementada**:
  1. **Validación previa**: Se valida que todas las opciones tengan ≤100 caracteres
  2. **Salto de preguntas inválidas**: Las preguntas con opciones largas se marcan como `skipped`
  3. **Búsqueda alternativa**: Se busca automáticamente la siguiente pregunta válida
  4. **Aleatorización Fisher-Yates**: Las opciones válidas se mezclan aleatoriamente
  5. **Límite de intentos**: Máximo 10 intentos para evitar loops infinitos

- Archivos modificados:
  - `src/services/militarySimulationService.ts`:
    - Nueva función `validateOptionLengths()` - Valida longitud de opciones
    - Nueva función `getRemainingMinutes()` - Calcula tiempo restante
    - Nueva función `findAndSendNextValidQuestion()` - Busca preguntas válidas
    - Modificada `sendFirstQuestion()` - Implementa búsqueda de pregunta válida
    - Modificada `sendQuestionPoll()` - Solo envía preguntas validadas
    - Modificada `processAnswer()` - Usa nueva lógica para siguiente pregunta

- Verificación: 
  - Las preguntas con opciones >100 caracteres se saltan automáticamente
  - Solo se envían preguntas que cumplen los límites de Telegram
  - Las opciones aparecen en orden aleatorio
