<?php
require_once('../../config.php');
require_once($CFG->dirroot . '/local/failed_questions_recovery/lib.php');

// Require login
require_login();

// Check permissions
$systemcontext = context_system::instance();
require_capability('moodle/site:config', $systemcontext);

$PAGE->set_url('/local/failed_questions_recovery/debug_dashboard.php');
$PAGE->set_context($systemcontext);
$PAGE->set_title('Debug Dashboard - Failed Questions Recovery');
$PAGE->set_heading('🔍 Debug Dashboard - Failed Questions Recovery');

echo $OUTPUT->header();

echo '<div class="container-fluid">';
echo '<div class="alert alert-info"><strong>🔍 Diagnóstico Dashboard</strong><br>Analizando por qué las nuevas preguntas no aparecen en el dashboard.</div>';

$userid = $USER->id;

echo '<h3>1. 📊 Verificación básica de datos</h3>';

// Contar preguntas fallidas totales
$total_failed = $DB->count_records('local_failed_questions_recovery', array('userid' => $userid));
echo "<p><strong>Total preguntas fallidas registradas:</strong> $total_failed</p>";

// Contar preguntas no masterizadas
$not_mastered = $DB->count_records('local_failed_questions_recovery', array('userid' => $userid, 'mastered' => 0));
echo "<p><strong>Preguntas no masterizadas (deben aparecer):</strong> $not_mastered</p>";

// Mostrar las últimas 10 preguntas
echo '<h3>2. 🆕 Últimas 10 preguntas fallidas (sin filtros)</h3>';
$sql = "SELECT id, questionid, categoryname, categoryid, quizid, courseid, mastered, lastfailed 
        FROM {local_failed_questions_recovery} 
        WHERE userid = ? 
        ORDER BY lastfailed DESC 
        LIMIT 10";

$recent_questions = $DB->get_records_sql($sql, array($userid));

echo '<table class="table table-striped table-sm">';
echo '<thead><tr><th>ID</th><th>Question ID</th><th>Category</th><th>Category ID</th><th>Quiz ID</th><th>Course ID</th><th>Masterizada</th><th>Última Falla</th></tr></thead>';
foreach ($recent_questions as $q) {
    $mastered_text = $q->mastered ? '✅ Sí' : '❌ No';
    $date = date('Y-m-d H:i:s', $q->lastfailed);
    echo "<tr><td>{$q->id}</td><td>{$q->questionid}</td><td>{$q->categoryname}</td><td>{$q->categoryid}</td><td>{$q->quizid}</td><td>{$q->courseid}</td><td>$mastered_text</td><td>$date</td></tr>";
}
echo '</table>';

echo '<h3>3. 🎯 Verificación del JOIN con tabla quiz</h3>';

// Verificar si el quiz ID 52 existe
$quiz_52 = $DB->get_record('quiz', array('id' => 52));
if ($quiz_52) {
    echo "<p>✅ <strong>Quiz ID 52 encontrado:</strong> {$quiz_52->name}</p>";
} else {
    echo "<p>❌ <strong>Quiz ID 52 NO encontrado en tabla quiz</strong></p>";
}

// Probar la consulta de categorías EXACTA que usa el dashboard
echo '<h3>4. 🔧 Prueba de consulta del dashboard (función get_failed_questions_by_category)</h3>';

try {
    $categories = get_failed_questions_by_category($userid);
    echo "<p><strong>Categorías devueltas por la función:</strong> " . count($categories) . "</p>";
    
    if (count($categories) > 0) {
        echo '<table class="table table-striped">';
        echo '<thead><tr><th>ID</th><th>Nombre</th><th>Cantidad</th></tr></thead>';
        foreach ($categories as $cat) {
            echo "<tr><td>{$cat['id']}</td><td>{$cat['name']}</td><td>{$cat['count']}</td></tr>";
        }
        echo '</table>';
    } else {
        echo '<div class="alert alert-warning">❌ La función get_failed_questions_by_category() devuelve 0 categorías</div>';
    }
} catch (Exception $e) {
    echo '<div class="alert alert-danger">❌ Error en get_failed_questions_by_category(): ' . $e->getMessage() . '</div>';
}

echo '<h3>5. 🕵️ Consulta SQL MANUAL (paso a paso)</h3>';

