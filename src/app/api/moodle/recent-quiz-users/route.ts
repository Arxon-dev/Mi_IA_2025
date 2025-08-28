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
    const body = await request.json();
    const { hours = 2 } = body;

    console.log(`🔍 Buscando usuarios con quiz en las últimas ${hours} horas`);

    // Conectar a MySQL
    const connection = await mysql.createConnection(moodleDbConfig);

    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.firstname,
        u.lastname,
        COUNT(qa.id) as total_attempts,
        MAX(qa.timemodified) as last_attempt,
        FROM_UNIXTIME(MAX(qa.timemodified)) as last_attempt_formatted,
        MIN(qa.timemodified) as first_attempt,
        FROM_UNIXTIME(MIN(qa.timemodified)) as first_attempt_formatted
      FROM mdl_user u
      JOIN mdl_quiz_attempts qa ON u.id = qa.userid
      WHERE qa.timemodified > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL ? HOUR))
      GROUP BY u.id, u.username, u.email, u.firstname, u.lastname
      ORDER BY last_attempt DESC
    `;

    console.log('📋 Ejecutando query para usuarios recientes con quiz');

    const [rows] = await connection.execute(query, [hours]);
    await connection.end();

    const users = Array.isArray(rows) ? rows : [];

    console.log(`👥 Encontrados ${users.length} usuarios con quiz en las últimas ${hours} horas`);

    return NextResponse.json({
      success: true,
      message: `Usuarios con quiz en las últimas ${hours} horas`,
      users: users,
      hoursSearched: hours,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error buscando usuarios recientes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error buscando usuarios recientes con quiz',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para buscar usuarios que han hecho quiz recientemente',
    description: 'Encuentra usuarios activos con quiz attempts en las últimas horas',
    usage: {
      method: 'POST',
      body: {
        hours: 'número de horas hacia atrás para buscar (default: 2)'
      },
      example: 'POST con {"hours": 4} para buscar en las últimas 4 horas'
    },
    timestamp: new Date().toISOString()
  });
} 