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
    const { username, email } = body;

    console.log('🔍 Detectando user ID para:', { username, email });

    // Conectar a MySQL
    const connection = await mysql.createConnection(moodleDbConfig);

    let query = '';
    let queryParams: any[] = [];

    if (username) {
      query = 'SELECT id, username, email, firstname, lastname FROM mdl_user WHERE username = ?';
      queryParams = [username];
    } else if (email) {
      query = 'SELECT id, username, email, firstname, lastname FROM mdl_user WHERE email = ?';
      queryParams = [email];
    } else {
      // Si no hay criterios específicos, buscar usuarios recientes que hicieron quiz
      query = `
        SELECT DISTINCT u.id, u.username, u.email, u.firstname, u.lastname, 
               COUNT(qa.id) as quiz_attempts
        FROM mdl_user u
        JOIN mdl_quiz_attempts qa ON u.id = qa.userid
        WHERE qa.timemodified > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 24 HOUR))
        GROUP BY u.id, u.username, u.email, u.firstname, u.lastname
        ORDER BY qa.timemodified DESC, quiz_attempts DESC
        LIMIT 10
      `;
      queryParams = [];
    }

    console.log('📋 Ejecutando query:', query);
    console.log('📋 Parámetros:', queryParams);

    const [rows] = await connection.execute(query, queryParams);
    await connection.end();

    const users = Array.isArray(rows) ? rows : [];

    console.log('👥 Usuarios encontrados:', users);

    return NextResponse.json({
      success: true,
      message: username || email ? 'Usuario encontrado' : 'Usuarios recientes con quiz encontrados',
      users: users,
      searchCriteria: { username, email },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error detectando user ID:', error);
    return NextResponse.json({
      success: false,
      error: 'Error detectando user ID',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para detectar user ID real en Moodle',
    description: 'Busca usuarios por username, email o muestra usuarios recientes con quiz',
    usage: {
      method: 'POST',
      body: {
        username: 'opcional - buscar por username',
        email: 'opcional - buscar por email'
      },
      example: 'Si no se proporciona username ni email, muestra usuarios recientes con quiz'
    },
    timestamp: new Date().toISOString()
  });
} 