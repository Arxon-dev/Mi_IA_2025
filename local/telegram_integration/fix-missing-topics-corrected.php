<?php
// Intentar múltiples rutas para config.php
$config_paths = array(
    '../../config.php',
    '../../../config.php',
    '../../../../config.php',
    dirname(__FILE__) . '/../../config.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config.php'
);

$config_found = false;
foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $config_found = true;
        break;
    }
}

if (!$config_found) {
    die("❌ Error: No se pudo encontrar config.php en las rutas esperadas");
}

// Verificar si locallib.php existe
$locallib_path = dirname(__FILE__) . '/locallib.php';
if (!file_exists($locallib_path)) {
    die("❌ Error: No se pudo encontrar locallib.php");
}

try {
    require_once($locallib_path);
} catch (Exception $e) {
    die("❌ Error cargando locallib.php: " . $e->getMessage());
}

// Verificar conexión a la base de datos
try {
    $test_query = $DB->get_records_sql("SELECT 1 as test", array(), 0, 1);
    echo "✅ Conexión a la base de datos: OK<br>";
} catch (Exception $e) {
    die("❌ Error de conexión a la base de datos: " . $e->getMessage());
}

echo "<h2>🔧 Corrección de Temas Faltantes - Versión Corregida</h2>";

// Verificar que las tablas existen
$tables_to_check = array('moodleactivity', 'local_telegram_user_topic_performance', 'quiz', 'course');
foreach ($tables_to_check as $table) {
    try {
        $exists = $DB->get_manager()->table_exists($table);
        if (!$exists) {
            die("❌ Error: La tabla {$table} no existe");
        }
        echo "✅ Tabla {$table}: OK<br>";
    } catch (Exception $e) {
        die("❌ Error verificando tabla {$table}: " . $e->getMessage());
    }
}

echo "<hr>";

// Obtener todos los registros en moodleactivity que no tienen topic_performance
try {
    $missing_topics = $DB->get_records_sql("
        SELECT DISTINCT ma.quiz_id, ma.user_id, q.name as quiz_name, c.fullname as course_name
        FROM {moodleactivity} ma
        JOIN {quiz} q ON q.id = ma.quiz_id
        JOIN {course} c ON c.id = q.course
        LEFT JOIN {local_telegram_user_topic_performance} tp ON tp.userid = ma.user_id
        WHERE tp.id IS NULL
        ORDER BY ma.quiz_id, ma.user_id
        LIMIT 100
    ");
} catch (Exception $e) {
    die("❌ Error ejecutando consulta principal: " . $e->getMessage());
}

echo "<p>📊 Encontrados " . count($missing_topics) . " registros con temas faltantes (limitado a 100)</p>";

$processed = 0;
$errors = 0;
$topics_added = array();

foreach ($missing_topics as $record) {
    try {
        // Intentar detectar el tema con la función
        $topic = telegram_get_topic_from_quiz($record->quiz_id);
        
        if ($topic) {
            echo "<p>🔍 Quiz: {$record->quiz_name} → Tema detectado: <strong>{$topic}</strong></p>";
            
            // Verificar si ya existe el registro
            $existing = $DB->get_record('local_telegram_user_topic_performance', 
                array('userid' => $record->user_id, 'topic' => $topic));
            
            if (!$existing) {
                // Contar respuestas para este usuario/quiz
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
            } else {
                echo "<p>ℹ️ Ya existe registro para Usuario {$record->user_id} - Tema: {$topic}</p>";
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