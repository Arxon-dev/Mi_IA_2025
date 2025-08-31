import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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

// Función para anunciar un nuevo torneo
async function announceTournament(tournament: any): Promise<boolean> {
  try {
    const maxParticipants = tournament.maxparticipants || 50;
    
    // Obtener participantes por separado
    const participants = await prisma.tournamentparticipant.findMany({
      where: {
        tournamentid: tournament.id
      }
    });
    
    const currentParticipants = participants.length;
    const availableSpots = maxParticipants - currentParticipants;
    
    // Calcular tiempo hasta el torneo
    const timeUntilTournament = tournament.scheduleddate.getTime() - Date.now();
    const hoursUntilTournament = Math.ceil(timeUntilTournament / (1000 * 60 * 60));
    const daysUntilTournament = Math.ceil(timeUntilTournament / (1000 * 60 * 60 * 24));
    
    let timeDescription = '';
    if (daysUntilTournament > 1) {
      timeDescription = `En ${daysUntilTournament} días`;
    } else if (hoursUntilTournament > 1) {
      timeDescription = `En ${hoursUntilTournament} horas`;
    } else {
      timeDescription = 'Muy pronto';
    }
    
    // Calcular duración estimada del torneo
    const estimatedDuration = Math.ceil((tournament.questionscount || 25) * 1.5); // 1.5 min por pregunta aprox
    
    const message = `🎪 ¡NUEVO TORNEO DISPONIBLE! 🎪

🏆 <b>${tournament.name} #${tournament.id}</b>
📅 ${tournament.scheduleddate.toLocaleDateString('es-ES')} a las ${tournament.scheduleddate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
⏰ ${timeDescription}
📝 ${tournament.questionscount || 25} preguntas de exámenes oficiales | ⏱️ ~${estimatedDuration} min | 💰 ${tournament.prizepool || 1000} pts
👥 Cupos: ${currentParticipants}/${maxParticipants} (¡${availableSpots} disponibles!)

🎓 <b>PREGUNTAS REALES:</b> Todas las preguntas provienen de exámenes oficiales de años anteriores

🚀 <b>ÚNETE AHORA:</b>
• <code>/torneo_unirse ${tournament.id}</code> - Reservar tu lugar
• <code>/torneos</code> - Ver detalles completos
• <code>/torneo_historial</code> - Tu rendimiento

💡 <b>BENEFICIOS DE PARTICIPAR:</b>
• Los torneos dan puntos extras
• Mejoran tu ranking semanal
• Competición en tiempo real
• Experiencia de examen oficial con preguntas reales

🎯 <b>¿POR QUÉ PARTICIPAR?</b>
• Práctica bajo presión con preguntas oficiales
• Competir contra los mejores
• Premios en puntos garantizados
• Diversión y motivación extra

⏰ <b>IMPORTANTE:</b> Inscripciones cierran 1 hora antes del inicio

🔥 ¡No te quedes sin tu lugar!`;

    const sent = await sendTelegramMessage(message);
    
    if (sent) {
      console.log(`✅ Anuncio de nuevo torneo enviado: ${tournament.name} #${tournament.id}`);
      
      // Opcional: Registrar el anuncio en la base de datos
      try {
        await prisma.tournamentnotification.create({
          data: {
            id: require('crypto').randomUUID(),
            tournamentid: tournament.id,
            type: 'ANNOUNCEMENT',
            scheduledfor: new Date(),
            sentat: new Date(),
            status: 'sent',
            recipientcount: 1,
            message: 'Anuncio de nuevo torneo'
          }
        });
      } catch (dbError) {
        console.log('⚠️ No se pudo registrar el anuncio en BD, pero el mensaje se envió correctamente');
      }
      
      return true;
    } else {
      console.log(`❌ Error enviando anuncio de nuevo torneo: ${tournament.name}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error anunciando torneo ${tournament.id}:`, error);
    return false;
  }
}

// Función para anunciar torneos que cierran inscripciones pronto
async function announceRegistrationClosing(tournament: any): Promise<boolean> {
  try {
    const maxParticipants = tournament.maxparticipants || 50;
    
    // Obtener participantes por separado
    const participants = await prisma.tournamentparticipant.findMany({
      where: {
        tournamentid: tournament.id
      }
    });
    
    const currentParticipants = participants.length;
    const availableSpots = maxParticipants - currentParticipants;
    
    // Solo anunciar si hay cupos disponibles
    if (availableSpots <= 0) {
      return false;
    }
    
    const message = `⏰ ¡INSCRIPCIONES CERRANDO PRONTO! ⏰

🏆 <b>${tournament.name} #${tournament.id}</b>
🕐 Torneo en 2 horas
👥 ${currentParticipants}/${maxParticipants} participantes (¡${availableSpots} cupos restantes!)
💰 ${tournament.prizepool || 1000} puntos en juego

🎓 <b>PREGUNTAS DE EXÁMENES OFICIALES:</b> Enfrentarás preguntas reales de años anteriores

🚨 <b>¡ÚLTIMOS CUPOS DISPONIBLES!</b>
• <code>/torneo_unirse ${tournament.id}</code> - ¡Inscríbete ahora!
• <code>/torneos</code> - Ver detalles del torneo

⚠️ <b>CIERRE DE INSCRIPCIONES:</b> En 1 hora
🎯 Los torneos populares se llenan rápido

💡 <b>¿AÚN NO TE HAS INSCRITO?</b>
¡Esta puede ser tu oportunidad de brillar con preguntas reales!`;

    const sent = await sendTelegramMessage(message);
    
    if (sent) {
      console.log(`✅ Anuncio de cierre de inscripciones enviado: ${tournament.name} #${tournament.id}`);
      return true;
    } else {
      console.log(`❌ Error enviando anuncio de cierre: ${tournament.name}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error anunciando cierre de inscripciones ${tournament.id}:`, error);
    return false;
  }
}

// Función para procesar anuncios automáticos
async function processAutomaticAnnouncements(): Promise<void> {
  try {
    console.log('📢 Procesando anuncios automáticos de torneos...');
    
    const now = new Date();
    const in2Hours = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    
    // Buscar torneos que empiezan en 2 horas y tienen cupos disponibles
    const tournamentsClosingSoon = await prisma.tournament.findMany({
      where: {
        scheduleddate: {
          gte: now,
          lte: in2Hours
        },
        status: 'scheduled'
      }
    });

    console.log(`📋 ${tournamentsClosingSoon.length} torneo(s) cerrando inscripciones pronto`);

    for (const tournament of tournamentsClosingSoon) {
      const maxParticipants = tournament.maxparticipants || 50;
      
      // Obtener participantes por separado
      const participants = await prisma.tournamentparticipant.findMany({
        where: {
          tournamentid: tournament.id
        }
      });
      
      const currentParticipants = participants.length;
      const availableSpots = maxParticipants - currentParticipants;
      
      // Solo anunciar si hay cupos disponibles
      if (availableSpots > 0) {
        await announceRegistrationClosing(tournament);
        
        // Pausa entre anuncios
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

  } catch (error) {
    console.error('❌ Error procesando anuncios automáticos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exportar funciones
export {
  announceTournament,
  announceRegistrationClosing,
  processAutomaticAnnouncements
};

// Ejecutar si se llama directamente
if (require.main === module) {
  processAutomaticAnnouncements();
}