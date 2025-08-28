<?php
require_once('../../config.php');
require_login();

echo "<h2>🔍 Diagnóstico del Quiz CONSTITUCIÓN - TEST 4</h2>";

global $DB, $USER;

// 1. Buscar el quiz de CONSTITUCIÓN - TEST 4
echo "<h3>1. 🎯 Buscando el quiz de CONSTITUCIÓN</h3>";
$constitution_quizzes = $DB->get_records_sql("
    SELECT id, name, course 
    FROM {quiz} 
    WHERE name LIKE '%CONSTITUCIÓN%' 
    ORDER BY name
");

if ($constitution_quizzes) {
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Quiz ID</th><th>Nombre</th><th>Curso</th></tr>";
    foreach ($constitution_quizzes as $quiz) {
        echo "<tr><td>{$quiz->id}</td><td>{$quiz->name}</td><td>{$quiz->course}</td></tr>";
    }
    echo "</table>";
} else {
    echo "❌ No se encontraron quizzes de CONSTITUCIÓN<br>";
}

// 2. Verificar intentos recientes del usuario
echo "<h3>2. 📊 Intentos recientes del usuario (últimas 24h)</h3>";
$recent_attempts = $DB->get_records_sql("
    SELECT qa.id, qa.quiz, qa.timestart, qa.timefinish, qa.sumgrades, q.name as quiz_name
    FROM {quiz_attempts} qa
    JOIN {quiz} q ON qa.quiz = q.id
    WHERE qa.userid = ? 
    AND qa.timestart > ?
    ORDER BY qa.timestart DESC
", [$USER->id, time() - 86400]);

if ($recent_attempts) {
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Attempt ID</th><th>Quiz ID</th><th>Quiz Name</th><th>Start</th><th>Finish</th><th>Grade</th></tr>";
    foreach ($recent_attempts as $attempt) {
        $start = date('Y-m-d H:i:s', $attempt->timestart);
        $finish = $attempt->timefinish ? date('Y-m-d H:i:s', $attempt->timefinish) : 'En progreso';
        echo "<tr><td>{$attempt->id}</td><td>{$attempt->quiz}</td><td>{$attempt->quiz_name}</td><td>{$start}</td><td>{$finish}</td><td>{$attempt->sumgrades}</td></tr>";
    }
    echo "</table>";
} else {
    echo "❌ No se encontraron intentos recientes<br>";
}

// 3. Verificar si hay preguntas registradas del quiz CONSTITUCIÓN
echo "<h3>3. 🔍 Preguntas fallidas registradas de CONSTITUCIÓN</h3>";
$constitution_failed = $DB->get_records_sql("
    SELECT fq.*, q.name as quiz_name
    FROM {local_failed_questions_recovery} fq
    LEFT JOIN {quiz} q ON fq.quizid = q.id
    WHERE fq.userid = ? 
    AND (q.name LIKE '%CONSTITUCIÓN%' OR fq.categoryname LIKE '%CONSTITUCIÓN%')
    ORDER BY fq.lastfailed DESC
", [$USER->id]);

if ($constitution_failed) {
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Question ID</th><th>Quiz ID</th><th>Quiz Name</th><th>Category</th><th>Mastered</th><th>Last Failed</th></tr>";
    foreach ($constitution_failed as $failed) {
        $mastered = $failed->mastered ? '✅ Sí' : '❌ No';
        $last_failed = date('Y-m-d H:i:s', $failed->lastfailed);
        echo "<tr><td>{$failed->id}</td><td>{$failed->questionid}</td><td>{$failed->quizid}</td><td>{$failed->quiz_name}</td><td>{$failed->categoryname}</td><td>{$mastered}</td><td>{$last_failed}</td></tr>";
    }
    echo "</table>";
} else {
    echo "❌ No se encontraron preguntas fallidas de CONSTITUCIÓN registradas<br>";
}

// 4. Verificar todas las preguntas fallidas registradas hoy
echo "<h3>4. 📅 Todas las preguntas fallidas registradas HOY</h3>";
$today_failed = $DB->get_records_sql("
    SELECT fq.*, q.name as quiz_name
    FROM {local_failed_questions_recovery} fq
    LEFT JOIN {quiz} q ON fq.quizid = q.id
    WHERE fq.userid = ? 
    AND fq.lastfailed > ?
    ORDER BY fq.lastfailed DESC
", [$USER->id, strtotime('today')]);

if ($today_failed) {
    echo "Preguntas registradas hoy: " . count($today_failed) . "<br>";
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Question ID</th><th>Quiz ID</th><th>Quiz Name</th><th>Category</th><th>Time</th></tr>";
    foreach ($today_failed as $failed) {
        $time = date('H:i:s', $failed->lastfailed);
        echo "<tr><td>{$failed->questionid}</td><td>{$failed->quizid}</td><td>{$failed->quiz_name}</td><td>{$failed->categoryname}</td><td>{$time}</td></tr>";
    }
    echo "</table>";
} else {
    echo "❌ No se registraron preguntas fallidas hoy<br>";
}

echo "<br><h3>🎯 Diagnóstico:</h3>";
echo "<p>Si no ves preguntas de CONSTITUCIÓN registradas, significa que <strong>el observer automático no funcionó</strong>.</p>";
echo "<p>📍 <a href='process_last_quiz.php'>Usar procesamiento manual</a> para capturar las 7 preguntas fallidas</p>";
echo "<p>📍 <a href='index.php'>Volver al dashboard</a></p>"; 