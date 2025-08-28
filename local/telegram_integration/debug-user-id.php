<?php
require_once(__DIR__ . '/../../config.php');

// Ensure user is logged in
require_login();

global $USER, $DB;

echo "<h2>🔍 Debug User ID</h2>";

echo "<h3>👤 Usuario actual de Moodle:</h3>";
echo "ID: " . $USER->id . "<br>";
echo "Username: " . $USER->username . "<br>";
echo "Email: " . $USER->email . "<br><br>";

// Test the function
function get_telegram_user_id($moodle_user_id) {
    global $DB;
    
    try {
        echo "🔍 Buscando vinculación para Moodle ID: " . $moodle_user_id . "<br>";
        
        $record = $DB->get_record('local_telegram_verification', [
            'moodle_userid' => $moodle_user_id,
            'is_verified' => 1
        ], 'telegram_userid');
        
        if ($record) {
            echo "✅ Registro encontrado: " . $record->telegram_userid . "<br>";
            return $record->telegram_userid;
        } else {
            echo "❌ No se encontró registro de vinculación<br>";
            return null;
        }
    } catch (Exception $e) {
        echo "❌ Error: " . $e->getMessage() . "<br>";
        return null;
    }
}

echo "<h3>🔗 Prueba de función:</h3>";
$telegram_user_id = get_telegram_user_id($USER->id);

echo "<h3>📊 Resultado final:</h3>";
echo "Telegram User ID: " . ($telegram_user_id ?: "NULL") . "<br>";
echo "Valor para JavaScript: " . ($telegram_user_id ?: $USER->id) . "<br>";

// Test data availability
if ($telegram_user_id) {
    require_once(__DIR__ . '/db-config.php');
    
    echo "<h3>🔍 Verificación de datos:</h3>";
    try {
        $pdo = createDatabaseConnection();
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM telegramresponse WHERE userid = ?");
        $stmt->execute([$telegram_user_id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "Respuestas encontradas: " . $count['count'] . "<br>";
        
    } catch (Exception $e) {
        echo "Error verificando datos: " . $e->getMessage() . "<br>";
    }
}
?> 