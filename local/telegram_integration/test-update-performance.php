<?php
/**
 * Archivo de prueba para verificar la función de actualización de rendimiento
 * Usar para probar que las funciones faltantes ahora funcionan correctamente
 */

// Detectar automáticamente la ruta de config.php
$configPaths = [
    '../../config.php',
    '../../../config.php',
    '../../../../config.php'
];

$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    die('Error: No se pudo encontrar config.php');
}

// Cargar locallib.php
require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

// Verificar autenticación
require_login();

// Solo permitir administradores
if (!is_siteadmin()) {
    die('Acceso denegado. Solo administradores pueden ejecutar esta prueba.');
}

echo "<h1>🧪 Test de Función de Actualización de Rendimiento</h1>";

// Test 1: Verificar que la función existe
echo "<h2>1. Verificar Existencia de Funciones</h2>";

$functions_to_check = [
    'local_telegram_integration_get_verification_status',
    'local_telegram_integration_update_user_topic_performance',
    'local_telegram_integration_ensure_performance_table'
];

foreach ($functions_to_check as $function) {
    if (function_exists($function)) {
        echo "✅ <strong>$function:</strong> EXISTE<br>";
    } else {
        echo "❌ <strong>$function:</strong> NO EXISTE<br>";
    }
}

// Test 2: Verificar tabla de performance
echo "<h2>2. Verificar/Crear Tabla de Performance</h2>";

if (function_exists('local_telegram_integration_ensure_performance_table')) {
    $table_result = local_telegram_integration_ensure_performance_table();
    if ($table_result) {
        echo "✅ <strong>Tabla de Performance:</strong> Disponible<br>";
    } else {
        echo "❌ <strong>Tabla de Performance:</strong> Error al crear/verificar<br>";
    }
} else {
    echo "❌ <strong>Función ensure_performance_table:</strong> No existe<br>";
}

// Test 3: Verificar usuario vinculado (usar el usuario actual)
echo "<h2>3. Verificar Usuario Vinculado</h2>";

$current_user_id = $USER->id;
echo "👤 <strong>Usuario actual:</strong> {$USER->firstname} {$USER->lastname} (ID: $current_user_id)<br>";

if (function_exists('local_telegram_integration_get_verification_status')) {
    $verification = local_telegram_integration_get_verification_status($current_user_id);
    if ($verification) {
        echo "✅ <strong>Verificación:</strong> Usuario vinculado a Telegram<br>";
        echo "📱 <strong>Telegram User ID:</strong> {$verification->telegram_userid}<br>";
        
        // Test 4: Probar actualización de rendimiento
        echo "<h2>4. Probar Actualización de Rendimiento</h2>";
        
        if (function_exists('local_telegram_integration_update_user_topic_performance')) {
            // Datos de prueba
            $test_subject = "Test Subject";
            $test_total_questions = 10;
            $test_correct_answers = 7;
            
            echo "🧪 <strong>Datos de prueba:</strong><br>";
            echo "• Materia: $test_subject<br>";
            echo "• Total preguntas: $test_total_questions<br>";
            echo "• Respuestas correctas: $test_correct_answers<br>";
            echo "• Precisión: " . round(($test_correct_answers / $test_total_questions) * 100, 1) . "%<br><br>";
            
            $update_result = local_telegram_integration_update_user_topic_performance(
                $current_user_id,
                $test_subject,
                $test_total_questions,
                $test_correct_answers
            );
            
            if ($update_result) {
                echo "✅ <strong>Actualización de Rendimiento:</strong> EXITOSA<br>";
            } else {
                echo "❌ <strong>Actualización de Rendimiento:</strong> FALLÓ<br>";
            }
        } else {
            echo "❌ <strong>Función update_user_topic_performance:</strong> No existe<br>";
        }
        
    } else {
        echo "⚠️ <strong>Verificación:</strong> Usuario NO vinculado a Telegram<br>";
        echo "💡 <strong>Sugerencia:</strong> Ve a tu perfil de Moodle → Preferencias →Integración Telegram → Generar código y usa /codigo_moodle en el bot de Telegram<br>";
    }
} else {
    echo "❌ <strong>Función get_verification_status:</strong> No existe<br>";
}

// Test 5: Verificar datos en la tabla
echo "<h2>5. Verificar Datos en la Tabla</h2>";

try {
    global $DB;
    $table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');
    
    if ($table_exists) {
        echo "✅ <strong>Tabla:</strong> Existe en la base de datos<br>";
        
        $record_count = $DB->count_records('local_telegram_user_topic_performance');
        echo "📊 <strong>Registros totales:</strong> $record_count<br>";
        
        if ($record_count > 0) {
            $recent_records = $DB->get_records('local_telegram_user_topic_performance', null, 'updatedat DESC', '*', 0, 5);
            echo "<h3>📋 Últimos 5 registros:</h3>";
            echo "<table border='1' cellpadding='5' cellspacing='0'>";
            echo "<tr><th>Usuario</th><th>Materia</th><th>Total</th><th>Correctas</th><th>Precisión</th><th>Última Actividad</th></tr>";
            
            foreach ($recent_records as $record) {
                // Convertir timestamp a int si es necesario
                $timestamp = is_numeric($record->lastactivity) ? (int)$record->lastactivity : time();
                $last_activity = date('Y-m-d H:i:s', $timestamp);
                echo "<tr>";
                echo "<td>{$record->telegramuserid}</td>";
                echo "<td>{$record->sectionname}</td>";
                echo "<td>{$record->totalquestions}</td>";
                echo "<td>{$record->correctanswers}</td>";
                echo "<td>{$record->accuracy}%</td>";
                echo "<td>$last_activity</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "❌ <strong>Tabla:</strong> No existe en la base de datos<br>";
    }
    
} catch (Exception $e) {
    echo "❌ <strong>Error verificando tabla:</strong> " . htmlspecialchars($e->getMessage()) . "<br>";
}

echo "<h2>🎯 Conclusión</h2>";
echo "<p>Si todas las pruebas muestran ✅, el sistema debería funcionar correctamente.</p>";
echo "<p>Si hay errores ❌, revisar los logs de PHP para más detalles.</p>";

echo "<hr>";
echo "<p><strong>Próximos pasos:</strong></p>";
echo "<ul>";
echo "<li>Realizar un quiz en Moodle para probar en condiciones reales</li>";
echo "<li>Revisar los logs de PHP para verificar que no hay errores</li>";
echo "<li>Verificar que el sistema de analytics muestre los datos actualizados</li>";
echo "</ul>";

echo "<p><a href='analytics.php'>📊 Ir a Analytics</a> | <a href='my-advanced-analytics.php'>📈 Mi Analytics Avanzado</a></p>";
?>