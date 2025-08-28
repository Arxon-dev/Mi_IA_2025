import { SubscriptionService } from './subscriptionService';
import { PaymentService } from './paymentService';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface TelegramMessage {
  chat: { id: number };
  from?: { id: number; first_name?: string; last_name?: string; username?: string };
  text?: string;
}

export interface TelegramBot {
  sendMessage: (chatid: number, text: string, options?: any) => Promise<any>;
  sendInvoice: (chatid: number, invoiceData: any) => Promise<any>;
  editMessageText: (text: string, options?: any) => Promise<any>;
  answerCallbackQuery: (callbackQueryId: string, options?: any) => Promise<any>;
}

export class SubscriptionCommands {

  /**
   * Comando /planes - Mostrar planes disponibles
   */
  static async handlePlanesCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      const plans = await SubscriptionService.getAvailablePlans();
      
      let responseText = `💰 <b>PLANES DE SUSCRIPCIÓN OPOMELILLA</b>\n\n`;
      responseText += `📍 <b>Diseñado específicamente para oposiciones para la Permanencia en la FAS</b>\n\n`;

      plans.forEach((plan, index) => {
        const emoji = plan.name === 'basic' ? '🥉' : plan.name === 'premium' ? '🥈' : '⭐';
        
        responseText += `${emoji} <b>${plan.displayname.toUpperCase()}</b>\n`;
        responseText += `💶 <b>€${plan.price}/mes</b> (IVA incluido)\n`;
        responseText += `📝 ${plan.description}\n\n`;
        
        responseText += `🎯 <b>Funcionalidades:</b>\n`;
        responseText += `${plan.canusefailedquestions ? '✅' : '❌'} Sistema de preguntas falladas\n`;
        responseText += `${plan.canuseadvancedstats ? '✅' : '❌'} Estadísticas avanzadas\n`;
        responseText += `${plan.canusesimulations ? '✅' : '❌'} Simulacros personalizados\n`;
        responseText += `${plan.canuseaianalysis ? '✅' : '❌'} Análisis con IA\n`;
        responseText += `${plan.canusemoodleintegration ? '✅' : '❌'} Integración con Moodle\n`;
        
        if (plan.dailyquestionslimit) {
          responseText += `📊 Límite: ${plan.dailyquestionslimit} preguntas/día\n`;
        } else {
          responseText += `📊 Preguntas: <b>ILIMITADAS</b>\n`;
        }
        
        responseText += `\n`;
      });

      responseText += `🚀 <b>¡Empieza ahora!</b>\n`;
      responseText += `• /basico - Suscribirse al plan Básico\n`;
      responseText += `• /premium - Suscribirse al plan Premium\n`;
      responseText += `• /mi_plan - Ver tu suscripción actual\n\n`;
      
      responseText += `💳 <b>Métodos de pago seguros:</b>\n`;
      responseText += `🔹 Telegram Payments (Visa, Mastercard)\n`;
      responseText += `🔹 Transferencia bancaria española\n\n`;
      
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

    // Obtener o crear usuario
    const userid = await this.ensureUserExists(message.from);
    
    // Buscar el plan
    const plan = await prisma.subscriptionplan.findFirst({
      where: { name: planName, isactive: true }
    });

