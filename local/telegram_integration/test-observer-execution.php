<?php

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir.'/adminlib.php');
require_login();
admin_externalpage_setup('local_telegram_integration_diag', '', null, '', ['pagelayout' => 'admin']);

echo $OUTPUT->header();
echo $OUTPUT->heading('Diagnóstico de Ejecución del Observer de Telegram');

global $DB;

// Define el nombre del evento y el callback que estamos buscando
$event_name = '\mod_quiz\event\attempt_submitted';
$callback_function = 'local_telegram_integration_observer::quiz_attempt_submitted';

echo "<div class='container-fluid'>";
echo "<h2>Verificando la ejecución del observer para el evento: <code>{$event_name}</code></h2>";
echo "<p>Esta página revisa los logs de eventos de Moodle para confirmar si el observer de nuestro plugin se está ejecutando cuando un usuario envía un intento de cuestionario.</p>";

try {
    // 1. Verificar si el observer está registrado correctamente en events.php
    echo "<h3>1. Verificación de Registro del Observer</h3>";
    $handlers = $DB->get_records('events_handlers', ['handlermodule' => 'local_telegram_integration']);
    $observer_found = false;
    if ($handlers) {
        foreach ($handlers as $handler) {
            if (strpos($handler->handlerfile, 'classes/observer.php') !== false) {
                echo "<div style='color: green;'>✅ Observer <code>{$handler->handlerfile}</code> encontrado en la tabla <code>events_handlers</code>.</div>";
                $observer_found = true;
                break;
            }
        }
    }
    if (!$observer_found) {
        echo "<div style='color: red;'>❌ No se encontró el observer del plugin en la tabla <code>events_handlers</code>.</div>";
        echo "<p>Asegúrate de que <code>db/events.php</code> está bien configurado y purga las cachés de Moodle.</p>";
    }

    // 2. Buscar en los logs de eventos recientes una traza del evento
    echo "<h3>2. Búsqueda en los Logs de Eventos Recientes</h3>";
    $sql = "SELECT * 
            FROM {logstore_standard_log} 
            WHERE eventname = :eventname 
            ORDER BY timecreated DESC";
    
    $params = ['eventname' => $event_name];
    $recent_events = $DB->get_records_sql($sql, $params, 0, 10); // Últimos 10 eventos

    if ($recent_events) {
        echo "<p>Se encontraron los siguientes eventos <code>attempt_submitted</code> recientes:</p>";
        echo "<table class='table table-striped'>";
        echo "<thead><tr><th>Fecha</th><th>Usuario ID</th><th>Contexto del Cuestionario</th><th>IP</th></tr></thead>";
        echo "<tbody>";
        foreach ($recent_events as $event) {
            $data = json_decode($event->other);
            $user_info = $DB->get_record('user', ['id' => $event->userid], 'id, firstname, lastname, email');
            $user_display = fullname($user_info);
            echo "<tr>";
            echo "<td>" . userdate($event->timecreated) . "</td>";
            echo "<td>" . $user_display . " ({$event->userid})</td>";
            echo "<td>Quiz ID: " . $event->contextinstanceid . "</td>";
            echo "<td>" . $event->ip . "</td>";
            echo "</tr>";
        }
        echo "</tbody></table>";
        echo "<div style='color: green;'>✅ El evento se está registrando en Moodle. Esto es bueno.</div>";
        echo "<p>Si el evento se registra pero las estadísticas no se actualizan, el problema podría estar dentro de la función <code>quiz_attempt_submitted</code> en <code>classes/observer.php</code>.</p>";

    } else {
        echo "<div style='color: orange;'>⚠️ No se han encontrado registros del evento <code>{$event_name}</code> en los logs recientes.</div>";
        echo "<p>Realiza un cuestionario con un usuario vinculado y luego vuelve a cargar esta página para verificar si el evento se registra.</p>";
    }

} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Ocurrió un error al consultar la base de datos: " . $e->getMessage() . "</div>";
}

echo "</div>";
echo $OUTPUT->footer(); 