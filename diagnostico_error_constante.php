<?php
/**
 * Diagnóstico específico para el error "Undefined constant progress_data"
 * 
 * Este script analiza el error específico y proporciona una solución directa
 * sin usar funciones deshabilitadas como shell_exec()
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');

echo "<h2>Diagnóstico Error Constante progress_data</h2>";
echo "<p>Análisis específico del error en las estadísticas de NeuroOpositor</p>";

// Función para mostrar mensajes
function msg($tipo, $texto) {
    $colores = ['error' => '#dc3545', 'warning' => '#ffc107', 'success' => '#28a745', 'info' => '#17a2b8'];
    $color = $colores[$tipo] ?? '#6c757d';
    $icono = ['error' => '✗', 'warning' => '⚠', 'success' => '✓', 'info' => 'ℹ'][$tipo] ?? '•';
    echo "<div style='padding: 8px 12px; margin: 5px 0; background: {$color}15; border-left: 3px solid {$color}; color: {$color};'>";
    echo "{$icono} {$texto}";
    echo "</div>";
}

echo "<h3>1. Verificación de Archivos</h3>";

$archivos_clave = [
    'statistics.php' => $CFG->dirroot . '/local/neuroopositor/statistics.php',
    'lib.php' => $CFG->dirroot . '/local/neuroopositor/lib.php',
    'index.php' => $CFG->dirroot . '/local/neuroopositor/index.php',
    'classes/' => $CFG->dirroot . '/local/neuroopositor/classes/'
];

foreach ($archivos_clave as $nombre => $ruta) {
    if (file_exists($ruta)) {
        $size = is_dir($ruta) ? 'directorio' : number_format(filesize($ruta)) . ' bytes';
        msg('success', "{$nombre}: existe ({$size})");
    } else {
        msg('error', "{$nombre}: NO existe");
    }
}

echo "<h3>2. Análisis del Error progress_data</h3>";

$statistics_file = $CFG->dirroot . '/local/neuroopositor/statistics.php';

if (!file_exists($statistics_file)) {
    msg('error', 'Archivo statistics.php no encontrado');
    exit;
}

$content = file_get_contents($statistics_file);
msg('info', 'Analizando statistics.php (' . strlen($content) . ' caracteres)');

// Buscar el error específico
$error_patterns = [
    'progress_data' => '/progress_data/i',
    'local_neuroopositor\\progress_data' => '/local_neuroopositor\\\\progress_data/i',
    'use progress_data' => '/use.*progress_data/i',
    'class progress_data' => '/class\s+progress_data/i',
    'new progress_data' => '/new\s+progress_data/i'
];

echo "<h4>2.1 Búsqueda de Patrones Problemáticos</h4>";

$problemas = [];
foreach ($error_patterns as $descripcion => $patron) {
    $matches = [];
    preg_match_all($patron, $content, $matches, PREG_OFFSET_CAPTURE);
    
    if (count($matches[0]) > 0) {
        $problemas[$descripcion] = $matches[0];
        msg('warning', "{$descripcion}: " . count($matches[0]) . ' ocurrencias');
        
        // Mostrar contexto de la primera ocurrencia
        $pos = $matches[0][0][1];
        $inicio = max(0, $pos - 50);
        $fin = min(strlen($content), $pos + 100);
        $contexto = substr($content, $inicio, $fin - $inicio);
        
        echo "<div style='background: #f8f9fa; padding: 8px; margin: 5px 0 15px 20px; font-family: monospace; font-size: 11px; border: 1px solid #dee2e6;'>";
        echo "<strong>Contexto (línea aprox. " . (substr_count(substr($content, 0, $pos), "\n") + 1) . "):</strong><br>";
        echo htmlspecialchars($contexto);
        echo "</div>";
    }
}

if (empty($problemas)) {
    msg('success', 'No se encontraron referencias directas a progress_data');
}

echo "<h4>2.2 Análisis de Estructura</h4>";

// Verificar namespace
if (preg_match('/namespace\s+([^;]+);/', $content, $ns_match)) {
    msg('success', 'Namespace encontrado: ' . $ns_match[1]);
} else {
    msg('warning', 'No se encontró declaración de namespace');
}

// Verificar clases definidas
$clases = [];
preg_match_all('/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/i', $content, $class_matches);
if (count($class_matches[1]) > 0) {
    $clases = $class_matches[1];
    msg('success', 'Clases encontradas: ' . implode(', ', $clases));
} else {
    msg('warning', 'No se encontraron definiciones de clases');
}

echo "<h3>3. Generación de Solución</h3>";

$solucion_generada = false;
$content_fixed = $content;

// Solución 1: Reemplazar referencias incorrectas
if (!empty($problemas)) {
    echo "<h4>3.1 Aplicando Correcciones</h4>";
    
    $reemplazos = [
        '/local_neuroopositor\\\\progress_data/i' => 'local_neuroopositor\\statistics',
        '/progress_data::/i' => 'statistics::',
        '/new\s+progress_data/i' => 'new statistics',
        '/use\s+.*progress_data/i' => 'use local_neuroopositor\\statistics'
    ];
    
    $cambios = 0;
    foreach ($reemplazos as $buscar => $reemplazar) {
        $antes = $content_fixed;
        $content_fixed = preg_replace($buscar, $reemplazar, $content_fixed);
        if ($antes !== $content_fixed) {
            $cambios++;
            msg('success', "Reemplazado: {$buscar} → {$reemplazar}");
        }
    }
    
    if ($cambios > 0) {
        $solucion_generada = true;
        msg('success', "Total de reemplazos: {$cambios}");
    }
}

// Solución 2: Asegurar que existe la clase statistics
if (!in_array('statistics', $clases)) {
    echo "<h4>3.2 Agregando Clase statistics</h4>";
    
    $class_code = "

/**
 * Clase statistics para el plugin NeuroOpositor
 * Reemplaza las referencias a progress_data
 */
