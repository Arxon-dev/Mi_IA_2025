import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSimulacro2024Webhook() {
  console.log('🧪 PROBANDO FUNCIONALIDAD DEL WEBHOOK SIMULACRO 2024...\n');
  
  try {
    // Verificar que ExamenOficial2024 funciona
    console.log('📋 Test 1: Verificando acceso a ExamenOficial2024...');
    const questions = await (prisma as any).examenOficial2024.findMany({
      take: 5,
      orderBy: { questionnumber: 'asc' }
    });
    console.log(`✅ Encontradas ${questions.length} preguntas del examen 2024`);
    
    // Verificar usuario de prueba
    console.log('\n👤 Test 2: Verificando usuario de prueba...');
    const testUser = await prisma.telegramuser.findFirst({
      where: { telegramuserid: '5793286375' }
    });
    
    if (testUser) {
      console.log(`✅ Usuario encontrado: ${testUser.firstname} (ID: ${testUser.id})`);
      
      // Verificar simulacro activo
      console.log('\n🎯 Test 3: Verificando simulacro activo...');
      const activeSimulacro = await prisma.simulacro.findFirst({
        where: {
          userid: testUser.id,
          status: 'in_progress'
        }
      });
      
      if (activeSimulacro) {
        console.log(`✅ Simulacro activo encontrado: ${activeSimulacro.id}`);
        
        // Verificar respuestas del simulacro
        console.log('\n📝 Test 4: Verificando respuestas del simulacro...');
        const responses = await prisma.simulacroResponse.findMany({
          where: {
            simulacroId: activeSimulacro.id
          },
          take: 10
        });
        
        console.log(`✅ Encontradas ${responses.length} respuestas del simulacro`);
        
        if (responses.length > 0) {
          const unansweredResponse = responses.find(r => !r.answeredAt);
          if (unansweredResponse) {
            console.log(`📋 Primera pregunta sin responder: ${unansweredResponse.questionnumber}`);
            
            // Buscar la pregunta correspondiente
            const question = await (prisma as any).examenOficial2024.findUnique({
              where: { id: unansweredResponse.questionid }
            });
            
            if (question) {
              console.log(`✅ Pregunta encontrada: "${question.question.substring(0, 100)}..."`);
              console.log(`✅ Opciones: ${question.options.length}`);
              console.log(`✅ Respuesta correcta: ${question.correctanswerindex}`);
            } else {
              console.log('❌ No se encontró la pregunta correspondiente');
            }
          } else {
            console.log('✅ Todas las preguntas han sido respondidas');
          }
        }
        
      } else {
        console.log('❌ No hay simulacro activo');
      }
      
    } else {
      console.log('❌ Usuario de prueba no encontrado');
    }
    
    console.log('\n🎉 PRUEBAS COMPLETADAS');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimulacro2024Webhook(); 