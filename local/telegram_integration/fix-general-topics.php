<?php
define('CLI_SCRIPT', true);

// Intentar diferentes rutas para encontrar config.php
$possible_paths = [
    '../../../config.php', // Ruta original si el script está en local/telegram_integration/
    '../../../../config.php', // Si hay una estructura de carpetas adicional
    dirname(__FILE__) . '/../../../config.php'
];

$config_loaded = false;
foreach ($possible_paths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $config_loaded = true;
        break;
    }
}

if (!$config_loaded) {
    die("Error: No se pudo encontrar el archivo config.php. Por favor, verifica las rutas.\n");
}

require_once($CFG->libdir.'/clilib.php');
global $DB;

require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

// Verificar permisos de admin
require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h2>Limpieza de Registros 'General' - Plugin Telegram Integration</h2>";

// Verificar si la tabla existe
$table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');

if (!$table_exists) {
    echo "<div style='color: red;'>❌ La tabla 'local_telegram_user_topic_performance' no existe.</div>";
    echo "<p>El plugin puede no estar instalado correctamente o la tabla necesita ser creada.</p>";
    exit;
}

// Contar registros con tema "general"
$general_count = $DB->count_records('local_telegram_user_topic_performance', ['sectionname' => 'general']);
echo "<h3>Estado Actual:</h3>";
echo "<p>📊 Registros con tema 'general': <strong>$general_count</strong></p>";

if ($general_count == 0) {
    echo "<div style='color: green;'>✅ No hay registros con tema 'general'. Todo parece estar bien.</div>";
} else {
    echo "<div style='background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 10px 0;'>";
    echo "<p>⚠️ Se encontraron $general_count registros con tema 'general'.</p>";
    echo "<p>Estos registros representan temas que no pudieron ser clasificados correctamente.</p>";
    echo "</div>";

    // Mostrar los registros "general"
    $general_records = $DB->get_records('local_telegram_user_topic_performance', ['sectionname' => 'general']);
    
    echo "<h3>Registros con tema 'general':</h3>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID</th><th>Usuario Telegram</th><th>Preguntas Totales</th><th>Respuestas Correctas</th><th>Precisión %</th><th>Última Actividad</th></tr>";
    
    foreach ($general_records as $record) {
        $last_activity = date('Y-m-d H:i:s', $record->lastactivity);
        echo "<tr>";
        echo "<td>{$record->id}</td>";
        echo "<td>{$record->telegramuserid}</td>";
        echo "<td>{$record->totalquestions}</td>";
        echo "<td>{$record->correctanswers}</td>";
        echo "<td>{$record->accuracy}%</td>";
        echo "<td>{$last_activity}</td>";
        echo "</tr>";
    }
    echo "</table>";
}

// Opción para limpiar registros "general"
if (isset($_POST['clean_general'])) {
    echo "<h3>Ejecutando Limpieza...</h3>";
    
    try {
        $deleted = $DB->delete_records('local_telegram_user_topic_performance', ['sectionname' => 'general']);
        
        if ($deleted) {
            echo "<div style='color: green;'>✅ Se eliminaron los registros con tema 'general'.</div>";
            echo "<p>Los futuros quizzes se procesarán con el mapeo de temas mejorado.</p>";
        } else {
            echo "<div style='color: orange;'>⚠️ No se encontraron registros para eliminar.</div>";
        }
    } catch (Exception $e) {
        echo "<div style='color: red;'>❌ Error al eliminar registros: " . $e->getMessage() . "</div>";
    }
}

// Formulario para limpiar registros
if ($general_count > 0) {
    echo "<h3>Acción Recomendada:</h3>";
    echo "<div style='background-color: #e8f5e8; border: 1px solid #4caf50; padding: 15px; margin: 10px 0;'>";
    echo "<p><strong>Recomendación:</strong> Limpiar los registros 'general' para que los futuros quizzes se procesen con el mapeo mejorado.</p>";
    echo "<form method='post' onsubmit='return confirm(\"¿Estás seguro de que quieres eliminar los registros con tema general?\");'>";
    echo "<input type='hidden' name='clean_general' value='1'>";
    echo "<button type='submit' style='background-color: #4caf50; color: white; padding: 10px 20px; border: none; cursor: pointer;'>🧹 Limpiar Registros 'General'</button>";
    echo "</form>";
    echo "</div>";
}

echo "<h3>Verificación del Nuevo Mapeo:</h3>";
echo "<p>Una vez limpiados los registros 'general', puedes:</p>";
echo "<ul>";
echo "<li>📝 Realizar algunos quizzes de prueba con temas problemáticos</li>";
echo "<li>🔍 Verificar que ahora se registren correctamente en la tabla</li>";
echo "<li>📊 Usar el script <code>test-theme-mapping.php</code> para verificar el mapeo</li>";
echo "</ul>";

// Mostrar información de los temas mejorados
echo "<h3>Temas Mejorados en el Mapeo:</h3>";
echo "<div style='background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 10px 0;'>";
echo "<p>Los siguientes temas ahora tienen palabras clave adicionales:</p>";
echo "<ul>";
echo "<li>🔹 <strong>Ministerio de Defensa</strong> - Ahora incluye variaciones sin 'de'</li>";
echo "<li>🔹 <strong>Organización de las FAS</strong> - Múltiples variaciones</li>";
echo "<li>🔹 <strong>Armada Española</strong> - Incluye 'organizacion basica de la armada'</li>";
echo "<li>🔹 <strong>Carrera Militar</strong> - Incluye 'ley carrera militar'</li>";
echo "<li>🔹 <strong>Derechos y Deberes</strong> - Variaciones más específicas</li>";
echo "<li>🔹 <strong>Régimen Disciplinario</strong> - Título completo incluido</li>";
echo "<li>🔹 <strong>Igualdad Efectiva</strong> - Título completo incluido</li>";
echo "<li>🔹 <strong>Procedimiento Administrativo</strong> - Título completo incluido</li>";
echo "</ul>";
echo "</div>";

echo "<hr>";
echo "<p><em>Script ejecutado: " . date('Y-m-d H:i:s') . "</em></p>";
?> 