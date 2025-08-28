# 🕒 **GUÍA DE HORARIOS PERSONALIZADOS**

**Fecha:** 29 de enero de 2025  
**Estado:** ✅ **IMPLEMENTADO Y FUNCIONAL**

---

## 🚀 **¿QUÉ ES ESTA FUNCIONALIDAD?**

Ahora puedes configurar **horarios específicos** para el envío automático de preguntas al grupo de Telegram, controlando exactamente **cuándo se activan y cuándo se pausan** los envíos.

### **🎯 PROBLEMA RESUELTO:**
✅ **Control total sobre cuándo se envían preguntas** (ej: solo horario laboral, evitar madrugadas)  
✅ **Configuración visual desde la interfaz web** sin tocar código  
✅ **Flexibilidad completa** para diferentes tipos de uso (académico, empresarial, personal)

---

## 📱 **CÓMO ACCEDER A LA CONFIGURACIÓN:**

### **1. ACCEDER AL DASHBOARD:**
```
http://localhost:3000/dashboard
```

### **2. IR A CONFIGURACIÓN:**
- Hacer clic en la pestaña **"⚙️ Configuración"**
- Buscar la sección **"Horarios de Envío"**

---

## ⚙️ **CONFIGURACIONES DISPONIBLES:**

### **🟢 HORA DE INICIO**
- **Función:** Hora a partir de la cual se empiezan a enviar preguntas
- **Formato:** Selección visual de 00:00 a 23:00
- **Ejemplo:** Si seleccionas 09:00, las preguntas empezarán a enviarse desde las 9:00 AM

### **🔴 HORA DE PAUSA**
- **Función:** Hora a partir de la cual se dejan de enviar preguntas  
- **Formato:** Selección visual de 00:00 a 23:00
- **Ejemplo:** Si seleccionas 18:00, las preguntas se pausarán desde las 6:00 PM

### **📊 COMBINACIÓN CON FRECUENCIA**
Los horarios funcionan **en conjunto** con la frecuencia:
- **Frecuencia:** Cada cuánto se intenta enviar (ej: cada 10 minutos)
- **Horarios:** Durante qué horas se permite el envío

---

## 🎯 **EJEMPLOS DE USO:**

### **📚 CASO 1: ENTORNO ACADÉMICO**
```
🟢 Inicio: 08:00 (8:00 AM)
🔴 Pausa: 22:00 (10:00 PM)
⏰ Frecuencia: Cada 2 horas
```
**Resultado:** Preguntas cada 2 horas entre 8:00 AM y 10:00 PM

### **🏢 CASO 2: HORARIO LABORAL**
```
🟢 Inicio: 09:00 (9:00 AM)  
🔴 Pausa: 18:00 (6:00 PM)
⏰ Frecuencia: Cada 1 hora
```
**Resultado:** Preguntas cada hora solo durante horario de oficina

### **🧪 CASO 3: TESTING INTENSIVO**
```
🟢 Inicio: 10:00 (10:00 AM)
🔴 Pausa: 12:00 (12:00 PM)  
⏰ Frecuencia: Cada 5 minutos
```
**Resultado:** Testing rápido durante 2 horas específicas

### **🌙 CASO 4: HORARIO NOCTURNO**
```
🟢 Inicio: 22:00 (10:00 PM)
🔴 Pausa: 06:00 (6:00 AM)
⏰ Frecuencia: Cada 30 minutos
```
**Resultado:** Preguntas durante la noche (cruza medianoche)

---

## 🔧 **CÓMO CONFIGURAR:**

### **PASO 1: CONFIGURAR HORARIOS**
1. 🌐 Ve a http://localhost:3000/dashboard
2. 🎛️ Clic en pestaña "Configuración"
3. 🕒 Busca la sección "Horarios de Envío"
4. 🟢 Selecciona la **hora de inicio** haciendo clic en la hora deseada
5. 🔴 Selecciona la **hora de pausa** haciendo clic en la hora deseada
6. ✅ La configuración se guarda automáticamente

### **PASO 2: CONFIGURAR FRECUENCIA** (si no está hecho)
1. 📊 En la misma página, sección "Frecuencia de Polls"
2. 🎛️ Selecciona "Personalizado"
3. ⏰ Elige la frecuencia deseada (1min, 5min, 10min, etc.)

