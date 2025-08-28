import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function testSendPregunta12() {
  try {
    console.log('🧪 PROBANDO ENVÍO DE PREGUNTA 12 DEL SIMULACRO');
    console.log('=============================================');

    const CARLOS_TELEGRAM_ID = '5793286375';

    // 1. Buscar simulacro activo de Carlos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: CARLOS_TELEGRAM_ID }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    const activeSimulacro = await prisma.simulacro.findFirst({
      where: {
        userid: user.id,
        status: 'in_progress'
      },
      orderBy: { startedAt: 'desc' }
    });

    if (!activeSimulacro) {
      console.log('❌ No hay simulacro activo');
      return;
    }

    console.log('✅ Simulacro activo encontrado:', activeSimulacro.id);

    // 2. Obtener la pregunta 12 del simulacro
    const pregunta12Response = await prisma.simulacroResponse.findFirst({
      where: {
        simulacroId: activeSimulacro.id,
        questionnumber: 12
      },
      include: {
        question: true
      }
    });

    if (!pregunta12Response) {
      console.log('❌ Pregunta 12 no encontrada en simulacro');
      return;
    }

    console.log('✅ Pregunta 12 encontrada:', {
      questionnumber: pregunta12Response.questionnumber,
      answeredAt: pregunta12Response.answeredAt,
      questionLength: pregunta12Response.question.question.length,
      optionsCount: pregunta12Response.question.options.length
    });

    // 3. Preparar datos exactos que se enviarían en el webhook
    const timeElapsed = Math.floor((Date.now() - activeSimulacro.startedAt.getTime()) / 1000);
    const timeRemaining = Math.max(0, 10800 - timeElapsed);
    const hoursRemaining = Math.floor(timeRemaining / 3600);
    const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);

    const pollQuestion = `🎯 <b>SIMULACRO EXAMEN OFICIAL 2018</b> ⏰\n\n📝 <b>Pregunta ${pregunta12Response.questionnumber}/100</b>\n⏱️ <b>Tiempo restante: ${hoursRemaining}h ${minutesRemaining}m</b>\n\n${pregunta12Response.question.question}`;
    const pollOptions = pregunta12Response.question.options;
    const correctanswerindex = pregunta12Response.question.correctanswerindex;
    const questionid = `simulacro-${activeSimulacro.id}-${pregunta12Response.questionnumber}`;

    console.log('\n📋 DATOS DEL POLL A ENVIAR:');
    console.log('===========================');
    console.log(`🎯 Pregunta (${pollQuestion.length} chars):`);
    console.log(`   "${pollQuestion.substring(0, 100)}..."`);
    console.log(`📋 Opciones (${pollOptions.length} opciones):`);
    pollOptions.forEach((option, index) => {
      console.log(`   ${index}: "${option}" (${option.length} chars)`);
    });
    console.log(`✅ Respuesta correcta: índice ${correctanswerindex}`);
    console.log(`🆔 Question ID: ${questionid}`);
    console.log(`👤 Chat ID: ${CARLOS_TELEGRAM_ID}`);

    // 4. Verificar límites de Telegram
    console.log('\n📏 VERIFICACIÓN DE LÍMITES:');
    console.log('===========================');
    if (pollQuestion.length > 300) {
      console.log(`🚨 PROBLEMA: Pregunta muy larga (${pollQuestion.length}/300 chars)`);
    } else {
      console.log(`✅ Pregunta OK (${pollQuestion.length}/300 chars)`);
    }

    pollOptions.forEach((option, index) => {
      if (option.length > 100) {
        console.log(`🚨 PROBLEMA: Opción ${index} muy larga (${option.length}/100 chars)`);
      } else {
        console.log(`✅ Opción ${index} OK (${option.length}/100 chars)`);
      }
    });

    if (correctanswerindex < 0 || correctanswerindex >= pollOptions.length) {
      console.log(`🚨 PROBLEMA: Índice de respuesta correcta inválido (${correctanswerindex}/${pollOptions.length})`);
    } else {
      console.log(`✅ Índice correcto OK (${correctanswerindex})`);
    }

    // 5. Simular la llamada exacta a la API de Telegram
    console.log('\n🚀 ENVIANDO POLL A TELEGRAM...');
    console.log('==============================');

    const telegramPayload = {
      chat_id: CARLOS_TELEGRAM_ID,
      question: pollQuestion,
      options: pollOptions,
      type: 'quiz',
      correct_option_id: correctanswerindex,
      is_anonymous: false,
      allows_multiple_answers: false,
      explanation: `💡 Explicación disponible después de responder.`,
      explanation_parse_mode: 'HTML'
    };

    console.log('📤 Payload completo:', JSON.stringify(telegramPayload, null, 2));

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramPayload),
    });

    const result = await response.json() as any;

    console.log('\n📥 RESPUESTA DE TELEGRAM:');
    console.log('========================');
    console.log('Status:', response.status);
    console.log('OK:', result.ok);
    
    if (result.ok) {
      console.log('✅ ¡POLL ENVIADO EXITOSAMENTE!');
      console.log('   📩 Message ID:', result.result.message_id);
      console.log('   🗳️ Poll ID:', result.result.poll.id);
      console.log('   📝 Pregunta enviada:', result.result.poll.question?.substring(0, 100) + '...');
      
      // Registrar en base de datos como haría el webhook
      try {
        await prisma.telegrampoll.create({
          data: {
            pollid: result.result.poll.id,
            questionid: questionid,
            chatid: CARLOS_TELEGRAM_ID,
            correctanswerindex: correctanswerindex,
            options: pollOptions,
            sourcemodel: 'simulacro',
            createdAt: new Date()
          }
        });
        console.log('✅ Poll registrado en BD exitosamente');
      } catch (dbError) {
        console.error('⚠️ Error registrando en BD:', dbError);
      }
      
    } else {
      console.log('❌ ERROR EN EL ENVÍO:');
      console.log('   Código:', result.error_code);
      console.log('   Descripción:', result.description);
      console.log('   Parámetros:', result.parameters);
      
      // Diagnosticar errores comunes
      if (result.description?.includes('POLL_QUESTION_TOO_LONG')) {
        console.log('🚨 DIAGNÓSTICO: La pregunta es demasiado larga');
      } else if (result.description?.includes('POLL_OPTION_TOO_LONG')) {
        console.log('🚨 DIAGNÓSTICO: Una o más opciones son demasiado largas');
      } else if (result.description?.includes('POLL_TOO_MANY_OPTIONS')) {
        console.log('🚨 DIAGNÓSTICO: Demasiadas opciones');
      } else if (result.description?.includes('POLL_QUESTION_TOO_SHORT')) {
        console.log('🚨 DIAGNÓSTICO: La pregunta es demasiado corta');
      } else if (result.description?.includes('Bad Request')) {
        console.log('🚨 DIAGNÓSTICO: Solicitud malformada');
      }
    }

  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSendPregunta12(); 