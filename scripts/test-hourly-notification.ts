// Script para probar el nuevo aviso de 1 hora antes
// Crea un torneo que inicie en 60 minutos y verifica las notificaciones

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testHourlyNotification() {
  try {
    console.log('🧪 PRUEBA DEL NUEVO AVISO DE 1 HORA ANTES');
    console.log('=========================================');
    
    // 1. Crear un torneo que inicie en 61 minutos (para que el aviso de 1h se active en 1 min)
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + 61);
    
    const tournamentData = {
      name: `PERMANENCIA 2025 - ${new Date().getTime()}`,
      description: '🕒 Torneo de prueba para verificar el aviso de 1 hora antes',
      scheduledDate: startTime,
      questionscount: 5,
      timelimit: 900, // 15 minutos
      status: 'SCHEDULED' as any,
      maxParticipants: 10,
      prizePool: 500
    };
    
    console.log(`📅 Creando torneo para: ${startTime.toLocaleString('es-ES')}`);
    console.log(`⏰ Esto significa que el aviso de 1 hora llegará en 1 minuto`);
    
    // Crear el torneo en la BD
    const tournament = await prisma.tournament.create({
      data: tournamentData
    });
    
    console.log(`✅ Torneo creado: "${tournament.name}"`);
    console.log(`🆔 ID: ${tournament.id}`);
    
    // 2. Crear las notificaciones manualmente con la función del API
    const notifications = [
      {
        type: 'REMINDER',
        minutesBefore: 1440, // 1 día antes
        message: '⏰ ¡TORNEO MAÑANA! Prepárate para la competición más emocionante'
      },
      {
        type: 'COUNTDOWN_60',
        minutesBefore: 60, // 1 hora antes
        message: '🕒 ¡TORNEO EN 1 HORA! Prepárate para la competición'
      },
      {
        type: 'COUNTDOWN_10',
        minutesBefore: 10,
        message: '🚨 ¡TORNEO EN 10 MINUTOS! Verifica que puedes recibir mensajes del bot'
      },
      {
        type: 'COUNTDOWN_5',
        minutesBefore: 5,
        message: '🔥 ¡TORNEO EN 5 MINUTOS! ¡Prepárate para la acción!'
      },
      {
        type: 'COUNTDOWN_3',
        minutesBefore: 3,
        message: '⚡ ¡ÚLTIMOS 3 MINUTOS! El torneo está a punto de comenzar'
      },
      {
        type: 'COUNTDOWN_1',
        minutesBefore: 1,
        message: '🏆 ¡1 MINUTO! El torneo comenzará muy pronto'
      }
    ];

    console.log('\\n🔔 Creando notificaciones...');
    
    for (const notification of notifications) {
      const scheduledFor = new Date(tournament.scheduledDate.getTime() - (notification.minutesBefore * 60 * 1000));
      
      // Solo crear notificaciones para fechas futuras
      if (scheduledFor > new Date()) {
        await prisma.tournamentNotification.create({
          data: {
            tournamentId: tournament.id,
            type: notification.type as any,
            scheduledFor,
            message: notification.message,
            status: 'pending'
          }
        });
        
        const minutesUntil = Math.ceil((scheduledFor.getTime() - Date.now()) / (1000 * 60));
        console.log(`   ✅ ${notification.type}: ${scheduledFor.toLocaleString('es-ES')} (en ${minutesUntil} min)`);
      } else {
        console.log(`   ⏭️ ${notification.type}: Fecha pasada, omitida`);
      }
    }
    
    // 3. Verificar cuándo llegarán las notificaciones
    console.log('\\n📊 CRONOGRAMA DE NOTIFICACIONES:');
    console.log('================================');
    
    const createdNotifications = await prisma.tournamentNotification.findMany({
      where: { tournamentId: tournament.id },
      orderBy: { scheduledFor: 'asc' }
    });
    
    createdNotifications.forEach(notif => {
      const now = Date.now();
      const scheduledTime = notif.scheduledFor.getTime();
      const minutesUntil = Math.ceil((scheduledTime - now) / (1000 * 60));
      const secondsUntil = Math.ceil((scheduledTime - now) / 1000);
      
      if (minutesUntil <= 0) {
        console.log(`🔔 ${notif.type}: ¡AHORA! (${Math.abs(secondsUntil)}s atrasado)`);
      } else if (minutesUntil <= 5) {
        console.log(`🔔 ${notif.type}: En ${secondsUntil} segundos`);
      } else {
        console.log(`⏰ ${notif.type}: En ${minutesUntil} minutos`);
      }
    });
    
    // 4. Mostrar instrucciones
    console.log('\\n💡 INSTRUCCIONES PARA LA PRUEBA:');
    console.log('=================================');
    console.log('1. 🕒 El aviso de "1 HORA ANTES" debería llegar en ~1 minuto');
    console.log('2. 🧪 Para verificar, ejecuta en 1 minuto:');
    console.log('   npx ts-node scripts/tournament-notifications.ts');
    console.log('3. 📱 Revisa el grupo de Telegram para ver si llegó el mensaje');
    console.log('4. 🔍 También puedes revisar el estado de las notificaciones');
    
    // 5. Encontrar la próxima notificación
    const nextNotification = createdNotifications.find(n => n.scheduledFor > new Date());
    if (nextNotification) {
      const minutesUntil = Math.ceil((nextNotification.scheduledFor.getTime() - Date.now()) / (1000 * 60));
      console.log(`\\n🎯 PRÓXIMA NOTIFICACIÓN:`);
      console.log(`   🔔 Tipo: ${nextNotification.type}`);
      console.log(`   ⏰ Hora: ${nextNotification.scheduledFor.toLocaleString('es-ES')}`);
      console.log(`   ⏱️  En: ${minutesUntil} minuto(s)`);
      
      if (nextNotification.type === 'COUNTDOWN_60' as any) {
        console.log(`\\n🎉 ¡PERFECTO! La próxima notificación es el nuevo aviso de 1 hora.`);
        console.log(`   Debería llegar en aproximadamente ${minutesUntil} minuto(s).`);
      }
    }
    
    return tournament;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const tournament = await testHourlyNotification();
  
  if (tournament) {
    console.log('\\n✅ PRUEBA CONFIGURADA EXITOSAMENTE');
    console.log('===================================');
    console.log('🎯 El sistema está listo para probar el nuevo aviso de 1 hora antes');
    console.log('🔔 Espera aproximadamente 1 minuto y ejecuta el procesador de notificaciones');
    console.log('📱 El mensaje debería aparecer en el grupo de Telegram');
  }
}

main(); 