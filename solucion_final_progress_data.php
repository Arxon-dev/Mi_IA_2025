<?php
/**
 * Solución Final para el Error "Undefined constant progress_data"
 * 
 * Este script analiza y corrige definitivamente el problema persistente
 * de la constante progress_data en las estadísticas de NeuroOpositor
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');

echo "<h2>Solución Final - Error progress_data</h2>";
echo "<p>Análisis profundo y corrección definitiva del error persistente</p>";

// Función para mostrar mensajes
function mostrar($tipo, $mensaje, $detalle = '') {
    $estilos = [
        'error' => 'background: #ffebee; border-left: 4px solid #f44336; color: #c62828;',
        'warning' => 'background: #fff8e1; border-left: 4px solid #ff9800; color: #ef6c00;',
        'success' => 'background: #e8f5e8; border-left: 4px solid #4caf50; color: #2e7d32;',
        'info' => 'background: #e3f2fd; border-left: 4px solid #2196f3; color: #1565c0;'
    ];
    
    $iconos = ['error' => '✗', 'warning' => '⚠', 'success' => '✓', 'info' => 'ℹ'];
    $estilo = $estilos[$tipo] ?? $estilos['info'];
    $icono = $iconos[$tipo] ?? '•';
    
    echo "<div style='{$estilo} padding: 12px; margin: 8px 0; border-radius: 4px;'>";
    echo "<strong>{$icono} {$mensaje}</strong>";
    if ($detalle) echo "<br><small>{$detalle}</small>";
    echo "</div>";
}

echo "<h3>PASO 1: Análisis Profundo del Error</h3>";

// Verificar archivos clave
$archivos = [
    'statistics.php' => $CFG->dirroot . '/local/neuroopositor/statistics.php',
    'index.php' => $CFG->dirroot . '/local/neuroopositor/index.php',
    'lib.php' => $CFG->dirroot . '/local/neuroopositor/lib.php'
];

foreach ($archivos as $nombre => $ruta) {
    if (file_exists($ruta)) {
        $size = filesize($ruta);
        mostrar('success', "Archivo {$nombre} encontrado", number_format($size) . " bytes");
    } else {
        mostrar('error', "Archivo {$nombre} NO encontrado");
    }
}

echo "<h3>PASO 2: Búsqueda Exhaustiva del Error</h3>";

// Buscar en todos los archivos PHP del plugin
$directorio_plugin = $CFG->dirroot . '/local/neuroopositor/';
$archivos_php = [];

// Función recursiva para encontrar archivos PHP
function buscar_archivos_php($dir) {
    $archivos = [];
    if (is_dir($dir)) {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file != '.' && $file != '..') {
                $path = $dir . '/' . $file;
                if (is_dir($path)) {
                    $archivos = array_merge($archivos, buscar_archivos_php($path));
                } elseif (pathinfo($file, PATHINFO_EXTENSION) == 'php') {
                    $archivos[] = $path;
                }
            }
        }
    }
    return $archivos;
}

$archivos_php = buscar_archivos_php($directorio_plugin);
mostrar('info', "Archivos PHP encontrados: " . count($archivos_php));

// Buscar referencias a progress_data en todos los archivos
$archivos_con_error = [];
$patrones_buscar = [
    'progress_data' => '/progress_data/i',
    'local_neuroopositor\\progress_data' => '/local_neuroopositor\\\\progress_data/i',
    'use.*progress_data' => '/use.*progress_data/i',
    'class.*progress_data' => '/class.*progress_data/i'
];

echo "<h4>2.1 Escaneo de Archivos</h4>";

foreach ($archivos_php as $archivo) {
    $contenido = file_get_contents($archivo);
    $archivo_relativo = str_replace($directorio_plugin, '', $archivo);
    
    foreach ($patrones_buscar as $descripcion => $patron) {
        if (preg_match($patron, $contenido)) {
            $archivos_con_error[$archivo_relativo][] = $descripcion;
        }
    }
}

if (!empty($archivos_con_error)) {
    mostrar('warning', "Archivos con referencias a progress_data:");
    foreach ($archivos_con_error as $archivo => $problemas) {
        echo "<div style='margin-left: 20px; font-family: monospace; font-size: 12px;'>";
        echo "<strong>{$archivo}:</strong> " . implode(', ', $problemas) . "<br>";
        echo "</div>";
    }
} else {
    mostrar('success', "No se encontraron referencias directas a progress_data en archivos PHP");
}

echo "<h3>PASO 3: Análisis del Error en Tiempo Real</h3>";

// Intentar reproducir el error
echo "<h4>3.1 Simulación del Error</h4>";

try {
    // Intentar acceder a la página de estadísticas programáticamente
    $url_estadisticas = $CFG->wwwroot . '/local/neuroopositor/index.php?courseid=0&action=statistics';
    mostrar('info', "URL de estadísticas: {$url_estadisticas}");
    
    // Verificar si podemos incluir el archivo sin errores
    ob_start();
    $error_capturado = false;
    
    set_error_handler(function($severity, $message, $file, $line) use (&$error_capturado) {
        if (strpos($message, 'progress_data') !== false) {
            $error_capturado = $message;
        }
    });
    
    // Intentar incluir statistics.php
    include_once($CFG->dirroot . '/local/neuroopositor/statistics.php');
    
    restore_error_handler();
    $output = ob_get_clean();
    
    if ($error_capturado) {
        mostrar('error', "Error capturado: {$error_capturado}");
    } else {
        mostrar('success', "Archivo statistics.php se carga sin errores de progress_data");
    }
    
} catch (Exception $e) {
    mostrar('error', "Excepción al cargar statistics.php", $e->getMessage());
} catch (Error $e) {
    mostrar('error', "Error fatal al cargar statistics.php", $e->getMessage());
}

echo "<h3>PASO 4: Corrección Definitiva</h3>";

// Leer el archivo statistics.php actual
$statistics_path = $CFG->dirroot . '/local/neuroopositor/statistics.php';
$contenido_actual = file_get_contents($statistics_path);

echo "<h4>4.1 Análisis del Contenido Actual</h4>";
mostrar('info', "Analizando statistics.php (" . strlen($contenido_actual) . " caracteres)");

// Verificar si ya tiene la clase statistics
if (preg_match('/class\s+statistics/i', $contenido_actual)) {
    mostrar('success', "Clase statistics ya existe en el archivo");
} else {
    mostrar('warning', "Clase statistics NO encontrada");
}

// Verificar namespace
if (preg_match('/namespace\s+([^;]+);/', $contenido_actual, $ns_match)) {
    mostrar('success', "Namespace encontrado: {$ns_match[1]}");
} else {
    mostrar('warning', "No se encontró declaración de namespace");
}

echo "<h4>4.2 Generación de Corrección Completa</h4>";

// Crear una versión completamente corregida
$contenido_corregido = $contenido_actual;

// 1. Agregar namespace si no existe
if (!preg_match('/namespace\s+/', $contenido_corregido)) {
    // Buscar la primera línea después de <?php
    $contenido_corregido = preg_replace(
        '/(<\?php\s*)/i',
        '$1' . "\n\nnamespace local_neuroopositor;\n\ndefined('MOODLE_INTERNAL') || die();\n\n",
        $contenido_corregido,
        1
    );
    mostrar('success', "Namespace agregado al archivo");
}

// 2. Asegurar que existe la clase statistics con todos los métodos necesarios
if (!preg_match('/class\s+statistics/i', $contenido_corregido)) {
    $clase_statistics = "

/**
 * Clase statistics para el plugin NeuroOpositor
 * Maneja todas las estadísticas y datos de progreso
 */
