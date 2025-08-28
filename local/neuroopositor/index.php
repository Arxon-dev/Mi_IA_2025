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
 * NeuroOpositor main page.
 *
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->libdir . '/adminlib.php');
require_once(__DIR__ . '/lib.php');
require_once(__DIR__ . '/classes/statistics.php');

// Crear alias para compatibilidad con progress_data
class_alias('local_neuroopositor\\statistics', 'progress_data');

// Get parameters
$courseid = optional_param('courseid', 0, PARAM_INT);
$action = optional_param('action', 'dashboard', PARAM_ALPHA);

// Security checks
require_login();

if ($courseid) {
    $course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
    $context = context_course::instance($courseid);
    require_capability('local/neuroopositor:view', $context);
} else {
    $context = context_system::instance();
    require_capability('local/neuroopositor:view', $context);
    $course = null;
}

// Set up the page
$PAGE->set_url('/local/neuroopositor/index.php', array('courseid' => $courseid, 'action' => $action));
$PAGE->set_context($context);
$PAGE->set_title(get_string('neuroopositor', 'local_neuroopositor'));
$PAGE->set_heading(get_string('neuroopositor', 'local_neuroopositor'));
$PAGE->set_pagelayout('standard');

// Add CSS
$PAGE->requires->css('/local/neuroopositor/styles/neuroopositor.css');
$PAGE->requires->css('/local/neuroopositor/styles/fixes.css');
$PAGE->requires->js('/local/neuroopositor/js/force-styles.js');

// Add JavaScript files directly in HTML to ensure they load
$js_files = array();
$js_files[] = $CFG->wwwroot . '/local/neuroopositor/js/neuroopositor.js';

// Check if 3D visualization is enabled
if (get_config('local_neuroopositor', 'enable3d')) {
    $js_files[] = $CFG->wwwroot . '/local/neuroopositor/js/three.min.js';
    $js_files[] = $CFG->wwwroot . '/local/neuroopositor/js/neural3d.js';
}

// Check if AI features are enabled
if (get_config('local_neuroopositor', 'enableai')) {
    $js_files[] = $CFG->wwwroot . '/local/neuroopositor/js/ai-features.js';
}

// Navigation
if ($course) {
    $PAGE->navbar->add($course->shortname, new moodle_url('/course/view.php', array('id' => $course->id)));
}
$PAGE->navbar->add(get_string('neuroopositor', 'local_neuroopositor'));

// Get user progress data
$userid = $USER->id;
$progress_data = local_neuroopositor_get_user_progress($userid, $courseid ?: 0);
$neural_map = local_neuroopositor_get_neural_map($courseid ?: 0);
$connection_strengths = local_neuroopositor_calculate_connection_strengths($userid, $courseid ?: 0);

// Get available question tables
$question_tables = local_neuroopositor_get_question_tables();
$available_tables = array();
foreach ($question_tables as $table) {
    if (local_neuroopositor_table_exists($table)) {
        $available_tables[] = $table;
    }
}

// Prepare template data
$templatedata = array(
    'courseid' => $courseid,
    'action' => $action,
    'userid' => $userid,
    'username' => fullname($USER),
    'progress_data' => json_encode($progress_data),
    'neural_map' => json_encode($neural_map),
    'connection_strengths' => json_encode($connection_strengths),
    'available_tables' => $available_tables,
    'enable3d' => get_config('local_neuroopositor', 'enable3d'),
    'enableai' => get_config('local_neuroopositor', 'enableai'),
    'can_view_stats' => has_capability('local/neuroopositor:viewstats', $context),
    'can_view_all_stats' => has_capability('local/neuroopositor:viewallstats', $context),
    'can_manage_themes' => has_capability('local/neuroopositor:managethemes', $context),
    'can_admin' => has_capability('local/neuroopositor:admin', $context),
    'can_export' => has_capability('local/neuroopositor:export', $context),
    'can_use_advanced_ai' => has_capability('local/neuroopositor:advancedai', $context),
    'can_create_custom_path' => has_capability('local/neuroopositor:custompath', $context),
    'can_view_3d' => has_capability('local/neuroopositor:view3d', $context),
    'wwwroot' => $CFG->wwwroot,
    'sesskey' => sesskey()
);

// Output the page
echo $OUTPUT->header();

// Include JavaScript files directly
foreach ($js_files as $js_file) {
    echo html_writer::tag('script', '', array('src' => $js_file, 'type' => 'text/javascript'));
}

// Main content area
echo html_writer::start_div('neuroopositor-container');

// Navigation tabs
echo html_writer::start_div('neuroopositor-nav');
echo html_writer::start_tag('ul', array('class' => 'nav nav-tabs'));

$tabs = array(
    'dashboard' => get_string('dashboard', 'local_neuroopositor'),
    'neuralmap' => get_string('neuralmap', 'local_neuroopositor'),
    'questions' => get_string('questions', 'local_neuroopositor'),
    'statistics' => get_string('statistics', 'local_neuroopositor')
);

foreach ($tabs as $tab_action => $tab_name) {
    $active_class = ($action === $tab_action) ? ' active' : '';
    $tab_url = new moodle_url('/local/neuroopositor/index.php', 
        array('courseid' => $courseid, 'action' => $tab_action));
    
    echo html_writer::start_tag('li', array('class' => 'nav-item'));
    echo html_writer::link($tab_url, $tab_name, 
        array('class' => 'nav-link' . $active_class));
    echo html_writer::end_tag('li');
}

echo html_writer::end_tag('ul');
echo html_writer::end_div(); // neuroopositor-nav

// Content area based on action
echo html_writer::start_div('neuroopositor-content', array('id' => 'neuroopositor-content'));

switch ($action) {
    case 'neuralmap':
        include('views/neuralmap.php');
        break;
    case 'questions':
        include('views/questions.php');
        break;
    case 'statistics':
        include('views/statistics.php');
        break;
    default: // dashboard
        include('views/dashboard.php');
        break;
}

echo html_writer::end_div(); // neuroopositor-content
echo html_writer::end_div(); // neuroopositor-container

// Add JavaScript initialization
echo html_writer::start_tag('script');
echo "\n// Wait for NeuroOpositor to be available and configure it\n";
echo "function initializeNeuroOpositor() {\n";
echo "    if (typeof window.NeuroOpositor !== 'undefined') {\n";
echo "        // Configure NeuroOpositor\n";
echo "        window.NeuroOpositor.config = " . json_encode($templatedata) . ";\n";
echo "        window.NeuroOpositor.currentView = '" . $action . "';\n";
echo "        // Initialize the system\n";
echo "        window.NeuroOpositor.init();\n";
echo "        console.log('NeuroOpositor configured and initialized successfully');\n";
echo "    } else {\n";
echo "        // Wait a bit more and try again\n";
echo "        setTimeout(initializeNeuroOpositor, 100);\n";
echo "    }\n";
echo "}\n";
echo "\n// Start initialization when DOM is ready\n";
echo "if (document.readyState === 'loading') {\n";
echo "    document.addEventListener('DOMContentLoaded', initializeNeuroOpositor);\n";
echo "} else {\n";
echo "    initializeNeuroOpositor();\n";
echo "}\n";
echo html_writer::end_tag('script');

echo $OUTPUT->footer();