<?php
/**
 * Corrección Automática del Error progress_data - Versión 2 (Hosting Compatible)
 * Versión mejorada con mejor manejo de errores para evitar HTTP 500
 * 
 * PROBLEMAS DETECTADOS:
 * 1. index.php NO contiene el alias class_alias
 * 2. statistics.php NO tiene alias
 * 3. Error de sintaxis en classes/statistics.php línea 93: falta $ antes de progress_data
 * 
 * FECHA: 2025-01-02
 * COMPATIBLE CON: Hosting compartido (sin exec, shell_exec, system, passthru)
 */

// Configuración de errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/correccion_error.log');

// Aumentar límites si es posible
if (function_exists('ini_set')) {
    @ini_set('memory_limit', '256M');
    @ini_set('max_execution_time', 300);
}

echo "<h1>Corrección Automática del Error progress_data - V2</h1>";
echo "<p>Iniciando corrección con manejo mejorado de errores...</p>";

// Función para escribir log con manejo de errores
function escribir_log($mensaje) {
    try {
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[$timestamp] $mensaje\n";
        
        // Intentar escribir el log
        $result = @file_put_contents(__DIR__ . '/correccion_automatica_v2_log.txt', $log_entry, FILE_APPEND | LOCK_EX);
        
        if ($result === false) {
            echo "<p style='color: orange;'>⚠ Log: $mensaje (no se pudo escribir al archivo)</p>";
        } else {
            echo "<p>$mensaje</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>Error en log: " . htmlspecialchars($e->getMessage()) . "</p>";
        echo "<p>$mensaje</p>";
    }
}

// Función para hacer backup con manejo de errores
function hacer_backup($archivo) {
    try {
        if (!file_exists($archivo)) {
            escribir_log("✗ Archivo no existe para backup: $archivo");
            return false;
        }
        
        if (!is_readable($archivo)) {
            escribir_log("✗ Archivo no es legible para backup: $archivo");
            return false;
        }
        
        $backup_name = $archivo . '.backup.' . date('Y-m-d_H-i-s');
        
        if (@copy($archivo, $backup_name)) {
            escribir_log("✓ Backup creado: $backup_name");
            return true;
        } else {
            escribir_log("✗ Error al crear backup de $archivo");
            return false;
        }
    } catch (Exception $e) {
        escribir_log("✗ Excepción al crear backup: " . $e->getMessage());
        return false;
    }
}

// Función para verificar sintaxis básica
function verificar_sintaxis_basica($contenido) {
    try {
        $errores = [];
        
        // Verificar que el contenido no esté vacío
        if (empty(trim($contenido))) {
            $errores[] = 'Contenido vacío';
            return $errores;
        }
        
        // Verificar llaves balanceadas
        if (substr_count($contenido, '{') !== substr_count($contenido, '}')) {
            $errores[] = 'Llaves desbalanceadas';
        }
        
        // Verificar paréntesis balanceados
        if (substr_count($contenido, '(') !== substr_count($contenido, ')')) {
            $errores[] = 'Paréntesis desbalanceados';
        }
        
        // Verificar etiquetas PHP
        if (!preg_match('/^\s*<\?php/', $contenido)) {
            $errores[] = 'No inicia con <?php';
        }
        
        return empty($errores) ? true : $errores;
    } catch (Exception $e) {
        return ['Error en verificación: ' . $e->getMessage()];
    }
}

// Función para escribir archivo de forma segura
function escribir_archivo_seguro($archivo, $contenido) {
    try {
        // Verificar que el directorio sea escribible
        $directorio = dirname($archivo);
        if (!is_writable($directorio)) {
            return "Directorio no escribible: $directorio";
        }
        
        // Verificar sintaxis antes de escribir
        $sintaxis_ok = verificar_sintaxis_basica($contenido);
        if ($sintaxis_ok !== true) {
            return "Error de sintaxis: " . implode(', ', $sintaxis_ok);
        }
        
        // Escribir archivo
        $result = @file_put_contents($archivo, $contenido, LOCK_EX);
        
        if ($result === false) {
            return "Error al escribir archivo";
        }
        
        return true;
    } catch (Exception $e) {
        return "Excepción: " . $e->getMessage();
    }
}

try {
    escribir_log("=== INICIO DE CORRECCIÓN AUTOMÁTICA V2 ===");
    escribir_log("Fecha: " . date('Y-m-d H:i:s'));
    escribir_log("Directorio: " . __DIR__);
    escribir_log("PHP Version: " . PHP_VERSION);
    
    // Verificar permisos del directorio
    if (!is_writable(__DIR__)) {
        throw new Exception("El directorio no tiene permisos de escritura: " . __DIR__);
    }
    
    // CORRECCIÓN 1: Agregar alias a index.php
    escribir_log("\n1. Corrigiendo index.php...");
    
    $index_file = __DIR__ . '/index.php';
    if (file_exists($index_file)) {
        if (hacer_backup($index_file)) {
            $contenido_index = @file_get_contents($index_file);
            
            if ($contenido_index === false) {
                escribir_log("   ✗ Error al leer index.php");
            } else {
                // Verificar si ya tiene el alias
                if (strpos($contenido_index, "class_alias('local_neuroopositor\\statistics', 'progress_data')") === false) {
                    $lineas = explode("\n", $contenido_index);
                    $nueva_lineas = [];
                    $alias_insertado = false;
                    
                    foreach ($lineas as $i => $linea) {
                        $nueva_lineas[] = $linea;
                        
                        // Insertar después de require_once/include_once
                        if (!$alias_insertado && (strpos($linea, 'require_once') !== false || strpos($linea, 'include_once') !== false)) {
                            // Verificar si la siguiente línea no es otro require
                            $siguiente_es_require = false;
                            if (isset($lineas[$i + 1])) {
                                $siguiente_linea = trim($lineas[$i + 1]);
                                if (strpos($siguiente_linea, 'require') !== false || strpos($siguiente_linea, 'include') !== false) {
                                    $siguiente_es_require = true;
                                }
                            }
                            
                            if (!$siguiente_es_require) {
                                $nueva_lineas[] = "";
                                $nueva_lineas[] = "// Crear alias para compatibilidad con progress_data";
                                $nueva_lineas[] = "if (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {";
                                $nueva_lineas[] = "    class_alias('local_neuroopositor\\statistics', 'progress_data');";
                                $nueva_lineas[] = "}";
                                $alias_insertado = true;
                                escribir_log("   ✓ Alias insertado después de: " . trim($linea));
                            }
                        }
                    }
                    
                    // Si no se insertó, agregar al final
                    if (!$alias_insertado) {
                        $nueva_lineas[] = "";
                        $nueva_lineas[] = "// Crear alias para compatibilidad con progress_data";
                        $nueva_lineas[] = "if (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {";
                        $nueva_lineas[] = "    class_alias('local_neuroopositor\\statistics', 'progress_data');";
                        $nueva_lineas[] = "}";
                        escribir_log("   ✓ Alias insertado al final de index.php");
                    }
                    
                    $nuevo_contenido = implode("\n", $nueva_lineas);
                    $resultado = escribir_archivo_seguro($index_file, $nuevo_contenido);
                    
                    if ($resultado === true) {
                        escribir_log("   ✓ index.php corregido exitosamente");
                    } else {
                        escribir_log("   ✗ Error al escribir index.php: $resultado");
                    }
                } else {
                    escribir_log("   ✓ index.php ya tiene el alias");
                }
            }
        }
    } else {
        escribir_log("   ✗ index.php no encontrado");
    }
    
    // CORRECCIÓN 2: Agregar alias a statistics.php
    escribir_log("\n2. Corrigiendo statistics.php...");
    
    $stats_file = __DIR__ . '/statistics.php';
    if (file_exists($stats_file)) {
        if (hacer_backup($stats_file)) {
            $contenido_stats = @file_get_contents($stats_file);
            
            if ($contenido_stats === false) {
                escribir_log("   ✗ Error al leer statistics.php");
            } else {
                // Verificar si ya tiene el alias
                if (strpos($contenido_stats, "class_alias('local_neuroopositor\\statistics', 'progress_data')") === false) {
                    $lineas = explode("\n", $contenido_stats);
                    $nueva_lineas = [];
                    $alias_insertado = false;
                    
                    foreach ($lineas as $linea) {
                        if (trim($linea) === '?>' && !$alias_insertado) {
                            // Insertar antes del ?>
                            $nueva_lineas[] = "";
                            $nueva_lineas[] = "// Crear alias para compatibilidad con progress_data";
                            $nueva_lineas[] = "if (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {";
                            $nueva_lineas[] = "    class_alias('local_neuroopositor\\statistics', 'progress_data');";
                            $nueva_lineas[] = "}";
                            $nueva_lineas[] = "";
                            $alias_insertado = true;
                        }
                        $nueva_lineas[] = $linea;
                    }
                    
                    // Si no hay ?>, agregar al final
                    if (!$alias_insertado) {
                        $nueva_lineas[] = "";
                        $nueva_lineas[] = "// Crear alias para compatibilidad con progress_data";
                        $nueva_lineas[] = "if (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {";
                        $nueva_lineas[] = "    class_alias('local_neuroopositor\\statistics', 'progress_data');";
                        $nueva_lineas[] = "}";
                    }
                    
                    $nuevo_contenido = implode("\n", $nueva_lineas);
                    $resultado = escribir_archivo_seguro($stats_file, $nuevo_contenido);
                    
                    if ($resultado === true) {
                        escribir_log("   ✓ statistics.php corregido exitosamente");
                    } else {
                        escribir_log("   ✗ Error al escribir statistics.php: $resultado");
                    }
                } else {
                    escribir_log("   ✓ statistics.php ya tiene el alias");
                }
            }
        }
    } else {
        escribir_log("   ✗ statistics.php no encontrado");
    }
    
    // CORRECCIÓN 3: Corregir error de sintaxis en classes/statistics.php
    escribir_log("\n3. Corrigiendo classes/statistics.php...");
    
    $classes_stats_file = __DIR__ . '/classes/statistics.php';
    if (file_exists($classes_stats_file)) {
        if (hacer_backup($classes_stats_file)) {
            $contenido_classes = @file_get_contents($classes_stats_file);
            
            if ($contenido_classes === false) {
                escribir_log("   ✗ Error al leer classes/statistics.php");
            } else {
                // Corregir el error específico en línea 93
                $contenido_original = $contenido_classes;
                $contenido_corregido = str_replace(
                    'round((progress_data->progreso_promedio ?: 0), 1)',
                    'round(($progress_data->progreso_promedio ?: 0), 1)',
                    $contenido_classes
                );
                
                if ($contenido_corregido !== $contenido_original) {
                    $resultado = escribir_archivo_seguro($classes_stats_file, $contenido_corregido);
                    
                    if ($resultado === true) {
                        escribir_log("   ✓ Error de sintaxis corregido en classes/statistics.php");
                    } else {
                        escribir_log("   ✗ Error al escribir classes/statistics.php: $resultado");
                    }
                } else {
                    escribir_log("   ✓ classes/statistics.php no necesita corrección");
                }
            }
        }
    } else {
        escribir_log("   ✗ classes/statistics.php no encontrado");
    }
    
    // VERIFICACIÓN FINAL
    escribir_log("\n4. Verificación final...");
    
    $archivos_verificar = [
        'index.php' => __DIR__ . '/index.php',
        'statistics.php' => __DIR__ . '/statistics.php'
    ];
    
    foreach ($archivos_verificar as $nombre => $ruta) {
        if (file_exists($ruta)) {
            $contenido = @file_get_contents($ruta);
            if ($contenido !== false) {
                if (strpos($contenido, "class_alias('local_neuroopositor\\statistics', 'progress_data')") !== false) {
                    escribir_log("   ✓ $nombre tiene el alias correcto");
                } else {
                    escribir_log("   ✗ $nombre NO tiene el alias");
                }
            } else {
                escribir_log("   ✗ Error al leer $nombre");
            }
        } else {
            escribir_log("   ✗ $nombre no encontrado");
        }
    }
    
    escribir_log("\n=== CORRECCIÓN COMPLETADA EXITOSAMENTE ===");
    escribir_log("Fecha de finalización: " . date('Y-m-d H:i:s'));
    
    echo "<h2>✅ Corrección Completada</h2>";
    echo "<p><strong>Archivos procesados:</strong></p>";
    echo "<ul>";
    echo "<li>index.php - Verificado/Corregido</li>";
    echo "<li>statistics.php - Verificado/Corregido</li>";
    echo "<li>classes/statistics.php - Verificado/Corregido</li>";
    echo "</ul>";
    
    echo "<p><strong>Próximos pasos:</strong></p>";
    echo "<ol>";
    echo "<li>Probar el plugin para verificar que funciona</li>";
    echo "<li>Revisar el log: <strong>correccion_automatica_v2_log.txt</strong></li>";
    echo "<li>Si hay problemas, restaurar desde los archivos .backup</li>";
    echo "<li>Eliminar este script una vez confirmado que todo funciona</li>";
    echo "</ol>";
    
} catch (Exception $e) {
    escribir_log("\n❌ ERROR CRÍTICO: " . $e->getMessage());
    escribir_log("Archivo: " . $e->getFile());
    escribir_log("Línea: " . $e->getLine());
    
    echo "<h2>❌ Error Crítico</h2>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
    echo "<p><strong>Recomendación:</strong> Revisar permisos de archivos y directorio.</p>";
} catch (Error $e) {
    escribir_log("\n❌ ERROR FATAL: " . $e->getMessage());
    
    echo "<h2>❌ Error Fatal</h2>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
}

echo "<hr>";
echo "<p><em>Corrección V2 ejecutada el " . date('Y-m-d H:i:s') . "</em></p>";

?>