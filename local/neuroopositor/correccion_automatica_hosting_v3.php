<?php
/**
 * Corrección Automática del Error progress_data - Versión 3 (Ultra Simplificada)
 * Versión ultra robusta para evitar HTTP 500
 * 
 * PROBLEMAS DETECTADOS:
 * 1. index.php NO contiene el alias class_alias
 * 2. statistics.php NO tiene alias
 * 3. Error de sintaxis en classes/statistics.php línea 93: falta $ antes de progress_data
 * 
 * FECHA: 2025-01-02
 * COMPATIBLE CON: Hosting compartido (sin exec, shell_exec, system, passthru)
 */

// Configuración básica de errores
@ini_set('display_errors', 1);
@ini_set('memory_limit', '128M');
@ini_set('max_execution_time', 120);

echo "<h1>Corrección Automática V3 - Ultra Simplificada</h1>";
echo "<p>Iniciando corrección...</p>";

// Función simple para log
function log_mensaje($msg) {
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $msg\n";
    @file_put_contents(__DIR__ . '/correccion_v3_log.txt', $log_entry, FILE_APPEND);
    echo "<p>$msg</p>";
}

// Función simple para backup
function crear_backup($archivo) {
    if (!file_exists($archivo)) {
        return false;
    }
    $backup = $archivo . '.backup_v3.' . date('Y-m-d_H-i-s');
    return @copy($archivo, $backup);
}

