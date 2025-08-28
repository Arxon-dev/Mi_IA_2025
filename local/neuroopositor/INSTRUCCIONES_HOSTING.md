# Instrucciones para Diagnosticar y Corregir el Error "Undefined constant progress_data"

## 📋 Resumen del Problema

El error "Undefined constant progress_data" indica que el sistema está intentando usar `progress_data` como una constante en lugar de como un alias de clase. Este problema puede tener varias causas:

1. **Alias duplicados** - Múltiples definiciones de `class_alias`
2. **Uso incorrecto** - Usar `progress_data::` en lugar de `statistics::`
3. **Referencias incorrectas** - Usar `local_neuroopositor\progress_data` en lugar de `local_neuroopositor\statistics`
4. **Orden de carga** - El alias no se crea antes de ser usado

## 🛠️ Scripts de Diagnóstico y Corrección

Se han creado 5 scripts especializados para identificar y corregir este problema:

### ⚠️ IMPORTANTE: Scripts Actualizados para Hosting

Algunos scripts han sido corregidos para funcionar correctamente en entornos de hosting compartido que tienen restricciones de funciones PHP.

## ⚠️ Configuración de tu Hosting (opomelilla.com)

**Funciones PHP deshabilitadas confirmadas**:
```
system, exec, shell_exec, passthru, mysql_list_dbs, ini_alter, dl, symlink, link, chgrp, leak, popen, apache_child_terminate, virtual, mb_send_mail
```

### Scripts con Errores:
- `corregir_progress_data_hosting.php` - **PROBLEMÁTICO**: Usa `exec()` (CONFIRMADO DESHABILITADO) ❌
- `corregir_hosting_sin_exec.php` - **RECOMENDADO**: 100% compatible con tu hosting ✅

### Scripts Corregidos:
- `diagnostico_hosting.php` - **CORREGIDO**: Ya no usa `php_check_syntax()` ✅

### 1. `diagnostico_hosting.php` - Diagnóstico Completo
**Propósito**: Análisis exhaustivo del sistema y identificación de problemas.

**Cómo usar**:
1. Sube el archivo al directorio `/local/neuroopositor/` de tu hosting
2. Accede desde el navegador: `https://tudominio.com/moodle/local/neuroopositor/diagnostico_hosting.php`
3. Revisa la salida en pantalla y el archivo `diagnostico_log.txt` generado

**Qué hace**:
- Verifica que todos los archivos principales existen
- Comprueba el contenido de archivos clave
- Detecta alias duplicados
- Busca usos problemáticos de `progress_data`
- Simula el flujo de ejecución
- Genera un log detallado

### 2. `test_error_hosting.php` - Reproducción del Error
**Propósito**: Reproduce exactamente el error que está ocurriendo.

**Cómo usar**:
1. Sube el archivo al directorio `/local/neuroopositor/`
2. Accede desde el navegador: `https://tudominio.com/moodle/local/neuroopositor/test_error_hosting.php`
3. Observa si se reproduce el error y en qué punto exacto ocurre

**Qué hace**:
- Simula la carga de Moodle
- Carga la clase `statistics`
- Crea el alias `progress_data`
- Intenta incluir `statistics.php`
- Identifica el punto exacto donde falla

### 3. `buscar_referencias_progress_data.php` - Búsqueda Exhaustiva
**Propósito**: Encuentra todas las referencias a `progress_data` en el código.

**Cómo usar**:
1. Sube el archivo al directorio `/local/neuroopositor/`
2. Accede desde el navegador: `https://tudominio.com/moodle/local/neuroopositor/buscar_referencias_progress_data.php`
3. Revisa la tabla de resultados y el archivo `reporte_progress_data.txt`

**Qué hace**:
- Escanea todos los archivos PHP del plugin
- Identifica diferentes tipos de uso de `progress_data`
- Clasifica cada uso como problemático o correcto
- Genera un reporte visual y de texto
- Muestra exactamente qué líneas necesitan corrección

### 4. `corregir_progress_data_hosting.php` - ⚠️ PROBLEMÁTICO
**Propósito**: Corrección automática (TIENE ERRORES EN HOSTING)

