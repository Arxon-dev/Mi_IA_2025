<?php
// Diagnóstico específico para error HTTP 500 en payment.php
// Este archivo identifica exactamente dónde falla payment.php

// Habilitar reporte de errores completo
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Configurar tipo de contenido
header('Content-Type: text/html; charset=utf-8');

echo "<h2>Diagnóstico HTTP 500 - payment.php</h2>";
echo "<div style='font-family: monospace; background: #f5f5f5; padding: 20px;'>";

function test_step($step, $description) {
    echo "<div style='margin: 10px 0; padding: 10px; border-left: 3px solid #007cba;'>";
    echo "<strong>Paso {$step}:</strong> {$description}<br>";
    return true;
}

function success($message) {
    echo "<span style='color: green;'>✓ {$message}</span><br>";
}

function warning($message) {
    echo "<span style='color: orange;'>⚠ {$message}</span><br>";
}

function error($message) {
    echo "<span style='color: red;'>✗ {$message}</span><br>";
}

try {
    test_step(1, "Cargando configuración de Moodle");
    require_once('../../config.php');
    success("Config.php cargado correctamente");
    echo "</div>";
    
    test_step(2, "Verificando autenticación");
    if (!isloggedin()) {
        warning("Usuario no autenticado - esto causaría redirección");
        echo "<p style='background: #fff3cd; padding: 10px; border: 1px solid #ffeaa7;'>
              <strong>POSIBLE CAUSA DEL ERROR 500:</strong><br>
              El usuario no está autenticado y require_login() puede estar causando problemas.
              </p>";
    } else {
        success("Usuario autenticado (ID: {$USER->id})");
    }
    echo "</div>";
    
    test_step(3, "Verificando lib.php del plugin");
    $lib_path = $CFG->dirroot . '/local/failed_questions_recovery/lib.php';
    if (file_exists($lib_path)) {
        require_once($lib_path);
        success("lib.php encontrado y cargado");
    } else {
        error("lib.php NO encontrado en: {$lib_path}");
        throw new Exception("Archivo lib.php faltante");
    }
    echo "</div>";
    
    test_step(4, "Verificando contexto y permisos");
    $context = context_system::instance();
    success("Contexto del sistema obtenido");
    
    // Verificar si la capacidad existe
    $capabilities = get_all_capabilities();
    if (isset($capabilities['local/failed_questions_recovery:use'])) {
        success("Capacidad 'local/failed_questions_recovery:use' existe");
        
        if (has_capability('local/failed_questions_recovery:use', $context)) {
            success("Usuario tiene la capacidad requerida");
        } else {
            warning("Usuario NO tiene la capacidad requerida");
            echo "<p style='background: #fff3cd; padding: 10px; border: 1px solid #ffeaa7;'>
                  <strong>POSIBLE CAUSA DEL ERROR 500:</strong><br>
                  require_capability() falla cuando el usuario no tiene permisos.
                  </p>";
        }
    } else {
        error("Capacidad 'local/failed_questions_recovery:use' NO existe");
        echo "<p style='background: #f8d7da; padding: 10px; border: 1px solid #f5c6cb;'>
              <strong>CAUSA PROBABLE DEL ERROR 500:</strong><br>
              La capacidad no está definida en access.php del plugin.
              </p>";
    }
    echo "</div>";
    
    test_step(5, "Verificando clase payment_manager");
    if (class_exists('\\local_failed_questions_recovery\\payment_manager')) {
        success("Clase payment_manager existe");
        
        // Verificar método initialize_payment
        if (method_exists('\\local_failed_questions_recovery\\payment_manager', 'initialize_payment')) {
            success("Método initialize_payment existe");
            
            try {
                $payment_id = \local_failed_questions_recovery\payment_manager::initialize_payment($USER->id);
                success("initialize_payment ejecutado correctamente (ID: {$payment_id})");
            } catch (Exception $e) {
                error("Error en initialize_payment: " . $e->getMessage());
                echo "<p style='background: #f8d7da; padding: 10px; border: 1px solid #f5c6cb;'>
                      <strong>CAUSA PROBABLE DEL ERROR 500:</strong><br>
                      Error en payment_manager::initialize_payment() - {$e->getMessage()}
                      </p>";
            }
        } else {
            error("Método initialize_payment NO existe");
        }
    } else {
        error("Clase payment_manager NO existe");
        echo "<p style='background: #f8d7da; padding: 10px; border: 1px solid #f5c6cb;'>
              <strong>CAUSA PROBABLE DEL ERROR 500:</strong><br>
              La clase payment_manager no está definida o no se puede cargar.
              </p>";
    }
    echo "</div>";
    
    test_step(6, "Verificando tabla de base de datos");
    if ($DB->get_manager()->table_exists('local_fqr_user_payments')) {
        success("Tabla local_fqr_user_payments existe");
        
        try {
            $count = $DB->count_records('local_fqr_user_payments');
            success("Tabla accesible - {$count} registros encontrados");
        } catch (Exception $e) {
            error("Error accediendo a la tabla: " . $e->getMessage());
        }
    } else {
        error("Tabla local_fqr_user_payments NO existe");
        echo "<p style='background: #f8d7da; padding: 10px; border: 1px solid #f5c6cb;'>
              <strong>CAUSA PROBABLE DEL ERROR 500:</strong><br>
              La tabla de pagos no existe en la base de datos.
              </p>";
    }
    echo "</div>";
    
    test_step(7, "Verificando configuración de PayPal");
    $paypal_client_id = get_config('local_failed_questions_recovery', 'paypal_client_id');
    if (empty($paypal_client_id)) {
        warning("PayPal Client ID no configurado en plugin settings");
        
        // Verificar archivo .env
        if (file_exists($CFG->dirroot . '/.env')) {
            $env_content = file_get_contents($CFG->dirroot . '/.env');
            if (preg_match('/PAYPAL_CLIENT_ID=(.+)/', $env_content, $matches)) {
                $paypal_client_id = trim($matches[1]);
                success("PayPal Client ID encontrado en .env");
            } else {
                warning("PayPal Client ID no encontrado en .env");
            }
        } else {
            warning("Archivo .env no existe");
        }
    } else {
        success("PayPal Client ID configurado en plugin settings");
    }
    
    if (empty($paypal_client_id)) {
        warning("Usando PayPal Client ID hardcoded");
    }
    echo "</div>";
    
    test_step(8, "Verificando strings de idioma");
    try {
        $title = get_string('payment_title', 'local_failed_questions_recovery');
        success("payment_title: {$title}");
        
        $heading = get_string('payment_heading', 'local_failed_questions_recovery');
        success("payment_heading: {$heading}");
    } catch (Exception $e) {
        error("Error con strings de idioma: " . $e->getMessage());
        echo "<p style='background: #f8d7da; padding: 10px; border: 1px solid #f5c6cb;'>
              <strong>CAUSA PROBABLE DEL ERROR 500:</strong><br>
              Strings de idioma faltantes o archivo lang/en/local_failed_questions_recovery.php corrupto.
              </p>";
    }
    echo "</div>";
    
    test_step(9, "Verificando configuración de página");
    try {
        $PAGE->set_context($context);
        $PAGE->set_url(new moodle_url('/local/failed_questions_recovery/payment.php'));
        success("Contexto y URL de página configurados");
        
        $PAGE->set_title('Test Title');
        $PAGE->set_heading('Test Heading');
        success("Título y encabezado configurados");
    } catch (Exception $e) {
        error("Error configurando página: " . $e->getMessage());
        echo "<p style='background: #f8d7da; padding: 10px; border: 1px solid #f5c6cb;'>
              <strong>CAUSA PROBABLE DEL ERROR 500:</strong><br>
              Error en configuración de $PAGE - {$e->getMessage()}
              </p>";
    }
    echo "</div>";
    
    test_step(10, "Verificando JavaScript AMD");
    try {
        // Simular el código JavaScript que se añade en payment.php
        $js_code = "console.log('Test JavaScript');"; 
        $PAGE->requires->js_amd_inline($js_code);
        success("JavaScript AMD inline funciona");
    } catch (Exception $e) {
        error("Error con JavaScript AMD: " . $e->getMessage());
        echo "<p style='background: #f8d7da; padding: 10px; border: 1px solid #f5c6cb;'>
              <strong>CAUSA PROBABLE DEL ERROR 500:</strong><br>
              Error en $PAGE->requires->js_amd_inline() - {$e->getMessage()}
              </p>";
    }
    echo "</div>";
    
    echo "<div style='margin: 20px 0; padding: 15px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px;'>";
    echo "<h3 style='color: #155724; margin: 0 0 10px 0;'>✓ DIAGNÓSTICO COMPLETADO</h3>";
    echo "<p style='margin: 0; color: #155724;'>Si todos los pasos anteriores fueron exitosos, el problema del HTTP 500 podría estar en:</p>";
    echo "<ul style='color: #155724; margin: 10px 0;'>";
    echo "<li>El código JavaScript complejo en payment.php</li>";
    echo "<li>Conflictos con RequireJS/AMD</li>";
    echo "<li>Problemas de memoria o timeout del servidor</li>";
    echo "<li>Configuración del servidor web (Apache/Nginx)</li>";
    echo "</ul>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div style='margin: 20px 0; padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;'>";
    echo "<h3 style='color: #721c24; margin: 0 0 10px 0;'>✗ ERROR CRÍTICO ENCONTRADO</h3>";
    echo "<p style='margin: 0; color: #721c24;'><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p style='margin: 5px 0 0 0; color: #721c24;'><strong>Archivo:</strong> " . $e->getFile() . "</p>";
    echo "<p style='margin: 5px 0 0 0; color: #721c24;'><strong>Línea:</strong> " . $e->getLine() . "</p>";
    echo "<details style='margin: 10px 0 0 0;'><summary style='color: #721c24; cursor: pointer;'>Ver stack trace completo</summary>";
    echo "<pre style='background: #fff; padding: 10px; margin: 10px 0; border: 1px solid #ddd; overflow: auto;'>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
    echo "</details>";
    echo "</div>";
} catch (Error $e) {
    echo "<div style='margin: 20px 0; padding: 15px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;'>";
    echo "<h3 style='color: #721c24; margin: 0 0 10px 0;'>✗ ERROR FATAL ENCONTRADO</h3>";
    echo "<p style='margin: 0; color: #721c24;'><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p style='margin: 5px 0 0 0; color: #721c24;'><strong>Archivo:</strong> " . $e->getFile() . "</p>";
    echo "<p style='margin: 5px 0 0 0; color: #721c24;'><strong>Línea:</strong> " . $e->getLine() . "</p>";
    echo "</div>";
}

echo "</div>";
echo "<hr>";
echo "<p><strong>Próximos pasos:</strong></p>";
echo "<ol>";
echo "<li>Si encontraste un error específico arriba, corrígelo primero</li>";
echo "<li>Si no hay errores, el problema está en el JavaScript complejo de payment.php</li>";
echo "<li>Prueba acceder a: <a href='payment_simple.php'>payment_simple.php</a> como alternativa</li>";
echo "<li>Revisa los logs del servidor web para más detalles</li>";
echo "</ol>";
?>