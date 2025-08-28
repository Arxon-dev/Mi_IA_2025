<?php
// Reset User Analytics - Borrar tabla existente y empezar de nuevo
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
    <title>Reset User Analytics - Telegram Analytics</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }
        .success { color: #28a745; background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .info { color: #0c5460; background: #d1ecf1; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .warning { color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .button { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
        .button:hover { background: #005a87; }
        .danger { background: #dc3545; }
        .danger:hover { background: #c82333; }
    </style>
</head>
<body>
    <h1>🔄 Reset User Analytics</h1>
    
    <?php
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_reset'])) {
        try {
            echo '<div class="info">🔄 Conectando a la base de datos...</div>';
            $pdo = createDatabaseConnection();
            echo '<div class="success">✅ Conexión exitosa!</div>';
            
            // Verificar si la tabla existe
            echo '<div class="info">🔍 Verificando si la tabla user_analytics existe...</div>';
            try {
                $stmt = $pdo->query("SELECT COUNT(*) FROM user_analytics");
                $count = $stmt->fetch()['count'];
                echo "<div class='info'>✅ Tabla user_analytics existe con $count registros</div>";
                
                // Borrar la tabla
                echo '<div class="warning">🗑️ Borrando tabla user_analytics...</div>';
                $pdo->exec("DROP TABLE IF EXISTS user_analytics");
                echo '<div class="success">✅ Tabla user_analytics borrada exitosamente</div>';
                
            } catch (PDOException $e) {
                echo '<div class="info">ℹ️ La tabla user_analytics no existía</div>';
            }
            
            // Verificar que se borró
            echo '<div class="info">🔍 Verificando que la tabla se borró...</div>';
            try {
                $stmt = $pdo->query("SELECT COUNT(*) FROM user_analytics");
                echo '<div class="error">❌ La tabla todavía existe (error inesperado)</div>';
            } catch (PDOException $e) {
                echo '<div class="success">✅ Confirmado: La tabla user_analytics no existe</div>';
            }
            
            echo '<div class="success">';
            echo '<h3>🎉 Reset Completado!</h3>';
            echo '<p>La tabla user_analytics ha sido borrada. Ahora puedes:</p>';
            echo '<ul>';
            echo '<li><a href="check-table-structure.php">1. Verificar estructura de telegramresponse</a></li>';
            echo '<li><a href="test-sql-direct.php">2. Probar el SQL corregido</a></li>';
            echo '<li><a href="execute-sql-direct.php">3. Ejecutar creación de tabla</a></li>';
            echo '</ul>';
            echo '</div>';
            
        } catch (Exception $e) {
            echo '<div class="error">';
            echo '<h3>❌ Error:</h3>';
            echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
            echo '</div>';
        }
    } else {
        // Mostrar formulario de confirmación
        try {
            $pdo = createDatabaseConnection();
            
            // Verificar estado actual
            echo '<div class="info"><h3>📊 Estado Actual:</h3></div>';
            try {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_analytics");
                $count = $stmt->fetch()['count'];
                echo "<div class='warning'>⚠️ La tabla user_analytics existe con $count registros</div>";
                echo '<div class="warning">⚠️ Al continuar, se BORRARÁN todos estos datos</div>';
            } catch (PDOException $e) {
                echo '<div class="info">ℹ️ La tabla user_analytics no existe</div>';
                echo '<div class="info">ℹ️ El reset limpiará cualquier estado inconsistente</div>';
            }
            
            echo '<div class="warning">';
            echo '<h3>⚠️ ADVERTENCIA:</h3>';
            echo '<p>Esta acción borrará completamente la tabla <strong>user_analytics</strong> si existe.</p>';
            echo '<p>Solo continúa si estás seguro de que quieres empezar de nuevo.</p>';
            echo '</div>';
            
            echo '<form method="POST" style="text-align: center; margin: 20px 0;">';
            echo '<button type="submit" name="confirm_reset" class="button danger" onclick="return confirm(\'¿Estás seguro de que quieres borrar la tabla user_analytics?\');">';
            echo '🗑️ Confirmar Reset - Borrar Tabla user_analytics';
            echo '</button>';
            echo '</form>';
            
            echo '<div class="info">';
            echo '<h3>🔧 Flujo Recomendado:</h3>';
            echo '<ol>';
            echo '<li><strong>Reset</strong> - Borrar tabla existente (este paso)</li>';
            echo '<li><strong>Verificar</strong> - <a href="check-table-structure.php">Revisar estructura de telegramresponse</a></li>';
            echo '<li><strong>Probar</strong> - <a href="test-sql-direct.php">Test del SQL corregido</a></li>';
            echo '<li><strong>Crear</strong> - <a href="execute-sql-direct.php">Ejecutar creación final</a></li>';
            echo '</ol>';
            echo '</div>';
            
        } catch (Exception $e) {
            echo '<div class="error">';
            echo '<h3>❌ Error de conexión:</h3>';
            echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
            echo '</div>';
        }
    }
    ?>
    
</body>
</html> 