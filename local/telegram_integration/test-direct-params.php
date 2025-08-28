<?php
/**
 * Test direct parameter handling without Moodle optional_param
 */
require_once(__DIR__ . '/../../config.php');

// Check if user is logged in
require_login();

// Debug: ver qué llega siempre
error_log("🔍 DIRECT_PARAMS ALWAYS DEBUG:");
error_log("GET params: " . print_r($_GET, true));
error_log("Action isset: " . (isset($_GET['action']) ? 'YES' : 'NO'));
if (isset($_GET['action'])) {
    error_log("Action value: '" . $_GET['action'] . "'");
    error_log("Action length: " . strlen($_GET['action']));
    error_log("Action bytes: " . bin2hex($_GET['action']));
    error_log("Action === 'get_predictive_data': " . ($_GET['action'] === 'get_predictive_data' ? 'TRUE' : 'FALSE'));
}

// Handle AJAX request directly
if (isset($_GET['action']) && $_GET['action'] === 'get_predictive_data') {
    error_log("✅ Condition matched - processing AJAX request");
    header('Content-Type: application/json');
    
    // Debug: ver exactamente qué llega
    error_log("🔍 DIRECT_PARAMS DEBUG:");
    error_log("Action: '" . $_GET['action'] . "'");
    error_log("Format: '" . ($_GET['format'] ?? 'not-set') . "'");
    error_log("UserID: '" . ($_GET['userid'] ?? 'not-set') . "'");
    error_log("All GET params: " . print_r($_GET, true));
    
    $user_id = isset($_GET['userid']) ? (int)$_GET['userid'] : $USER->id;
    
    // Include the analytics functions
    require_once 'analytics.php';
    
    // Call the function directly
    $result = get_predictive_analysis_data($user_id);
    
    echo json_encode($result);
    exit;
} else {
    error_log("❌ Condition NOT matched");
    if (!isset($_GET['action'])) {
        error_log("❌ Action parameter not set");
    } else {
        error_log("❌ Action value does not match: '" . $_GET['action'] . "'");
    }
}

// Display test page
echo "<h2>🧪 Test Direct Parameters</h2>";
echo "<h3>Test Direct AJAX</h3>";
echo "<button onclick='testDirectAjax()'>Test Direct AJAX</button>";
echo "<div id='direct-result'></div>";

?>

<script>
function testDirectAjax() {
    const resultDiv = document.getElementById('direct-result');
    resultDiv.innerHTML = 'Cargando...';

    const url = `/local/telegram_integration/test-direct-params.php?action=get_predictive_data&format=json&userid=<?php echo $USER->id; ?>`;
    
    console.log("🔍 Direct AJAX URL:", url);
    
    fetch(url)
        .then(response => {
            console.log("📡 Direct Response status:", response.status);
            return response.text();
        })
        .then(data => {
            console.log("📄 Direct Raw response:", data);
            
            try {
                const jsonData = JSON.parse(data);
                resultDiv.innerHTML = '<pre>' + JSON.stringify(jsonData, null, 2) + '</pre>';
            } catch (e) {
                resultDiv.innerHTML = '<div style="color: orange;">⚠️ Respuesta no es JSON válido:</div><pre>' + data + '</pre>';
            }
        })
        .catch(error => {
            console.error("❌ Direct Error:", error);
            resultDiv.innerHTML = '<div style="color: red;">Error: ' + error.message + '</div>';
        });
}
</script>

<style>
#direct-result {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    background: #f9f9f9;
    min-height: 50px;
}
</style> 