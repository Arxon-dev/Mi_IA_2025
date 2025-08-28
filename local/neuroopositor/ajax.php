<?php
/**
 * NeuroOpositor AJAX Handler
 *
 * @package    local_neuroopositor
 * @copyright  2024 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');

// Security checks
require_login();
require_sesskey();
error_log('AJAX: Después de require_login y require_sesskey');


// Set JSON header
header('Content-Type: application/json');

// Get request data
$input = file_get_contents('php://input');
error_log('AJAX: Input recibido: ' . $input);
$data = json_decode($input, true);
error_log('AJAX: Data decodificada: ' . print_r($data, true));


if (!$data || !isset($data['action'])) {
    http_response_code(400);
    echo json_encode(array('success' => false, 'message' => 'Invalid request'));
    exit;
}

$action = $data['action'];
$response = array('success' => false, 'message' => 'Unknown action');

try {
    switch ($action) {
        case 'get_neural_map_data':
            $response = handle_get_neural_map_data($data);
            break;
            
        case 'update_node_position':
            $response = handle_update_node_position($data);
            break;
            
        case 'calculate_optimal_path':
            $response = handle_calculate_optimal_path($data);
            break;
            
        case 'start_question_session':
            error_log('AJAX: Iniciando handle_start_question_session');
            $response = handle_start_question_session($data);
            error_log('AJAX: Respuesta de handle_start_question_session: ' . print_r($response, true));
            break;
            
        case 'submit_answer':
            $response = handle_submit_answer($data);
            break;
            
        case 'submit_question_session':
            $response = handle_submit_question_session($data);
            break;
            
        case 'get_user_stats':
            $response = handle_get_user_stats($data);
            break;
            
        case 'get_ai_recommendations':
            $response = handle_get_ai_recommendations($data);
            break;
            
        case 'update_user_preferences':
            $response = handle_update_user_preferences($data);
            break;
            
        case 'create_topic':
            $response = handle_create_topic($data);
            break;
            
        case 'update_topic':
            $response = handle_update_topic($data);
            break;
            
        case 'delete_topic':
            $response = handle_delete_topic($data);
            break;
            
        case 'create_connection':
            $response = handle_create_connection($data);
            break;
            
        case 'update_connection':
            $response = handle_update_connection($data);
            break;
            
        case 'delete_connection':
            $response = handle_delete_connection($data);
            break;
            
        case 'auto_arrange_topics':
            $response = handle_auto_arrange_topics($data);
            break;
            
        case 'export_data':
            $response = handle_export_data($data);
            break;
            
        case 'import_data':
            $response = handle_import_data($data);
            break;
            
        case 'refresh_cache':
            $response = handle_refresh_cache($data);
            break;
            
        default:
            $response = array('success' => false, 'message' => 'Action not implemented: ' . $action);
    }
} catch (Exception $e) {
    $response = array(
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage(),
        'debug' => debugging() ? $e->getTraceAsString() : null
    );
}

echo json_encode($response);
exit;

/**
 * Handle get neural map data request
 */
function handle_get_neural_map_data($data) {
    global $USER;
    
    $courseid = isset($data['courseid']) ? (int)$data['courseid'] : 0;
    $userid = isset($data['userid']) ? (int)$data['userid'] : $USER->id;
    
    // Check permissions
    $context = $courseid ? context_course::instance($courseid) : context_system::instance();
    require_capability('local/neuroopositor:view', $context);
    
    $neural_map = new local_neuroopositor_neural_map();
    $map_data = $neural_map->get_map_data($courseid, $userid);
    
    return array(
        'success' => true,
        'data' => $map_data
    );
}

/**
 * Handle update node position request
 */
function handle_update_node_position($data) {
    global $USER;
    
    $topicid = isset($data['topicid']) ? (int)$data['topicid'] : 0;
    $x = isset($data['x']) ? (float)$data['x'] : 0;
    $y = isset($data['y']) ? (float)$data['y'] : 0;
    $z = isset($data['z']) ? (float)$data['z'] : 0;
    
    if (!$topicid) {
        return array('success' => false, 'message' => 'Topic ID required');
    }
    
    require_once(__DIR__ . '/classes/tema.php');
    $topic = \local_neuroopositor\tema::get_by_id($topicid);
    if (!$topic) {
        return array('success' => false, 'message' => 'Topic not found');
    }
    
    // Check permissions
    $context = context_system::instance();
    require_capability('local/neuroopositor:managethemes', $context);
    
    $neural_map = new local_neuroopositor_neural_map();
    $success = $neural_map->update_topic_position($topicid, $x, $y, $z);
    
    return array(
        'success' => $success,
        'message' => $success ? 'Position updated' : 'Failed to update position'
    );
}

