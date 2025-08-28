<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Debug del Procesamiento del Observer</h2>";

// Verificar si el observer está siendo llamado
echo "<h3>📋 Verificando logs del observer:</h3>";

// Simular el evento de quiz completado
echo "<h3>🧪 Simulando procesamiento de quiz OTAN:</h3>";

// Obtener datos del último intento de OTAN
$latest_attempt = $DB->get_record_sql("
    SELECT qa.id, qa.quiz, qa.userid, qa.timestart, qa.timefinish, qa.sumgrades, qa.state,
           q.name as quiz_name, q.grade as quiz_grade
    FROM {quiz_attempts} qa
    JOIN {quiz} q ON qa.quiz = q.id
    WHERE q.name LIKE '%OTAN%'
    AND qa.userid = 575
    ORDER BY qa.timestart DESC
    LIMIT 1
");

if ($latest_attempt) {
    echo "<p>✅ Último intento encontrado:</p>";
    echo "<ul>";
    echo "<li>Quiz: {$latest_attempt->quiz_name}</li>";
    echo "<li>Usuario: {$latest_attempt->userid}</li>";
    echo "<li>Estado: {$latest_attempt->state}</li>";
    echo "<li>Puntuación: {$latest_attempt->sumgrades}/{$latest_attempt->quiz_grade}</li>";
    echo "</ul>";
    
    // Probar la detección de tema
    $detected_topic = telegram_extract_topic_from_name($latest_attempt->quiz_name);
    echo "<p>🎯 Tema detectado: <strong>{$detected_topic}</strong></p>";
    
    if ($detected_topic) {
        echo "<h3>🔄 Simulando actualización de performance:</h3>";
        
        // Obtener telegram user ID
        $telegram_user = $DB->get_record_sql("
            SELECT telegramuserid 
            FROM {moodleactivity} 
            WHERE moodleuserid = ? 
            AND telegramuserid IS NOT NULL 
            LIMIT 1
        ", [$latest_attempt->userid]);
        
        if ($telegram_user) {
            echo "<p>✅ Telegram User ID: {$telegram_user->telegramuserid}</p>";
            
            // Verificar si existe registro en performance
            $performance_record = $DB->get_record('local_telegram_user_topic_performance', [
                'telegramuserid' => $telegram_user->telegramuserid,
                'sectionname' => $detected_topic
            ]);
            
            if ($performance_record) {
                echo "<p>❌ Registro YA EXISTE en performance - debería actualizarse</p>";
                echo "<p>→ Preguntas totales: {$performance_record->totalquestions}</p>";
                echo "<p>→ Respuestas correctas: {$performance_record->correctanswers}</p>";
            } else {
                echo "<p>❌ Registro NO EXISTE en performance - debería crearse</p>";
            }
            
            // Probar manualmente la función del observer
            echo "<h3>🧪 Probando función manual del observer:</h3>";
            try {
                // Simular el evento
                echo "<p>🔄 Simulando evento de quiz completado...</p>";
                
                // Aquí llamaríamos a la función del observer si existiera
                // Por ahora, vamos a verificar si existe
                if (class_exists('\local_telegram_integration\observer')) {
                    echo "<p>✅ Clase observer existe</p>";
                    
                    // Verificar si el método existe
                    if (method_exists('\local_telegram_integration\observer', 'quiz_attempt_submitted')) {
                        echo "<p>✅ Método quiz_attempt_submitted existe</p>";
                        
                        // Crear un evento simulado
                        $event_data = new stdClass();
                        $event_data->objectid = $latest_attempt->id;
                        $event_data->userid = $latest_attempt->userid;
                        $event_data->contextid = 1;
                        $event_data->courseid = 1;
                        
                        echo "<p>🔄 Intentando llamar al observer...</p>";
                        // Nota: No podemos llamar directamente al observer sin un evento real
                        echo "<p>⚠️ Se necesita evento real para probar completamente</p>";
                        
                    } else {
                        echo "<p>❌ Método quiz_attempt_submitted NO existe</p>";
                    }
                } else {
                    echo "<p>❌ Clase observer NO existe</p>";
                }
                
            } catch (Exception $e) {
                echo "<p>❌ Error probando observer: " . $e->getMessage() . "</p>";
            }
            
        } else {
            echo "<p>❌ No se encontró Telegram User ID para el usuario {$latest_attempt->userid}</p>";
        }
        
    } else {
        echo "<p>❌ No se detectó tema para: {$latest_attempt->quiz_name}</p>";
    }
    
} else {
    echo "<p>❌ No se encontró ningún intento de OTAN</p>";
}

echo "<h3>🔍 Verificando estructura del observer:</h3>";

// Verificar si el observer tiene las funciones necesarias
$observer_file = __DIR__ . '/classes/observer.php';
if (file_exists($observer_file)) {
    echo "<p>✅ Archivo observer.php existe</p>";
    
    $observer_content = file_get_contents($observer_file);
    
    // Verificar funciones clave
    $functions_to_check = [
        'quiz_attempt_submitted',
        'quiz_attempt_reviewed',
        'telegram_extract_topic_from_name'
    ];
    
    foreach ($functions_to_check as $function) {
        if (strpos($observer_content, $function) !== false) {
            echo "<p>✅ Función {$function} encontrada</p>";
        } else {
            echo "<p>❌ Función {$function} NO encontrada</p>";
        }
    }
    
} else {
    echo "<p>❌ Archivo observer.php NO existe</p>";
}

echo "<h3>📊 Resumen del diagnóstico:</h3>";
echo "<p>🎯 El problema parece estar en el observer de Moodle que no procesa los eventos correctamente hacia la tabla de performance.</p>";

echo "<p>🎉 Diagnóstico completado</p>";
?> 