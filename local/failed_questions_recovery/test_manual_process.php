<?php
require_once('../../config.php');
require_once('lib.php');
require_once('classes/observer.php');

require_login();

$userid = $USER->id;

echo html_writer::start_tag('html');
echo html_writer::start_tag('head');
echo html_writer::tag('title', 'Test Manual Process - Failed Questions Recovery');
echo html_writer::end_tag('head');
echo html_writer::start_tag('body');

echo html_writer::tag('h1', '🧪 Test Manual del Observer');
echo html_writer::tag('p', 'Usuario: ' . $USER->username . ' (ID: ' . $userid . ')');

// 1. Obtener el último intento terminado
$last_attempt = $DB->get_record_sql("
    SELECT * FROM {quiz_attempts} 
    WHERE userid = ? AND state = 'finished'
    ORDER BY timefinish DESC 
    LIMIT 1
", [$userid]);

if (!$last_attempt) {
    echo html_writer::tag('p', '❌ No se encontró ningún intento terminado', ['style' => 'color: red;']);
    echo html_writer::end_tag('body');
    echo html_writer::end_tag('html');
    exit;
}

echo html_writer::tag('h2', '1. 📋 Último Intento Encontrado');
echo html_writer::tag('p', "✅ Intento ID: {$last_attempt->id}");
echo html_writer::tag('p', "Quiz ID: {$last_attempt->quiz}");
echo html_writer::tag('p', "Terminado: " . date('Y-m-d H:i:s', $last_attempt->timefinish));

// 2. Verificar que las tablas existen
echo html_writer::tag('h2', '2. ✅ Verificación de Tablas');

try {
    $count = $DB->count_records('local_failed_questions_recovery');
    echo html_writer::tag('p', "✅ Tabla local_failed_questions_recovery: OK ($count registros)", ['style' => 'color: green;']);
    $tables_ok = true;
} catch (Exception $e) {
    echo html_writer::tag('p', '❌ Tabla local_failed_questions_recovery: NO EXISTE', ['style' => 'color: red;']);
    echo html_writer::tag('p', '🔗 <a href="create_tables.php">Crear Tablas Primero</a>', ['style' => 'font-weight: bold;']);
    echo html_writer::end_tag('body');
    echo html_writer::end_tag('html');
    exit;
}

// 3. Procesar manualmente usando el observer
echo html_writer::tag('h2', '3. 🎯 Procesamiento Manual con Observer');

try {
    // Llamar a la función de debug del observer
    $result = \local_failed_questions_recovery\observer::debug_process_attempt($last_attempt->id);
    
    echo html_writer::tag('h3', 'Resultado del Procesamiento:');
    echo html_writer::tag('p', "Intento procesado: " . ($result['processed'] ? '✅ SÍ' : '❌ NO'), 
        ['style' => $result['processed'] ? 'color: green;' : 'color: red;']);
    
    if ($result['error']) {
        echo html_writer::tag('p', "❌ Error: " . $result['error'], ['style' => 'color: red;']);
    }
    
    echo html_writer::tag('p', "Preguntas procesadas: {$result['questions_processed']}");
    echo html_writer::tag('p', "Preguntas falladas: {$result['questions_failed']}");
    echo html_writer::tag('p', "Preguntas insertadas: {$result['questions_inserted']}");
    
    if (!empty($result['details'])) {
        echo html_writer::tag('h4', 'Detalles por Pregunta:');
        echo html_writer::start_tag('table', ['border' => '1', 'style' => 'border-collapse: collapse; width: 100%;']);
        echo html_writer::start_tag('tr');
        echo html_writer::tag('th', 'Slot');
        echo html_writer::tag('th', 'Question ID');
        echo html_writer::tag('th', 'Estado');
        echo html_writer::tag('th', 'Nota');
        echo html_writer::tag('th', '¿Fallada?');
        echo html_writer::tag('th', 'Acción');
        echo html_writer::end_tag('tr');
        
        foreach ($result['details'] as $detail) {
            echo html_writer::start_tag('tr');
            echo html_writer::tag('td', $detail['slot'] ?? 'N/A');
            echo html_writer::tag('td', $detail['question_id'] ?? 'N/A');
            echo html_writer::tag('td', str_replace('question_state_', '', $detail['state'] ?? 'N/A'));
            
            $mark_text = 'N/A';
            if (isset($detail['mark']) && isset($detail['maxmark']) && $detail['maxmark'] > 0) {
                $percentage = round(($detail['mark'] / $detail['maxmark']) * 100, 1);
                $mark_text = "{$detail['mark']}/{$detail['maxmark']} ({$percentage}%)";
            } elseif (isset($detail['mark'])) {
                $mark_text = $detail['mark'];
            }
            echo html_writer::tag('td', $mark_text);
            
            $failed_style = $detail['is_failed'] ? 'color: red; font-weight: bold;' : 'color: green;';
            $failed_text = $detail['is_failed'] ? '❌ SÍ' : '✅ NO';
            
            // Add failure reason if available
            if ($detail['is_failed'] && isset($detail['failure_reason'])) {
                $failed_text .= ' (' . $detail['failure_reason'] . ')';
            }
            
            echo html_writer::tag('td', $failed_text, ['style' => $failed_style]);
            
            $action_text = 'N/A';
            $action_style = '';
            switch ($detail['action'] ?? 'none') {
                case 'inserted_new':
                    $action_text = '🆕 Nueva inserción';
                    $action_style = 'color: blue; font-weight: bold;';
                    if (isset($detail['new_record_id'])) {
                        $action_text .= " (ID: {$detail['new_record_id']})";
                    }
                    break;
                case 'updated_existing':
                    $action_text = '🔄 Actualizada existente';
                    $action_style = 'color: orange;';
                    break;
                case 'none':
                    $action_text = '➖ Sin acción';
                    break;
            }
            
            if (isset($detail['error'])) {
                $action_text = '❌ Error: ' . $detail['error'];
                $action_style = 'color: red;';
            }
            
            echo html_writer::tag('td', $action_text, ['style' => $action_style]);
            echo html_writer::end_tag('tr');
        }
        echo html_writer::end_tag('table');
    }
    
} catch (Exception $e) {
    echo html_writer::tag('p', '❌ Error en procesamiento: ' . $e->getMessage(), ['style' => 'color: red;']);
}

// 4. Verificar el estado final
echo html_writer::tag('h2', '4. 📊 Estado Final');

try {
    $final_count = $DB->count_records('local_failed_questions_recovery', ['userid' => $userid]);
    echo html_writer::tag('p', "✅ Total de preguntas falladas en BD: $final_count", ['style' => 'color: green; font-weight: bold;']);
    
    if ($final_count > 0) {
        // Mostrar algunas preguntas falladas
        $failed_questions = $DB->get_records('local_failed_questions_recovery', 
            ['userid' => $userid], 'timecreated DESC', '*', 0, 5);
        
        echo html_writer::tag('h4', 'Últimas 5 preguntas falladas:');
        echo html_writer::start_tag('table', ['border' => '1', 'style' => 'border-collapse: collapse; width: 100%;']);
        echo html_writer::start_tag('tr');
        echo html_writer::tag('th', 'Question ID');
        echo html_writer::tag('th', 'Categoría');
        echo html_writer::tag('th', 'Intentos');
        echo html_writer::tag('th', 'Último Fallo');
        echo html_writer::tag('th', 'Dominada');
        echo html_writer::end_tag('tr');
        
        foreach ($failed_questions as $fq) {
            echo html_writer::start_tag('tr');
            echo html_writer::tag('td', $fq->questionid);
            echo html_writer::tag('td', $fq->categoryname ?: 'N/A');
            echo html_writer::tag('td', $fq->attempts);
            echo html_writer::tag('td', date('Y-m-d H:i', $fq->lastfailed));
            echo html_writer::tag('td', $fq->mastered ? 'SÍ' : 'NO');
            echo html_writer::end_tag('tr');
        }
        echo html_writer::end_tag('table');
    }
    
} catch (Exception $e) {
    echo html_writer::tag('p', '❌ Error verificando estado: ' . $e->getMessage(), ['style' => 'color: red;']);
}

// 5. Enlaces de navegación
echo html_writer::tag('h2', '5. 🔗 Navegación');
echo html_writer::tag('p', '<a href="index.php">🏠 Volver al Panel Principal</a>');
echo html_writer::tag('p', '<a href="debug_observer.php">🔍 Debug del Observer</a>');

echo html_writer::tag('hr', '');
echo html_writer::tag('p', '🔧 Script ejecutado: ' . date('Y-m-d H:i:s'));

echo html_writer::end_tag('body');
echo html_writer::end_tag('html');
?> 