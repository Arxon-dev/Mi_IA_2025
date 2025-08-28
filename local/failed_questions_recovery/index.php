<?php
require_once('../../config.php');
require_once('lib.php');

// Verificar si el usuario está logueado
require_login();

// Check capability
$context = context_user::instance($USER->id);
require_capability('local/failed_questions_recovery:use', $context);

// Check if payments are enabled
$enable_payments = get_config('local_failed_questions_recovery', 'enable_payments');

// Get payment status if payments are enabled
$has_paid = true; // Default to true if payments are disabled
if ($enable_payments) {
    require_once($CFG->dirroot.'/local/failed_questions_recovery/classes/payment_manager.php');
    $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
}

// Configurar la página
$PAGE->set_context($context);
$PAGE->set_url('/local/failed_questions_recovery/index.php');
$PAGE->set_title(get_string('pluginname', 'local_failed_questions_recovery'));
$PAGE->set_heading(get_string('pluginname', 'local_failed_questions_recovery'));

// ✅ Código de debug eliminado para usuarios finales

// Procesar acción manual si se solicita
$action = optional_param('action', '', PARAM_ALPHA);
$message = '';
$message_type = '';

if ($action === 'process_latest') {
        try {
        // Buscar el último attempt del usuario
        $latest_attempt = $DB->get_record_sql("
            SELECT qa.*, q.name as quiz_name 
            FROM {quiz_attempts} qa 
            JOIN {quiz} q ON qa.quiz = q.id 
            WHERE qa.userid = ? AND qa.state = 'finished' 
            ORDER BY qa.timemodified DESC 
            LIMIT 1", [$USER->id]);
        
        if ($latest_attempt) {
            // Incluir librerías necesarias
            require_once($CFG->dirroot . '/mod/quiz/locallib.php');
            require_once($CFG->dirroot . '/question/engine/lib.php');
            
            $before_count = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id]);
            
            // Crear objeto quiz_attempt
            $attemptobj = \quiz_attempt::create($latest_attempt->id);
            if ($attemptobj) {
                $slots = $attemptobj->get_slots();
                $new_records = 0;
                
                foreach ($slots as $slot) {
                    $qa = $attemptobj->get_question_attempt($slot);
                    if (!$qa) continue;
                    
                    $question = $qa->get_question();
                    if (!$question) continue;
                    
                    // Determinar si falló
                    $state = $qa->get_state();
                    $mark = $qa->get_mark();
                    $maxmark = $qa->get_max_mark();
                    $state_class = get_class($state);
                    
                    $is_failed = false;
                    if (strpos($state_class, 'gaveup') !== false) {
                        $is_failed = true;
                    } else if (strpos($state_class, 'gradedwrong') !== false) {
                        $is_failed = true;
                    } else if ($mark !== null && $maxmark !== null && $maxmark > 0) {
                        $percentage = ($mark / $maxmark) * 100;
                        if ($percentage < 50) {
                            $is_failed = true;
        }
                    }
                    
                    if ($is_failed) {
                        // Verificar si ya existe
                        $existing = $DB->get_record('local_failed_questions_recovery', [
                            'userid' => $USER->id,
                            'questionid' => $question->id
                        ]);
                        
                        if (!$existing) {
                            // Crear nuevo registro
                            $category = $DB->get_record('question_categories', ['id' => $question->category]);
                            $categoryname = $category ? $category->name : 'Unknown';
                            
                            $record = new \stdClass();
                            $record->userid = (int)$USER->id;
                            $record->questionid = (int)$question->id;
                            $record->courseid = (int)$latest_attempt->courseid;
                            $record->quizid = (int)$latest_attempt->quiz;
                            $record->categoryid = (int)$question->category;
                            $record->categoryname = substr($categoryname, 0, 255);
                            $record->questiontext = substr(strip_tags($question->questiontext), 0, 1000);
                            
                            // Manejar qtype
                            $qtype_string = '';
                            if (is_object($question->qtype)) {
                                $qtype_string = get_class($question->qtype);
                                if (strpos($qtype_string, 'qtype_') === 0) {
                                    $qtype_string = substr($qtype_string, 6);
        }
                            } else {
                                $qtype_string = (string)$question->qtype;
                            }
                            $record->questiontype = substr($qtype_string, 0, 50);
                            
                            $record->attempts = 1;
                            $record->lastfailed = time();
                            $record->mastered = 0;
                            $record->timecreated = time();
                            $record->timemodified = time();
                            
                            $id = $DB->insert_record('local_failed_questions_recovery', $record);
                            if ($id) {
                                $new_records++;
        }
                        }
                    }
                }
                
                $after_count = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id]);
                
                if ($new_records > 0) {
                    $message = "✅ ¡Procesamiento exitoso! Se agregaron $new_records nuevas preguntas fallidas del quiz \"{$latest_attempt->quiz_name}\".";
                    $message_type = 'success';
                } else {
                    $message = "ℹ️ No se encontraron preguntas fallidas nuevas en el quiz \"{$latest_attempt->quiz_name}\". Las preguntas pueden ya estar registradas o no haber fallidas.";
                    $message_type = 'info';
                }
            } else {
                $message = "❌ Error: No se pudo procesar el quiz attempt.";
                $message_type = 'error';
        }
        } else {
            $message = "⚠️ No se encontró ningún quiz completado reciente para procesar.";
            $message_type = 'warning';
        }
        } catch (Exception $e) {
        $message = "❌ Error al procesar: " . $e->getMessage();
        $message_type = 'error';
    }
}

