<?php
/**
 * NeuroOpositor Plugin Web Services
 *
 * @package    local_neuroopositor
 * @copyright  2024 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Define the web service functions
$functions = array(

    // Neural Map Functions
    'local_neuroopositor_get_neural_map_data' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_neural_map_data',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get neural map data including topics, connections and user progress',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:view',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_update_node_position' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'update_node_position',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Update the position of a node in the neural map',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:configure',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_get_optimal_path' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_optimal_path',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Calculate and return the optimal learning path for a user',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:view',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    // Questions Functions
    'local_neuroopositor_get_questions' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_questions',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get questions for a specific topic or study mode',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:attempt',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_submit_answer' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'submit_answer',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Submit an answer to a question and get feedback',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:attempt',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_start_session' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'start_session',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Start a new study session',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:attempt',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_end_session' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'end_session',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'End a study session and save results',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:attempt',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_save_session_progress' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'save_session_progress',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Auto-save session progress',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:attempt',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    // Statistics Functions
    'local_neuroopositor_get_user_stats' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_user_stats',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get user statistics and progress data',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:viewownstats',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_get_course_stats' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_course_stats',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get course-wide statistics (for teachers)',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:viewallstats',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_get_progress_chart_data' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_progress_chart_data',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get data for progress charts and visualizations',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:viewownstats',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_export_user_data' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'export_user_data',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Export user data in various formats',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:export',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    // AI and Recommendations Functions
    'local_neuroopositor_get_ai_recommendations' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_ai_recommendations',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get AI-generated study recommendations',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:useai',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_update_ai_preferences' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'update_ai_preferences',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Update user AI preferences and learning style',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:useai',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_analyze_learning_patterns' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'analyze_learning_patterns',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Analyze user learning patterns and suggest improvements',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:useai',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    // Configuration Functions
    'local_neuroopositor_get_topics' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_topics',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get all topics for a course',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:view',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_create_topic' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'create_topic',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Create a new topic in the neural map',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:configure',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_update_topic' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'update_topic',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Update an existing topic',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:configure',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_delete_topic' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'delete_topic',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Delete a topic from the neural map',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:configure',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_create_connection' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'create_connection',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Create a connection between topics',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:configure',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_update_connection' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'update_connection',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Update an existing connection',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:configure',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_delete_connection' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'delete_connection',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Delete a connection between topics',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:configure',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    // Activity and Recent Actions
    'local_neuroopositor_get_recent_activity' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_recent_activity',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get recent user activity in the neural map',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:viewownstats',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_log_activity' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'log_activity',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Log user activity for analytics',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:view',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    // System Functions
    'local_neuroopositor_get_plugin_config' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'get_plugin_config',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Get plugin configuration settings',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:view',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    ),

    'local_neuroopositor_refresh_cache' => array(
        'classname'   => 'local_neuroopositor_external',
        'methodname'  => 'refresh_cache',
        'classpath'   => 'local/neuroopositor/externallib.php',
        'description' => 'Refresh plugin cache data',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'local/neuroopositor:manage',
        'services'    => array(MOODLE_OFFICIAL_MOBILE_SERVICE)
    )
);

// Define the services
$services = array(
    'NeuroOpositor Service' => array(
        'functions' => array(
            'local_neuroopositor_get_neural_map_data',
            'local_neuroopositor_get_questions',
            'local_neuroopositor_submit_answer',
            'local_neuroopositor_get_user_stats',
            'local_neuroopositor_get_ai_recommendations',
            'local_neuroopositor_start_session',
            'local_neuroopositor_end_session',
            'local_neuroopositor_save_session_progress',
            'local_neuroopositor_get_recent_activity',
            'local_neuroopositor_log_activity',
            'local_neuroopositor_get_plugin_config'
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'neuroopositor_service',
        'downloadfiles' => 0,
        'uploadfiles' => 0
    )
);