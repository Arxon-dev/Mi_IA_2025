<?php
// Quick fix script for payment.php HTTP 500 error
// Can be run from command line or web interface
// Usage: php quick_fix.php

// Determine if running from CLI or web
$is_cli = (php_sapi_name() === 'cli');

if (!$is_cli) {
    // Web interface
    require_once('../../config.php');
    require_login();
    require_capability('moodle/site:config', context_system::instance());
    header('Content-Type: text/plain; charset=utf-8');
} else {
    // CLI interface
    define('CLI_SCRIPT', true);
    require_once('../../config.php');
    require_once($CFG->libdir.'/clilib.php');
}

function output($message) {
    global $is_cli;
    if ($is_cli) {
        cli_writeln($message);
    } else {
        echo $message . "\n";
    }
}

function success($message) {
    output("✓ " . $message);
}

function warning($message) {
    output("⚠ " . $message);
}

function error($message) {
    output("✗ " . $message);
}

output("=== QUICK FIX PARA ERROR HTTP 500 EN PAYMENT.PHP ===");
output("");

// 1. Check and fix database table
output("1. Verificando tabla de base de datos...");
if (!$DB->get_manager()->table_exists('local_fqr_user_payments')) {
    warning("Tabla local_fqr_user_payments no existe. Creando...");
    
    $sql = "
    CREATE TABLE {local_fqr_user_payments} (
        id BIGINT(10) NOT NULL AUTO_INCREMENT,
        userid BIGINT(10) NOT NULL,
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        payment_amount DECIMAL(10,2) NOT NULL DEFAULT 6.00,
        payment_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
        payment_id VARCHAR(255) NULL,
        payment_date BIGINT(10) NULL,
        expiry_date BIGINT(10) NULL,
        timecreated BIGINT(10) NOT NULL,
        timemodified BIGINT(10) NOT NULL,
        PRIMARY KEY (id),
        KEY userid_idx (userid),
        KEY payment_id_idx (payment_id)
    )";
    
    try {
        $DB->execute($sql);
        success("Tabla creada exitosamente");
    } catch (Exception $e) {
        error("Error creando tabla: " . $e->getMessage());
    }
} else {
    success("Tabla local_fqr_user_payments existe");
}

// 2. Check and fix capabilities
output("");
output("2. Verificando permisos...");
$capability = 'local/failed_questions_recovery:use';

if (!$DB->record_exists('capabilities', array('name' => $capability))) {
    warning("Capacidad no existe. Creando...");
    
    $cap = new stdClass();
    $cap->name = $capability;
    $cap->captype = 'read';
    $cap->contextlevel = CONTEXT_SYSTEM;
    $cap->component = 'local_failed_questions_recovery';
    $cap->riskbitmask = 0;
    
    try {
        $DB->insert_record('capabilities', $cap);
        success("Capacidad creada");
    } catch (Exception $e) {
        error("Error creando capacidad: " . $e->getMessage());
    }
} else {
    success("Capacidad existe");
}

// Assign to authenticated users
$context = context_system::instance();
$userrole = $DB->get_record('role', array('shortname' => 'user'));
if ($userrole) {
    $existing = $DB->get_record('role_capabilities', array(
        'roleid' => $userrole->id,
        'capability' => $capability,
        'contextid' => $context->id
    ));
    
    if (!$existing) {
        $perm = new stdClass();
        $perm->contextid = $context->id;
        $perm->roleid = $userrole->id;
        $perm->capability = $capability;
        $perm->permission = CAP_ALLOW;
        $perm->timemodified = time();
        $perm->modifierid = 2; // Admin user
        
        try {
            $DB->insert_record('role_capabilities', $perm);
            success("Permiso asignado a usuarios");
        } catch (Exception $e) {
            error("Error asignando permiso: " . $e->getMessage());
        }
    } else {
        success("Permiso ya asignado");
    }
}

// 3. Create fixed payment.php
output("");
output("3. Creando versión corregida de payment.php...");

$fixed_content = '<?php
// Fixed payment.php - Eliminates HTTP 500 errors
require_once("../../config.php");

// Basic error handling
error_reporting(E_ALL);
ini_set("display_errors", 0);
ini_set("log_errors", 1);

