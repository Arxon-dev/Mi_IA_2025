import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from './subscriptionService';
import type { paymenttransaction as PaymentTransaction } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface InvoiceData {
  title: string;
  description: string;
  payload: string;
  providerToken: string;
  currency: string;
  prices: Array<{ label: string; amount: number; }>;
  maxTipAmount?: number;
  suggestedTipAmounts?: number[];
  startParameter?: string;
  providerData?: string;
  photoUrl?: string;
  photoSize?: number;
  photoWidth?: number;
  photoHeight?: number;
  needName?: boolean;
  needPhoneNumber?: boolean;
  needEmail?: boolean;
  needShippingAddress?: boolean;
  sendPhoneNumberToProvider?: boolean;
  sendEmailToProvider?: boolean;
  isFlexible?: boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  invoiceUrl?: string;
  paypalOrderId?: string;
  approvalUrl?: string;
  paymentData?: any; // Para datos específicos de PayPal
}

export interface PreCheckoutQuery {
  id: string;
  from: any;
  currency: string;
  totalAmount: number;
  invoicePayload: string;
  shippingOptionId?: string;
  orderInfo?: any;
}

export interface SuccessfulPayment {
  currency: string;
  totalAmount: number;
  invoicePayload: string;
  shippingOptionId?: string;
  orderInfo?: any;
  telegramPaymentChargeId: string;
  providerPaymentChargeId: string;
}

export class PaymentService {
  
  // Configuración específica para España
  private static readonly SPAIN_CONFIG = {
    currency: 'EUR',
    vatRate: 0.21, // IVA 21%
    supportedMethods: ['visa', 'mastercard', 'maestro'],
    needName: true,
    needEmail: true,
    needPhoneNumber: false, // Opcional para Bizum
    sendEmailToProvider: true
  };

