<?php
/**
 * Simple AJAX test without Moodle optional_param
 */
require_once(__DIR__ . '/../../config.php');

// Check if user is logged in
require_login();

echo "<h2>🧪 Test Simple AJAX</h2>";

// Handle AJAX request
if (isset($_GET['action']) && $_GET['action'] === 'test_simple') {
    header('Content-Type: application/json');
    
    $response = [
        'status' => 'success',
        'message' => 'Simple AJAX working',
        'user_id' => $USER->id,
        'action' => $_GET['action'],
        'all_params' => $_GET
    ];
    
    echo json_encode($response);
    exit;
}

// Display test page
echo "<h3>Test Simple AJAX</h3>";
echo "<button onclick='testSimpleAjax()'>Test Simple AJAX</button>";
echo "<div id='simple-result'></div>";

?>

<script>
function testSimpleAjax() {
    const resultDiv = document.getElementById('simple-result');
    resultDiv.innerHTML = 'Cargando...';

    const url = `/local/telegram_integration/test-simple-ajax.php?action=test_simple&format=json&userid=<?php echo $USER->id; ?>`;
    
    console.log("🔍 Simple AJAX URL:", url);
    
    fetch(url)
        .then(response => {
            console.log("📡 Simple Response status:", response.status);
            return response.text();
        })
        .then(data => {
            console.log("📄 Simple Raw response:", data);
            
            try {
                const jsonData = JSON.parse(data);
                resultDiv.innerHTML = '<pre>' + JSON.stringify(jsonData, null, 2) + '</pre>';
            } catch (e) {
                resultDiv.innerHTML = '<div style="color: orange;">⚠️ Respuesta no es JSON válido:</div><pre>' + data + '</pre>';
            }
        })
        .catch(error => {
            console.error("❌ Simple Error:", error);
            resultDiv.innerHTML = '<div style="color: red;">Error: ' + error.message + '</div>';
        });
}
</script>

<style>
#simple-result {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    background: #f9f9f9;
    min-height: 50px;
}
</style> 