<?php
require_once('../../config.php');
require_once($CFG->dirroot.'/local/failed_questions_recovery/lib.php');

require_login();

// Check capability
$context = context_system::instance();
require_capability('local/failed_questions_recovery:use', $context);

global $DB, $USER;

// Check if payments are enabled
$enable_payments = get_config('local_failed_questions_recovery', 'enable_payments');

// Get payment status if payments are enabled
$has_paid = true; // Default to true if payments are disabled
if ($enable_payments) {
    require_once($CFG->dirroot.'/local/failed_questions_recovery/classes/payment_manager.php');
    $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
}

// CSS mejorado y moderno para estudiantes
echo '<style>
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --warning-gradient: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    --info-gradient: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    --dark-gradient: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    --shadow-soft: 0 10px 30px rgba(0,0,0,0.1);
    --shadow-hover: 0 15px 40px rgba(0,0,0,0.2);
    --border-radius: 20px;
    --transition-smooth: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

* {
    box-sizing: border-box;
}

body {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0;
    padding: 0;
}

.student-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px 20px;
}

/* Header espectacular */
.main-header {
    background: var(--primary-gradient);
    color: white;
    padding: 40px 30px;
    border-radius: var(--border-radius);
    margin-bottom: 40px;
    box-shadow: var(--shadow-soft);
    text-align: center;
    position: relative;
    overflow: hidden;
}

.main-header::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255,255,255,0.05) 2px,
        rgba(255,255,255,0.05) 4px
    );
    animation: headerPattern 20s linear infinite;
}

@keyframes headerPattern {
    0% { transform: translateX(-50px) translateY(-50px); }
    100% { transform: translateX(0px) translateY(0px); }
}

.main-header h1 {
    margin: 0 0 15px 0;
    font-size: 2.8rem;
    font-weight: 700;
    position: relative;
    z-index: 2;
    text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.main-header p {
    margin: 0;
    font-size: 1.2rem;
    opacity: 0.95;
    position: relative;
    z-index: 2;
}

/* Cards mejoradas */
.step-card {
    background: white;
    border-radius: var(--border-radius);
    padding: 35px 30px;
    margin: 30px 0;
    box-shadow: var(--shadow-soft);
    transition: var(--transition-smooth);
    position: relative;
    overflow: hidden;
}

.step-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: var(--primary-gradient);
    transition: var(--transition-smooth);
}

.step-card:hover {
    transform: translateY(-10px);
    box-shadow: var(--shadow-hover);
}

.step-card:hover::before {
    height: 8px;
}

.step-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 25px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2c3e50;
}

.step-icon {
    font-size: 2.5rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Lista de quiz mejorada */
.quiz-list {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 15px;
    padding: 25px;
    margin: 20px 0;
    border: 2px solid #e9ecef;
    transition: var(--transition-smooth);
}

.quiz-list:hover {
    border-color: #667eea;
    transform: scale(1.02);
}

.quiz-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: white;
    border-radius: 12px;
    margin-bottom: 15px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    transition: var(--transition-smooth);
}

.quiz-item:hover {
    transform: translateX(10px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.quiz-item:last-child {
    margin-bottom: 0;
}

.quiz-info h4 {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-weight: 600;
    font-size: 1.2rem;
}

.quiz-info small {
    color: #6c757d;
    font-size: 0.95rem;
}

/* Botones espectaculares */
.btn-student {
    background: var(--success-gradient);
    color: white;
    padding: 12px 25px;
    border: none;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-smooth);
    position: relative;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
}

.btn-student::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: var(--transition-smooth);
}

.btn-student:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(79, 172, 254, 0.6);
    color: white;
    text-decoration: none;
}

.btn-student:hover::before {
    left: 100%;
}

.btn-secondary {
    background: var(--dark-gradient);
    color: white;
    padding: 15px 20px;
    border: none;
    border-radius: 15px;
    text-decoration: none;
    font-weight: 500;
    transition: var(--transition-smooth);
    text-align: center;
    display: block;
    box-shadow: 0 5px 15px rgba(52, 73, 94, 0.3);
}

.btn-secondary:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(52, 73, 94, 0.5);
    color: white;
    text-decoration: none;
}

