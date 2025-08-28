import { prisma } from '@/lib/prisma';
import { SubscriptionService } from './subscriptionService';

// ==========================================
// 📧 SISTEMA DE NOTIFICACIONES DE SUSCRIPCIÓN (FASE 2)
// ==========================================

export class SubscriptionNotificationService {
  
  // 🔔 Enviar recordatorio de renovación (7 días antes)
  static async sendRenewalReminder(userid: string): Promise<boolean> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid }
      });

      if (!user) return false;

      const subscription = await SubscriptionService.getCurrentSubscription(userid);
      if (!subscription || subscription.status !== 'active') return false;

      const endDate = subscription.enddate ? new Date(subscription.enddate) : null;
      if (!endDate) return false;

      const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      // Solo enviar si faltan exactamente 7 días
      if (daysRemaining !== 7) return false;

      const plan = subscription.plan;
      const message = `⏰ <b>RECORDATORIO DE RENOVACIÓN</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

🚨 <b>Tu suscripción vence en ${daysRemaining} días</b>

💎 <b>Plan actual:</b> ${plan.displayname}
💰 <b>Precio:</b> €${plan.price}/mes
📅 <b>Vence el:</b> ${endDate.toLocaleDateString('es-ES')}

⚠️ <b>¿QUÉ PASARÁ SI NO RENUEVAS?</b>
• Perderás acceso a preguntas privadas ilimitadas
• Se desactivarán las funciones premium
• Solo podrás usar el canal público

🚀 <b>RENOVAR FÁCILMENTE:</b>
${plan.name === 'basic' ? 
  `• <code>/basico</code> - Renovar Plan Básico (€4.99/mes)\n• <code>/premium</code> - Actualizar a Premium (€9.99/mes)` :
  `• <code>/premium</code> - Renovar Plan Premium (€9.99/mes)\n• <code>/basico</code> - Cambiar a Básico (€4.99/mes)`
}

✨ <b>Renueva ahora para evitar interrupciones en tu estudio.</b>

📞 <b>Gestión:</b>
• <code>/mi_plan</code> - Ver detalles completos
• <code>/renovar</code> - Opciones de renovación
• <code>/cancelar</code> - Si deseas cancelar`;

      return await this.sendNotificationToUser(user.telegramuserid, message);

    } catch (error) {
      console.error('❌ Error enviando recordatorio de renovación:', error);
      return false;
    }
  }

  // 🔒 Notificar cuando se alcanzan límites de quota
  static async sendQuotaLimitNotification(userid: string, limitType: 'questions' | 'simulations', currentUsage: number, limit: number): Promise<boolean> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid }
      });

      if (!user) return false;

      const subscription = await SubscriptionService.getCurrentSubscription(userid);
      const plan = subscription?.plan;

      const limitTypeText = limitType === 'questions' ? 'preguntas' : 'simulacros';
      const emoji = limitType === 'questions' ? '📚' : '🎯';

      let message = `🔒 <b>LÍMITE DIARIO ALCANZADO</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

${emoji} <b>${limitTypeText.toUpperCase()}:</b> ${currentUsage}/${limit}

❌ <b>Has alcanzado tu límite diario de ${limitTypeText}</b>`;

      if (!plan || plan.name === 'basic') {
        message += `

💡 <b>¿QUIERES MÁS?</b>

💎 <b>Plan Premium (€9.99/mes):</b>
• ♾️ Preguntas ilimitadas
• 🎯 Simulacros personalizados
• 📊 Estadísticas avanzadas
• 🔗 Integración Moodle
• 🤖 Análisis con IA

🚀 <b>Actualizar:</b>
• <code>/premium</code> - Actualizar a Premium

⏰ <b>O espera hasta mañana</b>
Tus límites se resetean automáticamente a las 00:00`;

      } else {
        message += `

⏰ <b>Límites se resetean mañana a las 00:00</b>

🎮 <b>Mientras tanto:</b>
• Revisa tus estadísticas con <code>/estadisticas</code>
• Ve tu progreso con <code>/miprogreso</code>
• Consulta preguntas graduadas con <code>/graduadas</code>`;
      }

      return await this.sendNotificationToUser(user.telegramuserid, message);

    } catch (error) {
      console.error('❌ Error enviando notificación de límite:', error);
      return false;
    }
  }

  // 💳 Confirmar pago exitoso
  static async sendPaymentConfirmation(userid: string, amount: number, plan: any, transactionId: string): Promise<boolean> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid }
      });

      if (!user) return false;

      const message = `✅ <b>PAGO CONFIRMADO</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

🎉 <b>¡Tu pago ha sido procesado exitosamente!</b>

💳 <b>DETALLES DEL PAGO:</b>
💰 Importe: €${(amount / 100).toFixed(2)}
💎 Plan: ${plan.displayname}
📅 Fecha: ${new Date().toLocaleDateString('es-ES')}
🔢 ID Transacción: ${transactionId}

✨ <b>¡YA TIENES ACCESO COMPLETO!</b>

${plan.name === 'basic' ? 
  `🥉 <b>Plan Básico activado:</b>