  /**
   * Crear factura de Telegram Payments para usuario español
   */
  static async createTelegramInvoice(
    userid: string, 
    planid: string, 
    discountCode?: string
  ): Promise<PaymentResult> {
    try {
      // Obtener plan
      const plan = await prisma.subscriptionplan.findUnique({
        where: { id: planid }
      });

      if (!plan) {
        return { success: false, error: 'Plan no encontrado' };
      }

      // Obtener usuario
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid }
      });

      if (!user) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Calcular precios (ya incluyen IVA en España)
      const priceInCents = Math.round(plan.price * 100); // Convertir a centavos
      const basePrice = Math.round((plan.price / (1 + this.SPAIN_CONFIG.vatRate)) * 100);
      const vatAmount = priceInCents - basePrice;

      // Aplicar descuento si existe
      let finalPrice = priceInCents;
      if (discountCode) {
        finalPrice = await this.applyDiscount(priceInCents, discountCode);
      }

      // Crear payload único para tracking
      const payload = `subscription_${planid}_${userid}_${Date.now()}`;

      // Crear registro de transacción pendiente
      const transaction = await prisma.paymenttransaction.create({
        data: {
          id: crypto.randomUUID(), // Agregar ID único
          userid,
          amount: finalPrice / 100, // Volver a euros
          baseamount: basePrice / 100, // Corregido: baseAmount → baseamount
          vatamount: vatAmount / 100, // Corregido: vatAmount → vatamount
          currency: this.SPAIN_CONFIG.currency,
          status: 'pending',
          paymentmethod: 'telegram',
          transactiontype: 'subscription',
          description: `Suscripción ${plan.displayname} - OpoMelilla Premium`,
          customername: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
          customeremail: user.email,
          createdat: new Date(), // Agregar fecha de creación
          updatedat: new Date()  // Agregar fecha de actualización requerida
        }
      });

      // Configurar invoice data específica para España
      const invoiceData: InvoiceData = {
        title: `${plan.displayname} - OpoMelilla Premium`,
        description: `Suscripción mensual a ${plan.displayname}. Incluye IVA (21%). ${plan.description}`,
        payload,
        providerToken: process.env.STRIPE_SECRET_KEY!,
        currency: this.SPAIN_CONFIG.currency,
        prices: [
          {
            label: `${plan.displayname} (1 mes)`,
            amount: finalPrice
          }
        ],
        needName: this.SPAIN_CONFIG.needName,
        needEmail: this.SPAIN_CONFIG.needEmail,
        needPhoneNumber: this.SPAIN_CONFIG.needPhoneNumber,
        sendEmailToProvider: this.SPAIN_CONFIG.sendEmailToProvider,
        isFlexible: false,
        photoUrl: 'https://your-domain.com/images/logo-premium.png', // Opcional
        startParameter: `plan_${planid}`
      };

      return {
        success: true,
        transactionId: transaction.id,
        invoiceUrl: JSON.stringify(invoiceData) // En Telegram se envía directamente
      };

    } catch (error) {
      console.error('Error creando invoice de Telegram:', error);
      return {
        success: false,
        error: 'Error creando invoice'
      };
    }
  }

  /**
   * Manejar pre-checkout query (validación antes del pago)
   */
  static async handlePreCheckoutQuery(preCheckout: PreCheckoutQuery): Promise<boolean> {
    try {
      console.log('🔍 Pre-checkout query recibido:', preCheckout);

      // Extraer información del payload
      const payloadParts = preCheckout.invoicePayload.split('_');
      if (payloadParts.length < 4 || payloadParts[0] !== 'subscription') {
        console.error('Payload inválido:', preCheckout.invoicePayload);
        return false;
      }

      const planId = payloadParts[1];
      const userid = payloadParts[2];

      // Verificar que el plan existe y está activo
      const plan = await prisma.subscriptionplan.findUnique({
        where: { id: planId, isactive: true }
      });

      if (!plan) {
        console.error('Plan no encontrado o inactivo:', planId);
        return false;
      }

      // Verificar que el usuario existe
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid }
      });

      if (!user) {
        console.error('Usuario no encontrado:', userid);
        return false;
      }

      // Verificar que la cantidad coincide (en centavos)
      const expectedAmount = Math.round(plan.price * 100);
      if (preCheckout.totalAmount !== expectedAmount) {
        console.error('Cantidad no coincide:', {
          esperado: expectedAmount,
          recibido: preCheckout.totalAmount
        });
        return false;
      }

      console.log('✅ Pre-checkout query validado correctamente');
      return true;

    } catch (error) {
      console.error('Error en pre-checkout query:', error);
      return false;
    }
  }

  /**
   * Procesar pago exitoso de Telegram
   */
  static async processSuccessfulPayment(
    userid: string,
    payment: SuccessfulPayment
  ): Promise<boolean> {
    try {
      console.log('💰 Procesando pago exitoso:', payment);

      // Extraer información del payload
      const payloadParts = payment.invoicePayload.split('_');
      if (payloadParts.length < 4 || payloadParts[0] !== 'subscription') {
        console.error('Payload inválido en pago exitoso:', payment.invoicePayload);
        return false;
      }

      const planId = payloadParts[1];
      const userIdFromPayload = payloadParts[2];

      // Verificar que el userid coincide
      if (userid !== userIdFromPayload) {
        console.error('Usuario no coincide:', { userid, userIdFromPayload });
        return false;
      }

      // Usar transacción de BD para consistencia
      const result = await prisma.$transaction(async (tx) => {
        // Buscar transacción pendiente
        const transaction = await tx.paymenttransaction.findFirst({
          where: {
            userid,
            status: 'pending',
            paymentmethod: 'telegram'
          },
          orderBy: { createdat: 'desc' }
        });

        if (!transaction) {
          throw new Error('Transacción pendiente no encontrada');
        }

        // Actualizar transacción como completada
        await tx.paymenttransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'completed',
            telegrampaymentid: payment.telegramPaymentChargeId,
            externaltransactionid: payment.providerPaymentChargeId,
            completedat: new Date(),
            updatedat: new Date()
          }
        });

        // Activar o actualizar suscripción
        const activationSuccess = await SubscriptionService.upgradeSubscription(userid, planId);
        if (!activationSuccess) {
          throw new Error('Error activando suscripción');
        }

        return transaction;
      });

      // Generar factura española (opcional, para registros)
      await this.generateSpanishInvoice(result.id);

      console.log('✅ Pago procesado exitosamente, suscripción activada');
      return true;

    } catch (error) {
      console.error('Error procesando pago exitoso:', error);
      
      // Marcar transacción como fallida si existe
      try {
        await prisma.paymenttransaction.updateMany({
          where: {
            userid,
            status: 'pending',
            paymentmethod: 'telegram'
          },
          data: {
            status: 'failed',
            failurereason: error.message,
            updatedat: new Date()
          }
        });
      } catch (updateError) {
        console.error('Error actualizando transacción fallida:', updateError);
      }

      return false;
    }
  }

  /**
   * Manejar pago fallido
   */
  static async processFailedPayment(
    userid: string,
    reason: string,
    telegramPaymentId?: string
  ): Promise<void> {
    try {
      console.log('❌ Procesando pago fallido:', { userid, reason });

      await prisma.paymenttransaction.updateMany({
        where: {
          userid,
          status: 'pending',
          paymentmethod: 'telegram'
        },
        data: {
          status: 'failed',
          failurereason: reason,
          telegrampaymentid: telegramPaymentId,
          updatedat: new Date()
        }
      });

    } catch (error) {
      console.error('Error procesando pago fallido:', error);
    }
  }

  /**
   * Aplicar código de descuento
   */
  private static async applyDiscount(originalPrice: number, discountCode: string): Promise<number> {
    // Implementar lógica de descuentos aquí
    // Por ahora, solo algunos códigos de ejemplo
    const discounts = {
      'BIENVENIDA10': 0.10, // 10% descuento
      'ESTUDIANTE15': 0.15, // 15% descuento
      'VERANO20': 0.20      // 20% descuento
    };

    const discount = discounts[discountCode.toUpperCase()];
    if (discount) {
      return Math.round(originalPrice * (1 - discount));
    }

    return originalPrice;
  }

  /**
   * Generar factura española (PDF)
   */
  private static async generateSpanishInvoice(transactionId: string): Promise<void> {
    try {
      // Implementar generación de factura PDF aquí
      // Por ahora solo registrar que se debe generar
      console.log('📄 Generando factura española para transacción:', transactionId);
      
      // Actualizar transacción con número de factura
      const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      await prisma.paymenttransaction.update({
        where: { id: transactionId },
        data: {
          invoicenumber: invoiceNumber, // Corregido: usar variable en lugar de shorthand
          invoicepath: `/facturas/${invoiceNumber}.pdf` // Corregido: invoicePath → invoicepath
        }
      });

    } catch (error) {
      console.error('Error generando factura española:', error);
    }
  }

  /**
   * Obtener historial de transacciones del usuario
   */
  static async getUserTransactions(userid: string): Promise<PaymentTransaction[]> {
    try {
      return await prisma.paymenttransaction.findMany({
        where: { userid },
        orderBy: { createdat: 'desc' },
        take: 20 // Últimas 20 transacciones
      });
    } catch (error) {
      console.error('Error obteniendo transacciones del usuario:', error);
      return [];
    }
  }

  /**
   * Procesar reembolso
   */
  static async processRefund(
    transactionId: string,
    reason: string,
    amount?: number
  ): Promise<boolean> {
    try {
      const transaction = await prisma.paymenttransaction.findUnique({
        where: { id: transactionId },
        // include removed for MySQL compatibility
      });

      if (!transaction) {
        return false;
      }

      const refundAmount = amount || transaction.amount;

      // Actualizar transacción
      await prisma.paymenttransaction.update({
        where: { id: transactionId },
        data: {
          status: 'refunded',
          refundedat: new Date(), // Corregido: refundedAt → refundedat
          failurereason: reason, // Corregido: failureReason → failurereason
          updatedat: new Date() // Corregido: updatedAt → updatedat
        }
      });

      // Cancelar suscripción si es necesario
      if (transaction.transactiontype === 'subscription') { // Corregido: transactionType → transactiontype
        await SubscriptionService.cancelSubscription(
          transaction.userid, 
          `Reembolso: ${reason}`
        );
      }

      console.log('✅ Reembolso procesado:', {
        transactionId,
        userid: transaction.userid,
        amount: refundAmount
      });

      return true;

    } catch (error) {
      console.error('Error procesando reembolso:', error);
      return false;
    }
  }

  /**
   * Verificar estado de pago
   */
  static async getPaymentStatus(transactionId: string): Promise<string | null> {
    try {
      const transaction = await prisma.paymenttransaction.findUnique({
        where: { id: transactionId },
        select: { status: true }
      });

      return transaction?.status || null;
    } catch (error) {
      console.error('Error verificando estado de pago:', error);
      return null;
    }
  }

  /**
   * Limpiar transacciones antiguas pendientes (tarea de mantenimiento)
   */
  static async cleanupOldPendingTransactions(): Promise<void> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const result = await prisma.paymenttransaction.updateMany({
        where: {
          status: 'pending',
          createdat: {
            lt: oneDayAgo
          }
        },
        data: {
          status: 'cancelled',
          failurereason: 'Timeout - transacción expirada',
          updatedat: new Date()
        }
      });

      console.log(`🧹 Limpieza: ${result.count} transacciones pendientes caducadas`);
    } catch (error) {
      console.error('Error limpiando transacciones antiguas:', error);
    }
  }
}