import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

interface TelegramPollResponse {
  ok: boolean;
  result?: {
    message_id: number;
    poll: {
      id: string;
      question: string;
      options: Array<{
        text: string;
        voter_count: number;
      }>;
    };
  };
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { questionId, table } = await request.json();

    if (!questionId || !table) {
      return NextResponse.json(
        { error: 'questionId y table son requeridos' },
        { status: 400 }
      );
    }

    console.log(`🎯 Enviando pregunta ${questionId} de tabla ${table} por Telegram`);

    // Obtener pregunta según la tabla
    let questionData: any = null;

    switch (table) {
      case 'examenoficial2018':
        questionData = await prisma.examenoficial2018.findUnique({
          where: { id: questionId }
        });
        break;
      case 'examenoficial2024':
        questionData = await prisma.examenoficial2024.findUnique({
          where: { id: questionId }
        });
        break;
      case 'validquestion':
        questionData = await prisma.validquestion.findUnique({
          where: { id: questionId }
        });
        break;
      default:
        return NextResponse.json(
          { error: `Tabla ${table} no soportada` },
          { status: 400 }
        );
    }

    if (!questionData) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos para Telegram
    let pollQuestion: string;
    let options: string[];
    let correctAnswerIndex: number;
    let explanation: string;

    if (table === 'validquestion') {
      // Para ValidQuestion usar campos parseados
      pollQuestion = questionData.parsedquestion || 'Pregunta sin título';
      options = JSON.parse(questionData.parsedoptions || '[]');
      correctAnswerIndex = questionData.correctanswerindex || 0;
      explanation = questionData.parsedexplanation || 'Sin explicación';
    } else {
      // Para examenoficial2018 y examenoficial2024
      pollQuestion = questionData.question || 'Pregunta sin título';
      
      // Parsear opciones desde string JSON
      try {
        options = JSON.parse(questionData.options || '[]');
      } catch {
        options = [];
      }
      
      correctAnswerIndex = questionData.correctanswerindex || 0;
      explanation = `📚 ${questionData.category || 'Sin categoría'} | 🎯 ${questionData.difficulty || 'medium'}`;
    }

    // Validaciones
    if (!options || options.length < 2) {
      return NextResponse.json(
        { error: 'La pregunta debe tener al menos 2 opciones' },
        { status: 400 }
      );
    }

    if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
      return NextResponse.json(
        { error: 'Índice de respuesta correcta inválido' },
        { status: 400 }
      );
    }

    // Truncar contenido para límites de Telegram
    let finalPollQuestion = pollQuestion;
    if (finalPollQuestion.length > 280) {
      finalPollQuestion = finalPollQuestion.substring(0, 277) + '...';
    }

    let finalExplanation = explanation;
    if (finalExplanation.length > 150) {
      finalExplanation = finalExplanation.substring(0, 147) + '...';
    }

    // Truncar opciones si son muy largas
    const finalOptions = options.map(option => {
      if (option.length > 100) {
        return option.substring(0, 97) + '...';
      }
      return option;
    });

    console.log('📏 Longitudes:', {
      question: finalPollQuestion.length,
      explanation: finalExplanation.length,
      options: finalOptions.map(opt => opt.length)
    });

    // Enviar poll a Telegram
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        question: finalPollQuestion,
        options: finalOptions,
        type: 'quiz', // Tipo quiz para mostrar respuesta correcta
        correct_option_id: correctAnswerIndex,
        is_anonymous: false, // Para poder rastrear quién responde
        explanation: finalExplanation,
        explanation_parse_mode: 'HTML'
      }),
    });

    const result = await response.json() as TelegramPollResponse;

    if (result.ok && result.result) {
      const pollId = result.result.poll.id;
      const messageId = result.result.message_id;

      console.log('✅ Poll enviado exitosamente:', {
        pollId,
        messageId,
        questionId
      });

      // Guardar mapeo en telegrampoll
      try {
        await prisma.telegrampoll.create({
          data: {
            id: randomUUID(),
            pollid: pollId,
            questionid: questionId,
            sourcemodel: table,
            correctanswerindex: correctAnswerIndex,
            options: JSON.stringify(finalOptions),
            chatid: CHAT_ID,
            createdat: new Date()
          }
        });

        console.log('💾 Mapeo guardado en telegrampoll');
      } catch (error) {
        console.error('❌ Error guardando mapeo:', error);
        // No fallar la respuesta por esto
      }

      return NextResponse.json({
        success: true,
        message: 'Pregunta enviada exitosamente por Telegram',
        data: {
          pollId,
          messageId,
          questionId,
          table
        }
      });
    } else {
      console.error('❌ Error enviando poll a Telegram:', result);
      return NextResponse.json(
        { error: `Error de Telegram: ${result.description || 'Error desconocido'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error en endpoint send-telegram:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}