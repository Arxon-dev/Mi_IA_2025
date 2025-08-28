# Instrucciones de Actualización - Plugin Failed Questions Recovery

## Versión 1.0.2 - Corrección de Problemas de Captura

### 1. Actualizar el Plugin

1. **Ir a Administración del Sitio**
   - Ir a `Administración del sitio > Notificaciones`
   - Hacer clic en `Actualizar base de datos de Moodle`

2. **Limpiar Caché**
   - Ir a `Administración del sitio > Desarrollo > Purgar cachés`
   - Hacer clic en `Purgar todos los cachés`

### 2. Verificar Instalación

1. **Acceder a las Herramientas de Testing**
   - Ir a: `https://tu-sitio.com/local/failed_questions_recovery/test.php`
   - Ejecutar cada test para verificar que todo funciona correctamente

2. **Verificar Permisos**
   - Ir a `Administración del sitio > Usuarios > Permisos > Definir roles`
   - Verificar que los estudiantes tengan permisos para `local/failed_questions_recovery:use`

### 3. Probar el Plugin

1. **Como Estudiante:**
   - Realizar un quiz y responder algunas preguntas incorrectamente
   - Enviar el quiz
   - Ir a `Perfil > Recuperación de Preguntas Falladas`
   - Hacer clic en `Probar Plugin` para verificar que funciona

2. **Verificar Logs de Error:**
   - Ir a `Administración del sitio > Informes > Logs`
   - Buscar entradas que contengan "Failed Questions Recovery"
   - Los logs deberían mostrar que las preguntas se están procesando

### 4. Problemas Comunes y Soluciones

#### Problema: No aparecen preguntas falladas
**Solución:**
1. Verificar que el observer esté registrado (usar test.php)
2. Verificar que los eventos se estén disparando (revisar logs)
3. Usar la función de debug en el panel del estudiante

#### Problema: Errores de permisos
**Solución:**
1. Verificar que el contexto de usuario esté configurado correctamente
2. Resetear permisos del rol de estudiante si es necesario

#### Problema: El plugin no responde
**Solución:**
1. Verificar que las tablas de la base de datos existan
2. Limpiar cachés de Moodle
3. Verificar logs de error de PHP

### 5. Funciones de Debug Disponibles

En el panel del estudiante (`index.php`) hay dos botones de prueba:

1. **Probar Plugin**: Verifica el estado general del plugin
2. **Debug Quiz Reciente**: Procesa manualmente el quiz más reciente

### 6. Configuración Adicional

- Ir a `Administración del sitio > Plugins > Plugins locales > Failed Questions Recovery`
- Configurar:
  - Logging detallado: Activado (para debug)
  - Preguntas por defecto: 10
  - Limpieza automática: 30 días

### 7. Monitoreo Post-Actualización

1. **Verificar Funcionamiento:**
   - Realizar un quiz de prueba con un estudiante
   - Verificar que las preguntas falladas aparezcan en el panel

2. **Revisar Logs:**
   - Los logs deberían mostrar mensajes como:
     - "Failed Questions Recovery - Processing attempt: [ID] for user: [ID]"
     - "Failed Questions Recovery - Recording failed question: [ID]"

### 8. Contacto y Soporte

Si después de seguir estos pasos el plugin no funciona correctamente:

1. Exportar los resultados de `test.php`
2. Revisar los logs de error de Moodle
3. Verificar que los observers están registrados correctamente

### 9. Verificación Final

El plugin está funcionando correctamente si:
- ✅ Los estudiantes pueden acceder al panel sin errores de permisos
- ✅ Las preguntas falladas aparecen después de realizar un quiz
- ✅ Los estudiantes pueden crear quizzes de recuperación
- ✅ Los logs muestran actividad del plugin

---

**Nota:** Esta actualización incluye logging detallado para ayudar con el debug. Una vez que el plugin esté funcionando correctamente, puedes desactivar el logging detallado desde la configuración del plugin. 