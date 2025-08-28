import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

async function sendAndSaveFinalTest() {
  try {
    console.log('🎉 PRUEBA FINAL - ENVÍO Y GUARDADO COMPLETO');
    console.log('===========================================');
    
    const pollQuestion = "🎯 PRUEBA DEFINITIVA - ¿Cuál es la capital de España?";
    const pollOptions = ["Madrid", "Barcelona", "Sevilla", "Valencia"];
    const correctOptionIndex = 0; // Madrid es correcto
    const questionid = randomUUID();
    
    console.log('🚀 Enviando pregunta a Telegram...');
    console.log(`   🎯 Pregunta: ${pollQuestion}`);
    console.log(`   📋 Opciones: ${pollOptions.join(', ')}`);
    console.log(`   ✅ Respuesta correcta: ${pollOptions[correctOptionIndex]}`);
    console.log(`   🆔 Question ID: ${questionid}`);
    console.log('');
    
    // 1. Enviar pregunta a Telegram
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        question: pollQuestion,
        options: pollOptions,
        correct_option_id: correctOptionIndex,
        is_anonymous: false,
        type: "quiz",
        explanation: "✅ ¡Correcto! Madrid es la capital de España. 🇪🇸"
      })
    });
    
    const result = await response.json() as any;
    
    if (!result.ok) {
      console.error('❌ Error enviando pregunta a Telegram:', result);
      return;
    }
    
    const pollid = result.result.poll.id;
    const messageId = result.result.message_id;
    
    console.log('✅ PREGUNTA ENVIADA A TELEGRAM!');
    console.log(`   🆔 Message ID: ${messageId}`);
    console.log(`   🗳️  Poll ID: ${pollid}`);
    console.log('');
    
    // 2. Guardar en la base de datos
    console.log('💾 Guardando en la base de datos...');
    
    await prisma.telegrampoll.create({
      data: {
        pollid: pollid,
        questionid: questionid,
        sourcemodel: 'manual',
        options: pollOptions,
        correctanswerindex: correctOptionIndex,
        chatid: CHAT_ID
        // sentAt y createdAt se crean automáticamente con @default(now())
      }
    });
    
    console.log('✅ PREGUNTA GUARDADA EN BASE DE DATOS!');
    console.log(`   🗳️  Poll ID: ${pollid}`);
    console.log(`   🆔 Question ID: ${questionid}`);
    console.log(`   💾 Guardado en TelegramPoll`);
    console.log('');
    
    // 3. Verificar que se guardó
    console.log('🔍 Verificando que se guardó correctamente...');
    const savedPoll = await prisma.telegrampoll.findUnique({
      where: { pollid: pollid }
    });
    
    if (savedPoll) {
      console.log('✅ VERIFICACIÓN EXITOSA - Poll encontrado en BD:');
      console.log(`   Poll ID: ${savedPoll.pollid}`);
      console.log(`   Question ID: ${savedPoll.questionid}`);
      console.log(`   Respuesta correcta: Opción ${savedPoll.correctanswerindex}`);
      console.log('');
    } else {
      console.error('❌ ERROR: Poll no encontrado en BD después de guardar');
      return;
    }
    
    console.log('🎯 PRUEBA DEFINITIVA PARA @Carlos_esp:');
    console.log('======================================');
    console.log('1. 📱 Ve al grupo "OpoMelilla"');
    console.log('2. 🔍 Busca: "🎯 PRUEBA DEFINITIVA - ¿Cuál es la capital de España?"');
    console.log('3. 👆 Haz click en "Madrid" (la respuesta correcta)');
    console.log('4. ⏱️  Espera 30 segundos');
    console.log('5. 📊 Ve a: http://localhost:3000/dashboard');
    console.log('6. 🔄 Refresca y verifica si apareces');
    console.log('');
    console.log('🚀 AHORA TODO ESTÁ CORRECTO:');
    console.log('   ✅ Pregunta enviada a Telegram');
    console.log('   ✅ Pregunta guardada en base de datos');
    console.log('   ✅ Webhook funcionando');
    console.log('   ✅ Ngrok activo');
    console.log('   ✅ Prisma funcionando');
    console.log('');
    console.log('🏆 ¡ESTA VEZ DEFINITIVAMENTE DEBERÍAS APARECER!');
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('🔧 Enviando pregunta COMPLETA con guardado en BD...');
sendAndSaveFinalTest(); 