<?php
require_once(__DIR__ . '/../../config.php');
require_login();

echo $OUTPUT->header();
?>

<style>
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.section {
    background: white;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section h3 {
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

.response-analysis {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    margin: 10px 0;
}

.response-analysis h4 {
    margin: 0 0 10px 0;
    color: #333;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 15px 0;
}

.stat-card {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 10px;
    text-align: center;
}

.stat-value {
    font-size: 1.5em;
    font-weight: bold;
    color: #667eea;
}

.stat-label {
    font-size: 0.9em;
    color: #6c757d;
    margin-top: 5px;
}

.btn {
    display: inline-block;
    padding: 10px 20px;
    background: #667eea;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    margin: 10px 5px;
    border: none;
    cursor: pointer;
}

.btn:hover {
    opacity: 0.8;
}

.btn-primary {
    background: #007bff;
}

.btn-success {
    background: #28a745;
}

.btn-warning {
    background: #ffc107;
    color: #333;
}

.progress-container {
    margin: 15px 0;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    margin: 5px 0;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s ease;
}
</style>

<div class="container">
    <h1>🔍 Analizador de Respuestas Reales</h1>
    
    <?php
    $userid = $USER->id;
    global $DB;
    
    // Conexión a base de datos
    try {
        // Conexión PDO para más control
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
    
    // Obtener usuario vinculado
    $telegramuserid = null;
    try {
        $link = $DB->get_record('moodleuserlink', ['moodleuserid' => $userid]);
        if ($link) {
            $telegramuserid = $link->telegramuserid;
        } else {
            $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleuserid = ?");
            $stmt->execute([$userid]);
            $link = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($link) {
                $telegramuserid = $link['telegramuserid'];
            }
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error obteniendo usuario vinculado: " . htmlspecialchars($e->getMessage()) . "</p>";
        echo $OUTPUT->footer();
        exit;
    }
    
    if (!$telegramuserid) {
        echo "<div class='section'>";
        echo "<h3>❌ Usuario no vinculado</h3>";
        echo "<p>Necesitas vincular tu cuenta de Telegram para analizar respuestas.</p>";
        echo "</div>";
        echo $OUTPUT->footer();
        exit;
    }
    
    echo "<div class='section'>";
    echo "<h3>👤 Usuario Analizado</h3>";
    echo "<p><strong>ID de Moodle:</strong> $userid</p>";
    echo "<p><strong>ID de Telegram:</strong> $telegramuserid</p>";
    echo "</div>";
    
    // Analizar respuestas reales del usuario
    echo "<div class='section'>";
    echo "<h3>📊 Análisis de Respuestas Reales</h3>";
    
    // 1. Verificar si existen respuestas del usuario
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM mdl_local_telegram_user_responses WHERE telegramuserid = ?");
        $stmt->execute([$telegramuserid]);
        $responseCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        echo "<div class='response-analysis'>";
        echo "<h4>📝 Respuestas Totales</h4>";
        echo "<div class='stats-grid'>";
        echo "<div class='stat-card'>";
        echo "<div class='stat-value'>$responseCount</div>";
        echo "<div class='stat-label'>Respuestas Registradas</div>";
        echo "</div>";
        echo "</div>";
        
        if ($responseCount > 0) {
            // Analizar respuestas por tema
            $stmt = $pdo->prepare("
                SELECT 
                    questiontable,
                    COUNT(*) as total_responses,
                    SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) as correct_answers,
                    SUM(CASE WHEN iscorrect = 0 THEN 1 ELSE 0 END) as incorrect_answers,
                    ROUND((SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as accuracy
                FROM mdl_local_telegram_user_responses 
                WHERE telegramuserid = ?
                GROUP BY questiontable
                ORDER BY accuracy DESC
            ");
            $stmt->execute([$telegramuserid]);
            $topicStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<h4>🎯 Rendimiento por Temas (Basado en Respuestas Reales)</h4>";
            
            if (count($topicStats) > 0) {
                foreach ($topicStats as $stat) {
                    $topicName = getTopicDisplayName($stat['questiontable']);
                    $accuracy = $stat['accuracy'];
                    $total = $stat['total_responses'];
                    $correct = $stat['correct_answers'];
                    $incorrect = $stat['incorrect_answers'];
                    
                    echo "<div class='response-analysis'>";
                    echo "<h5>📚 $topicName</h5>";
                    echo "<div class='stats-grid'>";
                    echo "<div class='stat-card'>";
                    echo "<div class='stat-value'>$total</div>";
                    echo "<div class='stat-label'>Total Respuestas</div>";
                    echo "</div>";
                    echo "<div class='stat-card'>";
                    echo "<div class='stat-value' style='color: #28a745;'>$correct</div>";
                    echo "<div class='stat-label'>Correctas</div>";
                    echo "</div>";
                    echo "<div class='stat-card'>";
                    echo "<div class='stat-value' style='color: #dc3545;'>$incorrect</div>";
                    echo "<div class='stat-label'>Incorrectas</div>";
                    echo "</div>";
                    echo "<div class='stat-card'>";
                    echo "<div class='stat-value' style='color: #667eea;'>$accuracy%</div>";
                    echo "<div class='stat-label'>Precisión</div>";
                    echo "</div>";
                    echo "</div>";
                    
                    // Barra de progreso
                    echo "<div class='progress-container'>";
                    echo "<div class='progress-bar'>";
                    echo "<div class='progress-fill' style='width: $accuracy%;'></div>";
                    echo "</div>";
                    echo "</div>";
                    
                    // Insertar en tabla de rendimiento por temas
                    insertTopicPerformanceFromRealData($pdo, $telegramuserid, $topicName, $stat);
                    
                    echo "</div>";
                }
            } else {
                echo "<p class='warning'>⚠️ No se encontraron respuestas agrupadas por temas</p>";
            }
        } else {
            echo "<p class='warning'>⚠️ No hay respuestas registradas para este usuario</p>";
            echo "<p>Las respuestas se registran automáticamente cuando usas el bot de Telegram.</p>";
        }
        
        echo "</div>";
        
    } catch (PDOException $e) {
        echo "<p class='error'>❌ Error analizando respuestas: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
    
    echo "</div>";
    
    // Función para obtener nombre legible del tema
    function getTopicDisplayName($tableName) {
        $topicNames = [
            'constitucion' => 'Constitución Española',
            'defensanacional' => 'Defensa Nacional',
            'rio' => 'Régimen Jurídico del Sector Público',
            'minsdef' => 'Ministerio de Defensa',
            'organizacionfas' => 'Organización de las FAS',
            'emad' => 'Estado Mayor de la Defensa',
            'et' => 'Ejército de Tierra',
            'armada' => 'Armada Española',
            'aire' => 'Ejército del Aire',
            'carrera' => 'Carrera Militar',
            'tropa' => 'Tropa y Marinería',
            'rroo' => 'Reales Ordenanzas',
            'derechosydeberes' => 'Derechos y Deberes',
            'regimendisciplinario' => 'Régimen Disciplinario',
            'iniciativasquejas' => 'Iniciativas y Quejas',
            'igualdad' => 'Ley de Igualdad',
            'omi' => 'Observatorio Militar Igualdad',
            'pac' => 'Procedimiento Administrativo',
            'seguridadnacional' => 'Seguridad Nacional',
            'pdc' => 'Doctrina FAS',
            'onu' => 'ONU',
            'otan' => 'OTAN',
            'osce' => 'OSCE',
            'ue' => 'Unión Europea',
            'misionesinternacionales' => 'Misiones Internacionales'
        ];
        
        return $topicNames[$tableName] ?? $tableName;
    }
    
    // Función para insertar rendimiento por tema basado en datos reales
    function insertTopicPerformanceFromRealData($pdo, $telegramuserid, $topicName, $stats) {
        try {
            // Verificar si ya existe un registro
            $stmt = $pdo->prepare("SELECT id FROM mdl_local_telegram_user_topic_performance WHERE telegramuserid = ? AND sectionname = ?");
            $stmt->execute([$telegramuserid, $topicName]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                // Actualizar registro existente
                $stmt = $pdo->prepare("UPDATE mdl_local_telegram_user_topic_performance SET 
                    totalquestions = ?, correctanswers = ?, incorrectanswers = ?, accuracy = ?, lastactivity = NOW()
                    WHERE telegramuserid = ? AND sectionname = ?");
                $stmt->execute([
                    $stats['total_responses'],
                    $stats['correct_answers'],
                    $stats['incorrect_answers'],
                    $stats['accuracy'],
                    $telegramuserid,
                    $topicName
                ]);
                echo "<p class='success'>✅ Datos actualizados en analytics</p>";
            } else {
                // Insertar nuevo registro
                $stmt = $pdo->prepare("INSERT INTO mdl_local_telegram_user_topic_performance 
                    (telegramuserid, sectionname, totalquestions, correctanswers, incorrectanswers, accuracy, lastactivity, createdat) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
                $stmt->execute([
                    $telegramuserid,
                    $topicName,
                    $stats['total_responses'],
                    $stats['correct_answers'],
                    $stats['incorrect_answers'],
                    $stats['accuracy']
                ]);
                echo "<p class='success'>✅ Datos insertados en analytics</p>";
            }
        } catch (PDOException $e) {
            echo "<p class='error'>❌ Error guardando datos: " . htmlspecialchars($e->getMessage()) . "</p>";
        }
    }
    
    // Análisis adicional de patrones
    echo "<div class='section'>";
    echo "<h3>📈 Análisis de Patrones</h3>";
    
    try {
        // Últimas respuestas del usuario
        $stmt = $pdo->prepare("
            SELECT questiontable, iscorrect, createdat 
            FROM mdl_local_telegram_user_responses 
            WHERE telegramuserid = ? 
            ORDER BY createdat DESC 
            LIMIT 10
        ");
        $stmt->execute([$telegramuserid]);
        $recentResponses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($recentResponses) > 0) {
            echo "<h4>🕒 Últimas 10 Respuestas</h4>";
            echo "<div class='response-analysis'>";
            foreach ($recentResponses as $response) {
                $topicName = getTopicDisplayName($response['questiontable']);
                $status = $response['iscorrect'] ? '✅ Correcta' : '❌ Incorrecta';
                $date = date('d/m/Y H:i', strtotime($response['createdat']));
                
                echo "<p><strong>$topicName</strong> - $status ($date)</p>";
            }
            echo "</div>";
        }
        
        // Tendencia de mejora
        $stmt = $pdo->prepare("
            SELECT 
                DATE(createdat) as date,
                COUNT(*) as total_responses,
                SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) as correct_answers,
                ROUND((SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as daily_accuracy
            FROM mdl_local_telegram_user_responses 
            WHERE telegramuserid = ? 
            GROUP BY DATE(createdat)
            ORDER BY date DESC
            LIMIT 7
        ");
        $stmt->execute([$telegramuserid]);
        $dailyStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($dailyStats) > 1) {
            echo "<h4>📊 Tendencia Semanal</h4>";
            echo "<div class='response-analysis'>";
            foreach ($dailyStats as $day) {
                $date = date('d/m/Y', strtotime($day['date']));
                $accuracy = $day['daily_accuracy'];
                $total = $day['total_responses'];
                
                echo "<p><strong>$date:</strong> $accuracy% de precisión ($total respuestas)</p>";
            }
            echo "</div>";
        }
        
    } catch (PDOException $e) {
        echo "<p class='error'>❌ Error analizando patrones: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
    
    echo "</div>";
    
    // Enlaces de acción
    echo "<div class='section'>";
    echo "<h3>🔗 Próximos Pasos</h3>";
    echo "<p><a href='my-advanced-analytics.php' class='btn btn-primary'>📊 Ver Analytics Avanzado</a></p>";
    echo "<p><a href='generate-topic-performance.php' class='btn btn-success'>🔄 Generar Datos Simulados</a></p>";
    echo "<p><a href='debug-analytics.php' class='btn btn-warning'>🔍 Ejecutar Diagnóstico</a></p>";
    echo "</div>";
    ?>
</div>

<?php
echo $OUTPUT->footer();
?>