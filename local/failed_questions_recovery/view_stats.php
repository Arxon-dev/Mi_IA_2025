<?php
require_once('../../config.php');
require_once('lib.php');
require_once('externallib.php');

// Verificar autenticación
require_login();

// Configurar la página
$PAGE->set_url('/local/failed_questions_recovery/view_stats.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_title('Estadísticas de recuperación');
$PAGE->set_heading('Estadísticas de recuperación');

echo $OUTPUT->header();

// Obtener estadísticas del usuario
$stats = get_user_stats($USER->id);
$categories = get_failed_questions_by_category($USER->id);

// Obtener historial de cuestionarios completados
$completed_quizzes = $DB->get_records('local_fqr_recovery_quizzes', 
    array('userid' => $USER->id, 'completed' => 1), 
    'timecreated DESC', 
    '*', 0, 10);

?>

<div class="stats-container">
    <div class="page-header mb-4">
        <h2><i class="fa fa-chart-line"></i> Tus estadísticas de recuperación</h2>
        <p class="text-muted">Aquí puedes ver tu progreso detallado en el dominio de preguntas.</p>
    </div>

    <!-- Estadísticas Generales -->
    <div class="card mb-4">
        <div class="card-header">
            <h3><i class="fa fa-dashboard"></i> Resumen general</h3>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-3 text-center">
                    <div class="stat-box">
                        <div class="stat-number text-danger"><?php echo $stats->total_failed; ?></div>
                        <div class="stat-label">Preguntas por dominar</div>
                        <div class="stat-description">Preguntas que aún necesitas practicar</div>
                    </div>
                </div>
                <div class="col-md-3 text-center">
                    <div class="stat-box">
                        <div class="stat-number text-success"><?php echo $stats->total_mastered; ?></div>
                        <div class="stat-label">Preguntas dominadas</div>
                        <div class="stat-description">Preguntas que ya has dominado</div>
                    </div>
                </div>
                <div class="col-md-3 text-center">
                    <div class="stat-box">
                        <div class="stat-number text-info"><?php echo $stats->total_quizzes; ?></div>
                        <div class="stat-label">Cuestionarios completados</div>
                        <div class="stat-description">Total de cuestionarios de recuperación</div>
                    </div>
                </div>
                <div class="col-md-3 text-center">
                    <div class="stat-box">
                        <div class="stat-number text-warning"><?php echo number_format($stats->success_rate, 1); ?>%</div>
                        <div class="stat-label">Tasa de éxito</div>
                        <div class="stat-description">Porcentaje de preguntas dominadas</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Progreso por Categorías -->
    <?php if (!empty($categories)): ?>
    <div class="card mb-4">
        <div class="card-header">
            <h3><i class="fa fa-list"></i> Progreso por categorías/cuestionarios</h3>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="thead-dark">
                        <tr>
                            <th>Cuestionario/Categoría</th>
                            <th>Preguntas por dominar</th>
                            <th>Progreso</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($categories as $category): 
                            // Calcular progreso (esto es una estimación)
                            $total_in_category = $category['count'] + 5; // Estimación
                            $progress = (5 / $total_in_category) * 100;
                        ?>
                            <tr>
                                <td>
                                    <strong><?php echo htmlspecialchars($category['name']); ?></strong>
                                </td>
                                <td>
                                    <span class="badge badge-danger badge-lg"><?php echo $category['count']; ?></span>
                                </td>
                                <td>
                                    <div class="progress" style="width: 150px;">
                                        <div class="progress-bar bg-success" role="progressbar" 
                                             style="width: <?php echo $progress; ?>%" 
                                             aria-valuenow="<?php echo $progress; ?>" 
                                             aria-valuemin="0" aria-valuemax="100">
                                            <?php echo round($progress, 1); ?>%
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <a href="create_quiz.php?categoryid=<?php echo $category['id']; ?>" 
                                       class="btn btn-sm btn-primary">
                                        <i class="fa fa-plus"></i> Crear cuestionario
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

    <!-- Historial de Cuestionarios Recientes -->
    <?php if (!empty($completed_quizzes)): ?>
    <div class="card mb-4">
        <div class="card-header">
            <h3><i class="fa fa-history"></i> Cuestionarios recientes</h3>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Cuestionario</th>
                            <th>Fecha</th>
                            <th>Preguntas</th>
                            <th>Categoría</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($completed_quizzes as $quiz): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($quiz->quizname); ?></td>
                                <td><?php echo date('d/m/Y H:i', $quiz->timecreated); ?></td>
                                <td>
                                    <span class="badge badge-info"><?php echo $quiz->questioncount; ?></span>
                                </td>
                                <td><?php echo htmlspecialchars($quiz->categoryname); ?></td>
                                <td>
                                    <a href="quiz_results.php?quizid=<?php echo $quiz->id; ?>" 
                                       class="btn btn-sm btn-outline-primary">
                                        <i class="fa fa-eye"></i> Ver resultados
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

    <!-- Gráfico de Progreso (simulado con CSS) -->
    <div class="card mb-4">
        <div class="card-header">
            <h3><i class="fa fa-chart-pie"></i> Distribución de preguntas</h3>
        </div>
        <div class="card-body text-center">
            <?php 
            $total_questions = $stats->total_failed + $stats->total_mastered;
            if ($total_questions > 0):
                $mastered_percentage = ($stats->total_mastered / $total_questions) * 100;
                $failed_percentage = ($stats->total_failed / $total_questions) * 100;
            ?>
                <div class="row">
                    <div class="col-md-6">
                        <div class="progress-circle">
                            <div class="progress-text">
                                <span class="percentage"><?php echo round($mastered_percentage, 1); ?>%</span>
                                <span class="label">Dominadas</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="stats-summary">
                            <h4>Resumen de progreso</h4>
                            <p><strong>Total de preguntas trabajadas:</strong> <?php echo $total_questions; ?></p>
                            <p><strong>Preguntas dominadas:</strong> <?php echo $stats->total_mastered; ?> (<?php echo round($mastered_percentage, 1); ?>%)</p>
                            <p><strong>Preguntas por dominar:</strong> <?php echo $stats->total_failed; ?> (<?php echo round($failed_percentage, 1); ?>%)</p>
                            <p><strong>Cuestionarios completados:</strong> <?php echo $stats->total_quizzes; ?></p>
                        </div>
                    </div>
                </div>
            <?php else: ?>
                <div class="alert alert-info">
                    <h4>¡Comienza tu viaje de recuperación!</h4>
                    <p>Aún no tienes estadísticas. Completa tu primer cuestionario de recuperación para ver tu progreso aquí.</p>
                    <a href="create_quiz.php" class="btn btn-primary">
                        <i class="fa fa-plus"></i> Crear tu primer cuestionario
                    </a>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Acciones -->
    <div class="actions text-center">
        <a href="index.php" class="btn btn-primary">
            <i class="fa fa-arrow-left"></i> Volver al dashboard
        </a>
        
        <a href="create_quiz.php" class="btn btn-success">
            <i class="fa fa-plus"></i> Crear nuevo cuestionario
        </a>
        
        <a href="student_dashboard.php" class="btn btn-info">
            <i class="fa fa-dashboard"></i> Dashboard estudiante
        </a>
    </div>
</div>

<style>
.stats-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.stat-box {
    padding: 20px;
    border-radius: 8px;
    background: #f8f9fa;
    margin-bottom: 20px;
    transition: transform 0.3s ease;
}

.stat-box:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.stat-number {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 10px;
}

.stat-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: #495057;
    margin-bottom: 5px;
}