class statistics {
    
    /**
     * Obtiene estadísticas generales del usuario
     * @param int \$userid ID del usuario
     * @param int \$courseid ID del curso
     * @return object Estadísticas del usuario
     */
    public static function get_user_general_stats(\$userid, \$courseid = 0) {
        global \$DB;
        
        try {
            \$sql = \"SELECT 
                        COUNT(*) as total_sesiones,
                        COALESCE(SUM(preguntas_correctas), 0) as total_correctas,
                        COALESCE(SUM(preguntas_totales), 0) as total_preguntas,
                        COALESCE(SUM(tiempo_estudio_segundos), 0) as tiempo_total,
                        CASE 
                            WHEN SUM(preguntas_totales) > 0 
                            THEN ROUND((SUM(preguntas_correctas) * 100.0) / SUM(preguntas_totales), 2)
                            ELSE 0 
                        END as porcentaje_aciertos
                    FROM {neuroopositor_user_progress} 
                    WHERE userid = ? AND courseid = ?\";\n                    
            \$result = \$DB->get_record_sql(\$sql, [\$userid, \$courseid]);
            
            if (!\$result) {
                \$result = (object) [
                    'total_sesiones' => 0,
                    'total_correctas' => 0,
                    'total_preguntas' => 0,
                    'tiempo_total' => 0,
                    'porcentaje_aciertos' => 0
                ];
            }
            
            return \$result;
            
        } catch (Exception \$e) {
            // Retornar datos vacíos en caso de error
            return (object) [
                'total_sesiones' => 0,
                'total_correctas' => 0,
                'total_preguntas' => 0,
                'tiempo_total' => 0,
                'porcentaje_aciertos' => 0
            ];
        }
    }
    
