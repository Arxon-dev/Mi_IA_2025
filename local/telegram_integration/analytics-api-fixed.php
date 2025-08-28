<?php
/**
 * Analytics API - Version con debug mejorado
 * BD: u449034524_moodel_telegra
 */

// Habilitar reporte de errores para debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

try {
    // Paso 1: Incluir configuración
    require_once(__DIR__ . '/../../config.php');
    
    // Paso 2: Verificar autenticación
    require_login();
    
    // Paso 3: Incluir funciones
    require_once(__DIR__ . '/lib.php');
    
    // Headers JSON - ANTES de cualquier output
    header('Content-Type: application/json');
    header('Cache-Control: no-cache, must-revalidate');
    
    // Obtener acción
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    switch ($action) {
        case 'get_user_stats':
            $user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : $USER->id;
            
            // Verificar usuario existe
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
                    'debug_info' => [
                        'user_id' => $user_id,
                        'username' => $user->username,
                        'function_called' => 'get_telegram_uuid_from_moodle_user_id',
                        'result' => $telegram_uuid
                    ]
                ]);
                exit;
            }
            
            // Obtener estadísticas individuales
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
                ],
                'debug_info' => [
                    'function_results' => [
                        'get_success_rate_from_telegram_db' => $success_rate,
                        'get_total_questions_from_telegram_db' => $total_questions,
                        'get_correct_answers_from_telegram_db' => $correct_answers,
                        'get_user_ranking_from_telegram_db' => $ranking
                    ]
                ]
            ]);
            break;
            
        case 'get_system_stats':
            $stats = get_telegram_system_stats();
            
            if ($stats === false) {
                echo json_encode([
                    'success' => false, 
                    'message' => 'Error obteniendo estadísticas del sistema',
                    'debug_info' => [
                        'function_called' => 'get_telegram_system_stats',
                        'result' => $stats
                    ]
                ]);
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
                'message' => 'Acción no válida. Acciones disponibles: get_user_stats, get_system_stats',
                'debug_info' => [
                    'received_action' => $action,
                    'available_actions' => ['get_user_stats', 'get_system_stats']
                ]
            ]);
    }
    
} catch (Error $e) {
    // Errores fatales de PHP
    echo json_encode([
        'success' => false,
        'message' => 'Error fatal de PHP: ' . $e->getMessage(),
        'debug_info' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
} catch (Exception $e) {
    // Excepciones normales
    echo json_encode([
        'success' => false,
        'message' => 'Excepción: ' . $e->getMessage(),
        'debug_info' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
} catch (Throwable $e) {
    // Cualquier otro error
    echo json_encode([
        'success' => false,
        'message' => 'Error inesperado: ' . $e->getMessage(),
        'debug_info' => [
            'type' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?> 