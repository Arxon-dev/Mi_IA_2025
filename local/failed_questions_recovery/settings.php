<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_failed_questions_recovery', 
        get_string('pluginname', 'local_failed_questions_recovery'));
    
    // Configuración de logging
    $settings->add(new admin_setting_configcheckbox(
        'local_failed_questions_recovery/enable_logging',
        get_string('enable_logging', 'local_failed_questions_recovery'),
        get_string('enable_logging_desc', 'local_failed_questions_recovery'),
        1
    ));
    
    // Configuración del número de preguntas por quiz de recuperación
    $settings->add(new admin_setting_configtext(
        'local_failed_questions_recovery/default_quiz_questions',
        get_string('default_quiz_questions', 'local_failed_questions_recovery'),
        get_string('default_quiz_questions_desc', 'local_failed_questions_recovery'),
        10,
        PARAM_INT
    ));
    
    // Configuración de limpieza automática
    $settings->add(new admin_setting_configtext(
        'local_failed_questions_recovery/cleanup_days',
        get_string('cleanup_days', 'local_failed_questions_recovery'),
        get_string('cleanup_days_desc', 'local_failed_questions_recovery'),
        30,
        PARAM_INT
    ));
    
    // Configuración de PayPal
    $settings->add(new admin_setting_heading(
        'local_failed_questions_recovery/payment_settings',
        get_string('payment_settings', 'local_failed_questions_recovery'),
        get_string('payment_settings_desc', 'local_failed_questions_recovery')
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_failed_questions_recovery/paypal_client_id',
        get_string('paypal_client_id', 'local_failed_questions_recovery'),
        get_string('paypal_client_id_desc', 'local_failed_questions_recovery'),
        '',
        PARAM_TEXT
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_failed_questions_recovery/enable_payments',
        get_string('enable_payments', 'local_failed_questions_recovery'),
        get_string('enable_payments_desc', 'local_failed_questions_recovery'),
        1
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_failed_questions_recovery/payment_amount',
        get_string('payment_amount', 'local_failed_questions_recovery'),
        get_string('payment_amount_desc', 'local_failed_questions_recovery'),
        '6.00',
        PARAM_TEXT
    ));
    
    $ADMIN->add('localplugins', $settings);
}