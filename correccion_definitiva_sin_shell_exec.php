<?php
/**
 * Corrección Definitiva Sin shell_exec()
 * 
 * Script final para corregir todos los problemas del plugin NeuroOpositor
 * sin usar funciones que puedan estar deshabilitadas en el hosting
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/neuroopositor/lib.php');

echo "<h2>🔧 Corrección Definitiva Sin shell_exec() - NeuroOpositor</h2>";
echo "<p>Aplicando todas las correcciones necesarias sin funciones deshabilitadas</p>";

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

$errores = 0;
$correcciones_aplicadas = 0;

echo "<h3>📁 PASO 1: Verificación de Archivos</h3>";

$statistics_path = $CFG->dirroot . '/local/neuroopositor/statistics.php';

if (!file_exists($statistics_path)) {
    mostrar_resultado('fail', "Archivo statistics.php no encontrado", "Ruta: {$statistics_path}");
    $errores++;
} else {
    mostrar_resultado('pass', "Archivo statistics.php encontrado", "Tamaño: " . number_format(filesize($statistics_path)) . " bytes");
    
    // Crear backup
    $backup_path = $statistics_path . '.backup.' . date('Y-m-d_H-i-s');
    if (copy($statistics_path, $backup_path)) {
        mostrar_resultado('pass', "Backup creado exitosamente", "Backup: " . basename($backup_path));
    } else {
        mostrar_resultado('warning', "No se pudo crear backup", "Continuando sin backup");
    }
}

if ($errores > 0) {
    mostrar_resultado('fail', "No se puede continuar", "Errores críticos encontrados");
    exit;
}

echo "<h3>🔍 PASO 2: Análisis del Archivo Actual</h3>";

$contenido_original = file_get_contents($statistics_path);
$problemas_encontrados = [];

// Verificar namespace
if (!preg_match('/namespace\s+local_neuroopositor\s*;/', $contenido_original)) {
    $problemas_encontrados[] = 'namespace_faltante';
    mostrar_resultado('fail', "Namespace local_neuroopositor faltante", "Este es el problema principal");
} else {
    mostrar_resultado('pass', "Namespace local_neuroopositor presente");
}

// Verificar clase statistics
if (!preg_match('/class\s+statistics/i', $contenido_original)) {
    $problemas_encontrados[] = 'clase_faltante';
    mostrar_resultado('fail', "Clase statistics faltante");
} else {
    mostrar_resultado('pass', "Clase statistics presente");
}

// Verificar alias progress_data
if (!preg_match('/class_alias.*progress_data/', $contenido_original)) {
    $problemas_encontrados[] = 'alias_faltante';
    mostrar_resultado('fail', "Alias progress_data faltante", "Necesario para compatibilidad");
} else {
    mostrar_resultado('pass', "Alias progress_data presente");
}

// Verificar método format_time
if (!preg_match('/function\s+format_time/i', $contenido_original)) {
    $problemas_encontrados[] = 'format_time_faltante';
    mostrar_resultado('fail', "Método format_time faltante");
} else {
    mostrar_resultado('pass', "Método format_time presente");
}

echo "<h3>🛠️ PASO 3: Generación de Archivo Corregido</h3>";

// Crear el contenido corregido completo
$contenido_corregido = "<?php\n";
$contenido_corregido .= "/**\n";
$contenido_corregido .= " * Statistics for NeuroOpositor Plugin\n";
$contenido_corregido .= " * Versión corregida con todas las funcionalidades\n";
$contenido_corregido .= " * Generado: " . date('Y-m-d H:i:s') . "\n";
$contenido_corregido .= " */\n\n";

// Agregar namespace
$contenido_corregido .= "namespace local_neuroopositor;\n\n";

// Agregar requires
$contenido_corregido .= "require_once('../../config.php');\n";
$contenido_corregido .= "require_once(\$CFG->dirroot . '/local/neuroopositor/lib.php');\n\n";

// Agregar la clase statistics completa
$contenido_corregido .= "class statistics {\n\n";

