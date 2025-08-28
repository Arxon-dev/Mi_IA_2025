import { PrismaClient } from '@prisma/client';
import { SubscriptionPlanService } from './subscriptionPlanService';

const prisma = new PrismaClient();

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

export class PaymentServiceRedsys {
  
  /**
   * Crear datos de invoice para Telegram Payments con Redsys
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
      description: `Suscripción mensual a ${plan.name}. ${plan.description}. IVA (21%) incluido. Pago seguro con Redsys.`,
      payload,
      provider_token: process.env.REDSYS_PROVIDER_TOKEN!, // Usar variable de entorno
      currency: 'EUR',
      prices: [
        {
          label: `Plan ${plan.name} (1 mes)`,
          amount: priceInCents
        }
      ],
      need_name: true,
      need_email: true,
      need_phone_number: false, // Redsys no necesita teléfono obligatorio
      send_email_to_provider: true,
      is_flexible: false,
      photo_url: 'https://i.imgur.com/YourLogo.png' // Logo de tu app
    };
  }

  /**
   * Validar pre-checkout query para Redsys (interfaz compatible)
   */
  static async handlePreCheckoutQuery(preCheckout: {
    id: string;
    from: any;
    currency: string;
    totalAmount: number;
    invoicePayload: string;
    shippingOptionId?: string;
    orderInfo?: any;
  }): Promise<boolean> {
    try {
      console.log('🏦 Validando pre-checkout con Redsys (interfaz nueva):', preCheckout);
  
      // Extraer información del payload
      const payloadParts = preCheckout.invoicePayload.split('_');
      if (payloadParts.length < 4 || payloadParts[0] !== 'subscription') {
        console.error('Payload inválido:', preCheckout.invoicePayload);
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
      
      if (preCheckout.totalAmount !== expectedAmount) {
        console.error('Cantidad no coincide:', {
          esperado: expectedAmount,
          recibido: preCheckout.totalAmount
        });
        return false;
      }
  
      // Verificar que sea EUR (Redsys solo maneja euros)
      if (preCheckout.currency !== 'EUR') {
        console.error('Moneda incorrecta para Redsys:', preCheckout.currency);
        return false;
      }
  
      console.log('✅ Pre-checkout validado correctamente con Redsys');
      return true;
  
    } catch (error) {
      console.error('❌ Error validando pre-checkout con Redsys:', error);
      return false;
    }
  }

  // Mantener el método anterior para compatibilidad
  static async validatePreCheckout(preCheckout: any): Promise<boolean> {
    return this.handlePreCheckoutQuery({
      id: preCheckout.id,
      from: preCheckout.from,
      currency: preCheckout.currency,
      totalAmount: preCheckout.total_amount,
      invoicePayload: preCheckout.invoice_payload,
      shippingOptionId: preCheckout.shipping_option_id,
      orderInfo: preCheckout.order_info
    });
  }

  /**
   * Procesar pago exitoso con Redsys
   */
  static async processSuccessfulPayment(userid: string, payment: any): Promise<boolean> {
    try {
      console.log('🏦 Procesando pago exitoso con Redsys:', payment);

      // Extraer información del payload
      const payloadParts = payment.invoice_payload.split('_');
      if (payloadParts.length < 4 || payloadParts[0] !== 'subscription') {
        console.error('Payload inválido en pago exitoso:', payment.invoice_payload);
        return false;
      }

      const planName = payloadParts[1];
      const userIdFromPayload = payloadParts[2];
      
      // Calcular el monto en euros (payment viene en centavos)
      const amount = payment.total_amount / 100;

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
            id: `user_${userid}_${Date.now()}`, // Generar ID único
            telegramuserid: userid,
            username: `user_${userid}`,
            firstname: 'Usuario',
            totalpoints: 0
          }
        });
      }

      // 🎯 CREAR LA SUSCRIPCIÓN EN LA BASE DE DATOS
      console.log(`✅ Pago procesado con Redsys: Usuario ${userid} -> Plan ${planName}`);
      console.log(`💳 Telegram Payment ID: ${payment.telegram_payment_charge_id}`);
      console.log(`🏦 Redsys Transaction ID: ${payment.provider_payment_charge_id}`);
      console.log(`💰 Cantidad: €${amount.toFixed(2)}`);

      // Buscar el plan en la base de datos
      const subscriptionPlan = await SubscriptionPlanService.getOrCreatePlan(planName);

      if (!subscriptionPlan) {
        console.error('❌ Plan de suscripción no encontrado:', planName);
        return false;
      }

      // Calcular fechas de suscripción (1 mes)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      // Usar UPSERT para crear o actualizar la suscripción (PostgreSQL)
      // ✅ MEJOR: Usar Prisma ORM
      const subscription = await prisma.usersubscription.upsert({
        where: { userid: user.id },
        update: {
          planid: subscriptionPlan.id,
          status: 'active',
          startdate: startDate,
          enddate: endDate,
          autorenew: true,
          telegrampaymentid: payment.telegram_payment_charge_id,
          paymentmethod: 'redsys',
          updatedat: new Date()
        },
        create: {
          id: crypto.randomUUID(),
          userid: user.id,
          planid: subscriptionPlan.id,
          status: 'active',
          startdate: startDate,
          enddate: endDate,
          autorenew: true,
          telegrampaymentid: payment.telegram_payment_charge_id,
          paymentmethod: 'redsys',
          createdat: new Date(),
          updatedat: new Date()
        }
      });
      
      // ✅ CORREGIDO: Crear transacción con UUID() de MySQL
      await prisma.$executeRaw`
        INSERT INTO paymenttransaction (
          id, userid, subscriptionid, amount, currency, paymentmethod,
          status, telegrampaymentid, redsystransactionid, transactiontype, 
          customername, customeremail, description, completedat, createdat, updatedat
        ) VALUES (
          UUID(), ${user.id}, ${subscription.id}, ${amount}, 'EUR', 
          'redsys', 'completed', ${payment.telegram_payment_charge_id}, ${payment.provider_payment_charge_id},
          'subscription', ${payment.order_info?.name || 'N/A'}, ${payment.order_info?.email || 'N/A'},
          ${'Suscripción ' + planName + ' procesada con Redsys'}, NOW(), NOW(), NOW()
        )
      `;

      console.log('🎉 Suscripción creada exitosamente:', {
        userid: user.id,
        planName: subscriptionPlan.displayname,
        planid: subscriptionPlan.id,
        subscriptionId: subscription.id,
        validUntil: endDate.toISOString()
      });

      return true;

    } catch (error) {
      console.error('❌ Error procesando pago exitoso con Redsys:', error);
      return false;
    }
  }

  /**
   * Generar mensaje de confirmación de pago con Redsys
   */
  static generatePaymentConfirmation(planName: string, amount: number): string {
    const planDisplayName = planName === 'basic' ? 'Básico' : 'Premium';
    
    return `🎉 <b>¡PAGO CONFIRMADO CON REDSYS!</b>

✅ <b>Tu suscripción al plan ${planDisplayName} está ahora activa</b>

📋 <b>Detalles del pago:</b>
💰 Cantidad: €${(amount / 100).toFixed(2)}
🏦 Método: Redsys (Sistema bancario español)
🆔 Suscripción: Plan ${planDisplayName}

🔒 <b>Pago 100% seguro:</b>
• Procesado por Redsys (bancos españoles)
• Protección completa del comprador
• Cumple normativas europeas PSD2

🚀 <b>Ahora puedes disfrutar de:</b>
${planName === 'basic' ? 
  '• 100 preguntas diarias en privado\n• Sistema de preguntas falladas\n• Estadísticas básicas' :
  '• Preguntas ilimitadas en privado\n• Sistema de preguntas falladas\n• Estadísticas avanzadas\n• Simulacros personalizados\n• Análisis con IA\n• Integración con Moodle'
}

¡Disfruta de tu suscripción Premium! 💎

💡 Usa /mi_plan para ver tu estado de suscripción.

📞 <b>Soporte:</b> @Carlos_esp`;
  }

  /**
   * Información sobre Redsys para el usuario
   */
  static getRedsysInfo(): string {
    return `🏦 <b>PAGOS CON REDSYS</b>

🇪🇸 <b>Sistema bancario oficial español</b>
✅ Visa, Mastercard, Maestro
✅ Transferencias bancarias
✅ Próximamente: Bizum

🔒 <b>Máxima seguridad:</b>
• Cumple PSD2 europeo
• Protección 3D Secure
• Garantía bancaria española

💰 <b>Sin costes ocultos:</b>
• Lo que ves es lo que pagas
• IVA (21%) ya incluido
• Sin comisiones adicionales`;
  }
}

export { PaymentServiceRedsys as PaymentService };

// ✅ CORREGIDO: Mover el método estático dentro de la clase
export class PaymentServiceRedsysOptimized {
  static async createInvoiceData(planType: string, userId: string): Promise<any> {
    try {
      // Añadir timeout a las operaciones
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 8000)
      );
      
      const dbOperation = async () => {
        // Usar Prisma ORM optimizado
        const user = await prisma.telegramuser.findUnique({
          where: { telegramuserid: userId }
        });
        
        if (!user) {
          throw new Error('Usuario no encontrado');
        }
        
        // Crear datos de invoice según el plan
        return PaymentServiceRedsys.createInvoiceData(planType as 'basic' | 'premium', userId);
      };
      
      return await Promise.race([dbOperation(), timeoutPromise]);
      
    } catch (error) {
      console.error('❌ Error en createInvoiceData:', error);
      throw error;
    }
  }
}