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
 * Payment completed event for Failed Questions Recovery plugin
 *
 * @package    local_failed_questions_recovery
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_failed_questions_recovery\event;

defined('MOODLE_INTERNAL') || die();

/**
 * Payment completed event class
 */
class payment_completed extends \core\event\base {

    /**
     * Init method
     */
    protected function init() {
        $this->data['crud'] = 'c'; // Create
        $this->data['edulevel'] = self::LEVEL_OTHER;
        $this->data['objecttable'] = 'local_fqr_user_payments';
    }

    /**
     * Return localised event name
     *
     * @return string
     */
    public static function get_name() {
        return get_string('event_payment_completed', 'local_failed_questions_recovery');
    }

    /**
     * Returns description of what happened
     *
     * @return string
     */
    public function get_description() {
        return "The user with id '{$this->userid}' completed a payment of {$this->other['amount']} {$this->other['currency']} " .
               "with payment ID '{$this->other['payment_id']}' for the Failed Questions Recovery plugin.";
    }

    /**
     * Get URL related to the action
     *
     * @return \moodle_url
     */
    public function get_url() {
        return new \moodle_url('/local/failed_questions_recovery/index.php');
    }

    /**
     * Custom validation
     *
     * @throws \coding_exception
     * @return void
     */
    protected function validate_data() {
        parent::validate_data();
        
        if (!isset($this->other['payment_id'])) {
            throw new \coding_exception('The payment_id must be set in other.');
        }
        
        if (!isset($this->other['amount'])) {
            throw new \coding_exception('The amount must be set in other.');
        }
        
        if (!isset($this->other['currency'])) {
            throw new \coding_exception('The currency must be set in other.');
        }
    }
}