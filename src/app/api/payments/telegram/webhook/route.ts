import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/paymentService';

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    console.log('🔔 Telegram Payment Webhook recibido:', JSON.stringify(update, null, 2));

    // Manejar pre-checkout query
    if (update.pre_checkout_query) {
      const preCheckout = update.pre_checkout_query;
      
      console.log('🔍 Pre-checkout query recibido:', preCheckout);
      
      const isValid = await PaymentService.handlePreCheckoutQuery({
        id: preCheckout.id,
        from: preCheckout.from,
        currency: preCheckout.currency,
        totalAmount: preCheckout.total_amount,
        invoicePayload: preCheckout.invoice_payload,
        shippingOptionId: preCheckout.shipping_option_id,
        orderInfo: preCheckout.order_info
      });

      if (isValid) {
        console.log('✅ Pre-checkout query válido, aprobando pago');
        
        // Responder a Telegram que el pago puede proceder
        await answerPreCheckoutQuery(preCheckout.id, true);
      } else {
        console.log('❌ Pre-checkout query inválido, rechazando pago');
        
        // Responder a Telegram que el pago debe ser rechazado
        await answerPreCheckoutQuery(
          preCheckout.id, 
          false, 
          'Error validando el pago. Por favor, inténtalo de nuevo.'
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Manejar pago exitoso
    if (update.message && update.message.successful_payment) {
      const payment = update.message.successful_payment;
      const userid = getUserIdFromTelegram(update.message.from.id);
      
      console.log('💰 Pago exitoso recibido:', payment);
      
      const success = await PaymentService.processSuccessfulPayment(userid, {
        currency: payment.currency,
        totalAmount: payment.total_amount,
        invoicePayload: payment.invoice_payload,
        shippingOptionId: payment.shipping_option_id,
        orderInfo: payment.order_info,
        telegramPaymentChargeId: payment.telegram_payment_charge_id,
        providerPaymentChargeId: payment.provider_payment_charge_id
      });

      if (success) {
        console.log('✅ Pago procesado exitosamente');
        
        // Enviar mensaje de confirmación al usuario
        await sendPaymentConfirmation(update.message.from.id, payment);
      } else {
        console.log('❌ Error procesando pago exitoso');
        
        // Enviar mensaje de error al usuario
        await sendPaymentError(update.message.from.id);
      }

      return NextResponse.json({ ok: true });
    }

    // Otros tipos de updates no relacionados con pagos
    console.log('ℹ️ Update no relacionado con pagos ignorado');
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('❌ Error en webhook de Telegram Payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Responder a pre-checkout query de Telegram
 */
async function answerPreCheckoutQuery(
  preCheckoutQueryId: string, 
  ok: boolean, 
  errorMessage?: string
): Promise<void> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`;
    
    const payload: any = {
      pre_checkout_query_id: preCheckoutQueryId,
      ok: ok
    };

    if (!ok && errorMessage) {
      payload.error_message = errorMessage;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('📤 Respuesta pre-checkout enviada:', { ok, errorMessage });

  } catch (error) {
    console.error('Error respondiendo pre-checkout query:', error);
  }
}

/**
 * Enviar confirmación de pago al usuario
 */
async function sendPaymentConfirmation(chatid: number, payment: any): Promise<void> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const message = `🎉 <b>¡Pago confirmado!</b>

✅ <b>Tu suscripción está ahora activa</b>

📋 <b>Detalles del pago:</b>
💰 Cantidad: €${(payment.total_amount / 100).toFixed(2)}
💳 Método: ${payment.currency}
🆔 ID: ${payment.telegram_payment_charge_id.slice(-8)}

🚀 <b>Ahora puedes disfrutar de:</b>
• Preguntas ilimitadas en privado
• Sistema de preguntas falladas
• Estadísticas avanzadas
• Y mucho más...

¡Usa /mi_plan para ver tu estado de suscripción!`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatid,
        text: message,
        parse_mode: 'HTML'
      })
    });

    console.log('📤 Confirmación de pago enviada al usuario');

  } catch (error) {
    console.error('Error enviando confirmación de pago:', error);
  }
}

/**
 * Enviar mensaje de error de pago al usuario
 */
async function sendPaymentError(chatid: number): Promise<void> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const message = `❌ <b>Error procesando el pago</b>

Lo siento, hubo un problema procesando tu pago. 

📞 <b>¿Qué puedes hacer?</b>
• Contacta con soporte: @Carlos_esp
• Inténtalo de nuevo: /premium
• Revisa tu método de pago

💡 <b>Tu dinero está seguro</b> - si fue debitado, será reembolsado automáticamente.`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatid,
        text: message,
        parse_mode: 'HTML'
      })
    });

    console.log('📤 Mensaje de error enviado al usuario');

  } catch (error) {
    console.error('Error enviando mensaje de error:', error);
  }
}

/**
 * Convertir Telegram ID a user ID interno
 */
function getUserIdFromTelegram(telegramId: number): string {
  // Implementar la lógica para convertir telegramId a userid interno
  // Por ahora, asumimos que coinciden o hay un mapeo directo
  return telegramId.toString();
} 