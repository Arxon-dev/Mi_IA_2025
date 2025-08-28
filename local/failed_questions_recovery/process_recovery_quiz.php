<?php
require_once('../../config.php');
require_once('lib.php');

// Verificar que el usuario esté autenticado
require_login();

// Configurar la página
$context = context_user::instance($USER->id);
$PAGE->set_context($context);
$PAGE->set_url('/local/failed_questions_recovery/process_recovery_quiz.php');
// Cambiar títulos (líneas ~12-13)
$PAGE->set_title('Procesar cuestionario de recuperación');
$PAGE->set_heading('Procesar cuestionario de recuperación');

// Cambiar el título principal (línea ~138)
echo '<h1>🎯 Procesar cuestionario de recuperación</h1>';

// Cambiar el subtítulo (línea ~147)
echo '<h3>🔄 Procesando cuestionario...</h3>';

// Cambiar el texto de sección (línea ~254)
echo '<h2>📝 Mis cuestionarios de recuperación recientes</h2>';
echo '<p>Selecciona un cuestionario para procesar sus resultados y marcar las preguntas acertadas como dominadas:</p>';
echo '<p>Marca automáticamente las preguntas acertadas como dominadas</p>';
echo '</div>';

// Procesar quiz si se solicita
if (isset($_GET['process_quiz'])) {
    $quizid = (int)$_GET['process_quiz'];
    
    echo '<div class="result-card">';
    echo '<h3>🔄 Procesando Quiz...</h3>';
    
    try {
        // Buscar el último intento del usuario en este quiz
        $attempt = $DB->get_record_sql("
            SELECT * FROM {quiz_attempts} 
            WHERE userid = ? AND quiz = ? AND state = 'finished'
            ORDER BY timefinish DESC 
            LIMIT 1
        ", [$USER->id, $quizid]);
        
        if (!$attempt) {
            throw new Exception("No se encontró ningún intento completado para este quiz.");
        }
        
        // Cargar el intento del quiz
        require_once($CFG->dirroot . '/mod/quiz/locallib.php');
        require_once($CFG->dirroot . '/question/engine/lib.php');
        
        $attemptobj = quiz_attempt::create($attempt->id);
        if (!$attemptobj) {
            throw new Exception("No se pudo cargar el intento del quiz.");
        }
        
        $slots = $attemptobj->get_slots();
        $processed = 0;
        $marked_mastered = 0;
        $failed_questions = 0;
        
        echo "<p><strong>📊 Procesando " . count($slots) . " preguntas...</strong></p>";
        
        foreach ($slots as $slot) {
            $qa = $attemptobj->get_question_attempt($slot);
            $question = $qa->get_question();
            
            if (!$question) continue;
            
            $mark = $qa->get_mark();
            $maxmark = $qa->get_max_mark();
            $state = $qa->get_state();
            
            $processed++;
            
            if ($mark !== null && $maxmark !== null && $maxmark > 0) {
                $percentage = ($mark / $maxmark) * 100;
                
                echo '<div class="question-result ' . ($percentage >= 80 ? 'question-correct' : 'question-incorrect') . '">';
                echo '<strong>Pregunta ' . $question->id . ':</strong> ';
                echo $percentage . '% (' . $mark . '/' . $maxmark . ') ';
                
                if ($percentage >= 80) {
                    // Marcar como dominada
                    $existing = $DB->get_record('local_failed_questions_recovery', [
                        'userid' => $USER->id,
                        'questionid' => $question->id
                    ]);
                    
                    if ($existing && $existing->mastered == 0) {
                        $existing->mastered = 1;
                        $existing->timemodified = time();
                        $DB->update_record('local_failed_questions_recovery', $existing);
                        $marked_mastered++;
                        echo '<span style="color: #28a745;">✅ MARCADA COMO DOMINADA</span>';
                    } else if ($existing && $existing->mastered == 1) {
                        echo '<span style="color: #28a745;">✅ YA ERA DOMINADA</span>';
                    } else {
                        echo '<span style="color: #6c757d;">ℹ️ No estaba en preguntas falladas</span>';
                    }
                } else {
                    $failed_questions++;
                    echo '<span style="color: #dc3545;">❌ Respuesta incorrecta</span>';
                }
                
                echo '</div>';
            }
        }
        
        echo '<div class="stats-grid">';
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . $processed . '</div>';
        echo '<div class="stat-label">Preguntas Procesadas</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . $marked_mastered . '</div>';
        echo '<div class="stat-label">Marcadas como Dominadas</div>';
        echo '</div>';
        
        echo '<div class="stat-card">';
        echo '<div class="stat-number">' . $failed_questions . '</div>';
        echo '<div class="stat-label">Aún Pendientes</div>';
        echo '</div>';
        echo '</div>';
        
        echo '<p><strong>🎉 ¡Procesamiento completado!</strong></p>';
        echo '<p><a href="student_dashboard.php" class="btn-process">🏠 Volver al Dashboard</a></p>';
        
    } catch (Exception $e) {
        echo '</div><div class="error-card">';
        echo '<h3>❌ Error</h3>';
        echo '<p>' . $e->getMessage() . '</p>';
    }
    
    echo '</div>';
    
} else {
    // Mostrar quiz de recuperación recientes del usuario
    echo '<h2>📝 Mis Quiz de Recuperación Recientes</h2>';
    echo '<p>Selecciona un quiz para procesar sus resultados y marcar las preguntas acertadas como dominadas:</p>';
    
    // Buscar quiz de recuperación del usuario (quiz que contienen sus preguntas falladas)
    $recovery_attempts = $DB->get_records_sql("
        SELECT DISTINCT qa.*, q.name as quiz_name, q.id as quiz_id
        FROM {quiz_attempts} qa
        JOIN {quiz} q ON qa.quiz = q.id
        WHERE qa.userid = ? 
        AND qa.state = 'finished'
        AND qa.timefinish > ?
        AND q.name LIKE '%Recuperación%'
        ORDER BY qa.timefinish DESC
        LIMIT 10
    ", [$USER->id, time() - (7 * 24 * 60 * 60)]); // Últimos 7 días
    
    // Si no encuentra quiz con "Recuperación" en el nombre, buscar los más recientes
    if (empty($recovery_attempts)) {
        $recovery_attempts = $DB->get_records_sql("
            SELECT DISTINCT qa.*, q.name as quiz_name, q.id as quiz_id
            FROM {quiz_attempts} qa
            JOIN {quiz} q ON qa.quiz = q.id
            WHERE qa.userid = ? 
            AND qa.state = 'finished'
            AND qa.timefinish > ?
            ORDER BY qa.timefinish DESC
            LIMIT 5
        ", [$USER->id, time() - (3 * 24 * 60 * 60)]); // Últimos 3 días
    }
    
    if (!empty($recovery_attempts)) {
        foreach ($recovery_attempts as $attempt) {
            echo '<div class="quiz-card">';
            echo '<div class="quiz-title">' . htmlspecialchars($attempt->quiz_name) . '</div>';
            echo '<div class="quiz-details">';
            echo '⏰ Completado: ' . date('d/m/Y H:i', $attempt->timefinish) . '<br>';
            echo '📊 Nota: ' . ($attempt->sumgrades ?? 'N/A') . '/' . ($attempt->maxmarks ?? 'N/A');
            echo '</div>';
            echo '<a href="?process_quiz=' . $attempt->quiz_id . '" class="btn-process">🎯 Procesar Resultados</a>';
            echo '</div>';
        }
    } else {
        echo '<div class="error-card">';
        echo '<h3>📋 No hay quiz recientes</h3>';
        echo '<p>No se encontraron quiz completados en los últimos días.</p>';
        echo '<p><strong>💡 Sugerencia:</strong> Después de hacer un quiz de recuperación, vuelve aquí para procesar los resultados.</p>';
        echo '</div>';
    }
    
    // Mostrar estadísticas actuales
    echo '<h2>📈 Mis Estadísticas Actuales</h2>';
    
    $total_failed = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id]);
    $mastered = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id, 'mastered' => 1]);
    $pending = $total_failed - $mastered;
    
    echo '<div class="stats-grid">';
    echo '<div class="stat-card">';
    echo '<div class="stat-number">' . $total_failed . '</div>';
    echo '<div class="stat-label">Total Preguntas Falladas</div>';
    echo '</div>';
    
    echo '<div class="stat-card">';
    echo '<div class="stat-number">' . $mastered . '</div>';
    echo '<div class="stat-label">Ya Dominadas</div>';
    echo '</div>';
    
    echo '<div class="stat-card">';
    echo '<div class="stat-number">' . $pending . '</div>';
    echo '<div class="stat-label">Pendientes</div>';
    echo '</div>';
    echo '</div>';
    
    if ($total_failed > 0) {
        $progress = round(($mastered / $total_failed) * 100, 1);
        echo '<div style="background: white; padding: 20px; border-radius: 10px; margin-top: 20px;">';
        echo '<h3>🎯 Tu Progreso: ' . $progress . '%</h3>';
        echo '<div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">';
        echo '<div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); height: 100%; width: ' . $progress . '%; transition: width 2s ease;"></div>';
        echo '</div>';
        echo '</div>';
    }
}

echo '</div>';

echo $OUTPUT->footer();
?>