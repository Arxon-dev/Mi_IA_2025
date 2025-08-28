<?php
/**
 * Test directo del API analytics-api.php
 * Verificar si el endpoint funciona correctamente
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Verificar autenticación
require_login();

echo "<!DOCTYPE html>";
echo "<html><head><meta charset='UTF-8'><title>Test API Analytics</title>";
echo "<style>body{font-family:Arial;margin:20px;} .success{color:green;} .error{color:red;} .info{color:blue;}</style>";
echo "</head><body>";

echo "<h1>🧪 Test Directo del API Analytics</h1>";

echo "<h2>📋 Información de Usuario</h2>";
echo "<p><strong>Usuario actual:</strong> " . $USER->username . " (ID: " . $USER->id . ")</p>";

echo "<h2>🔗 Test 1: Verificar Vinculación Telegram</h2>";
$telegram_uuid = get_telegram_uuid_from_moodle_user_id($USER->id);
if ($telegram_uuid) {
    echo "<p class='success'>✅ Usuario vinculado con Telegram UUID: $telegram_uuid</p>";
} else {
    echo "<p class='error'>❌ Usuario NO vinculado con Telegram</p>";
}

echo "<h2>📊 Test 2: Llamada AJAX Simulada - get_user_stats</h2>";

// Simular la llamada AJAX
$_GET['action'] = 'get_user_stats';
$_GET['user_id'] = $USER->id;

// Capturar el output del API
ob_start();
try {
    include(__DIR__ . '/analytics-api.php');
    $api_response = ob_get_contents();
} catch (Exception $e) {
    $api_response = "Error: " . $e->getMessage();
}
ob_end_clean();

echo "<h3>Respuesta del API:</h3>";
echo "<pre style='background:#f0f0f0;padding:10px;border:1px solid #ccc;'>";
echo htmlspecialchars($api_response);
echo "</pre>";

// Intentar decodificar JSON
$decoded = json_decode($api_response, true);
if ($decoded) {
    echo "<h3>JSON Decodificado:</h3>";
    echo "<pre style='background:#e8f5e8;padding:10px;border:1px solid #8c8;'>";
    print_r($decoded);
    echo "</pre>";
    
    if (isset($decoded['success']) && $decoded['success']) {
        echo "<p class='success'>✅ API response exitosa</p>";
    } else {
        echo "<p class='error'>❌ API response con error: " . ($decoded['message'] ?? 'desconocido') . "</p>";
    }
} else {
    echo "<p class='error'>❌ Respuesta no es JSON válido</p>";
}

echo "<h2>🌐 Test 3: Llamada AJAX Simulada - get_system_stats</h2>";

// Reset y nueva llamada
unset($_GET['user_id']);
$_GET['action'] = 'get_system_stats';

ob_start();
try {
    include(__DIR__ . '/analytics-api.php');
    $api_response2 = ob_get_contents();
} catch (Exception $e) {
    $api_response2 = "Error: " . $e->getMessage();
}
ob_end_clean();

echo "<h3>Respuesta del API (System Stats):</h3>";
echo "<pre style='background:#f0f0f0;padding:10px;border:1px solid #ccc;'>";
echo htmlspecialchars($api_response2);
echo "</pre>";

$decoded2 = json_decode($api_response2, true);
if ($decoded2) {
    echo "<h3>JSON Decodificado (System):</h3>";
    echo "<pre style='background:#e8f5e8;padding:10px;border:1px solid #8c8;'>";
    print_r($decoded2);
    echo "</pre>";
}

echo "<h2>🔧 Test 4: Verificar Funciones del lib.php</h2>";

// Test de funciones individuales
echo "<h3>Función get_telegram_system_stats():</h3>";
$system_stats = get_telegram_system_stats();
if ($system_stats !== false) {
    echo "<pre style='background:#e8f5e8;padding:10px;border:1px solid #8c8;'>";
    print_r($system_stats);
    echo "</pre>";
} else {
    echo "<p class='error'>❌ Error obteniendo system stats</p>";
}

echo "<h3>Función verify_telegram_tables():</h3>";
$tables_status = verify_telegram_tables();
if ($tables_status !== false) {
    echo "<pre style='background:#e8f5e8;padding:10px;border:1px solid #8c8;'>";
    print_r($tables_status);
    echo "</pre>";
} else {
    echo "<p class='error'>❌ Error verificando tablas</p>";
}

echo "<h2>🎯 Conclusiones</h2>";
echo "<ul>";
if ($telegram_uuid) {
    echo "<li class='success'>✅ Usuario correctamente vinculado</li>";
} else {
    echo "<li class='error'>❌ Usuario no vinculado - datos esperados en 0</li>";
}

if ($decoded && isset($decoded['success']) && $decoded['success']) {
    echo "<li class='success'>✅ API get_user_stats funciona</li>";
} else {
    echo "<li class='error'>❌ API get_user_stats con problemas</li>";
}

if ($decoded2 && isset($decoded2['success']) && $decoded2['success']) {
    echo "<li class='success'>✅ API get_system_stats funciona</li>";
} else {
    echo "<li class='error'>❌ API get_system_stats con problemas</li>";
}
echo "</ul>";

echo "<hr>";
echo "<p><strong>📝 URL de Test:</strong> <a href='" . new moodle_url('/local/telegram_integration/analytics-api.php', ['action' => 'get_user_stats', 'user_id' => $USER->id]) . "' target='_blank'>Probar API en nueva ventana</a></p>";

echo "</body></html>";
?> 