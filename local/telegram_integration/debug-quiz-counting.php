<?php
require_once('../../config.php');
require_once('locallib.php');

echo "=== DIAGNÓSTICO CONTEO DE PREGUNTAS ===\n";

// Buscar el último quiz de UNIÓN EUROPEA
$sql = "SELECT qa.id, qa.quiz, qa.userid, qa.timestart, qa.timefinish, qa.state, q.name as quiz_name
         FROM {quiz_attempts} qa 
         JOIN {quiz} q ON qa.quiz = q.id 
         WHERE q.name LIKE '%UNIÓN EUROPEA%' OR q.name LIKE '%UNION EUROPEA%'
         ORDER BY qa.timestart DESC 
         LIMIT 5";

$attempts = $DB->get_records_sql($sql);

foreach ($attempts as $attempt) {
    echo "\n--- INTENTO ID: {$attempt->id} ---\n";
    echo "Quiz: {$attempt->quiz_name}\n";
    echo "Usuario: {$attempt->userid}\n";
    echo "Estado: {$attempt->state}\n";
    echo "Inicio: " . date('Y-m-d H:i:s', $attempt->timestart) . "\n";
    echo "Fin: " . ($attempt->timefinish ? date('Y-m-d H:i:s', $attempt->timefinish) : 'No terminado') . "\n";
    
    // Contar preguntas del intento
    $question_count = $DB->count_records('question_attempts', ['questionusageid' => $attempt->id]);
    echo "Preguntas en el intento: {$question_count}\n";
    
    // Verificar detección de tema
    $detected_topic = telegram_extract_topic_from_name($attempt->quiz_name);
    echo "Tema detectado: {$detected_topic}\n";
    
    // Buscar en tabla de rendimiento
    $performance = $DB->get_record('local_telegram_user_topic_performance', [
        'sectionname' => $detected_topic
    ]);
    
    if ($performance) {
        echo "En tabla rendimiento - Total: {$performance->totalquestions}, Correctas: {$performance->correctanswers}, Incorrectas: {$performance->incorrectanswers}\n";
    } else {
        echo "❌ No encontrado en tabla de rendimiento\n";
    }
}

echo "\n=== VERIFICACIÓN LOGS RECIENTES ===\n";
// Buscar logs del observer
$log_file = ini_get('error_log');
if ($log_file && file_exists($log_file)) {
    $logs = file_get_contents($log_file);
    $recent_logs = array_slice(explode("\n", $logs), -50);
    
    foreach ($recent_logs as $log) {
        if (strpos($log, 'TELEGRAM') !== false && strpos($log, 'UNIÓN EUROPEA') !== false) {
            echo $log . "\n";
        }
    }
} else {
    echo "No se pudo acceder al archivo de logs\n";
}

echo "\n=== DIAGNÓSTICO COMPLETADO ===\n";
?>