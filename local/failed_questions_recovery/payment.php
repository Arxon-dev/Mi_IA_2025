<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Payment page for Failed Questions Recovery plugin - FIXED VERSION
 *
 * @package    local_failed_questions_recovery
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Error handling for production
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    // Step 1: Load Moodle config
    require_once('../../config.php');
    
    // Step 2: Load plugin lib
    require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');

    // Step 3: Check login
    require_login();
    
    // Step 4: Check capability
    $context = context_system::instance();
    require_capability('local/failed_questions_recovery:use', $context);
    
    // Step 5: Get PayPal client ID
    $paypal_client_id = get_config('local_failed_questions_recovery', 'paypal_client_id');
    if (empty($paypal_client_id)) {
        // Fallback to .env file if exists
        if (file_exists($CFG->dirroot . '/.env')) {
            $env_content = file_get_contents($CFG->dirroot . '/.env');
            if (preg_match('/PAYPAL_CLIENT_ID=(.+)/', $env_content, $matches)) {
                $paypal_client_id = trim($matches[1]);
            }
        }
    }
    
    // If no PayPal client ID is found, use the hardcoded one
    if (empty($paypal_client_id)) {
        $paypal_client_id = 'AZPrc9A4Po6XVXSc4aqcNVW8RlqUSrWavZqI1BLE-4kQTQ-JwWUqNCetceVLE7JarlJQ-WP1JwD_Kc5x';
    }
    
    // Step 6: Initialize payment
    $payment_id = \local_failed_questions_recovery\payment_manager::initialize_payment($USER->id);

    // Step 7: Set up page
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url('/local/failed_questions_recovery/payment.php'));
    $PAGE->set_title(get_string('payment_heading', 'local_failed_questions_recovery'));
    $PAGE->set_heading(get_string('payment_heading', 'local_failed_questions_recovery'));

    // Step 8: Add simplified PayPal integration
    $PAGE->requires->js_call_amd('core/first', 'init');
    
    echo $OUTPUT->header();

    // Payment content
    echo '<div class="container-fluid">';
    echo '<div class="row">';
    echo '<div class="col-md-8 offset-md-2">';
    echo '<div class="card">';
    echo '<div class="card-body">';
    echo '<div id="payment-message"></div>';
    echo '<div id="payment-container">';
    echo '<p>' . get_string('payment_required_desc', 'local_failed_questions_recovery') . '</p>';
    echo '<div class="alert alert-info" style="margin: 15px 0;">';
    echo '<i class="fa fa-info-circle"></i> ' . get_string('paypal_note', 'local_failed_questions_recovery');
    echo '</div>';
    echo '<div class="alert alert-warning" style="margin: 15px 0;">';
    echo '<i class="fa fa-mobile"></i> <strong>Dispositivos móviles:</strong> ' . get_string('mobile_payment_note', 'local_failed_questions_recovery');
    echo '</div>';
    
    // Simplified PayPal button container
    echo '<div id="paypal-button-container"></div>';
    echo '<div id="payment-status" style="margin-top: 20px;"></div>';
    
    echo '</div>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    echo '</div>';

    // Add PayPal SDK and simplified JavaScript
    echo '<script src="https://www.paypal.com/sdk/js?client-id=' . $paypal_client_id . '&currency=EUR&disable-funding=credit,card"></script>';
    echo '<script>';
    echo 'document.addEventListener("DOMContentLoaded", function() {';
    echo '    if (typeof paypal !== "undefined") {';
    echo '        paypal.Buttons({';
    echo '            style: {';
    echo '                shape: "rect",';
    echo '                color: "blue",';
    echo '                layout: "vertical",';
    echo '                label: "pay"';
    echo '            },';
    echo '            createOrder: function(data, actions) {';
    echo '                return actions.order.create({';
    echo '                    purchase_units: [{';
    echo '                        description: "Acceso a Recuperación de Preguntas Falladas",';
    echo '                        amount: {';
    echo '                            currency_code: "EUR",';
    echo '                            value: "6.00"';
    echo '                        }';
    echo '                    }]';
    echo '                });';
    echo '            },';
    echo '            onApprove: function(data, actions) {';
    echo '                document.getElementById("payment-status").innerHTML = "<div class=\"alert alert-info\">Procesando pago, por favor espere...</div>";';
    echo '                return actions.order.capture().then(function(orderData) {';
    echo '                    var transaction = orderData.purchase_units[0].payments.captures[0];';
    echo '                    var form = document.createElement("form");';
    echo '                    form.method = "POST";';
    echo '                    form.action = "process_payment.php";';
    echo '                    ';
    echo '                    var fields = {';
    echo '                        payment_id: transaction.id,';
    echo '                        status: transaction.status,';
    echo '                        amount: transaction.amount.value,';
    echo '                        currency: transaction.amount.currency_code,';
    echo '                        sesskey: "' . sesskey() . '"';
    echo '                    };';
    echo '                    ';
    echo '                    for (var key in fields) {';
    echo '                        var input = document.createElement("input");';
    echo '                        input.type = "hidden";';
    echo '                        input.name = key;';
    echo '                        input.value = fields[key];';
    echo '                        form.appendChild(input);';
    echo '                    }';
    echo '                    ';
    echo '                    document.body.appendChild(form);';
    echo '                    form.submit();';
    echo '                });';
    echo '            },';
    echo '            onCancel: function(data) {';
    echo '                document.getElementById("payment-status").innerHTML = "<div class=\"alert alert-warning\">Pago cancelado. Puede intentarlo de nuevo cuando lo desee.</div>";';
    echo '            },';
    echo '            onError: function(err) {';
    echo '                document.getElementById("payment-status").innerHTML = "<div class=\"alert alert-danger\">Error en el proceso de pago. Por favor, inténtelo de nuevo.</div>";';
    echo '            }';
    echo '        }).render("#paypal-button-container");';
    echo '    } else {';
    echo '        document.getElementById("payment-container").innerHTML = "<div class=\"alert alert-danger\">Error al cargar PayPal SDK. Por favor, recargue la página.</div>";';
    echo '    }';
    echo '});';
    echo '</script>';

    echo $OUTPUT->footer();

} catch (Exception $e) {
    // Log the error
    error_log("Payment page error: " . $e->getMessage() . " in " . $e->getFile() . " line " . $e->getLine());
    
    // Show user-friendly error
    echo "<!DOCTYPE html>";
    echo "<html><head><title>Error</title></head><body>";
    echo "<div style='padding: 20px; font-family: Arial, sans-serif;'>";
    echo "<h2>Error en la página de pago</h2>";
    echo "<p>Ha ocurrido un error al cargar la página de pago. Por favor:</p>";
    echo "<ul>";
    echo "<li>Asegúrese de estar logueado en el sistema</li>";
    echo "<li>Verifique que tiene permisos para acceder a esta funcionalidad</li>";
    echo "<li>Contacte al administrador si el problema persiste</li>";
    echo "</ul>";
    echo "<p><a href='../../'>Volver al inicio</a></p>";
    echo "<hr>";
    echo "<small>Error técnico: " . htmlspecialchars($e->getMessage()) . "</small>";
    echo "</div>";
    echo "</body></html>";
} catch (Error $e) {
    // Log fatal errors
    error_log("Payment page fatal error: " . $e->getMessage() . " in " . $e->getFile() . " line " . $e->getLine());
    
    // Show basic error page
    echo "<!DOCTYPE html>";
    echo "<html><head><title>Error Fatal</title></head><body>";
    echo "<div style='padding: 20px; font-family: Arial, sans-serif;'>";
    echo "<h2>Error Fatal</h2>";
    echo "<p>Ha ocurrido un error fatal. Por favor contacte al administrador.</p>";
    echo "<p><a href='../../'>Volver al inicio</a></p>";
    echo "</div>";
    echo "</body></html>";
}
?>