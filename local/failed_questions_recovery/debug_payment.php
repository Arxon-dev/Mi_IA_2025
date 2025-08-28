<?php
// Simple debug script for payment page

require_once('../../config.php');

// Enable error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Debug Payment Page</h1>";

try {
    echo "<h2>1. Basic Checks</h2>";
    echo "Moodle config loaded: " . (defined('MOODLE_INTERNAL') ? 'YES' : 'NO') . "<br>";
    
    echo "<h2>2. Check database table</h2>";
    global $DB;
    
    $table_exists = $DB->get_manager()->table_exists('local_fqr_user_payments');
    echo "Table local_fqr_user_payments exists: " . ($table_exists ? 'YES' : 'NO') . "<br>";
    
    if (!$table_exists) {
        echo "<div style='color: red; font-weight: bold;'>ERROR: Table local_fqr_user_payments does not exist!</div>";
        echo "<p>This is likely the cause of the HTTP 500 error.</p>";
        echo "<p>You need to upgrade the plugin to create the missing table.</p>";
        echo "<p>Go to Site administration > Notifications to upgrade the plugin.</p>";
    } else {
        $count = $DB->count_records('local_fqr_user_payments');
        echo "Records in table: $count<br>";
    }
    
    echo "<h2>3. Check user login</h2>";
    if (isloggedin()) {
        echo "User is logged in: YES<br>";
        echo "User ID: " . $USER->id . "<br>";
        echo "Username: " . $USER->username . "<br>";
    } else {
        echo "User is logged in: NO<br>";
        echo "<div style='color: red;'>ERROR: User must be logged in to access payment page!</div>";
    }
    
    echo "<h2>4. Check payment_manager class</h2>";
    if (class_exists('\\local_failed_questions_recovery\\payment_manager')) {
        echo "payment_manager class exists: YES<br>";
        
        if (isloggedin() && $table_exists) {
            try {
                $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
                echo "has_user_paid() works: YES, result: " . ($has_paid ? 'TRUE' : 'FALSE') . "<br>";
            } catch (Exception $e) {
                echo "has_user_paid() error: " . $e->getMessage() . "<br>";
            }
            
            try {
                $payment_id = \local_failed_questions_recovery\payment_manager::initialize_payment($USER->id);
                echo "initialize_payment() works: YES, payment ID: $payment_id<br>";
            } catch (Exception $e) {
                echo "initialize_payment() error: " . $e->getMessage() . "<br>";
            }
        }
    } else {
        echo "payment_manager class exists: NO<br>";
        echo "<div style='color: red;'>ERROR: payment_manager class not found!</div>";
    }
    
    echo "<h2>5. Check capabilities</h2>";
    if (isloggedin()) {
        $context = context_system::instance();
        $has_capability = has_capability('local/failed_questions_recovery:use', $context);
        echo "Has capability: " . ($has_capability ? 'YES' : 'NO') . "<br>";
        
        if (!$has_capability) {
            echo "<div style='color: red;'>ERROR: User does not have required capability!</div>";
        }
    }
    
    echo "<h2>✅ Debug completed</h2>";
    
    if ($table_exists && isloggedin() && class_exists('\\local_failed_questions_recovery\\payment_manager')) {
        echo "<div style='color: green; font-weight: bold;'>All checks passed! The payment page should work.</div>";
        echo "<br><a href='payment.php' style='background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;'>Try payment.php again</a>";
    } else {
        echo "<div style='color: red; font-weight: bold;'>Issues found that need to be resolved.</div>";
    }
    
} catch (Exception $e) {
    echo "<h2>❌ Error occurred:</h2>";
    echo "Error: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
    echo "<h3>Stack trace:</h3>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}