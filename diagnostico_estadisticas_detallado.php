<?php
// Diagnóstico detallado para el error de estadísticas en NeuroOpositor
// Este script debe subirse al hosting para diagnosticar el problema

require_once('../../config.php');
require_once($CFG->libdir.'/adminlib.php');

// Verificar que el usuario esté logueado
require_login();

// Configurar para mostrar errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h2>Diagnóstico Detallado - NeuroOpositor Estadísticas</h2>";
echo "<hr>";

// 1. Verificar conexión a la base de datos
echo "<h3>1. Verificación de Conexión a Base de Datos</h3>";
try {
    $dbinfo = $DB->get_manager()->get_install_xml_schema();
    echo "✓ Conexión a base de datos exitosa<br>";
    echo "Tipo de BD: " . $CFG->dbtype . "<br>";
    echo "Host: " . $CFG->dbhost . "<br>";
    echo "Prefijo de tablas: " . $CFG->prefix . "<br>";
} catch (Exception $e) {
    echo "✗ Error de conexión: " . $e->getMessage() . "<br>";
}

echo "<hr>";

// 2. Verificar existencia de tablas
echo "<h3>2. Verificación de Tablas NeuroOpositor</h3>";
$required_tables = [
    'neuroopositor_temas',
    'neuroopositor_user_progress', 
    'neuroopositor_connections',
    'neuroopositor_neural_paths',
    'neuroopositor_question_mapping',
    'neuroopositor_user_responses',
    'neuroopositor_ai_recommendations',
    'neuroopositor_study_sessions'
];

foreach ($required_tables as $table) {
    try {
        $exists = $DB->get_manager()->table_exists($table);
        if ($exists) {
            $count = $DB->count_records($table);
            echo "✓ Tabla {$table}: Existe ({$count} registros)<br>";
        } else {
            echo "✗ Tabla {$table}: NO EXISTE<br>";
        }
    } catch (Exception $e) {
        echo "✗ Error verificando tabla {$table}: " . $e->getMessage() . "<br>";
    }
}

echo "<hr>";

// 3. Verificar estructura de tabla neuroopositor_temas
echo "<h3>3. Estructura de Tabla neuroopositor_temas</h3>";
try {
    $sql = "DESCRIBE {neuroopositor_temas}";
    $columns = $DB->get_records_sql($sql);
    if ($columns) {
        echo "<table border='1'>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Default</th></tr>";
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>" . $column->field . "</td>";
            echo "<td>" . $column->type . "</td>";
            echo "<td>" . $column->null . "</td>";
            echo "<td>" . $column->key . "</td>";
            echo "<td>" . $column->default . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "No se pudo obtener la estructura de la tabla<br>";
    }
} catch (Exception $e) {
    echo "Error obteniendo estructura: " . $e->getMessage() . "<br>";
}

echo "<hr>";

// 4. Probar consultas específicas de statistics.php
echo "<h3>4. Pruebas de Consultas Específicas</h3>";

// Consulta 1: Obtener temas
echo "<h4>4.1 Consulta de Temas</h4>";
try {
    $sql = "SELECT id, nombre, descripcion FROM {neuroopositor_temas} ORDER BY nombre";
    $temas = $DB->get_records_sql($sql);
    echo "✓ Consulta de temas exitosa. Encontrados: " . count($temas) . " temas<br>";
    if (count($temas) > 0) {
        echo "Primer tema: " . reset($temas)->nombre . "<br>";
    }
} catch (Exception $e) {
    echo "✗ Error en consulta de temas: " . $e->getMessage() . "<br>";
}

// Consulta 2: Progreso del usuario
echo "<h4>4.2 Consulta de Progreso de Usuario</h4>";
try {
    $userid = $USER->id;
    $sql = "SELECT COUNT(*) as total FROM {neuroopositor_user_progress} WHERE userid = ?";
    $progress_count = $DB->get_field_sql($sql, [$userid]);
    echo "✓ Consulta de progreso exitosa. Registros para usuario {$userid}: {$progress_count}<br>";
} catch (Exception $e) {
    echo "✗ Error en consulta de progreso: " . $e->getMessage() . "<br>";
}

// Consulta 3: Estadísticas por tema (similar a get_user_general_stats)
echo "<h4>4.3 Consulta de Estadísticas por Tema</h4>";
try {
    $userid = $USER->id;
    $sql = "SELECT 
                t.id as tema_id,
                t.nombre as tema_nombre,
                COUNT(up.id) as total_preguntas,
                SUM(CASE WHEN up.correct = 1 THEN 1 ELSE 0 END) as correctas,
                AVG(up.time_spent) as tiempo_promedio
            FROM {neuroopositor_temas} t
            LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id AND up.userid = ?
            GROUP BY t.id, t.nombre
            ORDER BY t.nombre";
    
    $stats = $DB->get_records_sql($sql, [$userid]);
    echo "✓ Consulta de estadísticas por tema exitosa. Temas procesados: " . count($stats) . "<br>";
    
    if (count($stats) > 0) {
        echo "<table border='1'>";
        echo "<tr><th>Tema</th><th>Total Preguntas</th><th>Correctas</th><th>Tiempo Promedio</th></tr>";
        $count = 0;
        foreach ($stats as $stat) {
            if ($count >= 3) break; // Solo mostrar primeros 3
            echo "<tr>";
            echo "<td>" . $stat->tema_nombre . "</td>";
            echo "<td>" . $stat->total_preguntas . "</td>";
            echo "<td>" . $stat->correctas . "</td>";
            echo "<td>" . round($stat->tiempo_promedio, 2) . "</td>";
            echo "</tr>";
            $count++;
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "✗ Error en consulta de estadísticas por tema: " . $e->getMessage() . "<br>";
    echo "Detalles del error: " . $e->getTraceAsString() . "<br>";
}

echo "<hr>";

// 5. Verificar la clase statistics
echo "<h3>5. Verificación de Clase Statistics</h3>";
try {
    require_once($CFG->dirroot . '/local/neuroopositor/classes/statistics.php');
    echo "✓ Archivo statistics.php cargado correctamente<br>";
    
    if (class_exists('\\local_neuroopositor\\statistics')) {
        echo "✓ Clase statistics existe<br>";
        
        $stats = new \local_neuroopositor\statistics();
        echo "✓ Instancia de statistics creada<br>";
        
        // Probar método get_user_general_stats
        try {
            $general_stats = $stats->get_user_general_stats($USER->id);
            echo "✓ Método get_user_general_stats ejecutado correctamente<br>";
            echo "Datos devueltos: " . json_encode($general_stats) . "<br>";
        } catch (Exception $e) {
            echo "✗ Error en get_user_general_stats: " . $e->getMessage() . "<br>";
            echo "Línea del error: " . $e->getLine() . "<br>";
            echo "Archivo del error: " . $e->getFile() . "<br>";
        }
        
    } else {
        echo "✗ Clase statistics no existe<br>";
    }
} catch (Exception $e) {
    echo "✗ Error cargando statistics.php: " . $e->getMessage() . "<br>";
}

echo "<hr>";
echo "<h3>Diagnóstico Completado</h3>";
echo "Fecha: " . date('Y-m-d H:i:s') . "<br>";
echo "Usuario: " . $USER->username . " (ID: " . $USER->id . ")<br>";
?>