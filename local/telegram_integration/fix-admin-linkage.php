<?php
// Detectar automáticamente la ruta de config.php
$configPaths = [
    '../../../../config.php',
    '../../../config.php', 
    '../../config.php',
    '../config.php',
    'config.php'
];

$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once($path);
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    die('Error: No se pudo encontrar config.php. Verifica la estructura de directorios.');
}

require_once('lib.php');

// Verificar si el usuario es administrador
if (!is_siteadmin()) {
    die('Acceso denegado. Solo administradores pueden acceder a esta página.');
}

// Función para obtener usuarios de Telegram desde MySQL
function getTelegramUsersFromMySQL() {
    global $CFG;
    
    try {
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("
            SELECT 
                id,
                telegramuserid,
                telegramid,
                username,
                firstname,
                totalpoints,
                level
            FROM telegramuser 
            ORDER BY totalpoints DESC 
            LIMIT 10
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

// Función para obtener la vinculación actual del administrador
function getAdminLinkage() {
    global $DB;
    
    try {
        $sql = "SELECT * FROM {local_telegram_integration_users} WHERE moodleuserid = 2";
        $record = $DB->get_record_sql($sql);
        return $record;
    } catch (Exception $e) {
        return null;
    }
}

// Función para corregir la vinculación del administrador
function fixAdminLinkage($newTelegramId) {
    global $DB;
    
    try {
        // Actualizar la vinculación del administrador
        $sql = "UPDATE {local_telegram_integration_users} 
                SET telegramuserid = ? 
                WHERE moodleuserid = 2";
        $DB->execute($sql, [$newTelegramId]);
        
        return true;
    } catch (Exception $e) {
        return false;
    }
}

// Procesar formulario
$message = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'fix_carlos':
                // Corregir vinculación a Carlos_esp
                $carlosTelegramId = '118d2830-404f-49e9-9496-c5ab54e6a1c8';
                if (fixAdminLinkage($carlosTelegramId)) {
                    $message = "✅ Vinculación corregida exitosamente. El administrador ahora está vinculado a Carlos_esp.";
                } else {
                    $error = "❌ Error al corregir la vinculación.";
                }
                break;
                
            case 'fix_custom':
                if (isset($_POST['telegram_id']) && !empty($_POST['telegram_id'])) {
                    $telegramId = $_POST['telegram_id'];
                    if (fixAdminLinkage($telegramId)) {
                        $message = "✅ Vinculación corregida exitosamente.";
                    } else {
                        $error = "❌ Error al corregir la vinculación.";
                    }
                } else {
                    $error = "❌ Debes seleccionar un usuario de Telegram.";
                }
                break;
        }
    }
}

// Obtener datos
$adminLinkage = getAdminLinkage();
$telegramUsers = getTelegramUsersFromMySQL();

// Buscar específicamente a Carlos_esp
$carlosUser = null;
foreach ($telegramUsers as $user) {
    if ($user['username'] === 'Carlos_esp' || $user['telegramid'] === '5793286375') {
        $carlosUser = $user;
        break;
    }
}

