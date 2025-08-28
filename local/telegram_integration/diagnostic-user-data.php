<?php
// Script de diagnóstico para verificar la obtención de datos de usuarios de Telegram
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

echo "<h1>🔍 Diagnóstico de Datos de Usuarios de Telegram</h1>";
echo "<p>Verificando si el plugin está obteniendo correctamente la información de usuarios...</p>";

// 1. Verificar conexión a la base de datos MySQL
echo "<h2>1. Conexión a Base de Datos MySQL</h2>";
try {
    $pdo = createDatabaseConnection();
    echo "✅ Conexión a MySQL exitosa<br>";
    
    // Verificar tablas principales
    $tables = ['telegramuser', 'telegramresponse', 'moodleuserlink'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch()['count'];
            echo "📊 Tabla '$table': $count registros<br>";
        } catch (Exception $e) {
            echo "❌ Error con tabla '$table': " . $e->getMessage() . "<br>";
        }
    }
} catch (Exception $e) {
    echo "❌ Error de conexión a MySQL: " . $e->getMessage() . "<br>";
    return;
}

// 2. Verificar datos de usuarios de Telegram
echo "<h2>2. Datos de Usuarios de Telegram</h2>";
try {
    $stmt = $pdo->query("
        SELECT 
            telegramuserid,
            username,
            firstname,
            lastname,
            totalpoints,
            level,
            streak,
            lastactivity,
            COUNT(r.id) as total_responses,
            SUM(CASE WHEN r.iscorrect = 1 THEN 1 ELSE 0 END) as correct_responses
        FROM telegramuser u
        LEFT JOIN telegramresponse r ON u.id = r.userid
        GROUP BY u.id
        ORDER BY u.totalpoints DESC
        LIMIT 10
    ");
    
    $users = $stmt->fetchAll();
    
    if (count($users) > 0) {
        echo "✅ Se encontraron " . count($users) . " usuarios de Telegram<br>";
        echo "<table border='1' style='margin: 10px 0; font-size: 12px;'>";
        echo "<tr><th>Telegram ID</th><th>Username</th><th>Nombre</th><th>Puntos</th><th>Nivel</th><th>Streak</th><th>Respuestas</th><th>Correctas</th><th>Última Actividad</th></tr>";
        
        foreach ($users as $user) {
            $accuracy = $user['total_responses'] > 0 ? 
                round(($user['correct_responses'] / $user['total_responses']) * 100, 1) : 0;
            $lastActivity = $user['lastactivity'] ? date('Y-m-d H:i', strtotime($user['lastactivity'])) : 'N/A';
            
            echo "<tr>";
            echo "<td>{$user['telegramuserid']}</td>";
            echo "<td>{$user['username']}</td>";
            echo "<td>{$user['firstname']} {$user['lastname']}</td>";
            echo "<td>{$user['totalpoints']}</td>";
            echo "<td>{$user['level']}</td>";
            echo "<td>{$user['streak']}</td>";
            echo "<td>{$user['total_responses']}</td>";
            echo "<td>{$user['correct_responses']} ({$accuracy}%)</td>";
            echo "<td>{$lastActivity}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "❌ No se encontraron usuarios de Telegram<br>";
    }
} catch (Exception $e) {
    echo "❌ Error obteniendo datos de usuarios: " . $e->getMessage() . "<br>";
}

// 3. Verificar vinculaciones Moodle-Telegram
echo "<h2>3. Vinculaciones Moodle-Telegram</h2>";
try {
    $stmt = $pdo->query("
        SELECT 
            m.telegramuserid,
            m.moodleuserid,
            m.moodleusername,
            m.moodlefullname,
            m.isactive,
            m.linkedat,
            u.totalpoints,
            u.level
        FROM moodleuserlink m
        LEFT JOIN telegramuser u ON m.telegramuserid = u.telegramuserid
        WHERE m.isactive = 1
        ORDER BY m.linkedat DESC
    ");
    
    $links = $stmt->fetchAll();
    
    if (count($links) > 0) {
        echo "✅ Se encontraron " . count($links) . " vinculaciones activas<br>";
        echo "<table border='1' style='margin: 10px 0; font-size: 12px;'>";
        echo "<tr><th>Telegram ID</th><th>Moodle ID</th><th>Moodle Username</th><th>Moodle Fullname</th><th>Puntos</th><th>Nivel</th><th>Vinculado</th></tr>";
        
        foreach ($links as $link) {
            $linkedAt = date('Y-m-d H:i', strtotime($link['linkedat']));
            
            echo "<tr>";
            echo "<td>{$link['telegramuserid']}</td>";
            echo "<td>{$link['moodleuserid']}</td>";
            echo "<td>{$link['moodleusername']}</td>";
            echo "<td>{$link['moodlefullname']}</td>";
            echo "<td>{$link['totalpoints']}</td>";
            echo "<td>{$link['level']}</td>";
            echo "<td>{$linkedAt}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "❌ No se encontraron vinculaciones activas<br>";
    }
} catch (Exception $e) {
    echo "❌ Error obteniendo vinculaciones: " . $e->getMessage() . "<br>";
}

// 4. Verificar actividad reciente
echo "<h2>4. Actividad Reciente (Últimas 24 horas)</h2>";
try {
    $stmt = $pdo->query("
        SELECT 
            r.telegrammsgid,
            u.username,
            u.firstname,
            r.iscorrect,
            r.points,
            r.responsetime,
            r.answeredat
        FROM telegramresponse r
        JOIN telegramuser u ON r.userid = u.id
        WHERE r.answeredat >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ORDER BY r.answeredat DESC
        LIMIT 10
    ");
    
    $recent_activity = $stmt->fetchAll();
    
    if (count($recent_activity) > 0) {
        echo "✅ Se encontraron " . count($recent_activity) . " respuestas en las últimas 24 horas<br>";
        echo "<table border='1' style='margin: 10px 0; font-size: 12px;'>";
        echo "<tr><th>Usuario</th><th>Correcta</th><th>Puntos</th><th>Tiempo (ms)</th><th>Respondida</th></tr>";
        
        foreach ($recent_activity as $activity) {
            $correct = $activity['iscorrect'] ? '✅' : '❌';
            $answeredAt = date('Y-m-d H:i:s', strtotime($activity['answeredat']));
            
            echo "<tr>";
            echo "<td>{$activity['firstname']} (@{$activity['username']})</td>";
            echo "<td>{$correct}</td>";
            echo "<td>{$activity['points']}</td>";
            echo "<td>{$activity['responsetime']}</td>";
            echo "<td>{$answeredAt}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "❌ No se encontró actividad reciente<br>";
    }
} catch (Exception $e) {
    echo "❌ Error obteniendo actividad reciente: " . $e->getMessage() . "<br>";
}

// 5. Verificar función de analytics
echo "<h2>5. Test de Función de Analytics</h2>";
try {
    // Simular la función que usa analytics.php
    function get_telegram_user_data($telegram_user_id) {
        global $pdo;
        
        $stmt = $pdo->prepare("
            SELECT 
                u.*,
                COUNT(r.id) as total_responses,
                SUM(CASE WHEN r.iscorrect = 1 THEN 1 ELSE 0 END) as correct_responses,
                AVG(r.responsetime) as avg_response_time
            FROM telegramuser u
            LEFT JOIN telegramresponse r ON u.id = r.userid
            WHERE u.telegramuserid = ?
            GROUP BY u.id
        ");
        
        $stmt->execute([$telegram_user_id]);
        return $stmt->fetch();
    }
    
    // Probar con el primer usuario encontrado
    if (isset($users[0])) {
        $test_user_id = $users[0]['telegramuserid'];
        $user_data = get_telegram_user_data($test_user_id);
        
        if ($user_data) {
            echo "✅ Función de analytics funciona correctamente<br>";
            echo "📊 Datos del usuario de prueba (ID: $test_user_id):<br>";
            echo "- Nombre: {$user_data['firstname']} {$user_data['lastname']}<br>";
            echo "- Puntos: {$user_data['totalpoints']}<br>";
            echo "- Nivel: {$user_data['level']}<br>";
            echo "- Respuestas totales: {$user_data['total_responses']}<br>";
            echo "- Respuestas correctas: {$user_data['correct_responses']}<br>";
            echo "- Tiempo promedio: " . round($user_data['avg_response_time'], 0) . "ms<br>";
        } else {
            echo "❌ Función de analytics no devuelve datos<br>";
        }
    } else {
        echo "❌ No hay usuarios para probar la función de analytics<br>";
    }
} catch (Exception $e) {
    echo "❌ Error en función de analytics: " . $e->getMessage() . "<br>";
}

// 6. Resumen y recomendaciones
echo "<h2>6. Resumen y Recomendaciones</h2>";
echo "<ul>";

if (isset($users) && count($users) > 0) {
    echo "<li>✅ <strong>Datos de usuarios disponibles:</strong> " . count($users) . " usuarios encontrados</li>";
} else {
    echo "<li>❌ <strong>Problema:</strong> No hay datos de usuarios de Telegram</li>";
    echo "<li>💡 <strong>Solución:</strong> Verificar que el bot esté funcionando y los usuarios estén respondiendo</li>";
}

if (isset($links) && count($links) > 0) {
    echo "<li>✅ <strong>Vinculaciones activas:</strong> " . count($links) . " usuarios vinculados</li>";
} else {
    echo "<li>❌ <strong>Problema:</strong> No hay vinculaciones Moodle-Telegram</li>";
    echo "<li>💡 <strong>Solución:</strong> Los usuarios necesitan vincular sus cuentas usando /codigo_moodle</li>";
}

if (isset($recent_activity) && count($recent_activity) > 0) {
    echo "<li>✅ <strong>Actividad reciente:</strong> " . count($recent_activity) . " respuestas en 24h</li>";
} else {
    echo "<li>⚠️ <strong>Advertencia:</strong> No hay actividad reciente</li>";
    echo "<li>💡 <strong>Solución:</strong> Verificar que el bot esté enviando preguntas</li>";
}

echo "</ul>";

echo "<h3>🔧 Próximos Pasos:</h3>";
echo "<ol>";
echo "<li>Si no hay datos: Verificar que el bot de Telegram esté funcionando</li>";
echo "<li>Si no hay vinculaciones: Promover el uso del comando /codigo_moodle</li>";
echo "<li>Si no hay actividad: Verificar el scheduler de envío automático</li>";
echo "<li>Si todo está bien: Los datos deberían aparecer en analytics.php</li>";
echo "</ol>";

echo "<p><strong>🎯 URL de Analytics:</strong> <a href='https://campus.opomelilla.com/local/telegram_integration/analytics.php' target='_blank'>https://campus.opomelilla.com/local/telegram_integration/analytics.php</a></p>";
?> 