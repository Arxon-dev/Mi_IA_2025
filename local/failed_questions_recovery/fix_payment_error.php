<?php
// Script para corregir errores comunes en payment.php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');
require_login();

// Solo administradores pueden ejecutar este script
require_capability('moodle/site:config', context_system::instance());

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Script de Corrección para Payment.php</h2>";
echo "<pre>";

echo "=== INICIANDO CORRECCIONES ===\n\n";

// 1. Verificar y crear tabla de pagos si no existe
echo "1. Verificando tabla de pagos...\n";
if (!$DB->get_manager()->table_exists('local_fqr_user_payments')) {
    echo "   ⚠ Tabla local_fqr_user_payments no existe, creándola...\n";
    
    $table = new xmldb_table('local_fqr_user_payments');
    
    // Definir campos
    $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
    $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
    $table->add_field('payment_status', XMLDB_TYPE_CHAR, '50', null, XMLDB_NOTNULL, null, 'pending');
    $table->add_field('payment_amount', XMLDB_TYPE_NUMBER, '10,2', null, XMLDB_NOTNULL, null, '6.00');
    $table->add_field('payment_currency', XMLDB_TYPE_CHAR, '3', null, XMLDB_NOTNULL, null, 'EUR');
    $table->add_field('payment_id', XMLDB_TYPE_CHAR, '255', null, null, null, null);
    $table->add_field('payment_date', XMLDB_TYPE_INTEGER, '10', null, null, null, null);
    $table->add_field('expiry_date', XMLDB_TYPE_INTEGER, '10', null, null, null, null);
    $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
    $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
    
    // Definir claves
    $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
    $table->add_key('fk_payments_userid', XMLDB_KEY_FOREIGN, array('userid'), 'user', array('id'));
    
    // Definir índices
    $table->add_index('payment_id_idx', XMLDB_INDEX_NOTUNIQUE, array('payment_id'));
    
    try {
        $DB->get_manager()->create_table($table);
        echo "   ✓ Tabla local_fqr_user_payments creada exitosamente\n";
    } catch (Exception $e) {
        echo "   ✗ Error creando tabla: " . $e->getMessage() . "\n";
    }
} else {
    echo "   ✓ Tabla local_fqr_user_payments ya existe\n";
}

// 2. Verificar permisos del plugin
echo "\n2. Verificando permisos del plugin...\n";
$context = context_system::instance();
$capability = 'local/failed_questions_recovery:use';

// Verificar si la capacidad existe
$cap_exists = $DB->record_exists('capabilities', array('name' => $capability));
if (!$cap_exists) {
    echo "   ⚠ Capacidad '{$capability}' no existe, creándola...\n";
    
    // Insertar capacidad
    $cap_record = new stdClass();
    $cap_record->name = $capability;
    $cap_record->captype = 'read';
    $cap_record->contextlevel = CONTEXT_SYSTEM;
    $cap_record->component = 'local_failed_questions_recovery';
    $cap_record->riskbitmask = 0;
    
    try {
        $DB->insert_record('capabilities', $cap_record);
        echo "   ✓ Capacidad creada exitosamente\n";
    } catch (Exception $e) {
        echo "   ✗ Error creando capacidad: " . $e->getMessage() . "\n";
    }
} else {
    echo "   ✓ Capacidad '{$capability}' ya existe\n";
}

// Asignar permiso a usuarios autenticados
echo "   - Asignando permiso a usuarios autenticados...\n";
$authuser_role = $DB->get_record('role', array('shortname' => 'user'));
if ($authuser_role) {
    $existing_permission = $DB->get_record('role_capabilities', array(
        'roleid' => $authuser_role->id,
        'capability' => $capability,
        'contextid' => $context->id
    ));
    
    if (!$existing_permission) {
        $permission = new stdClass();
        $permission->contextid = $context->id;
        $permission->roleid = $authuser_role->id;
        $permission->capability = $capability;
        $permission->permission = CAP_ALLOW;
        $permission->timemodified = time();
        $permission->modifierid = $USER->id;
        
        try {
            $DB->insert_record('role_capabilities', $permission);
            echo "   ✓ Permiso asignado a usuarios autenticados\n";
        } catch (Exception $e) {
            echo "   ✗ Error asignando permiso: " . $e->getMessage() . "\n";
        }
    } else {
        echo "   ✓ Permiso ya está asignado\n";
    }
}

