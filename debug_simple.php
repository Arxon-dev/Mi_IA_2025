<?php
require_once('config.php');
require_login();

// Verificar si el usuario tiene permisos de administrador
require_capability('moodle/site:config', context_system::instance());

echo "<h2>Diagnóstico Simple OpoMoodleTools</h2>";

try {
    // Verificar si la clase existe
    if (class_exists('local_opomoodletools_external')) {
        echo "<p style='color: green;'>✓ Clase encontrada</p>";
        
        // Probar diagnóstico básico
        $diagnosis = local_opomoodletools_external::diagnose_question_table_structure();
        echo "<p>Diagnóstico: " . ($diagnosis ? $diagnosis : 'null') . "</p>";
        
    } else {
        echo "<p style='color: red;'>✗ Clase NO encontrada</p>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
    echo "<p>Línea: " . $e->getLine() . "</p>";
    echo "<p>Archivo: " . $e->getFile() . "</p>";
}