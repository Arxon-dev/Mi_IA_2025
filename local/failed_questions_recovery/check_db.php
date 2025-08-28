<?php
// Quick database check
require_once('../../config.php');
require_login();

header('Content-Type: text/plain');

echo "=== DATABASE CHECK ===\n\n";

// Check if tables exist
$tables = [
    'local_failed_questions_recovery',
    'local_fqr_recovery_quizzes', 
    'local_fqr_recovery_attempts',
    'local_fqr_user_payments'
];

foreach ($tables as $table) {
    $exists = $DB->get_manager()->table_exists($table);
    echo "Table '$table': " . ($exists ? 'EXISTS' : 'MISSING') . "\n";
    
    if ($exists) {
        try {
            $count = $DB->count_records($table);
            echo "  Records: $count\n";
        } catch (Exception $e) {
            echo "  Error counting records: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n=== USER PAYMENT STATUS ===\n";
try {
    $payment_record = $DB->get_record('local_fqr_user_payments', ['userid' => $USER->id]);
    if ($payment_record) {
        echo "Payment record found:\n";
        echo "  Status: {$payment_record->payment_status}\n";
        echo "  Amount: {$payment_record->payment_amount}\n";
        echo "  Currency: {$payment_record->payment_currency}\n";
        echo "  Payment ID: " . ($payment_record->payment_id ?: 'NULL') . "\n";
        echo "  Created: " . date('Y-m-d H:i:s', $payment_record->timecreated) . "\n";
        echo "  Modified: " . date('Y-m-d H:i:s', $payment_record->timemodified) . "\n";
    } else {
        echo "No payment record found for user {$USER->id}\n";
    }
} catch (Exception $e) {
    echo "Error checking payment record: " . $e->getMessage() . "\n";
}

echo "\n=== PLUGIN VERSION ===\n";
$plugin = new stdClass();
require($CFG->dirroot . '/local/failed_questions_recovery/version.php');
echo "Plugin version: {$plugin->version}\n";
echo "Plugin release: {$plugin->release}\n";

echo "\nDone.\n";
?>