<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Plugin version and other meta-data are defined here.
 *
 * @package     local_telegram_integration
 * @category    local
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_telegram_integration';
$plugin->version = 2025073110;              // The current plugin version (Date: YYYYMMDDXX).
$plugin->requires = 2024100700;             // Requires Moodle 4.5.
$plugin->supported = [45, 45];              // Moodle 4.5.x is supported.
$plugin->maturity = MATURITY_STABLE;
$plugin->release = 'v1.1.7';

$plugin->dependencies = array(); 