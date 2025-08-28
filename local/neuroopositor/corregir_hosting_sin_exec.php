<?php
/**
 * Script de corrección para hosting sin funciones exec() o php_check_syntax()
 * Versión específica para hosting compartido con restricciones
 * 
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Configurar para mostrar errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>🔧 Corrección para Hosting - Error progress_data</h1>";
echo "<p>Script específico para hosting compartido sin funciones exec() o php_check_syntax()</p>";

// Función para log
function log_hosting($mensaje) {
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $mensaje" . PHP_EOL;
    file_put_contents(__DIR__ . '/correccion_hosting_log.txt', $log_entry, FILE_APPEND | LOCK_EX);
    echo "<p>$mensaje</p>";
}

// Función para hacer backup
function hacer_backup_hosting($archivo) {
    $backup = $archivo . '.backup.' . date('Ymd_His');
    if (copy($archivo, $backup)) {
        return $backup;
    }
    return false;
}

// Función para verificar sintaxis básica (sin exec)
function verificar_sintaxis_hosting($archivo) {
    if (!file_exists($archivo)) {
        return false;
    }
    
    $contenido = file_get_contents($archivo);
    
    // Verificaciones básicas
    $errores = [];
    
    // Verificar llaves balanceadas
    if (substr_count($contenido, '{') !== substr_count($contenido, '}')) {
        $errores[] = 'Llaves desbalanceadas';
    }
    
    // Verificar paréntesis balanceados
    if (substr_count($contenido, '(') !== substr_count($contenido, ')')) {
        $errores[] = 'Paréntesis desbalanceados';
    }
    
    // Verificar corchetes balanceados
    if (substr_count($contenido, '[') !== substr_count($contenido, ']')) {
        $errores[] = 'Corchetes desbalanceados';
    }
    
    // Verificar que no haya contenido después de ?>
    if (preg_match('/\?>\s*\S/', $contenido)) {
        $errores[] = 'Contenido después de etiqueta de cierre';
    }
    
    // Verificar que empiece con <?php
    if (!preg_match('/^\s*<\?php/', $contenido)) {
        $errores[] = 'No empieza con <?php';
    }
    
    return empty($errores) ? true : $errores;
}

// Función principal de corrección
function corregir_archivo_hosting($archivo) {
    if (!file_exists($archivo)) {
        return ['success' => false, 'error' => 'Archivo no existe'];
    }
    
    $contenido_original = file_get_contents($archivo);
    $contenido_corregido = $contenido_original;
    $cambios = [];
    
    // 1. Corregir progress_data:: por statistics::
    $patron1 = '/progress_data::/i';
    if (preg_match($patron1, $contenido_corregido)) {
        $contenido_corregido = preg_replace($patron1, 'statistics::', $contenido_corregido);
        $cambios[] = 'Corregido progress_data:: → statistics::';
    }
    
    // 2. Corregir local_neuroopositor\progress_data
    $patron2 = '/local_neuroopositor\\\\progress_data/i';
    if (preg_match($patron2, $contenido_corregido)) {
        $contenido_corregido = preg_replace($patron2, 'local_neuroopositor\\statistics', $contenido_corregido);
        $cambios[] = 'Corregido namespace progress_data → statistics';
    }
    
    // 3. Corregir new progress_data
    $patron3 = '/new\s+progress_data\s*\(/i';
    if (preg_match($patron3, $contenido_corregido)) {
        $contenido_corregido = preg_replace($patron3, 'new local_neuroopositor\\statistics(', $contenido_corregido);
        $cambios[] = 'Corregido new progress_data → new statistics';
    }
    
    // 4. Eliminar alias duplicados
    $alias_pattern = "/class_alias\s*\(\s*['\"]local_neuroopositor\\\\statistics['\"]\s*,\s*['\"]progress_data['\"]\s*\)\s*;/i";
    $matches = [];
    preg_match_all($alias_pattern, $contenido_corregido, $matches, PREG_OFFSET_CAPTURE);
    
    if (count($matches[0]) > 1) {
        // Mantener solo el primer alias
        for ($i = count($matches[0]) - 1; $i > 0; $i--) {
            $offset = $matches[0][$i][1];
            $length = strlen($matches[0][$i][0]);
            $contenido_corregido = substr_replace($contenido_corregido, '', $offset, $length);
        }
        $cambios[] = 'Eliminados ' . (count($matches[0]) - 1) . ' alias duplicados';
    }
    
    // 5. Asegurar que existe el alias si no está presente
    if (!preg_match($alias_pattern, $contenido_corregido) && strpos(basename($archivo), 'statistics.php') !== false) {
        // Agregar alias al final del archivo
        $alias_code = "\n\n// Alias de compatibilidad para progress_data\nif (!class_exists('progress_data')) {\n    class_alias('local_neuroopositor\\\\statistics', 'progress_data');\n}\n";
        
        // Insertar antes del ?> final o al final
        if (preg_match('/\?>\s*$/', $contenido_corregido)) {
            $contenido_corregido = preg_replace('/\?>\s*$/', $alias_code . '\n?>', $contenido_corregido);
        } else {
            $contenido_corregido .= $alias_code;
        }
        $cambios[] = 'Agregado alias de compatibilidad progress_data';
    }
    
    // Si hay cambios, aplicar
    if ($contenido_corregido !== $contenido_original) {
        // Hacer backup
        $backup = hacer_backup_hosting($archivo);
        if (!$backup) {
            return ['success' => false, 'error' => 'No se pudo crear backup'];
        }
        
        // Guardar archivo corregido
        if (file_put_contents($archivo, $contenido_corregido) === false) {
            return ['success' => false, 'error' => 'No se pudo escribir archivo'];
        }
        
        // Verificar sintaxis
        $sintaxis = verificar_sintaxis_hosting($archivo);
        
        return [
            'success' => true,
            'cambios' => $cambios,
            'backup' => $backup,
            'sintaxis' => $sintaxis === true ? 'OK' : $sintaxis
        ];
    }
    
    return ['success' => true, 'cambios' => []];
}

// EJECUCIÓN PRINCIPAL
log_hosting("=== INICIO CORRECCIÓN HOSTING ===");

// Limpiar log anterior
if (file_exists(__DIR__ . '/correccion_hosting_log.txt')) {
    unlink(__DIR__ . '/correccion_hosting_log.txt');
}

// Archivos a corregir
$archivos_criticos = [
    __DIR__ . '/statistics.php',
    __DIR__ . '/classes/statistics.php',
    __DIR__ . '/index.php',
    __DIR__ . '/lib.php',
    __DIR__ . '/views/dashboard.php',
    __DIR__ . '/views/neuralmap.php',
    __DIR__ . '/views/questions.php'
];

log_hosting("Archivos a revisar: " . count($archivos_criticos));

$archivos_corregidos = 0;
$total_cambios = 0;
$errores = [];

foreach ($archivos_criticos as $archivo) {
    $nombre_archivo = basename($archivo);
    
    if (!file_exists($archivo)) {
        log_hosting("⚠️ $nombre_archivo no existe, omitiendo...");
        continue;
    }
    
    log_hosting("\n🔍 Analizando $nombre_archivo...");
    
    $resultado = corregir_archivo_hosting($archivo);
    
    if (!$resultado['success']) {
        log_hosting("   ❌ ERROR: " . $resultado['error']);
        $errores[] = "$nombre_archivo: " . $resultado['error'];
        continue;
    }
    
    if (empty($resultado['cambios'])) {
        log_hosting("   ✅ Sin cambios necesarios");
    } else {
        log_hosting("   ✅ Archivo corregido");
        foreach ($resultado['cambios'] as $cambio) {
            log_hosting("      → $cambio");
        }
        
        if (isset($resultado['backup'])) {
            log_hosting("      💾 Backup: " . basename($resultado['backup']));
        }
        
        if (isset($resultado['sintaxis'])) {
            if ($resultado['sintaxis'] === 'OK') {
                log_hosting("      ✅ Sintaxis verificada");
            } else {
                log_hosting("      ⚠️ Posibles problemas de sintaxis: " . implode(', ', $resultado['sintaxis']));
            }
        }
        
        $archivos_corregidos++;
        $total_cambios += count($resultado['cambios']);
    }
}

// Verificación final
log_hosting("\n=== VERIFICACIÓN FINAL ===");

try {
    // Intentar cargar la clase statistics
    if (file_exists(__DIR__ . '/classes/statistics.php')) {
        require_once(__DIR__ . '/classes/statistics.php');
        
        if (class_exists('local_neuroopositor\\statistics')) {
            log_hosting("✅ Clase local_neuroopositor\\statistics cargada correctamente");
            
            // Crear alias manualmente para prueba
            if (!class_exists('progress_data')) {
                class_alias('local_neuroopositor\\statistics', 'progress_data');
            }
            
            if (class_exists('progress_data')) {
                log_hosting("✅ Alias progress_data funciona correctamente");
            } else {
                log_hosting("❌ Alias progress_data NO funciona");
            }
        } else {
            log_hosting("❌ Clase local_neuroopositor\\statistics NO encontrada");
        }
    }
} catch (Exception $e) {
    log_hosting("⚠️ Error en verificación final: " . $e->getMessage());
} catch (Error $e) {
    log_hosting("⚠️ Error fatal en verificación: " . $e->getMessage());
}

// Resumen final
log_hosting("\n=== RESUMEN FINAL ===");
log_hosting("Archivos corregidos: $archivos_corregidos");
log_hosting("Total de cambios: $total_cambios");
log_hosting("Errores encontrados: " . count($errores));

if ($archivos_corregidos > 0) {
    echo "<div style='background-color: #d4edda; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h2>✅ Corrección Completada</h2>";
    echo "<p><strong>$archivos_corregidos archivos</strong> han sido corregidos.</p>";
    echo "<p><strong>$total_cambios cambios</strong> aplicados en total.</p>";
    echo "<p>Los archivos originales están respaldados con extensión <code>.backup</code></p>";
    echo "</div>";
} else {
    echo "<div style='background-color: #d1ecf1; color: #0c5460; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h2>ℹ️ Sin Cambios</h2>";
    echo "<p>No se encontraron problemas que corregir automáticamente.</p>";
    echo "</div>";
}

if (!empty($errores)) {
    echo "<div style='background-color: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 20px 0;'>";
    echo "<h2>⚠️ Errores Encontrados</h2>";
    echo "<ul>";
    foreach ($errores as $error) {
        echo "<li>$error</li>";
    }
    echo "</ul>";
    echo "</div>";
}

log_hosting("=== FIN CORRECCIÓN HOSTING ===");

echo "<h2>📋 Próximos Pasos</h2>";
echo "<ol>";
echo "<li>Revisa el archivo <code>correccion_hosting_log.txt</code> para ver todos los detalles</li>";
echo "<li>Prueba acceder al plugin: <a href='index.php?courseid=0&action=statistics' target='_blank'>Ir a Estadísticas</a></li>";
echo "<li>Si el error persiste, revisa manualmente los archivos corregidos</li>";
echo "<li>Si todo funciona, puedes eliminar los archivos .backup</li>";
echo "</ol>";

echo "<h2>🔧 Scripts Disponibles</h2>";
echo "<ul>";
echo "<li><code>diagnostico_hosting.php</code> - Diagnóstico completo (corregido)</li>";
echo "<li><code>buscar_referencias_progress_data.php</code> - Busca todas las referencias</li>";
echo "<li><code>corregir_hosting_sin_exec.php</code> - Este script (sin funciones prohibidas)</li>";
echo "</ul>";

?>