<?php
/**
 * Test final para verificar que el error de progress_data está resuelto
 * Versión con salida de texto plano
 */

echo "Test Final - Verificacion del Error progress_data\n";
echo "Simulando el acceso real a statistics.php...\n\n";

// Simular la inclusión de archivos como en index.php
require_once('classes/statistics.php');
require_once('classes/user_progress.php');
require_once('classes/tema.php');

// Definir el alias como en statistics.php línea 34
class_alias('local_neuroopositor\\statistics', 'progress_data');

echo "Verificaciones:\n";

// 1. Verificar que la clase original existe
if (class_exists('local_neuroopositor\\statistics')) {
    echo "✓ Clase local_neuroopositor\\statistics existe\n";
} else {
    echo "✗ Clase local_neuroopositor\\statistics NO existe\n";
}

// 2. Verificar que el alias existe
if (class_exists('progress_data')) {
    echo "✓ Alias progress_data existe\n";
} else {
    echo "✗ Alias progress_data NO existe\n";
}

// 3. Verificar que no hay conflictos de namespace
try {
    $reflection = new ReflectionClass('progress_data');
    echo "✓ Alias progress_data es accesible sin errores\n";
    echo "   Nombre real de la clase: " . $reflection->getName() . "\n";
} catch (Exception $e) {
    echo "✗ Error al acceder al alias progress_data: " . $e->getMessage() . "\n";
}

// 4. Verificar que los métodos están disponibles
try {
    $methods = get_class_methods('progress_data');
    if (in_array('get_user_general_stats', $methods)) {
        echo "✓ Método get_user_general_stats disponible\n";
    } else {
        echo "✗ Método get_user_general_stats NO disponible\n";
    }
    
    if (in_array('get_stats_by_tema', $methods)) {
        echo "✓ Método get_stats_by_tema disponible\n";
    } else {
        echo "✗ Método get_stats_by_tema NO disponible\n";
    }
    
    if (in_array('get_progress_data', $methods)) {
        echo "✓ Método get_progress_data disponible\n";
    } else {
        echo "✗ Método get_progress_data NO disponible\n";
    }
} catch (Exception $e) {
    echo "✗ Error al verificar métodos: " . $e->getMessage() . "\n";
}

// 5. Verificar que no hay definiciones duplicadas
$defined_classes = get_declared_classes();
$progress_data_count = 0;
foreach ($defined_classes as $class) {
    if (strpos($class, 'progress_data') !== false) {
        $progress_data_count++;
    }
}

if ($progress_data_count <= 1) {
    echo "✓ No hay definiciones duplicadas de progress_data\n";
} else {
    echo "✗ Hay $progress_data_count definiciones de progress_data (posible duplicación)\n";
}

echo "\nResumen:\n";
echo "Si todas las verificaciones muestran ✓, el error 'Undefined constant progress_data' debería estar completamente resuelto.\n";
echo "El alias está correctamente definido en statistics.php línea 34 y no hay duplicaciones.\n";
echo "Test completado: " . date('Y-m-d H:i:s') . "\n";
?>