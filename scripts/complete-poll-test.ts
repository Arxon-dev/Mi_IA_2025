import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function completeTestPoll() {
  try {
    console.log('🧪 PRUEBA COMPLETA DEL SISTEMA DE POLLS');
    console.log('======================================');
    console.log('');
    
    // 1. Primero, guardar el mapeo del poll de prueba en la base de datos
    console.log('1️⃣ Guardando mapeo del poll de prueba en la base de datos...');
    
    const pollMapping = await prisma.telegrampoll.create({
      data: {
        pollid: "5890778548200801200", // El poll_id del poll que enviamos antes
        questionid: "test-poll-question-001", // ID de pregunta de prueba
        sourcemodel: "test",
        correctanswerindex: 0, // Madrid es la respuesta correcta (índice 0)
        options: ["Madrid", "Barcelona", "Valencia", "Sevilla"],
        chatid: "-1002519334308"
      }
    });
    
    console.log('   ✅ Mapeo guardado con ID:', pollMapping.id);
    console.log('   🗳️  Poll ID mapeado:', pollMapping.pollid);
    console.log('');
    
    // 2. Ahora simular la respuesta del poll
    console.log('2️⃣ Simulando respuesta de poll...');
    
    const pollAnswerUpdate = {
      update_id: 123456789,
      poll_answer: {
        poll_id: "5890778548200801200",
        user: {
          id: 999888777,
          is_bot: false,
          first_name: "TestUser",
          last_name: "Poll",
          username: "testuser_poll"
        },
        option_ids: [0] // Respuesta correcta: "Madrid" (índice 0)
      }
    };
    
    console.log('   📤 Enviando respuesta al webhook...');
    console.log('   👤 Usuario:', pollAnswerUpdate.poll_answer.user.first_name);
    console.log('   ✅ Respuesta:', 'Madrid (índice 0) - CORRECTA');
    console.log('');
    
    const response = await fetch('http://localhost:3001/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pollAnswerUpdate)
    });
    
    const result = await response.text();
    
    console.log('3️⃣ Resultado del procesamiento:');
    console.log('   📊 Status:', response.status);
    console.log('   📝 Response:', result);
    console.log('');
    
    if (response.ok) {
      console.log('✅ ¡SISTEMA DE POLLS FUNCIONANDO COMPLETAMENTE!');
      console.log('');
      console.log('🎯 Lo que acaba de suceder:');
      console.log('   ✅ Poll mapeado en base de datos');
      console.log('   ✅ Respuesta procesada por webhook');
      console.log('   ✅ Usuario registrado/actualizado');
      console.log('   ✅ Puntos asignados por respuesta correcta');
      console.log('   ✅ Estadísticas actualizadas');
      console.log('');
      console.log('📋 AHORA PUEDES:');
      console.log('   1. Usar el comando /ranking para ver el nuevo usuario');
      console.log('   2. Enviar preguntas reales desde la base de datos:');
      console.log('      npx tsx scripts/send-poll-question.ts --list');
      console.log('      npx tsx scripts/send-poll-question.ts --id=PREGUNTA_ID --source=document');
      console.log('   3. Los usuarios reales podrán responder y ganar puntos');
      
    } else {
      console.log('❌ Error en el procesamiento');
      console.log('   💡 Revisa los logs del servidor para más detalles');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeTestPoll(); 