import { prisma } from '@/lib/prisma';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

// Función para enviar mensaje privado
async function sendPrivateMessage(telegramuserid: string, message: string): Promise<boolean> {
  try {
    const https = require('https');
    const querystring = require('querystring');
    
    const postData = querystring.stringify({
      chat_id: telegramuserid,
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
    console.error('❌ Error enviando mensaje privado:', error);
    return false;
  }
}

// Función para enviar recordatorio de duelo expirando
async function sendDuelExpirationReminder(duel: any): Promise<boolean> {
  try {
    const timeLeft = Math.max(0, Math.ceil((duel.expiresat.getTime() - Date.now()) / (1000 * 60)));
    
    if (timeLeft <= 0) {
      console.log(`⚠️ Duelo ${duel.id} ya expiró`);
      return false;
    }
    
    const message = `⏰ ¡DUELO EXPIRANDO EN ${timeLeft} MIN! ⏰

⚔️ Duelo pendiente con <b>${duel.challenger.firstname}</b>
💰 ${duel.stake} puntos en juego | 📝 ${duel.questionscount} preguntas

⚡ <b>ACTÚA AHORA:</b>
• <code>/aceptar ${duel.id}</code> - Aceptar duelo
• <code>/rechazar ${duel.id}</code> - Rechazar duelo
• <code>/duelos</code> - Ver detalles completos

⚠️ Si no respondes, el duelo expirará automáticamente
🎯 Los duelos ganados suman puntos extra a tu ranking`;

    return await sendPrivateMessage(duel.challenged.telegramuserid, message);

  } catch (error) {
    console.error(`❌ Error recordatorio duelo ${duel.id}:`, error);
    return false;
  }
}

// Función para enviar recordatorio a duelos pendientes hace tiempo
async function sendStaleResponseReminder(duel: any): Promise<boolean> {
  try {
    const minutesSinceCreated = Math.ceil((Date.now() - duel.createdAt.getTime()) / (1000 * 60));
    const timeLeft = Math.max(0, Math.ceil((duel.expiresAt.getTime() - Date.now()) / (1000 * 60)));
    
    const message = `🤔 ¿OLVIDASTE RESPONDER UN DUELO? 🤔

⚔️ <b>${duel.challenger.firstname || duel.challenger.username}</b> te retó hace ${minutesSinceCreated} minutos
⏰ El duelo expira en ${timeLeft} minutos

📋 <b>DETALLES RÁPIDOS:</b>
💰 ${duel.stake || 0} pts | 📝 ${duel.questionscount || 5} preguntas | ⏱️ ${Math.floor((duel.timelimit || 300) / 60)} min

⚡ <b>RESPUESTA RÁPIDA:</b>
• <code>/aceptar ${duel.id}</code> - ¡Acepto el desafío!
• <code>/rechazar ${duel.id}</code> - No puedo ahora

🎯 <b>CONSEJO:</b> Los duelos son geniales para:
• Mantener la mente ágil
• Competir sanamente
• Ganar puntos extra
• Practicar bajo presión

💭 <b>¿Te animas?</b> Es solo unos minutos de diversión`;

    const sent = await sendPrivateMessage(duel.challenged.telegramuserid, message);
    
    if (sent) {
      console.log(`✅ Recordatorio de respuesta tardía enviado para duelo ${duel.id}`);
      return true;
    } else {
      console.log(`❌ Error enviando recordatorio de respuesta tardía ${duel.id}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error creando recordatorio de respuesta tardía para duelo ${duel.id}:`, error);
    return false;
  }
}

// Función principal para procesar recordatorios de duelos
async function processDuelReminders(): Promise<void> {
  try {
    console.log('⏰ Procesando recordatorios de duelos...');
    
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + (15 * 60 * 1000));
    const in20Minutes = new Date(now.getTime() + (20 * 60 * 1000));
    
    // Buscar duelos que expiran en 15 minutos (recordatorio crítico)
    const duelsWith15MinLeft = await prisma.duel.findMany({
      where: {
        status: 'pending',
        expiresat: {
          gte: now,
          lte: in15Minutes
        }
      },
      include: {
        challenger: true,
        challenged: true
      }
    });

    console.log(`📬 ${duelsWith15MinLeft.length} duelo(s) expirando en 15 minutos`);

    // Procesar recordatorios críticos (15 min)
    for (const duel of duelsWith15MinLeft) {
      const sent = await sendDuelExpirationReminder(duel);
      
      if (sent) {
        console.log(`✅ Recordatorio enviado para duelo ${duel.id}`);
      }
      
      // Pausa entre recordatorios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Buscar duelos sin respuesta hace más de 10 minutos (recordatorio suave)
    const staleResponseDuels = await prisma.duel.findMany({
      where: {
        status: 'pending',
        createdat: {
          lt: new Date(now.getTime() - (10 * 60 * 1000)) // Creado hace más de 10 min
        },
        expiresat: {
          gte: in20Minutes // Pero aún quedan más de 20 min
        }
      },
      include: {
        challenger: true,
        challenged: true
      }
    });

    console.log(`🤔 ${staleResponseDuels.length} duelo(s) sin respuesta hace tiempo`);

    // Procesar recordatorios de respuesta tardía
    for (const duel of staleResponseDuels) {
      const sent = await sendStaleResponseReminder(duel);
      
      if (sent) {
        console.log(`✅ Recordatorio de respuesta tardía enviado para duelo ${duel.id}`);
      }
      
      // Pausa entre recordatorios
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const totalProcessed = duelsWith15MinLeft.length + staleResponseDuels.length;
    console.log(`📊 Recordatorios procesados: ${totalProcessed} total`);

  } catch (error) {
    console.error('❌ Error procesando recordatorios de duelos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para limpiar duelos expirados
async function cleanupExpiredDuels(): Promise<number> {
  try {
    console.log('🧹 Limpiando duelos expirados...');
    
    const now = new Date();
    
    // Buscar duelos expirados que aún están pendientes
    const expiredDuels = await prisma.duel.findMany({
      where: {
        status: 'pending',
        expiresat: {
          lt: now
        }
      }
    });

    console.log(`⏰ ${expiredDuels.length} duelo(s) expirados encontrados`);

    if (expiredDuels.length > 0) {
      // Marcar como expirados
      const updated = await prisma.duel.updateMany({
        where: {
          status: 'pending',
          expiresat: {
            lt: now
          }
        },
        data: {
          status: 'expired',
          completedat: now
        }
      });

      console.log(`✅ ${updated.count} duelo(s) marcados como expirados`);
      return updated.count;
    }

    return 0;

  } catch (error) {
    console.error('❌ Error limpiando duelos expirados:', error);
    return 0;
  }
}

// Función para estadísticas de recordatorios
async function getDuelReminderStats(): Promise<any> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const stats = {
      pendingDuels: await prisma.duel.count({
        where: { status: 'pending' }
      }),
      expiringSoon: await prisma.duel.count({
        where: {
          status: 'pending',
          expiresat: {
            gte: now,
            lte: new Date(now.getTime() + (30 * 60 * 1000))
          }
        }
      }),
      expiredToday: await prisma.duel.count({
        where: {
          status: 'expired',
          completedat: {
            gte: oneDayAgo
          }
        }
      }),
      needingReminders: await prisma.duel.count({
        where: {
          status: 'pending'
        }
      })
    };

    return stats;

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de recordatorios:', error);
    return null;
  }
}

// Exportar funciones
export {
  sendDuelExpirationReminder,
  sendStaleResponseReminder,
  processDuelReminders,
  cleanupExpiredDuels,
  getDuelReminderStats
};

// Ejecutar si se llama directamente
if (require.main === module) {
  console.log('🚀 Iniciando procesamiento de recordatorios de duelos...');
  
  // Procesar recordatorios y limpiar expirados
  Promise.all([
    processDuelReminders(),
    cleanupExpiredDuels()
  ]).then(([, cleanedCount]) => {
    console.log(`✅ Recordatorios procesados y ${cleanedCount} duelos expirados limpiados`);
  }).catch(error => {
    console.error('❌ Error en procesamiento:', error);
  });
}