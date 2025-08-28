<?php
require_once('../../config.php');
require_once('locallib.php');

// Probar la generación de sectionid corregida
$topic = "ORGANIZACIÓN DEL TRATADO DEL ATLÁNTICO NORTE (OTAN)";
$old_sectionid = abs(crc32($topic));
$new_sectionid = abs(crc32($topic)) % 2147483647;

echo "=== PRUEBA DE CORRECCIÓN SECTIONID ===\n";
echo "Tema: {$topic}\n";
echo "Sectionid anterior (problemático): {$old_sectionid}\n";
echo "Sectionid nuevo (corregido): {$new_sectionid}\n";
echo "¿Está en rango válido? " . ($new_sectionid <= 2147483647 ? 'SÍ' : 'NO') . "\n";

// Verificar sintaxis del observer
echo "\n=== VERIFICACIÓN SINTAXIS ===\n";
if (class_exists('\\local_telegram_integration\\observer')) {
    echo "✅ Clase observer carga correctamente\n";
} else {
    echo "❌ Error de sintaxis en observer.php\n";
}

echo "\n=== PRUEBA COMPLETADA ===\n";
?>