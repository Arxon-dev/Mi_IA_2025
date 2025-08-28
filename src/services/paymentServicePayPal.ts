import { PaymentResult } from './paymentService';
import { SubscriptionService } from './subscriptionService';
import { SubscriptionPlanService } from './subscriptionPlanService';
import { PrismaService } from './prismaService';
import { prisma } from '@/lib/prisma';
import paypal from '@paypal/checkout-server-sdk';
import { randomUUID } from 'crypto';

export interface PayPalPaymentData {
  orderId: string;
  payerId: string;
  paymentId: string;
  amount: number;
  currency: string;
}

export class PaymentServicePayPal {
  private static paypalClient: paypal.core.PayPalHttpClient;

  private static getPayPalClient() {
    if (!this.paypalClient) {
      const environment = process.env.PAYPAL_ENVIRONMENT === 'live' 
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID!,
            process.env.PAYPAL_CLIENT_SECRET!
          )
        : new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID!,
            process.env.PAYPAL_CLIENT_SECRET!
          );
      
      this.paypalClient = new paypal.core.PayPalHttpClient(environment);
    }
    return this.paypalClient;
  }

  /**
   * Crear orden de PayPal
   */
  static async createPayPalOrder(userid: string, planId: string, discountCode?: string): Promise<PaymentResult> {
    try {
      console.log('🔍 DEBUG PayPal - Iniciando creación de orden');
      console.log('📋 Variables de entorno:', {
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? '✅ Configurado' : '❌ Faltante',
        PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? '✅ Configurado' : '❌ Faltante',
        PAYPAL_ENVIRONMENT: process.env.PAYPAL_ENVIRONMENT || 'No configurado',
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'No configurado'
      });
  
      // Buscar el plan por ID (UUID) en lugar de por nombre
      const plan = await prisma.subscriptionplan.findUnique({
        where: { id: planId }
      });
      
      if (!plan) {
        console.log('❌ Plan no encontrado:', planId);
        return { success: false, error: 'Plan no encontrado' };
      }
  
      console.log('✅ Plan encontrado:', { id: plan.id, name: plan.name, price: plan.price });
  
      // Calcular precio con descuento si aplica
      let finalPrice = plan.price;
      if (discountCode) {
        // Aquí puedes implementar la lógica de descuentos
        // Por ahora usamos el precio base
      }
  
      console.log('💰 Precio final:', finalPrice);
  
      // Crear transacción en la base de datos
      console.log('📝 Creando transacción en BD...');
      const transaction = await PrismaService.createTransaction({
        id: randomUUID(), // Agregar esta línea
        userid,
        amount: finalPrice,
        currency: 'EUR',
        status: 'pending',
        paymentmethod: 'paypal',
        transactiontype: 'subscription',
        description: `Suscripción ${plan.displayname} - OpoMelilla 2025`,
        metadata: JSON.stringify({ planId, planName: plan.name }),
        createdat: new Date(),
        updatedat: new Date()
      });
  
      console.log('✅ Transacción creada:', transaction.id);
  
      // Crear orden en PayPal
      console.log('🟦 Creando orden en PayPal...');
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      
      const orderData = {
        intent: 'CAPTURE' as const,
        purchase_units: [{
          reference_id: transaction.id,
          amount: {
            currency_code: 'EUR',
            value: finalPrice.toFixed(2)
          },
          description: `Suscripción ${plan.displayname} - OpoMelilla 2025`
        }],
        application_context: {
          brand_name: 'OpoMelilla 2025',
          landing_page: 'BILLING' as const,
          user_action: 'PAY_NOW' as const,
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/paypal/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/paypal/cancel`
        }
      };
      
      console.log('📤 Datos de orden PayPal:', JSON.stringify(orderData, null, 2));
      request.requestBody(orderData);
  
      const client = this.getPayPalClient();
      console.log('🔗 Ejecutando request a PayPal...');
      const response = await client.execute(request);
      
      console.log('📥 Respuesta de PayPal:', {
        statusCode: response.statusCode,
        status: response.result?.status,
        id: response.result?.id
      });
      
      if (response.statusCode === 201) {
        // Actualizar transacción con el ID de PayPal
        await PrismaService.updateTransaction(transaction.id, {
          externaltransactionid: response.result.id
        });

        return {
          success: true,
          transactionId: transaction.id,
          paypalOrderId: response.result.id,
          approvalUrl: response.result.links?.find(link => link.rel === 'approve')?.href
        };
      } else {
        return { success: false, error: 'Error creando orden en PayPal' };
      }
    } catch (error) {
      console.error('❌ ERROR DETALLADO PayPal:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        details: error.details || 'No details available'
      });
      return { success: false, error: 'Error interno creando orden PayPal' };
    }
  }

  /**
   * Capturar pago de PayPal
   */
  static async capturePayPalPayment(orderId: string): Promise<PaymentResult> {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      // Para capturar una orden, el requestBody puede estar vacío
      // pero TypeScript requiere el tipo correcto
      request.requestBody({
        payment_source: {}
      } as any);

      const client = this.getPayPalClient();
      const response = await client.execute(request);

      if (response.statusCode === 201 && response.result.status === 'COMPLETED') {
        return {
          success: true,
          paymentData: {
            orderId: response.result.id,
            payerId: response.result.payer?.payer_id,
            paymentId: response.result.purchase_units?.[0]?.payments?.captures?.[0]?.id,
            amount: parseFloat(response.result.purchase_units?.[0]?.amount?.value || '0'),
            currency: response.result.purchase_units?.[0]?.amount?.currency_code || 'EUR'
          }
        };
      } else {
        return { success: false, error: 'Error capturando pago en PayPal' };
      }
    } catch (error) {
      console.error('Error capturando pago PayPal:', error);
      return { success: false, error: 'Error interno capturando pago PayPal' };
    }
  }

  /**
   * Procesar pago exitoso de PayPal
   */
  static async processSuccessfulPayment(userid: string, paymentData: PayPalPaymentData): Promise<boolean> {
    try {
      // Buscar la transacción por el orderId de PayPal
      const transaction = await PrismaService.getTransactionByExternalId(paymentData.orderId);
      if (!transaction) {
        console.error('Transacción no encontrada para orderId:', paymentData.orderId);
        return false;
      }

      // Verificar que el pago coincida con la transacción
      if (Math.abs(transaction.amount - paymentData.amount) > 0.01) {
        console.error('Monto del pago no coincide con la transacción');
        return false;
      }

      // Actualizar transacción como completada
      await PrismaService.updateTransaction(transaction.id, {
        status: 'completed',
        externaltransactionid: paymentData.paymentId,
        completedat: new Date(),
        updatedat: new Date()
      });

      // Extraer planId del metadata
      const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
      const planId = metadata.planId;
      
      if (!planId) {
        console.error('No se encontró planId en metadata de la transacción');
        return false;
      }

      // Usar upgradeSubscription en lugar de createOrUpdateSubscription
      const success = await SubscriptionService.upgradeSubscription(userid, planId);

      if (success) {
        console.log('✅ Suscripción PayPal creada exitosamente para usuario:', userid);
        return true;
      } else {
        console.error('❌ Error creando suscripción PayPal para usuario:', userid);
        return false;
      }
    } catch (error) {
      console.error('Error procesando pago exitoso PayPal:', error);
      return false;
    }
  }

  /**
   * Verificar estado de orden PayPal
   */
  static async verifyPayPalOrder(orderId: string): Promise<any> {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const client = this.getPayPalClient();
      const response = await client.execute(request);
      return response.result;
    } catch (error) {
      console.error('Error verificando orden PayPal:', error);
      return null;
    }
  }

  static async verifyWebhook(headers: any, body: string) {
    try {
      // Implementar verificación de webhook de PayPal
      // Esto requiere configuración adicional de webhooks en PayPal
      return true;
    } catch (error) {
      console.error('Error verifying PayPal webhook:', error);
      return false;
    }
  }

  static async processWebhook(eventType: string, resource: any) {
    try {
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentCompleted(resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePaymentDenied(resource);
          break;
        default:
          console.log(`Unhandled PayPal webhook event: ${eventType}`);
      }
    } catch (error) {
      console.error('Error processing PayPal webhook:', error);
      throw error;
    }
  }

  private static async handlePaymentCompleted(resource: any) {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    if (orderId) {
      await this.capturePayPalPayment(orderId);
    }
  }

  private static async handlePaymentDenied(resource: any) {
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    if (orderId) {
      const transaction = await PrismaService.getTransactionByExternalId(orderId);
      if (transaction) {
        await PrismaService.updateTransaction(transaction.id, {
          status: 'failed'
        });
      }
    }
  }
}