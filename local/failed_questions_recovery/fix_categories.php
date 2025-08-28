<?php
require_once('../../config.php');
require_once($CFG->dirroot.'/local/failed_questions_recovery/lib.php');

require_login();

echo "<h2>🔧 Corrección de Categorías Erróneas</h2>";

global $DB, $USER;

// Obtener todas las preguntas mal categorizadas del usuario actual
$wrong_categories = $DB->get_records_sql("
    SELECT fq.*, q.name as correct_quiz_name
    FROM {local_failed_questions_recovery} fq
    JOIN {quiz} q ON fq.quizid = q.id
    WHERE fq.userid = ? 
    AND fq.categoryname != q.name
", [$USER->id]);

if (empty($wrong_categories)) {
    echo "✅ No se encontraron categorías erróneas para corregir.<br>";
} else {
    echo "<h3>🔍 Preguntas con categorías incorrectas encontradas: " . count($wrong_categories) . "</h3>";
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['fix_categories'])) {
        echo "<h3>🔄 Corrigiendo categorías...</h3>";
        
        $fixed_count = 0;
        $error_count = 0;
        
        foreach ($wrong_categories as $record) {
            try {
                // Actualizar con el nombre correcto del quiz
                $record->categoryname = $record->correct_quiz_name;
                $record->timemodified = time();
                
                $DB->update_record('local_failed_questions_recovery', $record);
                
                echo "✅ Corregida pregunta {$record->questionid}: {$record->correct_quiz_name}<br>";
                $fixed_count++;
                
            } catch (Exception $e) {
                echo "❌ Error corrigiendo pregunta {$record->questionid}: " . $e->getMessage() . "<br>";
                $error_count++;
            }
        }
        
        echo "<br><h3>📊 Resumen de la Corrección:</h3>";
        echo "✅ Preguntas corregidas: $fixed_count<br>";
        echo "❌ Errores: $error_count<br>";
        
        if ($fixed_count > 0) {
            echo "<br>🎉 <strong>¡Corrección completada!</strong><br>";
            echo "📍 <a href='index.php'>Volver al dashboard</a> para ver las categorías corregidas<br>";
        }
        
    } else {
        // Mostrar las preguntas que necesitan corrección
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Question ID</th><th>Quiz ID</th><th>Categoría Actual (Incorrecta)</th><th>Categoría Correcta</th></tr>";
        
        foreach ($wrong_categories as $record) {
            echo "<tr>";
            echo "<td>{$record->questionid}</td>";
            echo "<td>{$record->quizid}</td>";
            echo "<td style='color: red;'>{$record->categoryname}</td>";
            echo "<td style='color: green;'>{$record->correct_quiz_name}</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        echo "<br><form method='post'>";
        echo "<button type='submit' name='fix_categories' value='1' style='background: #28a745; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px;'>🔧 Corregir Todas las Categorías</button>";
        echo "</form>";
    }
}

// También mostrar un botón para limpiar duplicados si existen
$duplicates = $DB->get_records_sql("
    SELECT questionid, userid, COUNT(*) as count
    FROM {local_failed_questions_recovery}
    WHERE userid = ?
    GROUP BY questionid, userid
    HAVING COUNT(*) > 1
", [$USER->id]);

if (!empty($duplicates)) {
    echo "<br><h3>⚠️ Preguntas duplicadas encontradas: " . count($duplicates) . "</h3>";
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['clean_duplicates'])) {
        echo "<h3>🔄 Limpiando duplicados...</h3>";
        
        $cleaned_count = 0;
        
        foreach ($duplicates as $duplicate) {
            // Mantener solo el registro más reciente
            $records = $DB->get_records('local_failed_questions_recovery', [
                'userid' => $USER->id,
                'questionid' => $duplicate->questionid
            ], 'timemodified DESC');
            
            $keep_first = true;
            foreach ($records as $record) {
                if ($keep_first) {
                    $keep_first = false;
                    continue; // Mantener el más reciente
                }
                
                $DB->delete_record('local_failed_questions_recovery', ['id' => $record->id]);
                echo "🗑️ Eliminado duplicado de pregunta {$record->questionid}<br>";
                $cleaned_count++;
            }
        }
        
        echo "<br>✅ Duplicados eliminados: $cleaned_count<br>";
    } else {
        echo "<form method='post'>";
        echo "<button type='submit' name='clean_duplicates' value='1' style='background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px;'>🗑️ Limpiar Duplicados</button>";
        echo "</form>";
    }
}

echo "<br><p>📍 <a href='index.php'>← Volver al dashboard</a></p>";
echo "<p>🔍 <a href='check_new_quiz.php'>Ver diagnóstico detallado</a></p>";
?> 