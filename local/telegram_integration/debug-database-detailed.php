<?php
require_once('../../config.php');
require_once('locallib.php');

global $DB;

echo "=== DIAGNÓSTICO DETALLADO BASE DE DATOS ===\n";

// 1. Verificar conexión a la base de datos
try {
    $test_query = $DB->get_record_sql("SELECT 1 as test");
    echo "✅ CONEXIÓN BD: OK\n";
} catch (Exception $e) {
    echo "❌ CONEXIÓN BD: ERROR - " . $e->getMessage() . "\n";
    exit;
}

// 2. Verificar que la tabla existe
try {
    $table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');
    echo "✅ TABLA EXISTS: " . ($table_exists ? 'SÍ' : 'NO') . "\n";
    
    if (!$table_exists) {
        echo "❌ ERROR: La tabla no existe. Creando tabla...\n";
        local_telegram_integration_ensure_performance_table();
    }
} catch (Exception $e) {
    echo "❌ ERROR VERIFICANDO TABLA: " . $e->getMessage() . "\n";
}

// 3. Verificar estructura de la tabla
try {
    $columns = $DB->get_columns('local_telegram_user_topic_performance');
    echo "✅ COLUMNAS DE LA TABLA:\n";
    foreach ($columns as $column) {
        echo "  - {$column->name}: {$column->type}\n";
    }
} catch (Exception $e) {
    echo "❌ ERROR OBTENIENDO COLUMNAS: " . $e->getMessage() . "\n";
}

// 4. Verificar permisos de escritura
try {
    // Intentar insertar un registro de prueba
    $test_record = new \stdClass();
    $test_record->telegramuserid = 'TEST_USER_' . time();
    $test_record->sectionid = 999999;
    $test_record->sectionname = 'TEST SECTION';
    $test_record->totalquestions = 1;
    $test_record->correctanswers = 0;
    $test_record->incorrectanswers = 1;
    $test_record->accuracy = 0.00;
    $test_record->lastactivity = time();
    $test_record->createdat = time();
    $test_record->updatedat = time();
    
    $test_id = $DB->insert_record('local_telegram_user_topic_performance', $test_record);
    
    if ($test_id) {
        echo "✅ INSERCIÓN DE PRUEBA: OK (ID: {$test_id})\n";
        
        // Limpiar registro de prueba
        $DB->delete_records('local_telegram_user_topic_performance', ['id' => $test_id]);
        echo "✅ LIMPIEZA: Registro de prueba eliminado\n";
    } else {
        echo "❌ INSERCIÓN DE PRUEBA: FALLÓ\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR EN INSERCIÓN DE PRUEBA: " . $e->getMessage() . "\n";
    echo "❌ TIPO DE ERROR: " . get_class($e) . "\n";
    echo "❌ CÓDIGO DE ERROR: " . $e->getCode() . "\n";
    echo "❌ ARCHIVO: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

// 5. Intentar inserción OTAN con manejo detallado de errores
echo "\n=== INTENTANDO INSERCIÓN OTAN ===\n";

$telegram_user = '5650137656';
$topic = 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)';
$sectionid = abs(crc32($topic));

echo "Usuario: {$telegram_user}\n";
echo "Tema: {$topic}\n";
echo "Sectionid: {$sectionid}\n";

// Verificar si ya existe
$existing = $DB->get_record('local_telegram_user_topic_performance', [
    'telegramuserid' => $telegram_user,
    'sectionid' => $sectionid
]);

if ($existing) {
    echo "⚠️ REGISTRO YA EXISTE: ID {$existing->id}\n";
} else {
    echo "✅ NO EXISTE REGISTRO, PROCEDIENDO A CREAR...\n";
    
    try {
        $new_record = new \stdClass();
        $new_record->telegramuserid = $telegram_user;
        $new_record->sectionid = $sectionid;
        $new_record->sectionname = $topic;
        $new_record->totalquestions = 1;
        $new_record->correctanswers = 0;
        $new_record->incorrectanswers = 1;
        $new_record->accuracy = 0.00;
        $new_record->lastactivity = time();
        $new_record->createdat = time();
        $new_record->updatedat = time();
        
        echo "📝 DATOS A INSERTAR:\n";
        echo "  telegramuserid: {$new_record->telegramuserid}\n";
        echo "  sectionid: {$new_record->sectionid}\n";
        echo "  sectionname: {$new_record->sectionname}\n";
        echo "  totalquestions: {$new_record->totalquestions}\n";
        echo "  correctanswers: {$new_record->correctanswers}\n";
        echo "  incorrectanswers: {$new_record->incorrectanswers}\n";
        echo "  accuracy: {$new_record->accuracy}\n";
        echo "  lastactivity: {$new_record->lastactivity}\n";
        echo "  createdat: {$new_record->createdat}\n";
        echo "  updatedat: {$new_record->updatedat}\n";
        
        $new_id = $DB->insert_record('local_telegram_user_topic_performance', $new_record);
        
        if ($new_id) {
            echo "✅ ÉXITO: Registro OTAN creado con ID: {$new_id}\n";
        } else {
            echo "❌ FALLÓ: insert_record devolvió false\n";
        }
        
    } catch (dml_write_exception $e) {
        echo "❌ ERROR DML_WRITE: " . $e->getMessage() . "\n";
        echo "❌ ERROR CODE: " . $e->errorcode . "\n";
        echo "❌ DEBUG INFO: " . $e->debuginfo . "\n";
    } catch (dml_exception $e) {
        echo "❌ ERROR DML: " . $e->getMessage() . "\n";
        echo "❌ ERROR CODE: " . $e->errorcode . "\n";
        echo "❌ DEBUG INFO: " . $e->debuginfo . "\n";
    } catch (Exception $e) {
        echo "❌ ERROR GENERAL: " . $e->getMessage() . "\n";
        echo "❌ TIPO: " . get_class($e) . "\n";
        echo "❌ CÓDIGO: " . $e->getCode() . "\n";
        echo "❌ ARCHIVO: " . $e->getFile() . ":" . $e->getLine() . "\n";
        echo "❌ STACK TRACE:\n" . $e->getTraceAsString() . "\n";
    }
}

// 6. Verificación final
echo "\n=== VERIFICACIÓN FINAL ===\n";
$final_check = $DB->get_record('local_telegram_user_topic_performance', [
    'telegramuserid' => $telegram_user,
    'sectionid' => $sectionid
]);

if ($final_check) {
    echo "✅ REGISTRO FINAL ENCONTRADO: ID {$final_check->id}\n";
    echo "  Total preguntas: {$final_check->totalquestions}\n";
    echo "  Respuestas correctas: {$final_check->correctanswers}\n";
    echo "  Respuestas incorrectas: {$final_check->incorrectanswers}\n";
    echo "  Precisión: {$final_check->accuracy}%\n";
} else {
    echo "❌ REGISTRO FINAL NO ENCONTRADO\n";
}

echo "\n=== DIAGNÓSTICO COMPLETADO ===\n";
?>