<?php
/**
 * CORRECCIÓN FINAL CON RUTA CORRECTA - Observer.php
 * Elimina líneas problemáticas específicas con ruta absoluta
 */

require_once('../../config.php');
require_login();

echo "<h2>🔧 Corrección Final con Ruta Correcta - Observer.php</h2>";

// RUTA CORRECTA ABSOLUTA
$observer_file = 'e:\\OpoMelilla_2025\\Trae_AI\\Mi_IA_2025\\local\\telegram_integration\\classes\\observer.php';

if (!file_exists($observer_file)) {
    die("❌ Error: No se encuentra el archivo observer.php en: {$observer_file}");
}

echo "✅ Archivo encontrado: {$observer_file}<br>";

// 1. Crear backup
$backup_file = $observer_file . '.backup-final-' . date('Y-m-d-H-i-s');
copy($observer_file, $backup_file);
echo "✅ Backup creado: " . basename($backup_file) . "<br>";

// 2. Leer líneas del archivo
$lines = file($observer_file, FILE_IGNORE_NEW_LINES);
echo "📄 Archivo leído: " . count($lines) . " líneas<br>";

// 3. Procesar líneas específicas
$fixed_lines = [];
$corrections_made = 0;
$skip_next = 0;

foreach ($lines as $line_num => $line) {
    $line_number = $line_num + 1; // 1-indexed
    
    // Si debemos saltar líneas
    if ($skip_next > 0) {
        $skip_next--;
        echo "🔧 Línea {$line_number}: Saltando línea de conexión PDO<br>";
        continue;
    }
    
    // CORRECCIÓN 1: Eliminar comentario problemático específico
    if (trim($line) === '// Reemplazar líneas 137-140') {
        echo "🔧 Línea {$line_number}: ✅ Eliminando comentario problemático<br>";
        $corrections_made++;
        continue; // Saltar esta línea
    }
    
    // CORRECCIÓN 2: Reemplazar conexiones PDO directas
    if (strpos($line, '\$pdo = new \\PDO(') !== false && 
        strpos($line, '\$CFG->dbhost') !== false) {
        echo "🔧 Línea {$line_number}: ✅ Corrigiendo conexión PDO<br>";
        $fixed_lines[] = "            // ✅ USAR CONFIGURACIÓN CENTRALIZADA";
        $fixed_lines[] = "            require_once(__DIR__ . '/../config/database.php');";
        $fixed_lines[] = "            \$pdo = get_telegram_db_connection();";
        $corrections_made++;
        
        // Saltar las siguientes 3 líneas de la conexión PDO original
        $skip_next = 3;
        continue;
    }
    
    // CORRECCIÓN 3: Saltar líneas de setAttribute PDO
    if (strpos($line, '\$pdo->setAttribute(\\PDO::ATTR_ERRMODE') !== false) {
        echo "🔧 Línea {$line_number}: ✅ Eliminando setAttribute innecesario<br>";
        $corrections_made++;
        continue;
    }
    
    // Mantener línea original
    $fixed_lines[] = $line;
}

echo "<h3>📊 Correcciones Aplicadas: {$corrections_made}</h3>";

if ($corrections_made > 0) {
    // 4. Guardar archivo corregido
    file_put_contents($observer_file, implode("\n", $fixed_lines) . "\n");
    echo "✅ Archivo observer.php corregido y guardado<br>";
    
    // 5. Limpiar caché
    try {
        purge_all_caches();
        echo "✅ Cache de Moodle limpiado<br>";
    } catch (Exception $e) {
        echo "⚠️ Error al limpiar caché: " . $e->getMessage() . "<br>";
    }
    
    echo "<h3>🎯 Verificación Final:</h3>";
    echo "<a href='debug-observer-issue.php' target='_blank'>🔍 Verificar sintaxis corregida</a><br>";
    echo "<a href='/mod/quiz/view.php' target='_blank'>📝 Probar con cuestionario</a><br>";
    
    echo "<hr>";
    echo "<h4>✅ Resultado Esperado:</h4>";
    echo "• Error 'unexpected token private' eliminado<br>";
    echo "• Conexiones PDO centralizadas<br>";
    echo "• Código limpio y funcional<br>";
} else {
    echo "<h3>⚠️ No se encontraron líneas para corregir</h3>";
    echo "<p>Esto puede significar que:</p>";
    echo "<ul>";
    echo "<li>El archivo ya está corregido</li>";
    echo "<li>Las líneas problemáticas tienen un formato diferente</li>";
    echo "</ul>";
    
    echo "<h4>🔍 Diagnóstico de las primeras 10 líneas:</h4>";
    for ($i = 130; $i < 140 && $i < count($lines); $i++) {
        $line_num = $i + 1;
        echo "Línea {$line_num}: " . htmlspecialchars($lines[$i]) . "<br>";
    }
}
?>