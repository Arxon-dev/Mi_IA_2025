<?php
require_once(__DIR__ . '/../../config.php');
require_login();

// Verificar permisos de administrador
if (!has_capability('moodle/site:config', context_system::instance())) {
    echo $OUTPUT->header();
    echo "<h2>❌ Acceso Denegado</h2>";
    echo "<p>Necesitas permisos de administrador para ejecutar este script.</p>";
    echo $OUTPUT->footer();
    exit;
}

echo $OUTPUT->header();
echo "<h1>🧪 Prueba de Analytics con Usuario Correcto</h1>";

// Conexión a base de datos
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Obtener el ID de Telegram del administrador desde moodleuserlink
    $stmt = $pdo->prepare("SELECT telegramuserid FROM moodleuserlink WHERE moodleuserid = ?");
    $stmt->execute([2]); // ID del administrador
    $adminLink = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$adminLink) {
        echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<h3>❌ Administrador no vinculado</h3>";
        echo "<p>El administrador (ID: 2) no está vinculado en la tabla moodleuserlink.</p>";
        echo "</div>";
        echo $OUTPUT->footer();
        exit;
    }
    
    $telegramUserId = $adminLink['telegramuserid'];
    echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>✅ Usuario encontrado</h3>";
    echo "<p><strong>ID de Telegram del administrador:</strong> $telegramUserId</p>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>❌ Error obteniendo usuario</h3>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}

// Verificar si el usuario existe en telegramuser
try {
    $stmt = $pdo->prepare("SELECT * FROM telegramuser WHERE telegramuserid = ?");
    $stmt->execute([$telegramUserId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<h3>✅ Usuario de Telegram encontrado</h3>";
        echo "<p><strong>Nombre:</strong> " . $user['firstname'] . "</p>";
        echo "<p><strong>Puntos:</strong> " . number_format($user['totalpoints']) . "</p>";
        echo "<p><strong>Nivel:</strong> " . $user['level'] . "</p>";
        echo "<p><strong>Precisión:</strong> " . $user['accuracy'] . "%</p>";
        echo "</div>";
    } else {
        echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<h3>⚠️ Usuario no encontrado en telegramuser</h3>";
        echo "<p>El ID de Telegram $telegramUserId no existe en la tabla telegramuser.</p>";
        echo "</div>";
        echo $OUTPUT->footer();
        exit;
    }
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>❌ Error verificando usuario</h3>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}

// Insertar datos de prueba para el administrador
echo "<h2>📊 Insertando Datos de Prueba</h2>";

try {
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
    
    echo "<p style='color: green;'>✅ <strong>Respuestas individuales insertadas</strong> (8 registros)</p>";
    
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
    
    echo "<p style='color: green;'>✅ <strong>Sesiones de estudio insertadas</strong> (3 registros)</p>";
    
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
    
    echo "<p style='color: green;'>✅ <strong>Logros insertados</strong> (3 registros)</p>";
    
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
    
    echo "<p style='color: green;'>✅ <strong>Recomendaciones insertadas</strong> (3 registros)</p>";
    
    echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>✅ Datos de prueba insertados correctamente</h3>";
    echo "<p>Se han insertado datos de prueba para el usuario: <strong>$telegramUserId</strong></p>";
    echo "<ul>";
    echo "<li>8 respuestas individuales</li>";
    echo "<li>3 sesiones de estudio</li>";
    echo "<li>3 logros</li>";
    echo "<li>3 recomendaciones</li>";
    echo "</ul>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>❌ Error insertando datos</h3>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "</div>";
}

// Enlaces útiles
echo "<h2>🔗 Próximos Pasos</h2>";
echo "<div style='background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
echo "<h3>✅ Datos de prueba insertados</h3>";
echo "<p>Ahora puedes probar el sistema de analytics:</p>";
echo "<ul>";
echo "<li><a href='my-advanced-analytics.php' style='color: #2196f3;'>📊 Ver Analytics Avanzado</a></li>";
echo "<li><a href='global-rankings.php' style='color: #2196f3;'>🏆 Ver Rankings Globales</a></li>";
echo "<li><a href='debug-analytics.php' style='color: #2196f3;'>🔍 Ejecutar Diagnóstico</a></li>";
echo "</ul>";
echo "</div>";

echo $OUTPUT->footer();
?> 