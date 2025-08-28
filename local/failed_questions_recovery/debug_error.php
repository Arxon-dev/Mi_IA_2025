<?php
// Script para mostrar errores específicos de payment.php

// Activar visualización de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Debug Error Payment</h1>";
echo "<p>Intentando cargar payment.php con errores visibles...</p>";

try {
    // Incluir payment.php para ver errores específicos
    include_once('payment.php');
} catch (Throwable $e) {
    echo "<h2>Error capturado:</h2>";
    echo "<p><strong>Mensaje:</strong> " . $e->getMessage() . "</p>";
    echo "<p><strong>Archivo:</strong> " . $e->getFile() . "</p>";
    echo "<p><strong>Línea:</strong> " . $e->getLine() . "</p>";
    echo "<h3>Stack trace:</h3>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>