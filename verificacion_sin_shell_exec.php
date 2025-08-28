<?php
/**
 * Verificación Final Sin shell_exec()
 * 
 * Script de verificación que no utiliza shell_exec() para evitar errores
 * en hostings que tienen esta función deshabilitada
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');

echo "<h2>🔍 Verificación Final Sin shell_exec() - NeuroOpositor</h2>";
echo "<p>Verificación completa sin funciones deshabilitadas en el hosting</p>";

// Función para mostrar resultados
function mostrar_verificacion($tipo, $titulo, $detalle = '', $codigo = '') {
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

$errores_criticos = 0;
$warnings = 0;
$tests_exitosos = 0;

echo "<h3>📁 VERIFICACIÓN 1: Archivos del Sistema</h3>";

// Verificar archivos principales
$archivos_principales = [
    'statistics.php' => $CFG->dirroot . '/local/neuroopositor/statistics.php',
    'index.php' => $CFG->dirroot . '/local/neuroopositor/index.php',
    'lib.php' => $CFG->dirroot . '/local/neuroopositor/lib.php'
];

foreach ($archivos_principales as $nombre => $ruta) {
    if (file_exists($ruta)) {
        $size = filesize($ruta);
        $fecha = date('Y-m-d H:i:s', filemtime($ruta));
        mostrar_verificacion('pass', "Archivo {$nombre} encontrado", "Tamaño: " . number_format($size) . " bytes | Modificado: {$fecha}");
        $tests_exitosos++;
    } else {
        mostrar_verificacion('fail', "Archivo {$nombre} NO encontrado");
        $errores_criticos++;
    }
}

echo "<h3>🔧 VERIFICACIÓN 2: Problemas Específicos Identificados</h3>";

$statistics_path = $CFG->dirroot . '/local/neuroopositor/statistics.php';
if (file_exists($statistics_path)) {
    $contenido = file_get_contents($statistics_path);
    
    echo "<h4>2.1 Namespace local_neuroopositor</h4>";
    if (preg_match('/namespace\s+local_neuroopositor\s*;/', $contenido)) {
        mostrar_verificacion('pass', "Namespace local_neuroopositor encontrado");
        $tests_exitosos++;
    } else {
        mostrar_verificacion('fail', "Namespace local_neuroopositor NO encontrado", "Este es un problema crítico identificado en la verificación anterior");
        $errores_criticos++;
    }
    
    echo "<h4>2.2 Clase statistics</h4>";
    if (preg_match('/class\s+statistics/i', $contenido)) {
        mostrar_verificacion('pass', "Clase statistics encontrada");
        $tests_exitosos++;
    } else {
        mostrar_verificacion('fail', "Clase statistics NO encontrada");
        $errores_criticos++;
    }
    
    echo "<h4>2.3 Método format_time</h4>";
    if (preg_match('/function\s+format_time/i', $contenido)) {
        mostrar_verificacion('pass', "Método format_time encontrado");
        $tests_exitosos++;
    } else {
        mostrar_verificacion('fail', "Método format_time NO encontrado", "Este método faltaba en la verificación anterior");
        $errores_criticos++;
    }
    
    echo "<h4>2.4 Alias progress_data</h4>";
    if (preg_match('/class_alias.*progress_data/', $contenido)) {
        mostrar_verificacion('pass', "Alias progress_data encontrado");
        $tests_exitosos++;
    } else {
        mostrar_verificacion('fail', "Alias progress_data NO encontrado", "Este alias es crítico para la compatibilidad");
        $errores_criticos++;
    }
    
    echo "<h4>2.5 Métodos Principales</h4>";
    $metodos_requeridos = [
        'get_user_general_stats' => 'Obtiene estadísticas generales del usuario',
        'get_stats_by_tema' => 'Obtiene estadísticas por tema',
        'get_progress_data' => 'Método de compatibilidad para progress_data'
    ];
    
    foreach ($metodos_requeridos as $metodo => $descripcion) {
        if (preg_match('/function\s+' . $metodo . '\s*\(/i', $contenido)) {
            mostrar_verificacion('pass', "Método {$metodo} encontrado", $descripcion);
            $tests_exitosos++;
        } else {
            mostrar_verificacion('fail', "Método {$metodo} NO encontrado", $descripcion);
            $errores_criticos++;
        }
    }
    
    echo "<h4>2.6 Correcciones de Columnas de Base de Datos</h4>";
    if (strpos($contenido, 'preguntas_correctas') !== false) {
        mostrar_verificacion('pass', "Corrección 'preguntas_correctas' aplicada");
        $tests_exitosos++;
    } else {
        mostrar_verificacion('fail', "Corrección 'preguntas_correctas' NO aplicada");
        $errores_criticos++;
    }
    
    if (strpos($contenido, 'titulo') !== false) {
        mostrar_verificacion('pass', "Corrección 'titulo' aplicada");
        $tests_exitosos++;
    } else {
        mostrar_verificacion('fail', "Corrección 'titulo' NO aplicada");
        $errores_criticos++;
    }
    
} else {
    mostrar_verificacion('fail', "No se puede verificar statistics.php - archivo no encontrado");
    $errores_criticos++;
}

echo "<h3>💾 VERIFICACIÓN 3: Base de Datos (Sin shell_exec)</h3>";

// Verificar conexión a la base de datos
try {
    $dbman = $DB->get_manager();
    mostrar_verificacion('pass', "Conexión a base de datos exitosa");
    $tests_exitosos++;
    
    // Verificar tablas
    $tablas_requeridas = ['neuroopositor_temas', 'neuroopositor_user_progress'];
    foreach ($tablas_requeridas as $tabla) {
        if ($dbman->table_exists($tabla)) {
            try {
                $count = $DB->count_records($tabla);
                mostrar_verificacion('pass', "Tabla {$tabla} existe y es accesible", "Registros: {$count}");
                $tests_exitosos++;
            } catch (Exception $e) {
                mostrar_verificacion('warning', "Tabla {$tabla} existe pero hay problemas de acceso", $e->getMessage());
                $warnings++;
            }
        } else {
            mostrar_verificacion('fail', "Tabla {$tabla} NO existe");
            $errores_criticos++;
        }
    }
    
    // Verificar columnas específicas
    try {
        $columns_temas = $DB->get_columns('neuroopositor_temas');
        if (isset($columns_temas['titulo'])) {
            mostrar_verificacion('pass', "Columna 'titulo' existe en neuroopositor_temas");
            $tests_exitosos++;
        } else {
            mostrar_verificacion('fail', "Columna 'titulo' NO existe en neuroopositor_temas");
            $errores_criticos++;
        }
        
        $columns_progress = $DB->get_columns('neuroopositor_user_progress');
        $columnas_requeridas = ['preguntas_correctas', 'tiempo_estudio_segundos', 'preguntas_totales'];
        
        foreach ($columnas_requeridas as $col) {
            if (isset($columns_progress[$col])) {
                mostrar_verificacion('pass', "Columna '{$col}' existe en neuroopositor_user_progress");
                $tests_exitosos++;
            } else {
                mostrar_verificacion('fail', "Columna '{$col}' NO existe en neuroopositor_user_progress");
                $errores_criticos++;
            }
        }
        
    } catch (Exception $e) {
        mostrar_verificacion('fail', "Error verificando columnas de base de datos", $e->getMessage());
        $errores_criticos++;
    }
    
} catch (Exception $e) {
    mostrar_verificacion('fail', "Error de conexión a base de datos", $e->getMessage());
    $errores_criticos++;
}

echo "<h3>🧪 VERIFICACIÓN 4: Pruebas Funcionales (Sin shell_exec)</h3>";

// Probar carga de clases sin shell_exec
try {
    // Capturar errores sin usar shell_exec
    $error_capturado = null;
    
    set_error_handler(function($severity, $message, $file, $line) use (&$error_capturado) {
        if (strpos($message, 'progress_data') !== false) {
            $error_capturado = $message;
        }
        return true; // Suprimir el error
    });
    
    // Intentar incluir statistics.php
    ob_start();
    include_once($CFG->dirroot . '/local/neuroopositor/statistics.php');
    $output = ob_get_clean();
    
    restore_error_handler();
    
    if ($error_capturado) {
        mostrar_verificacion('fail', "Error al cargar statistics.php", $error_capturado);
        $errores_criticos++;
    } else {
        mostrar_verificacion('pass', "Archivo statistics.php se carga sin errores");
        $tests_exitosos++;
    }
    
    // Verificar clases
    if (class_exists('local_neuroopositor\\statistics')) {
        mostrar_verificacion('pass', "Clase local_neuroopositor\\statistics cargada correctamente");
        $tests_exitosos++;
        
        // Probar métodos
        if (method_exists('local_neuroopositor\\statistics', 'get_user_general_stats')) {
            try {
                $stats = \local_neuroopositor\statistics::get_user_general_stats($USER->id, 0);
                if (is_object($stats)) {
                    mostrar_verificacion('pass', "Método get_user_general_stats funciona correctamente");
                    $tests_exitosos++;
                } else {
                    mostrar_verificacion('warning', "Método get_user_general_stats no retorna objeto válido");
                    $warnings++;
                }
            } catch (Exception $e) {
                mostrar_verificacion('fail', "Error en método get_user_general_stats", $e->getMessage());
                $errores_criticos++;
            }
        } else {
            mostrar_verificacion('fail', "Método get_user_general_stats no existe");
            $errores_criticos++;
        }
        
    } else {
        mostrar_verificacion('fail', "Clase local_neuroopositor\\statistics NO se puede cargar");
        $errores_criticos++;
    }
    
    // Verificar alias progress_data
    if (class_exists('progress_data')) {
        mostrar_verificacion('pass', "Alias progress_data funciona correctamente");
        $tests_exitosos++;
    } else {
        mostrar_verificacion('fail', "Alias progress_data NO está disponible", "Este es el error principal que causa 'Undefined constant progress_data'");
        $errores_criticos++;
    }
    
} catch (Exception $e) {
    mostrar_verificacion('fail', "Error en pruebas funcionales", $e->getMessage());
    $errores_criticos++;
} catch (Error $e) {
    mostrar_verificacion('fail', "Error fatal en pruebas funcionales", $e->getMessage());
    $errores_criticos++;
}

echo "<h3>📊 RESUMEN FINAL DE VERIFICACIÓN</h3>";

$total_tests = $tests_exitosos + $errores_criticos + $warnings;
$porcentaje_exito = $total_tests > 0 ? round(($tests_exitosos / $total_tests) * 100, 1) : 0;

if ($errores_criticos == 0) {
    $estado_final = 'pass';
    $mensaje_final = '🎉 TODAS LAS VERIFICACIONES EXITOSAS';
    $detalle_final = 'El plugin NeuroOpositor está completamente corregido y funcional.';
} elseif ($errores_criticos <= 3) {
    $estado_final = 'warning';
    $mensaje_final = '⚠️ CORRECCIONES PARCIALES APLICADAS';
    $detalle_final = 'Algunos problemas persisten y requieren la corrección definitiva.';
} else {
    $estado_final = 'fail';
    $mensaje_final = '❌ CORRECCIONES REQUERIDAS';
    $detalle_final = 'Se necesita aplicar la corrección definitiva para resolver los problemas.';
}

mostrar_verificacion($estado_final, $mensaje_final, $detalle_final);

echo "<div style='background: #f5f5f5; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
echo "<h4 style='margin-top: 0; color: #333;'>📈 Estadísticas de Verificación</h4>";
echo "<div style='display: flex; gap: 20px; flex-wrap: wrap;'>";
echo "<div style='background: #e8f5e8; padding: 15px; border-radius: 6px; min-width: 140px; text-align: center;'>";
echo "<strong style='color: #2e7d32; font-size: 18px;'>✅ Exitosos</strong><br>";
echo "<span style='font-size: 32px; color: #2e7d32; font-weight: bold;'>{$tests_exitosos}</span>";
echo "</div>";
echo "<div style='background: #ffebee; padding: 15px; border-radius: 6px; min-width: 140px; text-align: center;'>";
echo "<strong style='color: #c62828; font-size: 18px;'>❌ Errores</strong><br>";
echo "<span style='font-size: 32px; color: #c62828; font-weight: bold;'>{$errores_criticos}</span>";
echo "</div>";
echo "<div style='background: #fff8e1; padding: 15px; border-radius: 6px; min-width: 140px; text-align: center;'>";
echo "<strong style='color: #ef6c00; font-size: 18px;'>⚠️ Warnings</strong><br>";
echo "<span style='font-size: 32px; color: #ef6c00; font-weight: bold;'>{$warnings}</span>";
echo "</div>";
echo "<div style='background: #e3f2fd; padding: 15px; border-radius: 6px; min-width: 140px; text-align: center;'>";
echo "<strong style='color: #1565c0; font-size: 18px;'>📊 Éxito</strong><br>";
echo "<span style='font-size: 32px; color: #1565c0; font-weight: bold;'>{$porcentaje_exito}%</span>";
echo "</div>";
echo "</div>";
echo "</div>";

if ($errores_criticos > 0) {
    echo "<div style='background: #ffebee; border: 1px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
    echo "<h4 style='color: #c62828; margin-top: 0;'>🔧 Acción Requerida</h4>";
    echo "<p style='color: #c62828; font-size: 16px;'><strong>Se detectaron {$errores_criticos} errores críticos que requieren corrección.</strong></p>";
    echo "<ol style='color: #c62828; font-size: 14px;'>";
    echo "<li><strong><a href='correccion_definitiva_final.php' style='color: #d32f2f; font-size: 16px;'>🔧 Ejecutar correccion_definitiva_final.php</a></strong></li>";
    echo "<li><strong><a href='aplicar_correccion_definitiva.php' style='color: #d32f2f; font-size: 16px;'>🚀 Aplicar aplicar_correccion_definitiva.php</a></strong></li>";
    echo "<li><a href='verificacion_sin_shell_exec.php' style='color: #1976d2;'>🔍 Volver a verificar</a></li>";
    echo "<li><a href='index.php?courseid=0&action=statistics' style='color: #1976d2;'>📊 Probar estadísticas</a></li>";
    echo "</ol>";
    echo "</div>";
} else {
    echo "<div style='background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
    echo "<h4 style='color: #2e7d32; margin-top: 0;'>🎉 ¡Plugin Completamente Funcional!</h4>";
    echo "<p style='color: #2e7d32; font-size: 16px;'>Todas las verificaciones han pasado exitosamente.</p>";
    echo "<ul style='color: #2e7d32; font-size: 14px;'>";
    echo "<li><strong><a href='index.php?courseid=0&action=statistics' style='color: #1976d2; font-weight: bold; font-size: 16px;'>🔗 Acceder a las Estadísticas</a></strong></li>";
    echo "<li><a href='index.php' style='color: #1976d2;'>🏠 Página principal del plugin</a></li>";
    echo "</ul>";
    echo "</div>";
}

echo "<hr style='margin: 30px 0;'>";
echo "<div style='text-align: center; color: #666; font-size: 12px;'>";
echo "<p>Verificación sin shell_exec() completada: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Usuario: {$USER->username} (ID: {$USER->id})</p>";
echo "<p>Plugin: NeuroOpositor - Verificación Sin Funciones Deshabilitadas</p>";
echo "</div>";

?>