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
 * Process payment for Failed Questions Recovery plugin
 *
 * @package    local_failed_questions_recovery
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');

// Check login
require_login();

// Check capability
$context = context_system::instance();
require_capability('local/failed_questions_recovery:use', $context);

// Check sesskey
if (!confirm_sesskey()) {
    $response = array(
        'status' => 'error',
        'message' => 'Invalid session key'
    );
    echo json_encode($response);
    die();
}

// Get payment data from POST
$payment_id = required_param('payment_id', PARAM_TEXT);
$status = required_param('status', PARAM_TEXT);
$amount = required_param('amount', PARAM_FLOAT);
$currency = required_param('currency', PARAM_TEXT);

// Log the received payment data for debugging
error_log("Payment data received: payment_id=$payment_id, status=$status, amount=$amount, currency=$currency");

// Validate payment status (PayPal can send 'COMPLETED' or 'CAPTURED')
if (!in_array($status, ['COMPLETED', 'CAPTURED'])) {
    $response = array(
        'status' => 'error',
        'message' => "Payment status is '$status', expected 'COMPLETED' or 'CAPTURED'"
    );
    echo json_encode($response);
    die();
}

// Update payment record
$result = \local_failed_questions_recovery\payment_manager::update_payment_record(
    $USER->id,
    'completed',
    $payment_id,
    $amount,
    $currency
);

