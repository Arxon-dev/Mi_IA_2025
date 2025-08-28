<?php
// Test script to check .env file reading

require_once('../../config.php');

echo "<h2>Testing .env file reading</h2>";

// Check if .env file exists
$env_file = $CFG->dirroot . '/.env';
echo "<p>Checking .env file at: " . $env_file . "</p>";

if (file_exists($env_file)) {
    echo "<p style='color: green;'>✓ .env file exists</p>";
    
    $env_content = file_get_contents($env_file);
    echo "<p>File size: " . strlen($env_content) . " bytes</p>";
    
    // Look for PayPal client ID
    if (preg_match('/PAYPAL_CLIENT_ID=(.+)/', $env_content, $matches)) {
        $paypal_client_id = trim($matches[1]);
        echo "<p style='color: green;'>✓ PayPal Client ID found: " . substr($paypal_client_id, 0, 20) . "...</p>";
    } else {
        echo "<p style='color: red;'>✗ PayPal Client ID not found in .env</p>";
        
        // Show first few lines of .env for debugging
        $lines = explode("\n", $env_content);
        echo "<p>First 10 lines of .env file:</p>";
        echo "<pre>";
        for ($i = 0; $i < min(10, count($lines)); $i++) {
            echo htmlspecialchars($lines[$i]) . "\n";
        }
        echo "</pre>";
    }
} else {
    echo "<p style='color: red;'>✗ .env file does not exist</p>";
}

// Test Moodle config
$config_value = get_config('local_failed_questions_recovery', 'paypal_client_id');
echo "<p>Moodle config value: " . ($config_value ? 'Found' : 'Not found') . "</p>";

echo "<p><a href='payment.php'>Back to payment page</a></p>";
?>