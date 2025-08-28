<?php
require_once('../../config.php');
require_once('lib.php');

// Verificar que el usuario esté autenticado
require_login();

// Configurar la página
$context = context_user::instance($USER->id);
$PAGE->set_context($context);
$PAGE->set_url('/local/failed_questions_recovery/student_diagnostic.php');
$PAGE->set_title('Verificar mi Sistema');
$PAGE->set_heading('Verificar mi Sistema');

// Inicializar output
echo $OUTPUT->header();

echo '<style>
.diagnostic-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.diagnostic-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 30px;
    border-radius: 15px;
    text-align: center;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.diagnostic-header h1 {
    margin: 0 0 10px 0;
    font-size: 2.5rem;
    font-weight: 700;
}

.diagnostic-header p {
    margin: 0;
    font-size: 1.2rem;
    opacity: 0.9;
}

.step-card {
    background: white;
    border-radius: 15px;
    padding: 25px;
    margin: 20px 0;
    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
    border-left: 5px solid #667eea;
    transition: all 0.3s ease;
}

.step-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
}

.step-icon {
    font-size: 2rem;
    margin-right: 15px;
    vertical-align: middle;
}

.step-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 15px;
}

.status-good {
    background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    margin: 15px 0;
}

.status-warning {
    background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
    color: #333;
    padding: 15px 20px;
    border-radius: 10px;
    margin: 15px 0;
}

.status-error {
    background: linear-gradient(135deg, #e53e3e 0%, #ff9a9e 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    margin: 15px 0;
}

.info-text {
    font-size: 1rem;
    line-height: 1.6;
    color: #555;
    margin: 10px 0;
}

.suggestion-box {
    background: #f8f9fa;
    border-left: 4px solid #17a2b8;
    padding: 15px 20px;
    margin: 15px 0;
    border-radius: 5px;
}

.suggestion-box strong {
    color: #17a2b8;
}

.number-highlight {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 1.2rem;
    display: inline-block;
    margin: 5px;
}

.back-button {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 30px;
    text-decoration: none;
    border-radius: 25px;
    font-weight: 600;
    margin: 30px auto;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.back-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    color: white;
    text-decoration: none;
}

.progress-indicator {
    display: flex;
    justify-content: space-between;
    margin: 20px 0;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
}

.progress-item {
    text-align: center;
    flex: 1;
}

.progress-item .number {
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
}

.progress-item .label {
    font-size: 0.9rem;
    color: #666;
    margin-top: 5px;
}

@media (max-width: 768px) {
    .diagnostic-header h1 {
        font-size: 2rem;
    }
    
    .step-card {
        padding: 20px 15px;
    }
    
    .progress-indicator {
        flex-direction: column;
    }
    
    .progress-item {
        margin: 10px 0;
    }
}
</style>';

echo '<div class="diagnostic-container">';

// Header principal
echo '<div class="diagnostic-header">';
echo '<h1>🔍 Verificar mi Sistema</h1>';
echo '<p>Vamos a revisar que todo funcione correctamente para ti</p>';
echo '</div>';

// PASO 1: Verificación General
echo '<div class="step-card">';
echo '<div class="step-title"><span class="step-icon">📊</span>Estado de tu Sistema</div>';

$total_failed = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id]);
$mastered = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id, 'mastered' => 1]);
$pending = $DB->count_records('local_failed_questions_recovery', ['userid' => $USER->id, 'mastered' => 0]);

echo '<div class="progress-indicator">';
echo '<div class="progress-item">';
echo '<div class="number">' . $total_failed . '</div>';
echo '<div class="label">Total Preguntas Registradas</div>';
echo '</div>';
echo '<div class="progress-item">';
echo '<div class="number">' . $mastered . '</div>';
echo '<div class="label">Ya Dominadas</div>';
echo '</div>';
echo '<div class="progress-item">';
echo '<div class="number">' . $pending . '</div>';
echo '<div class="label">Por Practicar</div>';
echo '</div>';
echo '</div>';

if ($total_failed == 0) {
    echo '<div class="status-warning">';
    echo '<strong>⚠️ ¡Necesitas procesar algunos exámenes!</strong><br>';
    echo 'No tienes preguntas registradas aún. Realiza un examen y luego procesalo desde el dashboard.';
    echo '</div>';
    
    echo '<div class="suggestion-box">';
    echo '<strong>💡 ¿Qué hacer?</strong><br>';
    echo '1. Realiza un examen en Moodle<br>';
    echo '2. Ve al Dashboard del Sistema<br>';
    echo '3. Haz clic en "Procesar" si aparece tu examen<br>';
    echo '4. ¡Vuelve aquí para verificar!';
    echo '</div>';
    
} else if ($pending == 0) {
    echo '<div class="status-good">';
    echo '<strong>🎉 ¡Felicidades! Has dominado todas tus preguntas</strong><br>';
    echo 'Todas las preguntas que habías fallado ya están marcadas como dominadas.';
    echo '</div>';
    
    echo '<div class="suggestion-box">';
    echo '<strong>💡 Para seguir practicando:</strong><br>';
    echo '• Realiza más exámenes para tener nuevas preguntas<br>';
    echo '• O resetea algunas preguntas si quieres repasarlas';
    echo '</div>';
    
} else {
    echo '<div class="status-good">';
    echo '<strong>✅ ¡Tu sistema está funcionando correctamente!</strong><br>';
    echo 'Tienes <span class="number-highlight">' . $pending . '</span> preguntas esperando que las practiques.';
    echo '</div>';
}

