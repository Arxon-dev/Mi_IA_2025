<?php
// Diagnóstico completo del sistema Telegram Integration
// Para identificar por qué NO se actualiza mdl_local_telegram_user_topic_performance

require_once(dirname(__FILE__) . '/../../config.php');
require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

echo "<h2>🔍 Diagnóstico Completo del Sistema Telegram Integration</h2>";
echo "<p><strong>Problema:</strong> La tabla mdl_local_telegram_user_topic_performance NO se actualiza para NINGÚN tema</p>";

global $DB;

// 1. Verificar si el plugin está instalado y activo
echo "<h3>1. Estado del Plugin</h3>";
try {
    $plugin = $DB->get_record('config_plugins', ['plugin' => 'local_telegram_integration', 'name' => 'version']);
    if ($plugin) {
        echo "<div style='color: green;'>✅ Plugin instalado - Versión: {$plugin->value}</div>";
    } else {
        echo "<div style='color: red;'>❌ Plugin NO instalado o NO activo</div>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error verificando plugin: " . $e->getMessage() . "</div>";
}

// 2. Verificar los event observers
echo "<h3>2. Verificación de Event Observers</h3>";
try {
    // Verificar en la nueva tabla de eventos (Moodle 3.1+)
    $observers = $DB->get_records_sql("
        SELECT * FROM {events_handlers} 
        WHERE component = ? 
        OR handlerfunction LIKE ?
    ", ['local_telegram_integration', '%telegram%']);
    
    if ($observers) {
        echo "<div style='color: green;'>✅ Event observers encontrados:</div>";
        foreach ($observers as $observer) {
            echo "<div style='margin-left: 20px;'>- {$observer->eventname} → {$observer->handlerfunction}</div>";
        }
    } else {
        echo "<div style='color: red;'>❌ NO se encontraron event observers</div>";
    }
    
    // Verificar también en config si hay definiciones
    $event_config = $DB->get_record('config', ['name' => 'local_telegram_integration_observers']);
    if ($event_config) {
        echo "<div style='color: green;'>✅ Configuración de observers encontrada</div>";
    } else {
        echo "<div style='color: orange;'>⚠️ No se encontró configuración de observers</div>";
    }
    
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error verificando observers: " . $e->getMessage() . "</div>";
}

// 3. Verificar la tabla de rendimiento
echo "<h3>3. Verificación de Tabla de Rendimiento</h3>";
try {
    $table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');
    if ($table_exists) {
        echo "<div style='color: green;'>✅ Tabla 'local_telegram_user_topic_performance' existe</div>";
        
        // Verificar estructura
        $columns = $DB->get_columns('local_telegram_user_topic_performance');
        echo "<p>Estructura de la tabla:</p><ul>";
        foreach ($columns as $column) {
            echo "<li><strong>{$column->name}</strong> - {$column->type}</li>";
        }
        echo "</ul>";
        
        $count = $DB->count_records('local_telegram_user_topic_performance');
        echo "<p>Total de registros: <strong>{$count}</strong></p>";
        
        if ($count > 0) {
            $recent = $DB->get_records_sql("
                SELECT * FROM {local_telegram_user_topic_performance} 
                ORDER BY updatedat DESC 
                LIMIT 5
            ");
            
            echo "<p>Últimos 5 registros:</p>";
            echo "<table border='1' style='border-collapse: collapse;'>";
            echo "<tr><th>Telegram User</th><th>Section</th><th>Total Q</th><th>Correct</th><th>Accuracy</th><th>Last Update</th></tr>";
            foreach ($recent as $record) {
                echo "<tr>";
                echo "<td>{$record->telegramuserid}</td>";
                echo "<td>{$record->sectionname}</td>";
                echo "<td>{$record->totalquestions}</td>";
                echo "<td>{$record->correctanswers}</td>";
                echo "<td>{$record->accuracy}%</td>";
                echo "<td>" . date('Y-m-d H:i:s', (int)$record->updatedat) . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        }
    } else {
        echo "<div style='color: red;'>❌ Tabla 'local_telegram_user_topic_performance' NO existe</div>";
        echo "<p>Intentando crear la tabla...</p>";
        
        if (function_exists('local_telegram_integration_ensure_performance_table')) {
            try {
                local_telegram_integration_ensure_performance_table();
                echo "<div style='color: green;'>✅ Tabla creada exitosamente</div>";
            } catch (Exception $e) {
                echo "<div style='color: red;'>❌ Error creando tabla: " . $e->getMessage() . "</div>";
            }
        } else {
            echo "<div style='color: red;'>❌ Función de creación de tabla no disponible</div>";
        }
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error verificando tabla: " . $e->getMessage() . "</div>";
}

// 4. Verificar la tabla quiz_attempts
echo "<h3>4. Verificación de Tabla mdl_quiz_attempts</h3>";
try {
    $moodle_activity_exists = $DB->get_manager()->table_exists('quiz_attempts');
    if ($moodle_activity_exists) {
        echo "<div style='color: green;'>✅ Tabla 'mdl_quiz_attempts' existe</div>";
        $count = $DB->count_records('quiz_attempts');
        echo "<p>Número de registros: $count</p>";

        if ($count > 0) {
            // Obtener los 5 registros más recientes
            $sql = "SELECT * FROM {quiz_attempts} ORDER BY timefinish DESC";
            $recent_attempts = $DB->get_records_sql($sql, [], 0, 5);

            echo "<h4>Últimos 5 Intentos de Cuestionario:</h4>";
            echo "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>ID</th><th>Quiz ID</th><th>User ID</th><th>Intento</th><th>Estado</th><th>Calificación Sumaria</th><th>Fecha Finalización</th></tr>";
            foreach ($recent_attempts as $attempt) {
                echo "<tr>";
                echo "<td>" . $attempt->id . "</td>";
                echo "<td>" . $attempt->quiz . "</td>";
                echo "<td>" . $attempt->userid . "</td>";
                echo "<td>" . $attempt->attempt . "</td>";
                echo "<td>" . $attempt->state . "</td>";
                echo "<td>" . (isset($attempt->sumgrades) ? $attempt->sumgrades : 'N/A') . "</td>";
                echo "<td>" . userdate($attempt->timefinish) . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<div style='color: orange;'>⚠️ No hay registros en mdl_quiz_attempts</div>";
        }
    } else {
        echo "<div style='color: red;'>❌ Tabla 'mdl_quiz_attempts' NO existe</div>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error verificando mdl_quiz_attempts: " . $e->getMessage() . "</div>";
}

// 5. Verificar usuarios vinculados a Telegram
echo "<h3>5. Verificación de Usuarios Vinculados</h3>";
try {
    $telegram_users = $DB->get_records_sql("
        SELECT v.*, u.username, u.firstname, u.lastname 
        FROM {local_telegram_verification} v
        JOIN {user} u ON v.userid = u.id
        WHERE v.verified = ?
        ORDER BY v.id DESC
        LIMIT 10
    ", [1]);
    
    if ($telegram_users) {
        echo "<div style='color: green;'>✅ Usuarios vinculados a Telegram encontrados: " . count($telegram_users) . "</div>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>User ID</th><th>Username</th><th>Name</th><th>Telegram ID</th><th>Verified</th></tr>";
        foreach ($telegram_users as $user) {
            echo "<tr>";
            echo "<td>{$user->userid}</td>";
            echo "<td>{$user->username}</td>";
            echo "<td>{$user->firstname} {$user->lastname}</td>";
            echo "<td>{$user->telegram_userid}</td>";
            echo "<td>✅</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<div style='color: red;'>❌ NO hay usuarios vinculados a Telegram</div>";
        echo "<p><strong>PROBLEMA CRÍTICO:</strong> Si no hay usuarios vinculados, el sistema no procesará ningún cuestionario.</p>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error verificando usuarios: " . $e->getMessage() . "</div>";
}

// 6. Verificar que las funciones críticas existan
echo "<h3>6. Verificación de Funciones Críticas</h3>";
$critical_functions = [
    'local_telegram_integration_get_verification_status',
    'local_telegram_integration_map_quiz_to_subject',
    'local_telegram_integration_update_user_topic_performance',
    'local_telegram_integration_send_complete_quiz_data',
    'local_telegram_integration_ensure_performance_table'
];

$missing_functions = [];
foreach ($critical_functions as $func) {
    if (function_exists($func)) {
        echo "<div style='color: green;'>✅ {$func}</div>";
    } else {
        echo "<div style='color: red;'>❌ {$func} - NO EXISTE</div>";
        $missing_functions[] = $func;
    }
}

// 7. Test manual del flujo completo
echo "<h3>7. Test Manual del Flujo Completo</h3>";
if (empty($missing_functions)) {
    echo "<p>Simulando el flujo completo con datos de prueba...</p>";
    
    // Obtener un usuario vinculado de ejemplo
    $test_user = $DB->get_record_sql("
        SELECT userid FROM {local_telegram_verification} 
        WHERE verified = 1 
        LIMIT 1
    ");
    
    if ($test_user) {
        echo "<p>Usuario de prueba: {$test_user->userid}</p>";
        
        // Test 1: Verificar vinculación
        $verification = local_telegram_integration_get_verification_status($test_user->userid);
        if ($verification) {
            echo "<div style='color: green;'>✅ Usuario vinculado correctamente</div>";
            echo "<p>Telegram User ID: {$verification->telegram_userid}</p>";
            
            // Test 2: Test de mapeo
            $test_quiz = 'OSCE';
            $mapped_subject = local_telegram_integration_map_quiz_to_subject($test_quiz);
            echo "<p>Mapeo de '{$test_quiz}' → '{$mapped_subject}'</p>";
            
            // Test 3: Test de actualización (simulado)
            echo "<p>Simulando actualización de rendimiento...</p>";
            echo "<div style='background: #f0f0f0; padding: 10px;'>";
            echo "<strong>Parámetros de prueba:</strong><br>";
            echo "- User ID: {$test_user->userid}<br>";
            echo "- Subject: {$mapped_subject}<br>";
            echo "- Total Questions: 10<br>";
            echo "- Correct Answers: 7<br>";
            echo "</div>";
            
            // NOTA: No ejecutamos la función real para evitar crear datos de prueba
            echo "<p><em>Nota: No se ejecuta la actualización real para evitar datos de prueba</em></p>";
            
        } else {
            echo "<div style='color: red;'>❌ Usuario no vinculado correctamente</div>";
        }
    } else {
        echo "<div style='color: red;'>❌ No hay usuarios vinculados para hacer pruebas</div>";
    }
} else {
    echo "<div style='color: red;'>❌ No se puede hacer el test - Faltan funciones críticas</div>";
}

// 8. Verificar logs de error recientes
echo "<h3>8. Verificación de Logs de Error</h3>";
$error_log_path = ini_get('error_log');
if ($error_log_path && file_exists($error_log_path)) {
    echo "<p>Archivo de log: {$error_log_path}</p>";
    
    $command = "tail -100 '{$error_log_path}' | grep -i 'telegram\\|quiz_attempt\\|observer'";
    $logs = shell_exec($command);
    
    if ($logs) {
        echo "<h4>Logs Relevantes (últimas 100 líneas):</h4>";
        echo "<pre style='background: #f0f0f0; padding: 10px; max-height: 400px; overflow-y: scroll;'>";
        echo htmlspecialchars($logs);
        echo "</pre>";
    } else {
        echo "<div style='color: orange;'>⚠️ No se encontraron logs relevantes recientes</div>";
    }
} else {
    echo "<div style='color: orange;'>⚠️ No se pudo acceder al archivo de logs</div>";
}

// 9. Verificar la configuración de Moodle
echo "<h3>9. Verificación de Configuración de Moodle</h3>";
echo "<p>Debug level: " . $CFG->debug . "</p>";
echo "<p>Debug display: " . ($CFG->debugdisplay ? 'ON' : 'OFF') . "</p>";

// 10. Diagnóstico y recomendaciones
echo "<h3>10. Diagnóstico y Recomendaciones</h3>";
echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffeaa7;'>";
echo "<h4>Posibles Causas del Problema:</h4>";
echo "<ul>";
echo "<li><strong>Event Observer no registrado:</strong> El observer no se ejecuta cuando ocurre quiz_attempt_submitted</li>";
echo "<li><strong>Usuarios no vinculados:</strong> Los usuarios no están vinculados a Telegram</li>";
echo "<li><strong>Tabla no existe:</strong> La tabla de rendimiento no existe o tiene estructura incorrecta</li>";
echo "<li><strong>Función falla silenciosamente:</strong> La función de actualización tiene errores internos</li>";
echo "<li><strong>Permisos de base de datos:</strong> Problemas de permisos para INSERT/UPDATE</li>";
echo "<li><strong>Plugin no instalado correctamente:</strong> El plugin no está registrado en Moodle</li>";
echo "</ul>";
echo "</div>";

echo "<h3>11. Próximos Pasos de Depuración</h3>";
echo "<ol>";
echo "<li>Verificar que hay usuarios vinculados a Telegram</li>";
echo "<li>Hacer un cuestionario de prueba y monitorear logs</li>";
echo "<li>Verificar manualmente si el observer se ejecuta</li>";
echo "<li>Probar manualmente la función de actualización</li>";
echo "<li>Verificar permisos de base de datos</li>";
echo "<li>Reinstalar el plugin si es necesario</li>";
echo "</ol>";

echo "<p style='color: blue;'><strong>Diagnóstico completo finalizado.</strong></p>";
?> 