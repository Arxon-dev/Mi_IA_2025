<?php
// Test payment processing debug
require_once('../../config.php');
require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');

// Check login
require_login();

// Check capability
$context = context_system::instance();
require_capability('local/failed_questions_recovery:use', $context);

header('Content-Type: text/html; charset=utf-8');
echo "<h2>Payment Debug Test</h2>";

// Test 1: Check if table exists
echo "<h3>1. Checking if payment table exists</h3>";
try {
    $table_exists = $DB->get_manager()->table_exists('local_fqr_user_payments');
    echo "Table exists: " . ($table_exists ? 'YES' : 'NO') . "<br>";
    
    if ($table_exists) {
        $count = $DB->count_records('local_fqr_user_payments');
        echo "Records in table: $count<br>";
        
        // Check user's payment record
        $user_record = $DB->get_record('local_fqr_user_payments', ['userid' => $USER->id]);
        if ($user_record) {
            echo "User payment record exists:<br>";
            echo "- Status: {$user_record->payment_status}<br>";
            echo "- Amount: {$user_record->payment_amount}<br>";
            echo "- Currency: {$user_record->payment_currency}<br>";
            echo "- Payment ID: " . ($user_record->payment_id ?: 'NULL') . "<br>";
        } else {
            echo "No payment record found for current user<br>";
        }
    }
} catch (Exception $e) {
    echo "Error checking table: " . $e->getMessage() . "<br>";
}

// Test 2: Check payment_manager class
echo "<h3>2. Testing payment_manager class</h3>";
try {
    $class_exists = class_exists('\\local_failed_questions_recovery\\payment_manager');
    echo "payment_manager class exists: " . ($class_exists ? 'YES' : 'NO') . "<br>";
    
    if ($class_exists) {
        $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
        echo "has_user_paid result: " . ($has_paid ? 'TRUE' : 'FALSE') . "<br>";
        
        $payment_id = \local_failed_questions_recovery\payment_manager::initialize_payment($USER->id);
        echo "initialize_payment result: $payment_id<br>";
    }
} catch (Exception $e) {
    echo "Error testing payment_manager: " . $e->getMessage() . "<br>";
}

// Test 3: Simulate payment processing
echo "<h3>3. Simulating payment processing</h3>";
try {
    $test_payment_id = 'TEST_' . time();
    $test_status = 'COMPLETED';
    $test_amount = 6.00;
    $test_currency = 'EUR';
    
    echo "Testing with: payment_id=$test_payment_id, status=$test_status, amount=$test_amount, currency=$test_currency<br>";
    
    $result = \local_failed_questions_recovery\payment_manager::update_payment_record(
        $USER->id,
        'completed',
        $test_payment_id,
        $test_amount,
        $test_currency
    );
    
    echo "update_payment_record result: " . ($result ? 'SUCCESS' : 'FAILED') . "<br>";
    
    if ($result) {
        // Check if record was actually updated
        $updated_record = $DB->get_record('local_fqr_user_payments', ['userid' => $USER->id]);
        if ($updated_record) {
            echo "Updated record:<br>";
            echo "- Status: {$updated_record->payment_status}<br>";
            echo "- Payment ID: {$updated_record->payment_id}<br>";
            echo "- Amount: {$updated_record->payment_amount}<br>";
        }
    }
} catch (Exception $e) {
    echo "Error simulating payment: " . $e->getMessage() . "<br>";
}

echo "<h3>4. Check recent error logs</h3>";
echo "<p>Check your Moodle error logs for entries starting with 'Payment processing -'</p>";
echo "<p>Log location is usually in your Moodle data directory or server error logs.</p>";

echo "<br><a href='payment.php'>Back to Payment Page</a>";
?>