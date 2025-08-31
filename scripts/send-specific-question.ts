import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

// Información del usuario objetivo
const TARGET_USER = {
  username: '@Carlos_esp',
  telegramId: '5793286375'
};

// ID de la pregunta específica a enviar
const QUESTION_ID = 'b7c3a176-9127-4e99-92fc-95e702568c2b';

interface TelegramSendMessageResponse {
  ok: boolean;
  result?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text: string;
  };
  description?: string;
}

interface QuestionData {
  id: string;
  questionNumber: number;
  question: string;
  options: string;
  correctAnswerIndex: number;
  category: string;
  difficulty: string;
}

async function sendPrivateMessage(userId: string, text: string, parseMode: string = 'HTML'): Promise<TelegramSendMessageResponse> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: userId,
        text: text,
        parse_mode: parseMode
      })
    });

    const result = await response.json() as TelegramSendMessageResponse;
    
    if (!result.ok) {
      throw new Error(`Error enviando mensaje: ${result.description}`);
    }

    return result;
  } catch (error) {
    console.error('Error enviando mensaje privado:', error);
    throw error;
  }
}

function parseOptions(optionsString: string): string[] {
  try {
    // Si es un array JSON válido
    if (optionsString.startsWith('[') && optionsString.endsWith(']')) {
      return JSON.parse(optionsString);
    }
    
    // Si es formato {"opción1","opción2","opción3","opción4"}
    if (optionsString.startsWith('{') && optionsString.endsWith('}')) {
      const cleanString = optionsString.slice(1, -1);
      const matches = cleanString.match(/"([^"]*)"/g);
      if (matches) {
        return matches.map(match => match.slice(1, -1));
      }
    }
    
    // Fallback: dividir por comas
    return optionsString.split(',').map(opt => opt.trim().replace(/"/g, ''));
  } catch (error) {
    console.error('Error parseando opciones:', error);
    return [optionsString];
  }
}

function formatQuestionForTelegram(questionData: QuestionData): string {
  const options = parseOptions(questionData.options);
  const letters = ['A', 'B', 'C', 'D'];
  
  let formattedOptions = '';
  options.forEach((option, index) => {
    if (index < 4) {
      formattedOptions += `${letters[index]}) ${option}\n`;
    }
  });
  
  const correctLetter = letters[questionData.correctAnswerIndex] || 'A';
  
  return `🧪 <b>PREGUNTA DE VERIFICACIÓN</b>\n\n` +
         `📝 <b>Pregunta #${questionData.questionNumber}</b>\n` +
         `${questionData.question}\n\n` +
         `${formattedOptions}\n` +
         `✅ <b>Respuesta Correcta:</b> ${correctLetter}) ${options[questionData.correctAnswerIndex] || 'N/A'}\n\n` +
         `📊 <b>Categoría:</b> ${questionData.category}\n` +
         `🎯 <b>Dificultad:</b> ${questionData.difficulty}\n` +
         `🆔 <b>ID:</b> ${questionData.id}\n\n` +
         `<i>Esta pregunta se envía para verificar que los cambios en la base de datos se han guardado correctamente.</i>`;
}

async function getQuestionFromDatabase(questionId: string): Promise<QuestionData | null> {
  try {
    console.log(`🔍 Buscando pregunta con ID: ${questionId}`);
    
    // Buscar en la tabla examenoficial2024
    const question = await prisma.examenoficial2024.findUnique({
      where: { id: questionId }
    });
    
    if (question) {
      console.log('✅ Pregunta encontrada en examenoficial2024');
      return {
        id: question.id,
        questionNumber: question.questionnumber,
        question: question.question,
        options: question.options || '',
        correctAnswerIndex: question.correctanswerindex,
        category: question.category || 'General',
        difficulty: question.difficulty || 'OFICIAL'
      };
    }
    
    console.log('❌ Pregunta no encontrada');
    return null;
  } catch (error) {
    console.error('Error buscando pregunta:', error);
    return null;
  }
}

async function sendSpecificQuestion(): Promise<void> {
  try {
    console.log('🚀 Iniciando envío de pregunta específica...');
    console.log(`👤 Usuario objetivo: ${TARGET_USER.username} (ID: ${TARGET_USER.telegramId})`);
    console.log(`🆔 Pregunta ID: ${QUESTION_ID}`);
    
    // Verificar bot
    console.log('🤖 Verificando bot...');
    const botResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botInfo = await botResponse.json() as any;
    
    if (!botInfo.ok) {
      throw new Error(`Bot no válido: ${botInfo.description}`);
    }
    
    console.log(`✅ Bot verificado: ${botInfo.result.first_name}`);
    
    // Obtener pregunta de la base de datos
    const questionData = await getQuestionFromDatabase(QUESTION_ID);
    
    if (!questionData) {
      throw new Error('Pregunta no encontrada en la base de datos');
    }
    
    console.log(`📝 Pregunta encontrada: #${questionData.questionNumber}`);
    console.log(`📊 Categoría: ${questionData.category}`);
    console.log(`🎯 Dificultad: ${questionData.difficulty}`);
    
    // Formatear y enviar mensaje
    const messageText = formatQuestionForTelegram(questionData);
    
    console.log('📤 Enviando mensaje privado...');
    const result = await sendPrivateMessage(TARGET_USER.telegramId, messageText);
    
    console.log('✅ ¡Pregunta enviada exitosamente!');
    console.log(`📊 ID del mensaje: ${result.result?.message_id}`);
    console.log(`🕒 Fecha de envío: ${new Date().toLocaleString()}`);
    
    console.log('\n🎯 Información enviada:');
    console.log(`- Pregunta #${questionData.questionNumber}`);
    console.log(`- Respuesta correcta: ${['A', 'B', 'C', 'D'][questionData.correctAnswerIndex]}`);
    console.log(`- Categoría: ${questionData.category}`);
    console.log(`- Dificultad: ${questionData.difficulty}`);
    console.log(`- ID de la pregunta: ${questionData.id}`);
    
  } catch (error) {
    console.error('❌ Error enviando pregunta:', error);
    
    if (error instanceof Error) {
      console.error('Detalles:', error.message);
      
      if (error.message.includes('Forbidden')) {
        console.log('\n💡 El usuario debe iniciar una conversación con el bot primero.');
        console.log('Instrucciones para el usuario:');
        console.log('1. Buscar el bot en Telegram');
        console.log('2. Enviar /start al bot');
        console.log('3. Ejecutar este script nuevamente');
      }
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  sendSpecificQuestion();
}

export { sendSpecificQuestion, getQuestionFromDatabase, formatQuestionForTelegram };