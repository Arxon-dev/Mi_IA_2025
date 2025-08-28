<?php
require_once('../../config.php');
require_once($CFG->dirroot.'/local/failed_questions_recovery/lib.php');

require_login();

echo "<h2>🔍 Verificación de las Correcciones</h2>";

global $DB, $USER;

// 1. Verificar que las correcciones se aplicaron
echo "<h3>1. 📊 Estado actual de las categorías en la base de datos</h3>";

$categories_raw = $DB->get_records_sql("
    SELECT fq.categoryname, COUNT(*) as count, fq.quizid,
           q.name as quiz_name
    FROM {local_failed_questions_recovery} fq
    LEFT JOIN {quiz} q ON fq.quizid = q.id
    WHERE fq.userid = ? AND fq.mastered = 0
    GROUP BY fq.categoryname, fq.quizid, q.name
    ORDER BY fq.categoryname
", [$USER->id]);

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>Categoría</th><th>Quiz ID</th><th>Quiz Name</th><th>Preguntas</th></tr>";

foreach ($categories_raw as $cat) {
    echo "<tr>";
    echo "<td>{$cat->categoryname}</td>";
    echo "<td>{$cat->quizid}</td>";
    echo "<td>{$cat->quiz_name}</td>";
    echo "<td>{$cat->count}</td>";
    echo "</tr>";
}

echo "</table>";

// 2. Probar la función get_failed_questions_by_category()
echo "<br><h3>2. 🔧 Resultado de get_failed_questions_by_category()</h3>";

$categories_function = get_failed_questions_by_category($USER->id);

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>ID</th><th>Nombre</th><th>Cantidad</th></tr>";

foreach ($categories_function as $cat) {
    echo "<tr>";
    echo "<td>{$cat['id']}</td>";
    echo "<td>{$cat['name']}</td>";
    echo "<td>{$cat['count']}</td>";
    echo "</tr>";
}

echo "</table>";

// 3. Comparar con consulta directa similar a la función
echo "<br><h3>3. 🔍 Consulta directa (como en la función)</h3>";

$sql = "SELECT fq.categoryid as id, fq.categoryname as name, 
               COALESCE(q.name, fq.categoryname) as display_name,
               COUNT(*) as count
        FROM {local_failed_questions_recovery} fq
        LEFT JOIN {quiz} q ON fq.quizid = q.id
        WHERE fq.userid = ? AND fq.mastered = 0
        GROUP BY fq.categoryid, fq.categoryname, q.name
        ORDER BY COALESCE(q.name, fq.categoryname)";

$categories_direct = $DB->get_records_sql($sql, [$USER->id]);

echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
echo "<tr><th>ID</th><th>Category Name</th><th>Display Name</th><th>Cantidad</th></tr>";

foreach ($categories_direct as $cat) {
    echo "<tr>";
    echo "<td>{$cat->id}</td>";
    echo "<td>{$cat->name}</td>";
    echo "<td>{$cat->display_name}</td>";
    echo "<td>{$cat->count}</td>";
    echo "</tr>";
}

echo "</table>";

// 4. Verificar preguntas que aún tienen problemas
echo "<br><h3>4. ⚠️ Preguntas que aún podrían tener problemas</h3>";

$problem_questions = $DB->get_records_sql("
    SELECT fq.*, q.name as correct_quiz_name
    FROM {local_failed_questions_recovery} fq
    LEFT JOIN {quiz} q ON fq.quizid = q.id
    WHERE fq.userid = ? 
    AND (fq.categoryname != q.name OR q.name IS NULL)
    AND fq.mastered = 0
", [$USER->id]);

if (empty($problem_questions)) {
    echo "✅ No se encontraron problemas adicionales.<br>";
} else {
    echo "⚠️ Encontradas " . count($problem_questions) . " preguntas con problemas:<br>";
    
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Question ID</th><th>Quiz ID</th><th>Categoría Actual</th><th>Quiz Name Correcto</th></tr>";
    
    foreach ($problem_questions as $q) {
        echo "<tr>";
        echo "<td>{$q->questionid}</td>";
        echo "<td>{$q->quizid}</td>";
        echo "<td>{$q->categoryname}</td>";
        echo "<td>{$q->correct_quiz_name}</td>";
        echo "</tr>";
    }
    
    echo "</table>";
}

// 5. Mostrar total de categorías únicas
$unique_categories = $DB->get_records_sql("
    SELECT DISTINCT categoryname, COUNT(*) as total_questions
    FROM {local_failed_questions_recovery} 
    WHERE userid = ? AND mastered = 0
    GROUP BY categoryname
    ORDER BY categoryname
", [$USER->id]);

echo "<br><h3>5. 📋 Resumen de categorías únicas</h3>";
echo "<p>Total de categorías diferentes: " . count($unique_categories) . "</p>";

foreach ($unique_categories as $cat) {
    echo "📁 <strong>{$cat->categoryname}</strong>: {$cat->total_questions} preguntas<br>";
}

echo "<br><p>📍 <a href='index.php'>← Volver al dashboard</a></p>";
echo "<p>🔧 <a href='fix_categories.php'>Volver a corrección de categorías</a></p>";
?> 