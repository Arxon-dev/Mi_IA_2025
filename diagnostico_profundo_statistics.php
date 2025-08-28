<?php
// Script de diagnóstico profundo para el error de estadísticas
// Este script debe subirse al hosting para detectar el problema exacto

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Diagnóstico Profundo del Error de Estadísticas</h2>";
echo "<hr>";

// 1. Verificar si el archivo statistics.php existe y es accesible
echo "<h3>1. Verificando archivo statistics.php</h3>";
$stats_file = $CFG->dirroot . '/local/neuroopositor/classes/statistics.php';
if (file_exists($stats_file)) {
    echo "✓ Archivo statistics.php existe<br>";
    echo "Ubicación: {$stats_file}<br>";
    echo "Tamaño: " . filesize($stats_file) . " bytes<br>";
    echo "Última modificación: " . date('Y-m-d H:i:s', filemtime($stats_file)) . "<br>";
    
    // Verificar permisos
    if (is_readable($stats_file)) {
        echo "✓ Archivo es legible<br>";
    } else {
        echo "✗ Archivo NO es legible<br>";
    }
} else {
    echo "✗ Archivo statistics.php NO existe<br>";
}

echo "<hr>";

// 2. Intentar cargar la clase statistics
echo "<h3>2. Intentando cargar la clase statistics</h3>";
try {
    require_once($CFG->dirroot . '/local/neuroopositor/classes/statistics.php');
    echo "✓ Archivo statistics.php cargado exitosamente<br>";
    
    // Verificar si la clase existe
    if (class_exists('local_neuroopositor\\statistics')) {
        echo "✓ Clase local_neuroopositor\\statistics existe<br>";
        
        // Verificar métodos
        $reflection = new ReflectionClass('local_neuroopositor\\statistics');
        $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC | ReflectionMethod::IS_STATIC);
        echo "Métodos públicos estáticos disponibles:<br>";
        foreach ($methods as $method) {
            echo "- {$method->getName()}<br>";
        }
    } else {
        echo "✗ Clase local_neuroopositor\\statistics NO existe<br>";
    }
} catch (Exception $e) {
    echo "✗ Error al cargar statistics.php: " . $e->getMessage() . "<br>";
    echo "Línea: " . $e->getLine() . "<br>";
    echo "Archivo: " . $e->getFile() . "<br>";
}

echo "<hr>";

