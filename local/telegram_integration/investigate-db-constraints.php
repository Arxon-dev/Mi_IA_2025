<?php
require_once('../../config.php');

echo "<h2>🔍 Investigación Profunda de BD</h2>";

// Verificar índices y restricciones
echo "<h3>📋 Estructura de tabla e índices:</h3>";

try {
    // Obtener información de la tabla
    $table_info = $DB->get_records_sql("SHOW CREATE TABLE {local_telegram_user_topic_performance}");
    
    if ($table_info) {
        foreach ($table_info as $info) {
            echo "<p><strong>Definición de tabla:</strong></p>";
            echo "<pre>" . htmlspecialchars($info->{'Create Table'}) . "</pre>";
        }
    }
    
    // Verificar índices
    $indexes = $DB->get_records_sql("SHOW INDEX FROM {local_telegram_user_topic_performance}");
    
    echo "<h4>📊 Índices existentes:</h4>";
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Nombre</th><th>Columna</th><th>Único</th><th>Tipo</th></tr>";
    
    foreach ($indexes as $index) {
        $unique = $index->Non_unique == 0 ? "✅ SÍ" : "❌ NO";
        echo "<tr>";
        echo "<td>{$index->Key_name}</td>";
        echo "<td>{$index->Column_name}</td>";
        echo "<td>{$unique}</td>";
        echo "<td>{$index->Index_type}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (Exception $e) {
    echo "<p>❌ Error obteniendo estructura: " . $e->getMessage() . "</p>";
}

// Verificar registros duplicados potenciales
echo "<h3>🔍 Buscar registros duplicados:</h3>";

try {
    // Buscar duplicados por telegramuserid + sectionname
    $duplicates = $DB->get_records_sql("
        SELECT telegramuserid, sectionname, COUNT(*) as count 
        FROM {local_telegram_user_topic_performance} 
        GROUP BY telegramuserid, sectionname 
        HAVING COUNT(*) > 1
    ");
    
    if (count($duplicates) > 0) {
        echo "<p>❌ Encontrados " . count($duplicates) . " duplicados por telegramuserid + sectionname:</p>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Telegram User ID</th><th>Section Name</th><th>Count</th></tr>";
        
        foreach ($duplicates as $dup) {
            echo "<tr>";
            echo "<td>{$dup->telegramuserid}</td>";
            echo "<td>{$dup->sectionname}</td>";
            echo "<td>{$dup->count}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>✅ No hay duplicados por telegramuserid + sectionname</p>";
    }
    
    // Buscar duplicados por telegramuserid + sectionid
    $duplicates_id = $DB->get_records_sql("
        SELECT telegramuserid, sectionid, COUNT(*) as count 
        FROM {local_telegram_user_topic_performance} 
        GROUP BY telegramuserid, sectionid 
        HAVING COUNT(*) > 1
    ");
    
    if (count($duplicates_id) > 0) {
        echo "<p>❌ Encontrados " . count($duplicates_id) . " duplicados por telegramuserid + sectionid:</p>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Telegram User ID</th><th>Section ID</th><th>Count</th></tr>";
        
        foreach ($duplicates_id as $dup) {
            echo "<tr>";
            echo "<td>{$dup->telegramuserid}</td>";
            echo "<td>{$dup->sectionid}</td>";
            echo "<td>{$dup->count}</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p>✅ No hay duplicados por telegramuserid + sectionid</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error buscando duplicados: " . $e->getMessage() . "</p>";
}

// Test de inserción con diferentes combinaciones
echo "<h3>🧪 Tests de inserción específicos:</h3>";

$test_cases = [
    [
        'telegramuserid' => 'test_user_1',
        'sectionid' => 12345,
        'sectionname' => 'TEST UNIQUE 1'
    ],
    [
        'telegramuserid' => 'test_user_2', 
        'sectionid' => 12345,
        'sectionname' => 'TEST UNIQUE 2'
    ],
    [
        'telegramuserid' => 'test_user_1',
        'sectionid' => 12346,
        'sectionname' => 'TEST UNIQUE 3'
    ]
];

foreach ($test_cases as $i => $test_data) {
    try {
        $test_record = new stdClass();
        $test_record->telegramuserid = $test_data['telegramuserid'];
        $test_record->sectionid = $test_data['sectionid'];
        $test_record->sectionname = $test_data['sectionname'];
        $test_record->totalquestions = 1;
        $test_record->correctanswers = 1;
        $test_record->incorrectanswers = 0;
        $test_record->accuracy = 100.0;
        $test_record->lastactivity = time();
        $test_record->createdat = time();
        $test_record->updatedat = time();
        
        $inserted_id = $DB->insert_record('local_telegram_user_topic_performance', $test_record);
        
        echo "<p>✅ Test {$i}: Inserción exitosa. ID: {$inserted_id}</p>";
        
        // Limpiar
        $DB->delete_records('local_telegram_user_topic_performance', array('id' => $inserted_id));
        
    } catch (Exception $e) {
        echo "<p>❌ Test {$i}: Error - " . $e->getMessage() . "</p>";
    }
}

echo "<p>🎉 Investigación de BD completada</p>";
?> 