<?php
// Simple error capture script

// Start output buffering
ob_start();

// Enable error reporting and logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/payment_errors.log');
error_reporting(E_ALL);

// Custom error handler
set_error_handler(function($severity, $message, $file, $line) {
    $error_msg = "[" . date('Y-m-d H:i:s') . "] Error: $message in $file on line $line\n";
    file_put_contents(__DIR__ . '/payment_errors.log', $error_msg, FILE_APPEND);
    echo "Error logged: $message\n";
});

// Custom exception handler
set_exception_handler(function($exception) {
    $error_msg = "[" . date('Y-m-d H:i:s') . "] Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine() . "\n";
    file_put_contents(__DIR__ . '/payment_errors.log', $error_msg, FILE_APPEND);
    echo "Exception logged: " . $exception->getMessage() . "\n";
});

echo "Starting payment.php execution...\n";

try {
    // Include the payment.php file
    include 'payment.php';
    echo "Payment.php executed successfully\n";
} catch (Exception $e) {
    echo "Exception caught: " . $e->getMessage() . "\n";
} catch (Error $e) {
    echo "Fatal error caught: " . $e->getMessage() . "\n";
}

// Get any output
$output = ob_get_clean();

// Write output to log file
file_put_contents(__DIR__ . '/payment_output.log', $output);

echo "Execution completed. Check payment_errors.log and payment_output.log for details.\n";
?>