<?php
// Script de verificación rápida del estado del sistema

echo "<h1>Estado del Sistema Moodle-Telegram</h1>";

// Ya no definimos CLI_SCRIPT para permitir la ejecución web

// 1. Carga de config.php
echo "<h3>1. Carga de Archivos de Configuración</h3>";

// --- INICIO: Bloque de Carga y Depuración de Ruta ---
echo "<div>Buscando config.php desde: " . __DIR__ . "</div>";

$possible_paths = [
    '../../config.php',   // Ruta más probable: .../campus/config.php
    '../../../config.php',  // Si la raíz de Moodle está un nivel más arriba
    '../config.php',      // Si el script estuviera en .../campus/local/
];

$config_loaded = false;
$config_path = 'No encontrado';

echo "<ul>";
foreach ($possible_paths as $path) {
    $absolute_path = realpath(__DIR__ . '/' . $path);
    echo "<li>Probando ruta relativa: <code>" . htmlspecialchars($path) . "</code>";
    if ($absolute_path && file_exists($absolute_path)) {
        echo " -> <span style='color:green;'>ENCONTRADO en: " . htmlspecialchars($absolute_path) . "</span></li>";
        require_once($absolute_path);
        $config_loaded = true;
        $config_path = $absolute_path;
        break; // Salir del bucle una vez encontrado
    } else {
        echo " -> <span style='color:red;'>No encontrado</span></li>";
    }
}
echo "</ul>";

if ($config_loaded) {
    echo "<div style='color: green;'>✅ Entorno Moodle cargado correctamente desde: " . htmlspecialchars($config_path) . "</div>";
} else {
    echo "<div style='color: red;'>❌ ERROR CRÍTICO: No se pudo encontrar config.php. El script no puede continuar.</div>";
    die();
}
// --- FIN: Bloque de Carga y Depuración de Ruta ---


// Ya no se necesita clilib.php para la ejecución web
global $DB;


// 2. Comprobar la conexión a la base de datos
echo "<h3>2. Conexión a Base de Datos</h3>";
try {
    $user_count = $DB->count_records('user');
    echo "<div style='color: green;'>✅ Conexión a BD OK. $user_count usuarios encontrados en la tabla 'user'.</div>";
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error de BD: " . $e->getMessage() . "</div>";
}

// 3. Verificar la carga de librerías de Moodle
if (function_exists('get_string')) {
    echo "<h3>3. Carga de Librerías de Moodle</h3>";
    echo "<div style='color: green;'>✅ Librerías de Moodle (get_string): OK</div>";
} else {
    echo "<h3>3. Carga de Librerías de Moodle</h3>";
    echo "<div style='color: red;'>❌ Librerías de Moodle (get_string): NO cargadas</div>";
}

// 4. Comprobar información básica del sistema (si exec() está disponible)
echo "<h3>4. Información del sistema</h3>";
if (function_exists('exec')) {
    $output = [];
    $return_var = 0;
    @exec('uname -a', $output, $return_var); // Usamos @ para suprimir errores si exec está restringido
    if ($return_var === 0 && !empty($output)) {
        echo "<div style='color: green;'>✅ SO: " . implode(" ", $output) . "</div>";
    } else {
        echo "<div style='color: orange;'>ℹ️ No se pudo obtener la info del SO (uname podría no estar disponible).</div>";
    }
} else {
    echo "<div style='color: orange;'>ℹ️  Comprobación de 'uname' omitida: la función exec() no está disponible en este servidor.</div>";
}


// 5. Verificar la existencia de la librería local
echo "<h3>5. Archivos del Plugin</h3>";
if (file_exists($CFG->dirroot . '/local/telegram_integration/locallib.php')) {
    echo "<div style='color: green;'>✅ Archivo locallib.php encontrado.</div>";
} else {
    echo "<div style='color: red;'>❌ Archivo locallib.php NO encontrado.</div>";
}
// Añade aquí más comprobaciones de archivos si es necesario

// 6. Verificar tabla de performance
echo "<h3>6. Tabla de Performance</h3>";
try {
    $table_exists = $DB->get_manager()->table_exists('local_telegram_user_topic_performance');
    if ($table_exists) {
        echo "<div style='color: green;'>✅ Tabla 'local_telegram_user_topic_performance' encontrada.</div>";
    } else {
        echo "<div style='color: red;'>❌ Tabla 'local_telegram_user_topic_performance' NO encontrada.</div>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error al verificar tabla: " . $e->getMessage() . "</div>";
}

// 7. Verificar funciones críticas
echo "<h3>7. Funciones Críticas</h3>";
try {
    require_once(__DIR__ . '/locallib.php');
    if (function_exists('local_telegram_integration_map_quiz_to_subject')) {
        echo "<div style='color: green;'>✅ Función 'local_telegram_integration_map_quiz_to_subject' encontrada.</div>";
    } else {
        echo "<div style='color: red;'>❌ Función 'local_telegram_integration_map_quiz_to_subject' NO encontrada.</div>";
    }
} catch (Exception $e) {
    echo "<div style='color: red;'>❌ Error al cargar locallib.php para test de funciones: " . $e->getMessage() . "</div>";
}


?> 