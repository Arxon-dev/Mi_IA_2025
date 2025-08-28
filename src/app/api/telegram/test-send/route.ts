import { NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';
import type { Question } from '@prisma/client';
import { prepareQuizData } from '@/lib/telegramUtils';

const TEST_SEND_ATTEMPT_LIMIT = 5; // Intentar con las últimas N preguntas

export async function POST(request: Request) {
  try {
    console.log('/api/telegram/test-send POST request received');
    const body = await request.json();
    const userProvidedChatId = body.chatid;

    let recentQuestions: Question[] = [];
    try {
      recentQuestions = await PrismaService.getRecentQuestions(TEST_SEND_ATTEMPT_LIMIT);
    } catch (dbError) {
      console.error('Error al obtener preguntas de la base de datos:', dbError);
      return NextResponse.json({ error: 'Error al obtener preguntas para la prueba.' }, { status: 500 });
    }

    if (!recentQuestions || recentQuestions.length === 0) {
      console.log('No se encontraron preguntas recientes en la base de datos.');
      return NextResponse.json({ success: false, message: 'No se encontraron preguntas recientes en la base de datos.' }, { status: 200 });
    }

    let quizSent = false;
    for (const questionToSend of recentQuestions) {
      console.log(`[Test-Send] Intentando procesar pregunta ID: ${questionToSend.id}`);
      const quizData = prepareQuizData(questionToSend.content);

      if (quizData) {
        console.log(`[Test-Send] Datos de quiz preparados para pregunta ID: ${questionToSend.id}`);
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = userProvidedChatId || process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
          console.error('[Test-Send] Error: TELEGRAM_BOT_TOKEN o CHAT_ID no configurados.');
          // Este es un error de configuración, probablemente deberíamos detenernos aquí
          return NextResponse.json({ error: 'Configuración de Telegram incompleta.' }, { status: 500 });
        }

        console.log(`[Test-Send] Enviando Quiz de prueba a Telegram (Chat ID: ${CHAT_ID}): Pregunta: ${quizData.questionText.substring(0,100)}...`);

        const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`;
        const pollPayload: any = {
          chat_id: CHAT_ID,
          question: quizData.questionText,
          options: quizData.options,
          type: 'quiz',
          correct_option_id: quizData.correctOptionIndex,
          is_anonymous: false,
        };

        if (quizData.explanationText) {
          pollPayload.explanation = quizData.explanationText;
          pollPayload.explanation_parse_mode = 'HTML';
        }

        const response = await fetch(TELEGRAM_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pollPayload),
        });

        const result = await response.json();

        if (!result.ok) {
          console.error('[Test-Send] Error de la API de Telegram al enviar poll/quiz:', result);
          // No retornamos error 500 aquí, simplemente logueamos y el loop continuará con la siguiente pregunta
          console.warn(`[Test-Send] Falló el envío para pregunta ID ${questionToSend.id} por error de API, intentando siguiente si hay.`);
        } else {
          console.log('[Test-Send] Quiz de prueba enviado exitosamente a Telegram con pregunta ID:', questionToSend.id);
          quizSent = true;
          // Si se envía exitosamente, salimos del loop y devolvemos éxito
          return NextResponse.json({ success: true, message: 'Quiz de prueba enviado exitosamente a Telegram.' });
        }
      } else {
        console.warn(`[Test-Send] No se pudieron preparar datos de quiz para pregunta ID: ${questionToSend.id}, saltando.`);
      }
    }

    // Si llegamos aquí, es porque el loop terminó y no se envió ningún quiz
    if (!quizSent) {
      console.log('[Test-Send] No se encontró ninguna pregunta compatible en el lote de las últimas', TEST_SEND_ATTEMPT_LIMIT);
      return NextResponse.json({ 
        success: false, 
        message: `No se encontró una pregunta compatible para enviar como quiz en las últimas ${TEST_SEND_ATTEMPT_LIMIT} intentadas.` 
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Error catastrófico en /api/telegram/test-send:', error);
    const errorMessage = error.message || 'Error interno del servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 