<?php
/**
 * Test Detallado de Conexión BD Telegram
 */

require_once('../../config.php');
require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h1>🔍 Test Detallado de Conexión BD Telegram</h1>";

echo "<h2>1️⃣ Parámetros de Conexión</h2>";
$telegram_host = 'localhost';
$telegram_dbname = 'u449034524_mi_ia_db';
$telegram_username = 'u449034524_mi_ia';
$telegram_password = 'Sirius//03072503//';

echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px;'>";
echo "<strong>Host:</strong> $telegram_host<br>";
echo "<strong>Base de datos:</strong> $telegram_dbname<br>";
echo "<strong>Usuario:</strong> $telegram_username<br>";
echo "<strong>Contraseña:</strong> " . str_repeat('*', strlen($telegram_password)) . "<br>";
echo "</div>";

echo "<h2>2️⃣ Test de Conexión Básica</h2>";
try {
    $dsn = "mysql:host={$config['host']};charset=utf8mb4";
    $pdo_test = new PDO($dsn, $config['user'], $config['pass']);
    echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
    echo "✅ Conexión al servidor exitosa.";
    echo "</div>";
} catch (PDOException $e) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error conectando al servidor: " . $e->getMessage();
    echo "</div>";
    
    // Intentar con diferentes hosts
    echo "<h3>🔄 Probando hosts alternativos:</h3>";
    $alternative_hosts = ['127.0.0.1', 'mysql', 'db'];
    
    foreach ($alternative_hosts as $alt_host) {
        try {
            $dsn_alt = "mysql:host=$alt_host;charset=utf8mb4";
            $pdo_alt = new PDO($dsn_alt, $config['user'], $config['pass']);
            echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
            echo "✅ Conexión exitosa con host: $alt_host";
            echo "</div>";
            $telegram_host = $alt_host; // Usar este host
            break;
        } catch (PDOException $e) {
            echo "<div style='background: #fff3cd; padding: 10px; border-radius: 5px;'>";
            echo "⚠️ Host $alt_host falló: " . $e->getMessage();
            echo "</div>";
        }
    }
}

echo "<h2>3️⃣ Test de Acceso a Base de Datos Específica</h2>";
try {
    $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $config['user'], $config['pass'], $options);
    echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
    echo "✅ Conexión a base de datos '$config[dbname]' exitosa";
    echo "</div>";
    
    // Test de tablas
    echo "<h3>📋 Verificación de Tablas:</h3>";
    $tables = ['telegramuser', 'telegramresponse', 'user_analytics'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table LIMIT 1");
            $result = $stmt->fetch();
            echo "<div style='background: #e8f5e8; padding: 5px; margin: 2px 0; border-radius: 3px;'>";
            echo "✅ Tabla '$table': " . $result['count'] . " registros";
            echo "</div>";
        } catch (PDOException $e) {
            echo "<div style='background: #ffe6e6; padding: 5px; margin: 2px 0; border-radius: 3px;'>";
            echo "❌ Error en tabla '$table': " . $e->getMessage();
            echo "</div>";
        }
    }
    
} catch (PDOException $e) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error conectando a base de datos '$config[dbname]': " . $e->getMessage();
    echo "</div>";
    
    // Listar bases de datos disponibles
    echo "<h3>📁 Bases de datos disponibles:</h3>";
    try {
        $dsn_list = "mysql:host={$config['host']};charset=utf8mb4";
        $pdo_list = new PDO($dsn_list, $config['user'], $config['pass']);
        $stmt = $pdo_list->query("SHOW DATABASES");
        $databases = $stmt->fetchAll();
        
        echo "<ul>";
        foreach ($databases as $db) {
            $db_name = $db['Database'];
            $highlight = (strpos($db_name, 'mi_ia') !== false || strpos($db_name, 'telegram') !== false) ? 
                         "style='background: yellow; font-weight: bold;'" : "";
            echo "<li $highlight>$db_name</li>";
        }
        echo "</ul>";
        
    } catch (PDOException $e) {
        echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
        echo "❌ No se pudieron listar las bases de datos: " . $e->getMessage();
        echo "</div>";
    }
}

echo "<h2>4️⃣ Test de Usuario y Permisos</h2>";
try {
    $stmt = $pdo->query("SELECT USER() as current_user, DATABASE() as current_db");
    $userInfo = $stmt->fetch();
    echo "✅ Usuario actual: " . $userInfo['current_user'] . "<br>";
    echo "✅ Base de datos actual: " . $userInfo['current_db'] . "<br>";
    
    // Test de permisos específicos
    $stmt = $pdo->query("SHOW GRANTS");
    $grants = $stmt->fetchAll();
    echo "<h3>🔐 Permisos del usuario:</h3>";
    foreach ($grants as $grant) {
        echo "- " . implode(' | ', $grant) . "<br>";
    }
    
} catch (PDOException $e) {
    echo "❌ Error verificando usuario: " . $e->getMessage() . "<br>";
}

echo "<h2>5️⃣ Información del Servidor</h2>";
echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px;'>";
echo "<strong>Versión PHP:</strong> " . phpversion() . "<br>";
echo "<strong>Extensiones PDO:</strong> " . (extension_loaded('pdo') ? '✅ Disponible' : '❌ No disponible') . "<br>";
echo "<strong>Driver MySQL:</strong> " . (extension_loaded('pdo_mysql') ? '✅ Disponible' : '❌ No disponible') . "<br>";
echo "<strong>Servidor web:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
echo "</div>";

?> 