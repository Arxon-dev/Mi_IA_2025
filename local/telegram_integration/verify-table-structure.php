<?php
// Verificar estructura de la tabla telegramresponse
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

// Require admin login
require_login();
require_capability('moodle/site:config', context_system::instance());

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Verificar Estructura de Tabla</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .sql-block { background: #f5f5f5; padding: 10px; margin: 10px 0; border-left: 4px solid #ccc; }
    </style>
</head>
<body>
    <h1>🔍 Verificación de Estructura de Tabla</h1>
    
    <?php
    try {
        $pdo = createDatabaseConnection();
        echo "<p class='success'>✅ Conexión exitosa</p>";
        
        // Verificar estructura de telegramresponse
        echo "<h2>📋 Estructura de la tabla 'telegramresponse'</h2>";
        $stmt = $pdo->query("DESCRIBE `telegramresponse`");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<table>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Predeterminado</th><th>Extra</th></tr>";
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>{$column['Field']}</td>";
            echo "<td>{$column['Type']}</td>";
            echo "<td>{$column['Null']}</td>";
            echo "<td>{$column['Key']}</td>";
            echo "<td>{$column['Default']}</td>";
            echo "<td>{$column['Extra']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Mostrar algunos registros de ejemplo
        echo "<h2>📊 Registros de ejemplo</h2>";
        $stmt = $pdo->query("SELECT * FROM `telegramresponse` LIMIT 5");
        $examples = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($examples)) {
            echo "<table>";
            echo "<tr>";
            foreach (array_keys($examples[0]) as $key) {
                echo "<th>$key</th>";
            }
            echo "</tr>";
            
            foreach ($examples as $example) {
                echo "<tr>";
                foreach ($example as $value) {
                    echo "<td>" . htmlspecialchars(substr($value, 0, 50)) . "</td>";
                }
                echo "</tr>";
            }
            echo "</table>";
        }
        
        // Verificar qué columnas existen para el mapeo
        echo "<h2>🔍 Verificación de Columnas Clave</h2>";
        $columnNames = array_column($columns, 'Field');
        
        $requiredColumns = ['userid', 'user_id', 'iscorrect', 'is_correct', 'responsetime', 'response_time', 'answeredat', 'answered_at', 'questionid', 'question_id'];
        
        foreach ($requiredColumns as $col) {
            if (in_array($col, $columnNames)) {
                echo "<p class='success'>✅ Columna '$col' existe</p>";
            } else {
                echo "<p class='error'>❌ Columna '$col' NO existe</p>";
            }
        }
        
        // Mostrar estadísticas básicas
        echo "<h2>📈 Estadísticas Básicas</h2>";
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM `telegramresponse`");
        $total = $stmt->fetchColumn();
        echo "<p class='info'>📊 Total de registros: $total</p>";
        
        if (in_array('userid', $columnNames)) {
            $stmt = $pdo->query("SELECT COUNT(DISTINCT userid) as unique_users FROM `telegramresponse`");
            $users = $stmt->fetchColumn();
            echo "<p class='info'>👥 Usuarios únicos: $users</p>";
        }
        
        if (in_array('iscorrect', $columnNames)) {
            $stmt = $pdo->query("SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) as correct,
                AVG(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) * 100 as accuracy
                FROM `telegramresponse`");
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p class='info'>✅ Respuestas correctas: {$stats['correct']} / {$stats['total']} (" . round($stats['accuracy'], 2) . "%)</p>";
        }
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error: {$e->getMessage()}</p>";
    }
    ?>
    
    <p><a href="setup-database.php">⬅️ Volver al Setup</a></p>
    
</body>
</html> 