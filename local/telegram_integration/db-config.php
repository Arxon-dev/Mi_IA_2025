<?php
// Database configuration for ML Analytics (MySQL version)
// Centralized database connection settings

$db_config = [
    'host' => 'localhost',  // En algunos hostings puede ser 'localhost' o una IP específica
    'port' => '3306',
    'dbname' => 'u449034524_mi_ia_db',
    'user' => 'u449034524_mi_ia',
    'password' => 'Sirius//03072503//'
];

// Configuración alternativa para hosting (descomenta si localhost no funciona)
// $db_config = [
//     'host' => '127.0.0.1',  // Prueba con IP local
//     'port' => '3306',
//     'dbname' => 'u449034524_mi_ia_db',
//     'user' => 'u449034524_mi_ia',
//     'password' => 'Sirius//03072503//'
// ];

/**
 * Create PDO connection with error handling (MySQL)
 */
function createDatabaseConnection() {
    global $db_config;
    try {
        $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']};charset=utf8mb4";
        $pdo = new PDO($dsn, $db_config['user'], $db_config['password']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Log de conexión exitosa
        error_log("✅ Database connection successful to {$db_config['host']}:{$db_config['port']}/{$db_config['dbname']}");
        
        return $pdo;
    } catch (PDOException $e) {
        error_log("❌ Database connection error: " . $e->getMessage());
        error_log("❌ DSN used: mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']};charset=utf8mb4");
        throw new Exception("Database connection failed: " . $e->getMessage());
    }
}

/**
 * Test database connection
 */
function testDatabaseConnection() {
    try {
        $pdo = createDatabaseConnection();
        $stmt = $pdo->query('SELECT 1');
        return true;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Subject mapping for question categorization
 * Maps database category names to human-readable Spanish names
 */
$subject_mapping = [
    'constitucion' => 'Constitución Española',
    'defensanacional' => 'Ley Orgánica 5/2005 Defensa Nacional', 
    'rio' => 'Régimen Jurídico del Sector Público',
    'minsdef' => 'Real Decreto 205/2024 Ministerio de Defensa',
    'organizacionfas' => 'Organización básica de las Fuerzas Armadas',
    'emad' => 'Estado Mayor de la Defensa',
    'et' => 'Ejército de Tierra',
    'armada' => 'Armada Española',
    'aire' => 'Ejército del Aire y del Espacio',
    'carrera' => 'Ley de Carrera Militar',
    'tropa' => 'Ley 8/2006 Tropa y Marinería',
    'rroo' => 'Reales Ordenanzas para las FAS',
    'derechosydeberes' => 'Derechos y deberes FAS',
    'regimendisciplinario' => 'Régimen Disciplinario de las FAS',
    'iniciativasquejas' => 'Iniciativas y quejas',
    'igualdad' => 'Ley de Igualdad',
    'omi' => 'Observatorio militar para la igualdad',
    'pac' => 'Procedimiento Administrativo Común',
    'seguridadnacional' => 'Ley 36/2015 Seguridad Nacional',
    'pdc' => 'PDC-01(B) Doctrina para el empleo de las FAS',
    'onu' => 'Organización de las Naciones Unidas (ONU)',
    'otan' => 'OTAN',
    'osce' => 'OSCE',
    'ue' => 'Unión Europea (UE)',
    'misionesinternacionales' => 'España y Misiones Internacionales'
];

/**
 * Risk level thresholds
 */
$risk_thresholds = [
    'high' => 70,      // Risk score >= 70
    'medium' => 40,    // Risk score >= 40
    'low' => 0         // Risk score < 40
];

/**
 * Performance analysis parameters
 */
$analysis_config = [
    'analysis_period_days' => 30,           // Days to look back for analysis
    'minimum_questions_for_analysis' => 5,  // Minimum questions per subject
    'minimum_total_questions' => 10,        // Minimum total questions for reliable analysis
    'accuracy_weight' => 0.4,               // Weight of accuracy in risk calculation
    'response_time_weight' => 0.3,          // Weight of response time in risk calculation
    'timeout_weight' => 0.2,                // Weight of timeouts in risk calculation
    'sample_size_weight' => 0.1             // Weight of sample size in risk calculation
];

function get_telegram_db_config() {
    global $CFG;
    if (isset($CFG->telegram_db_config)) {
        return $CFG->telegram_db_config;
    }
    return [
        'type' => 'mysql',
        'host' => 'localhost',
        'port' => '3306',
        'dbname' => 'u449034524_moodel_telegra',  // ✅ CAMBIADO
        'user' => 'u449034524_opomelilla_25',     // ✅ CAMBIADO
        'pass' => 'Sirius//03072503//'
    ];
}

function get_telegram_db_connection() {
    $db_config = get_telegram_db_config();
    if (!$db_config) {
        return null;
    }
    try {
        $dsn = "{$db_config['type']}:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']};charset=utf8mb4";
        $pdo = new PDO($dsn, $db_config['user'], $db_config['pass']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        error_log("❌ Error de conexión a la BD de Telegram: " . $e->getMessage());
        error_log("❌ DSN used: {$db_config['type']}:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']};charset=utf8mb4");
        return null;
    }
}
?>