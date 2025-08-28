<?php
// Script de solución completa para el problema de statistics.php
// Combina diagnóstico, identificación de problemas y corrección automática

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Solución Completa - Error Statistics NeuroOpositor</h1>";
echo "<p>Este script diagnostica y corrige automáticamente los problemas en statistics.php</p>";
echo "<hr>";

// PASO 1: DIAGNÓSTICO INICIAL
echo "<h2>PASO 1: Diagnóstico Inicial</h2>";

echo "<h3>1.1 Verificación de Base de Datos</h3>";
echo "✓ Conexión a BD: " . $DB->get_dbfamily() . "<br>";
echo "✓ Prefijo de tablas: " . $CFG->prefix . "<br>";

// Verificar tablas
echo "<h3>1.2 Verificación de Tablas</h3>";
$tablas_neuroopositor = [
    'neuroopositor_temas',
    'neuroopositor_user_progress',
    'neuroopositor_connections',
    'neuroopositor_neural_paths'
];

$tablas_existentes = [];
foreach ($tablas_neuroopositor as $tabla) {
    try {
        $count = $DB->count_records($tabla);
        echo "✓ Tabla {$tabla}: {$count} registros<br>";
        $tablas_existentes[] = $tabla;
    } catch (Exception $e) {
        echo "✗ Tabla {$tabla}: No existe o error<br>";
    }
}

echo "<hr>";

// PASO 2: IDENTIFICACIÓN DE PROBLEMAS
echo "<h2>PASO 2: Identificación de Problemas</h2>";

$problemas = [];
$correcciones = [];

// Problema 1: Verificar columna 'nombre' vs 'titulo' en neuroopositor_temas
echo "<h3>2.1 Verificando Columnas en neuroopositor_temas</h3>";
try {
    $sql = "SELECT nombre FROM {neuroopositor_temas} LIMIT 1";
    $result = $DB->get_record_sql($sql);
    echo "✓ Columna 'nombre' existe<br>";
} catch (Exception $e) {
    echo "✗ Columna 'nombre' NO existe<br>";
    $problemas[] = "Columna 'nombre' no existe en neuroopositor_temas";
    
    // Verificar si existe 'titulo'
    try {
        $sql = "SELECT titulo FROM {neuroopositor_temas} LIMIT 1";
        $result = $DB->get_record_sql($sql);
        echo "✓ Columna 'titulo' existe como alternativa<br>";
        $correcciones['neuroopositor_temas']['nombre'] = 'titulo';
    } catch (Exception $e2) {
        echo "✗ Tampoco existe 'titulo'<br>";
        $problemas[] = "No existe ni 'nombre' ni 'titulo' en neuroopositor_temas";
    }
}

// Problema 2: Verificar columnas en neuroopositor_user_progress
echo "<h3>2.2 Verificando Columnas en neuroopositor_user_progress</h3>";
$columnas_verificar = [
    'correct' => 'preguntas_correctas',
    'time_spent' => 'tiempo_estudio_segundos',
    'total_questions' => 'preguntas_totales'
];

foreach ($columnas_verificar as $columna_incorrecta => $columna_correcta) {
    try {
        $sql = "SELECT {$columna_incorrecta} FROM {neuroopositor_user_progress} LIMIT 1";
        $result = $DB->get_record_sql($sql);
        echo "✓ Columna '{$columna_incorrecta}' existe<br>";
    } catch (Exception $e) {
        echo "✗ Columna '{$columna_incorrecta}' NO existe<br>";
        $problemas[] = "Columna '{$columna_incorrecta}' no existe en neuroopositor_user_progress";
        
        // Verificar si existe la columna correcta
        try {
            $sql = "SELECT {$columna_correcta} FROM {neuroopositor_user_progress} LIMIT 1";
            $result = $DB->get_record_sql($sql);
            echo "✓ Columna '{$columna_correcta}' existe como alternativa<br>";
            $correcciones['neuroopositor_user_progress'][$columna_incorrecta] = $columna_correcta;
        } catch (Exception $e2) {
            echo "✗ Tampoco existe '{$columna_correcta}'<br>";
            $problemas[] = "No existe ni '{$columna_incorrecta}' ni '{$columna_correcta}' en neuroopositor_user_progress";
        }
    }
}

echo "<h3>2.3 Resumen de Problemas Identificados</h3>";
if (!empty($problemas)) {
    echo "<ul>";
    foreach ($problemas as $problema) {
        echo "<li>{$problema}</li>";
    }
    echo "</ul>";
} else {
    echo "✓ No se identificaron problemas de columnas<br>";
}