// Obtener datos del usuario
$user_stats = get_user_stats($USER->id);
$categories = get_failed_questions_by_category($USER->id);

echo $OUTPUT->header();

// Check if payment is required
if ($enable_payments && !$has_paid) {
    // Get payment amount from config or use default
    $payment_amount = get_config('local_failed_questions_recovery', 'payment_amount');
    if (empty($payment_amount)) {
        $payment_amount = '6.00';
    }
    
    echo '<div style="max-width: 800px; margin: 30px auto; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); border: 2px solid #dc3545;">';
    echo '<h2 style="color: #dc3545; margin-top: 0;">'.get_string('payment_required', 'local_failed_questions_recovery').'</h2>';
    echo '<p>'.get_string('payment_required_desc', 'local_failed_questions_recovery').'</p>';
    
    echo '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">';
    echo '<div style="display: flex; justify-content: space-between; margin-bottom: 10px;">';
    echo '<strong>Acceso completo:</strong>';
    echo '<span>'.$payment_amount.' €</span>';
    echo '</div>';
    echo '<div style="display: flex; justify-content: space-between;">';
    echo '<strong>Tipo de pago:</strong>';
    echo '<span>Pago único (sin suscripción)</span>';
    echo '</div>';
    echo '</div>';
    
    echo '<div style="margin: 25px 0 15px 0;">';
    echo '<h3>Características incluidas:</h3>';
    echo '<ul style="list-style-type: none; padding-left: 0;">';
    echo '<li style="padding: 8px 0; border-bottom: 1px solid #eee;">✅ Acceso ilimitado a todas tus preguntas falladas</li>';
    echo '<li style="padding: 8px 0; border-bottom: 1px solid #eee;">✅ Creación de cuestionarios de recuperación personalizados</li>';
    echo '<li style="padding: 8px 0; border-bottom: 1px solid #eee;">✅ Seguimiento de tu progreso de aprendizaje</li>';
    echo '<li style="padding: 8px 0; border-bottom: 1px solid #eee;">✅ Estadísticas detalladas de tu rendimiento</li>';
    echo '</ul>';
    echo '</div>';
    
    echo '<div style="text-align: center; margin-top: 25px;">';
    echo '<a href="payment.php" style="display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 15px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);">'.get_string('go_to_payment', 'local_failed_questions_recovery').' →</a>';
    echo '</div>';
    
    echo '<div style="margin-top: 20px; font-size: 0.9rem; color: #6c757d; text-align: center;">';
    echo 'Nota: No es necesario tener una cuenta de PayPal para realizar el pago.<br>Puedes pagar como invitado con tu tarjeta de crédito o débito.';
    echo '</div>';
    
    echo '</div>';
    
    echo $OUTPUT->footer();
    exit;
}

// Enlace al dashboard de estudiantes
echo '<div style="text-align: center; margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #e8f4fd 0%, #bee5eb 100%); border-radius: 10px; border: 2px solid #007bff;">';
echo '<h3 style="margin: 0 0 10px 0; color: #0c5460;">🎓 ¿Eres estudiante?</h3>';
echo '<p style="margin: 0 0 15px 0; color: #0c5460;">Usa nuestro dashboard simplificado para estudiantes</p>';
echo '<a href="student_dashboard.php" style="background: #007bff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">📚 Dashboard para Estudiantes</a>';
echo '</div>';

