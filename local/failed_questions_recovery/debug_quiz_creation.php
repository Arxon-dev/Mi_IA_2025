<?php
require_once('../../config.php');
require_once('lib.php');

require_login();

global $DB, $USER;

echo '<h2>🔍 Diagnóstico de Creación de Quiz</h2>';

// 1. Verificar si las tablas existen
echo '<h3>1. Verificación de Tablas</h3>';
$tables = ['local_failed_questions_recovery', 'local_fqr_recovery_quizzes', 'local_fqr_recovery_attempts'];
foreach ($tables as $table) {
    $exists = $DB->get_manager()->table_exists($table);
    echo '<p>✅ Tabla ' . $table . ': ' . ($exists ? 'EXISTE' : 'NO EXISTE') . '</p>';
    
    if ($exists) {
        $count = $DB->count_records($table);
        echo '<p>   📊 Registros: ' . $count . '</p>';
    }
}

// 2. Verificar preguntas falladas del usuario
echo '<h3>2. Preguntas Falladas del Usuario</h3>';
$failed_questions = get_all_failed_questions_for_user($USER->id);
echo '<p>📚 Total preguntas falladas: ' . count($failed_questions) . '</p>';

if (!empty($failed_questions)) {
    echo '<p>🎯 Primeras 3 preguntas:</p>';
    $sample = array_slice($failed_questions, 0, 3);
    foreach ($sample as $fq) {
        echo '<p>   - ID: ' . $fq->questionid . ', Quiz: ' . $fq->quizid . ', Categoría: ' . $fq->categoryname . '</p>';
    }
}

// 3. Intentar crear un quiz de prueba pequeño
echo '<h3>3. Prueba de Creación de Quiz</h3>';
if (!empty($failed_questions)) {
    try {
        $test_questions = array_slice($failed_questions, 0, 2); // Solo 2 preguntas para prueba
        echo '<p>🔄 Intentando crear quiz de prueba con ' . count($test_questions) . ' preguntas...</p>';
        
        $quiz_id = create_custom_recovery_quiz(
            $USER->id, 
            1, // courseid
            $test_questions, 
            'Quiz de Prueba - ' . date('H:i:s'), 
            'Prueba de todas las categorías'
        );
        
        echo '<p>✅ Quiz creado exitosamente con ID: ' . $quiz_id . '</p>';
        
        // Verificar que el registro existe
        $recovery_record = $DB->get_record('local_fqr_recovery_quizzes', ['id' => $quiz_id]);
        if ($recovery_record) {
            echo '<p>✅ Registro de recuperación encontrado:</p>';
            echo '<p>   - Nombre: ' . $recovery_record->quizname . '</p>';
            echo '<p>   - Usuario: ' . $recovery_record->userid . '</p>';
            echo '<p>   - Preguntas: ' . $recovery_record->questioncount . '</p>';
            echo '<p>   - Categoría: ' . $recovery_record->categoryname . '</p>';
            
            echo '<p><a href="take_quiz.php?quizid=' . $quiz_id . '" target="_blank">🎯 Probar Quiz</a></p>';
        } else {
            echo '<p>❌ No se encontró el registro de recuperación</p>';
        }
        
    } catch (Exception $e) {
        echo '<p>❌ Error al crear quiz: ' . $e->getMessage() . '</p>';
        
        // Mostrar detalles del error
        echo '<p>📋 Detalles técnicos:</p>';
        echo '<pre>' . $e->getTraceAsString() . '</pre>';
    }
} else {
    echo '<p>⚠️ No hay preguntas falladas para crear quiz de prueba</p>';
}

// 4. Listar quiz de recuperación existentes
echo '<h3>4. Quiz de Recuperación Existentes</h3>';
try {
    $existing_quizzes = $DB->get_records('local_fqr_recovery_quizzes', ['userid' => $USER->id], 'timecreated DESC', '*', 0, 5);
    echo '<p>📊 Quiz encontrados: ' . count($existing_quizzes) . '</p>';
    
    foreach ($existing_quizzes as $quiz) {
        echo '<p>   - ID: ' . $quiz->id . ', Nombre: ' . $quiz->quizname . ', Completado: ' . ($quiz->completed ? 'Sí' : 'No') . '</p>';
    }
} catch (Exception $e) {
    echo '<p>❌ Error al listar quiz: ' . $e->getMessage() . '</p>';
}

// 5. Prueba de flujo completo
echo '<h3>5. Prueba de Flujo Completo</h3>';
echo '<p>🧪 Prueba estos enlaces directos:</p>';
echo '<p><a href="create_quiz.php?all_categories=1" target="_blank">🌟 Crear Quiz de TODAS las categorías (igual que el dashboard)</a></p>';
echo '<p><a href="create_quiz.php?category=' . ($failed_questions[0]->quizid ?? '0') . '" target="_blank">📚 Crear Quiz de categoría individual</a></p>';

// 6. Debug del parámetro que viene del dashboard
if (isset($_GET['debug_dashboard'])) {
    echo '<h3>6. Debug de Dashboard</h3>';
    echo '<p>Parámetros recibidos:</p>';
    echo '<pre>';
    print_r($_GET);
    echo '</pre>';
}

echo '<hr>';
echo '<p><a href="student_dashboard.php">🏠 Volver al Dashboard</a></p>';
echo '<p><a href="debug_quiz_creation.php?debug_dashboard=1">🔍 Activar Debug</a></p>';
?> 