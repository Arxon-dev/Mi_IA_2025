<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Plugin administration pages are defined here.
 *
 * @package     local_telegram_integration
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    // Create settings page for the plugin
    $settings = new admin_settingpage('local_telegram_integration_settings', 
        get_string('settings_title', 'local_telegram_integration'));

    // Add the settings page to the local plugins category
    $ADMIN->add('localplugins', $settings);

    // General settings section
    $settings->add(new admin_setting_heading('local_telegram_integration/general',
        get_string('pluginname', 'local_telegram_integration'),
        get_string('description', 'local_telegram_integration')));

    // Telegram API URL setting
    $settings->add(new admin_setting_configtext('local_telegram_integration/telegram_api_url',
        get_string('telegram_api_url', 'local_telegram_integration'),
        get_string('telegram_api_url_desc', 'local_telegram_integration'),
        'http://localhost:3000/api/moodle/verify-code',
        PARAM_URL));

    // Bot Endpoint URL setting
    $settings->add(new admin_setting_configtext('local_telegram_integration/bot_endpoint_url',
        get_string('bot_endpoint_url', 'local_telegram_integration'),
        get_string('bot_endpoint_url_desc', 'local_telegram_integration'),
        'https://api.telegram.org/bot[YOUR_BOT_TOKEN]',
        PARAM_URL));

    // Webhook URL setting
    $settings->add(new admin_setting_configtext('local_telegram_integration/webhook_url',
        get_string('webhook_url', 'local_telegram_integration'),
        get_string('webhook_url_desc', 'local_telegram_integration'),
        'http://localhost:3000/api/moodle/quiz-webhook',
        PARAM_URL));
} 