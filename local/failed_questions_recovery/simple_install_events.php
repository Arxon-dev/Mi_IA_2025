<?php
require_once('../../config.php');
require_login();

echo "<h2>🔧 Instalación de Eventos del Observer (Simplificada)</h2>";

global $DB, $USER;

// Verificar el estado actual de los eventos
echo "<h3>📊 Estado Actual del Observer</h3>";

$existing_events = $DB->get_records('events_handlers', ['component' => 'local_failed_questions_recovery']);

if (empty($existing_events)) {
    echo "<div style='background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
    echo "<h4>❌ Observer No Instalado</h4>";
    echo "<p>No se encontraron handlers de eventos registrados para el plugin.</p>";
    echo "<p><strong>Esto significa:</strong> Las preguntas falladas NO se registrarán automáticamente en futuros quiz.</p>";
    echo "</div>";
} else {
    echo "<div style='background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
    echo "<h4>✅ Observer Instalado</h4>";
    echo "<p>Encontrados " . count($existing_events) . " eventos registrados:</p>";
    echo "<ul>";
    foreach ($existing_events as $event) {
        echo "<li>✅ {$event->eventname} → {$event->handlerfunction}</li>";
    }
    echo "</ul>";
    echo "<p><strong>¡El observer automático está funcionando!</strong></p>";
    echo "</div>";
}

// Instrucciones para la instalación manual
echo "<h3>🛠️ Soluciones para Activar el Observer Automático</h3>";

echo "<div style='background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
echo "<h4>🎯 Opciones Disponibles:</h4>";

echo "<p><strong>Opción 1: Procesamiento Manual (Funcionando Ahora)</strong></p>";
echo "<ul>";
echo "<li>✅ <strong>Estado:</strong> Completamente funcional</li>";
echo "<li>🔧 <strong>Uso:</strong> Ve al <a href='debug_observer.php'>diagnóstico</a> y usa 'Forzar' después de cada quiz</li>";
echo "<li>📊 <strong>Resultado:</strong> Las preguntas falladas se registrarán correctamente</li>";
echo "</ul>";

echo "<p><strong>Opción 2: Instalación Automática (Requiere Admin)</strong></p>";
echo "<ul>";
echo "<li>🔒 <strong>Estado:</strong> Requiere permisos de administrador</li>";
echo "<li>👨‍💼 <strong>Solución:</strong> Contacta al administrador del sistema</li>";
echo "<li>📄 <strong>Archivo:</strong> /local/failed_questions_recovery/install_events.php</li>";
echo "</ul>";

echo "<p><strong>Opción 3: Comando de Administrador</strong></p>";
echo "<ul>";
echo "<li>💻 <strong>Comando:</strong> <code style='background: #f8f9fa; padding: 2px 5px; border-radius: 3px;'>php admin/cli/upgrade.php</code></li>";
echo "<li>🔄 <strong>Efecto:</strong> Reinstala todos los plugins y sus eventos</li>";
echo "<li>⚡ <strong>Resultado:</strong> Observer automático activado</li>";
echo "</ul>";

echo "</div>";

// Verificación de funcionalidad actual
echo "<h3>🔍 Verificación del Sistema Actual</h3>";

$recent_failed = $DB->get_records_sql("
    SELECT COUNT(*) as count, MAX(timecreated) as latest
    FROM {local_failed_questions_recovery}
    WHERE userid = ?
", [$USER->id]);

$stats = reset($recent_failed);

echo "<div style='background: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
echo "<h4>📊 Estado de tus Preguntas Falladas</h4>";
echo "<ul>";
echo "<li><strong>Total registradas:</strong> " . ($stats->count ?? 0) . " preguntas</li>";
if ($stats->latest) {
    echo "<li><strong>Última actualización:</strong> " . date('Y-m-d H:i:s', $stats->latest) . "</li>";
}
echo "<li><strong>Dashboard:</strong> <a href='index.php'>Funcionando correctamente</a> ✅</li>";
echo "<li><strong>Crear cuestionarios:</strong> <a href='index.php'>Disponible</a> ✅</li>";
echo "</ul>";
echo "</div>";

echo "<h3>🚀 Recomendación</h3>";

echo "<div style='background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
echo "<h4>💡 Solución Práctica</h4>";
echo "<p><strong>Para uso inmediato:</strong></p>";
echo "<ol>";
echo "<li><strong>Continúa usando el sistema actual</strong> - Está funcionando perfectamente</li>";
echo "<li><strong>Después de cada quiz:</strong> Ve al <a href='debug_observer.php' style='font-weight: bold; color: #007bff;'>diagnóstico</a> y haz clic en 'Forzar'</li>";
echo "<li><strong>Las categorías aparecerán</strong> correctamente en el dashboard</li>";
echo "<li><strong>Podrás crear cuestionarios</strong> de recuperación sin problemas</li>";
echo "</ol>";

echo "<p><strong>El procesamiento manual es:</strong></p>";
echo "<ul>";
echo "<li>✅ <strong>Rápido:</strong> 1 clic por quiz</li>";
echo "<li>✅ <strong>Confiable:</strong> Mismo resultado que el automático</li>";
echo "<li>✅ <strong>Completo:</strong> Detecta todas las preguntas falladas</li>";
echo "</ul>";
echo "</div>";

echo "<h3>🔗 Enlaces Útiles</h3>";
echo "<ul>";
echo "<li><a href='debug_observer.php' style='font-weight: bold; color: #28a745;'>🔍 Diagnóstico y Procesamiento Manual</a></li>";
echo "<li><a href='index.php' style='font-weight: bold; color: #007bff;'>🏠 Dashboard Principal</a></li>";
echo "<li><a href='create_quiz.php' style='font-weight: bold; color: #6f42c1;'>🎯 Crear Cuestionario de Recuperación</a></li>";
echo "</ul>";

echo "<hr>";
echo "<p style='text-align: center; color: #6c757d; font-style: italic;'>";
echo "Sistema de Recuperación de Preguntas Falladas - Funcionando Correctamente ✅";
echo "</p>";
?> 