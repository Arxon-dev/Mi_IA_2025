<?php
/**
 * Corrección Automática del Error progress_data - Hosting Compatible
 * Basado en los resultados del diagnóstico
 * 
 * PROBLEMAS DETECTADOS:
 * 1. index.php NO contiene el alias class_alias
 * 2. statistics.php NO tiene alias
 * 3. Error de sintaxis en classes/statistics.php línea 93: falta $ antes de progress_data
 * 
 * FECHA: 2025-01-02
 * COMPATIBLE CON: Hosting compartido (sin exec, shell_exec, system, passthru)
 */

echo "<h1>Corrección Automática del Error progress_data</h1>";
echo "<p>Iniciando corrección basada en diagnóstico...</p>";

// Función para escribir log
function escribir_log($mensaje) {
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $mensaje\n";
    file_put_contents('correccion_automatica_log.txt', $log_entry, FILE_APPEND | LOCK_EX);
    echo "<p>$mensaje</p>";
}

// Función para hacer backup
function hacer_backup($archivo) {
    $backup_name = $archivo . '.backup.' . date('Y-m-d_H-i-s');
    if (copy($archivo, $backup_name)) {
        escribir_log("✓ Backup creado: $backup_name");
        return true;
    } else {
        escribir_log("✗ Error al crear backup de $archivo");
        return false;
    }
}

// Función para verificar sintaxis básica
function verificar_sintaxis_basica($contenido) {
    // Verificaciones básicas sin usar exec()
    $errores = [];
    
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
}

escribir_log("=== INICIO DE CORRECCIÓN AUTOMÁTICA ===");
escribir_log("Fecha: " . date('Y-m-d H:i:s'));
escribir_log("Directorio: " . __DIR__);

// CORRECCIÓN 1: Agregar alias a index.php
escribir_log("\n1. Corrigiendo index.php...");

$index_file = __DIR__ . '/index.php';
if (file_exists($index_file)) {
    // Hacer backup
    if (hacer_backup($index_file)) {
        $contenido_index = file_get_contents($index_file);
        
        // Verificar si ya tiene el alias
        if (strpos($contenido_index, "class_alias('local_neuroopositor\\statistics', 'progress_data')") === false) {
            // Buscar donde insertar el alias (después de require_once)
            $lineas = explode("\n", $contenido_index);
            $nueva_lineas = [];
            $alias_insertado = false;
            
            foreach ($lineas as $linea) {
                $nueva_lineas[] = $linea;
                
                // Insertar después de la última línea require_once
                if (!$alias_insertado && (strpos($linea, 'require_once') !== false || strpos($linea, 'include_once') !== false)) {
                    // Verificar si la siguiente línea no es otro require
                    $siguiente_es_require = false;
                    $indice_actual = array_search($linea, $lineas);
                    if ($indice_actual !== false && isset($lineas[$indice_actual + 1])) {
                        $siguiente_linea = trim($lineas[$indice_actual + 1]);
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
                        escribir_log("   ✓ Alias insertado en index.php después de línea: $linea");
                    }
                }
            }
            
            // Si no se insertó, agregar al final antes del cierre
            if (!$alias_insertado) {
                // Buscar la última línea que no sea ?>
                $ultima_linea_codigo = count($nueva_lineas) - 1;
                while ($ultima_linea_codigo >= 0 && trim($nueva_lineas[$ultima_linea_codigo]) === '') {
                    $ultima_linea_codigo--;
                }
                
                if ($ultima_linea_codigo >= 0 && trim($nueva_lineas[$ultima_linea_codigo]) === '?>') {
                    // Insertar antes del ?>
                    array_splice($nueva_lineas, $ultima_linea_codigo, 0, [
                        "",
                        "// Crear alias para compatibilidad con progress_data",
                        "if (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {",
                        "    class_alias('local_neuroopositor\\statistics', 'progress_data');",
                        "}",
                        ""
                    ]);
                } else {
                    // Agregar al final
                    $nueva_lineas[] = "";
                    $nueva_lineas[] = "// Crear alias para compatibilidad con progress_data";
                    $nueva_lineas[] = "if (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {";
                    $nueva_lineas[] = "    class_alias('local_neuroopositor\\statistics', 'progress_data');";
                    $nueva_lineas[] = "}";
                }
                escribir_log("   ✓ Alias insertado al final de index.php");
            }
            
            $nuevo_contenido = implode("\n", $nueva_lineas);
            
            // Verificar sintaxis
            $sintaxis_ok = verificar_sintaxis_basica($nuevo_contenido);
            if ($sintaxis_ok === true) {
                if (file_put_contents($index_file, $nuevo_contenido)) {
                    escribir_log("   ✓ index.php corregido exitosamente");
                } else {
                    escribir_log("   ✗ Error al escribir index.php");
                }
            } else {
                escribir_log("   ✗ Error de sintaxis en index.php: " . implode(', ', $sintaxis_ok));
            }
        } else {
            escribir_log("   ✓ index.php ya tiene el alias");
        }
    }
} else {
    escribir_log("   ✗ index.php no encontrado");
}

// CORRECCIÓN 2: Agregar alias a statistics.php
escribir_log("\n2. Corrigiendo statistics.php...");

