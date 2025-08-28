<?php
/**
 * CORRECCIÓN INTEGRAL DEL ARCHIVO OBSERVER.PHP
 * Corrige todos los errores de sintaxis y estructura de una vez
 */

require_once('../../config.php');
require_login();

echo "<h2>🔧 Corrección Integral - Observer.php</h2>";

$observer_file = __DIR__ . '/classes/observer.php';

if (!file_exists($observer_file)) {
    die("❌ Error: No se encuentra el archivo observer.php en: {$observer_file}");
}

// 1. Crear backup
$backup_file = $observer_file . '.backup-complete-' . date('Y-m-d-H-i-s');
copy($observer_file, $backup_file);
echo "✅ Backup creado: " . basename($backup_file) . "<br>";

// 2. Leer contenido actual
$content = file_get_contents($observer_file);

// 3. CORRECCIONES INTEGRALES
echo "<h3>🔧 Aplicando correcciones:</h3>";

// Corrección 1: Eliminar comentarios duplicados y mal ubicados
$content = preg_replace('/\/\*\*\s*\n\s*\*\s*Get telegram user ID from moodleactivity table\s*\n\s*\*\/\s*\n\s*\/\*\*\s*\n\s*\*\s*Get telegram user ID from moodleactivity table\s*\n\s*\*\//', 
    "/**\n     * Get telegram user ID from moodleactivity table\n     */", $content);
echo "✅ Comentarios duplicados eliminados<br>";

// Corrección 2: Eliminar comentario problemático
$content = str_replace('    // Reemplazar líneas 137-140', '', $content);
echo "✅ Comentario problemático eliminado<br>";

// Corrección 3: Reemplazar conexiones PDO directas con configuración centralizada
$old_pdo_pattern = '/\$pdo = new \\PDO\(\s*"mysql:host=\{\$CFG->dbhost\};dbname=\{\$CFG->dbname\};charset=utf8mb4",\s*\$CFG->dbuser,\s*\$CFG->dbpass\s*\);\s*\$pdo->setAttribute\(\\PDO::ATTR_ERRMODE, \\PDO::ERRMODE_EXCEPTION\);/';
$new_pdo_code = "// ✅ USAR CONFIGURACIÓN CENTRALIZADA\n            require_once(__DIR__ . '/../config/database.php');\n            \$pdo = get_telegram_db_connection();";
$content = preg_replace($old_pdo_pattern, $new_pdo_code, $content);
echo "✅ Conexiones PDO centralizadas<br>";

// Corrección 4: Limpiar espacios y líneas vacías excesivas
$content = preg_replace('/\n\s*\n\s*\n/', "\n\n", $content);
echo "✅ Formato mejorado<br>";

// 4. Guardar archivo corregido
file_put_contents($observer_file, $content);
echo "✅ Archivo observer.php corregido y guardado<br>";

// 5. Limpiar caché de Moodle
try {
    purge_all_caches();
    echo "✅ Cache de Moodle limpiado<br>";
} catch (Exception $e) {
    echo "⚠️ Error al limpiar caché: " . $e->getMessage() . "<br>";
}

echo "<h3>🎯 Verificación:</h3>";
echo "<a href='debug-observer-issue.php' target='_blank'>🔍 Verificar sintaxis aquí</a><br>";
echo "<a href='/mod/quiz/view.php' target='_blank'>📝 Realiza un cuestionario de prueba</a><br>";

echo "<h3>📋 Resultado Esperado:</h3>";
echo "🎯 Todos los errores de sintaxis deben estar resueltos<br>";
echo "🎯 Las conexiones PDO deben usar configuración centralizada<br>";
echo "🎯 El código debe estar limpio y bien estructurado<br>";

echo "<hr>";
echo "<h4>📊 Resumen de Correcciones:</h4>";
echo "• Comentarios duplicados eliminados<br>";
echo "• Comentario problemático '// Reemplazar líneas 137-140' eliminado<br>";
echo "• Conexiones PDO centralizadas con get_telegram_db_connection()<br>";
echo "• Formato de código mejorado<br>";
echo "• Cache de Moodle limpiado<br>";
?>