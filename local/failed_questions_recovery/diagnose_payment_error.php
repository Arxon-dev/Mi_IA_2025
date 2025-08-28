<?php
// Script de diagnóstico para payment.php
// Este script verifica cada componente de payment.php paso a paso

// Configurar manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/payment_error.log');

// Función para registrar mensajes
function log_message($message) {
    echo "<p><strong>" . date('Y-m-d H:i:s') . ":</strong> " . htmlspecialchars($message) . "</p>";
    error_log(date('Y-m-d H:i:s') . ": " . $message);
}

echo "<html><head><title>Diagnóstico de payment.php</title></head><body>";
echo "<h1>Diagnóstico de payment.php</h1>";

try {
    log_message("Iniciando diagnóstico...");
    
    // Paso 1: Verificar config.php
    log_message("Paso 1: Verificando config.php");
    if (!file_exists('../../config.php')) {
        throw new Exception("config.php no encontrado");
    }
    require_once('../../config.php');
    log_message("✓ config.php cargado correctamente");
    
    // Paso 2: Verificar lib.php
    log_message("Paso 2: Verificando lib.php");
    $lib_path = $CFG->dirroot . '/local/failed_questions_recovery/lib.php';
    if (!file_exists($lib_path)) {
        throw new Exception("lib.php no encontrado en: " . $lib_path);
    }
    require_once($lib_path);
    log_message("✓ lib.php cargado correctamente");
    
    // Paso 3: Verificar configuración de PayPal
    log_message("Paso 3: Verificando configuración de PayPal");
    $paypal_client_id = get_config('local_failed_questions_recovery', 'paypal_client_id');
    log_message("PayPal Client ID desde config: " . ($paypal_client_id ? "[CONFIGURADO]" : "[NO CONFIGURADO]"));
    
    if (empty($paypal_client_id)) {
        // Verificar archivo .env
        if (file_exists($CFG->dirroot . '/.env')) {
            log_message("Archivo .env encontrado");
            $env = parse_ini_file($CFG->dirroot . '/.env');
            if (isset($env['PAYPAL_CLIENT_ID'])) {
                $paypal_client_id = $env['PAYPAL_CLIENT_ID'];
                log_message("PayPal Client ID desde .env: [CONFIGURADO]");
            } else {
                log_message("PAYPAL_CLIENT_ID no encontrado en .env");
            }
        } else {
            log_message("Archivo .env no encontrado");
        }
    }
    
    if (empty($paypal_client_id)) {
        $paypal_client_id = 'AZPrc9A4Po6XVXSc4aqcNVW8RlqUSrWavZqI1BLE-4kQTQ-JwWUqNCetceVLE7JarlJQ-WP1JwD_Kc5x';
        log_message("Usando PayPal Client ID hardcodeado");
    }
    
    // Paso 4: Verificar autenticación (sin require_login para evitar redirección)
    log_message("Paso 4: Verificando estado de autenticación");
    if (isset($USER) && $USER->id > 0) {
        log_message("✓ Usuario autenticado: ID " . $USER->id);
    } else {
        log_message("⚠ Usuario no autenticado - esto causará redirección en payment.php");
    }
    
    // Paso 5: Verificar contexto del sistema
    log_message("Paso 5: Verificando contexto del sistema");
    $context = context_system::instance();
    if ($context) {
        log_message("✓ Contexto del sistema obtenido correctamente");
    } else {
        throw new Exception("No se pudo obtener el contexto del sistema");
    }
    
    // Paso 6: Verificar clase payment_manager
    log_message("Paso 6: Verificando clase payment_manager");
    if (class_exists('\\local_failed_questions_recovery\\payment_manager')) {
        log_message("✓ Clase payment_manager encontrada");
        
        // Verificar métodos
        if (method_exists('\\local_failed_questions_recovery\\payment_manager', 'initialize_payment')) {
            log_message("✓ Método initialize_payment encontrado");
        } else {
            throw new Exception("Método initialize_payment no encontrado");
        }
        
        if (method_exists('\\local_failed_questions_recovery\\payment_manager', 'has_user_paid')) {
            log_message("✓ Método has_user_paid encontrado");
        } else {
            throw new Exception("Método has_user_paid no encontrado");
        }
    } else {
        throw new Exception("Clase payment_manager no encontrada");
    }
    
    // Paso 7: Verificar cadenas de idioma
    log_message("Paso 7: Verificando cadenas de idioma");
    try {
        $payment_title = get_string('payment_title', 'local_failed_questions_recovery');
        log_message("✓ payment_title: " . $payment_title);
    } catch (Exception $e) {
        log_message("✗ Error obteniendo payment_title: " . $e->getMessage());
    }
    
    try {
        $payment_heading = get_string('payment_heading', 'local_failed_questions_recovery');
        log_message("✓ payment_heading: " . $payment_heading);
    } catch (Exception $e) {
        log_message("✗ Error obteniendo payment_heading: " . $e->getMessage());
    }
    
    // Paso 8: Verificar base de datos
    log_message("Paso 8: Verificando conexión a base de datos");
    global $DB;
    if ($DB) {
        log_message("✓ Conexión a base de datos disponible");
        
        // Verificar tabla de pagos
        try {
            $table_exists = $DB->get_manager()->table_exists('local_fqr_payments');
            if ($table_exists) {
                log_message("✓ Tabla local_fqr_payments existe");
            } else {
                log_message("⚠ Tabla local_fqr_payments no existe");
            }
        } catch (Exception $e) {
            log_message("✗ Error verificando tabla: " . $e->getMessage());
        }
    } else {
        throw new Exception("Conexión a base de datos no disponible");
    }
    
    log_message("✓ Diagnóstico completado - No se encontraron errores críticos");
    
} catch (Exception $e) {
    log_message("✗ ERROR CRÍTICO: " . $e->getMessage());
    log_message("Stack trace: " . $e->getTraceAsString());
} catch (Error $e) {
    log_message("✗ ERROR FATAL: " . $e->getMessage());
    log_message("Stack trace: " . $e->getTraceAsString());
}

echo "<hr><p><strong>Diagnóstico completado. Revise los logs para más detalles.</strong></p>";
echo "</body></html>";
?>