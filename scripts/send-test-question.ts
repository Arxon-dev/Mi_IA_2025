import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002519334308';

// Tipos para la API de Telegram
interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

interface TelegramBotInfo {
  ok: boolean;
  result: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
    can_join_groups: boolean;
    can_read_all_group_messages: boolean;
    supports_inline_queries: boolean;
  };
  description?: string;
}

interface TelegramSendMessageResponse {
  ok: boolean;
  result: {
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

// Preguntas de ejemplo para testing
const testQuestions = [
  {
    id: 'test-q1',
    title: 'Pregunta de Historia',
    text: '¿En qué año se descubrió América?',
    optionA: '1491',
    optionB: '1492',
    optionC: '1493',
    optionD: '1494',
    correctAnswer: 'B' as const
  },
  {
    id: 'test-q2',
    title: 'Pregunta de Geografía',
    text: '¿Cuál es la capital de Francia?',
    optionA: 'Madrid',
    optionB: 'Londres',
    optionC: 'París',
    optionD: 'Roma',
    correctAnswer: 'C' as const
  },
  {
    id: 'test-q3',
    title: 'Pregunta de Ciencias',
    text: '¿Cuál es el elemento más abundante en el universo?',
    optionA: 'Oxígeno',
    optionB: 'Hidrógeno',
    optionC: 'Carbono',
    optionD: 'Helio',
    correctAnswer: 'B' as const
  },
  {
    id: 'test-q4',
    title: 'Pregunta de Literatura',
    text: '¿Quién escribió "Cien años de soledad"?',
    optionA: 'Mario Vargas Llosa',
    optionB: 'Gabriel García Márquez',
    optionC: 'Jorge Luis Borges',
    optionD: 'Pablo Neruda',
    correctAnswer: 'B' as const
  }
];

async function sendMessage(text: string, parseMode: string = 'Markdown'): Promise<TelegramSendMessageResponse> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
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
    console.error('Error enviando mensaje:', error);
    throw error;
  }
}

function formatQuestion(question: typeof testQuestions[0]): string {
  return `🤔 **${question.title}**

${question.text}

A) ${question.optionA}
B) ${question.optionB}
C) ${question.optionC}
D) ${question.optionD}

📝 Responde con la letra correcta
🆔 ID: ${question.id}`;
}

async function sendTestQuestion(questionIndex?: number): Promise<void> {
  try {
    console.log('📤 Enviando pregunta de prueba...\n');

    // Verificar bot primero
    console.log('🤖 Verificando bot...');
    const botResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botInfo = await botResponse.json() as TelegramBotInfo;

    if (!botInfo.ok) {
      throw new Error(`Bot no válido: ${botInfo.description}`);
    }

    console.log('✅ Bot verificado:', botInfo.result.first_name);

    // Seleccionar pregunta
    const qIndex = questionIndex !== undefined ? questionIndex : Math.floor(Math.random() * testQuestions.length);
    const question = testQuestions[qIndex];

    if (!question) {
      throw new Error('Índice de pregunta no válido');
    }

    console.log(`📝 Enviando pregunta ${qIndex + 1}: ${question.title}`);

    // Enviar pregunta
    const questionText = formatQuestion(question);
    const result = await sendMessage(questionText);

    console.log('✅ Pregunta enviada exitosamente!');
    console.log(`📊 ID del mensaje: ${result.result.message_id}`);
    
    // Obtener la respuesta correcta usando el tipo correcto
    const correctAnswerKey = `option${question.correctAnswer}` as keyof typeof question;
    const correctAnswerText = question[correctAnswerKey];
    console.log(`🔍 Respuesta correcta: ${question.correctAnswer} (${correctAnswerText})`);
    
    console.log('\n🎯 Instrucciones para probar:');
    console.log('1. Ve a tu grupo de Telegram');
    console.log('2. Responde al mensaje de la pregunta con la letra correcta');
    console.log('3. El bot debería responder con tus estadísticas');
    console.log('4. Verifica el dashboard: http://localhost:3001/dashboard/gamification');

  } catch (error) {
    console.error('❌ Error enviando pregunta:', error);
    
    if (error instanceof Error) {
      console.error('Detalles:', error.message);
      
      if (error.message.includes('Not Found')) {
        console.log('\n💡 Sugerencias:');
        console.log('- Verificar el token del bot en @BotFather');
        console.log('- Asegurarse de que el bot esté añadido al grupo');
        console.log('- Verificar que el CHAT_ID sea correcto');
      }
    }
    
    process.exit(1);
  }
}