/**
 * Handle calculate optimal path request
 */
function handle_calculate_optimal_path($data) {
    global $USER;
    
    $courseid = isset($data['courseid']) ? (int)$data['courseid'] : 0;
    $userid = isset($data['userid']) ? (int)$data['userid'] : $USER->id;
    $target_topic = isset($data['target_topic']) ? (int)$data['target_topic'] : 0;
    
    // Check permissions
    $context = $courseid ? context_course::instance($courseid) : context_system::instance();
    require_capability('local/neuroopositor:view', $context);
    
    $neural_map = new local_neuroopositor_neural_map();
    $path = $neural_map->calculate_optimal_learning_path($courseid, $userid, $target_topic);
    
    return array(
        'success' => true,
        'path' => $path
    );
}

/**
 * Handle start question session request
 */
function handle_start_question_session($data) {
    global $USER, $DB;
    
    $topicid = isset($data['topicid']) ? (int)$data['topicid'] : 0;
    $mode = isset($data['mode']) ? $data['mode'] : 'study';
    $courseid = isset($data['courseid']) ? (int)$data['courseid'] : 0;
    
    if (!$topicid) {
        return array('success' => false, 'message' => 'Topic ID required');
    }
    
    $topic = \local_neuroopositor\tema::get_by_id($topicid);
    if (!$topic) {
        return array('success' => false, 'message' => 'Topic not found');
    }
    
    // Check permissions
    $course_id = $topic->get_curso();
    if ($course_id == 0) {
        $context = context_system::instance();
    } else {
        $context = context_course::instance($course_id);
    }
    require_capability('local/neuroopositor:view', $context);
    
    // Create session record
    $session = new stdClass();
    $session->userid = $USER->id;
    $session->topicid = $topicid;
    $session->courseid = $courseid;
    $session->mode = $mode;
    $session->status = 'active';
    $session->start_time = time();
    $session->timecreated = time();
    
    $sessionid = $DB->insert_record('neuroopositor_sessions', $session);
    
    // Get questions for the topic
    $questions = get_questions_for_topic($topicid, $mode);
    
    if (empty($questions)) {
        return array('success' => false, 'message' => 'No questions available for this topic');
    }
    
    // Shuffle questions for variety
    shuffle($questions);
    
    // Limit number of questions based on mode
    $question_limit = ($mode === 'test') ? 10 : 5;
    $questions = array_slice($questions, 0, $question_limit);
    
    return array(
        'success' => true,
        'session' => array(
            'id' => $sessionid,
            'topic_title' => $topic->get_titulo(),
            'mode' => $mode,
            'question_count' => count($questions)
        ),
        'questions' => $questions
    );
}

/**
 * Handle submit answer request
 */
function handle_submit_answer($data) {
    global $USER, $DB;
    
    $sessionid = isset($data['sessionid']) ? (int)$data['sessionid'] : 0;
    $questionid = isset($data['questionid']) ? (int)$data['questionid'] : 0;
    $answer = isset($data['answer']) ? $data['answer'] : '';
    
    if (!$sessionid || !$questionid) {
        return array('success' => false, 'message' => 'Session ID and Question ID required');
    }
    
    // Get session
    $session = $DB->get_record('neuroopositor_sessions', array('id' => $sessionid, 'userid' => $USER->id));
    if (!$session) {
        return array('success' => false, 'message' => 'Session not found');
    }
    
    // Get question and evaluate answer
    $question = get_question_by_id($questionid);
    if (!$question) {
        return array('success' => false, 'message' => 'Question not found');
    }
    
    $is_correct = evaluate_answer($question, $answer);
    $response_time = time() - $session->start_time;
    
    // Save user response
    $response = new stdClass();
    $response->sessionid = $sessionid;
    $response->questionid = $questionid;
    $response->userid = $USER->id;
    $response->answer = $answer;
    $response->is_correct = $is_correct ? 1 : 0;
    $response->response_time = $response_time;
    $response->timecreated = time();
    
    $DB->insert_record('neuroopositor_user_responses', $response);
    
    return array(
        'success' => true,
        'is_correct' => $is_correct,
        'correct_answer' => $question->correct_answer,
        'explanation' => $question->explanation ?? ''
    );
}

