<?php
/**
 * Script para corregir el mapeo Moodle <-> Telegram
 */

require_once('../../config.php');
require_login();
require_capability('moodle/site:config', context_system::instance());

// Incluir configuración de BD Telegram
require_once($CFG->dirroot . '/local/telegram_integration/telegram-db-config.php');

echo "<h1>🔧 Corregir Mapeo Usuario Moodle ↔ Telegram</h1>";

$pdo = createTelegramDatabaseConnection();
if (!$pdo) {
    echo "❌ Error conectando a BD Telegram<br>";
    exit;
}

global $USER;

// Datos conocidos
$moodle_user_id = $USER->id; // 2
$telegram_user_uuid = '2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f'; // Usuario con 1,412 respuestas

echo "<h2>📋 Datos a Mapear</h2>";
echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px;'>";
echo "<strong>Moodle User ID:</strong> $moodle_user_id<br>";
echo "<strong>Moodle Username:</strong> " . $USER->username . "<br>";
echo "<strong>Telegram User UUID:</strong> $telegram_user_uuid<br>";
echo "</div>";

try {
    // Verificar que el usuario de Telegram existe
    echo "<h2>🔍 Verificar Usuario Telegram</h2>";
    $stmt = $pdo->prepare("SELECT * FROM telegramuser WHERE id = ?");
    $stmt->execute([$telegram_user_uuid]);
    $telegramUser = $stmt->fetch();
    
    if (!$telegramUser) {
        echo "❌ Error: Usuario Telegram no encontrado con UUID: $telegram_user_uuid<br>";
        exit;
    }
    
    echo "✅ Usuario Telegram encontrado:<br>";
    echo "- Telegram ID: " . $telegramUser['telegramUserId'] . "<br>";
    echo "- Username: " . ($telegramUser['username'] ?: 'N/A') . "<br>";
    echo "- Total Points: " . $telegramUser['totalPoints'] . "<br>";
    
    // Contar respuestas para confirmar
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM telegramresponse WHERE userId = ?");
    $stmt->execute([$telegram_user_uuid]);
    $responses = $stmt->fetch();
    echo "- Total Respuestas: " . $responses['total'] . "<br>";
    
    // Verificar mapeo existente
    echo "<h2>🔍 Verificar Mapeo Existente</h2>";
    $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleUserId = ?");
    $stmt->execute([$moodle_user_id]);
    $existingMapping = $stmt->fetch();
    
    if ($existingMapping) {
        echo "⚠️ Mapeo existente encontrado:<br>";
        echo "- Telegram User ID: " . ($existingMapping['telegramUserId'] ?: 'VACÍO') . "<br>";
        echo "- Active: " . ($existingMapping['isActive'] ? 'Sí' : 'No') . "<br>";
        echo "- Linked At: " . ($existingMapping['linkedAt'] ?: 'N/A') . "<br>";
        
        // Actualizar mapeo existente
        echo "<h2>🔄 Actualizando Mapeo Existente</h2>";
        $stmt = $pdo->prepare("
            UPDATE moodleuserlink 
            SET telegramUserId = ?, 
                moodleUsername = ?, 
                moodleEmail = ?, 
                moodleFullname = ?, 
                isActive = 1,
                updatedAt = NOW()
            WHERE moodleUserId = ?
        ");
        
        $result = $stmt->execute([
            $telegram_user_uuid,
            $USER->username,
            $USER->email,
            fullname($USER),
            $moodle_user_id
        ]);
        
        if ($result) {
            echo "✅ Mapeo actualizado exitosamente<br>";
        } else {
            echo "❌ Error actualizando mapeo<br>";
        }
        
    } else {
        // Crear nuevo mapeo
        echo "📝 No hay mapeo existente. Creando nuevo mapeo...<br>";
        
        $stmt = $pdo->prepare("
            INSERT INTO moodleuserlink 
            (id, telegramUserId, moodleUserId, moodleUsername, moodleEmail, moodleFullname, linkedAt, isActive, createdAt, updatedAt)
            VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), 1, NOW(), NOW())
        ");
        
        $result = $stmt->execute([
            $telegram_user_uuid,
            $moodle_user_id,
            $USER->username,
            $USER->email,
            fullname($USER)
        ]);
        
        if ($result) {
            echo "✅ Nuevo mapeo creado exitosamente<br>";
        } else {
            echo "❌ Error creando mapeo<br>";
        }
    }
    
    // Verificar mapeo final
    echo "<h2>✅ Verificación Final</h2>";
    $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleUserId = ?");
    $stmt->execute([$moodle_user_id]);
    $finalMapping = $stmt->fetch();
    
    if ($finalMapping && $finalMapping['isActive'] && $finalMapping['telegramUserId'] == $telegram_user_uuid) {
        echo "<div style='background: #d4edda; padding: 10px; border-radius: 5px;'>";
        echo "🎉 <strong>¡Mapeo corregido exitosamente!</strong><br>";
        echo "- Moodle User ID: " . $finalMapping['moodleUserId'] . "<br>";
        echo "- Telegram User ID: " . $finalMapping['telegramUserId'] . "<br>";
        echo "- Active: " . ($finalMapping['isActive'] ? 'Sí' : 'No') . "<br>";
        echo "- Linked At: " . $finalMapping['linkedAt'] . "<br>";
        echo "</div>";
        
        echo "<h2>🚀 Próximos Pasos</h2>";
        echo "<div style='background: #fff3cd; padding: 10px; border-radius: 5px;'>";
        echo "1. ✅ Mapeo usuario corregido<br>";
        echo "2. 🔄 Probar sistema de analytics: <a href='analytics.php' target='_blank'>analytics.php</a><br>";
        echo "3. 🧪 Verificar datos reales en lugar de demo<br>";
        echo "</div>";
        
    } else {
        echo "❌ Error: El mapeo no se guardó correctamente<br>";
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}
?> 