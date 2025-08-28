<?php
/**
 * Migración de PostgreSQL a MySQL
 * Migra los datos de Telegram desde PostgreSQL local a MySQL del hosting
 */

require_once(__DIR__ . '/../../config.php');

echo "🔄 Migración PostgreSQL → MySQL\n";
echo "==============================\n\n";

// Configuración PostgreSQL (local)
$pg_host = 'localhost';
$pg_port = '5432';
$pg_dbname = 'mi_ia_db';
$pg_user = 'postgres';
$pg_password = 'Opomelilla2024';

// Configuración MySQL (hosting)
$mysql_host = 'localhost';
$mysql_dbname = 'u449034524_mi_ia_db'; // Ajusta al nombre real de tu BD MySQL
$mysql_user = 'u449034524_admin'; // Ajusta al usuario real
$mysql_password = 'Opomelilla2024'; // Ajusta a la contraseña real

try {
    // Conectar a PostgreSQL
    echo "📡 Conectando a PostgreSQL...\n";
    $pg_dsn = "pgsql:host=$pg_host;port=$pg_port;dbname=$pg_dbname";
    $pg_pdo = new PDO($pg_dsn, $pg_user, $pg_password);
    $pg_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión PostgreSQL exitosa\n\n";
    
    // Conectar a MySQL
    echo "📡 Conectando a MySQL...\n";
    $mysql_dsn = "mysql:host=$mysql_host;dbname=$mysql_dbname;charset=utf8mb4";
    $mysql_pdo = new PDO($mysql_dsn, $mysql_user, $mysql_password);
    $mysql_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Conexión MySQL exitosa\n\n";
    
    // Crear tabla en MySQL si no existe
    echo "🏗️ Creando tabla TelegramResponse en MySQL...\n";
    $create_table_sql = "
        CREATE TABLE IF NOT EXISTS telegram_responses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL,
            question_id VARCHAR(50),
            subject VARCHAR(100),
            is_correct BOOLEAN DEFAULT FALSE,
            response_time INT,
            answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_subject (subject),
            INDEX idx_answered_at (answered_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $mysql_pdo->exec($create_table_sql);
    echo "✅ Tabla creada/verificada\n\n";
    
    // Obtener datos de PostgreSQL
    echo "📊 Obteniendo datos de PostgreSQL...\n";
    $pg_stmt = $pg_pdo->query("
        SELECT 
            \"userId\" as user_id,
            \"questionId\" as question_id,
            subject,
            \"isCorrect\" as is_correct,
            \"responseTime\" as response_time,
            \"answeredAt\" as answered_at
        FROM `TelegramResponse` 
        ORDER BY \"answeredAt\" DESC
    ");
    
    $responses = $pg_stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "📈 Encontrados " . count($responses) . " registros\n\n";
    
    // Migrar datos a MySQL
    echo "🔄 Migrando datos...\n";
    $insert_sql = "
        INSERT INTO telegram_responses 
        (user_id, question_id, subject, is_correct, response_time, answered_at) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        is_correct = VALUES(is_correct),
        response_time = VALUES(response_time),
        answered_at = VALUES(answered_at)
    ";
    
    $insert_stmt = $mysql_pdo->prepare($insert_sql);
    $migrated = 0;
    $errors = 0;
    
    foreach ($responses as $response) {
        try {
            $insert_stmt->execute([
                $response['user_id'],
                $response['question_id'],
                $response['subject'],
                $response['is_correct'] ? 1 : 0,
                $response['response_time'],
                $response['answered_at']
            ]);
            $migrated++;
        } catch (Exception $e) {
            $errors++;
            echo "❌ Error migrando registro: " . $e->getMessage() . "\n";
        }
    }
    
    echo "✅ Migración completada:\n";
    echo "- Registros migrados: $migrated\n";
    echo "- Errores: $errors\n\n";
    
    // Verificar datos migrados
    echo "🔍 Verificando datos migrados...\n";
    $count_stmt = $mysql_pdo->query("SELECT COUNT(*) FROM telegram_responses");
    $total_records = $count_stmt->fetchColumn();
    echo "📊 Total de registros en MySQL: $total_records\n";
    
    // Mostrar estadísticas
    $stats_stmt = $mysql_pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(is_correct) as correct,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT subject) as unique_subjects
        FROM telegram_responses
    ");
    $stats = $stats_stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "📈 Estadísticas:\n";
    echo "- Total respuestas: " . $stats['total'] . "\n";
    echo "- Respuestas correctas: " . $stats['correct'] . "\n";
    echo "- Usuarios únicos: " . $stats['unique_users'] . "\n";
    echo "- Materias únicas: " . $stats['unique_subjects'] . "\n\n";
    
    echo "🎉 Migración completada exitosamente\n";
    
} catch (Exception $e) {
    echo "❌ Error durante la migración: " . $e->getMessage() . "\n";
    echo "Código: " . $e->getCode() . "\n";
}

echo "\n📝 Notas:\n";
echo "1. Ajusta las credenciales MySQL según tu hosting\n";
echo "2. Ejecuta este script una vez para migrar los datos\n";
echo "3. Configura un cron job para sincronización periódica\n";
echo "4. Actualiza direct-ml-bridge.php para usar MySQL\n";
?> 