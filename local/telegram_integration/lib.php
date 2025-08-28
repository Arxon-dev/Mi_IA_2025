<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Telegram Integration library functions - Compatibility wrapper.
 *
 * This file serves as a compatibility wrapper that includes the actual
 * library functions from locallib.php. This ensures all existing references
 * to lib.php continue to work without modification.
 *
 * @package     local_telegram_integration
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Include the actual library functions
require_once(__DIR__ . '/locallib.php'); 