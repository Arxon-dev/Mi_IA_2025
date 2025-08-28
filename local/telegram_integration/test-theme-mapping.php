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

require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

// Verificar permisos de admin
require_login();
require_capability('moodle/site:config', context_system::instance());

echo "<h2>Test: Verificación de Mapeo de Temas Mejorado</h2>";

// Función para quitar tildes (copia de observer.php)
function quitar_tildes($cadena) {
    $originales = ['á','é','í','ó','ú','ü','ñ','Á','É','Í','Ó','Ú','Ü','Ñ'];
    $modificadas = ['a','e','i','o','u','u','n','A','E','I','O','U','U','N'];
    return str_replace($originales, $modificadas, $cadena);
}

// Función de mapeo mejorada
function test_map_quiz_to_subject($quiz_name) {
    $name = mb_strtolower($quiz_name, 'UTF-8');
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

// Temas problemáticos reportados por el usuario
$temas_problematicos = [
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

echo "<h3>Resultados del Test - Temas Problemáticos:</h3>";
echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Tema Original</th><th>Tema Detectado</th><th>Status</th></tr>";

$temas_resueltos = 0;
$total_temas = count($temas_problematicos);

foreach ($temas_problematicos as $tema) {
    $tema_detectado = test_map_quiz_to_subject($tema);
    $resuelto = ($tema_detectado !== 'general');
    
    if ($resuelto) {
        $temas_resueltos++;
        $status = "✅ RESUELTO";
        $color = "background-color: #ccffcc;";
    } else {
        $status = "❌ PENDIENTE";
        $color = "background-color: #ffcccc;";
    }
    
    echo "<tr style='$color'>";
    echo "<td>$tema</td>";
    echo "<td>$tema_detectado</td>";
    echo "<td>$status</td>";
    echo "</tr>";
}

echo "</table>";

// Resumen
echo "<h3>Resumen del Test:</h3>";
echo "<div style='padding: 10px; background-color: #f0f0f0; border: 1px solid #ccc;'>";
echo "<p><strong>Temas Resueltos:</strong> $temas_resueltos / $total_temas</p>";
echo "<p><strong>Porcentaje de Éxito:</strong> " . round(($temas_resueltos / $total_temas) * 100, 2) . "%</p>";

if ($temas_resueltos == $total_temas) {
    echo "<p style='color: green; font-weight: bold;'>🎉 ¡Todos los temas problemáticos han sido resueltos!</p>";
} else {
    echo "<p style='color: orange; font-weight: bold;'>⚠️ Algunos temas aún necesitan ajustes adicionales.</p>";
}
echo "</div>";

// Verificar algunos quizzes reales de la base de datos
echo "<h3>Verificación con Quizzes Reales:</h3>";
$quizzes = $DB->get_records('quiz', [], 'name ASC', 'id, name', 0, 20);

if ($quizzes) {
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>ID</th><th>Nombre Quiz</th><th>Tema Detectado</th><th>Status</th></tr>";
    
    foreach ($quizzes as $quiz) {
        $tema_detectado = test_map_quiz_to_subject($quiz->name);
        $general = ($tema_detectado === 'general');
        
        $color = $general ? "background-color: #ffeeee;" : "background-color: #eeffee;";
        $status = $general ? "🔍 Necesita revisión" : "✅ Detectado";
        
        echo "<tr style='$color'>";
        echo "<td>{$quiz->id}</td>";
        echo "<td>{$quiz->name}</td>";
        echo "<td>{$tema_detectado}</td>";
        echo "<td>{$status}</td>";
        echo "</tr>";
    }
    
    echo "</table>";
} else {
    echo "<p>No se encontraron quizzes en la base de datos.</p>";
}

echo "<hr>";
echo "<p><strong>Nota:</strong> Si los temas problemáticos ahora se detectan correctamente, el plugin debería funcionar mejor.</p>";
echo "<p><strong>Recomendación:</strong> Ejecutar algunos quizzes de prueba para verificar que se registren en la tabla <code>mdl_local_telegram_user_topic_performance</code>.</p>";
?> 