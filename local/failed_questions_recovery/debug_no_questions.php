<?php
require_once('../../config.php');
require_once('lib.php');

// Verificar que el usuario esté autenticado
require_login();

echo '<pre style="font-family: monospace; background: #f8f9fa; padding: 20px; border-radius: 5px; max-width: 1200px; margin: 20px auto;">';

echo "🔍 INVESTIGACIÓN: ¿Por qué 'No hay preguntas disponibles'?\n";
echo "=" . str_repeat("=", 70) . "\n\n";

echo "👤 Usuario: {$USER->id}\n";
echo "⏰ Tiempo: " . date('Y-m-d H:i:s') . "\n\n";

// PASO 1: Verificar si hay preguntas falladas EN TOTAL
echo "📊 PASO 1: Verificación General\n";
echo "-" . str_repeat("-", 50) . "\n";

$total_failed = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id]);
$mastered = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id, 'mastered' => 1]);
$pending = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id, 'mastered' => 0]);

echo "Total preguntas falladas registradas: {$total_failed}\n";
echo "Preguntas ya dominadas (mastered=1): {$mastered}\n";
echo "Preguntas pendientes (mastered=0): {$pending}\n\n";

if ($total_failed == 0) {
    echo "❌ PROBLEMA: No tienes preguntas falladas registradas.\n";
    echo "💡 SOLUCIÓN: Necesitas procesar algunos quiz primero.\n";
    echo "   1. Ve a 'Diagnóstico' y procesa un quiz reciente\n";
    echo "   2. O completa un nuevo quiz y procesalo después\n\n";
    echo "🏁 Diagnóstico terminado.\n";
    echo '</pre>';
    exit;
}

if ($pending == 0) {
    echo "🎉 ¡FELICIDADES! Todas tus preguntas falladas ya están dominadas.\n";
    echo "💡 INFO: Por eso aparece 'No hay preguntas disponibles'.\n";
    echo "   - Necesitas fallar más preguntas en nuevos quiz\n";
    echo "   - O resetear algunas preguntas a 'no dominadas'\n\n";
    echo "🏁 Diagnóstico terminado.\n";
    echo '</pre>';
    exit;
}

// PASO 2: Verificar las categorías que devuelve get_failed_questions_by_category
echo "📋 PASO 2: Categorías Disponibles\n";
echo "-" . str_repeat("-", 50) . "\n";

$categories = get_failed_questions_by_category($USER->id);

