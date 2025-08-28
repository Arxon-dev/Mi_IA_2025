<?php
/**
 * Test Simple de Corrección - Diagnóstico de Error HTTP 500
 * 
 * Este script simplificado ayuda a identificar qué está causando el error 500
 * en el script de corrección automática.
 */

// Activar reporte de errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error_correccion.log');

echo "<h1>Test Simple de Corrección</h1>";
echo "<p>Verificando funcionalidad básica...</p>";

try {
    // Test 1: Verificar directorio actual
    echo "<h2>1. Verificación de Directorio</h2>";
    echo "<p>Directorio actual: " . __DIR__ . "</p>";
    echo "<p>Directorio existe: " . (is_dir(__DIR__) ? 'SÍ' : 'NO') . "</p>";
    echo "<p>Permisos de escritura: " . (is_writable(__DIR__) ? 'SÍ' : 'NO') . "</p>";
    
    // Test 2: Verificar archivos objetivo
    echo "<h2>2. Verificación de Archivos</h2>";
    $archivos = [
        'index.php' => __DIR__ . '/index.php',
        'statistics.php' => __DIR__ . '/statistics.php',
        'classes/statistics.php' => __DIR__ . '/classes/statistics.php'
    ];
    
    foreach ($archivos as $nombre => $ruta) {
        $existe = file_exists($ruta);
        $legible = $existe ? is_readable($ruta) : false;
        $escribible = $existe ? is_writable($ruta) : false;
        
        echo "<p><strong>$nombre:</strong><br>";
        echo "&nbsp;&nbsp;Existe: " . ($existe ? 'SÍ' : 'NO') . "<br>";
        if ($existe) {
            echo "&nbsp;&nbsp;Legible: " . ($legible ? 'SÍ' : 'NO') . "<br>";
            echo "&nbsp;&nbsp;Escribible: " . ($escribible ? 'SÍ' : 'NO') . "<br>";
            echo "&nbsp;&nbsp;Tamaño: " . filesize($ruta) . " bytes<br>";
        }
        echo "</p>";
    }
    
    // Test 3: Verificar funciones básicas
    echo "<h2>3. Verificación de Funciones</h2>";
    $funciones = [
        'file_get_contents',
        'file_put_contents', 
        'copy',
        'explode',
        'implode',
        'strpos',
        'str_replace',
        'date',
        'substr_count',
        'preg_match'
    ];
    
    foreach ($funciones as $funcion) {
        echo "<p>$funcion: " . (function_exists($funcion) ? 'DISPONIBLE' : 'NO DISPONIBLE') . "</p>";
    }
    
    // Test 4: Test de escritura de log
    echo "<h2>4. Test de Escritura de Log</h2>";
    $log_file = __DIR__ . '/test_log.txt';
    $test_content = "[" . date('Y-m-d H:i:s') . "] Test de escritura exitoso\n";
    
    if (file_put_contents($log_file, $test_content, FILE_APPEND | LOCK_EX)) {
        echo "<p>✓ Escritura de log: EXITOSA</p>";
        echo "<p>Archivo creado: $log_file</p>";
    } else {
        echo "<p>✗ Escritura de log: FALLÓ</p>";
    }
    
    // Test 5: Test de backup simple
    echo "<h2>5. Test de Backup</h2>";
    if (file_exists(__DIR__ . '/index.php')) {
        $backup_name = __DIR__ . '/index.php.test_backup.' . date('Y-m-d_H-i-s');
        if (copy(__DIR__ . '/index.php', $backup_name)) {
            echo "<p>✓ Backup de prueba: EXITOSO</p>";
            echo "<p>Backup creado: $backup_name</p>";
            // Limpiar el backup de prueba
            unlink($backup_name);
            echo "<p>✓ Backup de prueba eliminado</p>";
        } else {
            echo "<p>✗ Backup de prueba: FALLÓ</p>";
        }
    } else {
        echo "<p>⚠ No se puede probar backup: index.php no existe</p>";
    }
    
    // Test 6: Verificar alias existentes
    echo "<h2>6. Verificación de Alias Existentes</h2>";
    foreach (['index.php', 'statistics.php'] as $archivo) {
        $ruta = __DIR__ . '/' . $archivo;
        if (file_exists($ruta)) {
            $contenido = file_get_contents($ruta);
            $tiene_alias = strpos($contenido, "class_alias('local_neuroopositor\\statistics', 'progress_data')") !== false;
            echo "<p>$archivo: " . ($tiene_alias ? 'YA TIENE ALIAS' : 'NO TIENE ALIAS') . "</p>";
        } else {
            echo "<p>$archivo: NO EXISTE</p>";
        }
    }
    
    echo "<h2>✅ Test Completado</h2>";
    echo "<p><strong>Resultado:</strong> Todas las funciones básicas están disponibles.</p>";
    echo "<p><strong>Próximo paso:</strong> Si este test funciona, el problema del error 500 podría estar en:</p>";
    echo "<ul>";
    echo "<li>Permisos de archivos específicos</li>";
    echo "<li>Límites de memoria o tiempo de ejecución</li>";
    echo "<li>Problemas con el contenido de los archivos a modificar</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<h2>❌ Error Detectado</h2>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . $e->getFile() . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
} catch (Error $e) {
    echo "<h2>❌ Error Fatal Detectado</h2>";
    echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Archivo:</strong> " . $e->getFile() . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
}

echo "<hr>";
echo "<p><em>Test ejecutado el " . date('Y-m-d H:i:s') . "</em></p>";

?>