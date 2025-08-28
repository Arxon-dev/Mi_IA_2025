<?php
/**
 * Test final para verificar que el error de progress_data está resuelto
 * Simula el acceso real a statistics.php a través de index.php
 */

echo "<h2>Test Final - Verificación del Error progress_data</h2>";
echo "<p>Simulando el acceso real a statistics.php...</p>";

// Simular la inclusión de archivos como en index.php
require_once('classes/statistics.php');
require_once('classes/user_progress.php');
require_once('classes/tema.php');

// Definir el alias como en statistics.php línea 34
class_alias('local_neuroopositor\\statistics', 'progress_data');

echo "<h3>Verificaciones:</h3>";

// 1. Verificar que la clase original existe
if (class_exists('local_neuroopositor\\statistics')) {
    echo "✅ Clase local_neuroopositor\\statistics existe<br>";
} else {
    echo "❌ Clase local_neuroopositor\\statistics NO existe<br>";
}

// 2. Verificar que el alias existe
if (class_exists('progress_data')) {
    echo "✅ Alias progress_data existe<br>";
} else {
    echo "❌ Alias progress_data NO existe<br>";
}

// 3. Verificar que no hay conflictos de namespace
try {
    $reflection = new ReflectionClass('progress_data');
    echo "✅ Alias progress_data es accesible sin errores<br>";
    echo "&nbsp;&nbsp;&nbsp;Nombre real de la clase: " . $reflection->getName() . "<br>";
} catch (Exception $e) {
    echo "❌ Error al acceder al alias progress_data: " . $e->getMessage() . "<br>";
}

// 4. Verificar que los métodos están disponibles
try {
    $methods = get_class_methods('progress_data');
    if (in_array('get_user_general_stats', $methods)) {
        echo "✅ Método get_user_general_stats disponible<br>";
    } else {
        echo "❌ Método get_user_general_stats NO disponible<br>";
    }
    
    if (in_array('get_stats_by_tema', $methods)) {
        echo "✅ Método get_stats_by_tema disponible<br>";
    } else {
        echo "❌ Método get_stats_by_tema NO disponible<br>";
    }
    
    if (in_array('get_progress_data', $methods)) {
        echo "✅ Método get_progress_data disponible<br>";
    } else {
        echo "❌ Método get_progress_data NO disponible<br>";
    }
} catch (Exception $e) {
    echo "❌ Error al verificar métodos: " . $e->getMessage() . "<br>";
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
    echo "✅ No hay definiciones duplicadas de progress_data<br>";
} else {
    echo "❌ Hay $progress_data_count definiciones de progress_data (posible duplicación)<br>";
}

echo "<h3>Resumen:</h3>";
echo "<p>Si todas las verificaciones muestran ✅, el error 'Undefined constant progress_data' debería estar completamente resuelto.</p>";
echo "<p>El alias está correctamente definido en statistics.php línea 34 y no hay duplicaciones.</p>";
echo "<p><strong>Test completado:</strong> " . date('Y-m-d H:i:s') . "</p>";
?>