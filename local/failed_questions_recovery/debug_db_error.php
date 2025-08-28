<?php
require_once('../../config.php');
require_once('lib.php');

require_login();

$userid = $USER->id;

echo html_writer::start_tag('html');
echo html_writer::start_tag('head');
echo html_writer::tag('title', 'Debug BD Error - Failed Questions Recovery');
echo html_writer::end_tag('head');
echo html_writer::start_tag('body');

echo html_writer::tag('h1', '🔍 Debug Error Específico de Base de Datos');
echo html_writer::tag('p', 'Usuario: ' . $USER->username . ' (ID: ' . $userid . ')');

// 1. Obtener una pregunta específica para test
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

echo html_writer::tag('h2', '1. 🎯 Test de Inserción Individual');
echo html_writer::tag('p', "Intento ID: {$last_attempt->id}");

// Obtener una pregunta específica
$question_sql = "SELECT qa.questionid, qas.fraction, qas.state
                FROM {question_attempts} qa
                JOIN {question_attempt_steps} qas ON qa.id = qas.questionattemptid
                WHERE qa.questionusageid = ?
                AND qas.sequencenumber = (
                    SELECT MAX(sequencenumber) 
                    FROM {question_attempt_steps} 
                    WHERE questionattemptid = qa.id
                )
                AND qas.state IN ('gradedwrong', 'gaveup')
                LIMIT 1";

$failed_qa = $DB->get_record_sql($question_sql, [$last_attempt->uniqueid]);

if (!$failed_qa) {
    echo html_writer::tag('p', '❌ No se encontraron preguntas falladas en este intento', ['style' => 'color: red;']);
    echo html_writer::end_tag('body');
    echo html_writer::end_tag('html');
    exit;
}

echo html_writer::tag('p', "Question ID a probar: {$failed_qa->questionid}");
echo html_writer::tag('p', "Estado: {$failed_qa->state}");

// 2. Obtener datos completos de la pregunta
$question = $DB->get_record('question', ['id' => $failed_qa->questionid]);

if (!$question) {
    echo html_writer::tag('p', '❌ No se pudo obtener la pregunta', ['style' => 'color: red;']);
    echo html_writer::end_tag('body');
    echo html_writer::end_tag('html');
    exit;
}

echo html_writer::tag('h3', '📋 Datos de la Pregunta:');
echo html_writer::tag('p', "Nombre: " . s($question->name));
echo html_writer::tag('p', "Tipo: " . s($question->qtype));
echo html_writer::tag('p', "Categoría ID: " . s($question->category));

// 3. Obtener información de categoría
$category = $DB->get_record('question_categories', ['id' => $question->category]);
$categoryname = $category ? $category->name : 'Sin categoría';

echo html_writer::tag('p', "Nombre de categoría: " . s($categoryname));

// 4. Preparar el registro exactamente como lo hace el observer
echo html_writer::tag('h2', '2. 🧪 Test de Inserción Paso a Paso');

$record = new stdClass();
$record->userid = (int)$userid;
$record->questionid = (int)$question->id;
$record->courseid = (int)$last_attempt->courseid;

echo html_writer::tag('h3', 'Paso 1: Campos básicos');
echo html_writer::tag('p', "userid: {$record->userid} (tipo: " . gettype($record->userid) . ")");
echo html_writer::tag('p', "questionid: {$record->questionid} (tipo: " . gettype($record->questionid) . ")");
echo html_writer::tag('p', "courseid: {$record->courseid} (tipo: " . gettype($record->courseid) . ")");

echo html_writer::tag('h3', 'Paso 2: Campos de texto');

// Safely handle categoryname
$categoryname_clean = substr($categoryname, 0, 255);
$record->categoryname = $categoryname_clean;
echo html_writer::tag('p', "categoryname: '" . s($record->categoryname) . "' (longitud: " . strlen($record->categoryname) . ")");

// Safely handle questiontext
$questiontext_clean = substr(strip_tags($question->questiontext), 0, 1000);
$record->questiontext = $questiontext_clean;
echo html_writer::tag('p', "questiontext: '" . s(substr($record->questiontext, 0, 100)) . "...' (longitud: " . strlen($record->questiontext) . ")");

// Safely handle qtype
$qtype_string = '';
if (is_object($question->qtype)) {
    $qtype_string = get_class($question->qtype);
    if (strpos($qtype_string, 'qtype_') === 0) {
        $qtype_string = substr($qtype_string, 6);
    }
} else {
    $qtype_string = (string)$question->qtype;
}
$qtype_clean = substr($qtype_string, 0, 50);
$record->questiontype = $qtype_clean;
echo html_writer::tag('p', "questiontype: '" . s($record->questiontype) . "' (longitud: " . strlen($record->questiontype) . ")");

