<?php
/**
 * Analytics Simplificado - Sin AJAX
 * BD Unificada: u449034524_moodel_telegra
 */

// Configuración Moodle
require_once(__DIR__ . '/../../config.php');
require_login();

// Configurar página
$PAGE->set_url('/local/telegram_integration/analytics-simple.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_title('Analytics Telegram - Simplificado');
$PAGE->set_heading('Analytics Telegram - BD Unificada');

// Obtener datos directamente (sin AJAX)
$current_user_id = $USER->id;
$user_data = get_user_analytics_simple($current_user_id);
$system_data = get_system_analytics_simple();

echo $OUTPUT->header();

/**
 * Obtener datos de usuario de forma simple
 */
function get_user_analytics_simple($user_id) {
    global $DB;
    
    try {
        // Obtener usuario Moodle
        $user = $DB->get_record('user', ['id' => $user_id]);
        if (!$user) {
            return ['error' => 'Usuario Moodle no encontrado'];
        }
        
        // Buscar mapeo Telegram
        $mapping = $DB->get_record('MoodleUserLink', 
            ['moodleUserId' => $user_id], 
            'telegramUserId, isActive'
        );
        
        if (!$mapping || !$mapping->telegramUserId) {
            return [
                'user' => $user,
                'error' => 'Usuario no vinculado con Telegram',
                'telegram_uuid' => null
            ];
        }
        
        $telegram_uuid = $mapping->telegramUserId;
        $is_active = $mapping->isActive;
        
        // Obtener estadísticas directamente
        $sql = "SELECT 
                    COUNT(*) as total_responses,
                    SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correct_responses
                FROM {telegramresponse} 
                WHERE userId = ?";
        
        $stats = $DB->get_record_sql($sql, [$telegram_uuid]);
        
        $total_questions = $stats ? $stats->total_responses : 0;
        $correct_answers = $stats ? $stats->correct_responses : 0;
        $success_rate = $total_questions > 0 ? round(($correct_answers / $total_questions) * 100, 2) : 0;
        
        return [
            'user' => $user,
            'telegram_uuid' => $telegram_uuid,
            'is_active' => $is_active,
            'total_questions' => $total_questions,
            'correct_answers' => $correct_answers,
            'success_rate' => $success_rate,
            'has_data' => $total_questions > 0
        ];
        
    } catch (Exception $e) {
        return ['error' => 'Error: ' . $e->getMessage()];
    }
}

/**
 * Obtener estadísticas del sistema de forma simple
 */
function get_system_analytics_simple() {
    global $DB;
    
    try {
        $stats = [];
        $stats['total_telegram_users'] = $DB->count_records('TelegramUser');
        $stats['total_responses'] = $DB->count_records('telegramresponse');
        $stats['active_mappings'] = $DB->count_records('MoodleUserLink', ['isActive' => 1]);
        $stats['total_correct'] = $DB->count_records('telegramresponse', ['isCorrect' => 1]);
        $stats['global_success_rate'] = $stats['total_responses'] > 0 ? 
            round(($stats['total_correct'] / $stats['total_responses']) * 100, 2) : 0;
        
        return $stats;
        
    } catch (Exception $e) {
        return ['error' => 'Error: ' . $e->getMessage()];
    }
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Telegram - Simplificado</title>
    <style>
        .analytics-container {
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .analytics-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .analytics-header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s ease;
            border-left: 4px solid;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card.success { border-left-color: #28a745; }
        .stat-card.questions { border-left-color: #007bff; }
        .stat-card.correct { border-left-color: #17a2b8; }
        .stat-card.ranking { border-left-color: #ffc107; }
        
        .stat-value {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .stat-label {
            color: #666;
            font-size: 1.1em;
            font-weight: 500;
        }
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .warning-message {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .system-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #6c757d;
        }
        
        .bd-unified-badge {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="analytics-container">
        <div class="analytics-header">
            <h1>📊 Analytics Telegram</h1>
            <div>
                Sistema Simplificado - Sin AJAX
                <span class="bd-unified-badge">BD Unificada</span>
            </div>
        </div>
        
        <?php if (isset($user_data['error'])): ?>
            <div class="error-message">
                <h3>❌ Error en Datos de Usuario</h3>
                <p><?php echo htmlspecialchars($user_data['error']); ?></p>
                <?php if (isset($user_data['user'])): ?>
                    <p><strong>Usuario:</strong> <?php echo htmlspecialchars($user_data['user']->username); ?> (ID: <?php echo $user_data['user']->id; ?>)</p>
                <?php endif; ?>
            </div>
        <?php else: ?>
            
            <?php if (isset($user_data['has_data']) && $user_data['has_data']): ?>
                <div class="success-message">
                    <strong>✅ Datos cargados exitosamente desde BD unificada</strong><br>
                    Usuario: <?php echo htmlspecialchars($user_data['user']->username); ?> (ID: <?php echo $user_data['user']->id; ?>)<br>
                    Telegram UUID: <?php echo htmlspecialchars($user_data['telegram_uuid']); ?><br>
                    Estado: <?php echo $user_data['is_active'] ? 'Activo' : 'Inactivo'; ?>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card success">
                        <div class="stat-value"><?php echo $user_data['success_rate']; ?>%</div>
                        <div class="stat-label">Tasa de Éxito</div>
                    </div>
                    
                    <div class="stat-card questions">
                        <div class="stat-value"><?php echo $user_data['total_questions']; ?></div>
                        <div class="stat-label">Total Preguntas</div>
                    </div>
                    
                    <div class="stat-card correct">
                        <div class="stat-value"><?php echo $user_data['correct_answers']; ?></div>
                        <div class="stat-label">Respuestas Correctas</div>
                    </div>
                    
                    <div class="stat-card ranking">
                        <div class="stat-value">N/A</div>
                        <div class="stat-label">Ranking</div>
                    </div>
                </div>
                
            <?php else: ?>
                <div class="warning-message">
                    <h3>⚠️ Sin datos de usuario</h3>
                    <p>El usuario está mapeado pero no tiene respuestas registradas</p>
                    <?php if (isset($user_data['telegram_uuid'])): ?>
                        <p><strong>Telegram UUID:</strong> <?php echo htmlspecialchars($user_data['telegram_uuid']); ?></p>
                        <p><strong>Estado:</strong> <?php echo $user_data['is_active'] ? 'Activo' : 'Inactivo'; ?></p>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            
        <?php endif; ?>
        
        <?php if (!isset($system_data['error'])): ?>
            <div class="system-info">
                <h3>📈 Estadísticas del Sistema (BD Unificada)</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Usuarios Telegram:</strong> <?php echo $system_data['total_telegram_users']; ?>
                    </div>
                    <div class="info-item">
                        <strong>Total Respuestas:</strong> <?php echo $system_data['total_responses']; ?>
                    </div>
                    <div class="info-item">
                        <strong>Mapeos Activos:</strong> <?php echo $system_data['active_mappings']; ?>
                    </div>
                    <div class="info-item">
                        <strong>Éxito Global:</strong> <?php echo $system_data['global_success_rate']; ?>%
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="error-message">
                <h3>❌ Error en Estadísticas del Sistema</h3>
                <p><?php echo htmlspecialchars($system_data['error']); ?></p>
            </div>
        <?php endif; ?>
        
        <div style="margin-top: 30px; padding: 20px; background: #e9ecef; border-radius: 8px;">
            <h4>🔧 Información Técnica</h4>
            <p><strong>Versión:</strong> Analytics Simplificado (Sin AJAX)</p>
            <p><strong>BD:</strong> u449034524_moodel_telegra</p>
            <p><strong>Conexión:</strong> Nativa Moodle</p>
            <p><strong>Usuario Actual:</strong> <?php echo $USER->username; ?> (ID: <?php echo $USER->id; ?>)</p>
        </div>
    </div>
</body>
</html>

<?php echo $OUTPUT->footer(); ?> 