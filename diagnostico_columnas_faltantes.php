<?php
// Script para diagnosticar columnas faltantes en las tablas de NeuroOpositor
// Este script debe subirse al hosting para identificar el problema exacto

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h2>Diagnóstico de Columnas Faltantes - NeuroOpositor</h2>";
echo "<hr>";

// 1. Verificar estructura real de las tablas
echo "<h3>1. Estructura Real de las Tablas</h3>";

$tablas_verificar = [
    'neuroopositor_temas',
    'neuroopositor_user_progress',
    'neuroopositor_connections',
    'neuroopositor_neural_paths',
    'neuroopositor_question_mapping',
    'neuroopositor_user_responses',
    'neuroopositor_ai_recommendations',
    'neuroopositor_study_sessions'
];

foreach ($tablas_verificar as $tabla) {
    echo "<h4>Tabla: {$tabla}</h4>";
    try {
        $sql = "DESCRIBE {{$tabla}}";
        $columns = $DB->get_records_sql($sql);
        
        if ($columns) {
            echo "<table border='1'><tr><th>Campo</th><th>Tipo</th><th>Nulo</th><th>Clave</th><th>Default</th></tr>";
            foreach ($columns as $column) {
                echo "<tr>";
                echo "<td>{$column->field}</td>";
                echo "<td>{$column->type}</td>";
                echo "<td>{$column->null}</td>";
                echo "<td>{$column->key}</td>";
                echo "<td>{$column->default}</td>";
                echo "</tr>";
            }
            echo "</table><br>";
        } else {
            echo "✗ No se pudo obtener la estructura de la tabla<br><br>";
        }
    } catch (Exception $e) {
        echo "✗ Error al verificar tabla {$tabla}: " . $e->getMessage() . "<br><br>";
    }
}

echo "<hr>";

// 2. Verificar columnas específicas que causan problemas
echo "<h3>2. Verificación de Columnas Problemáticas</h3>";

$columnas_problematicas = [
    'neuroopositor_temas' => ['nombre', 'titulo'],
    'neuroopositor_user_progress' => ['correct', 'time_spent', 'preguntas_correctas', 'preguntas_totales', 'tiempo_estudio_segundos', 'porcentaje_dominio']
];

foreach ($columnas_problematicas as $tabla => $columnas) {
    echo "<h4>Tabla: {$tabla}</h4>";
    foreach ($columnas as $columna) {
        try {
            $sql = "SELECT {$columna} FROM {{$tabla}} LIMIT 1";
            $result = $DB->get_record_sql($sql);
            echo "✓ Columna '{$columna}' existe<br>";
        } catch (Exception $e) {
            echo "✗ Columna '{$columna}' NO existe - Error: " . $e->getMessage() . "<br>";
        }
    }
    echo "<br>";
}

echo "<hr>";

// 3. Probar consultas específicas que fallan
echo "<h3>3. Pruebas de Consultas Específicas</h3>";

// Consulta 1: Temas con nombre vs titulo
echo "<h4>3.1 Consulta de Temas</h4>";
try {
    $sql = "SELECT id, nombre FROM {neuroopositor_temas} LIMIT 1";
    $result = $DB->get_record_sql($sql);
    echo "✓ Consulta con 'nombre' exitosa<br>";
} catch (Exception $e) {
    echo "✗ Consulta con 'nombre' falló: " . $e->getMessage() . "<br>";
    
    // Probar con 'titulo'
    try {
        $sql = "SELECT id, titulo FROM {neuroopositor_temas} LIMIT 1";
        $result = $DB->get_record_sql($sql);
        echo "✓ Consulta con 'titulo' exitosa<br>";
    } catch (Exception $e2) {
        echo "✗ Consulta con 'titulo' también falló: " . $e2->getMessage() . "<br>";
    }
}

// Consulta 2: User progress con columnas problemáticas
echo "<h4>3.2 Consulta de User Progress</h4>";
$columnas_test = ['correct', 'preguntas_correctas', 'time_spent', 'tiempo_estudio_segundos'];

