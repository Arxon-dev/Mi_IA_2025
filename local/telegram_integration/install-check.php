<?php
// Installation check for ML Analytics system
// Verifies all requirements and provides setup guidance

header('Content-Type: text/html; charset=UTF-8');

echo "<!DOCTYPE html>
<html>
<head>
    <title>🧠 ML Analytics - Installation Check</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .check { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        h1 { color: #333; text-align: center; }
        h2 { color: #555; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        .status { font-weight: bold; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .recommendation { background: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🧠 ML Analytics - Installation Check</h1>
        <p>Este script verifica que todos los componentes estén correctamente configurados.</p>";

$checks = [];
$overall_status = 'success';

// Check 1: PHP Version
echo "<h2>1. Verificación de PHP</h2>";
$php_version = phpversion();
if (version_compare($php_version, '7.4', '>=')) {
    echo "<div class='check success'>✅ <span class='status'>PHP Version:</span> $php_version (Compatible)</div>";
    $checks['php'] = true;
} else {
    echo "<div class='check error'>❌ <span class='status'>PHP Version:</span> $php_version (Requiere 7.4+)</div>";
    $checks['php'] = false;
    $overall_status = 'error';
}

// Check 2: PDO PostgreSQL Extension
echo "<h2>2. Extensiones de PHP</h2>";
if (extension_loaded('pdo_pgsql')) {
    echo "<div class='check success'>✅ <span class='status'>PDO PostgreSQL:</span> Instalado</div>";
    $checks['pdo_pgsql'] = true;
} else {
    echo "<div class='check error'>❌ <span class='status'>PDO PostgreSQL:</span> No instalado</div>";
    echo "<div class='recommendation'>
        <strong>Solución:</strong> Instalar extensión pdo_pgsql<br>
        <strong>Ubuntu/Debian:</strong> <code>sudo apt-get install php-pgsql</code><br>
        <strong>CentOS/RHEL:</strong> <code>sudo yum install php-pgsql</code>
    </div>";
    $checks['pdo_pgsql'] = false;
    $overall_status = 'error';
}

if (extension_loaded('json')) {
    echo "<div class='check success'>✅ <span class='status'>JSON:</span> Instalado</div>";
    $checks['json'] = true;
} else {
    echo "<div class='check error'>❌ <span class='status'>JSON:</span> No instalado</div>";
    $checks['json'] = false;
    $overall_status = 'error';
}

// Check 3: Database Connection
echo "<h2>3. Conexión a Base de Datos</h2>";
try {
    require_once(__DIR__ . '/db-config.php');
    $pdo = createDatabaseConnection();
    echo "<div class='check success'>✅ <span class='status'>Conexión PostgreSQL:</span> Exitosa</div>";
    $checks['database'] = true;
    
    // Check database structure
    echo "<h3>3.1 Estructura de Base de Datos</h3>";
    
    $required_tables = [
        'TelegramResponse' => 'Respuestas de Telegram',
        'StudyResponse' => 'Respuestas de Estudio',
        'TelegramUser' => 'Usuarios de Telegram',
        'MoodleIntegration' => 'Integración con Moodle'
    ];
    
    foreach ($required_tables as $table => $description) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) FROM \"$table\"");
            $count = $stmt->fetchColumn();
            echo "<div class='check success'>✅ <span class='status'>Tabla $table:</span> Existe ($count registros)</div>";
            $checks["table_$table"] = true;
        } catch (Exception $e) {
            echo "<div class='check warning'>⚠️ <span class='status'>Tabla $table:</span> No encontrada o sin acceso</div>";
            $checks["table_$table"] = false;
            if ($overall_status !== 'error') $overall_status = 'warning';
        }
    }
    
} catch (Exception $e) {
    echo "<div class='check error'>❌ <span class='status'>Conexión PostgreSQL:</span> Falló</div>";
    echo "<div class='check error'><strong>Error:</strong> " . htmlspecialchars($e->getMessage()) . "</div>";
    echo "<div class='recommendation'>
        <strong>Verificar:</strong><br>
        1. PostgreSQL está ejecutándose<br>
        2. Credenciales en db-config.php son correctas<br>
        3. Usuario tiene permisos en la base de datos<br>
        4. Firewall permite conexión al puerto 5432
    </div>";
    $checks['database'] = false;
    $overall_status = 'error';
}

// Check 4: File Permissions
echo "<h2>4. Permisos de Archivos</h2>";
$files_to_check = [
    'ml-analytics-real.php' => 'Endpoint principal',
    'ml-analytics-functions.php' => 'Funciones de análisis',
    'db-config.php' => 'Configuración de BD',
    'analytics.php' => 'Página principal',
    'js/analytics.js' => 'JavaScript frontend',
    'styles/analytics.css' => 'Estilos CSS'
];

