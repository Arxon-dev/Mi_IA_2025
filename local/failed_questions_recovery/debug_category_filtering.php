<?php
require_once('../../config.php');
require_once('lib.php');

// Verificar que el usuario esté autenticado
require_login();

// Configurar la página
$context = context_user::instance($USER->id);
$PAGE->set_context($context);
$PAGE->set_url('/local/failed_questions_recovery/debug_category_filtering.php');
$PAGE->set_title('Debug Filtrado de Categorías');
$PAGE->set_heading('Debug Filtrado de Categorías');

// Inicializar output
echo $OUTPUT->header();

echo '<style>
.debug-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: monospace;
}

.debug-section {
    background: white;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border-left: 5px solid #667eea;
}

.debug-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.debug-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
}

.debug-table th, .debug-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}

.debug-table th {
    background: #f8f9fa;
    font-weight: bold;
}

.debug-table tr:nth-child(even) {
    background: #f8f9fa;
}

.problem {
    background: #f8d7da !important;
    color: #721c24;
}

.good {
    background: #d4edda !important;
    color: #155724;
}

.warning {
    background: #fff3cd !important;
    color: #856404;
}

.sql-query {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 15px;
    margin: 10px 0;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    overflow-x: auto;
}

.test-link {
    display: inline-block;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    text-decoration: none;
    font-weight: bold;
    margin: 10px 5px;
    transition: all 0.3s ease;
}

.test-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
    color: white;
    text-decoration: none;
}
</style>';

echo '<div class="debug-container">';

echo '<h1>🔍 Debug: Filtrado de Categorías en Quiz de Recuperación</h1>';
echo '<p><strong>Propósito:</strong> Verificar que cuando seleccionas "CONSTITUCIÓN - TEST 3" solo aparezcan preguntas de esa categoría, no de "UNIÓN EUROPEA".</p>';

// SECCIÓN 1: Tus categorías disponibles
echo '<div class="debug-section">';
echo '<div class="debug-title">📚 SECCIÓN 1: Tus Categorías Disponibles</div>';

$categories_sql = "SELECT fq.quizid as categoryid, fq.categoryname as display_name,
                  COUNT(*) as failedcount, 
                  SUM(CASE WHEN fq.mastered = 0 THEN 1 ELSE 0 END) as notmasteredcount
                  FROM {local_failed_questions_recovery} fq
                  WHERE fq.userid = :userid
                  GROUP BY fq.quizid, fq.categoryname 
                  HAVING notmasteredcount > 0
                  ORDER BY fq.categoryname";

$categories = $DB->get_records_sql($categories_sql, array('userid' => $USER->id));

echo '<div class="sql-query">';
echo '<strong>Query SQL usado:</strong><br>';
echo htmlspecialchars($categories_sql);
echo '</div>';

if (!empty($categories)) {
    echo '<table class="debug-table">';
    echo '<tr><th>Category ID (quizid)</th><th>Nombre de Categoría</th><th>Total Falladas</th><th>Pendientes</th><th>Acción</th></tr>';
    
    foreach ($categories as $category) {
        echo '<tr>';
        echo '<td>' . $category->categoryid . '</td>';
        echo '<td>' . htmlspecialchars($category->display_name) . '</td>';
        echo '<td>' . $category->failedcount . '</td>';
        echo '<td>' . $category->notmasteredcount . '</td>';
        echo '<td><a href="#" class="test-link" onclick="testCategory(' . $category->categoryid . ', \'' . addslashes($category->display_name) . '\')">🧪 Probar</a></td>';
        echo '</tr>';
    }
    echo '</table>';
} else {
    echo '<p class="warning">⚠️ No se encontraron categorías con preguntas pendientes.</p>';
}

echo '</div>';

