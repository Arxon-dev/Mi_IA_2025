import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function traceSimulacroCorruption() {
  try {
    console.log('🕵️ TRAZANDO CORRUPCIÓN DE SIMULACRO');
    console.log('=================================');

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

    // 2. Limpiar cualquier simulacro existente
    console.log('\n🧹 LIMPIANDO SIMULACROS EXISTENTES...');
    const existingSimulacros = await prisma.simulacro.findMany({
      where: {
        userid: user.id,
        status: 'in_progress'
      }
    });

    for (const sim of existingSimulacros) {
      await prisma.simulacroResponse.deleteMany({
        where: { simulacroId: sim.id }
      });
      await prisma.simulacro.delete({
        where: { id: sim.id }
      });
    }
    console.log(`✅ Eliminados ${existingSimulacros.length} simulacros existentes`);

    // 3. Crear simulacro usando el MISMO código que SimulacroService
    console.log('\n🏗️ CREANDO SIMULACRO USANDO CÓDIGO REAL...');
    console.log('============================================');

    // Obtener 100 preguntas aleatorias del examen
    const allQuestions = await prisma.examenOficial2018.findMany({
      where: { isactive: true },
      orderBy: { questionnumber: 'asc' }
    });

    console.log('📚 Preguntas obtenidas:', allQuestions.length);

    // Crear el simulacro (EXACTO igual al SimulacroService)
    const simulacro = await prisma.simulacro.create({
      data: {
        userid: user.id,
        status: 'in_progress',
        timelimit: 10800, // 180 minutos
        totalquestions: 100,
        currentQuestionIndex: 0
      }
    });

    console.log('✅ Simulacro creado:', {
      id: simulacro.id,
      status: simulacro.status,
      startedAt: simulacro.startedAt
    });

    // Snapshot inicial (antes de crear respuestas)
    console.log('\n📸 SNAPSHOT INICIAL (antes de crear respuestas):');
    const responsesBeforeCreation = await prisma.simulacroResponse.count({
      where: { simulacroId: simulacro.id }
    });
    console.log(`   Respuestas existentes: ${responsesBeforeCreation}`);

    // Crear todas las respuestas del simulacro (EXACTO igual al SimulacroService)
    console.log('\n📋 CREANDO 100 RESPUESTAS...');
    for (let i = 0; i < 100; i++) {
      const question = allQuestions[i];
      await prisma.simulacroResponse.create({
        data: {
          simulacroId: simulacro.id,
          questionid: question.id,
          questionnumber: i + 1,
          questionCategory: question.category,
          questionDifficulty: question.difficulty,
          answeredAt: null,
          selectedOption: null,
          iscorrect: null,
          responsetime: null,
          skipped: false
        }
      });

      // Checkpoint cada 10 respuestas
      if ((i + 1) % 10 === 0) {
        const answeredSoFar = await prisma.simulacroResponse.count({
          where: {
            simulacroId: simulacro.id,
            answeredAt: { not: null }
          }
        });
        
        if (answeredSoFar > 0) {
          console.log(`🚨 CORRUPCIÓN DETECTADA en respuesta ${i + 1}: ${answeredSoFar} marcadas como respondidas`);
          break;
        } else {
          console.log(`   ✅ Checkpoint ${i + 1}/100: Sin corrupción`);
        }
      }
    }

    // Verificación después de crear todas las respuestas
    console.log('\n📊 VERIFICACIÓN POST-CREACIÓN:');
    const totalResponses = await prisma.simulacroResponse.count({
      where: { simulacroId: simulacro.id }
    });

    const answeredResponses = await prisma.simulacroResponse.count({
      where: {
        simulacroId: simulacro.id,
        answeredAt: { not: null }
      }
    });

    console.log(`   Total respuestas: ${totalResponses}`);
    console.log(`   Marcadas como respondidas: ${answeredResponses}`);

    if (answeredResponses > 0) {
      console.log('🚨 PROBLEMA DETECTADO DESPUÉS DE CREACIÓN');
      
      // Investigar las respuestas corruptas
      const corruptedResponses = await prisma.simulacroResponse.findMany({
        where: {
          simulacroId: simulacro.id,
          answeredAt: { not: null }
        },
        take: 5,
        orderBy: { questionnumber: 'asc' }
      });

      console.log('🔍 Primeras 5 respuestas corruptas:');
      corruptedResponses.forEach(r => {
        console.log(`   Q${r.questionnumber}: answeredAt=${r.answeredAt}, option=${r.selectedOption}, correct=${r.iscorrect}`);
      });

      // ¿Todas tienen la misma fecha?
      const uniqueDates = [...new Set(corruptedResponses.map(r => r.answeredAt?.getTime()))];
      console.log('Fechas únicas de corrupción:', uniqueDates.length);
      
      if (uniqueDates.length === 1) {
        console.log('Todas corrompidas en el mismo momento:', new Date(uniqueDates[0] || 0));
      }

      return simulacro.id; // Devolver ID para continuar investigación
    }

    console.log('✅ SIMULACRO CREADO CORRECTAMENTE');

    // 4. Simular el tiempo que pasa hasta que llega la primera respuesta
    console.log('\n⏰ SIMULANDO TIEMPO TRANSCURRIDO...');
    console.log('===================================');

    // Esperar 2 segundos (simular tiempo real)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar si algo cambió durante la espera
    const answeredAfterWait = await prisma.simulacroResponse.count({
      where: {
        simulacroId: simulacro.id,
        answeredAt: { not: null }
      }
    });

    console.log(`📊 Después de 2 segundos: ${answeredAfterWait} respuestas marcadas como respondidas`);

    if (answeredAfterWait > 0) {
      console.log('🚨 CORRUPCIÓN DETECTADA DESPUÉS DE ESPERAR');
      return simulacro.id;
    }

    // 5. Simular obtener la pregunta actual (como hace el webhook)
    console.log('\n🔍 SIMULANDO OBTENCIÓN DE PREGUNTA ACTUAL...');
    console.log('==============================================');

    const { SimulacroService } = await import('../src/services/simulacroService');
    const currentQuestion = await SimulacroService.getCurrentQuestion(simulacro.id);

    if (currentQuestion) {
      console.log('✅ getCurrentQuestion() funciona:', currentQuestion.questionnumber);
    } else {
      console.log('❌ getCurrentQuestion() devolvió null');
    }

    // Verificar después de getCurrentQuestion
    const answeredAfterGetCurrent = await prisma.simulacroResponse.count({
      where: {
        simulacroId: simulacro.id,
        answeredAt: { not: null }
      }
    });

    console.log(`📊 Después de getCurrentQuestion: ${answeredAfterGetCurrent} respondidas`);

    if (answeredAfterGetCurrent > 0) {
      console.log('🚨 CORRUPCIÓN DETECTADA DESPUÉS DE getCurrentQuestion()');
      return simulacro.id;
    }

    // 6. Todo bien hasta aquí, limpiar
    console.log('\n✅ SIMULACRO PERMANECE ÍNTEGRO');
    console.log('No se detectó corrupción en el proceso normal');
    
    // Limpiar el simulacro de prueba
    await prisma.simulacroResponse.deleteMany({
      where: { simulacroId: simulacro.id }
    });
    await prisma.simulacro.delete({
      where: { id: simulacro.id }
    });
    console.log('🗑️ Simulacro de prueba eliminado');

    return null;

  } catch (error) {
    console.error('❌ Error en trazado:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el trazado
traceSimulacroCorruption().then(corruptedId => {
  if (corruptedId) {
    console.log(`\n🎯 INVESTIGACIÓN NECESARIA: Simulacro ${corruptedId} se corrompió durante el proceso`);
    console.log('Ejecuta debug-simulacro.ts para investigar más');
  }
}); 