try {
    log_mensaje("=== INICIO CORRECCIÓN V3 ===");
    log_mensaje("Directorio: " . __DIR__);
    
    // CORRECCIÓN 1: index.php
    log_mensaje("\n1. Procesando index.php...");
    $index_file = __DIR__ . '/index.php';
    
    if (file_exists($index_file)) {
        $contenido = @file_get_contents($index_file);
        if ($contenido !== false) {
            // Verificar si ya tiene alias
            if (strpos($contenido, "class_alias('local_neuroopositor\\statistics', 'progress_data')") === false) {
                // Crear backup
                if (crear_backup($index_file)) {
                    log_mensaje("   ✓ Backup de index.php creado");
                } else {
                    log_mensaje("   ⚠ No se pudo crear backup de index.php");
                }
                
                // Agregar alias al final del archivo
                $alias_code = "\n\n// Crear alias para compatibilidad con progress_data\nif (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {\n    class_alias('local_neuroopositor\\statistics', 'progress_data');\n}\n";
                
                $nuevo_contenido = $contenido . $alias_code;
                
                if (@file_put_contents($index_file, $nuevo_contenido)) {
                    log_mensaje("   ✓ index.php corregido exitosamente");
                } else {
                    log_mensaje("   ✗ Error al escribir index.php");
                }
            } else {
                log_mensaje("   ✓ index.php ya tiene el alias");
            }
        } else {
            log_mensaje("   ✗ No se pudo leer index.php");
        }
    } else {
        log_mensaje("   ✗ index.php no encontrado");
    }
    
    // CORRECCIÓN 2: statistics.php
    log_mensaje("\n2. Procesando statistics.php...");
    $stats_file = __DIR__ . '/statistics.php';
    
    if (file_exists($stats_file)) {
        $contenido = @file_get_contents($stats_file);
        if ($contenido !== false) {
            // Verificar si ya tiene alias
            if (strpos($contenido, "class_alias('local_neuroopositor\\statistics', 'progress_data')") === false) {
                // Crear backup
                if (crear_backup($stats_file)) {
                    log_mensaje("   ✓ Backup de statistics.php creado");
                } else {
                    log_mensaje("   ⚠ No se pudo crear backup de statistics.php");
                }
                
                // Agregar alias antes del ?> o al final
                $alias_code = "\n// Crear alias para compatibilidad con progress_data\nif (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {\n    class_alias('local_neuroopositor\\statistics', 'progress_data');\n}\n";
                
                if (strpos($contenido, '?>') !== false) {
                    $nuevo_contenido = str_replace('?>', $alias_code . '?>', $contenido);
                } else {
                    $nuevo_contenido = $contenido . $alias_code;
                }
                
                if (@file_put_contents($stats_file, $nuevo_contenido)) {
                    log_mensaje("   ✓ statistics.php corregido exitosamente");
                } else {
                    log_mensaje("   ✗ Error al escribir statistics.php");
                }
            } else {
                log_mensaje("   ✓ statistics.php ya tiene el alias");
            }
        } else {
            log_mensaje("   ✗ No se pudo leer statistics.php");
        }
    } else {
        log_mensaje("   ✗ statistics.php no encontrado");
    }
    
    // CORRECCIÓN 3: classes/statistics.php
    log_mensaje("\n3. Procesando classes/statistics.php...");
    $classes_file = __DIR__ . '/classes/statistics.php';
    
    if (file_exists($classes_file)) {
        $contenido = @file_get_contents($classes_file);
        if ($contenido !== false) {
            // Buscar y corregir el error específico
            $contenido_original = $contenido;
            $contenido_corregido = str_replace(
                'round((progress_data->progreso_promedio ?: 0), 1)',
                'round(($progress_data->progreso_promedio ?: 0), 1)',
                $contenido
            );
            
            if ($contenido_corregido !== $contenido_original) {
                // Crear backup
                if (crear_backup($classes_file)) {
                    log_mensaje("   ✓ Backup de classes/statistics.php creado");
                } else {
                    log_mensaje("   ⚠ No se pudo crear backup de classes/statistics.php");
                }
                
                if (@file_put_contents($classes_file, $contenido_corregido)) {
                    log_mensaje("   ✓ Error de sintaxis corregido en classes/statistics.php");
                } else {
                    log_mensaje("   ✗ Error al escribir classes/statistics.php");
                }
            } else {
                log_mensaje("   ✓ classes/statistics.php no necesita corrección");
            }
        } else {
            log_mensaje("   ✗ No se pudo leer classes/statistics.php");
        }
    } else {
        log_mensaje("   ✗ classes/statistics.php no encontrado");
    }
    
    // VERIFICACIÓN FINAL
    log_mensaje("\n4. Verificación final...");
    
    $archivos = ['index.php', 'statistics.php'];
    foreach ($archivos as $archivo) {
        $ruta = __DIR__ . '/' . $archivo;
        if (file_exists($ruta)) {
            $contenido = @file_get_contents($ruta);
            if ($contenido && strpos($contenido, "class_alias('local_neuroopositor\\statistics', 'progress_data')") !== false) {
                log_mensaje("   ✓ $archivo tiene el alias correcto");
            } else {
                log_mensaje("   ✗ $archivo NO tiene el alias");
            }
        }
    }
    
    log_mensaje("\n=== CORRECCIÓN V3 COMPLETADA ===");
    
    echo "<h2>✅ Corrección V3 Completada</h2>";
    echo "<p><strong>Archivos procesados:</strong></p>";
    echo "<ul>";
    echo "<li>index.php - Verificado/Corregido</li>";
    echo "<li>statistics.php - Verificado/Corregido</li>";
    echo "<li>classes/statistics.php - Verificado/Corregido</li>";
    echo "</ul>";
    
    echo "<p><strong>Log generado:</strong> correccion_v3_log.txt</p>";
    echo "<p><strong>Backups creados:</strong> Archivos con extensión .backup_v3.*</p>";
    
} catch (Exception $e) {
    log_mensaje("ERROR: " . $e->getMessage());
    echo "<h2>❌ Error</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
} catch (Error $e) {
    log_mensaje("ERROR FATAL: " . $e->getMessage());
    echo "<h2>❌ Error Fatal</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<hr>";
echo "<p><em>Corrección V3 ejecutada el " . date('Y-m-d H:i:s') . "</em></p>";

?>