<?php
// Test de datos mock
echo "🧪 Test Mock Data\n";
echo "================\n\n";

// Simular llamada a direct-ml-bridge.php
$_GET['action'] = 'get_predictive_data';
$_GET['telegramUserId'] = '123456';
$_GET['format'] = 'json';

echo "📋 Parámetros de prueba:\n";
echo "Action: " . $_GET['action'] . "\n";
echo "TelegramUserId: " . $_GET['telegramUserId'] . "\n";
echo "Format: " . $_GET['format'] . "\n\n";

// Incluir el archivo direct-ml-bridge.php
ob_start();
include 'direct-ml-bridge.php';
$output = ob_get_clean();

echo "📄 Respuesta del sistema:\n";
echo $output . "\n\n";

// Decodificar JSON para verificar estructura
$data = json_decode($output, true);
if ($data) {
    echo "✅ JSON válido\n";
    echo "Estructura de datos:\n";
    echo "- Success probability: " . ($data['success_probability'] ?? 'NO SET') . "\n";
    echo "- Weak areas count: " . count($data['weak_areas'] ?? []) . "\n";
    echo "- Confidence: " . ($data['confidence'] ?? 'NO SET') . "\n";
    
    if (isset($data['weak_areas']) && !empty($data['weak_areas'])) {
        echo "\n📊 Áreas débiles:\n";
        foreach ($data['weak_areas'] as $area) {
            echo "- " . ($area['subject'] ?? 'NO SUBJECT') . ": " . ($area['accuracy'] ?? 'NO ACCURACY') . "% (" . ($area['risk_level'] ?? 'NO RISK') . ")\n";
        }
    }
} else {
    echo "❌ JSON inválido\n";
    echo "Error: " . json_last_error_msg() . "\n";
}

echo "\n🎯 Test completado\n";
?> 