// SECCIÓN 2: Preguntas por categoría específica
if (isset($_GET['test_category'])) {
    $test_categoryid = (int)$_GET['test_category'];
    $test_categoryname = $_GET['test_categoryname'] ?? 'Desconocida';
    
    echo '<div class="debug-section">';
    echo '<div class="debug-title">🧪 SECCIÓN 2: Prueba de Filtrado - Categoría: ' . htmlspecialchars($test_categoryname) . ' (ID: ' . $test_categoryid . ')</div>';
    
    // Simular la query que usa create_recovery_quiz
    $filter_sql = "SELECT * FROM {local_failed_questions_recovery} 
                   WHERE userid = :userid 
                   AND mastered = 0 
                   AND quizid = :categoryid
                   ORDER BY lastfailed DESC";
    
    $filtered_questions = $DB->get_records_sql($filter_sql, [
        'userid' => $USER->id, 
        'categoryid' => $test_categoryid
    ]);
    
    echo '<div class="sql-query">';
    echo '<strong>Query de Filtrado (simulando create_recovery_quiz):</strong><br>';
    echo htmlspecialchars($filter_sql) . '<br><br>';
    echo '<strong>Parámetros:</strong><br>';
    echo 'userid = ' . $USER->id . '<br>';
    echo 'categoryid = ' . $test_categoryid;
    echo '</div>';
    
    if (!empty($filtered_questions)) {
        echo '<p class="good">✅ <strong>Se encontraron ' . count($filtered_questions) . ' preguntas para esta categoría.</strong></p>';
        
        echo '<table class="debug-table">';
        echo '<tr><th>Question ID</th><th>Quiz ID</th><th>Categoría</th><th>Texto (primeros 100 chars)</th><th>Tipo</th><th>Intentos</th></tr>';
        
        $categories_found = [];
        foreach ($filtered_questions as $question) {
            $categories_found[$question->categoryname] = ($categories_found[$question->categoryname] ?? 0) + 1;
            
            // Detectar si hay mezcla de categorías
            $row_class = '';
            if ($question->categoryname !== $test_categoryname) {
                $row_class = 'problem';
            }
            
            echo '<tr class="' . $row_class . '">';
            echo '<td>' . $question->questionid . '</td>';
            echo '<td>' . $question->quizid . '</td>';
            echo '<td>' . htmlspecialchars($question->categoryname) . '</td>';
            echo '<td>' . htmlspecialchars(substr(strip_tags($question->questiontext), 0, 100)) . '...</td>';
            echo '<td>' . $question->questiontype . '</td>';
            echo '<td>' . $question->attempts . '</td>';
            echo '</tr>';
        }
        echo '</table>';
        
        // Análisis de categorías encontradas
        echo '<div class="debug-section">';
        echo '<div class="debug-title">📊 Análisis de Resultados</div>';
        
        if (count($categories_found) === 1 && isset($categories_found[$test_categoryname])) {
            echo '<p class="good">✅ <strong>PERFECTO:</strong> Todas las preguntas pertenecen a la categoría seleccionada (' . htmlspecialchars($test_categoryname) . ').</p>';
        } else {
            echo '<p class="problem">❌ <strong>PROBLEMA DETECTADO:</strong> Se encontraron preguntas de múltiples categorías:</p>';
            echo '<ul>';
            foreach ($categories_found as $cat_name => $count) {
                $status = ($cat_name === $test_categoryname) ? '✅' : '❌';
                echo '<li>' . $status . ' <strong>' . htmlspecialchars($cat_name) . ':</strong> ' . $count . ' preguntas</li>';
            }
            echo '</ul>';
            echo '<p><strong>🔧 Solución:</strong> Esto indica que hay preguntas con el mismo quizid pero diferentes nombres de categoría. Necesitamos corregir la base de datos.</p>';
        }
        echo '</div>';
        
    } else {
        echo '<p class="warning">⚠️ No se encontraron preguntas para esta categoría. Esto podría indicar que:</p>';
        echo '<ul>';
        echo '<li>Todas las preguntas ya están dominadas (mastered = 1)</li>';
        echo '<li>El filtrado está funcionando correctamente y esta categoría está vacía</li>';
        echo '<li>Hay un problema en el mapeo de IDs</li>';
        echo '</ul>';
    }
}

// SECCIÓN 3: Todas las preguntas para comparar
echo '<div class="debug-section">';
echo '<div class="debug-title">📋 SECCIÓN 3: Todas Tus Preguntas Falladas (para comparación)</div>';

$all_questions = $DB->get_records('local_failed_questions_recovery', ['userid' => $USER->id, 'mastered' => 0], 'categoryname, quizid');

if (!empty($all_questions)) {
    echo '<p>Total de preguntas pendientes: <strong>' . count($all_questions) . '</strong></p>';
    
    // Agrupar por categoría para análisis
    $by_category = [];
    foreach ($all_questions as $q) {
        $key = $q->categoryname . ' (Quiz ID: ' . $q->quizid . ')';
        $by_category[$key] = ($by_category[$key] ?? 0) + 1;
    }
    
    echo '<table class="debug-table">';
    echo '<tr><th>Categoría (Quiz ID)</th><th>Cantidad de Preguntas</th></tr>';
    foreach ($by_category as $category => $count) {
        echo '<tr>';
        echo '<td>' . htmlspecialchars($category) . '</td>';
        echo '<td>' . $count . '</td>';
        echo '</tr>';
    }
    echo '</table>';
    
} else {
    echo '<p class="good">✅ No tienes preguntas falladas pendientes. ¡Excelente progreso!</p>';
}

echo '</div>';

// SECCIÓN 4: Enlaces de prueba
echo '<div class="debug-section">';
echo '<div class="debug-title">🚀 SECCIÓN 4: Pruebas Reales</div>';
echo '<p>Usa estos enlaces para probar el sistema real:</p>';

foreach ($categories as $category) {
    echo '<a href="create_quiz.php?category=' . $category->categoryid . '" class="test-link" target="_blank">';
    echo '🎯 Crear Quiz: ' . htmlspecialchars($category->display_name);
    echo '</a>';
}

echo '<br><br>';
echo '<a href="student_dashboard.php" class="test-link">🏠 Volver al Dashboard</a>';
echo '<a href="index.php" class="test-link">📊 Dashboard Completo</a>';

echo '</div>';

echo '</div>'; // Cerrar container

echo '<script>
function testCategory(categoryId, categoryName) {
    window.location.href = "?test_category=" + categoryId + "&test_categoryname=" + encodeURIComponent(categoryName);
}
</script>';

echo $OUTPUT->footer();
?> 