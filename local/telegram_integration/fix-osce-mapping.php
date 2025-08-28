<?php
// Script para corregir el mapeo de temas y incluir OSCE
// Este script actualiza el mapeo en locallib.php para incluir OSCE y otras variantes

require_once(dirname(__FILE__) . '/../../config.php');

echo "<h2>🔧 Corrección del Mapeo de Temas - Incluir OSCE</h2>";

// Mostrar el mapeo actual
echo "<h3>Mapeo Actual</h3>";
require_once($CFG->dirroot . '/local/telegram_integration/locallib.php');

$test_names = ['OSCE', 'osce', 'OTAN', 'otan', 'Organismos Internacionales'];
echo "<p>Mapeo actual para términos relacionados:</p>";
foreach ($test_names as $name) {
    $subject = local_telegram_integration_map_quiz_to_subject($name);
    $color = ($subject === 'general') ? 'red' : 'green';
    echo "<div style='color: {$color};'>'{$name}' → '{$subject}'</div>";
}

// Crear el mapeo mejorado
echo "<h3>Mapeo Mejorado Propuesto</h3>";
echo "<p>Se propone agregar las siguientes palabras clave al tema 'organismos internacionales':</p>";
echo "<ul>";
echo "<li><strong>osce</strong> - Organización para la Seguridad y la Cooperación en Europa</li>";
echo "<li><strong>seguridad cooperacion europa</strong> - Nombre completo de OSCE</li>";
echo "<li><strong>organizacion seguridad</strong> - Variante del nombre</li>";
echo "<li><strong>cooperacion europa</strong> - Parte del nombre</li>";
echo "</ul>";

// Generar el código corregido
echo "<h3>Código Corregido</h3>";
echo "<p>Reemplaza la función <code>local_telegram_integration_map_quiz_to_subject</code> en locallib.php con:</p>";
echo "<pre style='background: #f0f0f0; padding: 10px; border: 1px solid #ccc; overflow-x: auto;'>";
echo htmlspecialchars('
function local_telegram_integration_map_quiz_to_subject($quizname) {
    $quizname_lower = strtolower($quizname);

    $subject_map = [
        \'derecho constitucional\' => [\'constitu\', \'título preliminar\', \'derechos y deberes\', \'corona\', \'cortes generales\', \'gobierno y administración\', \'poder judicial\', \'organización territorial\', \'tribunal constitucional\', \'reforma constitucional\'],
        \'derecho administrativo\' => [\'procedimiento administrativo\', \'acto administrativo\', \'recursos administrativos\', \'contratos del sector público\', \'expropiación forzosa\', \'responsabilidad patrimonial\', \'ley 39/2015\', \'ley 40/2015\', \'pac\', \'lrjsp\'],
        \'unión europea\' => [\'unión europea\', \'ue\', \'tratados de la unión\', \'instituciones de la ue\', \'parlamento europeo\', \'consejo europeo\', \'comisión europea\', \'tribunal de justicia de la ue\', \'bce\', \'derecho de la unión\'],
        \'políticas públicas\' => [\'igualdad\', \'violencia de género\', \'transparencia\', \'gobierno abierto\', \'agenda 2030\', \'desarrollo sostenible\', \'dependencia\', \'protección de datos\'],
        \'gestión de personal\' => [\'función pública\', \'ebep\', \'personal laboral\', \'acceso al empleo público\', \'carrera profesional\', \'retribuciones\', \'incompatibilidades\', \'régimen disciplinario\', \'seguridad social\'],
        \'gestión financiera\' => [\'presupuesto\', \'hacienda pública\', \'gasto público\', \'ingresos públicos\', \'control presupuestario\', \'estabilidad presupuestaria\'],
        \'organización del estado\' => [\'organización del estado\', \'administración general del estado\', \'ministerios\', \'secretarías de estado\', \'delegaciones del gobierno\', \'administración periférica\', \'entidades públicas\'],
        \'derecho penal\' => [\'derecho penal\', \'delitos\', \'penas\', \'código penal\', \'delitos contra la administración\'],
        \'organismos internacionales\' => [
            \'organismos internacionales\', 
            \'naciones unidas\', 
            \'onu\', 
            \'otan\', 
            \'consejo de europa\',
            \'osce\',
            \'organizacion seguridad cooperacion europa\',
            \'seguridad cooperacion europa\',
            \'organizacion seguridad\',
            \'cooperacion europa\',
            \'seguridad europa\'
        ]
    ];

    foreach ($subject_map as $subject => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($quizname_lower, $keyword) !== false) {
                return $subject;
            }
        }
    }

    return \'general\';
}
');
echo "</pre>";

echo "<h3>Aplicar la Corrección</h3>";
echo "<div style='background: #d4edda; padding: 10px; border: 1px solid #c3e6cb;'>";
echo "<p><strong>Pasos para aplicar la corrección:</strong></p>";
echo "<ol>";
echo "<li>Haz una copia de seguridad de <code>locallib.php</code></li>";
echo "<li>Edita el archivo <code>local/telegram_integration/locallib.php</code></li>";
echo "<li>Busca la función <code>local_telegram_integration_map_quiz_to_subject</code> (línea ~1437)</li>";
echo "<li>Reemplaza toda la función con el código de arriba</li>";
echo "<li>Guarda el archivo</li>";
echo "<li>Prueba un cuestionario OSCE para verificar que funciona</li>";
echo "</ol>";
echo "</div>";

echo "<h3>Verificación Post-Corrección</h3>";
echo "<p>Después de aplicar la corrección, ejecuta este script nuevamente para verificar que el mapeo funciona correctamente.</p>";
echo "<p>También puedes usar el script <code>debug-osce-problem.php</code> para hacer un diagnóstico completo.</p>";

echo "<h3>Logs a Monitorear</h3>";
echo "<p>Durante las pruebas, monitorea los logs de error de Moodle para ver mensajes como:</p>";
echo "<pre style='background: #f0f0f0; padding: 10px;'>";
echo "=== TELEGRAM INTEGRATION (v2) ===\n";
echo "Quiz found: 'OSCE' in course X\n";
echo "Successfully updated topic performance for user X in subject 'organismos internacionales'.\n";
echo "=== END TELEGRAM INTEGRATION DEBUG ===";
echo "</pre>";

echo "<p style='color: blue;'><strong>Corrección preparada. Aplica los cambios manualmente en locallib.php para resolver el problema.</strong></p>";
?> 