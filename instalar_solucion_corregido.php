<?php
// Script de instalación corregido para statistics.php
// Corrige el problema del script anterior que mostraba código en lugar de ejecutarse

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Instalación de Statistics.php Corregido</h1>";
echo "<p>Este script instala la versión corregida de statistics.php</p>";
echo "<hr>";

// Definir rutas
$source = $CFG->dirroot . '/local/neuroopositor/classes/statistics_solucion_completa.php';
$backup = $CFG->dirroot . '/local/neuroopositor/classes/statistics_backup_' . date('Y-m-d_H-i-s') . '.php';
$target = $CFG->dirroot . '/local/neuroopositor/classes/statistics.php';

echo "<h2>Verificando Archivos</h2>";

// Verificar que existe el archivo fuente
if (!file_exists($source)) {
    echo "<div style='background: #ffebee; padding: 15px; border: 1px solid #f44336; margin: 10px 0;'>";
    echo "<h3>✗ Error: Archivo fuente no encontrado</h3>";
    echo "<p>No se encontró: <code>{$source}</code></p>";
    echo "<p>Asegúrate de haber ejecutado primero el script 'solucion_completa_statistics.php'</p>";
    echo "</div>";
    exit;
}

echo "✓ Archivo fuente encontrado: " . basename($source) . " (" . filesize($source) . " bytes)<br>";

// Verificar que existe el archivo destino
if (file_exists($target)) {
    echo "✓ Archivo destino encontrado: " . basename($target) . " (" . filesize($target) . " bytes)<br>";
} else {
    echo "⚠ Archivo destino no existe: " . basename($target) . "<br>";
}

echo "<hr>";

echo "<h2>Proceso de Instalación</h2>";

// Paso 1: Crear backup del archivo actual
if (file_exists($target)) {
    echo "<h3>Paso 1: Creando Backup</h3>";
    
    if (copy($target, $backup)) {
        echo "✓ <span style='color: green;'>Backup creado exitosamente:</span> " . basename($backup) . "<br>";
        echo "&nbsp;&nbsp;Ubicación: <code>{$backup}</code><br>";
    } else {
        echo "✗ <span style='color: red;'>Error al crear backup</span><br>";
        echo "<p>No se puede continuar sin crear un backup del archivo actual.</p>";
        exit;
    }
} else {
    echo "<h3>Paso 1: Sin Backup Necesario</h3>";
    echo "ℹ No existe archivo previo, no se requiere backup<br>";
}

// Paso 2: Instalar archivo corregido
echo "<h3>Paso 2: Instalando Archivo Corregido</h3>";

if (copy($source, $target)) {
    echo "✓ <span style='color: green;'>Archivo statistics.php actualizado exitosamente</span><br>";
    echo "&nbsp;&nbsp;Tamaño del nuevo archivo: " . filesize($target) . " bytes<br>";
    
    // Verificar que el archivo se copió correctamente
    $source_content = file_get_contents($source);
    $target_content = file_get_contents($target);
    
    if (md5($source_content) === md5($target_content)) {
        echo "✓ <span style='color: green;'>Verificación de integridad: OK</span><br>";
    } else {
        echo "⚠ <span style='color: orange;'>Advertencia: Los archivos no son idénticos</span><br>";
    }
    
} else {
    echo "✗ <span style='color: red;'>Error al actualizar statistics.php</span><br>";
    echo "<p>Posibles causas:</p>";
    echo "<ul>";
    echo "<li>Permisos insuficientes en el directorio</li>";
    echo "<li>Espacio insuficiente en disco</li>";
    echo "<li>Archivo en uso por otro proceso</li>";
    echo "</ul>";
    exit;
}

echo "<hr>";

// Paso 3: Verificación final
echo "<h2>Verificación Final</h2>";

// Verificar que el archivo se puede cargar sin errores de sintaxis
echo "<h3>Verificando Sintaxis PHP</h3>";

