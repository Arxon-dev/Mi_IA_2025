<?php
require_once('../../config.php');

// Verificar que el usuario sea administrador
require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h2>🔧 Instalación Manual de Eventos del Observer</h2>";

global $DB;

try {
    // Verificar el estado actual
    $existing_events = $DB->get_records('events_handlers', ['component' => 'local_failed_questions_recovery']);
    
    echo "<h3>📊 Estado Actual</h3>";
    if (empty($existing_events)) {
        echo "<p>❌ No hay eventos registrados para el plugin.</p>";
    } else {
        echo "<p>✅ Encontrados " . count($existing_events) . " eventos registrados.</p>";
        foreach ($existing_events as $event) {
            echo "<li>{$event->eventname} → {$event->handlerfunction}</li>";
        }
    }
    
    echo "<h3>🔧 Registrando Eventos</h3>";
    
    // Forzar la instalación de eventos del plugin
    $plugindir = $CFG->dirroot . '/local/failed_questions_recovery';
    
    // Incluir el archivo de eventos
    $events_file = $plugindir . '/db/events.php';
    if (!file_exists($events_file)) {
        throw new Exception("Archivo de eventos no encontrado: $events_file");
    }
    
    // Cargar la configuración de eventos
    $observers = array();
    include($events_file);
    
    if (empty($observers)) {
        throw new Exception("No se encontraron observers en el archivo de eventos.");
    }
    
    echo "<p>📝 Encontrados " . count($observers) . " observers definidos:</p>";
    
    // Registrar cada observer
    foreach ($observers as $observer) {
        echo "<p>🔄 Registrando: {$observer['eventname']} → {$observer['callback']}</p>";
        
        // Verificar si ya existe
        $existing = $DB->get_record('events_handlers', [
            'eventname' => $observer['eventname'],
            'component' => 'local_failed_questions_recovery'
        ]);
        
        if ($existing) {
            echo "<p>⚠️ Ya existe, actualizando...</p>";
            $existing->handlerfunction = $observer['callback'];
            $existing->priority = $observer['priority'] ?? 100;
            $existing->internal = $observer['internal'] ?? 1;
            $DB->update_record('events_handlers', $existing);
        } else {
            echo "<p>✨ Creando nuevo registro...</p>";
            $record = new stdClass();
            $record->eventname = $observer['eventname'];
            $record->component = 'local_failed_questions_recovery';
            $record->handlerfile = ''; // No usado en versiones modernas
            $record->handlerfunction = $observer['callback'];
            $record->priority = $observer['priority'] ?? 100;
            $record->internal = $observer['internal'] ?? 1;
            
            $id = $DB->insert_record('events_handlers', $record);
            echo "<p>✅ Creado con ID: $id</p>";
        }
    }
    
    // Limpiar caché de eventos
    echo "<h3>🗑️ Limpiando Caché</h3>";
    purge_all_caches();
    echo "<p>✅ Caché limpiado exitosamente.</p>";
    
    // Verificar el resultado final
    echo "<h3>✅ Verificación Final</h3>";
    $final_events = $DB->get_records('events_handlers', ['component' => 'local_failed_questions_recovery']);
    
    if (!empty($final_events)) {
        echo "<p><strong>🎉 ¡Éxito! Se registraron " . count($final_events) . " eventos.</strong></p>";
        echo "<ul>";
        foreach ($final_events as $event) {
            echo "<li>✅ {$event->eventname} → {$event->handlerfunction}</li>";
        }
        echo "</ul>";
        
        echo "<div style='background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
        echo "<h4>🚀 Observer Activado</h4>";
        echo "<p>El observer automático ahora debería funcionar correctamente.</p>";
        echo "<p><strong>Próximos pasos:</strong></p>";
        echo "<ol>";
        echo "<li>Realiza un nuevo quiz de prueba</li>";
        echo "<li>Las preguntas falladas se registrarán automáticamente</li>";
        echo "<li>Verifica en el dashboard que aparezcan las nuevas categorías</li>";
        echo "</ol>";
        echo "</div>";
        
    } else {
        echo "<p>❌ Error: No se pudieron registrar los eventos.</p>";
    }
    
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
    echo "<h4>❌ Error</h4>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}

echo "<hr>";
echo "<h3>🔗 Enlaces Útiles</h3>";
echo "<ul>";
echo "<li><a href='debug_observer.php'>🔍 Volver al Diagnóstico</a></li>";
echo "<li><a href='index.php'>🏠 Dashboard Principal</a></li>";
echo "<li><a href='/admin/settings.php?section=manageauths'>⚙️ Administración de Moodle</a></li>";
echo "</ul>";

echo "<h3>📋 Información Técnica</h3>";
echo "<p><strong>Plugin:</strong> local_failed_questions_recovery</p>";
echo "<p><strong>Evento:</strong> \\mod_quiz\\event\\attempt_submitted</p>";
echo "<p><strong>Callback:</strong> \\local_failed_questions_recovery\\observer::quiz_attempt_submitted</p>";
?> 