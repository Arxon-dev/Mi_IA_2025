# Solución para Error HTTP 500 en payment.php

## Descripción del Problema
Cuando los usuarios intentan acceder a `https://campus.opomelilla.com/local/failed_questions_recovery/payment.php`, aparece un error HTTP 500 que impide el acceso a la página de pago.

## Diagnóstico
He creado varios archivos para diagnosticar y solucionar el problema:

### Archivos de Diagnóstico Creados:
1. `debug_payment_error.php` - Diagnóstico completo del sistema
2. `payment_debug_simple.php` - Diagnóstico simplificado paso a paso
3. `payment_simple.php` - Versión simplificada existente
4. `fix_payment_error.php` - Script de corrección automática

## Pasos para Solucionar el Problema

### Paso 1: Ejecutar Diagnóstico
Accede a uno de estos archivos para identificar el problema específico:

```
https://campus.opomelilla.com/local/failed_questions_recovery/debug_payment_error.php
```
o
```
https://campus.opomelilla.com/local/failed_questions_recovery/payment_debug_simple.php
```

### Paso 2: Ejecutar Script de Corrección
**IMPORTANTE: Solo un administrador puede ejecutar este script**

Accede como administrador a:
```
https://campus.opomelilla.com/local/failed_questions_recovery/fix_payment_error.php
```

Este script:
- Verifica y crea la tabla de pagos si no existe
- Configura los permisos necesarios
- Verifica los archivos de idioma
- Crea una versión corregida de payment.php
- Limpia el caché

### Paso 3: Probar la Versión Corregida
Después de ejecutar el script de corrección, prueba:
```
https://campus.opomelilla.com/local/failed_questions_recovery/payment_corrected.php
```

### Paso 4: Reemplazar el Archivo Original (si funciona)
Si `payment_corrected.php` funciona correctamente:

1. Haz una copia de seguridad del archivo original:
   ```bash
   cp payment.php payment_backup.php
   ```

2. Reemplaza el archivo original:
   ```bash
   cp payment_corrected.php payment.php
   ```

## Posibles Causas del Error HTTP 500

### 1. Problemas de Base de Datos
- Tabla `local_fqr_user_payments` no existe
- Problemas de conexión a la base de datos
- Errores en consultas SQL

### 2. Problemas de Permisos
- Capacidad `local/failed_questions_recovery:use` no definida
- Usuario sin permisos necesarios
- Problemas de contexto

### 3. Problemas de Archivos
- Archivos de idioma faltantes o corruptos
- Clases PHP no encontradas
- Errores de sintaxis

### 4. Problemas de Configuración
- PayPal Client ID no configurado
- Variables de entorno faltantes
- Configuración de Moodle incorrecta

### 5. Problemas de JavaScript
- Código JavaScript inline problemático
- Conflictos con AMD/RequireJS
- Errores en el SDK de PayPal

## Soluciones Implementadas

### En payment_corrected.php:
1. **Mejor manejo de errores**: Try-catch comprehensivo
2. **Validación de dependencias**: Verificación de archivos y clases
3. **Fallbacks seguros**: Valores por defecto para configuraciones
4. **JavaScript simplificado**: Eliminación de código JavaScript complejo
5. **Logging mejorado**: Registro de errores para debugging

### Características de Seguridad:
- Desactivación de display_errors en producción
- Logging de errores para debugging
- Validación de entrada de usuario
- Manejo seguro de excepciones

## Verificaciones Post-Corrección

Después de aplicar las correcciones, verifica:

1. **Acceso básico**: La página carga sin error 500
2. **Autenticación**: Los usuarios pueden acceder
3. **Permisos**: Los usuarios tienen los permisos necesarios
4. **Base de datos**: Las tablas existen y son accesibles
5. **Funcionalidad**: El proceso de pago funciona correctamente

## Logs a Revisar

Si el problema persiste, revisa estos logs:

1. **Logs de Apache/Nginx**:
   - `/var/log/apache2/error.log`
   - `/var/log/nginx/error.log`

2. **Logs de PHP**:
   - `/var/log/php/error.log`
   - Configurado en `php.ini`

3. **Logs de Moodle**:
   - `moodledata/temp/logs/`
   - Panel de administración > Informes > Logs

## Contacto para Soporte

Si necesitas ayuda adicional:
- Email: contacto@opomelilla.com
- WhatsApp: 663392545

## Notas Técnicas

### Estructura de la Tabla de Pagos
```sql
CREATE TABLE local_fqr_user_payments (
    id INT(10) NOT NULL AUTO_INCREMENT,
    userid INT(10) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_amount DECIMAL(10,2) NOT NULL DEFAULT 6.00,
    payment_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    payment_id VARCHAR(255) NULL,
    payment_date INT(10) NULL,
    expiry_date INT(10) NULL,
    timecreated INT(10) NOT NULL,
    timemodified INT(10) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (userid) REFERENCES mdl_user(id)
);
```

### Permisos Requeridos
- `local/failed_questions_recovery:use` - Usar el plugin
- Asignado al rol 'user' (usuarios autenticados)

### Configuración de PayPal
- Client ID configurado en plugin settings o archivo .env
- Fallback hardcoded disponible para testing

---

**Última actualización**: Enero 2025
**Versión del plugin**: 1.0
**Compatibilidad**: Moodle 3.9+