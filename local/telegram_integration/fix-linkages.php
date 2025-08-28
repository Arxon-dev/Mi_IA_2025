<?php
// Corregir vinculaciones problemáticas entre Moodle y Telegram
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

echo "<h1>🔧 Corrección de Vinculaciones Problemáticas</h1>";

// 1. Identificar problemas
echo "<h2>1. Identificando Problemas</h2>";
try {
    global $DB;
    $pdo = createDatabaseConnection();
    
    // Obtener todas las vinculaciones de Moodle
    $verifications = $DB->get_records('local_telegram_verification', ['is_verified' => 1]);
    
    $problematic_links = [];
    $valid_links = [];
    
    foreach ($verifications as $verification) {
        // Verificar si existe en MySQL
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM telegramuser WHERE telegramuserid = ?");
        $stmt->execute([$verification->telegram_userid]);
        $exists_in_mysql = $stmt->fetch()['count'] > 0;
        
        if (!$exists_in_mysql) {
            $problematic_links[] = $verification;
        } else {
            $valid_links[] = $verification;
        }
    }
    
    echo "📊 Total vinculaciones: " . count($verifications) . "<br>";
    echo "✅ Vinculaciones válidas: " . count($valid_links) . "<br>";
    echo "❌ Vinculaciones problemáticas: " . count($problematic_links) . "<br><br>";
    
    if (count($problematic_links) > 0) {
        echo "<h3>Vinculaciones Problemáticas:</h3>";
        echo "<table border='1' style='margin: 10px 0;'>";
        echo "<tr><th>Moodle ID</th><th>Telegram ID (Moodle)</th><th>Estado</th><th>Acción</th></tr>";
        
        foreach ($problematic_links as $link) {
            echo "<tr>";
            echo "<td>{$link->moodle_userid}</td>";
            echo "<td>{$link->telegram_userid}</td>";
            echo "<td>❌ No existe en MySQL</td>";
            echo "<td><button onclick='fixLink({$link->id})'>Corregir</button></td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (Exception $e) {
    echo "❌ Error identificando problemas: " . $e->getMessage() . "<br>";
}

// 2. Mostrar usuarios disponibles en MySQL
echo "<h2>2. Usuarios Disponibles en MySQL</h2>";
try {
    $stmt = $pdo->query("
        SELECT 
            telegramuserid,
            username,
            firstname,
            lastname,
            totalpoints,
            level,
            COUNT(r.id) as total_responses
        FROM telegramuser u
        LEFT JOIN telegramresponse r ON u.id = r.userid
        GROUP BY u.id
        ORDER BY u.totalpoints DESC
        LIMIT 10
    ");
    
    $users = $stmt->fetchAll();
    
    if (count($users) > 0) {
        echo "📊 Top 10 usuarios de Telegram disponibles:<br>";
        echo "<table border='1' style='margin: 10px 0;'>";
        echo "<tr><th>Telegram ID</th><th>Username</th><th>Nombre</th><th>Puntos</th><th>Nivel</th><th>Respuestas</th></tr>";
        
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td>{$user['telegramuserid']}</td>";
            echo "<td>{$user['username']}</td>";
            echo "<td>{$user['firstname']} {$user['lastname']}</td>";
            echo "<td>{$user['totalpoints']}</td>";
            echo "<td>{$user['level']}</td>";
            echo "<td>{$user['total_responses']}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "❌ Error obteniendo usuarios: " . $e->getMessage() . "<br>";
}

// 3. Función para corregir vinculación
if (isset($_POST['fix_link'])) {
    $link_id = $_POST['link_id'];
    $new_telegram_id = $_POST['new_telegram_id'];
    
    try {
        // Actualizar la vinculación en Moodle
        $verification = $DB->get_record('local_telegram_verification', ['id' => $link_id]);
        if ($verification) {
            $verification->telegram_userid = $new_telegram_id;
            $DB->update_record('local_telegram_verification', $verification);
            
            echo "✅ Vinculación corregida exitosamente<br>";
            echo "- Moodle ID: {$verification->moodle_userid}<br>";
            echo "- Nuevo Telegram ID: $new_telegram_id<br>";
        }
    } catch (Exception $e) {
        echo "❌ Error corrigiendo vinculación: " . $e->getMessage() . "<br>";
    }
}

// 4. Formulario de corrección
echo "<h2>3. Corregir Vinculación</h2>";
echo "<form method='post'>";
echo "<label>Seleccionar vinculación problemática:</label><br>";
echo "<select name='link_id'>";
foreach ($problematic_links as $link) {
    echo "<option value='{$link->id}'>{$link->moodle_userid} - {$link->telegram_userid}</option>";
}
echo "</select><br><br>";

echo "<label>Nuevo Telegram ID:</label><br>";
echo "<select name='new_telegram_id'>";
foreach ($users as $user) {
    echo "<option value='{$user['telegramuserid']}'>{$user['telegramuserid']} - {$user['firstname']} {$user['lastname']} ({$user['username']})</option>";
}
echo "</select><br><br>";

echo "<input type='submit' name='fix_link' value='Corregir Vinculación'>";
echo "</form>";

// 5. Verificar scheduler
echo "<h2>4. Verificar Scheduler de Envío</h2>";
echo "<p>Para verificar si el scheduler está funcionando:</p>";
echo "<ul>";
echo "<li>Verificar que el proceso esté ejecutándose: <code>npx tsx scripts/notification-scheduler.ts</code></li>";
echo "<li>Verificar logs del scheduler</li>";
echo "<li>Probar envío manual: <code>npx tsx scripts/auto-send-daily-poll.ts</code></li>";
echo "</ul>";

// 6. Recomendaciones
echo "<h2>5. Recomendaciones</h2>";
echo "<ul>";

if (count($problematic_links) > 0) {
    echo "<li>❌ <strong>Problema crítico:</strong> " . count($problematic_links) . " vinculaciones con Telegram IDs inexistentes</li>";
    echo "<li>💡 <strong>Solución:</strong> Usar el formulario arriba para corregir las vinculaciones</li>";
} else {
    echo "<li>✅ <strong>Vinculaciones:</strong> Todas las vinculaciones son válidas</li>";
}

// Verificar actividad reciente
$stmt = $pdo->query("SELECT COUNT(*) as count FROM telegramresponse WHERE answeredat >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
$recent_activity = $stmt->fetch()['count'];

if ($recent_activity == 0) {
    echo "<li>❌ <strong>Problema:</strong> No hay actividad reciente (últimas 24h)</li>";
    echo "<li>💡 <strong>Solución:</strong> Verificar el scheduler de envío automático</li>";
} else {
    echo "<li>✅ <strong>Actividad reciente:</strong> $recent_activity respuestas en 24h</li>";
}

echo "<li>🎯 <strong>Próximo paso:</strong> Después de corregir vinculaciones, probar analytics.php</li>";
echo "</ul>";

echo "<h3>🔗 Enlaces Útiles:</h3>";
echo "<ul>";
echo "<li><a href='https://campus.opomelilla.com/local/telegram_integration/analytics.php' target='_blank'>📊 Página de Analytics</a></li>";
echo "<li><a href='verify-tables.php' target='_blank'>🔍 Verificar Tablas</a></li>";
echo "<li><a href='quick-check.php' target='_blank'>⚡ Verificación Rápida</a></li>";
echo "</ul>";
?> 