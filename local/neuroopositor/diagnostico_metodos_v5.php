<?php
// Script de diagnóstico para verificar métodos en statistics.php

echo "<h1>Diagnóstico de Métodos - Statistics.php</h1>";

$file_path = 'classes/statistics.php';

if (!file_exists($file_path)) {
    echo "<p style='color: red;'>❌ ERROR: No se encontró el archivo $file_path</p>";
    exit;
}

$content = file_get_contents($file_path);
if ($content === false) {
    echo "<p style='color: red;'>❌ ERROR: No se pudo leer el archivo $file_path</p>";
    exit;
}

echo "<h2>Información del archivo:</h2>";
echo "<p><strong>Tamaño:</strong> " . strlen($content) . " caracteres</p>";
echo "<p><strong>Líneas:</strong> " . substr_count($content, "\n") . "</p>";

// Buscar todos los métodos públicos estáticos
preg_match_all('/public\s+static\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/i', $content, $matches);

echo "<h2>Métodos públicos estáticos encontrados:</h2>";
if (!empty($matches[1])) {
    echo "<ul>";
    foreach ($matches[1] as $method) {
        echo "<li><strong>$method</strong>";
        if ($method === 'get_neural_connections_stats') {
            echo " ✅ <span style='color: green;'>(ENCONTRADO)</span>";
        }
        echo "</li>";
    }
    echo "</ul>";
} else {
    echo "<p style='color: orange;'>⚠️ No se encontraron métodos públicos estáticos</p>";
}

// Buscar específicamente get_neural_connections_stats
echo "<h2>Búsqueda específica de get_neural_connections_stats:</h2>";
$search_patterns = [
    'get_neural_connections_stats',
    'public static function get_neural_connections_stats',
    'function get_neural_connections_stats'
];

foreach ($search_patterns as $pattern) {
    $pos = strpos($content, $pattern);
    if ($pos !== false) {
        echo "<p style='color: green;'>✅ Encontrado '$pattern' en posición $pos</p>";
        
        // Mostrar contexto
        $start = max(0, $pos - 100);
        $end = min(strlen($content), $pos + 200);
        $context = substr($content, $start, $end - $start);
        echo "<pre style='background: #f0f0f0; padding: 10px; border: 1px solid #ccc;'>";
        echo htmlspecialchars($context);
        echo "</pre>";
    } else {
        echo "<p style='color: red;'>❌ No encontrado: '$pattern'</p>";
    }
}

// Mostrar las últimas 50 líneas del archivo
echo "<h2>Últimas 50 líneas del archivo:</h2>";
$lines = explode("\n", $content);
$total_lines = count($lines);
$start_line = max(0, $total_lines - 50);

echo "<pre style='background: #f9f9f9; padding: 10px; border: 1px solid #ddd; max-height: 400px; overflow-y: scroll;'>";
for ($i = $start_line; $i < $total_lines; $i++) {
    $line_num = $i + 1;
    echo sprintf("%3d: %s\n", $line_num, htmlspecialchars($lines[$i]));
}
echo "</pre>";

echo "<h2>Verificación de clases referenciadas:</h2>";
$referenced_classes = ['user_progress', 'connection'];
foreach ($referenced_classes as $class) {
    if (strpos($content, $class . '::') !== false) {
        echo "<p style='color: orange;'>⚠️ Encontrada referencia a clase '$class'</p>";
    } else {
        echo "<p style='color: green;'>✅ No se encontraron referencias a clase '$class'</p>";
    }
}

echo "<p><em>Diagnóstico completado: " . date('Y-m-d H:i:s') . "</em></p>";
?>