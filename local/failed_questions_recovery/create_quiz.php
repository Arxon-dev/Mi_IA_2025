<?php
require_once('../../config.php');
require_once('lib.php');
require_once('externallib.php');

// Verificar que el usuario esté autenticado
require_login();

// Configurar la página
$context = context_user::instance($USER->id);
$PAGE->set_context($context);
$PAGE->set_url('/local/failed_questions_recovery/create_quiz.php');
$PAGE->set_title(get_string('create_recovery_quiz', 'local_failed_questions_recovery'));
$PAGE->set_heading(get_string('create_recovery_quiz', 'local_failed_questions_recovery'));

// Verificar permisos básicos (solo necesita estar autenticado)
$systemcontext = context_system::instance();

// Obtener parámetros
$categoryid = optional_param('categoryid', 0, PARAM_INT);
$category = optional_param('category', 0, PARAM_INT); // Para compatibilidad con enlaces del dashboard
$courseid = optional_param('courseid', 0, PARAM_INT);
$all_categories = optional_param('all_categories', 0, PARAM_INT); // Nueva: todas las categorías
$selected_categories = optional_param_array('selected_categories', array(), PARAM_INT); // Nueva: múltiples categorías

// Determinar el tipo de quiz
$quiz_type = 'single'; // Por defecto, categoría individual
$target_categories = array();

if ($all_categories == 1) {
    $quiz_type = 'all';
    $target_categories = array(); // Se cargará después con todas las categorías
} elseif (!empty($selected_categories)) {
    $quiz_type = 'multiple';
    $target_categories = $selected_categories;
} elseif ($category > 0 && $categoryid == 0) {
    $categoryid = $category;
    $quiz_type = 'single';
    $target_categories = array($categoryid);
} elseif ($categoryid > 0) {
    $quiz_type = 'single';
    $target_categories = array($categoryid);
}

// Procesar formulario
if (data_submitted() && confirm_sesskey()) {
    $quizname = required_param('quizname', PARAM_TEXT);
    $questioncount = required_param('questioncount', PARAM_INT);
    
    // Obtener el tipo de quiz desde el formulario
    $form_quiz_type = optional_param('quiz_type', $quiz_type, PARAM_TEXT);
    $form_all_categories = optional_param('all_categories', 0, PARAM_INT);
    $form_selected_categories = optional_param_array('selected_categories', array(), PARAM_INT);
    $form_categoryid = optional_param('categoryid', $categoryid, PARAM_INT);
    
    try {
        $quiz_id = null;
        
        if ($form_all_categories == 1 || $form_quiz_type == 'all') {
            // Quiz de todas las categorías
            $quiz_id = create_recovery_quiz_all_categories($USER->id, $courseid ?: 1, $questioncount, $quizname);
        } elseif ($form_quiz_type == 'multiple' && !empty($form_selected_categories)) {
            // Quiz de múltiples categorías
            $quiz_id = create_recovery_quiz_multiple_categories($USER->id, $courseid ?: 1, $form_selected_categories, $questioncount, $quizname);
        } elseif ($form_categoryid > 0) {
            // Quiz de categoría individual (método existente)
            $result = local_failed_questions_recovery_external::create_recovery_quiz(
                $USER->id, 
                $courseid ?: 1,
                $form_categoryid,
                $questioncount,
                $quizname
            );
            $quiz_id = $result['quizid'];
        } else {
            throw new Exception('No se especificó ninguna categoría válida para el quiz.');
        }
        
        // Redirigir a la página del cuestionario creado
        redirect(new moodle_url('/local/failed_questions_recovery/take_quiz.php', array('quizid' => $quiz_id)));
        
    } catch (Exception $e) {
        $error = get_string('error_creating_quiz', 'local_failed_questions_recovery') . ': ' . $e->getMessage();
    }
}

// Agregar CSS personalizado
$PAGE->requires->css('/local/failed_questions_recovery/styles.css');

// Configurar navegación
$PAGE->navbar->add(get_string('pluginname', 'local_failed_questions_recovery'), new moodle_url('/local/failed_questions_recovery/index.php'));
$PAGE->navbar->add(get_string('create_recovery_quiz', 'local_failed_questions_recovery'));

// Inicializar output
echo $OUTPUT->header();

