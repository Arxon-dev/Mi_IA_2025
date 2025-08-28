<?php
require_once('../../config.php');

echo "<h2>🔧 Corrección de Estructura de BD</h2>";

// Verificar registros con sectionid = 0
try {
    $problematic_records = $DB->get_records('local_telegram_user_topic_performance', array('sectionid' => 0));
    
    echo "<h3>🔍 Registros problemáticos (sectionid = 0):</h3>";
    echo "<p>📊 Encontrados: " . count($problematic_records) . " registros</p>";
    
    if (count($problematic_records) > 0) {
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Telegram User ID</th><th>Section Name</th><th>Total</th><th>Correct</th></tr>";
        
        foreach ($problematic_records as $record) {
            echo "<tr>";
            echo "<td>{$record->id}</td>";
            echo "<td>{$record->telegramuserid}</td>";
            echo "<td>{$record->sectionname}</td>";
            echo "<td>{$record->totalquestions}</td>";
            echo "<td>{$record->correctanswers}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Corregir los sectionid = 0
        echo "<h3>🔧 Corrigiendo sectionid = 0:</h3>";
        
        foreach ($problematic_records as $record) {
            $new_section_id = crc32($record->sectionname);
            
            try {
                $DB->execute("UPDATE {local_telegram_user_topic_performance} SET sectionid = ? WHERE id = ?", 
                    array($new_section_id, $record->id));
                
                echo "<p>✅ Corregido: {$record->sectionname} → sectionid = {$new_section_id}</p>";
                
            } catch (Exception $e) {
                echo "<p>❌ Error corrigiendo ID {$record->id}: " . $e->getMessage() . "</p>";
            }
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error verificando registros: " . $e->getMessage() . "</p>";
}

// Test de inserción después de corrección
echo "<h3>🧪 Test de inserción después de corrección:</h3>";

try {
    $test_record = new stdClass();
    $test_record->telegramuserid = 'test_user_' . time();
    $test_record->sectionid = crc32('TEST SECTION');
    $test_record->sectionname = 'TEST SECTION';
    $test_record->totalquestions = 1;
    $test_record->correctanswers = 1;
    $test_record->incorrectanswers = 0;
    $test_record->accuracy = 100.0;
    $test_record->lastactivity = time();
    $test_record->createdat = time();
    $test_record->updatedat = time();
    
    $inserted_id = $DB->insert_record('local_telegram_user_topic_performance', $test_record);
    
    if ($inserted_id) {
        echo "<p>✅ Test de inserción exitoso. ID: {$inserted_id}</p>";
        
        // Eliminar el registro de prueba
        $DB->delete_records('local_telegram_user_topic_performance', array('id' => $inserted_id));
        echo "<p>🧹 Registro de prueba eliminado</p>";
    } else {
        echo "<p>❌ Test de inserción aún falla</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error en test de inserción: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Corrección de BD completada</p>";
?> 