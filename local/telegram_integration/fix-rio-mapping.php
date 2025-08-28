<?php
// Intentar múltiples rutas para config.php
$config_paths = array(
    '../../config.php',
    '../../../config.php',
    '../../../../config.php',
    dirname(__FILE__) . '/../../config.php'
);

$config_found = false;
foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $config_found = true;
        break;
    }
}

if (!$config_found) {
    die("❌ Error: No se pudo encontrar config.php");
}

require_once('locallib.php');

echo "<h2>🔧 Corrección Específica de Mapeo RIO</h2>";

// ✅ PASO 1: Identificar registros con detección incorrecta
$problematic_mappings = array(
    'RÉGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS' => 'RIO',
    'MINISTERIO DE DEFENSA' => 'RIO'
);

echo "<h3>🔍 Analizando detecciones incorrectas actuales:</h3>";

foreach ($problematic_mappings as $should_be => $wrongly_detected) {
    $detected = telegram_extract_topic_from_name($should_be);
    echo "<p><strong>{$should_be}</strong>:</p>";
    echo "<p>  → Detectado como: <strong>{$detected}</strong></p>";
    echo "<p>  → Anteriormente era: <strong>{$wrongly_detected}</strong></p>";
    echo "<p>  → Estado: " . ($detected === $should_be ? "✅ CORREGIDO" : "❌ AÚN INCORRECTO") . "</p>";
    echo "<hr>";
}

// ✅ PASO 2: Verificar qué tema "RIO" debería detectar
echo "<h3>🔍 Verificando detección de 'RIO':</h3>";
$rio_detection = telegram_extract_topic_from_name('RIO');
echo "<p><strong>RIO</strong> → Detectado como: <strong>{$rio_detection}</strong></p>";
echo "<p>✅ Correcto: RIO = REGIMEN JURIDICO DEL SECTOR PUBLICO</p>";

// ✅ PASO 3: Mostrar todos los temas únicos en moodleactivity
echo "<h3>📋 Todos los temas en moodleactivity:</h3>";
$all_subjects = $DB->get_records_sql("
    SELECT DISTINCT subject, COUNT(*) as count
    FROM {moodleactivity} 
    GROUP BY subject
    ORDER BY subject
");

echo "<table border='1' style='border-collapse: collapse;'>";
echo "<tr><th>Tema Original</th><th>Registros</th><th>Tema Detectado</th><th>Estado</th></tr>";

foreach ($all_subjects as $subject_data) {
    $subject = $subject_data->subject;
    $count = $subject_data->count;
    $detected = telegram_extract_topic_from_name($subject);
    
    $status = $detected ? "✅ DETECTADO" : "❌ NO DETECTADO";
    $detected_display = $detected ? $detected : "N/A";
    
    echo "<tr>";
    echo "<td><strong>{$subject}</strong></td>";
    echo "<td>{$count}</td>";
    echo "<td>{$detected_display}</td>";
    echo "<td>{$status}</td>";
    echo "</tr>";
}

echo "</table>";

echo "<p>🎯 <strong>Análisis completado</strong></p>";
?> 