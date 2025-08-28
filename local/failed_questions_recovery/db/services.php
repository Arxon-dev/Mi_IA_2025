<?php
defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_failed_questions_recovery_get_failed_questions' => array(
        'classname' => 'local_failed_questions_recovery_external',
        'methodname' => 'get_failed_questions',
        'classpath' => 'local/failed_questions_recovery/externallib.php',
        'description' => 'Get failed questions for a user by category',
        'type' => 'read',
        'capabilities' => '',
        'services' => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
    'local_failed_questions_recovery_get_categories' => array(
        'classname' => 'local_failed_questions_recovery_external',
        'methodname' => 'get_categories',
        'classpath' => 'local/failed_questions_recovery/externallib.php',
        'description' => 'Get categories with failed questions for a user',
        'type' => 'read',
        'capabilities' => '',
        'services' => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
    'local_failed_questions_recovery_create_recovery_quiz' => array(
        'classname' => 'local_failed_questions_recovery_external',
        'methodname' => 'create_recovery_quiz',
        'classpath' => 'local/failed_questions_recovery/externallib.php',
        'description' => 'Create a recovery quiz with failed questions',
        'type' => 'write',
        'capabilities' => '',
        'services' => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
    'local_failed_questions_recovery_get_recovery_quizzes' => array(
        'classname' => 'local_failed_questions_recovery_external',
        'methodname' => 'get_recovery_quizzes',
        'classpath' => 'local/failed_questions_recovery/externallib.php',
        'description' => 'Get recovery quizzes for a user',
        'type' => 'read',
        'capabilities' => '',
        'services' => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
    'local_failed_questions_recovery_complete_recovery_quiz' => array(
        'classname' => 'local_failed_questions_recovery_external',
        'methodname' => 'complete_recovery_quiz',
        'classpath' => 'local/failed_questions_recovery/externallib.php',
        'description' => 'Complete a recovery quiz and update mastery status',
        'type' => 'write',
        'capabilities' => '',
        'services' => array(MOODLE_OFFICIAL_MOBILE_SERVICE),
    ),
);

$services = array(
    'Failed Questions Recovery Service' => array(
        'functions' => array(
            'local_failed_questions_recovery_get_failed_questions',
            'local_failed_questions_recovery_get_categories',
            'local_failed_questions_recovery_create_recovery_quiz',
            'local_failed_questions_recovery_get_recovery_quizzes',
            'local_failed_questions_recovery_complete_recovery_quiz',
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
    ),
); 