if ($result) {
    try {
        // Log payment event
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
        
        $response = array(
            'status' => 'success',
            'message' => 'Payment processed successfully'
        );
    } catch (Exception $e) {
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

// Check if this is an AJAX request
$is_ajax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';

if ($is_ajax) {
    // Return JSON response for AJAX requests
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
} else {
    // Show professional HTML page for direct access
    if ($response['status'] === 'success') {
        show_payment_success_page($payment_id, $amount, $currency);
    } else {
        show_payment_error_page($response['message']);
    }
}

/**
 * Show professional payment success page
 */
function show_payment_success_page($payment_id, $amount, $currency) {
    global $PAGE, $OUTPUT, $CFG;
    
    $PAGE->set_context(context_system::instance());
    $PAGE->set_url(new moodle_url('/local/failed_questions_recovery/process_payment.php'));
    $PAGE->set_title(get_string('payment_success_title', 'local_failed_questions_recovery'));
    $PAGE->set_heading(get_string('payment_success_heading', 'local_failed_questions_recovery'));
    $PAGE->navbar->add(get_string('payment_success_title', 'local_failed_questions_recovery'));
    
    echo $OUTPUT->header();
    
    echo html_writer::start_div('payment-success-container', array('style' => 'max-width: 600px; margin: 40px auto; text-align: center;'));
    
    // Success icon
    echo html_writer::div(
        html_writer::tag('i', '', array('class' => 'fa fa-check-circle', 'style' => 'font-size: 80px; color: #28a745; margin-bottom: 20px;')),
        'success-icon'
    );
    
    // Success message
    echo html_writer::tag('h2', get_string('payment_success_heading', 'local_failed_questions_recovery'), array('style' => 'color: #28a745; margin-bottom: 20px;'));
    
    // Payment details
    echo html_writer::start_div('payment-details', array('style' => 'background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 30px; margin: 20px 0;'));
    echo html_writer::tag('h4', get_string('payment_details', 'local_failed_questions_recovery'), array('style' => 'margin-bottom: 20px; color: #495057;'));
    
    $details = html_writer::start_tag('table', array('style' => 'width: 100%; margin: 0 auto;'));
    $details .= html_writer::start_tag('tr');
    $details .= html_writer::tag('td', get_string('transaction_id', 'local_failed_questions_recovery') . ':', array('style' => 'padding: 8px; font-weight: bold; text-align: left;'));
    $details .= html_writer::tag('td', $payment_id, array('style' => 'padding: 8px; text-align: left; font-family: monospace; background: #e9ecef; border-radius: 4px;'));
    $details .= html_writer::end_tag('tr');
    
    $details .= html_writer::start_tag('tr');
    $details .= html_writer::tag('td', get_string('amount', 'local_failed_questions_recovery') . ':', array('style' => 'padding: 8px; font-weight: bold; text-align: left;'));
    $details .= html_writer::tag('td', number_format($amount, 2) . ' ' . $currency, array('style' => 'padding: 8px; text-align: left; font-size: 18px; color: #28a745; font-weight: bold;'));
    $details .= html_writer::end_tag('tr');
    
    $details .= html_writer::start_tag('tr');
    $details .= html_writer::tag('td', get_string('status', 'local_failed_questions_recovery') . ':', array('style' => 'padding: 8px; font-weight: bold; text-align: left;'));
    $details .= html_writer::tag('td', get_string('completed', 'local_failed_questions_recovery'), array('style' => 'padding: 8px; text-align: left; color: #28a745; font-weight: bold;'));
    $details .= html_writer::end_tag('tr');
    
    $details .= html_writer::start_tag('tr');
    $details .= html_writer::tag('td', get_string('date', 'local_failed_questions_recovery') . ':', array('style' => 'padding: 8px; font-weight: bold; text-align: left;'));
    $details .= html_writer::tag('td', date('d/m/Y H:i:s'), array('style' => 'padding: 8px; text-align: left;'));
    $details .= html_writer::end_tag('tr');
    
    $details .= html_writer::end_tag('table');
    echo $details;
    echo html_writer::end_div();
    
    // Success message
    echo html_writer::div(
        get_string('payment_success_message', 'local_failed_questions_recovery'),
        'success-message',
        array('style' => 'font-size: 16px; color: #495057; margin: 20px 0; line-height: 1.5;')
    );
    
    // Action buttons
    echo html_writer::start_div('action-buttons', array('style' => 'margin-top: 30px;'));
    
    $continue_url = new moodle_url('/local/failed_questions_recovery/index.php');
    echo html_writer::link(
        $continue_url,
        get_string('access_tools', 'local_failed_questions_recovery'),
        array(
            'class' => 'btn btn-primary btn-lg',
            'style' => 'margin: 10px; padding: 12px 30px; font-size: 16px; text-decoration: none;'
        )
    );
    
    $dashboard_url = new moodle_url('/my/');
    echo html_writer::link(
        $dashboard_url,
        get_string('go_to_dashboard', 'local_failed_questions_recovery'),
        array(
            'class' => 'btn btn-secondary btn-lg',
            'style' => 'margin: 10px; padding: 12px 30px; font-size: 16px; text-decoration: none;'
        )
    );
    
    echo html_writer::end_div();
    
    echo html_writer::end_div();
    
    echo $OUTPUT->footer();
    exit();
}

/**
 * Show professional payment error page
 */
function show_payment_error_page($error_message) {
    global $PAGE, $OUTPUT;
    
    $PAGE->set_context(context_system::instance());
    $PAGE->set_url(new moodle_url('/local/failed_questions_recovery/process_payment.php'));
    $PAGE->set_title(get_string('payment_error_title', 'local_failed_questions_recovery'));
    $PAGE->set_heading(get_string('payment_error_heading', 'local_failed_questions_recovery'));
    $PAGE->navbar->add(get_string('payment_error_title', 'local_failed_questions_recovery'));
    
    echo $OUTPUT->header();
    
    echo html_writer::start_div('payment-error-container', array('style' => 'max-width: 600px; margin: 40px auto; text-align: center;'));
    
    // Error icon
    echo html_writer::div(
        html_writer::tag('i', '', array('class' => 'fa fa-times-circle', 'style' => 'font-size: 80px; color: #dc3545; margin-bottom: 20px;')),
        'error-icon'
    );
    
    // Error message
    echo html_writer::tag('h2', get_string('payment_error_heading', 'local_failed_questions_recovery'), array('style' => 'color: #dc3545; margin-bottom: 20px;'));
    
    // Error details
    echo html_writer::div(
        $error_message,
        'error-message',
        array('style' => 'background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0; color: #721c24;')
    );
    
    // Action buttons
    echo html_writer::start_div('action-buttons', array('style' => 'margin-top: 30px;'));
    
    $retry_url = new moodle_url('/local/failed_questions_recovery/payment.php');
    echo html_writer::link(
        $retry_url,
        get_string('try_again', 'local_failed_questions_recovery'),
        array(
            'class' => 'btn btn-primary btn-lg',
            'style' => 'margin: 10px; padding: 12px 30px; font-size: 16px; text-decoration: none;'
        )
    );
    
    $contact_url = new moodle_url('/contact.php');
    echo html_writer::link(
        $contact_url,
        get_string('contact_support', 'local_failed_questions_recovery'),
        array(
            'class' => 'btn btn-secondary btn-lg',
            'style' => 'margin: 10px; padding: 12px 30px; font-size: 16px; text-decoration: none;'
        )
    );
    
    echo html_writer::end_div();
    
    echo html_writer::end_div();
    
    echo $OUTPUT->footer();
    exit();
}