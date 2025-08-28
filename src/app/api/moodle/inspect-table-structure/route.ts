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
    console.log('🔍 INSPECTING: Estructura de tablas de Moodle');

    const connection = await mysql.createConnection(moodleDbConfig);

    // Inspeccionar estructura de mdl_question_attempts
    const [questionAttemptsStructure] = await connection.execute(`
      DESCRIBE mdl_question_attempts
    `);

    // Inspeccionar estructura de mdl_quiz_attempts  
    const [quizAttemptsStructure] = await connection.execute(`
      DESCRIBE mdl_quiz_attempts
    `);

    // Buscar tablas relacionadas con scores/grades
    const [relatedTables] = await connection.execute(`
      SHOW TABLES LIKE '%grade%'
    `);

    // Obtener una muestra de datos reales de question_attempts
    const [sampleQuestionAttempts] = await connection.execute(`
      SELECT *
      FROM mdl_question_attempts
      WHERE questionusageid IN (
        SELECT uniqueid FROM mdl_quiz_attempts WHERE userid = 575
      )
      ORDER BY timemodified DESC
      LIMIT 3
    `);

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        questionAttemptsStructure: questionAttemptsStructure,
        quizAttemptsStructure: quizAttemptsStructure,
        relatedTables: relatedTables,
        sampleData: sampleQuestionAttempts,
        analysis: {
          hasMarkField: (questionAttemptsStructure as any[]).some(col => col.Field === 'mark'),
          hasMaxmarkField: (questionAttemptsStructure as any[]).some(col => col.Field === 'maxmark'),
          hasStateField: (questionAttemptsStructure as any[]).some(col => col.Field === 'state'),
          hasFractionField: (questionAttemptsStructure as any[]).some(col => col.Field === 'fraction'),
          availableFields: (questionAttemptsStructure as any[]).map(col => col.Field)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error inspeccionando estructura:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno al inspeccionar estructura',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Inspect table structure endpoint is working!',
    usage: 'POST para inspeccionar estructura de tablas de Moodle',
    timestamp: new Date().toISOString()
  });
} 