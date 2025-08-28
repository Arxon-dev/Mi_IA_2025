<?php
// Script para forzar la actualización del plugin y limpiar cachés de idioma

require_once('config.php');
require_login();

// Solo administradores pueden ejecutar este script
require_capability('moodle/site:config', context_system::instance());

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Actualización del Plugin Failed Questions Recovery</h2>";
echo "<pre>";

echo "=== INICIANDO ACTUALIZACIÓN ===\n\n";

try {
    // 1. Limpiar caché de cadenas de idioma
    echo "1. Limpiando caché de cadenas de idioma...\n";
    
    // Limpiar caché de strings
    $cache = cache::make('core', 'string');
    $cache->purge();
    echo "   ✓ Caché de strings limpiado\n";
    
    // Resetear string manager
    if (function_exists('get_string_manager')) {
        get_string_manager()->reset_caches();
        echo "   ✓ String manager reseteado\n";
    }
    
    // 2. Forzar recarga de información del plugin
    echo "\n2. Forzando recarga del plugin...\n";
    
    // Limpiar caché de plugins
    $plugincache = cache::make('core', 'plugin_manager');
    $plugincache->purge();
    echo "   ✓ Caché de plugins limpiado\n";
    
    // 3. Verificar versión actual
    echo "\n3. Verificando versión del plugin...\n";
    
    $plugin = new stdClass();
    require($CFG->dirroot . '/local/failed_questions_recovery/version.php');
    echo "   Versión actual: {$plugin->version}\n";
    echo "   Release: {$plugin->release}\n";
    
    // 4. Ejecutar upgrade si es necesario
    echo "\n4. Ejecutando upgrade...\n";
    
    // Obtener versión instalada
    $installed_version = get_config('local_failed_questions_recovery', 'version');
    echo "   Versión instalada: {$installed_version}\n";
    echo "   Versión en código: {$plugin->version}\n";
    
    if ($installed_version < $plugin->version) {
        echo "   Ejecutando upgrade...\n";
        
        // Incluir función de upgrade
        require_once($CFG->dirroot . '/local/failed_questions_recovery/db/upgrade.php');
        
        // Ejecutar upgrade
        $result = xmldb_local_failed_questions_recovery_upgrade($installed_version);
        
        if ($result) {
            // Actualizar versión en config
            set_config('version', $plugin->version, 'local_failed_questions_recovery');
            echo "   ✓ Upgrade completado exitosamente\n";
        } else {
            echo "   ✗ Error en el upgrade\n";
        }
    } else {
        echo "   Plugin ya está actualizado\n";
    }
    
    // 5. Verificar cadenas de idioma
    echo "\n5. Verificando cadenas de idioma...\n";
    
    $test_strings = [
        'payment_success_title',
        'payment_success_heading',
        'payment_details',
        'transaction_id',
        'amount',
        'status',
        'completed'
    ];
    
    foreach ($test_strings as $string) {
        $value = get_string($string, 'local_failed_questions_recovery');
        if (strpos($value, '[[') === false) {
            echo "   ✓ {$string}: {$value}\n";
        } else {
            echo "   ✗ {$string}: {$value} (no traducido)\n";
        }
    }
    
    echo "\n=== ACTUALIZACIÓN COMPLETADA ===\n";
    echo "\nPuedes cerrar esta ventana y recargar la página de pago.\n";
    
} catch (Exception $e) {
    echo "\n✗ Error durante la actualización: " . $e->getMessage() . "\n";
    echo "Detalles: " . $e->getTraceAsString() . "\n";
}

echo "</pre>";
?>