import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

interface PromotionalMessage {
  id: string;
  title: string;
  message: string;
  targetUsers: 'free' | 'basic' | 'all_non_premium';
}

const PROMOTIONAL_MESSAGES: PromotionalMessage[] = [
  {
    id: 'morning_basic_benefits',
    title: 'Buenos días - Beneficios Plan Básico',
    message: `🌅 <b>¡Buenos días, futuro permanente!</b> 🌅

¿Sabías que con el <b>Plan Básico (€4.99/mes)</b> puedes:

✅ <b>100 preguntas diarias</b> en chat privado
✅ <b>Sistema de preguntas falladas</b> - Repasa solo lo que necesitas
✅ <b>Estadísticas básicas</b> - Sigue tu progreso
✅ <b>Sin límites en el canal público</b>

🎯 <b>¡Perfecto para preparar tu permanencia!</b>

💡 Usa /basico para suscribirte
📊 Usa /planes para ver todos los planes`,
    targetUsers: 'free'
  },
  {
    id: 'evening_premium_benefits',
    title: 'Buenas tardes - Beneficios Plan Premium',
    message: `🌆 <b>¡Buenas tardes!</b> 🌆

¿Quieres llevar tu preparación al siguiente nivel?

🥈 <b>Plan Premium (€9.99/mes)</b> incluye:

🚀 <b>Preguntas ILIMITADAS</b> en privado
🧠 <b>Análisis con IA</b> de tus respuestas
📊 <b>Estadísticas avanzadas</b> y predicciones
🎯 <b>Simulacros personalizados</b>
🔗 <b>Integración con Moodle</b>
✅ <b>Todo del plan básico incluido</b>

💪 <b>¡La preparación más completa para tu permanencia!</b>

🚀 Usa /premium para suscribirte
📋 Usa /planes para comparar todos los planes`,
    targetUsers: 'all_non_premium'
  },
  {
    id: 'morning_upgrade_basic',
    title: 'Buenos días - Upgrade desde Básico',
    message: `🌅 <b>¡Buenos días!</b> 🌅

¿Estás aprovechando al máximo tu Plan Básico?

🚀 <b>Actualiza a Premium</b> y obtén:

🧠 <b>Análisis con IA</b> - Identifica tus puntos débiles
📊 <b>Estadísticas avanzadas</b> - Predicciones de éxito
🎯 <b>Simulacros personalizados</b> - Practica como en el examen real
🔗 <b>Integración Moodle</b> - Sincroniza tu progreso
🚀 <b>Preguntas ILIMITADAS</b>

💡 Solo €5 más al mes para la preparación más completa

⬆️ Usa /premium para actualizar`,
    targetUsers: 'basic'
  },
  {
    id: 'evening_failed_questions',
    title: 'Buenas tardes - Sistema de Falladas',
    message: `🌆 <b>¡Buenas tardes!</b> 🌆

¿Tienes preguntas que siempre se te resisten?

🎯 <b>El sistema de preguntas falladas</b> es tu solución:

✅ <b>Repasa solo lo que fallas</b>
✅ <b>Comandos específicos</b>: /falladas5, /falladas10, /falladas15
✅ <b>Por materias</b>: /constitucion_falladas, /pdc_falladas
✅ <b>Progreso medible</b> - Ve cómo mejoras

💪 <b>Convierte tus debilidades en fortalezas</b>

🥉 Disponible desde el Plan Básico (€4.99/mes)

📚 Usa /basico para acceder al sistema de falladas
💡 Usa /planes para ver todos los beneficios`,
    targetUsers: 'free'
  }
];

async function sendNotificationToUser(userId: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json() as any;
    return result.ok;
  } catch (error) {
    console.error(`Error enviando notificación a usuario ${userId}:`, error);
    return false;
  }
}

