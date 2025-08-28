<?php
require_once(__DIR__ . '/../../config.php');
require_login();

$userid = $USER->id;

echo "<!DOCTYPE html>";
echo "<html><head><title>Debug User Mapping</title>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .success { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .error { background: #ffebee; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .warning { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 10px 0; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
</style>";
echo "</head><body>";

echo "<h1>🔍 Debug User Mapping - Telegram Integration</h1>";
echo "<p><strong>Fecha:</strong> " . date('Y-m-d H:i:s') . "</p>";

// Información del usuario actual de Moodle
echo "<div class='info'>";
echo "<h2>👤 Usuario Actual de Moodle</h2>";
echo "<p><strong>ID:</strong> {$USER->id}</p>";
echo "<p><strong>Username:</strong> {$USER->username}</p>";
echo "<p><strong>Nombre:</strong> {$USER->firstname} {$USER->lastname}</p>";
echo "<p><strong>Email:</strong> {$USER->email}</p>";
echo "</div>";

// Intentar obtener el TelegramUserId vinculado
global $DB;
$telegramuserid = null;

try {
    // Intentar con Moodle DB primero
    $link = $DB->get_record('moodleuserlink', ['moodleuserid' => $userid]);
    if ($link) {
        $telegramuserid = $link->telegramuserid;
        echo "<div class='success'>";
        echo "<h2>🔗 Vinculación Encontrada (Moodle DB)</h2>";
        echo "<p><strong>Moodle User ID:</strong> {$link->moodleuserid}</p>";
        echo "<p><strong>Telegram User ID:</strong> {$link->telegramuserid}</p>";
        echo "</div>";
    } else {
        echo "<div class='warning'>";
        echo "<h2>⚠️ No se encontró vinculación en Moodle DB</h2>";
        echo "<p>Usuario {$userid} no tiene vinculación con Telegram</p>";
        echo "</div>";
    }
} catch (Exception $e) {
    echo "<div class='error'>";
    echo "<h2>❌ Error con Moodle DB</h2>";
    echo "<p>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
    
    // Intentar con PDO
    try {
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleuserid = ?");
        $stmt->execute([$userid]);
        $link = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($link) {
            $telegramuserid = $link['telegramuserid'];
            echo "<div class='success'>";
            echo "<h2>🔗 Vinculación Encontrada (PDO)</h2>";
            echo "<p><strong>Moodle User ID:</strong> {$link['moodleuserid']}</p>";
            echo "<p><strong>Telegram User ID:</strong> {$link['telegramuserid']}</p>";
            echo "</div>";
        } else {
            echo "<div class='warning'>";
            echo "<h2>⚠️ No se encontró vinculación en PDO</h2>";
            echo "<p>Usuario {$userid} no tiene vinculación con Telegram</p>";
            echo "</div>";
        }
    } catch (PDOException $e2) {
        echo "<div class='error'>";
        echo "<h2>❌ Error con PDO</h2>";
        echo "<p>Error: " . htmlspecialchars($e2->getMessage()) . "</p>";
        echo "</div>";
    }
}

// Mostrar todas las vinculaciones existentes
echo "<div class='info'>";
echo "<h2>📊 Todas las Vinculaciones Existentes</h2>";
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->prepare("SELECT * FROM moodleuserlink ORDER BY moodleuserid");
    $stmt->execute();
    $links = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($links) {
        echo "<table>";
        echo "<tr><th>Moodle User ID</th><th>Telegram User ID</th></tr>";
        foreach ($links as $link) {
            $highlight = ($link['moodleuserid'] == $userid) ? "style='background-color: #ffeb3b;'" : "";
            echo "<tr {$highlight}>";
            echo "<td>{$link['moodleuserid']}</td>";
            echo "<td>{$link['telegramuserid']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>No se encontraron vinculaciones en la tabla.</p>";
    }
} catch (PDOException $e) {
    echo "<p>Error al obtener vinculaciones: " . htmlspecialchars($e->getMessage()) . "</p>";
}
echo "</div>";

