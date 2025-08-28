<?php
/**
 * Debug de rutas - Test ultra simple
 */

echo "<h1>🔍 Debug de Rutas</h1>";

echo "<h2>1. Verificación de config.php</h2>";
if (file_exists('../../config.php')) {
    echo "✅ config.php encontrado<br>";
    require_once('../../config.php');
    
    if (isset($CFG)) {
        echo "✅ \$CFG está disponible<br>";
        echo "<strong>CFG->dirroot:</strong> " . $CFG->dirroot . "<br>";
    } else {
        echo "❌ \$CFG no está disponible<br>";
        die();
    }
} else {
    echo "❌ config.php NO encontrado<br>";
    die();
}

echo "<h2>2. Verificación de directorio</h2>";
$telegram_dir = $CFG->dirroot . '/local/telegram_integration';
echo "<strong>Directorio esperado:</strong> $telegram_dir<br>";
echo "<strong>¿Existe?:</strong> " . (is_dir($telegram_dir) ? "✅ SÍ" : "❌ NO") . "<br>";

echo "<h2>3. Verificación de archivo</h2>";
$config_file = $telegram_dir . '/telegram-db-config.php';
echo "<strong>Archivo esperado:</strong> $config_file<br>";
echo "<strong>¿Existe?:</strong> " . (file_exists($config_file) ? "✅ SÍ" : "❌ NO") . "<br>";

if (file_exists($config_file)) {
    echo "<strong>¿Es legible?:</strong> " . (is_readable($config_file) ? "✅ SÍ" : "❌ NO") . "<br>";
    echo "<strong>Tamaño:</strong> " . filesize($config_file) . " bytes<br>";
    
    echo "<h2>4. Intentar inclusión</h2>";
    try {
        require_once($config_file);
        echo "✅ Archivo incluido exitosamente<br>";
        
        if (function_exists('createTelegramDatabaseConnection')) {
            echo "✅ Función createTelegramDatabaseConnection disponible<br>";
        } else {
            echo "❌ Función createTelegramDatabaseConnection NO disponible<br>";
        }
    } catch (Exception $e) {
        echo "❌ Error al incluir: " . $e->getMessage() . "<br>";
    } catch (Error $e) {
        echo "❌ Error fatal: " . $e->getMessage() . "<br>";
    }
}

echo "<h2>5. Listado de archivos en directorio</h2>";
if (is_dir($telegram_dir)) {
    $files = scandir($telegram_dir);
    echo "<ul>";
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo "<li>$file</li>";
        }
    }
    echo "</ul>";
}

echo "<h2>6. Variables de entorno PHP</h2>";
echo "<strong>include_path:</strong> " . get_include_path() . "<br>";
echo "<strong>Working directory:</strong> " . getcwd() . "<br>";
echo "<strong>Script filename:</strong> " . $_SERVER['SCRIPT_FILENAME'] . "<br>";

?> 