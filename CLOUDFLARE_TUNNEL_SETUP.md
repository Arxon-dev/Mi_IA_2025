# 🌐 Guía de Cloudflare Tunnel para Telegram Bot

## 📋 Resumen

Esta guía te explica cómo usar Cloudflare Tunnel para exponer tu servidor local y actualizar el webhook de Telegram cada vez que reinicies tu máquina.

## 🚀 Inicio Rápido

### 1. Iniciar Cloudflare Tunnel

```bash
# Navegar al directorio del proyecto
cd e:\OpoMelilla_2025\Trae_AI\Mi_IA_2025

# Iniciar el túnel (esto genera una nueva URL cada vez)
.\cloudflared.exe tunnel --url http://localhost:3000
```

### 2. Obtener la URL del Túnel

Cuando ejecutes el comando anterior, verás algo como:

```
2025-01-17T10:30:45Z INF +--------------------------------------------------------------------------------------------+
2025-01-17T10:30:45Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2025-01-17T10:30:45Z INF |  https://tu-url-unica.trycloudflare.com                                                   |
2025-01-17T10:30:45Z INF +--------------------------------------------------------------------------------------------+
```

**⚠️ IMPORTANTE:** La URL cambia cada vez que reinicies `cloudflared`.

### 3. Actualizar el Webhook de Telegram

Una vez que tengas la nueva URL, ejecuta:

```bash
# Reemplaza TU_URL_AQUI con la URL que obtuviste
npx tsx scripts/setup-ngrok.ts https://tu-url-unica.trycloudflare.com
```

## 🔄 Proceso Completo Paso a Paso

### Cada vez que reinicies tu máquina:

1. **Abrir terminal en el directorio del proyecto:**
   ```bash
   cd e:\OpoMelilla_2025\Trae_AI\Mi_IA_2025
   ```

2. **Asegurarte de que tu servidor Next.js esté corriendo:**
   ```bash
   npm run dev
   ```
   (Debe estar corriendo en `http://localhost:3000`)

3. **Iniciar Cloudflare Tunnel:**
   ```bash
   .\cloudflared.exe tunnel --url http://localhost:3000
   ```

4. **Copiar la URL generada** (algo como `https://abc-def-ghi.trycloudflare.com`)

5. **Actualizar el webhook de Telegram:**
   ```bash
   npx tsx scripts/setup-ngrok.ts https://abc-def-ghi.trycloudflare.com
   ```

6. **Verificar que funciona:**
   - Ve a tu grupo de Telegram
   - Envía un comando como `/stats`
   - Deberías recibir una respuesta del bot

## 🛠️ Scripts Útiles

### Obtener la URL del túnel activo

Si ya tienes `cloudflared` corriendo y necesitas obtener la URL:

```bash
# En otra terminal, ejecuta:
.\cloudflared.exe tunnel --url http://localhost:3000 2>&1 | grep -E "https://.*\.trycloudflare\.com"
```

### Verificar el estado del webhook

```bash
npx tsx scripts/monitor-webhook.ts
```

### Probar el webhook manualmente

```bash
curl -X POST "https://tu-url.trycloudflare.com/api/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d '{"message":{"message_id":123,"from":{"id":12345,"first_name":"Test","username":"testuser"},"chat":{"id":12345,"type":"private"},"date":1640995200,"text":"/stats"}}'
```

## 📝 Archivo .env

Recuerda actualizar tu archivo `.env` con la nueva URL:

```env
# Actualizar esta línea con la nueva URL
NGROK_URL=https://tu-nueva-url.trycloudflare.com
```

## ✅ Ventajas de Cloudflare Tunnel

- ✅ **Gratuito** y sin límites de tiempo
- ✅ **SSL automático** (HTTPS)
- ✅ **Protección DDoS**
- ✅ **Sin necesidad de cuenta** (modo temporal)
- ✅ **Ancho de banda ilimitado**

## ⚠️ Consideraciones Importantes

1. **La URL cambia cada reinicio:** Esto es normal en el modo temporal sin cuenta
2. **Mantén cloudflared corriendo:** Si lo cierras, el túnel se desconecta
3. **Actualiza siempre el webhook:** Cada nueva URL requiere actualizar Telegram
4. **Guarda la URL actual:** Anótala para referencia mientras esté activa

## 🆘 Solución de Problemas

### El bot no responde a comandos

1. Verifica que `cloudflared` esté corriendo
2. Verifica que el servidor Next.js esté en puerto 3000
3. Ejecuta el script de monitoreo: `npx tsx scripts/monitor-webhook.ts`
4. Revisa que la URL del webhook sea correcta

### Error "502 Bad Gateway"

- Tu servidor local no está corriendo en puerto 3000
- Ejecuta: `npm run dev` para iniciar el servidor

### Error "command not found: cloudflared"

- El archivo `cloudflared.exe` debe estar en el directorio del proyecto
- Si no está, descárgalo desde: https://github.com/cloudflare/cloudflared/releases

## 📞 Comandos de Telegram para Probar

Una vez configurado, prueba estos comandos en tu grupo:

- `/stats` - Ver estadísticas
- `/ranking` - Ver ranking
- `/racha` - Ver racha actual
- `/pdc1` - Preguntas PDC1

---

**💡 Tip:** Guarda este archivo como referencia rápida para cada reinicio de tu máquina.