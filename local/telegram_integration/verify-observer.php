<?php
require_once('../../config.php');

echo "<h2>🔍 Verificando Observer</h2>";

// Verificar que el archivo events.php existe
$events_file = __DIR__ . '/db/events.php';
if (file_exists($events_file)) {
    echo "<p>✅ Archivo events.php existe</p>";
    include($events_file);
    
    echo "<h3>📋 Observers registrados:</h3>";
    echo "<ul>";
    foreach ($observers as $observer) {
        echo "<li><strong>Evento:</strong> {$observer['eventname']}</li>";
        echo "<li><strong>Callback:</strong> {$observer['callback']}</li>";
        echo "<hr>";
    }
    echo "</ul>";
} else {
    echo "<p>❌ Archivo events.php no encontrado</p>";
}

// Verificar que la clase observer existe
$observer_file = __DIR__ . '/classes/observer.php';
if (file_exists($observer_file)) {
    echo "<p>✅ Archivo observer.php existe</p>";
    
    // Verificar que la clase se puede cargar
    try {
        require_once($observer_file);
        if (class_exists('\\local_telegram_integration\\observer')) {
            echo "<p>✅ Clase observer se puede cargar correctamente</p>";
        } else {
            echo "<p>❌ Clase observer no se puede cargar</p>";
        }
    } catch (Exception $e) {
        echo "<p>❌ Error cargando observer: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p>❌ Archivo observer.php no encontrado</p>";
}

// Forzar recarga de observers
echo "<h3>🔄 Forzando recarga de observers...</h3>";
try {
    purge_all_caches();
    echo "<p>✅ Cache purgado - observers recargados</p>";
} catch (Exception $e) {
    echo "<p>❌ Error purgando cache: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Verificación completada</p>";
?>