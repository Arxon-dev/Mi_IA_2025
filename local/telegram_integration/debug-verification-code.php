<?php
// Debug específico para códigos de verificación
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/locallib.php');

echo "<h2>🔍 Diagnóstico de Código de Verificación</h2>";

// Código específico a investigar
$test_code = '289181';

echo "<h3>1. Búsqueda del Código: {$test_code}</h3>";

// Buscar el código específico
try {
    global $DB;
    
    // Buscar código sin importar el estado
    $all_records = $DB->get_records('local_telegram_verification', 
        ['verification_code' => $test_code]);
    
    if (empty($all_records)) {
        echo "❌ <strong>PROBLEMA ENCONTRADO:</strong> El código {$test_code} NO existe en la base de datos<br>";
        echo "💡 <strong>Solución:</strong> El usuario necesita generar un nuevo código<br><br>";
    } else {
        echo "✅ Código encontrado en la base de datos<br>";
        
        foreach ($all_records as $record) {
            echo "<div style='border: 1px solid #ccc; padding: 10px; margin: 10px 0;'>";
            echo "<strong>Detalles del registro:</strong><br>";
            echo "• ID: {$record->id}<br>";
            echo "• Moodle User ID: {$record->moodle_userid}<br>";
            echo "• Código: {$record->verification_code}<br>";
            echo "• Verificado: " . ($record->is_verified ? '✅ SÍ' : '❌ NO') . "<br>";
            echo "• Creado: " . date('Y-m-d H:i:s', $record->created_at) . "<br>";
            echo "• Expira: " . date('Y-m-d H:i:s', $record->expires_at) . "<br>";
            
            $now = time();
            if ($record->expires_at < $now) {
                $expired_minutes = round(($now - $record->expires_at) / 60);
                echo "• <strong style='color: red;'>⏰ EXPIRADO hace {$expired_minutes} minutos</strong><br>";
            } else {
                $remaining_minutes = round(($record->expires_at - $now) / 60);
                echo "• <strong style='color: green;'>⏰ Válido por {$remaining_minutes} minutos más</strong><br>";
            }
            
            if ($record->is_verified) {
                echo "• <strong style='color: orange;'>⚠️ YA VERIFICADO</strong> - No se puede usar de nuevo<br>";
                if (!empty($record->telegram_userid)) {
                    echo "• Telegram User ID: {$record->telegram_userid}<br>";
                }
                if (!empty($record->telegram_username)) {
                    echo "• Telegram Username: @{$record->telegram_username}<br>";
                }
            }
            echo "</div>";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error consultando la base de datos: " . $e->getMessage() . "<br>";
}

echo "<h3>2. Estado General de Códigos de Verificación</h3>";

try {
    // Estadísticas generales
    $total_codes = $DB->count_records('local_telegram_verification');
    $verified_codes = $DB->count_records('local_telegram_verification', ['is_verified' => 1]);
    $unverified_codes = $DB->count_records('local_telegram_verification', ['is_verified' => 0]);
    
    echo "📊 <strong>Estadísticas:</strong><br>";
    echo "• Total de códigos: {$total_codes}<br>";
    echo "• Códigos verificados: {$verified_codes}<br>";
    echo "• Códigos pendientes: {$unverified_codes}<br><br>";
    
    // Códigos expirados
    $expired_codes = $DB->count_records_select('local_telegram_verification', 
        'expires_at < ? AND is_verified = 0', [time()]);
    echo "⏰ Códigos expirados sin verificar: {$expired_codes}<br><br>";
    
    // Últimos códigos generados
    echo "<strong>Últimos 5 códigos generados:</strong><br>";
    $recent_codes = $DB->get_records('local_telegram_verification', null, 
        'created_at DESC', '*', 0, 5);
    
    if (!empty($recent_codes)) {
        echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
        echo "<tr style='background: #f0f0f0;'><th>Código</th><th>Usuario</th><th>Estado</th><th>Creado</th><th>Expira</th></tr>";
        
        foreach ($recent_codes as $code) {
            $status = $code->is_verified ? '✅ Verificado' : 
                     ($code->expires_at < time() ? '⏰ Expirado' : '⏳ Pendiente');
            $created = date('H:i:s', $code->created_at);
            $expires = date('H:i:s', $code->expires_at);
            
            echo "<tr>";
            echo "<td><strong>{$code->verification_code}</strong></td>";
            echo "<td>{$code->moodle_userid}</td>";
            echo "<td>{$status}</td>";
            echo "<td>{$created}</td>";
            echo "<td>{$expires}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (Exception $e) {
    echo "❌ Error obteniendo estadísticas: " . $e->getMessage() . "<br>";
}

echo "<h3>3. Recomendaciones</h3>";
echo "<div style='background: #e8f4fd; padding: 15px; border-left: 4px solid #2196f3;'>";
echo "<strong>💡 Para solucionar el problema:</strong><br><br>";
echo "1. <strong>Generar un nuevo código:</strong> Ve a <a href='verify.php'>verify.php</a> y haz clic en 'Generar Código'<br>";
echo "2. <strong>Usar el código inmediatamente:</strong> Los códigos expiran en 15 minutos<br>";
echo "3. <strong>Verificar que el comando sea correcto:</strong> <code>/codigo_moodle TU_CODIGO_AQUI</code><br>";
echo "4. <strong>Asegurarse de usar el bot correcto:</strong> @OpoMelillaBot<br><br>";
echo "<strong>⚠️ Nota importante:</strong> Cada código solo se puede usar una vez. Si ya fue verificado, necesitas generar uno nuevo.<br>";
echo "</div>";

echo "<h3>4. Test de Función de Verificación</h3>";

// Test de la función de verificación
echo "<strong>Probando función local_telegram_integration_verify_code():</strong><br>";

$test_telegram_data = [
    'telegram_userid' => 'test_user_id',
    'username' => 'test_username'
];

$result = local_telegram_integration_verify_code($test_code, $test_telegram_data);
echo "Resultado: " . ($result ? '✅ TRUE' : '❌ FALSE') . "<br>";
echo "<em>Nota: Este test no modifica datos reales, solo verifica la lógica</em><br>";

?>