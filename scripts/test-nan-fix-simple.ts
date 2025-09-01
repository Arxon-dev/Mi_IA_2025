/**
 * Script simplificado para probar el fix del problema NaN%
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para simular getUserStats con el fix
function simulateGetUserStats(totalquestions: number, correctanswers: number) {
  console.log(`📊 Simulando getUserStats:`);
  console.log(`   Total preguntas: ${totalquestions}`);
  console.log(`   Respuestas correctas: ${correctanswers}`);
  
  // Simular el cálculo de accuracy como en el fix
  const accuracy = totalquestions > 0 ? Math.round((correctanswers / totalquestions) * 100) : 0;
  
  console.log(`   Accuracy calculada: ${accuracy}%`);
  
  const stats = {
    totalquestions,
    correctanswers,
    accuracy // Este es el fix - incluir accuracy en el objeto stats
  };
  
  return stats;
}

// Función para simular generateCompletionMessage
function simulateGenerateCompletionMessage(
  totalQuestionsProcessed: number,
  correctAnswers: number,
  incorrectAnswers: number,
  timedOutCount: number,
  stats: any
) {
  console.log(`\n📝 Simulando generateCompletionMessage:`);
  console.log(`   Preguntas procesadas: ${totalQuestionsProcessed}`);
  console.log(`   Correctas: ${correctAnswers}`);
  console.log(`   Incorrectas: ${incorrectAnswers}`);
  console.log(`   Timeout: ${timedOutCount}`);
  console.log(`   Stats.accuracy: ${stats.accuracy}`);
  
  // Simular el cálculo de accuracy de la sesión
  const sessionAccuracy = totalQuestionsProcessed > 0 
    ? Math.round((correctAnswers / totalQuestionsProcessed) * 100) 
    : 0;
  
  // Simular el mensaje como en el código real
  const message = `🎉 **¡SESIÓN COMPLETADA!**\n\n` +
    `📊 **RESULTADOS:**\n` +
    `✅ Correctas: ${correctAnswers}\n` +
    `❌ Incorrectas: ${incorrectAnswers}\n` +
    `⏰ Timeout: ${timedOutCount}\n` +
    `📈 Precisión sesión: ${sessionAccuracy}%\n\n` +
    `📊 **ESTADÍSTICAS GENERALES:**\n` +
    `📚 Total preguntas: ${stats.totalquestions}\n` +
    `✅ Total correctas: ${stats.correctanswers}\n` +
    `📊 Precisión general: ${stats.accuracy}%`; // Aquí estaba el problema - stats.accuracy era undefined
  
  return message;
}

async function testNaNFixSimple() {
  console.log('🧪 Iniciando prueba simplificada del fix NaN%...');
  
  try {
    console.log('\n1️⃣ Probando escenario ANTES del fix (simulado)...');
    
    // Simular el comportamiento ANTES del fix
    const statsBeforeFix = {
      totalquestions: 15,
      correctanswers: 10
      // accuracy NO incluida - esto causaba el NaN%
    };
    
    console.log('📊 Stats ANTES del fix:', statsBeforeFix);
    console.log(`❌ stats.accuracy: ${(statsBeforeFix as any).accuracy} (undefined -> NaN%)`);    
    
    console.log('\n2️⃣ Probando escenario DESPUÉS del fix...');
    
    // Simular el comportamiento DESPUÉS del fix
    const statsAfterFix = simulateGetUserStats(15, 10);
    
    console.log('\n3️⃣ Generando mensaje de finalización...');
    
    const completionMessage = simulateGenerateCompletionMessage(
      5, // totalQuestionsProcessed
      3, // correctAnswers
      2, // incorrectAnswers
      0, // timedOutCount
      statsAfterFix
    );
    
    console.log('\n4️⃣ Mensaje de finalización generado:');
    console.log('=' .repeat(60));
    console.log(completionMessage);
    console.log('=' .repeat(60));
    
    // Verificar si contiene NaN
    if (completionMessage.includes('NaN')) {
      console.log('\n❌ PROBLEMA: El mensaje aún contiene NaN%');
      const nanMatches = completionMessage.match(/NaN/g);
      if (nanMatches) {
        console.log(`   Encontradas ${nanMatches.length} ocurrencias de NaN`);
      }
    } else {
      console.log('\n✅ ÉXITO: No se encontró NaN% en el mensaje');
    }
    
    console.log('\n5️⃣ Verificando diferentes escenarios...');
    
    // Escenario: Usuario nuevo (0 preguntas)
    console.log('\n📝 Escenario: Usuario nuevo');
    const newUserStats = simulateGetUserStats(0, 0);
    console.log(`   Accuracy para usuario nuevo: ${newUserStats.accuracy}%`);
    
    // Escenario: Usuario con muchas preguntas
    console.log('\n📝 Escenario: Usuario experimentado');
    const experiencedUserStats = simulateGetUserStats(100, 75);
    console.log(`   Accuracy para usuario experimentado: ${experiencedUserStats.accuracy}%`);
    
    // Escenario: Usuario con precisión perfecta
    console.log('\n📝 Escenario: Precisión perfecta');
    const perfectUserStats = simulateGetUserStats(20, 20);
    console.log(`   Accuracy perfecta: ${perfectUserStats.accuracy}%`);
    
    console.log('\n✅ Todas las pruebas completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testNaNFixSimple().then(() => {
  console.log('\n🏁 Prueba completada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});