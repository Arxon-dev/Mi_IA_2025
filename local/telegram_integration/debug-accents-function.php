<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Debug de Función remove_accents()</h2>";

// Test de la función remove_accents
$test_strings = [
    'Régimen Jurídico del Sector Público',
    'Constitución Española',
    'Ejército de Tierra',
    'Ejército del Aire',
    'Unión Europea',
    'Organización de las FAS'
];

echo "<h3>🧪 Testing función remove_accents():</h3>";

foreach ($test_strings as $original) {
    $upper = strtoupper($original);
    
    // Verificar si la función existe
    if (function_exists('remove_accents')) {
        $without_accents = remove_accents($upper);
        echo "<p>✅ <strong>Original:</strong> {$original}</p>";
        echo "<p>📈 <strong>Mayúsculas:</strong> {$upper}</p>";
        echo "<p>🔧 <strong>Sin acentos:</strong> {$without_accents}</p>";
    } else {
        echo "<p>❌ <strong>FUNCIÓN remove_accents() NO EXISTE!</strong></p>";
    }
    
    echo "<hr>";
}

// Test de detección paso a paso
echo "<h3>🎯 Test de detección completo:</h3>";

$test_theme = 'Régimen Jurídico del Sector Público';
echo "<p><strong>Testing: {$test_theme}</strong></p>";

$detected = telegram_extract_topic_from_name($test_theme);
echo "<p>🎯 <strong>Resultado:</strong> " . ($detected ? $detected : "NO DETECTADO") . "</p>";

// Test manual del proceso
echo "<h3>🔧 Proceso manual paso a paso:</h3>";

$name = strtoupper(trim($test_theme));
echo "<p>1. Mayúsculas: <code>{$name}</code></p>";

if (function_exists('remove_accents')) {
    $name_clean = remove_accents($name);
    echo "<p>2. Sin acentos: <code>{$name_clean}</code></p>";
} else {
    echo "<p>2. ❌ Función remove_accents no disponible</p>";
}

// Test de patrones específicos
$patterns_to_test = [
    'REGIMEN JURIDICO DEL SECTOR PUBLICO',
    'REGIMEN JURIDICO',
    'CONSTITUCION ESPANOLA',
    'CONSTITUCION',
    'EJERCITO DE TIERRA',
    'EJERCITO DEL AIRE',
    'UNION EUROPEA',
    'ORGANIZACION DE LAS FAS'
];

echo "<h3>🎯 Test de patrones específicos:</h3>";

foreach ($patterns_to_test as $pattern) {
    $match = (strpos($name_clean, $pattern) !== false);
    $status = $match ? "✅ COINCIDE" : "❌ NO COINCIDE";
    echo "<p><code>{$pattern}</code> → {$status}</p>";
}

echo "<p>🎉 Debug completado</p>";
?> 