<?php
// Test different database connection methods
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Check authentication first
if (!isloggedin() || isguestuser()) {
    echo "<h1>❌ Usuario no autenticado</h1>";
    echo '<a href="' . $CFG->wwwroot . '/login/index.php">Iniciar Sesión</a><br>';
    exit;
}

echo "<h1>🔍 Test de Métodos de Conexión a BD</h1>";
echo "<h2>✅ Usuario autenticado: {$USER->firstname} {$USER->lastname}</h2>";

$telegram_user_id = get_telegram_user_id($USER->id);
echo "<h3>Telegram User ID: " . ($telegram_user_id ?: "❌ NO ENCONTRADO") . "</h3>";

if (!$telegram_user_id) {
    echo "<p>❌ Sin Telegram ID, no se pueden hacer pruebas de datos</p>";
    exit;
}

global $DB, $CFG;

echo "<h2>🗄️ Información de Configuración</h2>";
echo "<ul>";
echo "<li><strong>DB Type:</strong> " . $CFG->dbtype . "</li>";
echo "<li><strong>DB Host:</strong> " . $CFG->dbhost . "</li>";
echo "<li><strong>DB Name:</strong> " . $CFG->dbname . "</li>";
echo "<li><strong>Prefix:</strong> " . ($CFG->prefix ?: 'Sin prefijo') . "</li>";
echo "</ul>";

echo "<h2>🧪 Método 1: Conexión Moodle Estándar</h2>";
try {
    // Test basic Moodle DB connection
    $test_query = "SELECT 1 as test";
    $result = $DB->get_record_sql($test_query);
    echo "<p>✅ Conexión básica funciona: " . $result->test . "</p>";
    
    // Try to count records in a known table
    $user_count = $DB->count_records('user');
    echo "<p>✅ Usuarios en sistema: $user_count</p>";
    
} catch (Exception $e) {
    echo "<p>❌ Error método 1: " . $e->getMessage() . "</p>";
}

echo "<h2>🧪 Método 2: Búsqueda de tabla telegramresponse</h2>";
try {
    // Try different variations of table name
    $variations = [
        'telegramresponse',
        $CFG->prefix . 'telegramresponse',
        'mdl_telegramresponse',
        'local_telegramresponse'
    ];
    
    foreach ($variations as $table_name) {
        echo "<h4>Probando tabla: '$table_name'</h4>";
        try {
            $count = $DB->count_records($table_name);
            echo "<p>✅ Tabla '$table_name' existe con $count registros</p>";
            
            // If found, try to get sample data
            if ($count > 0) {
                $sample = $DB->get_records($table_name, [], '', '*', 0, 3);
                echo "<h5>📝 Muestra de datos:</h5>";
                echo "<pre>" . print_r($sample, true) . "</pre>";
            }
            break; // Found the table, stop trying
        } catch (Exception $e) {
            echo "<p>❌ Tabla '$table_name' no existe o error: " . $e->getMessage() . "</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error método 2: " . $e->getMessage() . "</p>";
}

echo "<h2>🧪 Método 3: Conexión PDO Directa</h2>";
try {
    // Try PDO connection using Moodle's config
    $dsn = $CFG->dbtype . ":host=" . $CFG->dbhost . ";dbname=" . $CFG->dbname;
    if (isset($CFG->dbport) && $CFG->dbport) {
        $dsn .= ";port=" . $CFG->dbport;
    }
    
    echo "<p>DSN: $dsn</p>";
    
    $pdo = new PDO($dsn, $CFG->dbuser, $CFG->dbpass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p>✅ Conexión PDO exitosa</p>";
    
    // Try to list tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<p>📋 Tablas encontradas: " . count($tables) . "</p>";
    
    // Look for telegram tables
    $telegram_tables = array_filter($tables, function($table) {
        return stripos($table, 'telegram') !== false;
    });
    
    if (!empty($telegram_tables)) {
        echo "<h4>📱 Tablas Telegram encontradas:</h4>";
        foreach ($telegram_tables as $table) {
            echo "<p>• $table</p>";
            
            // Try to get count
            try {
                $stmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
                $count = $stmt->fetchColumn();
                echo "<p>  → $count registros</p>";
            } catch (Exception $e) {
                echo "<p>  → Error contando: " . $e->getMessage() . "</p>";
            }
        }
    } else {
        echo "<p>❌ No se encontraron tablas Telegram con PDO</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error método 3: " . $e->getMessage() . "</p>";
}

echo "<h2>🧪 Método 4: Consulta SQL Raw</h2>";
try {
    // Try raw SQL with different approaches
    $sql_variations = [
        "SELECT COUNT(*) as count FROM telegramresponse WHERE userid = ?",
        "SELECT COUNT(*) as count FROM {telegramresponse} WHERE userid = ?",
        "SELECT COUNT(*) as count FROM mdl_telegramresponse WHERE userid = ?",
    ];
    
    foreach ($sql_variations as $i => $sql) {
        echo "<h4>SQL Variación " . ($i+1) . ":</h4>";
        echo "<p><code>$sql</code></p>";
        
        try {
            $result = $DB->get_record_sql($sql, [$telegram_user_id]);
            echo "<p>✅ Éxito: " . $result->count . " registros para usuario $telegram_user_id</p>";
            break; // Found working query
        } catch (Exception $e) {
            echo "<p>❌ Error: " . $e->getMessage() . "</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error método 4: " . $e->getMessage() . "</p>";
}

echo "<h2>✅ Test completado</h2>";
echo "<p><strong>Por favor, comparte estos resultados para identificar el método correcto de conexión.</strong></p>";
?> 