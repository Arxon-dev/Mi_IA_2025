<?php
require_once('../../config.php');
require_once($CFG->dirroot.'/local/failed_questions_recovery/lib.php');

require_login();

echo "<h2>⚡ Procesamiento Manual del Último Quiz</h2>";

global $DB, $USER;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $quiz_id = optional_param('quiz_id', 0, PARAM_INT);
    
    if ($quiz_id) {
        echo "<h3>🔄 Procesando Quiz ID: $quiz_id</h3>";
        
        // Obtener información del quiz
        $quiz = $DB->get_record('quiz', ['id' => $quiz_id]);
        $quiz_name = $quiz ? $quiz->name : "Quiz $quiz_id";
        
        // Buscar el último intento del usuario en este quiz
        $last_attempt = $DB->get_record_sql("
            SELECT * FROM {quiz_attempts} 
            WHERE userid = ? AND quiz = ? AND state = 'finished'
            ORDER BY timemodified DESC 
            LIMIT 1
        ", [$USER->id, $quiz_id]);
        
        if ($last_attempt) {
            echo "📅 Intento encontrado: " . date('Y-m-d H:i:s', $last_attempt->timemodified) . "<br>";
            
            // Obtener respuestas incorrectas - Versión simplificada sin categorías primero
            $incorrect_questions = $DB->get_records_sql("
                SELECT qa.questionid, q.name as quiz_name, q.id as quiz_id,
                       'Unknown' as category_name, 0 as category_id
                FROM {question_attempts} qa
                JOIN {quiz_attempts} quiza ON quiza.uniqueid = qa.questionusageid
                JOIN {quiz} q ON q.id = quiza.quiz
                JOIN {question_attempt_steps} qas ON qas.questionattemptid = qa.id
                WHERE qas.state = 'gradedwrong' 
                AND quiza.id = ?
                AND quiza.userid = ?
                AND qas.sequencenumber = (
                    SELECT MAX(sequencenumber) 
                    FROM {question_attempt_steps} 
                    WHERE questionattemptid = qa.id
                )
            ", [$last_attempt->id, $USER->id]);
            
            // Intentar obtener las categorías, pero continuar sin ellas si hay problemas
            echo "🔍 Identificando categorías de las preguntas...<br>";
            foreach ($incorrect_questions as $question) {
                // Inicializar con valores por defecto usando el nombre del quiz actual
                $question->category_name = $quiz_name;
                $question->category_id = $quiz_id; // Usar el ID del quiz como categoría temporal
                
                try {
                    // Intentar obtener la categoría real
                    $quest_record = $DB->get_record('question', ['id' => $question->questionid]);
                    if ($quest_record) {
                        // Verificar si existe el campo category
                        $fields = $DB->get_columns('question');
                        if (isset($fields['category'])) {
                            $cat_id = $quest_record->category;
                            $category = $DB->get_record('question_categories', ['id' => $cat_id]);
                            if ($category) {
                                $question->category_name = $category->name;
                                $question->category_id = $category->id;
                                echo "✅ Categoría encontrada: {$category->name}<br>";
                            } else {
                                echo "⚠️ Usando nombre de quiz como categoría: {$quiz_name}<br>";
                            }
                        } else {
                            echo "⚠️ Campo category no encontrado, usando nombre de quiz: {$quiz_name}<br>";
                        }
                    }
                } catch (Exception $e) {
                    echo "⚠️ Usando nombre de quiz como categoría para pregunta {$question->questionid}: {$quiz_name}<br>";
                }
            }
            
            $processed = 0;
            $errors = 0;
            
            foreach ($incorrect_questions as $question) {
                try {
                    // Verificar si ya existe
                    $existing = $DB->get_record('local_failed_questions_recovery', [
                        'userid' => $USER->id,
                        'questionid' => $question->questionid,
                        'categoryid' => $question->category_id
                    ]);
                    
                    if ($existing) {
                        // Actualizar última fecha de fallo
                        $existing->lastfailed = time();
                        $existing->mastered = 0; // Reset mastered status
                        $existing->timemodified = time();
                        $existing->attempts = $existing->attempts + 1;
                        $DB->update_record('local_failed_questions_recovery', $existing);
                        echo "🔄 Actualizada pregunta {$question->questionid}<br>";
                    } else {
                        // Obtener texto de la pregunta
                        $questiontext = $DB->get_field('question', 'questiontext', ['id' => $question->questionid]);
                        
                        // Insertar nueva pregunta fallida
                        $record = new stdClass();
                        $record->userid = $USER->id;
                        $record->questionid = $question->questionid;
                        $record->categoryid = $question->category_id;
                        $record->categoryname = substr($question->category_name, 0, 255); // Limitar longitud
                        $record->quizid = $question->quiz_id;
                        $record->courseid = 0; // Por defecto
                        $record->mastered = 0;
                        $record->lastfailed = time();
                        $record->attempts = 1;
                        $record->timecreated = time();
                        $record->timemodified = time();
                        $record->questiontext = $questiontext ? substr(strip_tags($questiontext), 0, 1000) : '';
                        $record->questiontype = 'multichoice'; // Por defecto
                        
                        // Debug: Mostrar los datos antes de insertar
                        echo "🔍 Intentando insertar pregunta {$question->questionid} con datos:<br>";
                        echo "- userid: {$record->userid}<br>";
                        echo "- questionid: {$record->questionid}<br>";
                        echo "- categoryid: {$record->categoryid}<br>";
                        echo "- categoryname: {$record->categoryname}<br>";
                        echo "- quizid: {$record->quizid}<br>";
                        
                        try {
                            $insert_id = $DB->insert_record('local_failed_questions_recovery', $record);
                            echo "✅ Insertada pregunta {$question->questionid} con ID: {$insert_id}<br>";
                        } catch (Exception $insert_e) {
                            echo "❌ Error específico insertando pregunta {$question->questionid}: " . $insert_e->getMessage() . "<br>";
                            echo "🔍 Código de error: " . $insert_e->getCode() . "<br>";
                            throw $insert_e; // Re-lanzar para debug
                        }
                    }
                    $processed++;
                } catch (Exception $e) {
                    echo "❌ Error procesando pregunta {$question->questionid}: " . $e->getMessage() . "<br>";
                    echo "🔍 Código de error: " . $e->getCode() . "<br>";
                    echo "🔍 Archivo: " . $e->getFile() . " línea: " . $e->getLine() . "<br>";
                    $errors++;
                }
            }
            
            echo "<br><h3>📊 Resumen del Procesamiento:</h3>";
            echo "✅ Preguntas procesadas: $processed<br>";
            echo "❌ Errores: $errors<br>";
            
            if ($processed > 0) {
                echo "<br>🎉 <strong>¡Procesamiento completado exitosamente!</strong><br>";
                echo "📍 <a href='index.php'>Volver al dashboard</a> para ver las nuevas categorías<br>";
            }
            
        } else {
            echo "❌ No se encontró un intento completado para este quiz<br>";
        }
    }
    
} else {
    // Mostrar últimos intentos para seleccionar
    echo "<h3>📊 Selecciona el quiz a procesar:</h3>";
    
    $recent_attempts = $DB->get_records_sql("
        SELECT DISTINCT qa.quiz, q.name as quiz_name, qa.timemodified, qa.sumgrades
        FROM {quiz_attempts} qa
        JOIN {quiz} q ON qa.quiz = q.id
        WHERE qa.userid = ? 
        AND qa.state = 'finished'
        AND qa.timemodified > ?
        ORDER BY qa.timemodified DESC
        LIMIT 10
    ", [$USER->id, time() - 86400*3]); // Últimos 3 días
    
    if ($recent_attempts) {
        echo "<form method='post'>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Seleccionar</th><th>Quiz Name</th><th>Fecha</th><th>Calificación</th></tr>";
        
        foreach ($recent_attempts as $attempt) {
            $date = date('Y-m-d H:i:s', $attempt->timemodified);
            echo "<tr>";
            echo "<td><input type='radio' name='quiz_id' value='{$attempt->quiz}' required></td>";
            echo "<td>{$attempt->quiz_name}</td>";
            echo "<td>{$date}</td>";
            echo "<td>{$attempt->sumgrades}</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        echo "<br><button type='submit' style='background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px;'>⚡ Procesar Quiz Seleccionado</button>";
        echo "</form>";
    } else {
        echo "❌ No se encontraron intentos recientes<br>";
    }
}

echo "<br><p>📍 <a href='index.php'>← Volver al dashboard</a></p>";
echo "<p>🔍 <a href='check_new_quiz.php'>Ver diagnóstico detallado</a></p>"; 