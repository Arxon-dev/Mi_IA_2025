import { NextRequest, NextResponse } from 'next/server';
import { PaymentServiceBizum } from '@/services/paymentServiceBizum';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('🔔 [Bizum] Webhook recibido:', { headers, body });
    
    // Verificar webhook
    const isValid = await PaymentServiceBizum.verifyWebhook(headers, body);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 401 }
      );
    }

    // Parsear datos del webhook
    const params = new URLSearchParams(body);
    const webhookData = Object.fromEntries(params.entries());
    
    // Determinar tipo de evento basado en el STATUS
    let eventType = 'UNKNOWN';
    if (webhookData.STATUS === 'OK' || webhookData.STATUS === 'SUCCESS') {
      eventType = 'PAYMENT_COMPLETED';
    } else if (webhookData.STATUS === 'FAILED' || webhookData.STATUS === 'ERROR') {
      eventType = 'PAYMENT_FAILED';
    }
    
    // Procesar evento
    await PaymentServiceBizum.processWebhook(eventType, webhookData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Bizum webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}