import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
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

async function parseGiftQuestion(giftContent: string) {
  try {
    // Parsear formato GIFT específico donde la retroalimentación está DENTRO de las opciones
    // GIFT: Pregunta {=A ~B ~C ~D #### RETROALIMENTACIÓN}
    
    console.log('🔍 Contenido GIFT original:', giftContent.substring(0, 200) + '...');
    
    // Extraer título (opcional)
    const titleMatch = giftContent.match(/^::([^:]+)::/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Limpiar contenido
    let content = giftContent.replace(/^::([^:]+)::/, '').trim();
    
    // Buscar las opciones dentro de llaves {}
    const optionsMatch = content.match(/\{([^}]+)\}/s);
    if (!optionsMatch) {
      throw new Error('No se encontraron opciones en formato GIFT');
    }
    
    // Separar pregunta de opciones
    const question = content.replace(/\{[^}]+\}/s, '').trim();
    let optionsBlock = optionsMatch[1];
    
    // Truncar pregunta si es muy larga (máximo 255 caracteres para poll question)
    let finalQuestion = question;
    if (finalQuestion.length > 250) {
      finalQuestion = finalQuestion.substring(0, 247) + '...';
    }
    
    // Separar retroalimentación que está DENTRO del bloque de opciones
    let feedback = '';
    const feedbackPatterns = [
      /####\s*RETROALIMENTACIÓN[:\s]*(.*?)$/s,
      /####\s*(.*?)$/s
    ];
    
    for (const pattern of feedbackPatterns) {
      const feedbackMatch = optionsBlock.match(pattern);
      if (feedbackMatch) {
        feedback = feedbackMatch[1].trim();
        // Remover la retroalimentación del bloque de opciones
        optionsBlock = optionsBlock.replace(pattern, '').trim();
        break;
      }
    }
    
    console.log('📝 Retroalimentación extraída:', feedback.substring(0, 150) + '...');
    
    // Parsear opciones ya limpias
    const options: string[] = [];
    let correctanswerindex = -1;
    
    // Dividir por líneas y procesar cada opción
    const lines = optionsBlock.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      if (line.startsWith('=') || line.startsWith('~')) {
        const iscorrect = line.startsWith('=');
        let text = line.substring(1).trim();
        
        // Truncar opciones que sean demasiado largas para Telegram (máximo 100 caracteres)
        if (text.length > 95) {
          text = text.substring(0, 92) + '...';
        }
        
        if (text) {
          options.push(text);
          if (iscorrect) {
            correctanswerindex = options.length - 1;
          }
        }
      }
    }
    
    console.log('📊 Opciones parseadas:', options);
    console.log('✅ Respuesta correcta en índice:', correctanswerindex);
    
    // Limpiar y truncar feedback para Telegram (máximo 200 caracteres)
    let cleanFeedback = feedback
      .replace(/\\n/g, '\n')  // Convertir \n literales a saltos de línea
      .replace(/\n+/g, '\n')  // Eliminar múltiples saltos de línea consecutivos
      .trim();
    
    // Truncar feedback si es muy largo (Telegram tiene límites estrictos para explanation)
    if (cleanFeedback.length > 180) {
      cleanFeedback = cleanFeedback.substring(0, 177) + '...';
    }
    
    return {
      title,
      question: finalQuestion,
      options,
      correctanswerindex,
      feedback: cleanFeedback || 'Respuesta procesada correctamente'
    };
    
  } catch (error) {
    console.error('Error parseando GIFT:', error);
    // Fallback - devolver pregunta como texto plano con opciones genéricas
    return {
      title: '',
      question: giftContent.length > 200 ? giftContent.substring(0, 197) + '...' : giftContent,
      options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
      correctanswerindex: 0,
      feedback: 'Pregunta procesada en modo fallback'
    };
  }
}

