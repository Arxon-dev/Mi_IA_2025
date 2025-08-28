<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🧪 Test de Función Corregida remove_accents()</h2>";

$test_cases = [
    'Régimen Jurídico del Sector Público' => 'REGIMEN JURIDICO DEL SECTOR PUBLICO',
    'Constitución Española' => 'CONSTITUCION ESPANOLA',
    'Ejército de Tierra' => 'EJERCITO DE TIERRA',
    'Ejército del Aire' => 'EJERCITO DEL AIRE',
    'Unión Europea' => 'UNION EUROPEA',
    'Organización de las FAS' => 'ORGANIZACION DE LAS FAS'
];

echo "<h3>🎯 Test de transformación:</h3>";

foreach ($test_cases as $input => $expected) {
    $upper = strtoupper($input);
    $result = remove_accents($upper);
    
    $success = ($result === $expected) ? "✅ CORRECTO" : "❌ INCORRECTO";
    
    echo "<p><strong>Input:</strong> {$input}</p>";
    echo "<p><strong>Mayúsculas:</strong> {$upper}</p>";
    echo "<p><strong>Resultado:</strong> {$result}</p>";
    echo "<p><strong>Esperado:</strong> {$expected}</p>";
    echo "<p><strong>Estado:</strong> {$success}</p>";
    echo "<hr>";
}

echo "<h3>🎯 Test de detección:</h3>";

foreach ($test_cases as $input => $expected) {
    $detected = telegram_extract_topic_from_name($input);
    $status = $detected ? "✅ DETECTADO: {$detected}" : "❌ NO DETECTADO";
    
    echo "<p><strong>{$input}</strong> → {$status}</p>";
}

echo "<p>🎉 Test completado</p>";
?> 