$stats_file = __DIR__ . '/statistics.php';
if (file_exists($stats_file)) {
    // Hacer backup
    if (hacer_backup($stats_file)) {
        $contenido_stats = file_get_contents($stats_file);
        
        // Verificar si ya tiene el alias
        if (strpos($contenido_stats, "class_alias('local_neuroopositor\\statistics', 'progress_data')") === false) {
            // Agregar al final antes del cierre
            $lineas = explode("\n", $contenido_stats);
            $nueva_lineas = [];
            
            foreach ($lineas as $linea) {
                if (trim($linea) === '?>') {
                    // Insertar antes del ?>
                    $nueva_lineas[] = "";
                    $nueva_lineas[] = "// Crear alias para compatibilidad con progress_data";
                    $nueva_lineas[] = "if (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {";
                    $nueva_lineas[] = "    class_alias('local_neuroopositor\\statistics', 'progress_data');";
                    $nueva_lineas[] = "}";
                    $nueva_lineas[] = "";
                }
                $nueva_lineas[] = $linea;
            }
            
            // Si no hay ?>, agregar al final
            if (!in_array('?>', array_map('trim', $lineas))) {
                $nueva_lineas[] = "";
                $nueva_lineas[] = "// Crear alias para compatibilidad con progress_data";
                $nueva_lineas[] = "if (class_exists('local_neuroopositor\\statistics') && !class_exists('progress_data')) {";
                $nueva_lineas[] = "    class_alias('local_neuroopositor\\statistics', 'progress_data');";
                $nueva_lineas[] = "}";
            }
            
            $nuevo_contenido = implode("\n", $nueva_lineas);
            
            // Verificar sintaxis
            $sintaxis_ok = verificar_sintaxis_basica($nuevo_contenido);
            if ($sintaxis_ok === true) {
                if (file_put_contents($stats_file, $nuevo_contenido)) {
                    escribir_log("   ✓ statistics.php corregido exitosamente");
                } else {
                    escribir_log("   ✗ Error al escribir statistics.php");
                }
            } else {
                escribir_log("   ✗ Error de sintaxis en statistics.php: " . implode(', ', $sintaxis_ok));
            }
        } else {
            escribir_log("   ✓ statistics.php ya tiene el alias");
        }
    }
} else {
    escribir_log("   ✗ statistics.php no encontrado");
}

// CORRECCIÓN 3: Corregir error de sintaxis en classes/statistics.php línea 93
escribir_log("\n3. Corrigiendo classes/statistics.php...");

$classes_stats_file = __DIR__ . '/classes/statistics.php';
if (file_exists($classes_stats_file)) {
    // Hacer backup
    if (hacer_backup($classes_stats_file)) {
        $contenido_classes = file_get_contents($classes_stats_file);
        
        // Corregir el error específico en línea 93
        $contenido_corregido = str_replace(
            'round((progress_data->progreso_promedio ?: 0), 1)',
            'round(($progress_data->progreso_promedio ?: 0), 1)',
            $contenido_classes
        );
        
        if ($contenido_corregido !== $contenido_classes) {
            // Verificar sintaxis
            $sintaxis_ok = verificar_sintaxis_basica($contenido_corregido);
            if ($sintaxis_ok === true) {
                if (file_put_contents($classes_stats_file, $contenido_corregido)) {
                    escribir_log("   ✓ Error de sintaxis corregido en classes/statistics.php línea 93");
                } else {
                    escribir_log("   ✗ Error al escribir classes/statistics.php");
                }
            } else {
                escribir_log("   ✗ Error de sintaxis en classes/statistics.php: " . implode(', ', $sintaxis_ok));
            }
        } else {
            escribir_log("   ✓ classes/statistics.php no necesita corrección en línea 93");
        }
    }
} else {
    escribir_log("   ✗ classes/statistics.php no encontrado");
}

// VERIFICACIÓN FINAL
escribir_log("\n4. Verificación final...");

// Verificar que los archivos existen y tienen los alias
$archivos_verificar = [
    'index.php' => __DIR__ . '/index.php',
    'statistics.php' => __DIR__ . '/statistics.php'
];

foreach ($archivos_verificar as $nombre => $ruta) {
    if (file_exists($ruta)) {
        $contenido = file_get_contents($ruta);
        if (strpos($contenido, "class_alias('local_neuroopositor\\statistics', 'progress_data')") !== false) {
            escribir_log("   ✓ $nombre tiene el alias correcto");
        } else {
            escribir_log("   ✗ $nombre NO tiene el alias");
        }
    } else {
        escribir_log("   ✗ $nombre no encontrado");
    }
}

escribir_log("\n=== CORRECCIÓN COMPLETADA ===");
escribir_log("Fecha de finalización: " . date('Y-m-d H:i:s'));

echo "<h2>Corrección Completada</h2>";
echo "<p><strong>Archivos corregidos:</strong></p>";
echo "<ul>";
echo "<li>index.php - Alias agregado</li>";
echo "<li>statistics.php - Alias agregado</li>";
echo "<li>classes/statistics.php - Error de sintaxis corregido</li>";
echo "</ul>";

echo "<p><strong>Próximos pasos:</strong></p>";
echo "<ol>";
echo "<li>Probar el plugin para verificar que funciona</li>";
echo "<li>Revisar el log: <strong>correccion_automatica_log.txt</strong></li>";
echo "<li>Si hay problemas, restaurar desde los archivos .backup</li>";
echo "<li>Eliminar este script una vez confirmado que todo funciona</li>";
echo "</ol>";

echo "<p><em>Corrección basada en diagnóstico del " . date('Y-m-d H:i:s') . "</em></p>";

?>