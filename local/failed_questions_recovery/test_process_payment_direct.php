<?php
// Test script to check process_payment.php directly

require_once('../../config.php');
require_login();

// Simulate POST data
$_POST['payment_id'] = 'TEST_' . time();
$_POST['status'] = 'COMPLETED';
$_POST['amount'] = '6.00';
$_POST['currency'] = 'EUR';
$_POST['sesskey'] = sesskey();

echo "<h2>Testing process_payment.php directly</h2>";
echo "<p>Simulating POST data:</p>";
echo "<pre>";
print_r($_POST);
echo "</pre>";

echo "<p>Including process_payment.php...</p>";

// Capture output
ob_start();
include 'process_payment.php';
$output = ob_get_clean();

echo "<p>Output from process_payment.php:</p>";
echo "<pre>" . htmlspecialchars($output) . "</pre>";

echo "<p><a href='payment.php'>Back to payment page</a></p>";
?>