<?php
// Script para diagnosticar la estructura real de las tablas NeuroOpositor

require_once('config.php');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Diagnóstico de Estructura de Tablas NeuroOpositor</h2>";
echo "<pre>";

// Verificar login
require_login();
echo "Usuario logueado: {$USER->username} (ID: {$USER->id})\n\n";

// Lista de tablas a verificar
$tables_to_check = [
    'neuroopositor_temas',
    'neuroopositor_user_progress',
    'neuroopositor_connections',
    'neuroopositor_neural_paths',
    'neuroopositor_question_mapping',
    'neuroopositor_user_responses',
    'neuroopositor_ai_recommendations',
    'neuroopositor_study_sessions'
];

echo "Verificando estructura de tablas:\n";
echo "=================================\n";

foreach ($tables_to_check as $table) {
    echo "\nTabla: {$table}\n";
    echo str_repeat('-', 50) . "\n";
    
    if ($DB->get_manager()->table_exists($table)) {
        try {
            // Obtener estructura de la tabla
            $columns = $DB->get_columns($table);
            
            echo "✓ Tabla existe. Columnas encontradas:\n";
            foreach ($columns as $column_name => $column_info) {
                $type = isset($column_info->meta_type) ? $column_info->meta_type : 'unknown';
                $max_length = isset($column_info->max_length) ? $column_info->max_length : 'N/A';
                echo "  - {$column_name} ({$type}, max_length: {$max_length})\n";
            }
            
            // Contar registros
            $count = $DB->count_records($table);
            echo "  Total de registros: {$count}\n";
            
            // Si es la tabla de user_progress, mostrar algunos datos de ejemplo
            if ($table === 'neuroopositor_user_progress' && $count > 0) {
                echo "\n  Ejemplo de datos (primeros 3 registros):\n";
                $sample_data = $DB->get_records($table, null, 'id ASC', '*', 0, 3);
                foreach ($sample_data as $record) {
                    echo "    ID: {$record->id}, UserID: {$record->userid}, TemaID: {$record->tema_id}\n";
                    if (isset($record->porcentaje_dominio)) {
                        echo "      Progreso: {$record->porcentaje_dominio}%\n";
                    }
                    if (isset($record->tiempo_estudio_segundos)) {
                        echo "      Tiempo estudio: {$record->tiempo_estudio_segundos}s\n";
                    }
                    if (isset($record->preguntas_correctas)) {
                        echo "      Preguntas correctas: {$record->preguntas_correctas}\n";
                    }
                    if (isset($record->preguntas_totales)) {
                        echo "      Preguntas totales: {$record->preguntas_totales}\n";
                    }
                    echo "\n";
                }
            }
            
        } catch (Exception $e) {
            echo "✗ Error al obtener estructura: {$e->getMessage()}\n";
        }
    } else {
        echo "✗ Tabla NO EXISTE\n";
    }
}

echo "\n\nProbando consultas específicas de statistics.php:\n";
echo "================================================\n";

// Probar consulta específica de get_user_general_stats
echo "\n1. Probando consulta de estadísticas generales...\n";
try {
    $sql = "
        SELECT 
            AVG(porcentaje_dominio) as progreso_promedio,
            COUNT(*) as temas_estudiados,
            SUM(preguntas_correctas) as total_correctas,
            SUM(preguntas_totales) as total_preguntas,
            SUM(tiempo_estudio_segundos) as tiempo_total
        FROM {neuroopositor_user_progress}
        WHERE userid = ? AND courseid = ? AND preguntas_totales > 0
    ";
    
    $result = $DB->get_record_sql($sql, [$USER->id, 0]);
    echo "✓ Consulta ejecutada exitosamente\n";
    echo "  Resultado: " . json_encode($result) . "\n";
} catch (Exception $e) {
    echo "✗ Error en consulta: {$e->getMessage()}\n";
    echo "  Detalles del error:\n";
    echo "  Archivo: {$e->getFile()}\n";
    echo "  Línea: {$e->getLine()}\n";
}

// Probar consulta de bloques
echo "\n2. Probando consulta de estadísticas por bloque...\n";
try {
    $sql = "
        SELECT 
            t.bloque,
            COUNT(t.id) as total_temas,
            COUNT(up.id) as temas_estudiados
        FROM {neuroopositor_temas} t
        LEFT JOIN {neuroopositor_user_progress} up ON t.id = up.tema_id 
            AND up.userid = ? AND up.courseid = ?
        GROUP BY t.bloque
        ORDER BY t.bloque
        LIMIT 3
    ";
    
    $result = $DB->get_records_sql($sql, [$USER->id, 0]);
    echo "✓ Consulta ejecutada exitosamente\n";
    echo "  Resultado: " . json_encode($result) . "\n";
} catch (Exception $e) {
    echo "✗ Error en consulta: {$e->getMessage()}\n";
    echo "  Detalles del error:\n";
    echo "  Archivo: {$e->getFile()}\n";
    echo "  Línea: {$e->getLine()}\n";
}

// Verificar si hay datos de usuario
echo "\n3. Verificando datos del usuario actual...\n";
try {
    $user_data = $DB->get_records('neuroopositor_user_progress', ['userid' => $USER->id], 'id ASC', '*', 0, 5);
    if (empty($user_data)) {
        echo "⚠ No hay datos de progreso para el usuario actual (ID: {$USER->id})\n";
        echo "  Esto podría explicar por qué las estadísticas están vacías.\n";
        
        // Verificar si hay datos de otros usuarios
        $any_data = $DB->get_records('neuroopositor_user_progress', null, 'id ASC', '*', 0, 3);
        if (!empty($any_data)) {
            echo "  Pero sí hay datos de otros usuarios:\n";
            foreach ($any_data as $data) {
                echo "    UserID: {$data->userid}, TemaID: {$data->tema_id}\n";
            }
        } else {
            echo "  No hay datos de progreso de ningún usuario.\n";
        }
    } else {
        echo "✓ Encontrados " . count($user_data) . " registros de progreso para el usuario actual\n";
        foreach ($user_data as $data) {
            echo "  TemaID: {$data->tema_id}, Progreso: {$data->porcentaje_dominio}%\n";
        }
    }
} catch (Exception $e) {
    echo "✗ Error verificando datos de usuario: {$e->getMessage()}\n";
}

echo "\n\nInformación del sistema:\n";
echo "========================\n";
echo "Moodle version: {$CFG->version}\n";
echo "DB type: {$CFG->dbtype}\n";
echo "DB host: {$CFG->dbhost}\n";
echo "DB name: {$CFG->dbname}\n";
echo "DB prefix: {$CFG->prefix}\n";
echo "Debug level: {$CFG->debug}\n";

echo "\n</pre>";
echo "<hr>";
echo "<p><em>Diagnóstico ejecutado el: " . date('Y-m-d H:i:s') . "</em></p>";
echo "<p><a href='local/neuroopositor/index.php?courseid=0&action=statistics'>Volver a Estadísticas</a></p>";
?>