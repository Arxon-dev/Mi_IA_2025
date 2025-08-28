<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Diagnóstico de Errores de Base de Datos</h2>";

// Verificar estructura de la tabla
echo "<h3>📋 Estructura de tabla local_telegram_user_topic_performance:</h3>";

try {
    $sample = $DB->get_record_sql("SELECT * FROM {local_telegram_user_topic_performance} LIMIT 1");
    if ($sample) {
        echo "<p>✅ Tabla accesible</p>";
        echo "<p>📋 Campos: " . implode(', ', array_keys(get_object_vars($sample))) . "</p>";
        
        // Mostrar registros actuales
        $current_count = $DB->count_records('local_telegram_user_topic_performance');
        echo "<p>📊 Registros actuales: {$current_count}</p>";
        
        // Mostrar algunos registros
        $records = $DB->get_records('local_telegram_user_topic_performance', array(), '', '*', 0, 5);
        echo "<h4>🔍 Registros de muestra:</h4>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Telegram User ID</th><th>Section ID</th><th>Section Name</th><th>Total</th><th>Correct</th></tr>";
        
        foreach ($records as $record) {
            echo "<tr>";
            echo "<td>{$record->id}</td>";
            echo "<td>{$record->telegramuserid}</td>";
            echo "<td>{$record->sectionid}</td>";
            echo "<td>{$record->sectionname}</td>";
            echo "<td>{$record->totalquestions}</td>";
            echo "<td>{$record->correctanswers}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } else {
        echo "<p>⚠️ Tabla vacía</p>";
    }
} catch (Exception $e) {
    echo "<p>❌ Error accediendo a la tabla: " . $e->getMessage() . "</p>";
}

// Test de inserción
echo "<h3>🧪 Test de inserción:</h3>";

try {
    $test_record = new stdClass();
    $test_record->telegramuserid = 'test_user_123';
    $test_record->sectionid = 999999;
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
        echo "<p>❌ Test de inserción falló</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error en test de inserción: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Diagnóstico completado</p>";
?> 