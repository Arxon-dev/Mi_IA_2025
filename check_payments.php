<?php
// Simple script to check payment records

// Database connection details from .env
$host = '145.223.38.91';
$dbname = 'u449034524_moodel_telegra';
$username = 'u449034524_opomelilla_25';
$password = 'Sirius//03072503//';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== PAYMENT RECORDS CHECK ===\n\n";
    
    // Get all payment records
    $stmt = $pdo->query("SELECT * FROM mdl_local_fqr_user_payments ORDER BY timecreated DESC");
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Also check for any test records that might have been cleaned up
    echo "=== CHECKING FOR TEST RECORDS ===\n";
    $test_stmt = $pdo->query("SELECT COUNT(*) as count FROM mdl_local_fqr_user_payments WHERE payment_id LIKE 'TEST_%'");
    $test_count = $test_stmt->fetch(PDO::FETCH_ASSOC);
    echo "Test records found: " . $test_count['count'] . "\n\n";
    
    if (empty($payments)) {
        echo "No payment records found.\n";
    } else {
        echo "Found " . count($payments) . " payment record(s):\n\n";
        
        foreach ($payments as $payment) {
            echo "Payment ID: " . ($payment['payment_id'] ?: 'NULL') . "\n";
            echo "User ID: " . $payment['userid'] . "\n";
            echo "Status: " . $payment['payment_status'] . "\n";
            echo "Amount: " . $payment['payment_amount'] . " " . $payment['payment_currency'] . "\n";
            echo "Created: " . date('Y-m-d H:i:s', $payment['timecreated']) . "\n";
            echo "Modified: " . date('Y-m-d H:i:s', $payment['timemodified']) . "\n";
            
            // Determine if payment is real or simulated
            if (strpos($payment['payment_id'], 'TEST_') === 0) {
                echo "Type: SIMULADO (Test payment)\n";
            } elseif (empty($payment['payment_id'])) {
                echo "Type: SIN PAYMENT_ID (Possibly simulated)\n";
            } else {
                echo "Type: POSIBLEMENTE REAL (Real PayPal transaction)\n";
            }
            
            echo "---\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
    echo "\nPlease check your database connection details in this script.\n";
}
?>