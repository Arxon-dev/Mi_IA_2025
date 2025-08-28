<?php
/**
 * CORRECCIÓN FINAL CON RUTA CORRECTA V2 - Observer.php
 * Manejo robusto de rutas para Windows
 */

require_once('../../config.php');
require_login();

echo "<h2>🔧 Corrección Final V2 - Observer.php</h2>";

// RUTA CORRECTA CON MANEJO ROBUSTO
$base_dir = dirname(__FILE__);
$observer_file = $base_dir . DIRECTORY_SEPARATOR . 'local' . DIRECTORY_SEPARATOR . 'telegram_integration' . DIRECTORY_SEPARATOR . 'classes' . DIRECTORY_SEPARATOR . 'observer.php';

// Normalizar ruta
$observer_file = realpath($observer_file);

if (!$observer_file || !file_exists($observer_file)) {
    // Intentar ruta alternativa
    $observer_file = 'e:/OpoMelilla_2025/Trae_AI/Mi_IA_2025/local/telegram_integration/classes/observer.php';
    
    if (!file_exists($observer_file)) {
        echo "❌ Error: No se encuentra el archivo observer.php<br>";
        echo "Rutas intentadas:<br>";
        echo "- " . $base_dir . "/local/telegram_integration/classes/observer.php<br>";
        echo "- e:/OpoMelilla_2025/Trae_AI/Mi_IA_2025/local/telegram_integration/classes/observer.php<br>";
        die();
    }
}

echo "✅ Archivo encontrado: {$observer_file}<br>";

// 1. Crear backup
$backup_file = $observer_file . '.backup-v2-' . date('Y-m-d-H-i-s');
copy($observer_file, $backup_file);
echo "✅ Backup creado: " . basename($backup_file) . "<br>";

// 2. Leer contenido completo
$content = file_get_contents($observer_file);
if ($content === false) {
    die("❌ Error: No se pudo leer el archivo");
}

echo "📄 Archivo leído: " . strlen($content) . " caracteres<br>";

// 3. Aplicar correcciones específicas
$corrections_made = 0;
$original_content = $content;

// CORRECCIÓN 1: Eliminar comentario problemático
if (strpos($content, '// Reemplazar líneas 137-140') !== false) {
    $content = str_replace('// Reemplazar líneas 137-140', '', $content);
    $corrections_made++;
    echo "🔧 ✅ Eliminado comentario problemático<br>";
}

// CORRECCIÓN 2: Reemplazar conexiones PDO directas en update_user_total_points
$pdo_pattern1 = '/\$pdo = new \\PDO\(\s*"mysql:host=" \. \$CFG->dbhost \. ";dbname=" \. \$CFG->dbname,\s*\$CFG->dbuser,\s*\$CFG->dbpass\s*\);/';
if (preg_match($pdo_pattern1, $content)) {
    $replacement1 = "// ✅ USAR CONFIGURACIÓN CENTRALIZADA\n            require_once(__DIR__ . '/../config/database.php');\n            \$pdo = get_telegram_db_connection();";
    $content = preg_replace($pdo_pattern1, $replacement1, $content);
    $corrections_made++;
    echo "🔧 ✅ Corregida conexión PDO en update_user_total_points<br>";
}

// CORRECCIÓN 3: Reemplazar conexiones PDO directas en update_timeline_for_today
$pdo_pattern2 = '/\$pdo = new \\PDO\(\s*"mysql:host=" \. \$CFG->dbhost \. ";dbname=" \. \$CFG->dbname,\s*\$CFG->dbuser,\s*\$CFG->dbpass\s*\);/';
if (preg_match($pdo_pattern2, $content)) {
    $replacement2 = "// ✅ USAR CONFIGURACIÓN CENTRALIZADA\n            require_once(__DIR__ . '/../config/database.php');\n            \$pdo = get_telegram_db_connection();";
    $content = preg_replace($pdo_pattern2, $replacement2, $content);
    $corrections_made++;
    echo "🔧 ✅ Corregida conexión PDO en update_timeline_for_today<br>";
}

// CORRECCIÓN 4: Eliminar setAttribute innecesarios
if (strpos($content, '$pdo->setAttribute(\\PDO::ATTR_ERRMODE, \\PDO::ERRMODE_EXCEPTION);') !== false) {
    $content = str_replace('$pdo->setAttribute(\\PDO::ATTR_ERRMODE, \\PDO::ERRMODE_EXCEPTION);', '', $content);
    $corrections_made++;
    echo "🔧 ✅ Eliminados setAttribute innecesarios<br>";
}

// CORRECCIÓN 5: Limpiar líneas vacías múltiples
$content = preg_replace('/\n\s*\n\s*\n/', "\n\n", $content);

echo "<h3>📊 Correcciones Aplicadas: {$corrections_made}</h3>";

if ($corrections_made > 0 || $content !== $original_content) {
    // 4. Guardar archivo corregido
    if (file_put_contents($observer_file, $content) !== false) {
        echo "✅ Archivo observer.php corregido y guardado<br>";
        
        // 5. Limpiar caché
        try {
            purge_all_caches();
            echo "✅ Cache de Moodle limpiado<br>";
        } catch (Exception $e) {
            echo "⚠️ Error al limpiar caché: " . $e->getMessage() . "<br>";
        }
        
        echo "<h3>🎯 Verificación Final:</h3>";
        echo "<a href='debug_syntax.php' target='_blank'>🔍 Verificar sintaxis corregida</a><br>";
        echo "<a href='/mod/quiz/view.php' target='_blank'>📝 Probar con cuestionario</a><br>";
        
        echo "<hr>";
        echo "<h4>✅ Resultado Esperado:</h4>";
        echo "• Error 'unexpected token private' eliminado<br>";
        echo "• Conexiones PDO centralizadas<br>";
        echo "• Código limpio y funcional<br>";
    } else {
        echo "❌ Error: No se pudo guardar el archivo corregido<br>";
    }
} else {
    echo "<h3>ℹ️ No se encontraron correcciones necesarias</h3>";
    echo "<p>El archivo puede estar ya corregido o tener un formato diferente.</p>";
}

echo "<hr>";
echo "<h4>📋 Información del archivo:</h4>";
echo "Ruta: {$observer_file}<br>";
echo "Tamaño: " . filesize($observer_file) . " bytes<br>";
echo "Última modificación: " . date('Y-m-d H:i:s', filemtime($observer_file)) . "<br>";
?>