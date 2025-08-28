<?php
// Script para desvincular al usuario administrador del sistema de Telegram
// Versión corregida con nombres de columnas exactos de la base de datos

require_once('../../config.php');
require_once($CFG->libdir . '/dml/moodle_database.php');

// Configuración del usuario administrador
$admin_user_id = 2;
$admin_telegram_userid = '5793286375';

// Función para verificar si una tabla existe
function table_exists($table_name) {
    global $DB;
    try {
        $tables = $DB->get_tables();
        return in_array($table_name, $tables);
    } catch (Exception $e) {
        return false;
    }
}

// Función para obtener registros de forma segura con nombres de columnas correctos
function safe_get_records_corrected($table_name, $conditions) {
    global $DB;
    try {
        if (!table_exists($table_name)) {
            return false;
        }
        return $DB->get_records($table_name, $conditions);
    } catch (Exception $e) {
        echo "<div class='alert alert-warning'>Error al consultar $table_name: " . $e->getMessage() . "</div>";
        return false;
    }
}

// Función para eliminar registros de forma segura
function safe_delete_records_corrected($table_name, $conditions) {
    global $DB;
    try {
        if (!table_exists($table_name)) {
            return false;
        }
        return $DB->delete_records($table_name, $conditions);
    } catch (Exception $e) {
        echo "<div class='alert alert-danger'>Error al eliminar de $table_name: " . $e->getMessage() . "</div>";
        return false;
    }
}

echo "<h2>🔧 Script de Desvinculación del Usuario Administrador</h2>";
echo "<p><strong>Usuario:</strong> ID $admin_user_id | Telegram: $admin_telegram_userid</p>";

// Verificar tablas existentes
echo "<h3>📋 Verificación de Tablas</h3>";
$tables_to_check = [
    'mdl_local_telegram_verification',
    'mdl_local_telegram_user_topic_performance', 
    'mdl_local_telegram_progress_timeline'
];

$existing_tables = [];
foreach ($tables_to_check as $table) {
    if (table_exists($table)) {
        $existing_tables[] = $table;
        echo "<div class='alert alert-success'>✅ Tabla $table existe</div>";
    } else {
        echo "<div class='alert alert-info'>ℹ️ Tabla $table no existe</div>";
    }
}

if (empty($existing_tables)) {
    echo "<div class='alert alert-warning'>⚠️ No se encontraron tablas de Telegram. No hay datos para eliminar.</div>";
    exit;
}

// Buscar datos del usuario administrador
echo "<h3>🔍 Búsqueda de Datos del Usuario Administrador</h3>";

$found_data = [];

// Verificar tabla de verificación (usa moodle_userid)
if (in_array('mdl_local_telegram_verification', $existing_tables)) {
    $verification_records = safe_get_records_corrected('mdl_local_telegram_verification', 
        ['moodle_userid' => $admin_user_id]);
    if ($verification_records) {
        $found_data['verification'] = $verification_records;
        echo "<div class='alert alert-info'>📧 Encontrados " . count($verification_records) . " registros de verificación</div>";
    }
    
    // También buscar por telegram_userid
    $verification_by_telegram = safe_get_records_corrected('mdl_local_telegram_verification', 
        ['telegram_userid' => $admin_telegram_userid]);
    if ($verification_by_telegram) {
        $found_data['verification_telegram'] = $verification_by_telegram;
        echo "<div class='alert alert-info'>📱 Encontrados " . count($verification_by_telegram) . " registros por Telegram ID</div>";
    }
}

// Verificar tabla de rendimiento (usa telegramuserid)
if (in_array('mdl_local_telegram_user_topic_performance', $existing_tables)) {
    $performance_records = safe_get_records_corrected('mdl_local_telegram_user_topic_performance', 
        ['telegramuserid' => $admin_telegram_userid]);
    if ($performance_records) {
        $found_data['performance'] = $performance_records;
        echo "<div class='alert alert-info'>📊 Encontrados " . count($performance_records) . " registros de rendimiento</div>";
    }
}

// Verificar tabla de progreso (usa telegramuserid)
if (in_array('mdl_local_telegram_progress_timeline', $existing_tables)) {
    $progress_records = safe_get_records_corrected('mdl_local_telegram_progress_timeline', 
        ['telegramuserid' => $admin_telegram_userid]);
    if ($progress_records) {
        $found_data['progress'] = $progress_records;
        echo "<div class='alert alert-info'>📈 Encontrados " . count($progress_records) . " registros de progreso</div>";
    }
}

