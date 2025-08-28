<?php
/**
 * Ultra simple test - just check if parameters arrive
 */
require_once(__DIR__ . '/../../config.php');

// Check if user is logged in
require_login();

// Always log what arrives
error_log("🔍 ULTRA SIMPLE DEBUG:");
error_log("GET params: " . print_r($_GET, true));
error_log("REQUEST params: " . print_r($_REQUEST, true));
error_log("POST params: " . print_r($_POST, true));

// Handle any AJAX request
if (isset($_GET['action'])) {
    header('Content-Type: application/json');
    
    $response = [
        'status' => 'success',
        'message' => 'Parameters received',
        'action' => $_GET['action'],
        'action_length' => strlen($_GET['action']),
        'action_bytes' => bin2hex($_GET['action']),
        'all_params' => $_GET,
        'user_id' => $USER->id
    ];
    
    echo json_encode($response);
    exit;
}

// Display test page
echo "<h2>🧪 Ultra Simple Test</h2>";
echo "<h3>Test Ultra Simple AJAX</h3>";
echo "<button onclick='testUltraSimple()'>Test Ultra Simple</button>";
echo "<div id='ultra-result'></div>";

?>

<script>
function testUltraSimple() {
    const resultDiv = document.getElementById('ultra-result');
    resultDiv.innerHTML = 'Cargando...';

    const url = `/local/telegram_integration/test-ultra-simple.php?action=get_predictive_data&format=json&userid=<?php echo $USER->id; ?>`;
    
    console.log("🔍 Ultra Simple URL:", url);
    
    fetch(url)
        .then(response => {
            console.log("📡 Ultra Simple Response status:", response.status);
            return response.text();
        })
        .then(data => {
            console.log("📄 Ultra Simple Raw response:", data);
            
            try {
                const jsonData = JSON.parse(data);
                resultDiv.innerHTML = '<pre>' + JSON.stringify(jsonData, null, 2) + '</pre>';
            } catch (e) {
                resultDiv.innerHTML = '<div style="color: orange;">⚠️ Respuesta no es JSON válido:</div><pre>' + data + '</pre>';
            }
        })
        .catch(error => {
            console.error("❌ Ultra Simple Error:", error);
            resultDiv.innerHTML = '<div style="color: red;">Error: ' + error.message + '</div>';
        });
}
</script>

<style>
#ultra-result {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    background: #f9f9f9;
    min-height: 50px;
}
</style> 