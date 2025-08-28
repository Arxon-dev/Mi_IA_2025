<?php
// Debug script for payment error diagnosis
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type to plain text for better readability
header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNÓSTICO DE ERROR DE PAGO ===\n\n";

// 1. Check basic Moodle setup
echo "1. VERIFICACIÓN BÁSICA DE MOODLE:\n";
echo "- Moodle version: " . $CFG->version . "\n";
echo "- Site URL: " . $CFG->wwwroot . "\n";
echo "- Debug level: " . $CFG->debug . "\n";
echo "- Display debug: " . ($CFG->debugdisplay ? 'Yes' : 'No') . "\n\n";

// 2. Check if user is logged in
echo "2. VERIFICACIÓN DE USUARIO:\n";
if (isloggedin()) {
    echo "- Usuario logueado: Sí (ID: {$USER->id})\n";
    echo "- Username: {$USER->username}\n";
    echo "- Email: {$USER->email}\n";
} else {
    echo "- Usuario logueado: No\n";
    echo "ERROR: Usuario no está logueado\n";
    exit;
}
echo "\n";

// 3. Check capabilities
echo "3. VERIFICACIÓN DE PERMISOS:\n";
$context = context_system::instance();
try {
    $has_capability = has_capability('local/failed_questions_recovery:use', $context);
    echo "- Permiso 'local/failed_questions_recovery:use': " . ($has_capability ? 'Sí' : 'No') . "\n";
    
    if (!$has_capability) {
        echo "ERROR: Usuario no tiene permisos necesarios\n";
    }
} catch (Exception $e) {
    echo "ERROR verificando permisos: " . $e->getMessage() . "\n";
}
echo "\n";

// 4. Check if plugin files exist
echo "4. VERIFICACIÓN DE ARCHIVOS DEL PLUGIN:\n";
$files_to_check = [
    'lib.php',
    'classes/payment_manager.php',
    'classes/event/payment_completed.php',
    'process_payment.php',
    'lang/es/local_failed_questions_recovery.php'
];

foreach ($files_to_check as $file) {
    $filepath = $CFG->dirroot . '/local/failed_questions_recovery/' . $file;
    echo "- {$file}: " . (file_exists($filepath) ? 'Existe' : 'NO EXISTE') . "\n";
}
echo "\n";

// 5. Check database tables
echo "5. VERIFICACIÓN DE TABLAS DE BASE DE DATOS:\n";
$tables_to_check = [
    'local_failed_questions_recovery',
    'local_fqr_recovery_quizzes',
    'local_fqr_recovery_attempts',
    'local_fqr_user_payments'
];

foreach ($tables_to_check as $table) {
    try {
        $exists = $DB->get_manager()->table_exists($table);
        echo "- {$table}: " . ($exists ? 'Existe' : 'NO EXISTE') . "\n";
        
        if ($exists && $table === 'local_fqr_user_payments') {
            $count = $DB->count_records($table);
            echo "  Registros: {$count}\n";
        }
    } catch (Exception $e) {
        echo "- {$table}: ERROR - " . $e->getMessage() . "\n";
    }
}
echo "\n";

// 6. Check payment manager class
echo "6. VERIFICACIÓN DE CLASE PAYMENT_MANAGER:\n";
try {
    if (class_exists('\\local_failed_questions_recovery\\payment_manager')) {
        echo "- Clase payment_manager: Existe\n";
        
        // Test has_user_paid method
        $has_paid = \local_failed_questions_recovery\payment_manager::has_user_paid($USER->id);
        echo "- Usuario ha pagado: " . ($has_paid ? 'Sí' : 'No') . "\n";
        
        // Test get_payment_record method
        $payment_record = \local_failed_questions_recovery\payment_manager::get_payment_record($USER->id);
        if ($payment_record) {
            echo "- Registro de pago existe: Sí\n";
            echo "  Estado: {$payment_record->payment_status}\n";
            echo "  Cantidad: {$payment_record->payment_amount} {$payment_record->payment_currency}\n";
        } else {
            echo "- Registro de pago existe: No\n";
        }
    } else {
        echo "- Clase payment_manager: NO EXISTE\n";
    }
} catch (Exception $e) {
    echo "ERROR en payment_manager: " . $e->getMessage() . "\n";
}
echo "\n";

