<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Telegram Integration verification page.
 *
 * @package     local_telegram_integration
 * @copyright   2025 OpoMelilla
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/adminlib.php');
require_once(__DIR__ . '/lib.php');

// Check if user is logged in
require_login();

$context = context_system::instance();

// Set up the page
$PAGE->set_context($context);
$PAGE->set_url('/local/telegram_integration/verify.php');
$PAGE->set_title('Vinculación con Telegram - OpoMelilla');
$PAGE->set_heading('Vinculación con Telegram - OpoMelilla');
$PAGE->set_pagelayout('standard');

// Handle form submissions
$action = optional_param('action', '', PARAM_ALPHA);
$code = optional_param('code', '', PARAM_TEXT);

// Initialize variables
$success_message = '';
$error_message = '';
$verification_code = '';

// Check current verification status
$verification_status = local_telegram_integration_get_verification_status($USER->id);

if ($action === 'generate' && confirm_sesskey()) {
    // Generate new verification code - MANTENER FUNCIÓN ORIGINAL
    $verification_code = local_telegram_integration_create_verification_code($USER->id);
    if ($verification_code) {
        $success_message = '✅ Código de verificación generado correctamente';
    } else {
        $error_message = '❌ Error al generar el código de verificación';
    }
} else if ($action === 'verify' && confirm_sesskey()) {
    // Manual verification (for testing)
    if (!empty($code)) {
        $telegram_data = [
            'telegram_userid' => '12345', // This would come from actual Telegram data
            'username' => 'test_user'
        ];
        
        if (local_telegram_integration_verify_code($code, $telegram_data)) {
            $success_message = '✅ Código verificado correctamente';
            $verification_status = local_telegram_integration_get_verification_status($USER->id);
        } else {
            $error_message = '❌ Código inválido o expirado';
        }
    }
}

// Start output
echo $OUTPUT->header();
?>

<style>
.telegram-verify-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px;
    border-radius: 15px;
    text-align: center;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.hero-section h1 {
    margin: 0 0 15px 0;
    font-size: 2.5em;
    font-weight: 300;
}

.hero-section .subtitle {
    font-size: 1.2em;
    opacity: 0.9;
    margin: 0;
}

.status-card {
    background: white;
    border-radius: 12px;
    padding: 30px;
    margin: 20px 0;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    border-left: 5px solid #28a745;
}

.status-card.warning {
    border-left-color: #ffc107;
    background: #fff8e1;
}

.status-card.success {
    border-left-color: #28a745;
    background: #f1f8e9;
}

.verification-steps {
    background: white;
    border-radius: 12px;
    padding: 30px;
    margin: 20px 0;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.step-item {
    display: flex;
    align-items: flex-start;
    margin: 20px 0;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #007bff;
}

.step-number {
    background: #007bff;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 15px;
    flex-shrink: 0;
}

.step-content {
    flex: 1;
}

.step-content h4 {
    margin: 0 0 8px 0;
    color: #333;
}

.step-content p {
    margin: 0;
    color: #666;
    line-height: 1.5;
}

.code-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 12px;
    text-align: center;
    margin: 20px 0;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
}

.code-display:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.code-value {
    font-size: 3em;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    letter-spacing: 8px;
    margin: 10px 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.code-instructions {
    font-size: 0.9em;
    opacity: 0.9;
    margin-top: 15px;
}

.action-buttons {
    text-align: center;
    margin: 30px 0;
}

.btn-modern {
    display: inline-block;
    padding: 15px 30px;
    margin: 10px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.btn-primary {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,123,255,0.3);
    color: white;
    text-decoration: none;
}

.btn-secondary {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    color: white;
}

.btn-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(108,117,125,0.3);
    color: white;
    text-decoration: none;
}

.benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin: 30px 0;
}

.benefit-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    transition: transform 0.3s ease;
}

.benefit-card:hover {
    transform: translateY(-5px);
}

.benefit-icon {
    font-size: 3em;
    margin-bottom: 15px;
}

.benefit-title {
    font-size: 1.2em;
    font-weight: 600;
    margin-bottom: 10px;
    color: #333;
}

