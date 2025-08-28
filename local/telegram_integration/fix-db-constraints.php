<?php
require_once('../../config.php');

echo "<h2>🔧 Solución de Problema de BD</h2>";

// Verificar restricciones de la tabla
echo "<h3>🔍 Investigando restricciones de tabla:</h3>";

try {
    // Obtener información de la tabla
    $table_info = $DB->get_records_sql("SHOW CREATE TABLE {local_telegram_user_topic_performance}");
    
    if ($table_info) {
        foreach ($table_info as $info) {
            echo "<pre style='background-color: #f5f5f5; padding: 10px; font-size: 12px;'>";
            echo htmlspecialchars($info->{'create table'});
            echo "</pre>";
        }
    }
    
    // Verificar índices
    $indexes = $DB->get_records_sql("SHOW INDEX FROM {local_telegram_user_topic_performance}");
    
    echo "<h3>📋 Índices encontrados:</h3>";
    foreach ($indexes as $index) {
        echo "<p>→ {$index->key_name} en {$index->column_name} (Único: " . ($index->non_unique ? 'NO' : 'SÍ') . ")</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}

// Limpiar registros problemáticos
echo "<h3>🧹 Limpiando registros problemáticos:</h3>";

try {
    // Eliminar registros duplicados por telegram user + section name
    $duplicates = $DB->get_records_sql("
        SELECT telegramuserid, sectionname, COUNT(*) as count
        FROM {local_telegram_user_topic_performance}
        GROUP BY telegramuserid, sectionname
        HAVING COUNT(*) > 1
    ");
    
    if ($duplicates) {
        echo "<p>⚠️ Encontrados duplicados:</p>";
        foreach ($duplicates as $dup) {
            echo "<p>→ {$dup->telegramuserid} - {$dup->sectionname} ({$dup->count} registros)</p>";
            
            // Mantener solo el más reciente
            $records = $DB->get_records('local_telegram_user_topic_performance', [
                'telegramuserid' => $dup->telegramuserid,
                'sectionname' => $dup->sectionname
            ], 'updatedat DESC');
            
            $keep_first = true;
            foreach ($records as $record) {
                if ($keep_first) {
                    $keep_first = false;
                    continue;
                }
                $DB->delete_records('local_telegram_user_topic_performance', ['id' => $record->id]);
                echo "<p>→ ✅ Eliminado registro duplicado ID {$record->id}</p>";
            }
        }
    } else {
        echo "<p>✅ No hay duplicados</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error limpiando: " . $e->getMessage() . "</p>";
}

// Test de inserción
echo "<h3>🧪 Test de inserción después de limpieza:</h3>";

try {
    $test_record = new stdClass();
    $test_record->telegramuserid = 'test_' . time();
    $test_record->sectionid = 999999;
    $test_record->sectionname = 'TEST_TOPIC';
    $test_record->totalquestions = 1;
    $test_record->correctanswers = 1;
    $test_record->incorrectanswers = 0;
    $test_record->accuracy = 100;
    $test_record->lastactivity = time();
    $test_record->createdat = time();
    $test_record->updatedat = time();
    
    $new_id = $DB->insert_record('local_telegram_user_topic_performance', $test_record);
    echo "<p>✅ Test exitoso - ID: {$new_id}</p>";
    
    // Limpiar test
    $DB->delete_records('local_telegram_user_topic_performance', ['id' => $new_id]);
    echo "<p>✅ Test limpiado</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Test falló: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Corrección completada</p>";
?> 