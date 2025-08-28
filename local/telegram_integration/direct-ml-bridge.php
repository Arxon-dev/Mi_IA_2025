<?php
// ADVERTENCIA: Este archivo (direct-ml-bridge.php) es solo para pruebas legacy o compatibilidad.
// No debe usarse en producción. Usa direct-ml-bridge-mysql.php para datos reales.
// Direct ML Bridge - Proxy to Next.js API
require_once(__DIR__ . '/../../config.php');

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

if (empty($action)) {
    echo json_encode(['error' => 'Missing action parameter']);
    exit();
}

// Try direct database connection to PostgreSQL
$mysql_host = 'localhost';
$mysql_dbname = 'u449034524_mi_ia_db';
$mysql_user = 'u449034524_mi_ia';
$mysql_password = 'Sirius//03072503//';

$useMockData = false;

try {
    $pdo = new PDO("mysql:host=$mysql_host;dbname=$mysql_dbname;charset=utf8mb4", $mysql_user, $mysql_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    switch ($action) {
        case 'test_connection':
            echo json_encode([
                'status' => 'success',
                'message' => 'Direct database connection successful'
            ]);
            break;
            
        case 'get_predictive_data':
            if (empty($telegramUserId)) {
                echo json_encode(['error' => 'Missing telegramUserId parameter']);
                exit();
            }
            
            $result = getPredictiveAnalysis($pdo, $telegramUserId);
            echo json_encode($result);
            break;
            
        case 'get_learning_metrics':
            if (empty($telegramUserId)) {
                echo json_encode(['error' => 'Missing telegramUserId parameter']);
                exit();
            }
            
            $result = getLearningMetrics($pdo, $telegramUserId);
            echo json_encode($result);
            break;
            
        case 'get_optimization_data':
            if (empty($telegramUserId)) {
                echo json_encode(['error' => 'Missing telegramUserId parameter']);
                exit();
            }
            
            $result = getOptimizationData($pdo, $telegramUserId);
            echo json_encode($result);
            break;
            
        case 'get_social_data':
            if (empty($telegramUserId)) {
                echo json_encode(['error' => 'Missing telegramUserId parameter']);
                exit();
            }
            
            $result = getSocialData($pdo, $telegramUserId);
            echo json_encode($result);
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    // Log the error
    error_log("Database connection error: " . $e->getMessage());
    
    // Use mock data instead of failing completely
    $useMockData = true;
    
    switch ($action) {
        case 'test_connection':
            echo json_encode([
                'status' => 'mock',
                'message' => 'Using mock data - Database connection failed: ' . $e->getMessage()
            ]);
            break;
            
        case 'get_predictive_data':
            if (empty($telegramUserId)) {
                echo json_encode(['error' => 'Missing telegramUserId parameter']);
                exit();
            }
            
            $result = getMockPredictiveAnalysis($telegramUserId);
            echo json_encode($result);
            break;
            
        case 'get_learning_metrics':
            if (empty($telegramUserId)) {
                echo json_encode(['error' => 'Missing telegramUserId parameter']);
                exit();
            }
            
            $result = getMockLearningMetrics($telegramUserId);
            echo json_encode($result);
            break;
            
        case 'get_optimization_data':
            if (empty($telegramUserId)) {
                echo json_encode(['error' => 'Missing telegramUserId parameter']);
                exit();
            }
            
            $result = getMockOptimizationData($telegramUserId);
            echo json_encode($result);
            break;
            
        case 'get_social_data':
            if (empty($telegramUserId)) {
                echo json_encode(['error' => 'Missing telegramUserId parameter']);
                exit();
            }
            
            $result = getMockSocialData($telegramUserId);
            echo json_encode($result);
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action']);
    }
}

function getPredictiveAnalysis($pdo, $telegramUserId) {
    // Get user responses from last 30 days
    $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));

    // Debugging: Log the values of parameters
    error_log("DEBUG: getPredictiveAnalysis - telegramUserId: " . $telegramUserId);
    error_log("DEBUG: getPredictiveAnalysis - thirtyDaysAgo: " . $thirtyDaysAgo);

    $stmt = $pdo->prepare("
        SELECT * FROM `TelegramResponse` 
        WHERE `userId` = ? AND `answeredAt` >= ?
        ORDER BY `answeredAt` DESC
    ");
    $stmt->execute([$telegramUserId, $thirtyDaysAgo]);
    $responses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($responses)) {
        return [
            'success_probability' => 0,
            'weak_areas' => [],
            'confidence' => 'low',
            'metrics' => [
                'accuracy' => 0,
                'consistency' => 0,
                'volume_score' => 0,
                'improvement_trend' => 0
            ]
        ];
    }
    
    // Calculate metrics
    $totalResponses = count($responses);
    $correctResponses = array_filter($responses, function($r) { return $r['isCorrect']; });
    $accuracy = (count($correctResponses) / $totalResponses) * 100;
    
    // Calculate consistency (simplified)
    $consistency = min(75, $accuracy);
    
    // Volume score
    $volumeScore = min(100, ($totalResponses / 50) * 100);
    
    // Improvement trend (simplified)
    $improvementTrend = 50; // Default
    
    // Success probability
    $successProbability = ($accuracy * 0.4) + ($consistency * 0.3) + ($volumeScore * 0.2) + ($improvementTrend * 0.1);
    
    // Identify weak areas
    $weakAreas = [];
    $subjectCounts = [];
    
    foreach ($responses as $response) {
        $subject = $response['subject'] ?? 'general';
        if (!isset($subjectCounts[$subject])) {
            $subjectCounts[$subject] = ['total' => 0, 'correct' => 0];
        }
        $subjectCounts[$subject]['total']++;
        if ($response['isCorrect']) {
            $subjectCounts[$subject]['correct']++;
        }
    }
    
    foreach ($subjectCounts as $subject => $counts) {
        if ($counts['total'] > 0) {
            $subjectAccuracy = ($counts['correct'] / $counts['total']) * 100;
            if ($subjectAccuracy < 60) {
                $weakAreas[] = [
                    'subject' => $subject,
                    'accuracy' => round($subjectAccuracy),
                    'risk_level' => $subjectAccuracy < 40 ? 'high' : 'medium',
                    'total_questions' => $counts['total']
                ];
            }
        }
    }
    
    return [
        'success_probability' => round($successProbability),
        'weak_areas' => $weakAreas,
        'confidence' => $totalResponses > 50 ? 'high' : ($totalResponses > 20 ? 'medium' : 'low'),
        'metrics' => [
            'accuracy' => round($accuracy),
            'consistency' => round($consistency),
            'volume_score' => round($volumeScore),
            'improvement_trend' => round($improvementTrend)
        ]
    ];
}

