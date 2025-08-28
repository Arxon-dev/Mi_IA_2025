<?php
// Test manual de la función de actualización de rendimiento
// Para identificar si el problema está en la función o en el flujo del observer

require_once(dirname(__FILE__) . '/../../config.php');
require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

echo "<h2>🧪 Test Manual de Actualización de Rendimiento</h2>";
echo "<p>Este script prueba manualmente la función de actualización para identificar donde falla.</p>";

global $DB;

// 1. Verificar que la función existe
echo "<h3>1. Verificación de Función</h3>";
if (!function_exists('local_telegram_integration_update_user_topic_performance')) {
    echo "<div style='color: red;'>❌ FATAL: La función de actualización no existe</div>";
    echo "<p>El plugin no está cargado correctamente.</p>";
    exit;
}
echo "<div style='color: green;'>✅ Función de actualización existe</div>";

// 2. Obtener un usuario vinculado para las pruebas
echo "<h3>2. Obtención de Usuario de Prueba</h3>";
$test_user = $DB->get_record_sql("
    SELECT v.userid, v.telegram_userid, u.username, u.firstname, u.lastname 
    FROM {local_telegram_verification} v
    JOIN {user} u ON v.userid = u.id
    WHERE v.verified = ?
    ORDER BY v.id DESC
    LIMIT 1
", [1]);

if (!$test_user) {
    echo "<div style='color: red;'>❌ FATAL: No hay usuarios vinculados a Telegram</div>";
    echo "<p>Para que funcione el sistema, necesitas al menos un usuario vinculado.</p>";
    echo "<p><strong>Pasos para vincular un usuario:</strong></p>";
    echo "<ol>";
    echo "<li>Ve a tu perfil de usuario en Moodle</li>";
    echo "<li>Busca la sección 'Telegram Integration'</li>";
    echo "<li>Sigue el proceso de vinculación</li>";
    echo "</ol>";
    exit;
}

echo "<div style='color: green;'>✅ Usuario de prueba encontrado:</div>";
echo "<ul>";
echo "<li><strong>User ID:</strong> {$test_user->userid}</li>";
echo "<li><strong>Username:</strong> {$test_user->username}</li>";
echo "<li><strong>Name:</strong> {$test_user->firstname} {$test_user->lastname}</li>";
echo "<li><strong>Telegram ID:</strong> {$test_user->telegram_userid}</li>";
echo "</ul>";

// 3. Verificar la tabla de rendimiento
echo "<h3>3. Verificación de Tabla de Rendimiento</h3>";
try {
    $table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');
    if (!$table_exists) {
        echo "<div style='color: red;'>❌ Tabla no existe. Intentando crear...</div>";
        
        if (function_exists('local_telegram_integration_ensure_performance_table')) {
            local_telegram_integration_ensure_performance_table();
            echo "<div style='color: green;'>✅ Tabla creada</div>";
        } else {
            echo "<div style='color: red;'>❌ No se puede crear la tabla</div>";
            exit;
        }
    } else {
        echo "<div style='color: green;'>✅ Tabla existe</div>";
    }
    
    // Contar registros actuales
    $current_count = $DB->count_records('local_telegram_user_topic_performance');
    echo "<p>Registros actuales en la tabla: <strong>{$current_count}</strong></p>";
    
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error verificando tabla: " . $e->getMessage() . "</div>";
    exit;
}

// 4. Test Manual #1: Actualización básica
echo "<h3>4. Test Manual #1: Actualización Básica</h3>";
echo "<p>Probando actualización con datos de prueba...</p>";

$test_params = [
    'user_id' => $test_user->userid,
    'subject' => 'organismos internacionales',
    'total_questions' => 10,
    'correct_answers' => 7
];

echo "<div style='background: #f0f0f0; padding: 10px; margin: 10px 0;'>";
echo "<strong>Parámetros de prueba:</strong><br>";
echo "- User ID: {$test_params['user_id']}<br>";
echo "- Subject: {$test_params['subject']}<br>";
echo "- Total Questions: {$test_params['total_questions']}<br>";
echo "- Correct Answers: {$test_params['correct_answers']}<br>";
echo "</div>";

try {
    $result = local_telegram_integration_update_user_topic_performance(
        $test_params['user_id'],
        $test_params['subject'],
        $test_params['total_questions'],
        $test_params['correct_answers']
    );
    
    if ($result) {
        echo "<div style='color: green;'>✅ Actualización exitosa</div>";
        
        // Verificar que se insertó/actualizó
        $new_count = $DB->count_records('local_telegram_user_topic_performance');
        echo "<p>Registros después de la actualización: <strong>{$new_count}</strong></p>";
        
        if ($new_count > $current_count) {
            echo "<div style='color: green;'>✅ Nuevo registro creado</div>";
        } else {
            echo "<div style='color: blue;'>ℹ️ Registro existente actualizado</div>";
        }
        
        // Mostrar el registro actualizado
        $updated_record = $DB->get_record('local_telegram_user_topic_performance', [
            'telegramuserid' => $test_user->telegram_userid,
            'sectionname' => $test_params['subject']
        ]);
        
        if ($updated_record) {
            echo "<p><strong>Registro actualizado:</strong></p>";
            echo "<table border='1' style='border-collapse: collapse;'>";
            echo "<tr><th>Telegram User</th><th>Section</th><th>Total Q</th><th>Correct</th><th>Accuracy</th><th>Updated</th></tr>";
            echo "<tr>";
            echo "<td>{$updated_record->telegramuserid}</td>";
            echo "<td>{$updated_record->sectionname}</td>";
            echo "<td>{$updated_record->totalquestions}</td>";
            echo "<td>{$updated_record->correctanswers}</td>";
            echo "<td>{$updated_record->accuracy}%</td>";
            echo "<td>" . date('Y-m-d H:i:s', (int)$updated_record->updatedat) . "</td>";
            echo "</tr>";
            echo "</table>";
        }
        
    } else {
        echo "<div style='color: red;'>❌ La función devolvió FALSE</div>";
        echo "<p>Revisa los logs de error para más detalles.</p>";
    }
    
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error durante la actualización: " . $e->getMessage() . "</div>";
}

// 5. Test Manual #2: Diferentes temas
echo "<h3>5. Test Manual #2: Diferentes Temas</h3>";
$test_subjects = [
    'derecho constitucional',
    'derecho administrativo',
    'unión europea',
    'general'
];

foreach ($test_subjects as $subject) {
    echo "<p>Probando tema: <strong>{$subject}</strong></p>";
    
    try {
        $result = local_telegram_integration_update_user_topic_performance(
            $test_user->userid,
            $subject,
            5,
            3
        );
        
        $status = $result ? "✅ OK" : "❌ FAIL";
        echo "<div style='margin-left: 20px;'>{$status} - {$subject}</div>";
        
    } catch (Exception $e) {
        echo "<div style='color: red; margin-left: 20px;'>❌ Error: " . $e->getMessage() . "</div>";
    }
}

// 6. Verificar registros finales
echo "<h3>6. Verificación Final</h3>";
$final_count = $DB->count_records('local_telegram_user_topic_performance');
echo "<p>Total de registros al final: <strong>{$final_count}</strong></p>";

if ($final_count > 0) {
    $all_records = $DB->get_records('local_telegram_user_topic_performance', 
        ['telegramuserid' => $test_user->telegram_userid]);
    
    if ($all_records) {
        echo "<p><strong>Todos los registros para el usuario de prueba:</strong></p>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Section</th><th>Total Q</th><th>Correct</th><th>Accuracy</th><th>Updated</th></tr>";
        foreach ($all_records as $record) {
            echo "<tr>";
            echo "<td>{$record->sectionname}</td>";
            echo "<td>{$record->totalquestions}</td>";
            echo "<td>{$record->correctanswers}</td>";
            echo "<td>{$record->accuracy}%</td>";
            echo "<td>" . date('Y-m-d H:i:s', (int)$record->updatedat) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
}

// 7. Conclusiones
echo "<h3>7. Conclusiones</h3>";
echo "<div style='background: #e7f3ff; padding: 15px; border: 1px solid #b3d9ff;'>";
echo "<h4>Resultados del Test:</h4>";
if ($final_count > $current_count) {
    echo "<div style='color: green;'>✅ <strong>LA FUNCIÓN DE ACTUALIZACIÓN FUNCIONA CORRECTAMENTE</strong></div>";
    echo "<p>El problema NO está en la función de actualización. El problema está en:</p>";
    echo "<ul>";
    echo "<li>El <strong>event observer</strong> no se ejecuta</li>";
    echo "<li>Los <strong>usuarios no están vinculados</strong> cuando hacen cuestionarios</li>";
    echo "<li>El <strong>observer tiene errores</strong> que impiden llegar a la función</li>";
    echo "</ul>";
} else {
    echo "<div style='color: red;'>❌ <strong>LA FUNCIÓN DE ACTUALIZACIÓN TIENE PROBLEMAS</strong></div>";
    echo "<p>El problema SÍ está en la función de actualización.</p>";
}
echo "</div>";

// 8. Próximos pasos
echo "<h3>8. Próximos Pasos</h3>";
echo "<p>Basado en los resultados:</p>";
echo "<ol>";
echo "<li><strong>Si la función funciona:</strong> Revisar el event observer y los logs</li>";
echo "<li><strong>Si la función falla:</strong> Revisar permisos de base de datos y estructura</li>";
echo "<li><strong>En ambos casos:</strong> Hacer un cuestionario real y monitorear logs</li>";
echo "</ol>";

echo "<p style='color: blue;'><strong>Test manual completado.</strong></p>";

// Limpiar datos de prueba (opcional)
echo "<h3>9. Limpieza (Opcional)</h3>";
echo "<p>Para limpiar los datos de prueba creados:</p>";
echo "<pre style='background: #f0f0f0; padding: 10px;'>";
echo "DELETE FROM mdl_local_telegram_user_topic_performance \n";
echo "WHERE telegramuserid = {$test_user->telegram_userid} \n";
echo "AND updatedat > " . (time() - 300) . "; -- Últimos 5 minutos";
echo "</pre>";
echo "<p><em>Ejecuta esta consulta SQL solo si quieres eliminar los datos de prueba.</em></p>";
?> 