/**
 * Handle submit question session request
 */
function handle_submit_question_session($data) {
    global $USER, $DB;
    
    $sessionid = isset($data['sessionid']) ? (int)$data['sessionid'] : 0;
    $answers = isset($data['answers']) ? $data['answers'] : array();
    
    if (!$sessionid) {
        return array('success' => false, 'message' => 'Session ID required');
    }
    
    // Get session
    $session = $DB->get_record('neuroopositor_sessions', array('id' => $sessionid, 'userid' => $USER->id));
    if (!$session) {
        return array('success' => false, 'message' => 'Session not found');
    }
    
    // Calculate session results
    $total_questions = count($answers);
    $correct_answers = 0;
    $total_time = time() - $session->start_time;
    
    // Get existing responses for this session
    $responses = $DB->get_records('neuroopositor_user_responses', array('sessionid' => $sessionid));
    foreach ($responses as $response) {
        if ($response->is_correct) {
            $correct_answers++;
        }
    }
    
    $score = $total_questions > 0 ? round(($correct_answers / $total_questions) * 100) : 0;
    
    // Update session
    $session->status = 'completed';
    $session->end_time = time();
    $session->score = $score;
    $session->total_questions = $total_questions;
    $session->correct_answers = $correct_answers;
    $session->timemodified = time();
    
    $DB->update_record('neuroopositor_sessions', $session);
    
    // Update user progress
    require_once(__DIR__ . '/classes/user_progress.php');
    $user_progress = user_progress::get_or_create($USER->id, $session->topicid, $courseid);
    if ($user_progress) {
        $user_progress->update_with_session_results($correct_answers, $total_questions, $total_time);
        $user_progress->save();
    }
    
    return array(
        'success' => true,
        'results' => array(
            'score' => $score,
            'correct' => $correct_answers,
            'total' => $total_questions,
            'time_spent' => $total_time
        )
    );
}

/**
 * Handle get user stats request
 */
function handle_get_user_stats($data) {
    global $USER;
    
    $courseid = isset($data['courseid']) ? (int)$data['courseid'] : 0;
    $userid = isset($data['userid']) ? (int)$data['userid'] : $USER->id;
    
    // Check permissions
    $context = $courseid ? context_course::instance($courseid) : context_system::instance();
    require_capability('local/neuroopositor:viewstats', $context);
    
    use local_neuroopositor\statistics;
    
    $user_stats = statistics::get_user_general_stats($userid, $courseid);
    
    return array(
        'success' => true,
        'stats' => $user_stats
    );
}

/**
 * Handle get AI recommendations request
 */
function handle_get_ai_recommendations($data) {
    global $USER;
    
    $courseid = isset($data['courseid']) ? (int)$data['courseid'] : 0;
    $userid = isset($data['userid']) ? (int)$data['userid'] : $USER->id;
    
    // Check permissions
    $context = $courseid ? context_course::instance($courseid) : context_system::instance();
    require_capability('local/neuroopositor:advancedai', $context);
    
    if (!get_config('local_neuroopositor', 'enableai')) {
        return array('success' => false, 'message' => 'AI features are disabled');
    }
    
    require_once(__DIR__ . '/classes/ai_engine.php');
    $ai_engine = new \local_neuroopositor\ai_engine();
    $recommendations = $ai_engine->get_recommended_topics($userid, $courseid);
    
    return array(
        'success' => true,
        'recommendations' => $recommendations
    );
}

/**
 * Handle auto arrange topics request
 */
function handle_auto_arrange_topics($data) {
    global $USER;
    
    $courseid = isset($data['courseid']) ? (int)$data['courseid'] : 0;
    
    // Check permissions
    $context = $courseid ? context_course::instance($courseid) : context_system::instance();
    require_capability('local/neuroopositor:managethemes', $context);
    
    require_once(__DIR__ . '/classes/neural_map.php');
    $neural_map = new local_neuroopositor_neural_map();
    $success = $neural_map->auto_organize_topics($courseid);
    
    return array(
        'success' => $success,
        'message' => $success ? 'Topics arranged successfully' : 'Failed to arrange topics'
    );
}

/**
 * Handle create topic request
 */
