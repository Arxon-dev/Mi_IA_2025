<?php
require_once(__DIR__ . '/../../config.php');
require_login();

// --- INICIO: Inicialización de la página de Moodle ---
$url = new moodle_url('/local/telegram_integration/my-advanced-analytics.php');
$context = context_system::instance();
$PAGE->set_url($url);
$PAGE->set_context($context);
$PAGE->set_title('Análisis Detallado de Rendimiento - OpoMelilla');
// --- FIN: Inicialización de la página de Moodle ---

$userid = $USER->id;

// Obtener TelegramUserId vinculado - USAR TABLA CORRECTA con manejo de errores
global $DB;
$telegramuserid = null;

try {
    // Intentar con Moodle DB primero
    $link = $DB->get_record('moodleuserlink', ['moodleuserid' => $userid]);
    if ($link) {
        $telegramuserid = $link->telegramuserid;
    }
} catch (Exception $e) {
    // Si falla Moodle DB, intentar con PDO
    try {
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleuserid = ?");
        $stmt->execute([$userid]);
        $link = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($link) {
            $telegramuserid = $link['telegramuserid'];
        }
    } catch (PDOException $e2) {
        // Si ambos fallan, mostrar error
        echo $OUTPUT->header();
        echo "<div style='text-align: center; padding: 40px;'>";
        echo "<h2>❌ Error de Base de Datos</h2>";
        echo "<p>No se pudo acceder a la tabla de enlaces de usuarios.</p>";
        echo "<p><strong>Error:</strong> " . htmlspecialchars($e2->getMessage()) . "</p>";
        echo "</div>";
        echo $OUTPUT->footer();
        exit;
    }
}

if (!$telegramuserid) {
    echo $OUTPUT->header();
    echo "<div style='text-align: center; padding: 40px;'>";
    echo "<h2>🔗 Vincula tu cuenta de Telegram</h2>";
    echo "<p>Para ver tu análisis detallado de rendimiento, necesitas vincular tu cuenta de Telegram con Moodle.</p>";
    echo "<div style='background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;'>";
    echo "<h4>📋 Pasos para vincular tu cuenta:</h4>";
    echo "<ol style='margin: 10px 0;'>";
    echo "<li><strong>Genera tu código:</strong> Ve a <a href='https://campus.opomelilla.com/local/telegram_integration/verify.php' target='_blank' class='btn btn-primary' style='margin: 0 5px;'>🔗 Página de Vinculación</a></li>";
    echo "<li><strong>Accede a Telegram:</strong> Puedes usar <a href='https://web.telegram.org/a/' target='_blank' class='btn btn-secondary' style='margin: 0 5px;'>🌐 Telegram Web</a> o buscar <code>@OpoMelillaBot</code> en tu app móvil</li>";
    echo "<li><strong>Busca el bot:</strong> En Telegram, busca <code>@OpoMelillaBot</code> o escanea el código QR disponible en la página de vinculación</li>";
    echo "<li><strong>Envía el código:</strong> Usa el comando <code>/codigo_moodle TU_CODIGO_AQUI</code> en el bot</li>";
    echo "</ol>";
    echo "</div>";
    echo "<p><strong>Tu ID de Moodle:</strong> $userid</p>";
    echo "<p><a href='https://campus.opomelilla.com/local/telegram_integration/verify.php' class='btn btn-primary'>🔗 Ir a Vinculación</a></p>";
    echo "<p><a href='https://web.telegram.org/a/' target='_blank' class='btn btn-secondary'>🌐 Abrir Telegram Web</a></p>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}

// Conexión directa a la base de datos con manejo de errores
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo $OUTPUT->header();
    echo "<div style='text-align: center; padding: 40px;'>";
    echo "<h2>❌ Error de Conexión</h2>";
    echo "<p>No se pudo conectar a la base de datos.</p>";
    echo "<p><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}

// Función para ejecutar consultas con manejo de errores
function safeQuery($pdo, $sql, $params = []) {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error en consulta SQL: " . $e->getMessage() . " - SQL: " . $sql);
        return [];
    }
}

function safeQuerySingle($pdo, $sql, $params = []) {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error en consulta SQL: " . $e->getMessage() . " - SQL: " . $sql);
        return null;
    }
}