/* Grid de categorías mejorado */
.categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
    margin: 25px 0;
}

.category-card {
    background: white;
    border-radius: var(--border-radius);
    padding: 30px 25px;
    text-align: center;
    box-shadow: var(--shadow-soft);
    transition: var(--transition-smooth);
    position: relative;
    overflow: hidden;
    border: 3px solid transparent;
    pointer-events: auto !important;
}

.category-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: var(--info-gradient);
    opacity: 0.05;
    z-index: 1;
}

.category-card:hover {
    transform: translateY(-10px) scale(1.03);
    border-color: #667eea;
    box-shadow: var(--shadow-hover);
}

.category-name {
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 15px;
    font-size: 1.2rem;
    position: relative;
    z-index: 2;
}

.category-count {
    font-size: 2.5rem;
    font-weight: 800;
    background: var(--warning-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 20px;
    position: relative;
    z-index: 2;
}

/* Mensajes de estado mejorados */
.success-msg {
    background: var(--success-gradient);
    color: white;
    padding: 25px;
    border-radius: var(--border-radius);
    margin: 20px 0;
    box-shadow: var(--shadow-soft);
    position: relative;
    overflow: hidden;
}

.success-msg::before {
    content: "✨";
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 3rem;
    opacity: 0.3;
    animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
    0%, 100% { transform: translateY(-50%) scale(1); }
    50% { transform: translateY(-50%) scale(1.2); }
}

.warning-msg {
    background: var(--warning-gradient);
    color: white;
    padding: 25px;
    border-radius: var(--border-radius);
    margin: 20px 0;
    box-shadow: var(--shadow-soft);
}

.info-msg {
    background: var(--info-gradient);
    color: #2c3e50;
    padding: 25px;
    border-radius: var(--border-radius);
    margin: 20px 0;
    box-shadow: var(--shadow-soft);
}

/* Estadísticas espectaculares */
.stats-showcase {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 25px;
    margin: 30px 0;
}

.stat-card {
    background: white;
    border-radius: var(--border-radius);
    padding: 30px 20px;
    text-align: center;
    box-shadow: var(--shadow-soft);
    transition: var(--transition-smooth);
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    transition: var(--transition-smooth);
}

.stat-card.total::before {
    background: var(--primary-gradient);
}

.stat-card.mastered::before {
    background: var(--success-gradient);
}

.stat-card.pending::before {
    background: var(--warning-gradient);
}

.stat-card:hover {
    transform: translateY(-8px) scale(1.05);
    box-shadow: var(--shadow-hover);
}

.stat-card:hover::before {
    height: 10px;
}

.stat-number {
    font-size: 3rem;
    font-weight: 800;
    margin: 15px 0;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-card.mastered .stat-number {
    background: var(--success-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-card.pending .stat-number {
    background: var(--warning-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-label {
    color: #6c757d;
    font-weight: 600;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Barra de progreso épica */
.progress-section {
    background: white;
    border-radius: var(--border-radius);
    padding: 30px;
    margin: 30px 0;
    box-shadow: var(--shadow-soft);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.progress-label {
    font-weight: 700;
    color: #2c3e50;
    font-size: 1.3rem;
}

.progress-percentage {
    font-weight: 800;
    background: var(--success-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.5rem;
}

.progress-bar-container {
    background: #e9ecef;
    border-radius: 15px;
    height: 20px;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);
}

.progress-bar {
    height: 100%;
    background: var(--success-gradient);
    border-radius: 15px;
    transition: width 2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
    overflow: hidden;
}

.progress-bar::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
    animation: progressShimmer 3s infinite;
}

@keyframes progressShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
}

/* Enlaces útiles mejorados */
.useful-links {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 30px 0;
}

.link-card {
    transition: var(--transition-smooth);
    text-decoration: none;
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-soft);
}

.link-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-hover);
    text-decoration: none;
}

/* BOTONES DE PRÁCTICA - ASEGURAR CLICABILIDAD */
.btn-practice {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
    color: white !important;
    text-decoration: none !important;
    border: none !important;
    padding: 15px 25px !important;
    border-radius: 25px !important;
    font-weight: 700 !important;
    text-align: center !important;
    display: block !important;
    cursor: pointer !important;
    pointer-events: auto !important;
    position: relative !important;
    z-index: 999 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 8px 25px rgba(79, 172, 254, 0.3) !important;
    font-size: 1.1rem !important;
    letter-spacing: 0.5px !important;
    text-transform: uppercase !important;
}

.btn-practice:hover {
    transform: translateY(-3px) scale(1.05) !important;
    box-shadow: 0 15px 35px rgba(79, 172, 254, 0.4) !important;
    background: linear-gradient(135deg, #43a7f5 0%, #00d9f5 100%) !important;
    color: white !important;
    text-decoration: none !important;
}

.btn-practice:active {
    transform: translateY(-1px) scale(1.02) !important;
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.5) !important;
}

.btn-practice:focus {
    outline: 3px solid rgba(79, 172, 254, 0.5) !important;
    outline-offset: 2px !important;
}

/* Instrucciones mejoradas */
.instructions-section {
    background: white;
    border-radius: var(--border-radius);
    padding: 40px 35px;
    margin: 40px 0;
    box-shadow: var(--shadow-soft);
    border-left: 8px solid #667eea;
}

.instructions-section h3 {
    color: #2c3e50;
    margin-bottom: 25px;
    font-size: 1.8rem;
    font-weight: 700;
}

.instructions-section ol {
    counter-reset: step-counter;
    list-style: none;
    padding: 0;
}

.instructions-section ol li {
    counter-increment: step-counter;
    margin: 20px 0;
    padding: 20px 25px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 12px;
    position: relative;
    padding-left: 70px;
    transition: var(--transition-smooth);
}

.instructions-section ol li:hover {
    transform: translateX(10px);
    background: linear-gradient(135deg, #e8f4fd 0%, #bee5eb 100%);
}

.instructions-section ol li::before {
    content: counter(step-counter);
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--primary-gradient);
    color: white;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.1rem;
}

/* Footer mejorado */
.footer-section {
    text-align: center;
    margin-top: 50px;
    padding: 30px;
    background: var(--dark-gradient);
    color: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-soft);
}

/* Responsive mejorado */
@media (max-width: 768px) {
    .student-container {
        padding: 20px 15px;
    }
    
    .main-header {
        padding: 30px 20px;
    }
    
    .main-header h1 {
        font-size: 2.2rem;
    }
    
    .step-card {
        padding: 25px 20px;
    }
    
    .categories-grid {
        grid-template-columns: 1fr;
    }
    
    .stats-showcase {
        grid-template-columns: 1fr;
    }
    
    .useful-links {
        grid-template-columns: 1fr;
    }
    
    .quiz-item {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
}

/* Animaciones de entrada */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.step-card {
    animation: fadeInUp 0.6s ease-out forwards;
}

.step-card:nth-child(2) { animation-delay: 0.1s; }
.step-card:nth-child(3) { animation-delay: 0.2s; }
.step-card:nth-child(4) { animation-delay: 0.3s; }
.step-card:nth-child(5) { animation-delay: 0.4s; }
</style>';

echo '<div class="student-container">';

// Header principal mejorado
echo '<div class="main-header">';
echo '<h1>📚 Mi Sistema de Recuperación de Preguntas</h1>';
echo '<p>Convierte cada error en una oportunidad de aprendizaje personalizada</p>';
echo '</div>';

// Show payment required message if payments are enabled and user hasn't paid
if ($enable_payments && !$has_paid) {
    // Get payment amount from config or use default
    $payment_amount = get_config('local_failed_questions_recovery', 'payment_amount');
    if (empty($payment_amount)) {
        $payment_amount = '6.00';
    }
    
    echo '<div class="step-card" style="border: 2px solid #fa709a; animation-delay: 0s;">';
    echo '<div class="step-header">';
    echo '<span class="step-icon" style="background: var(--warning-gradient); -webkit-background-clip: text;">💰</span>';
    echo '<span>' . get_string('payment_required', 'local_failed_questions_recovery') . '</span>';
    echo '</div>';
    
    echo '<div class="payment-info">';
    echo '<p>' . get_string('payment_required_desc', 'local_failed_questions_recovery') . '</p>';
    
    echo '<div class="payment-details" style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 20px 0;">';
    echo '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
    echo '<span><strong>Acceso completo:</strong></span>';
    echo '<span>' . $payment_amount . ' €</span>';
    echo '</div>';
    echo '<div style="display: flex; justify-content: space-between; align-items: center;">';
    echo '<span><strong>Tipo de pago:</strong></span>';
    echo '<span>Pago único (sin suscripción)</span>';
    echo '</div>';
    echo '</div>';
    
    echo '<div style="text-align: center; margin-top: 20px;">';
    echo '<a href="payment.php" class="btn-student" style="background: var(--warning-gradient);">' . get_string('go_to_payment', 'local_failed_questions_recovery') . ' →</a>';
    echo '</div>';
    
    echo '</div>';
    echo '</div>';
    
    // Exit early if user hasn't paid
    echo '</div>'; // Close student-container
    exit;
}

// Verificar si hay quiz recientes sin procesar
$recent_unprocessed = $DB->get_records_sql("
    SELECT qa.*, q.name as quiz_name
    FROM {quiz_attempts} qa
    JOIN {quiz} q ON qa.quiz = q.id
    WHERE qa.userid = ? 
    AND qa.timefinish > ?
    AND qa.state = 'finished'
    AND NOT EXISTS (
        SELECT 1 FROM {local_failed_questions_recovery} fq 
        WHERE fq.userid = qa.userid 
        AND fq.timecreated >= qa.timefinish
        AND fq.quizid = qa.quiz
    )
    ORDER BY qa.timefinish DESC
    LIMIT 5
", [$USER->id, time() - 86400]); // Últimas 24 horas

// PASO 1: Procesar quiz recientes
echo '<div class="step-card">';
echo '<div class="step-header">';
echo '<span class="step-icon">🚀</span>';
echo '<span>PASO 1: Procesar cuestionarios recientes</span>';
echo '</div>';

if (!empty($recent_unprocessed)) {
    echo '<p><strong>📝 Tienes cuestionarios recientes que necesitan procesarse:</strong></p>';
    echo '<div class="quiz-list">';
    
    foreach ($recent_unprocessed as $attempt) {
        $finish_time = date('d/m/Y H:i', $attempt->timefinish);
        echo '<div class="quiz-item">';
        echo '<div class="quiz-info">';
        echo '<h4>' . htmlspecialchars($attempt->quiz_name) . '</h4>';
        echo '<small>⏰ Completado: ' . $finish_time . '</small>';
        echo '</div>';
        echo '<a href="debug_observer.php?force_process=' . $attempt->id . '" class="btn-student">✅ Procesar</a>';
        echo '</div>';
    }
    
    echo '</div>';
    echo '<div class="info-msg">';
    echo '<strong>💡 ¿Qué hace "Procesar"?</strong><br>';
    echo 'Analiza tu cuestionario y guarda las preguntas que fallaste para que puedas practicarlas después.';
    echo '</div>';
} else {
    echo '<div class="success-msg">';
    echo '✅ <strong>¡Perfecto!</strong> Todos tus cuestionarios recientes ya están procesados.';
    echo '<br><br><a href="student_diagnostic.php" target="_blank" style="color: #667eea; text-decoration: underline;">🔍 Verificar que todo funcione bien</a>';
    echo '</div>';
}

echo '</div>';

// PASO 2: Ver mis preguntas falladas
echo '<div class="step-card">';
echo '<div class="step-header">';
echo '<span class="step-icon">📊</span>';
echo '<span>PASO 2: Mis Preguntas Falladas por Tema</span>';
echo '</div>';

$categories = get_failed_questions_by_category($USER->id);

if (!empty($categories)) {
    // NUEVA OPCIÓN: Quiz de TODAS las categorías
    $total_failed_questions = array_sum(array_column($categories, 'count'));
    echo '<div class="category-card" style="border: 3px solid #667eea; background: linear-gradient(135deg, #e8f4fd 0%, #bee5eb 100%); margin-bottom: 25px;">';
    echo '<div class="category-name" style="color: #667eea; font-size: 1.4rem;">🌟 TODAS LAS CATEGORÍAS</div>';
    echo '<div class="category-count" style="color: #667eea;">' . $total_failed_questions . '</div>';
    echo '<div class="stat-label">preguntas pendientes en total</div>';
    echo '<a href="create_quiz.php?all_categories=1" class="btn-practice" style="margin-top: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;">🎯 Practicar TODO</a>';
    echo '</div>';
    
    echo '<p><strong>📚 O elige temas específicos:</strong></p>';
    
    // NUEVA OPCIÓN: Selector múltiple
    echo '<div class="multi-selector-container" style="background: white; border-radius: 20px; padding: 25px; margin: 20px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">';
    echo '<h4 style="color: #2c3e50; margin-bottom: 20px;">🎯 Crear cuestionario personalizado</h4>';
    echo '<form id="multiCategoryForm" action="create_quiz.php" method="get">';
    
    echo '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin-bottom: 20px;">';
    foreach ($categories as $category) {
        echo '<label style="display: flex; align-items: center; gap: 10px; padding: 15px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; cursor: pointer; transition: all 0.3s ease;">';
        echo '<input type="checkbox" name="selected_categories[]" value="' . $category['id'] . '" style="width: 20px; height: 20px; accent-color: #667eea;">';
        echo '<div style="flex: 1;">';
        echo '<div style="font-weight: 600; color: #2c3e50;">' . htmlspecialchars($category['name']) . '</div>';
        echo '<div style="color: #6c757d; font-size: 0.9rem;">' . $category['count'] . ' preguntas</div>';
        echo '</div>';
        echo '</label>';
    }
    echo '</div>';
    
    echo '<div style="display: flex; gap: 15px; align-items: center;">';
    echo '<button type="button" onclick="selectAllCategories()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">✅ Seleccionar Todas</button>';
    echo '<button type="button" onclick="clearAllCategories()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer;">❌ Limpiar</button>';
    echo '<button type="submit" style="padding: 12px 25px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 25px; font-weight: 600; cursor: pointer; flex: 1;">🚀 Crear cuestionario personalizado</button>';
    echo '</div>';
    echo '</form>';
    echo '</div>';
    
    echo '<p><strong>📚 O práctica por tema individual:</strong></p>';
    echo '<div class="categories-grid">';
    
    foreach ($categories as $category) {
        echo '<div class="category-card">';
        echo '<div class="category-name">' . htmlspecialchars($category['name']) . '</div>';
        echo '<div class="category-count">' . $category['count'] . '</div>';
        echo '<div class="stat-label">preguntas pendientes</div>';
        echo '<a href="create_quiz.php?category=' . $category['id'] . '" class="btn-practice" onclick="window.location.href=this.href; return false;" style="margin-top: 20px; display: block; position: relative; z-index: 100; cursor: pointer; text-align: center;">🎯 Practicar Ahora</a>';
        echo '</div>';
    }
    
    echo '</div>';
} else {
    echo '<div class="success-msg">';
    echo '🎉 <strong>¡Excelente!</strong> No tienes preguntas falladas pendientes.';
    echo '</div>';
}

echo '</div>';

// PASO 3: Estadísticas
echo '<div class="step-card">';
echo '<div class="step-header">';
echo '<span class="step-icon">📈</span>';
echo '<span>PASO 3: Mi Progreso Personal</span>';
echo '</div>';

$total_failed = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id]);
$mastered = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id, 'mastered' => 1]);
$pending = $total_failed - $mastered;

