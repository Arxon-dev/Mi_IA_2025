<?php
/**
 * Test Analytics Final - BD Unificada
 * Prueba las funciones corregidas con nombres de tablas correctos
 * BD: u449034524_moodel_telegra
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Verificar autenticación
require_login();

header('Content-Type: text/html; charset=utf-8');
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Analytics Final - BD Unificada</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow: auto; }
        .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .data-table th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>🔧 Test Analytics Final - BD Unificada</h1>
    <p><strong>BD:</strong> <?php echo $CFG->dbname; ?></p>
    <p><strong>Usuario:</strong> <?php echo $USER->username; ?> (ID: <?php echo $USER->id; ?>)</p>

    <?php
    echo "<div class='test-section info'>";
    echo "<h2>📊 1. Verificación de Tablas Corregidas</h2>";
    
    try {
        $table_verification = verify_telegram_tables();
        
        if ($table_verification) {
            echo "<table class='data-table'>";
            echo "<tr><th>Tabla</th><th>Estado</th><th>Registros</th></tr>";
            
            foreach ($table_verification as $table => $info) {
                $status = $info['exists'] ? '✅ Existe' : '❌ No existe';
                $count = $info['exists'] ? number_format($info['count']) : 'N/A';
                echo "<tr><td>{$table}</td><td>{$status}</td><td>{$count}</td></tr>";
            }
            echo "</table>";
        } else {
            echo "<p class='error'>❌ Error verificando tablas</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
    
    echo "</div>";

    echo "<div class='test-section info'>";
    echo "<h2>🔍 2. Test de Función UUID</h2>";
    
    try {
        $telegram_uuid = get_telegram_uuid_from_moodle_user_id($USER->id);
        
        if ($telegram_uuid) {
            echo "<p class='success'>✅ UUID encontrado: <strong>{$telegram_uuid}</strong></p>";
        } else {
            echo "<p class='error'>❌ Usuario no vinculado con Telegram</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error obteniendo UUID: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
    
    echo "</div>";

    echo "<div class='test-section info'>";
    echo "<h2>📈 3. Test de Estadísticas del Usuario</h2>";
    
    try {
        $telegram_uuid = get_telegram_uuid_from_moodle_user_id($USER->id);
        
        if ($telegram_uuid) {
            // Probar todas las funciones de estadísticas
            $success_rate = get_success_rate_from_telegram_db($USER->id);
            $total_questions = get_total_questions_from_telegram_db($USER->id);
            $correct_answers = get_correct_answers_from_telegram_db($USER->id);
            $ranking = get_user_ranking_from_telegram_db($USER->id);
            
            echo "<table class='data-table'>";
            echo "<tr><th>Métrica</th><th>Valor</th><th>Estado</th></tr>";
            echo "<tr><td>Tasa de Éxito</td><td>" . ($success_rate !== false ? $success_rate . "%" : 'Error') . "</td><td>" . ($success_rate !== false ? '✅' : '❌') . "</td></tr>";
            echo "<tr><td>Total Preguntas</td><td>" . ($total_questions !== false ? number_format($total_questions) : 'Error') . "</td><td>" . ($total_questions !== false ? '✅' : '❌') . "</td></tr>";
            echo "<tr><td>Respuestas Correctas</td><td>" . ($correct_answers !== false ? number_format($correct_answers) : 'Error') . "</td><td>" . ($correct_answers !== false ? '✅' : '❌') . "</td></tr>";
            echo "<tr><td>Ranking</td><td>" . ($ranking !== false ? "#" . $ranking : 'Error') . "</td><td>" . ($ranking !== false ? '✅' : '❌') . "</td></tr>";
            echo "</table>";
            
            // Mostrar datos detallados si hay resultados
            if ($total_questions !== false && $total_questions > 0) {
                echo "<div class='success'>";
                echo "<h3>🎉 ¡Datos Reales Encontrados!</h3>";
                echo "<p><strong>Usuario tiene {$total_questions} respuestas en total</strong></p>";
                echo "<p><strong>Precisión: {$success_rate}%</strong></p>";
                echo "</div>";
            }
            
        } else {
            echo "<p class='error'>❌ No se puede probar estadísticas - usuario no vinculado</p>";
        }
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error obteniendo estadísticas: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
    
    echo "</div>";

    echo "<div class='test-section info'>";
    echo "<h2>🌍 4. Test de Estadísticas del Sistema</h2>";
    
    try {
        $system_stats = get_telegram_system_stats();
        
        if ($system_stats) {
            echo "<table class='data-table'>";
            echo "<tr><th>Estadística</th><th>Valor</th></tr>";
            echo "<tr><td>Total Usuarios Telegram</td><td>" . number_format($system_stats['total_telegram_users']) . "</td></tr>";
            echo "<tr><td>Total Respuestas</td><td>" . number_format($system_stats['total_responses']) . "</td></tr>";
            echo "<tr><td>Mapeos Activos</td><td>" . number_format($system_stats['active_mappings']) . "</td></tr>";
            echo "<tr><td>Respuestas Correctas</td><td>" . number_format($system_stats['total_correct']) . "</td></tr>";
            echo "<tr><td>Tasa Éxito Global</td><td>" . $system_stats['global_success_rate'] . "%</td></tr>";
            echo "</table>";
            
            if ($system_stats['total_responses'] > 0) {
                echo "<div class='success'>";
                echo "<h3>🎯 Sistema con Datos Reales</h3>";
                echo "<p>El sistema tiene <strong>" . number_format($system_stats['total_responses']) . "</strong> respuestas reales</p>";
                echo "<p>Tasa global de éxito: <strong>" . $system_stats['global_success_rate'] . "%</strong></p>";
                echo "</div>";
            }
            
        } else {
            echo "<p class='error'>❌ Error obteniendo estadísticas del sistema</p>";
        }
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
    
    echo "</div>";

    echo "<div class='test-section success'>";
    echo "<h2>✅ 5. Resumen de Correcciones Aplicadas</h2>";
    echo "<ul>";
    echo "<li>✅ Tablas corregidas: <code>moodleuserlink</code>, <code>telegramuser</code>, <code>telegramresponse</code></li>";
    echo "<li>✅ Campos corregidos: <code>moodleuserid</code>, <code>isactive</code>, <code>telegramuserid</code></li>";
    echo "<li>✅ Campos respuesta: <code>userid</code>, <code>iscorrect</code></li>";
    echo "<li>✅ Conexión nativa Moodle (sin PDO externo)</li>";
    echo "<li>✅ BD unificada: <code>{$CFG->dbname}</code></li>";
    echo "</ul>";
    echo "</div>";
    ?>

    <div class="test-section info">
        <h2>🔄 6. Próximos Pasos</h2>
        <ol>
            <li><strong>Si todo funciona:</strong> El analytics debería mostrar datos reales</li>
            <li><strong>Si hay errores:</strong> Revisar logs de Moodle para detalles específicos</li>
            <li><strong>Verificar analytics.php:</strong> Debería cargar datos del usuario actual</li>
        </ol>
        
        <p><strong>📍 Ubicación:</strong> <code>/local/telegram_integration/analytics.php</code></p>
    </div>

</body>
</html> 