foreach ($files_to_check as $file => $description) {
    if (file_exists(__DIR__ . '/' . $file)) {
        if (is_readable(__DIR__ . '/' . $file)) {
            echo "<div class='check success'>✅ <span class='status'>$file:</span> Existe y es legible</div>";
            $checks["file_$file"] = true;
        } else {
            echo "<div class='check warning'>⚠️ <span class='status'>$file:</span> Existe pero no es legible</div>";
            $checks["file_$file"] = false;
            if ($overall_status !== 'error') $overall_status = 'warning';
        }
    } else {
        echo "<div class='check error'>❌ <span class='status'>$file:</span> No encontrado</div>";
        $checks["file_$file"] = false;
        $overall_status = 'error';
    }
}

// Check 5: Data Availability
if ($checks['database'] ?? false) {
    echo "<h2>5. Disponibilidad de Datos</h2>";
    
    try {
        // Check recent activity
        $stmt = $pdo->query("
            SELECT COUNT(*) as count 
            FROM `TelegramResponse` 
            WHERE \"answeredAt\" >= NOW() - INTERVAL '30 days'
        ");
        $recent_responses = $stmt->fetchColumn();
        
        if ($recent_responses > 50) {
            echo "<div class='check success'>✅ <span class='status'>Actividad Reciente:</span> $recent_responses respuestas (Excelente)</div>";
        } elseif ($recent_responses > 10) {
            echo "<div class='check warning'>⚠️ <span class='status'>Actividad Reciente:</span> $recent_responses respuestas (Suficiente)</div>";
        } else {
            echo "<div class='check warning'>⚠️ <span class='status'>Actividad Reciente:</span> $recent_responses respuestas (Limitado)</div>";
        }
        
        // Check subjects diversity
        $stmt = $pdo->query("SELECT COUNT(DISTINCT subject) FROM \"StudyResponse\"");
        $subjects_count = $stmt->fetchColumn();
        
        if ($subjects_count > 10) {
            echo "<div class='check success'>✅ <span class='status'>Diversidad de Materias:</span> $subjects_count materias</div>";
        } elseif ($subjects_count > 5) {
            echo "<div class='check warning'>⚠️ <span class='status'>Diversidad de Materias:</span> $subjects_count materias</div>";
        } else {
            echo "<div class='check warning'>⚠️ <span class='status'>Diversidad de Materias:</span> $subjects_count materias (Limitado)</div>";
        }
        
    } catch (Exception $e) {
        echo "<div class='check error'>❌ <span class='status'>Análisis de Datos:</span> Error al verificar</div>";
    }
}

// Overall Status
echo "<h2>6. Estado General</h2>";
if ($overall_status === 'success') {
    echo "<div class='check success'>🎉 <span class='status'>Sistema:</span> Listo para usar</div>";
    echo "<div class='info'>
        <strong>¡Todo configurado correctamente!</strong><br>
        Puedes acceder al sistema en: <br>
        <a href='analytics.php' target='_blank'>https://campus.opomelilla.com/local/telegram_integration/analytics.php</a>
    </div>";
} elseif ($overall_status === 'warning') {
    echo "<div class='check warning'>⚠️ <span class='status'>Sistema:</span> Funcional con limitaciones</div>";
    echo "<div class='info'>
        <strong>El sistema puede funcionar pero con datos limitados.</strong><br>
        Revisa las advertencias anteriores para mejorar la experiencia.
    </div>";
} else {
    echo "<div class='check error'>❌ <span class='status'>Sistema:</span> Requiere configuración</div>";
    echo "<div class='info'>
        <strong>Hay problemas críticos que deben resolverse.</strong><br>
        Revisa los errores anteriores antes de continuar.
    </div>";
}

// Next Steps
echo "<h2>7. Próximos Pasos</h2>";
echo "<div class='recommendation'>
    <strong>Para usar el sistema:</strong><br>
    1. Corrige cualquier error mostrado arriba<br>
    2. Asegúrate de tener datos de usuario en las tablas<br>
    3. Accede a la página principal de analytics<br>
    4. Vincula tu cuenta de Telegram si no lo has hecho<br><br>
    
    <strong>Para obtener mejores resultados:</strong><br>
    • Usa el bot de Telegram regularmente<br>
    • Completa sesiones de estudio<br>
    • Practica diferentes materias<br>
    • Mantén actividad constante
</div>";

echo "
    </div>
</body>
</html>";
?>