echo '<div class="stats-showcase">';

echo '<div class="stat-card total">';
echo '<div class="stat-number">' . $total_failed . '</div>';
echo '<div class="stat-label">Total Preguntas Falladas</div>';
echo '</div>';

echo '<div class="stat-card mastered">';
echo '<div class="stat-number">' . $mastered . '</div>';
echo '<div class="stat-label">Ya Dominadas</div>';
echo '</div>';

echo '<div class="stat-card pending">';
echo '<div class="stat-number">' . $pending . '</div>';
echo '<div class="stat-label">Pendientes de Practicar</div>';
echo '</div>';

echo '</div>';

if ($total_failed > 0) {
    $progress = round(($mastered / $total_failed) * 100, 1);
    echo '<div class="progress-section">';
    echo '<div class="progress-header">';
    echo '<span class="progress-label">🎯 Tu Progreso de Dominio</span>';
    echo '<span class="progress-percentage">' . $progress . '%</span>';
    echo '</div>';
    echo '<div class="progress-bar-container">';
    echo '<div class="progress-bar" style="width: ' . $progress . '%;"></div>';
    echo '</div>';
    echo '</div>';
}

echo '</div>';

// PASO 4: Enlaces útiles
echo '<div class="step-card">';
echo '<div class="step-header">';
echo '<span class="step-icon">🔗</span>';
echo '<span>PASO 4: Herramientas Útiles</span>';
echo '</div>';

