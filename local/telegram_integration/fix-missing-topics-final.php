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
        break;
    }
}

if (!$config_found) {
    die("❌ Error: No se pudo encontrar config.php");
}

require_once('locallib.php');

echo "<h2>🔧 Corrección Final de Temas Faltantes</h2>";

// Usar la estructura real de la tabla moodleactivity
$subjects_in_moodleactivity = $DB->get_records_sql("
    SELECT DISTINCT subject, COUNT(*) as count
    FROM {moodleactivity} 
    GROUP BY subject
    ORDER BY subject
");

echo "<h3>📋 Temas encontrados en moodleactivity:</h3>";
echo "<table border='1' style='border-collapse: collapse;'>";
echo "<tr><th>Tema en moodleactivity</th><th>Registros</th><th>Tema detectado</th><th>Estado</th></tr>";

foreach ($subjects_in_moodleactivity as $subject_data) {
    $detected_topic = telegram_extract_topic_from_name($subject_data->subject);
    
    // Verificar si existe en topic_performance
    $exists_in_performance = false;
    if ($detected_topic) {
        $performance_count = $DB->count_records('local_telegram_user_topic_performance', 
            array('topic' => $detected_topic));
        $exists_in_performance = ($performance_count > 0);
    }
    
    $status = $exists_in_performance ? "✅ EN PERFORMANCE" : "❌ FALTA EN PERFORMANCE";
    $detected_display = $detected_topic ? $detected_topic : "NO DETECTADO";
    
    echo "<tr>";
    echo "<td><strong>{$subject_data->subject}</strong></td>";
    echo "<td>{$subject_data->count}</td>";
    echo "<td>{$detected_display}</td>";
    echo "<td>{$status}</td>";
    echo "</tr>";
}

echo "</table>";

echo "<hr>";
echo "<h3>🔍 Análisis de temas problemáticos:</h3>";

// Mostrar los temas que se detectan incorrectamente
$problematic_detections = array(
    'RÉGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS' => 'RIO',
    'MINISTERIO DE DEFENSA' => 'RIO'
);

foreach ($problematic_detections as $original => $wrong_detection) {
    echo "<p>⚠️ <strong>{$original}</strong> se detecta incorrectamente como <strong>{$wrong_detection}</strong></p>";
}

echo "<hr>";
echo "<h3>🛠️ Proceso de corrección:</h3>";

// Procesar cada tema único en moodleactivity
foreach ($subjects_in_moodleactivity as $subject_data) {
    $subject = $subject_data->subject;
    $detected_topic = telegram_extract_topic_from_name($subject);
    
    if ($detected_topic) {
        echo "<p>🔄 Procesando: <strong>{$subject}</strong> → {$detected_topic}</p>";
        
        // Obtener usuarios únicos para este tema
        $users_for_subject = $DB->get_records_sql("
            SELECT DISTINCT moodleuserid, telegramuserid,
                   SUM(CASE WHEN questioncorrect = 1 THEN 1 ELSE 0 END) as correct_count,
                   COUNT(*) as total_count
            FROM {moodleactivity} 
            WHERE subject = ?
            GROUP BY moodleuserid, telegramuserid
        ", array($subject));
        
        foreach ($users_for_subject as $user_data) {
            // Verificar si ya existe el registro
            $existing = $DB->get_record('local_telegram_user_topic_performance', 
                array('userid' => $user_data->moodleuserid, 'topic' => $detected_topic));
            
            if (!$existing) {
                // Crear nuevo registro
                $new_record = new stdClass();
                $new_record->userid = $user_data->moodleuserid;
                $new_record->topic = $detected_topic;
                $new_record->correct_answers = $user_data->correct_count;
                $new_record->total_answers = $user_data->total_count;
                $new_record->last_updated = time();
                
                try {
                    $DB->insert_record('local_telegram_user_topic_performance', $new_record);
                    echo "<p>✅ Agregado: Usuario {$user_data->moodleuserid} - {$detected_topic} ({$user_data->correct_count}/{$user_data->total_count})</p>";
                } catch (Exception $e) {
                    echo "<p>❌ Error insertando: {$e->getMessage()}</p>";
                }
            } else {
                // Actualizar registro existente
                $existing->correct_answers += $user_data->correct_count;
                $existing->total_answers += $user_data->total_count;
                $existing->last_updated = time();
                
                try {
                    $DB->update_record('local_telegram_user_topic_performance', $existing);
                    echo "<p>🔄 Actualizado: Usuario {$user_data->moodleuserid} - {$detected_topic}</p>";
                } catch (Exception $e) {
                    echo "<p>❌ Error actualizando: {$e->getMessage()}</p>";
                }
            }
        }
    } else {
        echo "<p>⚠️ No se pudo detectar tema para: <strong>{$subject}</strong></p>";
    }
}

echo "<p>🎉 <strong>Proceso completado!</strong></p>";
?> 