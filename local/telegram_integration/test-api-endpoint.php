<?php
// Test para el nuevo endpoint API
echo "🔗 TESTING NEW API ENDPOINT\n";
echo "===========================\n";

// Simular parámetros GET
$_GET['action'] = 'get_predictive_data';
$_GET['userid'] = '2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f';
$_GET['format'] = 'json';
$_SERVER['REQUEST_METHOD'] = 'GET';

echo "📋 Test parameters:\n";
echo "Action: " . $_GET['action'] . "\n";
echo "UserID: " . $_GET['userid'] . "\n";
echo "Format: " . $_GET['format'] . "\n\n";

// Capturar la salida del endpoint
ob_start();

try {
    include(__DIR__ . '/analytics-api.php');
    $output = ob_get_contents();
    ob_end_clean();
    
    echo "📤 API Response:\n";
    echo "Length: " . strlen($output) . " characters\n";
    
    // Verificar si es JSON válido
    $json_data = json_decode($output, true);
    if ($json_data !== null) {
        echo "✅ Valid JSON received\n";
        echo "Keys: " . implode(', ', array_keys($json_data)) . "\n";
        
        if (isset($json_data['error'])) {
            echo "❌ Error in response: " . $json_data['error'] . "\n";
            if (isset($json_data['message'])) {
                echo "📋 Error message: " . $json_data['message'] . "\n";
            }
        } else {
            echo "✅ Success! Data received:\n";
            if (isset($json_data['success_probability'])) {
                echo "  - Success probability: " . $json_data['success_probability'] . "%\n";
            }
            if (isset($json_data['recommendations'])) {
                echo "  - Recommendations count: " . count($json_data['recommendations']) . "\n";
                if (!empty($json_data['recommendations'])) {
                    echo "  - First recommendation: " . $json_data['recommendations'][0] . "\n";
                }
            }
        }
    } else {
        echo "❌ Invalid JSON received\n";
        echo "JSON error: " . json_last_error_msg() . "\n";
    }
    
    echo "\n📋 Full Response:\n";
    echo $output . "\n";
    
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ Exception: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("-", 50) . "\n";

// Test via cURL (simulando una llamada real)
echo "\n🌐 Testing via cURL:\n";
$test_url = "https://campus.opomelilla.com/local/telegram_integration/analytics-api.php?action=get_predictive_data&userid=2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f&format=json";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $test_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Test Agent)');
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

echo "HTTP Code: $http_code\n";
echo "Content-Type: $content_type\n";
echo "Response Length: " . strlen($response) . "\n";

$json_data = json_decode($response, true);
if ($json_data !== null) {
    echo "✅ cURL: Valid JSON received\n";
    echo "Keys: " . implode(', ', array_keys($json_data)) . "\n";
} else {
    echo "❌ cURL: Invalid JSON\n";
    echo "First 200 chars: " . substr($response, 0, 200) . "\n";
}

echo "\n✅ Test completed\n";
?> 