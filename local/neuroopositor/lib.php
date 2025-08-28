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
 * NeuroOpositor plugin library functions.
 *
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Extends the course navigation with the NeuroOpositor link.
 *
 * @param navigation_node $navigation The navigation node to extend
 * @param stdClass $course The course to object for the navigation
 * @param context_course $context The context of the course
 */
function local_neuroopositor_extend_navigation_course($navigation, $course, $context) {
    if (has_capability('local/neuroopositor:view', $context)) {
        $url = new moodle_url('/local/neuroopositor/index.php', array('courseid' => $course->id));
        $navigation->add(
            get_string('neuroopositor', 'local_neuroopositor'),
            $url,
            navigation_node::TYPE_CUSTOM,
            null,
            'neuroopositor',
            new pix_icon('i/brain', get_string('neuroopositor', 'local_neuroopositor'))
        );
    }
}

/**
 * Extends the global navigation with the NeuroOpositor link.
 *
 * @param global_navigation $navigation The global navigation node
 */
function local_neuroopositor_extend_navigation(global_navigation $navigation) {
    global $PAGE;
    
    if (isloggedin() && !isguestuser()) {
        $context = context_system::instance();
        if (has_capability('local/neuroopositor:view', $context)) {
            $url = new moodle_url('/local/neuroopositor/dashboard.php');
            $node = $navigation->add(
                get_string('neuroopositor', 'local_neuroopositor'),
                $url,
                navigation_node::TYPE_CUSTOM,
                null,
                'neuroopositor',
                new pix_icon('i/brain', get_string('neuroopositor', 'local_neuroopositor'))
            );
            $node->showinflatnavigation = true;
        }
    }
}

/**
 * Extends the settings navigation with the NeuroOpositor link.
 *
 * @param settings_navigation $settingsnav The settings navigation node
 * @param context $context The context
 */
function local_neuroopositor_extend_settings_navigation($settingsnav, $context) {
    global $CFG, $PAGE;
    
    // Only add this settings item on non-site course pages.
    if (!$PAGE->course or $PAGE->course->id == 1) {
        return;
    }
    
    // Only let users with the appropriate capability see this settings item.
    if (!has_capability('local/neuroopositor:view', $context)) {
        return;
    }
    
    if ($settingnode = $settingsnav->find('courseadmin', navigation_node::TYPE_COURSE)) {
        $strneuro = get_string('neuroopositor', 'local_neuroopositor');
        $url = new moodle_url('/local/neuroopositor/index.php', array('courseid' => $PAGE->course->id));
        $neuronode = navigation_node::create(
            $strneuro,
            $url,
            navigation_node::NODETYPE_LEAF,
            'neuroopositor',
            'neuroopositor',
            new pix_icon('i/brain', $strneuro)
        );
        if ($PAGE->url->compare($url, URL_MATCH_BASE)) {
            $neuronode->make_active();
        }
        $settingnode->add_node($neuronode);
    }
}

/**
 * Get the list of available question tables.
 *
 * @return array Array of table names
 */
function local_neuroopositor_get_question_tables() {
    return [
        'constitucion',
        'defensanacional', 
        'rio',
        'minisdef',
        'organizacionfas',
        'emad',
        'et',
        'armada',
        'aire',
        'carrera',
        'tropa',
        'rroo',
        'derechosydeberes',
        'regimendisciplinario',
        'iniciativasyquejas',
        'igualdad',
        'omi',
        'pac',
        'seguridadnacional',
        'pdc',
        'onu',
        'otan',
        'osce',
        'ue',
        'misionesinternacionales'
    ];
}

/**
 * Check if a question table exists in the database.
 *
 * @param string $tablename The table name to check
 * @return bool True if table exists, false otherwise
 */
