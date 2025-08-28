<?php
/**
 * Test BD Unificada - Verificación Completa
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

echo "🎯 VERIFICACIÓN BD UNIFICADA\n";
echo "============================\n";
echo "BD: u449034524_moodel_telegra\n";
echo "Usuario: u449034524_opomelilla_25\n";
echo "Hosting: Remoto\n\n";

// 1. Verificar conexión Moodle
echo "📊 1. Verificando Conexión Moodle Nativa...\n";
try {
    $db_info = $DB->get_manager()->get_dbname();
    echo "✅ Conexión Moodle: ACTIVA\n";
    echo "   - Base de datos: {$db_info}\n\n";
} catch (Exception $e) {
    echo "❌ Error conexión Moodle: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. Verificar usuario Moodle
echo "👤 2. Verificando Usuario Moodle...\n";
$moodle_user_id = 2;
$user = $DB->get_record('user', ['id' => $moodle_user_id]);
if ($user) {
    echo "✅ Usuario Moodle encontrado:\n";
    echo "   - ID: {$user->id}\n";
    echo "   - Username: {$user->username}\n";
    echo "   - Email: {$user->email}\n\n";
} else {
    echo "❌ Usuario Moodle no encontrado\n";
    exit(1);
}

// 3. Verificar tablas Telegram en BD unificada
echo "🔍 3. Verificando Tablas Telegram...\n";
$table_results = verify_telegram_tables();
if ($table_results) {
    foreach ($table_results as $table => $result) {
        if ($result['exists']) {
            echo "✅ Tabla {$table}: {$result['count']} registros\n";
        } else {
            echo "❌ Tabla {$table}: No existe - {$result['error']}\n";
        }
    }
    echo "\n";
} else {
    echo "❌ Error verificando tablas\n";
}

// 4. Verificar mapeo usuario
echo "🔗 4. Verificando Mapeo Usuario...\n";
$telegram_uuid = get_telegram_uuid_from_moodle_user_id($moodle_user_id);
if ($telegram_uuid) {
    echo "✅ Mapeo encontrado:\n";
    echo "   - Moodle ID: {$moodle_user_id}\n";
    echo "   - Telegram UUID: {$telegram_uuid}\n\n";
} else {
    echo "❌ No se encontró mapeo activo\n";
    
    // Buscar mapeos inactivos
    try {
        $inactive_mapping = $DB->get_record('MoodleUserLink', 
            ['moodleUserId' => $moodle_user_id], 
            'telegramUserId, isActive'
        );
        if ($inactive_mapping) {
            echo "⚠️ Mapeo inactivo encontrado:\n";
            echo "   - Telegram UUID: {$inactive_mapping->telegramUserId}\n";
            echo "   - Estado: " . ($inactive_mapping->isActive ? "Activo" : "Inactivo") . "\n\n";
        }
    } catch (Exception $e) {
        echo "❌ Error buscando mapeos: " . $e->getMessage() . "\n";
    }
}

// 5. Obtener datos analytics usando funciones nativas
echo "📈 5. Obteniendo Analytics con Funciones Nativas...\n";
if ($telegram_uuid) {
    try {
        $success_rate = get_success_rate_from_telegram_db($moodle_user_id);
        $total_questions = get_total_questions_from_telegram_db($moodle_user_id);
        $correct_answers = get_correct_answers_from_telegram_db($moodle_user_id);
        $ranking = get_user_ranking_from_telegram_db($moodle_user_id);
        
        echo "✅ Datos Analytics (Funciones Nativas):\n";
        echo "   - Tasa de Éxito: " . ($success_rate !== false ? $success_rate . "%" : "N/A") . "\n";
        echo "   - Total Preguntas: " . ($total_questions !== false ? $total_questions : "N/A") . "\n";
        echo "   - Respuestas Correctas: " . ($correct_answers !== false ? $correct_answers : "N/A") . "\n";
        echo "   - Ranking: " . ($ranking !== false ? "#" . $ranking : "N/A") . "\n\n";
        
        // Verificar si son datos reales
        if ($total_questions > 0) {
            echo "🎉 ¡DATOS REALES ENCONTRADOS!\n";
            echo "📊 Usuario con {$total_questions} respuestas y {$success_rate}% de precisión\n\n";
        } else {
            echo "⚠️ Sin respuestas registradas para este usuario\n\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error obteniendo analytics: " . $e->getMessage() . "\n";
    }
} else {
    echo "⚠️ Saltando analytics - sin mapeo activo\n\n";
}

// 6. Estadísticas generales del sistema
echo "📊 6. Estadísticas Generales del Sistema...\n";
try {
    $system_stats = get_telegram_system_stats();
    if ($system_stats) {
        echo "✅ Estadísticas del Sistema:\n";
        echo "   - Total Usuarios Telegram: {$system_stats['total_telegram_users']}\n";
        echo "   - Total Respuestas: {$system_stats['total_responses']}\n";
        echo "   - Mapeos Activos: {$system_stats['active_mappings']}\n";
        echo "   - Respuestas Correctas: {$system_stats['total_correct']}\n";
        echo "   - Tasa Éxito Global: {$system_stats['global_success_rate']}%\n\n";
    } else {
        echo "❌ Error obteniendo estadísticas del sistema\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

// 7. Verificación de funciones específicas
echo "🔧 7. Verificando Funciones Específicas...\n";
$functions_to_test = [
    'get_telegram_uuid_from_moodle_user_id',
    'get_success_rate_from_telegram_db',
    'get_total_questions_from_telegram_db',
    'get_correct_answers_from_telegram_db',
    'get_user_ranking_from_telegram_db',
    'verify_telegram_tables',
    'get_telegram_system_stats'
];

foreach ($functions_to_test as $function) {
    if (function_exists($function)) {
        echo "✅ Función {$function}: Disponible\n";
    } else {
        echo "❌ Función {$function}: No encontrada\n";
    }
}

// 8. Resultado final
echo "\n🏁 RESULTADO FINAL\n";
echo "==================\n";

$all_good = true;
$issues = [];

// Verificar conexión
if (!isset($db_info)) {
    $all_good = false;
    $issues[] = "Conexión BD";
}

// Verificar usuario
if (!$user) {
    $all_good = false;
    $issues[] = "Usuario Moodle";
}

// Verificar tablas
if (!$table_results) {
    $all_good = false;
    $issues[] = "Tablas Telegram";
}

// Verificar mapeo
if (!$telegram_uuid) {
    $all_good = false;
    $issues[] = "Mapeo Usuario";
}

// Verificar datos
if (!isset($total_questions) || $total_questions === false) {
    $all_good = false;
    $issues[] = "Datos Analytics";
}

if ($all_good) {
    echo "🎯 ¡SISTEMA COMPLETAMENTE FUNCIONAL!\n";
    echo "✅ BD Unificada: Operativa\n";
    echo "✅ Conexión Nativa Moodle: Funcionando\n";
    echo "✅ Funciones Analytics: Disponibles\n";
    echo "✅ Datos Reales: Accesibles\n";
    echo "\n🚀 El analytics debería mostrar datos reales ahora\n";
} else {
    echo "⚠️ PROBLEMAS DETECTADOS:\n";
    foreach ($issues as $issue) {
        echo "   - {$issue}\n";
    }
    echo "\n🔧 Revisar configuración antes de usar analytics\n";
}

echo "\n📌 PRÓXIMO PASO:\n";
echo "🔗 Acceder a: https://campus.opomelilla.com/local/telegram_integration/analytics.php\n";
echo "📊 Verificar que muestre datos reales (no 0%)\n";

echo "\n=== FIN VERIFICACIÓN BD UNIFICADA ===\n";
?> 