### **PASO 3: APLICAR CAMBIOS**
```bash
# 1. Parar el scheduler actual (Ctrl+C en su terminal)

# 2. Reiniciar con nueva configuración:
npx tsx scripts/notification-scheduler.ts
```

---

## 📋 **INTERPRETACIÓN DEL RESUMEN**

En la sección "Resumen del Horario" verás:

### **📅 PERIODO ACTIVO:**
- **Definición:** Horario durante el cual SÍ se envían preguntas
- **Ejemplo:** 09:00 - 18:00 = Activo de 9 AM a 6 PM

### **😴 PERIODO DE PAUSA:**
- **Definición:** Horario durante el cual NO se envían preguntas  
- **Ejemplo:** 18:00 - 09:00 = Pausado de 6 PM a 9 AM

### **🌍 HORARIOS QUE CRUZAN MEDIANOCHE:**
Si configuras Inicio: 22:00 y Pausa: 06:00:
- **Activo:** 22:00 - 06:00 (durante la noche)
- **Pausado:** 06:00 - 22:00 (durante el día)

---

## 🧪 **TESTING Y VERIFICACIÓN:**

### **VERIFICAR CONFIGURACIÓN:**
```bash
# Ejecutar script de prueba
node test-schedule-config.js
```

### **MONITOREAR SCHEDULER:**
```bash
# Ver logs del scheduler en tiempo real
npx tsx scripts/notification-scheduler.ts
```

**Los logs mostrarán:**
- ✅ Cuándo se envía una pregunta (dentro del horario)
- ⏰ Cuándo se omite un envío (fuera del horario)
- 📊 Información del horario configurado

---

## 🔍 **TROUBLESHOOTING:**

### **🚨 LAS PREGUNTAS NO SE ENVÍAN:**
1. ✅ Verifica que estés dentro del horario activo
2. 🔄 Reinicia el scheduler después de cambios
3. 📊 Revisa los logs del scheduler

### **⚙️ CAMBIOS NO SE APLICAN:**
1. 💾 Verifica que aparezca mensaje de "configuración guardada"
2. 🔄 Reinicia el scheduler obligatoriamente
3. 📁 Verifica que existe `scheduler-config.json`

### **🕒 HORARIOS NO FUNCIONAN COMO ESPERABA:**
1. 🌍 Verifica la zona horaria del servidor
2. 📊 Usa el script de prueba para verificar lógica
3. 👀 Revisa el "Resumen del Horario" en la UI

---

## 📊 **CONFIGURACIÓN TÉCNICA:**

### **ARCHIVO DE CONFIGURACIÓN:**
```json
{
  "dailyPolls": {
    "enabled": true,
    "time": "*/10 * * * *",
    "frequency": "custom", 
    "customMinutes": 10,
    "startHour": 9,
    "startMinute": 0,
    "endHour": 18,
    "endMinute": 0
  }
}
```

### **ZONA HORARIA:**
- **Por defecto:** America/Bogota
- **Configurable en:** `scripts/notification-scheduler.ts`

---

## 💡 **CONSEJOS Y MEJORES PRÁCTICAS:**

### **📚 PARA USO ACADÉMICO:**
- 🕘 Inicio: 8:00 AM (antes de clases)
- 🕙 Pausa: 10:00 PM (después de estudio)
- ⏰ Frecuencia: Cada 2-3 horas

### **🏢 PARA USO EMPRESARIAL:**
- 🕘 Inicio: 9:00 AM (horario laboral)
- 🕕 Pausa: 6:00 PM (fin de jornada)
- ⏰ Frecuencia: Cada 1 hora

### **🧪 PARA TESTING:**
- 🕘 Ventana corta (ej: 2-3 horas)
- ⏰ Frecuencia alta (ej: cada 5-10 minutos)
- 📊 Monitorear logs activamente

### **🌙 PARA USO INTERNACIONAL:**
- 🌍 Considerar zonas horarias de usuarios
- 🕘 Evitar horarios de madrugada locales
- ⚖️ Balancear cobertura vs respeto del descanso

---

## 🎯 **RESUMEN:**

✅ **YA IMPLEMENTADO:** Configuración completa de horarios desde la UI  
✅ **FÁCIL DE USAR:** Selección visual de horas sin código  
✅ **FLEXIBLE:** Funciona con cualquier frecuencia  
✅ **PROBADO:** Script de testing incluido  
✅ **DOCUMENTADO:** Guía completa y ejemplos

**🚀 ¡La funcionalidad está lista para usar!** 