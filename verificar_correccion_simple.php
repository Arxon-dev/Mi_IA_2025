<?php
/**
 * Verificación simple de la corrección progress_data
 * 
 * Este script verifica si la corrección fue aplicada correctamente
 * sin usar funciones deshabilitadas como shell_exec()
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');

echo "<h2>Verificación de Corrección progress_data</h2>";
echo "<p>Comprobando si la corrección del error fue aplicada correctamente</p>";

// Función para mostrar resultados
function resultado($tipo, $mensaje, $detalle = '') {
    $colores = [
        'success' => ['bg' => '#d4edda', 'border' => '#c3e6cb', 'text' => '#155724', 'icon' => '✓'],
        'error' => ['bg' => '#f8d7da', 'border' => '#f5c6cb', 'text' => '#721c24', 'icon' => '✗'],
        'warning' => ['bg' => '#fff3cd', 'border' => '#ffeaa7', 'text' => '#856404', 'icon' => '⚠'],
        'info' => ['bg' => '#d1ecf1', 'border' => '#bee5eb', 'text' => '#0c5460', 'icon' => 'ℹ']
    ];
    
    $color = $colores[$tipo] ?? $colores['info'];
    
    echo "<div style='background: {$color['bg']}; border: 1px solid {$color['border']}; padding: 12px; margin: 8px 0; border-radius: 4px; color: {$color['text']};'>";
    echo "<strong>{$color['icon']} {$mensaje}</strong>";
    if ($detalle) {
        echo "<br><small>{$detalle}</small>";
    }
    echo "</div>";
}

echo "<h3>1. Verificación de Archivos</h3>";

$archivos_verificar = [
    'statistics.php' => $CFG->dirroot . '/local/neuroopositor/statistics.php',
    'statistics_fixed_progress_data.php' => $CFG->dirroot . '/local/neuroopositor/statistics_fixed_progress_data.php',
    'instalar_fix_progress_data.php' => $CFG->dirroot . '/local/neuroopositor/instalar_fix_progress_data.php'
];

foreach ($archivos_verificar as $nombre => $ruta) {
    if (file_exists($ruta)) {
        $size = filesize($ruta);
        $fecha = date('Y-m-d H:i:s', filemtime($ruta));
        resultado('success', "Archivo {$nombre} existe", "Tamaño: " . number_format($size) . " bytes, Modificado: {$fecha}");
    } else {
        resultado('warning', "Archivo {$nombre} no encontrado", "Puede que no se haya generado aún");
    }
}

echo "<h3>2. Análisis del Contenido Actual</h3>";

$statistics_path = $CFG->dirroot . '/local/neuroopositor/statistics.php';

if (file_exists($statistics_path)) {
    $content = file_get_contents($statistics_path);
    
    // Verificar si aún contiene referencias problemáticas
    $problemas_restantes = [
        'progress_data sin namespace' => preg_match('/(?<!\\)progress_data/i', $content),
        'local_neuroopositor\\progress_data' => preg_match('/local_neuroopositor\\\\progress_data/i', $content),
        'new progress_data' => preg_match('/new\s+progress_data/i', $content),
        'progress_data::' => preg_match('/progress_data::/i', $content)
    ];
    
    $tiene_problemas = false;
    foreach ($problemas_restantes as $problema => $encontrado) {
        if ($encontrado) {
            resultado('error', "Problema encontrado: {$problema}", "El archivo aún contiene referencias problemáticas");
            $tiene_problemas = true;
        }
    }
    
    if (!$tiene_problemas) {
        resultado('success', "No se encontraron referencias problemáticas a progress_data");
    }
    
    // Verificar si existe la clase statistics
    if (preg_match('/class\s+statistics/i', $content)) {
        resultado('success', "Clase 'statistics' encontrada en el archivo");
    } else {
        resultado('warning', "Clase 'statistics' no encontrada", "Puede necesitar ser agregada");
    }
    
} else {
    resultado('error', "Archivo statistics.php no encontrado");
}

echo "<h3>3. Prueba de Carga de Clases</h3>";

// Intentar cargar y usar la clase statistics
try {
    // Incluir el archivo
    require_once($statistics_path);
    resultado('success', "Archivo statistics.php cargado sin errores de sintaxis");
    
    // Verificar si la clase existe
    if (class_exists('local_neuroopositor\\statistics') || class_exists('statistics')) {
        resultado('success', "Clase statistics disponible");
        
        // Intentar usar métodos de la clase
        $class_name = class_exists('local_neuroopositor\\statistics') ? 'local_neuroopositor\\statistics' : 'statistics';
        
        if (method_exists($class_name, 'get_user_general_stats')) {
            resultado('success', "Método get_user_general_stats disponible");
        } else {
            resultado('warning', "Método get_user_general_stats no encontrado");
        }
        
        if (method_exists($class_name, 'get_progress_data')) {
            resultado('success', "Método get_progress_data disponible");
        } else {
            resultado('info', "Método get_progress_data no encontrado (opcional)");
        }
        
    } else {
        resultado('error', "Clase statistics no encontrada después de cargar el archivo");
    }
    
} catch (ParseError $e) {
    resultado('error', "Error de sintaxis en statistics.php", $e->getMessage());
} catch (Error $e) {
    resultado('error', "Error al cargar statistics.php", $e->getMessage());
} catch (Exception $e) {
    resultado('warning', "Excepción al cargar statistics.php", $e->getMessage());
}

echo "<h3>4. Prueba de Conexión a Base de Datos</h3>";

try {
    // Verificar conexión
    $DB->get_manager();
    resultado('success', "Conexión a base de datos activa");
    
    // Verificar tablas
    $tablas_necesarias = [
        'neuroopositor_temas',
        'neuroopositor_user_progress',
        'neuroopositor_connections'
    ];
    
    foreach ($tablas_necesarias as $tabla) {
        $tabla_completa = $CFG->prefix . $tabla;
        if ($DB->get_manager()->table_exists($tabla)) {
            $count = $DB->count_records($tabla);
            resultado('success', "Tabla {$tabla} existe", "{$count} registros");
        } else {
            resultado('error', "Tabla {$tabla} no existe");
        }
    }
    
} catch (Exception $e) {
    resultado('error', "Error de base de datos", $e->getMessage());
}

echo "<h3>5. Prueba Funcional Básica</h3>";

// Intentar ejecutar una consulta básica similar a la que falla
try {
    $sql = "SELECT COUNT(*) as total FROM {neuroopositor_temas}";
    $result = $DB->get_record_sql($sql);
    resultado('success', "Consulta básica a neuroopositor_temas exitosa", "Total temas: {$result->total}");
    
    // Probar consulta con columnas específicas
    $sql2 = "SELECT id, titulo FROM {neuroopositor_temas} LIMIT 1";
    $tema = $DB->get_record_sql($sql2);
    if ($tema) {
        resultado('success', "Consulta con columna 'titulo' exitosa", "Ejemplo: {$tema->titulo}");
    } else {
        resultado('info', "No hay temas en la base de datos para probar");
    }
    
} catch (Exception $e) {
    resultado('error', "Error en consulta de prueba", $e->getMessage());
}

echo "<h3>6. Recomendaciones</h3>";

// Determinar el estado general y dar recomendaciones
$archivos_correccion_existen = file_exists($CFG->dirroot . '/local/neuroopositor/statistics_fixed_progress_data.php');
$instalador_existe = file_exists($CFG->dirroot . '/local/neuroopositor/instalar_fix_progress_data.php');

if ($archivos_correccion_existen && $instalador_existe) {
    echo "<div style='background: #e8f5e8; border: 1px solid #4CAF50; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
    echo "<h4 style='color: #2e7d32; margin-top: 0;'>✓ Archivos de Corrección Disponibles</h4>";
    echo "<p style='color: #2e7d32;'>Los archivos de corrección están listos. Para aplicar:</p>";
    echo "<ol style='color: #2e7d32;'>";
    echo "<li><a href='instalar_fix_progress_data.php' style='color: #1976d2;'>Ejecutar instalador</a></li>";
    echo "<li><a href='index.php?courseid=0&action=statistics' style='color: #1976d2;'>Probar estadísticas</a></li>";
    echo "</ol>";
    echo "</div>";
} else {
    echo "<div style='background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
    echo "<h4 style='color: #856404; margin-top: 0;'>⚠ Generar Corrección Primero</h4>";
    echo "<p style='color: #856404;'>Ejecuta primero los scripts de diagnóstico:</p>";
    echo "<ul style='color: #856404;'>";
    echo "<li><a href='corregir_error_progress_data.php' style='color: #0c5460;'>corregir_error_progress_data.php</a></li>";
    echo "<li><a href='diagnostico_error_constante.php' style='color: #0c5460;'>diagnostico_error_constante.php</a></li>";
    echo "</ul>";
    echo "</div>";
}

echo "<h3>7. Enlaces Útiles</h3>";

echo "<div style='background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
echo "<h4 style='margin-top: 0;'>Accesos Rápidos</h4>";
echo "<ul>";
echo "<li><a href='index.php?courseid=0&action=statistics'>Página de estadísticas (para probar)</a></li>";
echo "<li><a href='corregir_error_progress_data.php'>Script de corrección principal</a></li>";
echo "<li><a href='diagnostico_error_constante.php'>Diagnóstico específico</a></li>";
echo "<li><a href='verificar_correccion_simple.php'>Esta página (recargar)</a></li>";
echo "</ul>";
echo "</div>";

echo "<hr style='margin: 20px 0;'>";
echo "<div style='text-align: center; color: #6c757d; font-size: 12px;'>";
echo "<p>Verificación completada: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Usuario: {$USER->username} (ID: {$USER->id})</p>";
echo "<p>Plugin: NeuroOpositor - Corrección progress_data</p>";
echo "</div>";

?>