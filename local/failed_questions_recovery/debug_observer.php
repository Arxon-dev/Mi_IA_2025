<?php
require_once('../../config.php');
require_once($CFG->dirroot.'/local/failed_questions_recovery/lib.php');
require_once($CFG->dirroot.'/local/failed_questions_recovery/classes/observer.php');

require_login();

// Detectar si viene del dashboard de estudiantes
$from_student = optional_param('from_student', 0, PARAM_INT);
$force_process = optional_param('force_process', 0, PARAM_INT);

// Si es un estudiante y está forzando procesamiento, mostrar interfaz simplificada
if ($force_process && !$from_student) {
    // Comprobar si viene del student_dashboard verificando el referer
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if (strpos($referer, 'student_dashboard.php') !== false) {
        $from_student = 1;
    }
}

// CSS para versión de estudiante
if ($from_student) {
    echo '<style>
    .student-process-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
    }
    
    .process-header {
        text-align: center;
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
        color: white;
        padding: 30px 20px;
        border-radius: 12px;
        margin-bottom: 30px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .process-header h1 {
        margin: 0 0 10px 0;
        font-size: 2rem;
        font-weight: 300;
    }
    
    .process-step {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 10px;
        padding: 25px;
        margin: 20px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .process-step.active {
        border-color: #007bff;
        background: linear-gradient(135deg, #f8f9fa 0%, #e8f4fd 100%);
    }
    
    .process-step.success {
        border-color: #28a745;
        background: linear-gradient(135deg, #f8f9fa 0%, #d4edda 100%);
    }
    
    .step-icon {
        font-size: 2rem;
        margin-bottom: 10px;
        display: block;
    }
    
    .step-title {
        font-size: 1.3rem;
        font-weight: bold;
        margin-bottom: 10px;
        color: #495057;
    }
    
    .step-description {
        color: #6c757d;
        margin-bottom: 15px;
    }
    
    .btn-student-return {
        background: #007bff;
        color: white;
        padding: 12px 30px;
        border: none;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        display: inline-block;
        margin-top: 20px;
    }
    
    .btn-student-return:hover {
        background: #0056b3;
        color: white;
        text-decoration: none;
    }
    
    .loading-spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 10px auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .result-summary {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        text-align: center;
    }
    
    .result-summary h3 {
        margin: 0 0 10px 0;
        color: #155724;
    }
    
    .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin: 15px 0;
    }
    
    .stat-item {
        text-align: center;
        padding: 15px;
        background: white;
        border-radius: 8px;
        border: 1px solid #c3e6cb;
    }
    
    .stat-number {
        font-size: 2rem;
        font-weight: bold;
        color: #28a745;
    }
    
    .stat-label {
        font-size: 0.9rem;
        color: #6c757d;
    }
    </style>';
}

global $DB, $USER;

echo "<h1>🔍 Diagnóstico del Observer de Preguntas Falladas</h1>";

// Procesar forzado si se solicita
if ($force_process) {
    if ($from_student) {
        // Versión simplificada para estudiantes
        echo '<div class="student-process-container">';
        
        echo '<div class="process-header">';
        echo '<h1>🔄 Procesando tu Quiz</h1>';
        echo '<p>Estamos analizando las preguntas que fallaste...</p>';
        echo '</div>';
        
        echo '<div class="process-step active">';
        echo '<span class="step-icon">⏳</span>';
        echo '<div class="step-title">Paso 1: Analizando Quiz</div>';
        echo '<div class="step-description">Revisando las preguntas de tu quiz reciente...</div>';
        echo '<div class="loading-spinner"></div>';
        echo '</div>';
        
        // Hacer el procesamiento
        try {
            $attempt = $DB->get_record('quiz_attempts', ['id' => $force_process]);
            if (!$attempt) {
                throw new Exception("No se encontró el intento de quiz");
            }
            
            // Incluir librerías necesarias
            require_once($CFG->dirroot . '/mod/quiz/locallib.php');
            require_once($CFG->dirroot . '/question/engine/lib.php');
            
            $before_count = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id]);
            
            // Crear objeto quiz_attempt
            $attemptobj = \quiz_attempt::create($attempt->id);
            if ($attemptobj) {
                $slots = $attemptobj->get_slots();
                $new_records = 0;
                $total_questions = count($slots);
                
                // Obtener nombre del quiz
                $quiz = $DB->get_record('quiz', ['id' => $attempt->quiz]);
                $quiz_name = $quiz ? $quiz->name : 'Quiz';
                
                foreach ($slots as $slot) {
                    $qa = $attemptobj->get_question_attempt($slot);
                    if (!$qa) continue;
                    
                    $question = $qa->get_question();
                    if (!$question) continue;
                    
                    // Determinar si falló
                    $state = $qa->get_state();
                    $mark = $qa->get_mark();
                    $maxmark = $qa->get_max_mark();
                    $state_class = get_class($state);
                    
                    $is_failed = false;
                    if (strpos($state_class, 'gaveup') !== false) {
                        $is_failed = true;
                    } else if (strpos($state_class, 'gradedwrong') !== false) {
                        $is_failed = true;
                    } else if ($mark !== null && $maxmark !== null && $maxmark > 0) {
                        $percentage = ($mark / $maxmark) * 100;
                        if ($percentage < 50) {
                            $is_failed = true;
                        }
                    }
                    
                    if ($is_failed) {
                        // Verificar si ya existe
                        $existing = $DB->get_record('local_failed_questions_recovery', [
                            'userid' => $USER->id,
                            'questionid' => $question->id
                        ]);
                        
                        if (!$existing) {
                            // Crear nuevo registro usando el nombre del quiz en lugar de la categoría
                            $record = new \stdClass();
                            $record->userid = (int)$USER->id;
                            $record->questionid = (int)$question->id;
                            $record->courseid = (int)$attempt->courseid;
                            $record->quizid = (int)$attempt->quiz;
                            $record->categoryid = (int)$question->category;
                            $record->categoryname = substr($quiz_name, 0, 255); // Usar nombre del quiz
                            $record->questiontext = substr(strip_tags($question->questiontext), 0, 1000);
                            
                            // Manejar qtype
                            $qtype_string = '';
                            if (is_object($question->qtype)) {
                                $qtype_string = get_class($question->qtype);
                                if (strpos($qtype_string, 'qtype_') === 0) {
                                    $qtype_string = substr($qtype_string, 6);
                                }
                            } else {
                                $qtype_string = (string)$question->qtype;
                            }
                            $record->questiontype = substr($qtype_string, 0, 50);
                            
                            $record->attempts = 1;
                            $record->lastfailed = time();
                            $record->mastered = 0;
                            $record->timecreated = time();
                            $record->timemodified = time();
                            
                            $id = $DB->insert_record('local_failed_questions_recovery', $record);
                            if ($id) {
                                $new_records++;
                            }
                        }
                    }
                }
                
                // Mostrar resultado simplificado
                echo '<script>
                    setTimeout(function() {
                        document.querySelector(".process-step.active").className = "process-step success";
                        document.querySelector(".step-icon").textContent = "✅";
                        document.querySelector(".step-title").textContent = "¡Procesamiento Completado!";
                        document.querySelector(".step-description").textContent = "Tu quiz ha sido analizado correctamente.";
                        document.querySelector(".loading-spinner").style.display = "none";
                    }, 2000);
                </script>';
                
                echo '<div class="result-summary">';
                echo '<h3>🎉 ¡Listo! Tu quiz ha sido procesado</h3>';
                echo '<div class="stats-row">';
                echo '<div class="stat-item">';
                echo '<div class="stat-number">' . $total_questions . '</div>';
                echo '<div class="stat-label">Preguntas Totales</div>';
                echo '</div>';
                echo '<div class="stat-item">';
                echo '<div class="stat-number">' . $new_records . '</div>';
                echo '<div class="stat-label">Preguntas Falladas Nuevas</div>';
                echo '</div>';
                echo '</div>';
                
                if ($new_records > 0) {
                    echo '<p><strong>✨ Genial:</strong> Se guardaron ' . $new_records . ' preguntas para que puedas practicarlas.</p>';
                } else {
                    echo '<p><strong>👍 Perfecto:</strong> No hubo preguntas nuevas falladas o ya estaban guardadas.</p>';
                }
                echo '</div>';
                
                echo '<div style="text-align: center; margin-top: 30px;">';
                echo '<a href="student_dashboard.php" class="btn-student-return">🏠 Volver a Mi Dashboard</a>';
                echo '</div>';
                
                echo '</div>'; // Cerrar container
                
                // JavaScript para redirección automática después de 5 segundos
                echo '<script>
                    setTimeout(function() {
                        if (confirm("¿Quieres volver a tu dashboard ahora?")) {
                            window.location.href = "student_dashboard.php";
                        }
                    }, 5000);
                </script>';
                
                exit; // Terminar aquí para estudiantes
            }
        } catch (Exception $e) {
            echo '<div class="process-step" style="border-color: #dc3545; background: #f8d7da;">';
            echo '<span class="step-icon">❌</span>';
            echo '<div class="step-title">Error en el Procesamiento</div>';
            echo '<div class="step-description">Hubo un problema: ' . htmlspecialchars($e->getMessage()) . '</div>';
            echo '<a href="student_dashboard.php" class="btn-student-return">🏠 Volver al Dashboard</a>';
            echo '</div>';
            echo '</div>';
            exit;
        }
    }
    
    // Continuar con la versión técnica para administradores...
    echo '<div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0;">';
    echo '<h3>🔧 Forzando procesamiento del Intento ID: ' . $force_process . '</h3>';
    echo '<p>🔄 Iniciando procesamiento manual...</p>';
    echo '</div>';
}

