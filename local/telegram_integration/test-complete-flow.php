<?php
// Test Complete Flow - Telegram Integration
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/db-config.php');

// Require admin login
require_login();
require_capability('moodle/site:config', context_system::instance());

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Complete Flow - Telegram Integration</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .json-block { background: #f5f5f5; padding: 10px; margin: 10px 0; border-left: 4px solid #ccc; white-space: pre-wrap; font-family: monospace; }
    </style>
</head>
<body>
    <h1>🧪 Test Complete Flow - Telegram Integration</h1>
    
    <?php
    echo "<div class='section'>";
    echo "<h2>1. 🔌 Test Database Connection</h2>";
    
    try {
        $pdo = createDatabaseConnection();
        echo "<p class='success'>✅ Database connection successful</p>";
        
        // Test basic query
        $stmt = $pdo->query("SELECT VERSION() as version");
        $version = $stmt->fetch();
        echo "<p class='info'>📋 MySQL Version: {$version['version']}</p>";
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Database connection failed: {$e->getMessage()}</p>";
        echo "</div></body></html>";
        exit;
    }
    echo "</div>";
    
    echo "<div class='section'>";
    echo "<h2>2. 📊 Test Table Structure</h2>";
    
    $tables = ['telegramresponse', 'user_analytics', 'telegram_users', 'questions'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $result = $stmt->fetch();
            echo "<p class='success'>✅ Table '$table': {$result['count']} records</p>";
        } catch (Exception $e) {
            echo "<p class='error'>❌ Table '$table' error: {$e->getMessage()}</p>";
        }
    }
    echo "</div>";
    
    echo "<div class='section'>";
    echo "<h2>3. 🎯 Test ML Analytics Functions</h2>";
    
    // Test each analytics function
    $user_id = 2; // Test user ID
    
    echo "<h3>3.1 Predictive Analysis</h3>";
    try {
        require_once 'direct-ml-bridge-mysql.php';
        
        // Test predictive analysis
        $predictive_data = getPredictiveAnalysis($user_id);
        echo "<p class='success'>✅ Predictive analysis function works</p>";
        echo "<div class='json-block'>" . json_encode($predictive_data, JSON_PRETTY_PRINT) . "</div>";
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Predictive analysis error: {$e->getMessage()}</p>";
    }
    
    echo "<h3>3.2 Learning Metrics</h3>";
    try {
        $learning_data = getLearningMetrics($user_id);
        echo "<p class='success'>✅ Learning metrics function works</p>";
        echo "<div class='json-block'>" . json_encode($learning_data, JSON_PRETTY_PRINT) . "</div>";
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Learning metrics error: {$e->getMessage()}</p>";
    }
    
    echo "<h3>3.3 Optimization Analysis</h3>";
    try {
        $optimization_data = getOptimizationAnalysis($user_id);
        echo "<p class='success'>✅ Optimization analysis function works</p>";
        echo "<div class='json-block'>" . json_encode($optimization_data, JSON_PRETTY_PRINT) . "</div>";
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Optimization analysis error: {$e->getMessage()}</p>";
    }
    
    echo "<h3>3.4 Social Analysis</h3>";
    try {
        $social_data = getSocialAnalysis($user_id);
        echo "<p class='success'>✅ Social analysis function works</p>";
        echo "<div class='json-block'>" . json_encode($social_data, JSON_PRETTY_PRINT) . "</div>";
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Social analysis error: {$e->getMessage()}</p>";
    }
    
    echo "</div>";
    
    echo "<div class='section'>";
    echo "<h2>4. 🌐 Test AJAX Endpoints</h2>";
    
    $endpoints = [
        'get_predictive_data',
        'get_learning_metrics',
        'get_optimization_data',
        'get_social_data'
    ];
    
    foreach ($endpoints as $endpoint) {
        $url = "analytics.php?action={$endpoint}&format=json&userid={$user_id}";
        echo "<h3>4.{array_search($endpoint, $endpoints)+1} Testing {$endpoint}</h3>";
        echo "<p class='info'>📡 URL: <code>{$url}</code></p>";
        
        try {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => "Content-Type: application/json\r\n",
                    'timeout' => 30
                ]
            ]);
            
            $response = file_get_contents($url, false, $context);
            
            if ($response === false) {
                echo "<p class='error'>❌ Failed to fetch data from endpoint</p>";
            } else {
                $data = json_decode($response, true);
                if ($data === null) {
                    echo "<p class='error'>❌ Invalid JSON response</p>";
                    echo "<div class='json-block'>" . htmlspecialchars($response) . "</div>";
                } else {
                    echo "<p class='success'>✅ Endpoint works correctly</p>";
                    echo "<div class='json-block'>" . json_encode($data, JSON_PRETTY_PRINT) . "</div>";
                }
            }
            
        } catch (Exception $e) {
            echo "<p class='error'>❌ Endpoint error: {$e->getMessage()}</p>";
        }
    }
    
    echo "</div>";
    
    echo "<div class='section'>";
    echo "<h2>5. 📋 Summary</h2>";
    echo "<p>Test completed. If all sections show ✅, the system is working correctly.</p>";
    echo "<p><strong>Next Steps:</strong></p>";
    echo "<ul>";
    echo "<li><a href='setup-database.php?action=create_auxiliary_tables'>Create auxiliary tables</a></li>";
    echo "<li><a href='analytics.php'>Go to Analytics Dashboard</a></li>";
    echo "<li><a href='verify.php'>Verify Telegram Account</a></li>";
    echo "</ul>";
    echo "</div>";
    ?>
    
</body>
</html> 