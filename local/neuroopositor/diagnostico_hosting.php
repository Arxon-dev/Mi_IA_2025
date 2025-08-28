<?php
/**
 * Script de diagnóstico para identificar el error "Undefined constant progress_data" en el hosting.
 * 
 * @package    local_neuroopositor
 * @copyright  2025 OpoMelilla Team
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Configurar para mostrar todos los errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Función para escribir log
function escribir_log($mensaje) {
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $mensaje" . PHP_EOL;
    file_put_contents(__DIR__ . '/diagnostico_log.txt', $log_entry, FILE_APPEND | LOCK_EX);
    echo "<p>$mensaje</p>";
}

echo "<h1>Diagnóstico del Error progress_data</h1>";
echo "<p>Iniciando diagnóstico en el hosting...</p>";

// Limpiar log anterior
if (file_exists(__DIR__ . '/diagnostico_log.txt')) {
    unlink(__DIR__ . '/diagnostico_log.txt');
}

escribir_log("=== INICIO DEL DIAGNÓSTICO ===");

// 1. Verificar si los archivos principales existen
escribir_log("1. Verificando archivos principales...");
$archivos_principales = [
    'index.php',
    'statistics.php',
    'lib.php',
    'classes/statistics.php',
    'views/dashboard.php',
    'views/statistics.php',
    'views/neuralmap.php',
    'views/questions.php'
];

foreach ($archivos_principales as $archivo) {
    $ruta = __DIR__ . '/' . $archivo;
    if (file_exists($ruta)) {
        escribir_log("   ✓ $archivo existe");
    } else {
        escribir_log("   ✗ $archivo NO EXISTE");
    }
}

// 2. Verificar el contenido de archivos clave
escribir_log("\n2. Verificando contenido de archivos clave...");

// Verificar index.php
if (file_exists(__DIR__ . '/index.php')) {
    $contenido_index = file_get_contents(__DIR__ . '/index.php');
    if (strpos($contenido_index, "class_alias('local_neuroopositor\\statistics', 'progress_data')") !== false) {
        escribir_log("   ✓ index.php contiene el alias class_alias");
    } else {
        escribir_log("   ✗ index.php NO contiene el alias class_alias");
    }
    
    // Buscar usos problemáticos
    if (preg_match('/progress_data::/i', $contenido_index)) {
        escribir_log("   ⚠ index.php contiene uso de progress_data:: (problemático)");
    }
    if (preg_match('/local_neuroopositor\\\\progress_data/i', $contenido_index)) {
        escribir_log("   ⚠ index.php contiene referencia a local_neuroopositor\\progress_data (problemático)");
    }
}

// Verificar statistics.php
if (file_exists(__DIR__ . '/statistics.php')) {
    $contenido_stats = file_get_contents(__DIR__ . '/statistics.php');
    $alias_count = substr_count($contenido_stats, "class_alias('local_neuroopositor\\statistics', 'progress_data')");
    escribir_log("   Número de alias en statistics.php: $alias_count");
    
    if ($alias_count > 1) {
        escribir_log("   ⚠ statistics.php tiene MÚLTIPLES alias (problemático)");
    } elseif ($alias_count == 1) {
        escribir_log("   ✓ statistics.php tiene UN alias (correcto)");
    } else {
        escribir_log("   ✗ statistics.php NO tiene alias");
    }
}

// 3. Verificar la clase statistics
escribir_log("\n3. Verificando la clase statistics...");

try {
    // Intentar incluir los archivos necesarios
    if (file_exists('../../config.php')) {
        require_once('../../config.php');
        escribir_log("   ✓ config.php incluido");
    } else {
        escribir_log("   ✗ config.php no encontrado");
    }
    
    if (file_exists(__DIR__ . '/classes/statistics.php')) {
        require_once(__DIR__ . '/classes/statistics.php');
        escribir_log("   ✓ classes/statistics.php incluido");
    } else {
        escribir_log("   ✗ classes/statistics.php no encontrado");
    }
    
    // Verificar si la clase existe
    if (class_exists('local_neuroopositor\\statistics')) {
        escribir_log("   ✓ Clase local_neuroopositor\\statistics existe");
    } else {
        escribir_log("   ✗ Clase local_neuroopositor\\statistics NO existe");
    }
    
    // Crear el alias manualmente
    if (class_exists('local_neuroopositor\\statistics')) {
        class_alias('local_neuroopositor\\statistics', 'progress_data');
        escribir_log("   ✓ Alias progress_data creado manualmente");
        
        // Verificar si el alias funciona
        if (class_exists('progress_data')) {
            escribir_log("   ✓ Alias progress_data funciona");
        } else {
            escribir_log("   ✗ Alias progress_data NO funciona");
        }
    }
    
} catch (Exception $e) {
    escribir_log("   ✗ Error al verificar la clase: " . $e->getMessage());
} catch (Error $e) {
    escribir_log("   ✗ Error fatal al verificar la clase: " . $e->getMessage());
}

// 4. Buscar usos problemáticos en todos los archivos
escribir_log("\n4. Buscando usos problemáticos en todos los archivos...");

$archivos_a_revisar = [
    'index.php',
    'statistics.php',
    'lib.php',
    'classes/statistics.php',
    'views/dashboard.php',
    'views/statistics.php',
    'views/neuralmap.php',
    'views/questions.php'
];

foreach ($archivos_a_revisar as $archivo) {
    $ruta = __DIR__ . '/' . $archivo;
    if (file_exists($ruta)) {
        $contenido = file_get_contents($ruta);
        
        // Buscar patrones problemáticos
        if (preg_match('/progress_data::/i', $contenido)) {
            escribir_log("   ⚠ $archivo contiene progress_data:: (uso como clase estática)");
        }
        
        if (preg_match('/local_neuroopositor\\\\progress_data/i', $contenido)) {
            escribir_log("   ⚠ $archivo contiene local_neuroopositor\\progress_data (referencia incorrecta)");
        }
        
        if (preg_match('/new progress_data/i', $contenido)) {
            escribir_log("   ⚠ $archivo contiene 'new progress_data' (instanciación)");
        }
        
        // Contar líneas que contienen progress_data
        $lineas = explode("\n", $contenido);
        foreach ($lineas as $num_linea => $linea) {
            if (stripos($linea, 'progress_data') !== false && 
                stripos($linea, "class_alias") === false &&
                stripos($linea, "//") !== 0) { // Excluir comentarios
                escribir_log("   → $archivo línea " . ($num_linea + 1) . ": " . trim($linea));
            }
        }
    }
}

// 5. Simular el flujo de ejecución
escribir_log("\n5. Simulando flujo de ejecución...");

try {
    // Simular la carga de index.php
    escribir_log("   Simulando carga de index.php...");
    
    // Verificar si se puede acceder a statistics.php
    if (file_exists(__DIR__ . '/statistics.php')) {
        escribir_log("   Intentando incluir statistics.php...");
        
        // Capturar cualquier error
        ob_start();
        $error_occurred = false;
        
        try {
            // Verificar sintaxis básica (php_check_syntax no disponible en hosting)
            $contenido_stats = file_get_contents(__DIR__ . '/statistics.php');
            $syntax_check = true; // Asumir válido si se puede leer
            
            // Verificaciones básicas
            if (substr_count($contenido_stats, '{') !== substr_count($contenido_stats, '}')) {
                $syntax_check = false;
                escribir_log("   ✗ statistics.php tiene llaves desbalanceadas");
            } elseif (substr_count($contenido_stats, '(') !== substr_count($contenido_stats, ')')) {
                $syntax_check = false;
                escribir_log("   ✗ statistics.php tiene paréntesis desbalanceados");
            } elseif (preg_match('/\?>\s*\S/', $contenido_stats)) {
                $syntax_check = false;
                escribir_log("   ✗ statistics.php tiene contenido después de ?>");
            }
            
            if ($syntax_check) {
                escribir_log("   ✓ statistics.php pasa verificaciones básicas de sintaxis");
            } else {
                escribir_log("   ✗ statistics.php tiene errores de sintaxis");
            }
        } catch (Exception $e) {
            escribir_log("   ✗ Error al verificar statistics.php: " . $e->getMessage());
        }
        
        ob_end_clean();
    }
    
} catch (Exception $e) {
    escribir_log("   ✗ Error en simulación: " . $e->getMessage());
}

// 6. Información del entorno
escribir_log("\n6. Información del entorno...");
escribir_log("   PHP Version: " . PHP_VERSION);
escribir_log("   Directorio actual: " . __DIR__);
escribir_log("   Servidor: " . $_SERVER['SERVER_SOFTWARE'] ?? 'Desconocido');

escribir_log("\n=== FIN DEL DIAGNÓSTICO ===");

echo "<h2>Diagnóstico completado</h2>";
echo "<p>Revisa el archivo <strong>diagnostico_log.txt</strong> para ver todos los detalles.</p>";
echo "<p>Si el error persiste, envía el contenido del archivo de log para análisis.</p>";

?>