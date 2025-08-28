<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Plugin library functions
 */

/**
 * Add navigation item to user profile
 */
function local_failed_questions_recovery_extend_navigation_user($navigation, $user, $context) {
    global $USER;
    
    // Only show for the current user
    if ($user->id != $USER->id) {
        return;
    }
    
    // Check if user has permission
    if (!has_capability('local/failed_questions_recovery:use', context_system::instance())) {
        return;
    }
    
    $url = new moodle_url('/local/failed_questions_recovery/index.php');
    $node = navigation_node::create(
        get_string('failed_questions_recovery', 'local_failed_questions_recovery'),
        $url,
        navigation_node::TYPE_SETTING,
        null,
        'failed_questions_recovery'
    );
    
    $navigation->add_node($node);
}

/**
 * Add navigation item to course navigation
 */
function local_failed_questions_recovery_extend_navigation_course($navigation, $course, $context) {
    global $USER;
    
    // Check if user has permission
    if (!has_capability('local/failed_questions_recovery:use', $context)) {
        return;
    }
    
    $url = new moodle_url('/local/failed_questions_recovery/index.php', array('courseid' => $course->id));
    $node = navigation_node::create(
        get_string('failed_questions_recovery', 'local_failed_questions_recovery'),
        $url,
        navigation_node::TYPE_SETTING,
        null,
        'failed_questions_recovery'
    );
    
    $navigation->add_node($node);
}

/**
 * Get failed questions statistics for a user
 */
function local_failed_questions_recovery_get_user_stats($userid) {
    global $DB;
    
    $stats = new stdClass();
    $stats->total_failed = $DB->count_records('local_fqr_failed_questions', array('userid' => $userid));
    $stats->not_mastered = $DB->count_records('local_fqr_failed_questions', array('userid' => $userid, 'mastered' => 0));
    $stats->mastered = $DB->count_records('local_fqr_failed_questions', array('userid' => $userid, 'mastered' => 1));
    $stats->recovery_quizzes = $DB->count_records('local_fqr_recovery_quizzes', array('userid' => $userid));
    $stats->completed_quizzes = $DB->count_records('local_fqr_recovery_quizzes', array('userid' => $userid, 'completed' => 1));
    
    // Calculate recovery rate
    $stats->recovery_rate = ($stats->total_failed > 0) ? ($stats->mastered / $stats->total_failed) * 100 : 0;
    
    // Get average score
    $avg_score = $DB->get_field_sql(
        "SELECT AVG(score) FROM {local_fqr_recovery_quizzes} WHERE userid = ? AND completed = 1",
        array($userid)
    );
    $stats->average_score = $avg_score ? $avg_score : 0;
    
    return $stats;
}

/**
 * Get categories with failed questions for a user
 */
function local_failed_questions_recovery_get_categories($userid, $courseid = 0) {
    global $DB;
    
    $sql = "SELECT fq.categoryid, fq.categoryname, 
                   COALESCE(q.name, fq.categoryname) as display_name,
                   COUNT(*) as failedcount, 
                   SUM(CASE WHEN fq.mastered = 0 THEN 1 ELSE 0 END) as notmasteredcount
            FROM {local_failed_questions_recovery} fq
            LEFT JOIN {quiz} q ON fq.quizid = q.id
            WHERE fq.userid = :userid";
    
    $params = array('userid' => $userid);
    
    if ($courseid > 0) {
        $sql .= " AND fq.courseid = :courseid";
        $params['courseid'] = $courseid;
    }
    
    $sql .= " GROUP BY fq.categoryid, fq.categoryname, q.name ORDER BY COALESCE(q.name, fq.categoryname)";
    
    return $DB->get_records_sql($sql, $params);
}

/**
 * Format time ago string
 */
function local_failed_questions_recovery_time_ago($timestamp) {
    $now = time();
    $diff = $now - $timestamp;
    
    if ($diff < 60) {
        return get_string('time_ago', 'local_failed_questions_recovery', get_string('now'));
    } elseif ($diff < 3600) {
        $minutes = floor($diff / 60);
        return get_string('time_ago', 'local_failed_questions_recovery', $minutes . ' ' . get_string('minutes'));
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return get_string('time_ago', 'local_failed_questions_recovery', $hours . ' ' . get_string('hours'));
    } elseif ($diff < 2592000) {
        $days = floor($diff / 86400);
        if ($days == 1) {
            return get_string('yesterday', 'local_failed_questions_recovery');
        } else {
            return get_string('days_ago', 'local_failed_questions_recovery', $days);
        }
    } elseif ($diff < 31536000) {
        $months = floor($diff / 2592000);
        return get_string('months_ago', 'local_failed_questions_recovery', $months);
    } else {
        return userdate($timestamp, get_string('strftimedate'));
    }
}

/**
 * Clean up old recovery quizzes
 */
function local_failed_questions_recovery_cleanup_old_quizzes($days_old = 30) {
    global $DB;
    
    $cutoff_time = time() - ($days_old * 24 * 60 * 60);
    
    // Get old quizzes
    $old_quizzes = $DB->get_records_select('local_fqr_recovery_quizzes', 
        'timecreated < ? AND completed = 1', array($cutoff_time));
    
    $deleted_count = 0;
    
    foreach ($old_quizzes as $quiz) {
        // Delete associated attempts
        $DB->delete_records('local_fqr_recovery_attempts', array('recoveryquizid' => $quiz->id));
        
        // Delete quiz
        $DB->delete_records('local_fqr_recovery_quizzes', array('id' => $quiz->id));
        
        $deleted_count++;
    }
    
    return $deleted_count;
}

/**
 * Get question by ID with additional information
 */
function local_failed_questions_recovery_get_question_info($questionid) {
    global $DB;
    
    $question = $DB->get_record('question', array('id' => $questionid));
    if (!$question) {
        return null;
    }
    
    // Get category info using the correct JOIN for new Moodle versions
    $sql = "SELECT qc.* 
            FROM {question_categories} qc
            LEFT JOIN {question_bank_entries} qbe ON qc.id = qbe.questioncategoryid
            LEFT JOIN {question_versions} qv ON qbe.id = qv.questionbankentryid
            WHERE qv.questionid = :questionid
            LIMIT 1";
    
    $category = $DB->get_record_sql($sql, array('questionid' => $questionid));
    
    // Get answers for multiple choice questions
    $answers = array();
    if ($question->qtype == 'multichoice') {
        $answers = $DB->get_records('question_answers', array('question' => $questionid), 'id ASC');
    }
    
    return array(
        'question' => $question,
        'category' => $category,
        'answers' => $answers
    );
}

/**
 * Update question mastery status
 */
function local_failed_questions_recovery_update_mastery($userid, $questionid, $mastered = true) {
    global $DB;
    
    $record = $DB->get_record('local_fqr_failed_questions', array(
        'userid' => $userid,
        'questionid' => $questionid
    ));
    
    if ($record) {
        $record->mastered = $mastered ? 1 : 0;
        $record->timemodified = time();
        return $DB->update_record('local_fqr_failed_questions', $record);
    }
    
    return false;
}

/**
 * Get recovery quiz progress
 */
function local_failed_questions_recovery_get_quiz_progress($quizid) {
    global $DB;
    
    $quiz = $DB->get_record('local_fqr_recovery_quizzes', array('id' => $quizid));
    if (!$quiz) {
        return null;
    }
    
    $attempts = $DB->get_records('local_fqr_recovery_attempts', array('recoveryquizid' => $quizid));
    
    $progress = array(
        'quiz' => $quiz,
        'total_questions' => $quiz->questioncount,
        'answered_questions' => count($attempts),
        'correct_answers' => 0,
        'attempts' => $attempts
    );
    
    foreach ($attempts as $attempt) {
        if ($attempt->iscorrect) {
            $progress['correct_answers']++;
        }
    }
    
    $progress['completion_percentage'] = ($progress['total_questions'] > 0) 
        ? ($progress['answered_questions'] / $progress['total_questions']) * 100 
        : 0;
    
    $progress['accuracy_percentage'] = ($progress['answered_questions'] > 0) 
        ? ($progress['correct_answers'] / $progress['answered_questions']) * 100 
        : 0;
    
    return $progress;
}

/**
 * Check if user has access to recovery quiz
 */
function local_failed_questions_recovery_can_access_quiz($quizid, $userid) {
    global $DB;
    
    $quiz = $DB->get_record('local_fqr_recovery_quizzes', array('id' => $quizid));
    
    if (!$quiz) {
        return false;
    }
    
    // Check if user owns the quiz
    if ($quiz->userid != $userid) {
        return false;
    }
    
    return true;
}