function local_neuroopositor_table_exists($tablename) {
    global $DB;
    
    try {
        $dbman = $DB->get_manager();
        $table = new xmldb_table($tablename);
        return $dbman->table_exists($table);
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Get neural map data for a course.
 *
 * @param int $courseid The course ID
 * @return array Neural map data
 */
function local_neuroopositor_get_neural_map($courseid) {
    global $DB;
    
    $temas = $DB->get_records('neuroopositor_temas', null, 'bloque ASC, numero ASC');
    $connections = $DB->get_records('neuroopositor_connections', ['activa' => 1]);
    
    return [
        'temas' => array_values($temas),
        'connections' => array_values($connections)
    ];
}

/**
 * Get user progress for all themes.
 *
 * @param int $userid The user ID
 * @param int $courseid The course ID
 * @return array User progress data
 */
function local_neuroopositor_get_user_progress($userid, $courseid) {
    global $DB;
    
    $progress = $DB->get_records('neuroopositor_user_progress', [
        'userid' => $userid,
        'courseid' => $courseid
    ]);
    
    return array_values($progress);
}

/**
 * Calculate neural connections strength based on user performance.
 *
 * @param int $userid The user ID
 * @param int $courseid The course ID
 * @return array Connection strengths
 */
function local_neuroopositor_calculate_connection_strengths($userid, $courseid) {
    global $DB;
    
    $connections = $DB->get_records('neuroopositor_connections', ['activa' => 1]);
    $progress = local_neuroopositor_get_user_progress($userid, $courseid);
    
    $progressByTema = [];
    foreach ($progress as $p) {
        $progressByTema[$p->tema_id] = $p;
    }
    
    $strengthened = [];
    foreach ($connections as $conn) {
        $origenProgress = isset($progressByTema[$conn->tema_origen_id]) ? 
            $progressByTema[$conn->tema_origen_id]->porcentaje_dominio : 0;
        $destinoProgress = isset($progressByTema[$conn->tema_destino_id]) ? 
            $progressByTema[$conn->tema_destino_id]->porcentaje_dominio : 0;
        
        // Calculate connection strength based on progress in both themes
        $strength = ($origenProgress + $destinoProgress) / 200 * $conn->peso;
        
        $strengthened[] = [
            'id' => $conn->id,
            'strength' => $strength,
            'original_weight' => $conn->peso
        ];
    }
    
    return $strengthened;
}

/**
 * Generate recommended neural path for a user.
 *
 * @param int $userid The user ID
 * @param int $courseid The course ID
 * @param string $type Path type (optima, refuerzo, exploracion)
 * @return array Recommended path
 */
function local_neuroopositor_generate_neural_path($userid, $courseid, $type = 'optima') {
    global $DB;
    
    $progress = local_neuroopositor_get_user_progress($userid, $courseid);
    $temas = $DB->get_records('neuroopositor_temas', null, 'bloque ASC, numero ASC');
    
    $progressByTema = [];
    foreach ($progress as $p) {
        $progressByTema[$p->tema_id] = $p->porcentaje_dominio;
    }
    
    $path = [];
    switch ($type) {
        case 'refuerzo':
            // Focus on themes with low performance
            foreach ($temas as $tema) {
                $dominio = isset($progressByTema[$tema->id]) ? $progressByTema[$tema->id] : 0;
                if ($dominio < 70) {
                    $path[] = [
                        'tema_id' => $tema->id,
                        'priority' => 100 - $dominio,
                        'reason' => 'refuerzo'
                    ];
                }
            }
            break;
            
        case 'exploracion':
            // Focus on unvisited themes
            foreach ($temas as $tema) {
                if (!isset($progressByTema[$tema->id])) {
                    $path[] = [
                        'tema_id' => $tema->id,
                        'priority' => 50,
                        'reason' => 'exploracion'
                    ];
                }
            }
            break;
            
        default: // 'optima'
            // Balanced approach based on difficulty and progress
            foreach ($temas as $tema) {
                $dominio = isset($progressByTema[$tema->id]) ? $progressByTema[$tema->id] : 0;
                $priority = (100 - $dominio) * ($tema->nivel_dificultad / 5);
                $path[] = [
                    'tema_id' => $tema->id,
                    'priority' => $priority,
                    'reason' => 'optima'
                ];
            }
            break;
    }
    
    // Sort by priority
    usort($path, function($a, $b) {
        return $b['priority'] <=> $a['priority'];
    });
    
    return array_slice($path, 0, 10); // Return top 10 recommendations
}