    if (!plan) {
      await bot.sendMessage(
        message.chat.id,
        '❌ Plan no disponible actualmente.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Verificar suscripción actual
    const currentSubscription = await SubscriptionService.getCurrentSubscription(userid);
    if (currentSubscription?.status === 'active') {
      if (currentSubscription.planid === plan.id) {
        await bot.sendMessage(
          message.chat.id,
          `✅ Ya tienes una suscripción activa al plan <b>${plan.displayname}</b>.\n\n` +
          `Usa /mi_plan para ver los detalles.`,
          { parse_mode: 'HTML' }
        );
        return;
      } else {
        await bot.sendMessage(
          message.chat.id,
          `⚠️ Ya tienes una suscripción activa a otro plan.\n\n` +
          `Responde "/SI" para continuar o usa /mi_plan para ver tu plan actual.`,
          { parse_mode: 'HTML' }
        );
        return;
      }
    }

    // Mostrar opciones de pago
    await this.showPaymentOptions(message.chat.id, plan, userid, bot);
  }

  /**
   * Comando /mi_plan - Ver estado de suscripción actual
   */
  static async handleMiPlanCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      if (!message.from) {
        await bot.sendMessage(
          message.chat.id,
          '❌ No se pudo identificar el usuario.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      const userid = await this.ensureUserExists(message.from);
      const subscription = await SubscriptionService.getCurrentSubscription(userid);
      const quotaInfo = await SubscriptionService.getUserQuota(userid);

      let responseText = `👤 <b>MI SUSCRIPCIÓN</b>\n\n`;

      if (!subscription || subscription.status !== 'active') {
        responseText += `📋 <b>Estado:</b> Sin suscripción activa\n`;
        responseText += `💡 <b>Plan actual:</b> Gratuito (solo canal público)\n\n`;
        responseText += `🚀 <b>¡Únete a un plan premium!</b>\n`;
        responseText += `• /basico - €4.99/mes\n`;
        responseText += `• /premium - €9.99/mes\n`;
        responseText += `• /planes - Ver todos los planes`;
      } else {
        // Obtener el plan por separado
        const plan = await prisma.subscriptionplan.findUnique({
          where: { id: subscription.planid }
        });
        
        if (!plan) {
          await bot.sendMessage(
            message.chat.id,
            '❌ Error obteniendo información del plan.',
            { parse_mode: 'HTML' }
          );
          return;
        }
        
        const endDate = subscription.enddate ? new Date(subscription.enddate) : null;
        const daysRemaining = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

        responseText += `📋 <b>Estado:</b> ✅ Activa\n`;
        responseText += `💎 <b>Plan:</b> ${plan.displayname}\n`;
        responseText += `💰 <b>Precio:</b> €${plan.price}/mes\n`;
        
        if (daysRemaining !== null) {
          responseText += `📅 <b>Renovación:</b> ${daysRemaining} días\n`;
        }
        
        responseText += `\n🎯 <b>LÍMITES DE USO HOY:</b>\n`;
        
        if (quotaInfo.questions === null) {
          responseText += `📚 Preguntas: <b>ILIMITADAS</b>\n`;
        } else {
          responseText += `📚 Preguntas: <b>${quotaInfo.questions}</b> restantes\n`;
        }
        
        if (quotaInfo.simulations === null) {
          responseText += `🎯 Simulacros: <b>ILIMITADOS</b>\n`;
        } else {
          responseText += `🎯 Simulacros: <b>${quotaInfo.simulations}</b> restantes\n`;
        }

        responseText += `\n🎮 <b>FUNCIONALIDADES ACTIVAS:</b>\n`;
        responseText += `${plan.canusefailedquestions ? '✅' : '❌'} Preguntas falladas\n`;
        responseText += `${plan.canuseadvancedstats ? '✅' : '❌'} Estadísticas avanzadas\n`;
        responseText += `${plan.canusesimulations ? '✅' : '❌'} Simulacros personalizados\n`;
        responseText += `${plan.canuseaianalysis ? '✅' : '❌'} Análisis con IA\n`;
        responseText += `${plan.canusemoodleintegration ? '✅' : '❌'} Integración Moodle\n`;

        if (plan.name === 'basic') {
          responseText += `\n🚀 <b>¿Quieres más?</b>\n`;
          responseText += `• /premium - Actualizar a Premium\n`;
        }

        responseText += `\n📞 <b>Gestionar suscripción:</b>\n`;
        responseText += `• /cancelar - Cancelar suscripción\n`;
        responseText += `• /facturas - Ver historial de pagos\n`;
        responseText += `• /limite_diario - Ver uso actual\n`;

      }

      await bot.sendMessage(message.chat.id, responseText, {
        parse_mode: 'HTML'
      });

    } catch (error) {
      console.error('Error en comando /mi_plan:', error);
      await bot.sendMessage(
        message.chat.id,
        '❌ Error obteniendo información de tu plan.',
        { parse_mode: 'HTML' }
      );
    }
  }

  /**
   * Comando /cancelar - Cancelar suscripción
   */
  static async handleCancelarCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      if (!message.from) {
        await bot.sendMessage(
          message.chat.id,
          '❌ No se pudo identificar el usuario.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      const userid = await this.ensureUserExists(message.from);
      const subscription = await SubscriptionService.getCurrentSubscription(userid);

      if (!subscription || subscription.status !== 'active') {
        await bot.sendMessage(
          message.chat.id,
          '❌ No tienes una suscripción activa que cancelar.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      // Obtener información del plan
      const plan = await prisma.subscriptionplan.findUnique({
        where: { id: subscription.planid }
      });
      
      if (!plan) {
        await bot.sendMessage(
          message.chat.id,
          '❌ Error obteniendo información del plan.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      const responseText = `⚠️ <b>CANCELAR SUSCRIPCIÓN</b>\n\n` +
        `📋 <b>Plan actual:</b> ${plan.displayname}\n` +
        `💰 <b>Precio:</b> €${plan.price}/mes\n` +
        `❗ <b>¿Estás seguro?</b>\n` +
        `• Perderás acceso a todas las funcionalidades premium\n` +
        `• Solo tendrás acceso al canal público\n` +
        `• La cancelación es inmediata\n\n` +
        `📝 <b>Para confirmar, responde:</b>\n` +
        `"CANCELAR SUSCRIPCION"\n\n` +
        `💡 <b>Alternativas:</b>\n` +
        `• /basico - Downgrade a plan básico\n` +
        `• @Carlos_esp - Hablar con soporte`;

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
   * Comando /facturas - Ver historial de pagos
   */
  static async handleFacturasCommand(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      if (!message.from) {
        await bot.sendMessage(
          message.chat.id,
          '❌ No se pudo identificar el usuario.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      const userid = await this.ensureUserExists(message.from);
      const transactions = await PaymentService.getUserTransactions(userid);

      if (transactions.length === 0) {
        await bot.sendMessage(
          message.chat.id,
          '📄 No tienes transacciones registradas aún.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      let responseText = `🧾 <b>HISTORIAL DE PAGOS</b>\n\n`;

      transactions.slice(0, 10).forEach((transaction, index) => {
        const statusEmoji = {
          'completed': '✅',
          'pending': '⏳',
          'failed': '❌',
          'refunded': '🔄',
          'cancelled': '🚫'
        }[transaction.status] || '❓';

        const date = new Date(transaction.createdat).toLocaleDateString('es-ES');
        
        responseText += `${statusEmoji} <b>€${transaction.amount.toFixed(2)}</b> - ${date}\n`;
        responseText += `   ${transaction.description || 'Suscripción'}\n`;
        responseText += `   Estado: ${transaction.status}\n`;
        
        if (transaction.invoicenumber) {
          responseText += `   Factura: ${transaction.invoicenumber}\n`;
        }
        
        responseText += `\n`;
      });

      if (transactions.length > 10) {
        responseText += `... y ${transactions.length - 10} transacciones más\n\n`;
      }

      responseText += `📞 <b>¿Necesitas una factura?</b>\n`;
      responseText += `Contacta @Carlos_esp con el ID de transacción.`;

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
   * Asegurar que el usuario existe en la base de datos
   */
  private static async ensureUserExists(from: NonNullable<TelegramMessage['from']>): Promise<string> {
    const telegramuserid = from.id.toString();
    
    let user = await prisma.telegramuser.findUnique({
      where: { telegramuserid }
    });

    if (!user) {
      user = await prisma.telegramuser.create({
        data: {
          id: uuidv4(), // Generar UUID para el campo id
          telegramuserid,
          telegramid: telegramuserid,
          username: from.username,
          firstname: from.first_name,
          lastname: from.last_name
        }
      });
    }

    return user.id;
  }

  /**
   * Mostrar opciones de pago para un plan
   */
  public static async showPaymentOptions(chatId: number, plan: any, userid: string, bot: TelegramBot): Promise<void> {
    const message = `💳 <b>Opciones de pago para ${plan.displayname}</b>

💰 <b>Precio:</b> €${plan.price.toFixed(2)}

<b>Selecciona tu método de pago preferido:</b>`;

    // Crear identificadores cortos para evitar el límite de 64 bytes
    const shortPlanId = plan.id.substring(0, 8);
    const shortUserId = userid.substring(0, 8);
    
    // Crear una sesión de pago simple con timestamp
    const timestamp = Date.now().toString(36);
    const paymentSession = `${shortPlanId}_${shortUserId}_${timestamp}`;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🟦 PayPal', callback_data: `pp_${paymentSession}` }
        ],
        [
          { text: '🔙 Volver a planes', callback_data: 'show_plans' }
        ]
      ]
    };
  
    // Guardar el mapeo en la tabla paymenttransaction como pendiente
    // Esto nos permitirá recuperar los IDs completos más tarde
    try {
      await prisma.paymenttransaction.create({
        data: {
          id: uuidv4(),
          userid: userid,
          amount: plan.price,
          currency: 'EUR',
          status: 'session_created',
          paymentmethod: 'pending',
          transactiontype: 'subscription',
          description: `Sesión de pago para ${plan.displayname}`,
          metadata: JSON.stringify({
            sessionid: paymentSession,
            planid: plan.id,
            shortPlanId,
            shortUserId,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
          }),
          updatedat: new Date() // ✅ Campo requerido agregado
        }
      });
      console.log(`✅ Sesión de pago creada: ${paymentSession}`);
    } catch (error) {
      console.error('⚠️ Error creando sesión de pago:', error);
      // Continuar sin guardar la sesión, usar solo IDs cortos
    }
  
    await bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
  }

  /**
   * Manejar callback de pago PayPal
   */
  static async handlePayPalPayment(callbackQuery: any, bot: TelegramBot): Promise<void> {
    try {
      // Extraer sessionId del callback data
      const sessionId = callbackQuery.data.replace('pp_', ''); // Obtener solo el sessionId
      const chatId = callbackQuery.message.chat.id;
  
      console.log('🔍 PayPal: Buscando sesión de pago para sessionId:', sessionId);
  
      // Buscar la sesión de pago en la base de datos
      const paymentSession = await prisma.paymenttransaction.findFirst({
        where: {
          status: 'session_created',
          metadata: {
            contains: sessionId // Buscar por sessionId en metadata
          }
        },
        orderBy: { createdat: 'desc' }
      });
  
      if (!paymentSession) {
        console.log('❌ PayPal: Sesión de pago no encontrada para:', sessionId);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Sesión de pago expirada. Inténtalo de nuevo.',
          show_alert: true
        });
        return;
      }
  
      // Extraer datos del metadata
      const metadata = JSON.parse(paymentSession.metadata || '{}');
      const planId = metadata.planid;
      const userid = paymentSession.userid;
  
      console.log('🔍 PayPal: Datos extraídos:', { planId, userid, sessionId });
  
      // Verificar expiración
      const expiresAt = new Date(metadata.expiresAt);
      if (new Date() > expiresAt) {
        console.log('❌ PayPal: Sesión expirada');
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Sesión de pago expirada. Inténtalo de nuevo.',
          show_alert: true
        });
        return;
      }
  
      // Crear orden PayPal
      console.log('🔍 PayPal: Llamando a create-order API con:', { userid, planId });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, planId })
      });
  
      console.log('🔍 PayPal: Respuesta de API status:', response.status);
      
      const result = await response.json();
      console.log('🔍 PayPal: Resultado de API:', result);
  
      if (result.success) {
        console.log('✅ PayPal: Orden creada exitosamente, enviando mensaje...');
        
        const message = `🟦 <b>Pago con PayPal</b>
  
        ✅ Orden creada exitosamente
  
        🔗 <b>Completa tu pago:</b>
        <a href="${result.approvalUrl}">👉 Pagar con PayPal</a>
  
        ⏱️ <b>Tienes 10 minutos para completar el pago</b>`;
  
        await bot.editMessageText(message, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔙 Volver a planes', callback_data: 'show_plans' }]
            ]
          }
        });
        
        console.log('✅ PayPal: Mensaje enviado exitosamente');
      } else {
        console.log('❌ PayPal: Error en API:', result.error);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: `❌ Error: ${result.error}`,
          show_alert: true
        });
      }
    } catch (error) {
      console.error('❌ PayPal: Error manejando pago:', error);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error interno. Inténtalo de nuevo.',
        show_alert: true
      });
    }
  }

  /**
   * Manejar confirmación de cambio de plan
   */
  static async handlePlanChangeConfirmation(message: TelegramMessage, bot: TelegramBot): Promise<void> {
    try {
      if (!message.from) {
        await bot.sendMessage(
          message.chat.id,
          '❌ No se pudo identificar el usuario.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      const userid = await this.ensureUserExists(message.from);
      
      // Verificar suscripción actual
      const currentSubscription = await SubscriptionService.getCurrentSubscription(userid);
      if (!currentSubscription || currentSubscription.status !== 'active') {
        await bot.sendMessage(
          message.chat.id,
          '❌ No tienes una suscripción activa para cambiar.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      // Buscar el plan básico
      const basicPlan = await prisma.subscriptionplan.findFirst({
        where: { name: 'basic', isactive: true }
      });

      if (!basicPlan) {
        await bot.sendMessage(
          message.chat.id,
          '❌ Plan básico no disponible actualmente.',
          { parse_mode: 'HTML' }
        );
        return;
      }

      // Mostrar opciones de pago usando el método público
      await SubscriptionCommands.showPaymentOptions(message.chat.id, basicPlan, userid, bot);

    } catch (error) {
      console.error('Error en confirmación de cambio de plan:', error);
      await bot.sendMessage(
        message.chat.id,
        '❌ Error procesando cambio de plan.',
        { parse_mode: 'HTML' }
      );
    }
  }
}

export async function handleCancellationConfirmation(userid: string, message: any): Promise<void> {
  // 1. Verificar suscripción activa
  // 2. Llamar a cancelSubscription del SubscriptionService
  // 3. Enviar confirmación al usuario
  // 4. Registrar en logs
}