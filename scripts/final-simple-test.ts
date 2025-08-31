import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002519334308';

async function finalSimpleTest() {
  try {
    console.log('🚀 PRUEBA FINAL SIMPLE');
    console.log('======================');
    
    const pollQuestion = "🔥 ÚLTIMA PRUEBA - ¿2+2?";
    const pollOptions = ["4", "3", "5", "6"];
    const correctOptionIndex = 0; // 4 es correcto
    const questionid = randomUUID();
    
    console.log(`🎯 Pregunta: ${pollQuestion}`);
    console.log(`✅ Respuesta correcta: ${pollOptions[correctOptionIndex]}`);
    console.log('');
    
    // 1. Enviar a Telegram
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
        explanation: "✅ ¡Correcto! 2+2=4 🧮"
      })
    });
    
    const result = await response.json() as any;
    
    if (!result.ok) {
      console.error('❌ Error:', result);
      return;
    }
    
    const pollid = result.result.poll.id;
    console.log(`✅ Enviado! Poll ID: ${pollid}`);
    
    // 2. Guardar en BD
    await prisma.telegrampoll.create({
      data: {
        pollid: pollid,
        questionid: questionid,
        sourcemodel: 'test',
        options: pollOptions,
        correctanswerindex: correctOptionIndex,
        chatid: CHAT_ID
      }
    });
    
    console.log('✅ Guardado en BD');
    console.log('');
    console.log('🎯 CARLOS - HAZ ESTO AHORA:');
    console.log('==========================');
    console.log('1. 📱 Ve al grupo "OpoMelilla"');
    console.log('2. 🔍 Busca: "🔥 ÚLTIMA PRUEBA - ¿2+2?"');
    console.log('3. 👆 Haz click en "4"');
    console.log('4. ⏱️  Espera 30 segundos');
    console.log('');
    console.log('🔍 Mientras tanto, ejecuta:');
    console.log('   npx tsx scripts/monitor-responses.ts');
    console.log('');
    console.log('💡 Si apareces en el dashboard, ¡FUNCIONA!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalSimpleTest(); 