.benefit-description {
    color: #666;
    line-height: 1.5;
}

.qr-section {
    background: white;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    margin: 20px 0;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.alert-modern {
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    border-left: 4px solid;
}

.alert-success {
    background: #d4edda;
    border-left-color: #28a745;
    color: #155724;
}

.alert-error {
    background: #f8d7da;
    border-left-color: #dc3545;
    color: #721c24;
}

.user-info {
    background: #e3f2fd;
    border-radius: 8px;
    padding: 15px;
    margin: 15px 0;
    border-left: 4px solid #2196f3;
}

@media (max-width: 768px) {
    .hero-section {
        padding: 30px 20px;
    }
    
    .hero-section h1 {
        font-size: 2em;
    }
    
    .code-value {
        font-size: 2em;
        letter-spacing: 4px;
    }
    
    .benefits-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<div class="telegram-verify-container">
    <!-- Hero Section -->
    <div class="hero-section">
        <h1>🔗 Vinculación con Telegram</h1>
        <p class="subtitle">Conecta tu cuenta de Moodle con el Bot de Telegram de OpoMelilla</p>
    </div>

    <!-- Display messages -->
    <?php if (!empty($success_message)): ?>
    <div class="alert-modern alert-success">
        <?= $success_message ?>
    </div>
    <?php endif; ?>
    
    <?php if (!empty($error_message)): ?>
    <div class="alert-modern alert-error">
        <?= $error_message ?>
    </div>
    <?php endif; ?>

    <?php if ($verification_status): ?>
    <!-- User is already verified -->
    <div class="status-card success">
        <h3>✅ ¡Cuenta vinculada!</h3>
        <div class="user-info">
            <p><strong>📅 Fecha de vinculación:</strong> <?= userdate($verification_status->verified_at, '%d/%m/%Y a las %H:%M') ?></p>
            <?php if (!empty($verification_status->telegram_username)): ?>
            <p><strong>👤 Usuario de Telegram:</strong> @<?= htmlspecialchars($verification_status->telegram_username) ?></p>
            <?php endif; ?>
            <p><strong>🆔 ID de Telegram:</strong> <?= htmlspecialchars($verification_status->telegram_userid) ?></p>
            <p><strong>🔄 Estado:</strong> Sincronización activa</p>
        </div>
        
        <div class="action-buttons">
            <a href="my-advanced-analytics.php" class="btn-modern btn-primary">
                📊 Ver Análisis de Rendimiento
            </a>
        </div>
    </div>
    
    <?php else: ?>
    <!-- User is not verified - show verification process -->
    <div class="status-card warning">
        <h3>⚠️ Cuenta No Vinculada</h3>
        <p>Para acceder a todas las funcionalidades del bot de Telegram, necesitas vincular tu cuenta.</p>
    </div>

    <!-- Instructions Section -->
    <div class="verification-steps">
        <h3>📋 Pasos para Vincular tu Cuenta</h3>
        
        <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
                <h4>Genera tu Código de Verificación</h4>
                <p>Haz clic en el botón "Generar Código" para crear un código único de 6 dígitos.</p>
            </div>
        </div>
        
        <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
                <h4>Accede a Telegram</h4>
                <p>Abre Telegram en tu dispositivo móvil o usa <a href="https://web.telegram.org/a/" target="_blank">Telegram Web</a>.</p>
            </div>
        </div>
        
        <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
                <h4>Busca el Bot de OpoMelilla</h4>
                <p>Busca <strong>@OpoMelillaBot</strong> o escanea el código QR que aparece más abajo.</p>
            </div>
        </div>
        
        <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-content">
                <h4>Envía el Comando de Vinculación</h4>
                <p>Escribe: <code>/codigo_moodle TU_CODIGO_AQUI</code> reemplazando "TU_CODIGO_AQUI" por el código generado.</p>
            </div>
        </div>
    </div>

    <!-- Code Generation Section -->
    <?php if (!empty($verification_code)): ?>
    <div class="code-display" onclick="copyCode()" title="Haz clic para copiar">
        <h4>🔑 Tu Código de Verificación</h4>
        <div class="code-value" id="verification-code"><?= $verification_code ?></div>
        <div class="code-instructions">
            📋 Haz clic para copiar • ⏰ Válido por 15 minutos
        </div>
    </div>
    <?php endif; ?>

    <!-- Generate Code Form -->
    <div class="action-buttons">
        <form method="POST" action="<?= $PAGE->url->out() ?>" style="display: inline;">
            <input type="hidden" name="sesskey" value="<?= sesskey() ?>">
            <input type="hidden" name="action" value="generate">
            <button type="submit" class="btn-modern btn-primary">
                🔄 <?= !empty($verification_code) ? 'Generar Nuevo Código' : 'Generar Código de Verificación' ?>
            </button>
        </form>
        
        <a href="https://web.telegram.org/a/" target="_blank" class="btn-modern btn-secondary">
            🌐 Abrir Telegram Web
        </a>
    </div>

    <!-- QR Code Section -->
    <div class="qr-section">
        <h4>📱 Código QR para encontrar el Bot</h4>
        <div style="display: flex; justify-content: center; align-items: center; margin: 20px 0;">
            <img src="https://i.gyazo.com/c120ca4d38b3c390d75b2c3ee5c189df.png" 
                 alt="QR Code para @OpoMelillaBot" 
                 style="border: 2px solid #dee2e6; border-radius: 8px; max-width: 200px; height: auto;">
        </div>
        <p style="color: #6c757d; margin: 0;">Escanea este código con tu cámara para encontrar rápidamente el bot</p>
    </div>
    <?php endif; ?>

    <!-- Benefits Section -->
    <div class="benefits-grid">
        <div class="benefit-card">
            <div class="benefit-icon">📊</div>
            <div class="benefit-title">Análisis Detallado</div>
            <div class="benefit-description">Accede a estadísticas avanzadas de tu progreso y rendimiento</div>
        </div>
        
        <div class="benefit-card">
            <div class="benefit-icon">🎯</div>
            <div class="benefit-title">Recomendaciones IA</div>
            <div class="benefit-description">Recibe sugerencias personalizadas para mejorar tu estudio</div>
        </div>
        
        <div class="benefit-card">
            <div class="benefit-icon">🏆</div>
            <div class="benefit-title">Sistema de Logros</div>
            <div class="benefit-description">Desbloquea logros y compite en rankings globales</div>
        </div>
        
        <div class="benefit-card">
            <div class="benefit-icon">📱</div>
            <div class="benefit-title">Notificaciones</div>
            <div class="benefit-description">Recibe recordatorios y actualizaciones directamente en Telegram</div>
        </div>
    </div>

    <!-- User Info -->
    <div class="user-info">
        <p><strong>👤 Tu ID de Moodle:</strong> <?= $USER->id ?></p>
        <p><strong>📧 Email:</strong> <?= $USER->email ?></p>
    </div>
</div>

<script>
function copyCode() {
    const codeElement = document.getElementById('verification-code');
    const code = codeElement.textContent;
    
    navigator.clipboard.writeText(code).then(function() {
        // Show feedback
        const originalText = codeElement.textContent;
        const originalBg = codeElement.parentElement.style.background;
        
        codeElement.textContent = '✅ ¡Copiado!';
        codeElement.parentElement.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        setTimeout(function() {
            codeElement.textContent = originalText;
            codeElement.parentElement.style.background = originalBg;
        }, 2000);
    }).catch(function() {
        // Fallback for older browsers
        alert('Código: ' + code + '\n\nCopia este código manualmente.');
    });
}

// Auto-refresh verification status every 10 seconds
setInterval(function() {
    // Only check if we're on the unverified state
    if (!<?= $verification_status ? 'true' : 'false' ?>) {
        fetch(window.location.href + '?check_status=1')
            .then(response => response.json())
            .then(data => {
                if (data.verified) {
                    location.reload();
                }
            })
            .catch(() => {});
    }
}, 10000);
</script>

<?php
echo $OUTPUT->footer();
?>