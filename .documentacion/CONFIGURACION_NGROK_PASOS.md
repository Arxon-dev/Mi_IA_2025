# 🚀 CONFIGURACIÓN DE NGROK - GUÍA PASO A PASO

## 📊 ESTADO ACTUAL
✅ **Sistema de gamificación**: 100% implementado  
✅ **Bot de Telegram**: Verificado y funcionando  
✅ **Pregunta de prueba**: Enviada al grupo (ID: 430)  
✅ **Scripts de configuración**: Listos  
⏳ **Falta**: Configurar webhook HTTPS con ngrok  

## 🔽 PASO 1: DESCARGAR NGROK

**ENLACE DIRECTO**: https://ngrok.com/downloads/windows

1. Ve al enlace
2. Descarga: **Windows 64-bit ZIP**
3. Extrae el archivo en una carpeta, por ejemplo: `C:\ngrok`

## ⚙️ PASO 2: EJECUTAR NGROK

1. **Abrir nueva ventana de comando**: 
   - Presiona `Windows + R`
   - Escribe: `cmd`
   - Presiona Enter

2. **Navegar a la carpeta de ngrok**:
   ```cmd
   cd C:\ngrok
   ```

3. **Ejecutar ngrok (IMPORTANTE: Puerto 3000)**:
   ```cmd
   ngrok.exe http 3000
   ```

## 📋 PASO 3: OBTENER LA URL

Verás algo así:
```
Session Status    online
Version           3.x.x
Region            United States (us)
Latency           -
Web Interface     http://127.0.0.1:4040
Forwarding        https://abc123.ngrok.io -> http://localhost:3000

Connections       ttl     opn     rt1     rt5     p50     p90
                  0       0       0.00    0.00    0.00    0.00
```

**👉 COPIA ESTA URL**: `https://abc123.ngrok.io`

## 🔗 PASO 4: CONFIGURAR WEBHOOK

1. **Vuelve a esta ventana de PowerShell**
2. **Ejecuta** (reemplaza con tu URL real):
   ```bash
   npx tsx scripts/setup-ngrok.ts https://abc123.ngrok.io
   ```

## ✅ PASO 5: VERIFICAR

Una vez configurado:

1. **Ve a tu grupo de Telegram**
2. **Responde al mensaje ID: 430** (pregunta de Historia)
3. **Respuesta correcta**: `B` (1492)
4. **El bot debería responder** con tus estadísticas

## 🛠️ SI HAY PROBLEMAS

### Si Next.js no está corriendo:
```bash
npm run dev
```

### Si el puerto está en uso:
Next.js detectará automáticamente el puerto disponible y lo mostrará en la consola.

### Si ngrok no funciona:
- Verifica la carpeta de extracción
- Usa la ruta completa: `C:\ngrok\ngrok.exe http 3000`

## 📱 COMANDOS PARA PROBAR

Una vez funcionando, prueba en Telegram:
- `/ranking` - Ver ranking general
- `/stats` - Tus estadísticas
- `/racha` - Información de racha
- `/help` - Ayuda del sistema

## 🎯 RESULTADO ESPERADO

Al responder la pregunta correctamente verás:
```
✅ Correcto!

🏆 Tus estadísticas:
📊 Puntos: 10
🥉 Nivel: 1
🔥 Racha: 1 días
🎯 Precisión: 100%
📈 Ranking: #1

¡Excelente trabajo! 🎉
```

## 📊 DASHBOARD

Visita: http://localhost:3000/dashboard/gamification

---

**¿Listo? ¡Descarga ngrok y sigamos!** 🚀 