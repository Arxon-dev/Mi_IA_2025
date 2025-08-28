import { PaymentResult } from './paymentService';
import { SubscriptionService } from './subscriptionService';
import { SubscriptionPlanService } from './subscriptionPlanService';
import { PrismaService } from './prismaService';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import axios from 'axios';

export interface BizumPaymentData {
  phoneNumber: string;
  amount: number;
  currency: string;
  transactionId: string;
  status: string;
}

export interface BizumOrderResponse {
  success: boolean;
  transactionId?: string;
  bizumOrderId?: string;
  redirectUrl?: string;
  error?: string;
}

export class PaymentServiceBizum {
  private static readonly BIZUM_CONFIG = {
    apiUrl: process.env.BIZUM_API_URL || 'https://api.ppro.com', // Usando PPRO como ejemplo
    merchantId: process.env.BIZUM_MERCHANT_ID,
    apiKey: process.env.BIZUM_API_KEY,
    currency: 'EUR',
    minAmount: 0.50,
    maxAmount: 1000.00,
    dailyLimit: 2000.00,
    monthlyLimit: 5000.00
  };

  /**
   * Crear orden de pago con Bizum
   */
  static async createBizumOrder(
    userid: string, 
    planId: string, 
    phoneNumber: string,
    discountCode?: string
  ): Promise<BizumOrderResponse> {
    try {
      console.log('🟦 [Bizum] Creando orden para:', { userid, planId, phoneNumber });

      // Obtener información del plan
      const plan = await SubscriptionPlanService.getOrCreatePlan(planId as "basic" | "premium");
      if (!plan) {
        return { success: false, error: 'Plan no encontrado' };
      }

      // Validar límites de Bizum
      if (plan.price < this.BIZUM_CONFIG.minAmount || plan.price > this.BIZUM_CONFIG.maxAmount) {
        return { 
          success: false, 
          error: `Monto debe estar entre €${this.BIZUM_CONFIG.minAmount} y €${this.BIZUM_CONFIG.maxAmount}` 
        };
      }

      // Validar formato de teléfono español
      const phoneRegex = /^\+34[6-9]\d{8}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return { 
          success: false, 
          error: 'Número de teléfono español inválido. Formato: +34XXXXXXXXX' 
        };
      }

      // Crear transacción en BD
      const transaction = await PrismaService.createTransaction({
        userid,
        amount: plan.price,
        currency: this.BIZUM_CONFIG.currency,
        paymentmethod: 'bizum',
        transactiontype: 'subscription',
        status: 'pending',
        description: `Suscripción ${plan.displayname}`,
        metadata: JSON.stringify({
          planId,
          phoneNumber,
          discountCode
        })
      });

      console.log('💾 [Bizum] Transacción creada:', transaction.id);

      // Preparar datos para PPRO/Bizum API
      const orderData = {
        tag: 'bizum',
        txtype: 'TRANSACTION',
        countrycode: 'ES',
        currency: this.BIZUM_CONFIG.currency,
        amount: Math.round(plan.price * 100), // Convertir a céntimos
        merchanttxid: transaction.id,
        login: this.BIZUM_CONFIG.merchantId,
        password: this.BIZUM_CONFIG.apiKey,
        'specin.phonenumber': phoneNumber,
        accountholdername: `Usuario ${userid.substring(0, 8)}`,
        notificationurl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/bizum/webhook`,
        returnurl: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success`,
        cancelurl: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/cancel`
      };

      console.log('📤 [Bizum] Enviando orden a PPRO:', JSON.stringify(orderData, null, 2));

      // Llamar a la API de PPRO/Bizum
      const response = await axios.post(
        `${this.BIZUM_CONFIG.apiUrl}/transaction`,
        new URLSearchParams(Object.fromEntries(
          Object.entries({
            ...orderData,
            amount: orderData.amount.toString()
          }).map(([key, value]) => [key, value?.toString() ?? ''])
        )),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      console.log('📥 [Bizum] Respuesta de PPRO:', response.data);

      if (response.data.STATUS === 'PENDING') {
        // Actualizar transacción con el ID externo
        await PrismaService.updateTransaction(transaction.id, {
          externaltransactionid: response.data.TXID,
          bizumtransactionid: response.data.TXID
        });

        return {
          success: true,
          transactionId: transaction.id,
          bizumOrderId: response.data.TXID,
          redirectUrl: response.data.REDIRECTURL
        };
      } else {
        return { 
          success: false, 
          error: response.data.ERRMSG || 'Error creando orden en Bizum' 
        };
      }

    } catch (error) {
      console.error('❌ [Bizum] ERROR DETALLADO:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      return { success: false, error: 'Error interno creando orden Bizum' };
    }
  }

  /**
   * Procesar pago exitoso de Bizum
   */
  static async processSuccessfulPayment(
    userid: string, 
    paymentData: BizumPaymentData
  ): Promise<boolean> {
    try {
      console.log('💰 [Bizum] Procesando pago exitoso:', paymentData);

      // Buscar la transacción por el ID externo
      const transaction = await PrismaService.getTransactionByExternalId(paymentData.transactionId);
      if (!transaction) {
        console.error('[Bizum] Transacción no encontrada:', paymentData.transactionId);
        return false;
      }

      // Verificar que el pago coincida con la transacción
      if (Math.abs(transaction.amount - paymentData.amount) > 0.01) {
        console.error('[Bizum] Monto del pago no coincide con la transacción');
        return false;
      }

      // Actualizar transacción como completada
      await PrismaService.updateTransaction(transaction.id, {
        status: 'completed',
        bizumtransactionid: paymentData.transactionId,
        completedat: new Date(),
        updatedat: new Date()
      });

      // Extraer planId del metadata
      const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
      const planId = metadata.planId;
      
      if (!planId) {
        console.error('[Bizum] No se encontró planId en metadata de la transacción');
        return false;
      }

      // Activar suscripción
      const success = await SubscriptionService.upgradeSubscription(userid, planId);

      if (success) {
        console.log('✅ [Bizum] Pago procesado y suscripción activada exitosamente');
        return true;
      } else {
        console.error('❌ [Bizum] Error activando suscripción');
        return false;
      }

    } catch (error) {
      console.error('❌ [Bizum] Error procesando pago exitoso:', error);
      return false;
    }
  }

  /**
   * Verificar webhook de Bizum
   */
  static async verifyWebhook(headers: any, body: string): Promise<boolean> {
    try {
      // Implementar verificación de webhook según el proveedor
      // Por ahora, verificación básica
      return true;
    } catch (error) {
      console.error('[Bizum] Error verificando webhook:', error);
      return false;
    }
  }

  /**
   * Procesar webhook de Bizum
   */
  static async processWebhook(eventType: string, data: any): Promise<void> {
    try {
      console.log('🔔 [Bizum] Procesando webhook:', { eventType, data });

      switch (eventType) {
        case 'PAYMENT_COMPLETED':
          await this.handlePaymentCompleted(data);
          break;
        case 'PAYMENT_FAILED':
          await this.handlePaymentFailed(data);
          break;
        default:
          console.log('[Bizum] Evento de webhook no manejado:', eventType);
      }
    } catch (error) {
      console.error('[Bizum] Error procesando webhook:', error);
    }
  }

  private static async handlePaymentCompleted(data: any) {
    const transactionId = data.MERCHANTTXID || data.transactionId;
    if (transactionId) {
      const transaction = await prisma.paymenttransaction.findUnique({
        where: { id: transactionId }
      });

      if (transaction && transaction.status === 'pending') {
        const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
        
        await this.processSuccessfulPayment(transaction.userid, {
          phoneNumber: metadata.phoneNumber,
          amount: transaction.amount,
          currency: transaction.currency,
          transactionId: data.TXID || transactionId,
          status: 'completed'
        });
      }
    }
  }

  private static async handlePaymentFailed(data: any) {
    const transactionId = data.MERCHANTTXID || data.transactionId;
    if (transactionId) {
      await PrismaService.updateTransaction(transactionId, {
        status: 'failed',
        failurereason: data.ERRMSG || 'Pago fallido'
      });
    }
  }

  /**
   * Validar número de teléfono español
   */
  static validateSpanishPhone(phoneNumber: string): boolean {
    const phoneRegex = /^\+34[6-9]\d{8}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Formatear número de teléfono
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remover espacios y caracteres especiales
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Añadir +34 si no está presente
    if (!cleaned.startsWith('+34') && cleaned.length === 9) {
      cleaned = '+34' + cleaned;
    }
    
    return cleaned;
  }
}