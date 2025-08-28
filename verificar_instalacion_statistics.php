<?php
// Script de verificación post-instalación para statistics.php
// Confirma que la corrección fue aplicada exitosamente

require_once('../../config.php');
require_login();

// Mostrar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Verificación de Instalación - Statistics.php</h1>";
echo "<p>Este script verifica que la corrección de statistics.php fue aplicada correctamente</p>";
echo "<hr>";

// Función para mostrar resultado
function mostrar_resultado($titulo, $exito, $mensaje, $detalle = '') {
    $color = $exito ? 'green' : 'red';
    $icono = $exito ? '✓' : '✗';
    
    echo "<h3>{$icono} <span style='color: {$color};'>{$titulo}</span></h3>";
    echo "<p>{$mensaje}</p>";
    
    if ($detalle) {
        echo "<div style='background: #f5f5f5; padding: 10px; border-left: 3px solid {$color}; margin: 10px 0;'>";
        echo $detalle;
        echo "</div>";
    }
}

// VERIFICACIÓN 1: Archivo statistics.php existe y es accesible
echo "<h2>1. Verificación de Archivo</h2>";

$statistics_file = $CFG->dirroot . '/local/neuroopositor/classes/statistics.php';

if (file_exists($statistics_file)) {
    $file_size = filesize($statistics_file);
    $file_date = date('Y-m-d H:i:s', filemtime($statistics_file));
    
    mostrar_resultado(
        "Archivo Existe",
        true,
        "El archivo statistics.php está presente en el sistema",
        "Tamaño: {$file_size} bytes<br>Última modificación: {$file_date}"
    );
} else {
    mostrar_resultado(
        "Archivo No Encontrado",
        false,
        "El archivo statistics.php no existe en la ubicación esperada",
        "Ubicación esperada: {$statistics_file}"
    );
    exit;
}

// VERIFICACIÓN 2: Sintaxis PHP válida
echo "<h2>2. Verificación de Sintaxis</h2>";

$syntax_check = shell_exec("php -l {$statistics_file} 2>&1");
if (strpos($syntax_check, 'No syntax errors') !== false) {
    mostrar_resultado(
        "Sintaxis Válida",
        true,
        "El archivo no contiene errores de sintaxis PHP"
    );
} else {
    mostrar_resultado(
        "Error de Sintaxis",
        false,
        "Se detectaron errores de sintaxis en el archivo",
        "<pre>{$syntax_check}</pre>"
    );
}

// VERIFICACIÓN 3: Clase se puede cargar
echo "<h2>3. Verificación de Clase</h2>";

try {
    require_once($statistics_file);
    
    if (class_exists('local_neuroopositor\\statistics')) {
        mostrar_resultado(
            "Clase Cargada",
            true,
            "La clase 'local_neuroopositor\\statistics' se cargó correctamente"
        );
        
        // Verificar métodos principales
        $reflection = new ReflectionClass('local_neuroopositor\\statistics');
        $required_methods = [
            'get_user_general_stats',
            'get_user_block_stats', 
            'get_user_progress_history',
            'get_topic_performance'
        ];
        
        $missing_methods = [];
        foreach ($required_methods as $method) {
            if (!$reflection->hasMethod($method)) {
                $missing_methods[] = $method;
            }
        }
        
        if (empty($missing_methods)) {
            mostrar_resultado(
                "Métodos Completos",
                true,
                "Todos los métodos requeridos están presentes",
                "Métodos verificados: " . implode(', ', $required_methods)
            );
        } else {
            mostrar_resultado(
                "Métodos Faltantes",
                false,
                "Algunos métodos requeridos no están presentes",
                "Métodos faltantes: " . implode(', ', $missing_methods)
            );
        }
        
    } else {
        mostrar_resultado(
            "Clase No Encontrada",
            false,
            "No se pudo cargar la clase 'local_neuroopositor\\statistics'"
        );
    }
    
} catch (Exception $e) {
    mostrar_resultado(
        "Error al Cargar Clase",
        false,
        "Excepción al intentar cargar la clase",
        "Error: " . $e->getMessage()
    );
}

// VERIFICACIÓN 4: Consultas SQL corregidas
echo "<h2>4. Verificación de Consultas SQL</h2>";

// Verificar que las correcciones de columnas están aplicadas
$file_content = file_get_contents($statistics_file);

$corrections_applied = [];
$corrections_missing = [];

// Verificar corrección: nombre -> titulo
if (strpos($file_content, 't.titulo') !== false || strpos($file_content, 'titulo as tema_nombre') !== false) {
    $corrections_applied[] = "'nombre' → 'titulo' en neuroopositor_temas";
} else {
    $corrections_missing[] = "'nombre' → 'titulo' en neuroopositor_temas";
}

// Verificar corrección: correct -> preguntas_correctas
if (strpos($file_content, 'preguntas_correctas') !== false) {
    $corrections_applied[] = "'correct' → 'preguntas_correctas' en neuroopositor_user_progress";
} else {
    $corrections_missing[] = "'correct' → 'preguntas_correctas' en neuroopositor_user_progress";
}

// Verificar corrección: time_spent -> tiempo_estudio_segundos
if (strpos($file_content, 'tiempo_estudio_segundos') !== false) {
    $corrections_applied[] = "'time_spent' → 'tiempo_estudio_segundos' en neuroopositor_user_progress";
} else {
    $corrections_missing[] = "'time_spent' → 'tiempo_estudio_segundos' en neuroopositor_user_progress";
}

