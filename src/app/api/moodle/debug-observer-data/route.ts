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
    console.log('🔍 DEBUG: Analizando datos del observer de Moodle');
    console.log('🔧 Config MySQL:', { 
      host: moodleDbConfig.host, 
      user: moodleDbConfig.user, 
      database: moodleDbConfig.database 
    });

    const connection = await mysql.createConnection(moodleDbConfig);
    console.log('✅ Conexión MySQL establecida');

    // Buscar el último quiz attempt del usuario 575 (desy)
    const lastAttemptQuery = `
      SELECT qa.*, q.name as quiz_name
      FROM mdl_quiz_attempts qa
      JOIN mdl_quiz q ON qa.quiz = q.id
      WHERE qa.userid = 575
      ORDER BY qa.timemodified DESC
      LIMIT 1
    `;

    const [lastAttempt] = await connection.execute(lastAttemptQuery);
    const attempt = (lastAttempt as any[])[0];

    if (!attempt) {
      await connection.end();
      return NextResponse.json({
        success: false,
        message: 'No se encontraron quiz attempts para el usuario 575'
      });
    }

    console.log('📊 Último quiz attempt encontrado:', attempt);

    // Obtener todas las question attempts de este quiz attempt
    const questionAttemptsQuery = `
      SELECT 
        qa.id,
        qa.slot,
        qa.questionid,
        qa.mark,
        qa.maxmark,
        qa.state,
        qa.timemodified,
        q.name as question_name,
        q.questiontext
      FROM mdl_question_attempts qa
      JOIN mdl_question q ON qa.questionid = q.id
      WHERE qa.questionusageid = ?
      ORDER BY qa.slot
      LIMIT 5
    `;

    const [questionAttempts] = await connection.execute(questionAttemptsQuery, [attempt.uniqueid]);
    const questions = questionAttempts as any[];

    console.log(`📝 Encontradas ${questions.length} question attempts`);

    // Analizar cada pregunta
    const questionAnalysis = questions.map(qa => {
      const hasMarkData = qa.mark !== null && qa.maxmark !== null;
      const percentage = hasMarkData && qa.maxmark > 0 ? 
        (qa.mark / qa.maxmark) * 100 : null;
      
      const isCorrectByMark = hasMarkData && percentage !== null && percentage >= 70;
      const isCorrectByState = qa.state && ['gradedright', 'mangrright', 'correct'].includes(qa.state);
      
      return {
        slot: qa.slot,
        questionid: qa.questionid,
        mark: qa.mark,
        maxmark: qa.maxmark,
        markPercentage: percentage,
        state: qa.state,
        isCorrectByMark,
        isCorrectByState,
        finalCorrect: hasMarkData ? isCorrectByMark : isCorrectByState,
        questionName: qa.question_name,
        hasMarkData,
        hasStateData: !!qa.state
      };
    });

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        quizAttempt: {
          id: attempt.id,
          quizName: attempt.quiz_name,
          state: attempt.state,
          timestart: attempt.timestart,
          timefinish: attempt.timefinish,
          sumgrades: attempt.sumgrades,
          uniqueid: attempt.uniqueid
        },
        questionCount: questions.length,
        questionAnalysis,
        summary: {
          questionsWithMarkData: questionAnalysis.filter(q => q.hasMarkData).length,
          questionsWithStateData: questionAnalysis.filter(q => q.hasStateData).length,
          correctByMark: questionAnalysis.filter(q => q.iscorrectByMark).length,
          correctByState: questionAnalysis.filter(q => q.iscorrectByState).length,
          finalCorrectCount: questionAnalysis.filter(q => q.finalCorrect).length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error debuggeando datos del observer:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json({
      success: false,
      error: 'Error interno al debuggear observer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Debug observer data endpoint is working!',
    usage: 'POST para analizar datos del último quiz del usuario 575',
    timestamp: new Date().toISOString()
  });
} 