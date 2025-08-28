<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔄 Procesando Quizzes Recientes Manualmente</h2>";

// Obtener los últimos 20 intentos de quiz
$recent_attempts = $DB->get_records_sql("
    SELECT qa.id, qa.userid, qa.quiz, qa.sumgrades, qa.timestart, qa.timefinish,
           q.name as quiz_name, q.grade as max_grade
    FROM {quiz_attempts} qa
    JOIN {quiz} q ON qa.quiz = q.id
    WHERE qa.timefinish > 0 AND qa.timefinish > (UNIX_TIMESTAMP() - 86400)
    ORDER BY qa.timefinish DESC
    LIMIT 20
");

if (!$recent_attempts) {
    echo "<p>❌ No se encontraron intentos recientes</p>";
    exit;
}

echo "<p>📋 Procesando " . count($recent_attempts) . " intentos recientes...</p>";

// Función para obtener telegram user ID
function get_telegram_user_id_manual($moodle_user_id) {
    try {
        $pdo = new PDO(
            'mysql:host=localhost;dbname=u449034524_moodel_telegra;charset=utf8',
            'u449034524_opomelilla_25',
            'Sirius//03072503//',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $stmt = $pdo->prepare("
            SELECT telegramuserid 
            FROM moodleactivity 
            WHERE moodleuserid = ? 
            AND telegramuserid IS NOT NULL 
            LIMIT 1
        ");
        
        $stmt->execute([$moodle_user_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? $result['telegramuserid'] : null;
        
    } catch (Exception $e) {
        return null;
    }
}

// Función para actualizar performance
function update_topic_performance_manual($telegram_user, $topic, $is_correct) {
    global $DB;
    
    try {
        // Verificar si existe el registro
        $existing = $DB->get_record('local_telegram_user_topic_performance', [
            'telegramuserid' => $telegram_user,
            'sectionname' => $topic
        ]);
        
        if ($existing) {
            // Actualizar registro existente
            $existing->totalquestions += 1;
            if ($is_correct) {
                $existing->correctanswers += 1;
            } else {
                $existing->incorrectanswers += 1;
            }
            $existing->accuracy = ($existing->totalquestions > 0) ? 
                round(($existing->correctanswers / $existing->totalquestions) * 100, 2) : 0;
            $existing->lastactivity = time();
            $existing->updatedat = time();
            
            $DB->update_record('local_telegram_user_topic_performance', $existing);
            return "ACTUALIZADO";
            
        } else {
            // Crear nuevo registro
            $new_record = new stdClass();
            $new_record->telegramuserid = $telegram_user;
            $new_record->sectionid = crc32($topic);
            $new_record->sectionname = $topic;
            $new_record->totalquestions = 1;
            $new_record->correctanswers = $is_correct ? 1 : 0;
            $new_record->incorrectanswers = $is_correct ? 0 : 1;
            $new_record->accuracy = $is_correct ? 100 : 0;
            $new_record->lastactivity = time();
            $new_record->createdat = time();
            $new_record->updatedat = time();
            
            $DB->insert_record('local_telegram_user_topic_performance', $new_record);
            return "CREADO";
        }
        
    } catch (Exception $e) {
        return "ERROR: " . $e->getMessage();
    }
}

echo "<table border='1'>";
echo "<tr><th>Quiz</th><th>Usuario</th><th>Tema</th><th>Resultado</th><th>Telegram User</th><th>Acción</th></tr>";

foreach ($recent_attempts as $attempt) {
    $percentage = $attempt->max_grade > 0 ? ($attempt->sumgrades / $attempt->max_grade) : 0;
    $is_correct = $percentage >= 0.5;
    $detected_topic = telegram_extract_topic_from_name($attempt->quiz_name);
    $telegram_user = get_telegram_user_id_manual($attempt->userid);
    
    echo "<tr>";
    echo "<td>{$attempt->quiz_name}</td>";
    echo "<td>{$attempt->userid}</td>";
    echo "<td>" . ($detected_topic ? $detected_topic : 'No detectado') . "</td>";
    echo "<td>" . round($percentage * 100, 2) . "% (" . ($is_correct ? 'PASS' : 'FAIL') . ")</td>";
    echo "<td>" . ($telegram_user ? $telegram_user : 'No encontrado') . "</td>";
    
    if ($detected_topic && $telegram_user) {
        $result = update_topic_performance_manual($telegram_user, $detected_topic, $is_correct);
        echo "<td style='color: green;'>✅ {$result}</td>";
    } else {
        echo "<td style='color: red;'>❌ No procesado</td>";
    }
    
    echo "</tr>";
}

echo "</table>";

echo "<h3>📊 Verificar Resultados</h3>";
echo "<p><a href='check-table-data.php'>Ver datos actualizados en la tabla</a></p>";
?>