// CSS personalizado para esta página
echo '<style>
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --warning-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --accent-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    --dark-gradient: linear-gradient(135deg, #2c3e50 0%, #4a6741 100%);
    
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #43e97b;
    --success-color: #4facfe;
    --warning-color: #f093fb;
    --danger-color: #ff6b6b;
    
    --shadow-soft: 0 10px 30px rgba(102, 126, 234, 0.1);
    --shadow-medium: 0 20px 40px rgba(102, 126, 234, 0.15);
    --shadow-strong: 0 30px 60px rgba(102, 126, 234, 0.2);
    
    --border-radius: 20px;
    --border-radius-small: 12px;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-container {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    padding: 2rem 0;
}

.modern-header {
    background: var(--primary-gradient);
    color: white;
    padding: 3rem 0;
    margin-bottom: 3rem;
    border-radius: 0 0 50px 50px;
    box-shadow: var(--shadow-medium);
    position: relative;
    overflow: hidden;
}

.modern-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.1;
    animation: float 20s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(2deg); }
}

.header-content {
    text-align: center;
    position: relative;
    z-index: 2;
}

.header-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(45deg, #ffffff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    font-weight: 300;
}

.main-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 2rem;
}

.form-card {
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
    padding: 3rem;
    margin-bottom: 3rem;
    border: 1px solid rgba(102, 126, 234, 0.1);
    position: relative;
    overflow: hidden;
    transition: var(--transition);
}

.form-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--primary-gradient);
}

.form-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-medium);
}

.form-group {
    margin-bottom: 2rem;
}

.form-label {
    display: block;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.8rem;
    font-size: 1.1rem;
    position: relative;
}

.form-label::before {
    content: "✨";
    margin-right: 0.5rem;
    opacity: 0.7;
}

.form-control {
    width: 100%;
    padding: 1rem 1.5rem;
    border: 2px solid #e1e8ed;
    border-radius: var(--border-radius-small);
    font-size: 1rem;
    transition: var(--transition);
    background: white;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
}

.form-select {
    background-image: url("data:image/svg+xml,%3csvg xmlns=\\"http://www.w3.org/2000/svg\\" fill=\\"none\\" viewBox=\\"0 0 20 20\\"%3e%3cpath stroke=\\"%236b7280\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\" stroke-width=\\"1.5\\" d=\\"M6 8l4 4 4-4\\"%/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 3rem;
    color: #2c3e50 !important;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

.form-select option {
    color: #2c3e50 !important;
    background: white !important;
    padding: 0.5rem;
}

.form-select:focus {
    color: #2c3e50 !important;
}

/* Asegurar que el texto seleccionado sea visible */
select.form-control {
    color: #2c3e50 !important;
    background-color: white !important;
}

select.form-control option {
    color: #2c3e50 !important;
    background-color: white !important;
}

.btn-group {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.btn-modern {
    padding: 1rem 2rem;
    border: none;
    border-radius: var(--border-radius-small);
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
}

.btn-modern::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
}

.btn-modern:hover::before {
    left: 100%;
}

.btn-primary {
    background: var(--primary-gradient);
    color: white;
    box-shadow: var(--shadow-soft);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
    color: white;
    text-decoration: none;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #5a6268;
    transform: translateY(-2px);
    color: white;
    text-decoration: none;
}

.categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.category-card {
    background: white;
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: var(--shadow-soft);
    border: 1px solid rgba(102, 126, 234, 0.1);
    transition: var(--transition);
    position: relative;
    overflow: hidden;
}

.category-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent-gradient);
}

.category-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-medium);
}

.category-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.category-title::before {
    content: "📚";
    font-size: 1.3rem;
}

.category-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stat-item {
    text-align: center;
}

.stat-number {
    font-size: 1.5rem;
    font-weight: 700;
    display: block;
}

.stat-failed {
    color: var(--danger-color);
}

.stat-pending {
    color: var(--warning-color);
}

.stat-label {
    font-size: 0.85rem;
    color: #6c757d;
    margin-top: 0.25rem;
}

.alert-modern {
    padding: 1.5rem;
    border-radius: var(--border-radius-small);
    margin-bottom: 2rem;
    border: none;
    position: relative;
    overflow: hidden;
}

.alert-info {
    background: linear-gradient(135deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.1));
    color: #0c5460;
    border-left: 4px solid var(--success-color);
}

.alert-danger {
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(238, 82, 83, 0.1));
    color: #721c24;
    border-left: 4px solid var(--danger-color);
}

.section-header {
    text-align: center;
    margin: 3rem 0 2rem 0;
}

.section-title {
    font-size: 2rem;
    font-weight: 700;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
}

.section-subtitle {
    color: #6c757d;
    font-size: 1.1rem;
}

@media (max-width: 768px) {
    .header-title {
        font-size: 2rem;
    }
    
    .form-card {
        padding: 2rem;
        margin: 0 1rem 2rem 1rem;
    }
    
    .btn-group {
        flex-direction: column;
    }
    
    .main-content {
        padding: 0 1rem;
    }
}

.animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

<script>
document.addEventListener("DOMContentLoaded", function() {
    // Asegurar que el select mantenga su valor visible
    const categorySelect = document.getElementById("categoryid");
    if (categorySelect) {
        // Forzar la actualización visual del select
        categorySelect.style.color = "#2c3e50";
        categorySelect.style.backgroundColor = "white";
        
        // Evento para cuando cambie la selección
        categorySelect.addEventListener("change", function() {
            this.style.color = "#2c3e50";
            this.style.backgroundColor = "white";
            
            // Forzar un refresh visual
            setTimeout(() => {
                this.style.color = "#2c3e50";
            }, 10);
        });
        
        // Si ya hay una opción seleccionada, asegurar que sea visible
        if (categorySelect.value) {
            categorySelect.style.color = "#2c3e50";
            categorySelect.style.backgroundColor = "white";
        }
    }
});
</script>';

// Mostrar error si existe
if (isset($error)) {
    echo '<div class="alert-modern alert-danger animate-fadeIn">
            <strong>❌ Error:</strong> ' . $error . '
          </div>';
}

// Obtener categorías con preguntas falladas - usando consulta simplificada
$sql = "SELECT fq.quizid as categoryid, fq.categoryname as display_name,
               COUNT(*) as failedcount, 
               SUM(CASE WHEN fq.mastered = 0 THEN 1 ELSE 0 END) as notmasteredcount
        FROM {local_failed_questions_recovery} fq
        WHERE fq.userid = :userid
        GROUP BY fq.quizid, fq.categoryname 
        HAVING notmasteredcount > 0
        ORDER BY fq.categoryname";

$categories = $DB->get_records_sql($sql, array('userid' => $USER->id));

echo '<div class="modern-container">';

// Header moderno
echo '<div class="modern-header">
        <div class="header-content">
            <h1 class="header-title">🎯 ' . get_string('create_recovery_quiz', 'local_failed_questions_recovery') . '</h1>
            <p class="header-subtitle">Genera un cuestionario personalizado para dominar las preguntas que necesitas mejorar</p>
        </div>
      </div>';

echo '<div class="main-content">';

// Obtener información de la categoría seleccionada
$selected_category = null;
if ($categoryid > 0) {
    foreach ($categories as $cat) {
        if ($cat->categoryid == $categoryid) {
            $selected_category = $cat;
            break;
        }
    }
}

