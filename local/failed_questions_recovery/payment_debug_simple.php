<?php
// Simple debug script for payment.php error
// This file helps identify the specific line causing HTTP 500 error

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Set content type
header('Content-Type: text/html; charset=utf-8');

echo "<h2>Diagnóstico Simple de Payment.php</h2>";
echo "<pre>";

try {
    echo "1. Intentando cargar config.php...\n";
    require_once('../../config.php');
    echo "   ✓ Config.php cargado exitosamente\n\n";
    
    echo "2. Verificando si el usuario está logueado...\n";
    if (!isloggedin()) {
        echo "   ⚠ Usuario no está logueado, redirigiendo...\n";
        require_login();
    } else {
        echo "   ✓ Usuario logueado (ID: {$USER->id})\n\n";
    }
    
    echo "3. Verificando contexto y permisos...\n";
    $context = context_system::instance();
    echo "   ✓ Contexto del sistema obtenido\n";
    
    if (!has_capability('local/failed_questions_recovery:use', $context)) {
        echo "   ⚠ Usuario no tiene permisos necesarios\n";
    } else {
        echo "   ✓ Usuario tiene permisos necesarios\n\n";
    }
    
    echo "4. Intentando cargar lib.php...\n";
    require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');
    echo "   ✓ lib.php cargado exitosamente\n\n";
    
    echo "5. Verificando configuración de PayPal...\n";
    $paypal_client_id = get_config('local_failed_questions_recovery', 'paypal_client_id');
    if (empty($paypal_client_id)) {
        echo "   - PayPal Client ID no encontrado en config, verificando .env...\n";
        if (file_exists($CFG->dirroot . '/.env')) {
            $env = parse_ini_file($CFG->dirroot . '/.env');
            if (isset($env['PAYPAL_CLIENT_ID'])) {
                $paypal_client_id = $env['PAYPAL_CLIENT_ID'];
                echo "   ✓ PayPal Client ID encontrado en .env\n";
            } else {
                echo "   - PayPal Client ID no encontrado en .env\n";
            }
        } else {
            echo "   - Archivo .env no existe\n";
        }
    } else {
        echo "   ✓ PayPal Client ID encontrado en config\n";
    }
    
    if (empty($paypal_client_id)) {
        $paypal_client_id = 'AZPrc9A4Po6XVXSc4aqcNVW8RlqUSrWavZqI1BLE-4kQTQ-JwWUqNCetceVLE7JarlJQ-WP1JwD_Kc5x';
        echo "   ✓ Usando PayPal Client ID hardcoded\n\n";
    }
    
    echo "6. Verificando clase payment_manager...\n";
    if (class_exists('\\local_failed_questions_recovery\\payment_manager')) {
        echo "   ✓ Clase payment_manager existe\n";
        
        echo "7. Intentando inicializar pago...\n";
        $payment_id = \local_failed_questions_recovery\\payment_manager::initialize_payment($USER->id);
        echo "   ✓ Pago inicializado (ID: {$payment_id})\n\n";
        
        echo "8. Verificando si el usuario ya ha pagado...\n";
        $has_paid = \local_failed_questions_recovery\\payment_manager::has_user_paid($USER->id);
        echo "   - Usuario ha pagado: " . ($has_paid ? 'Sí' : 'No') . "\n\n";
        
    } else {
        echo "   ✗ Clase payment_manager NO existe\n";
        throw new Exception('Clase payment_manager no encontrada');
    }
    
    echo "9. Configurando página...\n";
    $PAGE->set_context($context);
    $PAGE->set_url(new moodle_url('/local/failed_questions_recovery/payment.php'));
    echo "   ✓ Contexto y URL configurados\n";
    
    // Test language strings
    echo "10. Verificando strings de idioma...\n";
    try {
        $title = get_string('payment_title', 'local_failed_questions_recovery');
        echo "   ✓ payment_title: {$title}\n";
        
        $heading = get_string('payment_heading', 'local_failed_questions_recovery');
        echo "   ✓ payment_heading: {$heading}\n";
        
        $PAGE->set_title($title);
        $PAGE->set_heading($heading);
        echo "   ✓ Título y encabezado configurados\n\n";
        
    } catch (Exception $e) {
        echo "   ⚠ Error con strings de idioma: " . $e->getMessage() . "\n\n";
    }
    
    echo "11. Verificando tabla de pagos...\n";
    if ($DB->get_manager()->table_exists('local_fqr_user_payments')) {
        echo "   ✓ Tabla local_fqr_user_payments existe\n";
        
        $payment_record = $DB->get_record('local_fqr_user_payments', ['userid' => $USER->id]);
        if ($payment_record) {
            echo "   ✓ Registro de pago encontrado para el usuario\n";
            echo "     Estado: {$payment_record->payment_status}\n";
            echo "     Cantidad: {$payment_record->payment_amount} {$payment_record->payment_currency}\n";
        } else {
            echo "   - No hay registro de pago para el usuario\n";
        }
    } else {
        echo "   ✗ Tabla local_fqr_user_payments NO existe\n";
        throw new Exception('Tabla de pagos no existe');
    }
    
    echo "\n=== DIAGNÓSTICO COMPLETADO EXITOSAMENTE ===\n";
    echo "Si llegaste hasta aquí, el problema no está en la lógica básica de payment.php\n";
    echo "El error HTTP 500 podría estar en:\n";
    echo "- JavaScript/AMD inline code\n";
    echo "- Renderizado de la página\n";
    echo "- Configuración del servidor\n";
    echo "- Permisos de archivos\n\n";
    
    echo "Intenta acceder directamente a: payment.php?debug=1\n";
    
} catch (Exception $e) {
    echo "\n✗ ERROR ENCONTRADO: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString();
} catch (Error $e) {
    echo "\n✗ FATAL ERROR: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
}

echo "</pre>";
?>