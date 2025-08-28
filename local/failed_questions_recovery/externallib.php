<?php
defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . "/externallib.php");

class local_failed_questions_recovery_external extends external_api {

    /**
     * Returns description of method parameters
     */
    public static function get_failed_questions_parameters() {
        return new external_function_parameters(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID', VALUE_DEFAULT, 0),
                'courseid' => new external_value(PARAM_INT, 'Course ID', VALUE_DEFAULT, 0),
                'categoryid' => new external_value(PARAM_INT, 'Category ID', VALUE_DEFAULT, 0),
                'onlynotmastered' => new external_value(PARAM_BOOL, 'Only not mastered questions', VALUE_DEFAULT, true),
            )
        );
    }

    /**
     * Get failed questions for a user
     */
    public static function get_failed_questions($userid = 0, $courseid = 0, $categoryid = 0, $onlynotmastered = true) {
        global $DB, $USER;
        
        $params = self::validate_parameters(self::get_failed_questions_parameters(), array(
            'userid' => $userid,
            'courseid' => $courseid,
            'categoryid' => $categoryid,
            'onlynotmastered' => $onlynotmastered
        ));
        
        // Use current user if not specified
        if ($params['userid'] == 0) {
            $params['userid'] = $USER->id;
        }
        
        // Build query conditions
        $conditions = array('userid' => $params['userid']);
        
        if ($params['courseid'] > 0) {
            $conditions['courseid'] = $params['courseid'];
        }
        
        if ($params['categoryid'] > 0) {
            $conditions['categoryid'] = $params['categoryid'];
        }
        
        if ($params['onlynotmastered']) {
            $conditions['mastered'] = 0;
        }
        
        // Get failed questions
        $failed_questions = $DB->get_records('local_failed_questions_recovery', $conditions, 'lastfailed DESC');
        
        $result = array();
        foreach ($failed_questions as $fq) {
            $result[] = array(
                'id' => $fq->id,
                'questionid' => $fq->questionid,
                'courseid' => $fq->courseid,
                'quizid' => $fq->quizid,
                'categoryid' => $fq->categoryid,
                'categoryname' => $fq->categoryname,
                'questiontext' => format_text($fq->questiontext),
                'questiontype' => $fq->questiontype,
                'attempts' => $fq->attempts,
                'lastfailed' => $fq->lastfailed,
                'mastered' => $fq->mastered,
                'timecreated' => $fq->timecreated,
            );
        }
        
        return $result;
    }

    /**
     * Returns description of method result value
     */
    public static function get_failed_questions_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(
                    'id' => new external_value(PARAM_INT, 'Failed question record ID'),
                    'questionid' => new external_value(PARAM_INT, 'Question ID'),
                    'courseid' => new external_value(PARAM_INT, 'Course ID'),
                    'quizid' => new external_value(PARAM_INT, 'Quiz ID'),
                    'categoryid' => new external_value(PARAM_INT, 'Category ID'),
                    'categoryname' => new external_value(PARAM_TEXT, 'Category name'),
                    'questiontext' => new external_value(PARAM_RAW, 'Question text'),
                    'questiontype' => new external_value(PARAM_TEXT, 'Question type'),
                    'attempts' => new external_value(PARAM_INT, 'Number of failed attempts'),
                    'lastfailed' => new external_value(PARAM_INT, 'Last failed timestamp'),
                    'mastered' => new external_value(PARAM_INT, 'Mastered status'),
                    'timecreated' => new external_value(PARAM_INT, 'Created timestamp'),
                )
            )
        );
    }

    /**
     * Returns description of method parameters
     */
    public static function get_categories_parameters() {
        return new external_function_parameters(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID', VALUE_DEFAULT, 0),
                'courseid' => new external_value(PARAM_INT, 'Course ID', VALUE_DEFAULT, 0),
            )
        );
    }

    /**
     * Get categories with failed questions for a user
     */
    public static function get_categories($userid = 0, $courseid = 0) {
        global $DB, $USER;
        
        $params = self::validate_parameters(self::get_categories_parameters(), array(
            'userid' => $userid,
            'courseid' => $courseid
        ));
        
        // Use current user if not specified
        if ($params['userid'] == 0) {
            $params['userid'] = $USER->id;
        }
        
        // Build query - usando consulta simplificada como en las otras funciones
        $sql = "SELECT fq.quizid as categoryid, fq.categoryname as display_name,
                       COUNT(*) as failedcount, 
                       SUM(CASE WHEN fq.mastered = 0 THEN 1 ELSE 0 END) as notmasteredcount
                FROM {local_failed_questions_recovery} fq
                WHERE fq.userid = :userid";
        
        $sqlparams = array('userid' => $params['userid']);
        
        if ($params['courseid'] > 0) {
            $sql .= " AND fq.courseid = :courseid";
            $sqlparams['courseid'] = $params['courseid'];
        }
        
        $sql .= " GROUP BY fq.quizid, fq.categoryname ORDER BY fq.categoryname";
        
        $categories = $DB->get_records_sql($sql, $sqlparams);
        
        $result = array();
        foreach ($categories as $category) {
            $result[] = array(
                'categoryid' => $category->categoryid,
                'categoryname' => $category->display_name,
                'failedcount' => $category->failedcount,
                'notmasteredcount' => $category->notmasteredcount,
            );
        }
        
        return $result;
    }

    /**
     * Returns description of method result value
     */
    public static function get_categories_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(
                    'categoryid' => new external_value(PARAM_INT, 'Category ID'),
                    'categoryname' => new external_value(PARAM_TEXT, 'Category name'),
                    'failedcount' => new external_value(PARAM_INT, 'Total failed questions'),
                    'notmasteredcount' => new external_value(PARAM_INT, 'Not mastered questions'),
                )
            )
        );
    }

    /**
     * Returns description of method parameters
     */
    public static function create_recovery_quiz_parameters() {
        return new external_function_parameters(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID', VALUE_DEFAULT, 0),
                'courseid' => new external_value(PARAM_INT, 'Course ID'),
                'categoryid' => new external_value(PARAM_INT, 'Category ID', VALUE_DEFAULT, 0),
                'questioncount' => new external_value(PARAM_INT, 'Number of questions', VALUE_DEFAULT, 10),
                'quizname' => new external_value(PARAM_TEXT, 'Quiz name', VALUE_DEFAULT, ''),
            )
        );
    }

    /**
     * Create a recovery quiz with failed questions
     */
    public static function create_recovery_quiz($userid = 0, $courseid, $categoryid = 0, $questioncount = 10, $quizname = '') {
        global $DB, $USER;
        
        $params = self::validate_parameters(self::create_recovery_quiz_parameters(), array(
            'userid' => $userid,
            'courseid' => $courseid,
            'categoryid' => $categoryid,
            'questioncount' => $questioncount,
            'quizname' => $quizname
        ));
        
        // Use current user if not specified
        if ($params['userid'] == 0) {
            $params['userid'] = $USER->id;
        }
        
        // Build conditions for failed questions
        $conditions = array(
            'userid' => $params['userid'],
            'mastered' => 0
        );
        
        if ($params['categoryid'] > 0) {
            // Buscar por quizid ya que ahora usamos quizid como identificador de categoría
            $conditions['quizid'] = $params['categoryid'];
        }
        
        // Get failed questions
        $failed_questions = $DB->get_records('local_failed_questions_recovery', $conditions, 'lastfailed DESC', '*', 0, $params['questioncount']);
        
        if (empty($failed_questions)) {
            throw new moodle_exception('nofailedquestions', 'local_failed_questions_recovery');
        }
        
        // Get category info if needed
        $category = null;
            $category_name = '';
            if ($params['categoryid'] > 0) {
                $category = $DB->get_record('question_categories', array('id' => $params['categoryid']));
                $category_name = $category ? ' - ' . $category->name : '';
            }
        
        // Generate quiz name if not provided
        if (empty($params['quizname'])) {
            $params['quizname'] = 'Recovery Quiz' . $category_name . ' - ' . date('Y-m-d H:i');
        }
        
        // Get the courseid from the first failed question
        $first_question = reset($failed_questions);
        $actual_courseid = $first_question->courseid;
        
        // Create recovery quiz record
        $quiz_record = new stdClass();
        $quiz_record->userid = $params['userid'];
        $quiz_record->courseid = $actual_courseid;  // Use the actual courseid from the questions
        $quiz_record->categoryid = $params['categoryid'] > 0 ? $params['categoryid'] : null;
        $quiz_record->categoryname = $params['categoryid'] > 0 && $category ? $category->name : 'Mixed';
        $quiz_record->quizname = $params['quizname'];
        $quiz_record->questioncount = count($failed_questions);
        $quiz_record->completed = 0;
        $quiz_record->timecreated = time();
        
        $quiz_id = $DB->insert_record('local_fqr_recovery_quizzes', $quiz_record);
        
        // Return the quiz info and questions
        $questions = array();
        foreach ($failed_questions as $fq) {
            $questions[] = array(
                'questionid' => $fq->questionid,
                'questiontext' => format_text($fq->questiontext),
                'questiontype' => $fq->questiontype,
                'attempts' => $fq->attempts,
            );
        }
        
        return array(
            'quizid' => $quiz_id,
            'quizname' => $params['quizname'],
            'questioncount' => count($failed_questions),
            'questions' => $questions
        );
    }

    /**
     * Returns description of method result value
     */
    public static function create_recovery_quiz_returns() {
        return new external_single_structure(
            array(
                'quizid' => new external_value(PARAM_INT, 'Recovery quiz ID'),
                'quizname' => new external_value(PARAM_TEXT, 'Quiz name'),
                'questioncount' => new external_value(PARAM_INT, 'Number of questions'),
                'questions' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'questionid' => new external_value(PARAM_INT, 'Question ID'),
                            'questiontext' => new external_value(PARAM_RAW, 'Question text'),
                            'questiontype' => new external_value(PARAM_TEXT, 'Question type'),
                            'attempts' => new external_value(PARAM_INT, 'Failed attempts'),
                        )
                    )
                )
            )
        );
    }

    /**
     * Returns description of method parameters
     */
    public static function get_recovery_quizzes_parameters() {
        return new external_function_parameters(
            array(
                'userid' => new external_value(PARAM_INT, 'User ID', VALUE_DEFAULT, 0),
                'courseid' => new external_value(PARAM_INT, 'Course ID', VALUE_DEFAULT, 0),
            )
        );
    }

    /**
     * Get recovery quizzes for a user
     */
    public static function get_recovery_quizzes($userid = 0, $courseid = 0) {
        global $DB, $USER;
        
        $params = self::validate_parameters(self::get_recovery_quizzes_parameters(), array(
            'userid' => $userid,
            'courseid' => $courseid
        ));
        
        // Use current user if not specified
        if ($params['userid'] == 0) {
            $params['userid'] = $USER->id;
        }
        
        $conditions = array('userid' => $params['userid']);
        
        if ($params['courseid'] > 0) {
            $conditions['courseid'] = $params['courseid'];
        }
        
        $recovery_quizzes = $DB->get_records('local_fqr_recovery_quizzes', $conditions, 'timecreated DESC');
        
        $result = array();
        foreach ($recovery_quizzes as $quiz) {
            $result[] = array(
                'id' => $quiz->id,
                'courseid' => $quiz->courseid,
                'categoryid' => $quiz->categoryid,
                'categoryname' => $quiz->categoryname,
                'quizname' => $quiz->quizname,
                'questioncount' => $quiz->questioncount,
                'completed' => $quiz->completed,
                'score' => $quiz->score,
                'timecreated' => $quiz->timecreated,
                'timecompleted' => $quiz->timecompleted,
            );
        }
        
        return $result;
    }

    /**
     * Returns description of method result value
     */
    public static function get_recovery_quizzes_returns() {
        return new external_multiple_structure(
            new external_single_structure(
                array(
                    'id' => new external_value(PARAM_INT, 'Recovery quiz ID'),
                    'courseid' => new external_value(PARAM_INT, 'Course ID'),
                    'categoryid' => new external_value(PARAM_INT, 'Category ID', VALUE_OPTIONAL),
                    'categoryname' => new external_value(PARAM_TEXT, 'Category name'),
                    'quizname' => new external_value(PARAM_TEXT, 'Quiz name'),
                    'questioncount' => new external_value(PARAM_INT, 'Number of questions'),
                    'completed' => new external_value(PARAM_INT, 'Completed status'),
                    'score' => new external_value(PARAM_FLOAT, 'Score', VALUE_OPTIONAL),
                    'timecreated' => new external_value(PARAM_INT, 'Created timestamp'),
                    'timecompleted' => new external_value(PARAM_INT, 'Completed timestamp', VALUE_OPTIONAL),
                )
            )
        );
    }

    /**
     * Returns description of method parameters
     */
    public static function complete_recovery_quiz_parameters() {
        return new external_function_parameters(
            array(
                'quizid' => new external_value(PARAM_INT, 'Recovery quiz ID'),
                'score' => new external_value(PARAM_FLOAT, 'Final score'),
                'responses' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'questionid' => new external_value(PARAM_INT, 'Question ID'),
                            'iscorrect' => new external_value(PARAM_BOOL, 'Is correct'),
                            'response' => new external_value(PARAM_TEXT, 'User response', VALUE_OPTIONAL),
                        )
                    )
                ),
            )
        );
    }

    /**
     * Complete a recovery quiz and update mastery status
     */
    public static function complete_recovery_quiz($quizid, $score, $responses) {
        global $DB;
        
        $params = self::validate_parameters(self::complete_recovery_quiz_parameters(), array(
            'quizid' => $quizid,
            'score' => $score,
            'responses' => $responses
        ));
        
        // Get recovery quiz
        $quiz = $DB->get_record('local_fqr_recovery_quizzes', array('id' => $params['quizid']));
        if (!$quiz) {
            throw new moodle_exception('quiznotfound', 'local_failed_questions_recovery');
        }
        
        // Update quiz completion
        $quiz->completed = 1;
        $quiz->score = $params['score'];
        $quiz->timecompleted = time();
        
        $DB->update_record('local_fqr_recovery_quizzes', $quiz);
        
        // Process responses and update mastery status
        foreach ($params['responses'] as $response) {
            // Record the attempt
            $attempt_record = new stdClass();
            $attempt_record->recoveryquizid = $params['quizid'];
            $attempt_record->userid = $quiz->userid;
            $attempt_record->questionid = $response['questionid'];
            $attempt_record->iscorrect = $response['iscorrect'] ? 1 : 0;
            $attempt_record->response = isset($response['response']) ? $response['response'] : '';
            $attempt_record->timeanswered = time();
            
            $DB->insert_record('local_fqr_recovery_attempts', $attempt_record);
            
            // Update mastery status if answered correctly
            if ($response['iscorrect']) {
                $failed_question = $DB->get_record('local_failed_questions_recovery', array(
                    'userid' => $quiz->userid,
                    'questionid' => $response['questionid']
                ));
                
                if ($failed_question) {
                    $failed_question->mastered = 1;
                    $failed_question->timemodified = time();
                    $DB->update_record('local_failed_questions_recovery', $failed_question);
                }
            }
        }
        
        return array(
            'success' => true,
            'message' => 'Recovery quiz completed successfully'
        );
    }

    /**
     * Returns description of method result value
     */
    public static function complete_recovery_quiz_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'message' => new external_value(PARAM_TEXT, 'Result message'),
            )
        );
    }
} 