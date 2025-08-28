import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSimulacroPregunta11() {
  try {
    console.log('🔍 DEBUGGING PROBLEMA PREGUNTA 11 DEL SIMULACRO');
    console.log('==============================================');

    const CARLOS_TELEGRAM_ID = '5793286375';

    // 1. Buscar usuario Carlos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: CARLOS_TELEGRAM_ID }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    console.log('✅ Usuario encontrado:', user.firstname);

    // 2. Buscar simulacro activo actual
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

    console.log('✅ Simulacro activo encontrado:', {
      id: activeSimulacro.id,
      startedAt: activeSimulacro.startedAt,
      currentQuestionIndex: activeSimulacro.currentQuestionIndex,
      totalquestions: activeSimulacro.totalquestions
    });

    // 3. Verificar estado de las respuestas hasta la pregunta 11
    console.log('\n📊 ANALIZANDO RESPUESTAS HASTA PREGUNTA 11...');
    console.log('================================================');

    const responses = await prisma.simulacroResponse.findMany({
      where: {
        simulacroId: activeSimulacro.id,
        questionnumber: { lte: 11 }
      },
      orderBy: { questionnumber: 'asc' },
      include: {
        question: true
      }
    });

    console.log(`Total respuestas encontradas (Q1-Q11): ${responses.length}`);

    responses.forEach(response => {
      const status = response.answeredAt ? '✅ RESPONDIDA' : '⏳ PENDIENTE';
      const selectedOption = response.selectedOption !== null ? response.selectedOption : 'N/A';
      const iscorrect = response.iscorrect !== null ? (response.iscorrect ? '✅' : '❌') : 'N/A';
      
      console.log(`   Q${response.questionnumber}: ${status} | Opción: ${selectedOption} | Correcto: ${iscorrect}`);
      
      if (response.answeredAt) {
        console.log(`      📅 Respondida: ${response.answeredAt}`);
        console.log(`      ⏱️ Tiempo: ${response.responsetime}s`);
      }
    });

    // 4. Verificar específicamente la pregunta 11
    console.log('\n🎯 ANÁLISIS ESPECÍFICO PREGUNTA 11...');
    console.log('====================================');

    const pregunta11Response = responses.find(r => r.questionnumber === 11);
    
    if (!pregunta11Response) {
      console.log('❌ No se encontró respuesta para pregunta 11');
      return;
    }

    console.log('📋 Datos de la pregunta 11:', {
      questionnumber: pregunta11Response.questionnumber,
      questionid: pregunta11Response.questionid,
      answeredAt: pregunta11Response.answeredAt,
      selectedOption: pregunta11Response.selectedOption,
      iscorrect: pregunta11Response.iscorrect,
      skipped: pregunta11Response.skipped
    });

    // 5. Obtener datos completos de la pregunta del examen
    const examenQuestion = await prisma.examenOficial2018.findUnique({
      where: { id: pregunta11Response.questionid }
    });

    if (!examenQuestion) {
      console.log('❌ No se encontró la pregunta del examen oficial');
      return;
    }

    console.log('📚 Datos de la pregunta del examen:', {
      questionnumber: examenQuestion.questionnumber,
      category: examenQuestion.category,
      difficulty: examenQuestion.difficulty,
      question: examenQuestion.question.substring(0, 100) + '...',
      optionsCount: examenQuestion.options.length,
      correctanswerindex: examenQuestion.correctanswerindex
    });

    // 6. Verificar si hay algo específico problemático en esta pregunta
    console.log('\n🔍 VERIFICANDO POSIBLES PROBLEMAS...');
    console.log('====================================');

    // Verificar longitud de la pregunta
    const questionLength = examenQuestion.question.length;
    console.log(`📏 Longitud de la pregunta: ${questionLength} caracteres`);
    if (questionLength > 300) {
      console.log('⚠️ POSIBLE PROBLEMA: Pregunta muy larga para Telegram polls');
    }

    // Verificar opciones
    examenQuestion.options.forEach((option, index) => {
      const optionLength = option.length;
      console.log(`   Opción ${index}: ${optionLength} chars - "${option.substring(0, 50)}${option.length > 50 ? '...' : ''}"`);
      if (optionLength > 100) {
        console.log(`   ⚠️ POSIBLE PROBLEMA: Opción ${index} muy larga para Telegram polls`);
      }
    });

    // 7. Verificar si la pregunta 12 existe
    console.log('\n🎯 VERIFICANDO PREGUNTA 12 (SIGUIENTE)...');
    console.log('=========================================');

    const pregunta12Response = responses.find(r => r.questionnumber === 12);
    if (pregunta12Response) {
      const pregunta12Examen = await prisma.examenOficial2018.findUnique({
        where: { id: pregunta12Response.questionid }
      });
      
      if (pregunta12Examen) {
        console.log('✅ Pregunta 12 existe y está configurada correctamente');
        console.log(`   📏 Longitud: ${pregunta12Examen.question.length} chars`);
        console.log(`   📝 Opciones: ${pregunta12Examen.options.length}`);
      } else {
        console.log('❌ PROBLEMA: Pregunta 12 no existe en ExamenOficial2018');
      }
    } else {
      console.log('❌ PROBLEMA: No hay respuesta configurada para pregunta 12');
    }

    // 8. Simular el procesamiento de la respuesta para pregunta 11
    console.log('\n🧪 SIMULANDO PROCESAMIENTO PREGUNTA 11...');
    console.log('=========================================');

    if (pregunta11Response.answeredAt === null) {
      console.log('ℹ️ Pregunta 11 aún no respondida, simulando respuesta...');
      
      // Simular respuesta correcta
      try {
        const { SimulacroService } = await import('../src/services/simulacroService');
        
        console.log('🔄 Llamando a SimulacroService.processAnswer...');
        const result = await SimulacroService.processAnswer(
          activeSimulacro.id,
          11,
          examenQuestion.correctanswerindex, // Respuesta correcta
          30 // 30 segundos de tiempo
        );
        
        console.log('✅ SimulacroService.processAnswer ejecutado:', {
          iscorrect: result.iscorrect,
          isCompleted: result.isCompleted,
          hasNextQuestion: !!result.nextQuestion,
          nextQuestionNumber: result.nextQuestion?.questionnumber
        });
        
        if (result.nextQuestion) {
          console.log('📋 Datos de la siguiente pregunta (12):', {
            questionnumber: result.nextQuestion.questionnumber,
            questionLength: result.nextQuestion.question.length,
            optionsCount: result.nextQuestion.options.length,
            correctanswerindex: result.nextQuestion.correctanswerindex
          });
          
          // Verificar si esta pregunta podría causar problemas
          if (result.nextQuestion.question.length > 300) {
            console.log('🚨 PROBLEMA DETECTADO: Pregunta 12 demasiado larga para Telegram poll');
          }
          
          result.nextQuestion.options.forEach((option, index) => {
            if (option.length > 100) {
              console.log(`🚨 PROBLEMA DETECTADO: Opción ${index} de pregunta 12 demasiado larga`);
            }
          });
          
        } else {
          console.log('❌ PROBLEMA: SimulacroService no devolvió nextQuestion');
        }
        
      } catch (error) {
        console.error('❌ ERROR en SimulacroService.processAnswer:', error);
      }
    } else {
      console.log('ℹ️ Pregunta 11 ya fue respondida');
    }

    // 9. Verificar estado final del simulacro
    console.log('\n📊 ESTADO FINAL DEL SIMULACRO...');
    console.log('===============================');

    const updatedSimulacro = await prisma.simulacro.findUnique({
      where: { id: activeSimulacro.id }
    });

    console.log('📈 Estado actual del simulacro:', {
      status: updatedSimulacro?.status,
      currentQuestionIndex: updatedSimulacro?.currentQuestionIndex,
      totalquestions: updatedSimulacro?.totalquestions
    });

    // Contar respuestas respondidas vs pendientes
    const respondidas = await prisma.simulacroResponse.count({
      where: {
        simulacroId: activeSimulacro.id,
        answeredAt: { not: null }
      }
    });

    const pendientes = await prisma.simulacroResponse.count({
      where: {
        simulacroId: activeSimulacro.id,
        answeredAt: null
      }
    });

    console.log('📊 Resumen de respuestas:', {
      respondidas,
      pendientes,
      total: respondidas + pendientes
    });

  } catch (error) {
    console.error('❌ Error en debug pregunta 11:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el debug
debugSimulacroPregunta11(); 