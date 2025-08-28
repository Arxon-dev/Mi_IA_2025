<?php
// Test para verificar la corrección de autenticación AJAX
echo "🔐 TESTING AUTHENTICATION FIX\n";
echo "==============================\n";

$test_url = "https://campus.opomelilla.com/local/telegram_integration/analytics.php?action=get_predictive_data&format=json&userid=2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f";

echo "📡 Testing URL: $test_url\n\n";

// Primer test: Sin cookies (simulando usuario no autenticado)
echo "🔍 Test 1: Sin autenticación\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $test_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // No seguir redirects
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Test Agent)');
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

echo "HTTP Code: $http_code\n";
echo "Content-Type: $content_type\n";
echo "Response Length: " . strlen($response) . "\n";

// Verificar si es JSON válido
$json_data = json_decode($response, true);
if ($json_data !== null) {
    echo "✅ Valid JSON received\n";
    echo "Keys: " . implode(', ', array_keys($json_data)) . "\n";
    
    if (isset($json_data['error'])) {
        echo "📋 Error message: " . $json_data['error'] . "\n";
        if (isset($json_data['redirect'])) {
            echo "🔗 Redirect URL: " . $json_data['redirect'] . "\n";
        }
    }
} else {
    echo "❌ Invalid JSON\n";
    echo "First 200 chars: " . substr($response, 0, 200) . "\n";
}

echo "\n" . str_repeat("-", 50) . "\n\n";

// Segundo test: Verificar que las otras funciones también funcionan
$test_functions = [
    'get_learning_metrics',
    'get_optimization_data', 
    'get_social_data'
];

foreach ($test_functions as $function) {
    echo "🔍 Test: $function\n";
    
    $test_url_func = "https://campus.opomelilla.com/local/telegram_integration/analytics.php?action=$function&format=json&userid=2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $test_url_func);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Test Agent)');
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $json_data = json_decode($response, true);
    if ($json_data !== null) {
        echo "  ✅ JSON válido - Keys: " . implode(', ', array_keys($json_data)) . "\n";
        if (isset($json_data['error'])) {
            echo "  📋 Error: " . $json_data['error'] . "\n";
        }
    } else {
        echo "  ❌ JSON inválido (HTTP: $http_code)\n";
    }
}

echo "\n🎯 RESULTADO ESPERADO:\n";
echo "- Todas las funciones deberían devolver JSON válido\n";
echo "- Con error 'Usuario no autenticado' si no hay sesión\n";
echo "- Sin páginas HTML de login\n";

echo "\n✅ Test completed\n";
?> 