• 📚 100 preguntas diarias en privado
• 🔄 Sistema de preguntas falladas
• 📊 Estadísticas básicas` :
  `💎 <b>Plan Premium activado:</b>
• ♾️ Preguntas ilimitadas
• 🎯 Simulacros personalizados
• 📊 Estadísticas avanzadas
• 🔗 Integración Moodle
• 🤖 Análisis con IA`
}

🚀 <b>EMPIEZA A USAR TU PLAN:</b>
• <code>/constitucion10</code> - Sesión de estudio
• <code>/falladas</code> - Repasar preguntas falladas
• <code>/mi_plan</code> - Ver detalles de tu suscripción
• <code>/mi_quota</code> - Ver tu uso actual

📧 <b>Factura:</b> Recibirás tu factura por email en breve.

🤝 <b>¡Gracias por confiar en nosotros para tu preparación!</b>`;

      return await this.sendNotificationToUser(user.telegramuserid, message);

    } catch (error) {
      console.error('❌ Error enviando confirmación de pago:', error);
      return false;
    }
  }

  // 🚨 Notificar suscripción expirada
  static async sendSubscriptionExpiredNotification(userid: string): Promise<boolean> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid }
      });

      if (!user) return false;

      const message = `🚨 <b>SUSCRIPCIÓN EXPIRADA</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

❌ <b>Tu suscripción ha expirado</b>

🔒 <b>Limitaciones actuales:</b>
• Sin acceso a preguntas privadas
• Sin funciones premium
• Solo canal público disponible

💡 <b>¿QUIERES REACTIVAR TU ACCESO?</b>

💰 <b>PLANES DISPONIBLES:</b>
🥉 <b>Plan Básico (€4.99/mes):</b>
• 📚 100 preguntas diarias en privado
• 🔄 Sistema de preguntas falladas
• 📊 Estadísticas básicas

💎 <b>Plan Premium (€9.99/mes):</b>
• ♾️ Preguntas ilimitadas
• 🎯 Simulacros personalizados
• 📊 Estadísticas avanzadas
• 🔗 Integración Moodle
• 🤖 Análisis con IA

🚀 <b>Reactivar ahora:</b>
• <code>/basico</code> - Plan Básico
• <code>/premium</code> - Plan Premium

✨ <b>Al reactivar, recuperarás inmediatamente todas tus funcionalidades.</b>`;

      return await this.sendNotificationToUser(user.telegramuserid, message);

    } catch (error) {
      console.error('❌ Error enviando notificación de expiración:', error);
      return false;
    }
  }

  // 📊 Notificar upgrade exitoso
  static async sendUpgradeConfirmation(userid: string, fromPlan: string, toPlan: string): Promise<boolean> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid }
      });

      if (!user) return false;

      const message = `🚀 <b>PLAN ACTUALIZADO</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

✅ <b>¡Tu plan ha sido actualizado exitosamente!</b>

📊 <b>CAMBIO:</b>
📤 De: ${fromPlan}
📥 A: ${toPlan}

${toPlan.includes('Premium') ? 
  `🎉 <b>¡Bienvenido a Premium!</b>

