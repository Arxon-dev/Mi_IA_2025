import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002519334308';

async function sendTestPoll() {
  try {
    console.log('🧪 ENVIANDO POLL DE PRUEBA PARA @Carlos_esp');
    console.log('============================================');
    
    const testQuestion = {
      question: "🎯 POLL DE PRUEBA para @Carlos_esp - ¿Cuál es la capital de Francia?",
      options: ["París", "Londres", "Madrid", "Roma"],
      correct_option_id: 0,
      is_anonymous: false,
      type: "quiz",
      explanation: "✅ ¡Correcto! París es la capital de Francia. 🇫🇷 Este es un poll de prueba para verificar que @Carlos_esp pueda aparecer en el ranking."
    };
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`;
    
    console.log('📤 Enviando poll...');
    console.log(`   🎯 Pregunta: ${testQuestion.question}`);
    console.log(`   📋 Opciones: ${testQuestion.options.join(', ')}`);
    console.log(`   ✅ Respuesta correcta: ${testQuestion.options[testQuestion.correct_option_id]}`);
    console.log('');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        question: testQuestion.question,
        options: testQuestion.options,
        correct_option_id: testQuestion.correct_option_id,
        is_anonymous: testQuestion.is_anonymous,
        type: testQuestion.type,
        explanation: testQuestion.explanation
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('✅ POLL ENVIADO EXITOSAMENTE!');
      console.log(`   🆔 Message ID: ${result.result.message_id}`);
      console.log(`   🗳️  Poll ID: ${result.result.poll.id}`);
      console.log('');
      
      console.log('🎯 INSTRUCCIONES PARA @Carlos_esp:');
      console.log('==================================');
      console.log('1. 📱 Ve al grupo de Telegram "OpoMelilla"');
      console.log('2. 🔍 Busca el poll de prueba que acabamos de enviar');
      console.log('3. 👆 Haz click en "París" (la respuesta correcta)');
      console.log('4. ⏱️  Espera unos 10-30 segundos');
      console.log('5. 🏆 Ejecuta /ranking para verificar si apareces');
      console.log('6. 📊 También verifica en: http://localhost:3000/dashboard');
      console.log('');
      console.log('🔍 Si NO apareces después de responder:');
      console.log('   • Verifica que estés en el grupo correcto');
      console.log('   • Asegúrate de que tu username sea exactamente @Carlos_esp');
      console.log('   • Revisa que ngrok siga ejecutándose');
      console.log('   • Mira los logs del webhook en la terminal del servidor Next.js');
      
    } else {
      console.error('❌ Error enviando poll:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendTestPoll(); 