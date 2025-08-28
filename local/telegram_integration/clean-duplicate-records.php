<?php
require_once('../../config.php');

echo "<h2>🧹 Limpieza de Registros Duplicados</h2>";

// Limpiar registros con sectionid = 0
try {
    $duplicates = $DB->get_records('local_telegram_user_topic_performance', array('sectionid' => 0));
    
    echo "<p>📊 Registros con sectionid = 0 encontrados: " . count($duplicates) . "</p>";
    
    if (count($duplicates) > 0) {
        echo "<h3>🔧 Eliminando registros duplicados:</h3>";
        
        foreach ($duplicates as $record) {
            try {
                $DB->delete_records('local_telegram_user_topic_performance', array('id' => $record->id));
                echo "<p>✅ Eliminado: ID {$record->id} - {$record->sectionname}</p>";
            } catch (Exception $e) {
                echo "<p>❌ Error eliminando ID {$record->id}: " . $e->getMessage() . "</p>";
            }
        }
    }
    
    // Verificar después de limpieza
    $remaining = $DB->count_records('local_telegram_user_topic_performance', array('sectionid' => 0));
    echo "<p>📊 Registros con sectionid = 0 restantes: {$remaining}</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error en limpieza: " . $e->getMessage() . "</p>";
}

// Test de inserción después de limpieza
echo "<h3>🧪 Test de inserción después de limpieza:</h3>";

try {
    $test_record = new stdClass();
    $test_record->telegramuserid = 'test_clean_' . time();
    $test_record->sectionid = 99999;
    $test_record->sectionname = 'TEST AFTER CLEAN';
    $test_record->totalquestions = 1;
    $test_record->correctanswers = 1;
    $test_record->incorrectanswers = 0;
    $test_record->accuracy = 100.0;
    $test_record->lastactivity = time();
    $test_record->createdat = time();
    $test_record->updatedat = time();
    
    $inserted_id = $DB->insert_record('local_telegram_user_topic_performance', $test_record);
    
    if ($inserted_id) {
        echo "<p>✅ Test exitoso! ID: {$inserted_id}</p>";
        
        // Limpiar test
        $DB->delete_records('local_telegram_user_topic_performance', array('id' => $inserted_id));
        echo "<p>🧹 Test eliminado</p>";
    } else {
        echo "<p>❌ Test falló</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error en test: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Limpieza completada</p>";
?> 