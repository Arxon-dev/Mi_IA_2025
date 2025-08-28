<?php
require_once(__DIR__ . '/../../config.php');
require_login();

// Verificar permisos de administrador
if (!has_capability('moodle/site:config', context_system::instance())) {
    echo $OUTPUT->header();
    echo "<h2>❌ Acceso Denegado</h2>";
    echo "<p>Necesitas permisos de administrador para ejecutar este script.</p>";
    echo $OUTPUT->footer();
    exit;
}

echo $OUTPUT->header();
echo "<h1>🔗 Crear Tabla de Enlaces Moodle-Telegram</h1>";

// Conexión a base de datos
try {
    $pdo = new PDO(
        "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
        $CFG->dbuser,
        $CFG->dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>❌ Error de Conexión a la Base de Datos</h3>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "<p>Verifica tus credenciales de base de datos en config.php.</p>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}


// Verificar si la tabla ya existe
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'mdl_local_telegram_user_link'");
    if ($stmt->rowCount() > 0) {
        echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<h3>✅ Tabla ya existe</h3>";
        echo "<p>La tabla <strong>mdl_local_telegram_user_link</strong> ya existe en la base de datos.</p>";
        echo "</div>";
    } else {
        // Crear la tabla
        $createTableSQL = "
        CREATE TABLE `mdl_local_telegram_user_link` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `moodleuserid` int(11) NOT NULL,
            `telegramuserid` varchar(255) NOT NULL,
            `linkedat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `lastsync` timestamp NULL DEFAULT NULL,
            `isactive` tinyint(1) NOT NULL DEFAULT 1,
            PRIMARY KEY (`id`),
            UNIQUE KEY `moodleuserid` (`moodleuserid`),
            UNIQUE KEY `telegramuserid` (`telegramuserid`),
            KEY `idx_moodleuserid` (`moodleuserid`),
            KEY `idx_telegramuserid` (`telegramuserid`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $pdo->exec($createTableSQL);
        
        echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<h3>✅ Tabla creada exitosamente</h3>";
        echo "<p>La tabla <strong>mdl_local_telegram_user_link</strong> ha sido creada correctamente.</p>";
        echo "</div>";
    }
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>❌ Error creando tabla</h3>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "</div>";
    echo $OUTPUT->footer();
    exit;
}

// Insertar enlace para el administrador (usuario ID 2)
try {
    // Verificar si ya existe el enlace
    $stmt = $pdo->prepare("SELECT * FROM mdl_local_telegram_user_link WHERE moodleuserid = ?");
    $stmt->execute([2]);
    $existingLink = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingLink) {
        echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
        echo "<h3>⚠️ Enlace ya existe</h3>";
        echo "<p>El usuario administrador (ID: 2) ya está vinculado con: " . $existingLink['telegramuserid'] . "</p>";
        echo "</div>";
    } else {
        // Buscar un usuario de Telegram para vincular
        $stmt = $pdo->query("SELECT telegramuserid, firstname FROM telegramuser WHERE firstname LIKE '%Carlos%' OR firstname LIKE '%Admin%' LIMIT 1");
        $telegramUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($telegramUser) {
            $stmt = $pdo->prepare("INSERT INTO mdl_local_telegram_user_link (moodleuserid, telegramuserid) VALUES (?, ?)");
            $stmt->execute([2, $telegramUser['telegramuserid']]);
            
            echo "<div style='background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
            echo "<h3>✅ Enlace creado</h3>";
            echo "<p>Usuario administrador (ID: 2) vinculado con: " . $telegramUser['telegramuserid'] . " (" . $telegramUser['firstname'] . ")</p>";
            echo "</div>";
        } else {
            echo "<div style='background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
            echo "<h3>⚠️ No se encontró usuario de Telegram</h3>";
            echo "<p>No se encontró un usuario de Telegram para vincular con el administrador.</p>";
            echo "<p>Puedes crear el enlace manualmente más tarde.</p>";
            echo "</div>";
        }
    }
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>❌ Error creando enlace</h3>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "</div>";
}

// Mostrar estadísticas
echo "<h2>📊 Estadísticas de la Tabla</h2>";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM mdl_local_telegram_user_link");
    $totalLinks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo "<p><strong>Total enlaces:</strong> $totalLinks</p>";
    
    if ($totalLinks > 0) {
        $stmt = $pdo->query("SELECT * FROM mdl_local_telegram_user_link ORDER BY linkedat DESC LIMIT 5");
        $recentLinks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "<h3>Enlaces Recientes:</h3>";
        echo "<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>";
        echo "<thead>";
        echo "<tr style='background: #f8f9fa;'>";
        echo "<th style='padding: 12px; text-align: left; border-bottom: 1px solid #eee;'>ID Moodle</th>";
        echo "<th style='padding: 12px; text-align: left; border-bottom: 1px solid #eee;'>ID Telegram</th>";
        echo "<th style='padding: 12px; text-align: left; border-bottom: 1px solid #eee;'>Fecha</th>";
        echo "</tr>";
        echo "</thead>";
        echo "<tbody>";
        
        foreach ($recentLinks as $link) {
            echo "<tr>";
            echo "<td style='padding: 12px; border-bottom: 1px solid #eee;'>" . $link['moodleuserid'] . "</td>";
            echo "<td style='padding: 12px; border-bottom: 1px solid #eee;'>" . $link['telegramuserid'] . "</td>";
            echo "<td style='padding: 12px; border-bottom: 1px solid #eee;'>" . $link['linkedat'] . "</td>";
            echo "</tr>";
        }
        
        echo "</tbody>";
        echo "</table>";
    }
} catch (Exception $e) {
    echo "<p style='color: red;'>Error obteniendo estadísticas: " . $e->getMessage() . "</p>";
}

// Enlaces útiles
echo "<h2>🔗 Próximos Pasos</h2>";
echo "<div style='background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
echo "<h3>✅ Tabla creada correctamente</h3>";
echo "<p>Ahora puedes:</p>";
echo "<ul>";
echo "<li><a href='my-advanced-analytics.php' style='color: #2196f3;'>📊 Probar Analytics Avanzado</a></li>";
echo "<li><a href='debug-analytics.php' style='color: #2196f3;'>🔍 Ejecutar Diagnóstico</a></li>";
echo "<li><a href='test-advanced-analytics.php' style='color: #2196f3;'>🧪 Insertar Datos de Prueba</a></li>";
echo "<li><a href='global-rankings.php' style='color: #2196f3;'>🏆 Ver Rankings Globales</a></li>";
echo "</ul>";
echo "</div>";

echo $OUTPUT->footer();
?> 