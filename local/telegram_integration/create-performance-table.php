<?php
require_once('../../config.php');

echo "<h2>🔧 Verificación y Creación de Tabla Performance</h2>";

// Verificar si la tabla existe
$table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');

if ($table_exists) {
    echo "<p>✅ La tabla local_telegram_user_topic_performance YA EXISTE</p>";
    
    // Mostrar estructura actual
    try {
        $sample = $DB->get_record_sql("SELECT * FROM {local_telegram_user_topic_performance} LIMIT 1");
        if ($sample) {
            echo "<p>📋 Campos: " . implode(', ', array_keys(get_object_vars($sample))) . "</p>";
            
            $count = $DB->count_records('local_telegram_user_topic_performance');
            echo "<p>📊 Registros actuales: {$count}</p>";
        } else {
            echo "<p>📋 Tabla vacía</p>";
        }
    } catch (Exception $e) {
        echo "<p>❌ Error accediendo a la tabla: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p>❌ La tabla local_telegram_user_topic_performance NO EXISTE</p>";
    echo "<p>🔧 Creando tabla...</p>";
    
    try {
        // Crear la tabla con la estructura correcta
        $sql = "CREATE TABLE {local_telegram_user_topic_performance} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            userid INT NOT NULL,
            topic VARCHAR(255) NOT NULL,
            correct_answers INT DEFAULT 0,
            total_answers INT DEFAULT 0,
            last_updated INT DEFAULT 0,
            UNIQUE KEY unique_user_topic (userid, topic),
            INDEX idx_userid (userid),
            INDEX idx_topic (topic)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $DB->execute($sql);
        
        echo "<p>✅ Tabla creada exitosamente</p>";
        
        // Verificar creación
        if ($DB->get_manager()->table_exists('local_telegram_user_topic_performance')) {
            echo "<p>✅ Verificación: La tabla existe y está lista</p>";
        } else {
            echo "<p>❌ Error: La tabla no se pudo crear correctamente</p>";
        }
        
    } catch (Exception $e) {
        echo "<p>❌ Error creando la tabla: " . $e->getMessage() . "</p>";
    }
}

echo "<p>🎉 Proceso completado</p>";
?> 