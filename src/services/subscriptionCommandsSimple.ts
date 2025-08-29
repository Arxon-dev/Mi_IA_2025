import { PaymentService } from './paymentServiceRedsys';
import { prisma } from '@/lib/prisma';

export interface TelegramMessage {
  chat: { id: number };
  from?: { id: number; first_name?: string; last_name?: string; username?: string };
  text?: string;
}

export interface TelegramBot {
  sendMessage: (chatid: number, text: string, options?: any) => Promise<any>;
  sendInvoice: (chatid: number, invoiceData: any) => Promise<any>;
}

export class SubscriptionCommandsSimple {

  /**
   * Comando /planes - Mostrar planes disponibles
   */
  static async handlePlanesCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      let responseText = `💰 <b>PLANES DE SUSCRIPCIÓN OPOMELILLA</b>\n\n`;
      responseText += `📍 <b>Diseñado específicamente para oposiciones para la Permanencia en la FAS</b>\n\n`;

      // Plan Básico
      responseText += `🥉 <b>PLAN BÁSICO</b>\n`;
      responseText += `💶 <b>€4.99/mes</b> (IVA incluido)\n`;
      responseText += `📝 100 preguntas/día, sistema de preguntas falladas, estadísticas básicas\n\n`;
      responseText += `🎯 <b>Funcionalidades:</b>\n`;
      responseText += `✅ Sistema de preguntas falladas\n`;
      responseText += `✅ 100 preguntas diarias en privado\n`;
      responseText += `✅ Estadísticas básicas\n`;
      responseText += `❌ Estadísticas avanzadas\n`;
      responseText += `❌ Simulacros personalizados\n`;
      responseText += `❌ Análisis con IA\n`;
      responseText += `❌ Integración con Moodle\n\n`;

      // Plan Premium  
      responseText += `🥈 <b>PLAN PREMIUM</b>\n`;
      responseText += `💶 <b>€9.99/mes</b> (IVA incluido)\n`;
      responseText += `📝 Preguntas ilimitadas, integración Moodle, estadísticas avanzadas, simulacros personalizados, análisis IA\n\n`;
      responseText += `🎯 <b>Funcionalidades:</b>\n`;
      responseText += `✅ Sistema de preguntas falladas\n`;
      responseText += `✅ Preguntas ILIMITADAS en privado\n`;
      responseText += `✅ Estadísticas avanzadas\n`;
      responseText += `✅ Simulacros personalizados\n`;
      responseText += `✅ Análisis con IA\n`;
      responseText += `✅ Integración con Moodle\n\n`;

      responseText += `🚀 <b>¡Empieza ahora!</b>\n`;
      responseText += `• /basico - Suscribirse al plan Básico\n`;
      responseText += `• /premium - Suscribirse al plan Premium\n\n`;
      
      responseText += `💳 <b>Métodos de pago seguros:</b>\n`;
      responseText += `🏦 Redsys (Sistema bancario español oficial)\n`;
      responseText += `🔹 Visa, Mastercard, Maestro\n`;
      responseText += `🔹 Transferencias bancarias\n`;
      responseText += `🔹 Próximamente: Bizum integrado\n\n`;
      
      responseText += `📖 <b>Manual de uso:</b> <a href="https://drive.google.com/file/d/1UQoX0y8_b-QM2h2Sik4IZFx0eChG7kUI/view?usp=sharing">Guía completa del sistema</a>\n\n`;
      
      responseText += `📞 <b>Soporte:</b> @Carlos_esp`;

