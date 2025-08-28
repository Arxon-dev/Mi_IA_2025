<?php
// Intentar múltiples rutas para config.php
$config_paths = array(
    '../../config.php',
    '../../../config.php',
    '../../../../config.php',
    dirname(__FILE__) . '/../../config.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config.php'
);

$config_found = false;
foreach ($config_paths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $config_found = true;
        echo "✅ Config encontrado en: {$path}<br>";
        break;
    }
}

if (!$config_found) {
    die("❌ Error: No se pudo encontrar config.php en las rutas esperadas");
}

// Verificar locallib.php
$locallib_path = dirname(__FILE__) . '/locallib.php';
if (!file_exists($locallib_path)) {
    die("❌ Error: No se pudo encontrar locallib.php");
}

try {
    require_once($locallib_path);
    echo "✅ Locallib cargado correctamente<br>";
} catch (Exception $e) {
    die("❌ Error cargando locallib.php: " . $e->getMessage());
}

// Verificar conexión a la base de datos
try {
    $test_query = $DB->get_records_sql("SELECT 1 as test", array(), 0, 1);
    echo "✅ Conexión a la base de datos: OK<br>";
} catch (Exception $e) {
    die("❌ Error de conexión a la base de datos: " . $e->getMessage());
}

echo "<h2>🔍 Verificación de Detección de Temas - Versión Corregida</h2>";

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
    try {
        $detected = telegram_extract_topic_from_name($test_topic);
        $status = $detected ? "✅ DETECTADO" : "❌ NO DETECTADO";
        $result = $detected ? $detected : "N/A";
        
        echo "<p><strong>{$test_topic}</strong>: {$status} → {$result}</p>";
    } catch (Exception $e) {
        echo "<p><strong>{$test_topic}</strong>: ❌ ERROR → {$e->getMessage()}</p>";
    }
}

echo "<hr>";
echo "<h3>📊 Estado actual de la tabla topic_performance:</h3>";

try {
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
} catch (Exception $e) {
    echo "<p>❌ Error consultando topic_performance: " . $e->getMessage() . "</p>";
}
?> 