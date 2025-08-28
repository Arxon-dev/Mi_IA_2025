<?php
// Conexión a config.php
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

echo "<h2>🔧 Corrección Final con Estructura Real de Tabla</h2>";

// ✅ CONFIGURACIÓN BD TELEGRAM
$telegram_db_config = [
    'host' => 'localhost',
    'port' => '3306',
    'database' => 'u449034524_moodel_telegra',
    'username' => 'u449034524_opomelilla_25',
    'password' => 'Sirius//03072503//'
];

// ✅ CONECTAR A BD TELEGRAM
try {
    $dsn = "mysql:host={$telegram_db_config['host']};port={$telegram_db_config['port']};dbname={$telegram_db_config['database']};charset=utf8mb4";
    $telegram_pdo = new PDO($dsn, $telegram_db_config['username'], $telegram_db_config['password']);
    $telegram_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p>✅ Conexión exitosa a BD Telegram</p>";
} catch (PDOException $e) {
    die("❌ Error conectando a BD Telegram: " . $e->getMessage());
}

// ✅ OBTENER TEMAS DE MOODLEACTIVITY
echo "<h3>📋 Procesando temas de moodleactivity:</h3>";

$stmt = $telegram_pdo->prepare("
    SELECT 
        subject,
        moodleuserid,
        COUNT(*) as total_answers,
        SUM(CASE WHEN questioncorrect = 1 THEN 1 ELSE 0 END) as correct_answers
    FROM moodleactivity 
    WHERE subject IS NOT NULL AND subject != '' AND subject != 'general'
    GROUP BY subject, moodleuserid
    ORDER BY subject, moodleuserid
");

$stmt->execute();
$user_subject_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$processed = 0;
$errors = 0;
$topics_processed = [];

foreach ($user_subject_data as $data) {
    $subject = $data['subject'];
    $moodle_user_id = $data['moodleuserid'];
    $total_answers = $data['total_answers'];
    $correct_answers = $data['correct_answers'];
    
    // Detectar tema
    $detected_topic = telegram_extract_topic_from_name($subject);
    
    if ($detected_topic) {
        echo "<p>🔄 <strong>{$subject}</strong> → {$detected_topic} (Usuario: {$moodle_user_id})</p>";
        
        try {
            // Obtener telegramuserid desde BD Telegram
            $stmt_telegram = $telegram_pdo->prepare("
                SELECT telegramuserid 
                FROM moodleactivity 
                WHERE moodleuserid = ? 
                LIMIT 1
            ");
            $stmt_telegram->execute([$moodle_user_id]);
            $telegram_user_data = $stmt_telegram->fetch(PDO::FETCH_ASSOC);
            
            if ($telegram_user_data && $telegram_user_data['telegramuserid']) {
                $telegram_user_id = $telegram_user_data['telegramuserid'];
                
                // Generar ID de sección
                $section_id = crc32($detected_topic);
                
                // Verificar si ya existe en la tabla performance
                $existing = $DB->get_record('local_telegram_user_topic_performance', 
                    array('telegramuserid' => $telegram_user_id, 'sectionname' => $detected_topic));
                
                if (!$existing) {
                    // Crear nuevo registro
                    $new_record = new stdClass();
                    $new_record->telegramuserid = $telegram_user_id;
                    $new_record->sectionid = $section_id;
                    $new_record->sectionname = $detected_topic;
                    $new_record->totalquestions = $total_answers;
                    $new_record->correctanswers = $correct_answers;
                    $new_record->incorrectanswers = $total_answers - $correct_answers;
                    $new_record->accuracy = $total_answers > 0 ? round(($correct_answers / $total_answers) * 100, 2) : 0;
                    $new_record->lastactivity = time();
                    $new_record->createdat = time();
                    $new_record->updatedat = time();
                    
                    $DB->insert_record('local_telegram_user_topic_performance', $new_record);
                    $processed++;
                    
                    echo "<p>✅ Agregado: {$detected_topic} - Usuario {$telegram_user_id} ({$correct_answers}/{$total_answers})</p>";
                } else {
                    echo "<p>ℹ️ Ya existe: {$detected_topic} - Usuario {$telegram_user_id}</p>";
                }
                
                $topics_processed[$detected_topic] = ($topics_processed[$detected_topic] ?? 0) + 1;
            } else {
                echo "<p>⚠️ No se encontró telegramuserid para moodleuserid: {$moodle_user_id}</p>";
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
echo "<h3>📈 Resumen Final:</h3>";
echo "<p>✅ Registros procesados: {$processed}</p>";
echo "<p>❌ Errores: {$errors}</p>";

if (!empty($topics_processed)) {
    echo "<h4>📋 Temas procesados:</h4>";
    echo "<ul>";
    foreach ($topics_processed as $topic => $count) {
        echo "<li><strong>{$topic}</strong>: {$count} registros</li>";
    }
    echo "</ul>";
}

echo "<p>🎉 <strong>Corrección completada!</strong></p>";
?> 