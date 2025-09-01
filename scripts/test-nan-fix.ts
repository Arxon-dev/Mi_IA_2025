/**
 * Script para probar el fix del problema NaN% en sesiones de estudio
 */

import { PrismaClient } from '@prisma/client';
import { studySessionService } from '../src/services/studySessionService';

const prisma = new PrismaClient();

async function testNaNFix() {
  console.log('🧪 Iniciando prueba del fix NaN%...');
  
  try {
    const testUserId = '123456789';
    const sessionId = 'test_session_' + Date.now();
    
    console.log('\n1️⃣ Creando sesión de prueba directamente en BD...');
    
    // Crear sesión directamente en la base de datos
    const session = await prisma.userstudysession.create({
      data: {
        id: sessionId,
        userid: testUserId,
        subject: 'rroo',
        totalquestions: 5,
        currentindex: 5, // Sesión completada
        questionsasked: JSON.stringify(['q1', 'q2', 'q3', 'q4', 'q5']),
         status: 'completed',
         createdat: new Date(),
         updatedat: new Date(),
         timeoutat: new Date(Date.now() + 300000) // 5 minutos
      }
    });
    
    console.log(`✅ Sesión creada: ${session.id}`);
    
    console.log('\n2️⃣ Creando respuestas de prueba...');
    
    // Crear respuestas de prueba (3 correctas, 2 incorrectas)
    const responses = [
      { correct: true, questionId: 'q1' },
      { correct: false, questionId: 'q2' },
      { correct: true, questionId: 'q3' },
      { correct: false, questionId: 'q4' },
      { correct: true, questionId: 'q5' }
    ];
    
    for (let i = 0; i < responses.length; i++) {
       await prisma.studyresponse.create({
         data: {
           id: `test_response_${sessionId}_${i}`,
           sessionid: sessionId,
           userid: testUserId,
           subject: 'rroo', // Campo requerido
           questionid: responses[i].questionId,
           questionnumber: i + 1, // Campo requerido
           pollid: `test_poll_${i}`,
           iscorrect: responses[i].correct,
           selectedoption: responses[i].correct ? 0 : 1,
           responsetime: 15000,
           answeredat: new Date(),
           createdat: new Date()
         }
       });
     }
    
    console.log(`✅ ${responses.length} respuestas creadas`);
    
    console.log('\n3️⃣ Verificando/creando estadísticas de usuario...');
    
    // Asegurar que existen estadísticas para el usuario
    await prisma.studystats.upsert({
      where: {
        userid_subject: {
          userid: testUserId,
          subject: 'rroo'
        }
      },
      update: {
        totalquestions: { increment: 5 },
        correctanswers: { increment: 3 },
        updatedat: new Date()
      },
      create: {
        id: `stats_${testUserId}_rroo`,
        userid: testUserId,
        subject: 'rroo',
        questionscompleted: '[]',
        totalquestions: 10, // Simular que ya tenía algunas preguntas
        correctanswers: 7, // 70% de precisión general
        currentstreak: 1,
        beststreak: 3,
        createdat: new Date(),
        updatedat: new Date()
      }
    });
    
    console.log('✅ Estadísticas de usuario verificadas');
    
    console.log('\n4️⃣ Generando mensaje de finalización...');
    
    // Generar mensaje de finalización
    const completionMessage = await (studySessionService as any).generateSessionCompletionMessage(sessionId);
    
    console.log('\n5️⃣ Mensaje de finalización generado:');
    console.log('=' .repeat(60));
    console.log(completionMessage);
    console.log('=' .repeat(60));
    
    // Verificar si contiene NaN
    if (completionMessage.includes('NaN')) {
      console.log('\n❌ PROBLEMA: El mensaje aún contiene NaN%');
      console.log('🔍 Buscando todas las ocurrencias de NaN:');
      const nanMatches = completionMessage.match(/NaN/g);
      if (nanMatches) {
        console.log(`   Encontradas ${nanMatches.length} ocurrencias de NaN`);
      }
    } else {
      console.log('\n✅ ÉXITO: No se encontró NaN% en el mensaje');
    }
    
    // Verificar estadísticas específicas
    console.log('\n6️⃣ Verificando cálculos de precisión...');
    
    const stats = await (studySessionService as any).getUserStats(testUserId, 'rroo');
    console.log('📊 Estadísticas obtenidas:');
    console.log(`   Total preguntas: ${stats.totalquestions}`);
    console.log(`   Respuestas correctas: ${stats.correctanswers}`);
    console.log(`   Accuracy calculada: ${stats.accuracy}%`);
    
    if (isNaN(stats.accuracy)) {
      console.log('❌ PROBLEMA: stats.accuracy es NaN');
    } else {
      console.log('✅ stats.accuracy calculada correctamente');
    }
    
    // Limpiar datos de prueba
    console.log('\n7️⃣ Limpiando datos de prueba...');
    
    await prisma.studyresponse.deleteMany({
      where: { sessionid: sessionId }
    });
    
    await prisma.userstudysession.delete({
      where: { id: sessionId }
    });
    
    // Limpiar estadísticas de prueba
    await prisma.studystats.deleteMany({
      where: { 
        userid: testUserId,
        subject: 'rroo'
      }
    });
    
    console.log('✅ Datos de prueba eliminados');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testNaNFix().then(() => {
  console.log('\n🏁 Prueba completada');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});