<?php
require_once(__DIR__ . '/../../config.php');
require_login();

// Conexión directa a la base de datos
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log("Error de conexión a la base de datos: " . $e->getMessage());
    die("Error de conexión a la base de datos. Por favor, inténtelo más tarde.");
}


// Obtener estadísticas globales
$globalStats = $pdo->query("SELECT 
    COUNT(*) as total_users,
    AVG(totalpoints) as avg_points,
    AVG(accuracy) as avg_accuracy,
    MAX(totalpoints) as max_points,
    SUM(totalpoints) as total_points
    FROM telegramuser WHERE totalpoints > 0")->fetch(PDO::FETCH_ASSOC);

// Top usuarios por puntos
$topByPoints = $pdo->query("SELECT firstname, totalpoints, level, accuracy, beststreak FROM telegramuser WHERE totalpoints > 0 ORDER BY totalpoints DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);

// Top usuarios por precisión
$topByAccuracy = $pdo->query("SELECT firstname, totalpoints, level, accuracy, beststreak FROM telegramuser WHERE accuracy > 0 AND totalpoints > 100 ORDER BY accuracy DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);

// Top usuarios por racha
$topByStreak = $pdo->query("SELECT firstname, totalpoints, level, accuracy, beststreak FROM telegramuser WHERE beststreak > 0 ORDER BY beststreak DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);

// Top temas más populares
$topTopics = $pdo->query("SELECT 
    sectionname,
    COUNT(*) as total_questions,
    AVG(accuracy) as avg_accuracy
    FROM mdl_local_telegram_user_topic_performance 
    WHERE totalquestions >= 5
    GROUP BY sectionid, sectionname
    ORDER BY total_questions DESC
    LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);

// Temas más difíciles
$difficultTopics = $pdo->query("SELECT 
    sectionname,
    COUNT(*) as total_questions,
    AVG(accuracy) as avg_accuracy
    FROM mdl_local_telegram_user_topic_performance 
    WHERE totalquestions >= 10
    GROUP BY sectionid, sectionname
    ORDER BY avg_accuracy ASC
    LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);

echo $OUTPUT->header();
?>

<style>
.rankings-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stat-box h3 {
    margin: 0 0 10px 0;
    font-size: 14px;
    opacity: 0.9;
}

.stat-box .value {
    font-size: 2em;
    font-weight: bold;
    margin: 0;
}

.ranking-section {
    background: white;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ranking-section h2 {
    margin-top: 0;
    color: #333;
    border-bottom: 2px solid #eee;
    padding-bottom: 10px;
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

.medal {
    font-size: 1.2em;
    margin-right: 10px;
}

.rank-1 { color: #ffd700; }
.rank-2 { color: #c0c0c0; }
.rank-3 { color: #cd7f32; }

.tabs {
    display: flex;
    border-bottom: 2px solid #eee;
    margin: 20px 0;
    flex-wrap: wrap;
}

.tab {
    padding: 10px 20px;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 16px;
    white-space: nowrap;
}

.tab.active {
    border-bottom: 3px solid #667eea;
    color: #667eea;
    font-weight: bold;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.chart-container {
    margin: 20px 0;
    height: 400px;
}
</style>

<div class="rankings-container">
    <h1>🏆 Rankings Globales de Telegram</h1>
    
    <!-- Estadísticas globales -->
    <div class="stats-overview">
        <div class="stat-box">
            <h3>Total Usuarios</h3>
            <div class="value"><?= number_format($globalStats['total_users']) ?></div>
        </div>
        <div class="stat-box">
            <h3>Puntos Promedio</h3>
            <div class="value"><?= number_format($globalStats['avg_points'], 0) ?></div>
        </div>
        <div class="stat-box">
            <h3>Precisión Promedio</h3>
            <div class="value"><?= number_format($globalStats['avg_accuracy'], 1) ?>%</div>
        </div>
        <div class="stat-box">
            <h3>Puntos Máximos</h3>
            <div class="value"><?= number_format($globalStats['max_points']) ?></div>
        </div>
    </div>

    <!-- Pestañas -->
    <div class="tabs">
        <button class="tab active" onclick="showTab('points')">🏆 Por Puntos</button>
        <button class="tab" onclick="showTab('accuracy')">🎯 Por Precisión</button>
        <button class="tab" onclick="showTab('streak')">🔥 Por Racha</button>
        <button class="tab" onclick="showTab('topics')">📚 Temas Populares</button>
        <button class="tab" onclick="showTab('difficult')">⚠️ Temas Difíciles</button>
    </div>

    <!-- Pestaña: Ranking por Puntos -->
    <div id="points" class="tab-content active">
        <div class="ranking-section">
            <h2>🏆 Top 20 por Puntos Totales</h2>
            <div class="chart-container">
                <canvas id="pointsChart"></canvas>
            </div>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Usuario</th>
                        <th>Puntos</th>
                        <th>Nivel</th>
                        <th>Precisión</th>
                        <th>Mejor Racha</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($topByPoints as $index => $user): ?>
                    <tr>
                        <td>
                            <?php if ($index < 3): ?>
                                <span class="medal rank-<?= $index + 1 ?>">
                                    <?= $index === 0 ? '🥇' : ($index === 1 ? '🥈' : '🥉') ?>
                                </span>
                            <?php endif; ?>
                            #<?= $index + 1 ?>
                        </td>
                        <td><strong><?= htmlspecialchars($user['firstname']) ?></strong></td>
                        <td><?= number_format($user['totalpoints']) ?></td>
                        <td><?= $user['level'] ?></td>
                        <td><?= number_format($user['accuracy'], 1) ?>%</td>
                        <td><?= $user['beststreak'] ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Pestaña: Ranking por Precisión -->
    <div id="accuracy" class="tab-content">
        <div class="ranking-section">
            <h2>🎯 Top 20 por Precisión</h2>
            <div class="chart-container">
                <canvas id="accuracyChart"></canvas>
            </div>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Usuario</th>
                        <th>Precisión</th>
                        <th>Puntos</th>
                        <th>Nivel</th>
                        <th>Mejor Racha</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($topByAccuracy as $index => $user): ?>
                    <tr>
                        <td>
                            <?php if ($index < 3): ?>
                                <span class="medal rank-<?= $index + 1 ?>">
                                    <?= $index === 0 ? '🥇' : ($index === 1 ? '🥈' : '🥉') ?>
                                </span>
                            <?php endif; ?>
                            #<?= $index + 1 ?>
                        </td>
                        <td><strong><?= htmlspecialchars($user['firstname']) ?></strong></td>
                        <td><span style="color: #28a745; font-weight: bold;"><?= number_format($user['accuracy'], 1) ?>%</span></td>
                        <td><?= number_format($user['totalpoints']) ?></td>
                        <td><?= $user['level'] ?></td>
                        <td><?= $user['beststreak'] ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Pestaña: Ranking por Racha -->
    <div id="streak" class="tab-content">
        <div class="ranking-section">
            <h2>🔥 Top 20 por Mejor Racha</h2>
            <div class="chart-container">
                <canvas id="streakChart"></canvas>
            </div>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Usuario</th>
                        <th>Mejor Racha</th>
                        <th>Puntos</th>
                        <th>Nivel</th>
                        <th>Precisión</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($topByStreak as $index => $user): ?>
                    <tr>
                        <td>
                            <?php if ($index < 3): ?>
                                <span class="medal rank-<?= $index + 1 ?>">
                                    <?= $index === 0 ? '🥇' : ($index === 1 ? '🥈' : '🥉') ?>
                                </span>
                            <?php endif; ?>
                            #<?= $index + 1 ?>
                        </td>
                        <td><strong><?= htmlspecialchars($user['firstname']) ?></strong></td>
                        <td><span style="color: #dc3545; font-weight: bold;"><?= $user['beststreak'] ?></span></td>
                        <td><?= number_format($user['totalpoints']) ?></td>
                        <td><?= $user['level'] ?></td>
                        <td><?= number_format($user['accuracy'], 1) ?>%</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Pestaña: Temas Populares -->
    <div id="topics" class="tab-content">
        <div class="ranking-section">
            <h2>📚 Temas Más Populares</h2>
            <div class="chart-container">
                <canvas id="topicsChart"></canvas>
            </div>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Tema</th>
                        <th>Total Preguntas</th>
                        <th>Precisión Promedio</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($topTopics as $index => $topic): ?>
                    <tr>
                        <td>#<?= $index + 1 ?></td>
                        <td><strong><?= htmlspecialchars($topic['sectionname']) ?></strong></td>
                        <td><?= number_format($topic['total_questions']) ?></td>
                        <td><?= number_format($topic['avg_accuracy'], 1) ?>%</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Pestaña: Temas Difíciles -->
    <div id="difficult" class="tab-content">
        <div class="ranking-section">
            <h2>⚠️ Temas Más Difíciles</h2>
            <div class="chart-container">
                <canvas id="difficultChart"></canvas>
            </div>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Tema</th>
                        <th>Precisión Promedio</th>
                        <th>Total Preguntas</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($difficultTopics as $index => $topic): ?>
                    <tr>
                        <td>#<?= $index + 1 ?></td>
                        <td><strong><?= htmlspecialchars($topic['sectionname']) ?></strong></td>
                        <td><span style="color: #dc3545; font-weight: bold;"><?= number_format($topic['avg_accuracy'], 1) ?>%</span></td>
                        <td><?= number_format($topic['total_questions']) ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
// Función para cambiar pestañas
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Datos para gráficos
const pointsData = <?= json_encode($topByPoints) ?>;
const accuracyData = <?= json_encode($topByAccuracy) ?>;
const streakData = <?= json_encode($topByStreak) ?>;
const topicsData = <?= json_encode($topTopics) ?>;
const difficultData = <?= json_encode($difficultTopics) ?>;

// Gráfico de puntos
if (pointsData.length > 0) {
    const ctx = document.getElementById('pointsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: pointsData.slice(0, 10).map(u => u.firstname),
            datasets: [{
                label: 'Puntos',
                data: pointsData.slice(0, 10).map(u => u.totalpoints),
                backgroundColor: ['#ffd700', '#c0c0c0', '#cd7f32', '#667eea', '#667eea', '#667eea', '#667eea', '#667eea', '#667eea', '#667eea'],
                borderColor: ['#e0a800', '#a8a8a8', '#b8860b', '#5a6fd8', '#5a6fd8', '#5a6fd8', '#5a6fd8', '#5a6fd8', '#5a6fd8', '#5a6fd8'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Puntos'
                    }
                }
            }
        }
    });
}

// Gráfico de precisión
if (accuracyData.length > 0) {
    const ctx = document.getElementById('accuracyChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: accuracyData.slice(0, 10).map(u => u.firstname),
            datasets: [{
                label: 'Precisión (%)',
                data: accuracyData.slice(0, 10).map(u => u.accuracy),
                backgroundColor: ['#ffd700', '#c0c0c0', '#cd7f32', '#28a745', '#28a745', '#28a745', '#28a745', '#28a745', '#28a745', '#28a745'],
                borderColor: ['#e0a800', '#a8a8a8', '#b8860b', '#1e7e34', '#1e7e34', '#1e7e34', '#1e7e34', '#1e7e34', '#1e7e34', '#1e7e34'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Precisión (%)'
                    }
                }
            }
        }
    });
}

// Gráfico de rachas
if (streakData.length > 0) {
    const ctx = document.getElementById('streakChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: streakData.slice(0, 10).map(u => u.firstname),
            datasets: [{
                label: 'Mejor Racha',
                data: streakData.slice(0, 10).map(u => u.beststreak),
                backgroundColor: ['#ffd700', '#c0c0c0', '#cd7f32', '#dc3545', '#dc3545', '#dc3545', '#dc3545', '#dc3545', '#dc3545', '#dc3545'],
                borderColor: ['#e0a800', '#a8a8a8', '#b8860b', '#c82333', '#c82333', '#c82333', '#c82333', '#c82333', '#c82333', '#c82333'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Racha'
                    }
                }
            }
        }
    });
}

// Gráfico de temas populares
if (topicsData.length > 0) {
    const ctx = document.getElementById('topicsChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topicsData.map(t => t.sectionname),
            datasets: [{
                data: topicsData.map(t => t.total_questions),
                backgroundColor: [
                    '#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#4bc0c0',
                    '#9966ff', '#ff9f40', '#ff6384', '#c9cbcf', '#4bc0c0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Gráfico de temas difíciles
if (difficultData.length > 0) {
    const ctx = document.getElementById('difficultChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: difficultData.map(t => t.sectionname),
            datasets: [{
                label: 'Precisión Promedio (%)',
                data: difficultData.map(t => t.avg_accuracy),
                backgroundColor: '#dc3545',
                borderColor: '#c82333',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Precisión (%)'
                    }
                }
            }
        }
    });
}
</script>

<?php
echo $OUTPUT->footer();
?> 