// Función para verificar si hay datos recientes en el progreso temporal
function checkRecentTimelineData($pdo, $telegramuserid) {
    try {
        // Verificar si hay datos de HOY en la tabla de performance
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as performance_count 
            FROM mdl_local_telegram_user_topic_performance 
            WHERE telegramuserid = ? AND DATE(FROM_UNIXTIME(lastactivity)) = CURDATE()
        ");
        $stmt->execute([$telegramuserid]);
        $performance_result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verificar si hay datos de HOY en el timeline
        $stmt2 = $pdo->prepare("
            SELECT 
                COUNT(*) as timeline_count,
                SUM(questions_answered) as timeline_questions
            FROM mdl_local_telegram_progress_timeline 
            WHERE telegramuserid = ? AND date = CURDATE()
        ");
        $stmt2->execute([$telegramuserid]);
        $timeline_result = $stmt2->fetch(PDO::FETCH_ASSOC);
        
        $has_performance_today = ($performance_result['performance_count'] ?? 0) > 0;
        $has_timeline_today = ($timeline_result['timeline_count'] ?? 0) > 0;
        $timeline_questions = $timeline_result['timeline_questions'] ?? 0;
        
        // Si hay datos de performance de hoy pero no en timeline, o si timeline tiene 0 preguntas
        if ($has_performance_today && (!$has_timeline_today || $timeline_questions == 0)) {
            error_log("TIMELINE: Datos de performance detectados pero timeline desactualizado para usuario {$telegramuserid}");
            return false; // Forzar regeneración
        }
        
        return $has_timeline_today && $timeline_questions > 0;
    } catch (PDOException $e) {
        error_log("Error verificando datos recientes: " . $e->getMessage());
        return false; // En caso de error, forzar regeneración
    }
}

// Función para generar datos de progreso temporal
function generateTimelineData($pdo, $telegramuserid) {
    try {
        // Borrar progreso temporal previo de los últimos 28 días para evitar duplicados
        $stmt = $pdo->prepare("DELETE FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)");
        $stmt->execute([$telegramuserid]);
        
        // Generar datos para los últimos 28 días
        $hoy = new DateTime();
        for ($i = 27; $i >= 0; $i--) {
            $fecha = clone $hoy;
            $fecha->sub(new DateInterval("P{$i}D"));
            $fecha_str = $fecha->format('Y-m-d');
            
            // Obtener datos de performance del usuario para esa fecha
            $stmt2 = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(totalquestions), 0) as total_questions,
                    COALESCE(SUM(correctanswers), 0) as correct_answers,
                    COALESCE(SUM(incorrectanswers), 0) as incorrect_answers,
                    COALESCE(AVG(accuracy), 0) as avg_accuracy
                FROM mdl_local_telegram_user_topic_performance 
                WHERE telegramuserid = ? AND DATE(FROM_UNIXTIME(lastactivity)) = ?
            ");
            $stmt2->execute([$telegramuserid, $fecha_str]);
            $data = $stmt2->fetch(PDO::FETCH_ASSOC);
            
            $total_questions = $data['total_questions'] ?? 0;
            $correct_answers = $data['correct_answers'] ?? 0;
            $incorrect_answers = $data['incorrect_answers'] ?? 0;
            $accuracy = $data['avg_accuracy'] ?? 0;
            
            // Calcular puntos (ejemplo: 2 puntos por respuesta correcta, -1 por incorrecta)
            $points_earned = $correct_answers * 2;
            $points_lost = $incorrect_answers * 1;
            
            // Insertar en la tabla de progreso temporal
            $stmt3 = $pdo->prepare("
                INSERT INTO mdl_local_telegram_progress_timeline 
                (telegramuserid, date, questions_answered, correct_answers, incorrect_answers, points_earned, points_lost, accuracy, study_time, createdat) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt3->execute([
                $telegramuserid,
                $fecha_str,
                $total_questions,
                $correct_answers,
                $incorrect_answers,
                $points_earned,
                $points_lost,
                $accuracy,
                $total_questions * 2 // Tiempo estimado en minutos (2 min por pregunta)
            ]);
        }
        
        error_log("Progreso temporal generado exitosamente para usuario {$telegramuserid}");
        return true;
    } catch (PDOException $e) {
        error_log("Error generando progreso temporal: " . $e->getMessage());
        return false;
    }
}

// Obtener datos del usuario
$userInfo = safeQuerySingle($pdo, "SELECT * FROM telegramuser WHERE telegramuserid = ?", [$telegramuserid]);

// Rendimiento por temas
$topics = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_user_topic_performance WHERE telegramuserid = ? ORDER BY accuracy DESC", [$telegramuserid]);

// Recomendaciones
$recommendations = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_recommendations WHERE telegramuserid = ? AND isactive = 1 ORDER BY priority ASC", [$telegramuserid]);

// Logros
$achievements = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_achievements WHERE telegramuserid = ? ORDER BY earnedat DESC LIMIT 10", [$telegramuserid]);

// Progreso temporal (últimas 4 semanas)
$timeline = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY) ORDER BY date ASC", [$telegramuserid]);

