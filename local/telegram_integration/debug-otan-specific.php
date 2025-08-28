<?php
require_once('../../config.php');
require_once('locallib.php');

global $DB;

echo "<h2>🔍 Diagnóstico Específico OTAN</h2>";

// 1. Probar detección de tema
$test_names = [
    'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE - TEST 1',
    'OTAN - TEST 1',
    'TRATADO ATLÁNTICO NORTE'
];

echo "<h3>1. Prueba de Detección de Temas:</h3>";
foreach ($test_names as $name) {
    $detected = telegram_extract_topic_from_name($name);
    echo "<p>'{$name}' → " . ($detected ? "✅ {$detected}" : "❌ NO DETECTADO") . "</p>";
}

// 2. Verificar últimos intentos de quiz OTAN
echo "<h3>2. Últimos Intentos de Quiz OTAN:</h3>";
$recent_attempts = $DB->get_records_sql("
    SELECT qa.id, qa.userid, qa.quiz, qa.sumgrades, qa.timefinish,
           q.name as quiz_name, q.grade as max_grade
    FROM {quiz_attempts} qa
    JOIN {quiz} q ON q.id = qa.quiz
    WHERE q.name LIKE '%OTAN%' OR q.name LIKE '%ATLÁNTICO%'
    ORDER BY qa.timefinish DESC
    LIMIT 5
");

if ($recent_attempts) {
    echo "<table border='1'>";
    echo "<tr><th>Attempt ID</th><th>User ID</th><th>Quiz Name</th><th>Grade</th><th>Detected Topic</th></tr>";
    
    foreach ($recent_attempts as $attempt) {
        $detected_topic = telegram_extract_topic_from_name($attempt->quiz_name);
        echo "<tr>";
        echo "<td>{$attempt->id}</td>";
        echo "<td>{$attempt->userid}</td>";
        echo "<td>{$attempt->quiz_name}</td>";
        echo "<td>{$attempt->sumgrades}/{$attempt->max_grade}</td>";
        echo "<td>" . ($detected_topic ? $detected_topic : "❌ NO DETECTADO") . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No se encontraron intentos recientes de OTAN</p>";
}

// 3. Verificar registros en performance table
echo "<h3>3. Registros OTAN en Performance Table:</h3>";
$otan_performance = $DB->get_records_sql("
    SELECT * FROM {local_telegram_user_topic_performance}
    WHERE sectionname LIKE '%OTAN%' OR sectionname LIKE '%ATLÁNTICO%'
    ORDER BY updatedat DESC
");

if ($otan_performance) {
    echo "<p>✅ Encontrados " . count($otan_performance) . " registros OTAN</p>";
    foreach ($otan_performance as $record) {
        echo "<p>→ Usuario: {$record->telegramuserid}, Tema: {$record->sectionname}, Preguntas: {$record->totalquestions}, Correctas: {$record->correctanswers}</p>";
    }
} else {
    echo "<p>❌ NO se encontraron registros OTAN en performance table</p>";
}

// 4. Simular procesamiento del observer
echo "<h3>4. Simulación del Observer:</h3>";
if ($recent_attempts) {
    $latest_attempt = reset($recent_attempts);
    echo "<p>Simulando procesamiento del intento ID: {$latest_attempt->id}</p>";
    
    // Simular detección
    $topic = telegram_extract_topic_from_name($latest_attempt->quiz_name);
    echo "<p>Tema detectado: " . ($topic ? $topic : "NINGUNO") . "</p>";
    
    // Simular búsqueda de usuario Telegram
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
        
        $stmt->execute([$latest_attempt->userid]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            echo "<p>✅ Usuario Telegram encontrado: {$result['telegramuserid']}</p>";
            
            // Simular cálculo de resultado
            $percentage = ($latest_attempt->max_grade > 0) ? ($latest_attempt->sumgrades / $latest_attempt->max_grade) : 0;
            $is_correct = $percentage >= 0.5;
            
            echo "<p>Resultado: {$latest_attempt->sumgrades}/{$latest_attempt->max_grade} = " . round($percentage * 100, 2) . "% (" . ($is_correct ? 'CORRECTO' : 'INCORRECTO') . ")</p>";
            
            // Verificar si existe registro en performance
            $existing = $DB->get_record('local_telegram_user_topic_performance', [
                'telegramuserid' => $result['telegramuserid'],
                'sectionname' => $topic
            ]);
            
            if ($existing) {
                echo "<p>✅ Registro existente encontrado en performance table</p>";
            } else {
                echo "<p>❌ NO existe registro en performance table - AQUÍ ESTÁ EL PROBLEMA</p>";
            }
            
        } else {
            echo "<p>❌ Usuario Telegram NO encontrado para Moodle user {$latest_attempt->userid}</p>";
        }
        
    } catch (Exception $e) {
        echo "<p>❌ Error conectando a BD Telegram: " . $e->getMessage() . "</p>";
    }
}

echo "<h3>5. Recomendaciones:</h3>";
echo "<ol>";
echo "<li>Verificar que el observer se ejecute correctamente</li>";
echo "<li>Revisar logs de error de PHP/Moodle</li>";
echo "<li>Probar manualmente la función update_topic_performance</li>";
echo "<li>Verificar constraints de la tabla performance</li>";
echo "</ol>";
?>