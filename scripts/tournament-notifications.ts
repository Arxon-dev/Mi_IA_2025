import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002519334308';

// Función para enviar mensaje a Telegram
async function sendTelegramMessage(message: string): Promise<boolean> {
  try {
    const https = require('https');
    const querystring = require('querystring');
    
    const postData = querystring.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result.ok === true);
          } catch {
            resolve(false);
          }
        });
      });

      req.on('error', () => resolve(false));
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('❌ Error enviando mensaje a Telegram:', error);
    return false;
  }
}

// Función para enviar notificación a participantes del torneo
async function sendTournamentNotification(notification: any): Promise<boolean> {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: notification.tournamentid }
    });

    if (!tournament) {
      console.log(`⚠️ Torneo ${notification.tournamentid} no encontrado`);
      return false;
    }

    // Obtener participantes por separado para evitar include
    const participants = await prisma.tournamentparticipant.findMany({
      where: { tournamentid: tournament.id }
    });

    const participantCount = participants.length;
    const timeUntilStart = tournament.scheduleddate.getTime() - Date.now();
    const minutesUntilStart = Math.ceil(timeUntilStart / (1000 * 60));

    // Verificar cupos disponibles
    const maxParticipants = tournament.maxparticipants || 50; // Default si no está definido
    const availableSpots = maxParticipants - participantCount;
    const hasAvailableSpots = availableSpots > 0;

    // Construir mensaje personalizado según el tipo de notificación
    let finalMessage = '';
    
    switch (notification.type) {
      case 'REMINDER':
        finalMessage = `⏰ <b>¡TORNEO MAÑANA!</b> ⏰

🏆 <b>${tournament.name} #${tournament.id}</b>
📅 ${tournament.scheduleddate.toLocaleString('es-ES')}
👥 ${participantCount}/${maxParticipants} participantes ${hasAvailableSpots ? `(¡${availableSpots} cupos disponibles!)` : '(COMPLETO)'}
📝 ${tournament.questionscount} preguntas de exámenes oficiales | 💰 ${tournament.prizepool} puntos en juego

🎓 <b>PREGUNTAS REALES:</b> Todas las preguntas provienen de exámenes oficiales de años anteriores

${hasAvailableSpots ? 
  `🚀 <b>¿QUIERES PARTICIPAR?</b>
  • <code>/torneo_unirse ${tournament.id}</code> - ¡Reservar tu lugar!
  • <code>/torneos</code> - Ver detalles completos
  • <code>/torneo_historial</code> - Tu rendimiento
  
  💡 <b>BENEFICIOS:</b>
  • Los torneos dan puntos extras
  • Mejoran tu ranking semanal
  • Competición en tiempo real con preguntas reales
  
  ⏰ Inscripciones cierran 1 hora antes` :
  `🏆 <b>TORNEO COMPLETO</b>
  • <code>/torneos</code> - Ver próximos torneos disponibles
  • <code>/torneo_historial</code> - Tu rendimiento histórico`
}

💡 <b>PREPARATIVOS:</b>
• Verifica que puedes recibir mensajes del bot
• El torneo se ejecuta 100% por privado
• ¡Sé puntual! Empieza exactamente a la hora

🎯 ¡Que gane el mejor!`;
        break;

      case 'COUNTDOWN_60':
        finalMessage = `🕒 <b>¡TORNEO EN 1 HORA!</b> 🕒

🏆 <b>${tournament.name} #${tournament.id}</b>
📅 ${tournament.scheduleddate.toLocaleString('es-ES')}
👥 ${participantCount}/${maxParticipants} participantes ${hasAvailableSpots ? `(¡${availableSpots} cupos restantes!)` : '(COMPLETO)'}

🎓 <b>PREGUNTAS DE EXÁMENES OFICIALES:</b> Enfrentarás preguntas reales de años anteriores

${hasAvailableSpots ? 
  `🚨 <b>¡ÚLTIMA OPORTUNIDAD!</b>
  • <code>/torneo_unirse ${tournament.id}</code> - ¡Únete ahora!
  • <code>/torneos</code> - Ver detalles del torneo
  
  ⚠️ <b>¡Solo 1 hora para inscribirte!</b>` :
  `🏆 <b>TORNEO COMPLETO</b>
  • <code>/torneo_historial</code> - Ver tu historial
  • <code>/torneos</code> - Próximos torneos`
}

⏰ <b>PREPARACIÓN FINAL:</b>
• El torneo comenzará en exactamente 1 hora
• Verifica tu dispositivo y conexión
• Ten preparado un lugar tranquilo
• ¡Recuerda que cada segundo cuenta!

🎯 ¡La hora de la verdad se acerca!`;
        break;

      case 'COUNTDOWN_10':
        finalMessage = `🚨 <b>¡TORNEO EN 10 MINUTOS!</b> 🚨

🏆 <b>${tournament.name} #${tournament.id}</b>
⏰ Inicio: ${tournament.scheduleddate.toLocaleTimeString('es-ES')}
👥 ${participantCount}/${maxParticipants} participantes ${hasAvailableSpots ? `(¡${availableSpots} cupos disponibles!)` : '(COMPLETO)'}
📝 ${tournament.questionscount} preguntas de exámenes oficiales | 💰 ${tournament.prizepool} puntos en juego

🎓 <b>PREGUNTAS REALES:</b> Te enfrentarás a preguntas de exámenes oficiales de años anteriores

${hasAvailableSpots ? 
  `🚀 <b>¿QUIERES PARTICIPAR?</b>
  • <code>/torneo_unirse ${tournament.id}</code> - ¡Únete ahora!
  • <code>/torneos</code> - Ver todos los torneos
  • <code>/torneo_historial</code> - Tu historial
  
  ⚠️ <b>¡Últimos minutos para unirse!</b>` :
  `🏆 <b>TORNEO COMPLETO</b>
  • <code>/torneos</code> - Ver próximos torneos disponibles
  • <code>/torneo_historial</code> - Tu rendimiento histórico`
}

📱 <b>ÚLTIMO MOMENTO:</b>
• Verifica que puedes recibir mensajes del bot
• La primera pregunta se enviará automáticamente
• Responde rápido para bonus de velocidad

💡 <b>TIP:</b> Los torneos dan puntos extras y mejoran tu ranking
¡Prepárate! 🔥`;
        break;

      case 'TOURNAMENT_START':
        finalMessage = `🚀 <b>¡TORNEO INICIADO!</b> 🚀

🏆 <b>${tournament.name} #${tournament.id}</b>
📝 Las preguntas de exámenes oficiales están siendo enviadas por privado
👥 ${participantCount} participantes compitiendo
💰 ${tournament.prizepool} puntos en juego

🎓 <b>PREGUNTAS REALES:</b> Todas las preguntas provienen de exámenes oficiales de años anteriores

⚡ <b>¡LA COMPETICIÓN HA COMENZADO!</b>

📊 <b>DURANTE EL TORNEO:</b>
• <code>/mi_stats</code> - Ver tus estadísticas
• <code>/ranking</code> - Tu posición actual
• <code>/torneos</code> - Información del torneo

💡 <b>RECUERDA:</b> Responde rápido para bonus de velocidad
🏆 ¡Buena suerte a todos!`;
        break;

      default:
        finalMessage = notification.message || '🏆 Notificación de torneo';
    }

    // Enviar al grupo
    const sent = await sendTelegramMessage(finalMessage);
    
    if (sent) {
      console.log(`✅ Notificación ${notification.type} enviada para torneo ${tournament.name}`);
      return true;
    } else {
      console.log(`❌ Error enviando notificación ${notification.type} para torneo ${tournament.name}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error procesando notificación ${notification.id}:`, error);
    return false;
  }
}