if (empty($categories)) {
    echo "❌ PROBLEMA: get_failed_questions_by_category() no devuelve nada.\n";
    echo "💡 Pero sabemos que hay {$pending} preguntas pendientes...\n\n";
    
    // Investigar por qué la función no funciona
    echo "🔍 Investigando la consulta SQL directamente...\n";
    
    $debug_sql = "SELECT 
                    COALESCE(q.name, fq.categoryname) as display_name,
                    COUNT(*) as count,
                    MIN(fq.quizid) as id,
                    MIN(fq.quizid) as quizid,
                    MIN(fq.categoryid) as categoryid,
                    GROUP_CONCAT(DISTINCT fq.quizid) as all_quizids,
                    GROUP_CONCAT(DISTINCT fq.categoryid) as all_categoryids
                FROM {local_failed_questions_recovery} fq
                LEFT JOIN {quiz} q ON fq.quizid = q.id
                WHERE fq.userid = ? 
                AND fq.mastered = 0
                GROUP BY COALESCE(q.name, fq.categoryname)
                HAVING COUNT(*) > 0
                ORDER BY display_name";
    
    $debug_result = $DB->get_records_sql($debug_sql, [$USER->id]);
    
    if (empty($debug_result)) {
        echo "❌ La consulta SQL tampoco devuelve resultados.\n";
        echo "🔍 Verificando registros individuales...\n\n";
        
        $sample_records = $DB->get_records('local_failed_questions_recovery', 
            ['userid' => $USER->id, 'mastered' => 0], 
            'id DESC', 
            'id, quizid, categoryid, categoryname, questiontext', 
            0, 5);
        
        foreach ($sample_records as $record) {
            echo "ID: {$record->id} | QuizID: {$record->quizid} | CategoryID: {$record->categoryid} | Name: {$record->categoryname}\n";
            $text = strip_tags($record->questiontext);
            $text = substr($text, 0, 80) . (strlen($text) > 80 ? '...' : '');
            echo "   Texto: {$text}\n\n";
        }
        
    } else {
        echo "✅ La consulta SQL SÍ devuelve resultados:\n\n";
        foreach ($debug_result as $cat) {
            echo "Categoría: {$cat->display_name}\n";
            echo "   Count: {$cat->count}\n";
            echo "   ID (quizid): {$cat->id}\n";
            echo "   Todos los quizids: {$cat->all_quizids}\n";
            echo "   Todos los categoryids: {$cat->all_categoryids}\n\n";
        }
    }
    
} else {
    echo "✅ Se encontraron " . count($categories) . " categorías:\n\n";
    
    foreach ($categories as $i => $category) {
        echo ($i + 1) . ". {$category['name']}\n";
        echo "   ID (será usado como filtro): {$category['id']}\n";
        echo "   Quiz ID: {$category['quizid']}\n";
        echo "   Category ID: {$category['categoryid']}\n";
        echo "   Preguntas: {$category['count']}\n\n";
    }
    
    // PASO 3: Probar el filtrado específico
    $test_category = $categories[0];
    
    echo "🧪 PASO 3: Prueba de Filtrado Específico\n";
    echo "-" . str_repeat("-", 50) . "\n";
    echo "Probando filtro con categoría: {$test_category['name']}\n";
    echo "ID que se usará como filtro: {$test_category['id']}\n\n";
    
    // Simular exactamente lo que hace create_recovery_quiz
    $conditions = array(
        'userid' => $USER->id,
        'mastered' => 0,
        'quizid' => $test_category['id']  // Este debería ser el filtro correcto ahora
    );
    
    echo "📝 Condiciones de filtrado:\n";
    foreach ($conditions as $key => $value) {
        echo "   {$key} = {$value}\n";
    }
    echo "\n";
    
    $filtered_questions = $DB->get_records('local_failed_questions_recovery', $conditions, 'lastfailed DESC');
    
    if (empty($filtered_questions)) {
        echo "❌ PROBLEMA: No se encontraron preguntas con estas condiciones.\n";
        echo "🔍 Probando filtrados alternativos...\n\n";
        
        // Probar sin filtro de quizid
        $alt_conditions = array(
            'userid' => $USER->id,
            'mastered' => 0
        );
        
        $all_questions = $DB->get_records('local_failed_questions_recovery', $alt_conditions, 'lastfailed DESC', '*', 0, 5);
        
        if (!empty($all_questions)) {
            echo "✅ SIN filtro de quiz: Se encontraron " . count($all_questions) . " preguntas.\n";
            echo "📋 Muestra de preguntas sin filtrar:\n\n";
            
            foreach ($all_questions as $q) {
                echo "   QuizID: {$q->quizid} | CategoryID: {$q->categoryid} | Name: {$q->categoryname}\n";
                $text = strip_tags($q->questiontext);
                $text = substr($text, 0, 80) . (strlen($text) > 80 ? '...' : '');
                echo "   Texto: {$text}\n\n";
            }
            
            echo "💡 DIAGNÓSTICO: Las preguntas existen, pero el filtro de quizid no coincide.\n";
            echo "🔧 POSIBLE SOLUCIÓN: Los quizid en las preguntas no coinciden con los del dashboard.\n";
            
        } else {
            echo "❌ Incluso sin filtro no hay preguntas. Problema en la base de datos.\n";
        }
        
    } else {
        echo "✅ ÉXITO: Se encontraron " . count($filtered_questions) . " preguntas con el filtro.\n";
        echo "🎉 El filtrado está funcionando correctamente.\n";
        echo "💡 Si sigues viendo 'No hay preguntas disponibles', el problema está en otro lado.\n\n";
        
        echo "📋 Preguntas encontradas:\n";
        $count = 0;
        foreach ($filtered_questions as $q) {
            if ($count >= 3) break;
            $count++;
            
            $text = strip_tags($q->questiontext);
            $text = substr($text, 0, 100) . (strlen($text) > 100 ? '...' : '');
            
            echo "   {$count}. ID: {$q->questionid} | Quiz: {$q->quizid} | Categoría: {$q->categoryname}\n";
            echo "      Texto: {$text}\n\n";
        }
    }
}

echo "\n" . "=" . str_repeat("=", 70) . "\n";
echo "🏁 Diagnóstico completado\n";
echo "📝 Usa esta información para reportar el problema específico.\n";
echo '</pre>';

// Agregar botón para volver
echo '<div style="text-align: center; margin: 20px;">';
echo '<a href="student_dashboard.php" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">← Volver al Dashboard</a>';
echo '</div>';
?> 