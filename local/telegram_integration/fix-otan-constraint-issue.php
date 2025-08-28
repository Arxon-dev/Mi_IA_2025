<?php
require_once('../../config.php');
require_once('locallib.php');

global $DB;

echo "=== DIAGNÓSTICO Y CORRECCIÓN CONSTRAINT OTAN ===\n";

// 1. Verificar registros existentes para el usuario OTAN
$telegram_user = '5650137656';
$topic = 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)';
$sectionid = abs(crc32($topic));

echo "Usuario: {$telegram_user}\n";
echo "Tema: {$topic}\n";
echo "Sectionid: {$sectionid}\n\n";

// 2. Buscar registro existente
$existing = $DB->get_record('local_telegram_user_topic_performance', [
    'telegramuserid' => $telegram_user,
    'sectionid' => $sectionid
]);

if ($existing) {
    echo "✅ REGISTRO EXISTENTE ENCONTRADO:\n";
    echo "ID: {$existing->id}\n";
    echo "Total preguntas: {$existing->totalquestions}\n";
    echo "Respuestas correctas: {$existing->correctanswers}\n";
    echo "Respuestas incorrectas: {$existing->incorrectanswers}\n";
    echo "Precisión: {$existing->accuracy}%\n";
    echo "Última actividad: " . date('Y-m-d H:i:s', $existing->lastactivity) . "\n\n";
    
    // Actualizar el registro existente con los datos del último quiz
    $existing->totalquestions += 1;
    $existing->incorrectanswers += 1; // Último resultado fue incorrecto
    $existing->accuracy = round(($existing->correctanswers / $existing->totalquestions) * 100, 2);
    $existing->lastactivity = time();
    $existing->updatedat = time();
    
    $result = $DB->update_record('local_telegram_user_topic_performance', $existing);
    
    if ($result) {
        echo "✅ REGISTRO ACTUALIZADO CORRECTAMENTE\n";
        echo "Nuevos valores:\n";
        echo "Total preguntas: {$existing->totalquestions}\n";
        echo "Respuestas correctas: {$existing->correctanswers}\n";
        echo "Respuestas incorrectas: {$existing->incorrectanswers}\n";
        echo "Precisión: {$existing->accuracy}%\n";
    } else {
        echo "❌ ERROR AL ACTUALIZAR REGISTRO\n";
    }
    
} else {
    echo "❌ NO SE ENCONTRÓ REGISTRO EXISTENTE\n";
    echo "Creando nuevo registro...\n";
    
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
    
    try {
        $new_id = $DB->insert_record('local_telegram_user_topic_performance', $new_record);
        
        if ($new_id) {
            echo "✅ NUEVO REGISTRO CREADO CON ID: {$new_id}\n";
        } else {
            echo "❌ ERROR AL CREAR NUEVO REGISTRO\n";
        }
    } catch (Exception $e) {
        echo "❌ EXCEPCIÓN AL CREAR REGISTRO: " . $e->getMessage() . "\n";
    }
}

// 3. Verificar estado final
echo "\n=== VERIFICACIÓN FINAL ===\n";
$final_record = $DB->get_record('local_telegram_user_topic_performance', [
    'telegramuserid' => $telegram_user,
    'sectionid' => $sectionid
]);

if ($final_record) {
    echo "✅ REGISTRO FINAL CONFIRMADO:\n";
    echo "ID: {$final_record->id}\n";
    echo "Total preguntas: {$final_record->totalquestions}\n";
    echo "Respuestas correctas: {$final_record->correctanswers}\n";
    echo "Respuestas incorrectas: {$final_record->incorrectanswers}\n";
    echo "Precisión: {$final_record->accuracy}%\n";
} else {
    echo "❌ REGISTRO FINAL NO ENCONTRADO\n";
}

echo "\n=== DIAGNÓSTICO COMPLETADO ===\n";
?>


### **Opción 2: Crear el Script Primero**

Primero necesitas crear el archivo `fix-otan-constraint-issue.php` en tu servidor:
```php
<?php
require_once('../../config.php');
require_once('locallib.php');

global $DB;

echo "=== DIAGNÓSTICO Y CORRECCIÓN CONSTRAINT OTAN ===\n";

// 1. Verificar registros existentes para el usuario OTAN
$telegram_user = '5650137656';
$topic = 'ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)';
$sectionid = abs(crc32($topic));

echo "Usuario: {$telegram_user}\n";
echo "Tema: {$topic}\n";
echo "Sectionid: {$sectionid}\n\n";

// 2. Buscar registro existente
$existing = $DB->get_record('local_telegram_user_topic_performance', [
    'telegramuserid' => $telegram_user,
    'sectionid' => $sectionid
]);

if ($existing) {
    echo "✅ REGISTRO EXISTENTE ENCONTRADO:\n";
    echo "ID: {$existing->id}\n";
    echo "Total preguntas: {$existing->totalquestions}\n";
    echo "Respuestas correctas: {$existing->correctanswers}\n";
    echo "Respuestas incorrectas: {$existing->incorrectanswers}\n";
    echo "Precisión: {$existing->accuracy}%\n";
    echo "Última actividad: " . date('Y-m-d H:i:s', $existing->lastactivity) . "\n\n";
    
    // Actualizar el registro existente con los datos del último quiz
    $existing->totalquestions += 1;
    $existing->incorrectanswers += 1; // Último resultado fue incorrecto
    $existing->accuracy = round(($existing->correctanswers / $existing->totalquestions) * 100, 2);
    $existing->lastactivity = time();
    $existing->updatedat = time();
    
    $result = $DB->update_record('local_telegram_user_topic_performance', $existing);
    
    if ($result) {
        echo "✅ REGISTRO ACTUALIZADO CORRECTAMENTE\n";
        echo "Nuevos valores:\n";
        echo "Total preguntas: {$existing->totalquestions}\n";
        echo "Respuestas correctas: {$existing->correctanswers}\n";
        echo "Respuestas incorrectas: {$existing->incorrectanswers}\n";
        echo "Precisión: {$existing->accuracy}%\n";
    } else {
        echo "❌ ERROR AL ACTUALIZAR REGISTRO\n";
    }
    
} else {
    echo "❌ NO SE ENCONTRÓ REGISTRO EXISTENTE\n";
    echo "Creando nuevo registro...\n";
    
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
    
    try {
        $new_id = $DB->insert_record('local_telegram_user_topic_performance', $new_record);
        
        if ($new_id) {
            echo "✅ NUEVO REGISTRO CREADO CON ID: {$new_id}\n";
        } else {
            echo "❌ ERROR AL CREAR NUEVO REGISTRO\n";
        }
    } catch (Exception $e) {
        echo "❌ EXCEPCIÓN AL CREAR REGISTRO: " . $e->getMessage() . "\n";
    }
}

// 3. Verificar estado final
echo "\n=== VERIFICACIÓN FINAL ===\n";
$final_record = $DB->get_record('local_telegram_user_topic_performance', [
    'telegramuserid' => $telegram_user,
    'sectionid' => $sectionid
]);

if ($final_record) {
    echo "✅ REGISTRO FINAL CONFIRMADO:\n";
    echo "ID: {$final_record->id}\n";
    echo "Total preguntas: {$final_record->totalquestions}\n";
    echo "Respuestas correctas: {$final_record->correctanswers}\n";
    echo "Respuestas incorrectas: {$final_record->incorrectanswers}\n";
    echo "Precisión: {$final_record->accuracy}%\n";
} else {
    echo "❌ REGISTRO FINAL NO ENCONTRADO\n";
}

echo "\n=== DIAGNÓSTICO COMPLETADO ===\n";
?>