<?php
/**
 * Analytics API - Solo endpoints AJAX
 * BD: u449034524_moodel_telegra
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Verificar autenticación
require_login();

// SOLO JSON - Sin HTML
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

try {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($action) {
        case 'get_user_stats':
            $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $USER->id;
            
            // Obtener información del usuario Moodle
            $user = $DB->get_record('user', ['id' => $user_id]);
            if (!$user) {
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                exit;
            }
            
            // Obtener UUID de Telegram
            $telegram_uuid = get_telegram_uuid_from_moodle_user_id($user_id);
            if (!$telegram_uuid) {
                echo json_encode([
                    'success' => false, 
                    'message' => 'Usuario no vinculado con Telegram',
                    'data' => [
                        'user_id' => $user_id,
                        'username' => $user->username,
                        'telegram_uuid' => null
                    ]
                ]);
                exit;
            }
            
            // Obtener estadísticas usando funciones del lib.php
            $success_rate = get_success_rate_from_telegram_db($user_id);
            $total_questions = get_total_questions_from_telegram_db($user_id);
            $correct_answers = get_correct_answers_from_telegram_db($user_id);
            $ranking = get_user_ranking_from_telegram_db($user_id);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'user_id' => $user_id,
                    'username' => $user->username,
                    'telegram_uuid' => $telegram_uuid,
                    'success_rate' => $success_rate !== false ? floatval($success_rate) : 0,
                    'total_questions' => $total_questions !== false ? intval($total_questions) : 0,
                    'correct_answers' => $correct_answers !== false ? intval($correct_answers) : 0,
                    'ranking' => $ranking !== false ? intval($ranking) : null
                ]
            ]);
            break;
            
        case 'get_system_stats':
            $stats = get_telegram_system_stats();
            
            if ($stats === false) {
                echo json_encode(['success' => false, 'message' => 'Error obteniendo estadísticas del sistema']);
            } else {
                echo json_encode([
                    'success' => true,
                    'data' => $stats
                ]);
            }
            break;
            
        default:
            echo json_encode([
                'success' => false, 
                'message' => 'Acción no válida. Acciones disponibles: get_user_stats, get_system_stats'
            ]);
    }
    
} catch (Exception $e) {
    error_log("Error en analytics-api.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?> 