$syntax_check = shell_exec("php -l {$target} 2>&1");
if (strpos($syntax_check, 'No syntax errors') !== false) {
    echo "✓ <span style='color: green;'>Sintaxis PHP: OK</span><br>";
} else {
    echo "✗ <span style='color: red;'>Error de sintaxis detectado:</span><br>";
    echo "<pre>{$syntax_check}</pre>";
}

// Verificar que la clase se puede instanciar
echo "<h3>Verificando Clase Statistics</h3>";

try {
    require_once($target);
    
    if (class_exists('local_neuroopositor\\statistics')) {
        echo "✓ <span style='color: green;'>Clase 'local_neuroopositor\\statistics' cargada correctamente</span><br>";
        
        // Verificar métodos principales
        $reflection = new ReflectionClass('local_neuroopositor\\statistics');
        $methods = ['get_user_general_stats', 'get_user_block_stats', 'get_user_progress_history'];
        
        foreach ($methods as $method) {
            if ($reflection->hasMethod($method)) {
                echo "&nbsp;&nbsp;✓ Método '{$method}': OK<br>";
            } else {
                echo "&nbsp;&nbsp;✗ Método '{$method}': Faltante<br>";
            }
        }
        
    } else {
        echo "✗ <span style='color: red;'>Error: No se pudo cargar la clase 'local_neuroopositor\\statistics'</span><br>";
    }
    
} catch (Exception $e) {
    echo "✗ <span style='color: red;'>Error al verificar la clase:</span> " . $e->getMessage() . "<br>";
}

echo "<hr>";

// Resultado final
echo "<h2>Resultado de la Instalación</h2>";

if (file_exists($target) && filesize($target) > 0) {
    echo "<div style='background: #e8f5e8; padding: 20px; border: 2px solid #4CAF50; border-radius: 5px; margin: 15px 0;'>";
    echo "<h3 style='color: #2E7D32; margin-top: 0;'>✓ Instalación Completada Exitosamente</h3>";
    echo "<p><strong>Archivo instalado:</strong> statistics.php</p>";
    echo "<p><strong>Tamaño:</strong> " . filesize($target) . " bytes</p>";
    echo "<p><strong>Fecha:</strong> " . date('Y-m-d H:i:s', filemtime($target)) . "</p>";
    
    if (file_exists($backup)) {
        echo "<p><strong>Backup creado:</strong> " . basename($backup) . "</p>";
    }
    
    echo "<hr style='margin: 15px 0;'>";
    echo "<h4>Próximos Pasos:</h4>";
    echo "<ol>";
    echo "<li><strong>Probar las estadísticas:</strong> <a href='../index.php?courseid=0&action=statistics' target='_blank' style='background: #4CAF50; color: white; padding: 8px 15px; text-decoration: none; border-radius: 3px;'>Ir a Statistics</a></li>";
    echo "<li><strong>Verificar funcionamiento:</strong> Comprobar que no aparezcan errores</li>";
    echo "<li><strong>Monitorear logs:</strong> Revisar logs de errores de Moodle</li>";
    echo "</ol>";
    echo "</div>";
    
} else {
    echo "<div style='background: #ffebee; padding: 20px; border: 2px solid #f44336; border-radius: 5px; margin: 15px 0;'>";
    echo "<h3 style='color: #c62828; margin-top: 0;'>✗ Instalación Fallida</h3>";
    echo "<p>El archivo no se instaló correctamente o está vacío.</p>";
    echo "<p><strong>Recomendaciones:</strong></p>";
    echo "<ul>";
    echo "<li>Verificar permisos del directorio</li>";
    echo "<li>Intentar instalación manual</li>";
    echo "<li>Contactar al administrador del sistema</li>";
    echo "</ul>";
    echo "</div>";
}

echo "<hr>";
echo "<p><strong>Instalación completada:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Usuario:</strong> {$USER->username} (ID: {$USER->id})</p>";
echo "<p><strong>Servidor:</strong> {$_SERVER['HTTP_HOST']}</p>";

?>