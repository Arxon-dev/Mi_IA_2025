<?php
require_once('../../config.php');
require_once('locallib.php');

echo "<h2>🔍 Debug de Detección Paso a Paso</h2>";

// Temas problemáticos específicos
$problematic_themes = [
    'Régimen Jurídico del Sector Público',
    'Constitución Española', 
    'Ejército de Tierra',
    'Ejército del Aire',
    'Unión Europea',
    'Organización de las FAS'
];

foreach ($problematic_themes as $theme) {
    echo "<h3>🔍 Analizando: <strong>{$theme}</strong></h3>";
    
    // Mostrar transformaciones paso a paso
    $original = $theme;
    $step1 = strtoupper(trim($theme));
    $step2 = str_replace(array('Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ'), 
                        array('A', 'E', 'I', 'O', 'U', 'N'), $step1);
    
    echo "<p>📋 Transformaciones:</p>";
    echo "<p>1. Original: <code>{$original}</code></p>";
    echo "<p>2. Mayúsculas: <code>{$step1}</code></p>";
    echo "<p>3. Sin acentos: <code>{$step2}</code></p>";
    
    // Probar patrones manualmente
    echo "<p>🎯 Probando patrones:</p>";
    
    $test_patterns = [
        'RÉGIMEN JURÍDICO DEL SECTOR PÚBLICO',
        'REGIMEN JURIDICO DEL SECTOR PUBLICO',
        'REGIMEN JURIDICO',
        'CONSTITUCIÓN ESPAÑOLA',
        'CONSTITUCION ESPAÑOLA',
        'CONSTITUCION ESPANOLA',
        'CONSTITUCIÓN',
        'CONSTITUCION',
        'EJÉRCITO DE TIERRA',
        'EJERCITO DE TIERRA',
        'EJERCITO TIERRA',
        'EJÉRCITO DEL AIRE',
        'EJERCITO DEL AIRE',
        'EJERCITO AIRE',
        'UNIÓN EUROPEA',
        'UNION EUROPEA',
        'ORGANIZACIÓN DE LAS FAS',
        'ORGANIZACION DE LAS FAS',
        'ORGANIZACION FAS',
        'ORGANIZACIÓN FAS'
    ];
    
    echo "<ul>";
    foreach ($test_patterns as $pattern) {
        $normalized_pattern = str_replace(array('Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ'), 
                                        array('A', 'E', 'I', 'O', 'U', 'N'), $pattern);
        
        $match = (strpos($step2, $normalized_pattern) !== false);
        $status = $match ? "✅ COINCIDE" : "❌ NO COINCIDE";
        
        echo "<li><code>{$pattern}</code> → <code>{$normalized_pattern}</code> → {$status}</li>";
    }
    echo "</ul>";
    
    // Resultado final
    $detected = telegram_extract_topic_from_name($theme);
    $final_status = $detected ? "✅ DETECTADO: {$detected}" : "❌ NO DETECTADO";
    
    echo "<p>🎯 <strong>Resultado final: {$final_status}</strong></p>";
    echo "<hr>";
}

echo "<p>🎉 Debug completado</p>";
?> 