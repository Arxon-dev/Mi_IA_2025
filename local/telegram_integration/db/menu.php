<?php
// Menú para el plugin de Telegram Integration

defined('MOODLE_INTERNAL') || die();

// Página principal de analytics para usuarios
$ADMIN->add('localplugins', new admin_externalpage(
    'myadvancedanalytics',
    '📊 Mi Analytics Avanzado',
    $CFG->wwwroot . '/local/telegram_integration/my-advanced-analytics.php',
    'moodle/site:config'
));

// Rankings globales
$ADMIN->add('localplugins', new admin_externalpage(
    'globalrankings',
    '🏆 Rankings Globales',
    $CFG->wwwroot . '/local/telegram_integration/global-rankings.php',
    'moodle/site:config'
));

// Analytics básico (existente)
$ADMIN->add('localplugins', new admin_externalpage(
    'telegramanalytics',
    '📈 Analytics Básico',
    $CFG->wwwroot . '/local/telegram_integration/analytics.php',
    'moodle/site:config'
));

// Configuración avanzada
$ADMIN->add('localplugins', new admin_externalpage(
    'advancedanalytics',
    '⚙️ Configuración Analytics',
    $CFG->wwwroot . '/local/telegram_integration/setup-advanced-analytics.php',
    'moodle/site:config'
));

// Pruebas del sistema
$ADMIN->add('localplugins', new admin_externalpage(
    'testanalytics',
    '🧪 Pruebas Analytics',
    $CFG->wwwroot . '/local/telegram_integration/test-advanced-analytics.php',
    'moodle/site:config'
));
?> 