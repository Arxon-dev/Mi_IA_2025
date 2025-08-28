<?php
/**
 * Simple test script to verify bridge connection
 */

require_once 'ml-analytics-bridge.php';

echo "<h2>🧪 Test de Conexión Bridge</h2>";

// Test 1: Direct connection to ngrok
echo "<h3>1. Test directo a ngrok</h3>";
$ngrokUrl = 'https://17f8023fc268.ngrok-free.app/api/moodle/ml-analytics-bridge';
echo "Conectando a: $ngrokUrl<br>";

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'ngrok-skip-browser-warning: true'
        ],
        'content' => json_encode(['action' => 'test_connection']),
        'timeout' => 10
    ]
]);

$response = file_get_contents($ngrokUrl, false, $context);
if ($response !== false) {
    echo "✅ Conexión exitosa<br>";
    echo "Respuesta: $response<br>";
    
    $decoded = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "JSON válido: ✅<br>";
        echo "Status: " . ($decoded['status'] ?? 'N/A') . "<br>";
        echo "Message: " . ($decoded['message'] ?? 'N/A') . "<br>";
    } else {
        echo "❌ Error JSON: " . json_last_error_msg() . "<br>";
    }
} else {
    echo "❌ Error de conexión<br>";
}

// Test 2: Using bridge class
echo "<h3>2. Test usando bridge class</h3>";
$bridge = new MLAnalyticsBridge();
$result = $bridge->testConnection();

echo "<p>Resultado del bridge:</p>";
echo "<pre>" . json_encode($result, JSON_PRETTY_PRINT) . "</pre>";

// Test 3: Test specific functions
echo "<h3>3. Test de funciones específicas</h3>";

echo "Probando análisis predictivo...<br>";
$predictiveResult = $bridge->getPredictiveData(123456);
if (isset($predictiveResult['error'])) {
    echo "Predictivo: ❌ " . $predictiveResult['message'] . "<br>";
} else {
    echo "Predictivo: ✅ " . json_encode($predictiveResult) . "<br>";
}

echo "Probando métricas de aprendizaje...<br>";
$learningResult = $bridge->getLearningMetrics(123456);
if (isset($learningResult['error'])) {
    echo "Aprendizaje: ❌ " . $learningResult['message'] . "<br>";
} else {
    echo "Aprendizaje: ✅ " . json_encode($learningResult) . "<br>";
}

// Test 4: System information
echo "<h3>4. Información del sistema</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "JSON Extension: " . (extension_loaded('json') ? '✅' : '❌') . "<br>";
echo "cURL Extension: " . (extension_loaded('curl') ? '✅' : '❌') . "<br>";
echo "OpenSSL Extension: " . (extension_loaded('openssl') ? '✅' : '❌') . "<br>";
echo "Stream Context Support: " . (function_exists('stream_context_create') ? '✅' : '❌') . "<br>";
?> 