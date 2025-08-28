<?php
/**
 * Test Comparativo: BD Moodle vs BD Telegram
 */

require_once('../../config.php');
require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h1>🔍 Test Comparativo: BD Moodle vs BD Telegram</h1>";

echo "<h2>1️⃣ Configuración BD Moodle (desde config.php)</h2>";
echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px;'>";
echo "<strong>Host:</strong> " . $CFG->dbhost . "<br>";
echo "<strong>Base de datos:</strong> " . $CFG->dbname . "<br>";
echo "<strong>Usuario:</strong> " . $CFG->dbuser . "<br>";
echo "<strong>Contraseña:</strong> " . str_repeat('*', strlen($CFG->dbpass)) . "<br>";
echo "<strong>Tipo:</strong> " . $CFG->dbtype . "<br>";
echo "</div>";

echo "<h2>2️⃣ Test Conexión BD Moodle</h2>";
try {
    // 1. Conexión a la base de datos de Moodle
    $dsn_moodle = "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4";
    $pdo_moodle = new PDO($dsn_moodle, $CFG->dbuser, $CFG->dbpass);
    $pdo_moodle->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<li><span class='success'>✅</span> Conexión a la BD de Moodle ('{$CFG->dbname}') exitosa.</li>";

    // 2. Conexión a la base de datos de Telegram
    $config_telegram = get_telegram_db_config();
    if (!$config_telegram) {
        throw new Exception("No se pudo cargar la configuración de la base de datos de Telegram.");
    }
    $dsn_telegram = "mysql:host={$config_telegram['host']};dbname={$config_telegram['dbname']};charset=utf8mb4";
    $pdo_telegram = new PDO($dsn_telegram, $config_telegram['user'], $config_telegram['pass']);
    $pdo_telegram->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<li><span class='success'>✅</span> Conexión a la BD de Telegram ('{$config_telegram['dbname']}') exitosa.</li>";

} catch (Exception $e) {
    echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
    echo "❌ Error conectando a BD Moodle: " . $e->getMessage();
    echo "</div>";
}

echo "<h2>3️⃣ Configuración BD Telegram (propuesta)</h2>";
$telegram_configs = [
    [
        'name' => 'Configuración Original',
        'host' => 'localhost',
        'dbname' => 'u449034524_mi_ia_db',
        'username' => 'u449034524_mi_ia',
        'password' => 'Sirius//03072503//'
    ],
    [
        'name' => 'Usando credenciales de Moodle',
        'host' => $CFG->dbhost,
        'dbname' => 'u449034524_mi_ia_db',
        'username' => $CFG->dbuser,
        'password' => $CFG->dbpass
    ],
    [
        'name' => 'BD alternativa 1',
        'host' => $CFG->dbhost,
        'dbname' => $CFG->dbname, // Misma BD que Moodle
        'username' => $CFG->dbuser,
        'password' => $CFG->dbpass
    ]
];

foreach ($telegram_configs as $index => $config) {
    echo "<h3>🔧 " . $config['name'] . "</h3>";
    echo "<div style='background: #f0f8ff; padding: 10px; border-radius: 5px; margin: 5px 0;'>";
    echo "<strong>Host:</strong> " . $config['host'] . "<br>";
    echo "<strong>Base de datos:</strong> " . $config['dbname'] . "<br>";
    echo "<strong>Usuario:</strong> " . $config['username'] . "<br>";
    echo "<strong>Contraseña:</strong> " . str_repeat('*', strlen($config['password'])) . "<br>";
    echo "</div>";
    
    try {
        $dsn = "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4";
        $pdo_test = new PDO($dsn, $config['username'], $config['password']);
        echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 5px;'>";
        echo "✅ Conexión exitosa con " . $config['name'];
        echo "</div>";
        
        // Si la conexión es exitosa, verificar tablas de Telegram
        $telegram_tables = ['telegramuser', 'telegramresponse', 'user_analytics'];
        $found_tables = [];
        
        foreach ($telegram_tables as $table) {
            try {
                $stmt = $pdo_test->query("SELECT COUNT(*) as count FROM $table LIMIT 1");
                $result = $stmt->fetch();
                $found_tables[$table] = $result['count'];
            } catch (PDOException $e) {
                $found_tables[$table] = "❌ No existe";
            }
        }
        
        if (!empty($found_tables)) {
            echo "<div style='background: #fff3cd; padding: 10px; border-radius: 5px; margin: 5px 0;'>";
            echo "<strong>📋 Tablas de Telegram encontradas:</strong><br>";
            foreach ($found_tables as $table => $count) {
                echo "• $table: $count<br>";
            }
            echo "</div>";
        }
        
    } catch (PDOException $e) {
        echo "<div style='background: #ffe6e6; padding: 10px; border-radius: 5px;'>";
        echo "❌ Error con " . $config['name'] . ": " . $e->getMessage();
        echo "</div>";
    }
}

echo "<h2>4️⃣ Búsqueda de Tablas Telegram en BD Moodle</h2>";
if (isset($pdo_moodle)) {
    echo "<p>Verificando si las tablas de Telegram están en la misma BD que Moodle...</p>";
    
    $telegram_tables = ['telegramuser', 'telegramresponse', 'user_analytics'];
    
    foreach ($telegram_tables as $table) {
        try {
            $stmt = $pdo_moodle->query("SELECT COUNT(*) as count FROM $table LIMIT 1");
            $result = $stmt->fetch();
            echo "<div style='background: #e8f5e8; padding: 5px; margin: 2px 0; border-radius: 3px;'>";
            echo "✅ Tabla '$table' encontrada en BD Moodle: " . $result['count'] . " registros";
            echo "</div>";
        } catch (PDOException $e) {
            echo "<div style='background: #fff3cd; padding: 5px; margin: 2px 0; border-radius: 3px;'>";
            echo "⚠️ Tabla '$table' no encontrada en BD Moodle";
            echo "</div>";
        }
    }
}

echo "<h2>5️⃣ Recomendación</h2>";
echo "<div style='background: #e6f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007cba;'>";
echo "<strong>💡 Próximos pasos:</strong><br>";
echo "1. Verificar cuál configuración funciona<br>";
echo "2. Actualizar telegram-db-config.php con la configuración correcta<br>";
echo "3. Probar analytics.php con la nueva configuración<br>";
echo "</div>";

?> 