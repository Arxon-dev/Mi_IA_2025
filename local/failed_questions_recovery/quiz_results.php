<?php
require_once('../../config.php');
require_once('lib.php');
require_once('externallib.php');

// Verificar autenticación
require_login();

// Obtener parámetros
$quizid = required_param('quizid', PARAM_INT);

// Verificar que el cuestionario pertenece al usuario actual
$quiz = $DB->get_record('local_fqr_recovery_quizzes', array('id' => $quizid, 'userid' => $USER->id));

if (!$quiz) {
    print_error('invalidquiz', 'local_failed_questions_recovery');
}

// Configurar la página
$PAGE->set_url('/local/failed_questions_recovery/quiz_results.php', array('quizid' => $quizid));
$PAGE->set_context(context_system::instance());
$PAGE->set_title('Resultados del cuestionario de recuperación');
$PAGE->set_heading('Resultados del cuestionario de recuperación');

echo $OUTPUT->header();

?>

<div class="quiz-results-container">
    <div class="quiz-info card mb-4">
        <div class="card-header">
            <h3><i class="fa fa-trophy"></i> <?php echo htmlspecialchars($quiz->quizname); ?></h3>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Fecha de creación:</strong> <?php echo date('d/m/Y H:i', $quiz->timecreated); ?></p>
                    <p><strong>Preguntas:</strong> <?php echo $quiz->questioncount; ?></p>
                    <p><strong>Categoría:</strong> <?php echo htmlspecialchars($quiz->categoryname); ?></p>
                </div>
                <div class="col-md-6">
                    <p><strong>Estado:</strong> 
                        <span class="badge badge-<?php echo $quiz->completed ? 'success' : 'warning'; ?>">
                            <?php echo $quiz->completed ? 'Completado' : 'En progreso'; ?>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    </div>

    <?php if ($quiz->completed): ?>
        <div class="alert alert-success">
            <h4><i class="fa fa-check-circle"></i> ¡Cuestionario completado!</h4>
            <p>Has terminado exitosamente este cuestionario de recuperación. Las preguntas que hayas respondido correctamente han sido marcadas como dominadas.</p>
        </div>
        
        <?php
        // Obtener los detalles de las respuestas de este cuestionario
        $attempts = $DB->get_records('local_fqr_recovery_attempts', 
            array('recoveryquizid' => $quizid, 'userid' => $USER->id), 
            'timeanswered ASC');
        
        if (!empty($attempts)): 
            $correct_count = 0;
            $total_count = count($attempts);
            
            // Contar respuestas correctas
            foreach ($attempts as $attempt) {
                if ($attempt->iscorrect) {
                    $correct_count++;
                }
            }
            
            $score_percentage = $total_count > 0 ? round(($correct_count / $total_count) * 100, 1) : 0;
        ?>
        
        <div class="card mb-4">
            <div class="card-header">
                <h4><i class="fa fa-list-check"></i> Resultados detallados de este cuestionario</h4>
                <div class="quiz-score">
                    <span class="badge badge-<?php echo $score_percentage >= 70 ? 'success' : ($score_percentage >= 50 ? 'warning' : 'danger'); ?> badge-lg">
                        <?php echo $correct_count; ?>/<?php echo $total_count; ?> correctas (<?php echo $score_percentage; ?>%)
                    </span>
                </div>
            </div>
            <div class="card-body">
                <?php 
                $question_number = 1;
                foreach ($attempts as $attempt): 
                    // Obtener información de la pregunta
                    $question = $DB->get_record('question', array('id' => $attempt->questionid));
                    
                    if ($question): ?>
                        <div class="question-result mb-4 p-3 border rounded <?php echo $attempt->iscorrect ? 'border-success bg-light-success' : 'border-danger bg-light-danger'; ?>">
                            <div class="question-header d-flex justify-content-between align-items-center mb-2">
                                <h5 class="mb-0">
                                    <span class="question-number">Pregunta <?php echo $question_number; ?></span>
                                    <span class="result-badge">
                                        <?php if ($attempt->iscorrect): ?>
                                            <i class="fa fa-check-circle text-success"></i> <strong class="text-success">CORRECTA</strong>
                                        <?php else: ?>
                                            <i class="fa fa-times-circle text-danger"></i> <strong class="text-danger">INCORRECTA</strong>
                                        <?php endif; ?>
                                    </span>
                                </h5>
                            </div>
                            
                            <div class="question-text mb-3">
                                <strong>Pregunta:</strong>
                                <div class="mt-1"><?php echo format_text($question->questiontext); ?></div>
                            </div>
                            
                            <?php if ($question->qtype == 'multichoice'): 
                                // Obtener todas las opciones y la respuesta correcta
                                $answers = $DB->get_records('question_answers', array('question' => $question->id), 'id ASC');
                                $correct_answer = $DB->get_record('question_answers', array('question' => $question->id, 'fraction' => 1));
                                $user_answer = $DB->get_record('question_answers', array('id' => $attempt->response));
                            ?>
                                <div class="answers-section">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <strong>Tu respuesta:</strong>
                                            <div class="user-answer p-2 mt-1 rounded <?php echo $attempt->iscorrect ? 'bg-success text-white' : 'bg-danger text-white'; ?>">
                                                <?php echo $user_answer ? format_text($user_answer->answer) : 'No respondida'; ?>
                                            </div>
                                        </div>
                                        
                                        <?php if (!$attempt->iscorrect && $correct_answer): ?>
                                        <div class="col-md-6">
                                            <strong>Respuesta correcta:</strong>
                                            <div class="correct-answer p-2 mt-1 rounded bg-success text-white">
                                                <?php echo format_text($correct_answer->answer); ?>
                                            </div>
                                        </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            <?php else: ?>
                                <div class="text-answer">
                                    <strong>Tu respuesta:</strong>
                                    <div class="p-2 mt-1 rounded bg-light border">
                                        <?php echo htmlspecialchars($attempt->response ?: 'No respondida'); ?>
                                    </div>
                                </div>
                            <?php endif; ?>
                            
                            <?php if ($attempt->iscorrect): ?>
                                <div class="mastery-info mt-2">
                                    <small class="text-success">
                                        <i class="fa fa-star"></i> Esta pregunta ha sido marcada como dominada
                                    </small>
                                </div>
                            <?php else: ?>
                                <div class="mastery-info mt-2">
                                    <small class="text-muted">
                                        <i class="fa fa-refresh"></i> Esta pregunta seguirá apareciendo en futuros cuestionarios de recuperación
                                    </small>
                                </div>
                            <?php endif; ?>
                        </div>
                    <?php 
                    endif;
                    $question_number++;
                endforeach; ?>
            </div>
        </div>
        
        <?php endif; ?>
        
    <?php else: ?>
        <div class="alert alert-info">
            <h4><i class="fa fa-info-circle"></i> Cuestionario en progreso</h4>
            <p>Este cuestionario aún no ha sido marcado como completado. Si has terminado de responder, el sistema debería actualizarse automáticamente.</p>
        </div>
    <?php endif; ?>

    <div class="actions">
        <a href="index.php" class="btn btn-primary">
            <i class="fa fa-arrow-left"></i> Volver al dashboard
        </a>
        
        <a href="create_quiz.php" class="btn btn-success">
            <i class="fa fa-plus"></i> Crear nuevo cuestionario
        </a>
        
        <?php if ($quiz->completed): ?>
            <a href="view_stats.php" class="btn btn-info">
                <i class="fa fa-chart-bar"></i> Ver estadísticas
            </a>
        <?php endif; ?>
    </div>

    <?php
    // Obtener estadísticas actualizadas del usuario
    $stats = get_user_stats($USER->id);
    if ($stats): ?>
        <div class="card mt-4">
            <div class="card-header">
                <h4><i class="fa fa-chart-line"></i> Tus estadísticas actuales</h4>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3 text-center">
                        <div class="stat-item">
                            <h3 class="text-danger"><?php echo $stats->total_failed; ?></h3>
                            <p class="text-muted">Preguntas por dominar</p>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="stat-item">
                            <h3 class="text-success"><?php echo $stats->total_mastered; ?></h3>
                            <p class="text-muted">Preguntas dominadas</p>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="stat-item">
                            <h3 class="text-info"><?php echo $stats->total_quizzes; ?></h3>
                            <p class="text-muted">Cuestionarios completados</p>
                        </div>
                    </div>
                    <div class="col-md-3 text-center">
                        <div class="stat-item">
                            <h3 class="text-warning"><?php echo number_format($stats->success_rate, 1); ?>%</h3>
                            <p class="text-muted">Tasa de éxito</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <?php
    // Mostrar progreso por categorías si hay datos
    $categories = get_failed_questions_by_category($USER->id);
    if (!empty($categories)): ?>
        <div class="card mt-4">
            <div class="card-header">
                <h4><i class="fa fa-list"></i> Progreso por categorías</h4>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Preguntas por dominar</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($categories as $category): ?>
                                <tr>
                                    <td>
                                        <strong><?php echo htmlspecialchars($category['name']); ?></strong>
                                    </td>
                                    <td>
                                        <span class="badge badge-danger"><?php echo $category['count']; ?></span>
                                    </td>
                                    <td>
                                        <a href="create_quiz.php?categoryid=<?php echo $category['id']; ?>" 
                                           class="btn btn-sm btn-outline-primary">
                                            Crear cuestionario
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<style>
.quiz-results-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.stat-item h3 {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-item p {
    font-size: 0.9rem;
    margin-bottom: 0;
}

/* Estilos para resultados detallados */
.quiz-score {
    float: right;
}

.badge-lg {
    font-size: 1rem;
    padding: 8px 12px;
}

.question-result {
    transition: all 0.3s ease;
}

.question-result:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.bg-light-success {
    background-color: #f8f9fa !important;
    border-color: #28a745 !important;
}

.bg-light-danger {
    background-color: #f8f9fa !important;
    border-color: #dc3545 !important;
}

.question-number {
    font-weight: bold;
    color: #495057;
}

.result-badge {
    font-size: 0.9rem;
}

.user-answer, .correct-answer {
    border: 1px solid rgba(255,255,255,0.3);
    font-weight: 500;
}

.answers-section .row > div {
    margin-bottom: 10px;
}

.mastery-info {
    border-top: 1px solid rgba(0,0,0,0.1);
    padding-top: 8px;
}

.actions {
    text-align: center;
    margin: 30px 0;
}

.actions .btn {
    margin: 0 10px;
}

.card {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.badge {
    font-size: 0.9rem;
}

@media (max-width: 768px) {
    .actions .btn {
        display: block;
        margin: 10px auto;
        width: 200px;
    }
    
    .stat-item {
        margin-bottom: 20px;
    }
}
</style>

<script>
// Auto-refresh para verificar si el cuestionario se completa
setTimeout(function() {
    <?php if (!$quiz->completed): ?>
        // Verificar si el cuestionario se ha completado
        location.reload();
    <?php endif; ?>
}, 5000); // Verificar cada 5 segundos si no está completado
</script>

<?php

echo $OUTPUT->footer();
?>