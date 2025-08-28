<?php
require_once('../../config.php');
require_once($CFG->libdir.'/adminlib.php');

echo "<h2>🔧 Corrigiendo Estructura de Tabla</h2>";

// Eliminar tabla existente si tiene estructura incorrecta
if ($DB->get_manager()->table_exists('local_telegram_user_topic_performance')) {
    echo "<p>⚠️ Eliminando tabla existente con estructura incorrecta...</p>";
    $DB->get_manager()->drop_table(new xmldb_table('local_telegram_user_topic_performance'));
}

// Crear tabla con estructura correcta
$sql = "CREATE TABLE {local_telegram_user_topic_performance} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegramuserid VARCHAR(255) NOT NULL,
    sectionid INT NOT NULL,
    sectionname VARCHAR(255) NOT NULL,
    totalquestions INT DEFAULT 0,
    correctanswers INT DEFAULT 0,
    incorrectanswers INT DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    lastactivity INT DEFAULT 0,
    createdat INT DEFAULT 0,
    updatedat INT DEFAULT 0,
    UNIQUE KEY unique_user_section (telegramuserid, sectionid),
    INDEX idx_telegramuser (telegramuserid),
    INDEX idx_section (sectionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

try {
    $DB->execute($sql);
    echo "<p>✅ Tabla creada con estructura correcta</p>";
    
    // Verificar estructura
    $columns = $DB->get_columns('local_telegram_user_topic_performance');
    echo "<h3>📋 Estructura de la tabla:</h3>";
    echo "<ul>";
    foreach ($columns as $column) {
        echo "<li>{$column->name} - {$column->type}</li>";
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Corrección completada</p>";
?>