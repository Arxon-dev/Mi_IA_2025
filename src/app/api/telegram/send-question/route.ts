import { NextRequest, NextResponse } from 'next/server';

interface TelegramPollOption {
  text: string;
}

interface SendPollRequestBody {
  question: string; // Texto de la pregunta
  options: string[]; // Array de strings para las opciones
  correct_option_id: number; // Índice de la opción correcta (0-9)
  explanation?: string; // Explicación opcional
  chat_id?: string; // Opcional: para sobrescribir el chat_id por defecto
}

export async function POST(request: NextRequest) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  // Usar un chat_id por defecto desde variables de entorno, pero permitir que se sobrescriba desde el request
  const DEFAULT_TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Token del bot de Telegram no configurado en variables de entorno (TELEGRAM_BOT_TOKEN)' }, { status: 500 });
  }
  if (!DEFAULT_TELEGRAM_CHAT_ID) {
    // Podríamos permitir que el chat_id sea obligatorio en el cuerpo si no hay uno por defecto.
    // Por ahora, lo haremos opcional en el cuerpo y requerido como variable de entorno por defecto.
    console.warn("Advertencia: TELEGRAM_CHAT_ID no está configurado en variables de entorno. Se requerirá en el cuerpo de la solicitud.")
  }

  try {
    const body = await request.json() as SendPollRequestBody;

    const {
      question,
      options,
      correct_option_id,
      explanation,
      chat_id: request_chat_id, // chat_id que podría venir en el request
    } = body;

    const targetChatId = request_chat_id || DEFAULT_TELEGRAM_CHAT_ID;

    if (!targetChatId) {
        return NextResponse.json({ error: 'Chat ID de Telegram no proporcionado ni configurado por defecto.' }, { status: 400 });
    }

    if (!question || !options || options.length < 2 || options.length > 10 || correct_option_id === undefined || correct_option_id < 0 || correct_option_id >= options.length) {
      return NextResponse.json({ error: 'Datos de la encuesta inválidos. Asegúrate de que la pregunta, opciones (2-10) y correct_option_id son correctos.' }, { status: 400 });
    }
    
    // Adaptar opciones al formato que espera Telegram API si es necesario
    // La API de Telegram espera un array de objetos {text: "opcion"} para polls anónimos, 
    // pero para quizzes, un array de strings es suficiente para el parámetro 'options'.
    // Verificaremos la documentación más reciente si esto causa problemas.
    // Por ahora, asumimos que un array de strings es correcto para type: 'quiz'.

    const pollData = {
      chat_id: targetChatId,
      question: question,
      options: options,
      is_anonymous: false,
      type: 'quiz',
      correct_option_id: correct_option_id,
      explanation: explanation, // Opcional
    };

    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPoll`;

    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(pollData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Error desde la API de Telegram:', responseData);
      return NextResponse.json({ error: 'Error al enviar la pregunta a Telegram', details: responseData }, { status: response.status });
    }

    return NextResponse.json({ message: 'Pregunta enviada a Telegram exitosamente', telegramResponse: responseData }, { status: 200 });

  } catch (error: any) {
    console.error('Error en la API /api/telegram/send-question:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
} 