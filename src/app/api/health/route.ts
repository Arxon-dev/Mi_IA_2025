import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'Telegram Webhook',
    timestamp: new Date().toISOString(),
    polls_enabled: true
  });
} 