<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Event observer for Telegram Integration plugin - ROBUST VERSION
 *
 * @package     local_telegram_integration
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_telegram_integration;

defined('MOODLE_INTERNAL') || die();

/**
 * Event observer class.
 */
class observer {

    /**
     * Observer for quiz attempt submitted event.
     *
     * @param \mod_quiz\event\attempt_submitted $event
     */
    public static function quiz_attempt_submitted($event) {
        global $CFG, $DB;

        // LOGGING INMEDIATO
        error_log("=== TELEGRAM OBSERVER STARTED ===");
        error_log("Event: " . get_class($event));
        error_log("Object ID: " . $event->objectid);
        error_log("User ID: " . $event->userid);

        try {
            // Cargar locallib.php
            $locallib_path = $CFG->dirroot . '/local/telegram_integration/locallib.php';
            if (!file_exists($locallib_path)) {
                error_log("FATAL: locallib.php not found at: {$locallib_path}");
                return;
            }
            
            require_once($locallib_path);
            error_log("locallib.php loaded successfully");
            
            // Verificar función de detección
            if (!function_exists('telegram_extract_topic_from_name')) {
                error_log("FATAL: telegram_extract_topic_from_name() not found");
                return;
            }
            
            // Get quiz attempt data
            $attemptid = $event->objectid;
            $userid = $event->userid;
            
            // Get quiz attempt details
            $attempt = $DB->get_record('quiz_attempts', ['id' => $attemptid]);
            if (!$attempt) {
                error_log("Quiz attempt not found: {$attemptid}");
                return;
            }
            
            // Get quiz details
            $quiz = $DB->get_record('quiz', ['id' => $attempt->quiz]);
            if (!$quiz) {
                error_log("Quiz not found: {$attempt->quiz}");
                return;
            }
            
            error_log("Quiz name: {$quiz->name}");
            
            // DETECTAR TEMA
            $topic = telegram_extract_topic_from_name($quiz->name);
            if (!$topic) {
                error_log("No topic detected for quiz: {$quiz->name}");
                return;
            }
            
            error_log("Topic detected: {$topic}");
            
            // Get telegram user ID
            $telegram_user = self::get_telegram_user_id($userid);
            if (!$telegram_user) {
                error_log("Telegram user not found for moodle user: {$userid}");
                return;
            }
            
            error_log("Telegram user: {$telegram_user}");
            
            // Calculate quiz results
            $grade = $attempt->sumgrades ?? 0;
            $maxgrade = $quiz->grade ?? 1;
            $is_correct = ($grade > 0 && $maxgrade > 0) ? ($grade / $maxgrade) >= 0.5 : false;
            
            error_log("Grade: {$grade}/{$maxgrade}, Correct: " . ($is_correct ? 'YES' : 'NO'));
            
            // **ACTUALIZAR PERFORMANCE CON MANEJO DE UNIQUE**
            $result = self::update_topic_performance_safe($telegram_user, $topic, $is_correct);
            
            if ($result) {
                error_log("Performance updated successfully");
            } else {
                error_log("Performance update failed");
            }
            
            error_log("=== TELEGRAM OBSERVER COMPLETED ===");
            
        } catch (Exception $e) {
            error_log("ERROR in telegram observer: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
        }
    }

    /**
     * Observer for quiz attempt reviewed event.
     */
    public static function quiz_attempt_reviewed($event) {
        self::quiz_attempt_submitted($event);
    }

    /**
     * Observer for user logged in event.
     */
    public static function user_logged_in($event) {
        // Vacío por ahora
    }
    
    /**
     * Get telegram user ID with robust error handling
     */
    private static function get_telegram_user_id($moodle_user_id) {
        try {
            $pdo = new \PDO(
                'mysql:host=localhost;dbname=u449034524_moodel_telegra;charset=utf8',
                'u449034524_opomelilla_25',
                'Sirius//03072503//',
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
            
            $stmt = $pdo->prepare("
                SELECT telegramuserid 
                FROM moodleactivity 
                WHERE moodleuserid = ? 
                AND telegramuserid IS NOT NULL 
                ORDER BY processedat DESC
                LIMIT 1
            ");
            
            $stmt->execute([$moodle_user_id]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            return $result ? $result['telegramuserid'] : null;
            
        } catch (Exception $e) {
            error_log("Error getting telegram user ID: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Update topic performance with UNIQUE constraint handling
     */
    private static function update_topic_performance_safe($telegram_user, $topic, $is_correct) {
        global $DB;
        
        try {
            // **USAR TRANSACCIÓN PARA MANEJO SEGURO**
            $transaction = $DB->start_delegated_transaction();
            
            // Verificar si existe usando FOR UPDATE para evitar race conditions
            $existing = $DB->get_record_sql("
                SELECT * FROM {local_telegram_user_topic_performance} 
                WHERE telegramuserid = ? AND sectionname = ?
                FOR UPDATE
            ", [$telegram_user, $topic]);
            
            if ($existing) {
                // **ACTUALIZAR REGISTRO EXISTENTE**
                $existing->totalquestions += 1;
                if ($is_correct) {
                    $existing->correctanswers += 1;
                } else {
                    $existing->incorrectanswers += 1;
                }
                $existing->accuracy = ($existing->totalquestions > 0) ? 
                    round(($existing->correctanswers / $existing->totalquestions) * 100, 2) : 0;
                $existing->lastactivity = time();
                $existing->updatedat = time();
                
                $DB->update_record('local_telegram_user_topic_performance', $existing);
                error_log("Updated existing record: {$telegram_user} - {$topic}");
                
            } else {
                // **CREAR NUEVO REGISTRO**
                $new_record = new \stdClass();
                $new_record->telegramuserid = $telegram_user;
                $new_record->sectionid = abs(crc32($topic)); // Usar valor positivo
                $new_record->sectionname = $topic;
                $new_record->totalquestions = 1;
                $new_record->correctanswers = $is_correct ? 1 : 0;
                $new_record->incorrectanswers = $is_correct ? 0 : 1;
                $new_record->accuracy = $is_correct ? 100.00 : 0.00;
                $new_record->lastactivity = time();
                $new_record->createdat = time();
                $new_record->updatedat = time();
                
                $DB->insert_record('local_telegram_user_topic_performance', $new_record);
                error_log("Created new record: {$telegram_user} - {$topic}");
            }
            
            // **COMMIT TRANSACCIÓN**
            $transaction->allow_commit();
            return true;
            
        } catch (Exception $e) {
            error_log("Error in update_topic_performance_safe: " . $e->getMessage());
            
            // **ROLLBACK EN CASO DE ERROR**
            if (isset($transaction)) {
                try {
                    $transaction->rollback($e);
                } catch (Exception $rollback_e) {
                    error_log("Rollback failed: " . $rollback_e->getMessage());
                }
            }
            
            return false;
        }
    }
} 