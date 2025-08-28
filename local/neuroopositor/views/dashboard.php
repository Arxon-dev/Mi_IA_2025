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
 * NeuroOpositor dashboard view.
 *
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Calculate overall progress
$total_progress = 0;
$total_themes = count($neural_map['temas']);
$completed_themes = 0;
$total_questions = 0;
$correct_answers = 0;
$total_study_time = 0;

foreach ($progress_data as $progress) {
    $total_progress += $progress->porcentaje_dominio;
    if ($progress->porcentaje_dominio >= 80) {
        $completed_themes++;
    }
    $total_questions += $progress->preguntas_respondidas;
    $correct_answers += $progress->preguntas_correctas;
    $total_study_time += $progress->tiempo_estudio;
}

$average_progress = $total_themes > 0 ? round($total_progress / $total_themes, 1) : 0;
$accuracy = $total_questions > 0 ? round(($correct_answers / $total_questions) * 100, 1) : 0;
$study_hours = round($total_study_time / 3600, 1);

// Get recent activity (last 7 days)
$recent_sessions = 0; // This would come from a sessions table in a full implementation
$recent_questions = 0; // This would come from recent activity tracking

// Welcome message
echo html_writer::div(
    html_writer::tag('h2', get_string('welcome_message', 'local_neuroopositor') . ', ' . $templatedata['username']),
    'neuroopositor-welcome'
);

// Quick stats cards
echo html_writer::start_div('row neuroopositor-stats-cards');

// Overall Progress Card
echo html_writer::start_div('col-md-3');
echo html_writer::start_div('card neuroopositor-stat-card');
echo html_writer::start_div('card-body text-center');
echo html_writer::tag('h3', $average_progress . '%', array('class' => 'stat-number text-primary'));
echo html_writer::tag('p', get_string('knowledge_progress', 'local_neuroopositor'), array('class' => 'stat-label'));
echo html_writer::div('', 'progress-ring', array('data-progress' => $average_progress));
echo html_writer::end_div();
echo html_writer::end_div();
echo html_writer::end_div();

// Completed Themes Card
echo html_writer::start_div('col-md-3');
echo html_writer::start_div('card neuroopositor-stat-card');
echo html_writer::start_div('card-body text-center');
echo html_writer::tag('h3', $completed_themes . '/' . $total_themes, array('class' => 'stat-number text-success'));
echo html_writer::tag('p', get_string('themes', 'local_neuroopositor'), array('class' => 'stat-label'));
echo html_writer::tag('small', get_string('mastery_level', 'local_neuroopositor') . ' ≥ 80%', array('class' => 'text-muted'));
echo html_writer::end_div();
echo html_writer::end_div();
echo html_writer::end_div();

// Accuracy Card
echo html_writer::start_div('col-md-3');
echo html_writer::start_div('card neuroopositor-stat-card');
echo html_writer::start_div('card-body text-center');
echo html_writer::tag('h3', $accuracy . '%', array('class' => 'stat-number text-info'));
echo html_writer::tag('p', get_string('accuracy', 'local_neuroopositor'), array('class' => 'stat-label'));
echo html_writer::tag('small', $total_questions . ' ' . get_string('questions_answered', 'local_neuroopositor'), array('class' => 'text-muted'));
echo html_writer::end_div();
echo html_writer::end_div();
echo html_writer::end_div();

// Study Time Card
echo html_writer::start_div('col-md-3');
echo html_writer::start_div('card neuroopositor-stat-card');
echo html_writer::start_div('card-body text-center');
echo html_writer::tag('h3', $study_hours . 'h', array('class' => 'stat-number text-warning'));
echo html_writer::tag('p', get_string('study_time', 'local_neuroopositor'), array('class' => 'stat-label'));
echo html_writer::tag('small', get_string('total_sessions', 'local_neuroopositor'), array('class' => 'text-muted'));
echo html_writer::end_div();
echo html_writer::end_div();
echo html_writer::end_div();

echo html_writer::end_div(); // row

// Main dashboard content
echo html_writer::start_div('row mt-4');

// Left column - Quick Actions
echo html_writer::start_div('col-md-6');
echo html_writer::start_div('card');
echo html_writer::start_div('card-header');
echo html_writer::tag('h4', get_string('start_practice', 'local_neuroopositor'));
echo html_writer::end_div();
echo html_writer::start_div('card-body');

// Quick practice buttons
if (!empty($available_tables)) {
    echo html_writer::tag('p', get_string('available_topics', 'local_neuroopositor') . ':');
    echo html_writer::start_div('topic-buttons');
    
    foreach (array_slice($available_tables, 0, 6) as $table) {
        $topic_name = get_string('topic_' . $table, 'local_neuroopositor');
        $practice_url = new moodle_url('/local/neuroopositor/practice.php', 
            array('courseid' => $courseid, 'topic' => $table));
        
        echo html_writer::link(
            $practice_url,
            $topic_name,
            array('class' => 'btn btn-outline-primary btn-sm m-1')
        );
    }
    
    if (count($available_tables) > 6) {
        $all_topics_url = new moodle_url('/local/neuroopositor/index.php', 
            array('courseid' => $courseid, 'action' => 'questions'));
        echo html_writer::link(
            $all_topics_url,
            get_string('view_details', 'local_neuroopositor') . ' (' . count($available_tables) . ')',
            array('class' => 'btn btn-primary btn-sm m-1')
        );
    }
    
    echo html_writer::end_div();
} else {
    echo html_writer::div(
        get_string('no_questions_available', 'local_neuroopositor'),
        'alert alert-info'
    );
}

