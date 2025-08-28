<?php
/**
 * Script de Verificación Final del Sistema Analytics - Versión Web
 * Verifica que los datos reales del usuario estén siendo mostrados
 */

// Configuración de entorno Moodle para web
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Verificar que el usuario esté logueado
require_login();

// Solo permitir a administradores o al usuario específico
if (!is_siteadmin() && $USER->id != 2) {
    print_error('nopermission', 'error');
}

// Configurar headers para mostrar como texto plano
header('Content-Type: text/plain; charset=utf-8');

echo "🔧 VERIFICACIÓN FINAL DEL SISTEMA ANALYTICS\n";
echo "==========================================\n\n";

// 1. Verificar conexión a BD Telegram
echo "📊 1. Verificando Conexión BD Telegram...\n";
try {
    $telegram_db = get_telegram_db_connection();
    if ($telegram_db) {
        echo "✅ Conexión BD Telegram: EXITOSA\n\n";
    } else {
        echo "❌ Error: No se pudo conectar a BD Telegram\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "❌ Error conexión BD: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. Verificar usuario Moodle actual
echo "👤 2. Verificando Usuario Moodle...\n";
$moodle_user_id = 2; // Usuario opomelilla
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

// 3. Verificar mapeo Moodle ↔ Telegram
echo "🔗 3. Verificando Mapeo Usuario...\n";
$telegram_uuid = get_telegram_uuid_from_moodle_user_id($moodle_user_id);
if ($telegram_uuid) {
    echo "✅ Mapeo encontrado:\n";
    echo "   - Moodle ID: {$moodle_user_id}\n";
    echo "   - Telegram UUID: {$telegram_uuid}\n\n";
} else {
    echo "❌ No se encontró mapeo para usuario Moodle ID {$moodle_user_id}\n";
    exit(1);
}

// 4. Verificar datos de analytics desde BD Telegram
echo "📈 4. Obteniendo Datos Analytics Reales...\n";

try {
    // Obtener datos usando las funciones de lib.php
    $success_rate = get_success_rate_from_telegram_db($moodle_user_id);
    $total_questions = get_total_questions_from_telegram_db($moodle_user_id);
    $correct_answers = get_correct_answers_from_telegram_db($moodle_user_id);
    $user_ranking = get_user_ranking_from_telegram_db($moodle_user_id);
    
    echo "✅ Datos Analytics Obtenidos:\n";
    echo "   - Tasa de Éxito: " . ($success_rate !== false ? $success_rate . "%" : "N/A") . "\n";
    echo "   - Total Preguntas: " . ($total_questions !== false ? $total_questions : "N/A") . "\n";
    echo "   - Respuestas Correctas: " . ($correct_answers !== false ? $correct_answers : "N/A") . "\n";
    echo "   - Ranking Usuario: " . ($user_ranking !== false ? $user_ranking : "N/A") . "\n\n";
    
    // Verificar si son datos reales (no ceros)
    if ($success_rate > 0 || $total_questions > 0 || $correct_answers > 0) {
        echo "🎉 ¡ÉXITO! El sistema está mostrando DATOS REALES\n";
        echo "📊 Resumen:\n";
        echo "   - Usuario tiene {$total_questions} respuestas registradas\n";
        echo "   - Precisión del {$success_rate}%\n";
        echo "   - {$correct_answers} respuestas correctas\n";
        
        if ($user_ranking !== false) {
            echo "   - Posición en ranking: #{$user_ranking}\n";
        }
        
    } else {
        echo "⚠️ ADVERTENCIA: Todos los valores son 0 - posible problema en funciones\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error obteniendo datos analytics: " . $e->getMessage() . "\n";
}

// 5. Verificación directa en BD Telegram
echo "\n🔍 5. Verificación Directa en BD Telegram...\n";
try {
    $stmt = $telegram_db->prepare("
        SELECT COUNT(*) as total_responses,
               SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correct_responses,
               ROUND(AVG(CASE WHEN isCorrect = 1 THEN 100 ELSE 0 END), 2) as success_rate
        FROM telegramresponse 
        WHERE userId = ?
    ");
    $stmt->execute([$telegram_uuid]);
    $direct_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($direct_data) {
        echo "✅ Verificación Directa BD:\n";
        echo "   - Total Respuestas: {$direct_data['total_responses']}\n";
        echo "   - Respuestas Correctas: {$direct_data['correct_responses']}\n";
        echo "   - Tasa de Éxito: {$direct_data['success_rate']}%\n\n";
        
        // Comparar con datos de funciones
        if ($direct_data['total_responses'] == $total_questions && 
            $direct_data['correct_responses'] == $correct_answers) {
            echo "✅ VERIFICACIÓN COMPLETA: Las funciones devuelven datos correctos\n";
        } else {
            echo "⚠️ DISCREPANCIA: Diferencia entre funciones y BD directa\n";
            echo "   Funciones vs BD Directa:\n";
            echo "   - Total: {$total_questions} vs {$direct_data['total_responses']}\n";
            echo "   - Correctas: {$correct_answers} vs {$direct_data['correct_responses']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error en verificación directa: " . $e->getMessage() . "\n";
}

// 6. Estado final del sistema
echo "\n🏁 ESTADO FINAL DEL SISTEMA\n";
echo "===========================\n";
if ($success_rate > 0 && $total_questions > 0) {
    echo "🎯 SISTEMA FUNCIONANDO CORRECTAMENTE\n";
    echo "📊 El analytics muestra datos reales del usuario\n";
    echo "🔗 El mapeo Moodle ↔ Telegram está activo\n";
    echo "✅ Problema RESUELTO\n";
} else {
    echo "❌ SISTEMA AÚN CON PROBLEMAS\n";
    echo "🔧 Requiere investigación adicional\n";
}

echo "\n=== FIN VERIFICACIÓN ===\n";
echo "\n📌 PRÓXIMO PASO: Acceder a analytics.php para ver la interfaz real\n";
echo "🔗 URL: https://campus.opomelilla.com/local/telegram_integration/analytics.php\n";
?> 