// Mostrar datos de performance si hay telegramuserid
if ($telegramuserid) {
    echo "<div class='info'>";
    echo "<h2>📈 Datos de Performance para Telegram User ID: {$telegramuserid}</h2>";
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM mdl_local_telegram_user_topic_performance WHERE telegramuserid = ? ORDER BY accuracy DESC");
        $stmt->execute([$telegramuserid]);
        $performance = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($performance) {
            echo "<table>";
            echo "<tr><th>ID</th><th>Tema</th><th>Total</th><th>Correctas</th><th>Incorrectas</th><th>Precisión</th><th>Última Actividad</th></tr>";
            foreach ($performance as $perf) {
                echo "<tr>";
                echo "<td>{$perf['id']}</td>";
                echo "<td>{$perf['sectionname']}</td>";
                echo "<td>{$perf['totalquestions']}</td>";
                echo "<td>{$perf['correctanswers']}</td>";
                echo "<td>{$perf['incorrectanswers']}</td>";
                echo "<td>{$perf['accuracy']}%</td>";
                echo "<td>{$perf['lastactivity']}</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>No se encontraron datos de performance para este usuario.</p>";
        }
    } catch (PDOException $e) {
        echo "<p>Error al obtener datos de performance: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
    echo "</div>";
}

// Mostrar todos los datos de performance para comparación
echo "<div class='info'>";
echo "<h2>📊 Todos los Datos de Performance (Para Comparación)</h2>";
try {
    $stmt = $pdo->prepare("SELECT * FROM mdl_local_telegram_user_topic_performance ORDER BY telegramuserid, accuracy DESC");
    $stmt->execute();
    $all_performance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($all_performance) {
        echo "<table>";
        echo "<tr><th>ID</th><th>Telegram User ID</th><th>Tema</th><th>Total</th><th>Correctas</th><th>Incorrectas</th><th>Precisión</th><th>Última Actividad</th></tr>";
        foreach ($all_performance as $perf) {
            $highlight = ($perf['telegramuserid'] == $telegramuserid) ? "style='background-color: #c8e6c9;'" : "";
            $data_highlight = ($perf['correctanswers'] > 0) ? "style='background-color: #e3f2fd;'" : "";
            $combined_style = $highlight ? $highlight : $data_highlight;
            
            echo "<tr {$combined_style}>";
            echo "<td>{$perf['id']}</td>";
            echo "<td>{$perf['telegramuserid']}</td>";
            echo "<td>{$perf['sectionname']}</td>";
            echo "<td>{$perf['totalquestions']}</td>";
            echo "<td>{$perf['correctanswers']}</td>";
            echo "<td>{$perf['incorrectanswers']}</td>";
            echo "<td>{$perf['accuracy']}%</td>";
            echo "<td>{$perf['lastactivity']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        echo "<p><strong>Leyenda:</strong></p>";
        echo "<ul>";
        echo "<li>🟢 <strong>Verde:</strong> Datos del usuario actual</li>";
        echo "<li>🔵 <strong>Azul:</strong> Registros con datos reales (correctas > 0)</li>";
        echo "</ul>";
    } else {
        echo "<p>No se encontraron datos de performance.</p>";
    }
} catch (PDOException $e) {
    echo "<p>Error al obtener todos los datos de performance: " . htmlspecialchars($e->getMessage()) . "</p>";
}
echo "</div>";

echo "<div class='info'>";
echo "<h2>🎯 Análisis del Problema</h2>";
echo "<p>Si estás viendo datos con 0% precisión en la página de analytics, pero hay datos reales en la base de datos con otro Telegram User ID, entonces:</p>";
echo "<ul>";
echo "<li>El usuario actual de Moodle no es el mismo que hizo el quiz</li>";
echo "<li>O hay un problema con la vinculación usuario-Telegram</li>";
echo "<li>O necesitas iniciar sesión con el usuario correcto</li>";
echo "</ul>";
echo "</div>";

echo "<p><a href='my-advanced-analytics.php'>🔙 Volver a Analytics</a></p>";
echo "<p><a href='test-simple.php'>🧪 Test Simple</a></p>";

echo "</body></html>";
?> 