<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Event observer for Telegram Integration plugin.
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

        // Cargar locallib.php
        require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

        try {
            // Get quiz attempt data
            $attemptid = $event->objectid;
            $userid = $event->userid;
            
            error_log("=== TELEGRAM INTEGRATION OBSERVER ===");
            error_log("Attempt ID: {$attemptid}, User ID: {$userid}");
            
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
            
            // **USAR LA FUNCIÓN CORRECTA DE DETECCIÓN**
            $topic = telegram_extract_topic_from_name($quiz->name);
            if (!$topic) {
                error_log("No topic detected for quiz: {$quiz->name}");
                return;
            }
            
            error_log("Topic detected: {$topic}");
            
            // Get telegram user ID from moodleactivity table
            $telegram_user = self::get_telegram_user_id($userid);
            if (!$telegram_user) {
                error_log("Telegram user not found for moodle user: {$userid}");
                return;
            }
            
            error_log("Telegram user: {$telegram_user}");
            
            // ✅ NUEVA LÓGICA: Procesar todas las preguntas del intento
            $question_attempts = $DB->get_records_sql("
                SELECT qa.id, qa.questionid, qa.rightanswer, qa.responsesummary, 
                       qas.state, q.name as question_name
                FROM {question_attempts} qa
                JOIN {question_attempt_steps} qas ON qa.id = qas.questionattemptid
                JOIN {question} q ON qa.questionid = q.id
                WHERE qa.questionusageid = ?
                AND qas.sequencenumber = (
                    SELECT MAX(qas2.sequencenumber) 
                    FROM {question_attempt_steps} qas2 
                    WHERE qas2.questionattemptid = qa.id
                )
            ", [$attempt->uniqueid]);
            
            $total_questions = count($question_attempts);
            error_log("Processing {$total_questions} individual questions");
            
            foreach ($question_attempts as $qa) {
                // Determinar si la respuesta es correcta
                $is_correct = (strpos($qa->state, 'gradedright') !== false || 
                              strpos($qa->state, 'mangrright') !== false);
                
                error_log("Question {$qa->questionid}: {$qa->question_name} - State: {$qa->state} - Correct: " . ($is_correct ? 'YES' : 'NO'));
                
                // **ACTUALIZAR LA TABLA PERFORMANCE PARA CADA PREGUNTA**
                self::update_topic_performance($telegram_user, $topic, $is_correct);
            }
            
            error_log("=== OBSERVER COMPLETED: Processed {$total_questions} questions ===");
            
        } catch (Exception $e) {
            error_log("Error in quiz_attempt_submitted observer: " . $e->getMessage());
        }
    }

    /**
     * Observer for quiz attempt reviewed event.
     *
     * @param \mod_quiz\event\attempt_reviewed $event
     */
    public static function quiz_attempt_reviewed($event) {
        // ✅ CORRECCIÓN: No procesar en reviewed para evitar duplicados
        error_log("TELEGRAM DEBUG: quiz_attempt_reviewed called but skipped to avoid duplicates");
        // Comentamos la línea que causa duplicación:
        // self::quiz_attempt_submitted($event);
    }

    /**
     * Observer for user logged in event.
     *
     * @param \core\event\user_loggedin $event
     */
    public static function user_logged_in($event) {
        // Esta función puede quedarse vacía por ahora
    }
    
    /**
     * Get telegram user ID from moodleactivity table
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
     * Update topic performance in the performance table
     */
    private static function update_topic_performance($telegram_user, $topic, $is_correct) {
        global $DB;
        
        try {
            error_log("TELEGRAM DEBUG: Starting update_topic_performance for user {$telegram_user}, topic: {$topic}, correct: " . ($is_correct ? 'YES' : 'NO'));
            
            // FIX: Limitar sectionid al rango de MySQL INT usando módulo
            $sectionid = abs(crc32($topic)) % 2147483647;
            
            // Buscar registro existente por telegramuserid Y sectionid (más preciso)
            $existing = $DB->get_record('local_telegram_user_topic_performance', [
                'telegramuserid' => $telegram_user,
                'sectionid' => $sectionid
            ]);
            
            if ($existing) {
                error_log("TELEGRAM DEBUG: Found existing record ID: {$existing->id}");
                
                // Actualizar registro existente
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
                
                $result = $DB->update_record('local_telegram_user_topic_performance', $existing);
                error_log("TELEGRAM DEBUG: Update result: " . ($result ? 'SUCCESS' : 'FAILED'));
                
                if ($result) {
                    error_log("TELEGRAM SUCCESS: Updated performance for {$telegram_user} - {$topic} (Total: {$existing->totalquestions}, Correct: {$existing->correctanswers}, Accuracy: {$existing->accuracy}%)");
                } else {
                    error_log("TELEGRAM ERROR: Failed to update existing record for {$telegram_user} - {$topic}");
                }
                
            } else {
                error_log("TELEGRAM DEBUG: No existing record found, creating new one");
                error_log("TELEGRAM DEBUG: Generated sectionid: {$sectionid} for topic: {$topic}");
                
                $new_record = new \stdClass();
                $new_record->telegramuserid = $telegram_user;
                $new_record->sectionid = $sectionid;
                $new_record->sectionname = $topic;
                $new_record->totalquestions = 1;
                $new_record->correctanswers = $is_correct ? 1 : 0;
                $new_record->incorrectanswers = $is_correct ? 0 : 1;
                $new_record->accuracy = $is_correct ? 100.00 : 0.00;
                $new_record->lastactivity = time();
                $new_record->createdat = time();
                $new_record->updatedat = time();
                
                error_log("TELEGRAM DEBUG: About to insert record with data: " . json_encode($new_record));
                
                try {
                    $new_id = $DB->insert_record('local_telegram_user_topic_performance', $new_record);
                    
                    if ($new_id) {
                        error_log("TELEGRAM SUCCESS: Created new performance record ID {$new_id} for {$telegram_user} - {$topic} (Correct: {$new_record->correctanswers}, Accuracy: {$new_record->accuracy}%)");
                    } else {
                        error_log("TELEGRAM ERROR: Failed to insert new record for {$telegram_user} - {$topic}");
                    }
                } catch (dml_write_exception $e) {
                    if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                        error_log("TELEGRAM WARNING: Duplicate entry detected, attempting to update existing record");
                        // Intentar buscar y actualizar el registro que ya existe
                        $existing = $DB->get_record('local_telegram_user_topic_performance', [
                            'telegramuserid' => $telegram_user,
                            'sectionid' => $sectionid
                        ]);
                        
                        if ($existing) {
                            $existing->totalquestions += 1;
                            if ($is_correct) {
                                $existing->correctanswers += 1;
                            } else {
                                $existing->incorrectanswers += 1;
                            }
                            $existing->accuracy = round(($existing->correctanswers / $existing->totalquestions) * 100, 2);
                            $existing->lastactivity = time();
                            $existing->updatedat = time();
                            
                            $result = $DB->update_record('local_telegram_user_topic_performance', $existing);
                            if ($result) {
                                error_log("TELEGRAM SUCCESS: Updated existing record after duplicate detection for {$telegram_user} - {$topic}");
                            } else {
                                error_log("TELEGRAM ERROR: Failed to update after duplicate detection for {$telegram_user} - {$topic}");
                            }
                        }
                    } else {
                        error_log("TELEGRAM ERROR: Database exception in insert: " . $e->getMessage());
                    }
                } catch (Exception $e) {
                    error_log("TELEGRAM ERROR: Exception in insert: " . $e->getMessage());
                }
            }
            
        } catch (Exception $e) {
            error_log("TELEGRAM ERROR: Exception in update_topic_performance for {$telegram_user} - {$topic}: " . $e->getMessage());
            error_log("TELEGRAM ERROR: Stack trace: " . $e->getTraceAsString());
        }
        
        // NUEVA FUNCIÓN: Actualizar puntos totales automáticamente (INCREMENTAL)
        self::update_user_total_points($telegram_user, $is_correct);
    }
    
    /**
     * Actualiza automáticamente los puntos totales del usuario (VERSIÓN INCREMENTAL)
     */
    private static function update_user_total_points($telegram_user, $is_correct = null) {
        try {
            $pdo = new \PDO(
                'mysql:host=localhost;dbname=u449034524_moodel_telegra;charset=utf8',
                'u449034524_opomelilla_25',
                'Sirius//03072503//'
            );
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            
            // Obtener puntos actuales del usuario
            $stmt = $pdo->prepare("
                SELECT totalpoints, accuracy 
                FROM telegramuser 
                WHERE telegramuserid = ?
            ");
            $stmt->execute([$telegram_user]);
            $current_user = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            $current_points = $current_user['totalpoints'] ?? 0;
            
            // Si se proporciona is_correct, calcular incrementalmente
            if ($is_correct !== null) {
                if ($is_correct) {
                    $points_change = 10; // +10 por respuesta correcta
                } else {
                    $points_change = -2; // -2 por respuesta incorrecta
                }
                
                $new_points = $current_points + $points_change;
                
                // Asegurar que los puntos no sean negativos
                $final_points = max(0, $new_points);
                
                error_log("TELEGRAM INCREMENTAL: User {$telegram_user} - Current: {$current_points}, Change: {$points_change}, New: {$final_points}");
            } else {
                // Si no se proporciona is_correct, recalcular desde cero (solo para casos especiales)
                $stmt = $pdo->prepare("
                    SELECT 
                        SUM(correctanswers * 10 + incorrectanswers * -2) as performance_points,
                        SUM(correctanswers) as total_correct,
                        SUM(totalquestions) as total_questions
                    FROM mdl_local_telegram_user_topic_performance 
                    WHERE telegramuserid = ?
                ");
                $stmt->execute([$telegram_user]);
                $result = $stmt->fetch(\PDO::FETCH_ASSOC);
                
                $performance_points = $result['performance_points'] ?? 0;
                $final_points = max(0, $performance_points);
                
                error_log("TELEGRAM RECALC: User {$telegram_user} - Recalculated total: {$final_points}");
            }
            
            // Calcular accuracy actualizada
            $stmt = $pdo->prepare("
                SELECT 
                    SUM(correctanswers) as total_correct,
                    SUM(totalquestions) as total_questions
                FROM mdl_local_telegram_user_topic_performance 
                WHERE telegramuserid = ?
            ");
            $stmt->execute([$telegram_user]);
            $accuracy_data = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            $total_correct = $accuracy_data['total_correct'] ?? 0;
            $total_questions = $accuracy_data['total_questions'] ?? 0;
            $accuracy = $total_questions > 0 ? round(($total_correct / $total_questions) * 100, 2) : 0;
            
            // ACTUALIZAR tanto puntos como accuracy
            $stmt = $pdo->prepare("
                UPDATE telegramuser 
                SET totalpoints = ?, accuracy = ?, lastactivity = NOW() 
                WHERE telegramuserid = ?
            ");
            $stmt->execute([$final_points, $accuracy, $telegram_user]);
            
            error_log("TELEGRAM SUCCESS: Updated user {$telegram_user} - Points: {$final_points}, Accuracy: {$accuracy}%");
            
            // NUEVO: Actualizar timeline automáticamente
            self::update_timeline_for_today($telegram_user);
            
        } catch (\Exception $e) {
            error_log("TELEGRAM ERROR: Failed to update total points for user {$telegram_user}: " . $e->getMessage());
        }
    }
    
    /**
     * Actualiza el timeline para el día actual
     */
    private static function update_timeline_for_today($telegram_user) {
        try {
            // ✅ CORRECCIÓN: Usar la BD externa de Telegram
            $pdo = new \PDO(
                'mysql:host=localhost;dbname=u449034524_moodel_telegra;charset=utf8',
                'u449034524_opomelilla_25',
                'Sirius//03072503//'
            );
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            
            $today = date('Y-m-d');
            
            // ✅ CORRECCIÓN: Usar el prefijo correcto 'mdl_' para la tabla
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(totalquestions), 0) as total_questions,
                    COALESCE(SUM(correctanswers), 0) as correct_answers,
                    COALESCE(SUM(incorrectanswers), 0) as incorrect_answers,
                    COALESCE(AVG(accuracy), 0) as avg_accuracy
                FROM mdl_local_telegram_user_topic_performance 
                WHERE telegramuserid = ? AND DATE(FROM_UNIXTIME(lastactivity)) = ?
            ");
            $stmt->execute([$telegram_user, $today]);
            $data = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if (($data['total_questions'] ?? 0) > 0) {
                // Eliminar registro existente de hoy
                $stmt2 = $pdo->prepare("DELETE FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ? AND date = ?");
                $stmt2->execute([$telegram_user, $today]);
                
                // Insertar datos actualizados
                $stmt3 = $pdo->prepare("
                    INSERT INTO mdl_local_telegram_progress_timeline 
                    (telegramuserid, date, questions_answered, correct_answers, incorrect_answers, points_earned, points_lost, accuracy, study_time, createdat) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt3->execute([
                    $telegram_user,
                    $today,
                    $data['total_questions'],
                    $data['correct_answers'],
                    $data['incorrect_answers'],
                    $data['correct_answers'] * 2,
                    $data['incorrect_answers'] * 1,
                    $data['avg_accuracy'],
                    $data['total_questions'] * 2
                ]);
                
                error_log("TIMELINE: Updated automatically for user {$telegram_user} - {$data['total_questions']} questions today");
            }
            
        } catch (\Exception $e) {
            error_log("TIMELINE ERROR: Failed to update timeline for user {$telegram_user}: " . $e->getMessage());
        }
    }
}