// Si no está en la lista, buscar directamente en la base de datos
if (!$carlosUser) {
    try {
        $pdo = new PDO(
            "mysql:host={$CFG->dbhost};dbname={$CFG->dbname};charset=utf8mb4",
            $CFG->dbuser,
            $CFG->dbpass
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare("
            SELECT 
                id,
                telegramuserid,
                telegramid,
                username,
                firstname,
                totalpoints,
                level
            FROM telegramuser 
            WHERE username = 'Carlos_esp' OR telegramid = '5793286375'
        ");
        $stmt->execute();
        $carlosUser = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Ignorar error
    }
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>🔧 Corrección de Vinculación del Administrador</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .alert { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-danger { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .alert-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; margin: 5px; }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .user-card { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .form-group { margin: 15px 0; }
        select, input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%; max-width: 300px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Corrección de Vinculación del Administrador</h1>
        
        <?php if ($message): ?>
            <div class="alert alert-success"><?php echo $message; ?></div>
        <?php endif; ?>
        
        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <div class="section">
            <h2>1. Estado Actual</h2>
            <?php if ($adminLinkage): ?>
                <p><strong>📊 Administrador (Moodle ID: 2)</strong> vinculado a: <strong><?php echo $adminLinkage->telegramuserid; ?></strong></p>
                <?php if ($adminLinkage->telegramuserid === '118d2830-404f-49e9-9496-c5ab54e6a1c8'): ?>
                    <p>✅ <strong>CORRECTO</strong> - Ya está vinculado a Carlos_esp</p>
                <?php else: ?>
                    <p>❌ <strong>INCORRECTO</strong> - Necesita corrección</p>
                <?php endif; ?>
            <?php else: ?>
                <p>❌ No se encontró vinculación para el administrador</p>
            <?php endif; ?>
        </div>
        
        <?php if ($carlosUser): ?>
        <div class="section">
            <h2>2. Usuario Carlos_esp Encontrado</h2>
            <div class="user-card">
                <h3>👤 Carlos_esp (Administrador)</h3>
                <p><strong>ID:</strong> <?php echo $carlosUser['id']; ?></p>
                <p><strong>Telegram User ID:</strong> <?php echo $carlosUser['telegramuserid']; ?></p>
                <p><strong>Telegram ID:</strong> <?php echo $carlosUser['telegramid']; ?></p>
                <p><strong>Username:</strong> @<?php echo $carlosUser['username']; ?></p>
                <p><strong>Nombre:</strong> <?php echo $carlosUser['firstname']; ?></p>
                <p><strong>Puntos:</strong> <?php echo number_format($carlosUser['totalpoints']); ?></p>
                <p><strong>Nivel:</strong> <?php echo $carlosUser['level']; ?></p>
                
                <form method="post" style="margin-top: 15px;">
                    <input type="hidden" name="action" value="fix_carlos">
                    <button type="submit" class="btn btn-success">
                        ✅ Vincular Administrador a Carlos_esp
                    </button>
                </form>
            </div>
        </div>
        <?php else: ?>
        <div class="section">
            <h2>2. ⚠️ Usuario Carlos_esp No Encontrado</h2>
            <div class="alert alert-warning">
                <p>No se encontró el usuario Carlos_esp en la base de datos MySQL.</p>
                <p>Esto puede deberse a:</p>
                <ul>
                    <li>El usuario no está registrado en el sistema</li>
                    <li>El username o Telegram ID no coincide</li>
                    <li>Problema de conectividad con la base de datos</li>
                </ul>
            </div>
        </div>
        <?php endif; ?>
        
        <div class="section">
            <h2>3. Usuarios Disponibles para Administrador</h2>
            <p><strong>📊 Top 10 usuarios disponibles:</strong></p>
            
            <?php if (!empty($telegramUsers)): ?>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Telegram User ID</th>
                        <th>Telegram ID</th>
                        <th>Username</th>
                        <th>Nombre</th>
                        <th>Puntos</th>
                        <th>Nivel</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($telegramUsers as $user): ?>
                    <tr>
                        <td><?php echo $user['id']; ?></td>
                        <td><?php echo $user['telegramuserid']; ?></td>
                        <td><?php echo $user['telegramid']; ?></td>
                        <td><?php echo $user['username']; ?></td>
                        <td><?php echo $user['firstname']; ?></td>
                        <td><?php echo number_format($user['totalpoints']); ?></td>
                        <td><?php echo $user['level']; ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <form method="post" style="margin-top: 15px;">
                <div class="form-group">
                    <label for="telegram_id"><strong>Seleccionar nuevo Telegram User ID para el administrador:</strong></label>
                    <select name="telegram_id" id="telegram_id" required>
                        <option value="">-- Seleccionar usuario --</option>
                        <?php foreach ($telegramUsers as $user): ?>
                        <option value="<?php echo $user['telegramuserid']; ?>">
                            <?php echo $user['telegramuserid']; ?> - <?php echo $user['firstname']; ?> (<?php echo $user['username']; ?>) - <?php echo number_format($user['totalpoints']); ?> pts
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <input type="hidden" name="action" value="fix_custom">
                <button type="submit" class="btn btn-primary">🔧 Corregir Vinculación</button>
            </form>
            <?php else: ?>
            <div class="alert alert-danger">
                <p>❌ No se pudieron obtener usuarios de Telegram desde MySQL.</p>
                <p>Verifica la conectividad con la base de datos.</p>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="section">
            <h2>4. Recomendaciones</h2>
            <ul>
                <li>💡 <strong>Opción 1:</strong> Asignar el administrador a un usuario existente (ej: Juanma Prieto, Tete)</li>
                <li>💡 <strong>Opción 2:</strong> Crear un nuevo usuario de Telegram para el administrador</li>
                <li>💡 <strong>Opción 3:</strong> Desvincular y pedir al administrador que se vincule manualmente</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>5. 🔗 Enlaces Útiles</h2>
            <p>
                <a href="../analytics.php" class="btn btn-primary">📊 Página de Analytics</a>
                <a href="verify-tables.php" class="btn btn-warning">🔍 Verificar Tablas</a>
                <a href="fix-other-linkages.php" class="btn btn-warning">🔧 Corregir Otras Vinculaciones</a>
            </p>
        </div>
    </div>
</body>
</html> 