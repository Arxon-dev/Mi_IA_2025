<?php
require_once('../../config.php');
require_once($CFG->libdir.'/adminlib.php');

// Configurar PDO
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}

$telegramuserid = '5650137656'; // Tu ID de Telegram

echo "<h2>🔍 Diagnóstico del Gráfico Temporal</h2>";

// 1. Verificar datos en mdl_local_telegram_user_topic_performance
echo "<h3>1. Datos en mdl_local_telegram_user_topic_performance</h3>";
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM mdl_local_telegram_user_topic_performance WHERE telegramuserid = ?");
$stmt->execute([$telegramuserid]);
$count = $stmt->fetch(PDO::FETCH_ASSOC);
echo "<p><strong>Total registros:</strong> {$count['total']}</p>";

if ($count['total'] > 0) {
    // Mostrar últimos registros
    $stmt = $pdo->prepare("SELECT sectionname, totalquestions, correctanswers, accuracy, FROM_UNIXTIME(lastactivity) as fecha FROM mdl_local_telegram_user_topic_performance WHERE telegramuserid = ? ORDER BY lastactivity DESC LIMIT 5");
    $stmt->execute([$telegramuserid]);
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1'><tr><th>Tema</th><th>Preguntas</th><th>Correctas</th><th>Precisión</th><th>Fecha</th></tr>";
    foreach ($records as $record) {
        echo "<tr><td>{$record['sectionname']}</td><td>{$record['totalquestions']}</td><td>{$record['correctanswers']}</td><td>{$record['accuracy']}%</td><td>{$record['fecha']}</td></tr>";
    }
    echo "</table>";
}

// 2. Verificar datos de hoy específicamente
echo "<h3>2. Datos de HOY en mdl_local_telegram_user_topic_performance</h3>";
$stmt = $pdo->prepare("
    SELECT 
        COUNT(*) as registros_hoy,
        SUM(totalquestions) as preguntas_hoy,
        SUM(correctanswers) as correctas_hoy
    FROM mdl_local_telegram_user_topic_performance 
    WHERE telegramuserid = ? AND DATE(FROM_UNIXTIME(lastactivity)) = CURDATE()
");
$stmt->execute([$telegramuserid]);
$today_data = $stmt->fetch(PDO::FETCH_ASSOC);
echo "<p><strong>Registros de hoy:</strong> {$today_data['registros_hoy']}</p>";
echo "<p><strong>Preguntas de hoy:</strong> {$today_data['preguntas_hoy']}</p>";
echo "<p><strong>Correctas de hoy:</strong> {$today_data['correctas_hoy']}</p>";

// 3. Verificar tabla de timeline
echo "<h3>3. Datos en mdl_local_telegram_progress_timeline</h3>";
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ?");
$stmt->execute([$telegramuserid]);
$timeline_count = $stmt->fetch(PDO::FETCH_ASSOC);
echo "<p><strong>Total registros timeline:</strong> {$timeline_count['total']}</p>";

if ($timeline_count['total'] > 0) {
    $stmt = $pdo->prepare("SELECT date, questions_answered, correct_answers, accuracy FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ? ORDER BY date DESC LIMIT 7");
    $stmt->execute([$telegramuserid]);
    $timeline_records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1'><tr><th>Fecha</th><th>Preguntas</th><th>Correctas</th><th>Precisión</th></tr>";
    foreach ($timeline_records as $record) {
        echo "<tr><td>{$record['date']}</td><td>{$record['questions_answered']}</td><td>{$record['correct_answers']}</td><td>{$record['accuracy']}%</td></tr>";
    }
    echo "</table>";
}

// 4. Forzar regeneración del timeline
echo "<h3>4. Regenerar Timeline</h3>";
echo "<p><a href='?regenerate=1' style='background: #007cba; color: white; padding: 10px; text-decoration: none; border-radius: 5px;'>🔄 Regenerar Timeline</a></p>";

if (isset($_GET['regenerate'])) {
    // Borrar timeline existente
    $stmt = $pdo->prepare("DELETE FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ?");
    $stmt->execute([$telegramuserid]);
    
    // Regenerar para los últimos 28 días
    $hoy = new DateTime();
    for ($i = 27; $i >= 0; $i--) {
        $fecha = clone $hoy;
        $fecha->sub(new DateInterval("P{$i}D"));
        $fecha_str = $fecha->format('Y-m-d');
        
        // Obtener datos de performance del usuario para esa fecha
        $stmt2 = $pdo->prepare("
            SELECT 
                COALESCE(SUM(totalquestions), 0) as total_questions,
                COALESCE(SUM(correctanswers), 0) as correct_answers,
                COALESCE(SUM(incorrectanswers), 0) as incorrect_answers,
                COALESCE(AVG(accuracy), 0) as avg_accuracy
            FROM mdl_local_telegram_user_topic_performance 
            WHERE telegramuserid = ? AND DATE(FROM_UNIXTIME(lastactivity)) = ?
        ");
        $stmt2->execute([$telegramuserid, $fecha_str]);
        $data = $stmt2->fetch(PDO::FETCH_ASSOC);
        
        $total_questions = $data['total_questions'] ?? 0;
        $correct_answers = $data['correct_answers'] ?? 0;
        $incorrect_answers = $data['incorrect_answers'] ?? 0;
        $accuracy = $data['avg_accuracy'] ?? 0;
        
        // Calcular puntos
        $points_earned = $correct_answers * 2;
        $points_lost = $incorrect_answers * 1;
        
        // Insertar en la tabla de progreso temporal
        $stmt3 = $pdo->prepare("
            INSERT INTO mdl_local_telegram_progress_timeline 
            (telegramuserid, date, questions_answered, correct_answers, incorrect_answers, points_earned, points_lost, accuracy, study_time, createdat) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt3->execute([
            $telegramuserid,
            $fecha_str,
            $total_questions,
            $correct_answers,
            $incorrect_answers,
            $points_earned,
            $points_lost,
            $accuracy,
            $total_questions * 2
        ]);
        
        if ($total_questions > 0) {
            echo "<p>✅ {$fecha_str}: {$total_questions} preguntas, {$correct_answers} correctas</p>";
        }
    }
    
    echo "<p><strong>✅ Timeline regenerado exitosamente!</strong></p>";
    echo "<p><a href='my-advanced-analytics.php'>🔄 Ver Analytics</a></p>";
}
?>