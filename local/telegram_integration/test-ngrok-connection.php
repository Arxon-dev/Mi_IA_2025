<?php
/**
 * Test ngrok connection from Moodle plugin
 */
require_once(__DIR__ . '/../../config.php');

// Check if user is logged in
require_login();

echo "<h2>🧪 Test Ngrok Connection</h2>";

// Test 1: Check if bridge is accessible
echo "<h3>1. Test Bridge Connection</h3>";

require_once 'ml-analytics-bridge.php';
$bridge = getBridge();

if ($bridge->isApiAccessible()) {
    echo "✅ Bridge conectado correctamente<br>";
    
    // Test 2: Get user verification
    global $USER, $DB;
    $verification = $DB->get_record('local_telegram_verification', [
        'moodle_userid' => $USER->id,
        'is_verified' => 1
    ]);
    
    if ($verification) {
        echo "✅ Usuario verificado: Telegram ID {$verification->telegram_userid}<br>";
        
        // Test 3: Get predictive data
        echo "<h3>2. Test Predictive Data</h3>";
        $result = $bridge->getPredictiveData($verification->telegram_userid);
        
        if (isset($result['error'])) {
            echo "❌ Error: " . $result['error'] . "<br>";
        } else {
            echo "✅ Datos predictivos obtenidos:<br>";
            echo "<pre>" . json_encode($result, JSON_PRETTY_PRINT) . "</pre>";
        }
        
        // Test 4: Get learning metrics
        echo "<h3>3. Test Learning Metrics</h3>";
        $metrics = $bridge->getLearningMetrics($verification->telegram_userid);
        
        if (isset($metrics['error'])) {
            echo "❌ Error: " . $metrics['error'] . "<br>";
        } else {
            echo "✅ Métricas de aprendizaje obtenidas:<br>";
            echo "<pre>" . json_encode($metrics, JSON_PRETTY_PRINT) . "</pre>";
        }
        
    } else {
        echo "❌ Usuario no verificado con Telegram<br>";
    }
    
} else {
    echo "❌ Bridge no accesible<br>";
    echo "Verificar que ngrok esté funcionando y la URL sea correcta<br>";
}

echo "<h3>4. Información del Sistema</h3>";
echo "🌐 URL actual: " . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] . "<br>";
echo "📱 User Agent: " . $_SERVER['HTTP_USER_AGENT'] . "<br>";
echo "🕒 Timestamp: " . date('Y-m-d H:i:s') . "<br>";
?> 