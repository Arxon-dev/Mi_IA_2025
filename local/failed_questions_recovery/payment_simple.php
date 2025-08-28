<?php
// Simplified payment page for debugging

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    require_once('../../config.php');
    require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');
    
    // Check login
    require_login();
    
    // Check capability
    $context = context_system::instance();
    require_capability('local/failed_questions_recovery:use', $context);
    
    // Set up page
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url('/local/failed_questions_recovery/payment_simple.php'));
    $PAGE->set_title('Payment Test');
    $PAGE->set_heading('Payment Test');
    
    echo $OUTPUT->header();
    
    echo '<div class="container-fluid">';
    echo '<div class="row">';
    echo '<div class="col-md-8 offset-md-2">';
    echo '<div class="card">';
    echo '<div class="card-header">';
    echo '<h3>Payment Test Page</h3>';
    echo '</div>';
    echo '<div class="card-body">';
    
    // Test payment manager
    if (class_exists('\\local_failed_questions_recovery\\payment_manager')) {
        echo '<p><strong>✓ Payment manager class loaded successfully</strong></p>';
        
        $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
        echo '<p>User payment status: ' . ($has_paid ? '<span class="text-success">PAID</span>' : '<span class="text-danger">NOT PAID</span>') . '</p>';
        
        $payment_record = \local_failed_questions_recovery\payment_manager::get_payment_record($USER->id);
        if ($payment_record) {
            echo '<p>Payment record found:</p>';
            echo '<ul>';
            echo '<li>Status: ' . $payment_record->payment_status . '</li>';
            echo '<li>Amount: ' . $payment_record->payment_amount . ' ' . $payment_record->payment_currency . '</li>';
            echo '<li>Payment ID: ' . ($payment_record->payment_id ?: 'N/A') . '</li>';
            echo '</ul>';
        } else {
            echo '<p>No payment record found for this user.</p>';
        }
    } else {
        echo '<p><strong>✗ ERROR: Payment manager class not found!</strong></p>';
    }
    
    echo '<hr>';
    echo '<p><a href="payment.php" class="btn btn-primary">Go to Full Payment Page</a></p>';
    echo '<p><a href="index.php" class="btn btn-secondary">Back to Dashboard</a></p>';
    
    echo '</div>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    echo $OUTPUT->footer();
    
} catch (Exception $e) {
    echo "<div class='alert alert-danger'>";
    echo "<h4>Error Details:</h4>";
    echo "<p><strong>Message:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>File:</strong> " . $e->getFile() . "</p>";
    echo "<p><strong>Line:</strong> " . $e->getLine() . "</p>";
    echo "<p><strong>Trace:</strong></p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
    echo "</div>";
    error_log("Payment simple page error: " . $e->getMessage() . " in " . $e->getFile() . " line " . $e->getLine());
}