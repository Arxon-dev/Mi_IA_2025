<?php
// Test process payment simulation
require_once('../../config.php');
require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');

// Check login
require_login();

// Check capability
$context = context_system::instance();
require_capability('local/failed_questions_recovery:use', $context);

// Simulate the exact same process as process_payment.php
header('Content-Type: application/json');

try {
    // Simulate payment data (like what PayPal would send)
    $payment_id = 'TEST_PAYMENT_' . time();
    $status = 'COMPLETED';
    $amount = 6.00;
    $currency = 'EUR';
    
    // Log received data for debugging
    error_log("TEST Payment processing - Received data: payment_id=$payment_id, status=$status, amount=$amount, currency=$currency");
    
    // Validate payment status (PayPal uses 'COMPLETED' for captures)
    if ($status !== 'COMPLETED') {
        error_log("TEST Payment processing - Invalid status: $status (expected COMPLETED)");
        $response = array(
            'status' => 'error',
            'message' => "Payment status is '$status', expected 'COMPLETED'"
        );
        echo json_encode($response);
        exit();
    }
    
    // Update payment record
    error_log("TEST Payment processing - Attempting to update payment record for user {$USER->id}");
    $result = \local_failed_questions_recovery\payment_manager::update_payment_record(
        $USER->id,
        'completed',
        $payment_id,
        $amount,
        $currency
    );
    
    error_log("TEST Payment processing - Update payment record result: " . ($result ? 'SUCCESS' : 'FAILED'));
    
    if ($result) {
        try {
            // Log payment event
            error_log("TEST Payment processing - Creating payment completed event");
            $event = \local_failed_questions_recovery\event\payment_completed::create(array(
                'context' => $context,
                'userid' => $USER->id,
                'other' => array(
                    'payment_id' => $payment_id,
                    'amount' => $amount,
                    'currency' => $currency
                )
            ));
            $event->trigger();
            error_log("TEST Payment processing - Event triggered successfully");
            
            $response = array(
                'status' => 'success',
                'message' => 'Payment processed successfully'
            );
        } catch (Exception $e) {
            error_log("TEST Payment processing - Event error: " . $e->getMessage());
            $response = array(
                'status' => 'success',
                'message' => 'Payment processed successfully (event logging failed)'
            );
        }
    } else {
        $response = array(
            'status' => 'error',
            'message' => 'Failed to update payment record'
        );
    }
    
    // Return JSON response
    error_log("TEST Payment processing - Sending response: " . json_encode($response));
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("TEST Payment processing - Exception: " . $e->getMessage());
    $response = array(
        'status' => 'error',
        'message' => 'Exception: ' . $e->getMessage()
    );
    echo json_encode($response);
}

exit();
?>