<?php
require_once('../../config.php');

echo "<h2>📊 Verificando Datos en Tabla</h2>";

$records = $DB->get_records('local_telegram_user_topic_performance');

if ($records) {
    echo "<p>✅ Encontrados " . count($records) . " registros:</p>";
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Telegram User</th><th>Tema</th><th>Total</th><th>Correctas</th><th>Precisión</th></tr>";
    foreach ($records as $record) {
        echo "<tr>";
        echo "<td>{$record->id}</td>";
        echo "<td>{$record->telegramuserid}</td>";
        echo "<td>{$record->sectionname}</td>";
        echo "<td>{$record->totalquestions}</td>";
        echo "<td>{$record->correctanswers}</td>";
        echo "<td>{$record->accuracy}%</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>❌ No hay registros en la tabla</p>";
}
?>