echo '<div class="useful-links">';

echo '<a href="index.php" class="btn-secondary link-card">';
echo '🏠<br><strong>Dashboard completo</strong><br><small>Vista avanzada con más opciones</small>';
echo '</a>';

echo '<a href="debug_observer.php" class="btn-secondary link-card">';
echo '🔍<br><strong>Diagnóstico</strong><br><small>Procesar cuestionarios manualmente</small>';
echo '</a>';

echo '<a href="student_diagnostic.php" class="btn-secondary link-card">';
echo '✅<br><strong>Verificar Sistema</strong><br><small>Comprobar que todo funcione</small>';
echo '</a>';

echo '<a href="fix_category_names_complete.php" class="btn-secondary link-card">';
echo '🔧<br><strong>Corregir Nombres</strong><br><small>Si ves códigos como W2, S1</small>';
echo '</a>';

echo '<a href="process_recovery_quiz.php" class="btn-secondary link-card">';
echo '🎯<br><strong>Procesar cuestionario</strong><br><small>Marcar preguntas acertadas como dominadas</small>';
echo '</a>';

echo '<a href="/course/view.php?id=2" class="btn-secondary link-card">';
echo '📖<br><strong>Volver al Curso</strong><br><small>Seguir estudiando</small>';
echo '</a>';

