<?php
/**
 * Corrección Automática del Error progress_data - Versión 4 (Mínima)
 * Versión ultra minimalista para evitar HTTP 500
 * 
 * FECHA: 2025-01-02
 * COMPATIBLE CON: Hosting compartido
 */

// Configuración mínima
@ini_set('memory_limit', '64M');
@ini_set('max_execution_time', 60);

echo "<h1>Corrección V4 - Mínima</h1>";
echo "<p>Iniciando...</p>";

// Log simple
function log_simple($msg) {
    echo "<p>$msg</p>";
    @file_put_contents(__DIR__ . '/log_v4.txt', date('H:i:s') . " $msg\n", FILE_APPEND);
}

log_simple("Inicio corrección V4");

// 1. Corregir index.php
log_simple("1. Procesando index.php");
$index = __DIR__ . '/index.php';
if (file_exists($index)) {
    $content = file_get_contents($index);
    if ($content && strpos($content, "class_alias('local_neuroopositor\\statistics', 'progress_data')") === false) {
        @copy($index, $index . '.bak_v4');
        $alias = "\n// Alias para progress_data\nif (class_exists('local_neuroopositor\\statistics')) {\n    class_alias('local_neuroopositor\\statistics', 'progress_data');\n}\n";
        if (file_put_contents($index, $content . $alias)) {
            log_simple("   ✓ index.php corregido");
        } else {
            log_simple("   ✗ Error escribiendo index.php");
        }
    } else {
        log_simple("   ✓ index.php ya tiene alias");
    }
} else {
    log_simple("   ✗ index.php no encontrado");
}

// 2. Corregir statistics.php
log_simple("2. Procesando statistics.php");
$stats = __DIR__ . '/statistics.php';
if (file_exists($stats)) {
    $content = file_get_contents($stats);
    if ($content && strpos($content, "class_alias('local_neuroopositor\\statistics', 'progress_data')") === false) {
        @copy($stats, $stats . '.bak_v4');
        $alias = "\n// Alias para progress_data\nif (class_exists('local_neuroopositor\\statistics')) {\n    class_alias('local_neuroopositor\\statistics', 'progress_data');\n}\n";
        $new_content = str_replace('?>', $alias . '?>', $content);
        if (strpos($content, '?>') === false) {
            $new_content = $content . $alias;
        }
        if (file_put_contents($stats, $new_content)) {
            log_simple("   ✓ statistics.php corregido");
        } else {
            log_simple("   ✗ Error escribiendo statistics.php");
        }
    } else {
        log_simple("   ✓ statistics.php ya tiene alias");
    }
} else {
    log_simple("   ✗ statistics.php no encontrado");
}

// 3. Corregir classes/statistics.php
log_simple("3. Procesando classes/statistics.php");
$classes = __DIR__ . '/classes/statistics.php';
if (file_exists($classes)) {
    $content = file_get_contents($classes);
    if ($content) {
        $original = $content;
        $fixed = str_replace('round((progress_data->progreso_promedio ?: 0), 1)', 'round(($progress_data->progreso_promedio ?: 0), 1)', $content);
        if ($fixed !== $original) {
            @copy($classes, $classes . '.bak_v4');
            if (file_put_contents($classes, $fixed)) {
                log_simple("   ✓ classes/statistics.php corregido");
            } else {
                log_simple("   ✗ Error escribiendo classes/statistics.php");
            }
        } else {
            log_simple("   ✓ classes/statistics.php no necesita corrección");
        }
    }
} else {
    log_simple("   ✗ classes/statistics.php no encontrado");
}

log_simple("Corrección V4 completada");

echo "<h2>✅ Corrección V4 Completada</h2>";
echo "<p>Log: log_v4.txt</p>";
echo "<p>Backups: *.bak_v4</p>";
echo "<p>Ejecutado: " . date('Y-m-d H:i:s') . "</p>";

?>