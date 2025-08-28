<?php
// Script simple para probar las cadenas de idioma

try {
    require_once('config.php');
    
    echo "<h2>Test de Cadenas de Idioma - Failed Questions Recovery</h2>";
    echo "<style>";
    echo "body { font-family: Arial, sans-serif; margin: 20px; }";
    echo "table { border-collapse: collapse; width: 100%; margin: 20px 0; }";
    echo "th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }";
    echo "th { background-color: #f2f2f2; }";
    echo ".success { color: green; font-weight: bold; }";
    echo ".error { color: red; font-weight: bold; }";
    echo "</style>";
    
    echo "<table>";
    echo "<tr><th>Clave</th><th>Valor</th><th>Estado</th></tr>";
    
    $test_strings = [
        'payment_success_title' => 'Título de Éxito de Pago',
        'payment_success_heading' => 'Encabezado de Éxito de Pago',
        'payment_details' => 'Detalles del Pago',
        'transaction_id' => 'ID de Transacción',
        'amount' => 'Cantidad',
        'status' => 'Estado',
        'date' => 'Fecha',
        'completed' => 'Completado',
        'payment_success_message' => 'Mensaje de Éxito',
        'access_tools' => 'Acceder a Herramientas',
        'go_to_dashboard' => 'Ir al Panel',
        'payment_error_title' => 'Título de Error de Pago',
        'payment_error_heading' => 'Encabezado de Error de Pago',
        'try_again' => 'Intentar de Nuevo',
        'contact_support' => 'Contactar Soporte'
    ];
    
    foreach ($test_strings as $key => $description) {
        try {
            $value = get_string($key, 'local_failed_questions_recovery');
            $is_translated = strpos($value, '[[') === false;
            
            echo "<tr>";
            echo "<td><code>{$key}</code></td>";
            echo "<td>{$value}</td>";
            echo "<td class='" . ($is_translated ? 'success' : 'error') . "'>" . ($is_translated ? '✓ Traducido' : '✗ Sin traducir') . "</td>";
            echo "</tr>";
        } catch (Exception $e) {
            echo "<tr>";
            echo "<td><code>{$key}</code></td>";
            echo "<td>Error: " . $e->getMessage() . "</td>";
            echo "<td class='error'>✗ Error</td>";
            echo "</tr>";
        }
    }
    
    echo "</table>";
    
    // Información adicional
    echo "<h3>Información del Plugin</h3>";
    $plugin = new stdClass();
    require($CFG->dirroot . '/local/failed_questions_recovery/version.php');
    echo "<p><strong>Versión:</strong> {$plugin->version}</p>";
    echo "<p><strong>Release:</strong> {$plugin->release}</p>";
    
    $installed_version = get_config('local_failed_questions_recovery', 'version');
    echo "<p><strong>Versión instalada:</strong> {$installed_version}</p>";
    
    // Verificar archivos de idioma
    echo "<h3>Archivos de Idioma</h3>";
    $lang_files = [
        'Español' => $CFG->dirroot . '/local/failed_questions_recovery/lang/es/local_failed_questions_recovery.php',
        'Inglés' => $CFG->dirroot . '/local/failed_questions_recovery/lang/en/local_failed_questions_recovery.php'
    ];
    
    foreach ($lang_files as $lang => $file) {
        if (file_exists($file)) {
            echo "<p><strong>{$lang}:</strong> ✓ Existe ({$file})</p>";
        } else {
            echo "<p><strong>{$lang}:</strong> ✗ No existe ({$file})</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<h2>Error</h2>";
    echo "<p style='color: red;'>" . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>