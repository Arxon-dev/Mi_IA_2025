<?php
// Test AJAX debug - diagnosticar el error 404
require_once(__DIR__ . '/../../config.php');
require_login();

// Simular exactamente la misma solicitud que falla
$_GET['action'] = 'get_predictive_data';
$_GET['format'] = 'json';
$_GET['userid'] = '2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f';

echo "🔍 AJAX DEBUG TEST\n";
echo "==================\n";
echo "Action: " . $_GET['action'] . "\n";
echo "Format: " . $_GET['format'] . "\n";
echo "UserID: " . $_GET['userid'] . "\n\n";

// Verificar si el archivo analytics.php puede ser incluido
echo "📁 Testing file inclusion...\n";
if (file_exists(__DIR__ . '/analytics.php')) {
    echo "✅ analytics.php exists\n";
    
    // Capturar la salida
    ob_start();
    
    try {
        // Incluir analytics.php que debería procesar la solicitud AJAX
        include(__DIR__ . '/analytics.php');
        $output = ob_get_contents();
        ob_end_clean();
        
        echo "📤 Output received:\n";
        echo "Length: " . strlen($output) . " characters\n";
        echo "First 200 chars: " . substr($output, 0, 200) . "\n\n";
        
        // Verificar si es JSON válido
        $json_data = json_decode($output, true);
        if ($json_data !== null) {
            echo "✅ Valid JSON received\n";
            echo "JSON keys: " . implode(', ', array_keys($json_data)) . "\n";
        } else {
            echo "❌ Invalid JSON received\n";
            echo "JSON error: " . json_last_error_msg() . "\n";
        }
        
    } catch (Exception $e) {
        ob_end_clean();
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ analytics.php not found\n";
}

echo "\n🔗 Testing direct URL access...\n";
$test_url = "https://campus.opomelilla.com/local/telegram_integration/analytics.php?action=get_predictive_data&format=json&userid=2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f";
echo "URL: $test_url\n";

// Usar cURL para probar la URL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $test_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Test Agent)');

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $http_code\n";
echo "Response length: " . strlen($response) . "\n";
echo "First 300 chars: " . substr($response, 0, 300) . "\n";

if ($http_code === 404) {
    echo "\n❌ CONFIRMED: 404 error\n";
    echo "This suggests the URL routing or file access has an issue\n";
} else if ($http_code === 200) {
    echo "\n✅ HTTP 200 OK\n";
    $json_data = json_decode($response, true);
    if ($json_data !== null) {
        echo "✅ Valid JSON response\n";
    } else {
        echo "❌ Invalid JSON in response\n";
    }
}
?> 