if (empty($found_data)) {
    echo "<div class='alert alert-success'>✅ No se encontraron datos del usuario administrador para eliminar.</div>";
    echo "<div class='alert alert-info'>ℹ️ El usuario ya está desvinculado o nunca estuvo vinculado.</div>";
    exit;
}

// Mostrar resumen de datos encontrados
echo "<h3>📋 Resumen de Datos Encontrados</h3>";
foreach ($found_data as $type => $records) {
    echo "<div class='alert alert-warning'>⚠️ $type: " . count($records) . " registros</div>";
}

// Procesar eliminación si se confirma
if (isset($_POST['confirm_delete']) && $_POST['confirm_delete'] === 'yes') {
    echo "<h3>🗑️ Eliminando Datos</h3>";
    
    $deleted_count = 0;
    
    // Eliminar registros de verificación por moodle_userid
    if (isset($found_data['verification'])) {
        if (safe_delete_records_corrected('mdl_local_telegram_verification', ['moodle_userid' => $admin_user_id])) {
            $count = count($found_data['verification']);
            echo "<div class='alert alert-success'>✅ Eliminados $count registros de verificación (por moodle_userid)</div>";
            $deleted_count += $count;
        }
    }
    
    // Eliminar registros de verificación por telegram_userid
    if (isset($found_data['verification_telegram'])) {
        if (safe_delete_records_corrected('mdl_local_telegram_verification', ['telegram_userid' => $admin_telegram_userid])) {
            $count = count($found_data['verification_telegram']);
            echo "<div class='alert alert-success'>✅ Eliminados $count registros de verificación (por telegram_userid)</div>";
            $deleted_count += $count;
        }
    }
    
    // Eliminar registros de rendimiento
    if (isset($found_data['performance'])) {
        if (safe_delete_records_corrected('mdl_local_telegram_user_topic_performance', ['telegramuserid' => $admin_telegram_userid])) {
            $count = count($found_data['performance']);
            echo "<div class='alert alert-success'>✅ Eliminados $count registros de rendimiento</div>";
            $deleted_count += $count;
        }
    }
    
    // Eliminar registros de progreso
    if (isset($found_data['progress'])) {
        if (safe_delete_records_corrected('mdl_local_telegram_progress_timeline', ['telegramuserid' => $admin_telegram_userid])) {
            $count = count($found_data['progress']);
            echo "<div class='alert alert-success'>✅ Eliminados $count registros de progreso</div>";
            $deleted_count += $count;
        }
    }
    
    echo "<div class='alert alert-success'><h4>🎉 Desvinculación Completada</h4>";
    echo "<p>Total de registros eliminados: <strong>$deleted_count</strong></p>";
    echo "<p>El usuario administrador (ID: $admin_user_id) ha sido completamente desvinculado del sistema de Telegram.</p></div>";
    
} else {
    // Mostrar formulario de confirmación
    echo "<h3>⚠️ Confirmación Requerida</h3>";
    echo "<div class='alert alert-warning'>";
    echo "<p><strong>¿Estás seguro de que quieres eliminar todos los datos del usuario administrador?</strong></p>";
    echo "<p>Esta acción no se puede deshacer.</p>";
    echo "</div>";
    
    echo "<form method='post'>";
    echo "<input type='hidden' name='confirm_delete' value='yes'>";
    echo "<button type='submit' class='btn btn-danger'>🗑️ Sí, Eliminar Todos los Datos</button>";
    echo "</form>";
    
    echo "<br><a href='?'>🔄 Cancelar y Volver a Verificar</a>";
}

echo "<hr>";
echo "<h4>📚 Scripts Relacionados</h4>";
echo "<ul>";
echo "<li><a href='test-user-mapping.php'>🔍 Verificar Estado de Vinculación</a></li>";
echo "<li><a href='create-linkage-table.php'>🛠️ Crear Tabla de Vinculación</a></li>";
echo "<li><a href='fix-admin-linkage.php'>🔧 Gestionar Vinculación del Administrador</a></li>";
echo "</ul>";
?>

<style>
.alert {
    padding: 10px;
    margin: 10px 0;
    border-radius: 4px;
}
.alert-success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
.alert-info { background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
.alert-warning { background-color: #fff3cd; border-color: #ffeaa7; color: #856404; }
.alert-danger { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
}
.btn-danger { background-color: #dc3545; color: white; }
.btn-danger:hover { background-color: #c82333; }
</style>