async function sendWelcomeMessage(): Promise<void> {
  try {
    console.log('🎉 Enviando mensaje de bienvenida del sistema de gamificación...\n');

    const welcomeText = `🎮 **¡SISTEMA DE GAMIFICACIÓN ACTIVADO!** 🎮

¡Hola grupo! Tu sistema de gamificación ya está listo para funcionar. 

🎯 **¿Cómo funciona?**
• Responde preguntas para ganar puntos
• Mantén una racha diaria para bonificaciones
• Compite en el ranking con otros usuarios
• Desbloquea logros y sube de nivel

🏆 **Comandos disponibles:**
/ranking - Ver el ranking general
/stats - Ver tus estadísticas
/racha - Información sobre tu racha
/help - Mostrar ayuda

📊 **Sistema de puntos:**
• Respuesta correcta: 10 puntos
• Participación: 5 puntos
• Bonus velocidad: +5 pts (< 30s)
• Bonus ultra rápido: +10 pts (< 10s)

¡Que comience la diversión! 🚀`;

    const result = await sendMessage(welcomeText);
    
    console.log('✅ Mensaje de bienvenida enviado exitosamente!');
    console.log(`📊 ID del mensaje: ${result.result.message_id}`);

  } catch (error) {
    console.error('❌ Error enviando mensaje de bienvenida:', error);
    throw error;
  }
}

async function sendLeaderboardUpdate(): Promise<void> {
  try {
    console.log('🏆 Enviando actualización del ranking...\n');

    // Aquí podrías obtener datos reales del leaderboard
    // Por ahora usamos datos de ejemplo
    const leaderboardText = `🏆 **RANKING ACTUAL** 🏆

🥇 1. juan_estudiante - 695 pts (Nv. 4)
🥈 2. Luis - 150 pts (Nv. 2) 
🥉 3. Carlos - 135 pts (Nv. 2)
🔸 4. maria_quiz - 120 pts (Nv. 2)
🔸 5. ana_smart - 115 pts (Nv. 2)

💪 ¡Sigue participando para escalar posiciones!

📊 Ver estadísticas completas: /stats
🔥 Ver tu racha: /racha`;

    const result = await sendMessage(leaderboardText);
    
    console.log('✅ Actualización del ranking enviada!');
    console.log(`📊 ID del mensaje: ${result.result.message_id}`);

  } catch (error) {
    console.error('❌ Error enviando ranking:', error);
    throw error;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('📤 Script para enviar mensajes de prueba a Telegram\n');
    console.log('Uso: npx tsx scripts/send-test-question.ts [opciones]\n');
    console.log('Opciones:');
    console.log('  --question [número]  Enviar pregunta específica (1-4)');
    console.log('  --welcome           Enviar mensaje de bienvenida');
    console.log('  --ranking           Enviar actualización del ranking');
    console.log('  --help, -h          Mostrar esta ayuda\n');
    console.log('Variables de entorno:');
    console.log('  TELEGRAM_BOT_TOKEN  Token del bot');
    console.log('  TELEGRAM_CHAT_ID    ID del chat/grupo');
    console.log('\nEjemplos:');
    console.log('  npx tsx scripts/send-test-question.ts --question 1');
    console.log('  npx tsx scripts/send-test-question.ts --welcome');
    console.log('  npx tsx scripts/send-test-question.ts --ranking');
    return;
  }

  try {
    if (args.includes('--welcome')) {
      await sendWelcomeMessage();
    } else if (args.includes('--ranking')) {
      await sendLeaderboardUpdate();
    } else if (args.includes('--question')) {
      const questionIndex = args.indexOf('--question');
      const questionnumber = questionIndex !== -1 && args[questionIndex + 1] 
        ? parseInt(args[questionIndex + 1]) - 1 
        : undefined;
      
      if (questionnumber !== undefined && (questionnumber < 0 || questionnumber >= testQuestions.length)) {
        console.error(`❌ Número de pregunta inválido. Usa 1-${testQuestions.length}`);
        process.exit(1);
      }
      
      await sendTestQuestion(questionnumber);
    } else {
      // Sin argumentos, enviar pregunta aleatoria
      await sendTestQuestion();
    }

  } catch (error) {
    console.error('❌ Error en la ejecución:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

export { sendTestQuestion, sendWelcomeMessage, sendLeaderboardUpdate }; 