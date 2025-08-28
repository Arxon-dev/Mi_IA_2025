<?php
// Test que simula la llamada AJAX desde el contexto de Moodle
require_once(__DIR__ . '/../../config.php');

// Simular los parámetros que llegan desde AJAX
$_GET['action'] = 'get_predictive_data';
$_GET['format'] = 'json';
$_GET['userid'] = '2';

echo "🧪 Test Moodle AJAX Context\n";
echo "============================\n\n";

// Debug: mostrar exactamente qué parámetros llegan
echo "📋 Parámetros GET:\n";
echo "Action: " . ($_GET['action'] ?? 'NO SET') . "\n";
echo "Format: " . ($_GET['format'] ?? 'NO SET') . "\n";
echo "UserID: " . ($_GET['userid'] ?? 'NO SET') . "\n\n";

echo "📊 Información detallada:\n";
echo "Action length: " . strlen($_GET['action']) . "\n";
echo "Action bytes: " . bin2hex($_GET['action']) . "\n";
echo "Format length: " . strlen($_GET['format']) . "\n";
echo "UserID length: " . strlen($_GET['userid']) . "\n\n";

// Usar optional_param como en analytics.php
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

// Test con diferentes tipos de PARAM
echo "🔍 Test con diferentes tipos de PARAM:\n";
$action_alpha = optional_param('action', '', PARAM_ALPHA);
$action_text = optional_param('action', '', PARAM_TEXT);
$action_raw = optional_param('action', '', PARAM_RAW);
$action_safe = optional_param('action', '', PARAM_SAFEDIR);

echo "PARAM_ALPHA: '$action_alpha'\n";
echo "PARAM_TEXT: '$action_text'\n";
echo "PARAM_RAW: '$action_raw'\n";
echo "PARAM_SAFEDIR: '$action_safe'\n\n";

// Test con $_REQUEST también
echo "🔍 Test con \$_REQUEST:\n";
echo "REQUEST action: " . ($_REQUEST['action'] ?? 'NO SET') . "\n";
echo "REQUEST format: " . ($_REQUEST['format'] ?? 'NO SET') . "\n";
echo "REQUEST userid: " . ($_REQUEST['userid'] ?? 'NO SET') . "\n\n";

// Test con $_POST también (por si acaso)
echo "🔍 Test con \$_POST:\n";
echo "POST action: " . ($_POST['action'] ?? 'NO SET') . "\n";
echo "POST format: " . ($_POST['format'] ?? 'NO SET') . "\n";
echo "POST userid: " . ($_POST['userid'] ?? 'NO SET') . "\n\n";

// Test con diferentes codificaciones
echo "🔍 Test de codificación con optional_param:\n";
$test_actions = [
    'get_predictive_data',
    trim('get_predictive_data'),
    rtrim('get_predictive_data'),
    ltrim('get_predictive_data'),
    htmlspecialchars_decode('get_predictive_data'),
    urldecode('get_predictive_data')
];

foreach ($test_actions as $i => $test_action) {
    $_GET['action'] = $test_action;
    $processed_action = optional_param('action', '', PARAM_ALPHA);
    echo "Test $i: '$test_action' -> '$processed_action'\n";
    echo "  Length: " . strlen($processed_action) . "\n";
    echo "  Bytes: " . bin2hex($processed_action) . "\n";
    echo "  Case match: " . (in_array($processed_action, ['get_predictive_data', 'get_learning_metrics', 'get_optimization_data', 'get_social_data']) ? 'SÍ' : 'NO') . "\n\n";
}
?> 