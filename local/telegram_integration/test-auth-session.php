<?php
// Test authentication and session status
require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

echo "<h1>🔍 Test de Autenticación y Sesión</h1>";

// 1. Check if user is logged in
echo "<h2>1. Estado de Autenticación</h2>";
echo "isloggedin(): " . (isloggedin() ? "✅ SÍ" : "❌ NO") . "<br>";
echo "isguestuser(): " . (isguestuser() ? "❌ ES INVITADO" : "✅ NO ES INVITADO") . "<br>";

if (isloggedin() && !isguestuser()) {
    echo "<h2>2. Información del Usuario</h2>";
    echo "User ID: " . $USER->id . "<br>";
    echo "Username: " . $USER->username . "<br>";
    echo "Email: " . $USER->email . "<br>";
    echo "Firstname: " . $USER->firstname . "<br>";
    echo "Lastname: " . $USER->lastname . "<br>";
    
    // 3. Check Telegram connection
    echo "<h2>3. Conexión con Telegram</h2>";
    $telegram_user_id = get_telegram_user_id($USER->id);
    echo "Telegram User ID: " . ($telegram_user_id ?: "❌ NO ENCONTRADO") . "<br>";
    
    if ($telegram_user_id) {
        // 4. Test database connection
        echo "<h2>4. Test de Base de Datos</h2>";
        try {
            require_once(__DIR__ . '/db-config.php');
            $pdo = createDatabaseConnection();
            echo "✅ Conexión a base de datos exitosa<br>";
            
            // Check if user has data
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM telegramresponse WHERE userid = ?");
            $stmt->execute([$telegram_user_id]);
            $result = $stmt->fetch();
            echo "Respuestas en BD: " . $result['count'] . "<br>";
            
        } catch (Exception $e) {
            echo "❌ Error de conexión: " . $e->getMessage() . "<br>";
        }
        
        // 5. Test predictive data function
        echo "<h2>5. Test de Función Predictiva</h2>";
        try {
            require_once(__DIR__ . '/direct-ml-bridge-mysql.php');
            $pdo = createDatabaseConnection();
            $predictive_data = getPredictiveData($pdo, $telegram_user_id);
            echo "Datos predictivos: <pre>" . print_r($predictive_data, true) . "</pre>";
        } catch (Exception $e) {
            echo "❌ Error en función predictiva: " . $e->getMessage() . "<br>";
        }
    }
} else {
    echo "<h2>❌ Usuario no autenticado</h2>";
    echo "Debes iniciar sesión en Moodle para ver los datos.<br>";
    echo '<a href="' . $CFG->wwwroot . '/login/index.php">Iniciar Sesión</a><br>';
}

// 6. Check session info
echo "<h2>6. Información de Sesión</h2>";
echo "Session ID: " . session_id() . "<br>";
echo "Session status: " . session_status() . "<br>";

// 7. Check cookies
echo "<h2>7. Cookies</h2>";
echo "Cookies disponibles: <pre>" . print_r($_COOKIE, true) . "</pre>";
?> 