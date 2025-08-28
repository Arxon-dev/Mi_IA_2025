<?php
// Test simple via cURL para el endpoint API
echo "🌐 TESTING API VIA CURL\n";
echo "=======================\n";

$test_url = "https://campus.opomelilla.com/local/telegram_integration/analytics-api.php?action=get_predictive_data&userid=2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f&format=json";

echo "📡 Testing URL: $test_url\n\n";

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
$error = curl_error($ch);
curl_close($ch);

echo "📊 Response Details:\n";
echo "HTTP Code: $http_code\n";
echo "Content-Type: $content_type\n";
echo "Response Length: " . strlen($response) . "\n";
if ($error) {
    echo "cURL Error: $error\n";
}

echo "\n📝 Response Content:\n";
echo $response . "\n\n";

// Verificar JSON
$json_data = json_decode($response, true);
if ($json_data !== null) {
    echo "✅ Valid JSON received\n";
    echo "Keys: " . implode(', ', array_keys($json_data)) . "\n";
    
    if (isset($json_data['error'])) {
        echo "❌ Error: " . $json_data['error'] . "\n";
    } else {
        echo "✅ Success!\n";
        if (isset($json_data['success_probability'])) {
            echo "Success probability: " . $json_data['success_probability'] . "%\n";
        }
        if (isset($json_data['total_attempts'])) {
            echo "Total attempts: " . $json_data['total_attempts'] . "\n";
        }
        if (isset($json_data['accuracy'])) {
            echo "Accuracy: " . $json_data['accuracy'] . "%\n";
        }
    }
} else {
    echo "❌ Invalid JSON\n";
    echo "JSON Error: " . json_last_error_msg() . "\n";
}

echo "\n✅ Test completed\n";
?> 