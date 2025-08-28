<?php
// Script para probar consultas SQL corregidas
// Basado en los errores identificados en test_consultas_statistics.php

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Test de Consultas SQL Corregidas - NeuroOpositor</h1>";
echo "<p>Usuario actual: {$USER->username} (ID: {$USER->id})</p>";
echo "<hr>";

// Función para ejecutar consulta de forma segura
function ejecutar_consulta_segura($sql, $params = [], $descripcion = "") {
    global $DB;
    
    echo "<h3>{$descripcion}</h3>";
    echo "<strong>SQL:</strong> <code>{$sql}</code><br>";
    
    if (!empty($params)) {
        echo "<strong>Parámetros:</strong> " . json_encode($params) . "<br>";
    }
    
    try {
        $result = $DB->get_records_sql($sql, $params);
        echo "✓ <span style='color: green;'>Éxito:</span> " . count($result) . " registros obtenidos<br>";
        
        if (!empty($result)) {
            echo "<strong>Muestra de datos:</strong><br>";
            echo "<pre>" . print_r(array_slice($result, 0, 3, true), true) . "</pre>";
        }
        
        return $result;
    } catch (Exception $e) {
        echo "✗ <span style='color: red;'>Error:</span> " . $e->getMessage() . "<br>";
        return false;
    }
}

// Test 1: Consulta básica de temas (CORREGIDA)
echo "<h2>Test 1: Consulta Básica de Temas (Corregida)</h2>";

// Primero verificar qué columnas existen
echo "<h4>1.1 Verificando estructura de neuroopositor_temas</h4>";
try {
    $sql_estructura = "SHOW COLUMNS FROM {neuroopositor_temas}";
    $columnas = $DB->get_records_sql($sql_estructura);
    echo "✓ Columnas disponibles:<br>";
    foreach ($columnas as $columna) {
        echo "&nbsp;&nbsp;- {$columna->field} ({$columna->type})<br>";
    }
} catch (Exception $e) {
    echo "✗ Error al obtener estructura: " . $e->getMessage() . "<br>";
}

echo "<h4>1.2 Consulta con 'titulo' en lugar de 'nombre'</h4>";
$sql_temas_corregida = "SELECT id, titulo as nombre, descripcion FROM {neuroopositor_temas} ORDER BY titulo LIMIT 5";
ejecutar_consulta_segura($sql_temas_corregida, [], "Consulta de temas corregida");

echo "<hr>";

// Test 2: Verificar estructura de neuroopositor_user_progress
echo "<h2>Test 2: Estructura de neuroopositor_user_progress</h2>";

try {
    $sql_estructura_progress = "SHOW COLUMNS FROM {neuroopositor_user_progress}";
    $columnas_progress = $DB->get_records_sql($sql_estructura_progress);
    echo "✓ Columnas disponibles en neuroopositor_user_progress:<br>";
    foreach ($columnas_progress as $columna) {
        echo "&nbsp;&nbsp;- {$columna->field} ({$columna->type})<br>";
    }
} catch (Exception $e) {
    echo "✗ Error al obtener estructura: " . $e->getMessage() . "<br>";
}

echo "<hr>";

// Test 3: Consulta JOIN corregida
echo "<h2>Test 3: Consulta JOIN Corregida</h2>";

// Versión 1: Con columnas que probablemente existen
echo "<h4>3.1 JOIN con columnas básicas</h4>";
$sql_join_basica = "
    SELECT 
        t.id as tema_id, 
        t.titulo as tema_nombre,
        COUNT(up.id) as total_registros
    FROM {neuroopositor_temas} t 
    LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id AND up.userid = ?
    GROUP BY t.id, t.titulo 
    ORDER BY t.titulo 
    LIMIT 5
";
ejecutar_consulta_segura($sql_join_basica, [$USER->id], "JOIN básico corregido");

// Versión 2: Con columnas específicas si existen
echo "<h4>3.2 JOIN con columnas específicas (si existen)</h4>";

// Verificar si existe 'preguntas_correctas'
try {
    $test_columna = $DB->get_record_sql("SELECT preguntas_correctas FROM {neuroopositor_user_progress} LIMIT 1");
    echo "✓ Columna 'preguntas_correctas' existe<br>";
    
    $sql_join_especifica = "
        SELECT 
            t.id as tema_id, 
            t.titulo as tema_nombre,
            COUNT(up.id) as total_preguntas,
            SUM(up.preguntas_correctas) as correctas
        FROM {neuroopositor_temas} t 
        LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id AND up.userid = ?
        GROUP BY t.id, t.titulo 
        ORDER BY t.titulo 
        LIMIT 5
    ";
    ejecutar_consulta_segura($sql_join_especifica, [$USER->id], "JOIN con preguntas_correctas");
    
} catch (Exception $e) {
    echo "✗ Columna 'preguntas_correctas' no existe: " . $e->getMessage() . "<br>";
    
    // Probar con otras posibles columnas
    $posibles_columnas = ['correct', 'respuestas_correctas', 'aciertos', 'puntuacion'];
    
    foreach ($posibles_columnas as $columna) {
        try {
            $test = $DB->get_record_sql("SELECT {$columna} FROM {neuroopositor_user_progress} LIMIT 1");
            echo "✓ Columna '{$columna}' existe<br>";
            
            $sql_join_alternativa = "
                SELECT 
                    t.id as tema_id, 
                    t.titulo as tema_nombre,
                    COUNT(up.id) as total_preguntas,
                    SUM(up.{$columna}) as correctas
                FROM {neuroopositor_temas} t 
                LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id AND up.userid = ?
                GROUP BY t.id, t.titulo 
                ORDER BY t.titulo 
                LIMIT 5
            ";
            ejecutar_consulta_segura($sql_join_alternativa, [$USER->id], "JOIN con {$columna}");
            break;
            
        } catch (Exception $e2) {
            echo "✗ Columna '{$columna}' no existe<br>";
        }
    }
}

