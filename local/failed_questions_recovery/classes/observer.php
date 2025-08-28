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
 * Event observer for Failed Questions Recovery plugin
 *
 * @package   local_failed_questions_recovery
 * @copyright 2024
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_failed_questions_recovery;

defined('MOODLE_INTERNAL') || die();

class observer {

    /**
     * Handle quiz attempt submitted event
     */
    public static function quiz_attempt_submitted(\mod_quiz\event\attempt_submitted $event) {
        global $CFG, $DB;
        
        // Log the event reception
        error_log('FQR Observer: Event received - attempt_submitted');
        error_log('FQR Observer: Event data - ' . json_encode($event->get_data()));
        
        try {
            // Include required Moodle libraries
            require_once($CFG->dirroot . '/mod/quiz/locallib.php');
            require_once($CFG->dirroot . '/question/engine/lib.php');
            
            $eventdata = $event->get_data();
            $attemptid = $eventdata['objectid'];
            $userid = $eventdata['userid'];
            
            error_log("FQR Observer: Processing attempt ID: $attemptid for user ID: $userid");
            
            // Get the quiz attempt
            $attempt = $DB->get_record('quiz_attempts', ['id' => $attemptid]);
            if (!$attempt) {
                error_log("FQR Observer: Quiz attempt not found with ID: $attemptid");
                return;
            }
            
            error_log("FQR Observer: Found attempt - Quiz ID: {$attempt->quiz}, State: {$attempt->state}");
            
            // Only process finished attempts
            if ($attempt->state !== 'finished') {
                error_log("FQR Observer: Attempt not finished, skipping. State: {$attempt->state}");
                return;
            }
            
            // Load the quiz attempt object
            $attemptobj = \quiz_attempt::create($attemptid);
            if (!$attemptobj) {
                error_log("FQR Observer: Could not create quiz_attempt object for ID: $attemptid");
                return;
            }
            
            error_log("FQR Observer: Quiz attempt object created successfully");
            
            // Get all question slots
            $slots = $attemptobj->get_slots();
            error_log("FQR Observer: Found " . count($slots) . " question slots");
            
            $processed_questions = 0;
            $failed_questions = 0;
            $inserted_records = 0;
            
            foreach ($slots as $slot) {
                try {
                    $processed_questions++;
                    
                    // Get question attempt
                    $qa = $attemptobj->get_question_attempt($slot);
                    if (!$qa) {
                        error_log("FQR Observer: Could not get question attempt for slot: $slot");
                        continue;
                    }
                    
                    // Get question data
                    $question = $qa->get_question();
                    if (!$question) {
                        error_log("FQR Observer: Could not get question for slot: $slot");
                        continue;
                    }
                    
                    // Get question state and marks
                    $state = $qa->get_state();
                    $mark = $qa->get_mark();
                    $maxmark = $qa->get_max_mark();
                    
                    // Safely get state string - some state objects don't have get_string()
                    $state_string = '';
                    try {
                        if (method_exists($state, 'get_string')) {
                            $state_string = $state->get_string();
                        } else {
                            $state_string = get_class($state);
                        }
                    } catch (Exception $e) {
                        $state_string = get_class($state);
                    }
                    
                    error_log("FQR Observer: Question {$question->id} - Mark: $mark, Max: $maxmark, State: " . $state_string);
                    
                    // Determine if question was failed
                    $is_failed = false;
                    $state_class = get_class($state);
                    
                    // Check if state indicates a failed question
                    if (strpos($state_class, 'gaveup') !== false) {
                        // Questions that were given up (not answered) are considered failed
                        $is_failed = true;
                        error_log("FQR Observer: Question {$question->id} - State: gaveup, Failed: YES");
                    } else if (strpos($state_class, 'gradedwrong') !== false) {
                        // Questions explicitly marked as wrong are failed
                        $is_failed = true;
                        error_log("FQR Observer: Question {$question->id} - State: gradedwrong, Failed: YES");
                    } else if ($mark !== null && $maxmark !== null && $maxmark > 0) {
                        // Check if mark is less than 50% of max mark
                        $percentage = ($mark / $maxmark) * 100;
                        $is_failed = $percentage < 50;
                        error_log("FQR Observer: Question {$question->id} - Percentage: $percentage%, Failed: " . ($is_failed ? 'YES' : 'NO'));
                    } else {
                        // Fallback: check state methods safely
                        try {
                            if (method_exists($state, 'is_incorrect')) {
                                $is_failed = $state->is_incorrect();
                            } else if (method_exists($state, 'is_partial')) {
                                $is_failed = $state->is_partial();
                            }
                        } catch (Exception $e) {
                            error_log("FQR Observer: Error checking state methods: " . $e->getMessage());
                        }
                        error_log("FQR Observer: Question {$question->id} - Fallback check, Failed: " . ($is_failed ? 'YES' : 'NO'));
                    }
                    
                    if ($is_failed) {
                        $failed_questions++;
                        
                        // Check if this failed question already exists for this user
                        $existing = $DB->get_record('local_failed_questions_recovery', [
                            'userid' => $userid,
                            'questionid' => $question->id
                        ]);
                        
                        if ($existing) {
                            error_log("FQR Observer: Question {$question->id} already exists as failed for user $userid");
                            // Update the existing record with latest attempt info
                            $existing->attempts = $existing->attempts + 1;
                            $existing->lastfailed = time();
                            $existing->timemodified = time();
                            $existing->mastered = 0; // Reset mastered status
                            $DB->update_record('local_failed_questions_recovery', $existing);
                        } else {
                            // Get question category info for the new record
                            $category = $DB->get_record('question_categories', ['id' => $question->category]);
                            $categoryname = $category ? $category->name : 'Unknown';
                            
                            // Get quiz name for correct categoryname
                            $quiz = $DB->get_record('quiz', ['id' => $attempt->quiz]);
                            $quiz_name = $quiz ? $quiz->name : 'Unknown Quiz';
                            
                            // Insert new failed question record - with safe field handling
                            $record = new \stdClass();
                            $record->userid = (int)$userid;
                            $record->questionid = (int)$question->id;
                            $record->courseid = (int)$attempt->courseid;
                            $record->quizid = (int)$attempt->quiz; // ✅ AGREGADO: Campo obligatorio faltante
                            $record->categoryid = (int)$question->category; // ✅ AGREGADO: Campo obligatorio faltante
                            $record->categoryname = substr($quiz_name, 0, 255); // Usar nombre del quiz, no categoría
                            $record->questiontext = substr(strip_tags($question->questiontext), 0, 1000); // Strip HTML and truncate
                            
                            // Safely handle qtype (can be object or string)
                            $qtype_string = '';
                            if (is_object($question->qtype)) {
                                $qtype_string = get_class($question->qtype);
                                // Remove namespace prefix if exists
                                if (strpos($qtype_string, 'qtype_') === 0) {
                                    $qtype_string = substr($qtype_string, 6); // Remove 'qtype_' prefix
                                }
                            } else {
                                $qtype_string = (string)$question->qtype;
                            }
                            $record->questiontype = substr($qtype_string, 0, 50); // Truncate to max length
                            
                            $record->attempts = 1;
                            $record->lastfailed = time();
                            $record->mastered = 0;
                            $record->timecreated = time();
                            $record->timemodified = time();
                            
                            try {
                                $id = $DB->insert_record('local_failed_questions_recovery', $record);
                            if ($id) {
                                $inserted_records++;
                                error_log("FQR Observer: Inserted failed question record with ID: $id for question {$question->id}");
                            } else {
                                error_log("FQR Observer: Failed to insert record for question {$question->id}");
                                }
                            } catch (Exception $e) {
                                error_log("FQR Observer: Database error inserting question {$question->id}: " . $e->getMessage());
                            }
                        }
                    }
                    
                } catch (\Exception $e) {
                    error_log("FQR Observer: Error processing question in slot $slot: " . $e->getMessage());
                    error_log("FQR Observer: Exception trace: " . $e->getTraceAsString());
                }
            }
            
            error_log("FQR Observer: Processing complete - Processed: $processed_questions, Failed: $failed_questions, Inserted: $inserted_records");
            
            // Final verification - count total failed questions for this user
            $total_failed = $DB->count_records('local_failed_questions_recovery', ['userid' => $userid]);
            error_log("FQR Observer: Total failed questions in DB for user $userid: $total_failed");
            
        } catch (\Exception $e) {
            error_log("FQR Observer: Fatal error in quiz_attempt_submitted: " . $e->getMessage());
            error_log("FQR Observer: Exception trace: " . $e->getTraceAsString());
        }
    }
    
