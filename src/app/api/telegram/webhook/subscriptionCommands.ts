import { prisma } from '@/lib/prisma';

export async function handlePayPalPayment(bot: any, callbackQuery: any) {
  try {
    console.log('🔄 [PayPal] Iniciando handlePayPalPayment');
    console.log('📋 [PayPal] CallbackQuery data:', callbackQuery.data);
    
    // Verificar variables de entorno
    console.log('🌐 [PayPal] BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    console.log('🔑 [PayPal] PayPal configurado:', {
      hasClientId: !!process.env.PAYPAL_CLIENT_ID,
      hasClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
      mode: process.env.PAYPAL_MODE
    });
    
    // Extraer sessionId del callback data (eliminar 'pp_')
    const sessionId = callbackQuery.data.replace('pp_', '');
    console.log('🆔 [PayPal] SessionId extraído:', sessionId);
    
    // Primero, buscar todas las sesiones recientes para debug
    console.log('🔍 [PayPal] Buscando sesiones recientes...');
    const recentSessions = await prisma.paymenttransaction.findMany({
      where: {
        status: 'session_created',
        createdat: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      orderBy: { createdat: 'desc' },
      take: 5
    });
    
    console.log('📊 [PayPal] Sesiones recientes encontradas:', recentSessions.length);
    recentSessions.forEach((session, index) => {
      console.log(`📋 [PayPal] Sesión ${index + 1}:`, {
        id: session.id,
        userid: session.userid,
        status: session.status,
        metadata: session.metadata,
        createdat: session.createdat
      });
    });
    
    // Buscar la sesión de pago específica
    console.log('🔍 [PayPal] Buscando sesión específica con sessionId:', sessionId);
    const paymentSession = await prisma.paymenttransaction.findFirst({
      where: {
        status: 'session_created',
        metadata: {
          contains: sessionId
        }
      },
      orderBy: { createdat: 'desc' }
    });

    if (!paymentSession) {
      console.error('❌ [PayPal] Sesión de pago no encontrada para sessionId:', sessionId);
      
      // Intentar búsqueda alternativa por ID exacto
      console.log('🔄 [PayPal] Intentando búsqueda alternativa...');
      const alternativeSearch = await prisma.paymenttransaction.findMany({
        where: {
          status: 'session_created',
          createdat: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Última hora
          }
        },
        orderBy: { createdat: 'desc' }
      });
      
      console.log('🔍 [PayPal] Búsqueda alternativa encontró:', alternativeSearch.length, 'sesiones');
      
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Sesión de pago no válida. Inténtalo de nuevo.',
        show_alert: true
      });
      return;
    }

    console.log('✅ [PayPal] Sesión encontrada:', {
      sessionId: sessionId,
      userId: paymentSession.userid,
      transactionId: paymentSession.id,
      status: paymentSession.status,
      metadata: paymentSession.metadata
    });

    // Extraer datos del metadata
    let metadata;
    try {
      metadata = JSON.parse(paymentSession.metadata || '{}');
      console.log('📋 [PayPal] Metadata parseado:', metadata);
    } catch (error) {
      console.error('❌ [PayPal] Error parseando metadata:', error);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error en datos de sesión. Inténtalo de nuevo.',
        show_alert: true
      });
      return;
    }
    
    const planId = metadata.planid;
    
    if (!planId) {
      console.error('❌ [PayPal] planId no encontrado en metadata');
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Datos de plan no válidos. Inténtalo de nuevo.',
        show_alert: true
      });
      return;
    }
    
    // Verificar que la sesión no haya expirado (24 horas)
    const now = new Date();
    const sessionAge = now.getTime() - paymentSession.createdat.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    console.log('⏰ [PayPal] Verificando expiración:', {
      sessionAge: sessionAge,
      maxAge: maxAge,
      expired: sessionAge > maxAge
    });

    if (sessionAge > maxAge) {
      console.error('❌ [PayPal] Sesión expirada:', sessionAge, 'ms');
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ La sesión ha expirado. Inicia el proceso de nuevo.',
        show_alert: true
      });
      return;
    }

    // Llamar a la API para crear la orden de PayPal
    console.log('🌐 [PayPal] Llamando a API create-order con datos:', {
      userid: paymentSession.userid,
      planId: planId
    });
    
    // Antes de llamar a la API
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/paypal/create-order`;
    console.log('🌐 [PayPal] URL completa de API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: paymentSession.userid,
        planId: planId
      })
    });

    console.log('📡 [PayPal] Respuesta de API status:', response.status);
    console.log('📡 [PayPal] Respuesta de API headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📋 [PayPal] Respuesta de API completa:', result);

    if (!response.ok) {
      console.error('❌ [PayPal] Error en API create-order:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error al procesar el pago. Inténtalo más tarde.',
        show_alert: true
      });
      return;
    }

    if (!result.approvalUrl) {
      console.error('❌ [PayPal] approvalUrl no encontrada en respuesta:', result);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error generando enlace de pago. Inténtalo más tarde.',
        show_alert: true
      });
      return;
    }

    // Obtener información del plan para mostrar en el mensaje
    const planInfo = metadata.planname || 'Plan Básico';
    const planPrice = paymentSession.amount || 0;

    // Editar el mensaje con el enlace de PayPal
    const paymentMessage = `💳 **Pago con PayPal**\n\n` +
      `📦 Plan: ${planInfo}\n` +
      `💰 Precio: €${planPrice.toFixed(2)}\n\n` +
      `🔗 Haz clic en el botón para completar tu pago:`;

    console.log('📝 [PayPal] Editando mensaje con enlace de pago...');
    console.log('🔗 [PayPal] URL de aprobación:', result.approvalUrl);
    
    const editResult = await bot.editMessageText(paymentMessage, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '💳 Pagar con PayPal',
            url: result.approvalUrl
          }
        ], [
          {
            text: '🔙 Volver a opciones',
            callback_data: `show_payment_options_${sessionId}`
          }
        ]]
      }
    });

    console.log('📝 [PayPal] Resultado de edición de mensaje:', editResult);
    console.log('✅ [PayPal] Mensaje editado exitosamente');
    
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '✅ Enlace de PayPal generado'
    });

    console.log('🎉 [PayPal] Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ [PayPal] Error COMPLETO en handlePayPalPayment:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.error('❌ [PayPal] Stack trace:', error.stack);
    
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error interno. Inténtalo más tarde.',
        show_alert: true
      });
    } catch (callbackError) {
      console.error('❌ [PayPal] Error enviando callback de error:', callbackError);
    }
  }
}


export async function handleRedsysPayment(bot: any, callbackQuery: any) {
  try {
    console.log('🔄 [Redsys] Iniciando handleRedsysPayment');
    console.log('📋 [Redsys] CallbackQuery data:', callbackQuery.data);
    
    // Extraer sessionId del callback data (eliminar 'rs_')
    const sessionId = callbackQuery.data.replace('rs_', '');
    console.log('🆔 [Redsys] SessionId extraído:', sessionId);
    
    // Buscar la sesión de pago en la base de datos
    const paymentSession = await prisma.paymenttransaction.findFirst({
      where: {
        status: 'session_created',
        metadata: {
          contains: sessionId
        }
      },
      orderBy: { createdat: 'desc' }
    });

    if (!paymentSession) {
      console.log('❌ [Redsys] Sesión de pago no encontrada para:', sessionId);
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

    console.log('🔍 [Redsys] Datos extraídos:', { planId, userid, sessionId });

    // ✅ CORRECCIÓN: Obtener el telegramuserid del usuario
    const user = await prisma.telegramuser.findUnique({
      where: { id: userid }
    });
    
    if (!user) {
      console.log('❌ [Redsys] Usuario no encontrado:', userid);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Usuario no válido. Inténtalo de nuevo.',
        show_alert: true
      });
      return;
    }

    // Verificar expiración
    const expiresAt = new Date(metadata.expiresAt);
    if (new Date() > expiresAt) {
      console.log('❌ [Redsys] Sesión expirada');
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Sesión de pago expirada. Inténtalo de nuevo.',
        show_alert: true
      });
      return;
    }

    // ✅ CORRECCIÓN: Obtener el plan completo desde la base de datos
    const { SubscriptionPlanService } = await import('@/services/subscriptionPlanService');
    const plan = await SubscriptionPlanService.getPlanById(planId);
    
    if (!plan) {
      console.log('❌ [Redsys] Plan no encontrado:', planId);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Plan no válido. Inténtalo de nuevo.',
        show_alert: true
      });
      return;
    }

    console.log('✅ [Redsys] Plan encontrado:', { id: plan.id, name: plan.name, price: plan.price });

    // ✅ CORRECCIÓN: Usar user.telegramuserid en lugar de userid interno
    const { PaymentService } = await import('@/services/paymentServiceRedsys');
    const invoiceData = PaymentService.createInvoiceData(plan.name as 'basic' | 'premium', user.telegramuserid);

    console.log('📄 [Redsys] Invoice data creada:', {
      title: invoiceData.title,
      price: invoiceData.prices[0].amount / 100,
      payload: invoiceData.payload.substring(0, 50) + '...'
    });

    // Actualizar estado de la sesión
    await prisma.paymenttransaction.update({
      where: { id: paymentSession.id },
      data: {
        status: 'pending',
        metadata: JSON.stringify({
          ...metadata,
          invoicePayload: invoiceData.payload,
          processedAt: new Date().toISOString()
        })
      }
    });

    // Enviar invoice de Telegram con Redsys
    await bot.sendInvoice(callbackQuery.message.chat.id, invoiceData);

    // Responder al callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '💳 Factura de Redsys generada'
    });

    // Enviar mensaje explicativo
    const explanationText = `💳 <b>Factura enviada para pago con Redsys</b>\n\n` +
      `🏦 <b>Sistema bancario español oficial</b>\n` +
      `✅ Visa, Mastercard, Maestro\n` +
      `✅ Pago 100% seguro\n\n` +
      `📱 <b>Para pagar:</b>\n` +
      `1️⃣ Pulsa en la factura de arriba\n` +
      `2️⃣ Completa tus datos\n` +
      `3️⃣ Confirma el pago\n\n` +
      `🔒 <b>Protección total:</b> Cumple normativas PSD2`;

    await bot.sendMessage(callbackQuery.message.chat.id, explanationText, {
      parse_mode: 'HTML'
    });

    console.log('🎉 [Redsys] Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ [Redsys] Error COMPLETO en handleRedsysPayment:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    try {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error interno. Inténtalo más tarde.',
        show_alert: true
      });
    } catch (callbackError) {
      console.error('❌ [Redsys] Error enviando callback de error:', callbackError);
    }
  }
}


async function handleBizumPayment(callbackQuery: any, bot: any) {
  const sessionId = callbackQuery.data.substring(3); // Remover 'bz_'
  
  // Buscar la sesión de pago
  const paymentSession = await prisma.paymenttransaction.findFirst({
    where: {
      status: 'session_created',
      metadata: {
        contains: sessionId
      }
    },
    orderBy: { createdat: 'desc' }
  });

  if (!paymentSession) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: '❌ Sesión de pago no válida. Inténtalo de nuevo.',
      show_alert: true
    });
    return;
  }

  // Solicitar número de teléfono
  await bot.answerCallbackQuery(callbackQuery.id);
  
  const message = `📱 <b>Pago con Bizum</b>\n\n` +
    `💰 <b>Importe:</b> €${paymentSession.amount.toFixed(2)}\n\n` +
    `📞 <b>Introduce tu número de teléfono español:</b>\n` +
    `Formato: +34XXXXXXXXX o 6XXXXXXXX\n\n` +
    `ℹ️ <i>Recibirás una notificación en tu app bancaria para confirmar el pago</i>`;

  await bot.sendMessage(callbackQuery.message.chat.id, message, {
    parse_mode: 'HTML',
    reply_markup: {
      force_reply: true,
      input_field_placeholder: '+34XXXXXXXXX'
    }
  });

  // Guardar estado para procesar la respuesta
  await prisma.paymenttransaction.update({
    where: { id: paymentSession.id },
    data: {
      status: 'awaiting_phone',
      metadata: JSON.stringify({
        ...JSON.parse(paymentSession.metadata || '{}'),
        sessionId,
        chatId: callbackQuery.message.chat.id,
        awaitingPhone: true
      })
    }
  });
}