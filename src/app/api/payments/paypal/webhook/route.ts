import { NextRequest, NextResponse } from 'next/server';
import { PaymentServicePayPal } from '@/services/paymentServicePayPal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    // Verificar webhook de PayPal
    const isValid = await PaymentServicePayPal.verifyWebhook(headers, body);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Webhook verification failed' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    
    // Procesar evento
    await PaymentServicePayPal.processWebhook(event.event_type, event.resource);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}