import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { prisma } from '@/lib/prisma';

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
    const body = await request.json();
    const { telegramuserid } = body;

    if (!telegramuserid) {
      return NextResponse.json({
        success: false,
        error: 'telegramuserid requerido'
      }, { status: 400 });
    }

    console.log(`🔧 Corrigiendo username para usuario Telegram: ${telegramuserid}`);

    // 1. Obtener datos correctos de PostgreSQL
    const postgresLinks = await prisma.$queryRaw<any[]>`
      SELECT * FROM "MoodleUserLink" 
      WHERE "telegramuserid" = ${telegramuserid.toString()}
      AND "isActive" = true
      LIMIT 1
    `;
    
    const postgresLink = postgresLinks.length > 0 ? postgresLinks[0] : null;

    if (!postgresLink) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado en PostgreSQL'
      });
    }

    // 2. Obtener username correcto de Telegram
    const telegramUsers = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TelegramUser" 
      WHERE "telegramuserid" = ${telegramuserid.toString()}
      LIMIT 1
    `;
    
    const telegramUser = telegramUsers.length > 0 ? telegramUsers[0] : null;
    const correctUsername = telegramUser?.username || 'unknown';

    console.log(`📋 Datos de PostgreSQL:`, {
      moodleUserId: postgresLink.moodleUserId,
      moodleUsername: postgresLink.moodleUsername,
      correctTelegramUsername: correctUsername
    });

    // 3. Conectar a MySQL y corregir username
    const connection = await mysql.createConnection(moodleDbConfig);

    // Buscar registro en MySQL
    const [mysqlRecords] = await connection.execute(`
      SELECT * FROM mdl_local_telegram_verification 
      WHERE telegram_userid = ? AND moodle_userid = ?
    `, [telegramuserid, postgresLink.moodleUserId]);

    if (!Array.isArray(mysqlRecords) || mysqlRecords.length === 0) {
      await connection.end();
      return NextResponse.json({
        success: false,
        error: 'No se encontró registro en MySQL para corregir'
      });
    }

    const mysqlRecord = mysqlRecords[0] as any;
    console.log(`📊 Registro MySQL actual:`, {
      id: mysqlRecord.id,
      moodle_userid: mysqlRecord.moodle_userid,
      telegram_userid: mysqlRecord.telegram_userid,
      telegram_username: mysqlRecord.telegram_username
    });

    // 4. Actualizar username en MySQL
    const result = await connection.execute(`
      UPDATE mdl_local_telegram_verification 
      SET telegram_username = ? 
      WHERE telegram_userid = ? AND moodle_userid = ?
    `, [correctUsername, telegramuserid, postgresLink.moodleUserId]);

    // 5. Verificar la actualización
    const [updatedRecords] = await connection.execute(`
      SELECT * FROM mdl_local_telegram_verification 
      WHERE telegram_userid = ? AND moodle_userid = ?
    `, [telegramuserid, postgresLink.moodleUserId]);

    await connection.end();

    console.log('✅ Username corregido en MySQL');

    return NextResponse.json({
      success: true,
      message: 'Username corregido exitosamente',
      before: {
        telegramUsername: mysqlRecord.telegram_username,
        moodleUserId: mysqlRecord.moodle_userid
      },
      after: {
        telegramUsername: correctUsername,
        moodleUserId: postgresLink.moodleUserId
      },
      verification: updatedRecords,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error corrigiendo username:', error);
    return NextResponse.json({
      success: false,
      error: 'Error corrigiendo username',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para corregir username incorrecto en MySQL',
    description: 'Sincroniza el username de Telegram entre PostgreSQL y MySQL',
    usage: {
      method: 'POST',
      body: {
        telegramuserid: 'ID del usuario de Telegram'
      }
    },
    timestamp: new Date().toISOString()
  });
} 