import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTournamentNotificationSystem() {
  try {
    console.log('🧪 PRUEBA DEL SISTEMA DE NOTIFICACIONES DE TORNEOS');
    console.log('================================================');
    
    // 1. Verificar torneos existentes
    console.log('\n1️⃣ Verificando torneos existentes...');
    const tournaments = await prisma.tournament.findMany({
      include: {
        participants: true,
        notifications: true
      }
    });
    
    console.log(`📊 Torneos encontrados: ${tournaments.length}`);
    
    tournaments.forEach(tournament => {
      console.log(`🏆 ${tournament.name}`);
      console.log(`   📅 ${tournament.scheduledDate.toLocaleString('es-ES')}`);
      console.log(`   👥 ${tournament.participants.length} participantes`);
      console.log(`   🔔 ${tournament.notifications.length} notificaciones programadas`);
      
      tournament.notifications.forEach(notif => {
        const status = notif.status === 'pending' ? '⏳' : notif.status === 'sent' ? '✅' : '❌';
        console.log(`      ${status} ${notif.type} - ${notif.scheduledFor.toLocaleString('es-ES')}`);
      });
      console.log('');
    });
    
    // 2. Verificar notificaciones pendientes
    console.log('\n2️⃣ Verificando notificaciones pendientes...');
    const now = new Date();
    const pendingNotifications = await prisma.tournamentNotification.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        tournament: true
      }
    });
    
    console.log(`📬 Notificaciones pendientes para procesar: ${pendingNotifications.length}`);
    
    pendingNotifications.forEach(notif => {
      const minutesAgo = Math.floor((now.getTime() - notif.scheduledFor.getTime()) / (1000 * 60));
      console.log(`🔔 ${notif.type} para "${notif.tournament.name}" (hace ${minutesAgo} min)`);
    });
    
    // 3. Verificar próximas notificaciones
    console.log('\n3️⃣ Verificando próximas notificaciones...');
    const upcomingNotifications = await prisma.tournamentNotification.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          gt: now
        }
      },
      include: {
        tournament: true
      },
      orderBy: {
        scheduledFor: 'asc'
      },
      take: 5
    });
    
    console.log(`📅 Próximas notificaciones: ${upcomingNotifications.length}`);
    
    upcomingNotifications.forEach(notif => {
      const minutesUntil = Math.ceil((notif.scheduledFor.getTime() - now.getTime()) / (1000 * 60));
      console.log(`⏰ ${notif.type} para "${notif.tournament.name}" en ${minutesUntil} min`);
    });
    
    // 4. Verificar torneos próximos
    console.log('\n4️⃣ Verificando torneos próximos...');
    const upcomingTournaments = await prisma.tournament.findMany({
      where: {
        scheduledDate: {
          gt: now
        },
        status: 'SCHEDULED'
      },
      orderBy: {
        scheduledDate: 'asc'
      },
      take: 3
    });
    
    console.log(`🏆 Torneos próximos: ${upcomingTournaments.length}`);
    
    upcomingTournaments.forEach(tournament => {
      const minutesUntil = Math.ceil((tournament.scheduledDate.getTime() - now.getTime()) / (1000 * 60));
      const hoursUntil = Math.ceil(minutesUntil / 60);
      const timeText = hoursUntil > 1 ? `${hoursUntil}h` : `${minutesUntil}min`;
      console.log(`⏰ "${tournament.name}" en ${timeText}`);
    });
    
    console.log('\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testTournamentNotificationSystem();
}

export default testTournamentNotificationSystem; 