💎 <b>Nuevas funcionalidades disponibles:</b>
• ♾️ Preguntas ilimitadas (sin límite diario)
• 🎯 Simulacros personalizados
• 📊 Estadísticas avanzadas
• 🔗 Integración Moodle
• 🤖 Análisis con IA

🚀 <b>Prueba tus nuevas funciones:</b>
• <code>/premium_simulacro</code> - Simulacro personalizado
• <code>/estadisticas_avanzadas</code> - Análisis detallado
• <code>/moodle_sync</code> - Sincronizar con Moodle` :
  `⬇️ <b>Cambio a plan Básico</b>

🥉 <b>Tu nuevo plan incluye:</b>
• 📚 100 preguntas diarias en privado
• 🔄 Sistema de preguntas falladas
• 📊 Estadísticas básicas

💡 <b>Nota:</b> Algunas funciones premium ya no estarán disponibles.`
}

🎯 <b>El cambio es efectivo inmediatamente.</b>

📞 <b>Gestión:</b>
• <code>/mi_plan</code> - Ver detalles actuales
• <code>/mi_quota</code> - Ver tu uso y límites`;

      return await this.sendNotificationToUser(user.telegramuserid, message);

    } catch (error) {
      console.error('❌ Error enviando confirmación de upgrade:', error);
      return false;
    }
  }

  // 🔧 Método auxiliar para enviar notificaciones
  private static async sendNotificationToUser(telegramuserid: string, message: string): Promise<boolean> {
    try {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramuserid,
          text: message,
          parse_mode: 'HTML',
          disable_notification: false // Estas son notificaciones importantes
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log(`✅ Notificación de suscripción enviada a usuario ${telegramuserid}`);
        return true;
      } else {
        console.error(`❌ Error enviando notificación:`, result);
        return false;
      }

    } catch (error) {
      console.error('❌ Error en sendNotificationToUser:', error);
      return false;
    }
  }

  // 📅 Verificar y enviar recordatorios pendientes (para job scheduler)
  static async checkAndSendRenewalReminders(): Promise<void> {
    try {
      console.log('🔍 Verificando recordatorios de renovación pendientes...');

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      // Buscar suscripciones que vencen en 7 días
      const expiringSubscriptions = await prisma.usersubscription.findMany({
        where: {
          status: 'active',
          enddate: {
            gte: new Date(sevenDaysFromNow.getFullYear(), sevenDaysFromNow.getMonth(), sevenDaysFromNow.getDate()),
            lt: new Date(sevenDaysFromNow.getFullYear(), sevenDaysFromNow.getMonth(), sevenDaysFromNow.getDate() + 1)
          }
        },
        include: {
          user: true,
          plan: true
        }
      });

      console.log(`📋 Encontradas ${expiringSubscriptions.length} suscripciones que vencen en 7 días`);

      for (const subscription of expiringSubscriptions) {
        await this.sendRenewalReminder(subscription.userid);
        
        // Pequeña pausa entre envíos para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ Recordatorios de renovación procesados');

    } catch (error) {
      console.error('❌ Error verificando recordatorios de renovación:', error);
    }
  }

  // 🚨 Verificar y notificar suscripciones expiradas
  static async checkAndNotifyExpiredSubscriptions(): Promise<void> {
    try {
      console.log('🔍 Verificando suscripciones expiradas...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Buscar suscripciones que expiraron ayer (para notificar solo una vez)
      const expiredSubscriptions = await prisma.usersubscription.findMany({
        where: {
          status: 'active',
          enddate: {
            gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            lt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1)
          }
        },
        include: {
          user: true,
          plan: true
        }
      });

      console.log(`📋 Encontradas ${expiredSubscriptions.length} suscripciones expiradas ayer`);

      for (const subscription of expiredSubscriptions) {
        // Marcar como expirada
        await prisma.usersubscription.update({
          where: { id: subscription.id },
          data: { status: 'expired' }
        });

        // Enviar notificación
        await this.sendSubscriptionExpiredNotification(subscription.userid);
        
        // Pequeña pausa entre envíos
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('✅ Suscripciones expiradas procesadas');

    } catch (error) {
      console.error('❌ Error verificando suscripciones expiradas:', error);
    }
  }
} 