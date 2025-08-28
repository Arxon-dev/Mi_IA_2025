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

// Verificar si el usuario es administrador
if (!is_siteadmin()) {
    die('Acceso denegado. Solo administradores pueden acceder a esta página.');
}

echo "<h1>🔧 Configuración de Analytics Avanzado</h1>";

// Función para ejecutar SQL
function executeSQL($sql, $description) {
    global $CFG;
    
    try {
        // Conexión PDO para más control
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $result = $pdo->exec($sql);
        
        if ($result !== false) {
            echo "<p>✅ <strong>$description</strong> - Ejecutado correctamente</p>";
            return true;
        } else {
            echo "<p>❌ <strong>$description</strong> - Error en la ejecución</p>";
            return false;
        }
        
    } catch (PDOException $e) {
        echo "<p>❌ <strong>$description</strong> - Error: " . $e->getMessage() . "</p>";
        return false;
    }
}

// Procesar formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['setup_analytics'])) {
    echo "<h2>🚀 Configurando Sistema de Analytics...</h2>";
    
    $successCount = 0;
    $totalCount = 0;
    
    // 1. Tabla de rendimiento por temas
    $sql = "CREATE TABLE IF NOT EXISTS mdl_local_telegram_user_topic_performance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegramuserid VARCHAR(255) NOT NULL,
        sectionid INT NOT NULL,
        sectionname VARCHAR(255) NOT NULL,
        totalquestions INT DEFAULT 0,
        correctanswers INT DEFAULT 0,
        incorrectanswers INT DEFAULT 0,
        accuracy DECIMAL(5,2) DEFAULT 0.00,
        lastactivity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_section (telegramuserid, sectionid),
        INDEX idx_telegramuser (telegramuserid),
        INDEX idx_section (sectionid),
        INDEX idx_accuracy (accuracy)
    )";
    $totalCount++;
    if (executeSQL($sql, "Tabla de rendimiento por temas")) $successCount++;
    
    // 2. Tabla de respuestas individuales
    $sql = "CREATE TABLE IF NOT EXISTS mdl_local_telegram_user_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegramuserid VARCHAR(255) NOT NULL,
        questionid VARCHAR(255) NOT NULL,
        sectionid INT NOT NULL,
        useranswer TEXT,
        correctanswer TEXT,
        iscorrect BOOLEAN DEFAULT FALSE,
        responsetime INT DEFAULT 0,
        points_earned INT DEFAULT 0,
        points_lost INT DEFAULT 0,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_telegramuser (telegramuserid),
        INDEX idx_question (questionid),
        INDEX idx_section (sectionid),
        INDEX idx_iscorrect (iscorrect),
        INDEX idx_createdat (createdat)
    )";
    $totalCount++;
    if (executeSQL($sql, "Tabla de respuestas individuales")) $successCount++;
    
    // 3. Tabla de sesiones de estudio
    $sql = "CREATE TABLE IF NOT EXISTS mdl_local_telegram_study_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegramuserid VARCHAR(255) NOT NULL,
        sessiontype ENUM('normal', 'failed_questions', 'custom_topic', 'tournament') DEFAULT 'normal',
        questions_answered INT DEFAULT 0,
        correct_answers INT DEFAULT 0,
        incorrect_answers INT DEFAULT 0,
        total_points_earned INT DEFAULT 0,
        total_points_lost INT DEFAULT 0,
        session_duration INT DEFAULT 0,
        startedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        endedat TIMESTAMP NULL,
        INDEX idx_telegramuser (telegramuserid),
        INDEX idx_sessiontype (sessiontype),
        INDEX idx_startedat (startedat)
    )";
    $totalCount++;
    if (executeSQL($sql, "Tabla de sesiones de estudio")) $successCount++;
    
    // 4. Tabla de logros
    $sql = "CREATE TABLE IF NOT EXISTS mdl_local_telegram_achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegramuserid VARCHAR(255) NOT NULL,
        achievementtype ENUM('topic_master', 'streak_master', 'speed_demon', 'accuracy_king', 'persistence', 'first_perfect', 'comeback_king') NOT NULL,
        achievementname VARCHAR(255) NOT NULL,
        achievementdescription TEXT,
        criteria_met JSON,
        earnedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_telegramuser (telegramuserid),
        INDEX idx_achievementtype (achievementtype),
        INDEX idx_earnedat (earnedat)
    )";
    $totalCount++;
    if (executeSQL($sql, "Tabla de logros")) $successCount++;
    
    // 5. Tabla de recomendaciones
    $sql = "CREATE TABLE IF NOT EXISTS mdl_local_telegram_recommendations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegramuserid VARCHAR(255) NOT NULL,
        recommendationtype ENUM('practice_topic', 'review_failed', 'challenge_yourself', 'maintain_streak') NOT NULL,
        sectionid INT NULL,
        priority INT DEFAULT 1,
        reason TEXT,
        isactive BOOLEAN DEFAULT TRUE,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_telegramuser (telegramuserid),
        INDEX idx_recommendationtype (recommendationtype),
        INDEX idx_priority (priority),
        INDEX idx_isactive (isactive)
    )";
    $totalCount++;
    if (executeSQL($sql, "Tabla de recomendaciones")) $successCount++;
    
    // 6. Tabla de progreso temporal
    $sql = "CREATE TABLE IF NOT EXISTS mdl_local_telegram_progress_timeline (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegramuserid VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        questions_answered INT DEFAULT 0,
        correct_answers INT DEFAULT 0,
        incorrect_answers INT DEFAULT 0,
        points_earned INT DEFAULT 0,
        points_lost INT DEFAULT 0,
        accuracy DECIMAL(5,2) DEFAULT 0.00,
        study_time INT DEFAULT 0,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_date (telegramuserid, date),
        INDEX idx_telegramuser (telegramuserid),
        INDEX idx_date (date)
    )";
    $totalCount++;
    if (executeSQL($sql, "Tabla de progreso temporal")) $successCount++;
    
    // Resumen
    echo "<h3>📊 Resumen de Configuración</h3>";
    echo "<p><strong>Tablas creadas:</strong> $successCount de $totalCount</p>";
    
    if ($successCount === $totalCount) {
        echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<h4>✅ Configuración Completada Exitosamente</h4>";
        echo "<p>El sistema de analytics avanzado está listo para usar.</p>";
        echo "</div>";
        
        echo "<h3>🔗 Próximos Pasos</h3>";
        echo "<ul>";
        echo "<li><a href='advanced-analytics.php'>📊 Ir a Analytics Avanzado</a></li>";
        echo "<li><a href='../analytics.php'>📈 Ver Analytics Básico</a></li>";
        echo "<li><a href='fix-admin-linkage.php'>🔧 Verificar Vinculaciones</a></li>";
        echo "</ul>";
    } else {
        echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<h4>⚠️ Configuración Incompleta</h4>";
        echo "<p>Algunas tablas no se pudieron crear. Revisa los errores arriba.</p>";
        echo "</div>";
    }
    
} else {
    echo "<h2>⚙️ Configuración del Sistema de Analytics</h2>";
    echo "<p>Este script creará las siguientes tablas para analytics avanzado:</p>";
    
    echo "<ul>";
    echo "<li><strong>mdl_local_telegram_user_topic_performance</strong> - Rendimiento por temas</li>";
    echo "<li><strong>mdl_local_telegram_user_responses</strong> - Respuestas individuales detalladas</li>";
    echo "<li><strong>mdl_local_telegram_study_sessions</strong> - Sesiones de estudio</li>";
    echo "<li><strong>mdl_local_telegram_achievements</strong> - Sistema de logros</li>";
    echo "<li><strong>mdl_local_telegram_recommendations</strong> - Recomendaciones personalizadas</li>";
    echo "<li><strong>mdl_local_telegram_progress_timeline</strong> - Progreso temporal</li>";
    echo "</ul>";
    
    echo "<h3>🎯 Funcionalidades que se habilitarán:</h3>";
    echo "<ul>";
    echo "<li>📊 <strong>Análisis por temas</strong> - Ver qué temas dominan y cuáles necesitan refuerzo</li>";
    echo "<li>📈 <strong>Progreso temporal</strong> - Evolución del aprendizaje a lo largo del tiempo</li>";
    echo "<li>💡 <strong>Recomendaciones personalizadas</strong> - Sugerencias basadas en rendimiento</li>";
    echo "<li>🏆 <strong>Sistema de logros</strong> - Badges y reconocimientos</li>";
    echo "<li>⏱️ <strong>Análisis de tiempo</strong> - Velocidad de respuesta y patrones</li>";
    echo "<li>📋 <strong>Reportes detallados</strong> - Estadísticas avanzadas por usuario</li>";
    echo "</ul>";
    
    echo "<form method='post'>";
    echo "<input type='hidden' name='setup_analytics' value='1'>";
    echo "<button type='submit' style='padding: 15px 30px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;'>";
    echo "🚀 Configurar Sistema de Analytics Avanzado";
    echo "</button>";
    echo "</form>";
    
    echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h4>⚠️ Importante</h4>";
    echo "<p>Esta configuración creará nuevas tablas en la base de datos. Asegúrate de tener una copia de seguridad antes de continuar.</p>";
    echo "</div>";
}

echo "<h2>📚 Documentación</h2>";
echo "<p>Una vez configurado, podrás:</p>";
echo "<ul>";
echo "<li>Analizar el rendimiento de cada usuario por tema específico</li>";
echo "<li>Generar recomendaciones personalizadas basadas en debilidades</li>";
echo "<li>Crear reportes de progreso temporal</li>";
echo "<li>Implementar un sistema de gamificación avanzado</li>";
echo "<li>Identificar patrones de aprendizaje y áreas de mejora</li>";
echo "</ul>";
?> 