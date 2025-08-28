<?php
// Basic access test - minimal dependencies
echo "<h1>🔍 Test de Acceso Básico</h1>";
echo "<p>Timestamp: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>Current directory: " . __DIR__ . "</p>";
echo "<p>File exists: " . (__FILE__ ? "✅ SÍ" : "❌ NO") . "</p>";

// Try to include Moodle config
echo "<h2>🔧 Test de Configuración Moodle</h2>";
try {
    require_once(__DIR__ . '/../../config.php');
    echo "<p>✅ Config.php cargado exitosamente</p>";
    echo "<p>WWW Root: " . $CFG->wwwroot . "</p>";
    echo "<p>Data Root: " . $CFG->dataroot . "</p>";
} catch (Exception $e) {
    echo "<p>❌ Error cargando config.php: " . $e->getMessage() . "</p>";
    exit;
}

// Try to include lib.php
echo "<h2>📚 Test de Librería</h2>";
try {
    require_once(__DIR__ . '/lib.php');
    echo "<p>✅ lib.php cargado exitosamente</p>";
    
    // Test if function exists
    if (function_exists('get_telegram_user_id')) {
        echo "<p>✅ Función get_telegram_user_id() encontrada</p>";
    } else {
        echo "<p>❌ Función get_telegram_user_id() NO encontrada</p>";
    }
} catch (Exception $e) {
    echo "<p>❌ Error cargando lib.php: " . $e->getMessage() . "</p>";
}

// Check authentication
echo "<h2>🔐 Test de Autenticación</h2>";
if (function_exists('isloggedin')) {
    echo "<p>isloggedin(): " . (isloggedin() ? "✅ SÍ" : "❌ NO") . "</p>";
    
    if (isloggedin()) {
        global $USER;
        echo "<p>User ID: " . $USER->id . "</p>";
        echo "<p>Username: " . $USER->username . "</p>";
    }
} else {
    echo "<p>❌ Función isloggedin() no disponible</p>";
}

echo "<h2>✅ Test completado</h2>";
?> 