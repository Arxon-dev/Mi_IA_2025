<?php
/**
 * Test de conexión a base de datos de Telegram y funciones analíticas
 * Archivo: test-telegram-connection.php
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/telegram_integration/lib.php');

require_login();

// Solo para administradores
require_capability('moodle/site:config', context_system::instance());

echo "<h1>🔧 Test de Conexión a Base de Datos de Telegram</h1>";

// Test 1: Verificar conexión básica
echo "<h2>📡 Test 1: Conexión Básica</h2>";
require_once(__DIR__ . '/telegram-db-config.php');

$connection_test = verifyTelegramDatabaseConnection();
if ($connection_test['success']) {
    echo "<div style='color: green;'>✅ " . $connection_test['message'] . "</div>";
    echo "<h3>📊 Registros por tabla:</h3>";
    echo "<ul>";
    foreach ($connection_test['tables'] as $table => $count) {
        echo "<li><strong>{$table}</strong>: {$count} registros</li>";
    }
    echo "</ul>";
} else {
    echo "<div style='color: red;'>❌ " . $connection_test['message'] . "</div>";
    exit;
}

// Test 2: Verificar usuario actual
echo "<h2>👤 Test 2: Usuario Actual</h2>";
global $USER;
echo "<p><strong>Moodle User ID:</strong> {$USER->id}</p>";
echo "<p><strong>Username:</strong> {$USER->username}</p>";

$telegram_user_id = get_telegram_user_id($USER->id);
if ($telegram_user_id) {
    echo "<div style='color: green;'>✅ Telegram User ID: {$telegram_user_id}</div>";
} else {
    echo "<div style='color: orange;'>⚠️ No se encontró Telegram User ID para este usuario</div>";
    echo "<p>Usando UUID de ejemplo para las pruebas: <code>2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f</code></p>";
    $telegram_user_id = '2bc3c62a-5b7c-47db-b6cc-9ebc8607c73f';
}

// Test 3: Funciones analíticas
echo "<h2>📈 Test 3: Funciones Analíticas</h2>";

echo "<h3>🔮 Análisis Predictivo</h3>";
$predictive_data = get_predictive_analysis_data($telegram_user_id);
echo "<pre>" . json_encode($predictive_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

echo "<h3>📚 Métricas de Aprendizaje</h3>";
$learning_data = get_learning_metrics_data($telegram_user_id);
echo "<pre>" . json_encode($learning_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

echo "<h3>⚡ Datos de Optimización</h3>";
$optimization_data = get_optimization_data($telegram_user_id);
echo "<pre>" . json_encode($optimization_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

echo "<h3>🏆 Análisis Social</h3>";
$social_data = get_social_analysis_data($telegram_user_id);
echo "<pre>" . json_encode($social_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";

// Test 4: Consulta directa a user_analytics
echo "<h2>🗃️ Test 4: Consulta Directa a user_analytics</h2>";
$sql = "SELECT * FROM user_analytics WHERE telegram_user_id = ? LIMIT 1";
$user_analytics = executeTelegramQuery($sql, [$telegram_user_id]);

if ($user_analytics && !empty($user_analytics)) {
    echo "<div style='color: green;'>✅ Datos encontrados en user_analytics:</div>";
    echo "<pre>" . json_encode($user_analytics[0], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
} else {
    echo "<div style='color: orange;'>⚠️ No se encontraron datos en user_analytics para este usuario</div>";
    
    // Mostrar algunos registros de ejemplo
    echo "<h4>📋 Registros de ejemplo en user_analytics:</h4>";
    $sample_sql = "SELECT * FROM user_analytics LIMIT 3";
    $sample_data = executeTelegramQuery($sample_sql);
    if ($sample_data) {
        foreach ($sample_data as $record) {
            echo "<pre>" . json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "</pre>";
            echo "<hr>";
        }
    }
}

// Test 5: Estadísticas generales
echo "<h2>📊 Test 5: Estadísticas Generales</h2>";
$stats_sql = "SELECT 
    COUNT(*) as total_users,
    AVG(accuracy_rate) as avg_accuracy,
    AVG(question_count) as avg_questions,
    AVG(avg_response_time) as avg_time
FROM user_analytics";

$general_stats = executeTelegramQuery($stats_sql);
if ($general_stats && !empty($general_stats)) {
    $stats = $general_stats[0];
    echo "<ul>";
    echo "<li><strong>Total usuarios:</strong> " . $stats['total_users'] . "</li>";
    echo "<li><strong>Precisión promedio:</strong> " . round($stats['avg_accuracy'], 1) . "%</li>";
    echo "<li><strong>Preguntas promedio:</strong> " . round($stats['avg_questions'], 0) . "</li>";
    echo "<li><strong>Tiempo respuesta promedio:</strong> " . round($stats['avg_time'], 1) . " segundos</li>";
    echo "</ul>";
}

echo "<h2>✅ Test Completado</h2>";
echo "<p><a href='analytics.php'>← Volver a Analytics</a></p>";
?> 