function handle_create_topic($data) {
    $courseid = isset($data['courseid']) ? (int)$data['courseid'] : 0;
    $title = isset($data['title']) ? trim($data['title']) : '';
    $description = isset($data['description']) ? trim($data['description']) : '';
    $block = isset($data['block']) ? (int)$data['block'] : 1;
    $difficulty = isset($data['difficulty']) ? (int)$data['difficulty'] : 1;
    
    if (!$courseid || !$title) {
        return array('success' => false, 'message' => 'Course ID and title are required');
    }
    
    // Check permissions
    $context = context_system::instance();
    require_capability('local/neuroopositor:managethemes', $context);
    
    $topic = new \local_neuroopositor\tema();
        $topic->bloque = $block;
        $topic->titulo = $title;
        $topic->descripcion = $description;
        $topic->nivel_dificultad = $difficulty;
    
    $success = $topic->save();
    
    return array(
        'success' => $success,
        'message' => $success ? 'Topic created successfully' : 'Failed to create topic',
        'topic_id' => $success ? $topic->get_id() : null
    );
}

/**
 * Handle update topic request
 */
function handle_update_topic($data) {
    $topicid = isset($data['topicid']) ? (int)$data['topicid'] : 0;
    
    if (!$topicid) {
        return array('success' => false, 'message' => 'Topic ID required');
    }
    
    $topic = \local_neuroopositor\tema::get_by_id($topicid);
    if (!$topic) {
        return array('success' => false, 'message' => 'Topic not found');
    }
    
    // Check permissions
    $context = context_system::instance();
    require_capability('local/neuroopositor:managethemes', $context);
    
    // Update fields if provided
    if (isset($data['title'])) {
        $topic->titulo = trim($data['title']);
    }
    if (isset($data['description'])) {
        $topic->descripcion = trim($data['description']);
    }
    if (isset($data['block'])) {
        $topic->bloque = (int)$data['block'];
    }
    if (isset($data['difficulty'])) {
        $topic->nivel_dificultad = (int)$data['difficulty'];
    }
    
    $success = $topic->save();
    
    return array(
        'success' => $success,
        'message' => $success ? 'Topic updated successfully' : 'Failed to update topic'
    );
}

/**
 * Handle delete topic request
 */
function handle_delete_topic($data) {
    $topicid = isset($data['topicid']) ? (int)$data['topicid'] : 0;
    
    if (!$topicid) {
        return array('success' => false, 'message' => 'Topic ID required');
    }
    
    $topic = \local_neuroopositor\tema::get_by_id($topicid);
    if (!$topic) {
        return array('success' => false, 'message' => 'Topic not found');
    }
    
    // Check permissions
    $context = context_course::instance($topic->get_curso());
    require_capability('local/neuroopositor:managethemes', $context);
    
    $success = $topic->delete();
    
    return array(
        'success' => $success,
        'message' => $success ? 'Topic deleted successfully' : 'Failed to delete topic'
    );
}

/**
 * Handle create connection request
 */
function handle_create_connection($data) {
    $from_topic = isset($data['from_topic']) ? (int)$data['from_topic'] : 0;
    $to_topic = isset($data['to_topic']) ? (int)$data['to_topic'] : 0;
    $type = isset($data['type']) ? $data['type'] : 'related';
    $weight = isset($data['weight']) ? (float)$data['weight'] : 1.0;
    
    if (!$from_topic || !$to_topic) {
        return array('success' => false, 'message' => 'From and to topic IDs are required');
    }
    
    // Get topics to verify they exist and get course context
    $from_topic_obj = \local_neuroopositor\tema::get_by_id($from_topic);
    $to_topic_obj = \local_neuroopositor\tema::get_by_id($to_topic);
    
    if (!$from_topic_obj || !$to_topic_obj) {
        return array('success' => false, 'message' => 'One or both topics not found');
    }
    
    // Check permissions
    $context = context_system::instance();
    require_capability('local/neuroopositor:managethemes', $context);
    
    require_once(__DIR__ . '/classes/connection.php');
    $connection = new \local_neuroopositor\connection();
    $connection->tema_origen_id = $from_topic;
    $connection->tema_destino_id = $to_topic;
    $connection->tipo_conexion = $type;
    $connection->peso = $weight;
    $connection->activa = true;
    
    $success = $connection->save();
    
    return array(
        'success' => $success,
        'message' => $success ? 'Connection created successfully' : 'Failed to create connection',
        'connection_id' => $success ? $connection->get_id() : null
    );
}

/**
 * Handle update connection request
 */
