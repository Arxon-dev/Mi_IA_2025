<?php
/**
 * ML Analytics Hybrid Data Provider
 * Provides data access functions for ML analytics using MySQL connection
 */

// Include the bridge client
require_once 'ml-analytics-bridge.php';

function getPredictiveAnalysis($telegramUserId) {
    // Use MySQL endpoint instead of PostgreSQL
    $url = "/local/telegram_integration/direct-ml-bridge-mysql.php?action=get_predictive_data&telegramUserId=" . urlencode($telegramUserId);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://campus.opomelilla.com' . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return ['error' => 'Failed to connect to MySQL ML bridge'];
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => 'Invalid JSON response from MySQL ML bridge'];
    }
    
    return $data;
}

function getLearningMetrics($telegramUserId) {
    $url = "/local/telegram_integration/direct-ml-bridge-mysql.php?action=get_learning_metrics&telegramUserId=" . urlencode($telegramUserId);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://campus.opomelilla.com' . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return ['error' => 'Failed to connect to MySQL ML bridge'];
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => 'Invalid JSON response from MySQL ML bridge'];
    }
    
    return $data;
}

function getOptimizationAnalysis($telegramUserId) {
    $url = "/local/telegram_integration/direct-ml-bridge-mysql.php?action=get_optimization_data&telegramUserId=" . urlencode($telegramUserId);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://campus.opomelilla.com' . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return ['error' => 'Failed to connect to MySQL ML bridge'];
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => 'Invalid JSON response from MySQL ML bridge'];
    }
    
    return $data;
}

function getSocialAnalysis($telegramUserId) {
    $url = "/local/telegram_integration/direct-ml-bridge-mysql.php?action=get_social_data&telegramUserId=" . urlencode($telegramUserId);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://campus.opomelilla.com' . $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return ['error' => 'Failed to connect to MySQL ML bridge'];
    }
    
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => 'Invalid JSON response from MySQL ML bridge'];
    }
    
    return $data;
}

// Subject name mapping for Spanish military exam subjects
function formatSubjectName($subject) {
    $subjectMap = [
        'carrera' => 'Ley de Carrera Militar',
        'defensanacional' => 'Ley Orgánica 5/2005 Defensa Nacional',
        'disciplinario' => 'Régimen Disciplinario',
        'derechosydeberes' => 'Derechos y Deberes de los Miembros de las FAS',
        'igualdad' => 'Ley de Igualdad',
        'general' => 'Conocimientos Generales'
    ];
    
    return $subjectMap[$subject] ?? ucfirst($subject);
}

// Error message formatting
function getErrorMessage($error) {
    $errorMessages = [
        'connection_failed' => 'Error de conexión con el servidor de análisis',
        'invalid_user' => 'Usuario no válido o sin datos suficientes',
        'timeout' => 'Tiempo de espera agotado',
        'server_error' => 'Error interno del servidor'
    ];
    
    return $errorMessages[$error] ?? 'Error desconocido: ' . $error;
}
?> 