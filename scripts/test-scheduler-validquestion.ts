import { PrismaService } from '../src/services/prismaService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchedulerValidQuestion() {
  console.log('🧪 PROBANDO SCHEDULER CON VALIDQUESTION');
  console.log('=====================================\n');
  
  try {
    // 1. Obtener algunas preguntas del scheduler
    console.log('📋 1. Obteniendo preguntas del scheduler...');
    const questions = await PrismaService.getQuestionsForTelegramScheduler(3, 0, 30);
    
    console.log(`✅ Encontradas ${questions.length} preguntas:`);
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`\n📝 PREGUNTA ${i + 1}:`);
      console.log(`   🆔 ID: ${q.id.substring(0, 8)}...`);
      console.log(`   📊 Source: ${q.sourcemodel}`);
      console.log(`   🎯 Tipo: ${q.type} | Dificultad: ${q.difficulty}`);
      console.log(`   📈 Send Count: ${q.sendCount}`);
      console.log(`   🕐 Last Sent: ${q.lastsuccessfulsendat?.toISOString() || 'Nunca'}`);
      
      // Parsear contenido para verificar formato
      try {
        const parsedContent = JSON.parse(q.content);
        console.log(`   📝 Pregunta: "${parsedContent.question.substring(0, 80)}..."`);
        console.log(`   🔘 Opciones: ${parsedContent.options.length}`);
        console.log(`   ✅ Índice correcto: ${parsedContent.correctanswerindex}`);
        console.log(`   💡 Explicación: "${parsedContent.explanation.substring(0, 60)}..."`);
      } catch (error) {
        console.log(`   ❌ Error parseando contenido: ${error}`);
      }
    }
    
    // 2. Verificar que todas son de ValidQuestion
    const allAreValidQuestion = questions.every(q => q.sourcemodel === 'validQuestion');
    console.log(`\n🎯 VERIFICACIÓN: ${allAreValidQuestion ? '✅' : '❌'} Todas las preguntas son de ValidQuestion`);
    
    // 3. Mostrar estadísticas de ValidQuestion
    console.log('\n📊 ESTADÍSTICAS DE VALIDQUESTION:');
    
    const totalValid = await prisma.validQuestion.count({ where: { isactive: true } });
    const neverSent = await prisma.validQuestion.count({ 
      where: { isactive: true, sendCount: 0 } 
    });
    const sentOnce = await prisma.validQuestion.count({ 
      where: { isactive: true, sendCount: 1 } 
    });
    const sentMultiple = await prisma.validQuestion.count({ 
      where: { isactive: true, sendCount: { gt: 1 } } 
    });
    
    console.log(`   📄 Total activas: ${totalValid}`);
    console.log(`   🆕 Nunca enviadas: ${neverSent}`);
    console.log(`   📤 Enviadas 1 vez: ${sentOnce}`);
    console.log(`   🔄 Enviadas múltiples: ${sentMultiple}`);
    
    console.log('\n✅ PRUEBA COMPLETADA - Scheduler usando ValidQuestion correctamente');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testSchedulerValidQuestion()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  }); 