// 3. Verificar strings de idioma
echo "\n3. Verificando strings de idioma...\n";
$lang_file = $CFG->dirroot . '/local/failed_questions_recovery/lang/es/local_failed_questions_recovery.php';
if (!file_exists($lang_file)) {
    echo "   ⚠ Archivo de idioma no existe: {$lang_file}\n";
} else {
    echo "   ✓ Archivo de idioma existe\n";
    
    // Verificar strings específicos
    $required_strings = array(
        'payment_title',
        'payment_heading',
        'event_payment_completed'
    );
    
    include($lang_file);
    
    foreach ($required_strings as $str_key) {
        if (isset($string[$str_key])) {
            echo "   ✓ String '{$str_key}' existe\n";
        } else {
            echo "   ⚠ String '{$str_key}' falta\n";
        }
    }
}

// 4. Crear versión corregida de payment.php
echo "\n4. Creando versión corregida de payment.php...\n";

$corrected_payment_content = '<?php
// Corrected payment.php - Fixed version
// This file is part of Moodle - http://moodle.org/

// Error handling
error_reporting(E_ALL);
ini_set("display_errors", 0); // Disable display for production
ini_set("log_errors", 1);

try {
    require_once("../../config.php");
    require_once($CFG->dirroot . "/local/failed_questions_recovery/lib.php");
    
    // Check login
    require_login();
    
    // Check capability
    $context = context_system::instance();
    require_capability("local/failed_questions_recovery:use", $context);
    
    // Get PayPal client ID with better error handling
    $paypal_client_id = get_config("local_failed_questions_recovery", "paypal_client_id");
    if (empty($paypal_client_id)) {
        if (file_exists($CFG->dirroot . "/.env")) {
            $env = parse_ini_file($CFG->dirroot . "/.env");
            if (isset($env["PAYPAL_CLIENT_ID"])) {
                $paypal_client_id = $env["PAYPAL_CLIENT_ID"];
            }
        }
    }
    
    // Fallback PayPal client ID
    if (empty($paypal_client_id)) {
        $paypal_client_id = "AZPrc9A4Po6XVXSc4aqcNVW8RlqUSrWavZqI1BLE-4kQTQ-JwWUqNCetceVLE7JarlJQ-WP1JwD_Kc5x";
    }
    
    // Initialize payment with error handling
    try {
        $payment_id = \\local_failed_questions_recovery\\payment_manager::initialize_payment($USER->id);
    } catch (Exception $e) {
        debugging("Error initializing payment: " . $e->getMessage(), DEBUG_DEVELOPER);
        $payment_id = 0;
    }
    
    // Set up page
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url("/local/failed_questions_recovery/payment.php"));
    
    // Safe string loading
    $title = "Pago de Acceso";
    $heading = "Pago de Acceso a Recuperación de Preguntas Falladas";
    
    try {
        $title = get_string("payment_title", "local_failed_questions_recovery");
        $heading = get_string("payment_heading", "local_failed_questions_recovery");
    } catch (Exception $e) {
        // Use fallback strings
        debugging("Error loading language strings: " . $e->getMessage(), DEBUG_DEVELOPER);
    }
    
    $PAGE->set_title($title);
    $PAGE->set_heading($heading);
    
    // Output page
    echo $OUTPUT->header();
    
    // Check if user has already paid
    $has_paid = false;
    try {
        $has_paid = \\local_failed_questions_recovery\\payment_manager::has_user_paid($USER->id);
    } catch (Exception $e) {
        debugging("Error checking payment status: " . $e->getMessage(), DEBUG_DEVELOPER);
    }
    
    if ($has_paid) {
        echo "<div class=\"alert alert-success\">Ya has realizado el pago. Puedes acceder a todas las funcionalidades.</div>";
        echo "<div class=\"text-center mt-4\"><a href=\"index.php\" class=\"btn btn-primary\">Volver al Panel</a></div>";
    } else {
        // Simple payment interface without complex JavaScript
        echo "<div class=\"container\">";
        echo "<div class=\"row justify-content-center\">";
        echo "<div class=\"col-md-8\">";
        
        echo "<div class=\"card\">";
        echo "<div class=\"card-header bg-primary text-white\">";
        echo "<h3 class=\"mb-0\">Acceso a Recuperación de Preguntas Falladas</h3>";
        echo "</div>";
        echo "<div class=\"card-body\">";
        
        echo "<div class=\"mb-4\">";
        echo "<h4>Detalles del Pago</h4>";
        echo "<p>Acceso completo a la herramienta de Recuperación de Preguntas Falladas.</p>";
        echo "<ul class=\"list-group mb-3\">";
        echo "<li class=\"list-group-item d-flex justify-content-between align-items-center\">";
        echo "Precio";
        echo "<span class=\"badge bg-primary rounded-pill\">6,00 €</span>";
        echo "</li>";
        echo "</ul>";
        echo "</div>";
        
        echo "<div class=\"alert alert-info\">";
        echo "<p>Para realizar el pago, haz clic en el botón de abajo. Serás redirigido a PayPal donde podrás pagar con tu cuenta o como invitado con tarjeta.</p>";
        echo "</div>";
        
        // Simple PayPal button
        echo "<div class=\"text-center\">";
        echo "<a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=contacto@opomelilla.com&item_name=Acceso+Recuperacion+Preguntas&amount=6.00&currency_code=EUR&return=" . urlencode($CFG->wwwroot . "/local/failed_questions_recovery/payment_success.php") . "&cancel_return=" . urlencode($CFG->wwwroot . "/local/failed_questions_recovery/payment.php") . "&custom=" . $USER->id . "\" class=\"btn btn-primary btn-lg\">";
        echo "<i class=\"fa fa-paypal\"></i> Pagar con PayPal";
        echo "</a>";
        echo "</div>";
        
        echo "</div>"; // End card-body
        echo "</div>"; // End card
        echo "</div>"; // End col
        echo "</div>"; // End row
        echo "</div>"; // End container
    }
    
    echo $OUTPUT->footer();
    
} catch (Exception $e) {
    // Log error and show user-friendly message
    error_log("Payment page error: " . $e->getMessage() . " in " . $e->getFile() . " line " . $e->getLine());
    
    echo "<h2>Error en la página de pago</h2>";
    echo "<div class=\"alert alert-danger\">";
    echo "Ha ocurrido un error. Por favor, contacta con el administrador.";
    echo "</div>";
    
    if (isset($CFG) && $CFG->debug >= DEBUG_DEVELOPER) {
        echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
    }
} catch (Error $e) {
    error_log("Payment page fatal error: " . $e->getMessage() . " in " . $e->getFile() . " line " . $e->getLine());
    echo "<h2>Error del sistema</h2>";
    echo "<div class=\"alert alert-danger\">Error del sistema. Contacta con el administrador.</div>";
}
?>';

$corrected_file = $CFG->dirroot . '/local/failed_questions_recovery/payment_corrected.php';
if (file_put_contents($corrected_file, $corrected_payment_content)) {
    echo "   ✓ Archivo payment_corrected.php creado exitosamente\n";
    echo "   Puedes probarlo en: {$CFG->wwwroot}/local/failed_questions_recovery/payment_corrected.php\n";
} else {
    echo "   ✗ Error creando payment_corrected.php\n";
}

// 5. Limpiar caché
echo "\n5. Limpiando caché...\n";
try {
    purge_all_caches();
    echo "   ✓ Caché limpiado exitosamente\n";
} catch (Exception $e) {
    echo "   ⚠ Error limpiando caché: " . $e->getMessage() . "\n";
}

echo "\n=== CORRECCIONES COMPLETADAS ===\n";
echo "\nPróximos pasos:\n";
echo "1. Prueba payment_corrected.php para ver si funciona\n";
echo "2. Si funciona, reemplaza payment.php con payment_corrected.php\n";
echo "3. Verifica los logs del servidor web para más detalles\n";
echo "4. Asegúrate de que el plugin esté correctamente instalado\n";

echo "</pre>";
?>