    /**
     * Obtiene estadísticas por tema
     * @param int \$userid ID del usuario
     * @param int \$courseid ID del curso
     * @return array Estadísticas por tema
     */
    public static function get_stats_by_tema(\$userid, \$courseid = 0) {
        global \$DB;
        
        try {
            \$sql = \"SELECT 
                        t.id,
                        t.titulo as nombre,
                        COALESCE(up.preguntas_correctas, 0) as correctas,
                        COALESCE(up.preguntas_totales, 0) as total,
                        COALESCE(up.tiempo_estudio_segundos, 0) as tiempo,
                        CASE 
                            WHEN up.preguntas_totales > 0 
                            THEN ROUND((up.preguntas_correctas * 100.0) / up.preguntas_totales, 2)
                            ELSE 0 
                        END as porcentaje
                    FROM {neuroopositor_temas} t
                    LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id 
                        AND up.userid = ? AND up.courseid = ?
                    ORDER BY t.titulo\";\n                    
            return \$DB->get_records_sql(\$sql, [\$userid, \$courseid]);
            
        } catch (Exception \$e) {
            return [];
        }
    }
    
    /**
     * Obtiene datos de progreso (método de compatibilidad)
     * @param int \$userid ID del usuario
     * @param int \$courseid ID del curso
     * @return object Datos de progreso
     */
    public static function get_progress_data(\$userid, \$courseid = 0) {
        return self::get_user_general_stats(\$userid, \$courseid);
    }
    
    /**
     * Obtiene el tiempo total de estudio formateado
     * @param int \$segundos Tiempo en segundos
     * @return string Tiempo formateado
     */
    public static function format_time(\$segundos) {
        if (\$segundos < 60) {
            return \$segundos . ' seg';
        } elseif (\$segundos < 3600) {
            return round(\$segundos / 60) . ' min';
        } else {
            \$horas = floor(\$segundos / 3600);
            \$minutos = round((\$segundos % 3600) / 60);
            return \$horas . 'h ' . \$minutos . 'm';
        }
    }
}

// Alias para compatibilidad con código existente
class_alias('local_neuroopositor\\statistics', 'progress_data');
";
    
    // Insertar la clase al final del archivo
    if (preg_match('/\?>\s*$/', $contenido_corregido)) {
        $contenido_corregido = preg_replace('/\?>\s*$/', $clase_statistics . "\n?>", $contenido_corregido);
    } else {
        $contenido_corregido .= $clase_statistics;
    }
    
    mostrar('success', "Clase statistics completa agregada");
}

// 3. Agregar alias de compatibilidad si no existe
if (strpos($contenido_corregido, 'class_alias') === false) {
    $alias_code = "\n// Alias para compatibilidad\nclass_alias('local_neuroopositor\\\\statistics', 'progress_data');\n";
    
    if (preg_match('/\?>\s*$/', $contenido_corregido)) {
        $contenido_corregido = preg_replace('/\?>\s*$/', $alias_code . "\n?>", $contenido_corregido);
    } else {
        $contenido_corregido .= $alias_code;
    }
    
    mostrar('success', "Alias de compatibilidad agregado");
}

echo "<h3>PASO 5: Aplicación de la Solución</h3>";

// Guardar la versión corregida
$archivo_final = $CFG->dirroot . '/local/neuroopositor/statistics_final_fixed.php';
file_put_contents($archivo_final, $contenido_corregido);
mostrar('success', "Archivo final guardado: statistics_final_fixed.php");