// 7. Check PayPal configuration
echo "7. VERIFICACIÓN DE CONFIGURACIÓN PAYPAL:\n";
$paypal_client_id = get_config('local_failed_questions_recovery', 'paypal_client_id');
if (empty($paypal_client_id)) {
    if (file_exists($CFG->dirroot . '/.env')) {
        $env = parse_ini_file($CFG->dirroot . '/.env');
        if (isset($env['PAYPAL_CLIENT_ID'])) {
            $paypal_client_id = $env['PAYPAL_CLIENT_ID'];
            echo "- PayPal Client ID (desde .env): Configurado\n";
        } else {
            echo "- PayPal Client ID: No encontrado en .env\n";
        }
    } else {
        echo "- Archivo .env: No existe\n";
    }
} else {
    echo "- PayPal Client ID (desde config): Configurado\n";
}

if (empty($paypal_client_id)) {
    echo "- Usando PayPal Client ID hardcoded\n";
}
echo "\n";

// 8. Test basic database operations
echo "8. PRUEBA DE OPERACIONES DE BASE DE DATOS:\n";
try {
    // Test insert
    $test_record = new stdClass();
    $test_record->userid = $USER->id;
    $test_record->payment_status = 'test';
    $test_record->payment_amount = 6.00;
    $test_record->payment_currency = 'EUR';
    $test_record->timecreated = time();
    $test_record->timemodified = time();
    
    $insert_id = $DB->insert_record('local_fqr_user_payments', $test_record);
    echo "- Inserción de prueba: Exitosa (ID: {$insert_id})\n";
    
    // Test update
    $test_record->id = $insert_id;
    $test_record->payment_status = 'test_updated';
    $test_record->timemodified = time();
    
    $update_result = $DB->update_record('local_fqr_user_payments', $test_record);
    echo "- Actualización de prueba: " . ($update_result ? 'Exitosa' : 'Fallida') . "\n";
    
    // Test select
    $select_result = $DB->get_record('local_fqr_user_payments', ['id' => $insert_id]);
    echo "- Selección de prueba: " . ($select_result ? 'Exitosa' : 'Fallida') . "\n";
    
    // Clean up test record
    $DB->delete_records('local_fqr_user_payments', ['id' => $insert_id]);
    echo "- Limpieza de prueba: Exitosa\n";
    
} catch (Exception $e) {
    echo "ERROR en operaciones de BD: " . $e->getMessage() . "\n";
}
echo "\n";

// 9. Check language strings
echo "9. VERIFICACIÓN DE STRINGS DE IDIOMA:\n";
$strings_to_check = [
    'payment_title',
    'payment_heading',
    'event_payment_completed'
];

foreach ($strings_to_check as $string_key) {
    try {
        $string_value = get_string($string_key, 'local_failed_questions_recovery');
        echo "- {$string_key}: Existe\n";
    } catch (Exception $e) {
        echo "- {$string_key}: NO EXISTE o ERROR\n";
    }
}
echo "\n";

// 10. Final recommendations
echo "10. RECOMENDACIONES:\n";
echo "- Si todas las verificaciones son exitosas, el problema podría estar en:\n";
echo "  * Configuración del servidor web\n";
echo "  * Permisos de archivos\n";
echo "  * Configuración de PHP\n";
echo "  * Logs del servidor web\n";
echo "\n";
echo "- Revisa los logs de error de Apache/Nginx para más detalles\n";
echo "- Verifica que el plugin esté correctamente instalado en Moodle\n";
echo "\n";

echo "=== FIN DEL DIAGNÓSTICO ===\n";
?>