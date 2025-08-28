<?php
/**
 * Test Analytics Fixed - Verificar que analytics.php funciona
 * BD: u449034524_moodel_telegra
 */

require_once(__DIR__ . '/../../config.php');
require_login();

global $USER;

header('Content-Type: text/html; charset=utf-8');
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Analytics Fixed</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; color: #155724; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; }
        .info { background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>

<h1>🔧 Test Analytics Fixed</h1>
<p><strong>Usuario:</strong> <?php echo $USER->username; ?> (ID: <?php echo $USER->id; ?>)</p>

<div class="test info">
    <h3>📊 Test AJAX a Analytics.php</h3>
    <div id="result">Cargando...</div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const resultDiv = document.getElementById('result');
    
    // Test AJAX call
    fetch('analytics.php', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.text(); // Primero como texto para ver qué recibimos
    })
    .then(text => {
        console.log('Response text:', text);
        
        try {
            const data = JSON.parse(text);
            resultDiv.innerHTML = `
                <div class="success">
                    <h4>✅ Analytics.php funciona correctamente</h4>
                    <h5>📊 Datos recibidos:</h5>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        } catch (e) {
            resultDiv.innerHTML = `
                <div class="error">
                    <h4>❌ Error: Respuesta no es JSON válido</h4>
                    <p><strong>Texto recibido:</strong></p>
                    <pre>${text}</pre>
                    <p><strong>Error de parsing:</strong> ${e.message}</p>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        resultDiv.innerHTML = `
            <div class="error">
                <h4>❌ Error en la solicitud</h4>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>Verifica que analytics.php no tenga errores PHP.</p>
            </div>
        `;
    });
});
</script>

</body>
</html> 