// Agregar CSS personalizado moderno
echo '<style>
:root {
    --primary-color: #4a90e2;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
    --info-color: #17a2b8;
    --dark-color: #343a40;
    --light-color: #f8f9fa;
    --gradient-primary: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
    --gradient-success: linear-gradient(135deg, #28a745 0%, #20963d 100%);
    --gradient-danger: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    --gradient-warning: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
    --shadow-light: 0 2px 10px rgba(0,0,0,0.1);
    --shadow-medium: 0 4px 20px rgba(0,0,0,0.15);
    --border-radius: 12px;
}

/* Contenedor principal */
.recovery-dashboard {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

/* Header section */
.dashboard-header {
    text-align: center;
    margin-bottom: 40px;
    padding: 30px 20px;
    background: var(--gradient-primary);
    color: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-medium);
}

.dashboard-header h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 300;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.dashboard-header p {
    margin: 10px 0 0 0;
    font-size: 1.1rem;
    opacity: 0.9;
}

/* Pestañas modernas */
.nav-tabs-wrapper {
    margin-bottom: 30px;
    border-bottom: none;
}

.nav-tabs {
    border: none;
    justify-content: center;
    background: white;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow-light);
    padding: 8px;
}

.nav-tabs .nav-item {
    margin: 0 5px;
}

.nav-tabs .nav-link {
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    color: var(--dark-color);
    font-weight: 500;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.nav-tabs .nav-link:hover {
    background: var(--light-color);
    color: var(--primary-color);
    transform: translateY(-2px);
}

.nav-tabs .nav-link.active {
    background: var(--gradient-primary);
    color: white;
    box-shadow: var(--shadow-light);
}

/* Tarjetas de estadísticas */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
    margin-bottom: 40px;
}

.stat-card {
    background: white;
    border-radius: var(--border-radius);
    padding: 30px 25px;
    text-align: center;
    box-shadow: var(--shadow-light);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-medium);
}

.stat-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    transition: all 0.3s ease;
}

.stat-card.stat-failed::before {
    background: var(--gradient-danger);
}

.stat-card.stat-mastered::before {
    background: var(--gradient-success);
}

.stat-card.stat-quizzes::before {
    background: var(--gradient-warning);
}

.stat-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.8;
}

.stat-failed .stat-icon {
    color: var(--danger-color);
}

.stat-mastered .stat-icon {
    color: var(--success-color);
}

.stat-quizzes .stat-icon {
    color: var(--warning-color);
}

