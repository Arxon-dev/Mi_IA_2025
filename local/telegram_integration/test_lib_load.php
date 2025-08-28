<?php
// Script to isolate and debug the loading of lib.php

// 1. Set up the Moodle environment
define('MOODLE_INTERNAL', true);
require_once(__DIR__ . '/../../config.php');

// 2. We need to be logged in to do anything.
require_login(); 

// Ensure the user is an admin to run this diagnostic tool
require_capability('moodle/site:config', context_system::instance());

echo "<h1>Diagnóstico de Carga de lib.php</h1>";

// 3. IMPORTANT: Switch the context to the student user to replicate the error condition
$studentuserid = 575; // The ID of the student user 'desy'
$studentuser = $DB->get_record('user', ['id' => $studentuserid]);

if (!$studentuser) {
    echo "Error: No se pudo encontrar al usuario estudiante con ID $studentuserid.";
    die();
}

// Switch user context
$original_user = $USER;
$USER = $studentuser;

// Redirect output to a log file to avoid screen output issues
error_log("--- TEST_LIB_LOAD: INICIANDO PRUEBA DE CARGA AISLADA PARA lib.php ---");
error_log("--- TEST_LIB_LOAD: Contexto cambiado al usuario con ID: " . $USER->id . " ({$USER->username}) ---");

try {
    // 4. Try to load the problematic library file
    $lib_path = $CFG->dirroot . '/local/telegram_integration/lib.php';
    error_log("--- TEST_LIB_LOAD: Intentando cargar: " . $lib_path);
    
    // Use include instead of require_once to generate a warning instead of a fatal error on failure
    $result = include_once($lib_path);
    
    if ($result) {
        error_log("--- TEST_LIB_LOAD: include_once() se completó y devolvió true.");
    } else {
        error_log("--- TEST_LIB_LOAD: include_once() devolvió false. Esto indica un error fatal en el archivo incluido.");
    }
    
    // 5. Check if the function exists AFTER loading
    if (function_exists('local_telegram_integration_update_user_topic_performance')) {
        error_log("--- TEST_LIB_LOAD: ¡ÉXITO! La función 'local_telegram_integration_update_user_topic_performance' AHORA EXISTE.");
        echo "<p style='color:green;'>¡ÉXITO! lib.php se cargó correctamente y la función existe.</p>";
    } else {
        error_log("--- TEST_LIB_LOAD: ¡FALLO! La función sigue sin existir. El error fatal silencioso está confirmado.");
        echo "<p style='color:red;'>¡FALLO! La función no existe después de intentar cargar el archivo. Revisa los logs para ver el error fatal capturado.</p>";
    }

} catch (Throwable $t) {
    // 6. If a fatal error occurs, this block will catch it
    error_log("--- TEST_LIB_LOAD: ¡ERROR FATAL CAPTURADO! ---");
    error_log("--- TEST_LIB_LOAD: Mensaje: " . $t->getMessage());
    error_log("--- TEST_LIB_LOAD: Fichero: " . $t->getFile());
    error_log("--- TEST_LIB_LOAD: Línea: " . $t->getLine());
    error_log("--- TEST_LIB_LOAD: Trace: " . $t->getTraceAsString());
    echo "<h2>Error Fatal Capturado</h2><pre>" . $t->__toString() . "</pre>";
}

// Restore original user session
$USER = $original_user;
error_log("--- TEST_LIB_LOAD: Contexto de usuario restaurado. Prueba finalizada. ---");

echo "<p>Prueba completada. Los resultados detallados se han enviado al log de errores del servidor.</p>"; 