echo '</div>';

echo '</div>';

// Instrucciones de uso mejoradas
echo '<div class="instructions-section">';
echo '<h3>📖 ¿Cómo usar este sistema?</h3>';

echo '<ol>';
echo '<li><strong>Después de cada cuestionario:</strong> Ven aquí y haz clic en "Procesar" si aparece el cuestionario</li>';
echo '<li><strong>Para practicar:</strong> Haz clic en "Practicar Ahora" en cualquier tema que tengas pendiente</li>';
echo '<li><strong>Crea cuestionarios:</strong> El sistema generará preguntas personalizadas basadas en tus errores</li>';
echo '<li><strong>Después del cuestionario de recuperación:</strong> Usa "Procesar cuestionario" para marcar las preguntas acertadas como dominadas</li>';
echo '<li><strong>Progresa:</strong> Cuando respondas correctamente, las preguntas se marcarán como dominadas</li>';
echo '</ol>';

echo '<div class="info-msg" style="margin-top: 25px;">';
echo '<strong>💡 Consejo Pro:</strong> Este sistema te ayuda a enfocarte en lo que realmente necesitas estudiar, ';
echo 'convirtiendo tus errores en oportunidades de aprendizaje personalizadas. ¡Úsalo regularmente para maximizar tu rendimiento!';
echo '</div>';

