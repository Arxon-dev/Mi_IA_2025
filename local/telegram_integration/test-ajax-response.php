<?php
require_once(__DIR__ . '/../../config.php');

// Ensure user is logged in
require_login();

global $USER, $DB;

echo "<h2>🔍 Test AJAX Response</h2>";

// Get telegram user ID
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

echo "<h3>✅ Test Info:</h3>";
echo "Telegram User ID: " . $telegram_user_id . "<br><br>";

$endpoints = [
    'get_predictive_data',
    'get_learning_metrics', 
    'get_optimization_data',
    'get_social_data'
];

echo "<h3>🔍 Testing AJAX Endpoints:</h3>";

foreach ($endpoints as $endpoint) {
    $url = "https://campus.opomelilla.com/local/telegram_integration/analytics.php?action=$endpoint&format=json&userid=" . urlencode($telegram_user_id);
    
    echo "<h4>Testing: $endpoint</h4>";
    echo "URL: <a href='$url' target='_blank'>$url</a><br>";
    
    // Test with cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id());
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: $http_code<br>";
    
    if ($http_code == 200) {
        // Check if response is valid JSON
        $decoded = json_decode($response, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "✅ Valid JSON response<br>";
            echo "Keys: " . implode(', ', array_keys($decoded)) . "<br>";
        } else {
            echo "❌ Invalid JSON response<br>";
            echo "First 200 chars: " . htmlspecialchars(substr($response, 0, 200)) . "<br>";
        }
    } else {
        echo "❌ HTTP Error: $http_code<br>";
    }
    
    echo "<br>";
}

echo "<h3>🎯 Next Steps:</h3>";
echo "1. All endpoints should return valid JSON<br>";
echo "2. If any show HTML, there's still output being generated<br>";
echo "3. Check the analytics.php page after this test<br>";
?> 