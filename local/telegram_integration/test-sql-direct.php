<?php
/**
 * Test SQL Directo - Verificar tablas sin prefijo mdl_
 * BD: u449034524_moodel_telegra
 */

require_once(__DIR__ . '/../../config.php');
require_login();

global $DB, $USER;

header('Content-Type: text/html; charset=utf-8');
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test SQL Directo - Tablas sin Prefijo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .status-ok { color: green; font-weight: bold; }
        .status-error { color: red; font-weight: bold; }
    </style>
</head>
<body>

<h1>🔧 Test SQL Directo - Tablas sin Prefijo</h1>
<div class="test-section info">
    <strong>BD:</strong> u449034524_moodel_telegra<br>
    <strong>Usuario:</strong> <?php echo $USER->username; ?> (ID: <?php echo $USER->id; ?>)
</div>

<?php

// Test 1: Verificar tablas con SQL directo
echo "<div class='test-section'>";
echo "<h3>📊 1. Test SQL Directo - Verificación de Tablas</h3>";
echo "<table>";
echo "<tr><th>Tabla</th><th>Estado</th><th>Registros</th><th>Muestra</th></tr>";

$tables = ['moodleuserlink', 'telegramuser', 'telegramresponse'];

foreach ($tables as $table) {
    try {
        // Contar registros
        $count = $DB->get_field_sql("SELECT COUNT(*) FROM $table");
        
        // Obtener muestra
        $sample = $DB->get_record_sql("SELECT * FROM $table LIMIT 1");
        
        echo "<tr>";
        echo "<td>$table</td>";
        echo "<td class='status-ok'>✅ Existe</td>";
        echo "<td>$count</td>";
        echo "<td>" . ($sample ? "✅ Datos" : "❌ Vacía") . "</td>";
        echo "</tr>";
        
    } catch (Exception $e) {
        echo "<tr>";
        echo "<td>$table</td>";
        echo "<td class='status-error'>❌ Error</td>";
        echo "<td>N/A</td>";
        echo "<td>" . htmlspecialchars($e->getMessage()) . "</td>";
        echo "</tr>";
    }
}

echo "</table>";
echo "</div>";

// Test 2: Verificar mapeo del usuario actual
echo "<div class='test-section'>";
echo "<h3>🔍 2. Test Mapeo Usuario Actual</h3>";

try {
    $sql = "SELECT * FROM moodleuserlink WHERE moodleuserid = ? AND isactive = 1";
    $mapping = $DB->get_record_sql($sql, [$USER->id]);
    
    if ($mapping) {
        echo "<div class='success'>";
        echo "<strong>✅ Usuario mapeado encontrado:</strong><br>";
        echo "- Telegram User ID: " . htmlspecialchars($mapping->telegramuserid) . "<br>";
        echo "- Username: " . htmlspecialchars($mapping->moodleusername) . "<br>";
        echo "- Email: " . htmlspecialchars($mapping->moodleemail) . "<br>";
        echo "- Activo: " . ($mapping->isactive ? 'Sí' : 'No') . "<br>";
        echo "</div>";
        
        // Test 3: Estadísticas del usuario
        echo "<h3>📈 3. Estadísticas del Usuario Telegram</h3>";
        
        $telegram_uuid = $mapping->telegramuserid;
        
        // Total respuestas
        $total_responses = $DB->get_field_sql("SELECT COUNT(*) FROM telegramresponse WHERE userid = ?", [$telegram_uuid]);
        
        // Respuestas correctas
        $correct_responses = $DB->get_field_sql("SELECT COUNT(*) FROM telegramresponse WHERE userid = ? AND iscorrect = 1", [$telegram_uuid]);
        
        // Tasa de éxito
        $success_rate = $total_responses > 0 ? round(($correct_responses / $total_responses) * 100, 2) : 0;
        
        echo "<div class='success'>";
        echo "<strong>📊 Estadísticas Reales:</strong><br>";
        echo "- Total Preguntas: $total_responses<br>";
        echo "- Respuestas Correctas: $correct_responses<br>";
        echo "- Tasa de Éxito: $success_rate%<br>";
        echo "</div>";
        
    } else {
        echo "<div class='error'>";
        echo "❌ Usuario no mapeado con Telegram<br>";
        echo "Usuario Moodle ID: " . $USER->id . " no encontrado en moodleuserlink";
        echo "</div>";
        
        // Mostrar usuarios mapeados disponibles
        echo "<h4>👥 Usuarios Mapeados Disponibles:</h4>";
        $mapped_users = $DB->get_records_sql("SELECT * FROM moodleuserlink WHERE isactive = 1 LIMIT 5");
        
        if ($mapped_users) {
            echo "<table>";
            echo "<tr><th>Moodle ID</th><th>Username</th><th>Telegram UUID</th></tr>";
            foreach ($mapped_users as $user) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($user->moodleuserid) . "</td>";
                echo "<td>" . htmlspecialchars($user->moodleusername) . "</td>";
                echo "<td>" . htmlspecialchars(substr($user->telegramuserid, 0, 20)) . "...</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    }
    
} catch (Exception $e) {
    echo "<div class='error'>";
    echo "❌ Error verificando mapeo: " . htmlspecialchars($e->getMessage());
    echo "</div>";
}

echo "</div>";

// Test 4: Estadísticas del sistema
echo "<div class='test-section'>";
echo "<h3>🌍 4. Estadísticas del Sistema</h3>";

try {
    $total_users = $DB->get_field_sql("SELECT COUNT(*) FROM telegramuser");
    $total_responses = $DB->get_field_sql("SELECT COUNT(*) FROM telegramresponse");
    $total_correct = $DB->get_field_sql("SELECT COUNT(*) FROM telegramresponse WHERE iscorrect = 1");
    $active_mappings = $DB->get_field_sql("SELECT COUNT(*) FROM moodleuserlink WHERE isactive = 1");
    
    $global_success_rate = $total_responses > 0 ? round(($total_correct / $total_responses) * 100, 2) : 0;
    
    echo "<div class='success'>";
    echo "<strong>📊 Estadísticas Globales:</strong><br>";
    echo "- Total Usuarios Telegram: $total_users<br>";
    echo "- Total Respuestas: $total_responses<br>";
    echo "- Respuestas Correctas: $total_correct<br>";
    echo "- Mapeos Activos: $active_mappings<br>";
    echo "- Tasa Éxito Global: $global_success_rate%<br>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='error'>";
    echo "❌ Error obteniendo estadísticas: " . htmlspecialchars($e->getMessage());
    echo "</div>";
}

echo "</div>";

?>

<div class='test-section info'>
    <h3>🔄 Próximos Pasos</h3>
    <ul>
        <li><strong>Si las tablas existen:</strong> El problema está resuelto, verificar analytics.php</li>
        <li><strong>Si hay datos del usuario:</strong> Las funciones deberían funcionar correctamente</li>
        <li><strong>Si todo funciona:</strong> <a href="analytics.php" target="_blank">Probar Analytics Principal</a></li>
    </ul>
</div>

</body>
</html> 