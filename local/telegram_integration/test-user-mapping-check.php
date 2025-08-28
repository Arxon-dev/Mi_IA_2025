<?php
/**
 * Test de Mapeo de Usuarios Moodle <-> Telegram
 */

require_once('../../config.php');
require_login();
require_capability('moodle/site:config', context_system::instance());

// Incluir configuración de BD Telegram
require_once($CFG->dirroot . '/local/telegram_integration/telegram-db-config.php');

echo "<h1>🔗 Test de Mapeo Usuarios Moodle ↔ Telegram</h1>";

// Usuario actual de Moodle
global $USER;
echo "<h2>👤 Usuario Moodle Actual</h2>";
echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px;'>";
echo "<strong>ID:</strong> " . $USER->id . "<br>";
echo "<strong>Username:</strong> " . $USER->username . "<br>";
echo "<strong>Email:</strong> " . $USER->email . "<br>";
echo "<strong>Nombre completo:</strong> " . fullname($USER) . "<br>";
echo "</div>";

echo "<h2>🔍 Búsqueda de Mapeo en BD Telegram</h2>";

$pdo = createTelegramDatabaseConnection();
if (!$pdo) {
    echo "❌ Error conectando a BD Telegram<br>";
    exit;
}

try {
    // Buscar en MoodleUserLink si existe
    echo "<h3>📋 Verificar tabla MoodleUserLink</h3>";
    $stmt = $pdo->query("SHOW TABLES LIKE 'moodleuserlink'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Tabla MoodleUserLink existe<br>";
        
        // Buscar mapeo por ID de Moodle
        $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleUserId = ?");
        $stmt->execute([$USER->id]);
        $mapping = $stmt->fetch();
        
        if ($mapping) {
            echo "✅ Mapeo encontrado:<br>";
            echo "- Telegram User ID: " . $mapping['telegramUserId'] . "<br>";
            echo "- Moodle Username: " . ($mapping['moodleUsername'] ?: 'N/A') . "<br>";
            echo "- Linked At: " . $mapping['linkedAt'] . "<br>";
            echo "- Active: " . ($mapping['isActive'] ? 'Sí' : 'No') . "<br>";
            
            // Buscar datos del usuario en TelegramUser
            echo "<h3>👤 Datos en TelegramUser</h3>";
            $stmt = $pdo->prepare("SELECT * FROM telegramuser WHERE id = ?");
            $stmt->execute([$mapping['telegramUserId']]);
            $telegramUser = $stmt->fetch();
            
            if ($telegramUser) {
                echo "✅ Usuario Telegram encontrado:<br>";
                echo "- ID: " . $telegramUser['id'] . "<br>";
                echo "- Telegram User ID: " . $telegramUser['telegramUserId'] . "<br>";
                echo "- Username: " . ($telegramUser['username'] ?: 'N/A') . "<br>";
                echo "- Nombre: " . ($telegramUser['firstName'] ?: '') . " " . ($telegramUser['lastName'] ?: '') . "<br>";
                echo "- Total Points: " . $telegramUser['totalPoints'] . "<br>";
                echo "- Accuracy: " . number_format($telegramUser['accuracy'], 2) . "%<br>";
                
                // Contar respuestas
                $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM telegramresponse WHERE userId = ?");
                $stmt->execute([$telegramUser['id']]);
                $responses = $stmt->fetch();
                echo "- Total Respuestas: " . $responses['total'] . "<br>";
                
            } else {
                echo "❌ Usuario no encontrado en TelegramUser<br>";
            }
            
        } else {
            echo "❌ No hay mapeo para el usuario Moodle ID: " . $USER->id . "<br>";
            
            // Mostrar algunos mapeos existentes
            echo "<h3>🔍 Mapeos existentes (primeros 10)</h3>";
            $stmt = $pdo->query("SELECT * FROM moodleuserlink ORDER BY linkedAt DESC LIMIT 10");
            $mappings = $stmt->fetchAll();
            
            if ($mappings) {
                echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
                echo "<tr><th>Moodle ID</th><th>Telegram ID</th><th>Username</th><th>Linked At</th><th>Active</th></tr>";
                foreach ($mappings as $map) {
                    echo "<tr>";
                    echo "<td>" . $map['moodleUserId'] . "</td>";
                    echo "<td>" . substr($map['telegramUserId'], 0, 8) . "...</td>";
                    echo "<td>" . ($map['moodleUsername'] ?: 'N/A') . "</td>";
                    echo "<td>" . $map['linkedAt'] . "</td>";
                    echo "<td>" . ($map['isActive'] ? '✅' : '❌') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } else {
                echo "❌ No hay mapeos en la tabla<br>";
            }
        }
        
    } else {
        echo "❌ Tabla MoodleUserLink no existe<br>";
        
        // Buscar en user_analytics directamente
        echo "<h3>📊 Verificar tabla user_analytics</h3>";
        $stmt = $pdo->query("SHOW TABLES LIKE 'user_analytics'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Tabla user_analytics existe<br>";
            
            $stmt = $pdo->prepare("SELECT * FROM user_analytics WHERE moodle_user_id = ?");
            $stmt->execute([$USER->id]);
            $analytics = $stmt->fetch();
            
            if ($analytics) {
                echo "✅ Registro en user_analytics encontrado:<br>";
                echo "- Telegram UUID: " . $analytics['telegram_uuid'] . "<br>";
                echo "- Total Questions: " . $analytics['total_questions'] . "<br>";
                echo "- Correct Answers: " . $analytics['correct_answers'] . "<br>";
                echo "- Success Rate: " . number_format($analytics['success_rate'], 2) . "%<br>";
            } else {
                echo "❌ No hay registro en user_analytics para Moodle ID: " . $USER->id . "<br>";
            }
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

echo "<h2>💡 Recomendaciones</h2>";
echo "<div style='background: #fff3cd; padding: 10px; border-radius: 5px;'>";
echo "<strong>Para que funcione el sistema de analytics:</strong><br>";
echo "1. El usuario Moodle debe estar mapeado con un usuario de Telegram<br>";
echo "2. El usuario de Telegram debe tener respuestas en la BD<br>";
echo "3. Si no hay mapeo, se puede crear manualmente o implementar sistema de vinculación<br>";
echo "</div>";
?> 