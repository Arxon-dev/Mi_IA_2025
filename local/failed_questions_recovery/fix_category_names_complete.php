<?php
require_once('../../config.php');
require_once('lib.php');

require_login();

echo "<h1>🔧 Corrección Completa de Nombres de Categorías</h1>";

global $DB;

echo '<style>
.fix-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.step-section {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    padding: 25px;
    margin: 20px 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.step-header {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: bold;
    font-size: 1.2em;
}

.results-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
}

.results-table th, .results-table td {
    border: 1px solid #dee2e6;
    padding: 10px;
    text-align: left;
}

.results-table th {
    background: #f8f9fa;
    font-weight: bold;
}

.success-msg {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
}

.warning-msg {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
}

.info-msg {
    background: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
}

.btn-fix {
    background: #28a745;
    color: white;
    padding: 12px 25px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    margin: 10px 5px;
}

.btn-fix:hover {
    background: #218838;
    color: white;
    text-decoration: none;
}

.btn-secondary {
    background: #6c757d;
    color: white;
    padding: 12px 25px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    margin: 10px 5px;
}

.btn-secondary:hover {
    background: #5a6268;
    color: white;
    text-decoration: none;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.stat-card {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
}

.stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 5px;
}

.stat-label {
    color: #6c757d;
    font-weight: 500;
}
</style>';

echo '<div class="fix-container">';

// Verificar si se solicita la corrección
$fix_all = optional_param('fix_all', 0, PARAM_INT);

// Análisis inicial
echo '<div class="step-section">';
echo '<div class="step-header">📊 Análisis del Estado Actual</div>';

// Contar registros con códigos vs nombres reales
$total_records = $DB->count_records('local_failed_questions_recovery');

$codes_pattern_sql = "SELECT COUNT(*) FROM {local_failed_questions_recovery} 
                      WHERE categoryname REGEXP '^[A-Z][0-9]+$'";
$records_with_codes = $DB->count_records_sql($codes_pattern_sql);

$quiz_names_sql = "SELECT COUNT(DISTINCT fq.id) 
                   FROM {local_failed_questions_recovery} fq
                   JOIN {quiz} q ON fq.quizid = q.id
                   WHERE fq.categoryname != q.name";
$fixable_records = $DB->count_records_sql($quiz_names_sql);

echo '<div class="stats-grid">';
echo '<div class="stat-card">';
echo '<div class="stat-number">' . $total_records . '</div>';
echo '<div class="stat-label">Total Registros</div>';
echo '</div>';

echo '<div class="stat-card">';
echo '<div class="stat-number">' . $records_with_codes . '</div>';
echo '<div class="stat-label">Con Códigos (W1, S2, etc.)</div>';
echo '</div>';

echo '<div class="stat-card">';
echo '<div class="stat-number">' . $fixable_records . '</div>';
echo '<div class="stat-label">Registros Corregibles</div>';
echo '</div>';
echo '</div>';

if ($fixable_records > 0) {
    echo '<div class="warning-msg">';
    echo '<strong>⚠️ Se encontraron ' . $fixable_records . ' registros que necesitan corrección.</strong><br>';
    echo 'Estos registros tienen nombres de categoría que no coinciden con el nombre real del quiz.';
    echo '</div>';
} else {
    echo '<div class="success-msg">';
    echo '<strong>✅ ¡Perfecto!</strong> Todos los registros ya tienen nombres correctos.';
    echo '</div>';
}

echo '</div>';

// Mostrar ejemplos de registros problemáticos
if ($fixable_records > 0) {
    echo '<div class="step-section">';
    echo '<div class="step-header">🔍 Ejemplos de Registros Problemáticos</div>';
    
    $problematic_sql = "SELECT fq.id, fq.categoryname, q.name as quiz_name, fq.userid
                        FROM {local_failed_questions_recovery} fq
                        JOIN {quiz} q ON fq.quizid = q.id
                        WHERE fq.categoryname != q.name
                        ORDER BY fq.id DESC
                        LIMIT 10";
    
    $problematic = $DB->get_records_sql($problematic_sql);
    
    if ($problematic) {
        echo '<table class="results-table">';
        echo '<tr><th>ID</th><th>Categoría Actual (Incorrecta)</th><th>Nombre Real del Quiz</th><th>Usuario</th></tr>';
        
        foreach ($problematic as $record) {
            echo '<tr>';
            echo '<td>' . $record->id . '</td>';
            echo '<td style="color: #dc3545; font-weight: bold;">' . htmlspecialchars($record->categoryname) . '</td>';
            echo '<td style="color: #28a745; font-weight: bold;">' . htmlspecialchars($record->quiz_name) . '</td>';
            echo '<td>' . $record->userid . '</td>';
            echo '</tr>';
        }
        
        echo '</table>';
    }
    
    echo '</div>';
}

