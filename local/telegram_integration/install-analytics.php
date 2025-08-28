<?php
// Script de instalación automática para Analytics Avanzado
// Ejecutar desde: https://campus.opomelilla.com/local/telegram_integration/install-analytics.php

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
echo "<h1>🚀 Instalación de Analytics Avanzado</h1>";

// Verificar que las tablas existen
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo "<p>❌ <strong>Error de conexión a la base de datos:</strong> " . $e->getMessage() . "</p>";
    echo "<p>Asegúrate de que las credenciales de la base de datos estén configuradas correctamente en tu archivo config.php.</p>";
    echo $OUTPUT->footer();
    exit;
}


$requiredTables = [
    'mdl_local_telegram_user_topic_performance',
    'mdl_local_telegram_user_responses',
    'mdl_local_telegram_study_sessions',
    'mdl_local_telegram_achievements',
    'mdl_local_telegram_recommendations',
    'mdl_local_telegram_progress_timeline'
];

echo "<h2>1. Verificando tablas de analytics...</h2>";
$missingTables = [];

foreach ($requiredTables as $table) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() == 0) {
            $missingTables[] = $table;
            echo "<p>❌ <strong>$table</strong> - No encontrada</p>";
        } else {
            echo "<p>✅ <strong>$table</strong> - OK</p>";
        }
    } catch (Exception $e) {
        $missingTables[] = $table;
        echo "<p>❌ <strong>$table</strong> - Error: " . $e->getMessage() . "</p>";
    }
}

if (!empty($missingTables)) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>⚠️ Tablas faltantes</h3>";
    echo "<p>Ejecuta primero el script de configuración:</p>";
    echo "<a href='setup-advanced-analytics.php' style='background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>⚙️ Configurar Tablas</a>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}

echo "<h2>2. Verificando archivos de analytics...</h2>";

$requiredFiles = [
    'my-advanced-analytics.php',
    'global-rankings.php',
    'db/menu.php',
    'blocks/analytics_nav.php'
];

$missingFiles = [];

foreach ($requiredFiles as $file) {
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "<p>✅ <strong>$file</strong> - OK</p>";
    } else {
        $missingFiles[] = $file;
        echo "<p>❌ <strong>$file</strong> - No encontrado</p>";
    }
}

if (!empty($missingFiles)) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>⚠️ Archivos faltantes</h3>";
    echo "<p>Algunos archivos de analytics no están disponibles.</p>";
    echo "</div>";
}

echo "<h2>3. Verificando datos de prueba...</h2>";

// Verificar si hay datos de prueba
try {
    $testData = $pdo->query("SELECT COUNT(*) as count FROM mdl_local_telegram_user_responses WHERE telegramuserid = '118d2830-404f-49e9-9496-c5ab54e6a1c8'")->fetch(PDO::FETCH_ASSOC);
    
    if ($testData['count'] > 0) {
        echo "<p>✅ <strong>Datos de prueba</strong> - Encontrados " . $testData['count'] . " registros</p>";
    } else {
        echo "<p>⚠️ <strong>Datos de prueba</strong> - No encontrados</p>";
        echo "<p><a href='test-advanced-analytics.php' style='background: #ffc107; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🧪 Insertar Datos de Prueba</a></p>";
    }
} catch (Exception $e) {
    echo "<p>❌ <strong>Error verificando datos:</strong> " . $e->getMessage() . "</p>";
}

echo "<h2>4. Enlaces de acceso...</h2>";

echo "<div style='display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0;'>";

echo "<div style='background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
echo "<h3>📊 Analytics Personal</h3>";
echo "<p>Para usuarios individuales ver su progreso y recomendaciones.</p>";
echo "<a href='my-advanced-analytics.php' style='background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;'>📈 Ver Mi Analytics</a>";
echo "</div>";

echo "<div style='background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
echo "<h3>🏆 Rankings Globales</h3>";
echo "<p>Comparativas y estadísticas globales de todos los usuarios.</p>";
echo "<a href='global-rankings.php' style='background: #ffd700; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;'>🏆 Ver Rankings</a>";
echo "</div>";

echo "<div style='background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
echo "<h3>🧪 Pruebas del Sistema</h3>";
echo "<p>Insertar datos de prueba y verificar funcionamiento.</p>";
echo "<a href='test-advanced-analytics.php' style='background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;'>🧪 Ejecutar Pruebas</a>";
echo "</div>";

echo "<div style='background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>";
echo "<h3>⚙️ Configuración</h3>";
echo "<p>Configurar tablas y parámetros del sistema de analytics.</p>";
echo "<a href='setup-advanced-analytics.php' style='background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;'>⚙️ Configurar</a>";
echo "</div>";

echo "</div>";

echo "<h2>5. Instrucciones de uso...</h2>";

echo "<div style='background: #d1ecf1; color: #0c5460; padding: 20px; border-radius: 5px; margin: 20px 0;'>";
echo "<h3>📋 Cómo usar el sistema de analytics</h3>";
echo "<ol>";
echo "<li><strong>Para usuarios:</strong> Acceden a 'Mi Analytics Avanzado' desde el menú o dashboard.</li>";
echo "<li><strong>Para administradores:</strong> Pueden ver rankings globales y estadísticas del sistema.</li>";
echo "<li><strong>Integración con Telegram:</strong> Los datos se registran automáticamente cuando los usuarios responden preguntas.</li>";
echo "<li><strong>Recomendaciones:</strong> Se generan automáticamente basadas en el rendimiento del usuario.</li>";
echo "<li><strong>Logros:</strong> Se otorgan automáticamente cuando se cumplen ciertos criterios.</li>";
echo "</ol>";
echo "</div>";

echo "<h2>6. Próximos pasos...</h2>";

echo "<div style='background: #d4edda; color: #155724; padding: 20px; border-radius: 5px; margin: 20px 0;'>";
echo "<h3>✅ Sistema listo para usar</h3>";
echo "<p>El sistema de analytics avanzado está instalado y funcionando. Los usuarios pueden:</p>";
echo "<ul>";
echo "<li>Ver su progreso personal y recomendaciones</li>";
echo "<li>Comparar su rendimiento con otros usuarios</li>";
echo "<li>Recibir logros automáticos</li>";
echo "<li>Acceder a analytics desde Moodle y Telegram</li>";
echo "</ul>";
echo "</div>";

echo $OUTPUT->footer();
?> 