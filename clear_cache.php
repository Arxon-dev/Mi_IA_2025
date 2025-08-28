<?php
// Script para limpiar cachés de Moodle y forzar recarga de idiomas

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h2>Limpieza de Cachés de Moodle</h2>";
echo "<pre>";

try {
    require_once('config.php');
    
    echo "1. Configuración de Moodle cargada...\n";
    
    // Limpiar todas las cachés
    echo "\n2. Limpiando cachés...\n";
    
    // Caché de strings
    try {
        $cache = cache::make('core', 'string');
        $cache->purge();
        echo "   ✓ Caché de strings limpiado\n";
    } catch (Exception $e) {
        echo "   ✗ Error limpiando caché de strings: " . $e->getMessage() . "\n";
    }
    
    // String manager
    try {
        if (function_exists('get_string_manager')) {
            get_string_manager()->reset_caches();
            echo "   ✓ String manager reseteado\n";
        }
    } catch (Exception $e) {
        echo "   ✗ Error reseteando string manager: " . $e->getMessage() . "\n";
    }
    
    // Caché de plugins
    try {
        $plugincache = cache::make('core', 'plugin_manager');
        $plugincache->purge();
        echo "   ✓ Caché de plugins limpiado\n";
    } catch (Exception $e) {
        echo "   ✗ Error limpiando caché de plugins: " . $e->getMessage() . "\n";
    }
    
    // Caché de configuración
    try {
        $configcache = cache::make('core', 'config');
        $configcache->purge();
        echo "   ✓ Caché de configuración limpiado\n";
    } catch (Exception $e) {
        echo "   ✗ Error limpiando caché de configuración: " . $e->getMessage() . "\n";
    }
    
    echo "\n3. Verificando cadenas de idioma...\n";
    
    // Probar algunas cadenas
    $test_strings = ['payment_success_title', 'payment_success_heading', 'payment_details'];
    
    foreach ($test_strings as $string) {
        try {
            $value = get_string($string, 'local_failed_questions_recovery');
            if (strpos($value, '[[') === false) {
                echo "   ✓ {$string}: {$value}\n";
            } else {
                echo "   ✗ {$string}: {$value} (sin traducir)\n";
            }
        } catch (Exception $e) {
            echo "   ✗ {$string}: Error - " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n4. Información del plugin...\n";
    
    // Versión del plugin
    $plugin = new stdClass();
    require($CFG->dirroot . '/local/failed_questions_recovery/version.php');
    echo "   Versión en código: {$plugin->version}\n";
    
    $installed_version = get_config('local_failed_questions_recovery', 'version');
    echo "   Versión instalada: {$installed_version}\n";
    
    if ($installed_version < $plugin->version) {
        echo "   ⚠ Plugin necesita actualización\n";
    } else {
        echo "   ✓ Plugin actualizado\n";
    }
    
    echo "\n=== LIMPIEZA COMPLETADA ===\n";
    echo "\nRecarga la página de pago para ver los cambios.\n";
    
} catch (Exception $e) {
    echo "\nError: " . $e->getMessage() . "\n";
    echo "Detalles: " . $e->getTraceAsString() . "\n";
}

echo "</pre>";

echo "<p><a href='local/failed_questions_recovery/process_payment.php?payment_id=TEST&status=COMPLETED&amount=0.05&currency=EUR&sesskey=" . sesskey() . "'>Probar página de pago</a></p>";
?>