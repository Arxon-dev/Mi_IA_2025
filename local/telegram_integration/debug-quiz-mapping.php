<?php
define('CLI_SCRIPT', true);

// Intentar diferentes rutas para encontrar config.php
$possible_paths = [
    '../../../config.php', // Ruta original si el script está en local/telegram_integration/
    '../../../../config.php', // Si hay una estructura de carpetas adicional
    dirname(__FILE__) . '/../../../config.php'
];

$config_loaded = false;
foreach ($possible_paths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $config_loaded = true;
        break;
    }
}

if (!$config_loaded) {
    die("Error: No se pudo encontrar el archivo config.php. Por favor, verifica las rutas.\n");
}

require_once($CFG->libdir.'/clilib.php');
require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

global $DB;

// Verificar permisos de admin
require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h2>Debug: Mapeo de Temas en Quizzes</h2>";

// Obtener todos los quizzes
$quizzes = $DB->get_records('quiz', [], 'name ASC', 'id, name, course');

echo "<h3>Quizzes en la Base de Datos:</h3>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>ID</th><th>Nombre Original</th><th>Nombre Procesado</th><th>Tema Detectado</th></tr>";

// Función para quitar tildes (copia de observer.php)
function quitar_tildes($cadena) {
    $originales = ['á','é','í','ó','ú','ü','ñ','Á','É','Í','Ó','Ú','Ü','Ñ'];
    $modificadas = ['a','e','i','o','u','u','n','A','E','I','O','U','U','N'];
    return str_replace($originales, $modificadas, $cadena);
}

// Función de mapeo (copia de observer.php)
function map_quiz_to_subject_debug($quiz) {
    $quizName = $quiz->name;
    $name = mb_strtolower($quizName, 'UTF-8');
    $name = quitar_tildes($name);
    
    $temas = [
        'Constitución Española' => ['constitucion'],
        'Defensa Nacional' => ['defensa nacional'],
        'Régimen Jurídico del Sector Público' => ['regimen juridico'],
        'Ministerio de Defensa' => ['ministerio de defensa', 'ministerio defensa'],
        'Organización de las FAS' => ['organizacion basica fas', 'organizacion fas', 'organizacion basica de las fas'],
        'Estado Mayor de la Defensa' => ['organizacion basica del em', 'estado mayor'],
        'Ejército de Tierra' => ['organizacion basica et', 'ejercito de tierra'],
        'Armada Española' => ['organizacion basica armada', 'armada espanola', 'organizacion basica de la armada'],
        'Ejército del Aire' => ['organizacion basica ea', 'ejercito del aire'],
        'Tropa y Marinería' => ['tropa y marineria'],
        'Carrera Militar' => ['carrera militar', 'ley carrera', 'ley carrera militar'],
        'Reales Ordenanzas' => ['reales ordenanzas'],
        'Derechos y Deberes de los Miembros de las FAS' => ['derechos y deberes', 'derechos y deberes de los miembros', 'derechos y deberes de las fas'],
        'Régimen Disciplinario de las Fuerzas Armadas' => ['regimen disciplinario', 'disciplinario', 'regimen disciplinario de las fuerzas armadas'],
        'Tramitación Iniciativas y Quejas' => ['iniciativas y quejas'],
        'Igualdad Efectiva de Mujeres y Hombres' => ['igualdad efectiva', 'igualdad efectiva de mujeres y hombres'],
        'Observatorio Militar para la Igualdad' => ['observatorio militar'],
        'Procedimiento Administrativo Común' => ['procedimiento administrativo', 'procedimiento administrativo comun', 'procedimiento administrativo comun de las administraciones publicas'],
        'Seguridad Nacional' => ['seguridad nacional'],
        'Estrategia de Seguridad Nacional' => ['estrategia de seguridad'],
        'Doctrina' => ['doctrina'],
        'Organización de las Naciones Unidas' => ['naciones unidas', 'onu'],
        'OTAN' => ['otan'],
        'OSCE' => ['osce'],
        'Unión Europea' => ['union europea'],
        'España y su Participación en Misiones' => ['misiones internacionales']
    ];

    foreach ($temas as $temaNormalizado => $palabrasClave) {
        foreach ($palabrasClave as $clave) {
            if (strpos($name, $clave) !== false) {
                return $temaNormalizado;
            }
        }
    }
    
    return 'general';
}

foreach ($quizzes as $quiz) {
    $processed_name = mb_strtolower($quiz->name, 'UTF-8');
    $processed_name = quitar_tildes($processed_name);
    $detected_theme = map_quiz_to_subject_debug($quiz);
    
    $row_color = ($detected_theme === 'general') ? 'style="background-color: #ffcccc;"' : '';
    
    echo "<tr $row_color>";
    echo "<td>{$quiz->id}</td>";
    echo "<td>{$quiz->name}</td>";
    echo "<td>{$processed_name}</td>";
    echo "<td>{$detected_theme}</td>";
    echo "</tr>";
}

echo "</table>";

// Mostrar los temas problemáticos mencionados por el usuario
echo "<h3>Análisis de Temas Problemáticos:</h3>";
$problematic_themes = [
    'OTAN',
    'UNION EUROPEA', 
    'PROCEDIMIENTO ADMINISTRATIVO COMÚN DE LAS ADMINISTRACIONES PÚBLICAS',
    'IGUALDAD EFECTIVA DE MUJERES Y HOMBRES',
    'RÉGIMEN DISCIPLINARIO DE LAS FUERZAS ARMADAS',
    'DERECHOS Y DEBERES DE LOS MIEMBROS DE LAS FAS',
    'LEY CARRERA MILITAR',
    'MINISTERIO DE DEFENSA',
    'ORGANIZACIÓN BÁSICA FAS',
    'ORGANIZACIÓN BÁSICA ARMADA'
];

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Tema Problemático</th><th>Procesado</th><th>¿Encontrado en BD?</th></tr>";

foreach ($problematic_themes as $theme) {
    $processed = mb_strtolower($theme, 'UTF-8');
    $processed = quitar_tildes($processed);
    
    $found = false;
    foreach ($quizzes as $quiz) {
        $quiz_processed = mb_strtolower($quiz->name, 'UTF-8');
        $quiz_processed = quitar_tildes($quiz_processed);
        
        if (strpos($quiz_processed, $processed) !== false || strpos($processed, $quiz_processed) !== false) {
            $found = $quiz->name;
            break;
        }
    }
    
    echo "<tr>";
    echo "<td>{$theme}</td>";
    echo "<td>{$processed}</td>";
    echo "<td>" . ($found ? "SÍ: {$found}" : "NO") . "</td>";
    echo "</tr>";
}

echo "</table>";

echo "<h3>Sugerencias de Mejora:</h3>";
echo "<p>Basado en el análisis, aquí están las mejoras sugeridas para el mapeo:</p>";
?> 