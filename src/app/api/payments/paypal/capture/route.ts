import { NextRequest, NextResponse } from 'next/server';
import { PaymentServicePayPal } from '@/services/paymentServicePayPal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, userid } = body;

    if (!orderId || !userid) {
      return NextResponse.json(
        { error: 'orderId y userid son requeridos' },
        { status: 400 }
      );
    }

    // Capturar pago en PayPal
    const captureResult = await PaymentServicePayPal.capturePayPalPayment(orderId);

    if (!captureResult.success) {
      return NextResponse.json(
        { error: captureResult.error },
        { status: 400 }
      );
    }

    // Procesar pago exitoso
    const processResult = await PaymentServicePayPal.processSuccessfulPayment(
      userid,
      captureResult.paymentData!
    );

    if (processResult) {
      return NextResponse.json({
        success: true,
        message: 'Pago procesado exitosamente',
        paymentData: captureResult.paymentData
      });
    } else {
      return NextResponse.json(
        { error: 'Error procesando la suscripción' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error capturando pago PayPal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}