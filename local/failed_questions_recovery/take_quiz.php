<?php
require_once('../../config.php');
require_once('lib.php');
require_once('externallib.php');

// Verificar que el usuario esté autenticado
require_login();

// Configurar la página
$context = context_user::instance($USER->id);
$PAGE->set_context($context);
$PAGE->set_url('/local/failed_questions_recovery/take_quiz.php');

// Verificar permisos básicos (solo necesita estar autenticado)
$systemcontext = context_system::instance();

// Obtener parámetros
$quizid = required_param('quizid', PARAM_INT);

// Obtener el cuestionario de recuperación
$recovery_quiz = $DB->get_record('local_fqr_recovery_quizzes', array('id' => $quizid));

if (!$recovery_quiz || $recovery_quiz->userid != $USER->id) {
    throw new moodle_exception('invalidaccess', 'error');
}

$PAGE->set_title($recovery_quiz->quizname);
$PAGE->set_heading($recovery_quiz->quizname);

// Procesar envío del cuestionario
if (data_submitted() && confirm_sesskey()) {
    $responses = array();
    $correct_count = 0;
    $total_questions = 0;
    
    // Obtener preguntas del cuestionario
    $conditions = array(
        'userid' => $USER->id,
        'mastered' => 0
    );
    
    if ($recovery_quiz->categoryid) {
        // El campo categoryid del quiz de recuperación contiene realmente un quizid
        $conditions['quizid'] = $recovery_quiz->categoryid;
    }
    
    $failed_questions = $DB->get_records('local_failed_questions_recovery', $conditions, 'lastfailed DESC', '*', 0, $recovery_quiz->questioncount);
    
    foreach ($failed_questions as $fq) {
        $total_questions++;
        $user_answer = optional_param('question_' . $fq->questionid, '', PARAM_TEXT);
        
        // Obtener la pregunta real de Moodle
        $question = $DB->get_record('question', array('id' => $fq->questionid));
        $is_correct = false;
        
        if ($question && $question->qtype == 'multichoice') {
            // Para preguntas de opción múltiple, verificar la respuesta
            $correct_answer = $DB->get_record('question_answers', array(
                'question' => $question->id,
                'fraction' => 1
            ));
            
            if ($correct_answer && $user_answer == $correct_answer->id) {
                $is_correct = true;
                $correct_count++;
            }
        }
        
        $responses[] = array(
            'questionid' => $fq->questionid,
            'iscorrect' => $is_correct,
            'response' => $user_answer
        );
    }
    
    // Calcular puntuación
    $score = ($total_questions > 0) ? ($correct_count / $total_questions) * 100 : 0;
    
    // Completar el cuestionario
    try {
        $result = local_failed_questions_recovery_external::complete_recovery_quiz($quizid, $score, $responses);
        
        // Redirigir a la página de resultados
        redirect(new moodle_url('/local/failed_questions_recovery/quiz_results.php', array('quizid' => $quizid)));
        
    } catch (Exception $e) {
        $error = 'Error al completar el cuestionario: ' . $e->getMessage();
    }
}

// Agregar CSS
$PAGE->requires->css('/local/failed_questions_recovery/styles.css');

// Configurar navegación
$PAGE->navbar->add('Recuperación de preguntas fallidas', new moodle_url('/local/failed_questions_recovery/index.php'));
$PAGE->navbar->add('Cuestionarios de recuperación', new moodle_url('/local/failed_questions_recovery/index.php', array('action' => 'recovery_quizzes')));
$PAGE->navbar->add($recovery_quiz->quizname);

// Inicializar output
echo $OUTPUT->header();

// Mostrar error si existe
if (isset($error)) {
    echo html_writer::tag('div', $error, array('class' => 'alert alert-danger'));
}

// Obtener preguntas para el cuestionario
$conditions = array(
    'userid' => $USER->id,
    'mastered' => 0
);

if ($recovery_quiz->categoryid) {
    // El campo categoryid del quiz de recuperación contiene realmente un quizid
    $conditions['quizid'] = $recovery_quiz->categoryid;
}

$failed_questions = $DB->get_records('local_failed_questions_recovery', $conditions, 'lastfailed DESC', '*', 0, $recovery_quiz->questioncount);

