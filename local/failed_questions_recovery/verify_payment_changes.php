<?php
/**
 * Script to verify PayPal note addition and duplicate title fix
 * 
 * This script:
 * 1. Checks plugin version
 * 2. Clears caches
 * 3. Tests new language strings
 * 4. Shows payment page status
 */

require_once('../../config.php');
require_login();

echo '<h2>Verificación de Cambios en Página de Pago</h2>';

// 1. Check plugin version
echo '<h3>1. Versión del Plugin</h3>';
$plugin = new stdClass();
require('version.php');
echo '<p><strong>Versión actual:</strong> ' . $plugin->version . '</p>';
echo '<p><strong>Release:</strong> ' . $plugin->release . '</p>';

// 2. Clear caches
echo '<h3>2. Limpiando Cachés</h3>';
get_string_manager()->reset_caches();
purge_all_caches();
echo '<p style="color: green;">✓ Cachés limpiadas correctamente</p>';

// 3. Test new language strings
echo '<h3>3. Probando Nuevas Cadenas de Idioma</h3>';
try {
    $paypal_note_es = get_string('paypal_note', 'local_failed_questions_recovery');
    echo '<p><strong>Nota PayPal (ES):</strong> ' . $paypal_note_es . '</p>';
    
    $payment_heading = get_string('payment_heading', 'local_failed_questions_recovery');
    echo '<p><strong>Título de Pago:</strong> ' . $payment_heading . '</p>';
    
    $payment_desc = get_string('payment_required_desc', 'local_failed_questions_recovery');
    echo '<p><strong>Descripción de Pago:</strong> ' . $payment_desc . '</p>';
    
    echo '<p style="color: green;">✓ Todas las cadenas de idioma funcionan correctamente</p>';
} catch (Exception $e) {
    echo '<p style="color: red;">✗ Error al cargar cadenas: ' . $e->getMessage() . '</p>';
}

// 4. Show plugin info
echo '<h3>4. Información del Plugin</h3>';
echo '<p><strong>Componente:</strong> ' . $plugin->component . '</p>';
echo '<p><strong>Requiere Moodle:</strong> ' . $plugin->requires . '</p>';
echo '<p><strong>Madurez:</strong> ' . ($plugin->maturity == MATURITY_STABLE ? 'Estable' : 'En desarrollo') . '</p>';

// 5. Check language files
echo '<h3>5. Verificando Archivos de Idioma</h3>';
$lang_es_file = __DIR__ . '/lang/es/local_failed_questions_recovery.php';
$lang_en_file = __DIR__ . '/lang/en/local_failed_questions_recovery.php';

if (file_exists($lang_es_file)) {
    echo '<p style="color: green;">✓ Archivo de idioma español existe</p>';
    $content = file_get_contents($lang_es_file);
    if (strpos($content, 'paypal_note') !== false) {
        echo '<p style="color: green;">✓ Cadena paypal_note encontrada en español</p>';
    } else {
        echo '<p style="color: red;">✗ Cadena paypal_note NO encontrada en español</p>';
    }
} else {
    echo '<p style="color: red;">✗ Archivo de idioma español no existe</p>';
}

if (file_exists($lang_en_file)) {
    echo '<p style="color: green;">✓ Archivo de idioma inglés existe</p>';
    $content = file_get_contents($lang_en_file);
    if (strpos($content, 'paypal_note') !== false) {
        echo '<p style="color: green;">✓ Cadena paypal_note encontrada en inglés</p>';
    } else {
        echo '<p style="color: red;">✗ Cadena paypal_note NO encontrada en inglés</p>';
    }
} else {
    echo '<p style="color: red;">✗ Archivo de idioma inglés no existe</p>';
}

echo '<h3>6. Próximos Pasos</h3>';
echo '<div style="background: #f0f8ff; padding: 15px; border-left: 4px solid #007cba;">';
echo '<p><strong>Para completar la actualización:</strong></p>';
echo '<ol>';
echo '<li>Accede al panel de administración de Moodle</li>';
echo '<li>Ve a "Administración del sitio" > "Notificaciones"</li>';
echo '<li>Ejecuta la actualización del plugin Failed Questions Recovery</li>';
echo '<li>Limpia todas las cachés desde "Administración del sitio" > "Desarrollo" > "Purgar todas las cachés"</li>';
echo '<li>Verifica la página de pago en: <a href="payment.php" target="_blank">payment.php</a></li>';
echo '</ol>';
echo '<p><strong>Alternativa:</strong> Reinicia el servidor web para forzar la recarga de las cachés.</p>';
echo '</div>';

echo '<h3>7. Enlaces de Verificación</h3>';
echo '<p><a href="payment.php" target="_blank" class="btn btn-primary">Ver Página de Pago</a></p>';
echo '<p><a href="process_payment.php" target="_blank" class="btn btn-secondary">Ver Proceso de Pago</a></p>';

echo '<hr>';
echo '<p><em>Script ejecutado el: ' . date('Y-m-d H:i:s') . '</em></p>';
?>