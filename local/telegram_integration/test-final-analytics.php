<?php
/**
 * Test Final Analytics - BD Unificada
 * Prueba completa de las funciones corregidas
 * BD: u449034524_moodel_telegra
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Verificar autenticación
require_login();

global $DB, $USER;

header('Content-Type: text/html; charset=utf-8');
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Final Analytics - BD Unificada</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; }
        .test-section { 
            margin: 20px 0; 
            padding: 20px; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        .stat-card { padding: 15px; border: 1px solid #ddd; border-radius: 6px; text-align: center; background: #f8f9fa; }
        .stat-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; font-size: 0.9em; margin-top: 5px; }
        h1 { color: #333; text-align: center; }
        h3 { color: #495057; margin-top: 0; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Test Final Analytics - BD Unificada</h1>
        <p><strong>BD:</strong> u449034524_moodel_telegra</p>
        <p><strong>Usuario:</strong> <?php echo $USER->username; ?> (ID: <?php echo $USER->id; ?>)</p>

        <div class="test-section">
            <h3>📊 1. Test Función get_user_analytics_data()</h3>
            <?php
            try {
                $user_analytics = get_user_analytics_data($USER->id);
                
                if ($user_analytics['success']) {
                    echo '<div class="success">';
                    echo '<strong>✅ Función get_user_analytics_data() - ÉXITO</strong><br>';
                    echo '<pre>' . json_encode($user_analytics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
                    echo '</div>';
                    
                    $data = $user_analytics['data'];
                    echo '<div class="stats-grid">';
                    echo '<div class="stat-card"><div class="stat-value">' . ($data['success_rate'] ?: 0) . '%</div><div class="stat-label">Tasa de Éxito</div></div>';
                    echo '<div class="stat-card"><div class="stat-value">' . ($data['total_questions'] ?: 0) . '</div><div class="stat-label">Total Preguntas</div></div>';
                    echo '<div class="stat-card"><div class="stat-value">' . ($data['correct_answers'] ?: 0) . '</div><div class="stat-label">Respuestas Correctas</div></div>';
                    echo '<div class="stat-card"><div class="stat-value">' . ($data['ranking'] ? '#' . $data['ranking'] : 'N/A') . '</div><div class="stat-label">Ranking</div></div>';
                    echo '</div>';
                } else {
                    echo '<div class="error">';
                    echo '<strong>❌ Error en get_user_analytics_data():</strong><br>';
                    echo $user_analytics['message'];
                    echo '</div>';
                }
            } catch (Exception $e) {
                echo '<div class="error"><strong>❌ Excepción:</strong> ' . $e->getMessage() . '</div>';
            }
            ?>
        </div>

        <div class="test-section">
            <h3>🌍 2. Test Función get_system_analytics_data()</h3>
            <?php
            try {
                $system_analytics = get_system_analytics_data();
                
                if ($system_analytics['success']) {
                    echo '<div class="success">';
                    echo '<strong>✅ Función get_system_analytics_data() - ÉXITO</strong><br>';
                    echo '<pre>' . json_encode($system_analytics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
                    echo '</div>';
                    
                    $data = $system_analytics['data'];
                    echo '<div class="stats-grid">';
                    echo '<div class="stat-card"><div class="stat-value">' . ($data['total_telegram_users'] ?: 0) . '</div><div class="stat-label">Usuarios Telegram</div></div>';
                    echo '<div class="stat-card"><div class="stat-value">' . ($data['total_responses'] ?: 0) . '</div><div class="stat-label">Total Respuestas</div></div>';
                    echo '<div class="stat-card"><div class="stat-value">' . ($data['active_mappings'] ?: 0) . '</div><div class="stat-label">Mapeos Activos</div></div>';
                    echo '<div class="stat-card"><div class="stat-value">' . ($data['global_success_rate'] ?: 0) . '%</div><div class="stat-label">Éxito Global</div></div>';
                    echo '</div>';
                } else {
                    echo '<div class="error">';
                    echo '<strong>❌ Error en get_system_analytics_data():</strong><br>';
                    echo $system_analytics['message'];
                    echo '</div>';
                }
            } catch (Exception $e) {
                echo '<div class="error"><strong>❌ Excepción:</strong> ' . $e->getMessage() . '</div>';
            }
            ?>
        </div>

        <div class="test-section">
            <h3>🔧 3. Test AJAX Simulado</h3>
            <?php
            // Simular llamada AJAX
            echo '<div class="info">';
            echo '<strong>📡 Simulando llamadas AJAX de analytics.php:</strong><br><br>';
            
            // Test llamada get_user_stats
            echo '<strong>GET ?action=get_user_stats&user_id=' . $USER->id . '</strong><br>';
            $user_result = get_user_analytics_data($USER->id);
            echo 'Resultado: ' . ($user_result['success'] ? '✅ JSON válido' : '❌ Error: ' . $user_result['message']) . '<br><br>';
            
            // Test llamada get_system_stats  
            echo '<strong>GET ?action=get_system_stats</strong><br>';
            $system_result = get_system_analytics_data();
            echo 'Resultado: ' . ($system_result['success'] ? '✅ JSON válido' : '❌ Error: ' . $system_result['message']) . '<br>';
            echo '</div>';
            ?>
        </div>

        <div class="test-section">
            <h3>✅ 4. Resumen de Correcciones Aplicadas</h3>
            <div class="success">
                <strong>🔧 Cambios Realizados:</strong><br>
                ✅ Tablas corregidas: SQL directo sin prefijo mdl_<br>
                ✅ Campos corregidos: moodleuserid, isactive, telegramuserid, userid, iscorrect<br>
                ✅ Funciones actualizadas en lib.php con consultas SQL directas<br>
                ✅ analytics.php corregido para usar get_questions_answered_from_telegram_db<br>
                ✅ Conexión nativa Moodle (sin PDO externo)<br>
                ✅ BD unificada: u449034524_moodel_telegra<br><br>
                
                <strong>🎯 Próximos Pasos:</strong><br>
                • Si ambas funciones funcionan: Analytics principal debería cargar datos reales<br>
                • Si hay errores AJAX: Verificar logs de Moodle para detalles específicos<br>
                • Probar analytics.php: Debería mostrar estadísticas del usuario actual<br><br>
                
                <strong>📍 Ubicación:</strong> <a href="analytics.php">/local/telegram_integration/analytics.php</a>
            </div>
        </div>
    </div>
</body>
</html> 