/**
 * Test plugin functionality and configuration
 */
function test_plugin_functionality() {
    global $DB, $USER, $CFG;
    
    $result = array();
    
    // Test database tables
    $result['tables'] = array();
    $tables = array('local_fqr_failed_questions', 'local_fqr_recovery_quizzes', 'local_fqr_recovery_attempts');
    
    foreach ($tables as $table) {
        try {
            $exists = $DB->get_manager()->table_exists($table);
            $result['tables'][$table] = $exists;
        } catch (Exception $e) {
            $result['tables'][$table] = false;
        }
    }
    
    // Test record counts
    $result['record_counts'] = array();
    foreach ($tables as $table) {
        if ($result['tables'][$table]) {
            try {
                $count = $DB->count_records($table);
                $result['record_counts'][$table] = $count;
            } catch (Exception $e) {
                $result['record_counts'][$table] = 'Error: ' . $e->getMessage();
            }
        } else {
            $result['record_counts'][$table] = 'Table does not exist';
        }
    }
    
    // Test permissions
    $result['permissions'] = array();
    try {
        $systemcontext = context_system::instance();
        $result['permissions']['system_context'] = true;
        
        $usercontext = context_user::instance($USER->id);
        $result['permissions']['user_context'] = true;
    } catch (Exception $e) {
        $result['permissions']['error'] = $e->getMessage();
    }
    
    // Count failed questions for current user
    $result['failed_questions'] = $DB->count_records('local_fqr_failed_questions', array('userid' => $USER->id));
    
    // Test observers configuration
    $result['observer_test'] = array();
    try {
        // Check if observers file exists
        $observers_file = $CFG->dirroot . '/local/failed_questions_recovery/db/events.php';
        $result['observer_test']['events_file_exists'] = file_exists($observers_file);
        
        if (file_exists($observers_file)) {
            // Load observers configuration
            $observers = array();
            include($observers_file);
            $result['observer_test']['observers_defined'] = count($observers);
            $result['observer_test']['observers_config'] = $observers;
            
            // Check if observer class exists
            $observer_file = $CFG->dirroot . '/local/failed_questions_recovery/classes/observer.php';
            $result['observer_test']['observer_class_file_exists'] = file_exists($observer_file);
            
            if (file_exists($observer_file)) {
                // Try to check if class can be loaded
                try {
                    require_once($observer_file);
                    $result['observer_test']['observer_class_loadable'] = class_exists('\local_failed_questions_recovery\observer');
                } catch (Exception $e) {
                    $result['observer_test']['observer_class_error'] = $e->getMessage();
                }
            }
        }
        
        // Check if events are registered in Moodle
        $sql = "SELECT * FROM {events_handlers} WHERE component = 'local_failed_questions_recovery'";
        $registered_handlers = $DB->get_records_sql($sql);
        $result['observer_test']['registered_handlers'] = count($registered_handlers);
        
    } catch (Exception $e) {
        $result['observer_test']['error'] = $e->getMessage();
    }
    
    // Count total observers (this was probably always returning 0 because it's not the right way to check)
    $result['observers'] = isset($result['observer_test']['observers_defined']) ? $result['observer_test']['observers_defined'] : 0;
    
    // Count recent quiz attempts
    try {
        $recent_attempts = $DB->count_records_sql(
            "SELECT COUNT(*) FROM {quiz_attempts} WHERE userid = ? AND timemodified > ?",
            array($USER->id, time() - (30 * 24 * 60 * 60)) // Last 30 days
        );
        $result['recent_quiz_attempts'] = $recent_attempts;
        
        // Get latest attempt info
        $latest_attempt = $DB->get_record_sql(
            "SELECT id, quiz, state, timemodified FROM {quiz_attempts} WHERE userid = ? ORDER BY timemodified DESC LIMIT 1",
            array($USER->id)
        );
        
        if ($latest_attempt) {
            $result['latest_attempt'] = array(
                'id' => $latest_attempt->id,
                'quiz' => $latest_attempt->quiz,
                'state' => $latest_attempt->state,
                'timemodified' => $latest_attempt->timemodified
            );
        }
        
    } catch (Exception $e) {
        $result['quiz_attempts_error'] = $e->getMessage();
    }
    
    // Test plugin version and installation
    $result['plugin_info'] = array();
    $version_file = $CFG->dirroot . '/local/failed_questions_recovery/version.php';
    if (file_exists($version_file)) {
        $plugin = new stdClass();
        include($version_file);
        $result['plugin_info']['version'] = isset($plugin->version) ? $plugin->version : 'Unknown';
        $result['plugin_info']['component'] = isset($plugin->component) ? $plugin->component : 'Unknown';
    }
    
    return $result;
}

/**
 * Get user statistics
 */
function get_user_stats($userid) {
    global $DB;
    
    // Count total questions that have been failed at least once
    $total_questions = $DB->count_records('local_failed_questions_recovery', array('userid' => $userid));
    
    // Count questions that are currently not mastered (failed)
    $total_failed = $DB->count_records('local_failed_questions_recovery', array('userid' => $userid, 'mastered' => 0));
    
    // Count questions that have been mastered
    $total_mastered = $DB->count_records('local_failed_questions_recovery', array('userid' => $userid, 'mastered' => 1));
    
    // Count completed recovery quizzes
    $total_quizzes = $DB->count_records('local_fqr_recovery_quizzes', array('userid' => $userid, 'completed' => 1));
    
    // Calculate success rate (mastered / total) * 100
    $success_rate = 0;
    if ($total_questions > 0) {
        $success_rate = ($total_mastered / $total_questions) * 100;
    }
    
    // Return as object with correct property names
    $stats = new stdClass();
    $stats->total_failed = $total_failed;
    $stats->total_mastered = $total_mastered;
    $stats->total_quizzes = $total_quizzes;
    $stats->success_rate = round($success_rate, 1);
    
    return $stats;
}

/**
 * Get failed questions by category
 * If $categoryid is provided, returns actual question records for that category
 * If $categoryid is null, returns categories with counts
 */
function get_failed_questions_by_category($userid) {
    global $DB;
    
    // Obtener preguntas falladas agrupadas por nombre del quiz (no por categoryname)
    $sql = "SELECT 
                COALESCE(q.name, fq.categoryname) as display_name,
                COUNT(*) as count,
                MIN(fq.quizid) as id,
                MIN(fq.quizid) as quizid,
                MIN(fq.categoryid) as categoryid
            FROM {local_failed_questions_recovery} fq
            LEFT JOIN {quiz} q ON fq.quizid = q.id
            WHERE fq.userid = ? 
            AND fq.mastered = 0
            GROUP BY COALESCE(q.name, fq.categoryname)
            HAVING COUNT(*) > 0
            ORDER BY display_name";
            
    $categories = $DB->get_records_sql($sql, [$userid]);
    
    $result = [];
    foreach ($categories as $category) {
        $result[] = [
            'id' => $category->quizid,
            'name' => $category->display_name,
            'count' => $category->count,
            'quizid' => $category->quizid,
            'categoryid' => $category->categoryid
        ];
    }
    
    return $result;
}

/**
 * Get specific failed questions for a category/quiz
 */
function get_failed_questions_for_category($userid, $categoryid) {
    global $DB;
    
    $sql = "SELECT * FROM {local_failed_questions_recovery} 
            WHERE userid = ? AND categoryid = ? AND mastered = 0
            ORDER BY lastfailed DESC";
    
    return $DB->get_records_sql($sql, [$userid, $categoryid]);
}

/**
 * Get all failed questions for a user - with quiz names instead of category codes
 */
function get_all_failed_questions($userid) {
    global $DB;
    
    $sql = "SELECT fq.*, 
                   COALESCE(q.name, fq.categoryname) as display_name
            FROM {local_failed_questions_recovery} fq
            LEFT JOIN {quiz} q ON fq.quizid = q.id
            WHERE fq.userid = :userid
            ORDER BY fq.lastfailed DESC";
    
    return $DB->get_records_sql($sql, array('userid' => $userid));
}

/**
 * Get user recovery quizzes
 */
function get_user_recovery_quizzes($userid) {
    global $DB;
    
    return $DB->get_records('local_fqr_recovery_quizzes', array('userid' => $userid), 'timecreated DESC');
}

/**
 * Debug function to manually trigger quiz processing
 */
