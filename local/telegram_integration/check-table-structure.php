<?php
// Check Table Structure - Verificar estructura de telegramresponse
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
    <title>Check Table Structure - Telegram Analytics</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 20px auto; padding: 20px; }
        .success { color: #28a745; background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .info { color: #0c5460; background: #d1ecf1; padding: 10px; border-radius: 5px; margin: 10px 0; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .sql-block { background: #f8f9fa; padding: 15px; border-left: 4px solid #007cba; margin: 10px 0; font-family: monospace; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>🔍 Verificar Estructura de Tablas</h1>
    
    <?php
    try {
        echo '<div class="info">🔄 Conectando a la base de datos...</div>';
        $pdo = createDatabaseConnection();
        echo '<div class="success">✅ Conexión exitosa!</div>';
        
        // Verificar estructura de telegramresponse
        echo '<div class="info"><h3>📋 Estructura de la tabla `telegramresponse`:</h3></div>';
        
        $stmt = $pdo->query("DESCRIBE telegramresponse");
        $columns = $stmt->fetchAll();
        
        if ($columns) {
            echo '<table>';
            echo '<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Por defecto</th><th>Extra</th></tr>';
            foreach ($columns as $column) {
                echo '<tr>';
                echo '<td><strong>' . htmlspecialchars($column['Field']) . '</strong></td>';
                echo '<td>' . htmlspecialchars($column['Type']) . '</td>';
                echo '<td>' . htmlspecialchars($column['Null']) . '</td>';
                echo '<td>' . htmlspecialchars($column['Key']) . '</td>';
                echo '<td>' . htmlspecialchars($column['Default']) . '</td>';
                echo '<td>' . htmlspecialchars($column['Extra']) . '</td>';
                echo '</tr>';
            }
            echo '</table>';
        }
        
        // Mostrar algunos datos de ejemplo
        echo '<div class="info"><h3>📊 Datos de ejemplo (primeros 5 registros):</h3></div>';
        
        $stmt = $pdo->query("SELECT * FROM telegramresponse LIMIT 5");
        $samples = $stmt->fetchAll();
        
        if ($samples) {
            echo '<table>';
            // Encabezados
            echo '<tr>';
            foreach (array_keys($samples[0]) as $header) {
                echo '<th>' . htmlspecialchars($header) . '</th>';
            }
            echo '</tr>';
            
            // Datos
            foreach ($samples as $row) {
                echo '<tr>';
                foreach ($row as $value) {
                    echo '<td>' . htmlspecialchars($value) . '</td>';
                }
                echo '</tr>';
            }
            echo '</table>';
        }
        
        // Verificar campos relacionados con tiempo
        echo '<div class="info"><h3>⏰ Campos relacionados con tiempo:</h3></div>';
        
        $timeFields = [];
        foreach ($columns as $column) {
            $fieldName = $column['Field'];
            if (stripos($fieldName, 'time') !== false || 
                stripos($fieldName, 'date') !== false ||
                stripos($fieldName, 'created') !== false ||
                stripos($fieldName, 'finished') !== false ||
                stripos($fieldName, 'started') !== false) {
                $timeFields[] = $fieldName;
            }
        }
        
        if ($timeFields) {
            echo '<ul>';
            foreach ($timeFields as $field) {
                echo '<li><strong>' . htmlspecialchars($field) . '</strong></li>';
            }
            echo '</ul>';
            
            // Mostrar valores de ejemplo de estos campos
            $timeFieldsList = implode(', ', $timeFields);
            $stmt = $pdo->query("SELECT userid, $timeFieldsList FROM telegramresponse WHERE userid IS NOT NULL LIMIT 5");
            $timeData = $stmt->fetchAll();
            
            if ($timeData) {
                echo '<div class="info"><h4>Valores de ejemplo:</h4></div>';
                echo '<table>';
                echo '<tr><th>User ID</th>';
                foreach ($timeFields as $field) {
                    echo '<th>' . htmlspecialchars($field) . '</th>';
                }
                echo '</tr>';
                
                foreach ($timeData as $row) {
                    echo '<tr>';
                    echo '<td>' . htmlspecialchars($row['userid']) . '</td>';
                    foreach ($timeFields as $field) {
                        echo '<td>' . htmlspecialchars($row[$field]) . '</td>';
                    }
                    echo '</tr>';
                }
                echo '</table>';
            }
        } else {
            echo '<p>No se encontraron campos relacionados con tiempo.</p>';
        }
        
        // Verificar campos relacionados con corrección
        echo '<div class="info"><h3>✅ Campos relacionados con corrección:</h3></div>';
        
        $correctFields = [];
        foreach ($columns as $column) {
            $fieldName = $column['Field'];
            if (stripos($fieldName, 'correct') !== false || 
                stripos($fieldName, 'right') !== false ||
                stripos($fieldName, 'wrong') !== false ||
                stripos($fieldName, 'score') !== false) {
                $correctFields[] = $fieldName;
            }
        }
        
        if ($correctFields) {
            echo '<ul>';
            foreach ($correctFields as $field) {
                echo '<li><strong>' . htmlspecialchars($field) . '</strong></li>';
            }
            echo '</ul>';
        } else {
            echo '<p>No se encontraron campos relacionados con corrección.</p>';
        }
        
        echo '<div class="success">';
        echo '<h3>🎉 Análisis Completado!</h3>';
        echo '<p>Usa esta información para corregir el SQL de inserción.</p>';
        echo '</div>';
        
    } catch (Exception $e) {
        echo '<div class="error">';
        echo '<h3>❌ Error:</h3>';
        echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
        echo '</div>';
    }
    ?>
    
</body>
</html> 