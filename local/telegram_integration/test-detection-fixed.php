<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Test de Detección de Temas - Corregido</h2>";

// Temas reales de la base de datos
$real_themes = [
    'Armada Española',
    'Carrera Militar',
    'Constitución Española',
    'Defensa Nacional',
    'Derechos y Deberes de los Miembros de las FAS',
    'Doctrina',
    'Ejército de Tierra',
    'Ejército del Aire',
    'Estado Mayor de la Defensa',
    'general',
    'Igualdad Efectiva de Mujeres y Hombres',
    'Ministerio de Defensa',
    'Observatorio Militar para la Igualdad',
    'organismos internacionales',
    'Organización de las FAS',
    'Organización de las Naciones Unidas',
    'OSCE',
    'OTAN',
    'Procedimiento Administrativo Común',
    'Reales Ordenanzas',
    'Régimen Disciplinario de las Fuerzas Armadas',
    'Régimen Jurídico del Sector Público',
    'Seguridad Nacional',
    'Tramitación Iniciativas y Quejas',
    'Tropa',
    'Tropa y Marinería',
    'Unión Europea'
];

echo "<table border='1' style='border-collapse: collapse;'>";
echo "<tr><th>Tema Original</th><th>Tema Detectado</th><th>Estado</th></tr>";

$detected_count = 0;
$not_detected_count = 0;

foreach ($real_themes as $theme) {
    $detected = telegram_extract_topic_from_name($theme);
    $status = $detected ? "✅ DETECTADO" : "❌ NO DETECTADO";
    $detected_display = $detected ? $detected : "N/A";
    
    if ($detected) {
        $detected_count++;
    } else {
        $not_detected_count++;
    }
    
    echo "<tr>";
    echo "<td><strong>{$theme}</strong></td>";
    echo "<td>{$detected_display}</td>";
    echo "<td>{$status}</td>";
    echo "</tr>";
}

echo "</table>";

echo "<hr>";
echo "<h3>📊 Resumen:</h3>";
echo "<p>✅ Temas detectados: {$detected_count}</p>";
echo "<p>❌ Temas no detectados: {$not_detected_count}</p>";
echo "<p>📈 Tasa de detección: " . round(($detected_count / count($real_themes)) * 100, 1) . "%</p>";

echo "<p>🎯 Objetivo: 100% de detección</p>";
?> 