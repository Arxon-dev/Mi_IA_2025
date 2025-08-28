<?php
/**
 * Script para limpiar archivos de prueba y diagnóstico innecesarios.
 * Mantiene solo los scripts útiles para el hosting.
 * 
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

echo "<h1>Limpieza de Archivos de Prueba</h1>";
echo "<p>Eliminando archivos de prueba y diagnóstico innecesarios...</p>";

// Lista de archivos a eliminar (archivos de prueba que no son necesarios en producción)
$archivos_a_eliminar = [
    'test_final_statistics.php',
    'test_final_text.php',
    'test_progress_data_simple.php',
    'verificacion_sin_shell_exec.php',
    'verificar_correccion_simple.php',
    'solucion_final_progress_data.php',
    'corregir_error_progress_data.php',
    'diagnostico_error_constante.php',
    'corregir_statistics_courseid.php',
    'limpiar_archivos_prueba.php' // Este mismo script se auto-elimina al final
];

// Lista de archivos útiles que se mantienen para el hosting
$archivos_utiles = [
    'diagnostico_hosting.php',
    'test_error_hosting.php', 
    'buscar_referencias_progress_data.php',
    'corregir_progress_data_hosting.php',
    'INSTRUCCIONES_HOSTING.md'
];

// Lista de archivos de log que pueden eliminarse opcionalmente
$archivos_log = [
    'diagnostico_log.txt',
    'reporte_progress_data.txt',
    'correccion_log.txt'
];

echo "<h2>📋 Archivos a Procesar</h2>";

echo "<h3>🗑️ Archivos de Prueba (se eliminarán)</h3>";
echo "<ul>";
foreach ($archivos_a_eliminar as $archivo) {
    echo "<li><code>$archivo</code></li>";
}
echo "</ul>";

echo "<h3>✅ Archivos Útiles (se mantienen)</h3>";
echo "<ul>";
foreach ($archivos_utiles as $archivo) {
    echo "<li><code>$archivo</code></li>";
}
echo "</ul>";

echo "<h3>📄 Archivos de Log (opcionales)</h3>";
echo "<ul>";
foreach ($archivos_log as $archivo) {
    echo "<li><code>$archivo</code></li>";
}
echo "</ul>";

// Función para eliminar archivo con log
function eliminar_archivo($archivo) {
    $ruta_completa = __DIR__ . '/' . $archivo;
    
    if (file_exists($ruta_completa)) {
        if (unlink($ruta_completa)) {
            echo "<p style='color: green;'>✅ Eliminado: <code>$archivo</code></p>";
            return true;
        } else {
            echo "<p style='color: red;'>❌ Error al eliminar: <code>$archivo</code></p>";
            return false;
        }
    } else {
        echo "<p style='color: gray;'>ℹ️ No existe: <code>$archivo</code></p>";
        return true;
    }
}

echo "<h2>🧹 Proceso de Limpieza</h2>";

$eliminados = 0;
$errores = 0;

// Eliminar archivos de prueba
echo "<h3>Eliminando archivos de prueba...</h3>";
foreach ($archivos_a_eliminar as $archivo) {
    if ($archivo === 'limpiar_archivos_prueba.php') {
        continue; // Este se elimina al final
    }
    
    if (eliminar_archivo($archivo)) {
        $eliminados++;
    } else {
        $errores++;
    }
}

// Preguntar sobre archivos de log (simulado - en hosting se pueden eliminar manualmente)
echo "<h3>Archivos de Log</h3>";
echo "<p>Los siguientes archivos de log pueden eliminarse manualmente si no los necesitas:</p>";
foreach ($archivos_log as $archivo) {
    $ruta_completa = __DIR__ . '/' . $archivo;
    if (file_exists($ruta_completa)) {
        $tamaño = filesize($ruta_completa);
        $fecha = date('Y-m-d H:i:s', filemtime($ruta_completa));
        echo "<p>📄 <code>$archivo</code> - Tamaño: {$tamaño} bytes - Modificado: $fecha</p>";
    }
}

// Verificar archivos útiles
echo "<h3>Verificando archivos útiles...</h3>";
foreach ($archivos_utiles as $archivo) {
    $ruta_completa = __DIR__ . '/' . $archivo;
    if (file_exists($ruta_completa)) {
        echo "<p style='color: green;'>✅ Presente: <code>$archivo</code></p>";
    } else {
        echo "<p style='color: red;'>❌ Falta: <code>$archivo</code></p>";
    }
}

// Buscar archivos .backup
echo "<h3>Archivos de Backup</h3>";
$archivos_backup = glob(__DIR__ . '/*.backup.*');
if (!empty($archivos_backup)) {
    echo "<p>Se encontraron " . count($archivos_backup) . " archivos de backup:</p>";
    echo "<ul>";
    foreach ($archivos_backup as $backup) {
        $nombre = basename($backup);
        $tamaño = filesize($backup);
        $fecha = date('Y-m-d H:i:s', filemtime($backup));
        echo "<li><code>$nombre</code> - {$tamaño} bytes - $fecha</li>";
    }
    echo "</ul>";
    echo "<p><em>Estos archivos pueden eliminarse una vez que confirmes que todo funciona correctamente.</em></p>";
} else {
    echo "<p>No se encontraron archivos de backup.</p>";
}

echo "<h2>📊 Resumen</h2>";
echo "<div style='background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
echo "<p><strong>Archivos eliminados:</strong> $eliminados</p>";
echo "<p><strong>Errores:</strong> $errores</p>";
echo "<p><strong>Archivos útiles verificados:</strong> " . count($archivos_utiles) . "</p>";
echo "</div>";

if ($errores === 0) {
    echo "<div style='background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3>✅ Limpieza Completada</h3>";
    echo "<p>Se han eliminado todos los archivos de prueba innecesarios.</p>";
    echo "<p>El plugin ahora contiene solo los archivos necesarios para producción y los scripts útiles para diagnóstico.</p>";
    echo "</div>";
} else {
    echo "<div style='background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3>⚠️ Limpieza con Advertencias</h3>";
    echo "<p>Se completó la limpieza pero hubo $errores errores.</p>";
    echo "<p>Revisa los mensajes arriba para más detalles.</p>";
    echo "</div>";
}

echo "<h2>📋 Próximos Pasos</h2>";
echo "<ol>";
echo "<li><strong>Verifica que el plugin funciona correctamente</strong> después de la limpieza</li>";
echo "<li><strong>Elimina manualmente los archivos de log</strong> si no los necesitas</li>";
echo "<li><strong>Elimina los archivos .backup</strong> una vez que confirmes que todo funciona</li>";
echo "<li><strong>Mantén los scripts de diagnóstico</strong> para futuras necesidades</li>";
echo "</ol>";

echo "<h2>🛠️ Scripts Disponibles para Diagnóstico</h2>";
echo "<p>Después de la limpieza, tienes disponibles estos scripts útiles:</p>";
echo "<ul>";
echo "<li><code>diagnostico_hosting.php</code> - Diagnóstico completo del sistema</li>";
echo "<li><code>test_error_hosting.php</code> - Reproduce errores específicos</li>";
echo "<li><code>buscar_referencias_progress_data.php</code> - Busca referencias problemáticas</li>";
echo "<li><code>corregir_progress_data_hosting.php</code> - Corrección automática</li>";
echo "<li><code>INSTRUCCIONES_HOSTING.md</code> - Guía completa de uso</li>";
echo "</ul>";

// Auto-eliminación de este script
echo "<h3>🗑️ Auto-eliminación</h3>";
echo "<p>Este script se auto-eliminará en 5 segundos...</p>";
echo "<script>";
echo "setTimeout(function() {";
echo "    fetch(window.location.href + '?auto_delete=1')";
echo "        .then(() => {";
echo "            document.body.innerHTML += '<p style=\"color: green; font-weight: bold;\">✅ Script auto-eliminado correctamente</p>';";
echo "        })";
echo "        .catch(() => {";
echo "            document.body.innerHTML += '<p style=\"color: red; font-weight: bold;\">❌ Error en auto-eliminación. Elimina manualmente: limpiar_archivos_prueba.php</p>';";
echo "        });";
echo "}, 5000);";
echo "</script>";

// Manejar auto-eliminación
if (isset($_GET['auto_delete']) && $_GET['auto_delete'] === '1') {
    $este_archivo = __FILE__;
    if (unlink($este_archivo)) {
        echo "Script auto-eliminado";
    } else {
        echo "Error en auto-eliminación";
    }
    exit;
}

?>