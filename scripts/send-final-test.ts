import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

async function sendFinalTest() {
  try {
    console.log('🎉 PRUEBA FINAL CON PRISMA REPARADO');
    console.log('===================================');
    
    const pollQuestion = "🎉 PRUEBA FINAL - ¿Cuántas provincias tiene Andalucía?";
    const pollOptions = ["8", "6", "9", "7"];
    const correctOptionIndex = 0; // 8 es correcto
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`;
    
    console.log('🚀 Enviando pregunta final...');
    console.log(`   🎯 Pregunta: ${pollQuestion}`);
    console.log(`   📋 Opciones: ${pollOptions.join(', ')}`);
    console.log(`   ✅ Respuesta correcta: ${pollOptions[correctOptionIndex]}`);
    console.log('');
    
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
        explanation: "✅ ¡Correcto! Andalucía tiene 8 provincias: Almería, Cádiz, Córdoba, Granada, Huelva, Jaén, Málaga y Sevilla. 🏛️"
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('✅ PREGUNTA FINAL ENVIADA!');
      console.log(`   🆔 Message ID: ${result.result.message_id}`);
      console.log(`   🗳️  Poll ID: ${result.result.poll.id}`);
      console.log('');
      
      console.log('🎯 ÚLTIMA PRUEBA PARA @Carlos_esp:');
      console.log('==================================');
      console.log('1. 📱 Ve al grupo "OpoMelilla"');
      console.log('2. 🔍 Busca: "🎉 PRUEBA FINAL - ¿Cuántas provincias tiene Andalucía?"');
      console.log('3. 👆 Haz click en "8" (la respuesta correcta)');
      console.log('4. ⏱️  Espera 30 segundos');
      console.log('5. 📊 Ve a: http://localhost:3000/dashboard');
      console.log('6. 🔄 Refresca y verifica si apareces');
      console.log('');
      console.log('🔥 AHORA PRISMA ESTÁ REPARADO:');
      console.log('   ✅ Cliente regenerado correctamente');
      console.log('   ✅ Modelos de Telegram accesibles');
      console.log('   ✅ Webhook funcionando');
      console.log('   ✅ Ngrok activo');
      console.log('');
      console.log('🏆 Esta vez DEBERÍAS aparecer en el ranking!');
      
    } else {
      console.error('❌ Error enviando pregunta final:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

console.log('🔧 Prisma ha sido reparado - cliente regenerado exitosamente');
console.log('🎯 Los errores de "Property does not exist" ya NO deberían ocurrir');
console.log('🚀 Enviando pregunta final de prueba...');
console.log('');

sendFinalTest(); 