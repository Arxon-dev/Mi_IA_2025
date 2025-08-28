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

// Verificar si el usuario es administrador
if (!is_siteadmin()) {
    die('Acceso denegado. Solo administradores pueden acceder a esta página.');
}

echo "<h1>🔧 Creación de Tabla de Vinculación</h1>";

// Verificar si la tabla ya existe
echo "<h2>1. Verificación de Tabla Existente</h2>";
try {
    global $DB;
    
    $sql = "SHOW TABLES LIKE 'mdl_local_telegram_integration_users'";
    $result = $DB->get_records_sql($sql);
    
    if (!empty($result)) {
        echo "<p>✅ <strong>La tabla mdl_local_telegram_integration_users ya existe</strong></p>";
        
        // Mostrar estructura actual
        $sql = "DESCRIBE mdl_local_telegram_integration_users";
        $columns = $DB->get_records_sql($sql);
        
        echo "<h3>Estructura actual:</h3>";
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
        
    } else {
        echo "<p>❌ <strong>La tabla mdl_local_telegram_integration_users no existe</strong></p>";
        echo "<p>Se necesita crear la tabla.</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ <strong>Error al verificar tabla:</strong> " . $e->getMessage() . "</p>";
}

// Crear la tabla si no existe
echo "<h2>2. Creación de Tabla</h2>";
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_table'])) {
    try {
        // SQL para crear la tabla
        $sql = "CREATE TABLE IF NOT EXISTS mdl_local_telegram_integration_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            moodleuserid INT NOT NULL,
            telegramuserid VARCHAR(255) NOT NULL,
            createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_moodle_user (moodleuserid),
            UNIQUE KEY unique_telegram_user (telegramuserid)
        )";
        
        $result = $DB->execute($sql);
        
        if ($result) {
            echo "<p>✅ <strong>Tabla creada exitosamente</strong></p>";
            
            // Verificar que se creó correctamente
            $sql = "SHOW TABLES LIKE 'mdl_local_telegram_integration_users'";
            $result = $DB->get_records_sql($sql);
            
            if (!empty($result)) {
                echo "<p>✅ <strong>Verificación: La tabla existe</strong></p>";
                
                // Mostrar estructura creada
                $sql = "DESCRIBE mdl_local_telegram_integration_users";
                $columns = $DB->get_records_sql($sql);
                
                echo "<h3>Estructura creada:</h3>";
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
                
                // Crear vinculación del administrador
                echo "<h3>3. Crear Vinculación del Administrador</h3>";
                $adminTelegramId = '118d2830-404f-49e9-9496-c5ab54e6a1c8';
                
                $sql = "INSERT INTO mdl_local_telegram_integration_users 
                        (moodleuserid, telegramuserid) 
                        VALUES (?, ?)";
                $result = $DB->execute($sql, [2, $adminTelegramId]);
                
                if ($result) {
                    echo "<p>✅ <strong>Vinculación del administrador creada exitosamente</strong></p>";
                    echo "<p><strong>Moodle User ID:</strong> 2</p>";
                    echo "<p><strong>Telegram User ID:</strong> $adminTelegramId</p>";
                    
                    // Verificar la vinculación
                    $sql = "SELECT * FROM mdl_local_telegram_integration_users WHERE moodleuserid = 2";
                    $record = $DB->get_record_sql($sql);
                    
                    if ($record) {
                        echo "<h3>Vinculación verificada:</h3>";
                        echo "<p><strong>ID:</strong> " . $record->id . "</p>";
                        echo "<p><strong>Moodle User ID:</strong> " . $record->moodleuserid . "</p>";
                        echo "<p><strong>Telegram User ID:</strong> " . $record->telegramuserid . "</p>";
                        echo "<p><strong>Created At:</strong> " . $record->createdat . "</p>";
                    }
                    
                } else {
                    echo "<p>❌ <strong>Error al crear la vinculación del administrador</strong></p>";
                }
                
            } else {
                echo "<p>❌ <strong>Error: La tabla no se creó correctamente</strong></p>";
            }
            
        } else {
            echo "<p>❌ <strong>Error al crear la tabla</strong></p>";
        }
        
    } catch (Exception $e) {
        echo "<p>❌ <strong>Error en la creación:</strong> " . $e->getMessage() . "</p>";
    }
} else {
    echo "<form method='post'>";
    echo "<input type='hidden' name='create_table' value='1'>";
    echo "<button type='submit' style='padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;'>";
    echo "🔧 Crear Tabla y Vincular Administrador";
    echo "</button>";
    echo "</form>";
}

echo "<h2>4. Información Adicional</h2>";
echo "<p><strong>Usuario actual:</strong> " . ($USER->username ?? 'No definido') . "</p>";
echo "<p><strong>Es administrador:</strong> " . (is_siteadmin() ? 'Sí' : 'No') . "</p>";
echo "<p><strong>ID de usuario:</strong> " . ($USER->id ?? 'No definido') . "</p>";

echo "<h2>5. Próximos Pasos</h2>";
echo "<p>Una vez que la tabla esté creada, puedes:</p>";
echo "<ul>";
echo "<li>✅ <a href='fix-admin-linkage.php'>Volver al script de corrección</a></li>";
echo "<li>✅ <a href='../analytics.php'>Verificar analytics</a></li>";
echo "<li>✅ <a href='debug-linkage-fix.php'>Verificar vinculación</a></li>";
echo "</ul>";
?> 