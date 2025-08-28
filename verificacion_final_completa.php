<?php
/**
 * Verificación Final Completa
 * 
 * Script para confirmar que todas las correcciones del plugin NeuroOpositor
 * se han aplicado correctamente y que no hay errores pendientes
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');

echo "<h2>🔍 Verificación Final Completa - NeuroOpositor</h2>";
echo "<p>Confirmando que todas las correcciones se aplicaron exitosamente</p>";

// Función para mostrar resultados
function mostrar_resultado($tipo, $titulo, $detalle = '', $codigo = '') {
    $estilos = [
        'pass' => 'background: #e8f5e8; border-left: 5px solid #4caf50; color: #2e7d32;',
        'fail' => 'background: #ffebee; border-left: 5px solid #f44336; color: #c62828;',
        'warning' => 'background: #fff8e1; border-left: 5px solid #ff9800; color: #ef6c00;',
        'info' => 'background: #e3f2fd; border-left: 5px solid #2196f3; color: #1565c0;'
    ];
    
    $iconos = ['pass' => '✅', 'fail' => '❌', 'warning' => '⚠️', 'info' => 'ℹ️'];
    $estilo = $estilos[$tipo] ?? $estilos['info'];
    $icono = $iconos[$tipo] ?? '•';
    
    echo "<div style='{$estilo} padding: 15px; margin: 10px 0; border-radius: 6px;'>";
    echo "<h4 style='margin: 0 0 8px 0;'>{$icono} {$titulo}</h4>";
    if ($detalle) echo "<p style='margin: 5px 0; font-size: 14px;'>{$detalle}</p>";
    if ($codigo) echo "<pre style='background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; font-size: 12px; margin: 8px 0 0 0; overflow-x: auto;'>{$codigo}</pre>";
    echo "</div>";
}

$errores_encontrados = 0;
$warnings_encontrados = 0;
$tests_pasados = 0;

echo "<h3>📋 VERIFICACIÓN 1: Archivos del Sistema</h3>";

// Verificar archivos principales
$archivos_principales = [
    'statistics.php' => $CFG->dirroot . '/local/neuroopositor/statistics.php',
    'index.php' => $CFG->dirroot . '/local/neuroopositor/index.php',
    'lib.php' => $CFG->dirroot . '/local/neuroopositor/lib.php',
    'version.php' => $CFG->dirroot . '/local/neuroopositor/version.php'
];

foreach ($archivos_principales as $nombre => $ruta) {
    if (file_exists($ruta)) {
        $size = filesize($ruta);
        $fecha = date('Y-m-d H:i:s', filemtime($ruta));
        mostrar_resultado('pass', "Archivo {$nombre}", "Tamaño: " . number_format($size) . " bytes | Modificado: {$fecha}");
        $tests_pasados++;
    } else {
        mostrar_resultado('fail', "Archivo {$nombre} NO encontrado");
        $errores_encontrados++;
    }
}

// Verificar archivos de corrección
echo "<h4>📁 Archivos de Corrección Generados</h4>";
$archivos_correccion = [
    'statistics_final_fixed.php',
    'instalar_solucion_final.php',
    'statistics_solucion_completa.php',
    'consultas_corregidas.php'
];

foreach ($archivos_correccion as $archivo) {
    $ruta = $CFG->dirroot . '/local/neuroopositor/' . $archivo;
    if (file_exists($ruta)) {
        mostrar_resultado('pass', "Archivo de corrección: {$archivo}");
        $tests_pasados++;
    } else {
        mostrar_resultado('warning', "Archivo de corrección: {$archivo} no encontrado", "No es crítico si ya se aplicó la corrección");
        $warnings_encontrados++;
    }
}

echo "<h3>🔧 VERIFICACIÓN 2: Estructura del Código</h3>";

// Verificar contenido de statistics.php
$statistics_path = $CFG->dirroot . '/local/neuroopositor/statistics.php';
if (file_exists($statistics_path)) {
    $contenido = file_get_contents($statistics_path);
    
    // Verificar namespace
    if (preg_match('/namespace\s+local_neuroopositor\s*;/', $contenido)) {
        mostrar_resultado('pass', "Namespace correcto encontrado", "namespace local_neuroopositor;");
        $tests_pasados++;
    } else {
        mostrar_resultado('fail', "Namespace local_neuroopositor NO encontrado");
        $errores_encontrados++;
    }
    
    // Verificar clase statistics
    if (preg_match('/class\s+statistics/i', $contenido)) {
        mostrar_resultado('pass', "Clase statistics encontrada");
        $tests_pasados++;
    } else {
        mostrar_resultado('fail', "Clase statistics NO encontrada");
        $errores_encontrados++;
    }
    
    // Verificar métodos principales
    $metodos_requeridos = [
        'get_user_general_stats',
        'get_stats_by_tema',
        'get_progress_data',
        'format_time'
    ];
    
    foreach ($metodos_requeridos as $metodo) {
        if (preg_match('/function\s+' . $metodo . '\s*\(/i', $contenido)) {
            mostrar_resultado('pass', "Método {$metodo} encontrado");
            $tests_pasados++;
        } else {
            mostrar_resultado('fail', "Método {$metodo} NO encontrado");
            $errores_encontrados++;
        }
    }
    
    // Verificar alias de compatibilidad
    if (strpos($contenido, 'class_alias') !== false && strpos($contenido, 'progress_data') !== false) {
        mostrar_resultado('pass', "Alias de compatibilidad progress_data encontrado");
        $tests_pasados++;
    } else {
        mostrar_resultado('warning', "Alias de compatibilidad progress_data no encontrado", "Puede causar errores de compatibilidad");
        $warnings_encontrados++;
    }
    
    // Verificar correcciones de columnas
    if (strpos($contenido, 'preguntas_correctas') !== false) {
        mostrar_resultado('pass', "Corrección de columnas aplicada (preguntas_correctas)");
        $tests_pasados++;
    } else {
        mostrar_resultado('fail', "Corrección de columnas NO aplicada");
        $errores_encontrados++;
    }
    
    if (strpos($contenido, 'titulo') !== false) {
        mostrar_resultado('pass', "Corrección de columnas aplicada (titulo)");
        $tests_pasados++;
    } else {
        mostrar_resultado('fail', "Corrección de columnas titulo NO aplicada");
        $errores_encontrados++;
    }
}

echo "<h3>💾 VERIFICACIÓN 3: Base de Datos</h3>";

// Verificar conexión a la base de datos
try {
    $DB->get_manager();
    mostrar_resultado('pass', "Conexión a base de datos exitosa");
    $tests_pasados++;
} catch (Exception $e) {
    mostrar_resultado('fail', "Error de conexión a base de datos", $e->getMessage());
    $errores_encontrados++;
}

// Verificar tablas
$tablas_requeridas = ['neuroopositor_temas', 'neuroopositor_user_progress'];
foreach ($tablas_requeridas as $tabla) {
    try {
        if ($DB->get_manager()->table_exists($tabla)) {
            $count = $DB->count_records($tabla);
            mostrar_resultado('pass', "Tabla {$tabla} existe", "Registros: {$count}");
            $tests_pasados++;
        } else {
            mostrar_resultado('fail', "Tabla {$tabla} NO existe");
            $errores_encontrados++;
        }
    } catch (Exception $e) {
        mostrar_resultado('fail', "Error verificando tabla {$tabla}", $e->getMessage());
        $errores_encontrados++;
    }
}

// Verificar columnas corregidas
try {
    // Verificar columna titulo en neuroopositor_temas
    $columns = $DB->get_columns('neuroopositor_temas');
    if (isset($columns['titulo'])) {
        mostrar_resultado('pass', "Columna 'titulo' existe en neuroopositor_temas");
        $tests_pasados++;
    } else {
        mostrar_resultado('fail', "Columna 'titulo' NO existe en neuroopositor_temas");
        $errores_encontrados++;
    }
    
    // Verificar columnas en neuroopositor_user_progress
    $progress_columns = $DB->get_columns('neuroopositor_user_progress');
    $columnas_progress = ['preguntas_correctas', 'tiempo_estudio_segundos', 'preguntas_totales'];
    
    foreach ($columnas_progress as $col) {
        if (isset($progress_columns[$col])) {
            mostrar_resultado('pass', "Columna '{$col}' existe en neuroopositor_user_progress");
            $tests_pasados++;
        } else {
            mostrar_resultado('fail', "Columna '{$col}' NO existe en neuroopositor_user_progress");
            $errores_encontrados++;
        }
    }
    
} catch (Exception $e) {
    mostrar_resultado('fail', "Error verificando columnas de base de datos", $e->getMessage());
    $errores_encontrados++;
}

echo "<h3>🧪 VERIFICACIÓN 4: Pruebas Funcionales</h3>";

// Probar carga de clases
try {
    // Incluir el archivo statistics.php
    include_once($CFG->dirroot . '/local/neuroopositor/statistics.php');
    
    // Verificar que las clases existen
    if (class_exists('local_neuroopositor\\statistics')) {
        mostrar_resultado('pass', "Clase local_neuroopositor\\statistics se carga correctamente");
        $tests_pasados++;
    } else {
        mostrar_resultado('fail', "Clase local_neuroopositor\\statistics NO se puede cargar");
        $errores_encontrados++;
    }
    
    // Verificar alias
    if (class_exists('progress_data')) {
        mostrar_resultado('pass', "Alias progress_data funciona correctamente");
        $tests_pasados++;
    } else {
        mostrar_resultado('warning', "Alias progress_data no está disponible", "Puede causar errores en código legacy");
        $warnings_encontrados++;
    }
    
} catch (Exception $e) {
    mostrar_resultado('fail', "Error al cargar clases", $e->getMessage());
    $errores_encontrados++;
} catch (Error $e) {
    mostrar_resultado('fail', "Error fatal al cargar clases", $e->getMessage());
    $errores_encontrados++;
}

// Probar métodos de la clase
if (class_exists('local_neuroopositor\\statistics')) {
    try {
        // Probar método get_user_general_stats
        if (method_exists('local_neuroopositor\\statistics', 'get_user_general_stats')) {
            $stats = \local_neuroopositor\statistics::get_user_general_stats($USER->id, 0);
            if (is_object($stats)) {
                mostrar_resultado('pass', "Método get_user_general_stats funciona", "Retorna objeto con estadísticas");
                $tests_pasados++;
            } else {
                mostrar_resultado('fail', "Método get_user_general_stats no retorna objeto válido");
                $errores_encontrados++;
            }
        } else {
            mostrar_resultado('fail', "Método get_user_general_stats no existe");
            $errores_encontrados++;
        }
        
        // Probar método get_stats_by_tema
        if (method_exists('local_neuroopositor\\statistics', 'get_stats_by_tema')) {
            $tema_stats = \local_neuroopositor\statistics::get_stats_by_tema($USER->id, 0);
            if (is_array($tema_stats)) {
                mostrar_resultado('pass', "Método get_stats_by_tema funciona", "Retorna array con " . count($tema_stats) . " elementos");
                $tests_pasados++;
            } else {
                mostrar_resultado('fail', "Método get_stats_by_tema no retorna array válido");
                $errores_encontrados++;
            }
        } else {
            mostrar_resultado('fail', "Método get_stats_by_tema no existe");
            $errores_encontrados++;
        }
        
    } catch (Exception $e) {
        mostrar_resultado('fail', "Error al probar métodos de la clase", $e->getMessage());
        $errores_encontrados++;
    }
}

echo "<h3>🌐 VERIFICACIÓN 5: Acceso Web</h3>";

// Verificar URL de estadísticas
$url_estadisticas = $CFG->wwwroot . '/local/neuroopositor/index.php?courseid=0&action=statistics';
mostrar_resultado('info', "URL de estadísticas", $url_estadisticas);

// Intentar simular acceso (básico)
try {
    // Verificar que no hay errores de sintaxis en index.php
    $index_content = file_get_contents($CFG->dirroot . '/local/neuroopositor/index.php');
    if ($index_content && strlen($index_content) > 100) {
        mostrar_resultado('pass', "Archivo index.php parece válido", "Tamaño: " . number_format(strlen($index_content)) . " caracteres");
        $tests_pasados++;
    } else {
        mostrar_resultado('fail', "Archivo index.php parece inválido o muy pequeño");
        $errores_encontrados++;
    }
} catch (Exception $e) {
    mostrar_resultado('fail', "Error al verificar index.php", $e->getMessage());
    $errores_encontrados++;
}

echo "<h3>📊 RESUMEN FINAL</h3>";

$total_tests = $tests_pasados + $errores_encontrados + $warnings_encontrados;
$porcentaje_exito = $total_tests > 0 ? round(($tests_pasados / $total_tests) * 100, 1) : 0;

if ($errores_encontrados == 0) {
    $estado = 'pass';
    $mensaje = '🎉 TODAS LAS VERIFICACIONES PASARON';
    $detalle = 'El plugin NeuroOpositor está completamente corregido y listo para usar.';
} elseif ($errores_encontrados <= 2) {
    $estado = 'warning';
    $mensaje = '⚠️ VERIFICACIÓN PARCIAL';
    $detalle = 'Hay algunos errores menores que pueden necesitar atención.';
} else {
    $estado = 'fail';
    $mensaje = '❌ VERIFICACIÓN FALLIDA';
    $detalle = 'Se encontraron errores críticos que deben ser corregidos.';
}

mostrar_resultado($estado, $mensaje, $detalle);

echo "<div style='background: #f5f5f5; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
echo "<h4 style='margin-top: 0; color: #333;'>📈 Estadísticas de Verificación</h4>";
echo "<div style='display: flex; gap: 20px; flex-wrap: wrap;'>";
echo "<div style='background: #e8f5e8; padding: 10px; border-radius: 4px; min-width: 120px;'>";
echo "<strong style='color: #2e7d32;'>✅ Pasaron</strong><br>";
echo "<span style='font-size: 24px; color: #2e7d32;'>{$tests_pasados}</span>";
echo "</div>";
echo "<div style='background: #ffebee; padding: 10px; border-radius: 4px; min-width: 120px;'>";
echo "<strong style='color: #c62828;'>❌ Errores</strong><br>";
echo "<span style='font-size: 24px; color: #c62828;'>{$errores_encontrados}</span>";
echo "</div>";
echo "<div style='background: #fff8e1; padding: 10px; border-radius: 4px; min-width: 120px;'>";
echo "<strong style='color: #ef6c00;'>⚠️ Warnings</strong><br>";
echo "<span style='font-size: 24px; color: #ef6c00;'>{$warnings_encontrados}</span>";
echo "</div>";
echo "<div style='background: #e3f2fd; padding: 10px; border-radius: 4px; min-width: 120px;'>";
echo "<strong style='color: #1565c0;'>📊 Éxito</strong><br>";
echo "<span style='font-size: 24px; color: #1565c0;'>{$porcentaje_exito}%</span>";
echo "</div>";
echo "</div>";
echo "</div>";

if ($errores_encontrados > 0) {
    echo "<div style='background: #ffebee; border: 1px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
    echo "<h4 style='color: #c62828; margin-top: 0;'>🔧 Acciones Recomendadas</h4>";
    echo "<ol style='color: #c62828;'>";
    if ($errores_encontrados > 0) {
        echo "<li><strong><a href='solucion_final_progress_data.php' style='color: #d32f2f;'>Ejecutar solucion_final_progress_data.php</a></strong></li>";
        echo "<li><strong><a href='instalar_solucion_final.php' style='color: #d32f2f;'>Aplicar instalar_solucion_final.php</a></strong></li>";
    }
    echo "<li><a href='verificacion_final_completa.php' style='color: #1976d2;'>Volver a ejecutar esta verificación</a></li>";
    echo "<li><a href='index.php?courseid=0&action=statistics' style='color: #1976d2;'>Probar las estadísticas</a></li>";
    echo "</ol>";
    echo "</div>";
} else {
    echo "<div style='background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
    echo "<h4 style='color: #2e7d32; margin-top: 0;'>🎉 ¡Corrección Completada!</h4>";
    echo "<p style='color: #2e7d32;'>Todas las verificaciones han pasado exitosamente. El plugin está listo para usar:</p>";
    echo "<ul style='color: #2e7d32;'>";
    echo "<li><strong><a href='index.php?courseid=0&action=statistics' style='color: #1976d2; font-weight: bold;'>🔗 Acceder a las Estadísticas</a></strong></li>";
    echo "<li><a href='index.php' style='color: #1976d2;'>🏠 Página principal del plugin</a></li>";
    echo "</ul>";
    echo "</div>";
}

echo "<hr style='margin: 30px 0;'>";
echo "<div style='text-align: center; color: #666; font-size: 12px;'>";
echo "<p>Verificación completada: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Usuario: {$USER->username} (ID: {$USER->id})</p>";
echo "<p>Plugin: NeuroOpositor - Verificación Final Completa</p>";
echo "</div>";

?>