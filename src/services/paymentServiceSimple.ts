import { prisma } from '@/lib/prisma';

export interface InvoiceData {
  title: string;
  description: string;
  payload: string;
  provider_token: string;
  currency: string;
  prices: Array<{ label: string; amount: number; }>;
  need_name?: boolean;
  need_email?: boolean;
  need_phone_number?: boolean;
  send_email_to_provider?: boolean;
  is_flexible?: boolean;
  photo_url?: string;
}

export class PaymentServiceSimple {
  
  /**
   * Crear datos de invoice para Telegram Payments
   */
  static createInvoiceData(planName: 'basic' | 'premium', userid: string): InvoiceData {
    const plans = {
      basic: {
        name: 'Básico',
        price: 4.99,
        description: '100 preguntas/día, sistema de preguntas falladas, estadísticas básicas'
      },
      premium: {
        name: 'Premium', 
        price: 9.99,
        description: 'Preguntas ilimitadas, integración Moodle, estadísticas avanzadas, simulacros personalizados, análisis IA'
      }
    };

    const plan = plans[planName];
    const priceInCents = Math.round(plan.price * 100); // Convertir a centavos

    // Crear payload único para tracking
    const payload = `subscription_${planName}_${userid}_${Date.now()}`;

    return {
      title: `Plan ${plan.name} - OpoMelilla`,
      description: `Suscripción mensual a ${plan.name}. ${plan.description}. IVA (21%) incluido.`,
      payload,
      provider_token: process.env.STRIPE_SECRET_KEY!,
      currency: 'EUR',
      prices: [
        {
          label: `Plan ${plan.name} (1 mes)`,
          amount: priceInCents
        }
      ],
      need_name: true,
      need_email: true,
      need_phone_number: false,
      send_email_to_provider: true,
      is_flexible: false,
      photo_url: 'https://i.imgur.com/YourLogo.png' // Opcional: logo de tu app
    };
  }

  /**
   * Validar pre-checkout query
   */
  static async validatePreCheckout(preCheckout: any): Promise<boolean> {
    try {
      console.log('🔍 Validando pre-checkout:', preCheckout);

      // Extraer información del payload
      const payloadParts = preCheckout.invoice_payload.split('_');
      if (payloadParts.length < 4 || payloadParts[0] !== 'subscription') {
        console.error('Payload inválido:', preCheckout.invoice_payload);
        return false;
      }

      const planName = payloadParts[1];
      const userid = payloadParts[2];

      // Verificar plan válido
      if (!['basic', 'premium'].includes(planName)) {
        console.error('Plan inválido:', planName);
        return false;
      }

      // Verificar cantidad (en centavos)
      const expectedPrice = planName === 'basic' ? 4.99 : 9.99;
      const expectedAmount = Math.round(expectedPrice * 100);
      
      if (preCheckout.total_amount !== expectedAmount) {
        console.error('Cantidad no coincide:', {
          esperado: expectedAmount,
          recibido: preCheckout.total_amount
        });
        return false;
      }

      console.log('✅ Pre-checkout validado correctamente');
      return true;

    } catch (error) {
      console.error('Error validando pre-checkout:', error);
      return false;
    }
  }

  /**
   * Procesar pago exitoso
   */
  static async processSuccessfulPayment(userid: string, payment: any): Promise<boolean> {
    try {
      console.log('💰 Procesando pago exitoso:', payment);

      // Extraer información del payload
      const payloadParts = payment.invoice_payload.split('_');
      if (payloadParts.length < 4 || payloadParts[0] !== 'subscription') {
        console.error('Payload inválido en pago exitoso:', payment.invoice_payload);
        return false;
      }

      const planName = payloadParts[1];
      const userIdFromPayload = payloadParts[2];

      // Verificar que el userid coincide
      if (userid !== userIdFromPayload) {
        console.error('Usuario no coincide:', { userid, userIdFromPayload });
        return false;
      }

      // Buscar o crear usuario
      let user = await prisma.telegramuser.findUnique({
        where: { telegramuserid: userid }
      });

      if (!user) {
        console.log('👤 Usuario no encontrado, creando...');
        user = await prisma.telegramuser.create({
          data: {
            telegramuserid: userid,
            username: `user_${userid}`,
            firstname: 'Usuario',
            totalpoints: 0
          }
        });
      }

      // Registrar el pago exitoso (simplificado)
      console.log(`✅ Pago procesado: Usuario ${userid} -> Plan ${planName}`);
      console.log(`💳 Telegram Payment ID: ${payment.telegram_payment_charge_id}`);
      console.log(`🏪 Provider Payment ID: ${payment.provider_payment_charge_id}`);
      console.log(`💰 Cantidad: €${(payment.total_amount / 100).toFixed(2)}`);

      // Aquí podrías registrar el pago en una tabla simple si quieres
      // Por ahora solo logeamos para confirmar que funciona

      return true;

    } catch (error) {
      console.error('Error procesando pago exitoso:', error);
      return false;
    }
  }

  /**
   * Generar mensaje de confirmación de pago
   */
  static generatePaymentConfirmation(planName: string, amount: number): string {
    const planDisplayName = planName === 'basic' ? 'Básico' : 'Premium';
    
    return `🎉 <b>¡PAGO CONFIRMADO!</b>

✅ <b>Tu suscripción al plan ${planDisplayName} está ahora activa</b>

📋 <b>Detalles del pago:</b>
💰 Cantidad: €${(amount / 100).toFixed(2)}
💳 Método: Telegram Payments
🆔 Suscripción: Plan ${planDisplayName}

🚀 <b>Ahora puedes disfrutar de:</b>
${planName === 'basic' ? 
  '• 100 preguntas diarias en privado\n• Sistema de preguntas falladas\n• Estadísticas básicas' :
  '• Preguntas ilimitadas en privado\n• Sistema de preguntas falladas\n• Estadísticas avanzadas\n• Simulacros personalizados\n• Análisis con IA\n• Integración con Moodle'
}

¡Disfruta de tu suscripción Premium! 💎

💡 Usa /mi_plan para ver tu estado de suscripción.`;
  }
}

export { PaymentServiceSimple as PaymentService };