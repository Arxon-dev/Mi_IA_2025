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
 * Página de estadísticas de NeuroOpositor
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');
require_once($CFG->dirroot . '/local/neuroopositor/classes/statistics.php');
require_once($CFG->dirroot . '/local/neuroopositor/classes/user_progress.php');
require_once($CFG->dirroot . '/local/neuroopositor/classes/tema.php');

use local_neuroopositor\statistics;
use local_neuroopositor\user_progress;
use local_neuroopositor\tema;

// Crear alias para compatibilidad con progress_data
class_alias('local_neuroopositor\\statistics', 'progress_data');

// Verificar login
require_login();

// Obtener parámetros
$courseid = optional_param('courseid', 0, PARAM_INT);
$action = optional_param('action', 'view', PARAM_ALPHA);
$period = optional_param('period', '30', PARAM_INT);

// Verificar curso
if ($courseid) {
    $course = $DB->get_record('course', array('id' => $courseid), '*', MUST_EXIST);
    require_course_login($course);
    $context = context_course::instance($courseid);
} else {
    $context = context_system::instance();
}

// Verificar capacidades
require_capability('local/neuroopositor:view', $context);

// Configurar página
$PAGE->set_url('/local/neuroopositor/statistics.php', array('courseid' => $courseid));
$PAGE->set_context($context);
$PAGE->set_title(get_string('statistics', 'local_neuroopositor'));
$PAGE->set_heading(get_string('statistics', 'local_neuroopositor'));
$PAGE->set_pagelayout('standard');

// Agregar CSS y JS
$PAGE->requires->css('/local/neuroopositor/styles/neuroopositor.css');
$PAGE->requires->js('/local/neuroopositor/js/neuroopositor.js');