    /**
     * Handle question answered event
     */
    public static function question_answered(\core\event\question_answered $event) {
        // This is handled by quiz_attempt_submitted for quiz questions
        // This would be for other question types if needed
    }
    
    /**
     * Handle quiz question answered event
     */
    public static function quiz_question_answered(\mod_quiz\event\question_answered $event) {
        // Individual question answered - we'll process this at attempt submission
        // to have complete context
    }
    
    /**
     * Process quiz attempt and identify failed questions
     */
    private static function process_quiz_attempt($attempt, $quiz, $userid, $courseid) {
        global $DB;
        
        try {
            // Get question usage for this attempt
            $quba = \question_engine::load_questions_usage_by_activity($attempt->uniqueid);
            
            if (!$quba) {
                error_log("Failed Questions Recovery - No question usage found for attempt: " . $attempt->id);
                return;
            }
            
            $slots = $quba->get_slots();
            error_log("Failed Questions Recovery - Processing " . count($slots) . " questions in attempt " . $attempt->id);
            
            foreach ($slots as $slot) {
                $qa = $quba->get_question_attempt($slot);
                $question = $qa->get_question();
                
                if (!$question) {
                    error_log("Failed Questions Recovery - No question found for slot: $slot");
                    continue;
                }
                
                // Check if question was answered incorrectly
                $state = $qa->get_state();
                $fraction = $qa->get_fraction();
                
                // Safely get state string
                $state_str = '';
                try {
                    if (method_exists($state, 'get_string')) {
                        $state_str = $state->get_string();
                    } else {
                        $state_str = get_class($state);
                    }
                } catch (Exception $e) {
                    $state_str = get_class($state);
                }
                
                error_log("Failed Questions Recovery - Question " . $question->id . 
                         " (type: " . $question->qtype . ") - State: " . $state_str . 
                         ", Fraction: " . $fraction);
                
                // If fraction is 0 or negative, or state indicates wrong answer
                $is_graded_fail = false;
                try {
                    if (method_exists($state, 'is_graded_state_with_fail')) {
                        $is_graded_fail = $state->is_graded_state_with_fail();
                    }
                } catch (Exception $e) {
                    error_log("Failed Questions Recovery - Error checking is_graded_state_with_fail: " . $e->getMessage());
                }
                
                if ($fraction <= 0 || $is_graded_fail) {
                    error_log("Failed Questions Recovery - Recording failed question: " . $question->id);
                    self::record_failed_question($userid, $question->id, $courseid, $quiz->id, $question, $attempt->id);
                } else if ($fraction > 0.8) {
                    // If answered correctly with good confidence, mark as mastered
                    error_log("Failed Questions Recovery - Marking question as mastered: " . $question->id);
                    self::mark_question_mastered($userid, $question->id);
                }
            }
            
        } catch (Exception $e) {
            error_log("Failed Questions Recovery - Error in process_quiz_attempt: " . $e->getMessage());
        }
    }
    
