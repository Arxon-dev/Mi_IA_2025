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
          createdat: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        include: {
          responses: true
        },
        orderBy: { createdat: 'desc' },
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
        correctanswers: true,
        incorrectanswers: true
      },
      _avg: {
        averageresponsetime: true
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
      SELECT AVG(EXTRACT(EPOCH FROM ("lastactivityat" - "createdat"))) as avg_duration_seconds
      FROM "userstudysession"
      WHERE status IN ('completed', 'cancelled')
      AND "lastactivityat" IS NOT NULL
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
        users: stat._count?.subject || 0,
        totalquestions: stat._sum?.totalquestions || 0,
        correctAnswers: stat._sum?.correctanswers || 0,
        incorrectAnswers: stat._sum?.incorrectanswers || 0,
        averageResponseTime: stat._avg?.averageresponsetime 
          ? Math.round(stat._avg.averageresponsetime / 1000)
          : 0,
        accuracy: stat._sum?.totalquestions && stat._sum?.correctanswers
          ? Math.round((stat._sum.correctanswers / (stat._sum.correctanswers + (stat._sum?.incorrectanswers || 0))) * 100)
          : 0
      })).sort((a, b) => b.totalquestions - a.totalquestions),

      // Sesiones recientes
      recentSessions: recentSessions.map(session => ({
        id: session.id,
        userid: session.userid,
        subject: session.subject,
        status: session.status,
        progress: `${session.currentindex}/${session.totalquestions}`,
        responses: session.responses?.length || 0,
        createdAt: session.createdat,
        lastActivity: session.lastactivityat,
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
          { createdat: { lt: sevenDaysAgo } }
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