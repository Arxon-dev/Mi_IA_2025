<?php
require_once('../../config.php');

echo "<h2>🔍 Debug de Permisos y Restricciones de BD</h2>";

// Verificar permisos de usuario
echo "<h3>👤 Información del usuario de BD:</h3>";

try {
    $user_info = $DB->get_record_sql("SELECT USER() as current_user, DATABASE() as current_db");
    echo "<p>✅ Usuario actual: {$user_info->current_user}</p>";
    echo "<p>✅ Base de datos actual: {$user_info->current_db}</p>";
} catch (Exception $e) {
    echo "<p>❌ Error obteniendo info de usuario: " . $e->getMessage() . "</p>";
}

// Verificar permisos específicos
echo "<h3>🔐 Permisos en tabla:</h3>";

try {
    $grants = $DB->get_records_sql("SHOW GRANTS");
    echo "<p>✅ Grants obtenidos: " . count($grants) . "</p>";
    
    foreach ($grants as $grant) {
        $grant_text = reset($grant); // Obtener el primer (y único) valor
        echo "<p>📋 {$grant_text}</p>";
    }
} catch (Exception $e) {
    echo "<p>❌ Error obteniendo grants: " . $e->getMessage() . "</p>";
}

// Verificar estructura detallada de la tabla
echo "<h3>📊 Estructura detallada de tabla:</h3>";

try {
    $columns = $DB->get_records_sql("DESCRIBE {local_telegram_user_topic_performance}");
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    
    foreach ($columns as $col) {
        echo "<tr>";
        echo "<td>{$col->Field}</td>";
        echo "<td>{$col->Type}</td>";
        echo "<td>{$col->Null}</td>";
        echo "<td>{$col->Key}</td>";
        echo "<td>{$col->Default}</td>";
        echo "<td>{$col->Extra}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch (Exception $e) {
    echo "<p>❌ Error obteniendo estructura: " . $e->getMessage() . "</p>";
}

// Test con diferentes tipos de datos
echo "<h3>🧪 Test con diferentes valores:</h3>";

$test_values = [
    ['telegramuserid' => 'test_short', 'sectionid' => 12345, 'sectionname' => 'SHORT'],
    ['telegramuserid' => 'test_medium_length_user', 'sectionid' => 67890, 'sectionname' => 'MEDIUM LENGTH SECTION NAME'],
    ['telegramuserid' => 'test_very_long_telegram_user_id_that_might_cause_issues', 'sectionid' => 11111, 'sectionname' => 'VERY LONG SECTION NAME THAT MIGHT EXCEED LIMITS AND CAUSE PROBLEMS WITH DATABASE CONSTRAINTS'],
];

foreach ($test_values as $i => $test_data) {
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
        
        echo "<p>✅ Test {$i}: Éxito - ID: {$inserted_id}</p>";
        
        // Limpiar
        $DB->delete_records('local_telegram_user_topic_performance', array('id' => $inserted_id));
        
    } catch (Exception $e) {
        echo "<p>❌ Test {$i}: Error - " . $e->getMessage() . "</p>";
        echo "<p>📋 Datos: " . json_encode($test_data) . "</p>";
    }
}

echo "<p>🎉 Debug de BD completado</p>";
?> 