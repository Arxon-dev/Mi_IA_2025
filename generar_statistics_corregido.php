<?php
// Script para generar automáticamente un statistics.php corregido
// basado en los problemas identificados en los diagnósticos

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Generador de Statistics.php Corregido</h2>";
echo "<hr>";

// 1. Verificar problemas conocidos
echo "<h3>1. Verificando Problemas Conocidos</h3>";

$problemas_identificados = [];

// Verificar si 'nombre' existe en neuroopositor_temas
try {
    $sql = "SELECT nombre FROM {neuroopositor_temas} LIMIT 1";
    $result = $DB->get_record_sql($sql);
    echo "✓ Columna 'nombre' existe en neuroopositor_temas<br>";
} catch (Exception $e) {
    echo "✗ Columna 'nombre' NO existe en neuroopositor_temas<br>";
    $problemas_identificados['neuroopositor_temas']['nombre'] = 'titulo';
    
    // Verificar si 'titulo' existe
    try {
        $sql = "SELECT titulo FROM {neuroopositor_temas} LIMIT 1";
        $result = $DB->get_record_sql($sql);
        echo "✓ Columna 'titulo' existe como alternativa<br>";
    } catch (Exception $e2) {
        echo "✗ Tampoco existe 'titulo'<br>";
    }
}

// Verificar columnas en neuroopositor_user_progress
$columnas_verificar = ['correct', 'time_spent'];
foreach ($columnas_verificar as $columna) {
    try {
        $sql = "SELECT {$columna} FROM {neuroopositor_user_progress} LIMIT 1";
        $result = $DB->get_record_sql($sql);
        echo "✓ Columna '{$columna}' existe en neuroopositor_user_progress<br>";
    } catch (Exception $e) {
        echo "✗ Columna '{$columna}' NO existe en neuroopositor_user_progress<br>";
        
        // Mapear a columnas correctas
        if ($columna == 'correct') {
            $problemas_identificados['neuroopositor_user_progress']['correct'] = 'preguntas_correctas';
        } elseif ($columna == 'time_spent') {
            $problemas_identificados['neuroopositor_user_progress']['time_spent'] = 'tiempo_estudio_segundos';
        }
    }
}

echo "<br><strong>Problemas identificados:</strong><br>";
echo "<pre>";
print_r($problemas_identificados);
echo "</pre>";

echo "<hr>";

// 2. Leer el archivo statistics.php actual
echo "<h3>2. Leyendo Archivo Statistics.php Actual</h3>";

$statistics_path = $CFG->dirroot . '/local/neuroopositor/classes/statistics.php';
if (file_exists($statistics_path)) {
    $statistics_content = file_get_contents($statistics_path);
    echo "✓ Archivo statistics.php leído exitosamente<br>";
    echo "Tamaño: " . strlen($statistics_content) . " bytes<br>";
} else {
    echo "✗ No se pudo leer el archivo statistics.php<br>";
    exit;
}

echo "<hr>";

// 3. Aplicar correcciones automáticas
echo "<h3>3. Aplicando Correcciones Automáticas</h3>";

$statistics_corregido = $statistics_content;
$correcciones_aplicadas = 0;

// Aplicar correcciones basadas en problemas identificados
if (!empty($problemas_identificados)) {
    
    // Corrección 1: nombre -> titulo en neuroopositor_temas
    if (isset($problemas_identificados['neuroopositor_temas']['nombre'])) {
        $patterns = [
            '/t\.nombre/',
            '/nombre as tema_nombre/',
            '/SELECT nombre/',
            '/\, nombre\,/',
            '/\, nombre FROM/'
        ];
        
        $replacements = [
            't.titulo',
            'titulo as tema_nombre',
            'SELECT titulo',
            ', titulo,',
            ', titulo FROM'
        ];
        
        foreach ($patterns as $i => $pattern) {
            $new_content = preg_replace($pattern, $replacements[$i], $statistics_corregido);
            if ($new_content !== $statistics_corregido) {
                $statistics_corregido = $new_content;
                $correcciones_aplicadas++;
                echo "✓ Corrección aplicada: {$pattern} -> {$replacements[$i]}<br>";
            }
        }
    }
    
    // Corrección 2: correct -> preguntas_correctas
    if (isset($problemas_identificados['neuroopositor_user_progress']['correct'])) {
        $patterns = [
            '/up\.correct/',
            '/correct = 1/',
            '/SUM\(CASE WHEN up\.correct = 1 THEN 1 ELSE 0 END\)/',
            '/WHERE correct =/',
            '/\, correct\,/'
        ];
        
        $replacements = [
            'up.preguntas_correctas',
            'preguntas_correctas = 1',
            'SUM(up.preguntas_correctas)',
            'WHERE preguntas_correctas =',
            ', preguntas_correctas,'
        ];
        
        foreach ($patterns as $i => $pattern) {
            $new_content = preg_replace($pattern, $replacements[$i], $statistics_corregido);
            if ($new_content !== $statistics_corregido) {
                $statistics_corregido = $new_content;
                $correcciones_aplicadas++;
                echo "✓ Corrección aplicada: {$pattern} -> {$replacements[$i]}<br>";
            }
        }
    }
    
    // Corrección 3: time_spent -> tiempo_estudio_segundos
    if (isset($problemas_identificados['neuroopositor_user_progress']['time_spent'])) {
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
        
        foreach ($patterns as $i => $pattern) {
            $new_content = preg_replace($pattern, $replacements[$i], $statistics_corregido);
            if ($new_content !== $statistics_corregido) {
                $statistics_corregido = $new_content;
                $correcciones_aplicadas++;
                echo "✓ Corrección aplicada: {$pattern} -> {$replacements[$i]}<br>";
            }
        }
    }
}