if (empty($categories)) {
    echo '<div class="alert-modern alert-info animate-fadeIn">
            <h4>ℹ️ ' . get_string('no_failed_questions', 'local_failed_questions_recovery') . '</h4>
            <p>¡Excelente trabajo! No tienes preguntas pendientes de dominar.</p>
          </div>';
    echo '<div style="text-align: center; margin-top: 2rem;">
            <a href="/local/failed_questions_recovery/index.php" class="btn-modern btn-primary">
                🏠 Volver al Panel
            </a>
          </div>';
} else {
    // Mostrar información específica según el tipo de quiz
    if ($quiz_type == 'all') {
        $total_questions = get_failed_questions_count($USER->id, 'all');
        echo '<div class="alert-modern alert-info animate-fadeIn">
                <h4>🌟 Quiz de TODAS las categorías</h4>
                <p>Se incluirán <strong>' . $total_questions . ' preguntas</strong> de todas las categorías donde tienes errores pendientes.</p>
                <p><small>💡 Las preguntas se mezclarán aleatoriamente para una práctica más variada.</small></p>
              </div>';
    } elseif ($quiz_type == 'multiple') {
        $total_questions = get_failed_questions_count($USER->id, 'multiple', $target_categories);
        $category_names = get_categories_display_names($target_categories);
        echo '<div class="alert-modern alert-info animate-fadeIn">
                <h4>🎯 Quiz Personalizado</h4>
                <p>Se incluirán <strong>' . $total_questions . ' preguntas</strong> de las siguientes categorías:</p>
                <ul style="margin: 15px 0; padding-left: 25px;">';
        foreach ($category_names as $name) {
            echo '<li><strong>' . htmlspecialchars($name) . '</strong></li>';
        }
        echo '</ul>
                <p><small>💡 Las preguntas de diferentes categorías se mezclarán aleatoriamente.</small></p>
              </div>';
    } elseif ($quiz_type == 'single' && !empty($target_categories)) {
        $total_questions = get_failed_questions_count($USER->id, 'single', $target_categories);
        $category_names = get_categories_display_names($target_categories);
        $category_name = !empty($category_names) ? $category_names[0] : 'Categoría seleccionada';
        echo '<div class="alert-modern alert-info animate-fadeIn">
                <h4>📚 Quiz de: ' . htmlspecialchars($category_name) . '</h4>
                <p>Se incluirán <strong>' . $total_questions . ' preguntas</strong> de esta categoría específica.</p>
                <p><small>💡 Enfócate en dominar este tema específico.</small></p>
              </div>';
    } else {
        // Caso por defecto - permitir seleccionar categoría
        echo '<div class="alert-modern alert-info animate-fadeIn">
                <h4>📚 Selecciona una categoría</h4>
                <p>Elige la categoría para crear tu quiz personalizado.</p>
              </div>';
    }
    
    // Formulario principal
    echo '<div class="form-card animate-fadeIn">
            <form method="POST" class="quiz-creation-form">
                <input type="hidden" name="sesskey" value="' . sesskey() . '">
                
                <!-- Pasar información del tipo de quiz -->
                <input type="hidden" name="quiz_type" value="' . $quiz_type . '">';
                
    if ($quiz_type == 'all') {
        echo '<input type="hidden" name="all_categories" value="1">';
    } elseif ($quiz_type == 'multiple') {
        foreach ($target_categories as $cat_id) {
            echo '<input type="hidden" name="selected_categories[]" value="' . $cat_id . '">';
        }
    } elseif ($quiz_type == 'single' && !empty($target_categories)) {
        echo '<input type="hidden" name="categoryid" value="' . $target_categories[0] . '">';
    } else {
        // Mostrar selector de categoría solo si no se ha seleccionado ninguna
        echo '<div class="form-group">
                <label for="categoryid" class="form-label">Categoría</label>
                <select name="categoryid" id="categoryid" class="form-control form-select" required>
                    <option value="">Selecciona una categoría...</option>';
        foreach ($categories as $cat) {
            $selected = ($categoryid == $cat->categoryid) ? 'selected' : '';
            echo '<option value="' . $cat->categoryid . '" ' . $selected . '>' . 
                 htmlspecialchars($cat->display_name) . ' (' . $cat->notmasteredcount . ' preguntas)</option>';
        }
        echo '</select>
              </div>';
    }
    
    echo '        <div class="form-group">
                    <label for="quizname" class="form-label">Nombre del Cuestionario</label>
                    <input type="text" 
                           name="quizname" 
                           id="quizname" 
                           class="form-control" 
                           placeholder="Ej: Quiz de Recuperación - Tema 1" 
                           required>
                </div>
                
                <div class="form-group">
                    <label for="questioncount" class="form-label">Número de Preguntas</label>
                    <input type="number" 
                           name="questioncount" 
                           id="questioncount" 
                           class="form-control" 
                           value="10" 
                           min="1" 
                           max="100" 
                           required>
                    <small class="form-text text-muted">💡 Máximo 100 preguntas por cuestionario</small>
                </div>
                
                <div class="btn-group">
                    <button type="submit" class="btn-modern btn-primary">
                        🚀 Generar Cuestionario
                    </button>
                    <a href="/local/failed_questions_recovery/student_dashboard.php" class="btn-modern btn-secondary">
                        ↩️ Volver al Dashboard
                    </a>
                </div>
            </form>
          </div>';
    
    // Preview de categorías solo si hay varias o no se ha seleccionado específicamente
    if ($quiz_type == 'all' || ($quiz_type != 'single' && count($categories) > 1)) {
        echo '<div class="section-header">
                <h2 class="section-title">📊 Resumen de Categorías</h2>
                <p class="section-subtitle">Preguntas disponibles para practicar</p>
              </div>';
        
        echo '<div class="categories-grid animate-fadeIn">';
        
        foreach ($categories as $cat) {
            $highlight_class = '';
            if ($quiz_type == 'multiple' && in_array($cat->categoryid, $target_categories)) {
                $highlight_class = 'style="border: 3px solid #667eea; background: linear-gradient(135deg, #e8f4fd 0%, #bee5eb 100%);"';
            }
            
            echo '<div class="category-card" ' . $highlight_class . '>
                    <h3 class="category-title">' . htmlspecialchars($cat->display_name) . '</h3>
                    <div class="category-stats">
                        <div class="stat-item">
                            <span class="stat-number stat-failed">' . $cat->failedcount . '</span>
                            <div class="stat-label">Total Falladas</div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number stat-pending">' . $cat->notmasteredcount . '</span>
                            <div class="stat-label">Pendientes</div>
                        </div>
                    </div>
                  </div>';
        }
        
        echo '</div>';
    }
}

echo '</div>'; // main-content
echo '</div>'; // modern-container

echo $OUTPUT->footer();
?> 