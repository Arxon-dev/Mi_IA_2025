<?php
require_once('../../config.php');
require_once('locallib.php');

// Configuración de la base de datos
global $DB, $CFG;

// Datos del usuario administrador
$moodle_user_id = 2;
$telegram_user_id = 5793286375;
$moodle_username = 'opomelilla';

echo "<h2>Script para Eliminar Vinculación del Usuario Administrador (Versión Final)</h2>";
echo "<p><strong>Usuario:</strong> $moodle_username (ID: $moodle_user_id)</p>";
echo "<p><strong>Telegram ID:</strong> $telegram_user_id</p>";
echo "<hr>";

// Función para verificar si una tabla existe
function table_exists($table_name) {
    global $DB;
    try {
        $sql = "SHOW TABLES LIKE ?";
        $result = $DB->get_records_sql($sql, [$table_name]);
        return !empty($result);
    } catch (Exception $e) {
        return false;
    }
}

// Función para obtener registros de forma segura con columnas correctas
function safe_get_records_with_correct_columns($table, $moodle_user_id, $telegram_user_id) {
    global $DB;
    try {
        if (!table_exists($table)) {
            return false;
        }
        
        // Usar las columnas correctas según la tabla
        if (strpos($table, 'verification') !== false) {
            // Para tabla de verificación usar moodle_user_id
            return $DB->get_records($table, array('moodle_user_id' => $moodle_user_id));
        } else if (strpos($table, 'user_topic_performance') !== false || strpos($table, 'progress_timeline') !== false) {
            // Para tablas de performance y timeline usar telegramuserid
            return $DB->get_records($table, array('telegramuserid' => $telegram_user_id));
        } else {
            // Para tabla de linkage usar moodle_user_id
            return $DB->get_records($table, array('moodle_user_id' => $moodle_user_id));
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error consultando tabla $table: " . $e->getMessage() . "</p>";
        return false;
    }
}

// Función para eliminar registros con columnas correctas
function safe_delete_records_with_correct_columns($table, $moodle_user_id, $telegram_user_id) {
    global $DB;
    try {
        if (!table_exists($table)) {
            return false;
        }
        
        // Usar las columnas correctas según la tabla
        if (strpos($table, 'verification') !== false) {
            // Para tabla de verificación usar moodle_user_id
            return $DB->delete_records($table, array('moodle_user_id' => $moodle_user_id));
        } else if (strpos($table, 'user_topic_performance') !== false || strpos($table, 'progress_timeline') !== false) {
            // Para tablas de performance y timeline usar telegramuserid
            return $DB->delete_records($table, array('telegramuserid' => $telegram_user_id));
        } else {
            // Para tabla de linkage usar moodle_user_id
            return $DB->delete_records($table, array('moodle_user_id' => $moodle_user_id));
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error eliminando de tabla $table: " . $e->getMessage() . "</p>";
        return false;
    }
}

// Lista de posibles nombres de tablas
$linkage_tables = [
    'local_telegram_integration_users',
    'mdl_local_telegram_integration_users',
    'telegram_integration_users'
];

$verification_tables = [
    'local_telegram_verification',
    'mdl_local_telegram_verification',
    'telegram_verification'
];

$performance_tables = [
    'local_telegram_user_topic_performance',
    'mdl_local_telegram_user_topic_performance',
    'telegram_user_topic_performance'
];

$timeline_tables = [
    'mdl_local_telegram_progress_timeline',
    'local_telegram_progress_timeline',
    'telegram_progress_timeline'
];

echo "<h3>1. Verificando tablas disponibles...</h3>";

// Verificar qué tablas existen
$existing_tables = [];
foreach (['linkage' => $linkage_tables, 'verification' => $verification_tables, 
          'performance' => $performance_tables, 'timeline' => $timeline_tables] as $type => $tables) {
    echo "<h4>Tablas de $type:</h4>";
    foreach ($tables as $table) {
        if (table_exists($table)) {
            echo "<p style='color: green;'>✅ Existe: $table</p>";
            $existing_tables[$type] = $table;
            break;
        } else {
            echo "<p style='color: orange;'>⚠️ No existe: $table</p>";
        }
    }
    if (!isset($existing_tables[$type])) {
        echo "<p style='color: red;'>❌ No se encontró ninguna tabla de $type</p>";
    }
}

echo "<hr>";
echo "<h3>2. Verificando vinculación actual...</h3>";

$current_link = null;
if (isset($existing_tables['linkage'])) {
    $current_link = safe_get_records_with_correct_columns($existing_tables['linkage'], $moodle_user_id, $telegram_user_id);
    
    if ($current_link && !empty($current_link)) {
        $link = reset($current_link);
        echo "<p style='color: green;'>✓ Vinculación encontrada en {$existing_tables['linkage']}:</p>";
        echo "<ul>";
        foreach ($link as $key => $value) {
            echo "<li><strong>$key:</strong> $value</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color: orange;'>⚠️ No se encontró vinculación para el usuario ID $moodle_user_id</p>";
    }
} else {
    echo "<p style='color: red;'>❌ No existe tabla de vinculación</p>";
}

// Verificar códigos de verificación
echo "<h3>3. Verificando códigos de verificación...</h3>";
$verification_codes = null;
if (isset($existing_tables['verification'])) {
    $verification_codes = safe_get_records_with_correct_columns($existing_tables['verification'], $moodle_user_id, $telegram_user_id);
    
    if ($verification_codes && !empty($verification_codes)) {
        echo "<p style='color: green;'>✓ Encontrados " . count($verification_codes) . " códigos en {$existing_tables['verification']}</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ No se encontraron códigos de verificación</p>";
    }
} else {
    echo "<p style='color: red;'>❌ No existe tabla de verificación</p>";
}

// Verificar datos de rendimiento
echo "<h3>4. Verificando datos de rendimiento...</h3>";
$performance_records = null;
if (isset($existing_tables['performance'])) {
    $performance_records = safe_get_records_with_correct_columns($existing_tables['performance'], $moodle_user_id, $telegram_user_id);
    
    if ($performance_records && !empty($performance_records)) {
        echo "<p style='color: green;'>✓ Encontrados " . count($performance_records) . " registros en {$existing_tables['performance']}</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ No se encontraron registros de rendimiento</p>";
    }
} else {
    echo "<p style='color: red;'>❌ No existe tabla de rendimiento</p>";
}

// Verificar timeline
echo "<h3>5. Verificando timeline...</h3>";
$timeline_records = null;
if (isset($existing_tables['timeline'])) {
    $timeline_records = safe_get_records_with_correct_columns($existing_tables['timeline'], $moodle_user_id, $telegram_user_id);
    
    if ($timeline_records && !empty($timeline_records)) {
        echo "<p style='color: green;'>✓ Encontrados " . count($timeline_records) . " registros en {$existing_tables['timeline']}</p>";
    } else {
        echo "<p style='color: orange;'>⚠️ No se encontraron registros de timeline</p>";
    }
} else {
    echo "<p style='color: red;'>❌ No existe tabla de timeline</p>";
}

// Formulario de confirmación
if (isset($_POST['confirm_delete'])) {
    echo "<hr>";
    echo "<h3>6. Eliminando vinculación...</h3>";
    
    $deleted_count = 0;
    
    try {
        // Eliminar vinculación principal
        if (isset($existing_tables['linkage']) && $current_link && !empty($current_link)) {
            if (safe_delete_records_with_correct_columns($existing_tables['linkage'], $moodle_user_id, $telegram_user_id)) {
                echo "<p style='color: green;'>✓ Eliminada vinculación de {$existing_tables['linkage']}</p>";
                $deleted_count++;
            }
        }
        
        // Eliminar códigos de verificación
        if (isset($existing_tables['verification']) && $verification_codes && !empty($verification_codes)) {
            if (safe_delete_records_with_correct_columns($existing_tables['verification'], $moodle_user_id, $telegram_user_id)) {
                echo "<p style='color: green;'>✓ Eliminados códigos de {$existing_tables['verification']}</p>";
                $deleted_count++;
            }
        }
        
        // Eliminar datos de rendimiento
        if (isset($existing_tables['performance']) && $performance_records && !empty($performance_records)) {
            if (safe_delete_records_with_correct_columns($existing_tables['performance'], $moodle_user_id, $telegram_user_id)) {
                echo "<p style='color: green;'>✓ Eliminados registros de {$existing_tables['performance']}</p>";
                $deleted_count++;
            }
        }
        
        // Eliminar timeline
        if (isset($existing_tables['timeline']) && $timeline_records && !empty($timeline_records)) {
            if (safe_delete_records_with_correct_columns($existing_tables['timeline'], $moodle_user_id, $telegram_user_id)) {
                echo "<p style='color: green;'>✓ Eliminados registros de {$existing_tables['timeline']}</p>";
                $deleted_count++;
            }
        }
        
        echo "<hr>";
        if ($deleted_count > 0) {
            echo "<h3 style='color: green;'>✅ Eliminación completada exitosamente</h3>";
            echo "<p><strong>Total de tablas limpiadas:</strong> $deleted_count</p>";
            echo "<p><strong>Estado:</strong> El usuario ya no está vinculado con Telegram</p>";
        } else {
            echo "<h3 style='color: orange;'>⚠️ No se encontraron datos para eliminar</h3>";
            echo "<p>El usuario no tenía vinculación activa o las tablas no existen.</p>";
        }
        
        echo "<p><strong>Siguiente paso:</strong> Puedes proceder a realizar una nueva vinculación</p>";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error durante la eliminación: " . $e->getMessage() . "</p>";
    }
    
} else {
    // Mostrar formulario de confirmación solo si hay datos para eliminar
    $has_data = ($current_link && !empty($current_link)) || 
                ($verification_codes && !empty($verification_codes)) || 
                ($performance_records && !empty($performance_records)) || 
                ($timeline_records && !empty($timeline_records));
    
    if ($has_data) {
        echo "<hr>";
        echo "<h3>6. Confirmar eliminación</h3>";
        echo "<div style='background: #fff3cd; padding: 15px; border: 1px solid #ffc107; margin: 10px 0;'>";
        echo "<h4>⚠️ ADVERTENCIA</h4>";
        echo "<p>Esta acción eliminará los datos encontrados en las tablas existentes.</p>";
        echo "</div>";
        
        echo "<form method='post' style='margin: 20px 0;'>";
        echo "<input type='hidden' name='confirm_delete' value='1'>";
        echo "<button type='submit' style='background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;' onclick='return confirm(\"¿Estás seguro de que quieres eliminar tu vinculación? Esta acción no se puede deshacer.\");'>";
        echo "🗑️ Confirmar Eliminación de Vinculación";
        echo "</button>";
        echo "</form>";
    } else {
        echo "<hr>";
        echo "<h3 style='color: orange;'>⚠️ No hay datos para eliminar</h3>";
        echo "<p>No se encontraron vinculaciones activas para tu usuario.</p>";
        echo "<p>Puedes proceder directamente a crear una nueva vinculación.</p>";
    }
}

echo "<hr>";
echo "<h3>📚 Scripts relacionados disponibles:</h3>";
echo "<ul>";
echo "<li><a href='test-user-mapping.php'>test-user-mapping.php</a> - Verificar estado de vinculación</li>";
echo "<li><a href='fix-linkages.php'>fix-linkages.php</a> - Corregir vinculaciones problemáticas</li>";
echo "<li><a href='fix-admin-linkage.php'>fix-admin-linkage.php</a> - Gestión específica del administrador</li>";
echo "<li><a href='create-linkage-table.php'>create-linkage-table.php</a> - Crear tablas faltantes</li>";
echo "</ul>";
?>