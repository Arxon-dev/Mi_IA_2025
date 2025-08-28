<?php
require_once('../../config.php');
require_once('lib.php');

// Verificar si el usuario está logueado
require_login();

// Verificar si es administrador
require_capability('moodle/site:config', context_system::instance());

// Configurar la página
$PAGE->set_context(context_system::instance());
$PAGE->set_url('/local/failed_questions_recovery/test.php');
$PAGE->set_title('Test Plugin Failed Questions Recovery');
$PAGE->set_heading('Test Plugin Failed Questions Recovery');

// Procesar acciones
$action = optional_param('action', '', PARAM_ALPHA);
$results = array();

switch ($action) {
    case 'test_tables':
        $results = test_database_tables();
        break;
    case 'test_events':
        $results = test_event_observers();
        break;
    case 'test_permissions':
        $results = test_user_permissions();
        break;
    case 'test_quiz_processing':
        $userid = optional_param('userid', 0, PARAM_INT);
        if ($userid > 0) {
            $results = test_quiz_processing($userid);
        }
        break;
    case 'force_process_attempt':
        $attemptid = optional_param('attemptid', 0, PARAM_INT);
        if ($attemptid > 0) {
            $results = force_process_attempt($attemptid);
        }
        break;
    case 'cleanup_logs':
        $results = cleanup_error_logs();
        break;
}

echo $OUTPUT->header();

echo '<div class="container-fluid">';
echo '<div class="row">';
echo '<div class="col-md-12">';

echo '<h2>Herramientas de Testing para Plugin de Recuperación de Preguntas Falladas</h2>';

// Mostrar menú de pruebas
echo '<div class="card">';
echo '<div class="card-header">';
echo '<h3>Pruebas Disponibles</h3>';
echo '</div>';
echo '<div class="card-body">';
echo '<div class="row">';

// Test 1: Verificar tablas
echo '<div class="col-md-4">';
echo '<div class="card mb-3">';
echo '<div class="card-body">';
echo '<h5 class="card-title">Test 1: Base de Datos</h5>';
echo '<p class="card-text">Verificar que las tablas del plugin existan y tengan datos.</p>';
echo '<a href="?action=test_tables" class="btn btn-primary">Ejecutar Test</a>';
echo '</div>';
echo '</div>';
echo '</div>';

// Test 2: Verificar eventos
echo '<div class="col-md-4">';
echo '<div class="card mb-3">';
echo '<div class="card-body">';
echo '<h5 class="card-title">Test 2: Eventos/Observers</h5>';
echo '<p class="card-text">Verificar que los observers de eventos estén registrados.</p>';
echo '<a href="?action=test_events" class="btn btn-primary">Ejecutar Test</a>';
echo '</div>';
echo '</div>';
echo '</div>';

// Test 3: Verificar permisos
echo '<div class="col-md-4">';
echo '<div class="card mb-3">';
echo '<div class="card-body">';
echo '<h5 class="card-title">Test 3: Permisos</h5>';
echo '<p class="card-text">Verificar permisos de usuarios.</p>';
echo '<a href="?action=test_permissions" class="btn btn-primary">Ejecutar Test</a>';
echo '</div>';
echo '</div>';
echo '</div>';

echo '</div>';
echo '</div>';
echo '</div>';

// Formulario para test 4
echo '<div class="card mt-3">';
echo '<div class="card-header">';
echo '<h3>Test 4: Procesar Quiz de Usuario</h3>';
echo '</div>';
echo '<div class="card-body">';
echo '<form method="get">';
echo '<input type="hidden" name="action" value="test_quiz_processing">';
echo '<div class="form-group">';
echo '<label for="userid">ID del Usuario:</label>';
echo '<input type="number" class="form-control" id="userid" name="userid" required>';
echo '</div>';
echo '<button type="submit" class="btn btn-warning">Procesar Quiz Reciente</button>';
echo '</form>';
echo '</div>';
echo '</div>';

// Formulario para test 5
echo '<div class="card mt-3">';
echo '<div class="card-header">';
echo '<h3>Test 5: Forzar Procesamiento de Intento</h3>';
echo '</div>';
echo '<div class="card-body">';
echo '<form method="get">';
echo '<input type="hidden" name="action" value="force_process_attempt">';
echo '<div class="form-group">';
echo '<label for="attemptid">ID del Intento de Quiz:</label>';
echo '<input type="number" class="form-control" id="attemptid" name="attemptid" required>';
echo '</div>';
echo '<button type="submit" class="btn btn-danger">Forzar Procesamiento</button>';
echo '</form>';
echo '</div>';
echo '</div>';

// Botón para limpiar logs
echo '<div class="card mt-3">';
echo '<div class="card-header">';
echo '<h3>Limpieza de Logs</h3>';
echo '</div>';
echo '<div class="card-body">';
echo '<a href="?action=cleanup_logs" class="btn btn-warning">Limpiar Logs de Error</a>';
echo '</div>';
echo '</div>';

