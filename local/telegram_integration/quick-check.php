<?php
// Verificación rápida del estado del plugin Telegram Integration
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

echo "<h1>⚡ Verificación Rápida - Plugin Telegram Integration</h1>";

$status = [];

// 1. Verificar conexión a MySQL
echo "<h2>1. Conexión a Base de Datos MySQL</h2>";
try {
    $pdo = createDatabaseConnection();
    $status['mysql_connection'] = true;
    echo "✅ Conexión a MySQL exitosa<br>";
} catch (Exception $e) {
    $status['mysql_connection'] = false;
    echo "❌ Error de conexión a MySQL: " . $e->getMessage() . "<br>";
}

// 2. Verificar datos de usuarios
if ($status['mysql_connection']) {
    echo "<h2>2. Datos de Usuarios</h2>";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM telegramuser");
        $user_count = $stmt->fetch()['count'];
        $status['users_count'] = $user_count;
        echo "📊 Usuarios de Telegram: $user_count<br>";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM telegramresponse");
        $response_count = $stmt->fetch()['count'];
        $status['responses_count'] = $response_count;
        echo "📊 Respuestas totales: $response_count<br>";
        
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM moodleuserlink WHERE isactive = 1");
        $link_count = $stmt->fetch()['count'];
        $status['links_count'] = $link_count;
        echo "📊 Vinculaciones activas: $link_count<br>";
        
    } catch (Exception $e) {
        echo "❌ Error obteniendo datos: " . $e->getMessage() . "<br>";
    }
}

// 3. Verificar usuario actual
echo "<h2>3. Usuario Actual</h2>";
if (isloggedin()) {
    global $USER;
    $status['user_logged_in'] = true;
    echo "✅ Usuario logueado: {$USER->firstname} {$USER->lastname} (ID: {$USER->id})<br>";
    
    // Verificar si tiene vinculación
    try {
        global $DB;
        $verification = $DB->get_record('local_telegram_verification', [
            'moodle_userid' => $USER->id,
            'is_verified' => 1
        ]);
        
        if ($verification) {
            $status['user_linked'] = true;
            echo "✅ Usuario tiene cuenta vinculada<br>";
            echo "📱 Telegram ID: {$verification->telegram_userid}<br>";
            
            // Verificar datos de Telegram
            if ($status['mysql_connection']) {
                $stmt = $pdo->prepare("SELECT * FROM telegramuser WHERE telegramuserid = ?");
                $stmt->execute([$verification->telegram_userid]);
                $telegram_user = $stmt->fetch();
                
                if ($telegram_user) {
                    $status['telegram_data_available'] = true;
                    echo "✅ Datos de Telegram disponibles:<br>";
                    echo "- Puntos: {$telegram_user['totalpoints']}<br>";
                    echo "- Nivel: {$telegram_user['level']}<br>";
                    echo "- Streak: {$telegram_user['streak']}<br>";
                } else {
                    $status['telegram_data_available'] = false;
                    echo "❌ No se encontraron datos de Telegram para este usuario<br>";
                }
            }
        } else {
            $status['user_linked'] = false;
            echo "❌ Usuario NO tiene cuenta vinculada<br>";
            echo "💡 Necesita usar /codigo_moodle en Telegram<br>";
        }
    } catch (Exception $e) {
        echo "❌ Error verificando vinculación: " . $e->getMessage() . "<br>";
    }
} else {
    $status['user_logged_in'] = false;
    echo "❌ No hay usuario logueado<br>";
}

