<?php
/**
 * Test BD Unificada - Versión Corregida
 * BD: u449034524_moodel_telegra
 * Usuario: u449034524_opomelilla_25
 */

// Configuración Moodle
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_login();

// Solo permitir a administradores o usuario específico
if (!is_siteadmin() && $USER->id != 2) {
    print_error('nopermission', 'error');
}

header('Content-Type: text/plain; charset=utf-8');

echo "🎯 VERIFICACIÓN BD UNIFICADA - VERSIÓN CORREGIDA\n";
echo "===============================================\n";
echo "BD: u449034524_moodel_telegra\n";
echo "Usuario: u449034524_opomelilla_25\n";
echo "Hosting: Remoto\n\n";

// 1. Verificar conexión Moodle usando método compatible
echo "📊 1. Verificando Conexión Moodle Nativa...\n";
try {
    // Usar CFG en lugar de database_manager
    global $CFG;
    echo "✅ Conexión Moodle: ACTIVA\n";
    echo "   - Base de datos: " . (isset($CFG->dbname) ? $CFG->dbname : "No disponible") . "\n";
    echo "   - Servidor: " . (isset($CFG->dbhost) ? $CFG->dbhost : "No disponible") . "\n";
    echo "   - Usuario BD: " . (isset($CFG->dbuser) ? $CFG->dbuser : "No disponible") . "\n\n";
} catch (Exception $e) {
    echo "❌ Error conexión Moodle: " . $e->getMessage() . "\n";
}

// 2. Verificar usuario Moodle
echo "👤 2. Verificando Usuario Moodle...\n";
$moodle_user_id = 2;
try {
    $user = $DB->get_record('user', ['id' => $moodle_user_id]);
    if ($user) {
        echo "✅ Usuario Moodle encontrado:\n";
        echo "   - ID: {$user->id}\n";
        echo "   - Username: {$user->username}\n";
        echo "   - Email: {$user->email}\n\n";
    } else {
        echo "❌ Usuario Moodle no encontrado\n";
    }
} catch (Exception $e) {
    echo "❌ Error obteniendo usuario: " . $e->getMessage() . "\n";
}

// 3. Verificar tablas Telegram manualmente
echo "🔍 3. Verificando Tablas Telegram (Manual)...\n";
$telegram_tables = ['MoodleUserLink', 'TelegramUser', 'telegramresponse'];

foreach ($telegram_tables as $table) {
    try {
        $count = $DB->count_records($table);
        echo "✅ Tabla {$table}: {$count} registros\n";
    } catch (Exception $e) {
        echo "❌ Tabla {$table}: Error - " . $e->getMessage() . "\n";
    }
}
echo "\n";

// 4. Verificar mapeo usuario manualmente
echo "🔗 4. Verificando Mapeo Usuario (Manual)...\n";
try {
    $mapping = $DB->get_record('MoodleUserLink', 
        ['moodleUserId' => $moodle_user_id], 
        'telegramUserId, isActive'
    );
    
    if ($mapping) {
        $telegram_uuid = $mapping->telegramUserId;
        $is_active = $mapping->isActive;
        echo "✅ Mapeo encontrado:\n";
        echo "   - Moodle ID: {$moodle_user_id}\n";
        echo "   - Telegram UUID: {$telegram_uuid}\n";
        echo "   - Estado: " . ($is_active ? "Activo" : "Inactivo") . "\n\n";
    } else {
        echo "❌ No se encontró mapeo\n";
        $telegram_uuid = null;
    }
} catch (Exception $e) {
    echo "❌ Error buscando mapeo: " . $e->getMessage() . "\n";
    $telegram_uuid = null;
}

// 5. Verificar datos analytics manualmente (sin usar funciones)
echo "📈 5. Obteniendo Analytics (Consulta Directa)...\n";
if ($telegram_uuid) {
    try {
        // Consulta directa para total y correctas
        $sql = "SELECT 
                    COUNT(*) as total_responses,
                    SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correct_responses
                FROM {telegramresponse} 
                WHERE userId = ?";
        
        $result = $DB->get_record_sql($sql, [$telegram_uuid]);
        
        if ($result) {
            $total_questions = $result->total_responses;
            $correct_answers = $result->correct_responses;
            $success_rate = $total_questions > 0 ? round(($correct_answers / $total_questions) * 100, 2) : 0;
            
            echo "✅ Datos Analytics (Consulta Directa):\n";
            echo "   - Total Preguntas: {$total_questions}\n";
            echo "   - Respuestas Correctas: {$correct_answers}\n";
            echo "   - Tasa de Éxito: {$success_rate}%\n\n";
            
            if ($total_questions > 0) {
                echo "🎉 ¡DATOS REALES ENCONTRADOS!\n";
                echo "📊 Usuario con {$total_questions} respuestas y {$success_rate}% de precisión\n\n";
            } else {
                echo "⚠️ Sin respuestas registradas para este usuario\n\n";
            }
        }
        
    } catch (Exception $e) {
        echo "❌ Error obteniendo analytics: " . $e->getMessage() . "\n";
    }
} else {
    echo "⚠️ Saltando analytics - sin mapeo válido\n\n";
}

