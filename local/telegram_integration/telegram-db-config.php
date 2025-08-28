<?php
/**
 * Configuración de conexión a la base de datos de Telegram
 * Archivo: telegram-db-config.php
 */

// Verificar que se está ejecutando desde Moodle
if (!defined('MOODLE_INTERNAL') && !isset($CFG)) {
    die('Direct access to this script is forbidden.');
}

/**
 * Crear conexión PDO a la base de datos de Telegram
 * @return PDO|false
 */
function createTelegramDatabaseConnection() {
    try {
        // ✅ NUEVA CONFIGURACIÓN UNIFICADA
        $telegram_host = 'localhost';
        $telegram_dbname = 'u449034524_moodel_telegra';  // ✅ CAMBIADO
        $telegram_username = 'u449034524_opomelilla_25'; // ✅ CAMBIADO
        $telegram_password = 'Sirius//03072503//';
        $telegram_port = '3306';
        
        $dsn = "mysql:host={$telegram_host};port={$telegram_port};dbname={$telegram_dbname};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];
        
        $pdo = new PDO($dsn, $telegram_username, $telegram_password, $options);
        return $pdo;
        
    } catch (PDOException $e) {
        error_log("Error conectando a BD Telegram: " . $e->getMessage());
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
        error_log("Error ejecutando consulta Telegram: " . $e->getMessage());
        return false;
    }
}

/**
 * Contar registros en tabla de Telegram
 * @param string $table
 * @return int
 */
function countTelegramRecords($table) {
    $result = executeTelegramQuery("SELECT COUNT(*) as count FROM {$table}");
    return $result ? (int)$result[0]['count'] : 0;
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