// 3. Probar llamada directa al método get_user_general_stats
echo "<h3>3. Probando método get_user_general_stats</h3>";
try {
    if (class_exists('local_neuroopositor\\statistics')) {
        $userid = $USER->id;
        $courseid = 0;
        
        echo "Llamando get_user_general_stats({$userid}, {$courseid})<br>";
        $stats = \local_neuroopositor\statistics::get_user_general_stats($userid, $courseid);
        
        echo "✓ Método ejecutado exitosamente<br>";
        echo "Resultado:<br>";
        echo "<pre>" . print_r($stats, true) . "</pre>";
        
        if (isset($stats['error'])) {
            echo "<strong>✗ Error detectado en estadísticas: {$stats['error']}</strong><br>";
        }
    } else {
        echo "✗ No se puede probar - clase no disponible<br>";
    }
} catch (Exception $e) {
    echo "✗ Error al ejecutar get_user_general_stats: " . $e->getMessage() . "<br>";
    echo "Línea: " . $e->getLine() . "<br>";
    echo "Archivo: " . $e->getFile() . "<br>";
    echo "Stack trace:<br><pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";

// 4. Verificar el archivo views/statistics.php
echo "<h3>4. Verificando archivo views/statistics.php</h3>";
$views_file = $CFG->dirroot . '/local/neuroopositor/views/statistics.php';
if (file_exists($views_file)) {
    echo "✓ Archivo views/statistics.php existe<br>";
    echo "Ubicación: {$views_file}<br>";
    echo "Tamaño: " . filesize($views_file) . " bytes<br>";
    echo "Última modificación: " . date('Y-m-d H:i:s', filemtime($views_file)) . "<br>";
    
    // Leer las primeras líneas para verificar sintaxis
    $content = file_get_contents($views_file, false, null, 0, 1000);
    echo "Primeras líneas del archivo:<br>";
    echo "<pre>" . htmlspecialchars($content) . "...</pre>";
} else {
    echo "✗ Archivo views/statistics.php NO existe<br>";
}

echo "<hr>";

// 5. Simular exactamente lo que hace views/statistics.php
echo "<h3>5. Simulando ejecución de views/statistics.php</h3>";
try {
    $userid = $USER->id;
    $courseid = optional_param('courseid', 0, PARAM_INT);
    $period = optional_param('period', 'week', PARAM_ALPHA);
    $view = optional_param('view', 'overview', PARAM_ALPHA);
    
    echo "Parámetros:<br>";
    echo "- userid: {$userid}<br>";
    echo "- courseid: {$courseid}<br>";
    echo "- period: {$period}<br>";
    echo "- view: {$view}<br><br>";
    
    if (class_exists('local_neuroopositor\\statistics')) {
        echo "Ejecutando get_user_general_stats...<br>";
        $general_stats = \local_neuroopositor\statistics::get_user_general_stats($userid, $courseid);
        echo "✓ get_user_general_stats completado<br>";
        
        echo "Ejecutando get_user_block_stats...<br>";
        $block_stats = \local_neuroopositor\statistics::get_user_block_stats($userid, $courseid);
        echo "✓ get_user_block_stats completado<br>";
        
        echo "Ejecutando get_user_progress_history...<br>";
        $progress_history = \local_neuroopositor\statistics::get_user_progress_history($userid, $courseid);
        echo "✓ get_user_progress_history completado<br>";
        
        echo "Ejecutando get_topic_performance...<br>";
        $topic_performance = \local_neuroopositor\statistics::get_topic_performance($userid, $courseid);
        echo "✓ get_topic_performance completado<br>";
        
        echo "<br><strong>✓ Todas las funciones de estadísticas ejecutadas exitosamente</strong><br>";
        
        // Mostrar resumen de datos
        echo "<br>Resumen de datos obtenidos:<br>";
        echo "- General stats: " . (is_array($general_stats) ? count($general_stats) . " elementos" : "No es array") . "<br>";
        echo "- Block stats: " . (is_array($block_stats) ? count($block_stats) . " elementos" : "No es array") . "<br>";
        echo "- Progress history: " . (is_array($progress_history) ? count($progress_history) . " elementos" : "No es array") . "<br>";
        echo "- Topic performance: " . (is_array($topic_performance) ? count($topic_performance) . " elementos" : "No es array") . "<br>";
        
    } else {
        echo "✗ Clase statistics no disponible para simulación<br>";
    }
    
} catch (Exception $e) {
    echo "✗ Error durante simulación: " . $e->getMessage() . "<br>";
    echo "Línea: " . $e->getLine() . "<br>";
    echo "Archivo: " . $e->getFile() . "<br>";
    echo "Stack trace:<br><pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";

// 6. Verificar si hay algún error de sintaxis en statistics.php
echo "<h3>6. Verificando sintaxis de statistics.php</h3>";
if (file_exists($stats_file)) {
    $output = [];
    $return_var = 0;
    exec("php -l {$stats_file} 2>&1", $output, $return_var);
    
    if ($return_var === 0) {
        echo "✓ Sintaxis de statistics.php es correcta<br>";
    } else {
        echo "✗ Error de sintaxis en statistics.php:<br>";
        foreach ($output as $line) {
            echo htmlspecialchars($line) . "<br>";
        }
    }
} else {
    echo "✗ No se puede verificar sintaxis - archivo no existe<br>";
}

echo "<hr>";

// 7. Verificar logs de errores
echo "<h3>7. Verificando logs de errores recientes</h3>";
$error_log = ini_get('error_log');
if ($error_log && file_exists($error_log)) {
    echo "Log de errores: {$error_log}<br>";
    $recent_errors = shell_exec("tail -20 {$error_log}");
    if ($recent_errors) {
        echo "Últimos 20 errores:<br>";
        echo "<pre>" . htmlspecialchars($recent_errors) . "</pre>";
    } else {
        echo "No se pudieron leer los logs de errores<br>";
    }
} else {
    echo "No se encontró archivo de log de errores<br>";
}

echo "<hr>";
echo "<h3>Diagnóstico Completado</h3>";
echo "Fecha: " . date('Y-m-d H:i:s') . "<br>";
echo "<br><strong>Instrucciones:</strong><br>";
echo "1. Revisa cada sección del diagnóstico<br>";
echo "2. Identifica dónde aparece el primer error<br>";
echo "3. Si hay errores de sintaxis, corrígelos<br>";
echo "4. Si hay errores en las consultas SQL, revisa la estructura de la base de datos<br>";
echo "5. Si todo parece correcto pero sigue fallando, puede ser un problema de caché<br>";
?>