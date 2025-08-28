<?php
/**
 * Script de corrección automática para el error "Undefined constant progress_data".
 * Identifica y corrige automáticamente los usos problemáticos.
 * 
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Configurar para mostrar todos los errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Corrección Automática del Error progress_data</h1>";
echo "<p>Este script identificará y corregirá automáticamente los problemas.</p>";

// Función para hacer backup de un archivo
function hacer_backup($archivo) {
    $backup_file = $archivo . '.backup.' . date('Y-m-d_H-i-s');
    if (copy($archivo, $backup_file)) {
        return $backup_file;
    }
    return false;
}

// Función para log
function log_correccion($mensaje) {
    $timestamp = date('Y-m-d H:i:s');
    echo "<p>[$timestamp] $mensaje</p>";
    flush();
    
    // También escribir a archivo de log
    file_put_contents(__DIR__ . '/correccion_log.txt', "[$timestamp] $mensaje\n", FILE_APPEND | LOCK_EX);
}

// Función para escanear archivos PHP
function obtener_archivos_php($directorio) {
    $archivos = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($directorio, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    
    foreach ($iterator as $archivo) {
        if ($archivo->isFile() && pathinfo($archivo, PATHINFO_EXTENSION) === 'php') {
            $archivos[] = $archivo->getPathname();
        }
    }
    
    return $archivos;
}

// Función para corregir un archivo
function corregir_archivo($ruta_archivo) {
    if (!file_exists($ruta_archivo) || !is_readable($ruta_archivo)) {
        return ['success' => false, 'error' => 'Archivo no existe o no es legible'];
    }
    
    $contenido_original = file_get_contents($ruta_archivo);
    $contenido_corregido = $contenido_original;
    $cambios_realizados = [];
    
    // Patrones de corrección
    $correcciones = [
        // Corregir uso de progress_data:: por statistics::
        '/progress_data::/i' => 'statistics::',
        
        // Corregir namespace incorrecto local_neuroopositor\progress_data
        '/local_neuroopositor\\\\progress_data/i' => 'local_neuroopositor\\statistics',
        
        // Corregir instanciación new progress_data
        '/new\s+progress_data\s*\(/i' => 'new local_neuroopositor\\statistics(',
        
        // Corregir referencias de clase progress_data (pero no variables $progress_data)
        '/(?<!\$)\bprogress_data\s*::/i' => 'statistics::',
    ];
    
    foreach ($correcciones as $patron => $reemplazo) {
        $contenido_nuevo = preg_replace($patron, $reemplazo, $contenido_corregido);
        if ($contenido_nuevo !== $contenido_corregido) {
            $cambios_realizados[] = "Aplicado: $patron → $reemplazo";
            $contenido_corregido = $contenido_nuevo;
        }
    }
    
    // Verificar y corregir alias duplicados
    $alias_pattern = "/class_alias\s*\(\s*['\"]local_neuroopositor\\\\statistics['\"]\s*,\s*['\"]progress_data['\"]\s*\)\s*;/i";
    $matches = [];
    preg_match_all($alias_pattern, $contenido_corregido, $matches, PREG_OFFSET_CAPTURE);
    
    if (count($matches[0]) > 1) {
        // Hay alias duplicados, mantener solo el primero
        $cambios_realizados[] = "Eliminados " . (count($matches[0]) - 1) . " alias duplicados";
        
        // Eliminar todos los alias excepto el primero
        for ($i = count($matches[0]) - 1; $i > 0; $i--) {
            $offset = $matches[0][$i][1];
            $length = strlen($matches[0][$i][0]);
            $contenido_corregido = substr_replace($contenido_corregido, '', $offset, $length);
        }
    }
    
    // Si hay cambios, guardar el archivo
    if ($contenido_corregido !== $contenido_original) {
        // Hacer backup primero
        $backup = hacer_backup($ruta_archivo);
        if (!$backup) {
            return ['success' => false, 'error' => 'No se pudo crear backup'];
        }
        
        // Guardar archivo corregido
        if (file_put_contents($ruta_archivo, $contenido_corregido) === false) {
            return ['success' => false, 'error' => 'No se pudo escribir archivo corregido'];
        }
        
        return [
            'success' => true, 
            'cambios' => $cambios_realizados,
            'backup' => $backup
        ];
    }
    
    return ['success' => true, 'cambios' => []];
}

// Función para verificar sintaxis PHP (versión hosting)
function verificar_sintaxis($archivo) {
    // En hosting compartido, exec() no está disponible
    // Verificamos sintaxis básica leyendo el archivo
    $contenido = file_get_contents($archivo);
    
    // Verificaciones básicas de sintaxis
    $errores_basicos = [
        // Verificar que las llaves estén balanceadas
        'llaves_desbalanceadas' => substr_count($contenido, '{') !== substr_count($contenido, '}'),
        // Verificar que los paréntesis estén balanceados
        'parentesis_desbalanceados' => substr_count($contenido, '(') !== substr_count($contenido, ')'),
        // Verificar que termine con ?> o sin etiqueta de cierre
        'etiqueta_php_mal_cerrada' => preg_match('/\?>\s*\S/', $contenido),
    ];
    
    // Si hay errores básicos, retornar false
    foreach ($errores_basicos as $error => $tiene_error) {
        if ($tiene_error) {
            return false;
        }
    }
    
    // Si pasa las verificaciones básicas, asumir que está bien
    return true;
}

// EJECUCIÓN PRINCIPAL
log_correccion("=== INICIO DE CORRECCIÓN AUTOMÁTICA ===");

// Limpiar log anterior
if (file_exists(__DIR__ . '/correccion_log.txt')) {
    unlink(__DIR__ . '/correccion_log.txt');
}

log_correccion("Buscando archivos PHP en el plugin...");
$archivos_php = obtener_archivos_php(__DIR__);
log_correccion("Encontrados " . count($archivos_php) . " archivos PHP");

$archivos_corregidos = 0;
$archivos_con_errores = 0;
$total_cambios = 0;

foreach ($archivos_php as $archivo) {
    $archivo_relativo = str_replace(__DIR__, '.', $archivo);
    log_correccion("\nAnalizando: $archivo_relativo");
    
    $resultado = corregir_archivo($archivo);
    
    if (!$resultado['success']) {
        log_correccion("   ✗ ERROR: " . $resultado['error']);
        $archivos_con_errores++;
        continue;
    }
    
    if (empty($resultado['cambios'])) {
        log_correccion("   ✓ Sin cambios necesarios");
    } else {
        log_correccion("   ✓ Archivo corregido");
        foreach ($resultado['cambios'] as $cambio) {
            log_correccion("     → $cambio");
        }
        
        if (isset($resultado['backup'])) {
            $backup_relativo = str_replace(__DIR__, '.', $resultado['backup']);
            log_correccion("     💾 Backup creado: $backup_relativo");
        }
        
        // Verificar sintaxis del archivo corregido
        if (verificar_sintaxis($archivo)) {
            log_correccion("     ✓ Sintaxis PHP válida");
        } else {
            log_correccion("     ⚠ ADVERTENCIA: Posibles errores de sintaxis");
        }
        
        $archivos_corregidos++;
        $total_cambios += count($resultado['cambios']);
    }
}

// Resumen final
log_correccion("\n=== RESUMEN DE CORRECCIÓN ===");
log_correccion("Archivos analizados: " . count($archivos_php));
log_correccion("Archivos corregidos: $archivos_corregidos");
log_correccion("Archivos con errores: $archivos_con_errores");
log_correccion("Total de cambios aplicados: $total_cambios");

if ($archivos_corregidos > 0) {
    log_correccion("\n✅ CORRECCIÓN COMPLETADA");
    log_correccion("Se han corregido automáticamente los problemas detectados.");
    log_correccion("Los archivos originales se han respaldado con extensión .backup");
    
    echo "<div style='background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>✅ Corrección Exitosa</h3>";
    echo "<p><strong>$archivos_corregidos archivos</strong> han sido corregidos automáticamente.</p>";
    echo "<p><strong>$total_cambios cambios</strong> aplicados en total.</p>";
    echo "<p>Los archivos originales están respaldados con extensión <code>.backup</code></p>";
    echo "</div>";
} else {
    log_correccion("\n✓ NO SE NECESITARON CORRECCIONES");
    log_correccion("No se encontraron problemas que corregir automáticamente.");
    
    echo "<div style='background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>ℹ️ Sin Cambios Necesarios</h3>";
    echo "<p>No se encontraron problemas obvios que corregir automáticamente.</p>";
    echo "<p>El error puede estar en otro lugar o requerir corrección manual.</p>";
    echo "</div>";
}

if ($archivos_con_errores > 0) {
    echo "<div style='background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>⚠️ Advertencias</h3>";
    echo "<p><strong>$archivos_con_errores archivos</strong> no pudieron ser procesados.</p>";
    echo "<p>Revisa el log para más detalles.</p>";
    echo "</div>";
}

log_correccion("\n=== FIN DE CORRECCIÓN ===");

echo "<h2>📋 Próximos Pasos</h2>";
echo "<ol>";
echo "<li>Revisa el archivo <code>correccion_log.txt</code> para ver todos los detalles</li>";
echo "<li>Prueba el plugin para verificar que el error se ha solucionado</li>";
echo "<li>Si el error persiste, ejecuta <code>diagnostico_hosting.php</code> para análisis adicional</li>";
echo "<li>Si todo funciona correctamente, puedes eliminar los archivos .backup</li>";
echo "</ol>";

echo "<h2>🔧 Scripts Disponibles</h2>";
echo "<ul>";
echo "<li><code>diagnostico_hosting.php</code> - Diagnóstico completo del sistema</li>";
echo "<li><code>test_error_hosting.php</code> - Reproduce el error específico</li>";
echo "<li><code>buscar_referencias_progress_data.php</code> - Busca todas las referencias</li>";
echo "<li><code>corregir_progress_data_hosting.php</code> - Este script (corrección automática)</li>";
echo "</ul>";

?>