echo "<h3>2.4 Correcciones Necesarias</h3>";
if (!empty($correcciones)) {
    echo "<pre>";
    print_r($correcciones);
    echo "</pre>";
} else {
    echo "✓ No se requieren correcciones de mapeo de columnas<br>";
}

echo "<hr>";

// PASO 3: APLICAR CORRECCIONES
echo "<h2>PASO 3: Aplicando Correcciones</h2>";

if (!empty($correcciones)) {
    
    // Leer archivo statistics.php actual
    $statistics_path = $CFG->dirroot . '/local/neuroopositor/classes/statistics.php';
    if (!file_exists($statistics_path)) {
        echo "✗ No se encontró el archivo statistics.php<br>";
        exit;
    }
    
    $statistics_content = file_get_contents($statistics_path);
    echo "✓ Archivo statistics.php leído (" . strlen($statistics_content) . " bytes)<br>";
    
    $statistics_corregido = $statistics_content;
    $correcciones_aplicadas = 0;
    
    // Aplicar correcciones específicas
    foreach ($correcciones as $tabla => $mapeo_columnas) {
        echo "<h4>Corrigiendo tabla: {$tabla}</h4>";
        
        foreach ($mapeo_columnas as $columna_incorrecta => $columna_correcta) {
            echo "Corrigiendo: {$columna_incorrecta} -> {$columna_correcta}<br>";
            
            // Patrones específicos para cada corrección
            $patterns = [];
            $replacements = [];
            
            if ($columna_incorrecta == 'nombre' && $columna_correcta == 'titulo') {
                $patterns = [
                    '/([^a-zA-Z_])nombre([^a-zA-Z_])/',
                    '/t\.nombre/',
                    '/nombre as tema_nombre/',
                    '/SELECT nombre/',
                    '/\, nombre\,/',
                    '/\, nombre FROM/'
                ];
                $replacements = [
                    '$1titulo$2',
                    't.titulo',
                    'titulo as tema_nombre',
                    'SELECT titulo',
                    ', titulo,',
                    ', titulo FROM'
                ];
            } elseif ($columna_incorrecta == 'correct') {
                $patterns = [
                    '/up\.correct/',
                    '/WHEN up\.correct = 1/',
                    '/SUM\(CASE WHEN up\.correct = 1 THEN 1 ELSE 0 END\)/',
                    '/WHERE correct =/',
                    '/\, correct\,/'
                ];
                $replacements = [
                    'up.preguntas_correctas',
                    'WHEN up.preguntas_correctas > 0',
                    'SUM(up.preguntas_correctas)',
                    'WHERE preguntas_correctas =',
                    ', preguntas_correctas,'
                ];
            } elseif ($columna_incorrecta == 'time_spent') {
                $patterns = [
                    '/up\.time_spent/',
                    '/SUM\(time_spent\)/',
                    '/\, time_spent\,/',
                    '/time_spent as/'
                ];
                $replacements = [
                    'up.tiempo_estudio_segundos',
                    'SUM(tiempo_estudio_segundos)',
                    ', tiempo_estudio_segundos,',
                    'tiempo_estudio_segundos as'
                ];
            }
            
            // Aplicar patrones
            foreach ($patterns as $i => $pattern) {
                $new_content = preg_replace($pattern, $replacements[$i], $statistics_corregido);
                if ($new_content !== $statistics_corregido) {
                    $statistics_corregido = $new_content;
                    $correcciones_aplicadas++;
                    echo "&nbsp;&nbsp;✓ Aplicado: {$pattern}<br>";
                }
            }
        }
    }
    
    // Corrección adicional: Arreglar warnings de round() con null
    echo "<h4>Corrigiendo warnings de round()</h4>";
    $round_patterns = [
        '/round\(\$([a-zA-Z_]+->)?([a-zA-Z_]+), (\d+)\)/' => 'round(($1$2 ?: 0), $3)',
        '/round\(\$([a-zA-Z_]+), (\d+)\)/' => 'round(($1 ?: 0), $2)'
    ];
    
    foreach ($round_patterns as $pattern => $replacement) {
        $new_content = preg_replace($pattern, $replacement, $statistics_corregido);
        if ($new_content !== $statistics_corregido) {
            $statistics_corregido = $new_content;
            $correcciones_aplicadas++;
            echo "✓ Corregido warning de round()<br>";
        }
    }
    
    echo "<br><strong>Total de correcciones aplicadas: {$correcciones_aplicadas}</strong><br>";
    
    // Guardar archivo corregido
    $corrected_file_path = $CFG->dirroot . '/local/neuroopositor/classes/statistics_solucion_completa.php';
    if (file_put_contents($corrected_file_path, $statistics_corregido)) {
        echo "✓ Archivo corregido guardado: statistics_solucion_completa.php<br>";
        
        // Crear script de instalación
        $install_script = '<?php\n';
        $install_script .= '// Script de instalación automática\n';
        $install_script .= 'require_once("../../../config.php");\n';
        $install_script .= 'require_login();\n\n';
        $install_script .= 'echo "<h2>Instalación de Statistics.php Corregido</h2>";\n';
        $install_script .= '$source = $CFG->dirroot . "/local/neuroopositor/classes/statistics_solucion_completa.php";\n';
        $install_script .= '$backup = $CFG->dirroot . "/local/neuroopositor/classes/statistics_backup_" . date("Y-m-d_H-i-s") . ".php";\n';
        $install_script .= '$target = $CFG->dirroot . "/local/neuroopositor/classes/statistics.php";\n\n';
        $install_script .= 'if (file_exists($target)) {\n';
        $install_script .= '    copy($target, $backup);\n';
        $install_script .= '    echo "✓ Backup creado: " . basename($backup) . "<br>";\n';
        $install_script .= '}\n\n';
        $install_script .= 'if (copy($source, $target)) {\n';
        $install_script .= '    echo "✓ Archivo statistics.php actualizado exitosamente<br>";\n';
        $install_script .= '    echo "<br><a href=\"../index.php?courseid=0&action=statistics\">Probar Statistics</a>";\n';
        $install_script .= '} else {\n';
        $install_script .= '    echo "✗ Error al actualizar statistics.php<br>";\n';
        $install_script .= '}\n';
        $install_script .= '?>';
        
        $install_file_path = $CFG->dirroot . '/local/neuroopositor/classes/instalar_solucion.php';
        file_put_contents($install_file_path, $install_script);
        
        echo "✓ Script de instalación creado: instalar_solucion.php<br>";
    } else {
        echo "✗ Error al guardar archivo corregido<br>";
    }
    
} else {
    echo "No se requieren correcciones de mapeo de columnas.<br>";
    echo "El problema puede ser de otro tipo (permisos, configuración, etc.)<br>";
}

