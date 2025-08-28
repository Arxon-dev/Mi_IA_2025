<?php
// Verificar tablas y estructura de datos
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

echo "<h1>🔍 Verificación de Tablas y Estructura de Datos</h1>";

// 1. Verificar tablas de Moodle
echo "<h2>1. Tablas de Moodle (Plugin)</h2>";
try {
    global $DB;
    
    // Listar todas las tablas que empiecen con 'local_telegram'
    $tables = $DB->get_tables();
    $telegram_tables = array_filter($tables, function($table) {
        return strpos($table, 'local_telegram') === 0;
    });
    
    echo "📊 Tablas del plugin encontradas:<br>";
    foreach ($telegram_tables as $table) {
        try {
            $count = $DB->count_records($table);
            echo "- <strong>$table</strong>: $count registros<br>";
            
            // Mostrar estructura de la tabla
            $columns = $DB->get_columns($table);
            echo "  Columnas: " . implode(', ', array_keys($columns)) . "<br>";
            
            // Mostrar algunos datos de ejemplo
            if ($count > 0) {
                $records = $DB->get_records($table, null, 'id DESC', '*', 0, 3);
                echo "  Ejemplos:<br>";
                foreach ($records as $record) {
                    echo "    - ID: {$record->id}";
                    if (isset($record->moodle_userid)) echo ", Moodle ID: {$record->moodle_userid}";
                    if (isset($record->telegram_userid)) echo ", Telegram ID: {$record->telegram_userid}";
                    if (isset($record->is_verified)) echo ", Verificado: " . ($record->is_verified ? 'Sí' : 'No');
                    echo "<br>";
                }
            }
            echo "<br>";
        } catch (Exception $e) {
            echo "- <strong>$table</strong>: Error - " . $e->getMessage() . "<br>";
        }
    }
} catch (Exception $e) {
    echo "❌ Error accediendo a tablas de Moodle: " . $e->getMessage() . "<br>";
}

// 2. Verificar tablas de MySQL
echo "<h2>2. Tablas de MySQL (Datos de Telegram)</h2>";
try {
    $pdo = createDatabaseConnection();
    
    // Listar tablas principales
    $tables = ['telegramuser', 'telegramresponse', 'moodleuserlink'];
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch()['count'];
            echo "📊 Tabla <strong>$table</strong>: $count registros<br>";
            
            // Mostrar estructura
            $stmt = $pdo->query("DESCRIBE $table");
            $columns = $stmt->fetchAll();
            echo "  Columnas: ";
            $column_names = array_map(function($col) { return $col['Field']; }, $columns);
            echo implode(', ', $column_names) . "<br>";
            
            // Mostrar algunos datos de ejemplo
            if ($count > 0) {
                $stmt = $pdo->query("SELECT * FROM $table ORDER BY id DESC LIMIT 3");
                $records = $stmt->fetchAll();
                echo "  Ejemplos:<br>";
                foreach ($records as $record) {
                    echo "    - ID: {$record['id']}";
                    if (isset($record['telegramuserid'])) echo ", Telegram ID: {$record['telegramuserid']}";
                    if (isset($record['username'])) echo ", Username: {$record['username']}";
                    if (isset($record['totalpoints'])) echo ", Puntos: {$record['totalpoints']}";
                    if (isset($record['moodleuserid'])) echo ", Moodle ID: {$record['moodleuserid']}";
                    echo "<br>";
                }
            }
            echo "<br>";
        } catch (Exception $e) {
            echo "❌ Error con tabla $table: " . $e->getMessage() . "<br>";
        }
    }
} catch (Exception $e) {
    echo "❌ Error de conexión a MySQL: " . $e->getMessage() . "<br>";
}

// 3. Verificar vinculaciones específicas
echo "<h2>3. Verificación de Vinculaciones</h2>";
try {
    global $DB;
    $pdo = createDatabaseConnection();
    
    // Obtener todas las vinculaciones de Moodle
    $verifications = $DB->get_records('local_telegram_verification', ['is_verified' => 1]);
    
    echo "📊 Vinculaciones verificadas en Moodle: " . count($verifications) . "<br><br>";
    
    foreach ($verifications as $verification) {
        echo "<strong>Usuario Moodle ID: {$verification->moodle_userid}</strong><br>";
        echo "- Telegram ID en Moodle: {$verification->telegram_userid}<br>";
        
        // Verificar si existe en MySQL
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM telegramuser WHERE telegramuserid = ?");
        $stmt->execute([$verification->telegram_userid]);
        $exists_in_mysql = $stmt->fetch()['count'] > 0;
        
        echo "- Existe en MySQL: " . ($exists_in_mysql ? '✅ SÍ' : '❌ NO') . "<br>";
        
        if ($exists_in_mysql) {
            // Obtener datos del usuario
            $stmt = $pdo->prepare("SELECT * FROM telegramuser WHERE telegramuserid = ?");
            $stmt->execute([$verification->telegram_userid]);
            $user = $stmt->fetch();
            
            echo "- Nombre: {$user['firstname']} {$user['lastname']}<br>";
            echo "- Puntos: {$user['totalpoints']}<br>";
            echo "- Nivel: {$user['level']}<br>";
            
            // Contar respuestas
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM telegramresponse WHERE userid = ?");
            $stmt->execute([$user['id']]);
            $responses = $stmt->fetch()['count'];
            echo "- Respuestas: $responses<br>";
        } else {
            echo "- ⚠️ PROBLEMA: El Telegram ID no existe en la tabla telegramuser<br>";
        }
        echo "<br>";
    }
} catch (Exception $e) {
    echo "❌ Error verificando vinculaciones: " . $e->getMessage() . "<br>";
}

