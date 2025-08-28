<?php
/**
 * CORRECCIÓN FINAL WEB V3 - Observer.php
 * Script optimizado para ejecución web
 */

require_once('config.php');
require_login();

echo "<h2>🔧 Corrección Final Web V3 - Observer.php</h2>";

// DETECTAR RUTA AUTOMÁTICAMENTE
$moodle_root = dirname(__FILE__);
$observer_file = $moodle_root . '/local/telegram_integration/classes/observer.php';

echo "<p><strong>Directorio Moodle:</strong> {$moodle_root}</p>";
echo "<p><strong>Buscando archivo:</strong> {$observer_file}</p>";

if (!file_exists($observer_file)) {
    echo "❌ <strong>Error:</strong> No se encuentra el archivo observer.php en: {$observer_file}<br>";
    
    // Mostrar estructura de directorios para diagnóstico
    echo "<h3>📁 Diagnóstico de estructura:</h3>";
    $local_dir = $moodle_root . '/local';
    if (is_dir($local_dir)) {
        echo "✅ Directorio /local existe<br>";
        $telegram_dir = $local_dir . '/telegram_integration';
        if (is_dir($telegram_dir)) {
            echo "✅ Directorio /local/telegram_integration existe<br>";
            $classes_dir = $telegram_dir . '/classes';
            if (is_dir($classes_dir)) {
                echo "✅ Directorio /local/telegram_integration/classes existe<br>";
                $files = scandir($classes_dir);
                echo "<strong>Archivos encontrados:</strong><br>";
                foreach ($files as $file) {
                    if ($file != '.' && $file != '..') {
                        echo "- {$file}<br>";
                    }
                }
            } else {
                echo "❌ Directorio /local/telegram_integration/classes NO existe<br>";
            }
        } else {
            echo "❌ Directorio /local/telegram_integration NO existe<br>";
        }
    } else {
        echo "❌ Directorio /local NO existe<br>";
    }
    die();
}

echo "✅ <strong>Archivo encontrado:</strong> {$observer_file}<br>";

// 1. Crear backup
$backup_file = $observer_file . '.backup-web-v3-' . date('Y-m-d-H-i-s');
if (copy($observer_file, $backup_file)) {
    echo "✅ <strong>Backup creado:</strong> " . basename($backup_file) . "<br>";
} else {
    echo "❌ <strong>Error:</strong> No se pudo crear el backup<br>";
    die();
}

// 2. Leer contenido
$content = file_get_contents($observer_file);
if ($content === false) {
    echo "❌ <strong>Error:</strong> No se pudo leer el archivo<br>";
    die();
}

echo "📄 <strong>Archivo leído:</strong> " . strlen($content) . " caracteres<br>";

// 3. Aplicar correcciones
$corrections_made = 0;
$original_content = $content;

echo "<h3>🔧 Aplicando correcciones...</h3>";

// CORRECCIÓN 1: Eliminar comentario problemático
if (strpos($content, '// Reemplazar líneas 137-140') !== false) {
    $content = str_replace('// Reemplazar líneas 137-140', '', $content);
    $corrections_made++;
    echo "✅ Eliminado comentario problemático '// Reemplazar líneas 137-140'<br>";
}

// CORRECCIÓN 2: Buscar y reemplazar conexiones PDO directas (patrón más flexible)
$pdo_patterns = [
    '/\$pdo\s*=\s*new\s+\\?PDO\s*\(\s*["\']mysql:host=["\']\s*\.\s*\$CFG->dbhost\s*\.\s*["\'];dbname=["\']\s*\.\s*\$CFG->dbname[^;]*;[^)]*\);/s',
    '/\$pdo\s*=\s*new\s+PDO\s*\([^)]*\$CFG->dbhost[^)]*\);/s'
];

foreach ($pdo_patterns as $pattern) {
    if (preg_match($pattern, $content)) {
        $replacement = "// ✅ USAR CONFIGURACIÓN CENTRALIZADA\n            require_once(__DIR__ . '/../config/database.php');\n            \$pdo = get_telegram_db_connection();";
        $content = preg_replace($pattern, $replacement, $content);
        $corrections_made++;
        echo "✅ Corregida conexión PDO directa<br>";
    }
}

// CORRECCIÓN 3: Eliminar setAttribute innecesarios
$setAttribute_patterns = [
    '/\$pdo->setAttribute\s*\(\s*\\?PDO::ATTR_ERRMODE\s*,\s*\\?PDO::ERRMODE_EXCEPTION\s*\)\s*;/',
    '/\$pdo->setAttribute\([^)]*\);/'
];

foreach ($setAttribute_patterns as $pattern) {
    if (preg_match($pattern, $content)) {
        $content = preg_replace($pattern, '', $content);
        $corrections_made++;
        echo "✅ Eliminado setAttribute innecesario<br>";
    }
}

// CORRECCIÓN 4: Limpiar líneas vacías múltiples
$content = preg_replace('/\n\s*\n\s*\n+/', "\n\n", $content);

echo "<h3>📊 <strong>Total de correcciones aplicadas:</strong> {$corrections_made}</h3>";

if ($corrections_made > 0 || $content !== $original_content) {
    // 4. Guardar archivo corregido
    if (file_put_contents($observer_file, $content) !== false) {
        echo "✅ <strong>Archivo observer.php corregido y guardado</strong><br>";
        
        // 5. Limpiar caché
        try {
            purge_all_caches();
            echo "✅ <strong>Cache de Moodle limpiado</strong><br>";
        } catch (Exception $e) {
            echo "⚠️ <strong>Advertencia:</strong> Error al limpiar caché: " . $e->getMessage() . "<br>";
        }
        
        echo "<hr>";
        echo "<h3>🎯 <strong>Verificación Final</strong></h3>";
        echo "<p><a href='debug_syntax.php' target='_blank' style='background: #007cba; color: white; padding: 10px; text-decoration: none; border-radius: 5px;'>🔍 Verificar sintaxis corregida</a></p>";
        echo "<p><a href='/mod/quiz/view.php' target='_blank' style='background: #28a745; color: white; padding: 10px; text-decoration: none; border-radius: 5px;'>📝 Probar con cuestionario</a></p>";
        
        echo "<hr>";
        echo "<h4>✅ <strong>Resultado Esperado:</strong></h4>";
        echo "<ul>";
        echo "<li>✅ Error 'unexpected token private' eliminado</li>";
        echo "<li>✅ Conexiones PDO centralizadas</li>";
        echo "<li>✅ Código limpio y funcional</li>";
        echo "</ul>";
        
    } else {
        echo "❌ <strong>Error:</strong> No se pudo guardar el archivo corregido<br>";
    }
} else {
    echo "<h3>ℹ️ <strong>No se encontraron correcciones necesarias</strong></h3>";
    echo "<p>El archivo puede estar ya corregido.</p>";
}

echo "<hr>";
echo "<h4>📋 <strong>Información del archivo:</strong></h4>";
echo "<ul>";
echo "<li><strong>Ruta:</strong> {$observer_file}</li>";
echo "<li><strong>Tamaño:</strong> " . filesize($observer_file) . " bytes</li>";
echo "<li><strong>Última modificación:</strong> " . date('Y-m-d H:i:s', filemtime($observer_file)) . "</li>";
echo "</ul>";
?>