<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔄 Procesamiento Manual de Datos OTAN</h2>";

// Conexión a BD Telegram
try {
    $telegram_pdo = new PDO(
        'mysql:host=localhost;dbname=u449034524_moodel_telegra;charset=utf8',
        'u449034524_opomelilla_25',
        'Sirius//03072503//',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "<p>✅ Conexión a BD Telegram exitosa</p>";
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
    die();
}

// Obtener todos los registros de OTAN
echo "<h3>📊 Procesando registros de OTAN:</h3>";
try {
    $stmt = $telegram_pdo->query("
        SELECT subject, moodleuserid, telegramuserid, questioncorrect, 
               COUNT(*) as total_questions,
               SUM(questioncorrect) as correct_answers
        FROM moodleactivity 
        WHERE subject = 'OTAN'
        GROUP BY moodleuserid, telegramuserid
    ");
    
    $otan_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if ($otan_stats) {
        echo "<p>✅ Encontrados " . count($otan_stats) . " usuarios con actividad OTAN</p>";
        
        foreach ($otan_stats as $stat) {
            $moodle_user = $stat['moodleuserid'];
            $telegram_user = $stat['telegramuserid'];
            $total = $stat['total_questions'];
            $correct = $stat['correct_answers'];
            $accuracy = $total > 0 ? round(($correct / $total) * 100, 2) : 0;
            
            echo "<p>🔄 Usuario {$moodle_user} (Telegram: {$telegram_user}): {$correct}/{$total} ({$accuracy}%)</p>";
            
            // Verificar si ya existe en performance
            $existing = $DB->get_record('local_telegram_user_topic_performance', [
                'telegramuserid' => $telegram_user,
                'sectionname' => 'OTAN'
            ]);
            
            if ($existing) {
                echo "<p>→ ℹ️ Ya existe, actualizando...</p>";
                
                // Actualizar registro existente
                $existing->totalquestions = $total;
                $existing->correctanswers = $correct;
                $existing->incorrectanswers = $total - $correct;
                $existing->accuracy = $accuracy;
                $existing->lastactivity = time();
                $existing->updatedat = time();
                
                try {
                    $DB->update_record('local_telegram_user_topic_performance', $existing);
                    echo "<p>→ ✅ Actualizado exitosamente</p>";
                } catch (Exception $e) {
                    echo "<p>→ ❌ Error actualizando: " . $e->getMessage() . "</p>";
                }
                
            } else {
                echo "<p>→ 🆕 Creando nuevo registro...</p>";
                
                // Crear nuevo registro
                $new_record = new stdClass();
                $new_record->telegramuserid = $telegram_user;
                $new_record->sectionid = crc32('OTAN'); // Generar ID único
                $new_record->sectionname = 'OTAN';
                $new_record->totalquestions = $total;
                $new_record->correctanswers = $correct;
                $new_record->incorrectanswers = $total - $correct;
                $new_record->accuracy = $accuracy;
                $new_record->lastactivity = time();
                $new_record->createdat = time();
                $new_record->updatedat = time();
                
                try {
                    $DB->insert_record('local_telegram_user_topic_performance', $new_record);
                    echo "<p>→ ✅ Creado exitosamente</p>";
                } catch (Exception $e) {
                    echo "<p>→ ❌ Error creando: " . $e->getMessage() . "</p>";
                }
            }
        }
        
    } else {
        echo "<p>❌ No se encontraron registros de OTAN</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error procesando: " . $e->getMessage() . "</p>";
}

// Verificar resultado
echo "<h3>📊 Verificando resultado:</h3>";
try {
    $otan_performance = $DB->get_records_sql("
        SELECT * FROM {local_telegram_user_topic_performance} 
        WHERE sectionname = 'OTAN'
    ");
    
    if ($otan_performance) {
        echo "<p>✅ Ahora hay " . count($otan_performance) . " registros de OTAN en performance</p>";
        foreach ($otan_performance as $record) {
            echo "<p>→ Usuario: {$record->telegramuserid}, Correctas: {$record->correctanswers}/{$record->totalquestions} ({$record->accuracy}%)</p>";
        }
    } else {
        echo "<p>❌ Aún no hay registros de OTAN en performance</p>";
    }
} catch (Exception $e) {
    echo "<p>❌ Error verificando: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Procesamiento completado</p>";
?> 