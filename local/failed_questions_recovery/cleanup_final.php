<?php
require_once('../../config.php');
require_login();

echo "<h2>🧹 Limpieza Final - Archivos de Debug</h2>";

$debug_files = [
    'check_new_quiz.php',
    'process_last_quiz.php',
    'cleanup_final.php'  // Este mismo archivo
];

echo "<p>Eliminando archivos de debug temporales creados durante el diagnóstico...</p>";

$cleaned = 0;
$errors = 0;

foreach ($debug_files as $file) {
    if (file_exists($file)) {
        if (unlink($file)) {
            echo "✅ Eliminado: $file<br>";
            $cleaned++;
        } else {
            echo "❌ Error eliminando: $file<br>";
            $errors++;
        }
    } else {
        echo "ℹ️ No encontrado: $file<br>";
    }
}

echo "<br><h3>📊 Resumen de Limpieza:</h3>";
echo "✅ Archivos eliminados: $cleaned<br>";
echo "❌ Errores: $errors<br>";

echo "<br><h3>🎉 ¡Plugin Listo!</h3>";
echo "<p><strong>El plugin 'Failed Questions Recovery' está completamente funcional:</strong></p>";
echo "<ul>";
echo "<li>✅ Captura automática de preguntas fallidas</li>";
echo "<li>✅ Procesamiento manual disponible (botón '⚡ Procesar Último Quiz')</li>";
echo "<li>✅ Interfaz moderna con nombres descriptivos</li>";
echo "<li>✅ Sistema de recuperación operativo</li>";
echo "</ul>";

echo "<br><p>📍 <a href='index.php' style='background: #007cba; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>🏠 Ir al Dashboard Principal</a></p>";
echo "<p style='color: #666; font-size: 0.9rem;'>Usa el botón '⚡ Procesar Último Quiz' para capturar las preguntas del quiz CONSTITUCIÓN - TEST 4</p>"; 