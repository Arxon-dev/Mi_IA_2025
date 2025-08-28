<?php
// Test específico de las consultas SQL de statistics.php
// Este script debe subirse al hosting para identificar el problema exacto

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Test de Consultas SQL - Statistics.php</h2>";
echo "Usuario actual: " . $USER->username . " (ID: " . $USER->id . ")<br><br>";

// Test 1: Consulta básica de temas
echo "<h3>Test 1: Consulta básica de temas</h3>";
try {
    $sql = "SELECT id, nombre FROM {neuroopositor_temas} LIMIT 5";
    $result = $DB->get_records_sql($sql);
    echo "✓ Éxito: " . count($result) . " temas encontrados<br>";
    foreach ($result as $tema) {
        echo "- ID: {$tema->id}, Nombre: {$tema->nombre}<br>";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "<br>";
}
echo "<hr>";

// Test 2: Consulta de progreso del usuario
echo "<h3>Test 2: Progreso del usuario actual</h3>";
try {
    $sql = "SELECT COUNT(*) as total FROM {neuroopositor_user_progress} WHERE userid = ?";
    $count = $DB->get_field_sql($sql, [$USER->id]);
    echo "✓ Éxito: {$count} registros de progreso para el usuario<br>";
    
    if ($count > 0) {
        $sql2 = "SELECT * FROM {neuroopositor_user_progress} WHERE userid = ? LIMIT 3";
        $progress = $DB->get_records_sql($sql2, [$USER->id]);
        echo "Primeros registros:<br>";
        foreach ($progress as $p) {
            echo "- Tema ID: {$p->tema_id}, Correcto: {$p->correct}, Tiempo: {$p->time_spent}<br>";
        }
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "<br>";
}
echo "<hr>";

// Test 3: Consulta JOIN como en get_user_general_stats
echo "<h3>Test 3: Consulta JOIN (get_user_general_stats)</h3>";
try {
    $sql = "SELECT 
                t.id as tema_id,
                t.nombre as tema_nombre,
                COUNT(up.id) as total_preguntas,
                SUM(CASE WHEN up.correct = 1 THEN 1 ELSE 0 END) as correctas
            FROM {neuroopositor_temas} t
            LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id AND up.userid = ?
            GROUP BY t.id, t.nombre
            ORDER BY t.nombre
            LIMIT 5";
    
    $result = $DB->get_records_sql($sql, [$USER->id]);
    echo "✓ Éxito: " . count($result) . " registros obtenidos<br>";
    
    echo "<table border='1'><tr><th>Tema</th><th>Total</th><th>Correctas</th></tr>";
    foreach ($result as $r) {
        echo "<tr><td>{$r->tema_nombre}</td><td>{$r->total_preguntas}</td><td>{$r->correctas}</td></tr>";
    }
    echo "</table>";
} catch (Exception $e) {
    echo "✗ Error en JOIN: " . $e->getMessage() . "<br>";
    echo "SQL que falló: " . $sql . "<br>";
}
echo "<hr>";

// Test 4: Verificar columnas específicas
echo "<h3>Test 4: Verificación de columnas</h3>";
$tables_to_check = [
    'neuroopositor_temas' => ['id', 'nombre', 'descripcion'],
    'neuroopositor_user_progress' => ['id', 'userid', 'tema_id', 'correct', 'time_spent']
];

foreach ($tables_to_check as $table => $columns) {
    echo "<strong>Tabla: {$table}</strong><br>";
    foreach ($columns as $column) {
        try {
            $sql = "SELECT {$column} FROM {{$table}} LIMIT 1";
            $DB->get_field_sql($sql);
            echo "✓ Columna '{$column}' existe<br>";
        } catch (Exception $e) {
            echo "✗ Columna '{$column}' ERROR: " . $e->getMessage() . "<br>";
        }
    }
    echo "<br>";
}
echo "<hr>";

// Test 5: Probar método específico de statistics
echo "<h3>Test 5: Método get_user_general_stats</h3>";
try {
    require_once($CFG->dirroot . '/local/neuroopositor/classes/statistics.php');
    $stats = new \local_neuroopositor\statistics();
    
    echo "Ejecutando get_user_general_stats({$USER->id})...<br>";
    $result = $stats->get_user_general_stats($USER->id);
    
    echo "✓ Método ejecutado correctamente<br>";
    echo "Resultado: <pre>" . print_r($result, true) . "</pre>";
    
} catch (Exception $e) {
    echo "✗ Error en método: " . $e->getMessage() . "<br>";
    echo "Archivo: " . $e->getFile() . "<br>";
    echo "Línea: " . $e->getLine() . "<br>";
    echo "Trace: <pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";
echo "<p><strong>Test completado: " . date('Y-m-d H:i:s') . "</strong></p>";
?>