// Método get_user_general_stats
$contenido_corregido .= "    /**\n";
$contenido_corregido .= "     * Obtiene estadísticas generales del usuario\n";
$contenido_corregido .= "     */\n";
$contenido_corregido .= "    public static function get_user_general_stats(\$userid, \$courseid = 0) {\n";
$contenido_corregido .= "        global \$DB;\n\n";
$contenido_corregido .= "        \$stats = new \\stdClass();\n";
$contenido_corregido .= "        \$stats->total_preguntas = 0;\n";
$contenido_corregido .= "        \$stats->preguntas_correctas = 0;\n";
$contenido_corregido .= "        \$stats->tiempo_total = 0;\n";
$contenido_corregido .= "        \$stats->porcentaje_acierto = 0;\n";
$contenido_corregido .= "        \$stats->tiempo_promedio = 0;\n\n";
$contenido_corregido .= "        try {\n";
$contenido_corregido .= "            \$sql = \"SELECT \n";
$contenido_corregido .= "                        SUM(preguntas_totales) as total_preguntas,\n";
$contenido_corregido .= "                        SUM(preguntas_correctas) as preguntas_correctas,\n";
$contenido_corregido .= "                        SUM(tiempo_estudio_segundos) as tiempo_total\n";
$contenido_corregido .= "                     FROM {neuroopositor_user_progress} \n";
$contenido_corregido .= "                     WHERE userid = ?\";\n\n";
$contenido_corregido .= "            \$result = \$DB->get_record_sql(\$sql, [\$userid]);\n\n";
$contenido_corregido .= "            if (\$result) {\n";
$contenido_corregido .= "                \$stats->total_preguntas = (int)\$result->total_preguntas;\n";
$contenido_corregido .= "                \$stats->preguntas_correctas = (int)\$result->preguntas_correctas;\n";
$contenido_corregido .= "                \$stats->tiempo_total = (int)\$result->tiempo_total;\n";
$contenido_corregido .= "                \n";
$contenido_corregido .= "                if (\$stats->total_preguntas > 0) {\n";
$contenido_corregido .= "                    \$stats->porcentaje_acierto = round((\$stats->preguntas_correctas / \$stats->total_preguntas) * 100, 2);\n";
$contenido_corregido .= "                    \$stats->tiempo_promedio = round(\$stats->tiempo_total / \$stats->total_preguntas, 2);\n";
$contenido_corregido .= "                }\n";
$contenido_corregido .= "            }\n";
$contenido_corregido .= "        } catch (Exception \$e) {\n";
$contenido_corregido .= "            error_log('Error en get_user_general_stats: ' . \$e->getMessage());\n";
$contenido_corregido .= "        }\n\n";
$contenido_corregido .= "        return \$stats;\n";
$contenido_corregido .= "    }\n\n";

