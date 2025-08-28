# Instrucciones de Actualización - NeuroOpositor Plugin

## Problemas Solucionados

✅ **Títulos de temas visibles y en color negro**
✅ **Información de progreso y estadísticas visibles**
✅ **Botones "Estudiar" visibles y funcionales**
✅ **Estilos forzados mediante JavaScript**
✅ **Estilos inline en templates como respaldo**

## Archivos Modificados

### 1. Archivos PHP
- `questions.php` - Añadida carga de fixes.css y force-styles.js
- `index.php` - Añadida carga de fixes.css y force-styles.js
- `version.php` - Incrementada versión a 2025010102

### 2. Templates
- `templates/questions.mustache` - Mejorada estructura HTML con estilos inline completos

### 3. Estilos CSS
- `styles/neuroopositor.css` - Añadidos selectores de alta especificidad
- `styles/fixes.css` - **ARCHIVO ACTUALIZADO** con correcciones CSS de máxima prioridad

### 4. JavaScript
- `js/neuroopositor.js` - Añadida función forceTopicStyles con ejecución automática
- `js/force-styles.js` - **NUEVO ARCHIVO** con aplicación inmediata de estilos

## Pasos para Actualizar en Moodle

### 1. Subir Archivos
- Sube todos los archivos modificados a tu servidor Moodle
- Asegúrate de que el nuevo archivo `styles/fixes.css` esté incluido

### 2. Actualizar Plugin en Moodle
1. Ve a **Administración del sitio** → **Notificaciones**
2. Moodle detectará que hay una nueva versión del plugin
3. Haz clic en **Actualizar base de datos ahora**

### 3. Limpiar Caché
1. Ve a **Administración del sitio** → **Desarrollo** → **Purgar cachés**
2. Haz clic en **Purgar todos los cachés**

### 4. Verificar Cambios
1. Ve a la URL: `https://campus.opomelilla.com/local/neuroopositor/index.php?courseid=0&action=questions`
2. Verifica que:
   - Los títulos de los temas se muestran en negro
   - La información "Block: X, Difficulty: X, Progress: X%" es visible
   - Todos los botones "Estudiar" aparecen correctamente

## Cambios Técnicos Realizados

### 1. Estilos CSS de Máxima Prioridad
- Selectores con `html body` para máxima especificidad
- Uso extensivo de `!important` para sobrescribir cualquier estilo de Moodle
- Reset completo de estilos conflictivos
- Colores forzados: títulos en negro (#000000), botones en azul (#007bff)
- Media queries para responsividad
- Animaciones y efectos hover mejorados

### 2. JavaScript de Aplicación Inmediata
- `force-styles.js`: Se ejecuta inmediatamente al cargar
- `MutationObserver` para detectar cambios dinámicos en el DOM
- Aplicación de estilos mediante `setProperty()` con `!important`
- Múltiples puntos de ejecución (DOMContentLoaded, load, timeouts)
- Función `forceTopicStyles` integrada en neuroopositor.js

### 3. Estilos Inline en Templates
- Estilos inline completos como medida de emergencia
- Aplicación directa en el HTML generado por Mustache
- Cobertura total de todos los elementos (títulos, párrafos, botones, iconos)
- Respaldo cuando CSS externo falla

### 4. Estrategia Multi-Capa
- **Capa 1**: Estilos inline en HTML
- **Capa 2**: CSS externo con máxima especificidad
- **Capa 3**: JavaScript de aplicación inmediata
- **Capa 4**: JavaScript de monitoreo continuo

## Solución de Problemas

Si los cambios no se reflejan inmediatamente:

1. **Fuerza la recarga del navegador**: Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)
2. **Verifica la versión del plugin**: Debe mostrar v1.0.1-alpha
3. **Revisa la consola del navegador**: Busca errores de JavaScript
4. **Verifica que los archivos CSS se cargan**: Inspecciona el código fuente de la página

## Contacto

Si persisten los problemas, verifica que:
- Todos los archivos se han subido correctamente
- Los permisos de archivos son correctos
- No hay conflictos con otros plugins o temas de Moodle