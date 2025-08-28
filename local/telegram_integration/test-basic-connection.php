<?php
// Verificar cómo se conecta correctamente

require_once(dirname(__FILE__) . '/../../config.php');
require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

echo "<h2>🔧 Test Básico de Conexión y Funcionalidad</h2>";
echo "<p>Verificando que las correcciones funcionan correctamente...</p>";

global $DB;

// 1. Verificar conexión básica
echo "<h3>1. Verificación de Conexión Básica</h3>";
try {
    $test_query = $DB->get_record_sql("SELECT 1 as test");
    if ($test_query) {
        echo "<div style='color: green;'>✅ Conexión a base de datos OK</div>";
    } else {
        echo "<div style='color: red;'>❌ Problema con conexión a base de datos</div>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error de conexión: " . htmlspecialchars($e->getMessage()) . "</div>";
}

// 2. Verificar que las funciones críticas existen
echo "<h3>2. Verificación de Funciones Críticas</h3>";
$functions = [
    'local_telegram_integration_update_user_topic_performance',
    'local_telegram_integration_map_quiz_to_subject',
    'local_telegram_integration_get_verification_status'
];

foreach ($functions as $func) {
    if (function_exists($func)) {
        echo "<div style='color: green;'>✅ {$func}</div>";
    } else {
        echo "<div style='color: red;'>❌ {$func} - NO EXISTE</div>";
    }
}

// 3. Verificar tablas básicas
echo "<h3>3. Verificación de Tablas Básicas</h3>";
// Lista de tablas a verificar
$tables_to_check = [
    'local_telegram_verification',
    'local_telegram_user_topic_performance',
    'quiz_attempts'
];

foreach ($tables_to_check as $table) {
    try {
        if ($DB->get_manager()->table_exists($table)) {
            $count = $DB->count_records($table);
            echo "<div style='color: green;'>✅ Tabla '{$table}' existe<br>Registros: {$count}</div>";
        } else {
            echo "<div style='color: red;'>❌ Tabla '{$table}' NO existe</div>";
        }
    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ Error al verificar tabla '{$table}': " . $e->getMessage() . "</div>";
    }
}

// 4. Verificar usuarios vinculados (usando consulta simple)
echo "<h3>4. Verificación de Usuarios Vinculados</h3>";
try {
    // Primero verificar si la tabla existe
    if ($DB->get_manager()->table_exists('local_telegram_verification')) {
        $verified_users = $DB->get_records('local_telegram_verification', ['verified' => 1]);
        $count = count($verified_users);
        
        if ($count > 0) {
            echo "<div style='color: green;'>✅ Usuarios vinculados encontrados: {$count}</div>";
            
            // Mostrar algunos usuarios
            $i = 0;
            foreach ($verified_users as $user) {
                if ($i >= 3) break; // Mostrar solo los primeros 3
                echo "<div style='margin-left: 20px;'>User ID: {$user->userid}, Telegram ID: {$user->telegram_userid}</div>";
                $i++;
            }
        } else {
            echo "<div style='color: red;'>❌ NO hay usuarios vinculados</div>";
            echo "<p><strong>PROBLEMA CRÍTICO:</strong> Necesitas vincular al menos un usuario a Telegram para que funcione el sistema.</p>";
        }
    } else {
        echo "<div style='color: red;'>❌ Tabla de verificación no existe</div>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error verificando usuarios: " . htmlspecialchars($e->getMessage()) . "</div>";
}

// 5. Test simple de mapeo
echo "<h3>5. Test Simple de Mapeo</h3>";
try {
    $test_mappings = [
        'OSCE' => 'organismos internacionales',
        'OTAN' => 'organismos internacionales',
        'Constitución' => 'derecho constitucional',
        'Test general' => 'general'
    ];
    
    foreach ($test_mappings as $quiz_name => $expected) {
        $result = local_telegram_integration_map_quiz_to_subject($quiz_name);
        $color = ($result === $expected) ? 'green' : 'red';
        $icon = ($result === $expected) ? '✅' : '❌';
        echo "<div style='color: {$color};'>{$icon} '{$quiz_name}' → '{$result}'</div>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error en mapeo: " . htmlspecialchars($e->getMessage()) . "</div>";
}

// 6. Verificar configuración del plugin
echo "<h3>6. Verificación de Configuración del Plugin</h3>";
try {
    $plugin_config = $DB->get_record('config_plugins', [
        'plugin' => 'local_telegram_integration',
        'name' => 'version'
    ]);
    
    if ($plugin_config) {
        echo "<div style='color: green;'>✅ Plugin configurado - Versión: {$plugin_config->value}</div>";
    } else {
        echo "<div style='color: red;'>❌ Plugin NO configurado</div>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error verificando configuración: " . htmlspecialchars($e->getMessage()) . "</div>";
}

// 7. Verificar permisos básicos
echo "<h3>7. Verificación de Permisos Básicos</h3>";
$test_files = [
    'locallib.php',
    'classes/observer.php',
    'db/events.php'
];

foreach ($test_files as $file) {
    $full_path = $CFG->dirroot . '/local/telegram_integration/' . $file;
    if (file_exists($full_path)) {
        $readable = is_readable($full_path);
        $color = $readable ? 'green' : 'red';
        $icon = $readable ? '✅' : '❌';
        echo "<div style='color: {$color};'>{$icon} {$file} - " . ($readable ? 'LEGIBLE' : 'NO LEGIBLE') . "</div>";
    } else {
        echo "<div style='color: red;'>❌ {$file} - NO EXISTE</div>";
    }
}

// 8. Resumen y próximos pasos
echo "<h3>8. Resumen y Próximos Pasos</h3>";
echo "<div style='background: #e7f3ff; padding: 15px; border: 1px solid #b3d9ff;'>";
echo "<h4>Estado del Sistema:</h4>";
echo "<p>Si todos los checks anteriores están en verde (✅), puedes continuar con:</p>";
echo "<ol>";
echo "<li>Activar debug en Moodle</li>";
echo "<li>Hacer un cuestionario con usuario vinculado</li>";
echo "<li>Revisar logs para ver si el observer se ejecuta</li>";
echo "</ol>";
echo "<p>Si hay errores rojos (❌), necesitas corregirlos primero.</p>";
echo "</div>";

// 9. Información de debug
echo "<h3>9. Información de Debug</h3>";
echo "<p>Moodle debug level: " . $CFG->debug . "</p>";
echo "<p>PHP version: " . phpversion() . "</p>";
echo "<p>Moodle version: " . $CFG->version . "</p>";

echo "<p style='color: blue;'><strong>Test básico completado. Los scripts principales deberían funcionar ahora.</strong></p>";
?> 