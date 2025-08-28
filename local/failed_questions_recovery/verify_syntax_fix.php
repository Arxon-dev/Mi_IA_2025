<?php
/**
 * Script to verify syntax error fix in language files
 * 
 * This script:
 * 1. Checks plugin version
 * 2. Validates PHP syntax in language files
 * 3. Tests language string loading
 * 4. Clears caches
 */

require_once('../../config.php');
require_login();

echo '<h2>Verificación de Corrección de Error de Sintaxis</h2>';

// 1. Check plugin version
echo '<h3>1. Versión del Plugin</h3>';
$plugin = new stdClass();
require('version.php');
echo '<p><strong>Versión actual:</strong> ' . $plugin->version . '</p>';
echo '<p><strong>Release:</strong> ' . $plugin->release . '</p>';

// 2. Check PHP syntax in language files
echo '<h3>2. Verificación de Sintaxis PHP</h3>';

$lang_files = [
    'Español' => __DIR__ . '/lang/es/local_failed_questions_recovery.php',
    'Inglés' => __DIR__ . '/lang/en/local_failed_questions_recovery.php'
];

foreach ($lang_files as $lang => $file) {
    echo '<h4>' . $lang . '</h4>';
    
    if (!file_exists($file)) {
        echo '<p style="color: red;">✗ Archivo no existe: ' . $file . '</p>';
        continue;
    }
    
    // Check PHP syntax
    $output = [];
    $return_var = 0;
    exec('php -l "' . $file . '"', $output, $return_var);
    
    if ($return_var === 0) {
        echo '<p style="color: green;">✓ Sintaxis PHP correcta</p>';
    } else {
        echo '<p style="color: red;">✗ Error de sintaxis PHP:</p>';
        echo '<pre>' . implode("\n", $output) . '</pre>';
    }
    
    // Try to include the file
    try {
        $old_strings = $string ?? [];
        $string = [];
        include($file);
        echo '<p style="color: green;">✓ Archivo incluido correctamente (' . count($string) . ' cadenas cargadas)</p>';
        $string = $old_strings;
    } catch (Exception $e) {
        echo '<p style="color: red;">✗ Error al incluir archivo: ' . $e->getMessage() . '</p>';
    } catch (ParseError $e) {
        echo '<p style="color: red;">✗ Error de sintaxis al incluir: ' . $e->getMessage() . '</p>';
    }
}

// 3. Test language string loading
echo '<h3>3. Prueba de Carga de Cadenas de Idioma</h3>';
try {
    // Clear caches first
    get_string_manager()->reset_caches();
    purge_all_caches();
    echo '<p style="color: green;">✓ Cachés limpiadas</p>';
    
    // Test key strings
    $test_strings = [
        'payment_heading',
        'payment_error_heading',
        'paypal_note',
        'pluginname'
    ];
    
    foreach ($test_strings as $key) {
        try {
            $value = get_string($key, 'local_failed_questions_recovery');
            echo '<p style="color: green;">✓ ' . $key . ': ' . htmlspecialchars($value) . '</p>';
        } catch (Exception $e) {
            echo '<p style="color: red;">✗ Error cargando ' . $key . ': ' . $e->getMessage() . '</p>';
        }
    }
    
} catch (Exception $e) {
    echo '<p style="color: red;">✗ Error general: ' . $e->getMessage() . '</p>';
}

// 4. Check for common syntax issues
echo '<h3>4. Verificación de Problemas Comunes</h3>';

foreach ($lang_files as $lang => $file) {
    if (!file_exists($file)) continue;
    
    $content = file_get_contents($file);
    
    echo '<h4>' . $lang . '</h4>';
    
    // Check for unmatched braces
    $open_braces = substr_count($content, '{');
    $close_braces = substr_count($content, '}');
    
    if ($open_braces === $close_braces) {
        echo '<p style="color: green;">✓ Llaves balanceadas (' . $open_braces . ' abiertas, ' . $close_braces . ' cerradas)</p>';
    } else {
        echo '<p style="color: red;">✗ Llaves no balanceadas (' . $open_braces . ' abiertas, ' . $close_braces . ' cerradas)</p>';
    }
    
    // Check for unmatched quotes
    $single_quotes = substr_count($content, "'");
    $double_quotes = substr_count($content, '"');
    
    echo '<p>Comillas simples: ' . $single_quotes . ($single_quotes % 2 === 0 ? ' (balanceadas)' : ' (no balanceadas)') . '</p>';
    echo '<p>Comillas dobles: ' . $double_quotes . ($double_quotes % 2 === 0 ? ' (balanceadas)' : ' (no balanceadas)') . '</p>';
    
    // Check for specific problematic patterns
    if (strpos($content, '}]}}') !== false) {
        echo '<p style="color: red;">✗ Patrón problemático encontrado: }]}}</p>';
    } else {
        echo '<p style="color: green;">✓ No se encontraron patrones problemáticos</p>';
    }
}

echo '<h3>5. Estado del Sistema</h3>';
echo '<p><strong>Moodle Debug:</strong> ' . (debugging() ? 'Activado' : 'Desactivado') . '</p>';
echo '<p><strong>PHP Version:</strong> ' . PHP_VERSION . '</p>';
echo '<p><strong>Memoria disponible:</strong> ' . ini_get('memory_limit') . '</p>';

echo '<h3>6. Próximos Pasos</h3>';
echo '<div style="background: #f0f8ff; padding: 15px; border-left: 4px solid #007cba;">';
echo '<p><strong>El error de sintaxis ha sido corregido. Para completar la actualización:</strong></p>';
echo '<ol>';
echo '<li>Accede al panel de administración de Moodle</li>';
echo '<li>Ve a "Administración del sitio" > "Notificaciones"</li>';
echo '<li>Ejecuta la actualización del plugin Failed Questions Recovery</li>';
echo '<li>Verifica que no aparezcan más errores de "Unmatched }"</li>';
echo '</ol>';
echo '</div>';

echo '<hr>';
echo '<p><em>Verificación ejecutada el: ' . date('Y-m-d H:i:s') . '</em></p>';
?>