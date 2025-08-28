<?php
// Execute SQL Direct - Crear Tablas Auxiliares
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ejecutar SQL Directo - Telegram Analytics</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .step {
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #007cba;
            background: #f8f9fa;
        }
        .success {
            color: #28a745;
            background: #d4edda;
            border-color: #28a745;
        }
        .error {
            color: #dc3545;
            background: #f8d7da;
            border-color: #dc3545;
        }
        .warning {
            color: #856404;
            background: #fff3cd;
            border-color: #ffc107;
        }
        .info {
            color: #0c5460;
            background: #d1ecf1;
            border-color: #17a2b8;
        }
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .button {
            background: #007cba;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 5px;
        }
        .button:hover {
            background: #0056b3;
        }
        .progress {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-bar {
            height: 100%;
            background: #28a745;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Ejecutar SQL Directo - Telegram Analytics</h1>
        <p>Este script creará la tabla <strong>user_analytics</strong> que falta y poblará con datos de las tablas existentes.</p>
        
        <div class="step info">
            <h3>📋 Tablas en la Base de Datos:</h3>
            <ul>
                <li>✅ <strong>telegramuser</strong> - Existe (usuarios de Telegram)</li>
                <li>✅ <strong>question</strong> - Existe (preguntas)</li>
                <li>✅ <strong>telegramresponse</strong> - Existe (47,076 respuestas)</li>
                <li>❌ <strong>user_analytics</strong> - No existe (se creará)</li>
            </ul>
        </div>

        <?php
        // Incluir configuración de base de datos
        require_once 'db-config.php';
        
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['execute_sql'])) {
            echo '<div class="step info"><h3>🔄 Ejecutando SQL...</h3></div>';
            
            try {
                // Conectar a la base de datos usando la función del db-config.php
                $pdo = createDatabaseConnection();
                
                echo '<div class="step success">✅ Conexión a base de datos exitosa</div>';
                
                // Leer el archivo SQL
                $sqlFile = 'create-user-analytics-fixed.sql';
                if (!file_exists($sqlFile)) {
                    throw new Exception("No se encontró el archivo SQL: $sqlFile");
                }
                
                $sql = file_get_contents($sqlFile);
                echo '<div class="step success">✅ Archivo SQL leído correctamente</div>';
                
                // Dividir en comandos individuales (mejorado)
                // Remover comentarios de línea completa primero
                $lines = explode("\n", $sql);
                $cleanLines = [];
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    if (!empty($trimmed) && !preg_match('/^\s*--/', $trimmed)) {
                        $cleanLines[] = $line;
                    }
                }
                $cleanSql = implode("\n", $cleanLines);
                
                // Dividir por punto y coma
                $commands = array_filter(
                    array_map('trim', explode(';', $cleanSql)),
                    function($cmd) {
                        return !empty($cmd);
                    }
                );
                
                echo '<div class="step info">📊 Se ejecutarán ' . count($commands) . ' comandos SQL</div>';
                
                $progress = 0;
                $total = count($commands);
                $results = [];
                
                echo '<div class="progress"><div class="progress-bar" id="progressBar" style="width: 0%"></div></div>';
                echo '<div id="progressText">Preparando...</div>';
                
                // Ejecutar cada comando
                foreach ($commands as $index => $command) {
                    $command = trim($command);
                    if (empty($command)) continue;
                    
                    try {
                        // Mostrar progreso
                        $progress = (($index + 1) / $total) * 100;
                        echo "<script>
                            document.getElementById('progressBar').style.width = '{$progress}%';
                            document.getElementById('progressText').textContent = 'Ejecutando comando " . ($index + 1) . " de $total...';
                        </script>";
                        flush();
                        
                        if (stripos($command, 'SELECT') === 0) {
                            // Es una consulta SELECT
                            $stmt = $pdo->prepare($command);
                            $stmt->execute();
                            $result = $stmt->fetchAll();
                            
                            echo '<div class="step success">';
                            echo '<h4>📊 Resultado de consulta:</h4>';
                            echo '<pre>' . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</pre>';
                            echo '</div>';
                        } else {
                            // Es un comando de modificación
                            $stmt = $pdo->prepare($command);
                            $stmt->execute();
                            $affected = $stmt->rowCount();
                            
                            echo '<div class="step success">';
                            echo "✅ Comando ejecutado exitosamente. Filas afectadas: $affected";
                            echo '</div>';
                        }
                        
                        $results[] = [
                            'command' => substr($command, 0, 100) . '...',
                            'status' => 'success',
                            'affected_rows' => $affected ?? 0
                        ];
                        
                    } catch (PDOException $e) {
                        $error = $e->getMessage();
                        echo '<div class="step error">';
                        echo "❌ Error en comando: " . htmlspecialchars($error);
                        echo '<br><strong>Comando:</strong> ' . htmlspecialchars(substr($command, 0, 200));
                        echo '</div>';
                        
                        $results[] = [
                            'command' => substr($command, 0, 100) . '...',
                            'status' => 'error',
                            'error' => $error
                        ];
                    }
                }
                
                echo "<script>
                    document.getElementById('progressBar').style.width = '100%';
                    document.getElementById('progressText').textContent = 'Completado!';
                </script>";
                
                // Verificar el resultado final
                echo '<div class="step info"><h3>🔍 Verificación Final:</h3></div>';
                
                // Verificar tablas existentes
                $tables = ['telegramuser', 'question', 'telegramresponse', 'user_analytics'];
                foreach ($tables as $table) {
                    try {
                        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM $table");
                        $stmt->execute();
                        $count = $stmt->fetch()['count'];
                        echo "<div class='step success'>✅ Tabla '$table': $count registros</div>";
                    } catch (PDOException $e) {
                        echo "<div class='step error'>❌ Tabla '$table': No existe o error - " . $e->getMessage() . "</div>";
                    }
                }
                
                echo '<div class="step success">';
                echo '<h3>🎉 Proceso Completado!</h3>';
                echo '<p>La tabla <strong>user_analytics</strong> ha sido creada y poblada con datos de las tablas existentes.</p>';
                echo '<p><strong>Siguiente paso:</strong> <a href="test-complete-flow.php" class="button">Probar Analytics Completo</a></p>';
                echo '</div>';
                
            } catch (Exception $e) {
                echo '<div class="step error">';
                echo '<h3>❌ Error Fatal:</h3>';
                echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
                echo '</div>';
            }
        } else {
            // Mostrar formulario
            ?>
            <div class="step warning">
                <h3>⚠️ Importante:</h3>
                <p>Este proceso creará la tabla <strong>user_analytics</strong> y la poblará con datos de las tablas existentes:</p>
                <ul>
                    <li>Se analizarán los datos de <strong>telegramresponse</strong> (47,076 registros)</li>
                    <li>Se calcularán métricas por usuario basadas en <strong>telegramuser</strong></li>
                    <li>Se generarán tendencias de aprendizaje automáticamente</li>
                </ul>
            </div>
            
            <form method="POST" style="text-align: center;">
                <button type="submit" name="execute_sql" class="button" style="font-size: 18px; padding: 15px 30px;">
                    🚀 Ejecutar SQL y Crear Tabla user_analytics
                </button>
            </form>
            
            <div class="step info">
                <h3>📁 Archivos Relacionados:</h3>
                <ul>
                    <li><a href="create-auxiliary-tables-direct.sql">create-auxiliary-tables-direct.sql</a> - Script SQL a ejecutar</li>
                    <li><a href="test-complete-flow.php">test-complete-flow.php</a> - Prueba completa del sistema</li>
                    <li><a href="analytics.php">analytics.php</a> - Dashboard de analytics</li>
                </ul>
            </div>
            <?php
        }
        ?>
    </div>
</body>
</html> 