**⚠️ PROBLEMA DETECTADO**:
- Este script usa la función `exec()` que NO está disponible en hosting compartido
- Genera error: "Call to undefined function exec()"
- **NO USAR** - Reemplazado por script corregido

### 5. `corregir_hosting_sin_exec.php` - ✅ CORRECCIÓN RECOMENDADA
**Propósito**: Corrige automáticamente los problemas SIN usar funciones prohibidas.

**Cómo usar**:
1. **IMPORTANTE**: Haz backup de tu plugin antes de ejecutar este script
2. Sube el archivo al directorio `/local/neuroopositor/`
3. Accede desde el navegador: `https://tudominio.com/moodle/local/neuroopositor/corregir_hosting_sin_exec.php`
4. Revisa los cambios aplicados y el archivo `correccion_hosting_log.txt`

**Qué hace**:
- **COMPATIBLE CON HOSTING**: No usa `exec()` ni `php_check_syntax()`
- Hace backup automático de todos los archivos modificados
- Corrige usos de `progress_data::` por `statistics::`
- Corrige referencias incorrectas de namespace
- Elimina alias duplicados
- Verificación de sintaxis básica compatible con hosting
- Genera un log detallado de todos los cambios

## 📝 Proceso Recomendado

### Paso 1: Diagnóstico Inicial
1. Ejecuta `diagnostico_hosting.php`
2. Revisa el archivo `diagnostico_log.txt` generado
3. Identifica si hay problemas obvios

### Paso 2: Análisis Detallado
1. Ejecuta `buscar_referencias_progress_data.php`
2. Revisa la tabla de resultados en el navegador
3. Examina el archivo `reporte_progress_data.txt`
4. Identifica exactamente qué archivos y líneas tienen problemas

### Paso 3: Reproducción del Error
1. Ejecuta `test_error_hosting.php`
2. Observa si se reproduce el error exacto
3. Anota en qué punto específico falla

### Paso 4: Corrección del Error HTTP 500 y Aplicación de Correcciones
⚠️ **ADVERTENCIA**: Haz backup completo antes de este paso

#### 🚨 Si obtienes ERROR HTTP 500:

**Paso 4.1 - Diagnóstico del Error 500:**

```
https://campus.opomelilla.com/local/neuroopositor/test_correccion_simple.php
```

Este script te ayudará a identificar qué está causando el error 500.

**Paso 4.2 - 🆕 Corrección V5 Error Base de Datos** (🆕 NUEVA VERSIÓN - MÁS RECOMENDADO):

```
https://campus.opomelilla.com/local/neuroopositor/correccion_automatica_hosting_v5.php
```

🆕 **ESTE SCRIPT V5 CORRIGE ESPECÍFICAMENTE EL ERROR "Error al leer de la base de datos"**:
- 🆕 **Especializado** en errores de base de datos
- ✅ Corrige problemas de conexión y consultas SQL
- ✅ Manejo optimizado de transacciones
- ✅ Backups automáticos con sufijo `_v5`
- ✅ Log específico: `log_v5.txt`
- 🆕 **NUEVA VERSIÓN** para hosting compartido

**Paso 4.3 - ✅ Corrección V4 Ultra Minimalista** (✅ FUNCIONANDO - ALTERNATIVA):

```
https://campus.opomelilla.com/local/neuroopositor/correccion_automatica_hosting_v4.php
```

✅ **ESTE SCRIPT V4 HA SIDO PROBADO Y FUNCIONA PERFECTAMENTE**:
- ✅ **Ultra minimalista** (solo 80 líneas) - EVITA HTTP 500
- ✅ Límites reducidos de memoria (64M) y tiempo (60s)
- ✅ Manejo básico de errores sin complejidad
- ✅ Backups automáticos con sufijo `_v4`
- ✅ Log simple y efectivo: `log_v4.txt`
- ✅ **CONFIRMADO FUNCIONANDO** en hosting compartido
- ✅ Correcciones aplicadas exitosamente

**Resultado exitoso confirmado**: ✅ Corrección V4 Completada - 2025-07-27 10:09:44

#### 📋 Opciones Alternativas (si V4 falla):

**Opción 2 - Script V3** (si V4 no funciona):

```
https://campus.opomelilla.com/local/neuroopositor/correccion_automatica_hosting_v3.php
```