echo '</div>';

// PASO 2: Verificar Categorías (solo si hay preguntas pendientes)
if ($pending > 0) {
    echo '<div class="step-card">';
    echo '<div class="step-title"><span class="step-icon">📚</span>Tus Categorías de Estudio</div>';
    
    $categories = get_failed_questions_by_category($USER->id);
    
    if (!empty($categories)) {
        echo '<div class="status-good">';
        echo '<strong>✅ Categorías encontradas correctamente</strong><br>';
        echo 'El sistema detectó <span class="number-highlight">' . count($categories) . '</span> temas con preguntas por practicar.';
        echo '</div>';
        
        echo '<div class="info-text"><strong>Tus temas disponibles para practicar:</strong></div>';
        echo '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 15px 0;">';
        
        foreach ($categories as $category) {
            echo '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">';
            echo '<div style="font-weight: 600; color: #2c3e50;">' . htmlspecialchars($category['name']) . '</div>';
            echo '<div style="color: #667eea; font-weight: bold; margin-top: 5px;">' . $category['count'] . ' preguntas</div>';
            echo '</div>';
        }
        
        echo '</div>';
        
        // Probar filtrado específico
        $test_category = $categories[0];
        
        echo '<div class="info-text" style="margin-top: 20px;">';
        echo '<strong>🧪 Verificando que puedas crear quiz...</strong>';
        echo '</div>';
        
        $conditions = array(
            'userid' => $USER->id,
            'mastered' => 0,
            'quizid' => $test_category['id']
        );
        
        $filtered_questions = $DB->get_records('local_failed_questions_recovery', $conditions, 'lastfailed DESC');
        
        if (!empty($filtered_questions)) {
            echo '<div class="status-good">';
            echo '<strong>✅ ¡Perfecto! Puedes crear quiz sin problemas</strong><br>';
            echo 'Probé con "' . htmlspecialchars($test_category['name']) . '" y encontré ' . count($filtered_questions) . ' preguntas listas.';
            echo '</div>';
        } else {
            echo '<div class="status-error">';
            echo '<strong>❌ Hay un problema con el filtrado</strong><br>';
            echo 'No se pueden crear quiz. Contacta al administrador.';
            echo '</div>';
        }
        
    } else {
        echo '<div class="status-error">';
        echo '<strong>❌ Problema detectado</strong><br>';
        echo 'Tienes preguntas registradas pero no se organizan en categorías correctamente.';
        echo '</div>';
        
        echo '<div class="suggestion-box">';
        echo '<strong>🔧 Solución:</strong><br>';
        echo 'Ve a "Herramientas Útiles" → "Corregir Nombres" para arreglar este problema.';
        echo '</div>';
    }
    
    echo '</div>';
}

// PASO 3: Recomendaciones
echo '<div class="step-card">';
echo '<div class="step-title"><span class="step-icon">💡</span>Próximos Pasos</div>';

if ($total_failed == 0) {
    echo '<div class="info-text">';
    echo '<strong>Para empezar a usar el sistema:</strong><br>';
    echo '1. 📝 Realiza un examen en Moodle<br>';
    echo '2. 🔄 Procesa el examen desde el Dashboard<br>';
    echo '3. 🎯 ¡Empieza a practicar tus errores!';
    echo '</div>';
    
} else if ($pending == 0) {
    echo '<div class="info-text">';
    echo '<strong>Ideas para seguir mejorando:</strong><br>';
    echo '• 📚 Realiza más exámenes para nuevos retos<br>';
    echo '• 🔄 Repasa temas anteriores ocasionalmente<br>';
    echo '• 📊 Revisa tus estadísticas de progreso';
    echo '</div>';
    
} else {
    echo '<div class="info-text">';
    echo '<strong>¡Todo listo para practicar!</strong><br>';
    echo '• 🎯 Ve al Dashboard y haz clic en "Practicar Ahora"<br>';
    echo '• 📈 Revisa tus resultados después de cada quiz<br>';
    echo '• 🔄 Las preguntas acertadas se marcarán como dominadas<br>';
    echo '• 📊 Sigue tu progreso en las estadísticas';
    echo '</div>';
    
    echo '<div class="suggestion-box">';
    echo '<strong>🎯 Recomendación:</strong> Practica 10-15 minutos diarios para mejores resultados.';
    echo '</div>';
}

echo '</div>';

echo '<div style="text-align: center; margin: 40px 0;">';
echo '<a href="student_dashboard.php" class="back-button">← Volver al Dashboard</a>';
echo '</div>';

echo '</div>'; // Cerrar container

echo $OUTPUT->footer();
?> 