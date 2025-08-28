import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSimulacroPregunta11() {
  try {
    console.log('🧪 SIMULANDO PROCESAMIENTO DE PREGUNTA 11');
    console.log('=========================================');

    const CARLOS_TELEGRAM_ID = '5793286375';

    // 1. Buscar usuario Carlos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: CARLOS_TELEGRAM_ID }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    // 2. Buscar simulacro activo
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

    console.log('✅ Simulacro activo:', activeSimulacro.id);

    // 3. Verificar estado actual de la pregunta 11
    const pregunta11 = await prisma.simulacroResponse.findFirst({
      where: {
        simulacroId: activeSimulacro.id,
        questionnumber: 11
      },
      include: {
        question: true
      }
    });

    if (!pregunta11) {
      console.log('❌ Pregunta 11 no encontrada');
      return;
    }

    console.log('📋 Estado actual de pregunta 11:', {
      questionnumber: pregunta11.questionnumber,
      answeredAt: pregunta11.answeredAt,
      selectedOption: pregunta11.selectedOption,
      iscorrect: pregunta11.iscorrect
    });

    // 4. Si ya está respondida, solo probamos getCurrentQuestion
    if (pregunta11.answeredAt) {
      console.log('ℹ️ Pregunta 11 ya está respondida, probando getCurrentQuestion...');
      
      // Importar y probar getCurrentQuestion
      const { SimulacroService } = await import('../src/services/simulacroService');
      
      console.log('🔍 Llamando a getCurrentQuestion...');
      const nextQuestion = await SimulacroService.getCurrentQuestion(activeSimulacro.id);
      
      if (nextQuestion) {
        console.log('✅ getCurrentQuestion devolvió pregunta:', {
          questionnumber: nextQuestion.questionnumber,
          questionLength: nextQuestion.question.length,
          optionsCount: nextQuestion.options.length
        });
        
        // Verificar si esta pregunta puede enviarse como poll
        console.log('📏 Verificando límites de Telegram:');
        console.log(`   Pregunta: ${nextQuestion.question.length} chars (límite ~300)`);
        
        nextQuestion.options.forEach((option, index) => {
          console.log(`   Opción ${index}: ${option.length} chars - "${option.substring(0, 50)}${option.length > 50 ? '...' : ''}"`);
          if (option.length > 100) {
            console.log(`   🚨 PROBLEMA: Opción ${index} muy larga para Telegram poll`);
          }
        });
        
        if (nextQuestion.question.length > 300) {
          console.log('🚨 PROBLEMA: Pregunta muy larga para Telegram poll');
        }
        
      } else {
        console.log('❌ getCurrentQuestion devolvió null');
        
        // Investigar por qué devolvió null
        console.log('\n🔍 INVESTIGANDO POR QUÉ getCurrentQuestion DEVOLVIÓ NULL...');
        
        // Verificar estado del simulacro
        const simulacroCheck = await prisma.simulacro.findUnique({
          where: { id: activeSimulacro.id }
        });
        
        console.log('📊 Estado del simulacro:', {
          status: simulacroCheck?.status,
          currentQuestionIndex: simulacroCheck?.currentQuestionIndex
        });
        
        // Buscar próxima pregunta sin responder
        const nextResponseDirect = await prisma.simulacroResponse.findFirst({
          where: {
            simulacroId: activeSimulacro.id,
            answeredAt: null,
            skipped: false
          },
          include: {
            question: true
          },
          orderBy: {
            questionnumber: 'asc'
          }
        });
        
        if (nextResponseDirect) {
          console.log('✅ Pregunta sin responder encontrada directamente:', {
            questionnumber: nextResponseDirect.questionnumber,
            questionid: nextResponseDirect.questionid
          });
          
          // Verificar si la pregunta del examen existe
          const examenQuestion = await prisma.examenOficial2018.findUnique({
            where: { id: nextResponseDirect.questionid }
          });
          
          if (examenQuestion) {
            console.log('✅ Pregunta del examen existe');
          } else {
            console.log('❌ PROBLEMA: Pregunta del examen NO EXISTE');
          }
          
        } else {
          console.log('❌ No hay preguntas sin responder (simulacro completado?)');
        }
      }
      
      return;
    }

    // 5. Si no está respondida, simular el procesamiento completo
    console.log('\n🧪 SIMULANDO PROCESAMIENTO COMPLETO...');
    console.log('====================================');

    // Simular respuesta correcta
    const correctOption = pregunta11.question.correctanswerindex;
    console.log('🎯 Simulando respuesta correcta:', correctOption);

    try {
      const { SimulacroService } = await import('../src/services/simulacroService');
      
      console.log('🔄 Llamando a SimulacroService.processAnswer...');
      const result = await SimulacroService.processAnswer(
        activeSimulacro.id,
        11,
        correctOption,
        30 // 30 segundos
      );
      
      console.log('✅ processAnswer completado:', {
        iscorrect: result.iscorrect,
        isCompleted: result.isCompleted,
        hasNextQuestion: !!result.nextQuestion
      });
      
      if (result.nextQuestion) {
        console.log('📋 Siguiente pregunta:', {
          questionnumber: result.nextQuestion.questionnumber,
          questionLength: result.nextQuestion.question.length,
          optionsCount: result.nextQuestion.options.length
        });
        
        // Simular envío del poll
        console.log('\n📤 SIMULANDO ENVÍO DEL POLL...');
        console.log('=============================');
        
        const pollMessage = `🎯 SIMULACRO EXAMEN OFICIAL 2018 ⏰\n\nPregunta ${result.nextQuestion.questionnumber}/100\n\n${result.nextQuestion.question}`;
        
        console.log('📝 Mensaje del poll:');
        console.log(`   Longitud: ${pollMessage.length} caracteres`);
        console.log(`   Contenido: "${pollMessage.substring(0, 100)}..."`);
        
        if (pollMessage.length > 300) {
          console.log('🚨 PROBLEMA: Mensaje del poll muy largo');
        }
        
        console.log('📝 Opciones del poll:');
        result.nextQuestion.options.forEach((option, index) => {
          console.log(`   ${index}: "${option}" (${option.length} chars)`);
        });
        
        // Simular llamada a sendTelegramPoll (sin hacerla realmente)
        console.log('🟡 Simulando sendTelegramPoll... (no se envía realmente)');
        console.log('✅ Poll simulado exitosamente');
        
      } else {
        console.log('❌ No hay siguiente pregunta');
      }
      
    } catch (error) {
      console.error('❌ Error en processAnswer:', error);
    }

  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimulacroPregunta11(); 