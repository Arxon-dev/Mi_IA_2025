<?php
// Test que simula exactamente la llamada AJAX de analytics.php
require_once(__DIR__ . '/../../config.php');

// Simular los parámetros que llegan desde AJAX
$_GET['action'] = 'get_predictive_data';
$_GET['format'] = 'json';
$_GET['userid'] = '2';

// Debug: mostrar exactamente qué parámetros llegan
echo "🧪 Test Analytics AJAX Simulation\n";
echo "================================\n\n";

echo "📋 Parámetros GET:\n";
echo "Action: " . ($_GET['action'] ?? 'NO SET') . "\n";
echo "Format: " . ($_GET['format'] ?? 'NO SET') . "\n";
echo "UserID: " . ($_GET['userid'] ?? 'NO SET') . "\n\n";

echo "📊 Información detallada:\n";
echo "Action length: " . strlen($_GET['action']) . "\n";
echo "Action bytes: " . bin2hex($_GET['action']) . "\n";
echo "Format length: " . strlen($_GET['format']) . "\n";
echo "UserID length: " . strlen($_GET['userid']) . "\n\n";

// Simular la lógica de analytics.php
$action = optional_param('action', '', PARAM_ALPHA);
$format = optional_param('format', 'html', PARAM_ALPHA);
$userid = optional_param('userid', 0, PARAM_INT);

echo "🔍 Después de optional_param:\n";
echo "Action: '$action'\n";
echo "Format: '$format'\n";
echo "UserID: $userid\n\n";

echo "📏 Longitudes después de optional_param:\n";
echo "Action length: " . strlen($action) . "\n";
echo "Format length: " . strlen($format) . "\n";
echo "UserID length: " . strlen($userid) . "\n\n";

// Verificar si entraría en la condición AJAX
if ($action && $format === 'json') {
    echo "✅ CONDICIÓN AJAX CUMPLIDA\n";
    echo "Action: '$action'\n";
    echo "Format: '$format'\n";
    echo "UserID: $userid\n\n";
    
    // Simular handle_ajax_request
    echo "🎯 Simulando handle_ajax_request...\n";
    
    switch ($action) {
        case 'get_predictive_data':
            echo "✅ Case get_predictive_data matched\n";
            break;
        case 'get_learning_metrics':
            echo "✅ Case get_learning_metrics matched\n";
            break;
        case 'get_optimization_data':
            echo "✅ Case get_optimization_data matched\n";
            break;
        case 'get_social_data':
            echo "✅ Case get_social_data matched\n";
            break;
        default:
            echo "❌ No case matched for action: '$action'\n";
            echo "Available cases: get_predictive_data, get_learning_metrics, get_optimization_data, get_social_data\n";
    }
} else {
    echo "❌ CONDICIÓN AJAX NO CUMPLIDA\n";
    echo "Action: '$action' (truthy: " . ($action ? 'true' : 'false') . ")\n";
    echo "Format: '$format' (=== 'json': " . ($format === 'json' ? 'true' : 'false') . ")\n";
    echo "UserID: $userid\n\n";
}

echo "🔍 Comparación con test ultra simple:\n";
echo "Test ultra simple action: 'get_predictive_data'\n";
echo "Test ultra simple format: 'json'\n";
echo "Test ultra simple userid: '2'\n\n";

echo "📊 Diferencias:\n";
echo "Action igual: " . ($action === 'get_predictive_data' ? 'SÍ' : 'NO') . "\n";
echo "Format igual: " . ($format === 'json' ? 'SÍ' : 'NO') . "\n";
echo "UserID igual: " . ($userid == 2 ? 'SÍ' : 'NO') . "\n";
?> 