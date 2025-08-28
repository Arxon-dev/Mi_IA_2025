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
 * Payment manager class for Failed Questions Recovery plugin
 *
 * @package    local_failed_questions_recovery
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_failed_questions_recovery;

defined('MOODLE_INTERNAL') || die();

/**
 * Payment manager class
 */
class payment_manager {
    
    /**
     * Check if a user has paid for the plugin
     *
     * @param int $userid User ID to check
     * @return bool True if user has paid, false otherwise
     */
    public static function has_user_paid($userid) {
        global $DB;
        
        $record = $DB->get_record('local_fqr_user_payments', ['userid' => $userid]);
        
        if (!$record) {
            return false;
        }
        
        // Check if payment status is completed
        if ($record->payment_status === 'completed') {
            // Check if payment has expired (if expiry date is set)
            if (!empty($record->expiry_date) && $record->expiry_date < time()) {
                return false;
            }
            return true;
        }
        
        return false;
    }
    
    /**
     * Create or update a payment record for a user
     *
     * @param int $userid User ID
     * @param string $status Payment status
     * @param string $paymentid Payment ID from PayPal
     * @param float $amount Payment amount
     * @param string $currency Payment currency
     * @return bool Success or failure
     */
    public static function update_payment_record($userid, $status, $paymentid = null, $amount = 6.00, $currency = 'EUR') {
        global $DB;
        
        $time = time();
        $record = $DB->get_record('local_fqr_user_payments', ['userid' => $userid]);
        
        if ($record) {
            // Update existing record
            $record->payment_status = $status;
            if ($paymentid) {
                $record->payment_id = $paymentid;
            }
            $record->payment_amount = $amount;
            $record->payment_currency = $currency;
            
            if ($status === 'completed') {
                $record->payment_date = $time;
                // No expiry date for this implementation
                $record->expiry_date = null;
            }
            
            $record->timemodified = $time;
            
            return $DB->update_record('local_fqr_user_payments', $record);
        } else {
            // Create new record
            $record = new \stdClass();
            $record->userid = $userid;
            $record->payment_status = $status;
            $record->payment_amount = $amount;
            $record->payment_currency = $currency;
            $record->payment_id = $paymentid;
            $record->timecreated = $time;
            $record->timemodified = $time;
            
            if ($status === 'completed') {
                $record->payment_date = $time;
                // No expiry date for this implementation
                $record->expiry_date = null;
            }
            
            return $DB->insert_record('local_fqr_user_payments', $record) ? true : false;
        }
    }
    
    /**
     * Get payment record for a user
     *
     * @param int $userid User ID
     * @return object|false Payment record or false if not found
     */
    public static function get_payment_record($userid) {
        global $DB;
        
        return $DB->get_record('local_fqr_user_payments', ['userid' => $userid]);
    }
    
    /**
     * Initialize a payment for a user
     *
     * @param int $userid User ID
     * @return int Payment record ID
     */
    public static function initialize_payment($userid) {
        global $DB;
        
        // Check if user already has a payment record
        $record = $DB->get_record('local_fqr_user_payments', ['userid' => $userid]);
        
        if ($record) {
            // If payment is already completed, return the record ID
            if ($record->payment_status === 'completed') {
                return $record->id;
            }
            
            // Update existing record to pending
            $record->payment_status = 'pending';
            $record->timemodified = time();
            $DB->update_record('local_fqr_user_payments', $record);
            return $record->id;
        } else {
            // Create new payment record
            $time = time();
            $record = new \stdClass();
            $record->userid = $userid;
            $record->payment_status = 'pending';
            $record->payment_amount = 6.00;
            $record->payment_currency = 'EUR';
            $record->timecreated = $time;
            $record->timemodified = $time;
            
            return $DB->insert_record('local_fqr_user_payments', $record);
        }
    }
}