      await bot.sendMessage(message.chat.id, responseText, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

    } catch (error) {
      console.error('Error en comando /planes:', error);
      await bot.sendMessage(
        message.chat.id, 
        '❌ Error obteniendo información de planes. Inténtalo más tarde.',
        { parse_mode: 'HTML' }
      );
    }
  }

  /**
   * Comando /basico - Suscribirse al plan básico
   */
  static async handleBasicoCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      await this.handleSubscriptionCommand(message, bot, 'basic');
    } catch (error) {
      console.error('Error en comando /basico:', error);
      await bot.sendMessage(
        message.chat.id, 
        '❌ Error procesando suscripción. Inténtalo más tarde.',
        { parse_mode: 'HTML' }
      );
    }
  }

  /**
   * Comando /premium - Suscribirse al plan premium
   */
  static async handlePremiumCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      await this.handleSubscriptionCommand(message, bot, 'premium');
    } catch (error) {
      console.error('Error en comando /premium:', error);
      await bot.sendMessage(
        message.chat.id, 
        '❌ Error procesando suscripción. Inténtalo más tarde.',
        { parse_mode: 'HTML' }
      );
    }
  }

  /**
   * Lógica común para comandos de suscripción
   */
  private static async handleSubscriptionCommand(
    message: TelegramMessage, 
    bot: TelegramBot, 
    planName: 'basic' | 'premium'
  ): Promise<void> {
    if (!message.from) {
      await bot.sendMessage(
        message.chat.id,
        '❌ No se pudo identificar el usuario.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    const userid = message.from.id.toString();
    const planDisplayName = planName === 'basic' ? 'Básico' : 'Premium';
    const planPrice = planName === 'basic' ? '€4.99' : '€9.99';

    try {
      console.log(`💰 Procesando suscripción ${planName} para usuario ${userid}`);

      // Crear datos de invoice
      const invoiceData = PaymentService.createInvoiceData(planName, userid);
      
      console.log('📄 Invoice data creada:', {
        title: invoiceData.title,
        price: invoiceData.prices[0].amount / 100,
        payload: invoiceData.payload.substring(0, 50) + '...'
      });

      // Enviar invoice de Telegram
      await bot.sendInvoice(message.chat.id, invoiceData);
      
      console.log('📤 Invoice enviada exitosamente');

      // Enviar mensaje explicativo
      const explanationText = `💳 <b>Invoice enviada para plan ${planDisplayName}</b>\n\n` +
        `💰 Precio: <b>${planPrice}/mes</b> (IVA incluido)\n` +
        `🏦 Pago 100% seguro con Redsys (sistema bancario español)\n` +
        `⚡ Activación inmediata tras el pago\n\n` +
        `📱 <b>Toca en la invoice arriba ⬆️</b> para completar el pago.\n\n` +
        `🔒 <b>Seguridad garantizada:</b> Cumple PSD2 europeo\n` +
        `❓ <b>¿Problemas?</b> Contacta @Carlos_esp`;

      await bot.sendMessage(message.chat.id, explanationText, {
        parse_mode: 'HTML'
      });

      console.log('📨 Mensaje explicativo enviado');

    } catch (error) {
      console.error('❌ Error completo enviando invoice:', error);
      
      await bot.sendMessage(
        message.chat.id,
        `❌ Error enviando la factura para el plan ${planDisplayName}.\n\n` +
        `🔧 <b>Posibles causas:</b>\n` +
        `• Configuración de pagos de Telegram\n` +
        `• Token de Stripe inválido\n` +
        `• Permisos del bot\n\n` +
        `📞 Contacta con soporte: @Carlos_esp`,
        { parse_mode: 'HTML' }
      );
    }
  }

  /**
   * Comando /mi_plan - Consultar suscripción real de la base de datos
   */
  static async handleMiPlanCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    // ✅ CORREGIDO: Verificar que message.from existe
    if (!message.from) {
      await bot.sendMessage(message.chat.id, '❌ Error: No se pudo identificar el usuario.');
      return;
    }
    
    const userId = message.from.id.toString();
    
    try {
      // ✅ CORREGIDO: Usar tipos correctos para Prisma
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid: userId }
      });
      
      if (!user) {
        await bot.sendMessage(message.chat.id, 
          '❌ No estás registrado. Usa /start para registrarte.');
        return;
      }
      
      // ✅ CORREGIDO: Consulta separada para evitar conflictos de tipos
      const activeSubscriptionResult = await prisma.$queryRaw`
        SELECT 
          s.*,
          p.displayname as planDisplayName,
          p.name as planName,
          p.price,
          p.billingperiod,
          p.dailyquestionslimit,
          p.canusefailedquestions,
          p.canuseadvancedstats,
          p.canusesimulations,
          p.canuseaianalysis,
          p.canusemoodleintegration,
          s.autorenew as autoRenew
        FROM usersubscription s
        JOIN subscriptionplan p ON s.planid = p.id
        WHERE s.userid = ${user.id} 
          AND s.status = 'active' 
          AND s.enddate >= NOW()
        ORDER BY s.createdat DESC
        LIMIT 1
      ` as any[];
      
      // ✅ CORREGIDO: Variable única sin redeclaración
      const subscription = (activeSubscriptionResult as any[])[0];
      
      let responseText = `👤 <b>MI SUSCRIPCIÓN</b>\n\n`;
      
      if (!subscription) {
        // Usuario sin suscripción activa
        responseText += `📋 <b>Estado:</b> Sin suscripción activa\n`;
        responseText += `💡 <b>Plan actual:</b> Gratuito (solo canal público)\n\n`;
        responseText += `🚀 <b>¡Únete a un plan premium!</b>\n`;
        responseText += `• /basico - €4.99/mes\n`;
        responseText += `• /premium - €9.99/mes\n`;
        responseText += `• /planes - Ver todos los planes\n\n`;
        responseText += `💡 <b>Nota:</b> Sistema de suscripciones funcionando con Redsys.`;
      } else {
        // Usuario con suscripción activa
        const endDate = new Date(subscription.enddate);
        const daysLeft = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        responseText += `✅ <b>Estado:</b> Suscripción activa\n`;
        responseText += `💎 <b>Plan actual:</b> ${subscription.planDisplayName}\n`;
        responseText += `💰 <b>Precio:</b> €${Number(subscription.price).toFixed(2)}/mes\n`;
        responseText += `📅 <b>Válida hasta:</b> ${endDate.toLocaleDateString('es-ES')}\n`;
        responseText += `⏰ <b>Tiempo restante:</b> ${daysLeft} días\n`;
        responseText += `🔄 <b>Auto-renovación:</b> ${subscription.autoRenew ? 'Activada ✅' : 'Desactivada ❌'}\n\n`;
        
        responseText += `🎯 <b>Beneficios incluidos:</b>\n`;
        if (subscription.planName === 'basic') {
          responseText += `✅ ${subscription.dailyquestionslimit} preguntas diarias en privado\n`;
          responseText += `✅ Sistema de preguntas falladas\n`;
          responseText += `✅ Estadísticas básicas\n`;
        } else {
          responseText += `✅ Preguntas ILIMITADAS en privado\n`;
          responseText += `✅ Sistema de preguntas falladas\n`;
          responseText += `✅ Estadísticas avanzadas\n`;
          responseText += `✅ Simulacros personalizados\n`;
          responseText += `✅ Análisis con IA\n`;
          responseText += `✅ Integración con Moodle\n`;
        }
        
        responseText += `\n💡 <b>Gestión:</b>\n`;
        responseText += `• /facturas - Ver historial de pagos\n`;
        responseText += `• /cancelar - Gestionar cancelación`;
      }

      // ✅ CORREGIDO: Usar message.chat.id en lugar de string
      await bot.sendMessage(message.chat.id, responseText, {
        parse_mode: 'HTML'
      });

      // ✅ CORREGIDO: Usar user.id en lugar de userid
      console.log(`📊 Comando /mi_plan procesado para usuario ${user.id}: ${subscription ? 'Con suscripción' : 'Sin suscripción'}`);

    } catch (error) {
      console.error('Error en comando /mi_plan:', error);
      await bot.sendMessage(
        message.chat.id,
        '❌ Error obteniendo información de tu plan. Inténtalo más tarde.',
        { parse_mode: 'HTML' }
      );
    }
  }

  /**
   * Comando /cancelar - Información simplificada
   */
  static async handleCancelarCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      const responseText = `⚠️ <b>CANCELAR SUSCRIPCIÓN</b>\n\n` +
        `💡 <b>Sistema simplificado activo</b>\n` +
        `Gestión completa de suscripciones disponible próximamente.\n\n` +
        `📞 <b>Para cancelar contacta:</b> @Carlos_esp\n\n` +
        `🚀 <b>Mientras tanto:</b>\n` +
        `• /planes - Ver planes disponibles\n` +
        `• /basico - Probar plan básico\n` +
        `• /premium - Probar plan premium`;

      await bot.sendMessage(message.chat.id, responseText, {
        parse_mode: 'HTML'
      });

    } catch (error) {
      console.error('Error en comando /cancelar:', error);
      await bot.sendMessage(
        message.chat.id,
        '❌ Error procesando cancelación.',
        { parse_mode: 'HTML' }
      );
    }
  }

  /**
   * Comando /facturas - Información simplificada
   */
  static async handleFacturasCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      const responseText = `🧾 <b>HISTORIAL DE PAGOS</b>\n\n` +
        `💡 <b>Sistema simplificado activo</b>\n` +
        `Gestión completa de facturas disponible próximamente.\n\n` +
        `📞 <b>Para consultas de facturas:</b> @Carlos_esp\n\n` +
        `🚀 <b>Prueba los pagos:</b>\n` +
        `• /basico - Probar pago €4.99\n` +
        `• /premium - Probar pago €9.99`;

      await bot.sendMessage(message.chat.id, responseText, {
        parse_mode: 'HTML'
      });

    } catch (error) {
      console.error('Error en comando /facturas:', error);
      await bot.sendMessage(
        message.chat.id,
        '❌ Error obteniendo historial de pagos.',
        { parse_mode: 'HTML' }
      );
    }
  }

  /**
   * Manejar callback de pago PayPal
   */
  static async handlePayPalPayment(callbackQuery: any): Promise<void> {
    try {
      const [, , planId, userid] = callbackQuery.data.split('_');
      const chatId = callbackQuery.message.chat.id;
  
      // Crear orden PayPal
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, planId })
      });
  
      const result = await response.json();
  
      if (result.success) {
        const message = `🟦 <b>Pago con PayPal</b>
  
        ✅ Orden creada exitosamente
  
        🔗 <b>Completa tu pago:</b>
        <a href="${result.approvalUrl}">👉 Pagar con PayPal</a>
  
        ⏱️ <b>Tienes 10 minutos para completar el pago</b>`;
  
        // Aquí necesitarías implementar el método para editar mensajes
        // o usar la API de Telegram directamente
        console.log('PayPal payment initiated:', message);
      } else {
        console.error('Error creating PayPal order:', result.error);
      }
    } catch (error) {
      console.error('Error manejando pago PayPal:', error);
    }
  }
}

