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
 * Página de preguntas de NeuroOpositor
 *
 * @package    local_neuroopositor
 * @copyright  2025 NeuroOpositor
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');
require_once($CFG->dirroot . '/local/neuroopositor/classes/question_manager.php');
require_once($CFG->dirroot . '/local/neuroopositor/classes/user_progress.php');
require_once($CFG->dirroot . '/local/neuroopositor/classes/tema.php');

use local_neuroopositor\question_manager;
use local_neuroopositor\user_progress;
use local_neuroopositor\tema;

// Verificar login
require_login();

// Obtener parámetros
$courseid = optional_param('courseid', 0, PARAM_INT);
$tema_id = optional_param('tema', 0, PARAM_INT);
$action = optional_param('action', 'view', PARAM_ALPHA);
$question_id = optional_param('qid', 0, PARAM_INT);
$mode = optional_param('mode', 'view', PARAM_ALPHA);

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
$PAGE->set_url('/local/neuroopositor/questions.php', array('courseid' => $courseid, 'tema' => $tema_id));
$PAGE->set_context($context);
$PAGE->set_title(get_string('questions', 'local_neuroopositor'));
$PAGE->set_heading(get_string('questions', 'local_neuroopositor'));
$PAGE->set_pagelayout('standard');

// Agregar CSS y JS
$PAGE->requires->css('/local/neuroopositor/styles/neuroopositor.css');
$PAGE->requires->css('/local/neuroopositor/styles/fixes.css');
$PAGE->requires->js('/local/neuroopositor/js/force-styles.js');
$PAGE->requires->js('/local/neuroopositor/js/neuroopositor.js');

// Procesar acciones AJAX
if ($action === 'answer' && $question_id) {
    // Procesar respuesta del usuario
    $user_answer = required_param('answer', PARAM_RAW);
    $time_spent = optional_param('time_spent', 0, PARAM_INT);
    
    $result = question_manager::process_user_answer(
        $USER->id, 
        $courseid, 
        $question_id, 
        $user_answer, 
        $time_spent
    );
    
    // Devolver respuesta JSON
    header('Content-Type: application/json');
    echo json_encode($result);
    exit;
}

if ($action === 'get_questions') {
    // Obtener preguntas para un tema
    $limit = optional_param('limit', 10, PARAM_INT);
    
    if ($tema_id) {
        $questions = question_manager::get_tema_questions($tema_id, $limit);
    } else {
        $questions = question_manager::get_recommended_questions($USER->id, $courseid, $limit);
    }
    
    header('Content-Type: application/json');
    echo json_encode($questions);
    exit;
}

// Obtener datos para la página
$temas = tema::get_all();
$user_stats = user_progress::get_user_general_stats($USER->id, $courseid);

// Si hay un tema específico, obtener sus preguntas
$current_questions = [];
if ($tema_id) {
    $current_tema = tema::get_by_id($tema_id);
    $current_questions = question_manager::get_tema_questions($tema_id, 5);
} else {
    $current_tema = null;
    $current_questions = question_manager::get_recommended_questions($USER->id, $courseid, 5);
}

echo $OUTPUT->header();

