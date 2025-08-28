<?php
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

echo "<h2>🔧 Corrección final de mapeo de usuarios</h2>";

try {
    $pdo = createDatabaseConnection();
    global $DB, $USER;
    
    echo "<h3>🔍 Diagnóstico del problema:</h3>";
    echo "El problema es que tenemos diferentes tipos de IDs:<br>";
    echo "- <strong>telegramuser.id</strong>: UUID (2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f)<br>";
    echo "- <strong>telegramresponse.userid</strong>: Numérico (2)<br>";
    echo "- <strong>Vinculación actual</strong>: Numérico (2)<br><br>";
    
    // Verificar datos actuales
    $stmt = $pdo->prepare("SELECT id FROM telegramuser WHERE id = '2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f'");
    $stmt->execute();
    $uuid_user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as responses FROM telegramresponse WHERE userid = '2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f'");
    $stmt->execute();
    $uuid_responses = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("SELECT COUNT(*) as responses FROM telegramresponse WHERE userid = '2'");
    $stmt->execute();
    $numeric_responses = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<h3>📊 Verificación de datos:</h3>";
    echo "- UUID (2bc3c62a...): " . $uuid_responses['responses'] . " respuestas<br>";
    echo "- Numérico (2): " . $numeric_responses['responses'] . " respuestas<br>";
    
    // Verificar vinculación actual
    $verification = $DB->get_record('local_telegram_verification', [
        'moodle_userid' => $USER->id,
        'is_verified' => 1
    ]);
    
    if ($verification) {
        echo "- Vinculación actual: " . $verification->telegram_userid . "<br>";
    }
    
    echo "<h3>🔧 Solución:</h3>";
    
    if ($uuid_responses['responses'] > 0) {
        echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
        echo "<strong>✅ USAR UUID:</strong> El UUID tiene " . $uuid_responses['responses'] . " respuestas<br>";
        echo "</div>";
        
        echo "<form method='post' style='margin: 10px 0;'>";
        echo "<input type='hidden' name='action' value='fix_to_uuid'>";
        echo "<input type='hidden' name='correct_telegram_id' value='2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f'>";
        echo "<button type='submit' style='background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;'>";
        echo "🔧 Usar UUID (2bc3c62a...)";
        echo "</button>";
        echo "</form>";
    } else if ($numeric_responses['responses'] > 0) {
        echo "<div style='background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
        echo "<strong>⚠️ USAR NUMÉRICO:</strong> El ID numérico tiene " . $numeric_responses['responses'] . " respuestas<br>";
        echo "Necesitamos mantener el ID numérico (2) pero verificar por qué no funciona<br>";
        echo "</div>";
        
        echo "<form method='post' style='margin: 10px 0;'>";
        echo "<input type='hidden' name='action' value='debug_numeric'>";
        echo "<button type='submit' style='background: #FFC107; color: black; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;'>";
        echo "🔍 Debuggear ID numérico";
        echo "</button>";
        echo "</form>";
    }
    
    // Manejar las acciones
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'fix_to_uuid') {
            $correct_telegram_id = $_POST['correct_telegram_id'];
            
            echo "<h3>🔧 Actualizando a UUID...</h3>";
            
            $update_result = $DB->update_record('local_telegram_verification', [
                'id' => $verification->id,
                'telegram_userid' => $correct_telegram_id,
                'updated_at' => time()
            ]);
            
            if ($update_result) {
                echo "<div style='background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
                echo "✅ <strong>Vinculación actualizada a UUID!</strong><br>";
                echo "- Nuevo Telegram ID: " . $correct_telegram_id . "<br>";
                echo "- Respuestas disponibles: " . $uuid_responses['responses'] . "<br>";
                echo "</div>";
            }
        } else if ($_POST['action'] === 'debug_numeric') {
            echo "<h3>🔍 Debug del ID numérico:</h3>";
            
            // Probar la consulta directamente
            $stmt = $pdo->prepare("
                SELECT 
                    AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as current_accuracy,
                    COUNT(*) as total_attempts
                FROM telegramresponse 
                WHERE userid = ?
            ");
            $stmt->execute(['2']);
            $debug_result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "- Consulta directa con ID '2': " . $debug_result['total_attempts'] . " respuestas<br>";
            echo "- Precisión calculada: " . round($debug_result['current_accuracy'], 2) . "%<br>";
            
            // Verificar tipos de datos
            $stmt = $pdo->prepare("SELECT userid, typeof(userid) as type FROM telegramresponse WHERE userid = '2' LIMIT 1");
            $stmt->execute();
            $type_check = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($type_check) {
                echo "- Tipo de userid en BD: " . ($type_check['type'] ?? 'unknown') . "<br>";
                echo "- Valor userid: '" . $type_check['userid'] . "'<br>";
            }
            
            echo "<div style='background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
            echo "🔍 <strong>Problema identificado:</strong><br>";
            echo "El sistema está pasando el ID como string '2' pero puede que necesite ser pasado de otra forma.<br>";
            echo "Vamos a probar con diferentes tipos de consulta.<br>";
            echo "</div>";
        }
    }
    
    echo "<h3>🎯 Próximos pasos:</h3>";
    echo "<ol>";
    echo "<li>Aplicar la corrección apropiada arriba</li>";
    echo "<li>Ir a <a href='analytics.php'>analytics.php</a> para verificar</li>";
    echo "<li>Si sigue sin funcionar, revisar los logs de JavaScript en la consola</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?> 