<?php
require_once('../../config.php');

echo "<h2>🔍 Diagnóstico del Observer de Eventos</h2>";

// Verificar si el observer está registrado
echo "<h3>📋 Verificando observer:</h3>";

try {
    $observer_path = dirname(__FILE__) . '/classes/observer.php';
    
    if (file_exists($observer_path)) {
        echo "<p>✅ Archivo observer.php existe</p>";
        
        // Mostrar contenido del observer
        $observer_content = file_get_contents($observer_path);
        echo "<p>📄 Contenido del observer:</p>";
        echo "<pre>" . htmlspecialchars(substr($observer_content, 0, 500)) . "...</pre>";
        
    } else {
        echo "<p>❌ Archivo observer.php NO existe</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error verificando observer: " . $e->getMessage() . "</p>";
}

// Verificar configuración de eventos
echo "<h3>📋 Verificando configuración de eventos:</h3>";

try {
    $events_path = dirname(__FILE__) . '/db/events.php';
    
    if (file_exists($events_path)) {
        echo "<p>✅ Archivo events.php existe</p>";
        
        $events_content = file_get_contents($events_path);
        echo "<p>📄 Contenido de events.php:</p>";
        echo "<pre>" . htmlspecialchars($events_content) . "</pre>";
        
    } else {
        echo "<p>❌ Archivo events.php NO existe</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error verificando events.php: " . $e->getMessage() . "</p>";
}

// Verificar eventos recientes en el log
echo "<h3>📋 Verificando eventos recientes:</h3>";

try {
    $recent_events = $DB->get_records_sql("
        SELECT * FROM {logstore_standard_log} 
        WHERE component = 'mod_quiz' 
        AND eventname LIKE '%attempt%'
        AND timecreated > ?
        ORDER BY timecreated DESC
        LIMIT 10
    ", array(time() - 86400));
    
    if (count($recent_events) > 0) {
        echo "<p>✅ Encontrados " . count($recent_events) . " eventos recientes de quiz</p>";
        
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Event</th><th>User</th><th>Object ID</th><th>Time</th></tr>";
        
        foreach ($recent_events as $event) {
            $event_time = date('Y-m-d H:i:s', $event->timecreated);
            
            echo "<tr>";
            echo "<td>{$event->eventname}</td>";
            echo "<td>{$event->userid}</td>";
            echo "<td>{$event->objectid}</td>";
            echo "<td>{$event_time}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } else {
        echo "<p>❌ No se encontraron eventos recientes de quiz</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error consultando eventos: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Diagnóstico de observer completado</p>";
?> 