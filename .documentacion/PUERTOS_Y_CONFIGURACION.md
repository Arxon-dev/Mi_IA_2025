# 🔧 **CONFIGURACIÓN DE PUERTOS - DOCUMENTACIÓN OFICIAL**

## ⚡ **CONFIGURACIÓN ESTÁNDAR (RECOMENDADA)**

### **🌐 Next.js (Puerto 3000)**
```bash
# Iniciar servidor principal
npm run dev

# URL del servidor
http://localhost:3000

# Webhook endpoint
http://localhost:3000/api/telegram/webhook

# Dashboard
http://localhost:3000/dashboard
```

### **🚀 ngrok (Túnel público)**
```bash
# Comando correcto
ngrok http 3000

# Resultado esperado
Forwarding https://abc123.ngrok.io -> http://localhost:3000
```

### **🔗 Webhook de Telegram**
```bash
# URL completa del webhook
https://abc123.ngrok.io/api/telegram/webhook

# Configuración automática
node configurar-webhook-automatico.js
```

---

## 📋 **EXPLICACIÓN DE LA ARQUITECTURA**

### **✅ Configuración Principal (Puerto 3000)**
- **Servidor:** Next.js con API Routes integradas
- **Ventajas:** 
  - ✅ Configuración estándar de Next.js
  - ✅ Una sola aplicación para todo
  - ✅ Fácil desarrollo y deployment
  - ✅ Hot reload automático

### **⚠️ Configuración Alternativa (Puerto 3001)**
- **Servidor:** Express independiente para webhook
- **Cuándo usar:**
  - Solo si necesitas separar el webhook del sistema principal
  - Para proyectos con muy alto tráfico
  - Para arquitecturas microservicios

---

## 🎯 **GUÍA RÁPIDA: CONFIGURACIÓN ESTÁNDAR**

### **1. Iniciar el sistema**
```bash
# Terminal 1: Servidor Next.js
npm run dev
# Espera a ver: "Ready on http://localhost:3000"
```

### **2. Configurar túnel público**
```bash
# Terminal 2: ngrok
ngrok http 3000
# Copia la URL: https://xxx.ngrok.io
```

### **3. Configurar webhook automáticamente**
```bash
# Terminal 1 (misma donde está npm run dev)
node configurar-webhook-automatico.js
# Debería detectar ngrok automáticamente
```

### **4. Verificar funcionamiento**
```bash
# Verificar estado
node quick-check.js

# Enviar poll de prueba
node test-carlos-poll.js
```

---

## 🐛 **SOLUCIÓN DE PROBLEMAS COMUNES**

### **❌ "Puerto 3000 en uso"**
```bash
# Next.js cambiará automáticamente a 3001
# Ajusta ngrok al puerto mostrado:
ngrok http 3001  # o el puerto que muestre Next.js
```

### **❌ "ngrok no detectado"**
```bash
# Verifica que ngrok esté corriendo:
curl http://127.0.0.1:4040/api/tunnels

# Reinicia ngrok si es necesario:
ngrok http 3000
```

### **❌ "Webhook no responde"**
```bash
# Verifica servidor Next.js:
curl http://localhost:3000/api/telegram/webhook

# Verifica configuración de webhook:
node webhook-check.js
```

---

## 📚 **REFERENCIAS HISTÓRICAS**

### **¿Por qué había confusión con puertos?**
1. **Desarrollo inicial** usó un servidor Express separado (puerto 3001)
2. **Migración a Next.js** consolidó todo en puerto 3000
3. **Documentación antigua** no se actualizó completamente
4. **Scripts de prueba** tenían referencias mixtas

### **Archivos actualizados (2024-12-19):**
- ✅ `CONFIGURACION_NGROK_PASOS.md`
- ✅ `GUIA_COMPLETA_POLLS.md`
- ✅ `troubleshooting.md`
- ✅ `RESUMEN_FINAL_SISTEMA.md`
- ✅ `configurar-webhook-automatico.js`

---

## ✅ **CONFIGURACIÓN FINAL RECOMENDADA**

```bash
# 1. Servidor (Terminal 1)
npm run dev                           # Puerto 3000

# 2. Túnel (Terminal 2)  
ngrok http 3000                       # Apunta al puerto correcto

# 3. Webhook (Terminal 1)
node configurar-webhook-automatico.js # Configuración automática

# 4. Verificación
node quick-check.js                   # Estado del sistema
```

**🎯 Esta es la configuración oficial y debe usarse en toda la documentación.** 