Este script V3:
- ✅ **Ultra simplificado** para evitar HTTP 500
- ✅ Manejo básico pero robusto de errores
- ✅ Backups automáticos con timestamp
- ✅ Log detallado: `correccion_automatica_v3_log.txt`

**Opción 3 - Script V2** (si V3 no funciona):

```
https://campus.opomelilla.com/local/neuroopositor/correccion_automatica_hosting_v2.php
```

**Opción 4 - Script Original** (si V2 no funciona):

```
https://campus.opomelilla.com/local/neuroopositor/correccion_automatica_hosting.php
```

**Opción 5 - Corrección Manual Genérica**:

1. **USA**: `corregir_hosting_sin_exec.php` (compatible con hosting)
2. **NO USES**: `corregir_progress_data_hosting.php` (tiene errores con `exec()`)
3. Revisa los cambios aplicados en `correccion_hosting_log.txt`
4. Prueba el plugin para verificar que funciona
5. Si hay problemas, restaura desde los backups automáticos (archivos .backup)

## 🔍 Interpretación de Resultados

### Tipos de Problemas Comunes

**❌ USO_ESTATICO**: `progress_data::`
- **Problema**: Usar `progress_data` como clase estática
- **Solución**: Cambiar por `statistics::`

**❌ NAMESPACE_INCORRECTO**: `local_neuroopositor\progress_data`
- **Problema**: Referencia a namespace inexistente
- **Solución**: Cambiar por `local_neuroopositor\statistics`

**❌ INSTANCIACION**: `new progress_data`
- **Problema**: Intentar crear instancia directa
- **Solución**: Cambiar por `new local_neuroopositor\statistics`

**✅ ALIAS_CORRECTO**: `class_alias('local_neuroopositor\statistics', 'progress_data')`
- **Estado**: Correcto, no requiere cambios

**📝 VARIABLE_USO**: `$progress_data`
- **Estado**: Correcto, es uso como variable

### Códigos de Color en los Reportes
- 🟢 **Verde**: Uso correcto, no requiere cambios
- 🟡 **Amarillo**: Uso como variable, generalmente correcto
- 🔴 **Rojo**: Uso problemático, requiere corrección
- ⚪ **Gris**: Uso en strings o comentarios, generalmente inofensivo

## 📁 Archivos Generados

Los scripts generan varios archivos de log y reporte:

- `diagnostico_log.txt` - Log completo del diagnóstico
- `reporte_progress_data.txt` - Reporte de todas las referencias encontradas
- `log_v4.txt` - Log de la corrección V4 ✅ (**FUNCIONANDO - MÁS RECOMENDADO**)
- `correccion_automatica_v3_log.txt` - Log de la corrección V3
- `correccion_automatica_v2_log.txt` - Log de la corrección V2
- `correccion_log.txt` - Log de las correcciones (script problemático)
- `correccion_hosting_log.txt` - Log de las correcciones (script corregido) ✅
- `*.backup.*` - Backups automáticos de archivos modificados

## 🚨 Precauciones Importantes

1. **Siempre haz backup** antes de ejecutar correcciones automáticas
2. **Prueba en entorno de desarrollo** primero si es posible
3. **Revisa los logs** después de cada ejecución
4. **No ejecutes múltiples scripts simultáneamente**
5. **Verifica que el plugin funciona** después de cualquier corrección

## 🆘 Si los Scripts No Resuelven el Problema

Si después de ejecutar todos los scripts el error persiste:

1. **Revisa los logs del servidor web** (error.log de Apache/Nginx)
2. **Verifica permisos de archivos** (deben ser legibles por el servidor web)
3. **Comprueba la caché de PHP** (puede necesitar limpieza)
4. **Revisa la configuración de Moodle** (puede haber conflictos)
5. **Examina otros plugins** que puedan estar interfiriendo

## 📞 Información para Soporte

Si necesitas ayuda adicional, proporciona:

1. Contenido completo de todos los archivos .txt generados
2. Versión de PHP del hosting
3. Versión de Moodle
4. Mensaje de error exacto y cuándo ocurre
5. Pasos específicos para reproducir el error

---

**Nota**: Estos scripts están diseñados para ser seguros y no destructivos, pero siempre es recomendable hacer backup antes de cualquier modificación automática.