echo html_writer::end_div();
echo html_writer::end_div();
echo html_writer::end_div();

// Right column - Neural Map Preview
echo html_writer::start_div('col-md-6');
echo html_writer::start_div('card');
echo html_writer::start_div('card-header');
echo html_writer::tag('h4', get_string('neuralmap', 'local_neuroopositor'));
echo html_writer::end_div();
echo html_writer::start_div('card-body');

// Neural map preview
echo html_writer::div('', 'neural-map-preview', array('id' => 'neural-map-preview'));

$neuralmap_url = new moodle_url('/local/neuroopositor/index.php', 
    array('courseid' => $courseid, 'action' => 'neuralmap'));
echo html_writer::div(
    html_writer::link(
        $neuralmap_url,
        get_string('view_details', 'local_neuroopositor'),
        array('class' => 'btn btn-primary')
    ),
    'text-center mt-3'
);

echo html_writer::end_div();
echo html_writer::end_div();
echo html_writer::end_div();

echo html_writer::end_div(); // row

// AI Recommendations (if enabled)
if ($templatedata['enableai'] && $templatedata['can_use_advanced_ai']) {
    echo html_writer::start_div('row mt-4');
    echo html_writer::start_div('col-12');
    echo html_writer::start_div('card');
    echo html_writer::start_div('card-header');
    echo html_writer::tag('h4', get_string('ai_recommendations', 'local_neuroopositor'));
    echo html_writer::end_div();
    echo html_writer::start_div('card-body');
    
    // Generate AI recommendations
    $optimal_path = local_neuroopositor_generate_neural_path($userid, $courseid ?: 0, 'optima');
    $reinforcement_path = local_neuroopositor_generate_neural_path($userid, $courseid ?: 0, 'refuerzo');
    
    echo html_writer::start_div('row');
    
    // Optimal path
    echo html_writer::start_div('col-md-6');
    echo html_writer::tag('h5', get_string('path_type_optimal', 'local_neuroopositor'));
    if (!empty($optimal_path)) {
        echo html_writer::start_tag('ul', array('class' => 'list-group list-group-flush'));
        foreach (array_slice($optimal_path, 0, 3) as $recommendation) {
            $tema = $DB->get_record('neuroopositor_temas', array('id' => $recommendation['tema_id']));
            if ($tema) {
                echo html_writer::start_tag('li', array('class' => 'list-group-item d-flex justify-content-between'));
                echo html_writer::span($tema->nombre);
                echo html_writer::span('Priority: ' . round($recommendation['priority']), 'badge badge-primary');
                echo html_writer::end_tag('li');
            }
        }
        echo html_writer::end_tag('ul');
    }
    echo html_writer::end_div();
    
    // Reinforcement path
    echo html_writer::start_div('col-md-6');
    echo html_writer::tag('h5', get_string('path_type_reinforcement', 'local_neuroopositor'));
    if (!empty($reinforcement_path)) {
        echo html_writer::start_tag('ul', array('class' => 'list-group list-group-flush'));
        foreach (array_slice($reinforcement_path, 0, 3) as $recommendation) {
            $tema = $DB->get_record('neuroopositor_temas', array('id' => $recommendation['tema_id']));
            if ($tema) {
                echo html_writer::start_tag('li', array('class' => 'list-group-item d-flex justify-content-between'));
                echo html_writer::span($tema->nombre);
                echo html_writer::span('Priority: ' . round($recommendation['priority']), 'badge badge-warning');
                echo html_writer::end_tag('li');
            }
        }
        echo html_writer::end_tag('ul');
    }
    echo html_writer::end_div();
    
    echo html_writer::end_div(); // row
    echo html_writer::end_div();
    echo html_writer::end_div();
    echo html_writer::end_div();
    echo html_writer::end_div();
}

// Recent Activity
echo html_writer::start_div('row mt-4');
echo html_writer::start_div('col-12');
echo html_writer::start_div('card');
echo html_writer::start_div('card-header');
echo html_writer::tag('h4', get_string('progress', 'local_neuroopositor'));
echo html_writer::end_div();
echo html_writer::start_div('card-body');

// Progress chart placeholder
echo html_writer::div('', 'progress-chart', array('id' => 'progress-chart'));
echo html_writer::tag('p', 'Progress visualization will be implemented with Chart.js', array('class' => 'text-muted text-center'));

echo html_writer::end_div();
echo html_writer::end_div();
echo html_writer::end_div();
echo html_writer::end_div();