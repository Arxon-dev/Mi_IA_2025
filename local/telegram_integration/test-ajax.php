<?php
// Simple test for AJAX functionality
require_once(__DIR__ . '/../../config.php');

// Check if user is logged in
require_login();

echo "<h2>🧪 Test AJAX Analytics</h2>";

// Test 1: Manual AJAX call
echo "<h3>1. Test Manual</h3>";
echo "<button onclick='testAjax()'>Test AJAX Call</button>";
echo "<div id='ajax-result'></div>";

// Test 2: Check user verification
echo "<h3>2. Verificación de Usuario</h3>";
global $USER, $DB;
echo "Usuario: {$USER->firstname} {$USER->lastname} (ID: {$USER->id})<br>";

$verification = $DB->get_record('local_telegram_verification', [
    'moodle_userid' => $USER->id,
    'is_verified' => 1
]);

if ($verification) {
    echo "✅ Usuario verificado con Telegram<br>";
    echo "📱 Telegram ID: {$verification->telegram_userid}<br>";
} else {
    echo "❌ Usuario NO verificado<br>";
}

// Test 3: Direct PHP call
echo "<h3>3. Test Directo PHP</h3>";
if ($verification) {
    require_once 'analytics.php';
    
    echo "Probando get_predictive_analysis_data...<br>";
    $result = get_predictive_analysis_data($USER->id);
    echo "<pre>" . json_encode($result, JSON_PRETTY_PRINT) . "</pre>";
} else {
    echo "Necesita verificación de Telegram para probar<br>";
}

?>

<script>
function testAjax() {
    const resultDiv = document.getElementById('ajax-result');
    resultDiv.innerHTML = 'Cargando...';

    // Obtener el userId desde PHP (ya está en el template)
    const userId = <?php echo $USER->id; ?>;

    // Construir la URL correctamente
    const url = `/local/telegram_integration/analytics.php?action=get_predictive_data&format=json&userid=${userId}`;
    
    // Debug: mostrar la URL que se va a llamar
    console.log("🔍 DEBUG AJAX:");
    console.log("URL:", url);
    console.log("UserID:", userId);
    
    fetch(url)
        .then(response => {
            console.log("📡 Response status:", response.status);
            console.log("📡 Response headers:", response.headers);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // Cambiar a text() para ver la respuesta completa
        })
        .then(data => {
            console.log("📄 Raw response:", data);
            
            try {
                const jsonData = JSON.parse(data);
                resultDiv.innerHTML = '<pre>' + JSON.stringify(jsonData, null, 2) + '</pre>';
            } catch (e) {
                resultDiv.innerHTML = '<div style="color: orange;">⚠️ Respuesta no es JSON válido:</div><pre>' + data + '</pre>';
            }
        })
        .catch(error => {
            console.error("❌ Error:", error);
            resultDiv.innerHTML = '<div style="color: red;">Error: ' + error.message + '</div>';
        });
}
</script>

<style>
#ajax-result {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    background: #f9f9f9;
    min-height: 50px;
}
</style> 