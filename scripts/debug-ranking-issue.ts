import { prisma } from '../src/lib/prisma';

async function debugRankingIssue() {
  console.log('🔍 ======== DEBUG RANKING SEMANAL ========');
  console.log('🎯 Investigando problema de puntos decrecientes para Juanmaprieto\n');

  try {
    // El telegramuserid correcto de los logs es 1324285278
    const targetTelegramUserId = '1324285278';
    
    // 1. Buscar usuario por telegramuserid específico
    const user = await prisma.telegramuser.findFirst({
      where: {
        telegramuserid: targetTelegramUserId
      },
      select: {
        id: true,
        telegramuserid: true,
        firstname: true,
        username: true,
        totalpoints: true,
        level: true
      }
    });

    if (!user) {
      console.log(`❌ Usuario con telegramuserid ${targetTelegramUserId} no encontrado`);
      return;
    }

    console.log('👤 Usuario encontrado:');
    console.log(`   ID interno: ${user.id}`);
    console.log(`   Telegram ID: ${user.telegramuserid}`);
    console.log(`   Nombre: ${user.firstname} (@${user.username})`);
    console.log(`   Puntos totales: ${user.totalpoints}`);
    console.log(`   Nivel: ${user.level}\n`);

    // 2. Verificar respuestas de los últimos 7 días
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    console.log(`📅 Ventana de tiempo (últimos 7 días):`);
    console.log(`   Desde: ${sevenDaysAgo.toISOString()}`);
    console.log(`   Hasta: ${now.toISOString()}\n`);

    // 3. Obtener respuestas semanales
    const weeklyResponses = await prisma.telegramResponse.findMany({
      where: {
        userid: user.id,
        answeredAt: {
          gte: sevenDaysAgo,
          lte: now
        }
      },
      select: {
        id: true,
        points: true,
        iscorrect: true,
        answeredAt: true,
        responsetime: true,
        questionid: true
      },
      orderBy: { answeredAt: 'desc' }
    });

    console.log(`📊 Respuestas en los últimos 7 días: ${weeklyResponses.length}`);
    
    if (weeklyResponses.length > 0) {
      // Calcular estadísticas semanales
      const weeklyPoints = weeklyResponses.reduce((sum, r) => sum + (r.points || 0), 0);
      const correctAnswers = weeklyResponses.filter(r => r.iscorrect).length;
      const incorrectAnswers = weeklyResponses.length - correctAnswers;
      const accuracy = weeklyResponses.length > 0 
        ? Math.round((correctAnswers / weeklyResponses.length) * 100)
        : 0;

      console.log(`   📈 Puntos semanales calculados: ${weeklyPoints}`);
      console.log(`   ✅ Respuestas correctas: ${correctAnswers}`);
      console.log(`   ❌ Respuestas incorrectas: ${incorrectAnswers}`);
      console.log(`   🎯 Precisión: ${accuracy}%\n`);

      // Mostrar detalle de las últimas 20 respuestas
      console.log('📋 Últimas 20 respuestas semanales:');
      weeklyResponses.slice(0, 20).forEach((response, index) => {
        const date = response.answeredAt.toLocaleString('es-ES');
        const status = response.iscorrect ? '✅' : '❌';
        const points = response.points || 0;
        console.log(`   ${index + 1}. ${date} - ${status} ${points} pts`);
      });
    } else {
      console.log('   ⚠️ No hay respuestas en los últimos 7 días');
    }

    // 4. Comparar con diferentes ventanas de tiempo
    console.log('\n🔄 Comparando con diferentes ventanas de tiempo:');
    
    // Últimas 24 horas
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);
    const responses1Day = await prisma.telegramResponse.count({
      where: {
        userid: user.id,
        answeredAt: { gte: oneDayAgo, lte: now }
      }
    });
    const points1Day = await prisma.telegramResponse.aggregate({
      where: {
        userid: user.id,
        answeredAt: { gte: oneDayAgo, lte: now }
      },
      _sum: { points: true }
    });

    // Últimas 3 días
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    const responses3Days = await prisma.telegramResponse.count({
      where: {
        userid: user.id,
        answeredAt: { gte: threeDaysAgo, lte: now }
      }
    });
    const points3Days = await prisma.telegramResponse.aggregate({
      where: {
        userid: user.id,
        answeredAt: { gte: threeDaysAgo, lte: now }
      },
      _sum: { points: true }
    });

    console.log(`   📊 Últimas 24 horas: ${responses1Day} respuestas, ${points1Day._sum.points || 0} puntos`);
    console.log(`   📊 Últimos 3 días: ${responses3Days} respuestas, ${points3Days._sum.points || 0} puntos`);
    console.log(`   📊 Últimos 7 días: ${weeklyResponses.length} respuestas, ${weeklyResponses.reduce((sum, r) => sum + (r.points || 0), 0)} puntos`);

    // 5. Verificar si hay puntos negativos en toda la historia
    console.log('\n❗ Verificando puntos negativos en toda la historia:');
    const allNegativePoints = await prisma.telegramResponse.findMany({
      where: {
        userid: user.id,
        points: { lt: 0 }
      },
      select: {
        points: true,
        iscorrect: true,
        answeredAt: true
      },
      orderBy: { answeredAt: 'desc' },
      take: 10
    });
    
    if (allNegativePoints.length > 0) {
      console.log(`   🚨 Encontradas ${allNegativePoints.length} respuestas con puntos negativos:`);
      allNegativePoints.forEach((response, index) => {
        const date = response.answeredAt.toLocaleString('es-ES');
        console.log(`   ${index + 1}. ${date} - ${response.points} pts (${response.iscorrect ? 'correcta' : 'incorrecta'})`);
      });
    } else {
      console.log('   ✅ No hay respuestas con puntos negativos en toda la historia');
    }

    // 6. Verificar respuestas recientes (últimas 50)
    console.log('\n🔎 Últimas 50 respuestas del usuario (todas):');
    const recentResponses = await prisma.telegramResponse.findMany({
      where: { userid: user.id },
      select: {
        points: true,
        iscorrect: true,
        answeredAt: true
      },
      orderBy: { answeredAt: 'desc' },
      take: 50
    });

    if (recentResponses.length > 0) {
      console.log(`   📊 Total respuestas encontradas: ${recentResponses.length}`);
      
      // Agrupar por día para ver la tendencia
      const responsesByDay = recentResponses.reduce((acc, response) => {
        const day = response.answeredAt.toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = { count: 0, points: 0, correct: 0 };
        }
        acc[day].count++;
        acc[day].points += response.points || 0;
        if (response.iscorrect) acc[day].correct++;
        return acc;
      }, {} as Record<string, { count: number; points: number; correct: number }>);

      console.log('\n   📅 Actividad por día (últimos datos):');
      Object.entries(responsesByDay)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 10)
        .forEach(([day, stats]) => {
          const accuracy = Math.round((stats.correct / stats.count) * 100);
          console.log(`   📅 ${day}: ${stats.count} respuestas, ${stats.points} puntos, ${accuracy}% precisión`);
        });
    } else {
      console.log('   ⚠️ No se encontraron respuestas para este usuario');
    }

  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRankingIssue(); 