echo "<hr>";

// Test 4: Generar consultas corregidas para statistics.php
echo "<h2>Test 4: Generando Consultas Corregidas para Statistics.php</h2>";

$consultas_corregidas = [];

// Consulta 1: get_user_general_stats corregida
echo "<h4>4.1 get_user_general_stats corregida</h4>";

// Verificar qué columnas de tiempo existen
$columnas_tiempo = ['tiempo_estudio_segundos', 'time_spent', 'tiempo_estudio', 'duracion'];
$columna_tiempo_encontrada = null;

foreach ($columnas_tiempo as $col_tiempo) {
    try {
        $test = $DB->get_record_sql("SELECT {$col_tiempo} FROM {neuroopositor_user_progress} LIMIT 1");
        $columna_tiempo_encontrada = $col_tiempo;
        echo "✓ Columna de tiempo encontrada: '{$col_tiempo}'<br>";
        break;
    } catch (Exception $e) {
        echo "✗ Columna '{$col_tiempo}' no existe<br>";
    }
}

if ($columna_tiempo_encontrada) {
    $sql_general_stats = "
        SELECT 
            COUNT(DISTINCT up.tema_id) as topics_studied,
            AVG(up.preguntas_correctas) as accuracy,
            SUM(up.{$columna_tiempo_encontrada}) as total_study_time,
            COUNT(up.id) as total_questions,
            SUM(up.preguntas_correctas) as correct_answers
        FROM {neuroopositor_user_progress} up
        WHERE up.userid = ?
    ";
    
    if ($USER->id > 0) {
        ejecutar_consulta_segura($sql_general_stats, [$USER->id], "Estadísticas generales del usuario");
    }
    
    $consultas_corregidas['get_user_general_stats'] = $sql_general_stats;
}

echo "<hr>";

// Test 5: Crear archivo con todas las correcciones
echo "<h2>Test 5: Generando Archivo de Correcciones</h2>";

$correcciones_sql = "<?php\n";
$correcciones_sql .= "// Consultas SQL corregidas para statistics.php\n";
$correcciones_sql .= "// Generado automáticamente el " . date('Y-m-d H:i:s') . "\n\n";

$correcciones_sql .= "// MAPEO DE COLUMNAS CORREGIDAS\n";
$correcciones_sql .= "\$column_mapping = [\n";
$correcciones_sql .= "    'neuroopositor_temas' => [\n";
$correcciones_sql .= "        'nombre' => 'titulo'\n";
$correcciones_sql .= "    ],\n";
$correcciones_sql .= "    'neuroopositor_user_progress' => [\n";
$correcciones_sql .= "        'correct' => 'preguntas_correctas',\n";
if ($columna_tiempo_encontrada) {
    $correcciones_sql .= "        'time_spent' => '{$columna_tiempo_encontrada}'\n";
}
$correcciones_sql .= "    ]\n";
$correcciones_sql .= "];\n\n";

$correcciones_sql .= "// CONSULTAS CORREGIDAS\n";
foreach ($consultas_corregidas as $metodo => $sql) {
    $correcciones_sql .= "\n// {$metodo}\n";
    $correcciones_sql .= "\$sql_{$metodo} = \"" . addslashes($sql) . "\";\n";
}

$correcciones_sql .= "\n?>";

// Guardar archivo de correcciones
$archivo_correcciones = $CFG->dirroot . '/local/neuroopositor/consultas_corregidas.php';
if (file_put_contents($archivo_correcciones, $correcciones_sql)) {
    echo "✓ Archivo de correcciones guardado: consultas_corregidas.php<br>";
} else {
    echo "✗ Error al guardar archivo de correcciones<br>";
}

echo "<hr>";
echo "<h2>Resumen Final</h2>";
echo "<p><strong>Correcciones identificadas:</strong></p>";
echo "<ul>";
echo "<li>Cambiar 'nombre' por 'titulo' en neuroopositor_temas</li>";
echo "<li>Cambiar 'correct' por 'preguntas_correctas' en neuroopositor_user_progress</li>";
if ($columna_tiempo_encontrada) {
    echo "<li>Usar '{$columna_tiempo_encontrada}' para tiempo de estudio</li>";
}
echo "</ul>";

echo "<p><strong>Archivos generados:</strong></p>";
echo "<ul>";
echo "<li>consultas_corregidas.php - Mapeo de columnas y consultas corregidas</li>";
echo "</ul>";

echo "<p><strong>Siguiente paso:</strong> Aplicar estas correcciones al archivo statistics.php</p>";

echo "<hr>";
echo "<p><strong>Test completado:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Usuario:</strong> {$USER->username} (ID: {$USER->id})</p>";
?>