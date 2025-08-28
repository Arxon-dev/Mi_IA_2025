<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Event observers for Telegram Integration plugin.
 *
 * @package     local_telegram_integration
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$observers = array(
    array(
        'eventname' => '\mod_quiz\event\attempt_submitted',
        'callback' => '\local_telegram_integration\observer::quiz_attempt_submitted',
    ),
    array(
        'eventname' => '\mod_quiz\event\attempt_reviewed',
        'callback' => '\local_telegram_integration\observer::quiz_attempt_reviewed',
    ),
    array(
        'eventname' => '\core\event\user_loggedin',
        'callback' => '\local_telegram_integration\observer::user_logged_in',
    ),
); 