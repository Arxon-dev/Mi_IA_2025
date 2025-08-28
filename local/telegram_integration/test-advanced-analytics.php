<?php
// Detectar automáticamente la ruta de config.php
$configPaths = [
    '../../../../config.php',
    '../../../config.php', 
    '../../config.php',
    '../config.php',
    'config.php'
];

$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    die('Error: No se pudo encontrar config.php. Verifica la estructura de directorios.');
}

echo "<h1>🧪 Prueba del Sistema de Analytics Avanzado</h1>";

// Función para probar la inserción de datos
function testDataInsertion() {
    global $CFG;
    
    try {
        // Conexión PDO para más control
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "<p>✅ Conexión PDO a la base de datos de Moodle exitosa.</p>";
        
        echo "<h2>1. Prueba de Inserción de Datos</h2>";
        
        // Insertar datos de prueba para el administrador
        $telegramUserId = '118d2830-404f-49e9-9496-c5ab54e6a1c8';
        
        // 1. Insertar respuestas individuales
        $responses = [
            ['sectionid' => 1, 'sectionname' => 'Constitución Española', 'iscorrect' => true],
            ['sectionid' => 1, 'sectionname' => 'Constitución Española', 'iscorrect' => false],
            ['sectionid' => 1, 'sectionname' => 'Constitución Española', 'iscorrect' => true],
            ['sectionid' => 2, 'sectionname' => 'Derechos Fundamentales', 'iscorrect' => true],
            ['sectionid' => 2, 'sectionname' => 'Derechos Fundamentales', 'iscorrect' => true],
            ['sectionid' => 3, 'sectionname' => 'Organización del Estado', 'iscorrect' => false],
            ['sectionid' => 3, 'sectionname' => 'Organización del Estado', 'iscorrect' => false],
            ['sectionid' => 3, 'sectionname' => 'Organización del Estado', 'iscorrect' => true],
        ];
        
        foreach ($responses as $i => $response) {
            $stmt = $pdo->prepare("
                INSERT INTO mdl_local_telegram_user_responses 
                (telegramuserid, questionid, sectionid, useranswer, correctanswer, iscorrect, responsetime, points_earned, points_lost, createdat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $questionId = "test_question_" . ($i + 1);
            $userAnswer = $response['iscorrect'] ? "Respuesta correcta" : "Respuesta incorrecta";
            $correctAnswer = "Respuesta correcta";
            $pointsEarned = $response['iscorrect'] ? 10 : 0;
            $pointsLost = $response['iscorrect'] ? 0 : 5;
            
            $stmt->execute([
                $telegramUserId,
                $questionId,
                $response['sectionid'],
                $userAnswer,
                $correctAnswer,
                $response['iscorrect'],
                rand(5, 30), // tiempo de respuesta aleatorio
                $pointsEarned,
                $pointsLost
            ]);
        }
        
        echo "<p>✅ <strong>Respuestas individuales insertadas</strong></p>";
        
        // 2. Insertar sesiones de estudio
        $sessions = [
            ['type' => 'normal', 'questions' => 5, 'correct' => 4, 'incorrect' => 1, 'points_earned' => 40, 'points_lost' => 5],
            ['type' => 'failed_questions', 'questions' => 3, 'correct' => 2, 'incorrect' => 1, 'points_earned' => 20, 'points_lost' => 5],
            ['type' => 'custom_topic', 'questions' => 4, 'correct' => 3, 'incorrect' => 1, 'points_earned' => 30, 'points_lost' => 5],
        ];
        
        foreach ($sessions as $session) {
            $stmt = $pdo->prepare("
                INSERT INTO mdl_local_telegram_study_sessions 
                (telegramuserid, sessiontype, questions_answered, correct_answers, incorrect_answers, 
                 total_points_earned, total_points_lost, session_duration, startedat, endedat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $telegramUserId,
                $session['type'],
                $session['questions'],
                $session['correct'],
                $session['incorrect'],
                $session['points_earned'],
                $session['points_lost'],
                rand(300, 1800) // duración aleatoria entre 5-30 minutos
            ]);
        }
        
        echo "<p>✅ <strong>Sesiones de estudio insertadas</strong></p>";
        
        // 3. Insertar logros
        $achievements = [
            ['type' => 'topic_master', 'name' => 'Maestro de la Constitución', 'description' => 'Dominas completamente la Constitución Española'],
            ['type' => 'streak_master', 'name' => 'Maestro de Rachas', 'description' => 'Lograste una racha de 10 aciertos consecutivos'],
            ['type' => 'accuracy_king', 'name' => 'Rey de la Precisión', 'description' => 'Mantienes una precisión superior al 90%'],
        ];
        
        foreach ($achievements as $achievement) {
            $stmt = $pdo->prepare("
                INSERT INTO mdl_local_telegram_achievements 
                (telegramuserid, achievementtype, achievementname, achievementdescription, earnedat)
                VALUES (?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $telegramUserId,
                $achievement['type'],
                $achievement['name'],
                $achievement['description']
            ]);
        }
        
        echo "<p>✅ <strong>Logros insertados</strong></p>";
        
        // 4. Insertar recomendaciones
        $recommendations = [
            ['type' => 'practice_topic', 'sectionid' => 3, 'priority' => 1, 'reason' => 'Tu precisión en "Organización del Estado" es del 33.3%. Necesitas practicar más.'],
            ['type' => 'review_failed', 'sectionid' => null, 'priority' => 2, 'reason' => 'Tienes 2 preguntas fallidas que necesitan repaso.'],
            ['type' => 'challenge_yourself', 'sectionid' => null, 'priority' => 3, 'reason' => 'Intenta preguntas más difíciles para mejorar tu nivel.'],
        ];
        
        foreach ($recommendations as $rec) {
            $stmt = $pdo->prepare("
                INSERT INTO mdl_local_telegram_recommendations 
                (telegramuserid, recommendationtype, sectionid, priority, reason, isactive, createdat)
                VALUES (?, ?, ?, ?, ?, 1, NOW())
            ");
            
            $stmt->execute([
                $telegramUserId,
                $rec['type'],
                $rec['sectionid'],
                $rec['priority'],
                $rec['reason']
            ]);
        }
        
        echo "<p>✅ <strong>Recomendaciones insertadas</strong></p>";
        
        return true;
        
    } catch (PDOException $e) {
        echo "<p>❌ <strong>Error en inserción de datos:</strong> " . $e->getMessage() . "</p>";
        return false;
    }
}

// Función para verificar los datos insertados
function verifyDataInsertion() {
    global $CFG;
    
    try {
        // Fallback a conexión PDO
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        echo "<h2>2. Verificación de Datos Insertados</h2>";
        
        $telegramUserId = '118d2830-404f-49e9-9496-c5ab54e6a1c8';
        
        // Verificar respuestas individuales
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM mdl_local_telegram_user_responses WHERE telegramuserid = ?");
        $stmt->execute([$telegramUserId]);
        $responsesCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "<p>📊 <strong>Respuestas individuales:</strong> $responsesCount registros</p>";
        
        // Verificar sesiones de estudio
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM mdl_local_telegram_study_sessions WHERE telegramuserid = ?");
        $stmt->execute([$telegramUserId]);
        $sessionsCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "<p>📊 <strong>Sesiones de estudio:</strong> $sessionsCount registros</p>";
        
        // Verificar logros
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM mdl_local_telegram_achievements WHERE telegramuserid = ?");
        $stmt->execute([$telegramUserId]);
        $achievementsCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "<p>📊 <strong>Logros:</strong> $achievementsCount registros</p>";
        
        // Verificar recomendaciones
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM mdl_local_telegram_recommendations WHERE telegramuserid = ? AND isactive = 1");
        $stmt->execute([$telegramUserId]);
        $recommendationsCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "<p>📊 <strong>Recomendaciones activas:</strong> $recommendationsCount registros</p>";
        
        // Verificar rendimiento por temas
        $stmt = $pdo->prepare("SELECT * FROM mdl_local_telegram_user_topic_performance WHERE telegramuserid = ? ORDER BY accuracy ASC");
        $stmt->execute([$telegramUserId]);
        $topicPerformance = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h3>📚 Rendimiento por Temas:</h3>";
        if (!empty($topicPerformance)) {
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>Tema</th><th>Preguntas</th><th>Correctas</th><th>Incorrectas</th><th>Precisión</th></tr>";
            foreach ($topicPerformance as $topic) {
                echo "<tr>";
                echo "<td>" . $topic['sectionname'] . "</td>";
                echo "<td>" . $topic['totalquestions'] . "</td>";
                echo "<td>" . $topic['correctanswers'] . "</td>";
                echo "<td>" . $topic['incorrectanswers'] . "</td>";
                echo "<td>" . number_format($topic['accuracy'], 1) . "%</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>❌ No hay datos de rendimiento por temas</p>";
        }
        
        return true;
        
    } catch (PDOException $e) {
        echo "<p>❌ <strong>Error verificando datos:</strong> " . $e->getMessage() . "</p>";
        return false;
    }
}

// Procesar formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['test_insertion'])) {
        $insertionSuccess = testDataInsertion();
        if ($insertionSuccess) {
            verifyDataInsertion();
        }
    }
} else {
    echo "<h2>🧪 Prueba del Sistema de Analytics</h2>";
    echo "<p>Este script insertará datos de prueba para verificar que el sistema de analytics avanzado funciona correctamente.</p>";
    
    echo "<form method='post'>";
    echo "<input type='hidden' name='test_insertion' value='1'>";
    echo "<button type='submit' style='padding: 15px 30px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;'>";
    echo "🧪 Insertar Datos de Prueba";
    echo "</button>";
    echo "</form>";
    
    echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h4>⚠️ Información</h4>";
    echo "<p>Los datos de prueba se insertarán para el usuario administrador (Carlos_esp).</p>";
    echo "<p>Esto incluirá:</p>";
    echo "<ul>";
    echo "<li>8 respuestas individuales en 3 temas diferentes</li>";
    echo "<li>3 sesiones de estudio de diferentes tipos</li>";
    echo "<li>3 logros de ejemplo</li>";
    echo "<li>3 recomendaciones personalizadas</li>";
    echo "</ul>";
    echo "</div>";
}

echo "<h2>🔗 Enlaces Útiles</h2>";
echo "<ul>";
echo "<li><a href='advanced-analytics.php'>📊 Analytics Avanzado</a></li>";
echo "<li><a href='../analytics.php'>📈 Analytics Básico</a></li>";
echo "<li><a href='setup-advanced-analytics.php'>⚙️ Configuración</a></li>";
echo "</ul>";
?> 