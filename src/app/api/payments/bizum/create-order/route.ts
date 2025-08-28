import { NextRequest, NextResponse } from 'next/server';
import { PaymentServiceBizum } from '@/services/paymentServiceBizum';
import { SubscriptionService } from '@/services/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userid, planId, phoneNumber, discountCode } = body;

    // Validaciones básicas
    if (!userid || !planId || !phoneNumber) {
      return NextResponse.json(
        { error: 'userid, planId y phoneNumber son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de teléfono
    const formattedPhone = PaymentServiceBizum.formatPhoneNumber(phoneNumber);
    if (!PaymentServiceBizum.validateSpanishPhone(formattedPhone)) {
      return NextResponse.json(
        { error: 'Número de teléfono español inválido. Formato: +34XXXXXXXXX' },
        { status: 400 }
      );
    }

    // Verificar que el usuario no tenga ya una suscripción activa al mismo plan
    const currentSubscription = await SubscriptionService.getCurrentSubscription(userid);
    if (currentSubscription?.status === 'active' && currentSubscription.planid === planId) {
      return NextResponse.json(
        { 
          error: 'Ya tienes una suscripción activa a este plan',
          currentPlan: currentSubscription.planid
        },
        { status: 409 }
      );
    }

    // Crear orden Bizum
    const result = await PaymentServiceBizum.createBizumOrder(
      userid, 
      planId, 
      formattedPhone, 
      discountCode
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      bizumOrderId: result.bizumOrderId,
      redirectUrl: result.redirectUrl
    });

  } catch (error) {
    console.error('Error creando orden Bizum:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}