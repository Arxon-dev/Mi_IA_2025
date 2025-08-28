<?php
require_once('../../config.php');
require_once('lib.php');

// Verificar que el usuario esté autenticado
require_login();

// No incluir header de Moodle, solo mostrar resultados simples
echo '<pre style="font-family: monospace; background: #f8f9fa; padding: 20px; border-radius: 5px;">';

echo "🔍 DEBUG RÁPIDO: Verificación de Filtrado de Categorías\n";
echo "=" . str_repeat("=", 60) . "\n\n";

echo "👤 Usuario: {$USER->id}\n";
echo "⏰ Tiempo: " . date('Y-m-d H:i:s') . "\n\n";

// PASO 1: Verificar qué categorías devuelve get_failed_questions_by_category
echo "📊 PASO 1: Categorías disponibles\n";
echo "-" . str_repeat("-", 40) . "\n";

$categories = get_failed_questions_by_category($USER->id);

if (empty($categories)) {
    echo "❌ ERROR: No se encontraron categorías con preguntas pendientes.\n";
    echo "💡 Esto podría significar:\n";
    echo "   - Todas tus preguntas ya están dominadas\n";
    echo "   - No tienes preguntas falladas registradas\n";
    echo "   - Hay un problema en la base de datos\n\n";
    
    // Verificar directamente en la BD
    $total_failed = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id]);
    $pending = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id, 'mastered' => 0]);
    
    echo "🔍 Verificación directa en BD:\n";
    echo "   Total preguntas falladas: {$total_failed}\n";
    echo "   Preguntas pendientes: {$pending}\n\n";
    
} else {
    echo "✅ Se encontraron " . count($categories) . " categorías:\n\n";
    
    foreach ($categories as $i => $category) {
        echo ($i + 1) . ". {$category['name']}\n";
        echo "   ID: {$category['id']}\n";
        echo "   Quiz ID: {$category['quizid']}\n";
        echo "   Category ID: {$category['categoryid']}\n";
        echo "   Preguntas: {$category['count']}\n\n";
    }
}

// PASO 2: Probar el filtrado específico si hay categorías
if (!empty($categories)) {
    $test_category = $categories[0]; // Usar la primera categoría
    
    echo "🧪 PASO 2: Prueba de Filtrado\n";
    echo "-" . str_repeat("-", 40) . "\n";
    echo "Probando con: {$test_category['name']} (ID: {$test_category['id']})\n\n";
    
    // Simular la consulta que usa create_recovery_quiz en externallib.php
    $filter_sql = "SELECT * FROM {local_failed_questions_recovery} 
                   WHERE userid = :userid 
                   AND mastered = 0 
                   AND quizid = :categoryid
                   ORDER BY lastfailed DESC";
    
    $filtered_questions = $DB->get_records_sql($filter_sql, [
        'userid' => $USER->id, 
        'categoryid' => $test_category['id']  // Esto ahora debería ser quizid
    ]);
    
    echo "📝 Query ejecutada:\n";
    echo "   WHERE userid = {$USER->id}\n";
    echo "   AND mastered = 0\n";
    echo "   AND quizid = {$test_category['id']}\n\n";
    
    if (empty($filtered_questions)) {
        echo "❌ PROBLEMA: No se encontraron preguntas con el filtrado.\n";
        echo "💡 Esto indica que el ID sigue siendo incorrecto.\n\n";
        
        // Prueba alternativa con categoryid
        echo "🔄 Probando con categoryid en su lugar...\n";
        $alt_filter_sql = "SELECT * FROM {local_failed_questions_recovery} 
                          WHERE userid = :userid 
                          AND mastered = 0 
                          AND categoryid = :categoryid
                          ORDER BY lastfailed DESC";
        
        $alt_filtered = $DB->get_records_sql($alt_filter_sql, [
            'userid' => $USER->id, 
            'categoryid' => $test_category['categoryid']
        ]);
        
        if (!empty($alt_filtered)) {
            echo "✅ ENCONTRADO: {count($alt_filtered)} preguntas usando categoryid.\n";
            echo "🔧 SOLUCIÓN: Necesitamos ajustar el filtrado para usar categoryid.\n";
        } else {
            echo "❌ Tampoco funcionó con categoryid.\n";
        }
        
    } else {
        echo "✅ ÉXITO: Se encontraron " . count($filtered_questions) . " preguntas.\n";
        echo "🎉 El filtrado está funcionando correctamente.\n\n";
        
        // Mostrar algunas preguntas para verificar
        $count = 0;
        foreach ($filtered_questions as $q) {
            if ($count >= 3) break; // Solo mostrar las primeras 3
            $count++;
            
            $text = strip_tags($q->questiontext);
            $text = substr($text, 0, 100) . (strlen($text) > 100 ? '...' : '');
            
            echo "   {$count}. Quiz ID: {$q->quizid}, Categoría: {$q->categoryname}\n";
            echo "      Texto: {$text}\n\n";
        }
    }
}

// PASO 3: Verificar configuración de create_quiz.php
echo "⚙️ PASO 3: Verificación de create_quiz.php\n";
echo "-" . str_repeat("-", 40) . "\n";

$create_quiz_file = __DIR__ . '/create_quiz.php';
if (file_exists($create_quiz_file)) {
    $content = file_get_contents($create_quiz_file);
    
    if (strpos($content, '$categoryid, // ✅ USAR LA CATEGORÍA SELECCIONADA') !== false) {
        echo "✅ create_quiz.php: Usando categoryid correctamente\n";
    } else if (strpos($content, '$categoryid') !== false) {
        echo "⚠️ create_quiz.php: Usa categoryid pero sin el comentario de confirmación\n";
    } else {
        echo "❌ create_quiz.php: Podría estar usando 0 en lugar de categoryid\n";
    }
} else {
    echo "❌ No se pudo encontrar create_quiz.php\n";
}

echo "\n" . "=" . str_repeat("=", 60) . "\n";
echo "🏁 Debug completado\n";
echo "📝 Si ves errores arriba, úsalos para reportar el problema específico.\n";
echo '</pre>';
?> 