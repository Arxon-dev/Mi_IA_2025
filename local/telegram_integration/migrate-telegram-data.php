<?php
/**
 * Script de Migración de Datos Telegram
 * Migra datos desde BD original a BD unificada
 */

require_once(__DIR__ . '/../../config.php');
require_login();

if (!is_siteadmin() && $USER->id != 2) {
    print_error('nopermission', 'error');
}

header('Content-Type: text/plain; charset=utf-8');

echo "🚀 MIGRACIÓN DE DATOS TELEGRAM A BD UNIFICADA\n";
echo "=============================================\n";
echo "BD Destino: {$CFG->dbname}\n";
echo "BD Origen: u449034524_mi_ia_db\n\n";

// Configuración BD original de Telegram
$telegram_config = get_telegram_db_config();
if (!$telegram_config) {
    die("Error: No se pudo cargar la configuración de la base de datos de Telegram.");
}

echo "📊 1. Conectando a BD Original de Telegram...\n";
try {
    $dsn = "mysql:host={$telegram_config['host']};dbname={$telegram_config['dbname']};charset=utf8mb4";
    $telegram_db = new PDO($dsn, $telegram_config['user'], $telegram_config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    echo "✅ Conexión BD Original: EXITOSA\n\n";
} catch (Exception $e) {
    echo "❌ Error conexión BD Original: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. Verificar tablas en BD original
echo "🔍 2. Verificando tablas en BD Original...\n";
$tables_to_migrate = ['MoodleUserLink', 'TelegramUser', 'telegramresponse'];
$table_data = [];

foreach ($tables_to_migrate as $table) {
    try {
        $stmt = $telegram_db->prepare("SELECT COUNT(*) FROM {$table}");
        $stmt->execute();
        $count = $stmt->fetchColumn();
        echo "✅ {$table}: {$count} registros\n";
        $table_data[$table] = $count;
    } catch (Exception $e) {
        echo "❌ {$table}: Error - " . $e->getMessage() . "\n";
        $table_data[$table] = false;
    }
}

// 3. Crear tablas en BD unificada
echo "\n🏗️ 3. Creando tablas en BD Unificada...\n";

// SQL para crear las tablas
$create_tables_sql = [
    'MoodleUserLink' => "
        CREATE TABLE IF NOT EXISTS {mdl_MoodleUserLink} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            moodleUserId INT NOT NULL,
            telegramUserId VARCHAR(255) NOT NULL,
            isActive TINYINT(1) DEFAULT 1,
            linkedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_moodle_user (moodleUserId),
            INDEX idx_telegram_user (telegramUserId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    'TelegramUser' => "
        CREATE TABLE IF NOT EXISTS {mdl_TelegramUser} (
            id VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255),
            totalPoints INT DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ",
    'telegramresponse' => "
        CREATE TABLE IF NOT EXISTS {mdl_telegramresponse} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userId VARCHAR(255) NOT NULL,
            questionId INT,
            isCorrect TINYINT(1) NOT NULL,
            responseTime DATETIME DEFAULT CURRENT_TIMESTAMP,
            category VARCHAR(255),
            difficulty VARCHAR(50),
            INDEX idx_user (userId),
            INDEX idx_question (questionId),
            INDEX idx_correct (isCorrect),
            INDEX idx_response_time (responseTime)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    "
];

foreach ($create_tables_sql as $table => $sql) {
    try {
        // Reemplazar placeholder con prefijo real
        $final_sql = str_replace('{mdl_' . $table . '}', $CFG->prefix . $table, $sql);
        $DB->execute($final_sql);
        echo "✅ Tabla {$CFG->prefix}{$table}: Creada\n";
    } catch (Exception $e) {
        echo "❌ Error creando {$table}: " . $e->getMessage() . "\n";
    }
}

// 4. Migrar datos
echo "\n📦 4. Migrando datos...\n";

foreach ($tables_to_migrate as $table) {
    if ($table_data[$table] === false || $table_data[$table] == 0) {
        echo "⚠️ Saltando {$table} - sin datos\n";
        continue;
    }
    
    echo "🔄 Migrando {$table} ({$table_data[$table]} registros)...\n";
    
    try {
        // Obtener datos de BD original
        $stmt = $telegram_db->prepare("SELECT * FROM {$table}");
        $stmt->execute();
        $records = $stmt->fetchAll();
        
        // Preparar inserción en BD unificada
        $dest_table = $CFG->prefix . $table;
        
        foreach ($records as $record) {
            try {
                // Insertar registro en BD unificada
                $DB->insert_record($table, (object)$record);
            } catch (Exception $e) {
                echo "  ⚠️ Error insertando registro: " . $e->getMessage() . "\n";
            }
        }
        
        // Verificar migración
        $migrated_count = $DB->count_records($table);
        echo "  ✅ Migrados: {$migrated_count} de {$table_data[$table]} registros\n";
        
    } catch (Exception $e) {
        echo "  ❌ Error migrando {$table}: " . $e->getMessage() . "\n";
    }
}

// 5. Verificación final
echo "\n🔍 5. Verificación Final...\n";
foreach ($tables_to_migrate as $table) {
    try {
        $count = $DB->count_records($table);
        echo "✅ {$CFG->prefix}{$table}: {$count} registros\n";
    } catch (Exception $e) {
        echo "❌ {$table}: Error verificando - " . $e->getMessage() . "\n";
    }
}

// 6. Verificar mapeo específico del usuario
echo "\n👤 6. Verificando mapeo usuario opomelilla...\n";
try {
    $mapping = $DB->get_record('MoodleUserLink', ['moodleUserId' => 2]);
    if ($mapping) {
        echo "✅ Mapeo encontrado:\n";
        echo "  - Moodle ID: {$mapping->moodleUserId}\n";
        echo "  - Telegram UUID: {$mapping->telegramUserId}\n";
        echo "  - Activo: " . ($mapping->isActive ? "Sí" : "No") . "\n";
        
        // Verificar datos del usuario
        if ($mapping->telegramUserId) {
            $response_count = $DB->count_records('telegramresponse', ['userId' => $mapping->telegramUserId]);
            echo "  - Respuestas: {$response_count}\n";
        }
    } else {
        echo "❌ No se encontró mapeo para usuario ID 2\n";
    }
} catch (Exception $e) {
    echo "❌ Error verificando mapeo: " . $e->getMessage() . "\n";
}

echo "\n🏁 MIGRACIÓN COMPLETADA\n";
echo "=======================\n";
echo "✅ Tablas creadas en BD unificada\n";
echo "✅ Datos migrados desde BD original\n";
echo "🔗 Mapeo usuario verificado\n";
echo "\n📌 PRÓXIMO PASO:\n";
echo "🔗 Probar analytics: https://campus.opomelilla.com/local/telegram_integration/analytics-simple.php\n";

echo "\n=== FIN MIGRACIÓN ===\n";
?> 