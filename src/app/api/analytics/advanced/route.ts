import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configuración para forzar renderizado dinámico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📊 Advanced Analytics API: Calculating detailed metrics...');

    // ===== MÉTRICAS TEMPORALES =====
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Respuestas por período
    const responsesToday = await prisma.telegramresponse.count({
      where: { answeredat: { gte: oneDayAgo } }
    });

    const responsesWeek = await prisma.telegramresponse.count({
      where: { answeredat: { gte: oneWeekAgo } }
    });

    const responsesMonth = await prisma.telegramresponse.count({
      where: { answeredat: { gte: oneMonthAgo } }
    });

    // ===== ANÁLISIS DE RENDIMIENTO =====
    
    // Tiempo de respuesta promedio
    const avgResponseTime = await prisma.telegramresponse.aggregate({
      _avg: { responsetime: true },
      where: { responsetime: { not: null } }
    });

    // Distribución de tiempos de respuesta
    const fastResponses = await prisma.telegramresponse.count({
      where: { responsetime: { lte: 10 } }
    });

    const mediumResponses = await prisma.telegramresponse.count({
      where: { 
        responsetime: { 
          gt: 10,
          lte: 30 
        } 
      }
    });

    const slowResponses = await prisma.telegramresponse.count({
      where: { responsetime: { gt: 30 } }
    });

    // ===== ANÁLISIS DE USUARIOS =====
    
    // Usuarios más activos (por respuestas) - Removemos _count ya que no hay relación definida
    const topActiveUsers = await prisma.telegramuser.findMany({
      orderBy: { totalpoints: 'desc' },
      take: 5,
      select: {
        firstname: true,
        username: true,
        totalpoints: true,
        level: true,
        streak: true
      }
    });

    // Distribución de niveles
    const levelDistribution = await prisma.telegramuser.groupBy({
      by: ['level'],
      _count: { level: true },
      orderBy: { level: 'asc' }
    });

    // ===== ANÁLISIS DE ENGAGEMENT =====
    
    // Usuarios con rachas activas por duración
    const streakDistribution = await prisma.telegramuser.groupBy({
      by: ['streak'],
      _count: { streak: true },
      where: { streak: { gt: 0 } },
      orderBy: { streak: 'desc' }
    });

    // Precisión por usuario - Corregir nombres de tablas
    const userAccuracy = await prisma.$queryRaw`
      SELECT 
        tu.firstname,
        tu.username,
        COUNT(tr.id) as totalResponses,
        COUNT(CASE WHEN tr.iscorrect = true THEN 1 END) as correctResponses,
        ROUND(
          (COUNT(CASE WHEN tr.iscorrect = true THEN 1 END) * 100.0 / COUNT(tr.id))
        ) as accuracy
      FROM telegramuser tu
      LEFT JOIN telegramresponse tr ON tu.id = tr.userid
      WHERE tr.id IS NOT NULL
      GROUP BY tu.id, tu.firstname, tu.username
      ORDER BY accuracy DESC
      LIMIT 10
    `;

    // ===== ANÁLISIS DE CRECIMIENTO =====
    
    // Crecimiento de usuarios por día (últimos 30 días)
    const userGrowth = await prisma.$queryRaw`
      SELECT 
        DATE(joinedat) as date,
        COUNT(*) as newUsers
      FROM telegramuser
      WHERE joinedat >= ${oneMonthAgo}
      GROUP BY DATE(joinedat)
      ORDER BY date DESC
    `;

    // Actividad diaria (últimos 30 días)
    const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE(answeredat) as date,
        COUNT(*) as responses,
        COUNT(DISTINCT userid) as activeUsers
      FROM telegramresponse
      WHERE answeredat >= ${oneMonthAgo}
      GROUP BY DATE(answeredat)
      ORDER BY date DESC
    `;

    // ===== MÉTRICAS DE LOGROS =====
    
    // Logros más populares - Removemos _count y users ya que no hay relaciones definidas
    const popularAchievements = await prisma.achievement.findMany({
      select: {
        name: true,
        description: true,
        icon: true,
        rarity: true,
        points: true
      },
      orderBy: { points: 'desc' }, // Ordenamos por puntos en lugar de por usuarios
      take: 10
    });

    // Distribución de logros por rareza
    const achievementRarityStats = await prisma.achievement.groupBy({
      by: ['rarity'],
      _count: { rarity: true }
    });

    // ===== MÉTRICAS DE RETENCIÓN =====
    
    // Usuarios que respondieron ayer y también hoy
    const retentionRate = await prisma.$queryRaw`
      WITH yesterday_users AS (
        SELECT DISTINCT userid
        FROM telegramresponse
        WHERE DATE(answeredat) = DATE(${oneDayAgo})
      ),
      today_users AS (
        SELECT DISTINCT userid
        FROM telegramresponse
        WHERE DATE(answeredat) = DATE(${now})
      )
      SELECT 
        (SELECT COUNT(*) FROM yesterday_users) as yesterdayActive,
        (SELECT COUNT(*) FROM today_users) as todayActive,
        COUNT(*) as retainedUsers
      FROM yesterday_users y
      INNER JOIN today_users t ON y.userid = t.userid
    `;

    // ===== COMPILAR RESPUESTA =====
    const analytics = {
      // Métricas temporales
      responseMetrics: {
        today: responsesToday,
        thisWeek: responsesWeek,
        thisMonth: responsesMonth,
        averageResponseTime: Math.round(avgResponseTime._avg.responsetime || 0)
      },

      // Distribución de rendimiento
      performanceDistribution: {
        fast: fastResponses,        // ≤ 10s
        medium: mediumResponses,    // 10-30s
        slow: slowResponses,        // > 30s
        total: fastResponses + mediumResponses + slowResponses
      },

      // Top usuarios - Actualizar el mapeo sin _count.responses
      topUsers: topActiveUsers.map(user => ({
        name: user.firstname || user.username || 'Usuario',
        points: user.totalpoints,
        level: user.level,
        streak: user.streak
        // Removido totalResponses ya que no hay relación definida
      })),

      // Distribución de niveles
      levelDistribution: levelDistribution.map(level => ({
        level: level.level,
        userCount: level._count.level
      })),

      // Distribución de rachas
      streakDistribution: streakDistribution.map(streak => ({
        streakDays: streak.streak,
        userCount: streak._count.streak
      })),

      // Precisión de usuarios
      userAccuracy: userAccuracy as any[],

      // Crecimiento y actividad
      growth: {
        userGrowth: userGrowth as any[],
        dailyActivity: dailyActivity as any[]
      },

      // Métricas de logros
      achievements: {
        popular: popularAchievements.map(achievement => ({
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity,
          points: achievement.points
          // Removido unlockedCount ya que no hay relación definida
        })),
        rarityStats: achievementRarityStats.map(stat => ({
          rarity: stat.rarity,
          count: stat._count.rarity
        }))
      },

      // Métricas de retención
      retention: retentionRate as any[],

      // Metadatos
      calculatedAt: new Date().toISOString(),
      dataRange: {
        from: oneMonthAgo.toISOString(),
        to: now.toISOString()
      }
    };

    console.log('✅ Advanced Analytics: Calculations completed');

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('❌ Advanced Analytics API error:', error);
    
    return NextResponse.json({
      error: 'Error calculating advanced analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}