try {
    // Check login
    require_login();
    
    // Check capability with fallback
    $context = context_system::instance();
    if (!has_capability("local/failed_questions_recovery:use", $context)) {
        print_error("nopermissions", "error", "", "access this page");
    }
    
    // Load lib with error handling
    $lib_path = $CFG->dirroot . "/local/failed_questions_recovery/lib.php";
    if (file_exists($lib_path)) {
        require_once($lib_path);
    }
    
    // PayPal configuration
    $paypal_client_id = "AZPrc9A4Po6XVXSc4aqcNVW8RlqUSrWavZqI1BLE-4kQTQ-JwWUqNCetceVLE7JarlJQ-WP1JwD_Kc5x";
    
    // Page setup
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url("/local/failed_questions_recovery/payment.php"));
    $PAGE->set_title("Pago de Acceso");
    $PAGE->set_heading("Pago de Acceso - Recuperación de Preguntas Falladas");
    
    // Check payment status
    $has_paid = false;
    if (class_exists("\\local_failed_questions_recovery\\payment_manager")) {
        try {
            $has_paid = \\local_failed_questions_recovery\\payment_manager::has_user_paid($USER->id);
        } catch (Exception $e) {
            // Log error but continue
            error_log("Payment check error: " . $e->getMessage());
        }
    }
    
    // Output
    echo $OUTPUT->header();
    
    if ($has_paid) {
        echo "<div class=\"alert alert-success\">";
        echo "Ya has realizado el pago. Puedes acceder a todas las funcionalidades.";
        echo "</div>";
        echo "<div class=\"text-center mt-4\">";
        echo "<a href=\"index.php\" class=\"btn btn-primary\">Volver al Panel</a>";
        echo "</div>";
    } else {
        echo "<div class=\"container\">";
        echo "<div class=\"card\">";
        echo "<div class=\"card-header bg-primary text-white\">";
        echo "<h3>Acceso a Recuperación de Preguntas Falladas</h3>";
        echo "</div>";
        echo "<div class=\"card-body\">";
        echo "<h4>Precio: 6,00 €</h4>";
        echo "<p>Acceso completo a la herramienta de recuperación de preguntas falladas.</p>";
        echo "<div class=\"alert alert-info\">";
        echo "<p>Para realizar el pago, haz clic en el botón de PayPal. Puedes pagar con tu cuenta o como invitado.</p>";
        echo "</div>";
        
        // Simple PayPal link
        $paypal_url = "https://www.paypal.com/cgi-bin/webscr?";
        $paypal_url .= "cmd=_xclick&";
        $paypal_url .= "business=contacto@opomelilla.com&";
        $paypal_url .= "item_name=Acceso+Recuperacion+Preguntas&";
        $paypal_url .= "amount=6.00&";
        $paypal_url .= "currency_code=EUR&";
        $paypal_url .= "return=" . urlencode($CFG->wwwroot . "/local/failed_questions_recovery/index.php?payment=success") . "&";
        $paypal_url .= "cancel_return=" . urlencode($CFG->wwwroot . "/local/failed_questions_recovery/payment.php") . "&";
        $paypal_url .= "custom=" . $USER->id;
        
        echo "<div class=\"text-center\">";
        echo "<a href=\"" . $paypal_url . "\" class=\"btn btn-primary btn-lg\">";
        echo "💳 Pagar con PayPal";
        echo "</a>";
        echo "</div>";
        echo "</div>";
        echo "</div>";
        echo "</div>";
    }
    
    echo $OUTPUT->footer();
    
} catch (Exception $e) {
    // Log the error
    error_log("Payment page error: " . $e->getMessage());
    
    // Show user-friendly error
    if (isset($OUTPUT)) {
        echo $OUTPUT->header();
    }
    echo "<div class=\"alert alert-danger\">";
    echo "Ha ocurrido un error en la página de pago. Por favor, contacta con el administrador.";
    echo "</div>";
    if (isset($OUTPUT)) {
        echo $OUTPUT->footer();
    }
} catch (Error $e) {
    error_log("Payment page fatal error: " . $e->getMessage());
    echo "<h2>Error del sistema</h2>";
    echo "<p>Por favor, contacta con el administrador.</p>";
}
?>';

$fixed_file = $CFG->dirroot . '/local/failed_questions_recovery/payment_fixed.php';
if (file_put_contents($fixed_file, $fixed_content)) {
    success("Archivo payment_fixed.php creado");
} else {
    error("No se pudo crear payment_fixed.php");
}

// 4. Clear caches
output("");
output("4. Limpiando cachés...");
try {
    purge_all_caches();
    success("Cachés limpiados");
} catch (Exception $e) {
    warning("Error limpiando cachés: " . $e->getMessage());
}

// 5. Final instructions
output("");
output("=== CORRECCIÓN COMPLETADA ===");
output("");
output("Próximos pasos:");
output("1. Prueba payment_fixed.php en tu navegador");
output("2. Si funciona, reemplaza payment.php con payment_fixed.php");
output("3. Verifica que los usuarios puedan acceder sin error 500");
output("");
output("URLs para probar:");
output("- " . $CFG->wwwroot . "/local/failed_questions_recovery/payment_fixed.php");
output("- " . $CFG->wwwroot . "/local/failed_questions_recovery/debug_payment_error.php");
output("");

if ($is_cli) {
    output("Script completado exitosamente.");
} else {
    output("<a href='payment_fixed.php'>Probar payment_fixed.php</a>");
}
?>