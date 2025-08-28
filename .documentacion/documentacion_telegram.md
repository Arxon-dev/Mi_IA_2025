# Documentación de Integración con Telegram

Este documento detalla la configuración y los pasos para integrar la funcionalidad de envío de preguntas a Telegram.

## Configuración Inicial del Bot de Telegram

1.  **Creación del Bot:**
    *   Se utilizó `@BotFather` en Telegram para crear un nuevo bot.
    *   **Nombre del Bot (Ejemplo):** MiGeneradorDePreguntasBot
    *   **Username del Bot (Ejemplo):** `MiGenPreguntasBot`

2.  **Token de API HTTP:**
    *   **ADVERTENCIA DE SEGURIDAD MUY IMPORTANTE:** El siguiente token fue proporcionado como ejemplo y **DEBE SER REVOCADO INMEDIATAMENTE Y REEMPLAZADO POR UNO NUEVO GUARDADO DE FORMA SEGURA (ej. variables de entorno). NUNCA COMPARTAS TOKENS REALES DE ESTA MANERA.**
    *   Token (EJEMPLO EXPUESTO - ¡REVOCAR!): `8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs` (Este token ya ha sido expuesto y debería considerarse comprometido).
    *   El token real y seguro debe almacenarse en una variable de entorno, por ejemplo, `TELEGRAM_BOT_TOKEN` en un archivo `.env.local`.

3.  **Chat ID del Grupo de Telegram:**
    *   Se utilizará un grupo de Telegram para enviar los cuestionarios.
    *   **Nombre del Grupo de Prueba (Ejemplo):** OpoPrueba
    *   **Chat ID Obtenido:** `-1002519334308` (Obtenido de la respuesta de `getUpdates` después de enviar un mensaje al grupo con el bot como miembro).
    *   El `chat_id` real y seguro también debería, idealmente, gestionarse a través de variables de entorno o una configuración segura si va a ser fijo (ej. `TELEGRAM_CHAT_ID` en `.env.local`).

## Pasos de Desarrollo Realizados y Decisiones

1.  **Investigación API de Telegram:**
    *   Se consultó la documentación para `sendPoll` (tipo `quiz`).
    *   Límites de caracteres identificados: Pregunta (300), Opciones (100 cada una), Explicación (200).

2.  **Backend (Next.js API Route):**
    *   Se creó la ruta API `src/app/api/telegram/send-question/route.ts`.
    *   Lee `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` desde variables de entorno.
    *   Recibe el cuerpo de la pregunta (pregunta, opciones, ID opción correcta, explicación opcional, chat_id opcional para anular el de por defecto).
    *   Realiza la llamada `fetch` a `https://api.telegram.org/bot<TOKEN>/sendPoll`.
    *   Inicialmente se intentó usar `explanation_parse_mode: 'HTML'`, pero causó errores `Unsupported start tag "br"` porque Telegram no soporta `<br>` en el `parse_mode:HTML` para explicaciones.
    *   **Decisión:** Se eliminó `explanation_parse_mode`. Toda la limpieza de HTML (incluyendo la conversión de `<br>` a `\n` y la eliminación de todas las demás etiquetas) se realiza ahora en el frontend antes de enviar los datos al backend. La API del backend ahora espera texto limpio.

3.  **Frontend (`src/app/documents/[id]/page.tsx`):**
    *   Se añadió un botón "Enviar a Telegram" (icono de Telegram) a cada pregunta individual en la sección "Preguntas generadas para el documento completo".
    *   Se implementó la función `handleSendSingleQuestionToTelegram`:
        *   Parsea la pregunta GIFT usando `parseGiftQuestion`.
        *   Utiliza una función `cleanHtmlForTelegram` para eliminar todas las etiquetas HTML del enunciado, las opciones y la explicación, convirtiendo `<br>` a `\n`.
        *   Llama al endpoint `/api/telegram/send-question`.
        *   Maneja estados de carga (`isSendingToTelegram`) y errores (mostrados mediante `setError`).
    *   Se resolvieron problemas de visualización del botón mediante recarga forzada del navegador y reinicio del servidor de desarrollo.
    *   Se corrigió el problema de formato en Telegram donde las etiquetas HTML (`<b>`, `<br>`) aparecían literalmente, asegurando que el texto se limpie adecuadamente antes del envío.

4.  **Pruebas y Refinamiento:**
    *   Se probó el envío de preguntas individuales a Telegram.
    *   Se corrigió el error `Bad Request: can't parse entities: Unsupported start tag "br"` eliminando `explanation_parse_mode` y limpiando todo el HTML en el frontend.

## Siguientes Pasos Planificados

1.  **Implementar botón "Enviar a Telegram" para Preguntas de Sección:**
    *   Añadir lógica similar en `DocumentSectionSelector.tsx` o el componente que renderiza las preguntas de sección (`QuestionGenerator.tsx` o similar).
    *   Pasar la funcionalidad de envío y manejar el estado de carga.
2.  **Funcionalidad "Enviar Todas las Preguntas a Telegram"** (para documento completo y secciones).
3.  **Mejoras UX/UI** (notificaciones, gestión de tasa de API).

## Notas Adicionales

*   El bot debe ser miembro del grupo de Telegram y tener permisos para enviar mensajes y crear encuestas.
*   Para tipos de preguntas GIFT no soportados nativamente por los polls de Telegram (ej. emparejamiento, respuesta corta), se necesitará una estrategia de adaptación o se omitirán. Actualmente, solo se envían como `quiz` de opción múltiple. 