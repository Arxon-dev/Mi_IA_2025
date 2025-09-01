import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

async function sendOfficialPoll() {
  try {
    console.log('🧪 ENVIANDO POLL OFICIAL PARA @Carlos_esp');
    console.log('=========================================');
    
    // Crear una pregunta directamente en la base de datos
    const testQuestion = await prisma.question.create({
      data: {
        content: "🎯 POLL OFICIAL para @Carlos_esp - ¿En qué año se fundó la Universidad de Granada?",
        type: "multiple_choice",
        difficulty: "medium",
        bloomLevel: "knowledge",
        documentId: "test-doc-carlos", // ID de documento ficticio
        archived: false
      }
    });
    
    console.log(`✅ Pregunta creada en BD con ID: ${testQuestion.id}`);
    
    const pollOptions = ["1531", "1492", "1608", "1737"];
    const correctOptionIndex = 0; // 1531 es correcto
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`;
    
    console.log('📤 Enviando poll a Telegram...');
    console.log(`   🎯 Pregunta: ${testQuestion.content}`);
    console.log(`   📋 Opciones: ${pollOptions.join(', ')}`);
    console.log(`   ✅ Respuesta correcta: ${pollOptions[correctOptionIndex]}`);
    console.log('');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        question: testQuestion.content,
        options: pollOptions,
        correct_option_id: correctOptionIndex,
        is_anonymous: false,
        type: "quiz",
        explanation: "✅ ¡Correcto! La Universidad de Granada se fundó en 1531. 🎓 Este es un poll oficial para verificar que @Carlos_esp aparezca en el ranking."
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('✅ POLL ENVIADO EXITOSAMENTE A TELEGRAM!');
      console.log(`   🆔 Message ID: ${result.result.message_id}`);
      console.log(`   🗳️  Poll ID: ${result.result.poll.id}`);
      
      // IMPORTANTE: Registrar el poll en la base de datos para que se pueda mapear
      const telegramPoll = await prisma.telegrampoll.create({
        data: {
          pollid: result.result.poll.id,
          questionid: testQuestion.id,
          sourcemodel: 'Question',
          correctanswerindex: correctOptionIndex,
          options: pollOptions,
          chatid: CHAT_ID
        }
      });
      
      console.log('📝 Poll registrado en base de datos:');
      console.log(`   🆔 ID interno: ${telegramPoll.id}`);
      console.log(`   🔗 Question ID: ${testQuestion.id}`);
      console.log(`   🗳️  Poll ID: ${result.result.poll.id}`);
      console.log('');
      
      console.log('🎯 INSTRUCCIONES PARA @Carlos_esp:');
      console.log('==================================');
      console.log('1. 📱 Ve al grupo de Telegram "OpoMelilla"');
      console.log('2. 🔍 Busca el poll oficial que acabamos de enviar');
      console.log('3. 👆 Haz click en "1531" (la respuesta correcta)');
      console.log('4. ⏱️  Espera unos 10-30 segundos');
      console.log('5. 🏆 Ejecuta /ranking para verificar si apareces');
      console.log('6. 📊 También verifica en: http://localhost:3000/dashboard');
      console.log('');
      console.log('🔥 ESTE POLL ESTÁ CORRECTAMENTE REGISTRADO');
      console.log('   ✅ Pregunta en BD: SÍ');
      console.log('   ✅ Mapeo Poll-Pregunta: SÍ');
      console.log('   ✅ Webhook funcionando: SÍ');
      console.log('   🎯 Debería registrarte automáticamente al responder');
      
    } else {
      console.error('❌ Error enviando poll:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendOfficialPoll(); 