// Ejecutar la misma consulta SQL manualmente
$sql_manual = "SELECT fq.categoryid as id, fq.categoryname as name, 
               COALESCE(q.name, fq.categoryname) as display_name,
               COUNT(*) as count
        FROM {local_failed_questions_recovery} fq
        LEFT JOIN {quiz} q ON fq.quizid = q.id
        WHERE fq.userid = ? AND fq.mastered = 0
        GROUP BY fq.categoryid, fq.categoryname, q.name
        ORDER BY COALESCE(q.name, fq.categoryname)";

echo '<p><strong>Consulta SQL:</strong></p>';
echo '<pre>' . htmlspecialchars($sql_manual) . '</pre>';

try {
    $manual_results = $DB->get_records_sql($sql_manual, array($userid));
    echo "<p><strong>Resultados de consulta manual:</strong> " . count($manual_results) . "</p>";
    
    if (count($manual_results) > 0) {
        echo '<table class="table table-striped">';
        echo '<thead><tr><th>ID</th><th>Name</th><th>Display Name</th><th>Count</th></tr></thead>';
        foreach ($manual_results as $result) {
            echo "<tr><td>{$result->id}</td><td>{$result->name}</td><td>{$result->display_name}</td><td>{$result->count}</td></tr>";
        }
        echo '</table>';
    }
} catch (Exception $e) {
    echo '<div class="alert alert-danger">❌ Error en consulta manual: ' . $e->getMessage() . '</div>';
}

echo '<h3>6. 🔍 Análisis específico de Quiz ID 52</h3>';

// Verificar preguntas específicas del quiz 52
$sql_quiz52 = "SELECT fq.*, q.name as quiz_name 
               FROM {local_failed_questions_recovery} fq
               LEFT JOIN {quiz} q ON fq.quizid = q.id
               WHERE fq.userid = ? AND fq.quizid = 52";

$quiz52_questions = $DB->get_records_sql($sql_quiz52, array($userid));
echo "<p><strong>Preguntas del Quiz ID 52:</strong> " . count($quiz52_questions) . "</p>";

if (count($quiz52_questions) > 0) {
    echo '<table class="table table-striped table-sm">';
    echo '<thead><tr><th>ID</th><th>Question ID</th><th>Category Name</th><th>Quiz Name</th><th>Masterizada</th><th>Última Falla</th></tr></thead>';
    foreach ($quiz52_questions as $q) {
        $mastered_text = $q->mastered ? '✅ Sí' : '❌ No';
        $date = date('Y-m-d H:i:s', $q->lastfailed);
        $quiz_name = $q->quiz_name ?: 'Sin nombre';
        echo "<tr><td>{$q->id}</td><td>{$q->questionid}</td><td>{$q->categoryname}</td><td>$quiz_name</td><td>$mastered_text</td><td>$date</td></tr>";
    }
    echo '</table>';
}

echo '<h3>7. 🎪 Prueba sin JOIN (consulta simple)</h3>';

// Probar sin JOIN para ver si hay algún problema
$sql_simple = "SELECT categoryid as id, categoryname as name, COUNT(*) as count
               FROM {local_failed_questions_recovery} 
               WHERE userid = ? AND mastered = 0
               GROUP BY categoryid, categoryname
               ORDER BY categoryname";

$simple_results = $DB->get_records_sql($sql_simple, array($userid));
echo "<p><strong>Resultados sin JOIN:</strong> " . count($simple_results) . "</p>";

if (count($simple_results) > 0) {
    echo '<table class="table table-striped">';
    echo '<thead><tr><th>Category ID</th><th>Category Name</th><th>Count</th></tr></thead>';
    foreach ($simple_results as $result) {
        echo "<tr><td>{$result->id}</td><td>{$result->name}</td><td>{$result->count}</td></tr>";
    }
    echo '</table>';
}

echo '<div class="alert alert-info mt-4">';
echo '<p><strong>📋 Resumen del diagnóstico:</strong></p>';
echo '<ul>';
echo "<li>Total preguntas fallidas: $total_failed</li>";
echo "<li>Preguntas no masterizadas: $not_mastered</li>";
echo '<li>Categorías devueltas por función dashboard: ' . (isset($categories) ? count($categories) : 'Error') . '</li>';
echo '<li>Quiz ID 52 existe: ' . ($quiz_52 ? '✅ Sí' : '❌ No') . '</li>';
echo '<li>Preguntas del Quiz 52: ' . count($quiz52_questions) . '</li>';
echo '<li>Categorías sin JOIN: ' . count($simple_results) . '</li>';
echo '</ul>';
echo '</div>';

echo '<p><a href="index.php" class="btn btn-primary">← Volver al dashboard</a></p>';

echo '</div>';

echo $OUTPUT->footer();
?> 