// 4. Verificar actividad reciente
echo "<h2>4. Actividad Reciente</h2>";
if ($status['mysql_connection']) {
    try {
        $stmt = $pdo->query("
            SELECT COUNT(*) as count 
            FROM telegramresponse 
            WHERE answeredat >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $recent_count = $stmt->fetch()['count'];
        $status['recent_activity'] = $recent_count;
        echo "📊 Respuestas en las últimas 24 horas: $recent_count<br>";
        
        if ($recent_count == 0) {
            echo "⚠️ No hay actividad reciente<br>";
        }
    } catch (Exception $e) {
        echo "❌ Error verificando actividad: " . $e->getMessage() . "<br>";
    }
}

// 5. Resumen del estado
echo "<h2>5. Resumen del Estado</h2>";
echo "<table border='1' style='margin: 10px 0;'>";
echo "<tr><th>Componente</th><th>Estado</th><th>Detalles</th></tr>";

echo "<tr>";
echo "<td>Conexión MySQL</td>";
echo "<td>" . ($status['mysql_connection'] ? '✅ OK' : '❌ ERROR') . "</td>";
echo "<td>Base de datos de Telegram</td>";
echo "</tr>";

echo "<tr>";
echo "<td>Usuarios de Telegram</td>";
echo "<td>" . (isset($status['users_count']) && $status['users_count'] > 0 ? '✅ OK' : '❌ VACÍO') . "</td>";
echo "<td>" . (isset($status['users_count']) ? $status['users_count'] . ' usuarios' : '0 usuarios') . "</td>";
echo "</tr>";

echo "<tr>";
echo "<td>Vinculaciones</td>";
echo "<td>" . (isset($status['links_count']) && $status['links_count'] > 0 ? '✅ OK' : '❌ VACÍO') . "</td>";
echo "<td>" . (isset($status['links_count']) ? $status['links_count'] . ' vinculaciones' : '0 vinculaciones') . "</td>";
echo "</tr>";

echo "<tr>";
echo "<td>Usuario Actual</td>";
echo "<td>" . (isset($status['user_logged_in']) && $status['user_logged_in'] ? '✅ LOGUEADO' : '❌ NO LOGUEADO') . "</td>";
echo "<td>" . (isset($status['user_linked']) && $status['user_linked'] ? 'Vinculado' : 'No vinculado') . "</td>";
echo "</tr>";

echo "<tr>";
echo "<td>Datos de Telegram</td>";
echo "<td>" . (isset($status['telegram_data_available']) && $status['telegram_data_available'] ? '✅ DISPONIBLE' : '❌ NO DISPONIBLE') . "</td>";
echo "<td>" . (isset($status['telegram_data_available']) && $status['telegram_data_available'] ? 'Datos accesibles' : 'Sin datos') . "</td>";
echo "</tr>";

echo "<tr>";
echo "<td>Actividad Reciente</td>";
echo "<td>" . (isset($status['recent_activity']) && $status['recent_activity'] > 0 ? '✅ ACTIVA' : '❌ INACTIVA') . "</td>";
echo "<td>" . (isset($status['recent_activity']) ? $status['recent_activity'] . ' respuestas' : '0 respuestas') . "</td>";
echo "</tr>";

echo "</table>";

// 6. Recomendaciones
echo "<h2>6. Recomendaciones</h2>";
echo "<ul>";

if (!isset($status['mysql_connection']) || !$status['mysql_connection']) {
    echo "<li>❌ <strong>Problema crítico:</strong> No se puede conectar a la base de datos MySQL</li>";
    echo "<li>💡 <strong>Solución:</strong> Verificar configuración en db-config.php</li>";
}

if (!isset($status['users_count']) || $status['users_count'] == 0) {
    echo "<li>❌ <strong>Problema:</strong> No hay usuarios de Telegram registrados</li>";
    echo "<li>💡 <strong>Solución:</strong> Verificar que el bot esté funcionando</li>";
}

if (!isset($status['links_count']) || $status['links_count'] == 0) {
    echo "<li>❌ <strong>Problema:</strong> No hay vinculaciones Moodle-Telegram</li>";
    echo "<li>💡 <strong>Solución:</strong> Promover el uso de /codigo_moodle</li>";
}

if (!isset($status['user_linked']) || !$status['user_linked']) {
    echo "<li>❌ <strong>Problema:</strong> El usuario actual no tiene cuenta vinculada</li>";
    echo "<li>💡 <strong>Solución:</strong> Usar /codigo_moodle en Telegram</li>";
}

if (!isset($status['recent_activity']) || $status['recent_activity'] == 0) {
    echo "<li>⚠️ <strong>Advertencia:</strong> No hay actividad reciente</li>";
    echo "<li>💡 <strong>Solución:</strong> Verificar el scheduler de envío automático</li>";
}

if (isset($status['mysql_connection']) && $status['mysql_connection'] && 
    isset($status['users_count']) && $status['users_count'] > 0 &&
    isset($status['links_count']) && $status['links_count'] > 0) {
    echo "<li>✅ <strong>Estado general:</strong> El plugin está funcionando correctamente</li>";
    echo "<li>🎯 <strong>Próximo paso:</strong> Los datos deberían aparecer en analytics.php</li>";
}

echo "</ul>";

echo "<h3>🔗 Enlaces Útiles:</h3>";
echo "<ul>";
echo "<li><a href='https://campus.opomelilla.com/local/telegram_integration/analytics.php' target='_blank'>📊 Página de Analytics</a></li>";
echo "<li><a href='https://campus.opomelilla.com/local/telegram_integration/verify.php' target='_blank'>🔗 Página de Verificación</a></li>";
echo "<li><a href='diagnostic-user-data.php' target='_blank'>🔍 Diagnóstico Detallado</a></li>";
echo "<li><a href='test-analytics-function.php' target='_blank'>🧪 Test de Función Analytics</a></li>";
echo "</ul>";

echo "<p><strong>⏰ Última verificación:</strong> " . date('Y-m-d H:i:s') . "</p>";
?> 