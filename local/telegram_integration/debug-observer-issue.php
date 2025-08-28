<?php
require_once('../../config.php');

echo "<h2>🔍 Diagnóstico del Observer</h2>";

// 1. Verificar si los eventos están registrados
echo "<h3>1. Verificación de Eventos Registrados</h3>";
$events_file = $CFG->dirroot . '/local/telegram_integration/db/events.php';
if (file_exists($events_file)) {
    echo "<p>✅ Archivo events.php existe</p>";
    include($events_file);
    if (isset($observers)) {
        echo "<p>✅ Observers definidos: " . count($observers) . "</p>";
        foreach ($observers as $observer) {
            echo "<p>📋 {$observer['eventname']} → {$observer['callback']}</p>";
        }
    }
} else {
    echo "<p>❌ Archivo events.php no encontrado</p>";
}

// 2. Verificar logs de errores
echo "<h3>2. Últimos Errores en Logs</h3>";
$log_file = $CFG->dataroot . '/temp/phplog.txt';
if (file_exists($log_file)) {
    $logs = file_get_contents($log_file);
    $telegram_logs = array_filter(explode("\n", $logs), function($line) {
        return stripos($line, 'telegram') !== false || stripos($line, 'observer') !== false;
    });
    
    if ($telegram_logs) {
        echo "<p>📋 Últimos logs relacionados con Telegram:</p>";
        echo "<pre>" . implode("\n", array_slice($telegram_logs, -10)) . "</pre>";
    } else {
        echo "<p>⚠️ No se encontraron logs de Telegram en el archivo de log</p>";
    }
} else {
    echo "<p>⚠️ Archivo de log no encontrado en {$log_file}</p>";
}

// 3. Probar manualmente el observer
echo "<h3>3. Prueba Manual del Observer</h3>";
try {
    require_once($CFG->dirroot . '/local/telegram_integration/classes/observer.php');
    echo "<p>✅ Clase observer se puede cargar</p>";
    
    // Verificar si los métodos existen
    if (method_exists('\\local_telegram_integration\\observer', 'quiz_attempt_submitted')) {
        echo "<p>✅ Método quiz_attempt_submitted existe</p>";
    } else {
        echo "<p>❌ Método quiz_attempt_submitted NO existe</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error cargando observer: " . $e->getMessage() . "</p>";
}

// 4. Verificar cache
echo "<h3>4. Limpiar Cache</h3>";
echo "<p><a href='force-observer-reload.php'>🔄 Forzar recarga de observers</a></p>";
?>