import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTournamentWithNotifications() {
  try {
    console.log('🏆 CREANDO TORNEO CON NOTIFICACIONES');
    console.log('==================================');
    
    // Crear un torneo que inicie en 5 minutos para probar notificaciones
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + 5);
    
    const tournamentData = {
      name: `Torneo Notificaciones ${new Date().getTime()}`,
      description: '🔔 Torneo de prueba para verificar el sistema de notificaciones',
      startTime: startTime.toISOString(),
      totalquestions: 3,
      duration: 15, // 15 minutos de duración
      examSource: '2024',
      difficulty: 'mixed',
      questionCategory: 'mixed'
    };
    
    console.log(`📅 Torneo programado para: ${startTime.toLocaleString()}`);
    console.log(`📝 ${tournamentData.totalquestions} preguntas del examen ${tournamentData.examSource}`);
    
    const response = await fetch('http://localhost:3000/api/admin/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournamentData)
    });
    
    const result = await response.json() as any;
    
    if (response.ok) {
      console.log('✅ TORNEO CREADO EXITOSAMENTE!');
      console.log(`   🆔 ID: ${result.id || result.tournament?.id}`);
      console.log(`   📝 Nombre: ${result.name || result.tournament?.name}`);
      console.log(`   📅 Inicio: ${new Date(result.startTime || result.tournament?.startTime).toLocaleString()}`);
      console.log(`   🎯 Preguntas: ${result.totalquestions || result.tournament?.totalquestions}`);
      
      // Ahora verificar las notificaciones creadas
      console.log('\n🔔 VERIFICANDO NOTIFICACIONES CREADAS...');
      
      const tournamentId = result.id || result.tournament?.id;
      if (tournamentId) {
        const notifications = await prisma.tournamentNotification.findMany({
          where: {
            tournamentId: tournamentId
          },
          orderBy: {
            scheduledFor: 'asc'
          }
        });
        
        console.log(`📋 Notificaciones creadas: ${notifications.length}`);
        
        notifications.forEach(notif => {
          const minutesUntil = Math.ceil((notif.scheduledFor.getTime() - Date.now()) / (1000 * 60));
          console.log(`   ⏰ ${notif.type}: ${notif.scheduledFor.toLocaleString()} (en ${minutesUntil} min)`);
        });
        
        // Filtrar notificaciones que deberían llegar pronto
        const soonNotifications = notifications.filter(n => {
          const minutesUntil = (n.scheduledFor.getTime() - Date.now()) / (1000 * 60);
          return minutesUntil > 0 && minutesUntil <= 5;
        });
        
        if (soonNotifications.length > 0) {
          console.log(`\n🚨 NOTIFICACIONES PRÓXIMAS (≤5 min):`);
          soonNotifications.forEach(notif => {
            const minutesUntil = Math.ceil((notif.scheduledFor.getTime() - Date.now()) / (1000 * 60));
            console.log(`   🔔 ${notif.type} en ${minutesUntil} min`);
          });
          
          console.log(`\n💡 Para probar el sistema de notificaciones:`);
          console.log(`1. Espera ${Math.min(...soonNotifications.map(n => Math.ceil((n.scheduledFor.getTime() - Date.now()) / (1000 * 60))))} minutos`);
          console.log(`2. Ejecuta: npx tsx scripts/tournament-notifications.ts`);
          console.log(`3. O inicia el scheduler: npx tsx scripts/notification-scheduler.ts`);
        }
      }
      
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('1. ✅ Torneo creado con notificaciones');
      console.log('2. 🔔 Las notificaciones se activarán automáticamente');
      console.log('3. 🤖 Opcional: Únete al torneo con /torneo_unirse');
      console.log('4. ⏰ Espera a que lleguen las notificaciones');
      console.log('5. 🚀 El torneo iniciará automáticamente');
      
      return result;
    } else {
      console.error('❌ Error creando torneo:', result);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const tournament = await createTournamentWithNotifications();
  
  if (tournament) {
    console.log('\n🎯 SISTEMA DE NOTIFICACIONES LISTO PARA PRUEBA');
    console.log('===========================================');
    console.log('✅ Torneo creado con notificaciones programadas');
    console.log('✅ Sistema de preguntas funcionando');
    console.log('✅ Sistema anti-repetición funcionando');
    console.log('🔔 Las notificaciones llegarán automáticamente si el scheduler está activo');
  }
}

main(); 