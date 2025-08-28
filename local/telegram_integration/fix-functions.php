<?php
// Script para corregir las funciones que tienen el problema del UUID

$file = 'analytics.php';
$content = file_get_contents($file);

// Reemplazos específicos
$replacements = [
    // En get_learning_metrics_data
    "function get_learning_metrics_data(\$user_id) {
    // Include hybrid data functions
    require_once 'ml-analytics-hybrid.php';
    
    // Get Telegram user ID from Moodle user ID
    \$telegram_user_id = get_telegram_user_id(\$user_id);" => 
    "function get_learning_metrics_data(\$user_id) {
    // Include hybrid data functions
    require_once 'ml-analytics-hybrid.php';
    
    // \$user_id already IS the Telegram user ID (UUID)
    \$telegram_user_id = \$user_id;",
    
    // En get_optimization_data
    "function get_optimization_data(\$user_id) {
    require_once 'ml-analytics-hybrid.php';
    
    // Get Telegram user ID from Moodle user ID
    \$telegram_user_id = get_telegram_user_id(\$user_id);" => 
    "function get_optimization_data(\$user_id) {
    require_once 'ml-analytics-hybrid.php';
    
    // \$user_id already IS the Telegram user ID (UUID)
    \$telegram_user_id = \$user_id;",
    
    // En get_social_analysis_data
    "function get_social_analysis_data(\$user_id) {
    require_once 'ml-analytics-hybrid.php';
    
    // Get Telegram user ID from Moodle user ID
    \$telegram_user_id = get_telegram_user_id(\$user_id);" => 
    "function get_social_analysis_data(\$user_id) {
    require_once 'ml-analytics-hybrid.php';
    
    // \$user_id already IS the Telegram user ID (UUID)
    \$telegram_user_id = \$user_id;",
    
    // Cambiar mensajes de error
    "'error' => 'Usuario no vinculado con Telegram'," => "'error' => 'Usuario no válido',"
];

$modified = false;
foreach ($replacements as $search => $replace) {
    if (strpos($content, $search) !== false) {
        $content = str_replace($search, $replace, $content);
        $modified = true;
        echo "✅ Reemplazado: " . substr($search, 0, 50) . "...\n";
    }
}

if ($modified) {
    // Hacer backup
    copy($file, $file . '.backup.' . date('Y-m-d-H-i-s'));
    
    // Escribir archivo corregido
    file_put_contents($file, $content);
    echo "✅ Archivo corregido y guardado\n";
    echo "✅ Backup creado: $file.backup." . date('Y-m-d-H-i-s') . "\n";
} else {
    echo "❌ No se encontraron patrones para reemplazar\n";
}

echo "\n🎯 Ahora prueba:\n";
echo "1. Ve a analytics.php\n";
echo "2. Deberías ver el UUID correcto en la consola\n";
echo "3. Y datos reales en lugar de 0%\n";
?> 