<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔧 Corrección de Temas Faltantes</h2>";

// Obtener todos los registros en moodleactivity que no tienen topic_performance
$missing_topics = $DB->get_records_sql("
    SELECT DISTINCT ma.quiz_id, ma.user_id, q.name as quiz_name, c.fullname as course_name
    FROM {moodleactivity} ma
    JOIN {quiz} q ON q.id = ma.quiz_id
    JOIN {course} c ON c.id = q.course
    LEFT JOIN {local_telegram_user_topic_performance} tp ON tp.userid = ma.user_id
    WHERE tp.id IS NULL
    ORDER BY ma.quiz_id, ma.user_id
");

echo "<p>📊 Encontrados " . count($missing_topics) . " registros con temas faltantes</p>";

$processed = 0;
$errors = 0;
$topics_added = array();

foreach ($missing_topics as $record) {
    try {
        // Intentar detectar el tema con la nueva función
        $topic = telegram_get_topic_from_quiz($record->quiz_id);
        
        if ($topic) {
            // Verificar si ya existe el registro
            $existing = $DB->get_record('local_telegram_user_topic_performance', 
                array('userid' => $record->user_id, 'topic' => $topic));
            
            if (!$existing) {
                // Contar respuestas correctas e incorrectas para este usuario/quiz
                $stats = $DB->get_record_sql("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
                    FROM {moodleactivity} 
                    WHERE user_id = ? AND quiz_id = ?
                ", array($record->user_id, $record->quiz_id));
                
                // Insertar nuevo registro
                $topic_record = new stdClass();
                $topic_record->userid = $record->user_id;
                $topic_record->topic = $topic;
                $topic_record->correct_answers = $stats->correct ?? 0;
                $topic_record->total_answers = $stats->total ?? 0;
                $topic_record->last_updated = time();
                
                $DB->insert_record('local_telegram_user_topic_performance', $topic_record);
                
                $topics_added[$topic] = ($topics_added[$topic] ?? 0) + 1;
                $processed++;
                
                echo "<p>✅ Agregado: Usuario {$record->user_id} - Tema: {$topic} ({$stats->correct}/{$stats->total})</p>";
            }
        } else {
            echo "<p>⚠️ No se pudo detectar tema para Quiz: {$record->quiz_name} (ID: {$record->quiz_id})</p>";
            $errors++;
        }
    } catch (Exception $e) {
        echo "<p>❌ Error procesando Quiz {$record->quiz_id}: " . $e->getMessage() . "</p>";
        $errors++;
    }
}

echo "<hr>";
echo "<h3>📈 Resumen de Corrección</h3>";
echo "<p>✅ Registros procesados exitosamente: {$processed}</p>";
echo "<p>❌ Errores encontrados: {$errors}</p>";

if (!empty($topics_added)) {
    echo "<h4>📋 Temas agregados:</h4>";
    echo "<ul>";
    foreach ($topics_added as $topic => $count) {
        echo "<li><strong>{$topic}</strong>: {$count} registros</li>";
    }
    echo "</ul>";
}

echo "<p>🎉 <strong>Corrección completada!</strong></p>";
?> 