// Mostrar resultados
if (!empty($results)) {
    echo '<div class="card mt-3">';
    echo '<div class="card-header">';
    echo '<h3>Resultados del Test</h3>';
    echo '</div>';
    echo '<div class="card-body">';
    echo '<pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; max-height: 500px; overflow-y: auto;">';
    echo htmlspecialchars(json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo '</pre>';
    echo '</div>';
    echo '</div>';
}

echo '</div>';
echo '</div>';
echo '</div>';

echo $OUTPUT->footer();

/**
 * Test database tables
 */
function test_database_tables() {
    global $DB;
    
    $results = array();
    
    $tables = array(
        'local_fqr_failed_questions',
        'local_fqr_recovery_quizzes',
        'local_fqr_recovery_attempts'
    );
    
    foreach ($tables as $table) {
        $results['tables'][$table] = array();
        $exists = $DB->get_manager()->table_exists($table);
        $results['tables'][$table]['exists'] = $exists;
        
        if ($exists) {
            $count = $DB->count_records($table);
            $results['tables'][$table]['record_count'] = $count;
            
            // Obtener algunos registros de muestra
            $sample_records = $DB->get_records($table, array(), 'id DESC', '*', 0, 5);
            $results['tables'][$table]['sample_records'] = $sample_records;
        }
    }
    
    return $results;
}

/**
 * Test event observers
 */
function test_event_observers() {
    global $DB;
    
    $results = array();
    
    // Verificar si los observers están registrados
    $handlers = get_config('core', 'cache_events_handler');
    $results['cache_events_handler'] = $handlers;
    
    // Verificar eventos recientes
    $events = $DB->get_records('events_handlers', array('component' => 'local_failed_questions_recovery'));
    $results['registered_handlers'] = $events;
    
    // Verificar si hay eventos de quiz recientes
    $recent_events = $DB->get_records_sql(
        "SELECT * FROM {logstore_standard_log} 
         WHERE component = 'mod_quiz' 
         AND action = 'submitted' 
         ORDER BY timecreated DESC 
         LIMIT 10"
    );
    $results['recent_quiz_events'] = $recent_events;
    
    return $results;
}

/**
 * Test user permissions
 */
function test_user_permissions() {
    global $DB;
    
    $results = array();
    
    // Obtener algunos usuarios
    $users = $DB->get_records('user', array('deleted' => 0), 'id ASC', '*', 0, 5);
    
    foreach ($users as $user) {
        $results['users'][$user->id] = array(
            'username' => $user->username,
            'email' => $user->email,
            'system_permission' => has_capability('local/failed_questions_recovery:use', context_system::instance(), $user->id),
            'user_permission' => has_capability('local/failed_questions_recovery:use', context_user::instance($user->id), $user->id)
        );
    }
    
    return $results;
}

/**
 * Test quiz processing for specific user
 */
function test_quiz_processing($userid) {
    global $DB;
    
    $results = array();
    
    // Obtener intentos recientes de quiz
    $attempts = $DB->get_records('quiz_attempts', array('userid' => $userid), 'timemodified DESC', '*', 0, 5);
    $results['quiz_attempts'] = $attempts;
    
    if (!empty($attempts)) {
        $latest_attempt = reset($attempts);
        $results['latest_attempt_processing'] = debug_process_recent_quiz($userid);
    }
    
    // Verificar preguntas falladas del usuario
    $failed_questions = $DB->get_records('local_fqr_failed_questions', array('userid' => $userid));
    $results['failed_questions'] = $failed_questions;
    
    return $results;
}

/**
 * Force process a specific attempt
 */
function force_process_attempt($attemptid) {
    global $DB;
    
    $results = array();
    
    // Obtener el intento
    $attempt = $DB->get_record('quiz_attempts', array('id' => $attemptid));
    
    if (!$attempt) {
        $results['error'] = 'Intento no encontrado';
        return $results;
    }
    
    $results['attempt_info'] = $attempt;
    
    // Obtener información del quiz
    $quiz = $DB->get_record('quiz', array('id' => $attempt->quiz));
    $results['quiz_info'] = $quiz;
    
    // Intentar procesar manualmente
    try {
        require_once(dirname(__FILE__) . '/classes/observer.php');
        
        // Simular el evento
        $event_data = new stdClass();
        $event_data->objectid = $attempt->id;
        $event_data->userid = $attempt->userid;
        $event_data->courseid = $quiz->course;
        
        // Crear un objeto simulado del evento
        $mock_event = new class($event_data) {
            private $data;
            
            public function __construct($data) {
                $this->data = $data;
            }
            
            public function __get($name) {
                return $this->data->$name ?? null;
            }
        };
        
        // Procesar el intento
        \local_failed_questions_recovery\observer::quiz_attempt_submitted($mock_event);
        
        $results['processing_result'] = 'Procesado exitosamente';
        
    } catch (Exception $e) {
        $results['processing_error'] = $e->getMessage();
    }
    
    return $results;
}

/**
 * Cleanup error logs
 */
function cleanup_error_logs() {
    // Esta función simplemente retorna información sobre dónde buscar los logs
    return array(
        'message' => 'Para limpiar logs de error, revisa los siguientes archivos:',
        'log_locations' => array(
            'Moodle log' => 'Administración del sitio > Informes > Logs',
            'PHP error log' => 'Archivo de error log de PHP en el servidor',
            'Moodle data directory' => 'Directorio de datos de Moodle/cache/log'
        )
    );
}
?> 