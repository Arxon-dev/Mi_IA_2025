<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Diagnóstico del Flujo de Cuestionarios</h2>";

// Configuración BD Telegram
$telegram_db_config = [
    'host' => 'localhost',
    'port' => '3306',
    'database' => 'u449034524_moodel_telegra',
    'username' => 'u449034524_opomelilla_25',
    'password' => 'Sirius//03072503//'
];

// Conectar a BD Telegram
try {
    $dsn = "mysql:host={$telegram_db_config['host']};port={$telegram_db_config['port']};dbname={$telegram_db_config['database']};charset=utf8mb4";
    $telegram_pdo = new PDO($dsn, $telegram_db_config['username'], $telegram_db_config['password']);
    $telegram_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p>✅ Conexión a BD Telegram exitosa</p>";
} catch (PDOException $e) {
    die("❌ Error conectando a BD Telegram: " . $e->getMessage());
}

// Buscar registros recientes de OTAN
echo "<h3>🔍 Buscando registros recientes de OTAN:</h3>";

try {
    $stmt = $telegram_pdo->prepare("
        SELECT * FROM moodleactivity 
        WHERE subject LIKE '%OTAN%' 
        ORDER BY processedat DESC 
        LIMIT 10
    ");
    
    $stmt->execute();
    $otan_records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($otan_records) > 0) {
        echo "<p>✅ Encontrados " . count($otan_records) . " registros de OTAN en moodleactivity</p>";
        
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Subject</th><th>Moodle User</th><th>Telegram User</th><th>Correct</th><th>Processed At</th></tr>";
        
        foreach ($otan_records as $record) {
            echo "<tr>";
            echo "<td>{$record['id']}</td>";
            echo "<td>{$record['subject']}</td>";
            echo "<td>{$record['moodleuserid']}</td>";
            echo "<td>{$record['telegramuserid']}</td>";
            echo "<td>" . ($record['questioncorrect'] ? "✅" : "❌") . "</td>";
            echo "<td>{$record['processedat']}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Verificar si alguno de estos usuarios tiene registros en performance
        echo "<h3>🔍 Verificando registros en tabla performance:</h3>";
        
        $unique_users = array_unique(array_column($otan_records, 'moodleuserid'));
        
        foreach ($unique_users as $user_id) {
            $performance_records = $DB->get_records('local_telegram_user_topic_performance', 
                array('telegramuserid' => $otan_records[0]['telegramuserid']));
            
            if (count($performance_records) > 0) {
                echo "<p>✅ Usuario {$user_id} tiene " . count($performance_records) . " registros en performance</p>";
                
                foreach ($performance_records as $perf) {
                    echo "<p>  → {$perf->sectionname}: {$perf->correctanswers}/{$perf->totalquestions}</p>";
                }
            } else {
                echo "<p>❌ Usuario {$user_id} NO tiene registros en performance</p>";
            }
        }
        
    } else {
        echo "<p>❌ No se encontraron registros de OTAN en moodleactivity</p>";
        echo "<p>🔍 Esto sugiere que el cuestionario no se registró correctamente</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error consultando moodleactivity: " . $e->getMessage() . "</p>";
}

// Buscar cuestionarios de OTAN en Moodle
echo "<h3>🔍 Buscando cuestionarios de OTAN en Moodle:</h3>";

try {
    $moodle_quizzes = $DB->get_records_sql("
        SELECT q.id, q.name, q.course, c.fullname as coursename
        FROM {quiz} q
        JOIN {course} c ON c.id = q.course
        WHERE q.name LIKE '%OTAN%'
        ORDER BY q.id DESC
    ");
    
    if (count($moodle_quizzes) > 0) {
        echo "<p>✅ Encontrados " . count($moodle_quizzes) . " cuestionarios de OTAN en Moodle</p>";
        
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Quiz ID</th><th>Nombre</th><th>Curso</th><th>Tema Detectado</th></tr>";
        
        foreach ($moodle_quizzes as $quiz) {
            $detected_topic = telegram_extract_topic_from_name($quiz->name);
            
            echo "<tr>";
            echo "<td>{$quiz->id}</td>";
            echo "<td>{$quiz->name}</td>";
            echo "<td>{$quiz->coursename}</td>";
            echo "<td>" . ($detected_topic ? $detected_topic : "❌ NO DETECTADO") . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } else {
        echo "<p>❌ No se encontraron cuestionarios de OTAN en Moodle</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error consultando cuestionarios de Moodle: " . $e->getMessage() . "</p>";
}

// Buscar intentos recientes de cuestionarios
echo "<h3>🔍 Buscando intentos recientes de cuestionarios:</h3>";

try {
    $recent_attempts = $DB->get_records_sql("
        SELECT qa.id, qa.quiz, qa.userid, qa.timestart, qa.timefinish, qa.state,
               q.name as quiz_name, u.username
        FROM {quiz_attempts} qa
        JOIN {quiz} q ON q.id = qa.quiz
        JOIN {user} u ON u.id = qa.userid
        WHERE q.name LIKE '%OTAN%' AND qa.timestart > ?
        ORDER BY qa.timestart DESC
        LIMIT 10
    ", array(time() - 86400)); // Últimas 24 horas
    
    if (count($recent_attempts) > 0) {
        echo "<p>✅ Encontrados " . count($recent_attempts) . " intentos recientes de OTAN</p>";
        
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>Attempt ID</th><th>Quiz</th><th>Usuario</th><th>Inicio</th><th>Fin</th><th>Estado</th></tr>";
        
        foreach ($recent_attempts as $attempt) {
            $start_time = date('Y-m-d H:i:s', $attempt->timestart);
            $finish_time = $attempt->timefinish ? date('Y-m-d H:i:s', $attempt->timefinish) : "En progreso";
            
            echo "<tr>";
            echo "<td>{$attempt->id}</td>";
            echo "<td>{$attempt->quiz_name}</td>";
            echo "<td>{$attempt->username}</td>";
            echo "<td>{$start_time}</td>";
            echo "<td>{$finish_time}</td>";
            echo "<td>{$attempt->state}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
    } else {
        echo "<p>❌ No se encontraron intentos recientes de cuestionarios de OTAN</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error consultando intentos: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Diagnóstico completado</p>";
?> 