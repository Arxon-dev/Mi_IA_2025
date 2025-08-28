<?php
/**
 * Test Simple de Conexión a BD Telegram - VERSIÓN BACKUP
 * Archivo: test-db-simple-backup.php
 */

// Verificar que config.php existe y se puede cargar
if (!file_exists('../../config.php')) {
    die('❌ Error: No se puede encontrar config.php en la ruta esperada');
}

require_once('../../config.php');

// Verificar que tenemos acceso a $CFG
if (!isset($CFG)) {
    die('❌ Error: $CFG no está definido después de cargar config.php');
}

require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h1>🔧 Test Simple de Conexión BD Telegram - VERSIÓN BACKUP</h1>";

echo "<h2>🔍 Información de Depuración</h2>";
echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px; margin: 10px 0;'>";
echo "<strong>CFG->dirroot:</strong> " . $CFG->dirroot . "<br>";
echo "<strong>Directorio actual:</strong> " . __DIR__ . "<br>";
echo "</div>";

echo "<h2>1️⃣ Test de Inclusión de Archivo BACKUP</h2>";

// Intentar con el archivo de backup
$backup_file_path = $CFG->dirroot . '/local/telegram_integration/telegram-db-config-backup.php';

if (!file_exists($backup_file_path)) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error: El archivo telegram-db-config-backup.php no existe en la ruta: " . $backup_file_path;
    echo "</div>";
    exit;
}

try {
    require_once($backup_file_path);
    echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
    echo "✅ Archivo telegram-db-config-backup.php incluido correctamente";
    echo "</div>";
} catch (Exception $e) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error al incluir telegram-db-config-backup.php: " . $e->getMessage();
    echo "</div>";
    exit;
} catch (Error $e) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error fatal al incluir telegram-db-config-backup.php: " . $e->getMessage();
    echo "</div>";
    exit;
}

echo "<h2>2️⃣ Test de Función de Conexión</h2>";
if (function_exists('createTelegramDatabaseConnection')) {
    echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
    echo "✅ Función createTelegramDatabaseConnection() está disponible";
    echo "</div>";
} else {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Función createTelegramDatabaseConnection() NO está disponible";
    echo "</div>";
    exit;
}

echo "<h2>3️⃣ Test de Conexión Real</h2>";
try {
    $pdo = createTelegramDatabaseConnection();
    if ($pdo) {
        echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
        echo "✅ Conexión a BD Telegram exitosa";
        echo "</div>";
    } else {
        echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
        echo "❌ No se pudo crear la conexión a BD Telegram";
        echo "</div>";
        exit;
    }
} catch (Exception $e) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error de conexión: " . $e->getMessage();
    echo "</div>";
    exit;
}

echo "<h2>4️⃣ Test de Verificación de BD</h2>";
try {
    $verification = verifyTelegramDatabaseConnection();
    if ($verification['success']) {
        echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
        echo "✅ Verificación exitosa<br>";
        echo "<strong>Tablas encontradas:</strong><br>";
        foreach ($verification['tables'] as $table => $count) {
            echo "• $table: $count registros<br>";
        }
        echo "</div>";
    } else {
        echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
        echo "❌ Error en verificación: " . $verification['error'];
        echo "</div>";
    }
} catch (Exception $e) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error en verificación: " . $e->getMessage();
    echo "</div>";
}

echo "<h2>5️⃣ Test de Usuario Actual</h2>";
global $USER;
echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px;'>";
echo "<strong>Usuario Moodle ID:</strong> " . $USER->id . "<br>";
echo "<strong>Username:</strong> " . $USER->username . "<br>";
echo "</div>";

// Test de mapeo de usuario
try {
    $sql = "SELECT telegram_uuid FROM user_analytics WHERE moodle_user_id = ?";
    $result = executeTelegramQuery($sql, [$USER->id]);
    
    if ($result && count($result) > 0) {
        echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
        echo "✅ Usuario mapeado encontrado<br>";
        echo "<strong>Telegram UUID:</strong> " . $result[0]['telegram_uuid'];
        echo "</div>";
    } else {
        echo "<div style='background: #fff3cd; padding: 10px; border-radius: 5px;'>";
        echo "⚠️ No se encontró mapeo para el usuario actual";
        echo "</div>";
    }
} catch (Exception $e) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error al buscar mapeo de usuario: " . $e->getMessage();
    echo "</div>";
}

echo "<h2>✅ Test Completado</h2>";
echo "<p><a href='analytics.php'>🔗 Ir a Analytics Principal</a></p>";

?> 