// Si no hay datos recientes de progreso temporal, generarlos automáticamente
if (empty($timeline) || !checkRecentTimelineData($pdo, $telegramuserid)) {
    generateTimelineData($pdo, $telegramuserid);
    // Volver a obtener los datos después de generarlos
    $timeline = safeQuery($pdo, "SELECT * FROM mdl_local_telegram_progress_timeline WHERE telegramuserid = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY) ORDER BY date ASC", [$telegramuserid]);
}

// Rankings globales
$topUsers = safeQuery($pdo, "SELECT firstname, totalpoints, level, accuracy FROM telegramuser WHERE totalpoints > 0 ORDER BY totalpoints DESC LIMIT 10");

// Calcular ranking del usuario
$userRank = 1;
if ($userInfo) {
    $rankResult = safeQuerySingle($pdo, "SELECT COUNT(*) + 1 as rank FROM telegramuser WHERE totalpoints > (SELECT totalpoints FROM telegramuser WHERE telegramuserid = ?)", [$telegramuserid]);
    if ($rankResult) {
        $userRank = $rankResult['rank'];
    }
}

// Estadísticas globales
$globalStats = safeQuerySingle($pdo, "SELECT 
    COUNT(*) as total_users,
    AVG(totalpoints) as avg_points,
    AVG(accuracy) as avg_accuracy,
    MAX(totalpoints) as max_points
    FROM telegramuser WHERE totalpoints > 0");

// Valores por defecto si no hay datos
if (!$globalStats) {
    $globalStats = [
        'total_users' => 0,
        'avg_points' => 0,
        'avg_accuracy' => 0,
        'max_points' => 0
    ];
}

echo $OUTPUT->header();
?>

<style>
.analytics-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stat-card h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    opacity: 0.9;
}

.stat-card .value {
    font-size: 2em;
    font-weight: bold;
    margin: 0;
}

.chart-container {
    background: white;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    clear: both;
    overflow: visible;
    min-height: 650px;
    height: auto;
}

.chart-container h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
}

.chart-wrapper {
    position: relative;
    width: 100%;
    height: 600px;
    min-height: 600px;
    margin: 20px 0;
    overflow: visible;
    padding: 20px;
    box-sizing: border-box;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-wrapper canvas {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
    display: block;
}

.ranking-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
}

.ranking-table th,
.ranking-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.ranking-table th {
    background: #f8f9fa;
    font-weight: bold;
}

.ranking-table tr:hover {
    background: #f5f5f5;
}

.user-rank {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #333;
    padding: 15px;
    border-radius: 10px;
    margin: 20px 0;
    text-align: center;
    font-weight: bold;
}

.recommendations {
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
    padding: 15px;
    margin: 30px 0;
    border-radius: 5px;
    clear: both;
    width: 100%;
    box-sizing: border-box;
}

.recommendations h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #1976d2;
}

.recommendations ul {
    margin: 0;
    padding-left: 20px;
}

.recommendations li {
    margin-bottom: 8px;
    line-height: 1.5;
}

