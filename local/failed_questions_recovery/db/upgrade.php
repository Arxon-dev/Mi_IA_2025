<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Plugin upgrade steps are defined here.
 *
 * @package     local_failed_questions_recovery
 */

function xmldb_local_failed_questions_recovery_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2024122713) {
        // Define table local_fqr_user_payments
        $table = new xmldb_table('local_fqr_user_payments');

        // Adding fields
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('payment_status', XMLDB_TYPE_CHAR, '50', null, XMLDB_NOTNULL, null, 'pending');
        $table->add_field('payment_amount', XMLDB_TYPE_NUMBER, '10, 2', null, XMLDB_NOTNULL, null, '6.00');
        $table->add_field('payment_currency', XMLDB_TYPE_CHAR, '3', null, XMLDB_NOTNULL, null, 'EUR');
        $table->add_field('payment_id', XMLDB_TYPE_CHAR, '255', null, null, null, null);
        $table->add_field('payment_date', XMLDB_TYPE_INTEGER, '10', null, null, null, null);
        $table->add_field('expiry_date', XMLDB_TYPE_INTEGER, '10', null, null, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);

        // Adding keys
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('fk_payments_userid', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);

        // Adding indexes
        $table->add_index('payment_id_idx', XMLDB_INDEX_NOTUNIQUE, ['payment_id']);

        // Create the table
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122713, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122714) {
        // Fix the key collision issue in the payments table if it exists
        $table = new xmldb_table('local_fqr_user_payments');
        
        if ($dbman->table_exists($table)) {
            // Check if the old key exists and drop it
            $key = new xmldb_key('userid', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
            if ($dbman->find_key_name($table, $key)) {
                $dbman->drop_key($table, $key);
            }
            
            // Add the new key with a different name if it doesn't exist
            $newkey = new xmldb_key('fk_userid', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
            if (!$dbman->find_key_name($table, $newkey)) {
                $dbman->add_key($table, $newkey);
            }
        }
        
        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122714, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122715) {
        // Fix the index collision issue in the payments table if it exists
        $table = new xmldb_table('local_fqr_user_payments');
        
        if ($dbman->table_exists($table)) {
            // Check if the old index exists and drop it
            $index = new xmldb_index('userid_idx', XMLDB_INDEX_UNIQUE, ['userid']);
            if ($dbman->index_exists($table, $index)) {
                $dbman->drop_index($table, $index);
            }
            
            // Add the new index with a different name if it doesn't exist
            $newindex = new xmldb_index('user_payment_unique', XMLDB_INDEX_UNIQUE, ['userid']);
            if (!$dbman->index_exists($table, $newindex)) {
                $dbman->add_index($table, $newindex);
            }
        }
        
        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122715, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122716) {
        // Fix the key collision issue with the index in the payments table if it exists
        $table = new xmldb_table('local_fqr_user_payments');
        
        if ($dbman->table_exists($table)) {
            // Check if the old key exists and drop it
            $key = new xmldb_key('fk_userid', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
            if ($dbman->find_key_name($table, $key)) {
                $dbman->drop_key($table, $key);
            }
            
            // Add the new key with a different name if it doesn't exist
            $newkey = new xmldb_key('fk_payments_userid', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
            if (!$dbman->find_key_name($table, $newkey)) {
                $dbman->add_key($table, $newkey);
            }
        }
        
        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122716, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122717) {
        // Remove the problematic unique index that collides with foreign key
        $table = new xmldb_table('local_fqr_user_payments');
        
        if ($dbman->table_exists($table)) {
            // Check if the old index exists and drop it
            $index = new xmldb_index('user_payment_idx', XMLDB_INDEX_UNIQUE, ['userid']);
            if ($dbman->index_exists($table, $index)) {
                $dbman->drop_index($table, $index);
            }
            
            // Also drop the user_payment_unique index if it exists
            $uniqueindex = new xmldb_index('user_payment_unique', XMLDB_INDEX_UNIQUE, ['userid']);
            if ($dbman->index_exists($table, $uniqueindex)) {
                $dbman->drop_index($table, $uniqueindex);
            }
        }
        
        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122717, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122718) {
        // Fix the final key collision issue by renaming the foreign key in the payments table
        $table = new xmldb_table('local_fqr_user_payments');
        
        if ($dbman->table_exists($table)) {
            // Check if the old key exists and drop it
            $key = new xmldb_key('fk_user_payment', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
            if ($dbman->find_key_name($table, $key)) {
                $dbman->drop_key($table, $key);
            }
            
            // Add the new key with a completely different name if it doesn't exist
            $newkey = new xmldb_key('fk_payments_userid', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
            if (!$dbman->find_key_name($table, $newkey)) {
                $dbman->add_key($table, $newkey);
            }
        }
        
        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122718, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122719) {
        // Final cleanup: ensure no conflicting indexes remain
        $table = new xmldb_table('local_fqr_user_payments');
        
        if ($dbman->table_exists($table)) {
            // Remove any remaining unique indexes on userid field that could conflict with foreign key
            $indexes_to_remove = ['user_payment_idx', 'user_payment_unique'];
            
            foreach ($indexes_to_remove as $index_name) {
                $index = new xmldb_index($index_name, XMLDB_INDEX_UNIQUE, ['userid']);
                if ($dbman->index_exists($table, $index)) {
                    $dbman->drop_index($table, $index);
                }
            }
        }
        
        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122719, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122722) {
        // Force language string cache refresh for new payment page translations
        // This ensures the new payment success and error page strings are loaded
        
        // Clear language string cache
        $cache = cache::make('core', 'string');
        $cache->purge();
        
        // Also clear the language cache if it exists
        if (function_exists('get_string_manager')) {
            get_string_manager()->reset_caches();
        }
        
        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122722, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122723) {
        // Force language string cache refresh for capitalization fixes in Spanish strings
        // This ensures the corrected Spanish language strings are loaded
        
        // Clear language string cache
        $cache = cache::make('core', 'string');
        $cache->purge();
        
        // Also clear the language cache if it exists
        if (function_exists('get_string_manager')) {
            get_string_manager()->reset_caches();
        }
        
        // Update plugin version
        upgrade_plugin_savepoint(true, 2024122723, 'local', 'failed_questions_recovery');
    }
    
    if ($oldversion < 2024122724) {
        // Clear language string cache to ensure new PayPal note strings are loaded
        get_string_manager()->reset_caches();
        purge_all_caches();
        
        upgrade_plugin_savepoint(true, 2024122724, 'local', 'failed_questions_recovery');
    }

    if ($oldversion < 2024122725) {
        // Clear language string cache to ensure syntax error fix is loaded
        get_string_manager()->reset_caches();
        purge_all_caches();
        
        upgrade_plugin_savepoint(true, 2024122725, 'local', 'failed_questions_recovery');
    }

    if ($oldversion < 2024122726) {
        // Clear language string cache to ensure mobile payment note strings are loaded
        get_string_manager()->reset_caches();
        purge_all_caches();
        
        upgrade_plugin_savepoint(true, 2024122726, 'local', 'failed_questions_recovery');
    }

    return true;
}