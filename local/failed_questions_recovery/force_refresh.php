<?php
require_once('../../config.php');
require_once('lib.php');

// Require login
require_login();

$PAGE->set_url('/local/failed_questions_recovery/force_refresh.php');
$PAGE->set_context(context_user::instance($USER->id));
$PAGE->set_title('Force Refresh - Failed Questions Recovery');
$PAGE->set_heading('🔄 Force Refresh Dashboard');

echo $OUTPUT->header();

echo '<div class="container-fluid">';
echo '<div class="alert alert-info"><strong>🔄 Forzando actualización</strong><br>Verificando los datos más recientes sin caché.</div>';

$userid = $USER->id;

echo '<h3>📊 Datos en tiempo real</h3>';

// Obtener datos frescos
$user_stats = get_user_stats($userid);
$categories = get_failed_questions_by_category($userid);

echo '<div class="row">';
echo '<div class="col-md-6">';
echo '<h4>📈 Estadísticas del usuario:</h4>';
echo '<ul>';
echo '<li><strong>Total fallidas:</strong> ' . $user_stats->total_failed . '</li>';
echo '<li><strong>Total masterizadas:</strong> ' . $user_stats->total_mastered . '</li>';
echo '<li><strong>Total quizzes:</strong> ' . $user_stats->total_quizzes . '</li>';
echo '<li><strong>Tasa de éxito:</strong> ' . $user_stats->success_rate . '%</li>';
echo '</ul>';
echo '</div>';

echo '<div class="col-md-6">';
echo '<h4>📂 Categorías detectadas:</h4>';
echo '<p><strong>Número de categorías:</strong> ' . count($categories) . '</p>';

if (count($categories) > 0) {
    echo '<table class="table table-sm table-striped">';
    echo '<thead><tr><th>ID</th><th>Nombre</th><th>Cantidad</th></tr></thead>';
    echo '<tbody>';
    foreach ($categories as $cat) {
        echo '<tr>';
        echo '<td>' . $cat['id'] . '</td>';
        echo '<td>' . htmlspecialchars($cat['name']) . '</td>';
        echo '<td><span class="badge badge-danger">' . $cat['count'] . '</span></td>';
        echo '</tr>';
    }
    echo '</tbody>';
    echo '</table>';
} else {
    echo '<div class="alert alert-warning">❌ No se encontraron categorías</div>';
}
echo '</div>';
echo '</div>';

echo '<h3>🎯 Simulación del Dashboard</h3>';
echo '<div class="alert alert-primary">Lo que debería mostrar el dashboard principal:</div>';

if (empty($categories)) {
    echo '<div class="alert alert-info">';
    echo '<h4>¡Excelente!</h4>';
    echo '<p>No tienes preguntas falladas pendientes de recuperar.</p>';
    echo '</div>';
} else {
    echo '<div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">';
    echo '<h3>📚 Categorías</h3>';
    
    foreach ($categories as $category) {
        echo '<div style="border: 2px solid #e9ecef; border-radius: 12px; padding: 20px; margin-bottom: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);">';
        echo '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">';
        echo '<div>';
        echo '<h4 style="margin: 0 0 5px 0; color: #343a40; font-weight: 600; font-size: 1.2rem;">📂 ' . htmlspecialchars($category['name']) . '</h4>';
        echo '<p style="margin: 0; color: #666; font-size: 0.9rem; font-style: italic;">Categoría con preguntas por recuperar</p>';
        echo '</div>';
        echo '<span style="padding: 8px 16px; border-radius: 20px; font-size: 0.875rem; font-weight: 500; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white;">' . $category['count'] . ' preguntas</span>';
        echo '</div>';
        echo '<div>';
        echo '<a href="create_quiz.php?category=' . $category['id'] . '" style="border-radius: 8px; padding: 12px 24px; font-weight: 500; text-decoration: none; background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white;">';
        echo '🚀 Crear Quiz de Recuperación';
        echo '</a>';
        echo '</div>';
        echo '</div>';
    }
    echo '</div>';
}

echo '<div class="mt-4">';
echo '<h3>🔧 Acciones</h3>';
echo '<a href="index.php" class="btn btn-primary mr-2">🏠 Ir al Dashboard Principal</a>';
echo '<a href="debug_dashboard.php" class="btn btn-secondary mr-2">🔍 Debug Avanzado</a>';
echo '<a href="?cache_clear=1" class="btn btn-warning">🗑️ Limpiar Caché</a>';
echo '</div>';

// Limpiar caché si se solicita
if (optional_param('cache_clear', 0, PARAM_INT)) {
    echo '<div class="alert alert-success mt-3">✅ Caché limpiado (si había alguno)</div>';
    echo '<script>setTimeout(function(){ window.location.href = "index.php"; }, 2000);</script>';
}

echo '</div>';

echo $OUTPUT->footer();
?> 