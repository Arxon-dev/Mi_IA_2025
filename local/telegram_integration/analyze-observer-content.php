<?php
require_once('../../config.php');

echo "<h2>🔍 Análisis del Contenido del Observer</h2>";

echo "<h3>📋 Contenido de classes/observer.php:</h3>";
$observer_file = __DIR__ . '/classes/observer.php';
if (file_exists($observer_file)) {
    $content = file_get_contents($observer_file);
    
    // Mostrar las primeras líneas para ver la estructura
    $lines = explode("\n", $content);
    echo "<pre style='background-color: #f5f5f5; padding: 10px; max-height: 400px; overflow-y: scroll;'>";
    for ($i = 0; $i < min(50, count($lines)); $i++) {
        echo htmlspecialchars($lines[$i]) . "\n";
    }
    if (count($lines) > 50) {
        echo "... (" . (count($lines) - 50) . " líneas más)\n";
    }
    echo "</pre>";
    
    // Verificar funciones clave
    echo "<h3>🔍 Funciones encontradas:</h3>";
    $functions = [
        'quiz_attempt_submitted',
        'quiz_attempt_reviewed', 
        'telegram_update_topic_performance',
        'telegram_extract_topic_from_name'
    ];
    
    foreach ($functions as $func) {
        if (strpos($content, $func) !== false) {
            echo "<p>✅ {$func} - ENCONTRADA</p>";
        } else {
            echo "<p>❌ {$func} - NO ENCONTRADA</p>";
        }
    }
    
    // Buscar referencias a local_telegram_user_topic_performance
    if (strpos($content, 'local_telegram_user_topic_performance') !== false) {
        echo "<p>✅ Referencia a tabla performance - ENCONTRADA</p>";
    } else {
        echo "<p>❌ Referencia a tabla performance - NO ENCONTRADA</p>";
    }
    
} else {
    echo "<p>❌ Archivo observer.php no existe</p>";
}

echo "<h3>📋 Contenido de db/events.php:</h3>";
$events_file = __DIR__ . '/db/events.php';
if (file_exists($events_file)) {
    $content = file_get_contents($events_file);
    echo "<pre style='background-color: #f5f5f5; padding: 10px;'>";
    echo htmlspecialchars($content);
    echo "</pre>";
} else {
    echo "<p>❌ Archivo events.php no existe</p>";
}

echo "<h3>💡 Diagnóstico:</h3>";
echo "<p>Este análisis nos mostrará exactamente qué está fallando en el observer.</p>";

echo "<p>🎉 Análisis completado</p>";
?> 