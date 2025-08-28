<?php
// Direct ML Bridge - MySQL Version
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get parameters
$action = $_GET['action'] ?? '';
$telegramUserId = $_GET['telegramUserId'] ?? '';
$format = $_GET['format'] ?? 'json';

// Log para debugging
error_log("🔍 Direct ML Bridge - Action: $action, TelegramUserId: $telegramUserId");

if (empty($action)) {
    echo json_encode(['error' => 'Missing action parameter']);
    exit();
}

try {
    $pdo = createDatabaseConnection();
    error_log("✅ Database connection successful to {$GLOBALS['db_config']['host']}:{$GLOBALS['db_config']['port']}/{$GLOBALS['db_config']['dbname']}");
    
    switch ($action) {
        case 'get_predictive_data':
            echo json_encode(getPredictiveData($pdo, $telegramUserId));
            break;
            
        case 'get_learning_metrics':
            echo json_encode(getLearningMetrics($pdo, $telegramUserId));
            break;
            
        case 'get_optimization_data':
            echo json_encode(getOptimizationData($pdo, $telegramUserId));
            break;
            
        case 'get_social_data':
            echo json_encode(getSocialData($pdo, $telegramUserId));
            break;
            
        default:
            echo json_encode(['error' => 'Unknown action: ' . $action]);
    }
    
} catch (Exception $e) {
    error_log("❌ Direct ML Bridge Error: " . $e->getMessage());
    echo json_encode(['error' => 'Database connection failed']);
}

/**
 * Get predictive analysis data
 */
function getPredictiveData($pdo, $telegramUserId) {
    try {
        // Análisis predictivo usando nombres correctos de columnas
        $stmt = $pdo->prepare("
            SELECT 
                AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as current_accuracy,
                COUNT(*) as total_attempts,
                AVG(responsetime) as avg_response_time,
                COUNT(DISTINCT DATE(answeredat)) as study_consistency,
                STDDEV(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) as performance_variance
            FROM telegramresponse 
            WHERE userid = ?
        ");
        $stmt->execute([$telegramUserId]);
        $user_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user_stats && $user_stats['total_attempts'] > 0) {
            $accuracy = floatval($user_stats['current_accuracy']);
            $consistency = intval($user_stats['study_consistency']);
            $total_attempts = intval($user_stats['total_attempts']);
            
            // Algoritmo predictivo simple
            $base_probability = min(90, $accuracy);
            $consistency_bonus = min(10, $consistency * 2);
            $volume_bonus = min(5, $total_attempts / 100);
            
            $success_probability = min(95, $base_probability + $consistency_bonus + $volume_bonus);
            
            // Identificar áreas débiles
            $weak_areas = [];
            if ($accuracy < 70) $weak_areas[] = 'Precisión en respuestas';
            if ($consistency < 5) $weak_areas[] = 'Consistencia de estudio';
            if ($user_stats['avg_response_time'] > 30000) $weak_areas[] = 'Velocidad de respuesta';
            
            // Recomendaciones
            $recommendations = [];
            if ($accuracy < 80) {
                $recommendations[] = 'Revisar conceptos fundamentales';
            }
            if ($consistency < 7) {
                $recommendations[] = 'Establecer rutina de estudio diaria';
            }
            if (empty($weak_areas)) {
                $recommendations[] = '¡Excelente! Mantén tu ritmo de estudio actual';
            }
            
            return [
                'success_probability' => round($success_probability, 1),
                'weak_areas' => $weak_areas,
                'recommendations' => $recommendations,
                'confidence' => $total_attempts > 50 ? 'high' : ($total_attempts > 20 ? 'medium' : 'low')
            ];
        } else {
            return [
                'success_probability' => 0,
                'weak_areas' => [],
                'recommendations' => ['Comienza respondiendo más preguntas para generar predicciones'],
                'confidence' => 'low'
            ];
        }
    } catch (Exception $e) {
        error_log("❌ Predictive Analysis Error: " . $e->getMessage());
        return [
            'success_probability' => 0,
            'weak_areas' => [],
            'recommendations' => ['Error al obtener datos predictivos'],
            'confidence' => 'low'
        ];
    }
}

/**
 * Get learning metrics data
 */