.achievements {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.achievement-card {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
}

.achievement-card h4 {
    margin: 0 0 10px 0;
    color: #856404;
}

.achievement-card p {
    margin: 0;
    font-size: 0.9em;
    color: #856404;
}

.tabs {
    display: flex;
    border-bottom: 2px solid #eee;
    margin: 20px 0;
}

.tab {
    padding: 10px 20px;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 16px;
}

.tab.active {
    border-bottom: 3px solid #667eea;
    color: #667eea;
    font-weight: bold;
}

.tab-content {
    display: none;
    min-height: 700px;
    overflow: visible;
}

.tab-content.active {
    display: block;
    min-height: 700px;
    overflow: visible;
}

.error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 15px;
    border-radius: 5px;
    margin: 20px 0;
    border: 1px solid #f5c6cb;
}

.no-data {
    text-align: center;
    padding: 40px;
    color: #6c757d;
    font-style: italic;
}

.btn {
    display: inline-block;
    padding: 10px 20px;
    background: #667eea;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    margin: 10px 5px;
}

.btn-primary {
    background: #007bff;
}

.btn:hover {
    opacity: 0.8;
}
</style>

<div class="analytics-container">
    <h1>📊 Análisis Detallado de Rendimiento</h1>
    <p style="text-align: center; color: #6c757d; margin-bottom: 30px;">Plataforma OpoMelilla + Bot de Telegram</p>
    
    <?php if ($userInfo): ?>
    <!-- Estadísticas principales -->
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Puntos Totales</h3>
            <div class="value"><?= number_format($userInfo['totalpoints'] ?? 0) ?></div>
        </div>
        <div class="stat-card">
            <h3>Nivel Actual</h3>
            <div class="value"><?= $userInfo['level'] ?? 1 ?></div>
        </div>
        <div class="stat-card">
            <h3>Precisión Global</h3>
            <div class="value"><?= number_format($userInfo['accuracy'] ?? 0, 1) ?>%</div>
        </div>
        <div class="stat-card">
            <h3>Mejor Racha</h3>
            <div class="value"><?= $userInfo['beststreak'] ?? 0 ?></div>
        </div>
    </div>

    <!-- Ranking del usuario -->
    <div class="user-rank">
        🏆 Tu posición en el ranking: #<?= $userRank ?> de <?= $globalStats['total_users'] ?> usuarios
    </div>

    <!-- Pestañas -->
    <div class="tabs">
        <button class="tab active" onclick="showTab('overview')">📈 Resumen</button>
        <button class="tab" onclick="showTab('topics')">📚 Temas</button>
        <button class="tab" onclick="showTab('ranking')">🏆 Ranking</button>
        <button class="tab" onclick="showTab('achievements')">🎖️ Logros</button>
    </div>

    <!-- Pestaña: Resumen -->
    <div id="overview" class="tab-content active">
        <?php if (!empty($timeline)): ?>
        <div class="chart-container">
            <h3>📈 Progreso Temporal (Últimas 4 Semanas)</h3>
            <div class="chart-wrapper">
                <canvas id="timelineChart"></canvas>
            </div>
        </div>
        <?php else: ?>
        <div class="no-data">
            <p>📊 No hay datos de progreso temporal disponibles.</p>
        </div>
        <?php endif; ?>

        <?php if ($recommendations): ?>
        <div class="recommendations">
            <h3>💡 Recomendaciones Personalizadas</h3>
            <ul>
                <?php foreach ($recommendations as $rec): ?>
                <li><?= htmlspecialchars($rec['reason']) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>
    </div>

    <!-- Pestaña: Temas -->
    <div id="topics" class="tab-content">
        <?php if (!empty($topics)): ?>
        <div class="chart-container">
            <h3>📚 Rendimiento por Temas</h3>
            <div class="chart-wrapper">
                <canvas id="topicsChart"></canvas>
            </div>
        </div>

        <table class="ranking-table">
            <thead>
                <tr>
                    <th>Tema</th>
                    <th>Preguntas</th>
                    <th>Correctas</th>
                    <th>Incorrectas</th>
                    <th>Precisión</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($topics as $topic): ?>
                <tr>
                    <td><?= htmlspecialchars($topic['sectionname']) ?></td>
                    <td><?= $topic['totalquestions'] ?></td>
                    <td><?= $topic['correctanswers'] ?></td>
                    <td><?= $topic['incorrectanswers'] ?></td>
                    <td>
                        <span style="color: <?= $topic['accuracy'] >= 80 ? '#28a745' : ($topic['accuracy'] >= 60 ? '#ffc107' : '#dc3545') ?>">
                            <?= number_format($topic['accuracy'], 1) ?>%
                        </span>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php else: ?>
        <div class="no-data">
            <p>📚 No hay datos de rendimiento por temas disponibles.</p>
        </div>
        <?php endif; ?>
    </div>

    <!-- Pestaña: Ranking -->
    <div id="ranking" class="tab-content">
        <?php if (!empty($topUsers)): ?>
        <div class="chart-container">
            <h3>🏆 Top 10 Usuarios por Puntos</h3>
            <div class="chart-wrapper">
                <canvas id="rankingChart"></canvas>
            </div>
        </div>

        <table class="ranking-table">
            <thead>
                <tr>
                    <th>Posición</th>
                    <th>Usuario</th>
                    <th>Puntos</th>
                    <th>Nivel</th>
                    <th>Precisión</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($topUsers as $index => $user): ?>
                <tr <?= $user['firstname'] === $userInfo['firstname'] ? 'style="background: #fff3cd; font-weight: bold;"' : '' ?>>
                    <td>#<?= $index + 1 ?></td>
                    <td><?= htmlspecialchars($user['firstname']) ?></td>
                    <td><?= number_format($user['totalpoints']) ?></td>
                    <td><?= $user['level'] ?></td>
                    <td><?= number_format($user['accuracy'], 1) ?>%</td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php else: ?>
        <div class="no-data">
            <p>🏆 No hay datos de ranking disponibles.</p>
        </div>
        <?php endif; ?>
    </div>

    <!-- Pestaña: Logros -->
    <div id="achievements" class="tab-content">
        <?php if ($achievements): ?>
        <div class="achievements">
            <?php foreach ($achievements as $achievement): ?>
            <div class="achievement-card">
                <h4>🏆 <?= htmlspecialchars($achievement['achievementname']) ?></h4>
                <p><?= htmlspecialchars($achievement['achievementdescription']) ?></p>
                <small>Obtido: <?= date('d/m/Y', strtotime($achievement['earnedat'])) ?></small>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
        <p>🎯 ¡Sigue practicando para obtener logros!</p>
        <?php endif; ?>
    </div>

    <?php else: ?>
    <div style="text-align: center; padding: 40px;">
        <h2>❌ Usuario no encontrado</h2>
        <p>No se encontraron datos para tu cuenta de Telegram.</p>
        <p><strong>ID de Telegram:</strong> <?= $telegramuserid ?></p>
        <p><a href="debug-analytics.php" class="btn btn-primary">🔍 Ejecutar Diagnóstico</a></p>
    </div>
    <?php endif; ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
