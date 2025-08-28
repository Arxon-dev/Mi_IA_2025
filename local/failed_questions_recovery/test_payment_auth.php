<?php
// Script para probar payment.php sin require_login

// Activar visualización de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Test Payment Authentication</h1>";

try {
    // Cargar configuración de Moodle
    require_once('../../config.php');
    
    echo "<h2>1. Moodle Config</h2>";
    echo "Moodle loaded: " . (defined('MOODLE_INTERNAL') ? 'YES' : 'NO') . "<br>";
    
    // Verificar si el usuario está logueado
    echo "<h2>2. User Authentication</h2>";
    if (isloggedin()) {
        echo "User is logged in: YES<br>";
        echo "User ID: " . $USER->id . "<br>";
        echo "Username: " . $USER->username . "<br>";
        
        // Verificar capacidades
        $context = context_system::instance();
        $has_capability = has_capability('local/failed_questions_recovery:use', $context);
        echo "Has capability: " . ($has_capability ? 'YES' : 'NO') . "<br>";
        
        if ($has_capability) {
            echo "<h2>3. Payment Manager Test</h2>";
            
            // Cargar lib.php
            require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');
            echo "lib.php loaded: YES<br>";
            
            // Verificar clase payment_manager
            if (class_exists('\\local_failed_questions_recovery\\payment_manager')) {
                echo "payment_manager class exists: YES<br>";
                
                try {
                    $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
                    echo "has_user_paid() result: " . ($has_paid ? 'TRUE' : 'FALSE') . "<br>";
                    
                    $payment_id = \local_failed_questions_recovery\payment_manager::initialize_payment($USER->id);
                    echo "initialize_payment() result: $payment_id<br>";
                    
                    echo "<div style='color: green; font-weight: bold;'>✅ Payment system is working correctly!</div>";
                    echo "<p>The HTTP 500 error is likely caused by accessing payment.php without being logged in.</p>";
                    echo "<p>Users need to log in to Moodle first before accessing the payment page.</p>";
                    
                } catch (Exception $e) {
                    echo "<div style='color: red;'>❌ Error in payment_manager: " . $e->getMessage() . "</div>";
                }
            } else {
                echo "<div style='color: red;'>❌ payment_manager class not found</div>";
            }
        } else {
            echo "<div style='color: red;'>❌ User does not have required capability</div>";
        }
    } else {
        echo "User is logged in: NO<br>";
        echo "<div style='color: orange;'>⚠️ This explains the HTTP 500 error!</div>";
        echo "<p>The payment.php file requires users to be logged in to Moodle.</p>";
        echo "<p>When accessed without authentication, require_login() causes the error.</p>";
        echo "<p><strong>Solution:</strong> Users must log in to Moodle before accessing payment.php</p>";
    }
    
} catch (Exception $e) {
    echo "<h2>❌ Error occurred:</h2>";
    echo "Error: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . "<br>";
    echo "Line: " . $e->getLine() . "<br>";
    echo "<h3>Stack trace:</h3>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>