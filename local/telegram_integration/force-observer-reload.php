<?php
require_once('../../config.php');
require_once($CFG->libdir . '/adminlib.php');

echo "<h2>🔄 Forzar Recarga del Observer</h2>";

try {
    // Limpiar todos los caches relevantes
    $caches_to_clear = [
        'core/observers',
        'core/events',
        'core/plugin_manager',
        'core/config'
    ];
    
    foreach ($caches_to_clear as $cache_name) {
        try {
            $cache = cache::make_from_params(cache_store::MODE_APPLICATION, $cache_name);
            $cache->purge();
            echo "<p>✅ Cache {$cache_name} purgado</p>";
        } catch (Exception $e) {
            echo "<p>⚠️ Error purgando {$cache_name}: " . $e->getMessage() . "</p>";
        }
    }
    
    // Purgar cache general
    purge_all_caches();
    echo "<p>✅ Todos los caches purgados</p>";
    
    // Verificar que el observer está registrado
    $observers = get_observer_list();
    echo "<h3>📋 Observers registrados:</h3>";
    
    $found_telegram = false;
    foreach ($observers as $observer) {
        if (strpos($observer['callable'], 'telegram_integration') !== false) {
            echo "<p>✅ {$observer['eventname']} → {$observer['callable']}</p>";
            $found_telegram = true;
        }
    }
    
    if (!$found_telegram) {
        echo "<p>❌ Observer de telegram_integration NO encontrado</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Recarga completada</p>";
?> 