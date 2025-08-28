<?php
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

echo "<h2>🔍 Verificación de datos de usuarios</h2>";

try {
    $pdo = createDatabaseConnection();
    
    // Verificar datos del usuario actual (ID 2)
    echo "<h3>👤 Usuario ID 2 (actual):</h3>";
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_responses,
            SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) as correct_responses,
            AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy
        FROM telegramresponse 
        WHERE userid = 2
    ");
    $stmt->execute();
    $user2_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user2_data['total_responses'] > 0) {
        echo "✅ Respuestas totales: " . $user2_data['total_responses'] . "<br>";
        echo "✅ Respuestas correctas: " . $user2_data['correct_responses'] . "<br>";
        echo "✅ Precisión: " . round($user2_data['accuracy'], 2) . "%<br>";
    } else {
        echo "❌ El usuario ID 2 no tiene respuestas registradas<br>";
    }
    
    // Verificar qué usuarios SÍ tienen datos
    echo "<h3>📊 Usuarios con más respuestas:</h3>";
    $stmt = $pdo->prepare("
        SELECT 
            userid,
            COUNT(*) as total_responses,
            SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) as correct_responses,
            AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy
        FROM telegramresponse 
        GROUP BY userid
        ORDER BY total_responses DESC
        LIMIT 10
    ");
    $stmt->execute();
    $top_users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>User ID</th><th>Respuestas</th><th>Correctas</th><th>Precisión</th></tr>";
    
    foreach ($top_users as $user) {
        echo "<tr>";
        echo "<td>" . $user['userid'] . "</td>";
        echo "<td>" . $user['total_responses'] . "</td>";
        echo "<td>" . $user['correct_responses'] . "</td>";
        echo "<td>" . round($user['accuracy'], 2) . "%</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Verificar si existe el usuario ID 2 en telegramuser
    echo "<h3>🔗 Verificación de vinculación:</h3>";
    $stmt = $pdo->prepare("SELECT * FROM telegramuser WHERE id = 2");
    $stmt->execute();
    $telegram_user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($telegram_user) {
        echo "✅ Usuario ID 2 existe en telegramuser<br>";
        echo "📧 Username: " . ($telegram_user['username'] ?? 'N/A') . "<br>";
    } else {
        echo "❌ Usuario ID 2 no existe en telegramuser<br>";
    }
    
    // Verificar vinculación con Moodle
    global $DB, $USER;
    echo "<h3>🎓 Usuario actual de Moodle:</h3>";
    echo "ID: " . $USER->id . "<br>";
    echo "Username: " . $USER->username . "<br>";
    echo "Email: " . $USER->email . "<br>";
    
    // Verificar si hay vinculación
    $verification = $DB->get_record('local_telegram_verification', [
        'moodle_userid' => $USER->id,
        'is_verified' => 1
    ]);
    
    if ($verification) {
        echo "✅ Usuario vinculado con Telegram ID: " . $verification->telegram_userid . "<br>";
        
        // Verificar datos de ese usuario vinculado
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as responses 
            FROM telegramresponse 
            WHERE userid = ?
        ");
        $stmt->execute([$verification->telegram_userid]);
        $linked_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "📊 Respuestas del usuario vinculado: " . $linked_data['responses'] . "<br>";
    } else {
        echo "❌ Usuario actual no está vinculado con Telegram<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?> 