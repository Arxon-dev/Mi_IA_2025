import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    console.log(`🔍 Verificando datos de actividades para usuario: ${telegramuserid}`);

    // Obtener estadísticas básicas
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as "totalActivities",
        SUM(CASE WHEN "questionCorrect" = true THEN 1 ELSE 0 END) as "correctCount",
        SUM(CASE WHEN "questionCorrect" = false THEN 1 ELSE 0 END) as "incorrectCount",
        MIN("processedAt") as "firstActivity",
        MAX("processedAt") as "lastActivity"
      FROM "MoodleActivity" 
      WHERE "telegramuserid" = ${telegramuserid}
    `;

    // Obtener las últimas 10 actividades para análisis detallado
    const recentActivities = await prisma.$queryRaw<any[]>`
      SELECT 
        "id", "questionCorrect", "responsetime", "subject", 
        "difficulty", "processedAt"
      FROM "MoodleActivity" 
      WHERE "telegramuserid" = ${telegramuserid}
      ORDER BY "processedAt" DESC
      LIMIT 10
    `;

    // Análisis por fecha (últimas 24 horas)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as "todayTotal",
        SUM(CASE WHEN "questionCorrect" = true THEN 1 ELSE 0 END) as "todayCorrect",
        SUM(CASE WHEN "questionCorrect" = false THEN 1 ELSE 0 END) as "todayIncorrect"
      FROM "MoodleActivity" 
      WHERE "telegramuserid" = ${telegramuserid}
      AND "processedAt" >= ${today}
    `;

    const statsData = stats[0] || {
      totalActivities: 0,
      correctCount: 0,
      incorrectCount: 0,
      firstActivity: null,
      lastActivity: null
    };

    const todayData = todayStats[0] || {
      todayTotal: 0,
      todayCorrect: 0,
      todayIncorrect: 0
    };

    // Calcular porcentajes
    const totalActivities = Number(statsData.totalActivities);
    const correctCount = Number(statsData.correctCount);
    const incorrectCount = Number(statsData.incorrectCount);
    
    const accuracy = totalActivities > 0 ? (correctCount / totalActivities) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalActivities,
          correctCount,
          incorrectCount,
          accuracy: Math.round(accuracy * 10) / 10,
          firstActivity: statsData.firstActivity,
          lastActivity: statsData.lastActivity
        },
        today: {
          total: Number(todayData.todayTotal),
          correct: Number(todayData.todayCorrect),
          incorrect: Number(todayData.todayIncorrect)
        },
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          questionCorrect: activity.questionCorrect,
          responsetime: activity.responsetime,
          subject: activity.subject,
          difficulty: activity.difficulty,
          processedAt: activity.processedAt
        })),
        analysis: {
          hasActivities: totalActivities > 0,
          hasCorrectAnswers: correctCount > 0,
          allIncorrect: totalActivities > 0 && correctCount === 0,
          problemDetected: totalActivities > 10 && correctCount === 0 // Más de 10 preguntas, todas incorrectas = problema
        }
      }
    });

  } catch (error) {
    console.error('❌ Error verificando datos de actividades:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno al verificar actividades'
    }, { status: 500 });
  }
}

// GET para testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Check activity data endpoint is working!',
    usage: 'POST con { "telegramuserid": "tu_id" }',
    timestamp: new Date().toISOString()
  });
} 