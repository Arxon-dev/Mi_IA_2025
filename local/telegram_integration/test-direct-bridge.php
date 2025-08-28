<?php
echo "<h2>🧪 Test Direct ML Bridge</h2>";

// Test the direct bridge endpoint
$url = 'https://campus.opomelilla.com/local/telegram_integration/direct-ml-bridge.php?action=test_connection';

echo "<h3>1. Testing Connection</h3>";
echo "URL: $url<br>";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode<br>";
if ($error) {
    echo "Curl Error: $error<br>";
}

echo "<h3>2. Response</h3>";
echo "<pre>" . htmlspecialchars($response) . "</pre>";

if ($httpCode === 200 && $response) {
    $data = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "<h3>3. Parsed JSON</h3>";
        echo "<pre>" . print_r($data, true) . "</pre>";
        
        if (isset($data['status']) && $data['status'] === 'success') {
            echo "<h3>✅ Success!</h3>";
            echo "Direct bridge is working correctly.";
        } else {
            echo "<h3>❌ Error in response</h3>";
        }
    } else {
        echo "<h3>❌ JSON Parse Error</h3>";
        echo "Error: " . json_last_error_msg();
    }
} else {
    echo "<h3>❌ Request Failed</h3>";
    echo "HTTP Code: $httpCode<br>";
    echo "Response: " . htmlspecialchars($response);
}

// Test with a real user ID
echo "<hr>";
echo "<h3>4. Testing with Real User ID (5793286375)</h3>";

$url2 = 'https://campus.opomelilla.com/local/telegram_integration/direct-ml-bridge.php?action=get_predictive_data&telegramUserId=5793286375';
echo "URL: $url2<br>";

$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, $url2);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_TIMEOUT, 30);
curl_setopt($ch2, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);

$response2 = curl_exec($ch2);
$httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
$error2 = curl_error($ch2);
curl_close($ch2);

echo "HTTP Code: $httpCode2<br>";
if ($error2) {
    echo "Curl Error: $error2<br>";
}

echo "<h3>5. Predictive Data Response</h3>";
echo "<pre>" . htmlspecialchars($response2) . "</pre>";

if ($httpCode2 === 200 && $response2) {
    $data2 = json_decode($response2, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "<h3>6. Parsed Predictive Data</h3>";
        echo "<pre>" . print_r($data2, true) . "</pre>";
    }
}
?> 