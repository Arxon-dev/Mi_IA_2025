<?php
// Test simple para verificar la corrección de get_predictive_analysis_data
echo "🧪 TESTING PREDICTIVE DATA FIX\n";
echo "==============================\n";

// Simular el entorno mínimo
$_GET['action'] = 'get_predictive_data';
$_GET['format'] = 'json';
$_GET['userid'] = '2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f';

// Incluir las funciones necesarias
require_once 'db-config.php';
require_once 'direct-ml-bridge-mysql.php';

echo "📁 Files included successfully\n";

// Test de conexión a la base de datos
try {
    $pdo = createDatabaseConnection();
    echo "✅ Database connection successful\n";
    
    // Test directo de la función getPredictiveData
    $telegram_user_id = '2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f';
    echo "🔍 Testing getPredictiveData with UUID: $telegram_user_id\n";
    
    $result = getPredictiveData($pdo, $telegram_user_id);
    
    echo "📊 Result received:\n";
    echo "Type: " . gettype($result) . "\n";
    echo "Keys: " . implode(', ', array_keys($result)) . "\n";
    
    if (isset($result['error'])) {
        echo "❌ Error in result: " . $result['error'] . "\n";
    } else {
        echo "✅ Success! Data received:\n";
        echo "  - Success probability: " . ($result['success_probability'] ?? 'N/A') . "\n";
        echo "  - Weak areas count: " . count($result['weak_areas'] ?? []) . "\n";
        echo "  - Confidence: " . ($result['confidence'] ?? 'N/A') . "\n";
    }
    
    echo "\n🔄 Now testing the analytics.php function...\n";
    
    // Definir la función get_predictive_analysis_data inline para el test
    function get_predictive_analysis_data($user_id) {
        // Include direct ML bridge functions
        require_once 'direct-ml-bridge-mysql.php';
        require_once 'db-config.php';
        
        // $user_id already IS the Telegram user ID (UUID)
        $telegram_user_id = $user_id;
        
        if (!$telegram_user_id) {
            return [
                'error' => 'Usuario no válido',
                'success_probability' => 0,
                'weak_areas' => [],
                'recommendations' => ['Vincula tu cuenta de Telegram para obtener análisis predictivo']
            ];
        }
        
        try {
            // Call directly instead of via cURL
            $pdo = createDatabaseConnection();
            $analysis = getPredictiveData($pdo, $telegram_user_id);
            
            if (isset($analysis['error'])) {
                return [
                    'error' => $analysis['error'],
                    'success_probability' => 0,
                    'weak_areas' => [],
                    'recommendations' => ['Error al conectar con el servidor de análisis: ' . $analysis['error']]
                ];
            }
            
            // Format recommendations based on weak areas
            $recommendations = [];
            if (!empty($analysis['weak_areas'])) {
                foreach ($analysis['weak_areas'] as $area) {
                    $subject = $area['subject'] ?? 'Materia desconocida';
                    if (($area['risk_level'] ?? '') === 'high') {
                        $recommendations[] = "⚠️ Prioridad ALTA: Reforzar {$subject} (Precisión: {$area['accuracy']}%)";
                    } else {
                        $recommendations[] = "📚 Revisar {$subject} regularmente (Precisión: {$area['accuracy']}%)";
                    }
                }
            } else {
                $recommendations[] = "🎉 ¡Excelente! Mantén tu ritmo de estudio actual";
            }
            
            return [
                'success_probability' => $analysis['success_probability'] ?? 0,
                'weak_areas' => $analysis['weak_areas'] ?? [],
                'recommendations' => $recommendations,
                'confidence' => $analysis['confidence'] ?? 0
            ];
            
        } catch (Exception $e) {
            error_log("❌ Error in get_predictive_analysis_data: " . $e->getMessage());
            return [
                'error' => 'Error interno del servidor',
                'success_probability' => 0,
                'weak_areas' => [],
                'recommendations' => ['Error al procesar análisis predictivo: ' . $e->getMessage()]
            ];
        }
    }
    
    // Test de la función corregida
    $analytics_result = get_predictive_analysis_data($telegram_user_id);
    
    echo "📈 Analytics function result:\n";
    echo "Keys: " . implode(', ', array_keys($analytics_result)) . "\n";
    
    if (isset($analytics_result['error'])) {
        echo "❌ Error in analytics: " . $analytics_result['error'] . "\n";
    } else {
        echo "✅ Analytics Success!\n";
        echo "  - Success probability: " . $analytics_result['success_probability'] . "\n";
        echo "  - Recommendations count: " . count($analytics_result['recommendations']) . "\n";
        echo "  - First recommendation: " . ($analytics_result['recommendations'][0] ?? 'None') . "\n";
    }
    
    echo "\n🎯 JSON Output:\n";
    echo json_encode($analytics_result, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n✅ Test completed\n";
?> 