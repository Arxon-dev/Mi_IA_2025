<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Diagnóstico Completo del Sistema</h2>";

// 1. Probar detección de OTAN
echo "<h3>1. Prueba de Detección de Temas</h3>";
$test_names = [
    'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)',
    'OTAN',
    'TRATADO ATLÁNTICO NORTE',
    'IGUALDAD EFECTIVA DE MUJERES Y HOMBRES',
    'TRAMITACIÓN INICIATIVAS Y QUEJAS'
];

foreach ($test_names as $name) {
    $detected = telegram_extract_topic_from_name($name);
    echo "<p>📝 <strong>{$name}</strong> → " . ($detected ? "✅ {$detected}" : "❌ No detectado") . "</p>";
}

// 2. Verificar conexión con moodleactivity
echo "<h3>2. Verificación de Conexión moodleactivity</h3>";
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=u449034524_moodel_telegra;charset=utf8',
        'u449034524_opomelilla_25',
        'Sirius//03072503//',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM moodleactivity");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>✅ Conexión exitosa. Total registros en moodleactivity: {$result['total']}</p>";
    
    // Buscar registros recientes
    $stmt = $pdo->query("SELECT * FROM moodleactivity ORDER BY processedat DESC LIMIT 5");
    $recent = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($recent) {
        echo "<p>📋 Últimos 5 registros:</p>";
        echo "<table border='1'><tr><th>ID</th><th>Moodle User</th><th>Telegram User</th><th>Subject</th><th>Correct</th><th>Processed</th></tr>";
        foreach ($recent as $row) {
            echo "<tr><td>{$row['id']}</td><td>{$row['moodleuserid']}</td><td>{$row['telegramuserid']}</td><td>{$row['subject']}</td><td>" . ($row['questioncorrect'] ? 'Sí' : 'No') . "</td><td>{$row['processedat']}</td></tr>";
        }
        echo "</table>";
    } else {
        echo "<p>⚠️ No hay registros recientes en moodleactivity</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error de conexión: " . $e->getMessage() . "</p>";
}

// 3. Verificar últimos intentos de quiz
echo "<h3>3. Últimos Intentos de Quiz</h3>";
$recent_attempts = $DB->get_records_sql("
    SELECT qa.id, qa.userid, qa.quiz, qa.sumgrades, qa.timestart, qa.timefinish,
           q.name as quiz_name, q.grade as max_grade
    FROM {quiz_attempts} qa
    JOIN {quiz} q ON qa.quiz = q.id
    WHERE qa.timefinish > 0
    ORDER BY qa.timefinish DESC
    LIMIT 10
");

if ($recent_attempts) {
    echo "<table border='1'><tr><th>ID</th><th>User</th><th>Quiz</th><th>Grade</th><th>Max Grade</th><th>%</th><th>Tema Detectado</th></tr>";
    foreach ($recent_attempts as $attempt) {
        $percentage = $attempt->max_grade > 0 ? round(($attempt->sumgrades / $attempt->max_grade) * 100, 2) : 0;
        $detected_topic = telegram_extract_topic_from_name($attempt->quiz_name);
        echo "<tr>";
        echo "<td>{$attempt->id}</td>";
        echo "<td>{$attempt->userid}</td>";
        echo "<td>{$attempt->quiz_name}</td>";
        echo "<td>{$attempt->sumgrades}</td>";
        echo "<td>{$attempt->max_grade}</td>";
        echo "<td>{$percentage}%</td>";
        echo "<td>" . ($detected_topic ? $detected_topic : 'No detectado') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No se encontraron intentos de quiz recientes</p>";
}

// 4. Verificar registros en performance table
echo "<h3>4. Registros en Tabla Performance</h3>";
$performance_records = $DB->get_records('local_telegram_user_topic_performance', null, 'updatedat DESC');

if ($performance_records) {
    echo "<table border='1'><tr><th>ID</th><th>Telegram User</th><th>Tema</th><th>Total</th><th>Correctas</th><th>Incorrectas</th><th>Precisión</th><th>Última Actividad</th></tr>";
    foreach ($performance_records as $record) {
        $last_activity = date('Y-m-d H:i:s', $record->lastactivity);
        echo "<tr>";
        echo "<td>{$record->id}</td>";
        echo "<td>{$record->telegramuserid}</td>";
        echo "<td>{$record->sectionname}</td>";
        echo "<td>{$record->totalquestions}</td>";
        echo "<td>{$record->correctanswers}</td>";
        echo "<td>{$record->incorrectanswers}</td>";
        echo "<td>{$record->accuracy}%</td>";
        echo "<td>{$last_activity}</td>";
        echo "</tr>";
    }
    echo "</table>";
}

echo "<h3>5. Recomendaciones</h3>";
echo "<ol>";
echo "<li>✅ Agregar más variaciones de OTAN al array known_topics</li>";
echo "<li>✅ Corregir el cálculo de resultados en el observer</li>";
echo "<li>✅ Verificar por qué moodleactivity no se actualiza</li>";
echo "<li>✅ Implementar logging más detallado</li>";
echo "</ol>";
?>