<?php
require_once('../../config.php');
require_login();

$debug_files = [
    'debug_dashboard.php',
    'force_refresh.php',
    'clear_cache.php',
    'cleanup_debug.php'  // Este mismo archivo
];

echo "🧹 Limpiando archivos de debug temporales<br><br>";

foreach ($debug_files as $file) {
    if (file_exists($file)) {
        if (unlink($file)) {
            echo "✅ Eliminado: $file<br>";
        } else {
            echo "❌ Error eliminando: $file<br>";
        }
    } else {
        echo "ℹ️ No encontrado: $file<br>";
    }
}

echo "<br>🎯 Limpieza completada<br>";
echo "📍 Regresa al <a href='index.php'>dashboard principal</a><br>"; 