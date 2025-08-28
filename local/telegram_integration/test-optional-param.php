<?php
// Test simple para verificar optional_param
echo "🧪 Test Optional Param\n";
echo "=====================\n\n";

// Simular los parámetros
$_GET['action'] = 'get_predictive_data';
$_GET['format'] = 'json';
$_GET['userid'] = '2';

echo "📋 Parámetros originales:\n";
echo "Action: " . $_GET['action'] . "\n";
echo "Format: " . $_GET['format'] . "\n";
echo "UserID: " . $_GET['userid'] . "\n\n";

// Simular optional_param manualmente
function simulate_optional_param($name, $default, $type) {
    $value = $_GET[$name] ?? $default;
    
    // Simular PARAM_ALPHA (solo letras)
    if ($type === 'ALPHA') {
        $value = preg_replace('/[^a-zA-Z]/', '', $value);
    }
    // Simular PARAM_TEXT (texto limpio, mantiene guiones bajos)
    elseif ($type === 'TEXT') {
        $value = clean_param($value, PARAM_TEXT);
    }
    // Simular PARAM_INT (solo números)
    elseif ($type === 'INT') {
        $value = intval($value);
    }
    
    return $value;
}

// Función simple para simular clean_param
function clean_param($param, $type) {
    if ($type === 'TEXT') {
        // Simular PARAM_TEXT - permite guiones bajos
        return preg_replace('/[^a-zA-Z0-9_-]/', '', $param);
    }
    return $param;
}

// Procesar con PARAM_ALPHA (problemático)
$action_alpha = simulate_optional_param('action', '', 'ALPHA');
$format_alpha = simulate_optional_param('format', 'html', 'ALPHA');
$userid_alpha = simulate_optional_param('userid', 0, 'INT');

echo "🔍 Con PARAM_ALPHA (problemático):\n";
echo "Action: '$action_alpha'\n";
echo "Format: '$format_alpha'\n";
echo "UserID: $userid_alpha\n\n";

// Verificar condición con PARAM_ALPHA
if ($action_alpha && $format_alpha === 'json') {
    echo "✅ CONDICIÓN CUMPLIDA (ALPHA)\n";
    
    switch ($action_alpha) {
        case 'get_predictive_data':
            echo "✅ Case matched (ALPHA)\n";
            break;
        default:
            echo "❌ No case matched (ALPHA) - Action: '$action_alpha'\n";
    }
} else {
    echo "❌ CONDICIÓN NO CUMPLIDA (ALPHA)\n";
}

// Procesar con PARAM_TEXT (correcto)
$action_text = simulate_optional_param('action', '', 'TEXT');
$format_text = simulate_optional_param('format', 'html', 'TEXT');
$userid_text = simulate_optional_param('userid', 0, 'INT');

echo "\n🔍 Con PARAM_TEXT (correcto):\n";
echo "Action: '$action_text'\n";
echo "Format: '$format_text'\n";
echo "UserID: $userid_text\n\n";

// Verificar condición con PARAM_TEXT
if ($action_text && $format_text === 'json') {
    echo "✅ CONDICIÓN CUMPLIDA (TEXT)\n";
    
    switch ($action_text) {
        case 'get_predictive_data':
            echo "✅ Case matched (TEXT)\n";
            break;
        default:
            echo "❌ No case matched (TEXT) - Action: '$action_text'\n";
    }
} else {
    echo "❌ CONDICIÓN NO CUMPLIDA (TEXT)\n";
}

echo "\n🔍 Comparación:\n";
echo "Original: 'get_predictive_data'\n";
echo "PARAM_ALPHA: '$action_alpha'\n";
echo "PARAM_TEXT: '$action_text'\n";
echo "Iguales: " . ($action_text === 'get_predictive_data' ? 'SÍ' : 'NO') . "\n";
?> 