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

echo "<h2>🔧 Corrección Simplificada de Temas Faltantes</h2>";

// ✅ PASO 1: Verificar estructura de tabla moodleactivity
echo "<h3>🔍 Verificando estructura de tabla moodleactivity:</h3>";

try {
    // Obtener información de la tabla
    $sample_record = $DB->get_record_sql("SELECT * FROM {moodleactivity} LIMIT 1");
    
    if ($sample_record) {
        echo "<p>✅ Tabla moodleactivity accesible</p>";
        echo "<p>📋 Campos disponibles: " . implode(', ', array_keys(get_object_vars($sample_record))) . "</p>";
    } else {
        echo "<p>⚠️ Tabla vacía pero accesible</p>";
    }
} catch (Exception $e) {
    die("❌ Error accediendo a moodleactivity: " . $e->getMessage());
}

// ✅ PASO 2: Obtener todos los temas únicos de moodleactivity
echo "<h3>📋 Análisis de temas en moodleactivity:</h3>";

try {
    $subjects_analysis = $DB->get_records_sql("
        SELECT 
            subject,
            COUNT(*) as total_records,
            COUNT(DISTINCT moodleuserid) as unique_users,
            SUM(CASE WHEN questioncorrect = 1 THEN 1 ELSE 0 END) as correct_answers
        FROM {moodleactivity} 
        GROUP BY subject
        ORDER BY subject
    ");
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Tema Original</th><th>Registros</th><th>Usuarios</th><th>Correctas</th><th>Tema Detectado</th><th>Estado</th></tr>";
    
    foreach ($subjects_analysis as $subject_data) {
        $subject = $subject_data->subject;
        $detected_topic = telegram_extract_topic_from_name($subject);
        
        // Verificar si existe en local_telegram_user_topic_performance
        $exists_in_performance = false;
        if ($detected_topic) {
            try {
                $performance_count = $DB->count_records('local_telegram_user_topic_performance', 
                    array('topic' => $detected_topic));
                $exists_in_performance = ($performance_count > 0);
            } catch (Exception $e) {
                $exists_in_performance = "ERROR";
            }
        }
        
        $status = $exists_in_performance === true ? "✅ EN PERFORMANCE" : 
                 ($exists_in_performance === "ERROR" ? "❌ ERROR TABLA" : "❌ FALTA EN PERFORMANCE");
        $detected_display = $detected_topic ? $detected_topic : "NO DETECTADO";
        
        echo "<tr>";
        echo "<td><strong>{$subject}</strong></td>";
        echo "<td>{$subject_data->total_records}</td>";
        echo "<td>{$subject_data->unique_users}</td>";
        echo "<td>{$subject_data->correct_answers}</td>";
        echo "<td>{$detected_display}</td>";
        echo "<td>{$status}</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
} catch (Exception $e) {
    die("❌ Error obteniendo análisis de temas: " . $e->getMessage());
}

// ✅ PASO 3: Verificar tabla local_telegram_user_topic_performance
echo "<h3>🔍 Verificando tabla local_telegram_user_topic_performance:</h3>";

try {
    $performance_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');
    
    if ($performance_exists) {
        echo "<p>✅ Tabla local_telegram_user_topic_performance existe</p>";
        
        $current_topics = $DB->get_records_sql("
            SELECT topic, COUNT(*) as count 
            FROM {local_telegram_user_topic_performance} 
            GROUP BY topic 
            ORDER BY count DESC
        ");
        
        echo "<h4>📊 Temas actuales en performance:</h4>";
        echo "<ul>";
        foreach ($current_topics as $topic_data) {
            echo "<li><strong>{$topic_data->topic}</strong>: {$topic_data->count} registros</li>";
        }
        echo "</ul>";
        
    } else {
        echo "<p>❌ Tabla local_telegram_user_topic_performance NO existe</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error verificando tabla performance: " . $e->getMessage() . "</p>";
}

// ✅ PASO 4: Proceso de corrección (sin JOINs complejos)
echo "<h3>🛠️ Proceso de corrección:</h3>";

if (isset($subjects_analysis)) {
    $processed = 0;
    $errors = 0;
    
    foreach ($subjects_analysis as $subject_data) {
        $subject = $subject_data->subject;
        $detected_topic = telegram_extract_topic_from_name($subject);
        
        if ($detected_topic) {
            echo "<p>🔄 Procesando: <strong>{$subject}</strong> → {$detected_topic}</p>";
            
            try {
                // Obtener usuarios únicos para este tema (sin JOINs)
                $users_for_subject = $DB->get_records_sql("
                    SELECT 
                        moodleuserid,
                        COUNT(*) as total_answers,
                        SUM(CASE WHEN questioncorrect = 1 THEN 1 ELSE 0 END) as correct_answers
                    FROM {moodleactivity} 
                    WHERE subject = ?
                    GROUP BY moodleuserid
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
                        $new_record->correct_answers = $user_data->correct_answers;
                        $new_record->total_answers = $user_data->total_answers;
                        $new_record->last_updated = time();
                        
                        $DB->insert_record('local_telegram_user_topic_performance', $new_record);
                        $processed++;
                        
                        echo "<p>✅ Agregado: Usuario {$user_data->moodleuserid} - {$detected_topic} ({$user_data->correct_answers}/{$user_data->total_answers})</p>";
                    } else {
                        echo "<p>ℹ️ Ya existe: Usuario {$user_data->moodleuserid} - {$detected_topic}</p>";
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
}

echo "<p>🎉 <strong>Análisis completado</strong></p>";
?> 