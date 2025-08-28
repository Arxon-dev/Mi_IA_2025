<?php
echo "<h1>🔍 Diagnóstico de Rutas</h1>";

echo "<h2>Directorio Actual</h2>";
echo "<p>Directorio actual: " . getcwd() . "</p>";

echo "<h2>Estructura de Directorios</h2>";
echo "<pre>";
$currentDir = getcwd();
$dirs = explode('/', $currentDir);
foreach ($dirs as $i => $dir) {
    echo str_repeat('  ', $i) . "📁 $dir\n";
}
echo "</pre>";

echo "<h2>Búsqueda de config.php</h2>";
$configPaths = [
    '../../../../config.php',
    '../../../config.php', 
    '../../config.php',
    '../config.php',
    'config.php'
];

foreach ($configPaths as $path) {
    $fullPath = realpath($path);
    $exists = file_exists($path);
    $status = $exists ? "✅ EXISTE" : "❌ NO EXISTE";
    echo "<p><strong>$path</strong> - $status";
    if ($exists) {
        echo " (Ruta real: $fullPath)";
    }
    echo "</p>";
}

echo "<h2>Archivos en el directorio actual</h2>";
$files = scandir('.');
echo "<ul>";
foreach ($files as $file) {
    if ($file !== '.' && $file !== '..') {
        $type = is_dir($file) ? "📁" : "📄";
        echo "<li>$type $file</li>";
    }
}
echo "</ul>";

echo "<h2>Archivos en directorio padre</h2>";
if (is_dir('..')) {
    $parentFiles = scandir('..');
    echo "<ul>";
    foreach ($parentFiles as $file) {
        if ($file !== '.' && $file !== '..') {
            $type = is_dir("../$file") ? "📁" : "📄";
            echo "<li>$type $file</li>";
        }
    }
    echo "</ul>";
}

echo "<h2>Variables de Entorno</h2>";
echo "<p>DOCUMENT_ROOT: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'No definido') . "</p>";
echo "<p>SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'No definido') . "</p>";
echo "<p>REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'No definido') . "</p>";
?> 