<?php
// Test MySQL Connection and Tables
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test MySQL Connection</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>🔍 Test de Conexión MySQL</h1>
    
    <?php
    echo "<h2>1. Configuración de Base de Datos</h2>";
    global $db_config;
    echo "<ul>";
    echo "<li><strong>Host:</strong> {$db_config['host']}</li>";
    echo "<li><strong>Puerto:</strong> {$db_config['port']}</li>";
    echo "<li><strong>Base de Datos:</strong> {$db_config['dbname']}</li>";
    echo "<li><strong>Usuario:</strong> {$db_config['user']}</li>";
    echo "<li><strong>Contraseña:</strong> " . str_repeat('*', strlen($db_config['password'])) . "</li>";
    echo "</ul>";
    
    echo "<h2>2. Test de Conexión</h2>";
    
    try {
        $pdo = createDatabaseConnection();
        echo "<p class='success'>✅ Conexión exitosa a MySQL</p>";
        
        // Test básico
        $stmt = $pdo->query("SELECT VERSION() as version");
        $version = $stmt->fetch();
        echo "<p class='info'>📋 Versión MySQL: {$version['version']}</p>";
        
        // Listar tablas
        echo "<h3>3. Tablas en la Base de Datos</h3>";
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll();
        
        if (empty($tables)) {
            echo "<p class='warning'>⚠️ No se encontraron tablas en la base de datos</p>";
        } else {
            echo "<p class='success'>✅ Se encontraron " . count($tables) . " tablas:</p>";
            echo "<table>";
            echo "<tr><th>Nombre de Tabla</th><th>Registros</th></tr>";
            
            foreach ($tables as $table) {
                $tableName = $table['Tables_in_' . $db_config['dbname']];
                try {
                    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM `$tableName`");
                    $count = $countStmt->fetch();
                    echo "<tr><td>$tableName</td><td>{$count['count']}</td></tr>";
                } catch (Exception $e) {
                    echo "<tr><td>$tableName</td><td class='error'>Error: {$e->getMessage()}</td></tr>";
                }
            }
            echo "</table>";
        }
        
        // Verificar tablas específicas del plugin
        echo "<h3>4. Verificación de Tablas del Plugin</h3>";
        $required_tables = [
            'telegramresponse',
            'telegram_responses', 
            'user_analytics',
            'telegram_users',
            'questions'
        ];
        
        foreach ($required_tables as $table) {
            try {
                $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
                $exists = $stmt->fetch();
                
                if ($exists) {
                    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
                    $count = $countStmt->fetch();
                    echo "<p class='success'>✅ Tabla '$table' existe con {$count['count']} registros</p>";
                    
                    // Mostrar estructura de la tabla
                    $descStmt = $pdo->query("DESCRIBE `$table`");
                    $columns = $descStmt->fetchAll();
                    echo "<details><summary>Ver estructura de '$table'</summary>";
                    echo "<table>";
                    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th></tr>";
                    foreach ($columns as $col) {
                        echo "<tr><td>{$col['Field']}</td><td>{$col['Type']}</td><td>{$col['Null']}</td><td>{$col['Key']}</td><td>{$col['Default']}</td></tr>";
                    }
                    echo "</table>";
                    echo "</details>";
                } else {
                    echo "<p class='error'>❌ Tabla '$table' NO existe</p>";
                }
            } catch (Exception $e) {
                echo "<p class='error'>❌ Error verificando tabla '$table': {$e->getMessage()}</p>";
            }
        }
        
        // Test de datos de usuario
        echo "<h3>5. Test de Datos de Usuario</h3>";
        if (isloggedin()) {
            global $USER;
            echo "<p class='info'>👤 Usuario logueado: {$USER->firstname} {$USER->lastname} (ID: {$USER->id})</p>";
            
            // Buscar datos del usuario en las tablas
            $test_tables = ['telegramresponse', 'telegram_responses'];
            foreach ($test_tables as $table) {
                try {
                    $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
                    if ($stmt->fetch()) {
                        $userStmt = $pdo->prepare("SELECT COUNT(*) as count FROM `$table` WHERE userid = ? OR user_id = ?");
                        $userStmt->execute([$USER->id, $USER->id]);
                        $userCount = $userStmt->fetch();
                        echo "<p class='info'>📊 Registros en '$table' para usuario {$USER->id}: {$userCount['count']}</p>";
                    }
                } catch (Exception $e) {
                    echo "<p class='error'>❌ Error consultando '$table': {$e->getMessage()}</p>";
                }
            }
        } else {
            echo "<p class='warning'>⚠️ No hay usuario logueado</p>";
        }
        
        // Test del Bridge API
        echo "<h3>6. Test del Bridge API</h3>";
        $test_url = "https://campus.opomelilla.com/local/telegram_integration/direct-ml-bridge-mysql.php?action=test_connection";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $test_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if ($data && isset($data['status']) && $data['status'] === 'success') {
                echo "<p class='success'>✅ Bridge API responde correctamente</p>";
                echo "<p class='info'>📡 Respuesta: " . htmlspecialchars($response) . "</p>";
            } else {
                echo "<p class='error'>❌ Bridge API responde pero con error</p>";
                echo "<p class='info'>📡 Respuesta: " . htmlspecialchars($response) . "</p>";
            }
        } else {
            echo "<p class='error'>❌ Bridge API no responde (HTTP $httpCode)</p>";
            echo "<p class='info'>📡 URL probada: $test_url</p>";
        }
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error de conexión: {$e->getMessage()}</p>";
        echo "<p class='info'>💡 Posibles soluciones:</p>";
        echo "<ul>";
        echo "<li>Verificar que el host de la base de datos sea correcto (puede ser diferente a 'localhost')</li>";
        echo "<li>Verificar las credenciales de la base de datos</li>";
        echo "<li>Verificar que la base de datos exista</li>";
        echo "<li>Verificar que el usuario tenga permisos</li>";
        echo "</ul>";
    }
    ?>
    
    <h2>7. Información del Hosting</h2>
    <p><strong>Servidor:</strong> <?php echo $_SERVER['SERVER_NAME']; ?></p>
    <p><strong>IP del Servidor:</strong> <?php echo $_SERVER['SERVER_ADDR'] ?? 'No disponible'; ?></p>
    <p><strong>PHP Version:</strong> <?php echo PHP_VERSION; ?></p>
    <p><strong>Extensiones MySQL:</strong> 
        <?php echo extension_loaded('pdo_mysql') ? '✅ PDO MySQL' : '❌ PDO MySQL'; ?>, 
        <?php echo extension_loaded('mysqli') ? '✅ MySQLi' : '❌ MySQLi'; ?>
    </p>
    
</body>
</html> 