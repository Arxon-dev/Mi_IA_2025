<?php
// Real ML Analytics API endpoint
// Analyzes actual user performance data from database

require_once(__DIR__ . '/ml-analytics-functions.php');
require_once(__DIR__ . '/db-config.php');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';
$userId = $input['userId'] ?? $_GET['userId'] ?? '1';

// Create database connection
try {
    $pdo = createDatabaseConnection();
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// Subject mapping is now loaded from db-config.php

/**
 * Get user's Telegram user ID from Moodle user ID
 */
function getTelegramUserId($pdo, $moodleUserId) {
    try {
        // Try to get from Moodle integration table first
        $stmt = $pdo->prepare("
            SELECT telegram_user_id 
            FROM \"MoodleIntegration\" 
            WHERE moodle_user_id = ? AND is_verified = true
        ");
        $stmt->execute([$moodleUserId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            return $result['telegram_user_id'];
        }
        
        // Fallback: return the Moodle user ID as string (for testing)
        return (string)$moodleUserId;
    } catch (Exception $e) {
        error_log("Error getting Telegram user ID: " . $e->getMessage());
        return (string)$moodleUserId;
    }
}

/**
 * Analyze user performance by subject
 */
function analyzeUserPerformance($pdo, $telegramUserId) {
    $performance_data = [];
    
    // Get performance from TelegramResponse table
    $stmt = $pdo->prepare("
        SELECT 
            'telegram' as source,
            COUNT(*) as total_questions,
            SUM(CASE WHEN \"isCorrect\" THEN 1 ELSE 0 END) as correct_answers,
            AVG(\"responseTime\") as avg_response_time,
            MIN(\"answeredAt\") as first_attempt,
            MAX(\"answeredAt\") as last_attempt
        FROM `TelegramResponse` 
        WHERE \"userId\" = ? 
        AND \"answeredAt\" >= NOW() - INTERVAL '30 days'
    ");
    $stmt->execute([$telegramUserId]);
    $telegram_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get performance from StudyResponse table (by subject)
    $stmt = $pdo->prepare("
        SELECT 
            subject,
            COUNT(*) as total_questions,
            SUM(CASE WHEN \"isCorrect\" THEN 1 ELSE 0 END) as correct_answers,
            AVG(\"responseTime\") as avg_response_time,
            COUNT(CASE WHEN \"timedOut\" THEN 1 END) as timeouts
        FROM \"StudyResponse\" 
        WHERE \"userId\" = ? 
        AND \"answeredAt\" >= NOW() - INTERVAL '30 days'
        GROUP BY subject
    ");
    $stmt->execute([$telegramUserId]);
    $study_data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine and analyze data
    foreach ($study_data as $subject_data) {
        $total = (int)$subject_data['total_questions'];
        $correct = (int)$subject_data['correct_answers'];
        $accuracy = $total > 0 ? $correct / $total : 0;
        $avg_time = (float)$subject_data['avg_response_time'] ?? 0;
        $timeouts = (int)$subject_data['timeouts'];
        
        $performance_data[] = [
            'subject' => $subject_data['subject'],
            'total_questions' => $total,
            'correct_answers' => $correct,
            'accuracy' => $accuracy,
            'avg_response_time' => $avg_time,
            'timeout_rate' => $total > 0 ? $timeouts / $total : 0,
            'risk_score' => calculateRiskScore($accuracy, $avg_time, $timeouts, $total)
        ];
    }
    
    return $performance_data;
}

/**
 * Calculate risk score based on performance metrics
 */
function calculateRiskScore($accuracy, $avg_time, $timeouts, $total_questions) {
    $risk_score = 0;
    
    // Accuracy component (40% weight)
    if ($accuracy < 0.6) $risk_score += 40;
    elseif ($accuracy < 0.75) $risk_score += 25;
    elseif ($accuracy < 0.85) $risk_score += 10;
    
    // Response time component (30% weight)
    if ($avg_time > 45) $risk_score += 30;
    elseif ($avg_time > 30) $risk_score += 20;
    elseif ($avg_time > 20) $risk_score += 10;
    
    // Timeout rate component (20% weight)
    $timeout_rate = $total_questions > 0 ? $timeouts / $total_questions : 0;
    if ($timeout_rate > 0.3) $risk_score += 20;
    elseif ($timeout_rate > 0.15) $risk_score += 15;
    elseif ($timeout_rate > 0.05) $risk_score += 8;
    
    // Sample size component (10% weight)
    if ($total_questions < 5) $risk_score += 10;
    elseif ($total_questions < 10) $risk_score += 5;
    
    return min($risk_score, 100); // Cap at 100
}

/**
 * Generate risk level based on score
 */
function getRiskLevel($risk_score) {
    if ($risk_score >= 70) return 'high';
    if ($risk_score >= 40) return 'medium';
    return 'low';
}

/**
 * Generate recommendations based on performance
 */
function generateRecommendations($subject, $accuracy, $avg_time, $timeout_rate) {
    $recommendations = [];
    
    if ($accuracy < 0.6) {
        $recommendations[] = "Revisar conceptos fundamentales de {$subject}";
        $recommendations[] = "Practicar más preguntas de esta materia";
    }
    
    if ($avg_time > 30) {
        $recommendations[] = "Mejorar velocidad de lectura y comprensión";
        $recommendations[] = "Practicar técnicas de respuesta rápida";
    }
    
    if ($timeout_rate > 0.15) {
        $recommendations[] = "Gestionar mejor el tiempo por pregunta";
        $recommendations[] = "Practicar bajo presión temporal";
    }
    
    if (empty($recommendations)) {
        $recommendations[] = "Mantener el buen rendimiento con repaso regular";
    }
    
    return $recommendations;
}

/**
 * Generate real ML analytics data
 */
function generateRealAnalytics($action, $pdo, $telegramUserId, $subject_mapping) {
    switch ($action) {
        case 'get_predictive_data':
            $performance_data = analyzeUserPerformance($pdo, $telegramUserId);
            
            // Calculate overall success probability
            $total_accuracy = 0;
            $total_subjects = count($performance_data);
            
            if ($total_subjects > 0) {
                foreach ($performance_data as $data) {
                    $total_accuracy += $data['accuracy'];
                }
                $avg_accuracy = $total_accuracy / $total_subjects;
                $success_probability = min(95, max(30, $avg_accuracy * 100 + 10)); // Add 10% optimism boost
            } else {
                $success_probability = 75; // Default for new users
            }
            
            // Identify weak areas (top 3 highest risk scores)
            usort($performance_data, function($a, $b) {
                return $b['risk_score'] <=> $a['risk_score'];
            });
            
            $weak_areas = [];
            $top_risks = array_slice($performance_data, 0, 3);
            
            foreach ($top_risks as $risk_data) {
                if ($risk_data['risk_score'] > 20) { // Only show significant risks
                    $subject_name = $subject_mapping[strtolower($risk_data['subject'])] ?? $risk_data['subject'];
                    
                    $weak_areas[] = [
                        'subject' => $subject_name,
                        'risk_level' => getRiskLevel($risk_data['risk_score']),
                        'confidence' => round((100 - $risk_data['risk_score']) / 100, 2),
                        'accuracy' => round($risk_data['accuracy'] * 100, 1),
                        'total_questions' => $risk_data['total_questions'],
                        'recommendations' => generateRecommendations(
                            $subject_name, 
                            $risk_data['accuracy'], 
                            $risk_data['avg_response_time'], 
                            $risk_data['timeout_rate']
                        )
                    ];
                }
            }
            
            // Generate overall recommendations
            $overall_recommendations = [
                'Enfócate en las materias con mayor riesgo identificadas',
                'Dedica 30-45 minutos diarios a repasar áreas débiles',
                'Realiza simulacros regulares para mejorar la velocidad'
            ];
            
            if ($total_subjects < 5) {
                $overall_recommendations[] = 'Practica más materias para obtener un análisis más completo';
            }
            
            return [
                'success_probability' => round($success_probability),
                'weak_areas' => $weak_areas,
                'recommendations' => $overall_recommendations,
                'analysis_date' => date('Y-m-d H:i:s'),
                'data_points' => array_sum(array_column($performance_data, 'total_questions')),
                'subjects_analyzed' => $total_subjects
            ];
            
        case 'get_learning_metrics':
            // Implementation for learning metrics...
            return generateLearningMetrics($pdo, $telegramUserId);
            
        case 'get_optimization_data':
            // Implementation for optimization data...
            return generateOptimizationData($pdo, $telegramUserId);
            
        case 'get_social_data':
            // Implementation for social data...
            return generateSocialData($pdo, $telegramUserId);
            
        default:
            return ['error' => 'Invalid action'];
    }
}

// Generate and return real analytics data
try {
    $telegramUserId = getTelegramUserId($pdo, $userId);
    $response = generateRealAnalytics($action, $pdo, $telegramUserId, $subject_mapping);
    echo json_encode($response, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    error_log("ML Analytics Error: " . $e->getMessage());
    echo json_encode(['error' => 'Analysis failed: ' . $e->getMessage()]);
}
?>