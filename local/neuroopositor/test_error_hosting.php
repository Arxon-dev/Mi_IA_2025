<?php
/**
 * Script para reproducir el error "Undefined constant progress_data" en el hosting.
 * Este script simula exactamente el flujo que causa el error.
 * 
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Configurar para mostrar todos los errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Test de Reproducción del Error progress_data</h1>";
echo "<p>Intentando reproducir el error exacto del hosting...</p>";

// Función para log seguro
function log_seguro($mensaje) {
    $timestamp = date('Y-m-d H:i:s');
    echo "<p>[$timestamp] $mensaje</p>";
    flush();
}

log_seguro("=== INICIO DEL TEST ===");

try {
    log_seguro("1. Verificando archivos necesarios...");
    
    // Verificar que los archivos existen
    $archivos_necesarios = [
        '../../config.php',
        __DIR__ . '/classes/statistics.php',
        __DIR__ . '/statistics.php',
        __DIR__ . '/index.php'
    ];
    
    foreach ($archivos_necesarios as $archivo) {
        if (file_exists($archivo)) {
            log_seguro("   ✓ Existe: $archivo");
        } else {
            log_seguro("   ✗ NO existe: $archivo");
            if (basename($archivo) === 'config.php') {
                log_seguro("   → Saltando carga de Moodle por falta de config.php");
                continue;
            }
        }
    }
    
    log_seguro("\n2. Intentando cargar Moodle (si está disponible)...");
    
    // Intentar cargar Moodle solo si config.php existe
    if (file_exists('../../config.php')) {
        try {
            require_once('../../config.php');
            log_seguro("   ✓ Moodle cargado correctamente");
        } catch (Exception $e) {
            log_seguro("   ⚠ Error al cargar Moodle: " . $e->getMessage());
        }
    } else {
        log_seguro("   → Simulando entorno sin Moodle");
        // Simular algunas funciones básicas de Moodle
        if (!function_exists('get_string')) {
            function get_string($key, $component = '') {
                return "[$component:$key]";
            }
        }
    }
    
    log_seguro("\n3. Cargando clase statistics...");
    
    if (file_exists(__DIR__ . '/classes/statistics.php')) {
        require_once(__DIR__ . '/classes/statistics.php');
        log_seguro("   ✓ classes/statistics.php incluido");
        
        if (class_exists('local_neuroopositor\\statistics')) {
            log_seguro("   ✓ Clase local_neuroopositor\\statistics existe");
        } else {
            log_seguro("   ✗ Clase local_neuroopositor\\statistics NO existe");
        }
    } else {
        log_seguro("   ✗ classes/statistics.php no encontrado");
    }
    
    log_seguro("\n4. Creando alias progress_data...");
    
    if (class_exists('local_neuroopositor\\statistics')) {
        // Crear el alias como lo hace index.php
        class_alias('local_neuroopositor\\statistics', 'progress_data');
        log_seguro("   ✓ Alias creado: class_alias('local_neuroopositor\\statistics', 'progress_data')");
        
        // Verificar que el alias funciona
        if (class_exists('progress_data')) {
            log_seguro("   ✓ Alias progress_data verificado y funciona");
        } else {
            log_seguro("   ✗ Alias progress_data NO funciona");
        }
    } else {
        log_seguro("   ✗ No se puede crear alias - clase original no existe");
    }
    
    log_seguro("\n5. Simulando acceso a statistics.php...");
    
    // Simular los parámetros que recibiría statistics.php
    $_GET['courseid'] = 0;
    $_GET['action'] = 'statistics';
    
    log_seguro("   Parámetros simulados: courseid=0, action=statistics");
    
    // Verificar el contenido de statistics.php antes de incluirlo
    if (file_exists(__DIR__ . '/statistics.php')) {
        $contenido_stats = file_get_contents(__DIR__ . '/statistics.php');
        
        // Buscar posibles problemas
        if (strpos($contenido_stats, 'progress_data::') !== false) {
            log_seguro("   ⚠ PROBLEMA ENCONTRADO: statistics.php contiene 'progress_data::'");
            
            // Mostrar las líneas problemáticas
            $lineas = explode("\n", $contenido_stats);
            foreach ($lineas as $num => $linea) {
                if (stripos($linea, 'progress_data::') !== false) {
                    log_seguro("     → Línea " . ($num + 1) . ": " . trim($linea));
                }
            }
        }
        
        if (preg_match('/local_neuroopositor\\\\progress_data/i', $contenido_stats)) {
            log_seguro("   ⚠ PROBLEMA ENCONTRADO: statistics.php contiene 'local_neuroopositor\\progress_data'");
            
            // Mostrar las líneas problemáticas
            $lineas = explode("\n", $contenido_stats);
            foreach ($lineas as $num => $linea) {
                if (stripos($linea, 'local_neuroopositor\\progress_data') !== false) {
                    log_seguro("     → Línea " . ($num + 1) . ": " . trim($linea));
                }
            }
        }
        
        // Contar alias
        $alias_count = substr_count($contenido_stats, "class_alias('local_neuroopositor\\statistics', 'progress_data')");
        log_seguro("   Número de alias en statistics.php: $alias_count");
        
        if ($alias_count > 1) {
            log_seguro("   ⚠ PROBLEMA: Múltiples alias detectados");
        }
    }
    
    log_seguro("\n6. Intentando incluir statistics.php (PUNTO CRÍTICO)...");
    
    // Este es el momento crítico donde puede ocurrir el error
    try {
        // Capturar cualquier salida o error
        ob_start();
        
        // Simular las variables que statistics.php espera
        $courseid = 0;
        $userid = 1; // Usuario simulado
        
        // Incluir statistics.php
        if (file_exists(__DIR__ . '/statistics.php')) {
            log_seguro("   Incluyendo statistics.php...");
            
            // En lugar de incluir directamente, vamos a verificar línea por línea
            $contenido = file_get_contents(__DIR__ . '/statistics.php');
            $lineas = explode("\n", $contenido);
            
            foreach ($lineas as $num => $linea) {
                $linea_trim = trim($linea);
                if (empty($linea_trim) || strpos($linea_trim, '//') === 0 || strpos($linea_trim, '/*') === 0) {
                    continue; // Saltar líneas vacías y comentarios
                }
                
                // Verificar líneas problemáticas
                if (stripos($linea, 'progress_data') !== false && 
                    stripos($linea, 'class_alias') === false) {
                    log_seguro("   ⚠ Línea problemática " . ($num + 1) . ": " . $linea_trim);
                    
                    // Analizar el tipo de problema
                    if (stripos($linea, 'progress_data::') !== false) {
                        log_seguro("     → PROBLEMA: Uso de progress_data como clase estática");
                    }
                    if (stripos($linea, 'local_neuroopositor\\progress_data') !== false) {
                        log_seguro("     → PROBLEMA: Referencia a namespace inexistente");
                    }
                    if (stripos($linea, 'new progress_data') !== false) {
                        log_seguro("     → PROBLEMA: Instanciación de progress_data");
                    }
                }
            }
            
            log_seguro("   ✓ Análisis de statistics.php completado");
        }
        
        $output = ob_get_clean();
        if (!empty($output)) {
            log_seguro("   Salida capturada: " . substr($output, 0, 200) . "...");
        }
        
    } catch (ParseError $e) {
        log_seguro("   ✗ ERROR DE SINTAXIS: " . $e->getMessage());
        log_seguro("     Archivo: " . $e->getFile());
        log_seguro("     Línea: " . $e->getLine());
    } catch (Error $e) {
        log_seguro("   ✗ ERROR FATAL: " . $e->getMessage());
        log_seguro("     Archivo: " . $e->getFile());
        log_seguro("     Línea: " . $e->getLine());
    } catch (Exception $e) {
        log_seguro("   ✗ EXCEPCIÓN: " . $e->getMessage());
        log_seguro("     Archivo: " . $e->getFile());
        log_seguro("     Línea: " . $e->getLine());
    }
    
} catch (Exception $e) {
    log_seguro("✗ ERROR GENERAL: " . $e->getMessage());
} catch (Error $e) {
    log_seguro("✗ ERROR FATAL GENERAL: " . $e->getMessage());
}

log_seguro("\n=== FIN DEL TEST ===");

echo "<h2>Test completado</h2>";
echo "<p>Si se reproduce el error, aparecerá arriba. Si no hay errores, el problema puede estar en otro lugar.</p>";
echo "<p><strong>Próximos pasos:</strong></p>";
echo "<ul>";
echo "<li>Ejecuta también <code>diagnostico_hosting.php</code> para un análisis completo</li>";
echo "<li>Revisa los logs del servidor web para errores adicionales</li>";
echo "<li>Verifica que no hay archivos de caché corruptos</li>";
echo "</ul>";

?>