    /**
     * Record a failed question for the user
     */
    private static function record_failed_question($userid, $questionid, $courseid, $quizid, $question, $attemptid) {
        global $DB;
        
        try {
            // Get question category info
            $category = $DB->get_record('question_categories', array('id' => $question->category));
            $categoryname = $category ? $category->name : 'Unknown';
            
            // Check if this question failure already exists
            $existing = $DB->get_record('local_failed_questions_recovery', array(
                'userid' => $userid,
                'questionid' => $questionid
            ));
            
            $now = time();
            
            if ($existing) {
                // Update existing record
                $existing->attempts = $existing->attempts + 1;
                $existing->lastfailed = $now;
                $existing->timemodified = $now;
                $existing->mastered = 0; // Reset mastered status
                
                $DB->update_record('local_failed_questions_recovery', $existing);
                error_log("Failed Questions Recovery - Updated existing failed question record for user $userid, question $questionid");
            } else {
                // Create new record
                $record = new \stdClass();
                $record->userid = $userid;
                $record->questionid = $questionid;
                $record->courseid = $courseid;
                $record->quizid = $quizid;
                $record->categoryid = $question->category;
                $record->categoryname = $categoryname;
                $record->questiontext = $question->questiontext;
                
                // Safely handle qtype (can be object or string)
                $qtype_string = '';
                if (is_object($question->qtype)) {
                    $qtype_string = get_class($question->qtype);
                    // Remove namespace prefix if exists
                    if (strpos($qtype_string, 'qtype_') === 0) {
                        $qtype_string = substr($qtype_string, 6); // Remove 'qtype_' prefix
                    }
                } else {
                    $qtype_string = (string)$question->qtype;
                }
                $record->questiontype = substr($qtype_string, 0, 50); // Truncate to max length
                
                $record->attempts = 1;
                $record->lastfailed = $now;
                $record->mastered = 0;
                $record->timecreated = $now;
                $record->timemodified = $now;
                
                $id = $DB->insert_record('local_failed_questions_recovery', $record);
                error_log("Failed Questions Recovery - Created new failed question record with ID: $id for user $userid, question $questionid");
            }
            
        } catch (Exception $e) {
            error_log("Failed Questions Recovery Plugin - Error recording failed question: " . $e->getMessage());
        }
    }
    
