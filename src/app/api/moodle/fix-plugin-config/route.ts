import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Configuración de la base de datos MySQL
const moodleDbConfig = {
  host: process.env.MOODLE_DB_HOST || '145.223.38.91',
  user: process.env.MOODLE_DB_USER || 'u449034524_Roqxm',
  password: process.env.MOODLE_DB_PASSWORD || 'Sirius//03072503//',
  database: process.env.MOODLE_DB_NAME || 'u449034524_wNjTt',
  connectTimeout: 10000,
  acquireTimeout: 10000,
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Configurando event handlers del plugin Telegram Integration');

    // Conectar a MySQL
    const connection = await mysql.createConnection(moodleDbConfig);

    // Limpiar configuración anterior
    await connection.execute(`
      DELETE FROM mdl_events_handlers 
      WHERE component = 'local_telegram_integration'
    `);

    console.log('🗑️ Event handlers anteriores eliminados');

    // Registrar el event handler para quiz attempts
    const insertHandler = `
      INSERT INTO mdl_events_handlers (
        eventname, 
        component, 
        handlerfile, 
        handlerfunction, 
        schedule, 
        status, 
        internal
      ) VALUES (
        '\\\\mod_quiz\\\\event\\\\attempt_reviewed',
        'local_telegram_integration',
        '/local/telegram_integration/classes/observer.php',
        'local_telegram_integration\\\\observer::quiz_attempt_reviewed',
        'instant',
        1,
        1
      )
    `;

    await connection.execute(insertHandler);
    console.log('✅ Event handler para quiz attempts registrado');

    // Verificar que se registró correctamente
    const [verifyRows] = await connection.execute(`
      SELECT * FROM mdl_events_handlers 
      WHERE component = 'local_telegram_integration'
    `);

    // Actualizar configuración del plugin con campos correctos
    const configs = [
      {
        name: 'api_endpoint_url',
        value: 'https://3c73-79-147-3-133.ngrok-free.app/api/moodle/verify-code'
      },
      {
        name: 'quiz_webhook_url', 
        value: 'https://3c73-79-147-3-133.ngrok-free.app/api/moodle/quiz-webhook'
      }
    ];

    for (const config of configs) {
      // Verificar si ya existe
      const [existing] = await connection.execute(`
        SELECT * FROM mdl_config_plugins 
        WHERE plugin = 'local_telegram_integration' AND name = ?
      `, [config.name]);

      if (Array.isArray(existing) && existing.length > 0) {
        // Actualizar
        await connection.execute(`
          UPDATE mdl_config_plugins 
          SET value = ? 
          WHERE plugin = 'local_telegram_integration' AND name = ?
        `, [config.value, config.name]);
        console.log(`🔄 Configuración actualizada: ${config.name}`);
      } else {
        // Insertar
        await connection.execute(`
          INSERT INTO mdl_config_plugins (plugin, name, value) 
          VALUES ('local_telegram_integration', ?, ?)
        `, [config.name, config.value]);
        console.log(`➕ Configuración añadida: ${config.name}`);
      }
    }

    // Forzar recarga de la caché de eventos en Moodle
    await connection.execute(`
      DELETE FROM mdl_cache_text 
      WHERE keyhash = MD5('events_handlers') 
      OR keyhash LIKE '%events%'
    `);

    console.log('🔄 Caché de eventos limpiada');

    await connection.end();

    const handlers = Array.isArray(verifyRows) ? verifyRows : [];

    return NextResponse.json({
      success: true,
      message: 'Plugin configurado correctamente',
      handlersRegistered: handlers.length,
      handlers: handlers,
      configsUpdated: configs.map(c => c.name),
      nextSteps: [
        'El observer ahora debería detectar quiz attempts',
        'Prueba realizando un nuevo quiz',
        'Los logs aparecerán en el error log de Moodle',
        'Las actividades se registrarán automáticamente'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error configurando plugin:', error);
    return NextResponse.json({
      success: false,
      error: 'Error configurando event handlers del plugin',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para configurar event handlers del plugin Telegram Integration',
    description: 'Registra los observers necesarios para detectar quiz attempts',
    warning: 'Este endpoint modifica la configuración de Moodle directamente',
    timestamp: new Date().toISOString()
  });
} 