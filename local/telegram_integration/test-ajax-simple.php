<?php
/**
 * Test Simple de AJAX
 * Archivo: test-ajax-simple.php
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/telegram_integration/lib.php');

// Handle AJAX requests
$action = optional_param('action', '', PARAM_ALPHANUMEXT);
$format = optional_param('format', 'html', PARAM_ALPHA);
$userid = optional_param('userid', '', PARAM_RAW);

echo "<h1>🧪 Test Simple de AJAX</h1>";

echo "<h2>📋 Parámetros Recibidos</h2>";
echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px;'>";
echo "Action: " . htmlspecialchars($action) . "<br>";
echo "Format: " . htmlspecialchars($format) . "<br>";
echo "UserID: " . htmlspecialchars($userid) . "<br>";
echo "</div>";

if ($action && $format === 'json') {
    // NO output HTML before JSON - set header first
    header('Content-Type: application/json');
    
    // Test simple response
    $response = [
        'action' => $action,
        'userid' => $userid,
        'timestamp' => time(),
        'message' => 'AJAX funcionando correctamente'
    ];
    
    switch ($action) {
        case 'get_predictive_data':
            $response['data'] = [
                'success_probability' => 75.5,
                'weak_areas' => ['Test Area 1', 'Test Area 2'],
                'recommendations' => ['Test Recommendation'],
                'confidence' => 85
            ];
            break;
            
        case 'get_learning_metrics':
            $response['data'] = [
                'total_questions' => 100,
                'correct_answers' => 75,
                'accuracy_rate' => 75.0,
                'avg_response_time' => 15.5,
                'learning_trend' => 'Mejorando'
            ];
            break;
            
        case 'get_optimization_data':
            $response['data'] = [
                'optimal_hours' => [
                    ['hour' => 9, 'performance' => 85],
                    ['hour' => 11, 'performance' => 80]
                ],
                'subject_sequence' => ['Recomendación test'],
                'fatigue_patterns' => ['optimal_session_length' => 30]
            ];
            break;
            
        case 'get_social_data':
            $response['data'] = [
                'benchmarking' => ['your_percentile' => 75],
                'success_strategies' => ['Estrategia test'],
                'compatible_groups' => []
            ];
            break;
            
        default:
            $response['error'] = 'Acción no reconocida';
    }
    
    echo json_encode($response);
    exit;
}

echo "<h2>🧪 Test de Solicitudes AJAX</h2>";
echo "<div style='background: #f9f9f9; padding: 15px; border-radius: 5px;'>";

// Test buttons
$test_urls = [
    'get_predictive_data' => 'Análisis Predictivo',
    'get_learning_metrics' => 'Métricas de Aprendizaje', 
    'get_optimization_data' => 'Datos de Optimización',
    'get_social_data' => 'Análisis Social'
];

foreach ($test_urls as $action => $label) {
    $url = "test-ajax-simple.php?action={$action}&format=json&userid=test-user-123";
    echo "<p><a href='$url' target='_blank'>🔗 Test $label</a></p>";
}

echo "</div>";

echo "<h2>📊 Test con JavaScript</h2>";
echo "<div id='ajax-results'></div>";

echo "<script>
async function testAjax(action) {
    const url = 'test-ajax-simple.php?action=' + action + '&format=json&userid=test-user-123';
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        document.getElementById('ajax-results').innerHTML += 
            '<div style=\"background: #e8f5e8; padding: 10px; margin: 5px 0; border-radius: 5px;\">' +
            '<strong>' + action + ':</strong> ' + JSON.stringify(data, null, 2) +
            '</div>';
    } catch (error) {
        document.getElementById('ajax-results').innerHTML += 
            '<div style=\"background: #ffe6e6; padding: 10px; margin: 5px 0; border-radius: 5px;\">' +
            '<strong>Error en ' + action + ':</strong> ' + error.message +
            '</div>';
    }
}

// Test all actions
['get_predictive_data', 'get_learning_metrics', 'get_optimization_data', 'get_social_data'].forEach(action => {
    setTimeout(() => testAjax(action), 500);
});
</script>";

?> 