<?php
/**
 * Test Analytics Simple - Conexión Directa
 * Versión que no depende de funciones personalizadas
 */

// Configuración de entorno Moodle
require_once(__DIR__ . '/../../config.php');
require_login();

// Solo permitir a administradores o al usuario específico
if (!is_siteadmin() && $USER->id != 2) {
    print_error('nopermission', 'error');
}

header('Content-Type: text/plain; charset=utf-8');

echo "🔧 TEST ANALYTICS SIMPLE - CONEXIÓN DIRECTA\n";
echo "===========================================\n\n";

// Configuración BD Telegram (conexión directa)
$telegram_config = [
    'host' => 'localhost',
    'dbname' => 'u449034524_mi_ia_db',
    'username' => 'u449034524_mi_ia',
    'password' => 'Opomelilla2024!',
    'type' => 'mysql' // Added type for dynamic DSN
];

echo "📊 1. Conectando a BD Telegram (Directa)...\n";
try {
    $dsn = "mysql:host={$telegram_config['host']};dbname={$telegram_config['dbname']};charset=utf8mb4";
    $pdo = new PDO($dsn, $telegram_config['username'], $telegram_config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión BD Telegram: EXITOSA\n\n";
} catch (Exception $e) {
    echo "❌ Error conexión BD Telegram: " . $e->getMessage() . "\n";
    exit(1);
}

echo "👤 2. Verificando Usuario Moodle...\n";
$moodle_user_id = 2;
$user = $DB->get_record('user', ['id' => $moodle_user_id]);
if ($user) {
    echo "✅ Usuario Moodle encontrado:\n";
    echo "   - ID: {$user->id}\n";
    echo "   - Username: {$user->username}\n\n";
} else {
    echo "❌ Usuario Moodle no encontrado\n";
    exit(1);
}

echo "🔗 3. Buscando Mapeo Usuario...\n";
try {
    // Buscar en tabla MoodleUserLink
    $stmt = $pdo->prepare("
        SELECT telegramUserId, isActive 
        FROM MoodleUserLink 
        WHERE moodleUserId = ?
    ");
    $stmt->execute([$moodle_user_id]);
    $mapping = $stmt->fetch();
    
    if ($mapping) {
        $telegram_uuid = $mapping['telegramUserId'];
        $is_active = $mapping['isActive'];
        echo "✅ Mapeo encontrado:\n";
        echo "   - Moodle ID: {$moodle_user_id}\n";
        echo "   - Telegram UUID: {$telegram_uuid}\n";
        echo "   - Estado: " . ($is_active ? "Activo" : "Inactivo") . "\n\n";
    } else {
        echo "❌ No se encontró mapeo\n";
        exit(1);
    }
} catch (Exception $e) {
    echo "❌ Error buscando mapeo: " . $e->getMessage() . "\n";
    exit(1);
}

echo "📈 4. Obteniendo Datos Analytics...\n";
try {
    // Consulta directa a telegramresponse
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_responses,
            SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as correct_responses,
            ROUND(AVG(CASE WHEN isCorrect = 1 THEN 100 ELSE 0 END), 2) as success_rate
        FROM telegramresponse 
        WHERE userId = ?
    ");
    $stmt->execute([$telegram_uuid]);
    $analytics = $stmt->fetch();
    
    if ($analytics) {
        echo "✅ Datos Analytics Obtenidos:\n";
        echo "   - Total Respuestas: {$analytics['total_responses']}\n";
        echo "   - Respuestas Correctas: {$analytics['correct_responses']}\n";
        echo "   - Tasa de Éxito: {$analytics['success_rate']}%\n\n";
        
        if ($analytics['total_responses'] > 0) {
            echo "🎉 ¡DATOS REALES ENCONTRADOS!\n";
            echo "📊 El usuario tiene {$analytics['total_responses']} respuestas\n";
            echo "🎯 Con una precisión del {$analytics['success_rate']}%\n\n";
        } else {
            echo "⚠️ No se encontraron respuestas para este usuario\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error obteniendo analytics: " . $e->getMessage() . "\n";
}

echo "🔍 5. Verificando Estructura de Datos...\n";
try {
    // Verificar total de usuarios en sistema
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_users FROM TelegramUser");
    $stmt->execute();
    $total_users = $stmt->fetchColumn();
    
    // Verificar total de respuestas en sistema
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_responses FROM telegramresponse");
    $stmt->execute();
    $total_responses = $stmt->fetchColumn();
    
    echo "✅ Estructura del Sistema:\n";
    echo "   - Total Usuarios Telegram: {$total_users}\n";
    echo "   - Total Respuestas Sistema: {$total_responses}\n\n";
    
} catch (Exception $e) {
    echo "❌ Error verificando estructura: " . $e->getMessage() . "\n";
}

echo "🏁 CONCLUSIONES\n";
echo "===============\n";
echo "✅ Conexión BD Telegram: Funcionando\n";
echo "✅ Usuario Moodle: Identificado\n";
echo "✅ Mapeo: " . (isset($telegram_uuid) ? "Encontrado" : "No encontrado") . "\n";
echo "✅ Datos: " . (isset($analytics) && $analytics['total_responses'] > 0 ? "Reales disponibles" : "No disponibles") . "\n\n";

echo "🔧 PROBLEMA IDENTIFICADO:\n";
echo "- Las funciones personalizadas no se cargan en contexto Moodle\n";
echo "- Necesitamos integrar mejor las dos BD o unificarlas\n\n";

echo "💡 RECOMENDACIÓN:\n";
echo "- Migrar datos de BD Telegram a BD Moodle\n";
echo "- Usar solo la conexión nativa de Moodle\n";
echo "- Eliminar complejidad de conexiones múltiples\n";
?> 