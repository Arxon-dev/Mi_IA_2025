<?php
// Debug version of payment.php with error handling

// Enable all error reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Payment Debug Mode</h1>";
echo "<p>Starting payment.php execution with debug...</p>";

try {
    echo "<p>1. Loading Moodle config...</p>";
    require_once('../../config.php');
    echo "<p style='color: green;'>✓ Config loaded</p>";
    
    echo "<p>2. Loading lib.php...</p>";
    require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');
    echo "<p style='color: green;'>✓ Lib loaded</p>";
    
    echo "<p>3. Getting PayPal client ID...</p>";
    $paypal_client_id = get_config('local_failed_questions_recovery', 'paypal_client_id');
    if (empty($paypal_client_id)) {
        if (file_exists($CFG->dirroot . '/.env')) {
            $env = parse_ini_file($CFG->dirroot . '/.env');
            if (isset($env['PAYPAL_CLIENT_ID'])) {
                $paypal_client_id = $env['PAYPAL_CLIENT_ID'];
            }
        }
    }
    if (empty($paypal_client_id)) {
        $paypal_client_id = 'AZPrc9A4Po6XVXSc4aqcNVW8RlqUSrWavZqI1BLE-4kQTQ-JwWUqNCetceVLE7JarlJQ-WP1JwD_Kc5x';
    }
    echo "<p style='color: green;'>✓ PayPal client ID: " . substr($paypal_client_id, 0, 20) . "...</p>";
    
    echo "<p>4. Checking login...</p>";
    require_login();
    echo "<p style='color: green;'>✓ User logged in: " . $USER->username . "</p>";
    
    echo "<p>5. Checking capabilities...</p>";
    $context = context_system::instance();
    require_capability('local/failed_questions_recovery:use', $context);
    echo "<p style='color: green;'>✓ Capabilities OK</p>";
    
    echo "<p>6. Initializing payment...</p>";
    $payment_id = \local_failed_questions_recovery\payment_manager::initialize_payment($USER->id);
    echo "<p style='color: green;'>✓ Payment initialized: $payment_id</p>";
    
    echo "<p>7. Setting up page...</p>";
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url('/local/failed_questions_recovery/payment_debug.php'));
    $PAGE->set_title(get_string('payment_title', 'local_failed_questions_recovery'));
    $PAGE->set_heading(get_string('payment_heading', 'local_failed_questions_recovery'));
    echo "<p style='color: green;'>✓ Page setup complete</p>";
    
    echo "<p>8. Adding PayPal SDK...</p>";
    $PAGE->requires->js_amd_inline("
        require(['jquery'], function($) {
            console.log('PayPal SDK loading...');
            var script = document.createElement('script');
            script.src = 'https://www.paypal.com/sdk/js?client-id=$paypal_client_id&currency=EUR&disable-funding=credit,card';
            script.setAttribute('data-sdk-integration-source', 'button-factory');
            document.head.appendChild(script);
            
            script.onload = function() {
                console.log('PayPal SDK loaded successfully');
                // Simplified PayPal button for testing
                paypal.Buttons({
                    createOrder: function(data, actions) {
                        return actions.order.create({
                            purchase_units: [{
                                description: 'Test Payment',
                                amount: {
                                    currency_code: 'EUR',
                                    value: '6.00'
                                }
                            }]
                        });
                    },
                    onApprove: function(data, actions) {
                        alert('Payment approved! (Test mode)');
                    },
                    onError: function(err) {
                        console.error('PayPal error:', err);
                        alert('PayPal error: ' + err);
                    }
                }).render('#paypal-button-container');
            };
            
            script.onerror = function() {
                console.error('Failed to load PayPal SDK');
                alert('Failed to load PayPal SDK');
            };
        });
    ");
    echo "<p style='color: green;'>✓ PayPal SDK added</p>";
    
    echo "<p>9. Outputting header...</p>";
    echo $OUTPUT->header();
    echo "<p style='color: green;'>✓ Header output</p>";
    
    echo "<p>10. Checking payment status...</p>";
    if (\local_failed_questions_recovery\payment_manager::has_user_paid($USER->id)) {
        echo '<div class="alert alert-success">Ya has realizado el pago. Puedes acceder a todas las funcionalidades.</div>';
        echo '<div class="text-center mt-4"><a href="index.php" class="btn btn-primary">Volver al Panel</a></div>';
    } else {
        echo '<div class="container">';
        echo '<h2>Página de Pago (Modo Debug)</h2>';
        echo '<p>Esta es la página de pago en modo debug. El PayPal está configurado pero simplificado para testing.</p>';
        echo '<div id="paypal-button-container"></div>';
        echo '</div>';
    }
    
    echo "<p style='color: green;'>✓ Payment status checked and content displayed</p>";
    
    echo $OUTPUT->footer();
    echo "<p style='color: green;'>✓ Footer output</p>";
    
    echo "<h2 style='color: green;'>SUCCESS: Payment page executed without errors!</h2>";
    
} catch (Exception $e) {
    echo "<div style='background: #ffcccc; padding: 10px; margin: 5px; border: 1px solid #ff0000;'>";
    echo "<strong>Exception:</strong> " . $e->getMessage() . "<br>";
    echo "<strong>File:</strong> " . $e->getFile() . "<br>";
    echo "<strong>Line:</strong> " . $e->getLine() . "<br>";
    echo "<strong>Trace:</strong><br><pre>" . $e->getTraceAsString() . "</pre>";
    echo "</div>";
} catch (Error $e) {
    echo "<div style='background: #ffcccc; padding: 10px; margin: 5px; border: 1px solid #ff0000;'>";
    echo "<strong>Fatal Error:</strong> " . $e->getMessage() . "<br>";
    echo "<strong>File:</strong> " . $e->getFile() . "<br>";
    echo "<strong>Line:</strong> " . $e->getLine() . "<br>";
    echo "<strong>Trace:</strong><br><pre>" . $e->getTraceAsString() . "</pre>";
    echo "</div>";
}
?>