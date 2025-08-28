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

echo "<h2>🔍 Debug del Observer - Versión Corregida</h2>";

// Verificar conexión a Moodle
echo "<h3>📋 Verificando conexión a Moodle:</h3>";
try {
    $moodle_version = $DB->get_field('config', 'value', ['name' => 'version']);
    echo "<p>✅ Conexión a Moodle: OK (Versión: {$moodle_version})</p>";
} catch (Exception $e) {
    echo "<p>❌ Error conectando a Moodle: " . $e->getMessage() . "</p>";
}

// Conexión a BD Telegram
echo "<h3>📋 Verificando conexión a BD Telegram:</h3>";
try {
    $telegram_pdo = new PDO(
        'mysql:host=localhost;dbname=u449034524_moodel_telegra;charset=utf8',
        'u449034524_opomelilla_25',
        'Sirius//03072503//',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "<p>✅ Conexión a BD Telegram: OK</p>";
} catch (Exception $e) {
    echo "<p>❌ Error conectando a BD Telegram: " . $e->getMessage() . "</p>";
    die();
}

// Verificar últimos registros en moodleactivity
echo "<h3>🔍 Verificando últimos registros de OTAN en moodleactivity:</h3>";
try {
    $stmt = $telegram_pdo->query("
        SELECT id, subject, moodleuserid, telegramuserid, questioncorrect, processedat
        FROM moodleactivity 
        WHERE subject = 'OTAN' 
        ORDER BY processedat DESC 
        LIMIT 5
    ");
    
    $otan_records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($otan_records) {
        echo "<p>✅ Encontrados " . count($otan_records) . " registros de OTAN:</p>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Moodle User</th><th>Telegram User</th><th>Correcto</th><th>Fecha</th></tr>";
        foreach ($otan_records as $record) {
            $correct = $record['questioncorrect'] ? '✅' : '❌';
            echo "<tr><td>{$record['moodleuserid']}</td><td>{$record['telegramuserid']}</td><td>{$correct}</td><td>{$record['processedat']}</td></tr>";
        }
        echo "</table>";
    } else {
        echo "<p>❌ No se encontraron registros de OTAN</p>";
    }
} catch (Exception $e) {
    echo "<p>❌ Error consultando moodleactivity: " . $e->getMessage() . "</p>";
}

// Verificar tabla performance
echo "<h3>🔍 Verificando tabla performance:</h3>";
try {
    $performance_count = $DB->count_records('local_telegram_user_topic_performance');
    echo "<p>✅ Tabla performance tiene {$performance_count} registros</p>";
    
    // Buscar registros de OTAN en performance
    $otan_performance = $DB->get_records_sql("
        SELECT * FROM {local_telegram_user_topic_performance} 
        WHERE sectionname LIKE '%OTAN%'
    ");
    
    if ($otan_performance) {
        echo "<p>✅ Encontrados " . count($otan_performance) . " registros de OTAN en performance</p>";
        foreach ($otan_performance as $record) {
            echo "<p>→ Usuario: {$record->telegramuserid}, Tema: {$record->sectionname}, Correctas: {$record->correctanswers}/{$record->totalquestions}</p>";
        }
    } else {
        echo "<p>❌ NO hay registros de OTAN en performance</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error consultando performance: " . $e->getMessage() . "</p>";
}

// Verificar si el observer está registrado
echo "<h3>🔍 Verificando observer de Moodle:</h3>";
try {
    $observers = $DB->get_records('events_queue_handlers');
    echo "<p>✅ Encontrados " . count($observers) . " observers registrados</p>";
    
    // Verificar si nuestro observer está registrado
    $our_observer = $DB->get_records_sql("
        SELECT * FROM {events_queue_handlers} 
        WHERE handlerfile LIKE '%telegram_integration%'
    ");
    
    if ($our_observer) {
        echo "<p>✅ Observer de telegram_integration encontrado</p>";
        foreach ($our_observer as $obs) {
            echo "<p>→ Archivo: {$obs->handlerfile}</p>";
        }
    } else {
        echo "<p>❌ Observer de telegram_integration NO encontrado</p>";
    }
    
} catch (Exception $e) {
    echo "<p>⚠️ No se pudo verificar observers (puede ser normal): " . $e->getMessage() . "</p>";
}

// Verificar archivos del observer
echo "<h3>🔍 Verificando archivos del observer:</h3>";
$observer_files = [
    'classes/observer.php',
    'db/events.php'
];

foreach ($observer_files as $file) {
    $filepath = __DIR__ . '/' . $file;
    if (file_exists($filepath)) {
        echo "<p>✅ Archivo {$file} existe</p>";
        $content = file_get_contents($filepath);
        $lines = substr_count($content, "\n");
        echo "<p>→ Líneas: {$lines}</p>";
    } else {
        echo "<p>❌ Archivo {$file} NO existe</p>";
    }
}

// Test de detección de tema
echo "<h3>🧪 Test de detección de tema:</h3>";
$test_names = [
    'OTAN - TEST 5',
    'OTAN - TEST 1',
    'OTAN - TEST ALEATORIO'
];

foreach ($test_names as $name) {
    $detected = telegram_extract_topic_from_name($name);
    if ($detected) {
        echo "<p>✅ '{$name}' → {$detected}</p>";
    } else {
        echo "<p>❌ '{$name}' → NO DETECTADO</p>";
    }
}

// Verificar si existe función para actualizar performance
echo "<h3>🔍 Verificando función update_performance:</h3>";
if (function_exists('telegram_update_topic_performance')) {
    echo "<p>✅ Función telegram_update_topic_performance existe</p>";
} else {
    echo "<p>❌ Función telegram_update_topic_performance NO existe</p>";
}

// Propuesta de solución
echo "<h3>💡 Diagnóstico y solución:</h3>";
echo "<div style='background-color: #f0f0f0; padding: 10px; margin: 10px 0;'>";
echo "<p><strong>PROBLEMA IDENTIFICADO:</strong></p>";
echo "<p>1. Los datos se registran en moodleactivity (BD Telegram) ✅</p>";
echo "<p>2. La detección de temas funciona correctamente ✅</p>";
echo "<p>3. El observer de Moodle no procesa hacia la tabla performance ❌</p>";
echo "<p><strong>SOLUCIÓN NECESARIA:</strong></p>";
echo "<p>→ Verificar/corregir el observer de Moodle</p>";
echo "<p>→ Crear función de procesamiento manual como alternativa</p>";
echo "</div>";

echo "<p>🎉 Diagnóstico completado</p>";
?> 