<?php
// Database tables diagnostic
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

// Check authentication first
if (!isloggedin() || isguestuser()) {
    echo "<h1>❌ Usuario no autenticado</h1>";
    echo '<a href="' . $CFG->wwwroot . '/login/index.php">Iniciar Sesión</a><br>';
    exit;
}

echo "<h1>🔍 Diagnóstico de Tablas de Base de Datos</h1>";
echo "<h2>✅ Usuario autenticado: {$USER->firstname} {$USER->lastname}</h2>";

// Get telegram user ID
$telegram_user_id = get_telegram_user_id($USER->id);
echo "<h3>Telegram User ID: " . ($telegram_user_id ?: "❌ NO ENCONTRADO") . "</h3>";

echo "<h2>🗄️ Información de Base de Datos</h2>";
global $DB, $CFG;

echo "<ul>";
echo "<li><strong>DB Type:</strong> " . $CFG->dbtype . "</li>";
echo "<li><strong>DB Host:</strong> " . $CFG->dbhost . "</li>";
echo "<li><strong>DB Name:</strong> " . $CFG->dbname . "</li>";
echo "<li><strong>DB User:</strong> " . $CFG->dbuser . "</li>";
echo "<li><strong>Table Prefix:</strong> " . ($CFG->prefix ?: 'Sin prefijo') . "</li>";
echo "</ul>";

echo "<h2>🔍 Búsqueda de Tablas Telegram</h2>";

try {
    // Get all tables
    $tables = $DB->get_tables();
    
    echo "<h3>📋 Todas las tablas disponibles (" . count($tables) . " total):</h3>";
    
    // Filter telegram-related tables
    $telegram_tables = [];
    foreach ($tables as $table) {
        if (stripos($table, 'telegram') !== false) {
            $telegram_tables[] = $table;
        }
    }
    
    if (!empty($telegram_tables)) {
        echo "<h4>📱 Tablas relacionadas con Telegram:</h4>";
        echo "<ul>";
        foreach ($telegram_tables as $table) {
            echo "<li><strong>$table</strong>";
            
            // Try to get record count
            try {
                $count = $DB->count_records($table);
                echo " - $count registros";
            } catch (Exception $e) {
                echo " - Error contando registros: " . $e->getMessage();
            }
            echo "</li>";
        }
        echo "</ul>";
        
        // Show structure of first telegram table
        if (!empty($telegram_tables)) {
            $first_table = $telegram_tables[0];
            echo "<h4>🏗️ Estructura de tabla '$first_table':</h4>";
            try {
                $columns = $DB->get_columns($first_table);
                echo "<table border='1' style='border-collapse: collapse;'>";
                echo "<tr><th>Columna</th><th>Tipo</th><th>Nulo</th><th>Por Defecto</th></tr>";
                foreach ($columns as $column) {
                    echo "<tr>";
                    echo "<td>" . $column->name . "</td>";
                    echo "<td>" . $column->type . "</td>";
                    echo "<td>" . ($column->not_null ? 'NO' : 'SÍ') . "</td>";
                    echo "<td>" . ($column->default_value ?: 'NULL') . "</td>";
                    echo "</tr>";
                }
                echo "</table>";
            } catch (Exception $e) {
                echo "<p>❌ Error obteniendo estructura: " . $e->getMessage() . "</p>";
            }
        }
    } else {
        echo "<p>❌ No se encontraron tablas relacionadas con Telegram</p>";
    }
    
    // Search for specific table names we expect
    echo "<h3>🎯 Búsqueda de tablas específicas:</h3>";
    $expected_tables = [
        'telegramresponse',
        'telegramuser', 
        'telegrampoll',
        'telegrampollmapping',
        'local_telegram_verification',
        'user_analytics'
    ];
    
    foreach ($expected_tables as $expected) {
        $exists = in_array($expected, $tables);
        echo "<p>" . ($exists ? "✅" : "❌") . " <strong>$expected</strong>";
        
        if ($exists) {
            try {
                $count = $DB->count_records($expected);
                echo " - $count registros";
            } catch (Exception $e) {
                echo " - Error: " . $e->getMessage();
            }
        }
        echo "</p>";
    }
    
    // Try to find tables with specific patterns
    echo "<h3>🔎 Tablas con patrones específicos:</h3>";
    $patterns = ['response', 'user', 'poll', 'verification', 'analytics'];
    
    foreach ($patterns as $pattern) {
        echo "<h4>Patrón '$pattern':</h4>";
        $found = false;
        foreach ($tables as $table) {
            if (stripos($table, $pattern) !== false) {
                echo "<p>• $table</p>";
                $found = true;
            }
        }
        if (!$found) {
            echo "<p>❌ No se encontraron tablas con este patrón</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error accediendo a la base de datos: " . $e->getMessage() . "</p>";
}

echo "<h2>✅ Diagnóstico completado</h2>";
?> 