echo '</div>';

echo '</div>'; // Cerrar container

// Footer mejorado
echo '<div class="footer-section">';
echo '🎓 Sistema de Recuperación Personalizado - OpoMelilla<br>';
echo '<small>Transformando errores en oportunidades desde 2025</small>';
echo '</div>';

// JavaScript para animaciones y efectos
echo '<script>
// Asegurar que los botones de práctica sean completamente clicables
document.addEventListener("DOMContentLoaded", function() {
    // Asegurar funcionalidad de botones de práctica
    const practiceButtons = document.querySelectorAll(".btn-practice");
    practiceButtons.forEach(button => {
        // Asegurar que el botón sea visible y clicable
        button.style.pointerEvents = "auto";
        button.style.cursor = "pointer";
        button.style.position = "relative";
        button.style.zIndex = "999";
        
        // Agregar evento de clic como respaldo
        button.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            const href = this.getAttribute("href");
            if (href) {
                console.log("Navigating to:", href);
                window.location.href = href;
            }
        });
        
        // Agregar efecto visual al hacer clic
        button.addEventListener("mousedown", function() {
            this.style.transform = "translateY(-1px) scale(1.02)";
            this.style.boxShadow = "0 5px 15px rgba(79, 172, 254, 0.5)";
        });
        
        button.addEventListener("mouseup", function() {
            this.style.transform = "translateY(-3px) scale(1.05)";
            this.style.boxShadow = "0 15px 35px rgba(79, 172, 254, 0.4)";
        });
        
        // Mostrar información de debug
        button.addEventListener("mouseover", function() {
            console.log("Botón Practicar - URL:", this.href);
        });
    });
    
    // Animación de números que cuentan
    setTimeout(animateNumbers, 500);
    
    // Efecto parallax suave en el header
    const header = document.querySelector(".main-header");
    if (header) {
        window.addEventListener("scroll", () => {
            const scrolled = window.pageYOffset;
            header.style.transform = `translateY(${scrolled * 0.3}px)`;
        });
    }
    
    // Animación de aparición en scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = "fadeInUp 0.6s ease-out forwards";
            }
        });
    }, observerOptions);
    
    document.querySelectorAll(".step-card, .category-card, .stat-card").forEach(el => {
        observer.observe(el);
    });
});

