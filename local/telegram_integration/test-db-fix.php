<?php
// Test de conexión a base de datos - Verificar configuración
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

// Require admin login
require_login();
require_capability('moodle/site:config', context_system::instance());

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Test Conexión DB - Telegram Analytics</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
        .success { color: #28a745; background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .info { color: #0c5460; background: #d1ecf1; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🔧 Test de Conexión a Base de Datos</h1>
    
    <?php
    try {
        echo '<div class="info">🔄 Intentando conectar a la base de datos...</div>';
        
        // Mostrar configuración (sin password)
        global $db_config;
        echo '<div class="info">';
        echo '<h3>📋 Configuración:</h3>';
        echo '<ul>';
        echo '<li><strong>Host:</strong> ' . $db_config['host'] . '</li>';
        echo '<li><strong>Puerto:</strong> ' . $db_config['port'] . '</li>';
        echo '<li><strong>Base de datos:</strong> ' . $db_config['dbname'] . '</li>';
        echo '<li><strong>Usuario:</strong> ' . $db_config['user'] . '</li>';
        echo '<li><strong>Password:</strong> [OCULTO]</li>';
        echo '</ul>';
        echo '</div>';
        
        // Probar conexión
        $pdo = createDatabaseConnection();
        echo '<div class="success">✅ Conexión exitosa!</div>';
        
        // Verificar tablas existentes
        echo '<div class="info"><h3>📊 Verificando tablas existentes:</h3></div>';
        
        $tables = ['telegramuser', 'question', 'telegramresponse', 'user_analytics'];
        foreach ($tables as $table) {
            try {
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM $table");
                $stmt->execute();
                $count = $stmt->fetch()['count'];
                echo "<div class='success'>✅ Tabla '$table': $count registros</div>";
            } catch (PDOException $e) {
                echo "<div class='error'>❌ Tabla '$table': No existe - " . $e->getMessage() . "</div>";
            }
        }
        
        echo '<div class="success">';
        echo '<h3>🎉 Test Completado!</h3>';
        echo '<p>La conexión a la base de datos funciona correctamente.</p>';
        echo '<p><a href="execute-sql-direct.php">Ir a Ejecutar SQL</a> | <a href="analytics.php">Ir a Analytics</a></p>';
        echo '</div>';
        
    } catch (Exception $e) {
        echo '<div class="error">';
        echo '<h3>❌ Error de Conexión:</h3>';
        echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
        echo '<h4>🔧 Posibles soluciones:</h4>';
        echo '<ul>';
        echo '<li>Verificar que las credenciales en db-config.php sean correctas</li>';
        echo '<li>Comprobar que el servidor MySQL esté ejecutándose</li>';
        echo '<li>Verificar que el usuario tenga permisos en la base de datos</li>';
        echo '<li>Probar cambiar "localhost" por "127.0.0.1" en db-config.php</li>';
        echo '</ul>';
        echo '</div>';
    }
    ?>
    
</body>
</html> 