import { prisma } from '../src/lib/prisma';

/**
 * 🔍 Script para verificar el estado de las notificaciones de rachas
 * Revisa logs recientes y usuarios con rachas activas
 */

async function checkStreakNotifications() {
  console.log('🔍 VERIFICACIÓN DE NOTIFICACIONES DE RACHAS');
  console.log('============================================');
  console.log('');

  try {
    // 1. Verificar logs recientes de notificaciones de rachas
    console.log('📋 1. LOGS RECIENTES DE NOTIFICACIONES DE RACHAS:');
    const recentLogs = await prisma.telegramsendlog.findMany({
      where: {
        questionid: 'notification_streak_encouragement'
      },
      orderBy: {
        sendtime: 'desc'
      },
      take: 10
    });

    if (recentLogs.length > 0) {
      console.log(`✅ Encontrados ${recentLogs.length} logs de notificaciones de rachas:`);
      recentLogs.forEach((log, index) => {
        const status = log.success ? '✅ ÉXITO' : '❌ ERROR';
        const date = log.sendtime ? new Date(log.sendtime).toLocaleString('es-ES') : 'Sin fecha';
        console.log(`   ${index + 1}. ${status} - ${date}`);
      });
    } else {
      console.log('⚠️ No se encontraron logs de notificaciones de rachas');
    }
    console.log('');

    // 2. Verificar usuarios con rachas activas (3-7 días)
    console.log('🔥 2. USUARIOS CON RACHAS ACTIVAS (3-7 días):');
    const usersWithStreaks = await prisma.telegramuser.findMany({
      where: {
        streak: {
          gte: 3,
          lte: 7
        }
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        streak: true,
        lastactivity: true
      },
      orderBy: {
        streak: 'desc'
      }
    });

    if (usersWithStreaks.length > 0) {
      console.log(`🎯 Encontrados ${usersWithStreaks.length} usuarios con rachas elegibles:`);
      usersWithStreaks.forEach((user, index) => {
        const lastActivity = user.lastactivity ? new Date(user.lastactivity).toLocaleDateString('es-ES') : 'Sin actividad';
        console.log(`   ${index + 1}. ${user.firstname} - ${user.streak} días (Última actividad: ${lastActivity})`);
      });
    } else {
      console.log('⚠️ No hay usuarios con rachas de 3-7 días actualmente');
    }
    console.log('');

    // 3. Verificar todos los usuarios con rachas
    console.log('📊 3. ESTADÍSTICAS GENERALES DE RACHAS:');
    const allStreaks = await prisma.telegramuser.findMany({
      where: {
        streak: {
          gt: 0
        }
      },
      select: {
        streak: true
      }
    });

    if (allStreaks.length > 0) {
      const streakCounts = allStreaks.reduce((acc, user) => {
        const range = user.streak >= 15 ? '15+' : 
                     user.streak >= 10 ? '10-14' :
                     user.streak >= 8 ? '8-9' :
                     user.streak >= 3 ? '3-7' :
                     '1-2';
        acc[range] = (acc[range] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('📈 Distribución de rachas:');
      Object.entries(streakCounts).forEach(([range, count]) => {
        const emoji = range === '15+' ? '🏆' :
                     range === '10-14' ? '🔥' :
                     range === '8-9' ? '⚡' :
                     range === '3-7' ? '🎯' : '🌱';
        console.log(`   ${emoji} ${range} días: ${count} usuarios`);
      });

      const maxStreak = Math.max(...allStreaks.map(u => u.streak));
      const avgStreak = (allStreaks.reduce((sum, u) => sum + u.streak, 0) / allStreaks.length).toFixed(1);
      console.log(``);
      console.log(`🏅 Racha máxima actual: ${maxStreak} días`);
      console.log(`📊 Racha promedio: ${avgStreak} días`);
    } else {
      console.log('⚠️ No hay usuarios con rachas activas');
    }
    console.log('');

    // 4. Verificar configuración de notificaciones
    console.log('⚙️ 4. CONFIGURACIÓN DE NOTIFICACIONES:');
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '..', 'scheduler-config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const notificationsEnabled = config.notifications?.enabled || false;
      const streakEnabled = config.notifications?.enabledRules?.includes('streak_encouragement') || false;
      const intervalHours = config.notifications?.intervalHours || 'No configurado';
      const allowedHours = config.notifications?.allowedHours || {};
      
      console.log(`📋 Notificaciones generales: ${notificationsEnabled ? '✅ HABILITADAS' : '❌ DESHABILITADAS'}`);
      console.log(`🔥 Notificaciones de rachas: ${streakEnabled ? '✅ HABILITADAS' : '❌ DESHABILITADAS'}`);
      console.log(`⏰ Intervalo de envío: cada ${intervalHours} horas`);
      console.log(`🕐 Horario permitido: ${allowedHours.startHour || 7}:00 - ${allowedHours.endHour || 22}:00`);
      
      // Mostrar todas las reglas habilitadas
      const enabledRules = config.notifications?.enabledRules || [];
      console.log(`📝 Reglas habilitadas: ${enabledRules.join(', ')}`);
    } else {
      console.log('⚠️ No se encontró archivo de configuración en:', configPath);
    }
    console.log('');

    // 5. Verificar horario actual
    console.log('🕐 5. VERIFICACIÓN DE HORARIO:');
    const now = new Date();
    const currentHour = now.getHours();
    const isWithinHours = currentHour >= 7 && currentHour <= 22;
    
    console.log(`⏰ Hora actual: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    console.log(`📅 Fecha: ${now.toLocaleDateString('es-ES')}`);
    console.log(`🚦 Estado: ${isWithinHours ? '✅ DENTRO DEL HORARIO PERMITIDO' : '🚫 FUERA DEL HORARIO PERMITIDO'}`);
    
    if (!isWithinHours) {
      const nextAllowedHour = currentHour < 7 ? 7 : 7; // Próximo día a las 7:00
      const hoursUntilNext = currentHour < 7 ? 7 - currentHour : 24 - currentHour + 7;
      console.log(`⏳ Próximo envío permitido en: ${hoursUntilNext} horas (a las 07:00)`);
    }
    console.log('');

    // 6. Recomendaciones
    console.log('💡 6. RECOMENDACIONES:');
    if (usersWithStreaks.length > 0 && recentLogs.length === 0) {
      console.log('🔔 Hay usuarios con rachas elegibles pero no se han enviado notificaciones recientes');
      console.log('   → Considera ejecutar manualmente: npx tsx scripts/smart-notifications.ts');
    }
    
    if (!isWithinHours) {
      console.log('⏰ Las notificaciones están pausadas por horario nocturno');
      console.log('   → Las notificaciones se reanudarán automáticamente a las 07:00');
    }
    
    if (usersWithStreaks.length === 0) {
      console.log('📈 No hay usuarios con rachas en el rango 3-7 días actualmente');
      console.log('   → Esto es normal, las notificaciones se activarán cuando haya usuarios elegibles');
    }

  } catch (error) {
    console.error('❌ Error verificando notificaciones de rachas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
checkStreakNotifications();