// Proceso de corrección
if ($fix_all && $fixable_records > 0) {
    echo '<div class="step-section">';
    echo '<div class="step-header">🔧 Proceso de Corrección</div>';
    
    try {
        // Actualizar todos los registros problemáticos
        $update_sql = "UPDATE {local_failed_questions_recovery} fq
                       JOIN {quiz} q ON fq.quizid = q.id
                       SET fq.categoryname = q.name,
                           fq.timemodified = ?
                       WHERE fq.categoryname != q.name";
        
        $updated_count = $DB->execute($update_sql, [time()]);
        
        if ($updated_count) {
            echo '<div class="success-msg">';
            echo '<strong>✅ ¡Corrección Completada!</strong><br>';
            echo 'Se han actualizado todos los registros problemáticos.<br>';
            echo 'Ahora todos los registros muestran el nombre real del quiz en lugar de códigos.';
            echo '</div>';
            
            // Verificar el resultado
            $remaining_issues = $DB->count_records_sql($quiz_names_sql);
            echo '<div class="info-msg">';
            echo '<strong>📊 Verificación:</strong> Quedan ' . $remaining_issues . ' registros con problemas (debería ser 0).';
            echo '</div>';
            
        } else {
            echo '<div class="warning-msg">';
            echo '<strong>⚠️ No se realizaron cambios.</strong><br>';
            echo 'Es posible que los registros ya estén correctos o que haya ocurrido un problema.';
            echo '</div>';
        }
        
    } catch (Exception $e) {
        echo '<div class="warning-msg">';
        echo '<strong>❌ Error durante la corrección:</strong><br>';
        echo htmlspecialchars($e->getMessage());
        echo '</div>';
    }
    
    echo '</div>';
}

// Mostrar estado después de la corrección (o botón para corregir)
echo '<div class="step-section">';
echo '<div class="step-header">🎯 Acciones Disponibles</div>';

if ($fixable_records > 0 && !$fix_all) {
    echo '<div class="info-msg">';
    echo '<strong>💡 ¿Qué hará la corrección?</strong><br>';
    echo '• Cambiará nombres como "W2" por "UNIÓN EUROPEA -TEST 2"<br>';
    echo '• Usará el nombre real del quiz en lugar del código de categoría<br>';
    echo '• Mantendrá todos los demás datos intactos<br>';
    echo '• Es un proceso seguro y reversible';
    echo '</div>';
    
    echo '<a href="?fix_all=1" class="btn-fix" onclick="return confirm(\'¿Estás seguro de que quieres corregir todos los nombres de categorías? Este proceso actualizará ' . $fixable_records . ' registros.\')">🔧 Corregir Todos los Nombres</a>';
} elseif ($fixable_records == 0) {
    echo '<div class="success-msg">';
    echo '<strong>🎉 ¡Sistema Completamente Actualizado!</strong><br>';
    echo 'Todos los registros ya tienen nombres de categorías correctos.';
    echo '</div>';
}

echo '<a href="student_dashboard.php" class="btn-secondary">🏠 Volver al Dashboard de Estudiantes</a>';
echo '<a href="index.php" class="btn-secondary">📊 Dashboard Técnico</a>';

echo '</div>';

// Estado final del sistema
echo '<div class="step-section">';
echo '<div class="step-header">📈 Estado Final del Sistema</div>';

// Re-calcular estadísticas después de posibles cambios
$final_total = $DB->count_records('local_failed_questions_recovery');
$final_codes = $DB->count_records_sql($codes_pattern_sql);
$final_fixable = $DB->count_records_sql($quiz_names_sql);

echo '<div class="stats-grid">';
echo '<div class="stat-card">';
echo '<div class="stat-number">' . $final_total . '</div>';
echo '<div class="stat-label">Total Registros</div>';
echo '</div>';

echo '<div class="stat-card">';
echo '<div class="stat-number">' . ($final_total - $final_codes) . '</div>';
echo '<div class="stat-label">Con Nombres Correctos</div>';
echo '</div>';

echo '<div class="stat-card">';
echo '<div class="stat-number">' . $final_fixable . '</div>';
echo '<div class="stat-label">Problemas Restantes</div>';
echo '</div>';
echo '</div>';

if ($final_fixable == 0) {
    echo '<div class="success-msg">';
    echo '<strong>🎯 ¡Excelente!</strong> El sistema está funcionando perfectamente.<br>';
    echo 'Todos los estudiantes verán nombres de quiz reales en lugar de códigos.';
    echo '</div>';
}

// Mostrar algunos ejemplos del estado actual
$examples_sql = "SELECT fq.categoryname, q.name as quiz_name, COUNT(*) as count
                 FROM {local_failed_questions_recovery} fq
                 JOIN {quiz} q ON fq.quizid = q.id
                 GROUP BY fq.categoryname, q.name
                 ORDER BY count DESC
                 LIMIT 5";

$examples = $DB->get_records_sql($examples_sql);

if ($examples) {
    echo '<h4>📚 Ejemplos de Categorías Actuales:</h4>';
    echo '<table class="results-table">';
    echo '<tr><th>Nombre Mostrado</th><th>Quiz Real</th><th>Cantidad</th><th>Estado</th></tr>';
    
    foreach ($examples as $example) {
        $status = ($example->categoryname == $example->quiz_name) ? '✅ Correcto' : '❌ Incorrecto';
        $status_color = ($example->categoryname == $example->quiz_name) ? '#28a745' : '#dc3545';
        
        echo '<tr>';
        echo '<td>' . htmlspecialchars($example->categoryname) . '</td>';
        echo '<td>' . htmlspecialchars($example->quiz_name) . '</td>';
        echo '<td>' . $example->count . '</td>';
        echo '<td style="color: ' . $status_color . '; font-weight: bold;">' . $status . '</td>';
        echo '</tr>';
    }
    
    echo '</table>';
}

echo '</div>';

echo '</div>'; // Cerrar container principal
?>

<script>
// Auto-refresh si se hizo una corrección
<?php if ($fix_all && $fixable_records > 0): ?>
setTimeout(function() {
    if (confirm('¿Quieres recargar la página para ver el estado actualizado?')) {
        window.location.href = 'fix_category_names_complete.php';
    }
}, 3000);
<?php endif; ?>
</script> 