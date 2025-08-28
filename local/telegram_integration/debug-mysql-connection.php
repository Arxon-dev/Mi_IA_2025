<?php
// Detectar automáticamente la ruta de config.php
$configPaths = [
    '../../../../config.php',
    '../../../config.php', 
    '../../config.php',
    '../config.php',
    'config.php'
];

$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    die('Error: No se pudo encontrar config.php. Verifica la estructura de directorios.');
}

echo "<h1>🔍 Diagnóstico de Conexión MySQL</h1>";

// Verificar configuración de Moodle
echo "<h2>1. Configuración de Moodle</h2>";
echo "<p><strong>DB Host:</strong> " . ($CFG->dbhost ?? 'No definido') . "</p>";
echo "<p><strong>DB Name:</strong> " . ($CFG->dbname ?? 'No definido') . "</p>";
echo "<p><strong>DB User:</strong> " . ($CFG->dbuser ?? 'No definido') . "</p>";
echo "<p><strong>DB Pass:</strong> " . (isset($CFG->dbpass) ? '***DEFINIDO***' : 'No definido') . "</p>";

// Intentar conexión directa a MySQL
echo "<h2>2. Prueba de Conexión Directa MySQL</h2>";
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p>✅ <strong>Conexión MySQL exitosa</strong></p>";
    
    // Verificar tabla telegramuser
    echo "<h3>3. Verificación de Tabla telegramuser</h3>";
    $stmt = $pdo->query("SHOW TABLES LIKE 'telegramuser'");
    if ($stmt->rowCount() > 0) {
        echo "<p>✅ <strong>Tabla telegramuser existe</strong></p>";
        
        // Contar registros
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM telegramuser");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "<p><strong>Total de usuarios:</strong> $count</p>";
        
        // Buscar específicamente a Carlos_esp
        echo "<h3>4. Búsqueda de Carlos_esp</h3>";
        $stmt = $pdo->prepare("
            SELECT * FROM telegramuser 
            WHERE username = 'Carlos_esp' 
            OR telegramid = '5793286375'
            OR firstname LIKE '%Carlos%'
        ");
        $stmt->execute();
        $carlosUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($carlosUsers)) {
            echo "<p>✅ <strong>Carlos_esp encontrado:</strong></p>";
            foreach ($carlosUsers as $user) {
                echo "<div style='background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 5px;'>";
                echo "<p><strong>ID:</strong> " . $user['id'] . "</p>";
                echo "<p><strong>Telegram ID:</strong> " . $user['telegramid'] . "</p>";
                echo "<p><strong>Username:</strong> " . $user['username'] . "</p>";
                echo "<p><strong>Nombre:</strong> " . $user['firstname'] . "</p>";
                echo "<p><strong>Puntos:</strong> " . $user['points'] . "</p>";
                echo "<p><strong>Nivel:</strong> " . $user['level'] . "</p>";
                echo "</div>";
            }
        } else {
            echo "<p>❌ <strong>Carlos_esp no encontrado</strong></p>";
            
            // Mostrar algunos usuarios para verificar
            echo "<h3>5. Muestra de Usuarios Disponibles</h3>";
            $stmt = $pdo->query("SELECT * FROM telegramuser ORDER BY points DESC LIMIT 5");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($users)) {
                echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
                echo "<tr><th>ID</th><th>Telegram ID</th><th>Username</th><th>Nombre</th><th>Puntos</th></tr>";
                foreach ($users as $user) {
                    echo "<tr>";
                    echo "<td>" . $user['id'] . "</td>";
                    echo "<td>" . $user['telegramid'] . "</td>";
                    echo "<td>" . $user['username'] . "</td>";
                    echo "<td>" . $user['firstname'] . "</td>";
                    echo "<td>" . $user['points'] . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            }
        }
        
        // Verificar estructura de la tabla
        echo "<h3>6. Estructura de la Tabla telegramuser</h3>";
        $stmt = $pdo->query("DESCRIBE telegramuser");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th></tr>";
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>" . $column['Field'] . "</td>";
            echo "<td>" . $column['Type'] . "</td>";
            echo "<td>" . $column['Null'] . "</td>";
            echo "<td>" . $column['Key'] . "</td>";
            echo "<td>" . $column['Default'] . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } else {
        echo "<p>❌ <strong>Tabla telegramuser no existe</strong></p>";
    }
    
} catch (PDOException $e) {
    echo "<p>❌ <strong>Error de conexión MySQL:</strong> " . $e->getMessage() . "</p>";
}

// Verificar configuración de Moodle DB
echo "<h2>7. Verificación de Moodle DB</h2>";
try {
    global $DB;
    echo "<p>✅ <strong>Objeto DB disponible</strong></p>";
    
    // Intentar una consulta simple
    $sql = "SELECT COUNT(*) as total FROM {user}";
    $result = $DB->get_record_sql($sql);
    echo "<p><strong>Total usuarios Moodle:</strong> " . $result->total . "</p>";
    
} catch (Exception $e) {
    echo "<p>❌ <strong>Error en Moodle DB:</strong> " . $e->getMessage() . "</p>";
}

echo "<h2>8. Información del Sistema</h2>";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>";
echo "<p><strong>PDO MySQL:</strong> " . (extension_loaded('pdo_mysql') ? '✅ Disponible' : '❌ No disponible') . "</p>";
echo "<p><strong>MySQL:</strong> " . (extension_loaded('mysqli') ? '✅ Disponible' : '❌ No disponible') . "</p>";
?> 