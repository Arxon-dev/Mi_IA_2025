<?php
require_once('../../config.php');

// Verificar que el usuario está logueado
require_login();

// Solo usuarios con capacidad para gestionar el sitio
require_capability('moodle/site:config', context_system::instance());

echo "🔄 Limpieza completa de caché de Moodle<br><br>";

// Purgar todos los cachés
purge_all_caches();

echo "✅ Caché de Moodle purgado completamente<br>";

// Limpiar caché de JavaScript/CSS
$CFG->cachejs = false;
$CFG->themerev++;

echo "✅ Caché de recursos (JS/CSS) renovado<br>";

// Forzar recarga de definiciones de eventos
\core\event\manager::phpunit_reset();

echo "✅ Eventos del sistema reiniciados<br>";

echo "<br>🎯 <strong>Caché completamente limpiado</strong><br>";
echo "📍 Regresa al <a href='index.php'>dashboard principal</a> y actualiza la página (Ctrl+F5)<br>";
echo "🔄 La nueva categoría debería aparecer ahora<br>"; 