async function getTargetUsers(targetType: 'free' | 'basic' | 'all_non_premium'): Promise<string[]> {
  try {
    let users: any[] = [];

    switch (targetType) {
      case 'free':
        // Usuarios sin suscripción activa
        users = await prisma.$queryRaw`
          SELECT DISTINCT tu.telegramuserid
          FROM telegramuser tu
          LEFT JOIN usersubscription us ON tu.id = us.userid AND us.status = 'active'
          WHERE us.id IS NULL
            AND tu.telegramuserid IS NOT NULL
            AND tu.lastactivity >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
        break;

      case 'basic':
        // Usuarios con plan básico activo
        users = await prisma.$queryRaw`
          SELECT DISTINCT tu.telegramuserid
          FROM telegramuser tu
          JOIN usersubscription us ON tu.id = us.userid
          JOIN subscriptionplan sp ON us.planid = sp.id
          WHERE us.status = 'active'
            AND sp.name = 'basic'
            AND tu.telegramuserid IS NOT NULL
        `;
        break;

      case 'all_non_premium':
        // Usuarios sin premium (gratuitos + básicos)
        users = await prisma.$queryRaw`
          SELECT DISTINCT tu.telegramuserid
          FROM telegramuser tu
          LEFT JOIN usersubscription us ON tu.id = us.userid AND us.status = 'active'
          LEFT JOIN subscriptionplan sp ON us.planid = sp.id
          WHERE (us.id IS NULL OR sp.name != 'premium')
            AND tu.telegramuserid IS NOT NULL
            AND tu.lastactivity >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
        break;
    }

    return users.map(user => user.telegramuserid);
  } catch (error) {
    console.error('Error obteniendo usuarios objetivo:', error);
    return [];
  }
}

async function logPromotionalNotification(messageId: string, success: boolean, userCount: number): Promise<void> {
  try {
    await prisma.telegramsendlog.create({
      data: {
        id: `promo_log_${Date.now()}`, // Generate unique ID for log entry
        questionid: `promo_${messageId}`,
        sourcemodel: 'promotional_notification',
        success,
        telegrammsgid: success ? `promo_${Date.now()}` : null
      }
    });
    
    console.log(`📊 Notificación promocional registrada: ${messageId} - ${userCount} usuarios - ${success ? 'Éxito' : 'Error'}`);
  } catch (error) {
    console.error('Error registrando notificación promocional:', error);
  }
}

export async function sendPromotionalNotifications(timeSlot: 'morning' | 'evening'): Promise<void> {
  console.log(`🔔 NOTIFICACIONES PROMOCIONALES - ${timeSlot.toUpperCase()}`);
  console.log('='.repeat(50));
  
  try {
    // Filtrar mensajes por horario
    const timeMessages = PROMOTIONAL_MESSAGES.filter(msg => 
      timeSlot === 'morning' ? msg.id.includes('morning') : msg.id.includes('evening')
    );
    
    if (timeMessages.length === 0) {
      console.log(`⚠️ No hay mensajes configurados para ${timeSlot}`);
      return;
    }
    
    for (const promoMessage of timeMessages) {
      console.log(`\n📤 Enviando: ${promoMessage.title}`);
      console.log(`🎯 Objetivo: ${promoMessage.targetUsers}`);
      
      // Obtener usuarios objetivo
      const targetUsers = await getTargetUsers(promoMessage.targetUsers);
      
      if (targetUsers.length === 0) {
        console.log(`⚠️ No hay usuarios objetivo para ${promoMessage.targetUsers}`);
        await logPromotionalNotification(promoMessage.id, false, 0);
        continue;
      }
      
      console.log(`👥 Enviando a ${targetUsers.length} usuarios...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Enviar a cada usuario con delay para evitar rate limiting
      for (const userId of targetUsers) {
        const success = await sendNotificationToUser(userId, promoMessage.message);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Delay de 100ms entre envíos para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Enviados: ${successCount}`);
      console.log(`❌ Errores: ${errorCount}`);
      
      // Registrar en logs
      await logPromotionalNotification(
        promoMessage.id, 
        successCount > 0, 
        targetUsers.length
      );
    }
    
    console.log(`\n🎉 Notificaciones promocionales ${timeSlot} completadas`);
    
  } catch (error) {
    console.error('❌ Error en notificaciones promocionales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const timeSlot = process.argv[2] as 'morning' | 'evening' || 'morning';
  sendPromotionalNotifications(timeSlot);
}