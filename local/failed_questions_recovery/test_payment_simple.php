<?php
// Simple test file to check if basic Moodle loading works

try {
    require_once('../../config.php');
    require_login();
    
    echo "<h1>Test Payment Page</h1>";
    echo "<p>Moodle loaded successfully!</p>";
    echo "<p>User ID: " . $USER->id . "</p>";
    echo "<p>User name: " . fullname($USER) . "</p>";
    
    // Test payment manager class
    if (class_exists('\\local_failed_questions_recovery\\payment_manager')) {
        echo "<p>Payment manager class exists!</p>";
        
        $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
        echo "<p>User has paid: " . ($has_paid ? 'YES' : 'NO') . "</p>";
    } else {
        echo "<p>ERROR: Payment manager class not found!</p>";
    }
    
} catch (Exception $e) {
    echo "<h1>Error</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "<p>File: " . $e->getFile() . "</p>";
    echo "<p>Line: " . $e->getLine() . "</p>";
}