// Función principal para procesar notificaciones pendientes
async function processTournamentNotifications() {
  try {
    console.log('🔔 Procesando notificaciones de torneos...');
    
    const now = new Date();
    
    // Buscar notificaciones pendientes que ya deberían haberse enviado
    const pendingNotifications = await prisma.tournamentnotification.findMany({
      where: {
        status: 'pending',
        scheduledfor: {
          lte: now
        }
      },
      orderBy: {
        scheduledfor: 'asc'
      }
    });

    if (pendingNotifications.length === 0) {
      console.log('📭 No hay notificaciones pendientes');
      return;
    }

    console.log(`📬 Procesando ${pendingNotifications.length} notificación(es)...`);

    let successCount = 0;
    let errorCount = 0;

    for (const notification of pendingNotifications) {
      const sent = await sendTournamentNotification(notification);
      
      // Actualizar estado de la notificación
      await prisma.tournamentnotification.update({
        where: { id: notification.id },
        data: {
          status: sent ? 'sent' : 'failed',
          sentat: sent ? new Date() : undefined,
          recipientcount: sent ? 1 : 0
        }
      });

      if (sent) {
        successCount++;
      } else {
        errorCount++;
      }

      // Pausa pequeña entre notificaciones para no sobrecargar Telegram
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`📊 Resultado: ${successCount} enviadas, ${errorCount} errores`);

  } catch (error) {
    console.error('❌ Error general procesando notificaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  processTournamentNotifications();
}

export default processTournamentNotifications;