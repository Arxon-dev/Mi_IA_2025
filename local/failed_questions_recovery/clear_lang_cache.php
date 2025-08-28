<?php
require_once('../../config.php');

// Verificar autenticación
require_login();

// Solo permitir a administradores 
require_capability('moodle/site:config', context_system::instance());

echo "<h2>Limpieza de Cache de Idioma</h2>";

try {
    // Limpiar cache de idioma específicamente
    $cache = cache::make('core', 'string');
    $cache->purge();
    
    // Limpiar cache de configuración de idioma
    $cache = cache::make('core', 'config');  
    $cache->purge();
    
    // Limpiar cache de configuración del plugin
    $cache = cache::make('core', 'langmenu');
    $cache->purge();
    
    // Forzar recarga de strings de idioma
    get_string_manager()->reset_caches();
    
    echo "<div class='alert alert-success'>";
    echo "<h4>✅ Cache de idioma limpiado exitosamente</h4>";
    echo "<p>Los strings de idioma han sido recargados desde los archivos.</p>";
    echo "<p><strong>Nota:</strong> Puede que necesites recargar la página principal para ver los cambios.</p>";
    echo "</div>";
    
    echo "<div class='alert alert-info'>";
    echo "<h4>🔄 Próximos pasos:</h4>";
    echo "<ol>";
    echo "<li>Vuelve a: <a href='index.php'>Plugin Principal</a></li>";
    echo "<li>Verifica que '[[recoveryboard]]' ahora muestre 'Panel de Recuperación'</li>";
    echo "<li>Si aún no funciona, espera 5-10 minutos más</li>";
    echo "</ol>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='alert alert-danger'>";
    echo "<h4>❌ Error al limpiar cache:</h4>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?> 