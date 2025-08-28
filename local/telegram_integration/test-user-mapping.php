<?php
// Test user mapping between Moodle and Telegram
require_once(__DIR__ . '/../../config.php');
require_once('analytics.php');

echo "<h2>🔗 Test de Mapeo de Usuarios Moodle ↔ Telegram</h2>";

// Must be logged in
require_login();
global $USER, $DB;

echo "<h3>1. Usuario Actual</h3>";
echo "👤 Usuario Moodle: {$USER->firstname} {$USER->lastname} (ID: {$USER->id})<br>";
echo "📧 Email: {$USER->email}<br>";

// Check current verification status
echo "<h3>2. Estado de Verificación</h3>";
try {
    $verification = $DB->get_record('local_telegram_verification', [
        'moodle_userid' => $USER->id,
        'is_verified' => 1
    ]);
    
    if ($verification) {
        echo "✅ Usuario VERIFICADO<br>";
        echo "📱 Telegram User ID: {$verification->telegram_userid}<br>";
        echo "👤 Telegram Username: @{$verification->telegram_username}<br>";
        echo "📅 Verificado: " . date('Y-m-d H:i:s', $verification->verified_at) . "<br>";
        
        $telegram_id = get_telegram_user_id($USER->id);
        echo "🔗 Función get_telegram_user_id(): " . ($telegram_id ? $telegram_id : 'null') . "<br>";
        
        // Test with Bridge API
        echo "<h3>3. Test con Bridge API</h3>";
        require_once 'ml-analytics-bridge.php';
        
        try {
            $bridge = new MLAnalyticsBridge();
            
            echo "<strong>Probando análisis predictivo:</strong><br>";
            $predictive = $bridge->getPredictiveAnalysis($telegram_id);
            echo "🎯 Resultado: " . json_encode($predictive, JSON_PRETTY_PRINT) . "<br><br>";
            
            echo "<strong>Probando métricas de aprendizaje:</strong><br>";
            $learning = $bridge->getLearningMetrics($telegram_id);
            echo "📈 Resultado: " . json_encode($learning, JSON_PRETTY_PRINT) . "<br><br>";
            
        } catch (Exception $e) {
            echo "❌ Error con Bridge API: " . $e->getMessage() . "<br>";
        }
        
    } else {
        echo "❌ Usuario NO VERIFICADO<br>";
        echo "💡 Para probar el sistema, necesitas:<br>";
        echo "1. Vincular tu cuenta de Telegram<br>";
        echo "2. O crear un registro de prueba<br><br>";
        
        // Option to create test data
        echo "<h3>3. Crear Datos de Prueba</h3>";
        echo "<p>¿Quieres crear un registro de prueba para testing?</p>";
        
        if (isset($_POST['create_test_data'])) {
            // Create test verification record
            $test_telegram_id = '316d66e3-1e91-4fe9-b0dd-3ded77de0453'; // Usuario con más respuestas
            
            try {
                $record = new stdClass();
                $record->moodle_userid = $USER->id;
                $record->verification_code = '000000';
                $record->telegram_userid = $test_telegram_id;
                $record->telegram_username = 'test_user';
                $record->is_verified = 1;
                $record->created_at = time();
                $record->expires_at = time() + 3600;
                $record->verified_at = time();
                
                $DB->insert_record('local_telegram_verification', $record);
                
                echo "✅ Registro de prueba creado exitosamente<br>";
                echo "📱 Telegram ID de prueba: {$test_telegram_id}<br>";
                echo "🔄 Recarga la página para ver los resultados<br>";
                
            } catch (Exception $e) {
                echo "❌ Error creando registro de prueba: " . $e->getMessage() . "<br>";
            }
        } else {
            echo '<form method="post">';
            echo '<input type="hidden" name="create_test_data" value="1">';
            echo '<button type="submit" class="btn btn-warning">Crear Registro de Prueba</button>';
            echo '</form>';
            echo "<p><small>⚠️ Esto creará un registro temporal para testing. El Telegram ID usado será del usuario más activo en la base de datos.</small></p>";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error verificando estado: " . $e->getMessage() . "<br>";
}

// Show some statistics
echo "<h3>4. Estadísticas del Sistema</h3>";
try {
    $total_verifications = $DB->count_records('local_telegram_verification');
    $verified_users = $DB->count_records('local_telegram_verification', ['is_verified' => 1]);
    $total_activities = $DB->count_records('local_telegram_activities');
    
    echo "📊 Total verificaciones: {$total_verifications}<br>";
    echo "✅ Usuarios verificados: {$verified_users}<br>";
    echo "🎯 Actividades sincronizadas: {$total_activities}<br>";
    
} catch (Exception $e) {
    echo "❌ Error obteniendo estadísticas: " . $e->getMessage() . "<br>";
}

// Option to clean test data
if (isset($_POST['clean_test_data'])) {
    try {
        $DB->delete_records('local_telegram_verification', [
            'moodle_userid' => $USER->id,
            'telegram_username' => 'test_user'
        ]);
        echo "<div class='alert alert-info'>🧹 Datos de prueba eliminados</div>";
    } catch (Exception $e) {
        echo "❌ Error eliminando datos de prueba: " . $e->getMessage() . "<br>";
    }
}

echo "<hr>";
echo '<form method="post" style="margin-top: 20px;">';
echo '<input type="hidden" name="clean_test_data" value="1">';
echo '<button type="submit" class="btn btn-secondary btn-sm">🧹 Limpiar Datos de Prueba</button>';
echo '</form>';

echo "<p><strong>💡 Próximos pasos:</strong></p>";
echo "<ul>";
echo "<li>Si el usuario está verificado, el Bridge API debería devolver datos reales</li>";
echo "<li>Si los datos están vacíos, verificar que el Telegram ID existe en PostgreSQL</li>";
echo "<li>Verificar que la consulta en el Bridge API está funcionando correctamente</li>";
echo "</ul>";
?> 