// Animación de números que cuentan
function animateNumbers() {
    const numbers = document.querySelectorAll(".stat-number");
    numbers.forEach(number => {
        const target = parseInt(number.textContent);
        number.textContent = "0";
        
        const increment = target / 50;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                number.textContent = target;
                clearInterval(timer);
            } else {
                number.textContent = Math.floor(current);
            }
        }, 30);
    });
}

// Confetti effect para completaciones
function celebrateCompletion() {
    if (Math.random() > 0.7) { // 30% chance de confetti
        const colors = ["#667eea", "#764ba2", "#4facfe", "#00f2fe"];
        // Simple confetti animation
        for (let i = 0; i < 50; i++) {
            createConfetti();
        }
    }
}

function createConfetti() {
    const confetti = document.createElement("div");
    confetti.style.cssText = `
        position: fixed;
        top: -10px;
        left: ${Math.random() * 100}%;
        width: 10px;
        height: 10px;
        background: ${["#667eea", "#764ba2", "#4facfe", "#00f2fe"][Math.floor(Math.random() * 4)]};
        z-index: 1000;
        animation: confettiFall 3s linear forwards;
        border-radius: 50%;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
}

// CSS para animación de confetti
const style = document.createElement("style");
style.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Llamar celebración si hay progreso
' . ($mastered > 0 ? 'setTimeout(celebrateCompletion, 1000);' : '') . '

// Funciones para selector múltiple
function selectAllCategories() {
    const checkboxes = document.querySelectorAll("input[name=\"selected_categories[]\"]");
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.closest("label").style.background = "linear-gradient(135deg, #e8f4fd 0%, #bee5eb 100%)";
        checkbox.closest("label").style.borderColor = "#667eea";
    });
}

function clearAllCategories() {
    const checkboxes = document.querySelectorAll("input[name=\"selected_categories[]\"]");
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest("label").style.background = "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)";
        checkbox.closest("label").style.borderColor = "transparent";
    });
}

// Efecto visual para checkboxes
document.addEventListener("DOMContentLoaded", function() {
    const checkboxes = document.querySelectorAll("input[name=\"selected_categories[]\"]");
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function() {
            const label = this.closest("label");
            if (this.checked) {
                label.style.background = "linear-gradient(135deg, #e8f4fd 0%, #bee5eb 100%)";
                label.style.border = "2px solid #667eea";
            } else {
                label.style.background = "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)";
                label.style.border = "2px solid transparent";
            }
        });
    });
    
    // Validar formulario de categorías múltiples
    const multiForm = document.getElementById("multiCategoryForm");
    if (multiForm) {
        multiForm.addEventListener("submit", function(e) {
            const checked = document.querySelectorAll("input[name=\"selected_categories[]\"]:checked");
            if (checked.length === 0) {
                e.preventDefault();
                alert("⚠️ Por favor selecciona al menos una categoría para crear el quiz.");
                return false;
            }
        });
    }
});
</script>';
?>