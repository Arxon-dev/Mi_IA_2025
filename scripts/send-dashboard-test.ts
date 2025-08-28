import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

async function sendDashboardTest() {
  try {
    console.log('🧪 ENVIANDO PREGUNTA PARA PROBAR DASHBOARD');
    console.log('==========================================');
    
    const pollQuestion = "📊 TEST DASHBOARD - ¿Cuál es la capital de Andalucía?";
    const pollOptions = ["Sevilla", "Granada", "Córdoba", "Málaga"];
    const correctOptionIndex = 0; // Sevilla es correcto
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`;
    
    console.log('📤 Enviando pregunta de prueba...');
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
        explanation: "✅ ¡Correcto! Sevilla es la capital de Andalucía. 🏛️"
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('✅ PREGUNTA ENVIADA EXITOSAMENTE!');
      console.log(`   🆔 Message ID: ${result.result.message_id}`);
      console.log(`   🗳️  Poll ID: ${result.result.poll.id}`);
      console.log('');
      
      console.log('🎯 INSTRUCCIONES PARA @Carlos_esp:');
      console.log('==================================');
      console.log('1. 📱 Ve al grupo "OpoMelilla" en Telegram');
      console.log('2. 🔍 Busca la pregunta: "📊 TEST DASHBOARD - ¿Cuál es la capital de Andalucía?"');
      console.log('3. 👆 Haz click en "Sevilla" (la respuesta correcta)');
      console.log('4. ⏱️  Espera 30 segundos');
      console.log('5. 📊 Ve a: http://localhost:3000/dashboard');
      console.log('6. 🔄 Refresca la página para ver si apareces');
      console.log('');
      console.log('📈 ESTADO ACTUAL DEL DASHBOARD:');
      console.log('   👥 Usuarios: 0');
      console.log('   🗳️  Polls: 1');
      console.log('   💬 Respuestas: 0');
      console.log('');
      console.log('📈 DESPUÉS DE TU RESPUESTA DEBERÍA MOSTRAR:');
      console.log('   👥 Usuarios: 1 (tú)');
      console.log('   🗳️  Polls: 2');
      console.log('   💬 Respuestas: 1');
      console.log('');
      console.log('🎯 Si funciona verás tu nombre en el ranking!');
      
    } else {
      console.error('❌ Error enviando pregunta:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendDashboardTest(); 