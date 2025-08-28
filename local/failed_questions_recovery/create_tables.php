<?php
require_once('../../config.php');

require_login();
require_capability('moodle/site:config', context_system::instance());

echo html_writer::start_tag('html');
echo html_writer::start_tag('head');
echo html_writer::tag('title', 'Crear Tablas - Failed Questions Recovery');
echo html_writer::end_tag('head');
echo html_writer::start_tag('body');

echo html_writer::tag('h1', '🛠️ Creación de Tablas del Plugin');
echo html_writer::tag('p', 'Usuario: ' . $USER->username . ' (ID: ' . $USER->id . ')');

$results = [];

// 1. Crear tabla principal: local_failed_questions_recovery
echo html_writer::tag('h2', '1. 📋 Creando tabla: local_failed_questions_recovery');

$sql1 = "CREATE TABLE IF NOT EXISTS {local_failed_questions_recovery} (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) NOT NULL,
    questionid BIGINT(10) NOT NULL,
    courseid BIGINT(10) NOT NULL,
    quizid BIGINT(10) NOT NULL,
    categoryid BIGINT(10) NOT NULL,
    categoryname VARCHAR(255) DEFAULT NULL,
    questiontext LONGTEXT DEFAULT NULL,
    questiontype VARCHAR(50) DEFAULT NULL,
    attempts INT(5) NOT NULL DEFAULT 1,
    lastfailed BIGINT(10) NOT NULL,
    mastered TINYINT(1) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY user_question_unique (userid, questionid),
    KEY userid_categoryid (userid, categoryid),
    KEY userid_mastered (userid, mastered),
    KEY lastfailed (lastfailed)
)";

try {
    $DB->execute($sql1);
    echo html_writer::tag('p', '✅ Tabla local_failed_questions_recovery creada exitosamente', ['style' => 'color: green;']);
    $results['main_table'] = 'success';
} catch (Exception $e) {
    echo html_writer::tag('p', '❌ Error creando tabla principal: ' . $e->getMessage(), ['style' => 'color: red;']);
    $results['main_table'] = 'error: ' . $e->getMessage();
}

// 2. Crear tabla de quizzes de recuperación
echo html_writer::tag('h2', '2. 📋 Creando tabla: local_fqr_recovery_quizzes');

$sql2 = "CREATE TABLE IF NOT EXISTS {local_fqr_recovery_quizzes} (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) NOT NULL,
    courseid BIGINT(10) NOT NULL,
    categoryid BIGINT(10) DEFAULT NULL,
    categoryname VARCHAR(255) DEFAULT NULL,
    quizname VARCHAR(255) NOT NULL,
    questioncount INT(5) NOT NULL DEFAULT 0,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    score DECIMAL(10,5) DEFAULT NULL,
    timecreated BIGINT(10) NOT NULL,
    timecompleted BIGINT(10) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY userid_courseid (userid, courseid),
    KEY timecreated (timecreated)
)";

try {
    $DB->execute($sql2);
    echo html_writer::tag('p', '✅ Tabla local_fqr_recovery_quizzes creada exitosamente', ['style' => 'color: green;']);
    $results['recovery_quizzes'] = 'success';
} catch (Exception $e) {
    echo html_writer::tag('p', '❌ Error creando tabla de quizzes: ' . $e->getMessage(), ['style' => 'color: red;']);
    $results['recovery_quizzes'] = 'error: ' . $e->getMessage();
}

// 3. Crear tabla de intentos de recuperación
echo html_writer::tag('h2', '3. 📋 Creando tabla: local_fqr_recovery_attempts');

$sql3 = "CREATE TABLE IF NOT EXISTS {local_fqr_recovery_attempts} (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    recoveryquizid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    questionid BIGINT(10) NOT NULL,
    iscorrect TINYINT(1) NOT NULL DEFAULT 0,
    response LONGTEXT DEFAULT NULL,
    timeanswered BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY recoveryquizid_userid (recoveryquizid, userid),
    KEY questionid (questionid)
)";

try {
    $DB->execute($sql3);
    echo html_writer::tag('p', '✅ Tabla local_fqr_recovery_attempts creada exitosamente', ['style' => 'color: green;']);
    $results['recovery_attempts'] = 'success';
} catch (Exception $e) {
    echo html_writer::tag('p', '❌ Error creando tabla de intentos: ' . $e->getMessage(), ['style' => 'color: red;']);
    $results['recovery_attempts'] = 'error: ' . $e->getMessage();
}

// 4. Verificar que las tablas existen
echo html_writer::tag('h2', '4. ✅ Verificación Final');

$tables_to_check = [
    'local_failed_questions_recovery' => 'Tabla principal',
    'local_fqr_recovery_quizzes' => 'Quizzes de recuperación', 
    'local_fqr_recovery_attempts' => 'Intentos de recuperación'
];

foreach ($tables_to_check as $table => $description) {
    try {
        $count = $DB->count_records($table);
        echo html_writer::tag('p', "✅ $description ($table): OK - $count registros", ['style' => 'color: green;']);
    } catch (Exception $e) {
        echo html_writer::tag('p', "❌ $description ($table): NO EXISTE", ['style' => 'color: red;']);
    }
}

// 5. Resumen final
echo html_writer::tag('h2', '5. 📊 Resumen');

$success_count = count(array_filter($results, function($result) { 
    return $result === 'success'; 
}));

if ($success_count === 3) {
    echo html_writer::tag('p', '🎉 ¡TODAS LAS TABLAS CREADAS EXITOSAMENTE!', ['style' => 'color: green; font-weight: bold; font-size: 18px;']);
    echo html_writer::tag('p', '✅ El plugin ahora está completamente funcional');
    echo html_writer::tag('p', '🔗 Puedes volver a: <a href="index.php">Panel Principal</a>');
} else {
    echo html_writer::tag('p', "⚠️ $success_count de 3 tablas creadas. Revisa los errores arriba.", ['style' => 'color: orange; font-weight: bold;']);
}

echo html_writer::tag('hr', '');
echo html_writer::tag('p', '🔧 Script ejecutado: ' . date('Y-m-d H:i:s'));

echo html_writer::end_tag('body');
echo html_writer::end_tag('html');
?> 