echo "<hr>";

// PASO 4: INSTRUCCIONES FINALES
echo "<h2>PASO 4: Instrucciones Finales</h2>";

if (!empty($correcciones) && $correcciones_aplicadas > 0) {
    echo "<div style='background: #e8f5e8; padding: 15px; border: 1px solid #4CAF50;'>";
    echo "<h3>✓ Solución Generada Exitosamente</h3>";
    echo "<p><strong>Archivos creados:</strong></p>";
    echo "<ul>";
    echo "<li>statistics_solucion_completa.php - Archivo corregido</li>";
    echo "<li>instalar_solucion.php - Script de instalación automática</li>";
    echo "</ul>";
    
    echo "<p><strong>Opciones de instalación:</strong></p>";
    echo "<ol>";
    echo "<li><strong>Automática:</strong> Ejecuta <code>/local/neuroopositor/classes/instalar_solucion.php</code></li>";
    echo "<li><strong>Manual:</strong> Descarga 'statistics_solucion_completa.php', renómbralo a 'statistics.php' y súbelo</li>";
    echo "</ol>";
    
    echo "<p><a href='/local/neuroopositor/classes/instalar_solucion.php' style='background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Instalar Automáticamente</a></p>";
    echo "</div>";
} else {
    echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffc107;'>";
    echo "<h3>⚠ No se Aplicaron Correcciones Automáticas</h3>";
    echo "<p>Esto puede indicar que:</p>";
    echo "<ul>";
    echo "<li>Las columnas ya tienen los nombres correctos</li>";
    echo "<li>El problema es de configuración o permisos</li>";
    echo "<li>Hay un error más profundo en el código</li>";
    echo "</ul>";
    echo "<p>Recomendamos revisar manualmente el archivo statistics.php</p>";
    echo "</div>";
}

echo "<hr>";
echo "<p><strong>Proceso completado:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Usuario:</strong> {$USER->username} (ID: {$USER->id})</p>";
?>