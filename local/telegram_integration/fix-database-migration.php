<?php
/**
 * Script para actualizar configuración de BD después de migración
 * Cambia de u449034524_mi_ia_db a u449034524_moodel_telegra
 */

echo "🔧 Iniciando corrección de configuración de BD...\n";

// Configuración antigua y nueva
$old_config = [
    'dbname' => 'u449034524_mi_ia_db',
    'user' => 'u449034524_mi_ia'
];

$new_config = [
    'dbname' => 'u449034524_moodel_telegra',
    'user' => 'u449034524_opomelilla_25'
];

// Archivos a actualizar
$files_to_update = [
    'telegram-db-config.php',
    'db-config.php',
    'test-db-connection.php',
    'test-analytics-simple.php',
    'migrate-to-mysql.php',
    'direct-ml-bridge.php',
    'test-moodle-vs-telegram-db.php',
    'test-db-connection-detailed.php'
];

$updated_files = 0;

foreach ($files_to_update as $file) {
    $file_path = __DIR__ . '/' . $file;
    
    if (!file_exists($file_path)) {
        echo "⚠️  Archivo no encontrado: $file\n";
        continue;
    }
    
    $content = file_get_contents($file_path);
    $original_content = $content;
    
    // Reemplazar configuración de BD
    $content = str_replace($old_config['dbname'], $new_config['dbname'], $content);
    $content = str_replace($old_config['user'], $new_config['user'], $content);
    
    // Verificar si hubo cambios
    if ($content !== $original_content) {
        // Crear backup
        $backup_path = $file_path . '.backup.' . date('Y-m-d-H-i-s');
        file_put_contents($backup_path, $original_content);
        
        // Guardar archivo actualizado
        file_put_contents($file_path, $content);
        
        echo "✅ Actualizado: $file (backup: " . basename($backup_path) . ")\n";
        $updated_files++;
    } else {
        echo "ℹ️  Sin cambios: $file\n";
    }
}

echo "\n🎉 Corrección completada!\n";
echo "📊 Archivos actualizados: $updated_files\n";
echo "\n🔍 Próximos pasos:\n";
echo "1. Verificar que las tablas existen en la nueva BD\n";
echo "2. Probar conexiones con test-database-connection.php\n";
echo "3. Verificar vinculación de usuarios\n";
?>