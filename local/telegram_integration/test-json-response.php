<?php
// Test para capturar la respuesta exacta de get_predictive_data
echo "🔍 JSON RESPONSE DEBUG\n";
echo "=====================\n";

$test_url = "https://campus.opomelilla.com/local/telegram_integration/analytics.php?action=get_predictive_data&format=json&userid=2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f";

echo "📡 Testing URL: $test_url\n\n";

// Usar cURL para capturar la respuesta exacta
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $test_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Test Agent)');
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

echo "📊 Response Details:\n";
echo "HTTP Code: $http_code\n";
echo "Content-Type: $content_type\n";
echo "Response Length: " . strlen($response) . " characters\n\n";

echo "📝 Raw Response (first 200 chars):\n";
echo "'" . substr($response, 0, 200) . "'\n\n";

echo "🔤 Character Analysis (first 50 chars):\n";
for ($i = 0; $i < min(50, strlen($response)); $i++) {
    $char = $response[$i];
    $ascii = ord($char);
    $display = ($ascii >= 32 && $ascii <= 126) ? $char : '\\x' . sprintf('%02x', $ascii);
    echo "[$i] '$display' (ASCII: $ascii)\n";
}

echo "\n🎯 Looking for JSON start...\n";
$json_start = strpos($response, '{');
if ($json_start !== false) {
    echo "JSON starts at position: $json_start\n";
    echo "Characters before JSON: '" . substr($response, 0, $json_start) . "'\n";
    
    $json_part = substr($response, $json_start);
    echo "JSON part (first 100 chars): '" . substr($json_part, 0, 100) . "'\n";
    
    // Intentar decodificar solo la parte JSON
    $json_data = json_decode($json_part, true);
    if ($json_data !== null) {
        echo "✅ JSON is valid when isolated\n";
        echo "Keys: " . implode(', ', array_keys($json_data)) . "\n";
    } else {
        echo "❌ JSON still invalid: " . json_last_error_msg() . "\n";
    }
} else {
    echo "❌ No JSON opening brace found\n";
}

echo "\n🔍 Looking for common problems...\n";

// Buscar BOM (Byte Order Mark)
if (substr($response, 0, 3) === "\xEF\xBB\xBF") {
    echo "❌ Found UTF-8 BOM at start\n";
}

// Buscar espacios en blanco al inicio
if (preg_match('/^(\s+)/', $response, $matches)) {
    echo "❌ Found whitespace at start: " . strlen($matches[1]) . " characters\n";
}

// Buscar HTML tags
if (strpos($response, '<') !== false) {
    echo "❌ Found HTML tags in response\n";
    preg_match_all('/<[^>]+>/', $response, $html_matches);
    echo "HTML tags found: " . implode(', ', array_slice($html_matches[0], 0, 5)) . "\n";
}

// Buscar warnings/notices de PHP
if (strpos($response, 'Warning:') !== false || strpos($response, 'Notice:') !== false) {
    echo "❌ Found PHP warnings/notices in response\n";
}

echo "\n📋 Full Response:\n";
echo "=================\n";
echo $response;
echo "\n=================\n";

echo "\n✅ Analysis complete\n";
?> 