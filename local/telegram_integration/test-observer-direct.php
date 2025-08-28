<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🧪 Test Directo del Observer</h2>";

// Obtener el último intento
$latest_attempt = $DB->get_record_sql("
    SELECT qa.id, qa.userid, qa.quiz, qa.timestart, qa.timefinish, qa.sumgrades,
           q.name as quiz_name, q.grade as quiz_grade
    FROM {quiz_attempts} qa
    JOIN {quiz} q ON qa.quiz = q.id
    WHERE qa.userid = 575
    AND qa.timefinish IS NOT NULL
    ORDER BY qa.timefinish DESC
    LIMIT 1
");

if ($latest_attempt) {
    echo "<h3>📋 Último intento encontrado:</h3>";
    echo "<p>ID: {$latest_attempt->id}</p>";
    echo "<p>Quiz: {$latest_attempt->quiz_name}</p>";
    echo "<p>Usuario: {$latest_attempt->userid}</p>";
    echo "<p>Puntuación: {$latest_attempt->sumgrades}/{$latest_attempt->quiz_grade}</p>";
    
    // **SIMULAR EVENTO**
    echo "<h3>🔄 Simulando evento del observer:</h3>";
    
    try {
        // Crear evento simulado
        $event_data = new stdClass();
        $event_data->objectid = $latest_attempt->id;
        $event_data->userid = $latest_attempt->userid;
        
        // **LLAMAR DIRECTAMENTE AL OBSERVER**
        echo "<p>🔄 Llamando al observer...</p>";
        
        // Verificar si la clase existe
        if (class_exists('\local_telegram_integration\observer')) {
            echo "<p>✅ Clase observer encontrada</p>";
            
            // Crear un mock del evento
            $mock_event = new class($event_data) {
                public $objectid;
                public $userid;
                
                public function __construct($data) {
                    $this->objectid = $data->objectid;
                    $this->userid = $data->userid;
                }
            };
            
            // **LLAMAR AL MÉTODO DIRECTAMENTE**
            echo "<p>🔄 Ejecutando quiz_attempt_submitted...</p>";
            
            ob_start();
            \local_telegram_integration\observer::quiz_attempt_submitted($mock_event);
            $output = ob_get_clean();
            
            if ($output) {
                echo "<p>📄 Salida del observer:</p>";
                echo "<pre>{$output}</pre>";
            }
            
            echo "<p>✅ Observer ejecutado (sin errores visibles)</p>";
            
            // **VERIFICAR LOGS DE ERROR**
            echo "<h3>📋 Verificando logs de error PHP:</h3>";
            
            // Buscar logs en ubicaciones comunes
            $log_locations = [
                ini_get('error_log'),
                '/tmp/php_errors.log',
                '/var/log/php_errors.log',
                $CFG->dataroot . '/error.log',
                $CFG->dataroot . '/php_errors.log'
            ];
            
            foreach ($log_locations as $log_file) {
                if ($log_file && file_exists($log_file)) {
                    echo "<p>✅ Log encontrado: {$log_file}</p>";
                    
                    // Leer últimas líneas
                    $lines = file($log_file);
                    $recent_lines = array_slice($lines, -20);
                    
                    echo "<h4>📄 Últimas líneas:</h4>";
                    echo "<pre style='background-color: #f5f5f5; padding: 10px; max-height: 200px; overflow-y: scroll;'>";
                    foreach ($recent_lines as $line) {
                        if (strpos($line, 'TELEGRAM') !== false) {
                            echo "<strong>" . htmlspecialchars($line) . "</strong>";
                        } else {
                            echo htmlspecialchars($line);
                        }
                    }
                    echo "</pre>";
                    break;
                }
            }
            
        } else {
            echo "<p>❌ Clase observer NO encontrada</p>";
        }
        
    } catch (Exception $e) {
        echo "<p>❌ Error ejecutando observer: " . $e->getMessage() . "</p>";
        echo "<p>Stack trace: " . $e->getTraceAsString() . "</p>";
    }
    
    // **VERIFICAR TABLA PERFORMANCE**
    echo "<h3>📊 Verificando tabla performance:</h3>";
    
    $topic = telegram_extract_topic_from_name($latest_attempt->quiz_name);
    echo "<p>🎯 Tema detectado: {$topic}</p>";
    
    if ($topic) {
        $performance_record = $DB->get_record('local_telegram_user_topic_performance', [
            'telegramuserid' => '5650137656', // Tu telegram user ID
            'sectionname' => $topic
        ]);
        
        if ($performance_record) {
            echo "<p>✅ Registro encontrado en performance:</p>";
            echo "<p>→ Preguntas: {$performance_record->totalquestions}</p>";
            echo "<p>→ Correctas: {$performance_record->correctanswers}</p>";
            echo "<p>→ Última actividad: " . date('Y-m-d H:i:s', $performance_record->lastactivity) . "</p>";
        } else {
            echo "<p>❌ NO hay registro en performance para {$topic}</p>";
        }
    }
    
} else {
    echo "<p>❌ No se encontró ningún intento reciente</p>";
}

echo "<p>🎉 Test completado</p>";
?> 