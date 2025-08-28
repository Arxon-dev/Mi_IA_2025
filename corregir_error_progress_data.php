<?php
/**
 * Script para corregir el error "Undefined constant progress_data" en NeuroOpositor
 * 
 * Este script identifica y corrige el problema de la constante progress_data
 * que está causando el error en las estadísticas del plugin.
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');

echo "<h2>Corrección Error progress_data - NeuroOpositor</h2>";
echo "<p>Este script corrige el error de constante indefinida progress_data</p>";

// Función para mostrar mensajes con estilo
function mostrar_mensaje($tipo, $mensaje) {
    $color = ($tipo == 'error') ? '#ff4444' : (($tipo == 'warning') ? '#ff8800' : '#44aa44');
    echo "<div style='padding: 10px; margin: 5px 0; background-color: {$color}22; border-left: 4px solid {$color}; color: {$color};'>";
    echo ($tipo == 'error' ? '✗' : ($tipo == 'warning' ? '⚠' : '✓')) . " {$mensaje}";
    echo "</div>";
}

echo "<h3>PASO 1: Diagnóstico del Error</h3>";

// Verificar conexión a BD
try {
    $DB->get_manager();
    mostrar_mensaje('success', 'Conexión a BD: ' . $CFG->dbtype);
    mostrar_mensaje('success', 'Prefijo de tablas: ' . $CFG->prefix);
} catch (Exception $e) {
    mostrar_mensaje('error', 'Error de conexión: ' . $e->getMessage());
    exit;
}

echo "<h3>PASO 2: Análisis del Archivo statistics.php</h3>";

$statistics_path = $CFG->dirroot . '/local/neuroopositor/statistics.php';

if (!file_exists($statistics_path)) {
    mostrar_mensaje('error', 'Archivo statistics.php no encontrado');
    exit;
}

$content = file_get_contents($statistics_path);
mostrar_mensaje('success', 'Archivo statistics.php leído (' . strlen($content) . ' bytes)');

// Buscar referencias a progress_data
$progress_data_matches = [];
preg_match_all('/progress_data/i', $content, $progress_data_matches, PREG_OFFSET_CAPTURE);

echo "<h4>2.1 Búsqueda de 'progress_data'</h4>";
if (count($progress_data_matches[0]) > 0) {
    mostrar_mensaje('warning', 'Encontradas ' . count($progress_data_matches[0]) . ' referencias a progress_data');
    
    // Mostrar contexto de cada referencia
    foreach ($progress_data_matches[0] as $match) {
        $position = $match[1];
        $line_start = max(0, $position - 100);
        $line_end = min(strlen($content), $position + 100);
        $context = substr($content, $line_start, $line_end - $line_start);
        
        echo "<div style='background: #f5f5f5; padding: 10px; margin: 5px 0; font-family: monospace; font-size: 12px;'>";
        echo "Contexto (posición {$position}):<br>";
        echo htmlspecialchars($context);
        echo "</div>";
    }
} else {
    mostrar_mensaje('success', 'No se encontraron referencias directas a progress_data');
}

// Buscar patrones problemáticos comunes
echo "<h4>2.2 Búsqueda de Patrones Problemáticos</h4>";

$patrones_problematicos = [
    '/local_neuroopositor\\\\progress_data/' => 'Referencia incorrecta a progress_data con namespace',
    '/progress_data[^a-zA-Z_]/' => 'Uso de progress_data como constante',
    '/\$progress_data/' => 'Variable progress_data',
    '/class.*progress_data/' => 'Clase progress_data',
    '/function.*progress_data/' => 'Función progress_data'
];

$problemas_encontrados = [];

foreach ($patrones_problematicos as $patron => $descripcion) {
    $matches = [];
    preg_match_all($patron, $content, $matches, PREG_OFFSET_CAPTURE);
    
    if (count($matches[0]) > 0) {
        $problemas_encontrados[] = [
            'patron' => $patron,
            'descripcion' => $descripcion,
            'matches' => $matches[0]
        ];
        mostrar_mensaje('warning', $descripcion . ' - ' . count($matches[0]) . ' ocurrencias');
    }
}

if (empty($problemas_encontrados)) {
    mostrar_mensaje('success', 'No se encontraron patrones problemáticos obvios');
}

echo "<h3>PASO 3: Búsqueda de Clases y Namespaces</h3>";

// Buscar definiciones de clases
$class_matches = [];
preg_match_all('/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/i', $content, $class_matches);

if (count($class_matches[1]) > 0) {
    mostrar_mensaje('success', 'Clases encontradas: ' . implode(', ', $class_matches[1]));
} else {
    mostrar_mensaje('warning', 'No se encontraron definiciones de clases');
}

// Buscar namespaces
$namespace_matches = [];
preg_match_all('/namespace\s+([a-zA-Z_\\\\][a-zA-Z0-9_\\\\]*)/i', $content, $namespace_matches);

if (count($namespace_matches[1]) > 0) {
    mostrar_mensaje('success', 'Namespaces encontrados: ' . implode(', ', $namespace_matches[1]));
} else {
    mostrar_mensaje('warning', 'No se encontraron declaraciones de namespace');
}

echo "<h3>PASO 4: Generación de Corrección</h3>";

// Crear contenido corregido
$content_corregido = $content;
$correcciones_aplicadas = 0;

// Corrección 1: Reemplazar referencias incorrectas a progress_data
$correcciones = [
    '/local_neuroopositor\\\\progress_data/' => 'local_neuroopositor\\statistics',
    '/progress_data::/' => 'statistics::',
    '/new progress_data/' => 'new statistics',
    '/use.*progress_data/' => 'use local_neuroopositor\\statistics'
];

foreach ($correcciones as $buscar => $reemplazar) {
    $antes = $content_corregido;
    $content_corregido = preg_replace($buscar, $reemplazar, $content_corregido);
    if ($antes !== $content_corregido) {
        $correcciones_aplicadas++;
        mostrar_mensaje('success', "Corregido: {$buscar} -> {$reemplazar}");
    }
}

// Corrección 2: Asegurar que existe la clase statistics
if (!preg_match('/class\s+statistics/i', $content_corregido)) {
    // Buscar donde insertar la clase
    if (preg_match('/namespace\s+local_neuroopositor;/', $content_corregido)) {
        $class_definition = "

/**
 * Clase statistics para manejar estadísticas del plugin NeuroOpositor
 */
