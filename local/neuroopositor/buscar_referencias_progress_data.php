<?php
/**
 * Script para buscar todas las referencias a progress_data en el plugin.
 * Identifica usos problemáticos que pueden causar el error "Undefined constant".
 * 
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Configurar para mostrar todos los errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Búsqueda de Referencias a progress_data</h1>";
echo "<p>Analizando todos los archivos del plugin...</p>";

// Función para escanear directorios recursivamente
function escanear_directorio($directorio, $extension = '.php') {
    $archivos = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($directorio, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    
    foreach ($iterator as $archivo) {
        if ($archivo->isFile() && pathinfo($archivo, PATHINFO_EXTENSION) === ltrim($extension, '.')) {
            $archivos[] = $archivo->getPathname();
        }
    }
    
    return $archivos;
}

// Función para analizar un archivo
function analizar_archivo($ruta_archivo) {
    $resultados = [];
    
    if (!file_exists($ruta_archivo) || !is_readable($ruta_archivo)) {
        return $resultados;
    }
    
    $contenido = file_get_contents($ruta_archivo);
    $lineas = explode("\n", $contenido);
    
    foreach ($lineas as $numero_linea => $linea) {
        $linea_original = $linea;
        $linea_trim = trim($linea);
        
        // Saltar líneas vacías y comentarios
        if (empty($linea_trim) || 
            strpos($linea_trim, '//') === 0 || 
            strpos($linea_trim, '#') === 0 ||
            strpos($linea_trim, '/*') === 0 ||
            strpos($linea_trim, '*') === 0) {
            continue;
        }
        
        // Buscar referencias a progress_data
        if (stripos($linea, 'progress_data') !== false) {
            $tipo_problema = '';
            $es_problema = false;
            
            // Identificar el tipo de uso
            if (stripos($linea, "class_alias('local_neuroopositor\\statistics', 'progress_data')") !== false) {
                $tipo_problema = 'ALIAS_CORRECTO';
            } elseif (stripos($linea, 'progress_data::') !== false) {
                $tipo_problema = 'USO_ESTATICO';
                $es_problema = true;
            } elseif (preg_match('/local_neuroopositor\\\\progress_data/i', $linea)) {
                $tipo_problema = 'NAMESPACE_INCORRECTO';
                $es_problema = true;
            } elseif (stripos($linea, 'new progress_data') !== false) {
                $tipo_problema = 'INSTANCIACION';
                $es_problema = true;
            } elseif (preg_match('/\$progress_data\s*=/', $linea)) {
                $tipo_problema = 'VARIABLE_ASIGNACION';
            } elseif (preg_match('/\$progress_data\[/', $linea) || preg_match('/foreach\s*\(\s*\$progress_data/', $linea)) {
                $tipo_problema = 'VARIABLE_USO';
            } elseif (stripos($linea, "'progress_data'") !== false || stripos($linea, '"progress_data"') !== false) {
                $tipo_problema = 'STRING_LITERAL';
            } else {
                $tipo_problema = 'OTRO_USO';
                $es_problema = true; // Marcar como problemático para revisión manual
            }
            
            $resultados[] = [
                'archivo' => $ruta_archivo,
                'linea' => $numero_linea + 1,
                'contenido' => $linea_original,
                'tipo' => $tipo_problema,
                'es_problema' => $es_problema
            ];
        }
    }
    
    return $resultados;
}

// Función para mostrar resultados
function mostrar_resultados($resultados) {
    $problemas_encontrados = 0;
    $archivos_con_problemas = [];
    
    echo "<h2>Resultados del Análisis</h2>";
    
    // Agrupar por archivo
    $por_archivo = [];
    foreach ($resultados as $resultado) {
        $archivo_relativo = str_replace(__DIR__, '.', $resultado['archivo']);
        $por_archivo[$archivo_relativo][] = $resultado;
    }
    
    foreach ($por_archivo as $archivo => $referencias) {
        echo "<h3>📁 $archivo</h3>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%; margin-bottom: 20px;'>";
        echo "<tr style='background-color: #f0f0f0;'>";
        echo "<th>Línea</th><th>Tipo</th><th>Contenido</th><th>Estado</th>";
        echo "</tr>";
        
        $tiene_problemas = false;
        
        foreach ($referencias as $ref) {
            $color_fondo = '';
            $icono = '';
            
            switch ($ref['tipo']) {
                case 'ALIAS_CORRECTO':
                    $color_fondo = 'background-color: #d4edda;'; // Verde claro
                    $icono = '✅';
                    break;
                case 'VARIABLE_ASIGNACION':
                case 'VARIABLE_USO':
                    $color_fondo = 'background-color: #fff3cd;'; // Amarillo claro
                    $icono = '📝';
                    break;
                case 'STRING_LITERAL':
                    $color_fondo = 'background-color: #e2e3e5;'; // Gris claro
                    $icono = '📄';
                    break;
                default:
                    if ($ref['es_problema']) {
                        $color_fondo = 'background-color: #f8d7da;'; // Rojo claro
                        $icono = '❌';
                        $problemas_encontrados++;
                        $tiene_problemas = true;
                    } else {
                        $color_fondo = 'background-color: #e2e3e5;';
                        $icono = '❓';
                    }
                    break;
            }
            
            echo "<tr style='$color_fondo'>";
            echo "<td>{$ref['linea']}</td>";
            echo "<td>$icono {$ref['tipo']}</td>";
            echo "<td><code>" . htmlspecialchars(trim($ref['contenido'])) . "</code></td>";
            echo "<td>" . ($ref['es_problema'] ? 'PROBLEMÁTICO' : 'OK') . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        if ($tiene_problemas) {
            $archivos_con_problemas[] = $archivo;
        }
    }
    
    // Resumen
    echo "<h2>📊 Resumen</h2>";
    echo "<div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<p><strong>Total de referencias encontradas:</strong> " . count($resultados) . "</p>";
    echo "<p><strong>Referencias problemáticas:</strong> " . $problemas_encontrados . "</p>";
    echo "<p><strong>Archivos analizados:</strong> " . count($por_archivo) . "</p>";
    
    if ($problemas_encontrados > 0) {
        echo "<p style='color: red;'><strong>⚠️ PROBLEMAS DETECTADOS en los siguientes archivos:</strong></p>";
        echo "<ul>";
        foreach ($archivos_con_problemas as $archivo) {
            echo "<li><code>$archivo</code></li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color: green;'><strong>✅ No se detectaron problemas obvios</strong></p>";
    }
    echo "</div>";
    
    return $problemas_encontrados;
}

// Función para generar reporte de texto
function generar_reporte_texto($resultados) {
    $reporte = "=== REPORTE DE REFERENCIAS A progress_data ===\n";
    $reporte .= "Fecha: " . date('Y-m-d H:i:s') . "\n\n";
    
    $problemas = array_filter($resultados, function($r) { return $r['es_problema']; });
    
    $reporte .= "RESUMEN:\n";
    $reporte .= "- Total referencias: " . count($resultados) . "\n";
    $reporte .= "- Referencias problemáticas: " . count($problemas) . "\n\n";
    
    if (count($problemas) > 0) {
        $reporte .= "PROBLEMAS DETECTADOS:\n";
        foreach ($problemas as $problema) {
            $archivo_relativo = str_replace(__DIR__, '.', $problema['archivo']);
            $reporte .= "\n- Archivo: $archivo_relativo\n";
            $reporte .= "  Línea: {$problema['linea']}\n";
            $reporte .= "  Tipo: {$problema['tipo']}\n";
            $reporte .= "  Código: " . trim($problema['contenido']) . "\n";
        }
    }
    
    $reporte .= "\n=== FIN DEL REPORTE ===\n";
    
    file_put_contents(__DIR__ . '/reporte_progress_data.txt', $reporte);
    
    return count($problemas);
}

// EJECUCIÓN PRINCIPAL
echo "<p>Iniciando análisis...</p>";

$directorio_plugin = __DIR__;
echo "<p>Directorio del plugin: <code>$directorio_plugin</code></p>";

// Obtener todos los archivos PHP
$archivos_php = escanear_directorio($directorio_plugin, 'php');
echo "<p>Archivos PHP encontrados: " . count($archivos_php) . "</p>";

// Analizar cada archivo
$todos_los_resultados = [];
foreach ($archivos_php as $archivo) {
    $resultados_archivo = analizar_archivo($archivo);
    $todos_los_resultados = array_merge($todos_los_resultados, $resultados_archivo);
}

// Mostrar resultados
if (count($todos_los_resultados) > 0) {
    $problemas_count = mostrar_resultados($todos_los_resultados);
    
    // Generar reporte de texto
    generar_reporte_texto($todos_los_resultados);
    
    echo "<h2>📄 Reporte Generado</h2>";
    echo "<p>Se ha generado un reporte detallado en: <code>reporte_progress_data.txt</code></p>";
    
    if ($problemas_count > 0) {
        echo "<div style='background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
        echo "<h3>🚨 ACCIÓN REQUERIDA</h3>";
        echo "<p>Se encontraron <strong>$problemas_count problemas</strong> que pueden estar causando el error 'Undefined constant progress_data'.</p>";
        echo "<p>Revisa los archivos marcados en rojo y corrige los usos problemáticos.</p>";
        echo "</div>";
    }
} else {
    echo "<p>No se encontraron referencias a 'progress_data' en ningún archivo.</p>";
}

echo "<h2>✅ Análisis Completado</h2>";
echo "<p>Revisa los resultados arriba y el archivo <code>reporte_progress_data.txt</code> para más detalles.</p>";

?>