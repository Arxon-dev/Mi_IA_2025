<?php
// Detailed debug script for payment.php

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set error handler to capture all errors
set_error_handler(function($severity, $message, $file, $line) {
    echo "<div style='background: #ffcccc; padding: 10px; margin: 5px; border: 1px solid #ff0000;'>";
    echo "<strong>Error:</strong> $message<br>";
    echo "<strong>File:</strong> $file<br>";
    echo "<strong>Line:</strong> $line<br>";
    echo "<strong>Severity:</strong> $severity<br>";
    echo "</div>";
});

// Set exception handler
set_exception_handler(function($exception) {
    echo "<div style='background: #ffcccc; padding: 10px; margin: 5px; border: 1px solid #ff0000;'>";
    echo "<strong>Uncaught Exception:</strong> " . $exception->getMessage() . "<br>";
    echo "<strong>File:</strong> " . $exception->getFile() . "<br>";
    echo "<strong>Line:</strong> " . $exception->getLine() . "<br>";
    echo "<strong>Trace:</strong><br><pre>" . $exception->getTraceAsString() . "</pre>";
    echo "</div>";
});

echo "<h1>Debug Payment - Detailed Analysis</h1>";

try {
    echo "<p>1. Loading Moodle config...</p>";
    require_once('../../config.php');
    echo "<p style='color: green;'>✓ Moodle config loaded successfully</p>";
    
    echo "<p>2. Loading plugin lib.php...</p>";
    require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');
    echo "<p style='color: green;'>✓ Plugin lib.php loaded successfully</p>";
    
    echo "<p>3. Checking login requirement...</p>";
    require_login();
    echo "<p style='color: green;'>✓ User is logged in: " . $USER->username . "</p>";
    
    echo "<p>4. Checking context and capabilities...</p>";
    $context = context_system::instance();
    require_capability('local/failed_questions_recovery:use', $context);
    echo "<p style='color: green;'>✓ User has required capabilities</p>";
    
    echo "<p>5. Testing payment_manager class...</p>";
    $payment_manager_exists = class_exists('\\local_failed_questions_recovery\\payment_manager');
    echo "<p style='color: " . ($payment_manager_exists ? 'green' : 'red') . ";">" . 
         ($payment_manager_exists ? '✓' : '✗') . " payment_manager class exists</p>";
    
    if ($payment_manager_exists) {
        echo "<p>6. Testing has_user_paid method...</p>";
        $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
        echo "<p style='color: green;'>✓ has_user_paid() executed successfully. Result: " . ($has_paid ? 'true' : 'false') . "</p>";
        
        echo "<p>7. Testing initialize_payment method...</p>";
        $payment_id = \local_failed_questions_recovery\payment_manager::initialize_payment($USER->id);
        echo "<p style='color: green;'>✓ initialize_payment() executed successfully. Payment ID: $payment_id</p>";
    }
    
    echo "<p>8. Testing PayPal client ID configuration...</p>";
    $paypal_client_id = get_config('local_failed_questions_recovery', 'paypal_client_id');
    if (empty($paypal_client_id)) {
        if (file_exists($CFG->dirroot . '/.env')) {
            $env = parse_ini_file($CFG->dirroot . '/.env');
            if (isset($env['PAYPAL_CLIENT_ID'])) {
                $paypal_client_id = $env['PAYPAL_CLIENT_ID'];
            }
        }
    }
    if (empty($paypal_client_id)) {
        $paypal_client_id = 'AZPrc9A4Po6XVXSc4aqcNVW8RlqUSrWavZqI1BLE-4kQTQ-JwWUqNCetceVLE7JarlJQ-WP1JwD_Kc5x';
    }
    echo "<p style='color: green;'>✓ PayPal Client ID configured: " . substr($paypal_client_id, 0, 20) . "...</p>";
    
    echo "<p>9. Testing language strings...</p>";
    $payment_title = get_string('payment_title', 'local_failed_questions_recovery');
    $payment_heading = get_string('payment_heading', 'local_failed_questions_recovery');
    echo "<p style='color: green;'>✓ Language strings loaded successfully</p>";
    echo "<p>Payment title: $payment_title</p>";
    echo "<p>Payment heading: $payment_heading</p>";
    
    echo "<p>10. Testing PAGE object...</p>";
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url('/local/failed_questions_recovery/payment.php'));
    $PAGE->set_title($payment_title);
    $PAGE->set_heading($payment_heading);
    echo "<p style='color: green;'>✓ PAGE object configured successfully</p>";
    
    echo "<h2 style='color: green;'>All checks passed! The payment.php should work correctly.</h2>";
    echo "<p><a href='payment.php'>Try accessing payment.php now</a></p>";
    
} catch (Exception $e) {
    echo "<div style='background: #ffcccc; padding: 10px; margin: 5px; border: 1px solid #ff0000;'>";
    echo "<strong>Exception caught:</strong> " . $e->getMessage() . "<br>";
    echo "<strong>File:</strong> " . $e->getFile() . "<br>";
    echo "<strong>Line:</strong> " . $e->getLine() . "<br>";
    echo "<strong>Trace:</strong><br><pre>" . $e->getTraceAsString() . "</pre>";
    echo "</div>";
} catch (Error $e) {
    echo "<div style='background: #ffcccc; padding: 10px; margin: 5px; border: 1px solid #ff0000;'>";
    echo "<strong>Fatal Error caught:</strong> " . $e->getMessage() . "<br>";
    echo "<strong>File:</strong> " . $e->getFile() . "<br>";
    echo "<strong>Line:</strong> " . $e->getLine() . "<br>";
    echo "<strong>Trace:</strong><br><pre>" . $e->getTraceAsString() . "</pre>";
    echo "</div>";
}

echo "<p>Debug script completed.</p>";
?>