function getLearningMetrics($pdo, $telegramUserId) {
    $stmt = $pdo->prepare("
        SELECT * FROM `TelegramResponse` 
        WHERE `userId` = ?
        ORDER BY `answeredAt` DESC
        LIMIT 100
    ");
    $stmt->execute([$telegramUserId]);
    $responses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($responses)) {
        return [
            'retention_curve' => [],
            'efficiency_score' => 0,
            'learning_velocity' => 0,
            'avg_response_time' => 0,
            'timeout_rate' => 0
        ];
    }
    
    // Calculate retention curve
    $retentionCurve = [
        ['day' => 1, 'retention' => 0],
        ['day' => 3, 'retention' => 0],
        ['day' => 7, 'retention' => 0],
        ['day' => 14, 'retention' => 0],
        ['day' => 30, 'retention' => 0]
    ];
    
    // Calculate efficiency score
    $avgResponseTime = 0;
    $timeoutCount = 0;
    $totalTime = 0;
    
    foreach ($responses as $response) {
        if ($response['responseTime'] > 0) {
            $totalTime += $response['responseTime'];
        }
        if ($response['responseTime'] > 30000) { // 30 seconds timeout
            $timeoutCount++;
        }
    }
    
    $avgResponseTime = $totalTime / count($responses);
    $timeoutRate = ($timeoutCount / count($responses)) * 100;
    $efficiencyScore = max(0, 100 - ($avgResponseTime / 1000) - ($timeoutRate * 2));
    
    return [
        'retention_curve' => $retentionCurve,
        'efficiency_score' => round($efficiencyScore),
        'learning_velocity' => 50, // Simplified
        'avg_response_time' => round($avgResponseTime / 1000),
        'timeout_rate' => round($timeoutRate)
    ];
}

