<?php
// Script de prueba para verificar la vinculación del administrador
require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/local/telegram_integration/db-config.php');

echo "<h1>🔧 Prueba de Vinculación del Administrador</h1>";

try {
    global $DB;
    $pdo = createDatabaseConnection();
    
    // 1. Verificar vinculación actual
    echo "<h2>1. Vinculación Actual</h2>";
    
    // Buscar en moodleuserlink
    $stmt = $pdo->prepare("SELECT * FROM moodleuserlink WHERE moodleuserid = 2 AND isactive = 1");
    $stmt->execute();
    $link = $stmt->fetch();
    
    if ($link) {
        echo "✅ Vinculación encontrada:<br>";
        echo "- Moodle ID: {$link['moodleuserid']}<br>";
        echo "- Telegram ID: {$link['telegramuserid']}<br>";
        echo "- Usuario Moodle: {$link['moodleusername']}<br>";
        echo "- Nombre completo: {$link['moodlefullname']}<br>";
        
        // Verificar si existe en telegramuser
        $stmt = $pdo->prepare("SELECT * FROM telegramuser WHERE telegramuserid = ?");
        $stmt->execute([$link['telegramuserid']]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo "✅ Usuario existe en telegramuser:<br>";
            echo "- Nombre: {$user['firstname']} {$user['lastname']}<br>";
            echo "- Username: {$user['username']}<br>";
            echo "- Puntos: {$user['totalpoints']}<br>";
            echo "- Nivel: {$user['level']}<br>";
            
            // Contar respuestas
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM telegramresponse WHERE userid = ?");
            $stmt->execute([$user['id']]);
            $responses = $stmt->fetch()['count'];
            echo "- Respuestas: $responses<br>";
            
        } else {
            echo "❌ Usuario NO existe en telegramuser<br>";
        }
    } else {
        echo "❌ No hay vinculación activa para el administrador<br>";
    }
    
    // 2. Mostrar opciones de corrección
    echo "<h2>2. Opciones de Corrección</h2>";
    
    $stmt = $pdo->query("
        SELECT 
            telegramuserid,
            username,
            firstname,
            lastname,
            totalpoints,
            level,
            COUNT(r.id) as total_responses
        FROM telegramuser u
        LEFT JOIN telegramresponse r ON u.id = r.userid
        GROUP BY u.id
        ORDER BY u.totalpoints DESC
        LIMIT 5
    ");
    
    $users = $stmt->fetchAll();
    
    echo "📊 Top 5 usuarios disponibles:<br>";
    echo "<table border='1' style='margin: 10px 0;'>";
    echo "<tr><th>Telegram ID</th><th>Username</th><th>Nombre</th><th>Puntos</th><th>Nivel</th><th>Respuestas</th></tr>";
    
    foreach ($users as $user) {
        echo "<tr>";
        echo "<td>{$user['telegramuserid']}</td>";
        echo "<td>{$user['username']}</td>";
        echo "<td>{$user['firstname']} {$user['lastname']}</td>";
        echo "<td>{$user['totalpoints']}</td>";
        echo "<td>{$user['level']}</td>";
        echo "<td>{$user['total_responses']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // 3. Proceso de corrección
    echo "<h2>3. Corregir Vinculación</h2>";
    
    if (isset($_POST['fix_admin'])) {
        $new_telegram_id = $_POST['new_telegram_id'];
        
        try {
            // Actualizar la vinculación
            $stmt = $pdo->prepare("UPDATE moodleuserlink SET telegramuserid = ? WHERE moodleuserid = 2 AND isactive = 1");
            $stmt->execute([$new_telegram_id]);
            
            echo "✅ <strong>Vinculación corregida exitosamente</strong><br>";
            echo "- Moodle ID: 2 (Administrador)<br>";
            echo "- Nuevo Telegram ID: $new_telegram_id<br>";
            
            // Verificar que existe en MySQL
            $stmt = $pdo->prepare("SELECT * FROM telegramuser WHERE telegramuserid = ?");
            $stmt->execute([$new_telegram_id]);
            $new_user = $stmt->fetch();
            
            if ($new_user) {
                echo "✅ Usuario encontrado: <strong>{$new_user['firstname']} {$new_user['lastname']}</strong><br>";
                echo "📊 Puntos: {$new_user['totalpoints']}<br>";
                echo "📈 Nivel: {$new_user['level']}<br>";
            }
            
            echo "<br>🔄 <strong>Próximo paso:</strong> Recarga la página de analytics.php para ver los datos actualizados.<br>";
            
        } catch (Exception $e) {
            echo "❌ Error corrigiendo vinculación: " . $e->getMessage() . "<br>";
        }
    }
    
    // 4. Formulario de corrección
    echo "<h3>Seleccionar nuevo Telegram ID para el administrador:</h3>";
    echo "<form method='post'>";
    echo "<select name='new_telegram_id' required>";
    echo "<option value=''>-- Seleccionar usuario --</option>";
    
    foreach ($users as $user) {
        $selected = ($link && $link['telegramuserid'] == $user['telegramuserid']) ? 'selected' : '';
        echo "<option value='{$user['telegramuserid']}' $selected>";
        echo "{$user['telegramuserid']} - {$user['firstname']} {$user['lastname']} ({$user['username']}) - {$user['totalpoints']} pts";
        echo "</option>";
    }
    
    echo "</select><br><br>";
    echo "<input type='submit' name='fix_admin' value='Corregir Vinculación del Administrador'>";
    echo "</form>";
    
    // 5. Recomendaciones
    echo "<h2>4. Recomendaciones</h2>";
    echo "<ul>";
    echo "<li>💡 <strong>Opción 1:</strong> Asignar el administrador a un usuario existente (ej: Juanma Prieto, Tete)</li>";
    echo "<li>💡 <strong>Opción 2:</strong> Crear un nuevo usuario de Telegram para el administrador</li>";
    echo "<li>💡 <strong>Opción 3:</strong> Desvincular y pedir al administrador que se vincule manualmente</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}
?> 