<?php
require_once('../../config.php');

echo "<h2>🔍 Debug de Ejecución del Observer</h2>";

// Verificar logs recientes de Moodle
echo "<h3>📋 Verificando logs de Moodle:</h3>";

// Buscar en los logs por nuestros mensajes
$log_file = $CFG->dataroot . '/temp/phplog.txt';
if (file_exists($log_file)) {
    echo "<p>✅ Archivo de log encontrado: {$log_file}</p>";
    
    // Leer las últimas líneas
    $lines = file($log_file);
    $recent_lines = array_slice($lines, -50); // Últimas 50 líneas
    
    echo "<h4>📄 Últimas líneas del log:</h4>";
    echo "<pre style='background-color: #f5f5f5; padding: 10px; max-height: 300px; overflow-y: scroll;'>";
    foreach ($recent_lines as $line) {
        if (strpos($line, 'TELEGRAM') !== false || strpos($line, 'telegram') !== false) {
            echo "<strong>" . htmlspecialchars($line) . "</strong>";
        } else {
            echo htmlspecialchars($line);
        }
    }
    echo "</pre>";
} else {
    echo "<p>❌ No se encontró archivo de log en: {$log_file}</p>";
    
    // Intentar otras ubicaciones comunes
    $other_logs = [
        '/var/log/apache2/error.log',
        '/var/log/nginx/error.log',
        $CFG->dataroot . '/error.log',
        $CFG->dataroot . '/php_errors.log'
    ];
    
    foreach ($other_logs as $log) {
        if (file_exists($log)) {
            echo "<p>⚠️ Log alternativo encontrado: {$log}</p>";
            break;
        }
    }
}

// Verificar si el observer está registrado correctamente
echo "<h3>🔍 Verificando registro del observer:</h3>";

try {
    // Forzar recarga del cache de observers
    $cache = cache::make('core', 'observers');
    $cache->purge();
    
    echo "<p>✅ Cache de observers purgado</p>";
    
    // Verificar si el plugin está habilitado
    $plugin_enabled = $DB->get_field('config_plugins', 'value', [
        'plugin' => 'local_telegram_integration',
        'name' => 'version'
    ]);
    
    if ($plugin_enabled) {
        echo "<p>✅ Plugin habilitado - Versión: {$plugin_enabled}</p>";
    } else {
        echo "<p>❌ Plugin NO habilitado</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error verificando observers: " . $e->getMessage() . "</p>";
}

// Test manual del observer
echo "<h3>🧪 Test manual del observer:</h3>";

try {
    // Verificar que la clase existe
    if (class_exists('\local_telegram_integration\observer')) {
        echo "<p>✅ Clase observer existe</p>";
        
        // Verificar método
        if (method_exists('\local_telegram_integration\observer', 'quiz_attempt_submitted')) {
            echo "<p>✅ Método quiz_attempt_submitted existe</p>";
        } else {
            echo "<p>❌ Método quiz_attempt_submitted NO existe</p>";
        }
        
    } else {
        echo "<p>❌ Clase observer NO existe</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error verificando clase: " . $e->getMessage() . "</p>";
}

// Verificar intentos recientes
echo "<h3>📊 Verificando intentos recientes:</h3>";

try {
    $recent_attempts = $DB->get_records_sql("
        SELECT qa.id, qa.userid, qa.quiz, qa.timestart, qa.timefinish, 
               q.name as quiz_name, q.course
        FROM {quiz_attempts} qa
        JOIN {quiz} q ON qa.quiz = q.id
        WHERE qa.timefinish > :since
        ORDER BY qa.timefinish DESC
        LIMIT 10
    ", ['since' => time() - 3600]); // Última hora
    
    if ($recent_attempts) {
        echo "<p>✅ Intentos recientes encontrados:</p>";
        echo "<table border='1' style='border-collapse: collapse;'>";
        echo "<tr><th>ID</th><th>Usuario</th><th>Quiz</th><th>Finalizado</th></tr>";
        foreach ($recent_attempts as $attempt) {
            $time = date('Y-m-d H:i:s', $attempt->timefinish);
            echo "<tr><td>{$attempt->id}</td><td>{$attempt->userid}</td><td>{$attempt->quiz_name}</td><td>{$time}</td></tr>";
        }
        echo "</table>";
    } else {
        echo "<p>❌ No hay intentos recientes</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error verificando intentos: " . $e->getMessage() . "</p>";
}

echo "<p>🎉 Debug completado</p>";
?> 