import { NextRequest, NextResponse } from 'next/server';
import { studySessionService } from '@/services/studySessionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, action } = body;

    if (!sessionId || action !== 'timeout') {
      return NextResponse.json({ error: 'Invalid timeout request' }, { status: 400 });
    }

    // Manejar timeout de pregunta
    await studySessionService.handleQuestionTimeout(sessionId);

    return NextResponse.json({ success: true, message: 'Timeout handled' });

  } catch (error) {
    console.error('Error manejando timeout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'OK', 
    service: 'Telegram Study Timeout Handler',
    timestamp: new Date().toISOString()
  });
} 