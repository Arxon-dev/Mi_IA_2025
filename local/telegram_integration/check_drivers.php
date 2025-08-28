<?php
// Este script comprueba qué drivers de bases de datos PDO están disponibles en el servidor.
// Es seguro y puede ser eliminado después de su uso.

echo "<h1>Drivers PDO Disponibles</h1>";
echo "<p>La siguiente lista muestra los 'lenguajes' de bases de datos que este servidor PHP puede hablar usando PDO.</p>";
echo "<p>Para que tu plugin funcione, la palabra <strong>'mysql'</strong> DEBE aparecer en esta lista.</p>";
echo "<hr>";

if (extension_loaded('pdo')) {
    echo "<pre>";
    print_r(PDO::getAvailableDrivers());
    echo "</pre>";
} else {
    echo "<p style='color:red; font-weight:bold;'>ERROR: La extensión PDO base no está cargada en este servidor. Este es un problema de configuración fundamental.</p>";
} 