<?php
// Simple test for predictive analysis function
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Check authentication first
if (!isloggedin() || isguestuser()) {
    echo "<h1>❌ Usuario no autenticado</h1>";
    echo '<a href="' . $CFG->wwwroot . '/login/index.php">Iniciar Sesión</a><br>';
    exit;
}

echo "<h1>🧪 Test Simple de Función Predictiva</h1>";
echo "<h2>✅ Usuario autenticado: {$USER->firstname} {$USER->lastname}</h2>";

// Get telegram user ID using the function from lib.php
$telegram_user_id = get_telegram_user_id($USER->id);
echo "<h3>Telegram User ID: " . ($telegram_user_id ?: "❌ NO ENCONTRADO") . "</h3>";

if (!$telegram_user_id) {
    echo "<p>❌ No se encontró vinculación con Telegram.</p>";
    echo "<p>Para vincular tu cuenta:</p>";
    echo "<ol>";
    echo "<li>Ve a tu perfil en Moodle</li>";
    echo "<li>Busca la sección 'Integración con Telegram'</li>";
    echo "<li>Sigue las instrucciones para vincular tu cuenta</li>";
    echo "</ol>";
    exit;
}

// Test database connection directly
echo "<h2>🔗 Test de Conexión a Base de Datos</h2>";
try {
    global $DB;
    $count = $DB->count_records('telegramresponse', ['userid' => $telegram_user_id]);
    echo "<p>✅ Respuestas encontradas para usuario $telegram_user_id: <strong>$count</strong></p>";
    
    if ($count > 0) {
        // Get basic stats using Moodle DB
        $sql = "SELECT 
                    AVG(CASE WHEN iscorrect = 1 THEN 1.0 ELSE 0.0 END) * 100 as accuracy,
                    COUNT(*) as total,
                    AVG(responsetime) as avg_time
                FROM {telegramresponse} 
                WHERE userid = ?";
        
        $stats = $DB->get_record_sql($sql, [$telegram_user_id]);
        
        echo "<h3>📊 Estadísticas Básicas:</h3>";
        echo "<ul>";
        echo "<li><strong>Precisión:</strong> " . round($stats->accuracy, 1) . "%</li>";
        echo "<li><strong>Total respuestas:</strong> " . $stats->total . "</li>";
        echo "<li><strong>Tiempo promedio:</strong> " . round($stats->avg_time/1000, 1) . " segundos</li>";
        echo "</ul>";
        
        // Simple predictive calculation
        $accuracy = floatval($stats->accuracy);
        $total = intval($stats->total);
        
        $base_probability = min(90, $accuracy);
        $volume_bonus = min(5, $total / 100);
        $success_probability = min(95, $base_probability + $volume_bonus);
        
        echo "<h3>🎯 Predicción Simple:</h3>";
        echo "<p><strong>Probabilidad de éxito estimada:</strong> " . round($success_probability, 1) . "%</p>";
        
        // Test AJAX call
        echo "<h2>🔄 Test de Llamada AJAX</h2>";
        echo "<p>Probando llamada AJAX a la función predictiva...</p>";
        
        $ajax_url = $CFG->wwwroot . '/local/telegram_integration/analytics.php';
        echo "<script>
        fetch('$ajax_url?action=get_predictive_data&format=json&userid=$telegram_user_id')
        .then(response => response.text())
        .then(text => {
            console.log('Response text:', text);
            document.getElementById('ajax-result').innerHTML = '<pre>' + text + '</pre>';
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('ajax-result').innerHTML = '<p style=\"color: red;\">Error: ' + error + '</p>';
        });
        </script>";
        
        echo "<div id='ajax-result'>⏳ Cargando resultado AJAX...</div>";
        
    } else {
        echo "<p>❌ No se encontraron respuestas para este usuario.</p>";
        echo "<p>Asegúrate de haber usado el bot de Telegram para responder preguntas.</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error de base de datos: " . $e->getMessage() . "</p>";
}
?> 