function debug_process_recent_quiz() {
    global $DB, $USER, $CFG;
    
    // Include required Moodle libraries
    require_once($CFG->dirroot . '/mod/quiz/locallib.php');
    require_once($CFG->dirroot . '/question/engine/lib.php');
    
    $output = [];
    $output['debug_start'] = 'Iniciando debug del quiz más reciente';
    $output['user_id'] = $USER->id;
    
    try {
        // Obtener el intento más reciente del usuario
        $sql = "SELECT qa.* 
                FROM {quiz_attempts} qa 
                WHERE qa.userid = :userid 
                AND qa.state = 'finished'
                ORDER BY qa.timemodified DESC 
                LIMIT 1";
        
        $attempt = $DB->get_record_sql($sql, ['userid' => $USER->id]);
        
        if (!$attempt) {
            $output['error'] = 'No se encontraron intentos de quiz finalizados';
            return $output;
        }
        
        $output['attempt_found'] = [
            'id' => $attempt->id,
            'quiz_id' => $attempt->quiz,
            'state' => $attempt->state,
            'timemodified' => date('Y-m-d H:i:s', $attempt->timemodified)
        ];
        
        // Cargar el objeto quiz_attempt
        $attemptobj = quiz_attempt::create($attempt->id);
        $output['attempt_loaded'] = 'Quiz attempt cargado correctamente';
        
        // Obtener todas las preguntas del intento
        $slots = $attemptobj->get_slots();
        $output['total_slots'] = count($slots);
        
        $failed_questions = [];
        $processed_questions = 0;
        
        foreach ($slots as $slot) {
            try {
                $qa = $attemptobj->get_question_attempt($slot);
                $question = $qa->get_question();
                
                $processed_questions++;
                
                // Verificar si la pregunta fue respondida incorrectamente
                $state = $qa->get_state();
                $mark = $qa->get_mark();
                $maxmark = $qa->get_max_mark();
                
                $is_failed = false;
                if ($mark === null || $maxmark === null || $maxmark == 0) {
                    $is_failed = ($state->is_incorrect() || $state->is_partial());
                } else {
                    $is_failed = ($mark / $maxmark) < 0.5; // Menos del 50% es considerado fallado
                }
                
                if ($is_failed) {
                    // Get category ID using SQL query for compatibility with new Moodle versions
                    $category_id = 0; // Default value
                    try {
                        $category_sql = "SELECT qbe.questioncategoryid 
                                       FROM {question_versions} qv
                                       LEFT JOIN {question_bank_entries} qbe ON qv.questionbankentryid = qbe.id
                                       WHERE qv.questionid = ?
                                       LIMIT 1";
                        $category_result = $DB->get_field_sql($category_sql, [$question->id]);
                        if ($category_result) {
                            $category_id = $category_result;
                        }
                    } catch (Exception $cat_e) {
                        // Fallback: use category property if it exists
                        $category_id = isset($question->category) ? $question->category : 0;
                    }
                    
                    // Safely get state string
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
                    
                    $failed_questions[] = [
                        'slot' => $slot,
                        'question_id' => $question->id,
                        'question_name' => $question->name,
                        'category_id' => $category_id,
                        'mark' => $mark,
                        'maxmark' => $maxmark,
                        'state' => $state_string
                    ];
                    
                    // Intentar guardar en la base de datos
                    $record = new stdClass();
                    $record->userid = $USER->id;
                    $record->questionid = $question->id;
                    $record->categoryid = $category_id;
                    $record->quizid = $attempt->quiz;
                    $record->attemptid = $attempt->id;
                    $record->timeadded = time();
                    $record->status = 'failed';
                    
                    // Verificar si ya existe
                    $existing = $DB->get_record('local_fqr_failed_questions', [
                        'userid' => $USER->id,
                        'questionid' => $question->id
                    ]);
                    
                    if (!$existing) {
                        $id = $DB->insert_record('local_fqr_failed_questions', $record);
                        $output['inserted_questions'][] = $id;
                    }
                }
                
            } catch (Exception $e) {
                $output['question_errors'][] = [
                    'slot' => $slot,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        $output['processed_questions'] = $processed_questions;
        $output['failed_questions_found'] = count($failed_questions);
        $output['failed_questions_details'] = $failed_questions;
        
        // Verificar el conteo final en la base de datos
        $total_failed = $DB->count_records('local_fqr_failed_questions', ['userid' => $USER->id]);
        $output['total_in_db'] = $total_failed;
        
    } catch (Exception $e) {
        $output['fatal_error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Generate recovery report
 */
function local_failed_questions_recovery_generate_report($userid, $courseid = 0) {
    global $DB;
    
    $report = new stdClass();
    $report->userid = $userid;
    $report->courseid = $courseid;
    $report->generated_at = time();
    
    // Get user info
    $user = $DB->get_record('user', array('id' => $userid));
    $report->user = $user;
    
    // Get statistics
    $report->stats = get_user_stats($userid);
    
    // Get categories
    $report->categories = get_failed_questions_by_category($userid);
    
    // Get recent quizzes
    $conditions = array('userid' => $userid);
    if ($courseid > 0) {
        $conditions['courseid'] = $courseid;
    }
    
    $report->recent_quizzes = $DB->get_records('local_fqr_recovery_quizzes', $conditions, 'timecreated DESC', '*', 0, 10);
    
    // Get most failed questions
    $sql = "SELECT fq.*, q.questiontext, qc.name as categoryname 
            FROM {local_fqr_failed_questions} fq
            JOIN {question} q ON fq.questionid = q.id
            LEFT JOIN {question_versions} qv ON q.id = qv.questionid
            LEFT JOIN {question_bank_entries} qbe ON qv.questionbankentryid = qbe.id
            LEFT JOIN {question_categories} qc ON qbe.questioncategoryid = qc.id
            WHERE fq.userid = :userid AND fq.mastered = 0";
    
    $params = array('userid' => $userid);
    
    if ($courseid > 0) {
        $sql .= " AND fq.courseid = :courseid";
        $params['courseid'] = $courseid;
    }
    
    $sql .= " ORDER BY fq.attempts DESC, fq.lastfailed DESC";
    
    $report->most_failed = $DB->get_records_sql($sql, $params, 0, 10);
    
    return $report;
}

/**
 * Process historical quiz attempts to capture failed questions
 */
function process_historical_attempts($userid = null, $limit = 10) {
    global $DB, $USER, $CFG;
    
    if (!$userid) {
        $userid = $USER->id;
    }
    
    // Include required Moodle libraries
    require_once($CFG->dirroot . '/mod/quiz/locallib.php');
    require_once($CFG->dirroot . '/question/engine/lib.php');
    
    $output = [];
    $output['user_id'] = $userid;
    $output['start_time'] = date('Y-m-d H:i:s');
    
    try {
        // Get recent finished quiz attempts for this user
        $sql = "SELECT qa.* 
                FROM {quiz_attempts} qa 
                WHERE qa.userid = :userid 
                AND qa.state = 'finished'
                ORDER BY qa.timemodified DESC 
                LIMIT :limit";
        
        $attempts = $DB->get_records_sql($sql, ['userid' => $userid, 'limit' => $limit]);
        $output['attempts_found'] = count($attempts);
        
        $total_processed = 0;
        $total_failed = 0;
        $total_inserted = 0;
        
        foreach ($attempts as $attempt) {
            try {
                $output['processing_attempt'][] = [
                    'id' => $attempt->id,
                    'quiz' => $attempt->quiz,
                    'time' => date('Y-m-d H:i:s', $attempt->timemodified)
                ];
                
                // Load the quiz attempt object
                $attemptobj = quiz_attempt::create($attempt->id);
                if (!$attemptobj) {
                    $output['errors'][] = "Could not create quiz_attempt object for ID: {$attempt->id}";
                    continue;
                }
                
                // Get all question slots
                $slots = $attemptobj->get_slots();
                
                foreach ($slots as $slot) {
                    try {
                        $total_processed++;
                        
                        // Get question attempt
                        $qa = $attemptobj->get_question_attempt($slot);
                        if (!$qa) continue;
                        
                        // Get question data
                        $question = $qa->get_question();
                        if (!$question) continue;
                        
                        // Get question state and marks
                        $state = $qa->get_state();
                        $mark = $qa->get_mark();
                        $maxmark = $qa->get_max_mark();
                        
                        // Determine if question was failed
                        $is_failed = false;
                        if ($mark === null || $maxmark === null || $maxmark == 0) {
                            // Check state safely
                            $is_incorrect = false;
                            $is_partial = false;
                            
                            try {
                                if (method_exists($state, 'is_incorrect')) {
                                    $is_incorrect = $state->is_incorrect();
                                }
                                if (method_exists($state, 'is_partial')) {
                                    $is_partial = $state->is_partial();
                                }
                            } catch (Exception $e) {
                                // Fallback: assume failed if no marks and can't check state
                                $is_failed = true;
                            }
                            
                            $is_failed = ($is_incorrect || $is_partial);
                        } else {
                            $percentage = ($mark / $maxmark) * 100;
                            $is_failed = $percentage < 50;
                        }
                        
                        if ($is_failed) {
                            $total_failed++;
                            
                            // Check if this failed question already exists for this user
                            $existing = $DB->get_record('local_fqr_failed_questions', [
                                'userid' => $userid,
                                'questionid' => $question->id
                            ]);
                            
                            if (!$existing) {
                                // Get category ID using SQL query for compatibility with new Moodle versions
                                $category_id = 0; // Default value
                                try {
                                    $category_sql = "SELECT qbe.questioncategoryid 
                                                   FROM {question_versions} qv
                                                   LEFT JOIN {question_bank_entries} qbe ON qv.questionbankentryid = qbe.id
                                                   WHERE qv.questionid = ?
                                                   LIMIT 1";
                                    $category_result = $DB->get_field_sql($category_sql, [$question->id]);
                                    if ($category_result) {
                                        $category_id = $category_result;
                                    }
                                } catch (Exception $cat_e) {
                                    // Fallback: use category property if it exists
                                    $category_id = isset($question->category) ? $question->category : 0;
                                }
                                
                                // Insert new failed question record
                                $record = new stdClass();
                                $record->userid = $userid;
                                $record->questionid = $question->id;
                                $record->categoryid = $category_id;
                                $record->quizid = $attempt->quiz;
                                $record->attemptid = $attempt->id;
                                $record->timeadded = time();
                                $record->status = 'failed';
                                
                                $id = $DB->insert_record('local_fqr_failed_questions', $record);
                                if ($id) {
                                    $total_inserted++;
                                }
                            }
                        }
                        
                    } catch (Exception $e) {
                        $output['question_errors'][] = [
                            'attempt' => $attempt->id,
                            'slot' => $slot,
                            'error' => $e->getMessage()
                        ];
                    }
                }
                
            } catch (Exception $e) {
                $output['attempt_errors'][] = [
                    'attempt' => $attempt->id,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        $output['summary'] = [
            'total_processed' => $total_processed,
            'total_failed' => $total_failed,
            'total_inserted' => $total_inserted
        ];
        
        // Final count in database
        $final_count = $DB->count_records('local_fqr_failed_questions', ['userid' => $userid]);
        $output['final_db_count'] = $final_count;
        
    } catch (Exception $e) {
        $output['fatal_error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Test observer functionality manually
 */
function test_observer_functionality() {
    global $DB, $USER;
    
    $output = [];
    
    try {
        // Get the most recent quiz attempt
        $attempt = $DB->get_record_sql(
            "SELECT * FROM {quiz_attempts} WHERE userid = ? AND state = 'finished' ORDER BY timemodified DESC LIMIT 1",
            [$USER->id]
        );
        
        if (!$attempt) {
            $output['error'] = 'No finished quiz attempts found';
            return $output;
        }
        
        $output['attempt'] = [
            'id' => $attempt->id,
            'quiz' => $attempt->quiz,
            'timemodified' => date('Y-m-d H:i:s', $attempt->timemodified)
        ];
        
        $output['before_processing'] = $DB->count_records('local_fqr_failed_questions', ['userid' => $USER->id]);
        
        // Call the simple processing function instead
        $result = simple_process_quiz_attempts($USER->id, 1);
        
        $output['processing_result'] = $result;
        $output['after_processing'] = $DB->count_records('local_fqr_failed_questions', ['userid' => $USER->id]);
        
    } catch (Exception $e) {
        $output['error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Simple function to process quiz attempts using direct SQL queries
 * This avoids complex Moodle library dependencies
 */
function simple_process_quiz_attempts($userid = null, $limit = 10) {
    global $DB, $USER;
    
    if (!$userid) {
        $userid = $USER->id;
    }
    
    $output = [];
    $output['user_id'] = $userid;
    $output['start_time'] = date('Y-m-d H:i:s');
    
    try {
        // Get recent finished quiz attempts for this user
        $sql = "SELECT qa.* 
                FROM {quiz_attempts} qa 
                WHERE qa.userid = :userid 
                AND qa.state = 'finished'
                ORDER BY qa.timemodified DESC 
                LIMIT :limit";
        
        $attempts = $DB->get_records_sql($sql, ['userid' => $userid, 'limit' => $limit]);
        $output['attempts_found'] = count($attempts);
        
        $total_processed = 0;
        $total_failed = 0;
        $total_inserted = 0;
        
        foreach ($attempts as $attempt) {
            try {
                $output['processing_attempt'][] = [
                    'id' => $attempt->id,
                    'quiz' => $attempt->quiz,
                    'uniqueid' => $attempt->uniqueid,
                    'time' => date('Y-m-d H:i:s', $attempt->timemodified)
                ];
                
                // Get question attempts using direct SQL
                $sql_qa = "SELECT qa.*, q.id as question_id, q.name as question_name, qbe.questioncategoryid as category_id
                          FROM {question_attempts} qa
                          JOIN {question_usages} qu ON qa.questionusageid = qu.id
                          JOIN {question} q ON qa.questionid = q.id
                          LEFT JOIN {question_versions} qv ON q.id = qv.questionid
                          LEFT JOIN {question_bank_entries} qbe ON qv.questionbankentryid = qbe.id
                          WHERE qu.id = :uniqueid";
                
                $question_attempts = $DB->get_records_sql($sql_qa, ['uniqueid' => $attempt->uniqueid]);
                
                foreach ($question_attempts as $qa) {
                    try {
                        $total_processed++;
                        
                        // Get the latest step to determine if question was failed
                        $sql_step = "SELECT * FROM {question_attempt_steps} 
                                    WHERE questionattemptid = :qaid 
                                    ORDER BY sequencenumber DESC LIMIT 1";
                        
                        $latest_step = $DB->get_record_sql($sql_step, ['qaid' => $qa->id]);
                        
                        if ($latest_step) {
                            // Parse step data to get fraction (score)
                            $step_data = [];
                            if ($latest_step->data) {
                                $data_records = $DB->get_records('question_attempt_step_data', 
                                    ['attemptstepid' => $latest_step->id]);
                                foreach ($data_records as $data) {
                                    $step_data[$data->name] = $data->value;
                                }
                            }
                            
                            // Check if question was failed
                            $is_failed = false;
                            
                            // Method 1: Check fraction (score)
                            if (isset($step_data['_fraction']) && $step_data['_fraction'] !== null) {
                                $fraction = floatval($step_data['_fraction']);
                                $is_failed = $fraction < 0.5; // Less than 50% is failed
                            } 
                            // Method 2: Check state
                            else if (isset($step_data['_state'])) {
                                $state = $step_data['_state'];
                                $is_failed = in_array($state, ['gradedwrong', 'gradedpartial', 'incorrect']);
                            }
                            // Method 3: Check based on step state
                            else {
                                $is_failed = in_array($latest_step->state, ['gradedwrong', 'gradedpartial', 'incorrect']);
                            }
                            
                            if ($is_failed) {
                                $total_failed++;
                                
                                // Check if this failed question already exists for this user
                                $existing = $DB->get_record('local_fqr_failed_questions', [
                                    'userid' => $userid,
                                    'questionid' => $qa->question_id
                                ]);
                                
                                if (!$existing) {
                                    // Insert new failed question record
                                    $record = new stdClass();
                                    $record->userid = $userid;
                                    $record->questionid = $qa->question_id;
                                    $record->categoryid = $qa->category_id;
                                    $record->quizid = $attempt->quiz;
                                    $record->attemptid = $attempt->id;
                                    $record->timeadded = time();
                                    $record->status = 'failed';
                                    
                                    $id = $DB->insert_record('local_fqr_failed_questions', $record);
                                    if ($id) {
                                        $total_inserted++;
                                        $output['inserted_details'][] = [
                                            'record_id' => $id,
                                            'question_id' => $qa->question_id,
                                            'question_name' => $qa->question_name,
                                            'category_id' => $qa->category_id,
                                            'fraction' => isset($step_data['_fraction']) ? $step_data['_fraction'] : 'unknown',
                                            'state' => isset($step_data['_state']) ? $step_data['_state'] : $latest_step->state
                                        ];
                                    }
                                } else {
                                    $output['already_exists'][] = [
                                        'question_id' => $qa->question_id,
                                        'question_name' => $qa->question_name
                                    ];
                                }
                            }
                        }
                        
                    } catch (Exception $e) {
                        $output['question_errors'][] = [
                            'attempt' => $attempt->id,
                            'question_id' => $qa->question_id,
                            'error' => $e->getMessage()
                        ];
                    }
                }
                
            } catch (Exception $e) {
                $output['attempt_errors'][] = [
                    'attempt' => $attempt->id,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        $output['summary'] = [
            'total_processed' => $total_processed,
            'total_failed' => $total_failed,
            'total_inserted' => $total_inserted
        ];
        
        // Final count in database
        $final_count = $DB->count_records('local_fqr_failed_questions', ['userid' => $userid]);
        $output['final_db_count'] = $final_count;
        
    } catch (Exception $e) {
        $output['fatal_error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Debug SQL queries step by step to identify the issue
 */
function debug_sql_queries($userid = null) {
    global $DB, $USER;
    
    if (!$userid) {
        $userid = $USER->id;
    }
    
    $output = [];
    $output['user_id'] = $userid;
    $output['start_time'] = date('Y-m-d H:i:s');
    
    try {
        // Step 1: Get quiz attempts
        $output['step1'] = 'Getting quiz attempts...';
        $sql1 = "SELECT qa.id, qa.quiz, qa.uniqueid, qa.state, qa.timemodified
                FROM {quiz_attempts} qa 
                WHERE qa.userid = :userid 
                AND qa.state = 'finished'
                ORDER BY qa.timemodified DESC 
                LIMIT 5";
        
        $attempts = $DB->get_records_sql($sql1, ['userid' => $userid]);
        $output['step1_result'] = count($attempts) . ' attempts found';
        $output['attempts'] = array_values($attempts);
        
        if (empty($attempts)) {
            $output['error'] = 'No finished quiz attempts found';
            return $output;
        }
        
        // Take first attempt for testing
        $attempt = reset($attempts);
        $output['testing_attempt'] = $attempt->id;
        
        // Step 2: Check question_usages table
        $output['step2'] = 'Checking question_usages...';
        $sql2 = "SELECT * FROM {question_usages} WHERE id = :uniqueid";
        $usage = $DB->get_record_sql($sql2, ['uniqueid' => $attempt->uniqueid]);
        $output['step2_result'] = $usage ? 'Usage found' : 'Usage NOT found';
        if ($usage) {
            $output['usage_info'] = $usage;
        }
        
        // Step 3: Check question_attempts table
        $output['step3'] = 'Checking question_attempts...';
        $sql3 = "SELECT qa.id, qa.questionusageid, qa.questionid, qa.slot 
                FROM {question_attempts} qa 
                WHERE qa.questionusageid = :uniqueid 
                LIMIT 5";
        $question_attempts = $DB->get_records_sql($sql3, ['uniqueid' => $attempt->uniqueid]);
        $output['step3_result'] = count($question_attempts) . ' question attempts found';
        
        if (!empty($question_attempts)) {
            $qa = reset($question_attempts);
            $output['sample_qa'] = $qa;
            
            // Step 4: Check question table
            $output['step4'] = 'Checking question table...';
            $sql4 = "SELECT q.id, q.name, qbe.questioncategoryid as category 
                     FROM {question} q
                     LEFT JOIN {question_versions} qv ON q.id = qv.questionid
                     LEFT JOIN {question_bank_entries} qbe ON qv.questionbankentryid = qbe.id
                     WHERE q.id = :questionid";
            $question = $DB->get_record_sql($sql4, ['questionid' => $qa->questionid]);
            $output['step4_result'] = $question ? 'Question found' : 'Question NOT found';
            if ($question) {
                $output['question_info'] = $question;
            }
            
            // Step 5: Check question_attempt_steps
            $output['step5'] = 'Checking question_attempt_steps...';
            $sql5 = "SELECT qas.id, qas.state, qas.sequencenumber 
                    FROM {question_attempt_steps} qas 
                    WHERE qas.questionattemptid = :qaid 
                    ORDER BY qas.sequencenumber DESC LIMIT 1";
            $step = $DB->get_record_sql($sql5, ['qaid' => $qa->id]);
            $output['step5_result'] = $step ? 'Step found' : 'Step NOT found';
            if ($step) {
                $output['step_info'] = $step;
                
                // Step 6: Check step data
                $output['step6'] = 'Checking step data...';
                $sql6 = "SELECT qasd.name, qasd.value 
                        FROM {question_attempt_step_data} qasd 
                        WHERE qasd.attemptstepid = :stepid";
                $step_data = $DB->get_records_sql($sql6, ['stepid' => $step->id]);
                $output['step6_result'] = count($step_data) . ' data records found';
                $output['step_data'] = $step_data;
            }
        }
        
    } catch (Exception $e) {
        $output['fatal_error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Ultra simple function to just get and process one quiz attempt
 */
function ultra_simple_process($userid = null) {
    global $DB, $USER;
    
    if (!$userid) {
        $userid = $USER->id;
    }
    
    $output = [];
    $output['user_id'] = $userid;
    
    try {
        // Get one recent attempt
        $attempt = $DB->get_record_sql(
            "SELECT * FROM {quiz_attempts} WHERE userid = ? AND state = 'finished' ORDER BY timemodified DESC LIMIT 1",
            [$userid]
        );
        
        if (!$attempt) {
            $output['error'] = 'No attempts found';
            return $output;
        }
        
        $output['attempt'] = $attempt->id;
        
        // Get question attempts for this quiz attempt using the uniqueid
        $qas = $DB->get_records('question_attempts', ['questionusageid' => $attempt->uniqueid]);
        $output['question_attempts_found'] = count($qas);
        
        $inserted = 0;
        foreach ($qas as $qa) {
            // Get latest step for this question attempt
            $step = $DB->get_record_sql(
                "SELECT * FROM {question_attempt_steps} WHERE questionattemptid = ? ORDER BY sequencenumber DESC LIMIT 1",
                [$qa->id]
            );
            
            if (!$step) continue;
            
            // Simple check: if state contains 'wrong' or 'incorrect', consider it failed
            $is_failed = (strpos(strtolower($step->state), 'wrong') !== false || 
                         strpos(strtolower($step->state), 'incorrect') !== false ||
                         strpos(strtolower($step->state), 'partial') !== false);
            
            if ($is_failed) {
                // Check if already exists
                $existing = $DB->get_record('local_fqr_failed_questions', [
                    'userid' => $userid,
                    'questionid' => $qa->questionid
                ]);
                
                if (!$existing) {
                    // Insert using CORRECT table structure
                    $record = new stdClass();
                    $record->userid = $userid;
                    $record->questionid = $qa->questionid;
                    $record->courseid = 0; // Will be filled later if needed
                    $record->quizid = $attempt->quiz;
                    $record->categoryid = 0; // Will be filled later
                    $record->categoryname = ''; // Will be filled later
                    $record->questiontext = ''; // Will be filled later  
                    $record->questiontype = ''; // Will be filled later
                    $record->attempts = 1; // First attempt
                    $record->lastfailed = time(); // Current timestamp
                    $record->mastered = 0; // Not mastered yet
                    $record->timecreated = time();
                    $record->timemodified = time();
                    
                    try {
                        $id = $DB->insert_record('local_fqr_failed_questions', $record);
                        if ($id) {
                            $inserted++;
                            $output['inserted'][] = [
                                'id' => $id,
                                'question_id' => $qa->questionid,
                                'state' => $step->state
                            ];
                        }
                    } catch (Exception $insert_e) {
                        $output['insert_errors'][] = [
                            'question_id' => $qa->questionid,
                            'error' => 'Insert failed: ' . $insert_e->getMessage()
                        ];
                    }
                }
            }
        }
        
        $output['total_inserted'] = $inserted;
        $output['final_count'] = $DB->count_records('local_fqr_failed_questions', ['userid' => $userid]);
        
    } catch (Exception $e) {
        $output['error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Basic process - avoid accessing question table completely
 */
function basic_process($userid = null) {
    global $DB, $USER;
    
    if (!$userid) {
        $userid = $USER->id;
    }
    
    $output = [];
    $output['user_id'] = $userid;
    $output['start_time'] = date('Y-m-d H:i:s');
    
    try {
        // Get one recent attempt first to test
        $attempt = $DB->get_record_sql(
            "SELECT * FROM {quiz_attempts} WHERE userid = ? AND state = 'finished' ORDER BY timemodified DESC LIMIT 1",
            [$userid]
        );
        
        if (!$attempt) {
            $output['error'] = 'No attempts found';
            return $output;
        }
        
        $output['attempt'] = $attempt->id;
        $output['quiz'] = $attempt->quiz;
        $output['uniqueid'] = $attempt->uniqueid;
        
        // Get question attempts for this quiz attempt
        $qas = $DB->get_records('question_attempts', ['questionusageid' => $attempt->uniqueid]);
        $output['question_attempts_found'] = count($qas);
        
        $inserted = 0;
        $failed_found = 0;
        
        foreach ($qas as $qa) {
            try {
                // Get latest step for this question attempt
                $step = $DB->get_record_sql(
                    "SELECT * FROM {question_attempt_steps} WHERE questionattemptid = ? ORDER BY sequencenumber DESC LIMIT 1",
                    [$qa->id]
                );
                
                if (!$step) {
                    $output['no_step'][] = $qa->id;
                    continue;
                }
                
                // Simple check: if state contains 'wrong' or 'incorrect', consider it failed
                $is_failed = (strpos(strtolower($step->state), 'wrong') !== false || 
                             strpos(strtolower($step->state), 'incorrect') !== false ||
                             strpos(strtolower($step->state), 'partial') !== false);
                
                $output['states'][] = [
                    'qa_id' => $qa->id,
                    'question_id' => $qa->questionid,
                    'state' => $step->state,
                    'is_failed' => $is_failed
                ];
                
                if ($is_failed) {
                    $failed_found++;
                    
                    // Check if already exists in our failed questions table
                    $existing = $DB->get_record('local_fqr_failed_questions', [
                        'userid' => $userid,
                        'questionid' => $qa->questionid
                    ]);
                    
                    if (!$existing) {
                        // Insert new failed question record using CORRECT table structure
                        $record = new stdClass();
                        $record->userid = (int)$userid;
                        $record->questionid = (int)$qa->questionid;
                        $record->courseid = 0; // Will be filled later if needed
                        $record->quizid = (int)$attempt->quiz;
                        $record->categoryid = 0; // Will be filled later
                        $record->categoryname = ''; // Will be filled later
                        $record->questiontext = ''; // Will be filled later  
                        $record->questiontype = ''; // Will be filled later
                        $record->attempts = 1; // First attempt
                        $record->lastfailed = time(); // Current timestamp
                        $record->mastered = 0; // Not mastered yet
                        $record->timecreated = time();
                        $record->timemodified = time();
                        
                        // Debug the record before insertion
                        $output['insert_attempt'][] = [
                            'record' => $record,
                            'question_id' => $qa->questionid
                        ];
                        
                        $id = $DB->insert_record('local_fqr_failed_questions', $record);
                        if ($id) {
                            $inserted++;
                            $output['inserted'][] = [
                                'id' => $id,
                                'question_id' => $qa->questionid,
                                'state' => $step->state
                            ];
                        }
                    } else {
                        $output['already_exists'][] = [
                            'question_id' => $qa->questionid,
                            'existing_id' => $existing->id
                        ];
                    }
                }
                
            } catch (Exception $e) {
                $output['qa_errors'][] = [
                    'qa_id' => $qa->id,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        $output['summary'] = [
            'total_question_attempts' => count($qas),
            'failed_found' => $failed_found,
            'total_inserted' => $inserted
        ];
        
        $output['final_count'] = $DB->count_records('local_fqr_failed_questions', ['userid' => $userid]);
        
    } catch (Exception $e) {
        $output['error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Improved basic process with better error handling and table structure verification
 */
function basic_process_improved($userid = null) {
    global $DB, $USER;
    
    if (!$userid) {
        $userid = $USER->id;
    }
    
    $output = [];
    $output['user_id'] = $userid;
    $output['start_time'] = date('Y-m-d H:i:s');
    
    try {
        // First, let's verify our table structure exists
        $output['table_check'] = 'Checking table structure...';
        
        // Check if our table exists and get its structure
        $table_exists = $DB->get_manager()->table_exists('local_fqr_failed_questions');
        $output['table_exists'] = $table_exists;
        
        if (!$table_exists) {
            $output['error'] = 'Table local_fqr_failed_questions does not exist';
            return $output;
        }
        
        // Get one recent attempt first to test
        $attempt = $DB->get_record_sql(
            "SELECT * FROM {quiz_attempts} WHERE userid = ? AND state = 'finished' ORDER BY timemodified DESC LIMIT 1",
            [$userid]
        );
        
        if (!$attempt) {
            $output['error'] = 'No attempts found';
            return $output;
        }
        
        $output['attempt'] = $attempt->id;
        $output['quiz'] = $attempt->quiz;
        $output['uniqueid'] = $attempt->uniqueid;
        
        // Get question attempts for this quiz attempt
        $qas = $DB->get_records('question_attempts', ['questionusageid' => $attempt->uniqueid]);
        $output['question_attempts_found'] = count($qas);
        
        $inserted = 0;
        $failed_found = 0;
        $insert_errors = [];
        
        foreach ($qas as $qa) {
            try {
                // Get latest step for this question attempt
                $step = $DB->get_record_sql(
                    "SELECT * FROM {question_attempt_steps} WHERE questionattemptid = ? ORDER BY sequencenumber DESC LIMIT 1",
                    [$qa->id]
                );
                
                if (!$step) {
                    $output['no_step'][] = $qa->id;
                    continue;
                }
                
                // Simple check: if state contains 'wrong' or 'incorrect', consider it failed
                $is_failed = (strpos(strtolower($step->state), 'wrong') !== false || 
                             strpos(strtolower($step->state), 'incorrect') !== false ||
                             strpos(strtolower($step->state), 'partial') !== false);
                
                $output['states'][] = [
                    'qa_id' => $qa->id,
                    'question_id' => $qa->questionid,
                    'state' => $step->state,
                    'is_failed' => $is_failed
                ];
                
                if ($is_failed) {
                    $failed_found++;
                    
                    try {
                        // Check if already exists in our failed questions table
                        $existing = $DB->get_record('local_fqr_failed_questions', [
                            'userid' => $userid,
                            'questionid' => $qa->questionid
                        ]);
                        
                        if (!$existing) {
                            // Create record with all required fields explicitly using CORRECT table structure
                            $record = new stdClass();
                            $record->userid = (int)$userid;
                            $record->questionid = (int)$qa->questionid;
                            $record->courseid = 0; // Will be filled later if needed
                            $record->quizid = (int)$attempt->quiz;
                            $record->categoryid = 0; // Will be filled later
                            $record->categoryname = ''; // Will be filled later
                            $record->questiontext = ''; // Will be filled later  
                            $record->questiontype = ''; // Will be filled later
                            $record->attempts = 1; // First attempt
                            $record->lastfailed = time(); // Current timestamp
                            $record->mastered = 0; // Not mastered yet
                            $record->timecreated = time();
                            $record->timemodified = time();
                            
                            // Debug the record before insertion
                            $output['insert_attempt'][] = [
                                'record' => $record,
                                'question_id' => $qa->questionid
                            ];
                            
                            $id = $DB->insert_record('local_fqr_failed_questions', $record);
                            if ($id) {
                                $inserted++;
                                $output['inserted'][] = [
                                    'id' => $id,
                                    'question_id' => $qa->questionid,
                                    'state' => $step->state
                                ];
                            }
                        } else {
                            $output['already_exists'][] = [
                                'question_id' => $qa->questionid,
                                'existing_id' => $existing->id
                            ];
                        }
                        
                    } catch (Exception $insert_e) {
                        $insert_errors[] = [
                            'question_id' => $qa->questionid,
                            'error' => $insert_e->getMessage(),
                            'code' => $insert_e->getCode(),
                            'record_data' => [
                                'userid' => $userid,
                                'questionid' => $qa->questionid,
                                'quizid' => $attempt->quiz,
                                'attemptid' => $attempt->id
                            ]
                        ];
                    }
                }
                
            } catch (Exception $e) {
                $output['qa_errors'][] = [
                    'qa_id' => $qa->id,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        $output['insert_errors'] = $insert_errors;
        $output['summary'] = [
            'total_question_attempts' => count($qas),
            'failed_found' => $failed_found,
            'total_inserted' => $inserted,
            'insert_errors_count' => count($insert_errors)
        ];
        
        $output['final_count'] = $DB->count_records('local_fqr_failed_questions', ['userid' => $userid]);
        
    } catch (Exception $e) {
        $output['error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Deep table structure diagnosis to identify insertion problems
 */
function table_structure_diagnosis($userid = null) {
    global $DB, $USER, $CFG;
    
    if (!$userid) {
        $userid = $USER->id;
    }
    
    $output = [];
    $output['user_id'] = $userid;
    $output['start_time'] = date('Y-m-d H:i:s');
    
    try {
        // 1. Check table existence
        $table_exists = $DB->get_manager()->table_exists('local_fqr_failed_questions');
        $output['table_exists'] = $table_exists;
        
        if (!$table_exists) {
            $output['error'] = 'Table does not exist';
            return $output;
        }
        
        // 2. Get table structure using DESCRIBE/SHOW COLUMNS
        try {
            // For MySQL/MariaDB
            $columns = $DB->get_records_sql("DESCRIBE {local_fqr_failed_questions}");
            $output['table_structure'] = $columns;
        } catch (Exception $e) {
            try {
                // Alternative method - get column info
                $sql = "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA 
                       FROM INFORMATION_SCHEMA.COLUMNS 
                       WHERE TABLE_NAME = 'mdl_local_fqr_failed_questions' 
                       ORDER BY ORDINAL_POSITION";
                $columns = $DB->get_records_sql($sql);
                $output['table_structure_alt'] = $columns;
            } catch (Exception $e2) {
                $output['structure_error'] = $e2->getMessage();
            }
        }
        
        // 3. Check current record count
        $output['current_record_count'] = $DB->count_records('local_fqr_failed_questions');
        $output['current_user_records'] = $DB->count_records('local_fqr_failed_questions', ['userid' => $userid]);
        
        // 4. Test simple insertion with minimal data
        $output['insertion_tests'] = [];
        
        // Test 1: Minimal record using CORRECT table structure
        try {
            $test_record = new stdClass();
            $test_record->userid = (int)$userid;
            $test_record->questionid = 99999; // Use a fake question ID that won't conflict
            $test_record->courseid = 0;
            $test_record->quizid = 0;
            $test_record->categoryid = 0;
            $test_record->categoryname = 'Test Category';
            $test_record->questiontext = 'Test Question';
            $test_record->questiontype = 'multichoice';
            $test_record->attempts = 1;
            $test_record->lastfailed = time();
            $test_record->mastered = 0;
            $test_record->timecreated = time();
            $test_record->timemodified = time();
            
            $test_id = $DB->insert_record('local_fqr_failed_questions', $test_record);
            $output['insertion_tests']['minimal_test'] = [
                'success' => true,
                'id' => $test_id
            ];
            
            // Clean up test record
            $DB->delete_records('local_fqr_failed_questions', ['id' => $test_id]);
            
        } catch (Exception $test_e) {
            $output['insertion_tests']['minimal_test'] = [
                'success' => false,
                'error' => $test_e->getMessage(),
                'code' => $test_e->getCode(),
                'sql_state' => method_exists($test_e, 'getSQLState') ? $test_e->getSQLState() : 'unknown'
            ];
        }
        
        // Test 2: Check for unique constraints using CORRECT table structure
        try {
            // Try to insert the same record twice to test unique constraints
            $test_record2 = new stdClass();
            $test_record2->userid = (int)$userid;
            $test_record2->questionid = 99998;
            $test_record2->courseid = 0;
            $test_record2->quizid = 0;
            $test_record2->categoryid = 0;
            $test_record2->categoryname = 'Test Category 2';
            $test_record2->questiontext = 'Test Question 2';
            $test_record2->questiontype = 'multichoice';
            $test_record2->attempts = 1;
            $test_record2->lastfailed = time();
            $test_record2->mastered = 0;
            $test_record2->timecreated = time();
            $test_record2->timemodified = time();
            
            $test_id1 = $DB->insert_record('local_fqr_failed_questions', $test_record2);
            $test_id2 = $DB->insert_record('local_fqr_failed_questions', $test_record2);
            
            $output['insertion_tests']['duplicate_test'] = [
                'success' => true,
                'allows_duplicates' => true,
                'id1' => $test_id1,
                'id2' => $test_id2
            ];
            
            // Clean up
            $DB->delete_records('local_fqr_failed_questions', ['id' => $test_id1]);
            $DB->delete_records('local_fqr_failed_questions', ['id' => $test_id2]);
            
        } catch (Exception $dup_e) {
            $output['insertion_tests']['duplicate_test'] = [
                'success' => false,
                'allows_duplicates' => false,
                'error' => $dup_e->getMessage(),
                'code' => $dup_e->getCode()
            ];
        }
        
        // 5. Test with real question ID using CORRECT table structure
        try {
            $test_record3 = new stdClass();
            $test_record3->userid = (int)$userid;
            $test_record3->questionid = 16479; // Use one of the real failing question IDs
            $test_record3->courseid = 0;
            $test_record3->quizid = 61;
            $test_record3->categoryid = 0;
            $test_record3->categoryname = 'Real Test Category';
            $test_record3->questiontext = 'Real Test Question';
            $test_record3->questiontype = 'multichoice';
            $test_record3->attempts = 1;
            $test_record3->lastfailed = time();
            $test_record3->mastered = 0;
            $test_record3->timecreated = time();
            $test_record3->timemodified = time();
            
            $test_id3 = $DB->insert_record('local_fqr_failed_questions', $test_record3);
            $output['insertion_tests']['real_data_test'] = [
                'success' => true,
                'id' => $test_id3
            ];
            
            // Clean up
            $DB->delete_records('local_fqr_failed_questions', ['id' => $test_id3]);
            
        } catch (Exception $real_e) {
            $output['insertion_tests']['real_data_test'] = [
                'success' => false,
                'error' => $real_e->getMessage(),
                'code' => $real_e->getCode()
            ];
        }
        
        // 6. Check database permissions
        try {
            $output['permissions_test'] = [];
            
            // Test SELECT permission
            $count = $DB->count_records('local_fqr_failed_questions');
            $output['permissions_test']['select'] = true;
            
            // Test INSERT permission (already tested above)
            $output['permissions_test']['insert'] = isset($output['insertion_tests']['minimal_test']['success']) 
                ? $output['insertion_tests']['minimal_test']['success'] : false;
            
            // Test UPDATE permission
            try {
                $DB->execute("UPDATE {local_fqr_failed_questions} SET status = status WHERE 1=0");
                $output['permissions_test']['update'] = true;
            } catch (Exception $update_e) {
                $output['permissions_test']['update'] = false;
                $output['permissions_test']['update_error'] = $update_e->getMessage();
            }
            
            // Test DELETE permission
            try {
                $DB->execute("DELETE FROM {local_fqr_failed_questions} WHERE 1=0");
                $output['permissions_test']['delete'] = true;
            } catch (Exception $delete_e) {
                $output['permissions_test']['delete'] = false;
                $output['permissions_test']['delete_error'] = $delete_e->getMessage();
            }
            
        } catch (Exception $perm_e) {
            $output['permissions_error'] = $perm_e->getMessage();
        }
        
        // 7. Check table constraints and indexes
        try {
            // Get table indexes
            $sql = "SHOW INDEX FROM {local_fqr_failed_questions}";
            $indexes = $DB->get_records_sql($sql);
            $output['table_indexes'] = $indexes;
        } catch (Exception $idx_e) {
            $output['index_error'] = $idx_e->getMessage();
        }
        
    } catch (Exception $e) {
        $output['fatal_error'] = $e->getMessage();
        $output['trace'] = $e->getTraceAsString();
    }
    
    return $output;
}

/**
 * Get failed questions for multiple categories
 */
function get_failed_questions_for_multiple_categories($userid, $category_ids) {
    global $DB;
    
    if (empty($category_ids)) {
        return array();
    }
    
    // Crear placeholders para la consulta IN
    list($in_sql, $params) = $DB->get_in_or_equal($category_ids, SQL_PARAMS_NAMED);
    $params['userid'] = $userid;
    
    $sql = "SELECT * FROM {local_failed_questions_recovery} 
            WHERE userid = :userid 
            AND quizid $in_sql 
            AND mastered = 0
            ORDER BY RAND()"; // Mezclar preguntas de diferentes categorías
    
    return $DB->get_records_sql($sql, $params);
}

/**
 * Get all failed questions for a user (todas las categorías)
 */
function get_all_failed_questions_for_user($userid) {
    global $DB;
    
    $sql = "SELECT * FROM {local_failed_questions_recovery} 
            WHERE userid = ? 
            AND mastered = 0
            ORDER BY RAND()"; // Mezclar todas las preguntas
    
    return $DB->get_records_sql($sql, [$userid]);
}

/**
 * Get count of failed questions by type
 */
function get_failed_questions_count($userid, $quiz_type = 'single', $target_categories = array()) {
    global $DB;
    
    switch ($quiz_type) {
        case 'all':
            return $DB->count_records('local_failed_questions_recovery', [
                'userid' => $userid, 
                'mastered' => 0
            ]);
            
        case 'multiple':
            if (empty($target_categories)) {
                return 0;
            }
            list($in_sql, $params) = $DB->get_in_or_equal($target_categories, SQL_PARAMS_NAMED);
            $params['userid'] = $userid;
            
            return $DB->count_records_sql(
                "SELECT COUNT(*) FROM {local_failed_questions_recovery} 
                 WHERE userid = :userid AND quizid $in_sql AND mastered = 0",
                $params
            );
            
        case 'single':
        default:
            if (empty($target_categories)) {
                return 0;
            }
            return $DB->count_records('local_failed_questions_recovery', [
                'userid' => $userid,
                'categoryid' => $target_categories[0],
                'mastered' => 0
            ]);
    }
}

/**
 * Get category names for display
 */
function get_categories_display_names($category_ids) {
    global $DB;
    
    if (empty($category_ids)) {
        return array();
    }
    
    list($in_sql, $params) = $DB->get_in_or_equal($category_ids, SQL_PARAMS_NAMED);
    
    $sql = "SELECT DISTINCT fq.quizid, COALESCE(q.name, fq.categoryname) as display_name
            FROM {local_failed_questions_recovery} fq
            LEFT JOIN {quiz} q ON fq.quizid = q.id
            WHERE fq.quizid $in_sql";
    
    $records = $DB->get_records_sql($sql, $params);
    
    $names = array();
    foreach ($records as $record) {
        $names[] = $record->display_name;
    }
    
    return $names;
}

/**
 * Create recovery quiz with all categories
 */
function create_recovery_quiz_all_categories($userid, $courseid, $questioncount, $quizname) {
    global $DB, $CFG;
    
    // Obtener todas las preguntas falladas del usuario
    $failed_questions = get_all_failed_questions_for_user($userid);
    
    if (empty($failed_questions)) {
        throw new Exception('No hay preguntas falladas disponibles para todas las categorías.');
    }
    
    // Limitar el número de preguntas
    $selected_questions = array_slice($failed_questions, 0, $questioncount);
    
    // Crear el quiz usando el framework existente
    return create_custom_recovery_quiz($userid, $courseid, $selected_questions, $quizname, 'Todas las categorías');
}

/**
 * Create recovery quiz with multiple categories
 */
function create_recovery_quiz_multiple_categories($userid, $courseid, $category_ids, $questioncount, $quizname) {
    global $DB, $CFG;
    
    if (empty($category_ids)) {
        throw new Exception('No se proporcionaron categorías válidas.');
    }
    
    // Obtener preguntas falladas de las categorías seleccionadas
    $failed_questions = get_failed_questions_for_multiple_categories($userid, $category_ids);
    
    if (empty($failed_questions)) {
        throw new Exception('No hay preguntas falladas disponibles en las categorías seleccionadas.');
    }
    
    // Limitar el número de preguntas
    $selected_questions = array_slice($failed_questions, 0, $questioncount);
    
    // Obtener nombres de categorías para el título
    $category_names = get_categories_display_names($category_ids);
    $categories_text = count($category_names) > 3 
        ? count($category_names) . ' categorías seleccionadas'
        : implode(', ', $category_names);
    
    // Crear el quiz usando el framework existente
    return create_custom_recovery_quiz($userid, $courseid, $selected_questions, $quizname, $categories_text);
}

/**
 * Create a custom recovery quiz with specific questions
 */
function create_custom_recovery_quiz($userid, $courseid, $failed_questions, $quizname, $description) {
    global $DB, $CFG;
    require_once($CFG->dirroot . '/mod/quiz/lib.php');
    require_once($CFG->dirroot . '/question/engine/lib.php');
    
    // Crear un nuevo quiz en Moodle
    $quiz = new stdClass();
    $quiz->course = $courseid;
    $quiz->name = $quizname;
    $quiz->intro = 'Quiz de recuperación personalizado: ' . $description;
    $quiz->introformat = FORMAT_HTML;
    $quiz->timeopen = 0;
    $quiz->timeclose = 0;
    $quiz->timelimit = 0;
    $quiz->overduehandling = 'autoabandon';
    $quiz->graceperiod = 0;
    $quiz->preferredbehaviour = 'deferredfeedback';
    $quiz->canredoquestions = 1;
    $quiz->attempts = 0; // Intentos ilimitados
    $quiz->attemptonlast = 0;
    $quiz->grademethod = QUIZ_GRADEHIGHEST;
    $quiz->decimalpoints = 2;
    $quiz->questiondecimalpoints = -1;
    $quiz->reviewattempt = 0x11111;
    $quiz->reviewcorrectness = 0x11111;
    $quiz->reviewmarks = 0x11111;
    $quiz->reviewspecificfeedback = 0x11111;
    $quiz->reviewgeneralfeedback = 0x11111;
    $quiz->reviewrightanswer = 0x11111;
    $quiz->reviewoverallfeedback = 0x11111;
    $quiz->questionsperpage = 1;
    $quiz->navmethod = 'free';
    $quiz->shuffleanswers = 1;
    $quiz->sumgrades = 0;
    $quiz->grade = 10;
    $quiz->timecreated = time();
    $quiz->timemodified = time();
    $quiz->password = '';
    $quiz->subnet = '';
    $quiz->browsersecurity = '-';
    $quiz->delay1 = 0;
    $quiz->delay2 = 0;
    $quiz->showuserpicture = 0;
    $quiz->showblocks = 0;
    $quiz->completionattemptsexhausted = 0;
    $quiz->completionpass = 0;
    $quiz->allowofflineattempts = 0;
    
    // Insertar el quiz
    $quiz->id = $DB->insert_record('quiz', $quiz);
    
    // Crear las instancias de las preguntas en el quiz
    $sumgrades = 0;
    $pagenum = 1;
    
    foreach ($failed_questions as $fq) {
        // Verificar que la pregunta existe
        $question = $DB->get_record('question', array('id' => $fq->questionid));
        if (!$question) {
            continue;
        }
        
        // Agregar la pregunta al quiz
        $quiz_slot = new stdClass();
        $quiz_slot->quizid = $quiz->id;
        $quiz_slot->slot = $pagenum;
        $quiz_slot->page = $pagenum;
        $quiz_slot->requireprevious = 0;
        $quiz_slot->questionid = $fq->questionid;
        $quiz_slot->questioncategoryid = $fq->categoryid ?: 1;
        $quiz_slot->includingsubcategories = 0;
        $quiz_slot->maxmark = 1.0; // 1 punto por pregunta
        
        $DB->insert_record('quiz_slots', $quiz_slot);
        
        $sumgrades += 1.0;
        $pagenum++;
    }
    
    // Actualizar la suma de calificaciones
    $DB->update_record('quiz', array('id' => $quiz->id, 'sumgrades' => $sumgrades));
    
    // CRÍTICO: Crear entrada en la tabla de recuperación
    // Intentar crear la tabla si no existe
    try {
        $recovery_record = new stdClass();
        $recovery_record->userid = $userid;
        $recovery_record->courseid = $courseid;
        $recovery_record->categoryid = 0; // Para múltiples categorías, usamos 0
        $recovery_record->categoryname = $description;
        $recovery_record->quizname = $quizname;
        $recovery_record->questioncount = count($failed_questions);
        $recovery_record->timecreated = time();
        $recovery_record->completed = 0;
        
        // Insertar en la tabla de recuperación
        $recovery_id = $DB->insert_record('local_fqr_recovery_quizzes', $recovery_record);
        
        // DEVOLVER EL ID DE LA TABLA DE RECUPERACIÓN, NO EL ID DEL QUIZ DE MOODLE
        return $recovery_id;
        
    } catch (Exception $e) {
        // Si hay error con la tabla de recuperación, crear una entrada alternativa usando 
        // la estructura esperada por take_quiz.php
        
        // Como fallback, redirigir directamente al quiz de Moodle
        throw new Exception('Error al crear el registro de recuperación. Quiz de Moodle creado con ID: ' . $quiz->id . '. Error: ' . $e->getMessage());
    }
} 