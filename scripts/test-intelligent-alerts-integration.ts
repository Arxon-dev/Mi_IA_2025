import { prisma } from '../src/lib/prisma';
import { IntelligentAlertsService } from '../src/services/intelligentAlertsService';

/**
 * 🧪 Script de prueba para verificar la integración de alertas inteligentes
 * con datos combinados de sesiones de estudio y grupo de Telegram
 */

async function testIntelligentAlertsIntegration() {
  console.log('🧪 INICIANDO PRUEBA DE INTEGRACIÓN DE ALERTAS INTELIGENTES');
  console.log('=' .repeat(60));

  try {
    // Inicializar el servicio
    const alertsService = new IntelligentAlertsService();

    // 1. Obtener un usuario con actividad reciente
    console.log('\n📊 1. BUSCANDO USUARIOS CON ACTIVIDAD RECIENTE...');
    
    const usersWithActivity = await prisma.$queryRaw`
      SELECT DISTINCT userid, CAST(COUNT(*) AS SIGNED) as total_responses
      FROM (
        SELECT userid FROM studyresponse 
        WHERE answeredat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION ALL
        SELECT userid FROM telegramresponse 
        WHERE answeredat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ) combined_activity
      GROUP BY userid
      HAVING total_responses >= 5
      ORDER BY total_responses DESC
      LIMIT 3
    ` as any[];

    if (usersWithActivity.length === 0) {
      console.log('⚠️  No se encontraron usuarios con actividad reciente suficiente');
      return;
    }

    console.log(`✅ Encontrados ${usersWithActivity.length} usuarios con actividad:`);
    usersWithActivity.forEach((user, index) => {
      console.log(`   ${index + 1}. Usuario ${user.userid}: ${user.total_responses} respuestas`);
    });

    // 2. Probar cálculo de métricas para cada usuario
    console.log('\n📈 2. CALCULANDO MÉTRICAS DE RENDIMIENTO...');
    
    for (const user of usersWithActivity) {
      console.log(`\n👤 Usuario: ${user.userid}`);
      console.log('-'.repeat(40));
      
      try {
        // Calcular métricas actuales
        const currentMetrics = await alertsService.calculatePerformanceMetrics(user.userid, 7);
        
        console.log('📊 Métricas calculadas:');
        console.log(`   • Tendencia de precisión: ${(currentMetrics.accuracyTrend * 100).toFixed(1)}%`);
        console.log(`   • Frecuencia de estudio: ${currentMetrics.studyFrequency.toFixed(1)} preguntas/día`);
        console.log(`   • Tiempo promedio respuesta: ${currentMetrics.averageResponseTime.toFixed(0)}s`);
        console.log(`   • Racha actual: ${currentMetrics.currentStreak} días`);
        console.log(`   • Progresión dificultad: ${(currentMetrics.difficultyProgression * 100).toFixed(1)}%`);
        console.log(`   • Puntuación engagement: ${currentMetrics.engagementScore.toFixed(0)}/100`);
        
        // Verificar datos fuente
        const sourceData = await prisma.$queryRaw`
          SELECT 
            source,
            CAST(COUNT(*) AS SIGNED) as count,
            CAST(SUM(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) AS SIGNED) as correct,
            CAST(AVG(responsetime) AS SIGNED) as avg_time
          FROM (
            SELECT 'study' as source, iscorrect, responsetime
            FROM studyresponse 
            WHERE userid = ${user.userid} 
              AND answeredat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              AND answeredat IS NOT NULL
            UNION ALL
            SELECT 'telegram' as source, iscorrect, responsetime
            FROM telegramresponse 
            WHERE userid = ${user.userid} 
              AND answeredat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          ) combined
          GROUP BY source
        ` as any[];
        
        console.log('\n🔍 Desglose por fuente:');
        sourceData.forEach(data => {
          const accuracy = data.count > 0 ? (data.correct / data.count * 100).toFixed(1) : '0';
          console.log(`   • ${data.source}: ${data.count} respuestas, ${accuracy}% precisión, ${Math.round(data.avg_time || 0)}s promedio`);
        });
        
        // Verificar alertas
        console.log('\n🚨 Verificando alertas...');
        const alerts = await alertsService.checkForAlerts(user.userid);
        
        if (alerts.length > 0) {
          console.log(`✅ Se generaron ${alerts.length} alertas:`);
          alerts.forEach((alert, index) => {
            console.log(`   ${index + 1}. ${alert.type}: ${alert.message.substring(0, 100)}...`);
          });
        } else {
          console.log('ℹ️  No se generaron alertas para este usuario');
        }
        
      } catch (error) {
        console.error(`❌ Error procesando usuario ${user.userid}:`, error.message);
      }
    }

    // 3. Estadísticas generales
    console.log('\n📈 3. ESTADÍSTICAS GENERALES DE INTEGRACIÓN...');
    
    const totalStats = await prisma.$queryRaw`
      SELECT 
        'study' as source,
        CAST(COUNT(*) AS SIGNED) as total_responses,
        CAST(COUNT(DISTINCT userid) AS SIGNED) as unique_users,
        CAST(AVG(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) AS DECIMAL(5,4)) as avg_accuracy
      FROM studyresponse 
      WHERE answeredat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND answeredat IS NOT NULL
      
      UNION ALL
      
      SELECT 
        'telegram' as source,
        CAST(COUNT(*) AS SIGNED) as total_responses,
        CAST(COUNT(DISTINCT userid) AS SIGNED) as unique_users,
        CAST(AVG(CASE WHEN iscorrect = 1 THEN 1 ELSE 0 END) AS DECIMAL(5,4)) as avg_accuracy
      FROM telegramresponse 
      WHERE answeredat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ` as any[];
    
    console.log('\n📊 Resumen de actividad (últimos 7 días):');
    totalStats.forEach(stat => {
      console.log(`   • ${stat.source}: ${stat.total_responses} respuestas, ${stat.unique_users} usuarios únicos, ${(stat.avg_accuracy * 100).toFixed(1)}% precisión promedio`);
    });

    console.log('\n✅ PRUEBA DE INTEGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('🎯 El sistema ahora analiza datos combinados de sesiones de estudio y grupo de Telegram');
    
  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testIntelligentAlertsIntegration()
    .then(() => {
      console.log('\n🏁 Prueba finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { testIntelligentAlertsIntegration };