<?php
require_once('../../config.php');
require_once('locallib.php');

// Configuración de la base de datos
global $DB, $CFG;

// Datos del usuario administrador
$moodle_user_id = 2;
$telegram_user_id = 5793286375;
$moodle_username = 'opomelilla';

echo "<h2>Script para Eliminar Vinculación del Usuario Administrador</h2>";
echo "<p><strong>Usuario:</strong> $moodle_username (ID: $moodle_user_id)</p>";
echo "<p><strong>Telegram ID:</strong> $telegram_user_id</p>";
echo "<hr>";

// Verificar si existe la vinculación actual
echo "<h3>1. Verificando vinculación actual...</h3>";
$current_link = $DB->get_record('local_telegram_integration_users', 
    array('moodle_user_id' => $moodle_user_id));

if ($current_link) {
    echo "<p style='color: green;'>✓ Vinculación encontrada:</p>";
    echo "<ul>";
    echo "<li>ID: {$current_link->id}</li>";
    echo "<li>Telegram User ID: {$current_link->telegram_userid}</li>";
    echo "<li>Verificado: " . ($current_link->is_verified ? 'Sí' : 'No') . "</li>";
    echo "<li>Fecha vinculación: {$current_link->linked_at}</li>";
    echo "</ul>";
} else {
    echo "<p style='color: orange;'>⚠ No se encontró vinculación en local_telegram_integration_users</p>";
}

// Verificar códigos de verificación
echo "<h3>2. Verificando códigos de verificación...</h3>";
$verification_codes = $DB->get_records('local_telegram_verification', 
    array('moodle_user_id' => $moodle_user_id));

if ($verification_codes) {
    echo "<p style='color: green;'>✓ Encontrados " . count($verification_codes) . " códigos de verificación</p>";
} else {
    echo "<p style='color: orange;'>⚠ No se encontraron códigos de verificación</p>";
}

// Verificar datos de rendimiento
echo "<h3>3. Verificando datos de rendimiento...</h3>";
$performance_records = $DB->get_records('local_telegram_user_topic_performance', 
    array('moodle_user_id' => $moodle_user_id));

if ($performance_records) {
    echo "<p style='color: green;'>✓ Encontrados " . count($performance_records) . " registros de rendimiento</p>";
} else {
    echo "<p style='color: orange;'>⚠ No se encontraron registros de rendimiento</p>";
}

// Formulario de confirmación
if (isset($_POST['confirm_delete'])) {
    echo "<h3>4. Eliminando vinculación...</h3>";
    
    $deleted_count = 0;
    
    try {
        // Eliminar de local_telegram_integration_users
        if ($current_link) {
            $DB->delete_records('local_telegram_integration_users', 
                array('moodle_user_id' => $moodle_user_id));
            echo "<p style='color: green;'>✓ Eliminada vinculación principal</p>";
            $deleted_count++;
        }
        
        // Eliminar códigos de verificación
        if ($verification_codes) {
            $DB->delete_records('local_telegram_verification', 
                array('moodle_user_id' => $moodle_user_id));
            echo "<p style='color: green;'>✓ Eliminados códigos de verificación</p>";
            $deleted_count++;
        }
        
        // Eliminar datos de rendimiento
        if ($performance_records) {
            $DB->delete_records('local_telegram_user_topic_performance', 
                array('moodle_user_id' => $moodle_user_id));
            echo "<p style='color: green;'>✓ Eliminados registros de rendimiento</p>";
            $deleted_count++;
        }
        
        // Limpiar timeline si existe
        $timeline_records = $DB->get_records('mdl_local_telegram_progress_timeline', 
            array('moodle_user_id' => $moodle_user_id));
        if ($timeline_records) {
            $DB->delete_records('mdl_local_telegram_progress_timeline', 
                array('moodle_user_id' => $moodle_user_id));
            echo "<p style='color: green;'>✓ Eliminados registros de timeline</p>";
            $deleted_count++;
        }
        
        echo "<hr>";
        echo "<h3 style='color: green;'>✅ Eliminación completada exitosamente</h3>";
        echo "<p><strong>Total de tablas limpiadas:</strong> $deleted_count</p>";
        echo "<p><strong>Estado:</strong> El usuario ya no está vinculado con Telegram</p>";
        echo "<p><strong>Siguiente paso:</strong> Puedes proceder a realizar una nueva vinculación</p>";
        
        // Información para nueva vinculación
        echo "<div style='background: #f0f8ff; padding: 15px; border: 1px solid #0066cc; margin: 10px 0;'>";
        echo "<h4>📋 Información para nueva vinculación:</h4>";
        echo "<ul>";
        echo "<li>Usuario Moodle: $moodle_username (ID: $moodle_user_id)</li>";
        echo "<li>Email: contacto@opomelilla.com</li>";
        echo "<li>Nombre completo: Administrador OpoMelilla</li>";
        echo "<li>Telegram ID anterior: $telegram_user_id</li>";
        echo "</ul>";
        echo "<p><strong>Nota:</strong> Puedes usar el mismo Telegram ID o uno diferente para la nueva vinculación.</p>";
        echo "</div>";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error durante la eliminación: " . $e->getMessage() . "</p>";
    }
    
} else {
    // Mostrar formulario de confirmación
    echo "<h3>4. Confirmar eliminación</h3>";
    echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffc107; margin: 10px 0;'>";
    echo "<h4>⚠️ ADVERTENCIA</h4>";
    echo "<p>Esta acción eliminará PERMANENTEMENTE:</p>";
    echo "<ul>";
    echo "<li>La vinculación entre tu cuenta de Moodle y Telegram</li>";
    echo "<li>Todos los códigos de verificación asociados</li>";
    echo "<li>Todos los datos de rendimiento por temas</li>";
    echo "<li>El historial de progreso en timeline</li>";
    echo "</ul>";
    echo "<p><strong>Después de esto podrás:</strong></p>";
    echo "<ul>";
    echo "<li>Generar un nuevo código de verificación</li>";
    echo "<li>Vincular tu cuenta nuevamente desde Telegram</li>";
    echo "<li>Probar todo el flujo de vinculación desde cero</li>";
    echo "</ul>";
    echo "</div>";
    
    echo "<form method='post' style='margin: 20px 0;'>";
    echo "<input type='hidden' name='confirm_delete' value='1'>";
    echo "<button type='submit' style='background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;' onclick='return confirm(\"¿Estás seguro de que quieres eliminar tu vinculación? Esta acción no se puede deshacer.\");'>";
    echo "🗑️ Confirmar Eliminación de Vinculación";
    echo "</button>";
    echo "</form>";
    
    echo "<p><a href='test-user-mapping.php' style='color: #007bff;'>← Volver a test-user-mapping.php</a></p>";
}

echo "<hr>";
echo "<h3>📚 Scripts relacionados disponibles:</h3>";
echo "<ul>";
echo "<li><a href='test-user-mapping.php'>test-user-mapping.php</a> - Verificar estado de vinculación</li>";
echo "<li><a href='fix-linkages.php'>fix-linkages.php</a> - Corregir vinculaciones problemáticas</li>";
echo "<li><a href='fix-admin-linkage.php'>fix-admin-linkage.php</a> - Gestión específica del administrador</li>";
echo "</ul>";
?>