async function sendPollQuestion(questionid: string, sourcemodel: 'document' | 'section' = 'document') {
  try {
    console.log(`🎯 Enviando pregunta como poll: ${questionid}`);
    
    // Obtener pregunta desde la base de datos
    let questionData;
    
    if (sourcemodel === 'document') {
      questionData = await prisma.question.findUnique({
        where: { id: questionid },
        include: { document: true }
      });
    } else {
      questionData = await prisma.sectionQuestion.findUnique({
        where: { id: questionid },
        include: { section: { include: { document: true } } }
      });
    }
    
    if (!questionData) {
      throw new Error(`Pregunta no encontrada: ${questionid}`);
    }
    
    // Parsear contenido GIFT
    const { title, question, options, correctanswerindex, feedback } = await parseGiftQuestion(questionData.content);
    
    console.log('📋 Pregunta parseada:', {
      title: title || 'Sin título',
      question: question.substring(0, 100) + '...',
      optionsCount: options.length,
      correctIndex: correctanswerindex
    });
    
    // Preparar poll para Telegram
    const pollQuestion = title ? `${title}\n\n${question}` : question;
    
    // Truncar pollQuestion si es muy largo (Telegram tiene límite de 300 caracteres)
    let finalPollQuestion = pollQuestion;
    if (finalPollQuestion.length > 280) {
      finalPollQuestion = finalPollQuestion.substring(0, 277) + '...';
    }
    
    if (options.length < 2) {
      throw new Error('Se necesitan al menos 2 opciones para crear un poll');
    }
    
    // Preparar explanation más corta
    const shortExplanation = `📚 ${questionData.difficulty} | 🎯 ${questionData.bloomLevel || 'N/A'}\n${feedback}`;
    let finalExplanation = shortExplanation;
    if (finalExplanation.length > 150) {
      finalExplanation = finalExplanation.substring(0, 147) + '...';
    }
    
    console.log('📏 Longitudes:', {
      question: finalPollQuestion.length,
      explanation: finalExplanation.length,
      options: options.map(opt => opt.length)
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
        options: options,
        type: 'quiz', // Tipo quiz para mostrar respuesta correcta
        correct_option_id: correctanswerindex,
        is_anonymous: false, // Para poder rastrear quién responde
        explanation: finalExplanation,
        explanation_parse_mode: 'HTML'
      }),
    });

    const result = await response.json() as TelegramPollResponse;
    
    if (result.ok && result.result) {
      const pollid = result.result.poll.id;
      const messageId = result.result.message_id;
      
      console.log('✅ Poll enviado exitosamente:');
      console.log('   📩 Message ID:', messageId);
      console.log('   🗳️  Poll ID:', pollid);
      
      // Guardar mapeo poll_id -> question_id en la base de datos
      await prisma.telegrampoll.create({
        data: {
          pollid: pollid,
          questionid: questionid,
          sourcemodel: sourcemodel,
          correctanswerindex: correctanswerindex,
          options: options,
          chatid: CHAT_ID
        }
      });
      
      // Registrar envío en base de datos
      await prisma.telegramSendLog.create({
        data: {
          questionid,
          sourcemodel,
          success: true,
          telegramMsgId: messageId.toString()
        }
      });
      
      // Actualizar estadísticas de la pregunta
      if (sourcemodel === 'document') {
        await prisma.question.update({
          where: { id: questionid },
          data: {
            sendCount: { increment: 1 },
            lastsuccessfulsendat: new Date()
          }
        });
      } else {
        await prisma.sectionQuestion.update({
          where: { id: questionid },
          data: {
            sendCount: { increment: 1 },
            lastsuccessfulsendat: new Date()
          }
        });
      }
      
      return {
        success: true,
        messageId,
        pollid,
        questionData: {
          id: questionid,
          title,
          question,
          options,
          correctanswerindex
        }
      };
      
    } else {
      throw new Error(`Error de Telegram: ${result.description}`);
    }
    
  } catch (error) {
    console.error('❌ Error enviando poll:', error);
    
    // Registrar error en base de datos
    await prisma.telegramSendLog.create({
      data: {
        questionid,
        sourcemodel,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
      }
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función para listar preguntas disponibles
async function listAvailableQuestions() {
  try {
    console.log('📋 PREGUNTAS DISPONIBLES EN LA BASE DE DATOS:\n');
    
    // Obtener preguntas de documentos
    const documentQuestions = await prisma.question.findMany({
      where: { archived: false },
      include: { document: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📄 PREGUNTAS DE DOCUMENTOS:');
    documentQuestions.forEach((q, index) => {
      const preview = q.content.substring(0, 80).replace(/\n/g, ' ') + '...';
      console.log(`   ${index + 1}. [${q.id}] ${preview}`);
      console.log(`      📂 Documento: ${q.document.title}`);
      console.log(`      📊 Enviado: ${q.sendCount} veces`);
      console.log('');
    });
    
    // Obtener preguntas de secciones
    const sectionQuestions = await prisma.sectionQuestion.findMany({
      include: { 
        section: { 
          include: { document: true } 
        } 
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('📑 PREGUNTAS DE SECCIONES:');
    sectionQuestions.forEach((q, index) => {
      const preview = q.content.substring(0, 80).replace(/\n/g, ' ') + '...';
      console.log(`   ${index + 1}. [${q.id}] ${preview}`);
      console.log(`      📂 Sección: ${q.section.title}`);
      console.log(`      📄 Documento: ${q.section.document.title}`);
      console.log(`      📊 Enviado: ${q.sendCount} veces`);
      console.log('');
    });
    
    return { documentQuestions, sectionQuestions };
    
  } catch (error) {
    console.error('❌ Error listando preguntas:', error);
    return { documentQuestions: [], sectionQuestions: [] };
  }
}

// Script principal
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--list')) {
      await listAvailableQuestions();
      return;
    }
    
    const questionIdArg = args.find(arg => arg.startsWith('--id='));
    const sourceModelArg = args.find(arg => arg.startsWith('--source='));
    
    if (questionIdArg) {
      const questionid = questionIdArg.split('=')[1];
      const sourcemodel = sourceModelArg ? sourceModelArg.split('=')[1] as 'document' | 'section' : 'document';
      
      const result = await sendPollQuestion(questionid, sourcemodel);
      
      if (result.success) {
        console.log('🎉 ¡Poll enviado exitosamente!');
      } else {
        console.log('❌ Error:', result.error);
      }
    } else {
      console.log('📋 USO DEL SCRIPT:');
      console.log('');
      console.log('  📝 Listar preguntas disponibles:');
      console.log('     npx tsx scripts/send-poll-question.ts --list');
      console.log('');
      console.log('  📤 Enviar pregunta específica:');
      console.log('     npx tsx scripts/send-poll-question.ts --id=QUESTION_ID --source=document');
      console.log('     npx tsx scripts/send-poll-question.ts --id=QUESTION_ID --source=section');
      console.log('');
      console.log('  🎯 Ejemplo:');
      console.log('     npx tsx scripts/send-poll-question.ts --list');
      console.log('     npx tsx scripts/send-poll-question.ts --id=abc123 --source=document');
    }
    
  } catch (error) {
    console.error('❌ Error en script principal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 