class statistics {
    
    /**
     * Obtiene estadísticas generales del usuario
     */
    public static function get_user_general_stats(\$userid, \$courseid = 0) {
        global \$DB;
        
        try {
            \$sql = \"SELECT 
                        COUNT(*) as total_sesiones,
                        COALESCE(SUM(preguntas_correctas), 0) as total_correctas,
                        COALESCE(SUM(preguntas_totales), 0) as total_preguntas,
                        COALESCE(SUM(tiempo_estudio_segundos), 0) as tiempo_total,
                        COALESCE(AVG(preguntas_correctas), 0) as promedio_correctas
                    FROM {neuroopositor_user_progress} 
                    WHERE userid = ? AND courseid = ?\";\n                    
            return \$DB->get_record_sql(\$sql, [\$userid, \$courseid]);
        } catch (Exception \$e) {
            // Retornar datos vacíos en caso de error
            return (object) [
                'total_sesiones' => 0,
                'total_correctas' => 0,
                'total_preguntas' => 0,
                'tiempo_total' => 0,
                'promedio_correctas' => 0
            ];
        }
    }
    
    /**
     * Obtiene estadísticas por tema
     */
    public static function get_stats_by_tema(\$userid, \$courseid = 0) {
        global \$DB;
        
        try {
            \$sql = \"SELECT 
                        t.id,
                        t.titulo as nombre,
                        COALESCE(up.preguntas_correctas, 0) as correctas,
                        COALESCE(up.preguntas_totales, 0) as total,
                        COALESCE(up.tiempo_estudio_segundos, 0) as tiempo
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
     * Obtiene datos de progreso (compatibilidad)
     */
    public static function get_progress_data(\$userid, \$courseid = 0) {
        return self::get_user_general_stats(\$userid, \$courseid);
    }
}
";
    
    // Insertar la clase al final del archivo, antes del cierre de PHP
    if (preg_match('/\?>\s*$/', $content_fixed)) {
        $content_fixed = preg_replace('/\?>\s*$/', $class_code . "\n?>", $content_fixed);
    } else {
        $content_fixed .= $class_code;
    }
    
    $solucion_generada = true;
    msg('success', 'Clase statistics agregada al archivo');
}

echo "<h3>4. Guardado de Solución</h3>";

if ($solucion_generada) {
    $archivo_solucion = $CFG->dirroot . '/local/neuroopositor/statistics_fixed_progress_data.php';
    
    if (file_put_contents($archivo_solucion, $content_fixed)) {
        msg('success', 'Archivo de solución guardado: statistics_fixed_progress_data.php');
        
        // Crear instalador simple
        $instalador = "<?php\n/**\n * Instalador para la corrección de progress_data\n */\n\nrequire_once('../../config.php');\nrequire_login();\nrequire_capability('moodle/site:config', context_system::instance());\n\necho '<h2>Instalador Corrección progress_data</h2>';\n\n\$source = __DIR__ . '/statistics_fixed_progress_data.php';\n\$target = __DIR__ . '/statistics.php';\n\$backup = __DIR__ . '/statistics.php.backup.' . date('Ymd_His');\n\nif (!file_exists(\$source)) {\n    echo '<p style=\"color: red;\">Error: Archivo de corrección no encontrado</p>';\n    exit;\n}\n\n// Crear backup\nif (copy(\$target, \$backup)) {\n    echo '<p style=\"color: green;\">✓ Backup creado: ' . basename(\$backup) . '</p>';\n} else {\n    echo '<p style=\"color: red;\">Error al crear backup</p>';\n    exit;\n}\n\n// Aplicar corrección\nif (copy(\$source, \$target)) {\n    echo '<p style=\"color: green;\">✓ Corrección aplicada exitosamente</p>';\n    echo '<p><strong>Prueba la corrección:</strong></p>';\n    echo '<p><a href=\"index.php?courseid=0&action=statistics\" style=\"background: #007cba; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;\">Ir a Estadísticas</a></p>';\n} else {\n    echo '<p style=\"color: red;\">Error al aplicar corrección</p>';\n}\n\n?>";
        
        $instalador_path = $CFG->dirroot . '/local/neuroopositor/instalar_fix_progress_data.php';
        file_put_contents($instalador_path, $instalador);
        
        msg('success', 'Instalador creado: instalar_fix_progress_data.php');
        
        echo "<div style='background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
        echo "<h4 style='color: #155724; margin-top: 0;'>✓ Solución Lista</h4>";
        echo "<p style='color: #155724;'>Para aplicar la corrección:</p>";
        echo "<ol style='color: #155724;'>";
        echo "<li>Ejecutar: <a href='instalar_fix_progress_data.php' style='color: #0c5460;'>instalar_fix_progress_data.php</a></li>";
        echo "<li>Probar: <a href='index.php?courseid=0&action=statistics' style='color: #0c5460;'>Página de estadísticas</a></li>";
        echo "</ol>";
        echo "</div>";
        
    } else {
        msg('error', 'Error al guardar archivo de solución');
    }
} else {
    msg('warning', 'No se generó ninguna solución automática');
    
    echo "<div style='background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
    echo "<h4 style='color: #856404; margin-top: 0;'>⚠ Revisión Manual Necesaria</h4>";
    echo "<p style='color: #856404;'>El error puede requerir análisis manual. Posibles causas:</p>";
    echo "<ul style='color: #856404;'>";
    echo "<li>Referencia a clase inexistente en otro archivo</li>";
    echo "<li>Error en la configuración del autoloader</li>";
    echo "<li>Problema en la estructura de namespaces</li>";
    echo "</ul>";
    echo "</div>";
}

echo "<h3>5. Información de Depuración</h3>";

echo "<details style='margin: 10px 0;'>";
echo "<summary style='cursor: pointer; padding: 5px; background: #f8f9fa; border: 1px solid #dee2e6;'>Ver información técnica</summary>";
echo "<div style='padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6; font-family: monospace; font-size: 12px;'>";
echo "<strong>Ruta del plugin:</strong> " . $CFG->dirroot . "/local/neuroopositor/<br>";
echo "<strong>URL base:</strong> " . $CFG->wwwroot . "/local/neuroopositor/<br>";
echo "<strong>Usuario actual:</strong> " . $USER->username . " (ID: {$USER->id})<br>";
echo "<strong>Timestamp:</strong> " . date('Y-m-d H:i:s') . "<br>";
echo "<strong>Versión PHP:</strong> " . PHP_VERSION . "<br>";
echo "<strong>Versión Moodle:</strong> " . $CFG->version . "<br>";
echo "</div>";
echo "</details>";

echo "<hr style='margin: 20px 0;'>";
echo "<p style='text-align: center; color: #6c757d; font-size: 12px;'>";
echo "Diagnóstico completado: " . date('Y-m-d H:i:s');
echo "</p>";

?>