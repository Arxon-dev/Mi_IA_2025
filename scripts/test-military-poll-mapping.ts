import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función sendTelegramPoll simulada para pruebas
async function sendTelegramPoll(
  chatId: string,
  question: string,
  options: string[],
  correctAnswerIndex: number,
  questionId: string,
  sourceModel: string
): Promise<any> {
  // Simular envío exitoso y guardar mapeo
  const pollId = Date.now().toString() + Math.random().toString().slice(2, 8);
  
  // Guardar mapeo en base de datos
  await prisma.telegrampoll.create({
    data: {
      pollid: pollId,
      questionid: questionId,
      chatid: chatId,
      correctanswerindex: correctAnswerIndex,
      options: JSON.stringify(options),
      sourcemodel: sourceModel,
      createdat: new Date()
    }
  });
  
  console.log(`📤 Poll simulado enviado con ID: ${pollId}`);
  return { poll_id: pollId };
}

/**
 * Script para probar el mapeo de polls de simulacros militares
 */
async function testMilitaryPollMapping() {
  try {
    console.log('🎖️ INICIANDO PRUEBA DE MAPEO DE POLLS MILITARES');
    
    // Datos de prueba
    const testUserId = '5793286375'; // Carlos
    const testSimulationId = 'test-military-sim-' + Date.now();
    const testQuestionNumber = 1;
    const testQuestionId = `military-${testSimulationId}-${testQuestionNumber}`;
    
    console.log('📋 Datos de prueba:', {
      userId: testUserId,
      simulationId: testSimulationId,
      questionId: testQuestionId
    });
    
    // 1. Simular envío de poll militar
    console.log('🗳️ Enviando poll de prueba...');
    
    const pollSent = await sendTelegramPoll(
      testUserId,
      `🎖️ SIMULACRO PERMANENCIA ${testQuestionNumber}/100 ⏱️105min\n\nPregunta de prueba para verificar mapeo`,
      ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
      1, // Respuesta correcta
      testQuestionId,
      'military_simulation'
    );
    
    console.log('📤 Resultado del envío:', pollSent);
    
    if (!pollSent) {
      console.error('❌ Error: No se pudo enviar el poll');
      return;
    }
    
    // 2. Esperar un momento para que se guarde
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Verificar que se guardó el mapeo
    console.log('🔍 Verificando mapeo en base de datos...');
    
    const mappings = await prisma.telegrampoll.findMany({
      where: {
        sourcemodel: 'military_simulation'
      },
      orderBy: {
        createdat: 'desc'
      },
      take: 5
    });
    
    console.log('📊 Mapeos encontrados:', mappings.length);
    
    if (mappings.length > 0) {
      console.log('✅ Últimos mapeos militares:');
      mappings.forEach((mapping: any, index: number) => {
        console.log(`   ${index + 1}. Poll ID: ${mapping.pollid}`);
        console.log(`      Question ID: ${mapping.questionid}`);
        console.log(`      Source Model: ${mapping.sourcemodel}`);
        console.log(`      Chat ID: ${mapping.chatid}`);
        console.log(`      Creado: ${mapping.createdat}`);
        console.log('');
      });
    } else {
      console.log('❌ No se encontraron mapeos militares');
    }
    
    // 4. Buscar mapeos por questionid específico
    const specificMapping = await prisma.telegrampoll.findFirst({
      where: {
        questionid: testQuestionId
      }
    });
    
    if (specificMapping) {
      console.log('✅ Mapeo específico encontrado:', {
        pollId: specificMapping.pollid,
        questionId: specificMapping.questionid,
        sourceModel: specificMapping.sourcemodel
      });
    } else {
      console.log('❌ No se encontró mapeo específico para:', testQuestionId);
    }
    
    // 5. Limpiar datos de prueba (opcional)
    if (specificMapping) {
      await prisma.telegrampoll.delete({
        where: { id: specificMapping.id }
      });
      console.log('🧹 Mapeo de prueba eliminado');
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testMilitaryPollMapping();
}

export { testMilitaryPollMapping };