if (empty($corrections_missing)) {
    mostrar_resultado(
        "Correcciones Aplicadas",
        true,
        "Todas las correcciones de columnas están aplicadas",
        "Correcciones encontradas:<br>• " . implode('<br>• ', $corrections_applied)
    );
} else {
    mostrar_resultado(
        "Correcciones Incompletas",
        false,
        "Algunas correcciones no están aplicadas",
        "Faltantes:<br>• " . implode('<br>• ', $corrections_missing)
    );
}

// VERIFICACIÓN 5: Test funcional básico
echo "<h2>5. Test Funcional</h2>";

try {
    // Intentar ejecutar un método básico
    $stats = local_neuroopositor\statistics::get_user_general_stats($USER->id, 0);
    
    if ($stats !== false) {
        mostrar_resultado(
            "Método Funcional",
            true,
            "El método get_user_general_stats se ejecuta sin errores",
            "Resultado obtenido: " . (is_array($stats) ? count($stats) . " elementos" : "objeto válido")
        );
    } else {
        mostrar_resultado(
            "Método con Problemas",
            false,
            "El método get_user_general_stats retornó false"
        );
    }
    
} catch (Exception $e) {
    mostrar_resultado(
        "Error en Ejecución",
        false,
        "Error al ejecutar el método get_user_general_stats",
        "Error: " . $e->getMessage()
    );
}

// VERIFICACIÓN 6: Acceso a la página de estadísticas
echo "<h2>6. Verificación de Acceso Web</h2>";

$stats_url = $CFG->wwwroot . '/local/neuroopositor/index.php?courseid=0&action=statistics';

echo "<p>URL de estadísticas: <a href='{$stats_url}' target='_blank'>{$stats_url}</a></p>";

// Intentar hacer una petición HTTP básica
try {
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'method' => 'GET'
        ]
    ]);
    
    $response = @file_get_contents($stats_url, false, $context);
    
    if ($response !== false) {
        if (strpos($response, 'Error al leer de la base de datos') === false) {
            mostrar_resultado(
                "Página Accesible",
                true,
                "La página de estadísticas se carga sin el error anterior"
            );
        } else {
            mostrar_resultado(
                "Error Persistente",
                false,
                "La página aún muestra 'Error al leer de la base de datos'"
            );
        }
    } else {
        echo "<p>⚠ No se pudo verificar automáticamente. <strong>Prueba manual requerida:</strong></p>";
        echo "<a href='{$stats_url}' target='_blank' style='background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Abrir Página de Estadísticas</a>";
    }
    
} catch (Exception $e) {
    echo "<p>⚠ Error en verificación automática: " . $e->getMessage() . "</p>";
    echo "<p><strong>Verificación manual requerida:</strong></p>";
    echo "<a href='{$stats_url}' target='_blank' style='background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Abrir Página de Estadísticas</a>";
}

echo "<hr>";

// RESUMEN FINAL
echo "<h2>Resumen de Verificación</h2>";

$total_checks = 6;
$passed_checks = 0;

// Contar verificaciones exitosas (simplificado)
if (file_exists($statistics_file)) $passed_checks++;
if (strpos($syntax_check, 'No syntax errors') !== false) $passed_checks++;
if (class_exists('local_neuroopositor\\statistics')) $passed_checks++;
if (empty($corrections_missing)) $passed_checks++;

$success_rate = round(($passed_checks / $total_checks) * 100);

if ($success_rate >= 80) {
    echo "<div style='background: #e8f5e8; padding: 20px; border: 2px solid #4CAF50; border-radius: 5px;'>";
    echo "<h3 style='color: #2E7D32; margin-top: 0;'>✓ Verificación Exitosa ({$success_rate}%)</h3>";
    echo "<p>La instalación de statistics.php parece haber sido exitosa.</p>";
    echo "<p><strong>Próximos pasos:</strong></p>";
    echo "<ol>";
    echo "<li><a href='{$stats_url}' target='_blank'>Probar la página de estadísticas</a></li>";
    echo "<li>Verificar que no aparezcan errores</li>";
    echo "<li>Monitorear logs de errores</li>";
    echo "</ol>";
    echo "</div>";
} else {
    echo "<div style='background: #ffebee; padding: 20px; border: 2px solid #f44336; border-radius: 5px;'>";
    echo "<h3 style='color: #c62828; margin-top: 0;'>⚠ Verificación Incompleta ({$success_rate}%)</h3>";
    echo "<p>Algunas verificaciones fallaron. Revisa los errores anteriores.</p>";
    echo "<p><strong>Acciones recomendadas:</strong></p>";
    echo "<ul>";
    echo "<li>Revisar errores específicos arriba</li>";
    echo "<li>Intentar reinstalación</li>";
    echo "<li>Verificar permisos de archivos</li>";
    echo "<li>Contactar soporte técnico</li>";
    echo "</ul>";
    echo "</div>";
}

echo "<hr>";
echo "<p><strong>Verificación completada:</strong> " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Usuario:</strong> {$USER->username} (ID: {$USER->id})</p>";
echo "<p><strong>Servidor:</strong> {$_SERVER['HTTP_HOST']}</p>";

?>