// Función para cambiar pestañas
function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Datos para gráficos
const timelineData = <?= json_encode($timeline ?? []) ?>;
const topicsData = <?= json_encode($topics ?? []) ?>;
const rankingData = <?= json_encode($topUsers ?? []) ?>;

// Gráfico de progreso temporal
if (timelineData.length > 0) {
    const ctx = document.getElementById('timelineChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: timelineData.map(d => new Date(d.date).toLocaleDateString('es-ES', {day: '2-digit', month: 'short'})),
                datasets: [{
                    label: 'Precisión (%)',
                    data: timelineData.map(d => d.accuracy),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Preguntas Respondidas',
                    data: timelineData.map(d => d.questions_answered),
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Gráfico de temas
if (topicsData.length > 0) {
    const ctx = document.getElementById('topicsChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: topicsData.map(d => d.sectionname),
                datasets: [{
                    label: 'Precisión (%)',
                    data: topicsData.map(d => d.accuracy),
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#f5576c',
                        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Gráfico de ranking
if (rankingData.length > 0) {
    const ctx = document.getElementById('rankingChart');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: rankingData.map(d => d.firstname),
                datasets: [{
                    label: 'Puntos',
                    data: rankingData.map(d => d.totalpoints),
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}
</script>

<?php
echo $OUTPUT->footer();
?>