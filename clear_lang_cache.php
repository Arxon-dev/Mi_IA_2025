<?php
/**
 * INSTRUCCIONES PARA LIMPIAR EL CACHÉ DE CADENAS DE IDIOMA
 * 
 * Los placeholders [[studysession]], [[selecttopic]], [[alltopics]], [[legend]], [[view_mode]]
 * siguen apareciendo porque Moodle tiene cacheadas las cadenas de idioma antiguas.
 * 
 * SOLUCIÓN MANUAL (RECOMENDADA):
 * 
 * 1. OPCIÓN RÁPIDA - Purgar todas las cachés:
 *    - Ve a: Administración del sitio > Desarrollo > Purgar todas las cachés
 *    - Haz clic en "Purgar todas las cachés"
 * 
 * 2. OPCIÓN ESPECÍFICA - Solo caché de idiomas:
 *    - Ve a: Administración del sitio > Plugins > Cachés > Administración de cachés
 *    - Busca "Language string cache" en la lista
 *    - Haz clic en "Purgar" junto a esa entrada
 * 
 * 3. OPCIÓN TEMPORAL - Desactivar caché:
 *    - Ve a: Administración del sitio > Idioma > Configuración de idioma
 *    - Desactiva "Cachear todas las cadenas de idioma"
 *    - Guarda los cambios
 * 
 * DESPUÉS DE HACER CUALQUIERA DE ESTAS ACCIONES:
 * - Recarga la página del plugin NeuroOpositor
 * - Los placeholders deberían mostrar ahora los textos en español
 * 
 * CADENAS AÑADIDAS AL ARCHIVO DE IDIOMA:
 * - studysession = 'Sesión de Estudio'
 * - selecttopic = 'Seleccionar Tema'
 * - alltopics = 'Todos los Temas'
 * - legend = 'Leyenda'
 * - view_mode = 'Modo de Vista'
 * - Y muchas más...
 */

echo "<h2>Instrucciones para limpiar el caché de Moodle</h2>";
echo "<p><strong>Los placeholders siguen apareciendo porque Moodle tiene cacheadas las cadenas de idioma.</strong></p>";
echo "<h3>Soluciones:</h3>";
echo "<ol>";
echo "<li><strong>Purgar todas las cachés:</strong><br>";
echo "Administración del sitio > Desarrollo > Purgar todas las cachés</li>";
echo "<li><strong>Purgar solo caché de idiomas:</strong><br>";
echo "Administración del sitio > Plugins > Cachés > Administración de cachés<br>";
echo "Buscar 'Language string cache' y hacer clic en 'Purgar'</li>";
echo "<li><strong>Desactivar caché temporalmente:</strong><br>";
echo "Administración del sitio > Idioma > Configuración de idioma<br>";
echo "Desactivar 'Cachear todas las cadenas de idioma'</li>";
echo "</ol>";
echo "<p><em>Después de cualquiera de estas acciones, recarga la página del plugin.</em></p>";
?>