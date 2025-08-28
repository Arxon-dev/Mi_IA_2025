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

echo "<h2>🔧 Corrección con Conexión Directa a BD Telegram</h2>";

// ✅ CONFIGURACIÓN DE CONEXIÓN DIRECTA CORREGIDA
$telegram_db_config = [
    'host' => 'localhost',
    'port' => '3306',
    'database' => 'u449034524_moodel_telegra',
    'username' => 'u449034524_opomelilla_25',
    'password' => 'Sirius//03072503//'
];

// ✅ CONECTAR DIRECTAMENTE A LA BD DE TELEGRAM
try {
    $dsn = "mysql:host={$telegram_db_config['host']};port={$telegram_db_config['port']};dbname={$telegram_db_config['database']};charset=utf8mb4";
    $telegram_pdo = new PDO($dsn, $telegram_db_config['username'], $telegram_db_config['password']);
    $telegram_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p>✅ Conexión exitosa a BD Telegram: {$telegram_db_config['database']}</p>";
} catch (PDOException $e) {
    die("❌ Error conectando a BD Telegram: " . $e->getMessage());
}

// ✅ ANÁLISIS DE TEMAS EN MOODLEACTIVITY
echo "<h3>📋 Análisis de temas en moodleactivity (BD Telegram):</h3>";

try {
    $stmt = $telegram_pdo->prepare("
        SELECT 
            subject,
            COUNT(*) as total_records,
            COUNT(DISTINCT moodleuserid) as unique_users,
            SUM(CASE WHEN questioncorrect = 1 THEN 1 ELSE 0 END) as correct_answers
        FROM moodleactivity 
        WHERE subject IS NOT NULL AND subject != ''
        GROUP BY subject
        ORDER BY subject
    ");
    
    $stmt->execute();
    $subjects_analysis = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Tema Original</th><th>Registros</th><th>Usuarios</th><th>Correctas</th><th>Tema Detectado</th><th>Estado Performance</th></tr>";
    
    foreach ($subjects_analysis as $subject_data) {
        $subject = $subject_data['subject'];
        $detected_topic = telegram_extract_topic_from_name($subject);
        
        // Verificar si existe en local_telegram_user_topic_performance (BD Moodle)
        $exists_in_performance = false;
        if ($detected_topic) {
            try {
                $performance_count = $DB->count_records('local_telegram_user_topic_performance', 
                    array('topic' => $detected_topic));
                $exists_in_performance = ($performance_count > 0);
            } catch (Exception $e) {
                $exists_in_performance = "ERROR: " . $e->getMessage();
            }
        }
        
        $status = $exists_in_performance === true ? "✅ EN PERFORMANCE" : 
                 (is_string($exists_in_performance) ? "❌ " . $exists_in_performance : "❌ FALTA EN PERFORMANCE");
        $detected_display = $detected_topic ? $detected_topic : "❌ NO DETECTADO";
        
        echo "<tr>";
        echo "<td><strong>{$subject}</strong></td>";
        echo "<td>{$subject_data['total_records']}</td>";
        echo "<td>{$subject_data['unique_users']}</td>";
        echo "<td>{$subject_data['correct_answers']}</td>";
        echo "<td>{$detected_display}</td>";
        echo "<td>{$status}</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
} catch (Exception $e) {
    die("❌ Error obteniendo análisis de temas: " . $e->getMessage());
}

// ✅ VERIFICAR DETECCIÓN DE TEMAS PROBLEMÁTICOS
echo "<h3>🔍 Verificación de detección de temas problemáticos:</h3>";

$test_themes = [
    'OTAN',
    'OSCE', 
    'Régimen Disciplinario de las Fuerzas Armadas',
    'organismos internacionales',
    'Constitución Española',
    'Carrera Militar',
    'Tropa y Marinería',
    'Reales Ordenanzas',
    'Defensa Nacional',
    'Ejército de Tierra',
    'Doctrina',
    'general'
];

echo "<table border='1' style='border-collapse: collapse;'>";
echo "<tr><th>Tema de Prueba</th><th>Tema Detectado</th><th>Estado</th></tr>";

foreach ($test_themes as $test_theme) {
    $detected = telegram_extract_topic_from_name($test_theme);
    $status = $detected ? "✅ DETECTADO" : "❌ NO DETECTADO";
    $detected_display = $detected ? $detected : "N/A";
    
    echo "<tr>";
    echo "<td><strong>{$test_theme}</strong></td>";
    echo "<td>{$detected_display}</td>";
    echo "<td>{$status}</td>";
    echo "</tr>";
}

echo "</table>";

// ✅ PROCESO DE CORRECCIÓN
echo "<h3>🛠️ Proceso de corrección:</h3>";

$processed = 0;
$errors = 0;

foreach ($subjects_analysis as $subject_data) {
    $subject = $subject_data['subject'];
    $detected_topic = telegram_extract_topic_from_name($subject);
    
    if ($detected_topic) {
        echo "<p>🔄 Procesando: <strong>{$subject}</strong> → {$detected_topic}</p>";
        
        try {
            // Obtener usuarios únicos para este tema desde BD Telegram
            $stmt = $telegram_pdo->prepare("
                SELECT 
                    moodleuserid,
                    COUNT(*) as total_answers,
                    SUM(CASE WHEN questioncorrect = 1 THEN 1 ELSE 0 END) as correct_answers
                FROM moodleactivity 
                WHERE subject = ?
                GROUP BY moodleuserid
            ");
            
            $stmt->execute([$subject]);
            $users_for_subject = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($users_for_subject as $user_data) {
                $moodle_user_id = $user_data['moodleuserid'];
                
                // Verificar si ya existe el registro en BD Moodle
                $existing = $DB->get_record('local_telegram_user_topic_performance', 
                    array('userid' => $moodle_user_id, 'topic' => $detected_topic));
                
                if (!$existing) {
                    // Crear nuevo registro en BD Moodle
                    $new_record = new stdClass();
                    $new_record->userid = $moodle_user_id;
                    $new_record->topic = $detected_topic;
                    $new_record->correct_answers = $user_data['correct_answers'];
                    $new_record->total_answers = $user_data['total_answers'];
                    $new_record->last_updated = time();
                    
                    $DB->insert_record('local_telegram_user_topic_performance', $new_record);
                    $processed++;
                    
                    echo "<p>✅ Agregado: Usuario {$moodle_user_id} - {$detected_topic} ({$user_data['correct_answers']}/{$user_data['total_answers']})</p>";
                } else {
                    echo "<p>ℹ️ Ya existe: Usuario {$moodle_user_id} - {$detected_topic}</p>";
                }
            }
            
        } catch (Exception $e) {
            echo "<p>❌ Error procesando {$subject}: " . $e->getMessage() . "</p>";
            $errors++;
        }
    } else {
        echo "<p>⚠️ No se detectó tema para: <strong>{$subject}</strong></p>";
    }
}

echo "<hr>";
echo "<h3>📈 Resumen:</h3>";
echo "<p>✅ Registros procesados: {$processed}</p>";
echo "<p>❌ Errores: {$errors}</p>";

echo "<p>🎉 <strong>Proceso completado</strong></p>";
?> 