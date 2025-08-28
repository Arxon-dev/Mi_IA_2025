<?php
/**
 * Script to update plugin and clear caches for capitalization fixes
 */

require_once('config.php');
require_once($CFG->libdir.'/adminlib.php');

// Ensure we're running as admin
require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h2>Actualización de capitalización - Plugin Failed Questions Recovery</h2>";

echo "<h3>Estado actual:</h3>";

// Check current plugin version
$plugin = new stdClass();
require($CFG->dirroot . '/local/failed_questions_recovery/version.php');
echo "<p><strong>Nueva versión del plugin:</strong> {$plugin->version} ({$plugin->release})</p>";

// Get current installed version
$currentversion = get_config('local_failed_questions_recovery', 'version');
echo "<p><strong>Versión instalada:</strong> " . ($currentversion ? $currentversion : 'No instalada') . "</p>";

echo "<h3>Limpiando cachés...</h3>";

// Clear language string cache
try {
    $cache = cache::make('core', 'string');
    $cache->purge();
    echo "<p>✓ Caché de strings limpiada</p>";
} catch (Exception $e) {
    echo "<p>✗ Error limpiando caché de strings: " . $e->getMessage() . "</p>";
}

// Clear string manager cache
try {
    if (function_exists('get_string_manager')) {
        get_string_manager()->reset_caches();
        echo "<p>✓ Caché del gestor de strings reiniciada</p>";
    }
} catch (Exception $e) {
    echo "<p>✗ Error reiniciando gestor de strings: " . $e->getMessage() . "</p>";
}

// Clear plugin cache
try {
    $cache = cache::make('core', 'plugin_manager');
    $cache->purge();
    echo "<p>✓ Caché de plugins limpiada</p>";
} catch (Exception $e) {
    echo "<p>✗ Error limpiando caché de plugins: " . $e->getMessage() . "</p>";
}

// Clear config cache
try {
    $cache = cache::make('core', 'config');
    $cache->purge();
    echo "<p>✓ Caché de configuración limpiada</p>";
} catch (Exception $e) {
    echo "<p>✗ Error limpiando caché de configuración: " . $e->getMessage() . "</p>";
}

echo "<h3>Verificando strings corregidas:</h3>";

// Test some corrected strings
$test_strings = [
    'last_failed' => 'Último fallo',
    'recovery_progress' => 'Progreso de recuperación',
    'in_progress' => 'En progreso',
    'not_mastered' => 'No dominada',
    'completion_date' => 'Fecha de completado',
    'payment_title' => 'Pago de acceso',
    'payment_error_title' => 'Error en el pago'
];

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Clave</th><th>Valor esperado</th><th>Valor actual</th><th>Estado</th></tr>";

foreach ($test_strings as $key => $expected) {
    try {
        $actual = get_string($key, 'local_failed_questions_recovery');
        $status = ($actual === $expected) ? '✓ Correcto' : '✗ Incorrecto';
        $color = ($actual === $expected) ? 'green' : 'red';
        
        echo "<tr>";
        echo "<td>{$key}</td>";
        echo "<td>{$expected}</td>";
        echo "<td>{$actual}</td>";
        echo "<td style='color: {$color};'>{$status}</td>";
        echo "</tr>";
    } catch (Exception $e) {
        echo "<tr>";
        echo "<td>{$key}</td>";
        echo "<td>{$expected}</td>";
        echo "<td>Error: {$e->getMessage()}</td>";
        echo "<td style='color: red;'>✗ Error</td>";
        echo "</tr>";
    }
}

echo "</table>";

echo "<h3>Información del plugin:</h3>";
echo "<p><strong>Componente:</strong> {$plugin->component}</p>";
echo "<p><strong>Versión:</strong> {$plugin->version}</p>";
echo "<p><strong>Release:</strong> {$plugin->release}</p>";
echo "<p><strong>Requiere Moodle:</strong> {$plugin->requires}</p>";
echo "<p><strong>Madurez:</strong> " . (($plugin->maturity == MATURITY_STABLE) ? 'Estable' : 'Otro') . "</p>";

echo "<h3>Archivos de idioma:</h3>";

// Check language files
$es_file = $CFG->dirroot . '/local/failed_questions_recovery/lang/es/local_failed_questions_recovery.php';
$en_file = $CFG->dirroot . '/local/failed_questions_recovery/lang/en/local_failed_questions_recovery.php';

echo "<p><strong>Archivo español:</strong> " . (file_exists($es_file) ? '✓ Existe' : '✗ No existe') . "</p>";
echo "<p><strong>Archivo inglés:</strong> " . (file_exists($en_file) ? '✓ Existe' : '✗ No existe') . "</p>";

if (file_exists($es_file)) {
    echo "<p><strong>Tamaño archivo español:</strong> " . filesize($es_file) . " bytes</p>";
    echo "<p><strong>Última modificación español:</strong> " . date('Y-m-d H:i:s', filemtime($es_file)) . "</p>";
}

echo "<h3>Próximos pasos:</h3>";
echo "<ol>";
echo "<li>Accede al panel de administración de Moodle: <a href='{$CFG->wwwroot}/admin/index.php' target='_blank'>{$CFG->wwwroot}/admin/index.php</a></li>";
echo "<li>Ejecuta cualquier actualización pendiente del plugin</li>";
echo "<li>Verifica que las cadenas de idioma se muestren con la capitalización correcta</li>";
echo "<li>Prueba la página de proceso de pago para confirmar los cambios</li>";
echo "</ol>";

echo "<h3>Alternativa manual:</h3>";
echo "<p>Si los cambios no se reflejan automáticamente, puedes:</p>";
echo "<ol>";
echo "<li>Reiniciar el servidor web</li>";
echo "<li>O acceder a Administración del sitio > Desarrollo > Purgar todas las cachés</li>";
echo "</ol>";

echo "<p><em>Script ejecutado el: " . date('Y-m-d H:i:s') . "</em></p>";
?>