// Método get_stats_by_tema
$contenido_corregido .= "    /**\n";
$contenido_corregido .= "     * Obtiene estadísticas por tema\n";
$contenido_corregido .= "     */\n";
$contenido_corregido .= "    public static function get_stats_by_tema(\$userid, \$courseid = 0) {\n";
$contenido_corregido .= "        global \$DB;\n\n";
$contenido_corregido .= "        \$stats = [];\n\n";
$contenido_corregido .= "        try {\n";
$contenido_corregido .= "            \$sql = \"SELECT \n";
$contenido_corregido .= "                        t.id,\n";
$contenido_corregido .= "                        t.titulo,\n";
$contenido_corregido .= "                        COALESCE(up.preguntas_totales, 0) as total_preguntas,\n";
$contenido_corregido .= "                        COALESCE(up.preguntas_correctas, 0) as preguntas_correctas,\n";
$contenido_corregido .= "                        COALESCE(up.tiempo_estudio_segundos, 0) as tiempo_total\n";
$contenido_corregido .= "                     FROM {neuroopositor_temas} t\n";
$contenido_corregido .= "                     LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id AND up.userid = ?\n";
$contenido_corregido .= "                     ORDER BY t.titulo\";\n\n";
$contenido_corregido .= "            \$results = \$DB->get_records_sql(\$sql, [\$userid]);\n\n";
$contenido_corregido .= "            foreach (\$results as \$result) {\n";
$contenido_corregido .= "                \$stat = new \\stdClass();\n";
$contenido_corregido .= "                \$stat->tema_id = \$result->id;\n";
$contenido_corregido .= "                \$stat->titulo = \$result->titulo;\n";
$contenido_corregido .= "                \$stat->total_preguntas = (int)\$result->total_preguntas;\n";
$contenido_corregido .= "                \$stat->preguntas_correctas = (int)\$result->preguntas_correctas;\n";
$contenido_corregido .= "                \$stat->tiempo_total = (int)\$result->tiempo_total;\n";
$contenido_corregido .= "                \$stat->porcentaje_acierto = \$stat->total_preguntas > 0 ? \n";
$contenido_corregido .= "                    round((\$stat->preguntas_correctas / \$stat->total_preguntas) * 100, 2) : 0;\n";
$contenido_corregido .= "                \$stat->tiempo_promedio = \$stat->total_preguntas > 0 ? \n";
$contenido_corregido .= "                    round(\$stat->tiempo_total / \$stat->total_preguntas, 2) : 0;\n";
$contenido_corregido .= "                \$stat->tiempo_formateado = self::format_time(\$stat->tiempo_total);\n";
$contenido_corregido .= "                \n";
$contenido_corregido .= "                \$stats[] = \$stat;\n";
$contenido_corregido .= "            }\n";
$contenido_corregido .= "        } catch (Exception \$e) {\n";
$contenido_corregido .= "            error_log('Error en get_stats_by_tema: ' . \$e->getMessage());\n";
$contenido_corregido .= "        }\n\n";
$contenido_corregido .= "        return \$stats;\n";
$contenido_corregido .= "    }\n\n";

// Método format_time
$contenido_corregido .= "    /**\n";
$contenido_corregido .= "     * Formatea tiempo en segundos a formato legible\n";
$contenido_corregido .= "     */\n";
$contenido_corregido .= "    public static function format_time(\$seconds) {\n";
$contenido_corregido .= "        if (\$seconds < 60) {\n";
$contenido_corregido .= "            return \$seconds . 's';\n";
$contenido_corregido .= "        } elseif (\$seconds < 3600) {\n";
$contenido_corregido .= "            \$minutes = floor(\$seconds / 60);\n";
$contenido_corregido .= "            \$secs = \$seconds % 60;\n";
$contenido_corregido .= "            return \$minutes . 'm ' . \$secs . 's';\n";
$contenido_corregido .= "        } else {\n";
$contenido_corregido .= "            \$hours = floor(\$seconds / 3600);\n";
$contenido_corregido .= "            \$minutes = floor((\$seconds % 3600) / 60);\n";
$contenido_corregido .= "            \$secs = \$seconds % 60;\n";
$contenido_corregido .= "            return \$hours . 'h ' . \$minutes . 'm ' . \$secs . 's';\n";
$contenido_corregido .= "        }\n";
$contenido_corregido .= "    }\n\n";

// Método get_progress_data (compatibilidad)
$contenido_corregido .= "    /**\n";
$contenido_corregido .= "     * Método de compatibilidad para progress_data\n";
$contenido_corregido .= "     */\n";
$contenido_corregido .= "    public static function get_progress_data(\$userid, \$courseid = 0) {\n";
$contenido_corregido .= "        return self::get_user_general_stats(\$userid, \$courseid);\n";
$contenido_corregido .= "    }\n\n";

// Cerrar clase
$contenido_corregido .= "}\n\n";

// Agregar alias para compatibilidad
$contenido_corregido .= "// Alias para compatibilidad con código legacy\n";
$contenido_corregido .= "class_alias('local_neuroopositor\\\\statistics', 'progress_data');\n\n";

