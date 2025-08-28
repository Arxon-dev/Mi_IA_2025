<?php
// Bloque de navegación para Analytics de Telegram
// Este archivo se puede incluir en el dashboard de Moodle

defined('MOODLE_INTERNAL') || die();

// Verificar si el usuario tiene cuenta vinculada
global $USER, $DB;
$link = $DB->get_record('local_telegram_user_link', ['moodleuserid' => $USER->id]);

if ($link) {
    echo '<div class="telegram-analytics-nav" style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
    echo '<h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">📊 Analytics de Telegram</h3>';
    echo '<p style="color: #666; margin-bottom: 15px;">Accede a tus estadísticas y progreso personalizado.</p>';
    
    echo '<div style="display: grid; gap: 10px;">';
    echo '<a href="' . $CFG->wwwroot . '/local/telegram_integration/my-advanced-analytics.php" style="display: block; padding: 12px 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; text-align: center; font-weight: bold;">📈 Mi Analytics Avanzado</a>';
    echo '<a href="' . $CFG->wwwroot . '/local/telegram_integration/global-rankings.php" style="display: block; padding: 12px 15px; background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #333; text-decoration: none; border-radius: 5px; text-align: center; font-weight: bold;">🏆 Rankings Globales</a>';
    echo '</div>';
    
    echo '<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.9em; color: #666;">';
    echo '<p style="margin: 0;">💡 <strong>Consejo:</strong> Usa el bot de Telegram para practicar y ver tus estadísticas en tiempo real.</p>';
    echo '</div>';
    
    echo '</div>';
} else {
    echo '<div class="telegram-analytics-nav" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; margin: 20px 0;">';
    echo '<h3 style="margin-top: 0; color: #856404;">🔗 Vincula tu cuenta de Telegram</h3>';
    echo '<p style="color: #856404; margin-bottom: 15px;">Para acceder a analytics avanzados, vincula tu cuenta de Telegram.</p>';
    echo '<p style="color: #856404; font-size: 0.9em;">Ve a tu perfil de Moodle → Preferencias → Integración Telegram → Generar código y usa <code>/codigo_moodle</code> en el bot de Telegram.</p>';
    echo '</div>';
}
?>