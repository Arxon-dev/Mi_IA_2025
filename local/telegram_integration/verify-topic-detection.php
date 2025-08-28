<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Verificación de Detección de Temas</h2>";

// Temas que anteriormente no se detectaban
$problematic_topics = array(
    'OTAN',
    'UNION EUROPEA',
    'PROCEDIMIENTO ADMINISTRATIVO COMÚN DE LAS ADMINISTRACIONES PÚBLICAS',
    'IGUALDAD EFECTIVA DE MUJERES Y HOMBRES',
    'RÉGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS',
    'DERECHOS Y DEBERES DE LOS MIEMBROS DE LAS FAS',
    'LEY CARRERA MILITAR',
    'MINISTERIO DE DEFENSA',
    'ORGANIZACIÓN BÁSICA FAS',
    'ORGANIZACIÓN BÁSICA ARMADA'
);

echo "<h3>🧪 Probando detección de temas problemáticos:</h3>";

foreach ($problematic_topics as $test_topic) {
    $detected = telegram_extract_topic_from_name($test_topic);
    $status = $detected ? "✅ DETECTADO" : "❌ NO DETECTADO";
    $result = $detected ? $detected : "N/A";
    
    echo "<p><strong>{$test_topic}</strong>: {$status} → {$result}</p>";
}

echo "<hr>";
echo "<h3>📊 Estado actual de la tabla topic_performance:</h3>";

$current_topics = $DB->get_records_sql("
    SELECT topic, COUNT(*) as count 
    FROM {local_telegram_user_topic_performance} 
    GROUP BY topic 
    ORDER BY count DESC
");

echo "<table border='1' style='border-collapse: collapse;'>";
echo "<tr><th>Tema</th><th>Registros</th></tr>";

foreach ($current_topics as $topic_data) {
    echo "<tr><td>{$topic_data->topic}</td><td>{$topic_data->count}</td></tr>";
}

echo "</table>";

echo "<p>🎯 <strong>Total de temas únicos:</strong> " . count($current_topics) . "</p>";
?> 