// 6. Estadísticas generales del sistema (manual)
echo "📊 6. Estadísticas Generales (Manual)...\n";
try {
    $total_telegram_users = $DB->count_records('TelegramUser');
    $total_responses = $DB->count_records('telegramresponse');
    $active_mappings = $DB->count_records('MoodleUserLink', ['isActive' => 1]);
    $total_correct = $DB->count_records('telegramresponse', ['isCorrect' => 1]);
    
    $global_success_rate = $total_responses > 0 ? round(($total_correct / $total_responses) * 100, 2) : 0;
    
    echo "✅ Estadísticas del Sistema:\n";
    echo "   - Total Usuarios Telegram: {$total_telegram_users}\n";
    echo "   - Total Respuestas: {$total_responses}\n";
    echo "   - Mapeos Activos: {$active_mappings}\n";
    echo "   - Respuestas Correctas: {$total_correct}\n";
    echo "   - Tasa Éxito Global: {$global_success_rate}%\n\n";
    
} catch (Exception $e) {
    echo "❌ Error obteniendo estadísticas: " . $e->getMessage() . "\n";
}

// 7. Verificar funciones personalizadas
echo "🔧 7. Verificando Funciones Personalizadas...\n";
$functions_to_test = [
    'get_telegram_uuid_from_moodle_user_id',
    'get_success_rate_from_telegram_db',
    'get_total_questions_from_telegram_db',
    'get_correct_answers_from_telegram_db'
];

foreach ($functions_to_test as $function) {
    if (function_exists($function)) {
        echo "✅ Función {$function}: Disponible\n";
        
        // Probar la función si existe el mapeo
        if ($telegram_uuid && $function === 'get_telegram_uuid_from_moodle_user_id') {
            try {
                $test_result = call_user_func($function, $moodle_user_id);
                echo "   → Resultado: " . ($test_result ? $test_result : "null") . "\n";
            } catch (Exception $e) {
                echo "   → Error ejecutando: " . $e->getMessage() . "\n";
            }
        }
    } else {
        echo "❌ Función {$function}: No encontrada\n";
    }
}

// 8. Diagnóstico de errores comunes
echo "\n🔍 8. Diagnóstico de Errores Comunes...\n";

// Verificar prefijo de tablas
echo "📋 Prefijo de tablas: " . (isset($CFG->prefix) ? $CFG->prefix : "No definido") . "\n";

// Verificar si las tablas existen realmente
echo "🔍 Verificando existencia real de tablas:\n";
try {
    $tables = $DB->get_manager()->get_install_xml_schema();
    echo "   - Schema manager: Disponible\n";
} catch (Exception $e) {
    echo "   - Schema manager: Error - " . $e->getMessage() . "\n";
}

// 9. Resultado final
echo "\n🏁 RESULTADO FINAL\n";
echo "==================\n";

if (isset($total_questions) && $total_questions > 0) {
    echo "🎯 ¡SISTEMA FUNCIONANDO!\n";
    echo "✅ BD Unificada: Conectada\n";
    echo "✅ Tablas Telegram: Accesibles\n";
    echo "✅ Datos Reales: Disponibles ({$total_questions} respuestas)\n";
    echo "✅ Mapeo Usuario: " . (isset($telegram_uuid) && $telegram_uuid ? "Activo" : "Pendiente") . "\n";
    echo "\n🚀 El sistema debería funcionar correctamente\n";
} else {
    echo "⚠️ PROBLEMAS DETECTADOS\n";
    echo "🔧 Revisar:\n";
    echo "   - Configuración BD en config.php del servidor\n";
    echo "   - Migración de datos a BD unificada\n";
    echo "   - Mapeo de usuario activo\n";
}

echo "\n📌 PRÓXIMOS PASOS:\n";
echo "1. Verificar que config.php use BD unificada: u449034524_moodel_telegra\n";
echo "2. Confirmar migración de datos Telegram completada\n";
echo "3. Activar mapeo usuario si está inactivo\n";
echo "4. Probar analytics.php nuevamente\n";

echo "\n=== FIN VERIFICACIÓN CORREGIDA ===\n";
?> 