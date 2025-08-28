<?php
// Test database connections and user data
require_once(__DIR__ . '/../../config.php');

echo "<h2>🔍 Test de Conexiones a Base de Datos</h2>";

// Test 1: Moodle Database Connection
echo "<h3>1. Conexión a Base de Datos de Moodle</h3>";
try {
    global $DB;
    $usercount = $DB->count_records('user');
    echo "✅ Conexión a Moodle exitosa<br>";
    echo "📊 Total de usuarios en Moodle: $usercount<br>";
} catch (Exception $e) {
    echo "❌ Error conectando a Moodle: " . $e->getMessage() . "<br>";
}

// Test 2: Telegram Integration Tables
echo "<h3>2. Tablas del Plugin Telegram Integration</h3>";

// Check if local_telegram_verification table exists
try {
    $verification_count = $DB->count_records('local_telegram_verification');
    echo "✅ Tabla 'local_telegram_verification' existe<br>";
    echo "📊 Total de registros de verificación: $verification_count<br>";
    
    // Show some sample data
    if ($verification_count > 0) {
        $verifications = $DB->get_records('local_telegram_verification', null, 'id DESC', '*', 0, 5);
        echo "<strong>Últimos 5 registros:</strong><br>";
        echo "<table border='1' style='margin: 10px 0;'>";
        echo "<tr><th>ID</th><th>Moodle User ID</th><th>Telegram User ID</th><th>Username</th><th>Verificado</th><th>Creado</th></tr>";
        foreach ($verifications as $v) {
            $verified = $v->is_verified ? '✅' : '❌';
            $created = date('Y-m-d H:i', $v->created_at);
            echo "<tr><td>{$v->id}</td><td>{$v->moodle_userid}</td><td>{$v->telegram_userid}</td><td>{$v->telegram_username}</td><td>{$verified}</td><td>{$created}</td></tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "❌ Error con tabla 'local_telegram_verification': " . $e->getMessage() . "<br>";
}

// Check if local_telegram_activities table exists
try {
    $activities_count = $DB->count_records('local_telegram_activities');
    echo "✅ Tabla 'local_telegram_activities' existe<br>";
    echo "📊 Total de actividades sincronizadas: $activities_count<br>";
    
    if ($activities_count > 0) {
        $activities = $DB->get_records('local_telegram_activities', null, 'id DESC', '*', 0, 3);
        echo "<strong>Últimas 3 actividades:</strong><br>";
        echo "<table border='1' style='margin: 10px 0;'>";
        echo "<tr><th>ID</th><th>Moodle User</th><th>Telegram User</th><th>Tipo</th><th>Correcto</th><th>Tiempo</th><th>Materia</th></tr>";
        foreach ($activities as $a) {
            $correct = $a->question_correct ? '✅' : '❌';
            echo "<tr><td>{$a->id}</td><td>{$a->moodle_userid}</td><td>{$a->telegram_userid}</td><td>{$a->activity_type}</td><td>{$correct}</td><td>{$a->response_time}ms</td><td>{$a->subject}</td></tr>";
        }
        echo "</table>";
    }
} catch (Exception $e) {
    echo "❌ Error con tabla 'local_telegram_activities': " . $e->getMessage() . "<br>";
}

// Test 3: Current User Test
echo "<h3>3. Test de Usuario Actual</h3>";
if (isloggedin()) {
    global $USER;
    echo "✅ Usuario logueado: {$USER->firstname} {$USER->lastname} (ID: {$USER->id})<br>";
    
    // Check if current user has Telegram verification
    try {
        $verification = $DB->get_record('local_telegram_verification', [
            'moodle_userid' => $USER->id,
            'is_verified' => 1
        ]);
        
        if ($verification) {
            echo "✅ Usuario tiene verificación de Telegram<br>";
            echo "📱 Telegram User ID: {$verification->telegram_userid}<br>";
            echo "👤 Telegram Username: {$verification->telegram_username}<br>";
            
            // Test the function we just fixed
            require_once 'analytics.php';
            $telegram_id = get_telegram_user_id($USER->id);
            echo "🔗 Función get_telegram_user_id() devuelve: " . ($telegram_id ? $telegram_id : 'null') . "<br>";
        } else {
            echo "❌ Usuario NO tiene verificación de Telegram<br>";
            echo "💡 El usuario necesita vincular su cuenta de Telegram<br>";
        }
    } catch (Exception $e) {
        echo "❌ Error verificando usuario actual: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ No hay usuario logueado<br>";
}

// Test 4: Bridge API Test
echo "<h3>4. Test de Bridge API</h3>";
require_once 'ml-analytics-bridge.php';

try {
    $bridge = new MLAnalyticsBridge();
    $test_result = $bridge->testConnection();
    
    if ($test_result && isset($test_result['status']) && $test_result['status'] === 'success') {
        echo "✅ Bridge API conecta correctamente<br>";
        echo "📡 Respuesta: " . json_encode($test_result) . "<br>";
        
        // Test with a sample user ID if we have verified users
        if (isset($verification) && $verification) {
            echo "<strong>Probando con usuario verificado:</strong><br>";
            $predictive = $bridge->getPredictiveAnalysis($verification->telegram_userid);
            echo "🎯 Análisis predictivo: " . json_encode($predictive) . "<br>";
        }
    } else {
        echo "❌ Bridge API no responde correctamente<br>";
        echo "📡 Respuesta: " . json_encode($test_result) . "<br>";
    }
} catch (Exception $e) {
    echo "❌ Error con Bridge API: " . $e->getMessage() . "<br>";
}

echo "<hr>";
echo "<p><strong>💡 Resumen:</strong></p>";
echo "<ul>";
echo "<li>Si no hay registros en 'local_telegram_verification', los usuarios necesitan vincular sus cuentas</li>";
echo "<li>Si no hay datos en 'local_telegram_activities', no hay actividades sincronizadas desde Telegram</li>";
echo "<li>El Bridge API debe conectar a la base de datos PostgreSQL local donde están los datos reales de Telegram</li>";
echo "</ul>";

// Test de conexión a PostgreSQL
echo "🧪 Test Database Connection\n";
echo "==========================\n\n";

// Configuración de la base de datos
$host = 'localhost';
$port = '5432';
$dbname = 'mi_ia_db';
$user = 'postgres';
$password = 'Opomelilla2024';

echo "📋 Configuración de BD:\n";
echo "Host: $host\n";
echo "Port: $port\n";
echo "Database: $dbname\n";
echo "User: $user\n";
echo "Password: " . str_repeat('*', strlen($password)) . "\n\n";

// Test 1: Verificar si PostgreSQL está instalado
echo "🔍 Test 1: Verificar PostgreSQL\n";
if (extension_loaded('pdo_pgsql')) {
    echo "✅ Extensión PDO PostgreSQL está instalada\n";
} else {
    echo "❌ Extensión PDO PostgreSQL NO está instalada\n";
    echo "Instala: sudo apt-get install php-pgsql\n";
}

if (extension_loaded('pgsql')) {
    echo "✅ Extensión PostgreSQL está instalada\n";
} else {
    echo "❌ Extensión PostgreSQL NO está instalada\n";
}

echo "\n";

// Test 2: Intentar conexión PDO
echo "🔍 Test 2: Conexión PDO\n";
try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    echo "DSN: $dsn\n";
    
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Conexión PDO exitosa\n";
    
    // Test de consulta simple
    $stmt = $pdo->query("SELECT version()");
    $version = $stmt->fetchColumn();
    echo "PostgreSQL Version: $version\n";
    
} catch (PDOException $e) {
    echo "❌ Error PDO: " . $e->getMessage() . "\n";
    echo "Código: " . $e->getCode() . "\n";
}

echo "\n";

// Test 3: Intentar conexión con pg_connect
echo "🔍 Test 3: Conexión pg_connect\n";
try {
    $connection_string = "host=$host port=$port dbname=$dbname user=$user password=$password";
    echo "Connection string: " . str_replace($password, '***', $connection_string) . "\n";
    
    $pg_conn = pg_connect($connection_string);
    
    if ($pg_conn) {
        echo "✅ Conexión pg_connect exitosa\n";
        
        $result = pg_query($pg_conn, "SELECT version()");
        if ($result) {
            $version = pg_fetch_result($result, 0, 0);
            echo "PostgreSQL Version: $version\n";
        }
        
        pg_close($pg_conn);
    } else {
        echo "❌ Error pg_connect\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error pg_connect: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 4: Verificar si el servidor está ejecutándose
echo "🔍 Test 4: Verificar servidor PostgreSQL\n";
$connection = @fsockopen($host, $port, $errno, $errstr, 5);
if ($connection) {
    echo "✅ Puerto $port está abierto en $host\n";
    fclose($connection);
} else {
    echo "❌ No se puede conectar al puerto $port en $host\n";
    echo "Error: $errstr ($errno)\n";
}

echo "\n";

// Test 5: Verificar archivo de configuración
echo "🔍 Test 5: Verificar configuración\n";
$config_file = __DIR__ . '/db-config.php';
if (file_exists($config_file)) {
    echo "✅ Archivo db-config.php existe\n";
    
    // Leer configuración
    include $config_file;
    if (isset($db_config)) {
        echo "Configuración encontrada:\n";
        echo "Host: " . ($db_config['host'] ?? 'NO SET') . "\n";
        echo "Port: " . ($db_config['port'] ?? 'NO SET') . "\n";
        echo "Database: " . ($db_config['dbname'] ?? 'NO SET') . "\n";
        echo "User: " . ($db_config['user'] ?? 'NO SET') . "\n";
    }
} else {
    echo "❌ Archivo db-config.php NO existe\n";
}

echo "\n";

// Test 6: Verificar tablas
echo "🔍 Test 6: Verificar tablas\n";
try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Listar tablas
    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Tablas encontradas:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    // Verificar tabla TelegramResponse específicamente
    if (in_array('TelegramResponse', $tables)) {
        echo "✅ Tabla TelegramResponse existe\n";
        
        // Contar registros
        $stmt = $pdo->query("SELECT COUNT(*) FROM `TelegramResponse`");
        $count = $stmt->fetchColumn();
        echo "Registros en TelegramResponse: $count\n";
        
    } else {
        echo "❌ Tabla TelegramResponse NO existe\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error verificando tablas: " . $e->getMessage() . "\n";
}

echo "\n🔍 Resumen:\n";
echo "Si ves errores de conexión, verifica:\n";
echo "1. PostgreSQL está instalado y ejecutándose\n";
echo "2. Las credenciales son correctas\n";
echo "3. La base de datos 'mi_ia_db' existe\n";
echo "4. El usuario 'postgres' tiene permisos\n";
echo "5. El puerto 5432 está abierto\n";
?> 