// Corrección adicional: Arreglar el warning de round() con null
$round_pattern = '/round\(\$([^,]+), (\d+)\)/';
$round_replacement = 'round($1 ?: 0, $2)';
$new_content = preg_replace($round_pattern, $round_replacement, $statistics_corregido);
if ($new_content !== $statistics_corregido) {
    $statistics_corregido = $new_content;
    $correcciones_aplicadas++;
    echo "✓ Corrección aplicada: Arreglado warning de round() con valores null<br>";
}

echo "<br><strong>Total de correcciones aplicadas: {$correcciones_aplicadas}</strong><br>";

echo "<hr>";

// 4. Guardar archivo corregido
echo "<h3>4. Guardando Archivo Corregido</h3>";

$corrected_file_path = $CFG->dirroot . '/local/neuroopositor/classes/statistics_auto_corrected.php';
if (file_put_contents($corrected_file_path, $statistics_corregido)) {
    echo "✓ Archivo corregido guardado exitosamente<br>";
    echo "Ubicación: {$corrected_file_path}<br>";
    echo "Tamaño: " . strlen($statistics_corregido) . " bytes<br>";
    
    echo "<br><strong>Instrucciones:</strong><br>";
    echo "1. Descarga el archivo 'statistics_auto_corrected.php' desde el hosting<br>";
    echo "2. Renómbralo a 'statistics.php'<br>";
    echo "3. Haz una copia de seguridad del archivo original<br>";
    echo "4. Reemplaza el archivo original con la versión corregida<br>";
    echo "5. Sube el archivo al hosting<br>";
} else {
    echo "✗ Error al guardar el archivo corregido<br>";
}

echo "<hr>";

// 5. Probar las correcciones
echo "<h3>5. Probando las Correcciones</h3>";

if ($correcciones_aplicadas > 0) {
    echo "Se aplicaron {$correcciones_aplicadas} correcciones. ";
    echo "Recomendamos probar el archivo corregido antes de reemplazar el original.<br>";
    
    // Crear un script de prueba
    $test_script = '<?php\n';
    $test_script .= 'require_once("../../../config.php");\n';
    $test_script .= 'require_login();\n\n';
    $test_script .= 'echo "<h2>Prueba del Statistics.php Corregido</h2>";\n';
    $test_script .= 'try {\n';
    $test_script .= '    require_once("statistics_auto_corrected.php");\n';
    $test_script .= '    $stats = new \\local_neuroopositor\\statistics();\n';
    $test_script .= '    $result = $stats::get_user_general_stats($USER->id, 0);\n';
    $test_script .= '    echo "✓ Prueba exitosa<br>";\n';
    $test_script .= '    echo "<pre>";\n';
    $test_script .= '    print_r($result);\n';
    $test_script .= '    echo "</pre>";\n';
    $test_script .= '} catch (Exception $e) {\n';
    $test_script .= '    echo "✗ Error en la prueba: " . $e->getMessage();\n';
    $test_script .= '}\n';
    $test_script .= '?>';
    
    $test_file_path = $CFG->dirroot . '/local/neuroopositor/classes/test_statistics_corrected.php';
    if (file_put_contents($test_file_path, $test_script)) {
        echo "✓ Script de prueba creado: {$test_file_path}<br>";
        echo "Puedes ejecutar la prueba visitando: /local/neuroopositor/classes/test_statistics_corrected.php<br>";
    }
} else {
    echo "No se aplicaron correcciones automáticas. ";
    echo "Es posible que el problema sea más complejo y requiera revisión manual.<br>";
}

echo "<hr>";
echo "<h3>Proceso Completado</h3>";
echo "Fecha: " . date('Y-m-d H:i:s') . "<br>";
echo "Usuario: " . $USER->username . " (ID: {$USER->id})<br>";
?>