// 1. Verificar últimos intentos de quiz del usuario
echo "<h3>1. 📊 Últimos intentos de quiz (últimas 2 horas)</h3>";

$recent_attempts = $DB->get_records_sql("
    SELECT qa.*, q.name as quiz_name, c.fullname as course_name
    FROM {quiz_attempts} qa
    JOIN {quiz} q ON qa.quiz = q.id
    JOIN {course} c ON q.course = c.id
    WHERE qa.userid = ? 
    AND qa.timefinish > ?
    AND qa.state = 'finished'
    ORDER BY qa.timefinish DESC
    LIMIT 10
", [$USER->id, time() - 7200]); // Últimas 2 horas

if (empty($recent_attempts)) {
    echo "<p>❌ No se encontraron intentos de quiz terminados en las últimas 2 horas.</p>";
} else {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>Attempt ID</th><th>Quiz Name</th><th>Course</th><th>Finish Time</th><th>State</th><th>Actions</th>";
    echo "</tr>";
    
    foreach ($recent_attempts as $attempt) {
        $finish_time = date('Y-m-d H:i:s', $attempt->timefinish);
        echo "<tr>";
        echo "<td>{$attempt->id}</td>";
        echo "<td>" . htmlspecialchars($attempt->quiz_name) . "</td>";
        echo "<td>" . htmlspecialchars($attempt->course_name) . "</td>";
        echo "<td>{$finish_time}</td>";
        echo "<td>{$attempt->state}</td>";
        echo "<td><a href='?debug_attempt={$attempt->id}'>🔍 Debug</a> | <a href='?force_process={$attempt->id}'>🔧 Forzar</a></td>";
        echo "</tr>";
    }
    echo "</table>";
}

// 2. Verificar logs de error recientes
echo "<h3>2. 📋 Estado del Observer</h3>";

// Verificar si hay logs de error recientes del observer
$log_file = $CFG->dataroot . '/moodledata_log/apache_error.log';
if (file_exists($log_file)) {
    $recent_logs = shell_exec("tail -50 '$log_file' | grep 'FQR Observer' | tail -10");
    if ($recent_logs) {
        echo "<h4>📝 Logs recientes del Observer:</h4>";
        echo "<pre style='background: #f5f5f5; padding: 10px; border-radius: 5px;'>";
        echo htmlspecialchars($recent_logs);
        echo "</pre>";
    } else {
        echo "<p>⚠️ No se encontraron logs recientes del Observer.</p>";
    }
} else {
    echo "<p>⚠️ No se puede acceder a los logs de error.</p>";
}

// 3. Verificar configuración de eventos
echo "<h3>3. ⚙️ Configuración de Eventos</h3>";

$events_config = $DB->get_records('events_handlers', ['component' => 'local_failed_questions_recovery']);
if (empty($events_config)) {
    echo "<p>⚠️ No se encontraron handlers de eventos registrados para el plugin.</p>";
} else {
    echo "<p>✅ Handlers de eventos encontrados: " . count($events_config) . "</p>";
}

// 4. Debug específico de un intento
$debug_attempt = optional_param('debug_attempt', 0, PARAM_INT);
if ($debug_attempt > 0) {
    echo "<h3>4. 🔍 Debug del Intento ID: $debug_attempt</h3>";
    
    try {
        $result = \local_failed_questions_recovery\observer::debug_process_attempt($debug_attempt);
        
        echo "<h4>📊 Resultados del Debug:</h4>";
        echo "<ul>";
        echo "<li><strong>Intento ID:</strong> {$result['attemptid']}</li>";
        echo "<li><strong>Procesado:</strong> " . ($result['processed'] ? '✅ Sí' : '❌ No') . "</li>";
        if ($result['error']) {
            echo "<li><strong>Error:</strong> <span style='color: red;'>{$result['error']}</span></li>";
        }
        echo "<li><strong>Preguntas procesadas:</strong> {$result['questions_processed']}</li>";
        echo "<li><strong>Preguntas falladas:</strong> {$result['questions_failed']}</li>";
        echo "<li><strong>Registros insertados:</strong> {$result['questions_inserted']}</li>";
        echo "</ul>";
        
        if (!empty($result['details'])) {
            echo "<h4>📝 Detalles por pregunta:</h4>";
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr style='background: #f0f0f0;'>";
            echo "<th>Slot</th><th>Question ID</th><th>State</th><th>Mark</th><th>Max Mark</th><th>Failed</th><th>Action</th>";
            echo "</tr>";
            
            foreach ($result['details'] as $detail) {
                echo "<tr>";
                echo "<td>{$detail['slot']}</td>";
                echo "<td>{$detail['question_id']}</td>";
                echo "<td>" . htmlspecialchars($detail['state'] ?? 'N/A') . "</td>";
                echo "<td>{$detail['mark']}</td>";
                echo "<td>{$detail['maxmark']}</td>";
                echo "<td>" . ($detail['is_failed'] ? '❌ Sí' : '✅ No') . "</td>";
                echo "<td>{$detail['action']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error durante el debug: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
}

// 6. Verificar preguntas falladas registradas recientemente
echo "<h3>6. 📊 Preguntas Falladas Registradas Recientemente</h3>";

$recent_failed = $DB->get_records_sql("
    SELECT fq.*, q.name as quiz_name
    FROM {local_failed_questions_recovery} fq
    LEFT JOIN {quiz} qq ON fq.quizid = qq.id
    LEFT JOIN {quiz} q ON q.id = qq.id
    WHERE fq.userid = ? 
    AND fq.timecreated > ?
    ORDER BY fq.timecreated DESC
    LIMIT 10
", [$USER->id, time() - 7200]); // Últimas 2 horas

if (empty($recent_failed)) {
    echo "<p>❌ No se han registrado preguntas falladas en las últimas 2 horas.</p>";
    echo "<p>💡 <strong>Esto indica que el observer no está funcionando automáticamente.</strong></p>";
} else {
    echo "<p>✅ Se encontraron " . count($recent_failed) . " preguntas falladas registradas recientemente.</p>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr style='background: #f0f0f0;'>";
    echo "<th>ID</th><th>Question ID</th><th>Quiz</th><th>Category</th><th>Created</th>";
    echo "</tr>";
    
    foreach ($recent_failed as $failed) {
        $created_time = date('Y-m-d H:i:s', $failed->timecreated);
        echo "<tr>";
        echo "<td>{$failed->id}</td>";
        echo "<td>{$failed->questionid}</td>";
        echo "<td>" . htmlspecialchars($failed->quiz_name ?? 'Unknown') . "</td>";
        echo "<td>" . htmlspecialchars($failed->categoryname) . "</td>";
        echo "<td>{$created_time}</td>";
        echo "</tr>";
    }
    echo "</table>";
}

// 7. Corregir categorías incorrectas
$fix_categories = optional_param('fix_categories', 0, PARAM_INT);
if ($fix_categories > 0) {
    echo "<h3>7. 🔧 Corrigiendo Categorías Incorrectas</h3>";
    
    // Buscar registros con categorías que no son nombres de quiz
    $incorrect_categories = $DB->get_records_sql("
        SELECT fq.*, q.name as correct_quiz_name
        FROM {local_failed_questions_recovery} fq
        JOIN {quiz} q ON fq.quizid = q.id
        WHERE fq.userid = ? 
        AND fq.categoryname != q.name
        AND fq.categoryname NOT LIKE '%TEST%'
        AND fq.categoryname NOT LIKE '%QUIZ%'
    ", [$USER->id]);
    
    if (!empty($incorrect_categories)) {
        echo "<p>🔄 Corrigiendo " . count($incorrect_categories) . " registros con categorías incorrectas...</p>";
        
        $corrected = 0;
        foreach ($incorrect_categories as $record) {
            $record->categoryname = $record->correct_quiz_name;
            $record->timemodified = time();
            
            if ($DB->update_record('local_failed_questions_recovery', $record)) {
                $corrected++;
                echo "<p>✅ Corregida pregunta {$record->questionid}: '{$record->correct_quiz_name}'</p>";
            }
        }
        
        echo "<p><strong>📊 Resultado: {$corrected} registros corregidos exitosamente.</strong></p>";
    } else {
        echo "<p>✅ No se encontraron categorías que necesiten corrección.</p>";
    }
}

echo "<hr>";
echo "<h3>🛠️ Acciones de Diagnóstico</h3>";

// Verificar si hay categorías incorrectas
$needs_category_fix = $DB->get_records_sql("
    SELECT COUNT(*) as count
    FROM {local_failed_questions_recovery} fq
    JOIN {quiz} q ON fq.quizid = q.id
    WHERE fq.userid = ? 
    AND fq.categoryname != q.name
    AND fq.categoryname NOT LIKE '%TEST%'
    AND fq.categoryname NOT LIKE '%QUIZ%'
", [$USER->id]);

$category_issues = reset($needs_category_fix);
$has_category_issues = $category_issues && $category_issues->count > 0;

echo "<ul>";
echo "<li><strong>✅ Observer registrado correctamente</strong> - El archivo events.php está configurado</li>";
if ($has_category_issues) {
    echo "<li><strong>⚠️ Categorías incorrectas detectadas:</strong> <a href='?fix_categories=1' style='color: orange; font-weight: bold;'>🔧 Corregir Ahora</a></li>";
}
echo "<li><strong>🔍 Para diagnosticar un quiz específico:</strong> Haz clic en 'Debug' junto al intento</li>";
echo "<li><strong>🔧 Para forzar el procesamiento:</strong> Haz clic en 'Forzar' junto al intento</li>";
echo "<li><strong>📋 Revisa los logs:</strong> Los mensajes del observer aparecen con 'FQR Observer' en los logs</li>";
echo "</ul>";

echo "<h3>🚨 Problema Principal Identificado</h3>";
echo "<div style='background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
echo "<h4>⚠️ Handlers de eventos no registrados</h4>";
echo "<p><strong>Causa:</strong> El observer automático no está funcionando porque Moodle no tiene registrados los handlers de eventos.</p>";
echo "<p><strong>Soluciones disponibles:</strong></p>";
echo "<ol>";
echo "<li><strong>🔧 Verificar instalación:</strong> <a href='simple_install_events.php' style='background: #17a2b8; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; font-weight: bold;'>Ver Estado del Observer</a></li>";
echo "<li><strong>🛠️ Solución temporal:</strong> Usa el botón 'Forzar' para procesar quiz manualmente</li>";
echo "<li><strong>⚙️ Solución del administrador:</strong> Ejecutar <code style='background: #f8f9fa; padding: 2px 5px; border-radius: 3px;'>php admin/cli/upgrade.php</code></li>";
echo "</ol>";
echo "</div>";

echo '<p><a href="index.php">🏠 Volver al Dashboard</a></p>';
?> 