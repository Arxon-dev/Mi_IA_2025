<?php
// Test database connection and data availability

header('Content-Type: application/json');

$db_config = [
    'host' => 'localhost',
    'port' => '3306',
    'dbname' => 'u449034524_mi_ia_db',
    'user' => 'u449034524_mi_ia',
    'password' => 'Sirius//03072503//'
];

try {
    // Usar un DSN dinámico
    $dsn = "mysql:host={$db_config['host']};port={$db_config['port']};dbname={$db_config['dbname']};charset=utf8mb4";
    
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ];
    
    $pdo = new PDO(
        $dsn,
        $db_config['user'],
        $db_config['password'],
        $options
    );
    
    $results = [];
    
    // Test 1: Check if telegramresponse table exists and has data
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM telegramresponse');
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $results['telegramresponse'] = [
            'status' => 'success',
            'count' => $count['count'],
            'message' => "Found {$count['count']} telegram responses"
        ];
    } catch (Exception $e) {
        $results['telegramresponse'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
    
    // Test 2: Check if studyresponse table exists and has data
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM studyresponse');
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $results['studyresponse'] = [
            'status' => 'success',
            'count' => $count['count'],
            'message' => "Found {$count['count']} study responses"
        ];
    } catch (Exception $e) {
        $results['studyresponse'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
    
    // Test 3: Check if telegramuser table exists and has data
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM telegramuser');
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $results['telegramusers'] = [
            'status' => 'success',
            'count' => $count['count'],
            'message' => "Found {$count['count']} telegram users"
        ];
    } catch (Exception $e) {
        $results['telegramusers'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
    
    // Test 4: Check available subjects in studyresponse
    try {
        $stmt = $pdo->query('SELECT DISTINCT subject FROM studyresponse LIMIT 10');
        $subjects = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $results['available_subjects'] = [
            'status' => 'success',
            'subjects' => $subjects,
            'count' => count($subjects),
            'message' => "Found " . count($subjects) . " different subjects"
        ];
    } catch (Exception $e) {
        $results['available_subjects'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
    
    // Test 5: Check moodleintegration table
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM moodleintegration WHERE is_verified = 1');
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $results['moodleintegrations'] = [
            'status' => 'success',
            'count' => $count['count'],
            'message' => "Found {$count['count']} verified Moodle integrations"
        ];
    } catch (Exception $e) {
        $results['moodleintegrations'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
    
    // Test 6: Sample data from last 30 days in telegramresponse
    try {
        $stmt = $pdo->query(
            'SELECT COUNT(*) as recent_responses FROM telegramresponse WHERE answeredat >= NOW() - INTERVAL 30 DAY'
        );
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $results['recent_activity'] = [
            'status' => 'success',
            'count' => $count['recent_responses'],
            'message' => "Found {$count['recent_responses']} responses in last 30 days"
        ];
    } catch (Exception $e) {
        $results['recent_activity'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
    
    $results['database_connection'] = [
        'status' => 'success',
        'message' => 'Database connection successful'
    ];
    
} catch (PDOException $e) {
    $results = [
        'database_connection' => [
            'status' => 'error',
            'message' => 'Database connection failed: ' . $e->getMessage()
        ]
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>