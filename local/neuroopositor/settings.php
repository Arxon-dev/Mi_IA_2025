<?php
/**
 * NeuroOpositor Plugin Settings
 *
 * @package    local_neuroopositor
 * @copyright  2024 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    // Create the main settings page
    $settings = new admin_settingpage('local_neuroopositor', get_string('pluginname', 'local_neuroopositor'));

    // General Settings Section
    $settings->add(new admin_setting_heading(
        'local_neuroopositor/generalsettings',
        get_string('generalsettings', 'local_neuroopositor'),
        get_string('generalsettings_desc', 'local_neuroopositor')
    ));

    // Enable/Disable Plugin
    $settings->add(new admin_setting_configcheckbox(
        'local_neuroopositor/enabled',
        get_string('enabled', 'local_neuroopositor'),
        get_string('enabled_desc', 'local_neuroopositor'),
        1
    ));

    // Default Course ID for Neural Map
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/defaultcourseid',
        get_string('defaultcourseid', 'local_neuroopositor'),
        get_string('defaultcourseid_desc', 'local_neuroopositor'),
        '',
        PARAM_INT
    ));

    // Neural Map Settings Section
    $settings->add(new admin_setting_heading(
        'local_neuroopositor/neuralmapsettings',
        get_string('neuralmapsettings', 'local_neuroopositor'),
        get_string('neuralmapsettings_desc', 'local_neuroopositor')
    ));

    // Default View Mode (2D/3D)
    $settings->add(new admin_setting_configselect(
        'local_neuroopositor/defaultviewmode',
        get_string('defaultviewmode', 'local_neuroopositor'),
        get_string('defaultviewmode_desc', 'local_neuroopositor'),
        '2d',
        array(
            '2d' => get_string('viewmode2d', 'local_neuroopositor'),
            '3d' => get_string('viewmode3d', 'local_neuroopositor')
        )
    ));

    // Auto-layout Algorithm
    $settings->add(new admin_setting_configselect(
        'local_neuroopositor/autolayoutalgorithm',
        get_string('autolayoutalgorithm', 'local_neuroopositor'),
        get_string('autolayoutalgorithm_desc', 'local_neuroopositor'),
        'force',
        array(
            'force' => get_string('algorithm_force', 'local_neuroopositor'),
            'hierarchical' => get_string('algorithm_hierarchical', 'local_neuroopositor'),
            'circular' => get_string('algorithm_circular', 'local_neuroopositor'),
            'grid' => get_string('algorithm_grid', 'local_neuroopositor')
        )
    ));

    // Node Size Factor
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/nodesizefactor',
        get_string('nodesizefactor', 'local_neuroopositor'),
        get_string('nodesizefactor_desc', 'local_neuroopositor'),
        '1.0',
        PARAM_TEXT
    ));

    // Connection Strength Threshold
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/connectionthreshold',
        get_string('connectionthreshold', 'local_neuroopositor'),
        get_string('connectionthreshold_desc', 'local_neuroopositor'),
        '0.3',
        PARAM_TEXT
    ));

    // Questions Settings Section
    $settings->add(new admin_setting_heading(
        'local_neuroopositor/questionssettings',
        get_string('questionssettings', 'local_neuroopositor'),
        get_string('questionssettings_desc', 'local_neuroopositor')
    ));

    // Questions per Session
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/questionspersession',
        get_string('questionspersession', 'local_neuroopositor'),
        get_string('questionspersession_desc', 'local_neuroopositor'),
        '20',
        PARAM_INT
    ));

    // Session Time Limit (minutes)
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/sessiontimelimit',
        get_string('sessiontimelimit', 'local_neuroopositor'),
        get_string('sessiontimelimit_desc', 'local_neuroopositor'),
        '30',
        PARAM_INT
    ));

    // Auto-save Interval (seconds)
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/autosaveinterval',
        get_string('autosaveinterval', 'local_neuroopositor'),
        get_string('autosaveinterval_desc', 'local_neuroopositor'),
        '30',
        PARAM_INT
    ));

    // Show Feedback Immediately
    $settings->add(new admin_setting_configcheckbox(
        'local_neuroopositor/showfeedbackimmediately',
        get_string('showfeedbackimmediately', 'local_neuroopositor'),
        get_string('showfeedbackimmediately_desc', 'local_neuroopositor'),
        1
    ));

    // AI and Analytics Settings Section
    $settings->add(new admin_setting_heading(
        'local_neuroopositor/aisettings',
        get_string('aisettings', 'local_neuroopositor'),
        get_string('aisettings_desc', 'local_neuroopositor')
    ));

    // Enable AI Recommendations
    $settings->add(new admin_setting_configcheckbox(
        'local_neuroopositor/enableairecommendations',
        get_string('enableairecommendations', 'local_neuroopositor'),
        get_string('enableairecommendations_desc', 'local_neuroopositor'),
        1
    ));

    // AI Update Frequency (hours)
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/aiupdatefrequency',
        get_string('aiupdatefrequency', 'local_neuroopositor'),
        get_string('aiupdatefrequency_desc', 'local_neuroopositor'),
        '24',
        PARAM_INT
    ));

    // Minimum Data Points for AI
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/mindatapointsforai',
        get_string('mindatapointsforai', 'local_neuroopositor'),
        get_string('mindatapointsforai_desc', 'local_neuroopositor'),
        '10',
        PARAM_INT
    ));

    // Performance Settings Section
    $settings->add(new admin_setting_heading(
        'local_neuroopositor/performancesettings',
        get_string('performancesettings', 'local_neuroopositor'),
        get_string('performancesettings_desc', 'local_neuroopositor')
    ));

    // Cache Duration (seconds)
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/cacheduration',
        get_string('cacheduration', 'local_neuroopositor'),
        get_string('cacheduration_desc', 'local_neuroopositor'),
        '3600',
        PARAM_INT
    ));

    // Max Nodes in 3D View
    $settings->add(new admin_setting_configtext(
        'local_neuroopositor/maxnodesin3d',
        get_string('maxnodesin3d', 'local_neuroopositor'),
        get_string('maxnodesin3d_desc', 'local_neuroopositor'),
        '500',
        PARAM_INT
    ));

    // Enable Debug Mode
    $settings->add(new admin_setting_configcheckbox(
        'local_neuroopositor/debugmode',
        get_string('debugmode', 'local_neuroopositor'),
        get_string('debugmode_desc', 'local_neuroopositor'),
        0
    ));

    // Database Settings Section
    $settings->add(new admin_setting_heading(
        'local_neuroopositor/databasesettings',
        get_string('databasesettings', 'local_neuroopositor'),
        get_string('databasesettings_desc', 'local_neuroopositor')
    ));

    // Question Tables Configuration
    $questiontables = array(
        'constitucion' => 'Constitución',
        'defensanacional' => 'Defensa Nacional',
        'rio' => 'Régimen Jurídico del Sector Público',
        'minisdef' => 'Ministerio de Defensa',
        'organizacionfas' => 'Organización de las FAS',
        'emad' => 'EMAD',
        'et' => 'Ejército de Tierra',
        'armada' => 'Armada',
        'aire' => 'Ejército del Aire',
        'carrera' => 'Carrera Militar',
        'tropa' => 'Tropa y Marinería',
        'rroo' => 'Reales Ordenanzas',
        'derechosydeberes' => 'Derechos y Deberes',
        'regimendisciplinario' => 'Régimen Disciplinario',
        'iniciativasyquejas' => 'Iniciativas y Quejas',
        'igualdad' => 'Igualdad',
        'omi' => 'OMI',
        'pac' => 'PAC',
        'seguridadnacional' => 'Seguridad Nacional',
        'pdc' => 'PDC',
        'onu' => 'ONU',
        'otan' => 'OTAN',
        'osce' => 'OSCE',
        'ue' => 'Unión Europea',
        'misionesinternacionales' => 'Misiones Internacionales'
    );

    foreach ($questiontables as $table => $name) {
        $settings->add(new admin_setting_configcheckbox(
            'local_neuroopositor/enable_' . $table,
            get_string('enable_table', 'local_neuroopositor', $name),
            get_string('enable_table_desc', 'local_neuroopositor', $name),
            1
        ));
    }

    // Add the settings page to the admin tree
    $ADMIN->add('localplugins', $settings);
}