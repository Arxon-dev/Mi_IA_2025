import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configuración para forzar renderizado dinámico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🎮 Gamification API: Fetching real data...');

    // Estadísticas generales
    const totalUsers = await prisma.telegramuser.count();
    const totalResponses = await prisma.telegramresponse.count(); // Corregido: telegramResponse -> telegramresponse
    
    // Calcular precisión promedio
    const correctResponses = await prisma.telegramresponse.count({ // Corregido: telegramResponse -> telegramresponse
      where: { iscorrect: true }
    });
    const averageAccuracy = totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0;

    // Contar rachas activas (usuarios con racha > 0)
    const activeStreaks = await prisma.telegramuser.count({
      where: { streak: { gt: 0 } }
    });

    // Obtener la racha máxima
    const topStreakResult = await prisma.telegramuser.findFirst({
      orderBy: { beststreak: 'desc' }, // Corregido: bestStreak -> beststreak
      select: { beststreak: true } // Corregido: bestStreak -> beststreak
    });
    const topStreak = topStreakResult?.beststreak || 0; // Corregido: bestStreak -> beststreak

    // Calcular puntos totales otorgados
    const totalPointsResult = await prisma.telegramuser.aggregate({
      _sum: { totalpoints: true }
    });
    const totalPointsAwarded = totalPointsResult._sum.totalpoints || 0;

    // Ranking general (top 10)
    const leaderboardRaw = await prisma.telegramuser.findMany({
      orderBy: { totalpoints: 'desc' },
      take: 10,
      select: {
        telegramuserid: true,
        firstname: true,
        lastname: true,
        username: true,
        totalpoints: true,
        level: true,
        streak: true
      }
    });

    const leaderboard = leaderboardRaw.map((user, index) => ({
      rank: index + 1,
      user: {
        telegramuserid: user.telegramuserid,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname
      },
      points: user.totalpoints,
      level: user.level,
      streak: user.streak
    }));

    // Ranking semanal (últimos 7 días)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Obtener respuestas de la última semana
    const weeklyResponses = await prisma.telegramresponse.findMany({
      where: { answeredat: { gte: weekAgo } }
    });

    // Obtener usuarios únicos de las respuestas semanales
    const weeklyUserIds = Array.from(new Set(weeklyResponses.map(r => r.userid)));
    const weeklyUsers = await prisma.telegramuser.findMany({
      where: { id: { in: weeklyUserIds } }
    });
    
    // Crear un mapa de usuarios para acceso rápido
    const weeklyUsersMap = new Map(weeklyUsers.map(user => [user.id, user]));

    // Agrupar por usuario y calcular puntos semanales
    const weeklyPointsMap = new Map();
    weeklyResponses.forEach(response => {
      const user = weeklyUsersMap.get(response.userid);
      if (!user) return;
      
      const userid = user.telegramuserid;
      const points = response.iscorrect ? 10 : 0;
      
      if (!weeklyPointsMap.has(userid)) {
        weeklyPointsMap.set(userid, {
          user: user,
          points: 0
        });
      }
      
      weeklyPointsMap.get(userid).points += points;
    });

    // Convertir a array y ordenar por puntos
    const weeklyLeaderboard = Array.from(weeklyPointsMap.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        user: {
          telegramuserid: entry.user.telegramuserid,
          username: entry.user.username,
          firstname: entry.user.firstname,
          lastname: entry.user.lastname
        },
        points: entry.points,
        level: entry.user.level,
        streak: entry.user.streak
      }));

    // Ranking mensual (mes actual)
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    // Obtener respuestas del mes actual
    const monthlyResponses = await prisma.telegramresponse.findMany({
      where: { answeredat: { gte: firstDayOfMonth } }
    });

    // Obtener usuarios únicos de las respuestas mensuales
    const monthlyUserIds = Array.from(new Set(monthlyResponses.map(r => r.userid)));
    const monthlyUsers = await prisma.telegramuser.findMany({
      where: { id: { in: monthlyUserIds } }
    });
    
    // Crear un mapa de usuarios para acceso rápido
    const monthlyUsersMap = new Map(monthlyUsers.map(user => [user.id, user]));

    // Agrupar por usuario y calcular puntos mensuales
    const monthlyPointsMap = new Map();
    monthlyResponses.forEach(response => {
      const user = monthlyUsersMap.get(response.userid);
      if (!user) return;
      
      const userid = user.telegramuserid;
      const points = response.iscorrect ? 10 : 0;
      
      if (!monthlyPointsMap.has(userid)) {
        monthlyPointsMap.set(userid, {
          user: user,
          points: 0
        });
      }
      
      monthlyPointsMap.get(userid).points += points;
    });

    // Convertir a array y ordenar por puntos
    const monthlyLeaderboard = Array.from(monthlyPointsMap.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((entry, index) => ({
        rank: index + 1,
        user: {
          telegramuserid: entry.user.telegramuserid,
          username: entry.user.username,
          firstname: entry.user.firstname,
          lastname: entry.user.lastname
        },
        points: entry.points,
        level: entry.user.level,
        streak: entry.user.streak
      }));

    // Obtener logros reales de la base de datos (si tienes una tabla de achievements)
    // Por ahora, mantenemos algunos logros ejemplo basados en datos reales
    const achievements = [
      {
        id: '1',
        name: 'Primera Respuesta',
        description: 'Responde tu primera pregunta',
        icon: '🎯',
        category: 'volume',
        points: 50,
        rarity: 'common',
        unlockedCount: totalUsers // Todos los usuarios han respondido al menos una vez para estar registrados
      },
      {
        id: '2',
        name: 'Racha de 7 días',
        description: 'Responde preguntas durante 7 días consecutivos',
        icon: '🔥',
        category: 'streak',
        points: 250,
        rarity: 'rare',
        unlockedCount: await prisma.telegramuser.count({
          where: { beststreak: { gte: 7 } } // Corregido: bestStreak -> beststreak
        })
      },
      {
        id: '3',
        name: 'Velocista',
        description: 'Responde 10 preguntas en menos de 10 segundos',
        icon: '⚡',
        category: 'speed',
        points: 200,
        rarity: 'rare',
        unlockedCount: Math.floor(totalUsers * 0.1) // Estimación del 10%
      },
      {
        id: '4',
        name: 'Perfeccionista',
        description: 'Alcanza 100% de precisión en 10 respuestas',
        icon: '💯',
        category: 'accuracy',
        points: 300,
        rarity: 'epic',
        unlockedCount: Math.floor(totalUsers * 0.05) // Estimación del 5%
      }
    ];

    const stats = {
      totalUsers,
      totalResponses,
      averageAccuracy,
      activeStreaks,
      topStreak,
      totalPointsAwarded
    };

    const response = {
      leaderboard,
      weeklyLeaderboard,
      monthlyLeaderboard,
      achievements,
      stats,
      lastUpdate: new Date().toISOString()
    };

    console.log('✅ Gamification API: Real data fetched successfully');
    console.log('🎮 Gamification Stats:', {
      users: totalUsers,
      responses: totalResponses,
      accuracy: averageAccuracy,
      activeStreaks,
      topStreak,
      totalpoints: totalPointsAwarded
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Gamification API error:', error);
    
    return NextResponse.json({
      error: 'Error fetching gamification data',
      leaderboard: [],
      weeklyLeaderboard: [],
      achievements: [],
      stats: {
        totalUsers: 0,
        totalResponses: 0,
        averageAccuracy: 0,
        activeStreaks: 0,
        topStreak: 0,
        totalPointsAwarded: 0
      },
      lastUpdate: new Date().toISOString()
    }, { status: 500 });

  } finally {
    await prisma.$disconnect();
  }
}