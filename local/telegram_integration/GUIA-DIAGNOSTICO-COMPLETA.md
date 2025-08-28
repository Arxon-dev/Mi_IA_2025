# 🔍 Guía Completa de Diagnóstico - Tabla de Rendimiento

**Fecha:** 2025-01-16  
**Problema:** La tabla `mdl_local_telegram_user_topic_performance` NO se actualiza para NINGÚN tema

## 📋 Proceso de Diagnóstico Paso a Paso

### **PASO 1: Ejecutar Diagnóstico Completo**

Ejecuta el script de diagnóstico completo para obtener una visión general:

```bash
# Desde tu navegador:
https://tu-sitio-moodle.com/local/telegram_integration/debug-full-system.php
```

**Busca estos indicadores críticos:**
- ✅ Plugin instalado
- ✅ Usuarios vinculados a Telegram
- ✅ Tabla `local_telegram_user_topic_performance` existe
- ✅ Funciones críticas disponibles

**🚨 DETENTE SI:**
- ❌ Plugin no instalado → Instalar/reinstalar plugin
- ❌ No hay usuarios vinculados → Vincular usuarios primero
- ❌ Tabla no existe → Crear tabla manualmente

### **PASO 2: Test Manual de la Función**

Ejecuta el test manual para verificar si la función de actualización funciona:

```bash
# Desde tu navegador:
https://tu-sitio-moodle.com/local/telegram_integration/test-manual-update.php
```

**Resultados posibles:**

#### ✅ **Si la función FUNCIONA:**
- Verás nuevos registros en la tabla
- **CONCLUSIÓN:** El problema está en el Event Observer
- **CONTINÚA:** Paso 3

#### ❌ **Si la función FALLA:**
- No se crean registros
- **CONCLUSIÓN:** El problema está en la función/permisos
- **CONTINÚA:** Paso 4

### **PASO 3: Test del Event Observer**

Si la función funciona, verifica si el observer se ejecuta:

```bash
# Desde tu navegador:
https://tu-sitio-moodle.com/local/telegram_integration/test-observer-execution.php
```

**Verifica:**
- ✅ Archivo `db/events.php` existe
- ✅ Clase `observer` cargada
- ✅ Event handlers registrados en la base de datos

**🚨 DETENTE SI:**
- ❌ Event handlers NO registrados → Reinstalar plugin
- ❌ Archivos faltantes → Verificar instalación

### **PASO 4: Verificar Permisos y Estructura**

Si la función falla, revisa permisos y estructura:

#### A) **Verificar Permisos de Base de Datos**
```sql
-- Verificar permisos en la tabla
SHOW GRANTS FOR 'tu_usuario_moodle'@'localhost';

-- Intentar insertar manualmente
INSERT INTO mdl_local_telegram_user_topic_performance 
(telegramuserid, sectionid, sectionname, totalquestions, correctanswers, incorrectanswers, accuracy, lastactivity, createdat, updatedat)
VALUES (123, 456, 'test', 5, 3, 2, 60.00, 1642334567, 1642334567, 1642334567);
```

#### B) **Verificar Estructura de Tabla**
```sql
DESCRIBE mdl_local_telegram_user_topic_performance;
```

**Estructura esperada:**
- `telegramuserid` (int)
- `sectionid` (int)
- `sectionname` (varchar)
- `totalquestions` (int)
- `correctanswers` (int)
- `incorrectanswers` (int)
- `accuracy` (decimal)
- `lastactivity` (int)
- `createdat` (int)
- `updatedat` (int)

### **PASO 5: Test en Vivo**

Realizar un cuestionario real para monitorear el flujo completo:

#### **Preparación:**
1. **Activar debug en Moodle:**
   ```php
   // En config.php
   $CFG->debug = DEBUG_DEVELOPER;
   $CFG->debugdisplay = 1;
   ```

2. **Preparar usuario de prueba:**
   - Usuario vinculado a Telegram
   - Permisos de estudiante (no profesor)

#### **Proceso de Prueba:**
1. **Iniciar cuestionario** con usuario vinculado
2. **Completar cuestionario** 
3. **Monitorear logs** en tiempo real
4. **Verificar tablas** después

