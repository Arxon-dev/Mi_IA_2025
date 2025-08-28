<?php
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

// Ensure user is logged in
require_login();

global $USER, $DB;

echo "<h2>🎯 Test Final Fix</h2>";

// Test the function
function get_telegram_user_id($moodle_user_id) {
    global $DB;
    
    try {
        $record = $DB->get_record('local_telegram_verification', [
            'moodle_userid' => $moodle_user_id,
            'is_verified' => 1
        ], 'telegram_userid');
        
        return $record ? $record->telegram_userid : null;
    } catch (Exception $e) {
        return null;
    }
}

$telegram_user_id = get_telegram_user_id($USER->id);

echo "<h3>✅ Datos confirmados:</h3>";
echo "Moodle User ID: " . $USER->id . "<br>";
echo "Telegram User ID: " . $telegram_user_id . "<br>";

// Test AJAX endpoint directly
echo "<h3>🔍 Test AJAX Endpoint:</h3>";
$test_url = "https://campus.opomelilla.com/local/telegram_integration/analytics.php?action=get_predictive_data&format=json&userid=" . urlencode($telegram_user_id);
echo "URL de prueba: <a href='$test_url' target='_blank'>$test_url</a><br>";

// Test data availability
if ($telegram_user_id) {
    try {
        $pdo = createDatabaseConnection();
        
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM telegramresponse WHERE userid = ?");
        $stmt->execute([$telegram_user_id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "Respuestas en DB: " . $count['count'] . "<br>";
        
        if ($count['count'] > 0) {
            $stmt = $pdo->prepare("
                SELECT 
                    AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
                    AVG(responsetime) as avg_time
                FROM telegramresponse 
                WHERE userid = ?
            ");
            $stmt->execute([$telegram_user_id]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "Precisión calculada: " . round($stats['accuracy'], 2) . "%<br>";
            echo "Tiempo promedio: " . round($stats['avg_time'], 2) . "ms<br>";
        }
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "<br>";
    }
}

echo "<h3>🎯 Pasos siguientes:</h3>";
echo "1. Limpia el cache del navegador (Ctrl+F5)<br>";
echo "2. Ve a <a href='analytics.php'>analytics.php</a><br>";
echo "3. Abre la consola web (F12)<br>";
echo "4. Deberías ver: 👤 User ID: $telegram_user_id<br>";
echo "5. Y los datos reales en lugar de 0%<br>";
?>

<script>
// Test JavaScript data
console.log('🔍 Test Final Fix - JavaScript');
console.log('window.moodle_user_data:', window.moodle_user_data);

// Simular la función getUserId
function testGetUserId() {
    // Intentar obtener desde window.moodle_user_data
    if (window.moodle_user_data && window.moodle_user_data.userid) {
        return window.moodle_user_data.userid;
    }
    
    // Valor por defecto
    return '<?php echo $telegram_user_id; ?>';
}

const testUserId = testGetUserId();
console.log('🎯 Test User ID:', testUserId);
console.log('🎯 Type:', typeof testUserId);
</script> 