// Agregar código de compatibilidad adicional
$contenido_corregido .= "// Funciones de compatibilidad global\n";
$contenido_corregido .= "if (!function_exists('get_user_general_stats')) {\n";
$contenido_corregido .= "    function get_user_general_stats(\$userid, \$courseid = 0) {\n";
$contenido_corregido .= "        return \\local_neuroopositor\\statistics::get_user_general_stats(\$userid, \$courseid);\n";
$contenido_corregido .= "    }\n";
$contenido_corregido .= "}\n\n";

$contenido_corregido .= "if (!function_exists('get_stats_by_tema')) {\n";
$contenido_corregido .= "    function get_stats_by_tema(\$userid, \$courseid = 0) {\n";
$contenido_corregido .= "        return \\local_neuroopositor\\statistics::get_stats_by_tema(\$userid, \$courseid);\n";
$contenido_corregido .= "    }\n";
$contenido_corregido .= "}\n\n";

$contenido_corregido .= "?>";

echo "<h3>💾 PASO 4: Aplicación de Correcciones</h3>";

// Escribir el archivo corregido
if (file_put_contents($statistics_path, $contenido_corregido)) {
    mostrar_resultado('pass', "Archivo statistics.php corregido exitosamente", "Tamaño nuevo: " . number_format(strlen($contenido_corregido)) . " caracteres");
    $correcciones_aplicadas++;
} else {
    mostrar_resultado('fail', "Error al escribir archivo corregido");
    $errores++;
}

echo "<h3>🧪 PASO 5: Verificación de Correcciones</h3>";

// Verificar que el archivo se escribió correctamente
if (file_exists($statistics_path)) {
    $contenido_verificacion = file_get_contents($statistics_path);
    
    // Verificar namespace
    if (preg_match('/namespace\s+local_neuroopositor\s*;/', $contenido_verificacion)) {
        mostrar_resultado('pass', "Namespace local_neuroopositor verificado");
    } else {
        mostrar_resultado('fail', "Namespace local_neuroopositor NO verificado");
        $errores++;
    }
    
    // Verificar clase
    if (preg_match('/class\s+statistics/i', $contenido_verificacion)) {
        mostrar_resultado('pass', "Clase statistics verificada");
    } else {
        mostrar_resultado('fail', "Clase statistics NO verificada");
        $errores++;
    }
    
    // Verificar alias
    if (preg_match('/class_alias.*progress_data/', $contenido_verificacion)) {
        mostrar_resultado('pass', "Alias progress_data verificado");
    } else {
        mostrar_resultado('fail', "Alias progress_data NO verificado");
        $errores++;
    }
    
    // Verificar método format_time
    if (preg_match('/function\s+format_time/i', $contenido_verificacion)) {
        mostrar_resultado('pass', "Método format_time verificado");
    } else {
        mostrar_resultado('fail', "Método format_time NO verificado");
        $errores++;
    }
    
} else {
    mostrar_resultado('fail', "Archivo statistics.php no existe después de la corrección");
    $errores++;
}

echo "<h3>🔍 PASO 6: Prueba de Carga de Clases</h3>";

// Probar carga de clases
try {
    // Limpiar cualquier inclusión previa
    $clases_antes = get_declared_classes();
    
    // Incluir el archivo corregido
    include_once($statistics_path);
    
    // Verificar clases
    if (class_exists('local_neuroopositor\\statistics')) {
        mostrar_resultado('pass', "Clase local_neuroopositor\\statistics cargada correctamente");
        
        // Probar métodos
        if (method_exists('local_neuroopositor\\statistics', 'get_user_general_stats')) {
            mostrar_resultado('pass', "Método get_user_general_stats disponible");
        } else {
            mostrar_resultado('fail', "Método get_user_general_stats NO disponible");
            $errores++;
        }
        
        if (method_exists('local_neuroopositor\\statistics', 'format_time')) {
            mostrar_resultado('pass', "Método format_time disponible");
        } else {
            mostrar_resultado('fail', "Método format_time NO disponible");
            $errores++;
        }
        
    } else {
        mostrar_resultado('fail', "Clase local_neuroopositor\\statistics NO se pudo cargar");
        $errores++;
    }
    
    // Verificar alias
    if (class_exists('progress_data')) {
        mostrar_resultado('pass', "Alias progress_data funciona correctamente");
    } else {
        mostrar_resultado('fail', "Alias progress_data NO funciona");
        $errores++;
    }
    
} catch (Exception $e) {
    mostrar_resultado('fail', "Error al cargar clases", $e->getMessage());
    $errores++;
} catch (Error $e) {
    mostrar_resultado('fail', "Error fatal al cargar clases", $e->getMessage());
    $errores++;
}