// Procesar acciones AJAX
if ($action === 'get_stats') {
    $stats_type = required_param('type', PARAM_ALPHA);
    $data = null;
    
    switch ($stats_type) {
        case 'general':
            $data = statistics::get_user_general_stats($USER->id, $courseid);
            break;
        case 'blocks':
            $data = statistics::get_user_block_stats($USER->id, $courseid);
            break;
        case 'history':
            $days = optional_param('days', 30, PARAM_INT);
            $data = statistics::get_user_progress_history($USER->id, $courseid, $days);
            break;
        case 'performance':
            $limit = optional_param('limit', 10, PARAM_INT);
            $data = statistics::get_topic_performance($USER->id, $courseid, $limit);
            break;
        case 'comparative':
            $data = statistics::get_comparative_stats($USER->id, $courseid);
            break;
        case 'activity':
            $days = optional_param('days', 7, PARAM_INT);
            $data = statistics::get_recent_activity($USER->id, $courseid, $days);
            break;
        case 'neural':
            $data = statistics::get_neural_connections_stats($USER->id, $courseid);
            break;
        case 'complete':
            $data = statistics::generate_complete_report($USER->id, $courseid);
            break;
    }
    
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Obtener datos para la página
$general_stats = statistics::get_user_general_stats($USER->id, $courseid);
$block_stats = statistics::get_user_block_stats($USER->id, $courseid);
$comparative_stats = statistics::get_comparative_stats($USER->id, $courseid);
$recent_activity = statistics::get_recent_activity($USER->id, $courseid, 7);
$neural_stats = statistics::get_neural_connections_stats($USER->id, $courseid);

echo $OUTPUT->header();
?>

<div class="neuroopositor-container">
    <!-- Navegación -->
    <nav class="neuroopositor-nav">
        <div class="nav-brand">
            <h2><?php echo get_string('neuroopositor', 'local_neuroopositor'); ?></h2>
        </div>
        <div class="nav-links">
            <a href="index.php?courseid=<?php echo $courseid; ?>" class="nav-link">
                <?php echo get_string('dashboard', 'local_neuroopositor'); ?>
            </a>
            <a href="neuralmap.php?courseid=<?php echo $courseid; ?>" class="nav-link">
                <?php echo get_string('neuralmap', 'local_neuroopositor'); ?>
            </a>
            <a href="questions.php?courseid=<?php echo $courseid; ?>" class="nav-link">
                <?php echo get_string('questions', 'local_neuroopositor'); ?>
            </a>
            <a href="statistics.php?courseid=<?php echo $courseid; ?>" class="nav-link active">
                <?php echo get_string('statistics', 'local_neuroopositor'); ?>
            </a>
        </div>
    </nav>

    <div class="statistics-container">
        <!-- Controles de estadísticas -->
        <div class="stats-controls">
            <div class="period-selector">
                <label><?php echo get_string('time_period', 'local_neuroopositor'); ?>:</label>
                <select id="period-select">
                    <option value="7"><?php echo get_string('last_7_days', 'local_neuroopositor'); ?></option>
                    <option value="30" selected><?php echo get_string('last_30_days', 'local_neuroopositor'); ?></option>
                    <option value="90"><?php echo get_string('last_90_days', 'local_neuroopositor'); ?></option>
                    <option value="365"><?php echo get_string('last_year', 'local_neuroopositor'); ?></option>
                </select>
            </div>
            
            <div class="export-controls">
                <button id="export-pdf" class="btn btn-secondary">
                    <i class="fa fa-file-pdf-o"></i>
                    <?php echo get_string('export_pdf', 'local_neuroopositor'); ?>
                </button>
                <button id="export-excel" class="btn btn-secondary">
                    <i class="fa fa-file-excel-o"></i>
                    <?php echo get_string('export_excel', 'local_neuroopositor'); ?>
                </button>
            </div>
        </div>

        <!-- Resumen general -->
        <div class="stats-overview">
            <div class="overview-card">
                <div class="card-icon">
                    <i class="fa fa-chart-line"></i>
                </div>
                <div class="card-content">
                    <h3><?php echo round($general_stats->progreso_general, 1); ?>%</h3>
                    <p><?php echo get_string('overall_progress', 'local_neuroopositor'); ?></p>
                </div>
            </div>
            
            <div class="overview-card">
                <div class="card-icon">
                    <i class="fa fa-bullseye"></i>
                </div>
                <div class="card-content">
                    <h3><?php echo round($general_stats->precision_general, 1); ?>%</h3>
                    <p><?php echo get_string('accuracy', 'local_neuroopositor'); ?></p>
                </div>
            </div>
            
            <div class="overview-card">
                <div class="card-icon">
                    <i class="fa fa-clock-o"></i>
                </div>
                <div class="card-content">
                    <h3><?php echo gmdate('H:i', $general_stats->tiempo_total_estudio); ?></h3>
                    <p><?php echo get_string('study_time', 'local_neuroopositor'); ?></p>
                </div>
            </div>
            
            <div class="overview-card">
                <div class="card-icon">
                    <i class="fa fa-fire"></i>
                </div>
                <div class="card-content">
                    <h3><?php echo $general_stats->racha_actual; ?></h3>
                    <p><?php echo get_string('current_streak', 'local_neuroopositor'); ?></p>
                </div>
            </div>
        </div>

        <!-- Gráficos principales -->
        <div class="stats-charts">
            <!-- Progreso por bloques -->
            <div class="chart-container">
                <div class="chart-header">
                    <h3><?php echo get_string('progress_by_blocks', 'local_neuroopositor'); ?></h3>
                </div>
                <div class="chart-content">
                    <canvas id="blocks-chart"></canvas>
                </div>
            </div>
            
            <!-- Evolución temporal -->
            <div class="chart-container">
                <div class="chart-header">
                    <h3><?php echo get_string('progress_evolution', 'local_neuroopositor'); ?></h3>
                </div>
                <div class="chart-content">
                    <canvas id="evolution-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- Estadísticas detalladas -->
        <div class="detailed-stats">
            <!-- Rendimiento por temas -->
            <div class="stats-section">
                <div class="section-header">
                    <h3><?php echo get_string('topic_performance', 'local_neuroopositor'); ?></h3>
                    <button class="btn btn-sm btn-secondary" id="load-more-topics">
                        <?php echo get_string('load_more', 'local_neuroopositor'); ?>
                    </button>
                </div>
                <div class="topics-performance">
                    <div class="performance-table">
                        <div class="table-header">
                            <div class="col-topic"><?php echo get_string('topic', 'local_neuroopositor'); ?></div>
                            <div class="col-progress"><?php echo get_string('progress', 'local_neuroopositor'); ?></div>
                            <div class="col-accuracy"><?php echo get_string('accuracy', 'local_neuroopositor'); ?></div>
                            <div class="col-time"><?php echo get_string('time', 'local_neuroopositor'); ?></div>
                            <div class="col-confidence"><?php echo get_string('confidence', 'local_neuroopositor'); ?></div>
                        </div>
                        <div id="topics-performance-list">
                            <!-- Se carga dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Estadísticas comparativas -->
            <div class="stats-section">
                <div class="section-header">
                    <h3><?php echo get_string('comparative_stats', 'local_neuroopositor'); ?></h3>
                </div>
                <div class="comparative-stats">
                    <div class="comparison-item">
                        <div class="comparison-label"><?php echo get_string('your_progress', 'local_neuroopositor'); ?></div>
                        <div class="comparison-bar">
                            <div class="bar-fill user-progress" style="width: <?php echo $comparative_stats->progreso_usuario; ?>%"></div>
                            <span class="bar-value"><?php echo round($comparative_stats->progreso_usuario, 1); ?>%</span>
                        </div>
                    </div>
                    
                    <div class="comparison-item">
                        <div class="comparison-label"><?php echo get_string('average_progress', 'local_neuroopositor'); ?></div>
                        <div class="comparison-bar">
                            <div class="bar-fill average-progress" style="width: <?php echo $comparative_stats->progreso_promedio; ?>%"></div>
                            <span class="bar-value"><?php echo round($comparative_stats->progreso_promedio, 1); ?>%</span>
                        </div>
                    </div>
                    
                    <div class="ranking-info">
                        <div class="ranking-item">
                            <span class="ranking-label"><?php echo get_string('your_ranking', 'local_neuroopositor'); ?>:</span>
                            <span class="ranking-value">#<?php echo $comparative_stats->ranking; ?></span>
                        </div>
                        <div class="ranking-item">
                            <span class="ranking-label"><?php echo get_string('percentile', 'local_neuroopositor'); ?>:</span>
                            <span class="ranking-value"><?php echo round($comparative_stats->percentil, 1); ?>%</span>
                        </div>
                        <div class="ranking-item">
                            <span class="ranking-label"><?php echo get_string('total_users', 'local_neuroopositor'); ?>:</span>
                            <span class="ranking-value"><?php echo $comparative_stats->total_usuarios; ?></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Actividad reciente -->
            <div class="stats-section">
                <div class="section-header">
                    <h3><?php echo get_string('recent_activity', 'local_neuroopositor'); ?></h3>
                </div>
                <div class="recent-activity">
                    <div class="activity-grid">
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fa fa-book"></i>
                            </div>
                            <div class="activity-info">
                                <div class="activity-value"><?php echo $recent_activity->sesiones_estudio; ?></div>
                                <div class="activity-label"><?php echo get_string('study_sessions', 'local_neuroopositor'); ?></div>
                            </div>
                        </div>
                        
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fa fa-question-circle"></i>
                            </div>
                            <div class="activity-info">
                                <div class="activity-value"><?php echo $recent_activity->preguntas_respondidas; ?></div>
                                <div class="activity-label"><?php echo get_string('questions_answered', 'local_neuroopositor'); ?></div>
                            </div>
                        </div>
                        
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fa fa-check-circle"></i>
                            </div>
                            <div class="activity-info">
                                <div class="activity-value"><?php echo round($recent_activity->precision_reciente, 1); ?>%</div>
                                <div class="activity-label"><?php echo get_string('recent_accuracy', 'local_neuroopositor'); ?></div>
                            </div>
                        </div>
                        
                        <div class="activity-item">
                            <div class="activity-icon">
                                <i class="fa fa-plus-circle"></i>
                            </div>
                            <div class="activity-info">
                                <div class="activity-value"><?php echo $recent_activity->temas_nuevos; ?></div>
                                <div class="activity-label"><?php echo get_string('new_topics', 'local_neuroopositor'); ?></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Conexiones neurales -->
            <div class="stats-section">
                <div class="section-header">
                    <h3><?php echo get_string('neural_connections', 'local_neuroopositor'); ?></h3>
                </div>
                <div class="neural-connections">
                    <div class="connections-overview">
                        <div class="connection-stat">
                            <div class="stat-value"><?php echo $neural_stats->total_conexiones; ?></div>
                            <div class="stat-label"><?php echo get_string('total_connections', 'local_neuroopositor'); ?></div>
                        </div>
                        <div class="connection-stat">
                            <div class="stat-value"><?php echo $neural_stats->conexiones_activas; ?></div>
                            <div class="stat-label"><?php echo get_string('active_connections', 'local_neuroopositor'); ?></div>
                        </div>
                        <div class="connection-stat">
                            <div class="stat-value"><?php echo round($neural_stats->fuerza_promedio, 1); ?>%</div>
                            <div class="stat-label"><?php echo get_string('average_strength', 'local_neuroopositor'); ?></div>
                        </div>
                    </div>
                    
                    <div class="connection-types">
                        <h4><?php echo get_string('connection_types', 'local_neuroopositor'); ?></h4>
                        <div class="types-chart">
                            <canvas id="connections-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal de exportación -->
<div id="export-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3><?php echo get_string('export_statistics', 'local_neuroopositor'); ?></h3>
            <span class="close">&times;</span>
        </div>
        <div class="modal-body">
            <div class="export-options">
                <label>
                    <input type="checkbox" checked> <?php echo get_string('general_stats', 'local_neuroopositor'); ?>
                </label>
                <label>
                    <input type="checkbox" checked> <?php echo get_string('block_stats', 'local_neuroopositor'); ?>
                </label>
                <label>
                    <input type="checkbox" checked> <?php echo get_string('topic_performance', 'local_neuroopositor'); ?>
                </label>
                <label>
                    <input type="checkbox"> <?php echo get_string('detailed_history', 'local_neuroopositor'); ?>
                </label>
            </div>
            <div class="export-actions">
                <button id="confirm-export" class="btn btn-primary">
                    <?php echo get_string('export', 'local_neuroopositor'); ?>
                </button>
                <button class="btn btn-secondary close-modal">
                    <?php echo get_string('cancel', 'local_neuroopositor'); ?>
                </button>
            </div>
        </div>
    </div>
</div>

<script>
// Configuración global para JavaScript
window.NeuroOpositorConfig = {
    courseid: <?php echo $courseid; ?>,
    userid: <?php echo $USER->id; ?>,
    wwwroot: '<?php echo $CFG->wwwroot; ?>',
    stats: {
        general: <?php echo json_encode($general_stats); ?>,
        blocks: <?php echo json_encode($block_stats); ?>,
        comparative: <?php echo json_encode($comparative_stats); ?>,
        activity: <?php echo json_encode($recent_activity); ?>,
        neural: <?php echo json_encode($neural_stats); ?>
    },
    strings: {
        loading: '<?php echo get_string('loading', 'local_neuroopositor'); ?>',
        error: '<?php echo get_string('error', 'local_neuroopositor'); ?>',
        no_data: '<?php echo get_string('no_data', 'local_neuroopositor'); ?>'
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (typeof NeuroOpositor !== 'undefined') {
        NeuroOpositor.init();
        NeuroOpositor.initStatisticsView();
    }
});
</script>

<?php
echo $OUTPUT->footer();
?>