echo html_writer::tag('h3', 'Paso 3: Campos numéricos');
$record->attempts = 1;
$record->lastfailed = time();
$record->mastered = 0;
$record->timecreated = time();
$record->timemodified = time();

echo html_writer::tag('p', "attempts: {$record->attempts} (tipo: " . gettype($record->attempts) . ")");
echo html_writer::tag('p', "lastfailed: {$record->lastfailed} (tipo: " . gettype($record->lastfailed) . ")");
echo html_writer::tag('p', "mastered: {$record->mastered} (tipo: " . gettype($record->mastered) . ")");
echo html_writer::tag('p', "timecreated: {$record->timecreated} (tipo: " . gettype($record->timecreated) . ")");
echo html_writer::tag('p', "timemodified: {$record->timemodified} (tipo: " . gettype($record->timemodified) . ")");

// 5. Mostrar estructura completa del registro
echo html_writer::tag('h3', 'Paso 4: Registro completo preparado');
echo html_writer::start_tag('pre');
echo htmlspecialchars(print_r($record, true));
echo html_writer::end_tag('pre');

// 6. Test de inserción real
echo html_writer::tag('h2', '3. 🎯 Test de Inserción Real');

try {
    echo html_writer::tag('p', '⏳ Intentando insertar...');
    
    $id = $DB->insert_record('local_failed_questions_recovery', $record);
    
    if ($id) {
        echo html_writer::tag('p', "✅ ÉXITO! Registro insertado con ID: $id", ['style' => 'color: green; font-weight: bold;']);
        
        // Verificar que realmente se insertó
        $inserted = $DB->get_record('local_failed_questions_recovery', ['id' => $id]);
        if ($inserted) {
            echo html_writer::tag('p', '✅ Verificación: El registro existe en la base de datos');
            echo html_writer::start_tag('pre');
            echo htmlspecialchars(print_r($inserted, true));
            echo html_writer::end_tag('pre');
        } else {
            echo html_writer::tag('p', '⚠️ Advertencia: insert_record retornó ID pero el registro no se encuentra', ['style' => 'color: orange;']);
        }
        
    } else {
        echo html_writer::tag('p', '❌ Error: insert_record retornó false', ['style' => 'color: red;']);
    }
    
} catch (Exception $e) {
    echo html_writer::tag('p', '❌ EXCEPCIÓN CAPTURADA:', ['style' => 'color: red; font-weight: bold;']);
    echo html_writer::tag('p', 'Mensaje: ' . s($e->getMessage()));
    echo html_writer::tag('p', 'Código: ' . s($e->getCode()));
    echo html_writer::tag('p', 'Archivo: ' . s($e->getFile()));
    echo html_writer::tag('p', 'Línea: ' . s($e->getLine()));
    
    echo html_writer::tag('h4', 'Stack Trace:');
    echo html_writer::start_tag('pre');
    echo htmlspecialchars($e->getTraceAsString());
    echo html_writer::end_tag('pre');
}

// 7. Verificar estructura de tabla
echo html_writer::tag('h2', '4. 🔍 Verificación de Estructura de Tabla');

try {
    $columns = $DB->get_columns('local_failed_questions_recovery');
    
    echo html_writer::tag('h3', 'Columnas de la tabla:');
    echo html_writer::start_tag('table', ['border' => '1', 'style' => 'border-collapse: collapse;']);
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', 'Nombre');
    echo html_writer::tag('th', 'Tipo');
    echo html_writer::tag('th', 'Nulo');
    echo html_writer::tag('th', 'Por Defecto');
    echo html_writer::end_tag('tr');
    
    foreach ($columns as $column) {
        echo html_writer::start_tag('tr');
        echo html_writer::tag('td', s($column->name));
        echo html_writer::tag('td', s($column->type));
        echo html_writer::tag('td', $column->not_null ? 'NO' : 'SÍ');
        echo html_writer::tag('td', s($column->default_value ?? 'NULL'));
        echo html_writer::end_tag('tr');
    }
    
    echo html_writer::end_tag('table');
    
} catch (Exception $e) {
    echo html_writer::tag('p', '❌ Error obteniendo estructura: ' . s($e->getMessage()), ['style' => 'color: red;']);
}

echo html_writer::tag('h2', '5. 🔗 Navegación');
echo html_writer::tag('p', html_writer::link(new moodle_url('/local/failed_questions_recovery/'), '🏠 Volver al Panel Principal'));
echo html_writer::tag('p', html_writer::link(new moodle_url('/local/failed_questions_recovery/test_manual_process.php'), '🧪 Test Manual Process'));

echo html_writer::tag('p', '🔧 Script ejecutado: ' . date('Y-m-d H:i:s'));

echo html_writer::end_tag('body');
echo html_writer::end_tag('html');
?> 