function getOptimizationData($pdo, $telegramUserId) {
    return [
        'optimal_hours' => [
            ['hour' => 9, 'performance' => 85],
            ['hour' => 10, 'performance' => 90],
            ['hour' => 11, 'performance' => 88],
            ['hour' => 16, 'performance' => 82]
        ],
        'subject_sequence' => [
            'Estudia materias difíciles en horas de mayor rendimiento',
            'Alterna entre diferentes tipos de contenido'
        ],
        'fatigue_patterns' => [
            'optimal_session_length' => 30,
            'break_frequency' => 15,
            'peak_performance_time' => '09:00-11:00'
        ]
    ];
}

function getSocialData($pdo, $telegramUserId) {
    return [
        'user_ranking' => [
            'position' => 15,
            'total_users' => 120,
            'percentile' => 88
        ],
        'comparison_data' => [
            'your_accuracy' => 75,
            'group_average' => 68,
            'top_10_percent' => 85
        ],
        'study_group_matches' => [
            'similar_level_users' => 8,
            'potential_study_partners' => 3
        ]
    ];
}

// Mock data functions
function getMockPredictiveAnalysis($telegramUserId) {
    return [
        'success_probability' => 78,
        'weak_areas' => [
            [
                'subject' => 'derechosydeberes',
                'accuracy' => 45,
                'risk_level' => 'high',
                'total_questions' => 12
            ],
            [
                'subject' => 'disciplinario',
                'accuracy' => 62,
                'risk_level' => 'medium',
                'total_questions' => 8
            ]
        ],
        'confidence' => 'medium',
        'metrics' => [
            'accuracy' => 78,
            'consistency' => 72,
            'volume_score' => 85,
            'improvement_trend' => 65
        ]
    ];
}

function getMockLearningMetrics($telegramUserId) {
    return [
        'retention_curve' => [
            ['day' => 1, 'retention' => 85],
            ['day' => 3, 'retention' => 72],
            ['day' => 7, 'retention' => 58],
            ['day' => 14, 'retention' => 45],
            ['day' => 30, 'retention' => 32]
        ],
        'efficiency_score' => 78,
        'learning_velocity' => 65,
        'avg_response_time' => 12.5,
        'timeout_rate' => 8
    ];
}

function getMockOptimizationData($telegramUserId) {
    return [
        'optimal_hours' => [
            ['hour' => 9, 'performance' => 85],
            ['hour' => 10, 'performance' => 92],
            ['hour' => 14, 'performance' => 78],
            ['hour' => 16, 'performance' => 88]
        ],
        'subject_sequence' => [
            'derechosydeberes',
            'disciplinario',
            'carrera',
            'defensanacional'
        ],
        'fatigue_patterns' => [
            ['hour' => 12, 'fatigue_level' => 45],
            ['hour' => 15, 'fatigue_level' => 78],
            ['hour' => 18, 'fatigue_level' => 92]
        ]
    ];
}

function getMockSocialData($telegramUserId) {
    return [
        'peer_comparison' => [
            'percentile' => 75,
            'total_users' => 150,
            'rank' => 38
        ],
        'group_performance' => [
            'group_avg' => 72,
            'user_score' => 78,
            'group_size' => 25
        ],
        'improvement_trend' => [
            'weekly_growth' => 5.2,
            'monthly_growth' => 12.8,
            'consistency_score' => 78
        ]
    ];
}
?> 