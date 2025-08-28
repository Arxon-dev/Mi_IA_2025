<?php
// Test the fixed predictive analysis function
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

echo "<h1>🧪 Test de Función Predictiva Corregida</h1>";

// Check authentication first
if (!isloggedin() || isguestuser()) {
    echo "<h2>❌ Usuario no autenticado</h2>";
    echo '<a href="' . $CFG->wwwroot . '/login/index.php">Iniciar Sesión</a><br>';
    exit;
}

echo "<h2>✅ Usuario autenticado: {$USER->firstname} {$USER->lastname}</h2>";

// Get telegram user ID
$telegram_user_id = get_telegram_user_id($USER->id);
echo "<h3>Telegram User ID: " . ($telegram_user_id ?: "❌ NO ENCONTRADO") . "</h3>";

if (!$telegram_user_id) {
    echo "<p>❌ No se encontró vinculación con Telegram. Verifica que tu cuenta esté conectada.</p>";
    exit;
}

// Include analytics.php for the predictive function
// Note: get_telegram_user_id() is now in lib.php which is already included
require_once(__DIR__ . '/analytics.php');

echo "<h2>🧠 Probando función get_predictive_analysis_data</h2>";

try {
    $result = get_predictive_analysis_data($telegram_user_id);
    
    echo "<h3>📊 Resultado:</h3>";
    echo "<pre>" . print_r($result, true) . "</pre>";
    
    if (isset($result['error'])) {
        echo "<h3>❌ Error detectado:</h3>";
        echo "<p style='color: red;'>" . $result['error'] . "</p>";
    } else {
        echo "<h3>✅ Datos obtenidos correctamente:</h3>";
        echo "<ul>";
        echo "<li><strong>Probabilidad de éxito:</strong> " . $result['success_probability'] . "%</li>";
        echo "<li><strong>Intentos totales:</strong> " . ($result['total_attempts'] ?? 'N/A') . "</li>";
        echo "<li><strong>Precisión actual:</strong> " . ($result['current_accuracy'] ?? 'N/A') . "%</li>";
        echo "<li><strong>Confianza:</strong> " . $result['confidence'] . "</li>";
        echo "<li><strong>Áreas débiles:</strong> " . count($result['weak_areas']) . "</li>";
        echo "<li><strong>Recomendaciones:</strong> " . count($result['recommendations']) . "</li>";
        echo "</ul>";
        
        if (!empty($result['weak_areas'])) {
            echo "<h4>⚠️ Áreas Débiles:</h4>";
            echo "<ul>";
            foreach ($result['weak_areas'] as $area) {
                if (is_array($area)) {
                    echo "<li>{$area['subject']} - {$area['accuracy']}% (Riesgo: {$area['risk_level']})</li>";
                } else {
                    echo "<li>$area</li>";
                }
            }
            echo "</ul>";
        }
        
        if (!empty($result['recommendations'])) {
            echo "<h4>💡 Recomendaciones:</h4>";
            echo "<ul>";
            foreach ($result['recommendations'] as $rec) {
                echo "<li>$rec</li>";
            }
            echo "</ul>";
        }
    }
    
} catch (Exception $e) {
    echo "<h3>❌ Excepción capturada:</h3>";
    echo "<p style='color: red;'>" . $e->getMessage() . "</p>";
    echo "<p><strong>Trace:</strong></p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

// Test database connection directly
echo "<h2>🔗 Test de Conexión a Base de Datos</h2>";
try {
    global $DB;
    $count = $DB->count_records('telegramresponse', ['userid' => $telegram_user_id]);
    echo "<p>✅ Respuestas encontradas para usuario $telegram_user_id: <strong>$count</strong></p>";
    
    if ($count > 0) {
        $sample = $DB->get_records('telegramresponse', ['userid' => $telegram_user_id], '', '*', 0, 3);
        echo "<h4>📝 Muestra de datos (primeros 3 registros):</h4>";
        echo "<pre>" . print_r($sample, true) . "</pre>";
    }
} catch (Exception $e) {
    echo "<p>❌ Error de base de datos: " . $e->getMessage() . "</p>";
}
?> 