#### **Logs a Buscar:**
```
=== TELEGRAM INTEGRATION (v2) ===
Event: quiz_attempt_submitted - Attempt ID: X, User ID: Y
User details: username (firstname lastname)
Quiz found: 'Nombre del Quiz' in course Z
Subject mapped: 'tema_detectado'
Successfully updated topic performance for user Y in subject 'tema_detectado'.
=== END TELEGRAM INTEGRATION DEBUG ===
```

### **PASO 6: Verificar Resultados**

Después del test en vivo:

#### **Verificar `moodleactivity`:**
```sql
SELECT * FROM moodleactivity 
WHERE moodle_user_id = TU_USER_ID 
ORDER BY id DESC LIMIT 5;
```

#### **Verificar `mdl_local_telegram_user_topic_performance`:**
```sql
SELECT * FROM mdl_local_telegram_user_topic_performance 
WHERE telegramuserid = TU_TELEGRAM_USER_ID 
ORDER BY updatedat DESC LIMIT 5;
```

### **PASO 7: Análisis de Resultados**

#### **Escenario A: Ambas tablas se actualizan**
- ✅ **PROBLEMA RESUELTO**
- El sistema funciona correctamente

#### **Escenario B: Solo `moodleactivity` se actualiza**
- ❌ **PROBLEMA:** Observer no llama a la función de rendimiento
- **SOLUCIÓN:** Revisar código del observer

#### **Escenario C: Ninguna tabla se actualiza**
- ❌ **PROBLEMA:** Observer no se ejecuta
- **SOLUCIÓN:** Reinstalar plugin o verificar definición de eventos

#### **Escenario D: No hay logs de Telegram**
- ❌ **PROBLEMA:** Observer no registrado o usuario no vinculado
- **SOLUCIÓN:** Verificar instalación y vinculación

## 🛠️ Soluciones Según el Diagnóstico

### **SOLUCIÓN 1: Reinstalar Plugin**
```bash
# Desde Moodle Admin:
Administración > Plugins > Plugins locales > Telegram Integration > Desinstalar
# Luego reinstalar
```

### **SOLUCIÓN 2: Crear Tabla Manualmente**
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

### **SOLUCIÓN 3: Reparar Observer**
```php
// Verificar en classes/observer.php que existe:
public static function quiz_attempt_submitted($event) {
    // Código del observer
}
```

### **SOLUCIÓN 4: Vincular Usuario**
```bash
# Desde perfil de usuario:
Perfil > Telegram Integration > Seguir proceso de vinculación
```

## 📊 Checklist de Verificación

### **✅ Requisitos Básicos:**
- [ ] Plugin instalado y activo
- [ ] Usuario vinculado a Telegram
- [ ] Tabla `local_telegram_user_topic_performance` existe
- [ ] Permisos de base de datos correctos

### **✅ Funcionalidad:**
- [ ] Función `local_telegram_integration_update_user_topic_performance` existe
- [ ] Función devuelve `true` en test manual
- [ ] Event observer registrado en base de datos
- [ ] Logs de debug activados

### **✅ Test en Vivo:**
- [ ] Cuestionario genera logs de Telegram
- [ ] Tabla `moodleactivity` se actualiza
- [ ] Tabla `local_telegram_user_topic_performance` se actualiza
- [ ] Mapeo de temas funciona correctamente

## 🚨 Puntos Críticos de Fallo

### **1. Usuario no vinculado**
- **Síntoma:** No hay logs de Telegram
- **Verificación:** Revisar tabla `local_telegram_verification`
- **Solución:** Vincular usuario manualmente

### **2. Observer no registrado**
- **Síntoma:** No se ejecuta el observer
- **Verificación:** Revisar tabla `events_handlers`
- **Solución:** Reinstalar plugin

### **3. Función falla silenciosamente**
- **Síntoma:** Observer se ejecuta pero no actualiza tabla
- **Verificación:** Test manual de función
- **Solución:** Revisar permisos y estructura

### **4. Tabla no existe**
- **Síntoma:** Error SQL al intentar insertar
- **Verificación:** `SHOW TABLES LIKE '%telegram_user_topic_performance%'`
- **Solución:** Crear tabla manualmente

## 📞 Soporte Adicional

Si después de seguir esta guía el problema persiste:

1. **Documentar resultados** de cada paso
2. **Recopilar logs** de error específicos
3. **Capturar estructura** de base de datos
4. **Verificar versión** de Moodle y PHP

---

*Guía creada: 2025-01-16*  
*Versión: 1.0*  
*Estado: Diagnóstico sistemático completo* 