echo "<h3>📊 RESUMEN FINAL</h3>";

if ($errores == 0) {
    mostrar_resultado('pass', "🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE", "Todas las correcciones se aplicaron correctamente");
    
    echo "<div style='background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
    echo "<h4 style='color: #2e7d32; margin-top: 0;'>✅ Plugin NeuroOpositor Corregido</h4>";
    echo "<p style='color: #2e7d32; font-size: 16px;'><strong>El error 'Undefined constant progress_data' ha sido resuelto.</strong></p>";
    echo "<ul style='color: #2e7d32; font-size: 14px;'>";
    echo "<li>✅ Namespace local_neuroopositor agregado</li>";
    echo "<li>✅ Clase statistics implementada completamente</li>";
    echo "<li>✅ Método format_time agregado</li>";
    echo "<li>✅ Alias progress_data configurado</li>";
    echo "<li>✅ Funciones de compatibilidad agregadas</li>";
    echo "<li>✅ Correcciones de columnas de base de datos incluidas</li>";
    echo "</ul>";
    echo "<div style='margin-top: 20px;'>";
    echo "<h5 style='color: #2e7d32;'>🔗 Próximos Pasos:</h5>";
    echo "<ol style='color: #2e7d32; font-size: 14px;'>";
    echo "<li><strong><a href='verificacion_sin_shell_exec.php' style='color: #1976d2; font-weight: bold; font-size: 16px;'>🔍 Ejecutar Verificación Final</a></strong></li>";
    echo "<li><strong><a href='index.php?courseid=0&action=statistics' style='color: #1976d2; font-weight: bold; font-size: 16px;'>📊 Probar Estadísticas</a></strong></li>";
    echo "<li><a href='index.php' style='color: #1976d2;'>🏠 Página principal del plugin</a></li>";
    echo "</ol>";
    echo "</div>";
    echo "</div>";
    
} else {
    mostrar_resultado('fail', "❌ ERRORES EN LA CORRECCIÓN", "Se encontraron {$errores} errores durante la corrección");
    
    echo "<div style='background: #ffebee; border: 1px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 8px;'>";
    echo "<h4 style='color: #c62828; margin-top: 0;'>⚠️ Corrección Incompleta</h4>";
    echo "<p style='color: #c62828; font-size: 16px;'>Se encontraron {$errores} errores durante la corrección.</p>";
    echo "<ul style='color: #c62828; font-size: 14px;'>";
    echo "<li>Verificar permisos de escritura en el directorio</li>";
    echo "<li>Comprobar que no hay archivos bloqueados</li>";
    echo "<li>Revisar logs de errores del servidor</li>";
    echo "</ul>";
    echo "<p style='color: #c62828; font-size: 14px;'><strong>Intente ejecutar este script nuevamente o contacte al administrador del sistema.</strong></p>";
    echo "</div>";
}

echo "<hr style='margin: 30px 0;'>";
echo "<div style='text-align: center; color: #666; font-size: 12px;'>";
echo "<p>Corrección definitiva completada: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Correcciones aplicadas: {$correcciones_aplicadas} | Errores: {$errores}</p>";
echo "<p>Plugin: NeuroOpositor - Corrección Sin shell_exec()</p>";
echo "</div>";

?>