function handle_update_connection($data) {
    $connectionid = isset($data['connectionid']) ? (int)$data['connectionid'] : 0;
    
    if (!$connectionid) {
        return array('success' => false, 'message' => 'Connection ID required');
    }
    
    require_once(__DIR__ . '/classes/connection.php');
    $connection = \local_neuroopositor\connection::get_by_id($connectionid);
    if (!$connection) {
        return array('success' => false, 'message' => 'Connection not found');
    }
    
    // Get topic to check permissions
    $topic = \local_neuroopositor\tema::get_by_id($connection->get_tema_origen_id());
    $context = context_system::instance();
    require_capability('local/neuroopositor:managethemes', $context);
    
    // Update fields if provided
    if (isset($data['type'])) {
        $connection->tipo_conexion = $data['type'];
    }
    if (isset($data['weight'])) {
        $connection->peso = (float)$data['weight'];
    }
    if (isset($data['description'])) {
        $connection->descripcion = trim($data['description']);
    }
    
    $success = $connection->save();
    
    return array(
        'success' => $success,
        'message' => $success ? 'Connection updated successfully' : 'Failed to update connection'
    );
}

/**
 * Handle delete connection request
 */
function handle_delete_connection($data) {
    $connectionid = isset($data['connectionid']) ? (int)$data['connectionid'] : 0;
    
    if (!$connectionid) {
        return array('success' => false, 'message' => 'Connection ID required');
    }
    
    $connection = \local_neuroopositor\connection::get_by_id($connectionid);
    if (!$connection) {
        return array('success' => false, 'message' => 'Connection not found');
    }
    
    // Get topic to check permissions
    $topic = \local_neuroopositor\tema::get_by_id($connection->get_tema_origen_id());
    $context = context_system::instance();
    require_capability('local/neuroopositor:managethemes', $context);
    
    $success = $connection->delete();
    
    return array(
        'success' => $success,
        'message' => $success ? 'Connection deleted successfully' : 'Failed to delete connection'
    );
}

/**
 * Handle refresh cache request
 */
function handle_refresh_cache($data) {
    // Check admin permissions
    require_capability('local/neuroopositor:admin', context_system::instance());
    
    // Clear relevant caches
    cache_helper::purge_by_definition('local_neuroopositor', 'neural_map');
    cache_helper::purge_by_definition('local_neuroopositor', 'user_progress');
    
    return array(
        'success' => true,
        'message' => 'Cache refreshed successfully'
    );
}

/**
 * Get questions for a topic
 */
function get_questions_for_topic($topicid, $mode = 'study') {
    global $DB;
    
    // Use the real question manager to get questions
    require_once(__DIR__ . '/classes/question_manager.php');
    
    $limit = ($mode === 'test') ? 10 : 5;
    $questions_data = \local_neuroopositor\question_manager::get_tema_questions($topicid, $limit);
    
    $questions = array();
    
    foreach ($questions_data as $question) {
        $formatted_question = array(
            'id' => $question->id,
            'questiontext' => $question->questiontext,
            'options' => array(),
            'correct_answer' => null,
            'explanation' => $question->generalfeedback ?? ''
        );
        
        // Format answers/options
        if (isset($question->answers) && is_array($question->answers)) {
            foreach ($question->answers as $answer) {
                $formatted_question['options'][] = array(
                    'id' => $answer->id,
                    'text' => $answer->answer
                );
                
                // Set correct answer
                if ($answer->fraction > 0) {
                    $formatted_question['correct_answer'] = $answer->id;
                }
            }
        }
        
        $questions[] = $formatted_question;
    }
    
    return $questions;
}

/**
 * Get question by ID
 */
function get_question_by_id($questionid) {
    global $DB;
    
    // Get question from Moodle's question table
    $question = $DB->get_record('question', array('id' => $questionid));
    
    if (!$question) {
        return null;
    }
    
    // Get correct answer
    $correct_answer = $DB->get_record_sql(
        "SELECT id FROM {question_answers} WHERE question = ? AND fraction > 0 LIMIT 1",
        array($questionid)
    );
    
    return (object) array(
        'id' => $question->id,
        'questiontext' => $question->questiontext,
        'correct_answer' => $correct_answer ? $correct_answer->id : null,
        'explanation' => $question->generalfeedback ?? ''
    );
}

/**
 * Evaluate an answer
 */
function evaluate_answer($question, $answer) {
    // Simple evaluation - in a real implementation this would be more sophisticated
    return $answer == $question->correct_answer;
}