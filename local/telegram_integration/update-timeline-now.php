<?php
require_once(__DIR__ . '/../../config.php');
require_login();

$userid = $USER->id;
global $DB;

echo "<!DOCTYPE html>";
echo "<html><head><title>Actualizar Progreso Temporal</title>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .success { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .error { background: #ffebee; padding: 15px; border-radius: 5px; margin: 10px 0; }
</style>";
echo "</head><body>";

echo "<h1>🔄 Actualizar Progreso Temporal</h1>";
echo "<p><strong>Fecha:</strong> " . date('Y-m-d H:i:s') . "</p>";

// Conexión a base de datos
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo "<div class='error'>❌ Error de conexión: " . htmlspecialchars($e->getMessage()) . "</div>";
    exit;
}

// Obtener usuario vinculado
$telegramuserid = null;
try {
    $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleuserid = ?");
    $stmt->execute([$userid]);
    $link = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($link) {
        $telegramuserid = $link['telegramuserid'];
        echo "<div class='info'>🔗 Usuario vinculado encontrado: {$telegramuserid}</div>";
    } else {
        echo "<div class='error'>❌ Usuario no vinculado a Telegram</div>";
        exit;
    }
} catch (Exception $e) {
    echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
    exit;
}

// Función para generar datos de progreso temporal
function generateTimelineData($pdo, $telegramuserid) {
    try {
        // Borrar progreso temporal previo de los últimos 28 días para evitar duplicados
        $stmt = $pdo->prepare("DELETE FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)");
        $stmt->execute([$telegramuserid]);
        
        $registros_generados = 0;
        
        // Generar datos para los últimos 28 días
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
                WHERE telegramuserid = ? AND DATE(lastactivity) = ?
            ");
            $stmt2->execute([$telegramuserid, $fecha_str]);
            $data = $stmt2->fetch(PDO::FETCH_ASSOC);
            
            $total_questions = $data['total_questions'] ?? 0;
            $correct_answers = $data['correct_answers'] ?? 0;
            $incorrect_answers = $data['incorrect_answers'] ?? 0;
            $accuracy = $data['avg_accuracy'] ?? 0;
            
            // Calcular puntos (ejemplo: 2 puntos por respuesta correcta, -1 por incorrecta)
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
                $total_questions * 2 // Tiempo estimado en minutos (2 min por pregunta)
            ]);
            
            $registros_generados++;
            
            // Mostrar información del día si hay datos
            if ($total_questions > 0) {
                echo "<div class='info'>📅 {$fecha_str}: {$total_questions} preguntas, {$correct_answers} correctas, {$accuracy}% precisión</div>";
            }
        }
        
        return $registros_generados;
    } catch (PDOException $e) {
        throw new Exception("Error generando progreso temporal: " . $e->getMessage());
    }
}

// Ejecutar la actualización
try {
    echo "<div class='info'>🔄 Actualizando progreso temporal...</div>";
    $registros = generateTimelineData($pdo, $telegramuserid);
    echo "<div class='success'>✅ Progreso temporal actualizado correctamente!</div>";
    echo "<div class='info'>📊 Total de registros generados: {$registros}</div>";
    
    // Mostrar algunos datos recientes
    $stmt = $pdo->prepare("SELECT * FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ? ORDER BY date DESC LIMIT 5");
    $stmt->execute([$telegramuserid]);
    $recent_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($recent_data) {
        echo "<div class='info'>";
        echo "<h3>📈 Últimos 5 días de datos:</h3>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Fecha</th><th>Preguntas</th><th>Correctas</th><th>Precisión</th></tr>";
        foreach ($recent_data as $row) {
            echo "<tr>";
            echo "<td>{$row['date']}</td>";
            echo "<td>{$row['questions_answered']}</td>";
            echo "<td>{$row['correct_answers']}</td>";
            echo "<td>{$row['accuracy']}%</td>";
            echo "</tr>";
        }
        echo "</table>";
        echo "</div>";
    }
    
} catch (Exception $e) {
    echo "<div class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</div>";
}

echo "<div class='info'>";
echo "<h3>🔗 Enlaces útiles:</h3>";
echo "<p><a href='my-advanced-analytics.php'>📊 Ver Analytics</a></p>";
echo "<p><a href='debug-user-mapping.php'>🔍 Debug Usuario</a></p>";
echo "</div>";

echo "</body></html>";
?> 