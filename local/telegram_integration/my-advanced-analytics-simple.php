<?php
require_once(__DIR__ . '/../../config.php');
require_login();

$userid = $USER->id;

echo $OUTPUT->header();
echo "<h1>📊 Análisis avanzado Plataforma + Telegram</h1>";

// Función para manejar errores de base de datos
function safeQuery($pdo, $query, $params = []) {
    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        echo "<p style='color: orange;'>⚠️ Error en consulta: " . $e->getMessage() . "</p>";
        return [];
    }
}

// Conexión a base de datos
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p style='color: green;'>✅ Conexión a base de datos exitosa</p>";
} catch (PDOException $e) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>❌ Error de Conexión</h3>";
    echo "<p>No se pudo conectar a la base de datos: " . $e->getMessage() . "</p>";
    echo "<p>Verifica la configuración de Moodle en config.php</p>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}

// Verificar si el usuario tiene cuenta vinculada
$link = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_user_link WHERE moodleuserid = ?", [$userid]);

if (empty($link)) {
    echo "<div style='text-align: center; padding: 40px;'>";
    echo "<h2>🔗 Vincula tu cuenta de Telegram</h2>";
    echo "<p>Para ver tus analytics avanzados, necesitas vincular tu cuenta de Telegram.</p>";
    echo "<p>Usa el comando <code>/vincular</code> en el bot de Telegram.</p>";
    echo "<p><strong>Tu ID de Moodle:</strong> $userid</p>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}

$telegramuserid = $link[0]['telegramuserid'];

echo "<div style='background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
echo "<h3>✅ Usuario Vinculado</h3>";
echo "<p><strong>ID de Telegram:</strong> $telegramuserid</p>";
echo "</div>";

// Obtener información básica del usuario
$userInfo = safeQuery($pdo, "SELECT * FROM telegramuser WHERE telegramuserid = ?", [$telegramuserid]);

if (empty($userInfo)) {
    echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>⚠️ Usuario no encontrado en Telegram</h3>";
    echo "<p>Tu cuenta de Moodle está vinculada, pero no se encontraron datos en la base de datos de Telegram.</p>";
    echo "<p>Esto puede suceder si:</p>";
    echo "<ul>";
    echo "<li>No has usado el bot de Telegram aún</li>";
    echo "<li>Hay un problema con la sincronización de datos</li>";
    echo "<li>La vinculación no se completó correctamente</li>";
    echo "</ul>";
    echo "</div>";
} else {
    $user = $userInfo[0];
    
    echo "<div style='background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
    echo "<h2>👤 Información del Usuario</h2>";
    echo "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;'>";
    echo "<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;'>";
    echo "<h3>Puntos Totales</h3>";
    echo "<div style='font-size: 2em; font-weight: bold;'>" . number_format($user['totalpoints']) . "</div>";
    echo "</div>";
    echo "<div style='background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #333; padding: 20px; border-radius: 10px; text-align: center;'>";
    echo "<h3>Nivel Actual</h3>";
    echo "<div style='font-size: 2em; font-weight: bold;'>" . $user['level'] . "</div>";
    echo "</div>";
    echo "<div style='background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;'>";
    echo "<h3>Precisión Global</h3>";
    echo "<div style='font-size: 2em; font-weight: bold;'>" . number_format($user['accuracy'], 1) . "%</div>";
    echo "</div>";
    echo "<div style='background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;'>";
    echo "<h3>Mejor Racha</h3>";
    echo "<div style='font-size: 2em; font-weight: bold;'>" . $user['beststreak'] . "</div>";
    echo "</div>";
    echo "</div>";
    echo "</div>";
}

// Obtener rendimiento por temas
$topics = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_user_topic_performance WHERE telegramuserid = ? ORDER BY accuracy DESC", [$telegramuserid]);

if (!empty($topics)) {
    echo "<div style='background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
    echo "<h2>📚 Rendimiento por Temas</h2>";
    echo "<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>";
    echo "<thead>";
    echo "<tr style='background: #f8f9fa;'>";
    echo "<th style='padding: 12px; text-align: left; border-bottom: 1px solid #eee;'>Tema</th>";
    echo "<th style='padding: 12px; text-align: left; border-bottom: 1px solid #eee;'>Preguntas</th>";
    echo "<th style='padding: 12px; text-align: left; border-bottom: 1px solid #eee;'>Correctas</th>";
    echo "<th style='padding: 12px; text-align: left; border-bottom: 1px solid #eee;'>Incorrectas</th>";
    echo "<th style='padding: 12px; text-align: left; border-bottom: 1px solid #eee;'>Precisión</th>";
    echo "</tr>";
    echo "</thead>";
    echo "<tbody>";
    
    foreach ($topics as $topic) {
        $color = $topic['accuracy'] >= 80 ? '#d4edda' : ($topic['accuracy'] >= 60 ? '#fff3cd' : '#f8d7da');
        echo "<tr style='background: $color;'>";
        echo "<td style='padding: 12px; border-bottom: 1px solid #eee;'><strong>" . htmlspecialchars($topic['sectionname']) . "</strong></td>";
        echo "<td style='padding: 12px; border-bottom: 1px solid #eee;'>" . $topic['totalquestions'] . "</td>";
        echo "<td style='padding: 12px; border-bottom: 1px solid #eee;'>" . $topic['correctanswers'] . "</td>";
        echo "<td style='padding: 12px; border-bottom: 1px solid #eee;'>" . $topic['incorrectanswers'] . "</td>";
        echo "<td style='padding: 12px; border-bottom: 1px solid #eee;'>";
        echo "<span style='color: " . ($topic['accuracy'] >= 80 ? '#28a745' : ($topic['accuracy'] >= 60 ? '#ffc107' : '#dc3545')) . "; font-weight: bold;'>";
        echo number_format($topic['accuracy'], 1) . "%";
        echo "</span>";
        echo "</td>";
        echo "</tr>";
    }
    
    echo "</tbody>";
    echo "</table>";
    echo "</div>";
} else {
    echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>📚 No hay datos de rendimiento por temas</h3>";
    echo "<p>Esto puede suceder si:</p>";
    echo "<ul>";
    echo "<li>No has respondido preguntas recientemente</li>";
    echo "<li>Las preguntas no están categorizadas por temas</li>";
    echo "<li>El sistema de analytics no está registrando datos</li>";
    echo "</ul>";
    echo "</div>";
}

// Obtener recomendaciones
$recommendations = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_recommendations WHERE telegramuserid = ? AND isactive = 1 ORDER BY priority ASC", [$telegramuserid]);

if (!empty($recommendations)) {
    echo "<div style='background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 5px;'>";
    echo "<h3>💡 Recomendaciones Personalizadas</h3>";
    echo "<ul>";
    foreach ($recommendations as $rec) {
        echo "<li>" . htmlspecialchars($rec['reason']) . "</li>";
    }
    echo "</ul>";
    echo "</div>";
} else {
    echo "<div style='background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>💡 No hay recomendaciones activas</h3>";
    echo "<p>¡Sigue practicando! Las recomendaciones se generan automáticamente basadas en tu rendimiento.</p>";
    echo "</div>";
}

// Obtener logros
$achievements = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_achievements WHERE telegramuserid = ? ORDER BY earnedat DESC LIMIT 5", [$telegramuserid]);

if (!empty($achievements)) {
    echo "<div style='background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
    echo "<h2>🏆 Logros Recientes</h2>";
    echo "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;'>";
    foreach ($achievements as $achievement) {
        echo "<div style='background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; text-align: center;'>";
        echo "<h4 style='margin: 0 0 10px 0; color: #856404;'>🏆 " . htmlspecialchars($achievement['achievementname']) . "</h4>";
        echo "<p style='margin: 0; font-size: 0.9em; color: #856404;'>" . htmlspecialchars($achievement['achievementdescription']) . "</p>";
        echo "<small style='color: #856404;'>Obtido: " . date('d/m/Y', strtotime($achievement['earnedat'])) . "</small>";
        echo "</div>";
    }
    echo "</div>";
    echo "</div>";
} else {
    echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>🏆 No hay logros aún</h3>";
    echo "<p>¡Sigue practicando para obtener logros! Los logros se otorgan automáticamente cuando cumples ciertos criterios.</p>";
    echo "</div>";
}

// Enlaces útiles
echo "<div style='background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
echo "<h2>🔗 Enlaces Útiles</h2>";
echo "<ul>";
echo "<li><a href='global-rankings.php' style='color: #667eea; text-decoration: none;'>🏆 Ver Rankings Globales</a></li>";
echo "<li><a href='debug-analytics.php' style='color: #667eea; text-decoration: none;'>🔍 Diagnóstico del Sistema</a></li>";
echo "<li><a href='test-advanced-analytics.php' style='color: #667eea; text-decoration: none;'>🧪 Insertar Datos de Prueba</a></li>";
echo "<li><a href='setup-advanced-analytics.php' style='color: #667eea; text-decoration: none;'>⚙️ Configuración</a></li>";
echo "</ul>";
echo "</div>";
echo $OUTPUT->footer();
?>