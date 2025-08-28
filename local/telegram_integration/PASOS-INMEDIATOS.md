# ⚡ PASOS INMEDIATOS para Resolver el Problema

**Problema:** La tabla `mdl_local_telegram_user_topic_performance` NO se actualiza para NINGÚN tema

## 🚀 Ejecuta AHORA (en orden)

### **1. Diagnóstico Rápido (5 minutos)**
```bash
# Accede a estos scripts desde tu navegador:
https://tu-sitio-moodle.com/local/telegram_integration/debug-full-system.php
```

**Anota los resultados:**
- ¿Plugin instalado? ✅/❌
- ¿Usuarios vinculados? ✅/❌ 
- ¿Tabla existe? ✅/❌
- ¿Funciones existen? ✅/❌

### **2. Test Manual (3 minutos)**
```bash
https://tu-sitio-moodle.com/local/telegram_integration/test-manual-update.php
```

**Resultado esperado:**
- ✅ **Si funciona:** Verás nuevos registros → **PROBLEMA = Event Observer**
- ❌ **Si falla:** No se crean registros → **PROBLEMA = Función/Permisos**

### **3. Test del Observer (2 minutos)**
```bash
https://tu-sitio-moodle.com/local/telegram_integration/test-observer-execution.php
```

**Busca:**
- ✅ Event handlers registrados en base de datos
- ❌ Event handlers NO registrados → **NECESITAS REINSTALAR PLUGIN**

## 🛠️ Soluciones Rápidas

### **Si el Test Manual FUNCIONA:**
```php
// El problema está en el Event Observer
// SOLUCIÓN: Revisar que el observer se ejecute
```

1. **Activar debug en Moodle:**
   ```php
   // Agregar en config.php
   $CFG->debug = DEBUG_DEVELOPER;
   $CFG->debugdisplay = 1;
   ```

2. **Hacer un cuestionario con usuario vinculado**
3. **Buscar en logs estos mensajes:**
   ```
   === TELEGRAM INTEGRATION (v2) ===
   Event: quiz_attempt_submitted
   Successfully updated topic performance
   === END TELEGRAM INTEGRATION DEBUG ===
   ```

### **Si el Test Manual FALLA:**
```php
// El problema está en la función o permisos
// SOLUCIÓN: Verificar estructura/permisos
```

1. **Verificar tabla:**
   ```sql
   DESCRIBE mdl_local_telegram_user_topic_performance;
   ```

2. **Probar insert manual:**
   ```sql
   INSERT INTO mdl_local_telegram_user_topic_performance 
   (telegramuserid, sectionid, sectionname, totalquestions, correctanswers, incorrectanswers, accuracy, lastactivity, createdat, updatedat)
   VALUES (123, 456, 'test', 5, 3, 2, 60.00, 1642334567, 1642334567, 1642334567);
   ```

### **Si NO hay Event Handlers:**
```bash
# SOLUCIÓN: Reinstalar plugin
```

1. **Ir a:** Administración → Plugins → Plugins locales
2. **Buscar:** Telegram Integration
3. **Desinstalar** y luego **reinstalar**

## 🎯 Casos Más Comunes

### **CASO 1: No hay usuarios vinculados**
```bash
# SÍNTOMA: No hay registros en debug-full-system.php sección 5
# SOLUCIÓN: Vincular usuario
```
1. Ve a tu perfil de usuario
2. Busca "Telegram Integration"
3. Sigue el proceso de vinculación

### **CASO 2: Observer no registrado**
```bash
# SÍNTOMA: test-observer-execution.php muestra "NO se encontraron event observers"
# SOLUCIÓN: Reinstalar plugin
```

### **CASO 3: Tabla no existe**
```bash
# SÍNTOMA: Error SQL en test-manual-update.php
# SOLUCIÓN: Crear tabla manualmente
```

Ejecuta este SQL:
```sql
CREATE TABLE mdl_local_telegram_user_topic_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegramuserid INT NOT NULL,
    sectionid INT NOT NULL,
    sectionname VARCHAR(255) NOT NULL,
    totalquestions INT DEFAULT 0,
    correctanswers INT DEFAULT 0,
    incorrectanswers INT DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    lastactivity INT DEFAULT 0,
    createdat INT DEFAULT 0,
    updatedat INT DEFAULT 0,
    UNIQUE KEY unique_user_section (telegramuserid, sectionid)
);
```

## 📋 Lista de Verificación Rápida

**Antes de contactar soporte, verifica:**

- [ ] Ejecuté los 3 scripts de diagnóstico
- [ ] Anoté los resultados de cada uno
- [ ] Intenté la solución correspondiente
- [ ] Activé debug en Moodle
- [ ] Hice un cuestionario de prueba
- [ ] Revisé los logs de error

## 🚨 Mensaje de Error Más Común

```
FATAL: local_telegram_integration_update_user_topic_performance() no existe
```

**SOLUCIÓN:**
1. Verificar que `locallib.php` existe
2. Verificar que la función está definida en línea ~1240
3. Reinstalar plugin si es necesario

## 📞 Qué Reportar Si el Problema Persiste

**Incluye esta información:**

1. **Resultados de los 3 scripts:**
   - debug-full-system.php
   - test-manual-update.php  
   - test-observer-execution.php

2. **Versión de Moodle:** `<?php echo $CFG->version; ?>`

3. **Logs de error específicos**

4. **Estructura de tabla actual:**
   ```sql
   DESCRIBE mdl_local_telegram_user_topic_performance;
   ```

5. **Usuarios vinculados:**
   ```sql
   SELECT COUNT(*) FROM mdl_local_telegram_verification WHERE verified = 1;
   ```

## ⏱️ Tiempo Estimado

- **Diagnóstico completo:** 10-15 minutos
- **Solución típica:** 5-10 minutos
- **Reinstalación (si necesaria):** 15-20 minutos

## 🎯 Resultado Esperado

Después de seguir estos pasos:

1. **Completar cuestionario OSCE** (o cualquier tema)
2. **Verificar que aparece en `moodleactivity`**
3. **Verificar que aparece en `mdl_local_telegram_user_topic_performance`**
4. **Confirmar que el tema se mapea correctamente**

---

**¡EMPIEZA AHORA!** Ejecuta el primer script y sigue las instrucciones.

*Pasos creados: 2025-01-16*  
*Prioridad: ALTA*  
*Tiempo estimado: 10-30 minutos* 