import { NextRequest, NextResponse } from 'next/server';
import { studyTimeoutScheduler } from '@/services/studyTimeoutScheduler';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Obtener estadísticas de sesiones
    const [
      activeSessions,
      totalSessions,
      totalResponses,
      totalStats,
      recentSessions
    ] = await Promise.all([
      // Sesiones activas
      prisma.userstudysession.count({
        where: { status: 'active' }
      }),
      
      // Total de sesiones
      prisma.userstudysession.count(),
      
      // Total de respuestas
      prisma.studyresponse.count(),
      
      // Total de estadísticas de usuarios
      prisma.studystats.count(),
      
      // Sesiones recientes (últimas 24 horas)
      prisma.userstudysession.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        include: {
          responses: true,
          _count: {
            select: { responses: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Estadísticas por materia
    const statsBySubject = await prisma.studystats.groupBy({
      by: ['subject'],
      _count: {
        subject: true
      },
      _sum: {
        totalquestions: true,
        correctAnswers: true,
        incorrectAnswers: true
      },
      _avg: {
        averageResponseTime: true
      }
    });

    // Estadísticas del scheduler
    const schedulerStats = studyTimeoutScheduler.getStats();

    // Calcular estadísticas adicionales
    const completedSessions = await prisma.userstudysession.count({
      where: { status: 'completed' }
    });

    const cancelledSessions = await prisma.userstudysession.count({
      where: { status: 'cancelled' }
    });

    const averageSessionDuration = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM ("lastActivityAt" - "createdAt"))) as avg_duration_seconds
      FROM "UserStudySession"
      WHERE status IN ('completed', 'cancelled')
      AND "lastActivityAt" IS NOT NULL
    ` as any[];

    const stats = {
      // Resumen general
      summary: {
        activeSessions,
        totalSessions,
        completedSessions,
        cancelledSessions,
        totalResponses,
        totalUsers: totalStats,
        averageSessionDurationMinutes: averageSessionDuration[0]?.avg_duration_seconds 
          ? Math.round(averageSessionDuration[0].avg_duration_seconds / 60) 
          : 0
      },

      // Estadísticas del scheduler
      scheduler: schedulerStats,

      // Estadísticas por materia
      subjectStats: statsBySubject.map(stat => ({
        subject: stat.subject,
        users: stat._count.subject,
        totalquestions: stat._sum.totalquestions || 0,
        correctAnswers: stat._sum.correctAnswers || 0,
        incorrectAnswers: stat._sum.incorrectAnswers || 0,
        averageResponseTime: stat._avg.averageResponseTime 
          ? Math.round(stat._avg.averageResponseTime / 1000)
          : 0,
        accuracy: stat._sum.totalquestions && stat._sum.correctAnswers
          ? Math.round((stat._sum.correctAnswers / (stat._sum.correctAnswers + (stat._sum.incorrectAnswers || 0))) * 100)
          : 0
      })).sort((a, b) => b.totalquestions - a.totalquestions),

      // Sesiones recientes
      recentSessions: recentSessions.map(session => ({
        id: session.id,
        userid: session.userid,
        subject: session.subject,
        status: session.status,
        progress: `${session.currentindex}/${session.totalquestions}`,
        responses: session._count.responses,
        createdAt: session.createdAt,
        lastActivity: session.lastActivityAt,
        timeoutat: session.timeoutat
      })),

      // Metadatos
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error obteniendo estadísticas de sesiones de estudio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Limpiar sesiones antiguas (más de 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const deletedSessions = await prisma.userstudysession.deleteMany({
      where: {
        AND: [
          { status: { in: ['completed', 'cancelled'] } },
          { createdAt: { lt: sevenDaysAgo } }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      deletedSessions: deletedSessions.count,
      message: `Se eliminaron ${deletedSessions.count} sesiones antiguas`
    });

  } catch (error) {
    console.error('Error limpiando sesiones antiguas:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}