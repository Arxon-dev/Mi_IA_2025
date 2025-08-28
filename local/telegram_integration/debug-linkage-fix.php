<?php
// Detectar automáticamente la ruta de config.php
$configPaths = [
    '../../../../config.php',
    '../../../config.php', 
    '../../config.php',
    '../config.php',
    'config.php'
];

$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    die('Error: No se pudo encontrar config.php. Verifica la estructura de directorios.');
}

echo "<h1>🔍 Diagnóstico de Corrección de Vinculación</h1>";

// Verificar configuración de Moodle
echo "<h2>1. Configuración de Moodle</h2>";
echo "<p><strong>DB Host:</strong> " . ($CFG->dbhost ?? 'No definido') . "</p>";
echo "<p><strong>DB Name:</strong> " . ($CFG->dbname ?? 'No definido') . "</p>";
echo "<p><strong>DB User:</strong> " . ($CFG->dbuser ?? 'No definido') . "</p>";

// Verificar tabla de vinculación
echo "<h2>2. Verificación de Tabla de Vinculación</h2>";
try {
    global $DB;
    
    // Verificar si la tabla existe
    $sql = "SHOW TABLES LIKE 'mdl_local_telegram_integration_users'";
    $result = $DB->get_records_sql($sql);
    
    if (!empty($result)) {
        echo "<p>✅ <strong>Tabla mdl_local_telegram_integration_users existe</strong></p>";
        
        // Verificar estructura de la tabla
        $sql = "DESCRIBE mdl_local_telegram_integration_users";
        $columns = $DB->get_records_sql($sql);
        
        echo "<h3>Estructura de la tabla:</h3>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th></tr>";
        foreach ($columns as $column) {
            echo "<tr>";
            echo "<td>" . $column->Field . "</td>";
            echo "<td>" . $column->Type . "</td>";
            echo "<td>" . $column->Null . "</td>";
            echo "<td>" . $column->Key . "</td>";
            echo "<td>" . $column->Default . "</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Verificar registros existentes
        $sql = "SELECT * FROM mdl_local_telegram_integration_users";
        $records = $DB->get_records_sql($sql);
        
        echo "<h3>Registros existentes:</h3>";
        if (!empty($records)) {
            echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
            echo "<tr><th>ID</th><th>Moodle User ID</th><th>Telegram User ID</th><th>Created At</th></tr>";
            foreach ($records as $record) {
                echo "<tr>";
                echo "<td>" . $record->id . "</td>";
                echo "<td>" . $record->moodleuserid . "</td>";
                echo "<td>" . $record->telegramuserid . "</td>";
                echo "<td>" . $record->createdat . "</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>❌ <strong>No hay registros en la tabla</strong></p>";
        }
        
        // Verificar específicamente el administrador
        $sql = "SELECT * FROM mdl_local_telegram_integration_users WHERE moodleuserid = 2";
        $adminRecord = $DB->get_record_sql($sql);
        
        if ($adminRecord) {
            echo "<h3>Vinculación actual del administrador:</h3>";
            echo "<p><strong>ID:</strong> " . $adminRecord->id . "</p>";
            echo "<p><strong>Moodle User ID:</strong> " . $adminRecord->moodleuserid . "</p>";
            echo "<p><strong>Telegram User ID:</strong> " . $adminRecord->telegramuserid . "</p>";
            echo "<p><strong>Created At:</strong> " . $adminRecord->createdat . "</p>";
        } else {
            echo "<p>❌ <strong>No hay vinculación para el administrador (Moodle ID: 2)</strong></p>";
        }
        
    } else {
        echo "<p>❌ <strong>Tabla mdl_local_telegram_integration_users no existe</strong></p>";
        
        // Verificar si existe con otro nombre
        $sql = "SHOW TABLES LIKE '%telegram%'";
        $tables = $DB->get_records_sql($sql);
        
        if (!empty($tables)) {
            echo "<h3>Tablas relacionadas con Telegram encontradas:</h3>";
            foreach ($tables as $table) {
                $tableName = array_keys((array)$table)[0];
                echo "<p>📄 $tableName</p>";
            }
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ <strong>Error al verificar tabla:</strong> " . $e->getMessage() . "</p>";
}

// Probar la operación de actualización
echo "<h2>3. Prueba de Actualización</h2>";
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['test_update'])) {
    try {
        $newTelegramId = '118d2830-404f-49e9-9496-c5ab54e6a1c8';
        
        // Verificar si existe el registro del administrador
        $sql = "SELECT * FROM mdl_local_telegram_integration_users WHERE moodleuserid = 2";
        $existingRecord = $DB->get_record_sql($sql);
        
        if ($existingRecord) {
            // Actualizar registro existente
            $sql = "UPDATE mdl_local_telegram_integration_users 
                    SET telegramuserid = ? 
                    WHERE moodleuserid = 2";
            $result = $DB->execute($sql, [$newTelegramId]);
            
            if ($result) {
                echo "<p>✅ <strong>Actualización exitosa</strong></p>";
            } else {
                echo "<p>❌ <strong>Error en la actualización</strong></p>";
            }
        } else {
            // Crear nuevo registro
            $sql = "INSERT INTO mdl_local_telegram_integration_users 
                    (moodleuserid, telegramuserid, createdat) 
                    VALUES (?, ?, NOW())";
            $result = $DB->execute($sql, [2, $newTelegramId]);
            
            if ($result) {
                echo "<p>✅ <strong>Inserción exitosa</strong></p>";
            } else {
                echo "<p>❌ <strong>Error en la inserción</strong></p>";
            }
        }
        
        // Verificar el resultado
        $sql = "SELECT * FROM mdl_local_telegram_integration_users WHERE moodleuserid = 2";
        $updatedRecord = $DB->get_record_sql($sql);
        
        if ($updatedRecord) {
            echo "<h3>Vinculación actualizada:</h3>";
            echo "<p><strong>ID:</strong> " . $updatedRecord->id . "</p>";
            echo "<p><strong>Moodle User ID:</strong> " . $updatedRecord->moodleuserid . "</p>";
            echo "<p><strong>Telegram User ID:</strong> " . $updatedRecord->telegramuserid . "</p>";
        }
        
    } catch (Exception $e) {
        echo "<p>❌ <strong>Error en la prueba:</strong> " . $e->getMessage() . "</p>";
    }
} else {
    echo "<form method='post'>";
    echo "<input type='hidden' name='test_update' value='1'>";
    echo "<button type='submit' style='padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;'>";
    echo "🧪 Probar Actualización";
    echo "</button>";
    echo "</form>";
}

echo "<h2>4. Información Adicional</h2>";
echo "<p><strong>Usuario actual:</strong> " . ($USER->username ?? 'No definido') . "</p>";
echo "<p><strong>Es administrador:</strong> " . (is_siteadmin() ? 'Sí' : 'No') . "</p>";
echo "<p><strong>ID de usuario:</strong> " . ($USER->id ?? 'No definido') . "</p>";
?> 