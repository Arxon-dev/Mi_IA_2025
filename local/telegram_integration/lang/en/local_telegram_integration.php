<?php
// This file is part of Moodle - http://moodle.org/

/**
 * English language strings for Telegram Integration plugin.
 *
 * @package     local_telegram_integration
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Telegram Integration';
$string['telegramintegration'] = 'Telegram Integration';

// General strings
$string['description'] = 'Connect your Moodle account with Telegram for unified gamification and progress tracking.';
$string['notconnected'] = 'Not connected to Telegram';
$string['connected'] = 'Connected to Telegram';
$string['connectiondate'] = 'Connected on: {$a}';

// Verification process
$string['generatecode'] = 'Generate Verification Code';
$string['verificationcode'] = 'Your verification code';
$string['codecreated'] = 'Verification code created successfully!';
$string['codeexpires'] = 'Code expires in 15 minutes';
$string['entercode'] = 'Enter verification code';
$string['verifycode'] = 'Verify Code';
$string['codeverified'] = 'Code verified successfully! Your accounts are now linked.';
$string['invalidcode'] = 'Invalid or expired verification code.';
$string['codeexpired'] = 'This verification code has expired. Please generate a new one.';

// Instructions
$string['instructions_title'] = 'How to connect your Telegram account:';
$string['step1'] = '1. Copy your verification code from below';
$string['step2'] = '2. Open Telegram and go to your study bot';
$string['step3'] = '3. Use the command /codigo_moodle';
$string['step4'] = '4. Follow the bot instructions to enter your code';
$string['step5'] = '5. Your accounts will be automatically linked!';

// Benefits
$string['benefits_title'] = 'Benefits of linking your accounts:';
$string['benefit1'] = '✅ Unified gamification system';
$string['benefit2'] = '✅ Combined progress tracking';
$string['benefit3'] = '✅ Real-time synchronization';
$string['benefit4'] = '✅ Enhanced learning analytics';
$string['benefit5'] = '✅ Cross-platform achievements';

// Status messages
$string['telegram_userid'] = 'Telegram User ID: {$a}';
$string['telegram_username'] = 'Telegram Username: @{$a}';
$string['sync_status'] = 'Sync Status: Active';
$string['last_activity'] = 'Last activity sync: {$a}';

// Errors
$string['error_generating_code'] = 'Error generating verification code. Please try again.';
$string['error_database'] = 'Database error occurred. Please contact administrator.';
$string['error_already_linked'] = 'This Telegram account is already linked to another user.';
$string['error_connection'] = 'Could not connect to Telegram services. Please try again later.';

// Settings
$string['settings_title'] = 'Telegram Integration Settings';
$string['telegram_api_url'] = 'Telegram API URL';
$string['telegram_api_url_desc'] = 'URL of your Telegram bot API endpoint';
$string['bot_endpoint_url'] = 'Bot Endpoint URL';
$string['bot_endpoint_url_desc'] = 'Full URL of your Telegram bot (https://api.telegram.org/bot[YOUR_TOKEN])';
$string['webhook_url'] = 'Webhook URL';
$string['webhook_url_desc'] = 'URL where quiz completion data will be sent';

// Privacy
$string['privacy:metadata'] = 'The Telegram Integration plugin stores user verification data to link Moodle and Telegram accounts.';
$string['privacy:metadata:local_telegram_verification'] = 'Stores verification codes and linking information.';
$string['privacy:metadata:local_telegram_verification:moodle_userid'] = 'The Moodle user ID.';
$string['privacy:metadata:local_telegram_verification:telegram_userid'] = 'The Telegram user ID.';
$string['privacy:metadata:local_telegram_verification:verification_code'] = 'The verification code used for linking.';
$string['privacy:metadata:local_telegram_verification:created_at'] = 'When the verification code was created.';

// Buttons
$string['disconnect'] = 'Disconnect from Telegram';
$string['reconnect'] = 'Reconnect to Telegram';
$string['refresh_status'] = 'Refresh Status'; 