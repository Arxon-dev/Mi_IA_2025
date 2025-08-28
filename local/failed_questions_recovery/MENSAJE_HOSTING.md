# Mensaje para el Proveedor de Hosting

## Asunto: Solicitud de permisos INSERT/UPDATE para tabla de base de datos

Estimado equipo de soporte,

Tengo un problema con los permisos de mi base de datos MySQL:

**Detalles de mi cuenta:**
- Usuario de BD: `u449034524_3OioS`
- Base de datos: `u449034524_zSy1m`
- Tabla específica: `mdl_local_fqr_failed_questions`

**Problema:**
Mi aplicación Moodle necesita escribir datos en la tabla `mdl_local_fqr_failed_questions`, pero el usuario actual solo tiene permisos de SELECT y DELETE. Necesito también permisos de INSERT y UPDATE.

**Permisos actuales:**
- ✅ SELECT: Funciona
- ❌ INSERT: No funciona
- ❌ UPDATE: No funciona  
- ✅ DELETE: Funciona

**Solicitud:**
Por favor, otorguen permisos de INSERT y UPDATE al usuario `u449034524_3OioS` para la tabla `mdl_local_fqr_failed_questions` en la base de datos `u449034524_zSy1m`.

**Error específico que recibo:**
```
#1142 - GRANT comando denegado a usuario 'u449034524_3OioS'@'127.0.0.1' 
para la tabla `u449034524_zSy1m`.`mdl_local_fqr_failed_questions`
```

Muchas gracias por su ayuda.

[Tu nombre]
[Tu cuenta de hosting] 