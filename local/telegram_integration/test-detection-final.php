<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Test Final de Detección de Temas</h2>";

// Temas críticos que deben detectarse
$critical_tests = [
    'Régimen Disciplinario de las Fuerzas Armadas' => 'RÉGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS',
    'Régimen Jurídico del Sector Público' => 'RÉGIMEN JURÍDICO DEL SECTOR PÚBLICO',
    'Constitución Española' => 'CONSTITUCIÓN ESPAÑOLA',
    'Armada Española' => 'ARMADA ESPAÑOLA',
    'Ejército de Tierra' => 'EJÉRCITO DE TIERRA',
    'Ejército del Aire' => 'EJÉRCITO DEL AIRE',
    'Unión Europea' => 'UNIÓN EUROPEA',
    'Organización de las FAS' => 'ORGANIZACIÓN DE LAS FAS',
    'Procedimiento Administrativo Común' => 'PROCEDIMIENTO ADMINISTRATIVO COMÚN DE LAS ADMINISTRACIONES PÚBLICAS',
    'general' => 'GENERAL'
];

echo "<h3>🎯 Tests críticos:</h3>";
echo "<table border='1' style='border-collapse: collapse;'>";
echo "<tr><th>Tema Original</th><th>Esperado</th><th>Detectado</th><th>Estado</th></tr>";

$critical_passed = 0;
$critical_total = count($critical_tests);

foreach ($critical_tests as $original => $expected) {
    $detected = telegram_extract_topic_from_name($original);
    $status = ($detected === $expected) ? "✅ CORRECTO" : "❌ INCORRECTO";
    
    if ($detected === $expected) {
        $critical_passed++;
    }
    
    echo "<tr>";
    echo "<td><strong>{$original}</strong></td>";
    echo "<td>{$expected}</td>";
    echo "<td>" . ($detected ? $detected : "N/A") . "</td>";
    echo "<td>{$status}</td>";
    echo "</tr>";
}

echo "</table>";

echo "<h3>📊 Resumen crítico:</h3>";
echo "<p>✅ Tests críticos pasados: {$critical_passed}/{$critical_total}</p>";
echo "<p>📈 Tasa crítica: " . round(($critical_passed / $critical_total) * 100, 1) . "%</p>";

if ($critical_passed === $critical_total) {
    echo "<p>🎉 <strong>¡TODOS LOS TESTS CRÍTICOS PASADOS!</strong></p>";
} else {
    echo "<p>⚠️ <strong>Aún hay tests críticos fallando</strong></p>";
}

echo "<p>🎯 Proceder con corrección masiva solo si todos los tests críticos pasan</p>";
?> 