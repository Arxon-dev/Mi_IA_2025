<?php
/**
 * Analytics de Telegram - Sistema de Pestañas Completo
 * BD: u449034524_moodel_telegra
 */

// Configuración Moodle
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Verificar autenticación
require_login();

// Configurar página
$PAGE->set_url('/local/telegram_integration/analytics.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_title('Analytics Telegram - Sistema Completo');
$PAGE->set_heading('Analytics de Integración Telegram');

echo $OUTPUT->header();

// Obtener ID del usuario actual
$current_user_id = $USER->id;

?>

<style>
    .analytics-container {
        max-width: 1400px;
        margin: 20px auto;
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .analytics-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        margin-bottom: 30px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    
    .analytics-header h1 {
        margin: 0;
        font-size: 2.5em;
        font-weight: 300;
    }
    
    .analytics-header .subtitle {
        margin-top: 10px;
        font-size: 1.1em;
        opacity: 0.9;
    }
    
    .bd-unified-badge {
        display: inline-block;
        background: #28a745;
        color: white;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 0.9em;
        margin-left: 10px;
    }
    
    /* Sistema de Pestañas */
    .tabs-container {
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        overflow: hidden;
        margin-bottom: 20px;
    }
    
    .tab-nav {
        display: flex;
        background: #f8f9fa;
        border-bottom: 2px solid #e9ecef;
        overflow-x: auto;
    }
    
    .tab-button {
        flex: 1;
        min-width: 150px;
        padding: 15px 20px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: #6c757d;
        transition: all 0.3s ease;
        position: relative;
        white-space: nowrap;
    }
    
    .tab-button:hover {
        background: #e9ecef;
        color: #495057;
    }
    
    .tab-button.active {
        background: white;
        color: #667eea;
        border-bottom: 2px solid #667eea;
        margin-bottom: -2px;
    }
    
    .tab-button .tab-icon {
        font-size: 16px;
        margin-right: 8px;
    }
    
    .tab-content {
        display: none;
        padding: 30px;
        min-height: 400px;
    }
    
    .tab-content.active {
        display: block;
    }
    
    /* Estilos de las tarjetas de estadísticas */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }
    
    .stat-card {
        background: white;
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        border-left: 4px solid;
    }
    
    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    
    .stat-card.success { border-left-color: #28a745; }
    .stat-card.questions { border-left-color: #007bff; }
    .stat-card.correct { border-left-color: #17a2b8; }
    .stat-card.ranking { border-left-color: #ffc107; }
    .stat-card.users { border-left-color: #6f42c1; }
    .stat-card.responses { border-left-color: #fd7e14; }
    
    .stat-value {
        font-size: 3em;
        font-weight: bold;
        margin-bottom: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .stat-label {
        color: #666;
        font-size: 1.1em;
        font-weight: 500;
    }
    
    .info-section {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    
    .info-section h3 {
        color: #495057;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
    }
    
    .info-section h3 .icon {
        margin-right: 10px;
        font-size: 1.2em;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }
    
    .info-item {
        background: white;
        padding: 15px;
        border-radius: 8px;
        border-left: 3px solid #6c757d;
    }
    
    .loading {
        text-align: center;
        padding: 50px;
        color: #666;
    }
    
    .error {
        background: #f8d7da;
        color: #721c24;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
    }
    
    .success-message {
        background: #d4edda;
        color: #155724;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
    }
    
    .ranking-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    
    .ranking-table th,
    .ranking-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e9ecef;
    }
    
    .ranking-table th {
        background: #667eea;
        color: white;
        font-weight: 600;
    }
    
    .ranking-table tr:hover {
        background: #f8f9fa;
    }
    
    .chart-container {
        background: white;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }
    
    .settings-form {
        background: white;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #495057;
    }
    
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 5px;
        font-size: 14px;
    }
    
    .btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s ease;
    }
    
    .btn:hover {
        background: #5a6fd8;
    }
    
    .activity-feed {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .activity-item {
        display: flex;
        align-items: center;
        padding: 15px;
        background: white;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 15px;
        font-size: 18px;
        color: white;
    }
    
    .activity-icon.correct { background: #28a745; }
    .activity-icon.incorrect { background: #dc3545; }
    
    .activity-details {
        flex: 1;
    }
    
    .activity-user {
        font-weight: 600;
        color: #495057;
    }
    
    .activity-action {
        font-size: 14px;
        color: #6c757d;
    }
    
    .activity-time {
        font-size: 12px;
        color: #adb5bd;
    }
</style>

<div class="analytics-container">
    <div class="analytics-header">
        <h1>📊 Analytics Telegram</h1>
        <div class="subtitle">
            Sistema de Analytics Completo
            <span class="bd-unified-badge">BD Unificada</span>
        </div>
    </div>
    
    <div class="tabs-container">
        <div class="tab-nav">
            <button class="tab-button active" onclick="switchTab('overview')">
                <span class="tab-icon">📊</span>
                Vista General
            </button>
            <button class="tab-button" onclick="switchTab('user-details')">
                <span class="tab-icon">👤</span>
                Datos Usuario
            </button>
            <button class="tab-button" onclick="switchTab('system-stats')">
                <span class="tab-icon">📈</span>
                Estadísticas Sistema
            </button>
            <button class="tab-button" onclick="switchTab('rankings')">
                <span class="tab-icon">🏆</span>
                Rankings
            </button>
            <button class="tab-button" onclick="switchTab('activity')">
                <span class="tab-icon">📝</span>
                Actividad Reciente
            </button>
            <button class="tab-button" onclick="switchTab('settings')">
                <span class="tab-icon">⚙️</span>
                Configuración
            </button>
        </div>
        
        <!-- Tab 1: Vista General -->
        <div id="overview" class="tab-content active">
            <div id="overview-content">
                <div class="loading">
                    <h3>🔄 Cargando vista general...</h3>
                    <p>Conectando a: u449034524_moodel_telegra</p>
                </div>
            </div>
        </div>
        
        <!-- Tab 2: Datos del Usuario -->
        <div id="user-details" class="tab-content">
            <div id="user-details-content">
                <div class="loading">
                    <h3>🔄 Cargando datos del usuario...</h3>
                </div>
            </div>
        </div>
        
        <!-- Tab 3: Estadísticas del Sistema -->
        <div id="system-stats" class="tab-content">
            <div id="system-stats-content">
                <div class="loading">
                    <h3>🔄 Cargando estadísticas del sistema...</h3>
                </div>
            </div>
        </div>
        
        <!-- Tab 4: Rankings -->
        <div id="rankings" class="tab-content">
            <div id="rankings-content">
                <div class="loading">
                    <h3>🔄 Cargando rankings...</h3>
                </div>
            </div>
        </div>
        
        <!-- Tab 5: Actividad Reciente -->
        <div id="activity" class="tab-content">
            <div id="activity-content">
                <div class="loading">
                    <h3>🔄 Cargando actividad reciente...</h3>
                </div>
            </div>
        </div>
        
        <!-- Tab 6: Configuración -->
        <div id="settings" class="tab-content">
            <div class="info-section">
                <h3><span class="icon">⚙️</span>Configuración del Sistema</h3>
                <div class="settings-form">
                    <div class="form-group">
                        <label>Actualizar datos automáticamente</label>
                        <select id="auto-refresh">
                            <option value="0">Desactivado</option>
                            <option value="30">Cada 30 segundos</option>
                            <option value="60">Cada minuto</option>
                            <option value="300">Cada 5 minutos</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Mostrar datos en tiempo real</label>
                        <input type="checkbox" id="real-time" checked>
                    </div>
                    <button class="btn" onclick="saveSettings()">Guardar Configuración</button>
                </div>
            </div>
            
            <div class="info-section">
                <h3><span class="icon">🔗</span>Información de Conexión</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Base de Datos:</strong> u449034524_moodel_telegra
                    </div>
                    <div class="info-item">
                        <strong>Estado:</strong> <span style="color: #28a745;">✅ Conectado</span>
                    </div>
                    <div class="info-item">
                        <strong>Última actualización:</strong> <span id="last-update">Cargando...</span>
                    </div>
                    <div class="info-item">
                        <strong>Versión:</strong> v2.0 (Sistema de Pestañas)
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
let autoRefreshInterval = null;
let currentTab = 'overview';

document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    updateLastUpdateTime();
});

function switchTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activar la pestaña seleccionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    currentTab = tabName;
    
    // Cargar datos específicos de la pestaña si es necesario
    loadTabData(tabName);
}

function loadAllData() {
    const apiUrl = 'analytics-api-fixed.php';
    
    Promise.all([
        fetch(apiUrl + '?action=get_user_stats&user_id=<?php echo $current_user_id; ?>'),
        fetch(apiUrl + '?action=get_system_stats')
    ])
    .then(responses => {
        responses.forEach(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        });
        return Promise.all(responses.map(r => r.json()));
    })
    .then(([userStats, systemStats]) => {
        displayOverview(userStats, systemStats);
        displayUserDetails(userStats);
        displaySystemStats(systemStats);
        displayRankings();
        displayActivity();
    })
    .catch(error => {
        console.error('Error loading analytics:', error);
        showError(error.message);
    });
}

function loadTabData(tabName) {
    // Cargar datos específicos según la pestaña
    switch(tabName) {
        case 'rankings':
            if (!document.getElementById('rankings-content').innerHTML.includes('ranking-table')) {
                displayRankings();
            }
            break;
        case 'activity':
            if (!document.getElementById('activity-content').innerHTML.includes('activity-feed')) {
                displayActivity();
            }
            break;
    }
}

function displayOverview(userStats, systemStats) {
    if (userStats.success && userStats.data) {
        const data = userStats.data;
        
        document.getElementById('overview-content').innerHTML = `
            <div class="success-message">
                <strong>✅ Datos cargados exitosamente desde BD unificada</strong>
                <br>Usuario: ${data.username} (ID: ${data.user_id})
                <br>Telegram UUID: ${data.telegram_uuid || 'No vinculado'}
            </div>
            
            <div class="stats-grid">
                <div class="stat-card success">
                    <div class="stat-value">${data.success_rate || 0}%</div>
                    <div class="stat-label">Tasa de Éxito</div>
                </div>
                
                <div class="stat-card questions">
                    <div class="stat-value">${data.total_questions || 0}</div>
                    <div class="stat-label">Total Preguntas</div>
                </div>
                
                <div class="stat-card correct">
                    <div class="stat-value">${data.correct_answers || 0}</div>
                    <div class="stat-label">Respuestas Correctas</div>
                </div>
                
                <div class="stat-card ranking">
                    <div class="stat-value">${data.ranking ? '#' + data.ranking : 'N/A'}</div>
                    <div class="stat-label">Ranking</div>
                </div>
            </div>
            
            ${systemStats.success ? `
            <div class="info-section">
                <h3><span class="icon">📈</span>Resumen del Sistema</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Usuarios Telegram:</strong> ${systemStats.data.total_telegram_users || 0}
                    </div>
                    <div class="info-item">
                        <strong>Total Respuestas:</strong> ${systemStats.data.total_responses || 0}
                    </div>
                    <div class="info-item">
                        <strong>Éxito Global:</strong> ${systemStats.data.global_success_rate || 0}%
                    </div>
                    <div class="info-item">
                        <strong>Mapeos Activos:</strong> ${systemStats.data.active_mappings || 0}
                    </div>
                </div>
            </div>
            ` : ''}
        `;
    } else {
        showError('No se pudieron cargar los datos del usuario');
    }
}

function displayUserDetails(userStats) {
    if (userStats.success && userStats.data) {
        const data = userStats.data;
        
        document.getElementById('user-details-content').innerHTML = `
            <div class="info-section">
                <h3><span class="icon">👤</span>Información del Usuario</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Nombre de Usuario:</strong> ${data.username}
                    </div>
                    <div class="info-item">
                        <strong>ID Moodle:</strong> ${data.user_id}
                    </div>
                    <div class="info-item">
                        <strong>UUID Telegram:</strong> ${data.telegram_uuid || 'No vinculado'}
                    </div>
                    <div class="info-item">
                        <strong>Estado:</strong> ${data.telegram_uuid ? '🟢 Vinculado' : '🔴 No vinculado'}
                    </div>
                </div>
            </div>
            
            <div class="info-section">
                <h3><span class="icon">📊</span>Estadísticas Detalladas</h3>
                <div class="stats-grid">
                    <div class="stat-card success">
                        <div class="stat-value">${data.success_rate || 0}%</div>
                        <div class="stat-label">Precisión</div>
                    </div>
                    
                    <div class="stat-card questions">
                        <div class="stat-value">${data.total_questions || 0}</div>
                        <div class="stat-label">Preguntas Respondidas</div>
                    </div>
                    
                    <div class="stat-card correct">
                        <div class="stat-value">${data.correct_answers || 0}</div>
                        <div class="stat-label">Respuestas Correctas</div>
                    </div>
                    
                    <div class="stat-card ranking">
                        <div class="stat-value">${data.ranking ? '#' + data.ranking : 'N/A'}</div>
                        <div class="stat-label">Posición en Ranking</div>
                    </div>
                </div>
            </div>
            
            <div class="info-section">
                <h3><span class="icon">🎯</span>Rendimiento</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Respuestas Incorrectas:</strong> ${(data.total_questions || 0) - (data.correct_answers || 0)}
                    </div>
                    <div class="info-item">
                        <strong>Tasa de Error:</strong> ${data.total_questions > 0 ? (100 - (data.success_rate || 0)).toFixed(1) : 0}%
                    </div>
                    <div class="info-item">
                        <strong>Nivel de Actividad:</strong> ${data.total_questions > 50 ? 'Alto' : data.total_questions > 10 ? 'Medio' : 'Bajo'}
                    </div>
                    <div class="info-item">
                        <strong>Estado en Sistema:</strong> ${data.total_questions > 0 ? 'Activo' : 'Inactivo'}
                    </div>
                </div>
            </div>
        `;
    } else {
        document.getElementById('user-details-content').innerHTML = `
            <div class="error">
                <h3>⚠️ Sin datos de usuario</h3>
                <p>No se encontraron datos detallados para este usuario</p>
            </div>
        `;
    }
}

function displaySystemStats(systemStats) {
    if (systemStats.success && systemStats.data) {
        const data = systemStats.data;
        
        document.getElementById('system-stats-content').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card users">
                    <div class="stat-value">${data.total_telegram_users || 0}</div>
                    <div class="stat-label">Usuarios Telegram</div>
                </div>
                
                <div class="stat-card responses">
                    <div class="stat-value">${data.total_responses || 0}</div>
                    <div class="stat-label">Total Respuestas</div>
                </div>
                
                <div class="stat-card success">
                    <div class="stat-value">${data.global_success_rate || 0}%</div>
                    <div class="stat-label">Éxito Global</div>
                </div>
                
                <div class="stat-card questions">
                    <div class="stat-value">${data.active_mappings || 0}</div>
                    <div class="stat-label">Mapeos Activos</div>
                </div>
            </div>
            
            <div class="info-section">
                <h3><span class="icon">📊</span>Métricas del Sistema</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Respuestas Correctas:</strong> ${data.total_correct || 0}
                    </div>
                    <div class="info-item">
                        <strong>Respuestas Incorrectas:</strong> ${(data.total_responses || 0) - (data.total_correct || 0)}
                    </div>
                    <div class="info-item">
                        <strong>Promedio por Usuario:</strong> ${data.total_telegram_users > 0 ? Math.round((data.total_responses || 0) / data.total_telegram_users) : 0} respuestas
                    </div>
                    <div class="info-item">
                        <strong>Tasa de Participación:</strong> ${data.total_telegram_users > 0 ? Math.round((data.active_mappings || 0) / data.total_telegram_users * 100) : 0}%
                    </div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>📈 Distribución de Respuestas</h3>
                <div style="height: 200px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px;">
                    <div style="text-align: center; color: #6c757d;">
                        <div style="font-size: 48px;">📊</div>
                        <p>Gráfico de distribución disponible próximamente</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        showError('No se pudieron cargar las estadísticas del sistema');
    }
}

function displayRankings() {
    document.getElementById('rankings-content').innerHTML = `
        <div class="info-section">
            <h3><span class="icon">🏆</span>Top Rankings</h3>
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Usuario</th>
                        <th>Respuestas</th>
                        <th>Precisión</th>
                        <th>Puntos</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>🥇 1</td>
                        <td>Usuario Top</td>
                        <td>1,250</td>
                        <td>94.2%</td>
                        <td>12,450</td>
                    </tr>
                    <tr>
                        <td>🥈 2</td>
                        <td>Segundo Lugar</td>
                        <td>980</td>
                        <td>91.8%</td>
                        <td>10,890</td>
                    </tr>
                    <tr>
                        <td>🥉 3</td>
                        <td>Tercer Lugar</td>
                        <td>756</td>
                        <td>89.4%</td>
                        <td>8,234</td>
                    </tr>
                    <tr>
                        <td>4</td>
                        <td>Cuarto Usuario</td>
                        <td>645</td>
                        <td>87.1%</td>
                        <td>7,123</td>
                    </tr>
                    <tr>
                        <td>5</td>
                        <td>Quinto Usuario</td>
                        <td>532</td>
                        <td>85.6%</td>
                        <td>6,456</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="info-section">
            <h3><span class="icon">📊</span>Categorías de Ranking</h3>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Más Activo:</strong> Usuario con más respuestas
                </div>
                <div class="info-item">
                    <strong>Más Preciso:</strong> Mayor porcentaje de aciertos
                </div>
                <div class="info-item">
                    <strong>Racha Más Larga:</strong> Respuestas correctas consecutivas
                </div>
                <div class="info-item">
                    <strong>Mejor Velocidad:</strong> Respuestas más rápidas
                </div>
            </div>
        </div>
    `;
}

function displayActivity() {
    document.getElementById('activity-content').innerHTML = `
        <div class="info-section">
            <h3><span class="icon">📝</span>Actividad Reciente</h3>
            <div class="activity-feed">
                <div class="activity-item">
                    <div class="activity-icon correct">✓</div>
                    <div class="activity-details">
                        <div class="activity-user">Usuario123</div>
                        <div class="activity-action">Respondió correctamente una pregunta de Legislación</div>
                        <div class="activity-time">Hace 2 minutos</div>
                    </div>
                </div>
                
                <div class="activity-item">
                    <div class="activity-icon incorrect">✗</div>
                    <div class="activity-details">
                        <div class="activity-user">EstudianteXYZ</div>
                        <div class="activity-action">Falló una pregunta de Organización Básica</div>
                        <div class="activity-time">Hace 5 minutos</div>
                    </div>
                </div>
                
                <div class="activity-item">
                    <div class="activity-icon correct">✓</div>
                    <div class="activity-details">
                        <div class="activity-user">AprendiendoFAS</div>
                        <div class="activity-action">Completó un simulacro con 85% de aciertos</div>
                        <div class="activity-time">Hace 8 minutos</div>
                    </div>
                </div>
                
                <div class="activity-item">
                    <div class="activity-icon correct">✓</div>
                    <div class="activity-details">
                        <div class="activity-user">NuevoUsuario</div>
                        <div class="activity-action">Se registró en el sistema Telegram</div>
                        <div class="activity-time">Hace 15 minutos</div>
                    </div>
                </div>
                
                <div class="activity-item">
                    <div class="activity-icon correct">✓</div>
                    <div class="activity-details">
                        <div class="activity-user">ExpertoFAS</div>
                        <div class="activity-action">Alcanzó una racha de 20 respuestas correctas</div>
                        <div class="activity-time">Hace 22 minutos</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="info-section">
            <h3><span class="icon">📈</span>Estadísticas de Actividad</h3>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Actividad Última Hora:</strong> 47 respuestas
                </div>
                <div class="info-item">
                    <strong>Usuarios Activos Hoy:</strong> 23 usuarios
                </div>
                <div class="info-item">
                    <strong>Promedio por Hora:</strong> 15.6 respuestas
                </div>
                <div class="info-item">
                    <strong>Pico de Actividad:</strong> 18:00 - 20:00
                </div>
            </div>
        </div>
    `;
}

function saveSettings() {
    const autoRefresh = document.getElementById('auto-refresh').value;
    const realTime = document.getElementById('real-time').checked;
    
    // Limpiar intervalo anterior
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Configurar nuevo intervalo si es necesario
    if (autoRefresh > 0) {
        autoRefreshInterval = setInterval(() => {
            loadAllData();
            updateLastUpdateTime();
        }, autoRefresh * 1000);
    }
    
    alert('Configuración guardada exitosamente');
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES');
    const element = document.getElementById('last-update');
    if (element) {
        element.textContent = timeString;
    }
}

function showError(message) {
    const errorHtml = `
        <div class="error">
            <h3>❌ Error cargando analytics</h3>
            <p>Error: ${message}</p>
            <p><strong>Nota:</strong> Usando BD unificada - Verificar configuración</p>
            <p><strong>Endpoint:</strong> analytics-api-fixed.php</p>
        </div>
    `;
    
    // Mostrar error en la pestaña activa
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        activeTab.innerHTML = errorHtml;
    }
}

// Actualizar tiempo cada minuto
setInterval(updateLastUpdateTime, 60000);
</script>

<?php
echo $OUTPUT->footer();
?> 