foreach ($columnas_test as $columna) {
    try {
        $sql = "SELECT id, {$columna} FROM {neuroopositor_user_progress} LIMIT 1";
        $result = $DB->get_record_sql($sql);
        echo "✓ Consulta con '{$columna}' exitosa<br>";
    } catch (Exception $e) {
        echo "✗ Consulta con '{$columna}' falló: " . $e->getMessage() . "<br>";
    }
}

echo "<hr>";

// 4. Generar script de corrección
echo "<h3>4. Generando Script de Corrección</h3>";

// Verificar qué columnas existen realmente
$columnas_reales = [];

// Para neuroopositor_temas
try {
    $sql = "DESCRIBE {neuroopositor_temas}";
    $columns = $DB->get_records_sql($sql);
    $columnas_reales['neuroopositor_temas'] = array_keys($columns);
} catch (Exception $e) {
    echo "Error al obtener columnas de neuroopositor_temas<br>";
}

// Para neuroopositor_user_progress
try {
    $sql = "DESCRIBE {neuroopositor_user_progress}";
    $columns = $DB->get_records_sql($sql);
    $columnas_reales['neuroopositor_user_progress'] = array_keys($columns);
} catch (Exception $e) {
    echo "Error al obtener columnas de neuroopositor_user_progress<br>";
}

echo "<h4>Columnas Reales Encontradas:</h4>";
echo "<pre>";
print_r($columnas_reales);
echo "</pre>";

// 5. Crear mapeo de correcciones
echo "<h4>5. Mapeo de Correcciones Necesarias</h4>";

$correcciones = [];

// Verificar si existe 'nombre' o 'titulo' en neuroopositor_temas
if (isset($columnas_reales['neuroopositor_temas'])) {
    if (in_array('titulo', $columnas_reales['neuroopositor_temas']) && !in_array('nombre', $columnas_reales['neuroopositor_temas'])) {
        $correcciones['neuroopositor_temas']['nombre'] = 'titulo';
        echo "✓ Corrección: 'nombre' debe ser 'titulo' en neuroopositor_temas<br>";
    }
}

// Verificar columnas en neuroopositor_user_progress
if (isset($columnas_reales['neuroopositor_user_progress'])) {
    $mapeo_columnas = [
        'correct' => 'preguntas_correctas',
        'time_spent' => 'tiempo_estudio_segundos'
    ];
    
    foreach ($mapeo_columnas as $columna_incorrecta => $columna_correcta) {
        if (in_array($columna_correcta, $columnas_reales['neuroopositor_user_progress']) && 
            !in_array($columna_incorrecta, $columnas_reales['neuroopositor_user_progress'])) {
            $correcciones['neuroopositor_user_progress'][$columna_incorrecta] = $columna_correcta;
            echo "✓ Corrección: '{$columna_incorrecta}' debe ser '{$columna_correcta}' en neuroopositor_user_progress<br>";
        }
    }
}

echo "<hr>";

// 6. Crear archivo de corrección específico
echo "<h3>6. Creando Archivo de Corrección</h3>";

if (!empty($correcciones)) {
    $correction_script = '<?php\n';
    $correction_script .= '// Script de corrección automática para statistics.php\n';
    $correction_script .= '// Generado automáticamente el ' . date('Y-m-d H:i:s') . '\n\n';
    
    $correction_script .= '$correcciones_sql = ' . var_export($correcciones, true) . ';\n\n';
    
    $correction_script .= 'echo "Correcciones identificadas:\n";\n';
    $correction_script .= 'print_r($correcciones_sql);\n';
    
    // Escribir el archivo
    $file_path = $CFG->dirroot . '/local/neuroopositor/correcciones_identificadas.php';
    if (file_put_contents($file_path, $correction_script)) {
        echo "✓ Archivo de correcciones creado: {$file_path}<br>";
    } else {
        echo "✗ Error al crear archivo de correcciones<br>";
    }
} else {
    echo "No se identificaron correcciones específicas<br>";
}

echo "<hr>";
echo "<h3>Diagnóstico Completado</h3>";
echo "Fecha: " . date('Y-m-d H:i:s') . "<br>";
echo "Usuario: " . $USER->username . " (ID: {$USER->id})<br>";
?>