.stat-description {
    font-size: 0.9rem;
    color: #6c757d;
}

.progress-circle {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: conic-gradient(
        #28a745 0deg <?php echo $mastered_percentage * 3.6; ?>deg,
        #dc3545 <?php echo $mastered_percentage * 3.6; ?>deg 360deg
    );
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    position: relative;
}

.progress-circle::before {
    content: '';
    width: 150px;
    height: 150px;
    background: white;
    border-radius: 50%;
    position: absolute;
}

.progress-text {
    z-index: 1;
    text-align: center;
}

.progress-text .percentage {
    display: block;
    font-size: 2rem;
    font-weight: bold;
    color: #28a745;
}

.progress-text .label {
    display: block;
    font-size: 1rem;
    color: #495057;
}

.stats-summary {
    text-align: left;
    padding: 20px;
}

.badge-lg {
    font-size: 1rem;
    padding: 8px 12px;
}

.actions {
    margin: 30px 0;
}

.actions .btn {
    margin: 0 10px;
}

.card {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: none;
}

.card-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-bottom: none;
}

.table-hover tbody tr:hover {
    background-color: rgba(0,123,255,0.1);
}

@media (max-width: 768px) {
    .actions .btn {
        display: block;
        margin: 10px auto;
        width: 200px;
    }
    
    .stat-box {
        margin-bottom: 15px;
    }
    
    .progress-circle {
        width: 150px;
        height: 150px;
    }
    
    .progress-circle::before {
        width: 100px;
        height: 100px;
    }
}
</style>

<script>
// Animación para los números
document.addEventListener('DOMContentLoaded', function() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(function(element) {
        const finalValue = parseInt(element.textContent);
        let currentValue = 0;
        const increment = finalValue / 50;
        
        const timer = setInterval(function() {
            currentValue += increment;
            if (currentValue >= finalValue) {
                element.textContent = finalValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(currentValue);
            }
        }, 30);
    });
});
</script>

<?php
echo $OUTPUT->footer();
?>