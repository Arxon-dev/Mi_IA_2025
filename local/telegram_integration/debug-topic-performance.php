<?php
require_once(__DIR__ . '/../../config.php');
require_login();

$userid = $USER->id;

// Obtener TelegramUserId vinculado
global $DB;
$telegramuserid = null;

try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener telegramuserid
    $stmt = $pdo->prepare("SELECT telegramuserid FROM moodleuserlink WHERE moodleuserid = ?");
    $stmt->execute([$userid]);
    $link = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($link) {
        $telegramuserid = $link['telegramuserid'];
    }
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}

if (!$telegramuserid) {
    die("Usuario no vinculado con Telegram");
}

echo "<h1>🔍 Diagnóstico de Performance por Temas</h1>";
echo "<p><strong>Moodle User ID:</strong> $userid</p>";
echo "<p><strong>Telegram User ID:</strong> $telegramuserid</p>";

// Consulta detallada de performance por temas
try {
    $stmt = $pdo->prepare("
        SELECT 
            id,
            telegramuserid,
            sectionid,
            sectionname,
            totalquestions,
            correctanswers,
            incorrectanswers,
            accuracy,
            lastactivity,
            createdat,
            updatedat
        FROM mdl_local_telegram_user_topic_performance 
        WHERE telegramuserid = ? 
        ORDER BY accuracy DESC
    ");
    $stmt->execute([$telegramuserid]);
    $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>📊 Datos de Performance por Temas</h2>";
    echo "<p><strong>Total de registros encontrados:</strong> " . count($topics) . "</p>";
    
    if (count($topics) > 0) {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr style='background: #f0f0f0;'>";
        echo "<th>ID</th><th>Sección</th><th>Nombre</th><th>Total Q</th><th>Correctas</th><th>Incorrectas</th><th>Precisión</th><th>Última Actividad</th>";
        echo "</tr>";
        
        foreach ($topics as $topic) {
            echo "<tr>";
            echo "<td>" . $topic['id'] . "</td>";
            echo "<td>" . $topic['sectionid'] . "</td>";
            echo "<td>" . htmlspecialchars($topic['sectionname']) . "</td>";
            echo "<td>" . $topic['totalquestions'] . "</td>";
            echo "<td>" . $topic['correctanswers'] . "</td>";
            echo "<td>" . $topic['incorrectanswers'] . "</td>";
            echo "<td>" . number_format($topic['accuracy'], 2) . "%</td>";
            echo "<td>" . date('Y-m-d H:i:s', $topic['lastactivity']) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Verificar si hay datos válidos
        $validTopics = array_filter($topics, function($topic) {
            return $topic['totalquestions'] > 0;
        });
        
        echo "<h3>✅ Análisis de Datos</h3>";
        echo "<ul>";
        echo "<li><strong>Registros con preguntas > 0:</strong> " . count($validTopics) . "</li>";
        echo "<li><strong>Registros vacíos:</strong> " . (count($topics) - count($validTopics)) . "</li>";
        echo "</ul>";
        
        if (count($validTopics) == 0) {
            echo "<div style='background: #ffebee; padding: 15px; border-radius: 5px; color: #c62828;'>";
            echo "<h4>⚠️ Problema Detectado</h4>";
            echo "<p>Todos los registros de performance tienen 0 preguntas. Esto explica por qué no se muestran en la interfaz.</p>";
            echo "<p><strong>Solución:</strong> Necesitas sincronizar los datos de respuestas desde la tabla telegramresponse.</p>";
            echo "</div>";
        }
        
    } else {
        echo "<p style='color: red;'>❌ No se encontraron datos de performance para tu usuario.</p>";
    }
    
    // Verificar datos en telegramresponse
    echo "<h2>📝 Verificación de Respuestas en MySQL</h2>";
    $stmt2 = $pdo->prepare("
        SELECT COUNT(*) as total_responses
        FROM telegramresponse 
        WHERE userid LIKE ?
    ");
    $stmt2->execute(["%{$telegramuserid}%"]);
    $responseCount = $stmt2->fetch(PDO::FETCH_ASSOC);
    
    echo "<p><strong>Respuestas en telegramresponse:</strong> " . $responseCount['total_responses'] . "</p>";
    
    if ($responseCount['total_responses'] > 0 && count($validTopics) == 0) {
        echo "<div style='background: #e3f2fd; padding: 15px; border-radius: 5px; color: #1565c0;'>";
        echo "<h4>🔄 Sincronización Necesaria</h4>";
        echo "<p>Tienes respuestas en la tabla MySQL pero no están sincronizadas con la tabla de performance de Moodle.</p>";
        echo "<p><a href='sync-performance-data.php' style='background: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🔄 Sincronizar Datos</a></p>";
        echo "</div>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

echo "<p><a href='my-advanced-analytics.php'>🔙 Volver a Analytics</a></p>";
?>