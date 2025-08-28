<?php
require_once('../../config.php');

echo "<h2>🔧 Investigación y Corrección de Problema de BD</h2>";

// Verificar si la tabla realmente existe
echo "<h3>🔍 Verificando existencia de tabla:</h3>";

try {
    $table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');
    echo "<p>✅ Tabla existe: " . ($table_exists ? "SÍ" : "NO") . "</p>";
    
    if (!$table_exists) {
        echo "<p>❌ ¡LA TABLA NO EXISTE! Necesita ser creada.</p>";
        
        // Intentar crear la tabla
        echo "<h3>🔧 Creando tabla:</h3>";
        
        $sql = "CREATE TABLE IF NOT EXISTS {local_telegram_user_topic_performance} (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            telegramuserid VARCHAR(255) NOT NULL,
            sectionid INT(11) NOT NULL,
            sectionname VARCHAR(255) NOT NULL,
            totalquestions INT(11) DEFAULT 0,
            correctanswers INT(11) DEFAULT 0,
            incorrectanswers INT(11) DEFAULT 0,
            accuracy DECIMAL(5,2) DEFAULT 0.00,
            lastactivity INT(11) DEFAULT 0,
            createdat INT(11) DEFAULT 0,
            updatedat INT(11) DEFAULT 0,
            UNIQUE KEY unique_user_section (telegramuserid, sectionid)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        try {
            $DB->execute($sql);
            echo "<p>✅ Tabla creada exitosamente</p>";
        } catch (Exception $e) {
            echo "<p>❌ Error creando tabla: " . $e->getMessage() . "</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error verificando tabla: " . $e->getMessage() . "</p>";
}

// Verificar registros actuales
echo "<h3>📊 Registros actuales:</h3>";

try {
    $count = $DB->count_records('local_telegram_user_topic_performance');
    echo "<p>📊 Total de registros: {$count}</p>";
    
    if ($count > 0) {
        $sample = $DB->get_records('local_telegram_user_topic_performance', array(), '', '*', 0, 3);
        echo "<h4>🔍 Muestra de registros:</h4>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Telegram User</th><th>Section ID</th><th>Section Name</th></tr>";
        
        foreach ($sample as $record) {
            echo "<tr>";
            echo "<td>{$record->id}</td>";
            echo "<td>{$record->telegramuserid}</td>";
            echo "<td>{$record->sectionid}</td>";
            echo "<td>{$record->sectionname}</td>";
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error consultando registros: " . $e->getMessage() . "</p>";
}

// Test de inserción simple después de verificaciones
echo "<h3>🧪 Test de inserción final:</h3>";

try {
    $unique_id = 'test_final_' . time() . '_' . rand(1000, 9999);
    
    $test_record = new stdClass();
    $test_record->telegramuserid = $unique_id;
    $test_record->sectionid = crc32($unique_id);
    $test_record->sectionname = 'TEST FINAL';
    $test_record->totalquestions = 1;
    $test_record->correctanswers = 1;
    $test_record->incorrectanswers = 0;
    $test_record->accuracy = 100.0;
    $test_record->lastactivity = time();
    $test_record->createdat = time();
    $test_record->updatedat = time();
    
    $inserted_id = $DB->insert_record('local_telegram_user_topic_performance', $test_record);
    
    echo "<p>✅ ¡TEST EXITOSO! ID: {$inserted_id}</p>";
    
    // Verificar que se insertó correctamente
    $verify = $DB->get_record('local_telegram_user_topic_performance', array('id' => $inserted_id));
    if ($verify) {
        echo "<p>✅ Verificación exitosa: {$verify->sectionname}</p>";
    }
    
    // Limpiar
    $DB->delete_records('local_telegram_user_topic_performance', array('id' => $inserted_id));
    echo "<p>🧹 Test limpiado</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error en test final: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Investigación completada</p>";
?> 