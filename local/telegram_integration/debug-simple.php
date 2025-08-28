<?php
/**
 * Debug simple - paso a paso
 */

// Paso 1: Verificar que podemos incluir config
echo "1. Incluyendo config.php...\n";
require_once(__DIR__ . '/../../config.php');
echo "✅ Config incluido\n";

// Paso 2: Verificar autenticación básica
echo "2. Verificando autenticación...\n";
require_login();
echo "✅ Usuario autenticado: " . $USER->username . " (ID: " . $USER->id . ")\n";

// Paso 3: Incluir lib.php
echo "3. Incluyendo lib.php...\n";
require_once(__DIR__ . '/lib.php');
echo "✅ lib.php incluido\n";

// Paso 4: Probar función básica
echo "4. Probando get_telegram_uuid_from_moodle_user_id...\n";
try {
    $uuid = get_telegram_uuid_from_moodle_user_id($USER->id);
    echo "✅ UUID obtenido: " . ($uuid ? $uuid : 'null') . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

// Paso 5: Probar estadísticas del sistema
echo "5. Probando get_telegram_system_stats...\n";
try {
    $stats = get_telegram_system_stats();
    if ($stats !== false) {
        echo "✅ Stats obtenidas:\n";
        print_r($stats);
    } else {
        echo "❌ Stats devolvieron false\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

// Paso 6: Headers JSON
echo "6. Enviando headers JSON...\n";
header('Content-Type: application/json');
echo "✅ Headers enviados\n";

// Paso 7: JSON simple
echo "7. Enviando JSON...\n";
$response = ['success' => true, 'message' => 'Test exitoso', 'user_id' => $USER->id];
echo json_encode($response);
echo "\n✅ JSON enviado\n";

echo "🎉 Debug completado sin errores fatales\n";
?> 