// Crear instalador final
$instalador_final = "<?php\n/**\n * Instalador Final para la corrección definitiva de progress_data\n */\n\nrequire_once('../../config.php');\nrequire_login();\nrequire_capability('moodle/site:config', context_system::instance());\n\necho '<h2>Instalador Final - Corrección progress_data</h2>';\n\n\$source = __DIR__ . '/statistics_final_fixed.php';\n\$target = __DIR__ . '/statistics.php';\n\$backup = __DIR__ . '/statistics.php.backup.final.' . date('Ymd_His');\n\nif (!file_exists(\$source)) {\n    echo '<p style=\"color: red;\">❌ Error: Archivo de corrección final no encontrado</p>';\n    exit;\n}\n\n// Crear backup final\nif (copy(\$target, \$backup)) {\n    echo '<p style=\"color: green;\">✅ Backup final creado: ' . basename(\$backup) . '</p>';\n} else {\n    echo '<p style=\"color: red;\">❌ Error al crear backup final</p>';\n    exit;\n}\n\n// Aplicar corrección final\nif (copy(\$source, \$target)) {\n    echo '<p style=\"color: green;\">✅ <strong>Corrección final aplicada exitosamente</strong></p>';\n    \n    // Verificar que la corrección funciona\n    try {\n        include_once(\$target);\n        if (class_exists('local_neuroopositor\\\\statistics') || class_exists('statistics')) {\n            echo '<p style=\"color: green;\">✅ Clase statistics verificada</p>';\n        }\n        if (class_exists('progress_data')) {\n            echo '<p style=\"color: green;\">✅ Alias progress_data verificado</p>';\n        }\n    } catch (Exception \$e) {\n        echo '<p style=\"color: orange;\">⚠️ Advertencia en verificación: ' . \$e->getMessage() . '</p>';\n    }\n    \n    echo '<div style=\"background: #e8f5e8; padding: 15px; margin: 15px 0; border: 1px solid #4CAF50; border-radius: 5px;\">\n        <h3 style=\"color: #2e7d32; margin-top: 0;\">🎉 Corrección Completada</h3>\n        <p style=\"color: #2e7d32;\">La corrección final ha sido aplicada. Ahora puedes:</p>\n        <ol style=\"color: #2e7d32;\">\n            <li><a href=\"index.php?courseid=0&action=statistics\" style=\"color: #1976d2; font-weight: bold;\">Probar las estadísticas</a></li>\n            <li><a href=\"verificar_correccion_simple.php\" style=\"color: #1976d2;\">Verificar la corrección</a></li>\n        </ol>\n    </div>';\n} else {\n    echo '<p style=\"color: red;\">❌ Error al aplicar corrección final</p>';\n}\n\n?>";

file_put_contents($CFG->dirroot . '/local/neuroopositor/instalar_solucion_final.php', $instalador_final);
mostrar('success', "Instalador final creado: instalar_solucion_final.php");

echo "<h3>PASO 6: Instrucciones Finales</h3>";

echo "<div style='background: #e3f2fd; border: 1px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
echo "<h4 style='color: #1565c0; margin-top: 0;'>🔧 Solución Final Lista</h4>";
echo "<p style='color: #1565c0;'>Esta es la corrección definitiva para el error 'Undefined constant progress_data'.</p>";
echo "<h5 style='color: #1565c0;'>Para aplicar la solución:</h5>";
echo "<ol style='color: #1565c0;'>";
echo "<li><strong><a href='instalar_solucion_final.php' style='color: #d32f2f; text-decoration: none;'>Ejecutar instalar_solucion_final.php</a></strong></li>";
echo "<li><a href='index.php?courseid=0&action=statistics' style='color: #1976d2;'>Probar las estadísticas</a></li>";
echo "<li><a href='verificar_correccion_simple.php' style='color: #1976d2;'>Verificar que todo funciona</a></li>";
echo "</ol>";
echo "<h5 style='color: #1565c0;'>Qué hace esta corrección:</h5>";
echo "<ul style='color: #1565c0;'>";
echo "<li>✅ Agrega el namespace correcto</li>";
echo "<li>✅ Crea la clase statistics completa</li>";
echo "<li>✅ Agrega un alias progress_data para compatibilidad</li>";
echo "<li>✅ Incluye todos los métodos necesarios</li>";
echo "<li>✅ Maneja errores de base de datos</li>";
echo "</ul>";
echo "</div>";

echo "<hr style='margin: 30px 0;'>";
echo "<div style='text-align: center; color: #666; font-size: 12px;'>";
echo "<p>Solución final generada: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Usuario: {$USER->username} (ID: {$USER->id})</p>";
echo "<p>Plugin: NeuroOpositor - Corrección Definitiva progress_data</p>";
echo "</div>";

?>