// 4. Verificar actividad reciente
echo "<h2>4. Verificación de Actividad Reciente</h2>";
try {
    $pdo = createDatabaseConnection();
    
    // Últimas 10 respuestas
    $stmt = $pdo->query("
        SELECT 
            r.answeredat,
            u.firstname,
            u.username,
            r.iscorrect,
            r.points,
            r.responsetime
        FROM telegramresponse r
        JOIN telegramuser u ON r.userid = u.id
        ORDER BY r.answeredat DESC
        LIMIT 10
    ");
    
    $recent_responses = $stmt->fetchAll();
    
    if (count($recent_responses) > 0) {
        echo "📊 Últimas 10 respuestas:<br>";
        echo "<table border='1' style='margin: 10px 0; font-size: 12px;'>";
        echo "<tr><th>Usuario</th><th>Correcta</th><th>Puntos</th><th>Tiempo</th><th>Fecha</th></tr>";
        
        foreach ($recent_responses as $response) {
            $correct = $response['iscorrect'] ? '✅' : '❌';
            $date = date('Y-m-d H:i:s', strtotime($response['answeredat']));
            
            echo "<tr>";
            echo "<td>{$response['firstname']} (@{$response['username']})</td>";
            echo "<td>{$correct}</td>";
            echo "<td>{$response['points']}</td>";
            echo "<td>{$response['responsetime']}ms</td>";
            echo "<td>{$date}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "❌ No hay respuestas recientes<br>";
    }
} catch (Exception $e) {
    echo "❌ Error verificando actividad: " . $e->getMessage() . "<br>";
}

// 5. Recomendaciones
echo "<h2>5. Análisis y Recomendaciones</h2>";
echo "<ul>";

// Verificar si hay problemas de vinculación
$problematic_links = 0;
foreach ($verifications as $verification) {
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM telegramuser WHERE telegramuserid = ?");
    $stmt->execute([$verification->telegram_userid]);
    if ($stmt->fetch()['count'] == 0) {
        $problematic_links++;
    }
}

if ($problematic_links > 0) {
    echo "<li>❌ <strong>Problema crítico:</strong> $problematic_links vinculaciones con Telegram IDs inexistentes</li>";
    echo "<li>💡 <strong>Solución:</strong> Los usuarios necesitan re-vincular sus cuentas</li>";
}

// Verificar actividad
$stmt = $pdo->query("SELECT COUNT(*) as count FROM telegramresponse WHERE answeredat >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
$recent_activity = $stmt->fetch()['count'];

if ($recent_activity == 0) {
    echo "<li>❌ <strong>Problema:</strong> No hay actividad reciente (últimas 24h)</li>";
    echo "<li>💡 <strong>Solución:</strong> Verificar el scheduler de envío automático</li>";
} else {
    echo "<li>✅ <strong>Actividad reciente:</strong> $recent_activity respuestas en 24h</li>";
}

// Verificar datos disponibles
$stmt = $pdo->query("SELECT COUNT(*) as count FROM telegramuser");
$total_users = $stmt->fetch()['count'];

if ($total_users > 0) {
    echo "<li>✅ <strong>Datos disponibles:</strong> $total_users usuarios de Telegram</li>";
} else {
    echo "<li>❌ <strong>Problema:</strong> No hay usuarios de Telegram registrados</li>";
}

echo "</ul>";

echo "<h3>🔧 Próximos Pasos:</h3>";
echo "<ol>";
echo "<li>Corregir vinculaciones problemáticas</li>";
echo "<li>Verificar el scheduler de envío automático</li>";
echo "<li>Actualizar analytics.php para usar las tablas correctas</li>";
echo "<li>Probar la página de analytics con usuarios válidos</li>";
echo "</ol>";
?> 