.stat-card h3 {
    font-size: 1rem;
    color: #666;
    margin: 0 0 15px 0;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-number {
    font-size: 3rem;
    font-weight: 700;
    margin: 10px 0;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-card p {
    margin: 10px 0 0 0;
    color: #666;
    font-size: 0.9rem;
    font-weight: 400;
}

.stat-failed .stat-number {
    background: var(--gradient-danger);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-mastered .stat-number {
    background: var(--gradient-success);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-quizzes .stat-number {
    background: var(--gradient-warning);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Sección de categorías */
.categories-section {
    background: white;
    border-radius: var(--border-radius);
    padding: 30px;
    box-shadow: var(--shadow-light);
}

.categories-section h3 {
    color: var(--dark-color);
    margin-bottom: 25px;
    font-size: 1.5rem;
    font-weight: 600;
    position: relative;
    padding-left: 20px;
}

.categories-section h3::before {
    content: "📚";
    position: absolute;
    left: 0;
    top: 0;
}

/* Barra de progreso general */
.progress-overview {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: var(--border-radius);
    padding: 20px;
    margin-bottom: 25px;
    border: 2px solid #e9ecef;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.progress-label {
    font-weight: 600;
    color: var(--dark-color);
    font-size: 1.1rem;
}

.progress-percentage {
    font-weight: 700;
    color: var(--primary-color);
    font-size: 1.2rem;
}

.progress-bar-container {
    background: #e9ecef;
    border-radius: 10px;
    height: 12px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

.progress-bar {
    height: 100%;
    background: var(--gradient-success);
    border-radius: 10px;
    transition: width 1s ease-in-out;
    position: relative;
}

.progress-bar::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.category-item {
    border: 2px solid #e9ecef;
    border-radius: var(--border-radius);
    padding: 20px;
    margin-bottom: 15px;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
}

.category-item:hover {
    border-color: var(--primary-color);
    transform: translateX(10px);
    box-shadow: var(--shadow-light);
}

.category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.category-info h4 {
    margin: 0 0 5px 0;
    color: var(--dark-color);
    font-weight: 600;
    font-size: 1.2rem;
}

.category-description {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
    font-style: italic;
}

.badge {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: 0.5px;
}

.badge-danger {
    background: var(--gradient-danger);
    color: white;
    border: none;
}

.badge-success {
    background: var(--gradient-success);
    color: white;
    border: none;
}

/* Botones modernos */
.btn {
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: var(--gradient-primary);
    color: white;
    box-shadow: var(--shadow-light);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-medium);
    color: white;
    text-decoration: none;
}

.btn-success {
    background: var(--gradient-success);
    color: white;
}

.btn-warning {
    background: var(--gradient-warning);
    color: white;
}

/* Alerts modernos */
.alert {
    border: none;
    border-radius: var(--border-radius);
    padding: 25px;
    margin: 20px 0;
    border-left: 4px solid;
    position: relative;
    overflow: hidden;
}

.alert::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
    transform: translate(30px, -30px);
}

.alert-info {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    border-left-color: var(--info-color);
    color: #0c5460;
}

.alert-icon {
    font-size: 2rem;
    margin-bottom: 10px;
    display: block;
}

.alert h4 {
    margin: 0 0 10px 0;
    color: #0c5460;
    font-weight: 600;
}

.alert p {
    margin: 5px 0;
    line-height: 1.5;
}

/* Tablas modernas */
.table-responsive {
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow-light);
    margin: 20px 0;
}

.table {
    margin: 0;
    background: white;
}

.table thead th {
    background: var(--gradient-primary);
    color: white;
    border: none;
    padding: 15px 20px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-size: 0.875rem;
}

.table tbody td {
    padding: 15px 20px;
    border-color: #e9ecef;
    vertical-align: middle;
}

.table tbody tr:hover {
    background: var(--light-color);
}

/* Responsive */
@media (max-width: 768px) {
    .recovery-dashboard {
        padding: 15px;
    }
    
    .dashboard-header h1 {
        font-size: 2rem;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .category-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .nav-tabs {
        padding: 5px;
    }
    
    .nav-tabs .nav-link {
        padding: 10px 16px;
        font-size: 0.875rem;
    }
}

/* Animaciones */
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

.recovery-dashboard > * {
    animation: fadeInUp 0.6s ease-out;
}

.recovery-dashboard > *:nth-child(2) { animation-delay: 0.1s; }
.recovery-dashboard > *:nth-child(3) { animation-delay: 0.2s; }
.recovery-dashboard > *:nth-child(4) { animation-delay: 0.3s; }
</style>';

// Mostrar pestañas
echo '<div class="nav-tabs-wrapper">';
echo '<ul class="nav nav-tabs">';
echo '<li class="nav-item">';
echo '<a class="nav-link active" href="index.php">' . get_string('recoveryboard', 'local_failed_questions_recovery') . '</a>';
echo '</li>';
echo '<li class="nav-item">';
echo '<a class="nav-link" href="index.php?tab=failed">' . get_string('failed_questions', 'local_failed_questions_recovery') . '</a>';
echo '</li>';
echo '<li class="nav-item">';
echo '<a class="nav-link" href="index.php?tab=quizzes">' . get_string('recovery_quizzes', 'local_failed_questions_recovery') . '</a>';
echo '</li>';
echo '</ul>';
echo '</div>';

// Mostrar contenido según la pestaña activa
$active_tab = optional_param('tab', 'dashboard', PARAM_ALPHA);

if ($active_tab === 'dashboard') {
    // Panel de estadísticas
    echo '<div class="recovery-dashboard">';
    
    // Header del dashboard
    echo '<div class="dashboard-header">';
    echo '<h1>🎯 ' . get_string('recoveryboard', 'local_failed_questions_recovery') . '</h1>';
    echo '<p>Monitorea tu progreso y domina las preguntas falladas</p>';
    echo '</div>';
    
    // Mostrar mensaje de resultado si existe
    if (!empty($message)) {
        $alert_class = '';
        $alert_color = '';
        switch ($message_type) {
            case 'success':
                $alert_class = 'alert-success';
                $alert_color = 'background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-left-color: #28a745; color: #155724;';
                break;
            case 'info':
                $alert_class = 'alert-info';
                $alert_color = 'background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border-left-color: #17a2b8; color: #0c5460;';
                break;
            case 'warning':
                $alert_class = 'alert-warning';
                $alert_color = 'background: linear-gradient(135deg, #fff3cd 0%, #fdeaa7 100%); border-left-color: #ffc107; color: #856404;';
                break;
            case 'error':
                $alert_class = 'alert-danger';
                $alert_color = 'background: linear-gradient(135deg, #f8d7da 0%, #f1b0b7 100%); border-left-color: #dc3545; color: #721c24;';
                break;
        }
        echo '<div class="alert ' . $alert_class . '" style="' . $alert_color . '">';
        echo '<p style="margin: 0; font-weight: 500;">' . $message . '</p>';
        echo '</div>';
    }
    
    // Mostrar estadísticas con iconos
    echo '<div class="stats-grid">';
    
    echo '<div class="stat-card stat-failed">';
    echo '<div class="stat-icon">❌</div>';
    echo '<h3>' . get_string('total_failed_questions', 'local_failed_questions_recovery') . '</h3>';
    echo '<div class="stat-number">' . $user_stats->total_failed . '</div>';
    echo '<p>Preguntas por dominar</p>';
    echo '</div>';
    
    echo '<div class="stat-card stat-mastered">';
    echo '<div class="stat-icon">✅</div>';
    echo '<h3>' . get_string('mastered_questions', 'local_failed_questions_recovery') . '</h3>';
    echo '<div class="stat-number">' . $user_stats->total_mastered . '</div>';
    echo '<p>¡Ya dominadas!</p>';
    echo '</div>';
    
    echo '<div class="stat-card stat-quizzes">';
    echo '<div class="stat-icon">📝</div>';
    echo '<h3>' . get_string('recovery_quizzes', 'local_failed_questions_recovery') . '</h3>';
    echo '<div class="stat-number">' . $user_stats->total_quizzes . '</div>';
    echo '<p>Quizzes completados</p>';
    echo '</div>';
    
    echo '</div>'; // Fin stats-grid
    
    // Botón para procesar preguntas fallidas manualmente
    echo '<div class="manual-processing-section" style="background: white; border-radius: var(--border-radius); padding: 25px; box-shadow: var(--shadow-light); margin-bottom: 30px; text-align: center;">';
    echo '<h3 style="color: var(--dark-color); margin-bottom: 15px; font-size: 1.3rem;">🔄 Procesamiento Manual</h3>';
    echo '<p style="color: #666; margin-bottom: 20px; font-size: 0.95rem;">¿Acabas de completar un quiz? Procesa manualmente las preguntas fallidas si no aparecen automáticamente.</p>';
    echo '<a href="?action=process_latest" class="btn btn-warning" style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); font-size: 1rem; padding: 15px 30px;">';
    echo '⚡ Procesar Último Quiz';
    echo '</a>';
    echo '<p style="margin-top: 15px; font-size: 0.85rem; color: #888;">Esto buscará tu quiz más reciente y capturará las preguntas fallidas</p>';
    echo '</div>';
    
    // Mostrar categorías
    echo '<div class="categories-section">';
    echo '<h3>' . get_string('categories', 'local_failed_questions_recovery') . '</h3>';
    
    if (empty($categories)) {
        echo '<div class="alert alert-info">';
        echo '<div class="alert-icon">💡</div>';
        echo '<h4>¡Excelente!</h4>';
        echo '<p>' . get_string('no_failed_questions', 'local_failed_questions_recovery') . '</p>';
        echo '<p>No tienes preguntas falladas pendientes de recuperar.</p>';
        echo '</div>';
    } else {
        // Calcular progreso general
        $total_progress = ($user_stats->total_mastered / ($user_stats->total_failed + $user_stats->total_mastered)) * 100;
        $progress_rounded = round($total_progress, 1);
        
        // Mostrar barra de progreso general
        echo '<div class="progress-overview">';
        echo '<div class="progress-header">';
        echo '<span class="progress-label">📈 Progreso General</span>';
        echo '<span class="progress-percentage">' . $progress_rounded . '%</span>';
        echo '</div>';
        echo '<div class="progress-bar-container">';
        echo '<div class="progress-bar" style="width: ' . $progress_rounded . '%"></div>';
        echo '</div>';
        echo '</div>';
        
        foreach ($categories as $category) {
            echo '<div class="category-item">';
            echo '<div class="category-header">';
            echo '<div class="category-info">';
            echo '<h4>📂 ' . $category['name'] . '</h4>';
            echo '<p class="category-description">Categoría con preguntas por recuperar</p>';
            echo '</div>';
            echo '<span class="badge badge-danger">' . $category['count'] . ' preguntas</span>';
            echo '</div>';
            echo '<div class="category-actions">';
            echo '<a href="create_quiz.php?category=' . $category['id'] . '" class="btn btn-primary">';
            echo '🚀 ' . get_string('create_recovery_quiz', 'local_failed_questions_recovery');
            echo '</a>';
            echo '</div>';
            echo '</div>';
        }
    }
    echo '</div>';
    
    // ✅ Sección de herramientas de debug eliminada para usuarios finales
    
    echo '</div>'; // Fin recovery-dashboard
} elseif ($active_tab === 'failed') {
    // Mostrar lista de preguntas falladas
    echo '<div class="failed-questions-list">';
    echo '<h2>' . get_string('failed_questions', 'local_failed_questions_recovery') . '</h2>';
    
    $failed_questions = get_all_failed_questions($USER->id);
    
    if (empty($failed_questions)) {
        echo '<div class="alert alert-info">' . get_string('no_failed_questions', 'local_failed_questions_recovery') . '</div>';
    } else {
        echo '<div class="table-responsive">';
        echo '<table class="table table-striped">';
        echo '<thead>';
        echo '<tr>';
        echo '<th>Pregunta</th>';
        echo '<th>Categoría</th>';
        echo '<th>Intentos</th>';
        echo '<th>Último fallo</th>';
        echo '<th>Estado</th>';
        echo '</tr>';
        echo '</thead>';
        echo '<tbody>';
        
        foreach ($failed_questions as $question) {
            echo '<tr>';
            echo '<td>' . format_string($question->questiontext) . '</td>';
            echo '<td>' . htmlspecialchars($question->display_name) . '</td>';
            echo '<td>' . $question->attempts . '</td>';
            echo '<td>' . userdate($question->lastfailed) . '</td>';
            echo '<td>';
            if ($question->mastered) {
                echo '<span class="badge badge-success">Dominada</span>';
            } else {
                echo '<span class="badge badge-danger">Pendiente</span>';
            }
            echo '</td>';
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
        echo '</div>';
    }
    echo '</div>';
} elseif ($active_tab === 'quizzes') {
    // Mostrar lista de quizzes de recuperación
    echo '<div class="recovery-quizzes-list">';
    echo '<h2>' . get_string('recovery_quizzes', 'local_failed_questions_recovery') . '</h2>';
    
    $recovery_quizzes = get_user_recovery_quizzes($USER->id);
    
    if (empty($recovery_quizzes)) {
        echo '<div class="alert alert-info">No has creado ningún quiz de recuperación aún.</div>';
    } else {
        echo '<div class="table-responsive">';
        echo '<table class="table table-striped">';
        echo '<thead>';
        echo '<tr>';
        echo '<th>Categoría</th>';
        echo '<th>Preguntas</th>';
        echo '<th>Creado</th>';
        echo '<th>Intentos</th>';
        echo '<th>Acciones</th>';
        echo '</tr>';
        echo '</thead>';
        echo '<tbody>';
        
        foreach ($recovery_quizzes as $quiz) {
            echo '<tr>';
            echo '<td>' . $quiz->categoryname . '</td>';
            echo '<td>' . $quiz->questioncount . '</td>';
            echo '<td>' . userdate($quiz->timecreated) . '</td>';
            echo '<td>' . $quiz->attempts . '</td>';
            echo '<td>';
            echo '<a href="take_quiz.php?quizid=' . $quiz->id . '" class="btn btn-sm btn-primary">Realizar Quiz</a>';
            echo '</td>';
            echo '</tr>';
        }
        
        echo '</tbody>';
        echo '</table>';
        echo '</div>';
    }
    echo '</div>';
}

echo $OUTPUT->footer();