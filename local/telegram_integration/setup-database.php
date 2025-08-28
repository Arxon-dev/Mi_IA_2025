<?php
// Setup Database Script for Telegram Integration
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
    <title>Setup Database - Telegram Integration</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        .warning { color: orange; }
        .sql-block { background: #f5f5f5; padding: 10px; margin: 10px 0; border-left: 4px solid #ccc; }
        .button { background: #007cba; color: white; padding: 10px 20px; border: none; cursor: pointer; margin: 5px; }
        .button:hover { background: #005a87; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>🛠️ Setup Database - Telegram Integration</h1>
    
    <?php
    $action = optional_param('action', '', PARAM_ALPHA);
    
    if ($action === 'setup') {
        echo "<div class='section'>";
        echo "<h2>📋 Ejecutando Setup de Base de Datos</h2>";
        
        try {
            $pdo = createDatabaseConnection();
            echo "<p class='success'>✅ Conexión a base de datos establecida</p>";
            
            // Leer el archivo SQL
            $sqlFile = __DIR__ . '/create-missing-tables.sql';
            if (!file_exists($sqlFile)) {
                throw new Exception("Archivo SQL no encontrado: $sqlFile");
            }
            
            $sql = file_get_contents($sqlFile);
            echo "<p class='info'>📄 Archivo SQL leído correctamente</p>";
            
            // Dividir en statements individuales
            $statements = explode(';', $sql);
            $executed = 0;
            $errors = 0;
            
            foreach ($statements as $statement) {
                $statement = trim($statement);
                if (empty($statement) || strpos($statement, '--') === 0) {
                    continue;
                }
                
                try {
                    $pdo->exec($statement);
                    $executed++;
                    echo "<p class='success'>✅ Ejecutado: " . substr($statement, 0, 50) . "...</p>";
                } catch (Exception $e) {
                    $errors++;
                    echo "<p class='error'>❌ Error: " . $e->getMessage() . "</p>";
                    echo "<div class='sql-block'>" . htmlspecialchars($statement) . "</div>";
                }
            }
            
            echo "<h3>📊 Resumen de Ejecución</h3>";
            echo "<p><strong>Statements ejecutados:</strong> $executed</p>";
            echo "<p><strong>Errores:</strong> $errors</p>";
            
            if ($errors === 0) {
                echo "<p class='success'>🎉 ¡Setup completado exitosamente!</p>";
            } else {
                echo "<p class='warning'>⚠️ Setup completado con algunos errores</p>";
            }
            
            // Verificar tablas creadas
            echo "<h3>🔍 Verificación de Tablas</h3>";
            $tables = ['telegramresponse', 'user_analytics', 'telegram_users', 'questions'];
            
            foreach ($tables as $table) {
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
                    $result = $stmt->fetch();
                    echo "<p class='success'>✅ Tabla '$table': {$result['count']} registros</p>";
                } catch (Exception $e) {
                    echo "<p class='error'>❌ Error verificando tabla '$table': {$e->getMessage()}</p>";
                }
            }
            
        } catch (Exception $e) {
            echo "<p class='error'>❌ Error fatal: {$e->getMessage()}</p>";
        }
        
        echo "</div>";
        echo "<p><a href='?'>⬅️ Volver</a></p>";
        
    } elseif ($action === 'test') {
        echo "<div class='section'>";
        echo "<h2>🧪 Test de Conexión</h2>";
        
        try {
            $pdo = createDatabaseConnection();
            echo "<p class='success'>✅ Conexión exitosa</p>";
            
            // Test básico
            $stmt = $pdo->query("SELECT VERSION() as version");
            $version = $stmt->fetch();
            echo "<p class='info'>📋 Versión MySQL: {$version['version']}</p>";
            
            // Listar tablas
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll();
            echo "<p class='info'>📊 Tablas encontradas: " . count($tables) . "</p>";
            
            foreach ($tables as $table) {
                $tableName = $table['Tables_in_' . $GLOBALS['db_config']['dbname']];
                echo "<p>• $tableName</p>";
            }
            
        } catch (Exception $e) {
            echo "<p class='error'>❌ Error: {$e->getMessage()}</p>";
        }
        
        echo "</div>";
        echo "<p><a href='?'>⬅️ Volver</a></p>";
        
    } elseif ($action === 'create_auxiliary_tables') {
        echo "<div class='section'>";
        echo "<h2>⚙️ Creando Tablas Auxiliares</h2>";
        
        try {
            $pdo = createDatabaseConnection();
            echo "<p class='success'>✅ Conexión a base de datos establecida</p>";
            
            // Solo crear las tablas auxiliares que faltan
            $sql_queries = [
                "user_analytics" => "CREATE TABLE IF NOT EXISTS `user_analytics` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` VARCHAR(255) NOT NULL,
                    `total_questions` INT DEFAULT 0,
                    `correct_answers` INT DEFAULT 0,
                    `accuracy_percentage` DECIMAL(5,2) DEFAULT 0.00,
                    `avg_response_time` INT DEFAULT NULL,
                    `study_streak` INT DEFAULT 0,
                    `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY `unique_user` (`user_id`)
                );",
                
                "telegram_users" => "CREATE TABLE IF NOT EXISTS `telegram_users` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `telegram_user_id` VARCHAR(255) NOT NULL UNIQUE,
                    `moodle_user_id` INT DEFAULT NULL,
                    `username` VARCHAR(100) DEFAULT NULL,
                    `first_name` VARCHAR(100) DEFAULT NULL,
                    `last_name` VARCHAR(100) DEFAULT NULL,
                    `is_active` BOOLEAN DEFAULT TRUE,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                );",
                
                "questions" => "CREATE TABLE IF NOT EXISTS `questions` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `question_id` VARCHAR(255) NOT NULL UNIQUE,
                    `question_text` TEXT,
                    `correct_answer` TEXT,
                    `subject` VARCHAR(100) DEFAULT 'general',
                    `difficulty` VARCHAR(20) DEFAULT 'medium',
                    `bloom_level` INT DEFAULT 1,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );"
            ];
            
            $statements_executed = 0;
            $errors = 0;
            
            foreach ($sql_queries as $table_name => $query) {
                try {
                    $pdo->exec($query);
                    $statements_executed++;
                    echo "<p class='success'>✅ Tabla '$table_name' creada/verificada exitosamente</p>";
                } catch (Exception $e) {
                    $errors++;
                    echo "<p class='error'>❌ Error creando tabla '$table_name': " . htmlspecialchars($e->getMessage()) . "</p>";
                }
            }
            
            echo "<div class='info'>";
            echo "<h3>📊 Resumen de Ejecución</h3>";
            echo "<p><strong>✅ Statements ejecutados:</strong> $statements_executed</p>";
            echo "<p><strong>❌ Errores:</strong> $errors</p>";
            echo "</div>";
            
            // Verificar tablas creadas
            echo "<h3>🔍 Verificación de Tablas</h3>";
            $tables = ['telegramresponse', 'user_analytics', 'telegram_users', 'questions'];
            
            foreach ($tables as $table) {
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
                    $result = $stmt->fetch();
                    echo "<p class='success'>✅ Tabla '$table': {$result['count']} registros</p>";
                } catch (Exception $e) {
                    echo "<p class='error'>❌ Error verificando tabla '$table': {$e->getMessage()}</p>";
                }
            }
            
            echo "<p class='success'><strong>🎉 ¡Configuración completada!</strong></p>";
            echo "<p><a href='analytics.php' class='button'>📊 Ir a Analytics</a></p>";
            
        } catch (Exception $e) {
            echo "<p class='error'>❌ Error fatal: " . htmlspecialchars($e->getMessage()) . "</p>";
        }
        
        echo "</div>";
        echo "<p><a href='?'>⬅️ Volver</a></p>";
    } else {
        // Mostrar menú principal
        echo "<div class='section'>";
        echo "<h2>🎯 Configuración de Base de Datos</h2>";
        echo "<p>Este script configurará las tablas necesarias para el plugin Telegram Integration.</p>";
        
        echo "<h3>📋 Configuración Actual</h3>";
        global $db_config;
        echo "<ul>";
        echo "<li><strong>Host:</strong> {$db_config['host']}</li>";
        echo "<li><strong>Puerto:</strong> {$db_config['port']}</li>";
        echo "<li><strong>Base de Datos:</strong> {$db_config['dbname']}</li>";
        echo "<li><strong>Usuario:</strong> {$db_config['user']}</li>";
        echo "</ul>";
        
        echo "<h3>🛠️ Acciones Disponibles</h3>";
        echo "<div class='actions'>";
        echo "<a href='?action=test' class='button'>🧪 Test de Conexión</a>";
        echo "<a href='?action=create_auxiliary_tables' class='button'>⚙️ Crear Tablas Auxiliares</a>";
        echo "</div>";
        
        echo "<h3>📄 Tablas que se crearán</h3>";
        echo "<ul>";
        echo "<li><strong>telegramresponse</strong> - Respuestas de usuarios desde Telegram</li>";
        echo "<li><strong>telegram_responses</strong> - Tabla alternativa para respuestas</li>";
        echo "<li><strong>user_analytics</strong> - Métricas y estadísticas de usuarios</li>";
        echo "<li><strong>telegram_users</strong> - Mapeo entre usuarios Telegram y Moodle</li>";
        echo "<li><strong>questions</strong> - Preguntas del sistema</li>";
        echo "</ul>";
        
        echo "<h3>⚠️ Importante</h3>";
        echo "<p>Este script:</p>";
        echo "<ul>";
        echo "<li>Creará las tablas si no existen</li>";
        echo "<li>Insertará datos de ejemplo para testing</li>";
        echo "<li>No eliminará datos existentes</li>";
        echo "<li>Puede ejecutarse múltiples veces de forma segura</li>";
        echo "</ul>";
        
        echo "</div>";
    }
    ?>
    
    <div class='section'>
        <h3>🔗 Enlaces Útiles</h3>
        <p><a href='test-mysql-connection.php'>🔍 Test Completo de Conexión</a></p>
        <p><a href='analytics.php'>📊 Ir a Analytics</a></p>
        <p><a href='verify.php'>🔗 Verificar Cuenta Telegram</a></p>
    </div>
    
</body>
</html> 