    /**
     * Mark a question as mastered for the user
     */
    private static function mark_question_mastered($userid, $questionid) {
        global $DB;
        
        try {
            $existing = $DB->get_record('local_failed_questions_recovery', array(
                'userid' => $userid,
                'questionid' => $questionid
            ));
            
            if ($existing) {
                $existing->mastered = 1;
                $existing->timemodified = time();
                $DB->update_record('local_failed_questions_recovery', $existing);
                error_log("Failed Questions Recovery - Marked question $questionid as mastered for user $userid");
            }
            
        } catch (Exception $e) {
            error_log("Failed Questions Recovery Plugin - Error marking question as mastered: " . $e->getMessage());
        }
    }
    
    /**
     * Debug function to manually process an attempt
     */
    public static function debug_process_attempt($attemptid) {
        global $DB, $CFG;
        
        $result = [
            'attemptid' => $attemptid,
            'processed' => false,
            'error' => null,
            'questions_processed' => 0,
            'questions_failed' => 0,
            'questions_inserted' => 0,
            'details' => []
        ];
        
        try {
            require_once($CFG->dirroot . '/mod/quiz/locallib.php');
            require_once($CFG->dirroot . '/question/engine/lib.php');
            
            // Get the quiz attempt
            $attempt = $DB->get_record('quiz_attempts', ['id' => $attemptid]);
            if (!$attempt) {
                $result['error'] = 'Quiz attempt not found';
                return $result;
            }
            
            // Only process finished attempts
            if ($attempt->state !== 'finished') {
                $result['error'] = 'Attempt not finished, state: ' . $attempt->state;
                return $result;
            }
            
            // Load the quiz attempt object
            $attemptobj = \quiz_attempt::create($attemptid);
            if (!$attemptobj) {
                $result['error'] = 'Could not create quiz_attempt object';
                return $result;
            }
            
            // Get all question slots
            $slots = $attemptobj->get_slots();
            $result['questions_processed'] = count($slots);
            
            foreach ($slots as $slot) {
                $question_detail = [
                    'slot' => $slot,
                    'question_id' => null,
                    'state' => null,
                    'mark' => null,
                    'maxmark' => null,
                    'is_failed' => false,
                    'action' => 'none'
                ];
                
                try {
                    // Get question attempt
                    $qa = $attemptobj->get_question_attempt($slot);
                    if (!$qa) {
                        $question_detail['error'] = 'Could not get question attempt';
                        $result['details'][] = $question_detail;
                        continue;
                    }
                    
                    // Get question data
                    $question = $qa->get_question();
                    if (!$question) {
                        $question_detail['error'] = 'Could not get question';
                        $result['details'][] = $question_detail;
                        continue;
                    }
                    
                    $question_detail['question_id'] = $question->id;
                    
                    // Get question state and marks
                    $state = $qa->get_state();
                    $mark = $qa->get_mark();
                    $maxmark = $qa->get_max_mark();
                    
                    $question_detail['mark'] = $mark;
                    $question_detail['maxmark'] = $maxmark;
                    $question_detail['state'] = get_class($state);
                    
                    // Determine if question was failed
                    $is_failed = false;
                    $state_class = get_class($state);
                    
                    // Check if state indicates a failed question
                    if (strpos($state_class, 'gaveup') !== false) {
                        // Questions that were given up (not answered) are considered failed
                        $is_failed = true;
                        $question_detail['failure_reason'] = 'gaveup';
                    } else if (strpos($state_class, 'gradedwrong') !== false) {
                        // Questions explicitly marked as wrong are failed
                        $is_failed = true;
                        $question_detail['failure_reason'] = 'gradedwrong';
                    } else if ($mark !== null && $maxmark !== null && $maxmark > 0) {
                        // Check if mark is less than 50% of max mark
                        $percentage = ($mark / $maxmark) * 100;
                        $is_failed = $percentage < 50;
                        $question_detail['percentage'] = $percentage;
                        if ($is_failed) {
                            $question_detail['failure_reason'] = 'low_percentage';
                        }
                    } else {
                        // Fallback: check state methods safely
                        try {
                            if (method_exists($state, 'is_incorrect')) {
                                $is_failed = $state->is_incorrect();
                            } else if (method_exists($state, 'is_partial')) {
                                $is_failed = $state->is_partial();
                            }
                            if ($is_failed) {
                                $question_detail['failure_reason'] = 'state_check';
                            }
                        } catch (Exception $e) {
                            $question_detail['state_error'] = $e->getMessage();
                        }
                    }
                    
                    $question_detail['is_failed'] = $is_failed;
                    
                    if ($is_failed) {
                        $result['questions_failed']++;
                        
                        // Check if this failed question already exists for this user
                        $existing = $DB->get_record('local_failed_questions_recovery', [
                            'userid' => $attempt->userid,
                            'questionid' => $question->id
                        ]);
                        
                        if ($existing) {
                            $question_detail['action'] = 'updated_existing';
                            // Update the existing record
                            $existing->attempts = $existing->attempts + 1;
                            $existing->lastfailed = time();
                            $existing->timemodified = time();
                            $existing->mastered = 0;
                            $DB->update_record('local_failed_questions_recovery', $existing);
                        } else {
                            $question_detail['action'] = 'inserted_new';
                            // Get question category info
                            $category = $DB->get_record('question_categories', ['id' => $question->category]);
                            $categoryname = $category ? $category->name : 'Unknown';
                            
                            // Insert new failed question record - with safe field handling
                            $record = new \stdClass();
                            $record->userid = (int)$attempt->userid;
                            $record->questionid = (int)$question->id;
                            $record->courseid = (int)$attempt->courseid;
                            $record->quizid = (int)$attempt->quiz; // ✅ AGREGADO: Campo obligatorio faltante
                            $record->categoryid = (int)$question->category; // ✅ AGREGADO: Campo obligatorio faltante
                            $record->categoryname = substr($categoryname, 0, 255); // Truncate to max length
                            $record->questiontext = substr(strip_tags($question->questiontext), 0, 1000); // Strip HTML and truncate
                            
                            // Safely handle qtype (can be object or string)
                            $qtype_string = '';
                            if (is_object($question->qtype)) {
                                $qtype_string = get_class($question->qtype);
                                // Remove namespace prefix if exists
                                if (strpos($qtype_string, 'qtype_') === 0) {
                                    $qtype_string = substr($qtype_string, 6); // Remove 'qtype_' prefix
                                }
                            } else {
                                $qtype_string = (string)$question->qtype;
                            }
                            $record->questiontype = substr($qtype_string, 0, 50); // Truncate to max length
                            
                            $record->attempts = 1;
                            $record->lastfailed = time();
                            $record->mastered = 0;
                            $record->timecreated = time();
                            $record->timemodified = time();
                            
                            try {
                                $id = $DB->insert_record('local_failed_questions_recovery', $record);
                                if ($id) {
                                    $result['questions_inserted']++;
                                    $question_detail['new_record_id'] = $id;
                                } else {
                                    $question_detail['error'] = 'Failed to insert record';
                                }
                            } catch (Exception $e) {
                                $question_detail['error'] = 'Database error: ' . $e->getMessage();
                            }
                        }
                    }
                    
                } catch (\Exception $e) {
                    $question_detail['error'] = $e->getMessage();
                }
                
                $result['details'][] = $question_detail;
            }
            
            $result['processed'] = true;
            
        } catch (\Exception $e) {
            $result['error'] = $e->getMessage();
        }
        
        return $result;
    }
} 