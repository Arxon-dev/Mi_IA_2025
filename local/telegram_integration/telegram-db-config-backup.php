<?php
/**
 * Configuración de conexión a la base de datos de Telegram - BACKUP
 * Archivo: telegram-db-config-backup.php
 */

// Verificación menos estricta para debugging
if (!function_exists('createTelegramDatabaseConnection')) {

    /**
     * Crear conexión PDO a la base de datos de Telegram
     * @return PDO|false
     */
    function createTelegramDatabaseConnection() {
        try {
            // Configuración CORRECTA de la base de datos de Telegram
            $telegram_host = 'localhost';
            $telegram_dbname = 'u449034524_mi_ia_db';
            $telegram_username = 'u449034524_mi_ia';  // ✅ CORREGIDO
            $telegram_password = 'Sirius//03072503//';
            
            $dsn = "mysql:host=$telegram_host;dbname=$telegram_dbname;charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            
            $pdo = new PDO($dsn, $telegram_username, $telegram_password, $options);
            return $pdo;
            
        } catch (PDOException $e) {
            echo "❌ Error conectando a BD Telegram: " . $e->getMessage() . "<br>";
            return false;
        }
    }

    /**
     * Ejecutar consulta en la base de datos de Telegram
     * @param string $query
     * @param array $params
     * @return array|false
     */
    function executeTelegramQuery($query, $params = []) {
        $pdo = createTelegramDatabaseConnection();
        if (!$pdo) {
            return false;
        }
        
        try {
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            echo "❌ Error ejecutando consulta: " . $e->getMessage() . "<br>";
            return false;
        }
    }

    /**
     * Verificar conexión a la base de datos de Telegram
     * @return bool
     */
    function verifyTelegramDatabaseConnection() {
        $pdo = createTelegramDatabaseConnection();
        if (!$pdo) {
            return false;
        }
        
        try {
            $stmt = $pdo->query("SELECT 1");
            return $stmt !== false;
        } catch (PDOException $e) {
            return false;
        }
    }
}

// Test directo si se accede al archivo
if (basename($_SERVER['PHP_SELF']) == 'telegram-db-config-backup.php') {
    echo "<h1>🔧 Test de Configuración BD Telegram - BACKUP</h1>";
    
    echo "<h2>🔍 Test de Conexión</h2>";
    $pdo = createTelegramDatabaseConnection();
    if ($pdo) {
        echo "✅ Conexión exitosa a BD Telegram<br>";
        
        // Test de tablas
        try {
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo "<h3>📋 Tablas disponibles:</h3>";
            foreach ($tables as $table) {
                echo "- $table<br>";
            }
            
            // Test de datos de usuario específico
            echo "<h3>👤 Test datos usuario UUID: 2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f</h3>";
            
            // Primero buscar el usuario por su ID (que es el UUID)
            $stmt = $pdo->prepare("SELECT id, telegramUserId, username FROM telegramuser WHERE id = ?");
            $stmt->execute(['2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f']);
            $user = $stmt->fetch();
            
            if ($user) {
                echo "✅ Usuario encontrado: " . ($user['username'] ?: 'Sin username') . " (Telegram ID: " . $user['telegramUserId'] . ")<br>";
                
                // Ahora contar respuestas usando el campo correcto 'userId'
                $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM telegramresponse WHERE userId = ?");
                $stmt->execute(['2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f']);
                $result = $stmt->fetch();
                echo "Respuestas del usuario: " . $result['total'] . "<br>";
                
                // Estadísticas adicionales
                $stmt = $pdo->prepare("SELECT COUNT(*) as correct FROM telegramresponse WHERE userId = ? AND isCorrect = 1");
                $stmt->execute(['2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f']);
                $correct = $stmt->fetch();
                echo "Respuestas correctas: " . $correct['correct'] . "<br>";
                
                if ($result['total'] > 0) {
                    $accuracy = ($correct['correct'] / $result['total']) * 100;
                    echo "Precisión: " . number_format($accuracy, 1) . "%<br>";
                }
            } else {
                echo "❌ Usuario no encontrado con UUID: 2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f<br>";
                
                // Buscar usuarios existentes para debug
                $stmt = $pdo->query("SELECT id, telegramUserId, username FROM telegramuser LIMIT 5");
                $users = $stmt->fetchAll();
                echo "<h4>👥 Primeros 5 usuarios en la BD:</h4>";
                foreach ($users as $u) {
                    echo "- ID: " . $u['id'] . " | Telegram ID: " . $u['telegramUserId'] . " | Username: " . ($u['username'] ?: 'N/A') . "<br>";
                }
            }
            
        } catch (PDOException $e) {
            echo "❌ Error consultando tablas: " . $e->getMessage() . "<br>";
        }
        
    } else {
        echo "❌ Error de conexión<br>";
    }
}

?> 