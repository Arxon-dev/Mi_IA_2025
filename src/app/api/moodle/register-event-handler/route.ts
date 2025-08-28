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
    console.log('🔧 Registrando event handler para quiz attempts');

    const connection = await mysql.createConnection(moodleDbConfig);

    // Verificar handlers existentes
    const [existing] = await connection.execute(`
      SELECT * FROM mdl_events_handlers 
      WHERE component = 'local_telegram_integration'
    `);

    console.log(`📊 Handlers existentes: ${Array.isArray(existing) ? existing.length : 0}`);

    // Limpiar handlers anteriores si existen
    if (Array.isArray(existing) && existing.length > 0) {
      await connection.execute(`
        DELETE FROM mdl_events_handlers 
        WHERE component = 'local_telegram_integration'
      `);
      console.log('🗑️ Handlers anteriores eliminados');
    }

    // Registrar el nuevo handler
    const result = await connection.execute(`
      INSERT INTO mdl_events_handlers (
        eventname, 
        component, 
        handlerfile, 
        handlerfunction, 
        schedule, 
        status, 
        internal
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      '\\mod_quiz\\event\\attempt_reviewed',
      'local_telegram_integration',
      '/local/telegram_integration/classes/observer.php',
      'local_telegram_integration\\observer::quiz_attempt_reviewed',
      'instant',
      1,
      1
    ]);

    console.log('✅ Event handler registrado exitosamente');

    // Verificar el registro
    const [verify] = await connection.execute(`
      SELECT * FROM mdl_events_handlers 
      WHERE component = 'local_telegram_integration'
    `);

    // Caché se limpiará automáticamente por Moodle
    console.log('📌 Event handler registrado, Moodle actualizará la caché automáticamente');

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Event handler registrado correctamente',
      handler: {
        eventname: '\\mod_quiz\\event\\attempt_reviewed',
        component: 'local_telegram_integration',
        status: 'activo'
      },
      verification: verify,
      nextSteps: [
        '✅ El observer ahora está activo',
        '🧪 Realiza un quiz para probar',
        '📝 Revisa los logs de Moodle',
        '🔗 Verifica actividades en Telegram'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error registrando event handler:', error);
    return NextResponse.json({
      success: false,
      error: 'Error registrando event handler',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para registrar event handler de quiz attempts',
    description: 'Configura el observer para detectar cuando se completan quiz en Moodle',
    timestamp: new Date().toISOString()
  });
} 