if (empty($failed_questions)) {
    echo html_writer::tag('div', 'No hay preguntas disponibles para este cuestionario.', array('class' => 'alert alert-info'));
    echo html_writer::link(new moodle_url('/local/failed_questions_recovery/index.php'), 'Volver', array('class' => 'btn btn-secondary'));
} else {
    // Mostrar información del cuestionario
    echo html_writer::start_tag('div', array('class' => 'quiz-info mb-4'));
    echo html_writer::tag('h3', $recovery_quiz->quizname);
    echo html_writer::tag('p', 'Categoría: ' . $recovery_quiz->categoryname);
    echo html_writer::tag('p', 'Número de preguntas: ' . count($failed_questions));
    echo html_writer::end_tag('div');
    
    // Formulario del cuestionario
    echo html_writer::start_tag('form', array('method' => 'POST', 'class' => 'recovery-quiz-form'));
    echo html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()));
    
    $question_number = 1;
    foreach ($failed_questions as $fq) {
        // Obtener la pregunta real de Moodle
        $question = $DB->get_record('question', array('id' => $fq->questionid));
        
        if (!$question) {
            continue;
        }
        
        echo html_writer::start_tag('div', array('class' => 'question-container card mb-4'));
        echo html_writer::start_tag('div', array('class' => 'card-body'));
        
        // Título de la pregunta
        echo html_writer::tag('h4', 'Pregunta ' . $question_number, array('class' => 'question-title'));
        
        // Texto de la pregunta
        echo html_writer::tag('div', format_text($question->questiontext), array('class' => 'question-text mb-3'));
        
        // Opciones de respuesta (para preguntas de opción múltiple)
        if ($question->qtype == 'multichoice') {
            $answers = $DB->get_records('question_answers', array('question' => $question->id), 'id ASC');
            
            if (!empty($answers)) {
                echo html_writer::start_tag('div', array('class' => 'question-options'));
                
                $option_letter = 'A';
                foreach ($answers as $answer) {
                    echo html_writer::start_tag('div', array('class' => 'form-check mb-2'));
                    echo html_writer::empty_tag('input', array(
                        'type' => 'radio',
                        'name' => 'question_' . $question->id,
                        'value' => $answer->id,
                        'id' => 'question_' . $question->id . '_' . $answer->id,
                        'class' => 'form-check-input',
                        'required' => true
                    ));
                    echo html_writer::tag('label', $option_letter . ') ' . format_text($answer->answer), array(
                        'for' => 'question_' . $question->id . '_' . $answer->id,
                        'class' => 'form-check-label'
                    ));
                    echo html_writer::end_tag('div');
                    $option_letter++;
                }
                
                echo html_writer::end_tag('div');
            }
        } else {
            // Para otros tipos de preguntas, mostrar un campo de texto
            echo html_writer::start_tag('div', array('class' => 'question-text-input'));
            echo html_writer::tag('label', 'Tu respuesta:', array('for' => 'question_' . $question->id, 'class' => 'form-label'));
            echo html_writer::tag('textarea', '', array(
                'name' => 'question_' . $question->id,
                'id' => 'question_' . $question->id,
                'class' => 'form-control',
                'rows' => 3,
                'required' => true
            ));
            echo html_writer::end_tag('div');
        }
        
        // Información adicional
        echo html_writer::start_tag('div', array('class' => 'question-meta mt-3'));
        echo html_writer::tag('small', 'Intentos: ' . $fq->attempts, array('class' => 'text-muted'));
        echo html_writer::tag('small', ' | Último fallo: ' . userdate($fq->lastfailed), array('class' => 'text-muted'));
        echo html_writer::end_tag('div');
        
        echo html_writer::end_tag('div');
        echo html_writer::end_tag('div');
        
        $question_number++;
    }
    
    // Botones de envío
    echo html_writer::start_tag('div', array('class' => 'quiz-submit-section mt-4'));
    echo html_writer::empty_tag('input', array(
        'type' => 'submit',
        'value' => 'Enviar',
        'class' => 'btn btn-primary btn-lg',
        'onclick' => 'return confirm("¿Estás seguro de que quieres enviar el cuestionario?");'
    ));
    echo html_writer::link(
        new moodle_url('/local/failed_questions_recovery/index.php', array('action' => 'recovery_quizzes')),
        'Cancelar',
        array('class' => 'btn btn-secondary btn-lg ml-2')
    );
    echo html_writer::end_tag('div');
    
    echo html_writer::end_tag('form');
}

echo $OUTPUT->footer();
?>