class statistics {
    
    /**
     * Obtiene datos de progreso del usuario
     */
    public static function get_progress_data(\$userid, \$courseid = 0) {
        global \$DB;
        
        // Implementación básica
        return \$DB->get_records('neuroopositor_user_progress', [
            'userid' => \$userid,
            'courseid' => \$courseid
        ]);
    }
    
    /**
     * Obtiene estadísticas generales del usuario
     */
    public static function get_user_general_stats(\$userid, \$courseid = 0) {
        global \$DB;
        
        \$sql = "SELECT 
                    COUNT(*) as total_preguntas,
                    SUM(preguntas_correctas) as total_correctas,
                    AVG(preguntas_correctas) as promedio_correctas,
                    SUM(tiempo_estudio_segundos) as tiempo_total
                FROM {neuroopositor_user_progress} 
                WHERE userid = ? AND courseid = ?";
                
        return \$DB->get_record_sql(\$sql, [\$userid, \$courseid]);
    }
}
";
        
        // Insertar después del namespace
        $content_corregido = preg_replace(
            '/(namespace\s+local_neuroopositor;)/i',
            '$1' . $class_definition,
            $content_corregido
        );
        
        if (strpos($content_corregido, 'class statistics') !== false) {
            $correcciones_aplicadas++;
            mostrar_mensaje('success', 'Clase statistics agregada');
        }
    }
}

echo "<h4>4.1 Resumen de Correcciones</h4>";
mostrar_mensaje('success', "Total de correcciones aplicadas: {$correcciones_aplicadas}");

if ($correcciones_aplicadas > 0) {
    // Guardar archivo corregido
    $archivo_corregido = $CFG->dirroot . '/local/neuroopositor/statistics_progress_data_fixed.php';
    file_put_contents($archivo_corregido, $content_corregido);
    mostrar_mensaje('success', 'Archivo corregido guardado: statistics_progress_data_fixed.php');
    
    // Crear script de instalación
    $script_instalacion = "<?php
/**
 * Script de instalación para la corrección de progress_data
 */

require_once('../../config.php');

echo '<h2>Instalación de Corrección progress_data</h2>';

\$source = '{$archivo_corregido}';
\$target = '{$statistics_path}';
\$backup = '{$statistics_path}.backup.' . date('Y-m-d_H-i-s');

if (file_exists(\$source)) {
    // Crear backup
    if (copy(\$target, \$backup)) {
        echo '<p style=\"color: green;\">✓ Backup creado: ' . basename(\$backup) . '</p>';
        
        // Instalar corrección
        if (copy(\$source, \$target)) {
            echo '<p style=\"color: green;\">✓ Corrección instalada exitosamente</p>';
            echo '<p><a href=\"index.php?courseid=0&action=statistics\">Probar estadísticas</a></p>';
        } else {
            echo '<p style=\"color: red;\">✗ Error al instalar corrección</p>';
        }
    } else {
        echo '<p style=\"color: red;\">✗ Error al crear backup</p>';
    }
} else {
    echo '<p style=\"color: red;\">✗ Archivo de corrección no encontrado</p>';
}

?>";
    
    file_put_contents($CFG->dirroot . '/local/neuroopositor/instalar_correccion_progress_data.php', $script_instalacion);
    mostrar_mensaje('success', 'Script de instalación creado: instalar_correccion_progress_data.php');
    
} else {
    mostrar_mensaje('warning', 'No se aplicaron correcciones automáticas');
}

echo "<h3>PASO 5: Instrucciones Finales</h3>";

if ($correcciones_aplicadas > 0) {
    echo "<div style='background: #e8f5e8; padding: 15px; border: 1px solid #4CAF50; border-radius: 5px;'>";
    echo "<h4>✓ Correcciones Aplicadas</h4>";
    echo "<p>Para completar la instalación:</p>";
    echo "<ol>";
    echo "<li>Ejecutar: <a href='instalar_correccion_progress_data.php'>instalar_correccion_progress_data.php</a></li>";
    echo "<li>Probar: <a href='index.php?courseid=0&action=statistics'>Página de estadísticas</a></li>";
    echo "</ol>";
    echo "</div>";
} else {
    echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffc107; border-radius: 5px;'>";
    echo "<h4>⚠ Análisis Manual Requerido</h4>";
    echo "<p>No se pudieron aplicar correcciones automáticas.</p>";
    echo "<p>Recomendamos:</p>";
    echo "<ul>";
    echo "<li>Revisar manualmente el archivo statistics.php</li>";
    echo "<li>Buscar referencias a 'progress_data' en el código</li>";
    echo "<li>Verificar la estructura de clases y namespaces</li>";
    echo "</ul>";
    echo "</div>";
}

echo "<hr>";
echo "<p><small>Proceso completado: " . date('Y-m-d H:i:s') . "</small></p>";
echo "<p><small>Usuario: " . $USER->username . " (ID: {$USER->id})</small></p>";

?>