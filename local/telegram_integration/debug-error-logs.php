<?php
// Script para verificar logs de error después de los cambios
echo "<h2>Debug: Verificación de Logs de Error</h2>";

// Verificar logs de PHP
echo "<h3>Últimos Errores de PHP:</h3>";
echo "<div style='background-color: #f8f9fa; padding: 10px; border: 1px solid #dee2e6; margin: 10px 0;'>";

$php_log_locations = [
    '/var/log/php_errors.log',
    '/var/log/apache2/error.log',
    '/var/log/nginx/error.log',
    ini_get('error_log'),
    'php://stderr'
];

foreach ($php_log_locations as $log_path) {
    if (file_exists($log_path) && is_readable($log_path)) {
        echo "<p><strong>Log encontrado:</strong> $log_path</p>";
        $lines = file($log_path);
        $recent_lines = array_slice($lines, -20); // Últimas 20 líneas
        echo "<pre style='background-color: #fff; padding: 10px; border: 1px solid #ccc; overflow-x: auto;'>";
        echo htmlspecialchars(implode('', $recent_lines));
        echo "</pre>";
        break;
    }
}

echo "</div>";

// Verificar si hay errores de sintaxis en los archivos modificados
echo "<h3>Verificación de Sintaxis en Archivos Modificados:</h3>";

$modified_files = [
    __DIR__ . '/classes/observer.php',
    __DIR__ . '/locallib.php',
    __DIR__ . '/debug-quiz-mapping.php',
    __DIR__ . '/test-theme-mapping.php',
    __DIR__ . '/fix-general-topics.php'
];

foreach ($modified_files as $file) {
    echo "<div style='margin: 10px 0; padding: 10px; border: 1px solid #ddd;'>";
    echo "<strong>Archivo:</strong> " . basename($file) . "<br>";
    
    if (file_exists($file)) {
        // Verificar sintaxis PHP
        $output = [];
        $return_var = 0;
        exec("php -l " . escapeshellarg($file) . " 2>&1", $output, $return_var);
        
        if ($return_var === 0) {
            echo "<span style='color: green;'>✅ Sintaxis OK</span>";
        } else {
            echo "<span style='color: red;'>❌ Error de sintaxis:</span><br>";
            echo "<pre style='background-color: #ffeeee; padding: 5px;'>";
            echo htmlspecialchars(implode("\n", $output));
            echo "</pre>";
        }
    } else {
        echo "<span style='color: orange;'>⚠️ Archivo no encontrado</span>";
    }
    echo "</div>";
}

// Verificar conexión a la base de datos
echo "<h3>Verificación de Conexión a Base de Datos:</h3>";
try {
    // Intentar incluir config de Moodle
    require_once('../../../config.php');
    
    echo "<div style='background-color: #e8f5e8; padding: 10px; margin: 10px 0;'>";
    echo "<p>✅ Configuración de Moodle cargada correctamente</p>";
    echo "<p><strong>Tipo de BD:</strong> " . $CFG->dbtype . "</p>";
    echo "<p><strong>Host:</strong> " . $CFG->dbhost . "</p>";
    echo "<p><strong>Base de datos:</strong> " . $CFG->dbname . "</p>";
    echo "</div>";
    
    // Probar consulta simple
    $DB->get_records('config', [], '', 'name', 0, 1);
    echo "<p style='color: green;'>✅ Conexión a base de datos funcionando</p>";
    
} catch (Exception $e) {
    echo "<div style='background-color: #ffeeee; padding: 10px; margin: 10px 0;'>";
    echo "<p style='color: red;'>❌ Error de conexión a base de datos:</p>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
    echo "</div>";
}

echo "<h3>Recomendaciones:</h3>";
echo "<ul>";
echo "<li>Si hay errores de sintaxis, necesitamos corregirlos inmediatamente</li>";
echo "<li>Si hay errores de base de datos, podría ser un problema de compatibilidad</li>";
echo "<li>Verifica también los logs de Apache/Nginx para más detalles</li>";
echo "</ul>";
?> 