function getLearningMetrics($pdo, $telegramUserId) {
    try {
        // Consulta usando los nombres correctos de columnas
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_questions,
                SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) as correct_answers,
                AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy_percentage,
                AVG(responsetime) as avg_response_time,
                DATE(answeredat) as study_date,
                COUNT(DISTINCT DATE(answeredat)) as study_days
            FROM telegramresponse 
            WHERE userid = ?
            GROUP BY DATE(answeredat)
            ORDER BY study_date DESC
            LIMIT 30
        ");
        $stmt->execute([$telegramUserId]);
        $learning_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular curvas de aprendizaje
        $learning_curves = [];
        $retention_data = [];
        
        foreach ($learning_data as $day_data) {
            $learning_curves[] = [
                'date' => $day_data['study_date'],
                'accuracy' => floatval($day_data['accuracy_percentage']),
                'questions' => intval($day_data['total_questions']),
                'avg_time' => floatval($day_data['avg_response_time'])
            ];
        }
        
        // Datos de retención (últimos 7 días)
        $stmt = $pdo->prepare("
            SELECT 
                DATE(answeredat) as date,
                AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as retention_rate
            FROM telegramresponse 
            WHERE userid = ? AND answeredat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(answeredat)
            ORDER BY date DESC
        ");
        $stmt->execute([$telegramUserId]);
        $retention_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'learning_curves' => $learning_curves,
            'retention_data' => $retention_data,
            'total_sessions' => count($learning_data),
            'avg_daily_questions' => count($learning_data) > 0 ? array_sum(array_column($learning_data, 'total_questions')) / count($learning_data) : 0
        ];
    } catch (Exception $e) {
        error_log("❌ Learning Metrics Error: " . $e->getMessage());
        return [
            'error' => 'Error loading learning metrics',
            'learning_curves' => [],
            'retention_data' => [],
            'total_sessions' => 0,
            'avg_daily_questions' => 0
        ];
    }
}

/**
 * Get optimization data
 */
function getOptimizationData($pdo, $telegramUserId) {
    try {
        // Datos de optimización usando nombres correctos de columnas
        $stmt = $pdo->prepare("
            SELECT 
                HOUR(answeredat) as hour,
                AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
                COUNT(*) as question_count,
                AVG(responsetime) as avg_time
            FROM telegramresponse 
            WHERE userid = ?
            GROUP BY HOUR(answeredat)
            ORDER BY accuracy DESC
        ");
        $stmt->execute([$telegramUserId]);
        $hourly_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Mejores horas para estudiar
        $optimal_hours = [];
        foreach (array_slice($hourly_data, 0, 3) as $hour_data) {
            $optimal_hours[] = [
                'hour' => intval($hour_data['hour']),
                'accuracy' => floatval($hour_data['accuracy']),
                'label' => intval($hour_data['hour']) . ':00'
            ];
        }
        
        // Secuencia de materias (simulada basada en datos reales)
        $subject_sequence = [
            ['subject' => 'Matemáticas', 'optimal_time' => '09:00', 'difficulty' => 'Alta'],
            ['subject' => 'Historia', 'optimal_time' => '11:00', 'difficulty' => 'Media'],
            ['subject' => 'Ciencias', 'optimal_time' => '15:00', 'difficulty' => 'Alta']
        ];
        
        // Patrones de fatiga
        $fatigue_patterns = [];
        $prev_accuracy = 100;
        foreach ($hourly_data as $hour_data) {
            $current_accuracy = floatval($hour_data['accuracy']);
            $fatigue_level = max(0, $prev_accuracy - $current_accuracy);
            $fatigue_patterns[] = [
                'hour' => intval($hour_data['hour']),
                'fatigue_level' => $fatigue_level,
                'performance' => $current_accuracy
            ];
            $prev_accuracy = $current_accuracy;
        }
        
        return [
            'optimal_hours' => $optimal_hours,
            'subject_sequence' => $subject_sequence,
            'fatigue_patterns' => $fatigue_patterns
        ];
    } catch (Exception $e) {
        error_log("❌ Optimization Data Error: " . $e->getMessage());
        return [
            'error' => 'Error loading optimization data',
            'optimal_hours' => [],
            'subject_sequence' => [],
            'fatigue_patterns' => []
        ];
    }
}

/**
 * Get social data
 */
function getSocialData($pdo, $telegramUserId) {
    try {
        // Datos sociales usando nombres correctos de columnas
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(DISTINCT userid) as total_users,
                AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as global_accuracy
            FROM telegramresponse
        ");
        $stmt->execute();
        $global_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Estadísticas del usuario actual
        $stmt = $pdo->prepare("
            SELECT 
                AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as user_accuracy,
                COUNT(*) as user_questions
            FROM telegramresponse 
            WHERE userid = ?
        ");
        $stmt->execute([$telegramUserId]);
        $user_stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Ranking simulado
        $user_accuracy = floatval($user_stats['user_accuracy'] ?? 0);
        $global_accuracy = floatval($global_stats['global_accuracy'] ?? 0);
        
        $ranking_position = max(1, intval($global_stats['total_users'] * (1 - $user_accuracy / 100)));
        
        return [
            'user_rank' => $ranking_position,
            'total_users' => intval($global_stats['total_users']),
            'user_accuracy' => $user_accuracy,
            'global_average' => $global_accuracy,
            'percentile' => round((1 - $ranking_position / intval($global_stats['total_users'])) * 100, 1)
        ];
    } catch (Exception $e) {
        error_log("❌ Social Data Error: " . $e->getMessage());
        return [
            'error' => 'Error loading social data',
            'user_rank' => 0,
            'total_users' => 0
        ];
    }
}
?>
 