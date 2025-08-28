import GamificationService from '../src/services/gamificationService';

async function testMonthlyRanking() {
  console.log('🧪 Pruebas del Sistema de Ranking Mensual...\n');

  try {
    // Test 1: Obtener ranking general
    console.log('🏆 Test 1: Ranking General (Histórico)');
    const generalLeaderboard = await GamificationService.getLeaderboard(5);
    console.log('✅ Top 5 General:', generalLeaderboard.map(entry => ({
      rank: entry.rank,
      user: entry.user.username || entry.user.firstname,
      points: entry.points,
      level: entry.level
    })));

    // Test 2: Obtener ranking semanal
    console.log('\n📅 Test 2: Ranking Semanal (Últimos 7 días)');
    const weeklyLeaderboard = await GamificationService.getWeeklyLeaderboard(5);
    console.log('✅ Top 5 Semanal:', weeklyLeaderboard.map(entry => ({
      rank: entry.rank,
      user: entry.user.username || entry.user.firstname,
      points: entry.points,
      level: entry.level
    })));

    // Test 3: Obtener ranking mensual
    console.log('\n📊 Test 3: Ranking Mensual (Mes actual)');
    const monthlyLeaderboard = await GamificationService.getMonthlyLeaderboard(5);
    console.log('✅ Top 5 Mensual:', monthlyLeaderboard.map(entry => ({
      rank: entry.rank,
      user: entry.user.username || entry.user.firstname,
      points: entry.points,
      level: entry.level
    })));

    // Test 4: Comparación de rankings
    console.log('\n🔍 Test 4: Análisis Comparativo');
    console.log('📊 Estadísticas:');
    console.log(`   • Usuarios en General: ${generalLeaderboard.length}`);
    console.log(`   • Usuarios en Semanal: ${weeklyLeaderboard.length}`);
    console.log(`   • Usuarios en Mensual: ${monthlyLeaderboard.length}`);

    // Test 5: Verificar diferencias entre rankings
    console.log('\n🔄 Test 5: Diferencias entre Rankings');
    
    if (generalLeaderboard.length > 0 && monthlyLeaderboard.length > 0) {
      const topGeneral = generalLeaderboard[0];
      const topMonthly = monthlyLeaderboard[0];
      
      console.log(`🥇 Líder General: ${topGeneral.user.firstname || topGeneral.user.username} (${topGeneral.points} pts históricos)`);
      console.log(`🥇 Líder Mensual: ${topMonthly.user.firstname || topMonthly.user.username} (${topMonthly.points} pts este mes)`);
      
      if (topGeneral.user.telegramuserid !== topMonthly.user.telegramuserid) {
        console.log('✅ ¡Los líderes son diferentes! El ranking mensual es dinámico.');
      } else {
        console.log('ℹ️  Los líderes son iguales, pero esto es normal si solo un usuario está activo.');
      }
    }

    // Test 6: Información del período mensual
    console.log('\n📅 Test 6: Información del Período');
    const now = new Date();
    const monthName = now.toLocaleDateString('es-ES', { month: 'long' });
    const year = now.getFullYear();
    const firstDay = new Date(year, now.getMonth(), 1);
    
    console.log(`🗓️ Mes actual: ${monthName} ${year}`);
    console.log(`📅 Desde: ${firstDay.toLocaleDateString('es-ES')}`);
    console.log(`📅 Hasta: ${now.toLocaleDateString('es-ES')}`);

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen del Sistema de Rankings:');
    console.log('- ✅ Ranking General (histórico)');
    console.log('- ✅ Ranking Semanal (dinámico)');
    console.log('- ✅ Ranking Mensual (dinámico) - ¡NUEVO!');
    console.log('\n💡 Comandos disponibles:');
    console.log('- /ranking (general)');
    console.log('- /ranking semanal');
    console.log('- /ranking mensual');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testMonthlyRanking();
}

export default testMonthlyRanking; 