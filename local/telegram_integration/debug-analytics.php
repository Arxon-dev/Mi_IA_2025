<?php
require_once(__DIR__ . '/../../config.php');
require_login();

echo $OUTPUT->header();
?>

<style>
.debug-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.debug-section {
    background: white;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.debug-section h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
}

.success {
    color: #28a745;
    font-weight: bold;
}

.error {
    color: #dc3545;
    font-weight: bold;
}

.warning {
    color: #ffc107;
    font-weight: bold;
}

.info {
    color: #17a2b8;
    font-weight: bold;
}

.sql-test {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 15px;
    margin: 10px 0;
    font-family: monospace;
}

.sql-result {
    margin-top: 10px;
    padding: 10px;
    border-radius: 5px;
}

.sql-success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
}

.sql-error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
}
</style>

<div class="debug-container">
    <h1>🔍 Diagnóstico Detallado de Analytics</h1>
    
    <?php
    $userid = $USER->id;
    global $DB;
    
    echo "<div class='debug-section'>";
    echo "<h3>1. Configuración de Moodle</h3>";
    echo "<p><strong>Usuario actual:</strong> $userid (" . $USER->firstname . " " . $USER->lastname . ")</p>";
    echo "<p><strong>Base de datos:</strong> {$CFG->dbname}</p>";
    echo "<p><strong>Host:</strong> {$CFG->dbhost}</p>";
    echo "</div>";
    
    // Conexión a base de datos
    echo "<div class='debug-section'>";
    echo "<h3>2. Conexión a Base de Datos</h3>";
    
    try {
        // Usar PDO para un control de errores más claro
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "<p class='success'>✅ Conexión a base de datos exitosa</p>";
    } catch (PDOException $e) {
        echo "<p class='error'>❌ Error de conexión: " . htmlspecialchars($e->getMessage()) . "</p>";
        echo $OUTPUT->footer();
        exit;
    }
    echo "</div>";
    
    // Verificar tablas primero
    echo "<div class='debug-section'>";
    echo "<h3>3. Verificación de Tablas</h3>";
    
    $tables = ['moodleuserlink', 'telegramuser', 'mdl_local_telegram_user_topic_performance', 'mdl_local_telegram_recommendations', 'mdl_local_telegram_achievements', 'mdl_local_telegram_progress_timeline'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
            if ($stmt->rowCount() > 0) {
                echo "<p class='success'>✅ <strong>$table</strong> - Existe</p>";
                
                // Verificar estructura de moodleuserlink específicamente
                if ($table === 'moodleuserlink') {
                    $stmt = $pdo->query("DESCRIBE moodleuserlink");
                    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    echo "<p class='info'>Columnas: " . implode(', ', $columns) . "</p>";
                    
                    // Contar registros
                    $stmt = $pdo->query("SELECT COUNT(*) as total FROM moodleuserlink");
                    $count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                    echo "<p class='info'>Total registros: $count</p>";
                }
            } else {
                echo "<p class='error'>❌ <strong>$table</strong> - No existe</p>";
            }
        } catch (PDOException $e) {
            echo "<p class='error'>❌ <strong>$table</strong> - Error: " . htmlspecialchars($e->getMessage()) . "</p>";
        }
    }
    echo "</div>";
    
    // Verificar enlace de usuario con manejo de errores
    echo "<div class='debug-section'>";
    echo "<h3>4. Verificación de Enlace de Usuario</h3>";
    
    try {
        // Intentar con Moodle DB primero
        $link = $DB->get_record('moodleuserlink', ['moodleuserid' => $userid]);
        if ($link) {
            echo "<p class='success'>✅ Usuario vinculado (Moodle DB): " . $link->telegramuserid . "</p>";
            $telegramuserid = $link->telegramuserid;
        } else {
            echo "<p class='warning'>⚠️ Usuario no encontrado en Moodle DB</p>";
            
            // Intentar con PDO directamente
            echo "<p class='info'>Intentando consulta directa con PDO...</p>";
            $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleuserid = ?");
            $stmt->execute([$userid]);
            $link = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($link) {
                echo "<p class='success'>✅ Usuario vinculado (PDO): " . $link['telegramuserid'] . "</p>";
                $telegramuserid = $link['telegramuserid'];
            } else {
                echo "<p class='error'>❌ Usuario no vinculado</p>";
                echo "<li>Si el usuario no está vinculado: Ve a tu perfil de Moodle → Preferencias → Integración Telegram → Generar código y usa <code>/codigo_moodle</code> en Telegram</li>";
                echo "<p><strong>ID de Moodle:</strong> $userid</p>";
                
                // Mostrar todos los enlaces disponibles
                echo "<p class='info'>Enlaces disponibles en la tabla:</p>";
                $stmt = $pdo->query("SELECT * FROM moodleuserlink LIMIT 5");
                $links = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($links as $l) {
                    echo "<p>- Moodle ID: " . $l['moodleuserid'] . " → Telegram ID: " . $l['telegramuserid'] . "</p>";
                }
                
                echo $OUTPUT->footer();
                exit;
            }
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error verificando enlace: " . htmlspecialchars($e->getMessage()) . "</p>";
        
        // Intentar con PDO como fallback
        try {
            echo "<p class='info'>Intentando con PDO como fallback...</p>";
            $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleuserid = ?");
            $stmt->execute([$userid]);
            $link = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($link) {
                echo "<p class='success'>✅ Usuario vinculado (PDO fallback): " . $link['telegramuserid'] . "</p>";
                $telegramuserid = $link['telegramuserid'];
            } else {
                echo "<p class='error'>❌ Usuario no vinculado</p>";
                echo $OUTPUT->footer();
                exit;
            }
        } catch (PDOException $e2) {
            echo "<p class='error'>❌ Error con PDO también: " . htmlspecialchars($e2->getMessage()) . "</p>";
            echo $OUTPUT->footer();
            exit;
        }
    }
    echo "</div>";
    
    // Función para probar consultas
    function testQuery($pdo, $sql, $params = [], $description = "") {
        echo "<div class='sql-test'>";
        echo "<strong>$description</strong><br>";
        echo "<code>$sql</code><br>";
        
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<div class='sql-result sql-success'>";
            echo "✅ Consulta exitosa<br>";
            echo "Registros encontrados: " . count($result);
            if (count($result) > 0) {
                echo "<br>Primer registro: " . json_encode(array_slice($result[0], 0, 3));
            }
            echo "</div>";
            
            return $result;
        } catch (PDOException $e) {
            echo "<div class='sql-result sql-error'>";
            echo "❌ Error: " . htmlspecialchars($e->getMessage());
            echo "</div>";
            return null;
        }
        echo "</div>";
    }
    
    // Probar consultas específicas
    echo "<div class='debug-section'>";
    echo "<h3>5. Prueba de Consultas Específicas</h3>";
    
    // 1. Datos del usuario
    $userInfo = testQuery(
        $pdo, 
        "SELECT * FROM telegramuser WHERE telegramuserid = ?", 
        [$telegramuserid],
        "Datos del usuario de Telegram"
    );
    
    // 2. Rendimiento por temas
    $topics = testQuery(
        $pdo,
        "SELECT * FROM mdl_local_telegram_user_topic_performance WHERE telegramuserid = ? ORDER BY accuracy DESC",
        [$telegramuserid],
        "Rendimiento por temas"
    );
    
    // 3. Recomendaciones
    $recommendations = testQuery(
        $pdo,
        "SELECT * FROM mdl_local_telegram_recommendations WHERE telegramuserid = ? AND isactive = 1 ORDER BY priority ASC",
        [$telegramuserid],
        "Recomendaciones activas"
    );
    
    // 4. Logros
    $achievements = testQuery(
        $pdo,
        "SELECT * FROM mdl_local_telegram_achievements WHERE telegramuserid = ? ORDER BY earnedat DESC LIMIT 10",
        [$telegramuserid],
        "Logros del usuario"
    );
    
    // 5. Progreso temporal
    $timeline = testQuery(
        $pdo,
        "SELECT * FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY) ORDER BY date ASC",
        [$telegramuserid],
        "Progreso temporal (últimas 4 semanas)"
    );
    
    // 6. Rankings globales
    $topUsers = testQuery(
        $pdo,
        "SELECT firstname, totalpoints, level, accuracy FROM telegramuser WHERE totalpoints > 0 ORDER BY totalpoints DESC LIMIT 10",
        [],
        "Top 10 usuarios por puntos"
    );
    
    // 7. Ranking del usuario
    $userRank = testQuery(
        $pdo,
        "SELECT COUNT(*) + 1 as rank FROM telegramuser WHERE totalpoints > (SELECT totalpoints FROM telegramuser WHERE telegramuserid = ?)",
        [$telegramuserid],
        "Ranking del usuario"
    );
    
    // 8. Estadísticas globales
    $globalStats = testQuery(
        $pdo,
        "SELECT COUNT(*) as total_users, AVG(totalpoints) as avg_points, AVG(accuracy) as avg_accuracy, MAX(totalpoints) as max_points FROM telegramuser WHERE totalpoints > 0",
        [],
        "Estadísticas globales"
    );
    
    echo "</div>";
    
    // Resumen de problemas
    echo "<div class='debug-section'>";
    echo "<h3>6. Resumen de Problemas</h3>";
    
    $problems = [];
    if (!$userInfo) $problems[] = "No se encontraron datos del usuario de Telegram";
    if (!$topics) $problems[] = "No hay datos de rendimiento por temas";
    if (!$recommendations) $problems[] = "No hay recomendaciones activas";
    if (!$achievements) $problems[] = "No hay logros registrados";
    if (!$timeline) $problems[] = "No hay datos de progreso temporal";
    if (!$topUsers) $problems[] = "No hay datos de ranking global";
    if (!$userRank) $problems[] = "No se pudo calcular el ranking del usuario";
    if (!$globalStats) $problems[] = "No se pudieron obtener estadísticas globales";
    
    if (empty($problems)) {
        echo "<p class='success'>✅ Todas las consultas funcionan correctamente</p>";
    } else {
        echo "<p class='warning'>⚠️ Problemas detectados:</p>";
        echo "<ul>";
        foreach ($problems as $problem) {
            echo "<li class='error'>$problem</li>";
        }
        echo "</ul>";
    }
    echo "</div>";
    
    // Recomendaciones
    echo "<div class='debug-section'>";
    echo "<h3>7. Recomendaciones</h3>";
    echo "<ul>";
    echo "<li>Si faltan datos de prueba: <a href='test-analytics-with-correct-user.php'>Ejecutar inserción de datos de prueba</a></li>";
    echo "<li>Si hay errores de permisos: Verificar configuración de Moodle</li>";
    echo "<li>Si el usuario no está vinculado: Usar comando <code>/vincular</code> en Telegram</li>";
    echo "<li>Si faltan tablas: Ejecutar <a href='setup-advanced-analytics.php'>setup-advanced-analytics.php</a></li>";
    echo "</ul>";
    echo "</div>";
    
    // Enlaces útiles
    echo "<div class='debug-section'>";
    echo "<h3>8. Enlaces Útiles</h3>";
    echo "<p><a href='my-advanced-analytics.php'>📊 Mi Analytics Avanzado</a></p>";
    echo "<p><a href='global-rankings.php'>🏆 Rankings Globales</a></p>";
    echo "<p><a href='test-analytics-with-correct-user.php'>🧪 Insertar Datos de Prueba</a></p>";
    echo "<p><a href='setup-advanced-analytics.php'>⚙️ Configuración de Analytics</a></p>";
    echo "</div>";
    ?>
</div>

<?php
echo $OUTPUT->footer();
?>