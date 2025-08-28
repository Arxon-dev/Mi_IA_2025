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

// Función para obtener analytics avanzados de un usuario
function getAdvancedUserAnalytics($telegramUserId) {
    global $CFG;
    
    try {
        // Conexión PDO para más control
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $analytics = [];
        
        // 1. Información básica del usuario
        $stmt = $pdo->prepare("
            SELECT * FROM telegramuser 
            WHERE telegramuserid = ?
        ");
        $stmt->execute([$telegramUserId]);
        $analytics['user_info'] = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 2. Rendimiento por temas
        $stmt = $pdo->prepare("
            SELECT * FROM mdl_local_telegram_user_topic_performance 
            WHERE telegramuserid = ?
            ORDER BY accuracy ASC
        ");
        $stmt->execute([$telegramUserId]);
        $analytics['topic_performance'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 3. Progreso temporal (últimas 4 semanas)
        $stmt = $pdo->prepare("
            SELECT * FROM mdl_local_telegram_progress_timeline 
            WHERE telegramuserid = ?
            AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
            ORDER BY date ASC
        ");
        $stmt->execute([$telegramUserId]);
        $analytics['timeline'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 4. Recomendaciones activas
        $stmt = $pdo->prepare("
            SELECT * FROM mdl_local_telegram_recommendations 
            WHERE telegramuserid = ? AND isactive = 1
            ORDER BY priority ASC
        ");
        $stmt->execute([$telegramUserId]);
        $analytics['recommendations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 5. Logros recientes
        $stmt = $pdo->prepare("
            SELECT * FROM mdl_local_telegram_achievements 
            WHERE telegramuserid = ?
            ORDER BY earnedat DESC
            LIMIT 10
        ");
        $stmt->execute([$telegramUserId]);
        $analytics['achievements'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // 6. Sesiones de estudio recientes
        $stmt = $pdo->prepare("
            SELECT * FROM mdl_local_telegram_study_sessions 
            WHERE telegramuserid = ?
            ORDER BY startedat DESC
            LIMIT 10
        ");
        $stmt->execute([$telegramUserId]);
        $analytics['study_sessions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $analytics;
        
    } catch (PDOException $e) {
        return ['error' => $e->getMessage()];
    }
}

// Función para obtener estadísticas globales
function getGlobalAnalytics() {
    global $CFG;
    
    try {
        // Fallback a conexión PDO
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stats = [];
        
        // Total usuarios
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM telegramuser");
        $stats['total_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Usuarios activos (últimos 7 días)
        $stmt = $pdo->query("
            SELECT COUNT(DISTINCT telegramuserid) as active 
            FROM mdl_local_telegram_user_responses 
            WHERE createdat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $stats['active_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['active'];
        
        // Temas más populares
        $stmt = $pdo->query("
            SELECT sectionname, COUNT(*) as total_questions
            FROM mdl_local_telegram_user_responses 
            GROUP BY sectionid, sectionname
            ORDER BY total_questions DESC
            LIMIT 5
        ");
        $stats['popular_topics'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Temas más difíciles
        $stmt = $pdo->query("
            SELECT sectionname, AVG(accuracy) as avg_accuracy
            FROM mdl_local_telegram_user_topic_performance 
            WHERE totalquestions >= 10
            GROUP BY sectionid, sectionname
            ORDER BY avg_accuracy ASC
            LIMIT 5
        ");
        $stats['difficult_topics'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $stats;
        
    } catch (PDOException $e) {
        return ['error' => $e->getMessage()];
    }
}

// Procesar formulario
$selectedUser = '';
$userAnalytics = null;
$globalStats = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['analyze_user'])) {
    $selectedUser = $_POST['telegram_user_id'];
    $userAnalytics = getAdvancedUserAnalytics($selectedUser);
}

$globalStats = getGlobalAnalytics();

// Obtener lista de usuarios para el selector
function getUsersList() {
    global $CFG;
    
    try {
        // Fallback a conexión PDO para la tabla de enlace
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->query("
            SELECT telegramuserid, username, firstname, totalpoints, level 
            FROM telegramuser 
            ORDER BY totalpoints DESC 
            LIMIT 50
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

$usersList = getUsersList();
?>

<!DOCTYPE html>
<html>
<head>
    <title>📊 Analytics Avanzado - Telegram Bot</title>
    <meta charset="utf-8">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .stat-card.success { border-left-color: #28a745; }
        .stat-card.warning { border-left-color: #ffc107; }
        .stat-card.danger { border-left-color: #dc3545; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #6c757d; margin-top: 5px; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
        .user-selector { margin: 20px 0; }
        .btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; background: #007bff; color: white; }
        .btn:hover { background: #0056b3; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; font-weight: bold; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .achievement { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .tabs { display: flex; border-bottom: 1px solid #ddd; margin-bottom: 20px; }
        .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #007bff; color: #007bff; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Analytics Avanzado - Telegram Bot</h1>
            <p>Sistema de análisis detallado de rendimiento y recomendaciones personalizadas</p>
        </div>

        <!-- Estadísticas Globales -->
        <div class="section">
            <h2>🌍 Estadísticas Globales del Sistema</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number"><?php echo number_format($globalStats['total_users'] ?? 0); ?></div>
                    <div class="stat-label">Total Usuarios</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-number"><?php echo number_format($globalStats['active_users'] ?? 0); ?></div>
                    <div class="stat-label">Usuarios Activos (7 días)</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-number"><?php echo count($globalStats['popular_topics'] ?? []); ?></div>
                    <div class="stat-label">Temas Analizados</div>
                </div>
            </div>
        </div>

        <!-- Selector de Usuario -->
        <div class="section">
            <h2>👤 Análisis de Usuario Específico</h2>
            <form method="post" class="user-selector">
                <label for="telegram_user_id"><strong>Seleccionar Usuario:</strong></label>
                <select name="telegram_user_id" id="telegram_user_id" required>
                    <option value="">-- Seleccionar usuario --</option>
                    <?php foreach ($usersList as $user): ?>
                    <option value="<?php echo $user['telegramuserid']; ?>" <?php echo ($selectedUser === $user['telegramuserid']) ? 'selected' : ''; ?>>
                        <?php echo $user['firstname']; ?> (<?php echo $user['username']; ?>) - <?php echo number_format($user['totalpoints']); ?> pts - Nivel <?php echo $user['level']; ?>
                    </option>
                    <?php endforeach; ?>
                </select>
                <button type="submit" name="analyze_user" class="btn">🔍 Analizar Usuario</button>
            </form>
        </div>

        <?php if ($userAnalytics && !isset($userAnalytics['error'])): ?>
        <!-- Análisis del Usuario Seleccionado -->
        <div class="section">
            <h2>📈 Análisis Detallado: <?php echo $userAnalytics['user_info']['firstname']; ?></h2>
            
            <!-- Tabs -->
            <div class="tabs">
                <div class="tab active" onclick="showTab('overview')">📊 Vista General</div>
                <div class="tab" onclick="showTab('topics')">📚 Rendimiento por Temas</div>
                <div class="tab" onclick="showTab('timeline')">📅 Progreso Temporal</div>
                <div class="tab" onclick="showTab('recommendations')">💡 Recomendaciones</div>
                <div class="tab" onclick="showTab('achievements')">🏆 Logros</div>
            </div>

            <!-- Tab: Vista General -->
            <div id="overview" class="tab-content active">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number"><?php echo number_format($userAnalytics['user_info']['totalpoints']); ?></div>
                        <div class="stat-label">Puntos Totales</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number"><?php echo $userAnalytics['user_info']['level']; ?></div>
                        <div class="stat-label">Nivel Actual</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number"><?php echo count($userAnalytics['topic_performance']); ?></div>
                        <div class="stat-label">Temas Practicados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number"><?php echo count($userAnalytics['achievements']); ?></div>
                        <div class="stat-label">Logros Obtenidos</div>
                    </div>
                </div>

                <!-- Gráfico de Progreso -->
                <div class="chart-container">
                    <canvas id="progressChart"></canvas>
                </div>
            </div>

            <!-- Tab: Rendimiento por Temas -->
            <div id="topics" class="tab-content">
                <h3>📚 Rendimiento por Temas</h3>
                <?php if (!empty($userAnalytics['topic_performance'])): ?>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Tema</th>
                            <th>Preguntas</th>
                            <th>Correctas</th>
                            <th>Incorrectas</th>
                            <th>Precisión</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($userAnalytics['topic_performance'] as $topic): ?>
                        <tr>
                            <td><?php echo $topic['sectionname']; ?></td>
                            <td><?php echo $topic['totalquestions']; ?></td>
                            <td><?php echo $topic['correctanswers']; ?></td>
                            <td><?php echo $topic['incorrectanswers']; ?></td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: <?php echo $topic['accuracy']; ?>%"></div>
                                </div>
                                <?php echo number_format($topic['accuracy'], 1); ?>%
                            </td>
                            <td>
                                <?php if ($topic['accuracy'] >= 80): ?>
                                    <span style="color: #28a745;">✅ Excelente</span>
                                <?php elseif ($topic['accuracy'] >= 60): ?>
                                    <span style="color: #ffc107;">⚠️ Bueno</span>
                                <?php else: ?>
                                    <span style="color: #dc3545;">❌ Necesita Mejorar</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <?php else: ?>
                <p>No hay datos de rendimiento por temas disponibles.</p>
                <?php endif; ?>
            </div>

            <!-- Tab: Progreso Temporal -->
            <div id="timeline" class="tab-content">
                <h3>📅 Progreso Temporal (Últimas 4 Semanas)</h3>
                <?php if (!empty($userAnalytics['timeline'])): ?>
                <div class="chart-container">
                    <canvas id="timelineChart"></canvas>
                </div>
                <?php else: ?>
                <p>No hay datos de progreso temporal disponibles.</p>
                <?php endif; ?>
            </div>

            <!-- Tab: Recomendaciones -->
            <div id="recommendations" class="tab-content">
                <h3>💡 Recomendaciones Personalizadas</h3>
                <?php if (!empty($userAnalytics['recommendations'])): ?>
                    <?php foreach ($userAnalytics['recommendations'] as $rec): ?>
                    <div class="recommendation">
                        <h4><?php echo $rec['recommendationtype']; ?></h4>
                        <p><strong>Prioridad:</strong> <?php echo $rec['priority']; ?></p>
                        <p><strong>Razón:</strong> <?php echo $rec['reason']; ?></p>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                <p>No hay recomendaciones activas para este usuario.</p>
                <?php endif; ?>
            </div>

            <!-- Tab: Logros -->
            <div id="achievements" class="tab-content">
                <h3>🏆 Logros Obtenidos</h3>
                <?php if (!empty($userAnalytics['achievements'])): ?>
                    <?php foreach ($userAnalytics['achievements'] as $achievement): ?>
                    <div class="achievement">
                        <h4><?php echo $achievement['achievementname']; ?></h4>
                        <p><?php echo $achievement['achievementdescription']; ?></p>
                        <small>Obtenido: <?php echo date('d/m/Y H:i', strtotime($achievement['earnedat'])); ?></small>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                <p>No hay logros registrados para este usuario.</p>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Temas Más Populares -->
        <div class="section">
            <h2>🔥 Temas Más Populares</h2>
            <?php if (!empty($globalStats['popular_topics'])): ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Tema</th>
                        <th>Total Preguntas</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($globalStats['popular_topics'] as $topic): ?>
                    <tr>
                        <td><?php echo $topic['sectionname']; ?></td>
                        <td><?php echo number_format($topic['total_questions']); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php endif; ?>
        </div>

        <!-- Temas Más Difíciles -->
        <div class="section">
            <h2>⚠️ Temas Más Difíciles</h2>
            <?php if (!empty($globalStats['difficult_topics'])): ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Tema</th>
                        <th>Precisión Promedio</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($globalStats['difficult_topics'] as $topic): ?>
                    <tr>
                        <td><?php echo $topic['sectionname']; ?></td>
                        <td><?php echo number_format($topic['avg_accuracy'], 1); ?>%</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php endif; ?>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Ocultar todos los tabs
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Mostrar el tab seleccionado
            document.getElementById(tabName).classList.add('active');
            
            // Actualizar clases de los tabs
            const tabButtons = document.querySelectorAll('.tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }

        <?php if ($userAnalytics && !empty($userAnalytics['timeline'])): ?>
        // Gráfico de progreso temporal
        const timelineCtx = document.getElementById('timelineChart').getContext('2d');
        const timelineData = <?php echo json_encode($userAnalytics['timeline']); ?>;
        
        new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: timelineData.map(item => item.date),
                datasets: [{
                    label: 'Precisión (%)',
                    data: timelineData.map(item => item.accuracy),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.1
                }, {
                    label: 'Preguntas Respondidas',
                    data: timelineData.map(item => item.questions_answered),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.1,
                    yAxisID: 'y1'
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
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Preguntas'
                        }
                    }
                }
            }
        });
        <?php endif; ?>
    </script>
</body>
</html> 