// Si el modo es 'study', mostrar interfaz de estudio
if ($mode === 'study' && $tema_id) {
    $current_tema = tema::get_by_id($tema_id);
    $study_questions = question_manager::get_tema_questions($tema_id, 10);
    
    echo '<div class="neuroopositor-container study-mode">';
    echo '<div class="study-header">';
    echo '<h2>Sesión de Estudio: ' . $current_tema->titulo . '</h2>';
    echo '<p>Bloque ' . $current_tema->bloque . ' - Dificultad: ' . $current_tema->nivel_dificultad . '</p>';
    echo '<div class="study-controls">';
    echo '<button id="start-study-btn" class="btn btn-success">Iniciar Estudio</button>';
    echo '<a href="questions.php?courseid=' . $courseid . '" class="btn btn-secondary">Volver a Temas</a>';
    echo '</div>';
    echo '</div>';
    
    echo '<div class="study-content" id="study-content">';
    echo '<div class="study-info">';
    echo '<p>Prepárate para estudiar el tema: <strong>' . $current_tema->titulo . '</strong></p>';
    echo '<p>Se han preparado ' . count($study_questions) . ' preguntas para tu sesión de estudio.</p>';
    echo '<p>Haz clic en "Iniciar Estudio" cuando estés listo.</p>';
    echo '</div>';
    echo '</div>';
    
    echo '</div>';
    
    // JavaScript para manejar la sesión de estudio
    echo '<script>';
    echo 'document.getElementById("start-study-btn").addEventListener("click", function() {';
    echo '    alert("Funcionalidad de estudio en desarrollo. Pronto podrás estudiar con preguntas interactivas.");';
    echo '});';
    echo '</script>';
    
    echo '<style>';
    echo '.study-mode { max-width: 800px; margin: 0 auto; padding: 2rem; }';
    echo '.study-header { text-align: center; margin-bottom: 2rem; padding: 2rem; background: #f8f9fa; border-radius: 8px; }';
    echo '.study-header h2 { color: #007bff; margin-bottom: 1rem; }';
    echo '.study-controls { margin-top: 1.5rem; }';
    echo '.study-controls .btn { margin: 0 0.5rem; padding: 0.75rem 1.5rem; }';
    echo '.study-content { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }';
    echo '.study-info { text-align: center; }';
    echo '.study-info p { margin-bottom: 1rem; font-size: 1.1rem; }';
    echo '</style>';
    
    echo $OUTPUT->footer();
    exit;
}
?>
<style>
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}
.topic-item {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}
.topic-item .topic-info {
  flex: 1;
}
.topic-item .topic-info h4 {
  color: #000 !important;
  font-weight: 600 !important;
  margin-bottom: 0.5rem !important;
  font-size: 1.1rem !important;
}
.topic-item .topic-info p {
  color: #000 !important;
  font-size: 0.9rem;
  margin-bottom: 0.5rem !important;
}
.topic-item .topic-description {
  color: #000 !important;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.topic-item .topic-actions {
  margin-top: auto;
  display: flex;
  justify-content: center;
}
.topic-item .study-btn {
  background-color: #007bff !important;
  color: white !important;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
.topic-item .study-btn:hover {
  background-color: #0056b3 !important;
}
</style>

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
            <a href="questions.php?courseid=<?php echo $courseid; ?>" class="nav-link active">
                <?php echo get_string('questions', 'local_neuroopositor'); ?>
            </a>
            <a href="statistics.php?courseid=<?php echo $courseid; ?>" class="nav-link">
                <?php echo get_string('statistics', 'local_neuroopositor'); ?>
            </a>
        </div>
    </nav>

    <div class="questions-container">
        <!-- Panel lateral de temas -->
        <div class="topics-sidebar">
            <div class="sidebar-header">
                <h3><?php echo get_string('topics', 'local_neuroopositor'); ?></h3>
                <div class="user-stats-mini">
                    <div class="stat-item">
                        <span class="stat-label"><?php echo get_string('progress', 'local_neuroopositor'); ?>:</span>
                        <span class="stat-value"><?php echo round($user_stats->progreso_general, 1); ?>%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label"><?php echo get_string('accuracy', 'local_neuroopositor'); ?>:</span>
                        <span class="stat-value"><?php echo round($user_stats->precision_general, 1); ?>%</span>
                    </div>
                </div>
            </div>
            
            <div class="topics-filter">
                <input type="text" id="topic-search" placeholder="<?php echo get_string('search_topics', 'local_neuroopositor'); ?>">
                <select id="block-filter">
                    <option value=""><?php echo get_string('all_blocks', 'local_neuroopositor'); ?></option>
                    <option value="1"><?php echo get_string('block', 'local_neuroopositor') . ' I'; ?></option>
                    <option value="2"><?php echo get_string('block', 'local_neuroopositor') . ' II'; ?></option>
                    <option value="3"><?php echo get_string('block', 'local_neuroopositor') . ' III'; ?></option>
                </select>
            </div>
            
            <div class="topics-grid">
                <div class="topic-item recommended" data-tema-id="0">
                    <div class="topic-info">
                        <h4><?php echo get_string('recommended_questions', 'local_neuroopositor'); ?></h4>
                        <p><?php echo get_string('ai_recommended_desc', 'local_neuroopositor'); ?></p>
                    </div>
                    <div class="topic-progress">
                        <i class="fa fa-brain"></i>
                    </div>
                </div>
                
                <?php foreach ($temas as $tema): 
                    $tema_progress = user_progress::get_by_user_tema_course($USER->id, $tema->id, $courseid);
                    $progress_percent = $tema_progress ? $tema_progress->porcentaje_dominio : 0;
                    $questions_count = $DB->count_records('neuroopositor_question_mapping', ['tema_id' => $tema->id]);
                ?>
                <div class="topic-item <?php echo ($tema_id == $tema->id) ? 'active' : ''; ?>" 
                     data-tema-id="<?php echo $tema->id; ?>" 
                     data-bloque="<?php echo $tema->bloque; ?>">
                    <div class="topic-info">
                        <h4><?php echo $tema->titulo; ?></h4>
                        <p style="color: #000000 !important; visibility: visible !important; opacity: 1 !important; display: block !important; font-size: 0.9rem !important; margin: 0.5rem 0 !important; text-shadow: none !important;"><?php echo get_string('block', 'local_neuroopositor') . ' ' . $tema->bloque . ' - ' . $questions_count . ' ' . get_string('questions', 'local_neuroopositor'); ?></p>
                        <small style="color: #000000 !important; visibility: visible !important; opacity: 1 !important; display: inline-block !important; font-size: 0.85rem !important; margin: 0.25rem 0.5rem 0.25rem 0 !important; font-weight: 500 !important;">Block: <?php echo $tema->bloque; ?></small>
                        <small style="color: #000000 !important; visibility: visible !important; opacity: 1 !important; display: inline-block !important; font-size: 0.85rem !important; margin: 0.25rem 0.5rem 0.25rem 0 !important; font-weight: 500 !important;">Difficulty: <?php echo $tema->nivel_dificultad; ?></small>
                        <small style="color: #000000 !important; visibility: visible !important; opacity: 1 !important; display: inline-block !important; font-size: 0.85rem !important; margin: 0.25rem 0.5rem 0.25rem 0 !important; font-weight: 500 !important;">Progress: <?php echo round($progress_percent); ?>%</small>
                        <p class="topic-description"><?php echo shorten_text($tema->descripcion, 150); ?></p>
                    </div>
                    <div class="topic-progress">
                        <div class="progress-circle" data-progress="<?php echo $progress_percent; ?>">
                            <span><?php echo round($progress_percent); ?>%</span>
                        </div>
                    </div>
                    <div class="topic-actions">
                        <button class="study-btn" data-tema-id="<?php echo $tema->id; ?>">
                            <?php echo get_string('study', 'local_neuroopositor'); ?>
                        </button>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Área principal de preguntas -->
        <div class="questions-main">
            <div class="questions-header">
                <div class="current-topic">
                    <?php if ($current_tema): ?>
                        <h2><?php echo $current_tema->titulo; ?></h2>
                        <p class="topic-description"><?php echo shorten_text($current_tema->descripcion, 150); ?></p>
                    <?php else: ?>
                        <h2><?php echo get_string('recommended_questions', 'local_neuroopositor'); ?></h2>
                        <p class="topic-description"><?php echo get_string('ai_recommended_desc', 'local_neuroopositor'); ?></p>
                    <?php endif; ?>
                </div>
                
                <div class="question-controls">
                    <button id="new-questions-btn" class="btn btn-primary">
                        <i class="fa fa-refresh"></i>
                        <?php echo get_string('new_questions', 'local_neuroopositor'); ?>
                    </button>
                    <button id="practice-mode-btn" class="btn btn-secondary">
                        <i class="fa fa-play"></i>
                        <?php echo get_string('practice_mode', 'local_neuroopositor'); ?>
                    </button>
                </div>
            </div>

            <!-- Área de preguntas -->
            <div class="questions-area">
                <div id="question-container">
                    <?php if (empty($current_questions)): ?>
                        <div class="no-questions">
                            <i class="fa fa-question-circle"></i>
                            <h3><?php echo get_string('no_questions_available', 'local_neuroopositor'); ?></h3>
                            <p><?php echo get_string('no_questions_desc', 'local_neuroopositor'); ?></p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($current_questions as $index => $question): ?>
                            <div class="question-card <?php echo $index === 0 ? 'active' : 'hidden'; ?>" 
                                 data-question-id="<?php echo $question->id; ?>"
                                 data-question-type="<?php echo $question->qtype; ?>">
                                
                                <div class="question-header">
                                    <div class="question-number">
                                        <?php echo get_string('question', 'local_neuroopositor') . ' ' . ($index + 1); ?>
                                    </div>
                                    <div class="question-timer">
                                        <i class="fa fa-clock-o"></i>
                                        <span id="timer-display">00:00</span>
                                    </div>
                                </div>
                                
                                <div class="question-content">
                                    <div class="question-text">
                                        <?php echo format_text($question->questiontext, $question->questiontextformat); ?>
                                    </div>
                                    
                                    <div class="question-answers">
                                        <?php if ($question->qtype === 'multichoice'): ?>
                                            <?php foreach ($question->answers as $answer): ?>
                                                <label class="answer-option">
                                                    <input type="radio" name="answer_<?php echo $question->id; ?>" 
                                                           value="<?php echo $answer['id']; ?>">
                                                    <span class="answer-text"><?php echo format_text($answer['answer']); ?></span>
                                                </label>
                                            <?php endforeach; ?>
                                        <?php elseif ($question->qtype === 'truefalse'): ?>
                                            <label class="answer-option">
                                                <input type="radio" name="answer_<?php echo $question->id; ?>" value="1">
                                                <span class="answer-text"><?php echo get_string('true', 'local_neuroopositor'); ?></span>
                                            </label>
                                            <label class="answer-option">
                                                <input type="radio" name="answer_<?php echo $question->id; ?>" value="0">
                                                <span class="answer-text"><?php echo get_string('false', 'local_neuroopositor'); ?></span>
                                            </label>
                                        <?php elseif ($question->qtype === 'shortanswer'): ?>
                                            <input type="text" name="answer_<?php echo $question->id; ?>" 
                                                   class="form-control" 
                                                   placeholder="<?php echo get_string('enter_answer', 'local_neuroopositor'); ?>">
                                        <?php endif; ?>
                                    </div>
                                </div>
                                
                                <div class="question-actions">
                                    <button class="btn btn-primary submit-answer" 
                                            data-question-id="<?php echo $question->id; ?>">
                                        <?php echo get_string('submit_answer', 'local_neuroopositor'); ?>
                                    </button>
                                    <button class="btn btn-secondary skip-question">
                                        <?php echo get_string('skip_question', 'local_neuroopositor'); ?>
                                    </button>
                                </div>
                                
                                <!-- Área de feedback -->
                                <div class="question-feedback hidden">
                                    <div class="feedback-content"></div>
                                    <button class="btn btn-primary next-question">
                                        <?php echo get_string('next_question', 'local_neuroopositor'); ?>
                                    </button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
                
                <!-- Indicador de progreso -->
                <div class="question-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">
                        <span id="current-question">1</span> / <span id="total-questions"><?php echo count($current_questions); ?></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal de resultados -->
<div id="results-modal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3><?php echo get_string('session_results', 'local_neuroopositor'); ?></h3>
            <span class="close">&times;</span>
        </div>
        <div class="modal-body">
            <div class="results-summary">
                <div class="result-stat">
                    <div class="stat-value" id="correct-answers">0</div>
                    <div class="stat-label"><?php echo get_string('correct_answers', 'local_neuroopositor'); ?></div>
                </div>
                <div class="result-stat">
                    <div class="stat-value" id="total-time">0:00</div>
                    <div class="stat-label"><?php echo get_string('total_time', 'local_neuroopositor'); ?></div>
                </div>
                <div class="result-stat">
                    <div class="stat-value" id="accuracy-rate">0%</div>
                    <div class="stat-label"><?php echo get_string('accuracy', 'local_neuroopositor'); ?></div>
                </div>
            </div>
            <div class="results-actions">
                <button id="continue-studying" class="btn btn-primary">
                    <?php echo get_string('continue_studying', 'local_neuroopositor'); ?>
                </button>
                <button id="view-progress" class="btn btn-secondary">
                    <?php echo get_string('view_progress', 'local_neuroopositor'); ?>
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
    current_tema: <?php echo $tema_id; ?>,
    wwwroot: '<?php echo $CFG->wwwroot; ?>',
    strings: {
        correct: '<?php echo get_string('correct', 'local_neuroopositor'); ?>',
        incorrect: '<?php echo get_string('incorrect', 'local_neuroopositor'); ?>',
        loading: '<?php echo get_string('loading', 'local_neuroopositor'); ?>',
        error: '<?php echo get_string('error', 'local_neuroopositor'); ?>'
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (typeof NeuroOpositor !== 'undefined') {
        NeuroOpositor.init();
        NeuroOpositor.initQuestionsView();
    }
});
</script>

<?php
echo $OUTPUT->footer();
?>