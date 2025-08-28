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
global $DB;

// ... existing code ...

?> 