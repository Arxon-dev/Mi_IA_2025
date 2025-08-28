# 🤖 Guía de Configuración de Telegram

## 📋 Estado Actual
✅ **Sistema de gamificación implementado**  
✅ **Base de datos configurada**  
✅ **Simulador de pruebas funcionando**  
⏳ **Webhook de Telegram pendiente**  

## 🔧 Paso 1: Verificar Token del Bot

### Opción A: Usar Bot Existente
Si ya tienes un bot, verifica que el token sea correcto:

1. **Ir a @BotFather en Telegram**
2. **Enviar `/mybots`**
3. **Seleccionar tu bot**
4. **Seleccionar "API Token"**
5. **Copiar el token completo**

### Opción B: Crear Nuevo Bot
Si necesitas crear un bot nuevo:

1. **Ir a @BotFather en Telegram**
2. **Enviar `/newbot`**
3. **Seguir las instrucciones**
4. **Guardar el token que te proporciona**

## 🌐 Paso 2: Configurar URL Pública

Para que Telegram pueda enviar webhooks, necesitas una URL pública. Tienes varias opciones:

### Opción A: Usar ngrok (Recomendado para pruebas)

1. **Descargar e instalar ngrok**
   ```bash
   # Ir a https://ngrok.com/download
   # Descargar la versión para Windows
   ```

2. **Ejecutar ngrok**
   ```bash
   ngrok http 3000
   ```

3. **Copiar la URL HTTPS**
   ```
   Forwarding    https://abc123.ngrok.io -> http://localhost:3000
   ```

### Opción B: Usar Servidor en la Nube
- **Vercel**: Deploy automático desde GitHub
- **Railway**: Fácil deployment
- **Digital Ocean**: VPS tradicional

## 🔗 Paso 3: Configurar Webhook

### Usando PowerShell (Windows)
```powershell
# Reemplazar TOKEN y URL_PUBLICA con tus valores
$token = "TU_TOKEN_AQUI"
$webhookUrl = "https://tu-url-publica.com/api/telegram/webhook"

$body = @{
    url = $webhookUrl
    max_connections = 40
    allowed_updates = @("message")
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/setWebhook" -Method Post -Body $body -ContentType "application/json"
```

### Verificar Webhook
```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getWebhookInfo" -Method Get
```

## 🧪 Paso 4: Probar el Sistema

### 1. **Verificar Servidor**
```bash
npm run dev
```
El servidor debe estar corriendo en el puerto 3000.

### 2. **Enviar Pregunta de Prueba**
En tu grupo de Telegram, envía un mensaje como:
```
🤔 **Pregunta de prueba**

¿Cuál es la capital de España?

A) Madrid
B) Barcelona
C) Valencia
D) Sevilla

📝 Responde con la letra correcta
🆔 ID: test-question-1
```

### 3. **Responder la Pregunta**
Responde al mensaje anterior con la letra correcta (A).

### 4. **Verificar Respuesta**
El bot debería responder con estadísticas del usuario.

## 📊 Paso 5: Verificar Dashboard

Visita: `http://localhost:3000/dashboard/gamification`

Deberías ver:
- ✅ Estadísticas actualizadas
- ✅ Rankings con usuarios reales
- ✅ Datos de la base de datos

## 🛠️ Comandos del Bot

Una vez configurado, estos comandos funcionarán en tu grupo:

- `/ranking` - Ver ranking general
- `/stats` - Ver tus estadísticas
- `/racha` - Información de racha
- `/help` - Ayuda de comandos

## 🔧 Troubleshooting

### Problema: "Error verificando bot: Not Found"
**Solución**: El token del bot es incorrecto
- Verificar en @BotFather
- Copiar token completo sin espacios
- Actualizar archivo `.env`

### Problema: "Webhook no recibe mensajes"
**Solución**: URL no es accesible
- Verificar que ngrok esté corriendo
- Usar URL HTTPS (no HTTP)
- Verificar firewall

### Problema: "Error de base de datos"
**Solución**: 
```bash
npx prisma migrate dev
npx prisma generate
```

### Problema: "Bot no responde"
**Solución**: Verificar logs del servidor
- Revisar consola de npm run dev
- Verificar que el webhook esté configurado
- Probar endpoint manualmente

## 📝 Integración con Sistema Existente

Para integrar con tu sistema actual de envío de preguntas:

### 1. **Modificar Formato de Preguntas**
Agregar ID único a cada pregunta:
```typescript
const questionMessage = `
🤔 **${question.title}**

${question.content}

A) ${question.optionA}
B) ${question.optionB}
C) ${question.optionC}
D) ${question.optionD}

📝 Responde con la letra correcta
🆔 ID: ${question.id}
`;
```

### 2. **Implementar Verificación de Respuestas**
En `src/app/api/telegram/webhook/route.ts` línea 84:
```typescript
// Reemplazar simulación con verificación real
const question = await prisma.question.findUnique({
  where: { id: questionId }
});

const isCorrect = question?.correctAnswer.toLowerCase() === 
                 userAnswer.toLowerCase().trim();
```

## 🎯 Próximos Pasos

1. **Configurar webhook con token real**
2. **Probar con usuarios reales**
3. **Integrar con sistema de preguntas existente**
4. **Monitorear engagement y participación**
5. **Iterar basado en feedback de usuarios**

## 📞 Soporte

Si necesitas ayuda:
1. **Verificar logs del servidor**
2. **Revisar documentación de Telegram Bot API**
3. **Probar endpoints manualmente**
4. **Verificar configuración paso a paso**

---

¡El sistema está listo para revolucionar tu grupo de Telegram! 🚀 