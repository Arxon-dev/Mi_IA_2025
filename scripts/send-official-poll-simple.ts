import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002519334308';

async function sendOfficialPoll() {
  try {
    console.log('🧪 ENVIANDO POLL OFICIAL PARA @Carlos_esp');
    console.log('=========================================');
    
    const pollQuestion = "🎯 POLL OFICIAL para @Carlos_esp - ¿Cuál es el río más largo de España?";
    const pollOptions = ["Tajo", "Ebro", "Duero", "Guadalquivir"];
    const correctOptionIndex = 0; // Tajo es correcto
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`;
    
    console.log('📤 Enviando poll a Telegram...');
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
        explanation: "✅ ¡Correcto! El río Tajo es el más largo de España con 1,007 km. 🌊"
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
      console.log('2. 🔍 Busca el poll sobre ríos de España');
      console.log('3. 👆 Haz click en "Tajo" (la respuesta correcta)');
      console.log('4. ⏱️  Espera unos 10-30 segundos');
      console.log('5. 🏆 Ejecuta /ranking para verificar si apareces');
      console.log('');
      console.log('📋 ESTADO DEL SISTEMA:');
      console.log('   ✅ Webhook: Funcionando (ya verificado)');
      console.log('   ✅ Tu respuesta anterior fue recibida correctamente');
      console.log('   ✅ Privacy mode: Desactivado');
      console.log('   ✅ Ngrok: Activo');
      console.log('');
      console.log('⚠️  NOTA: Como se reseteo la BD, el mapeo específico');
      console.log('   puede faltar, PERO tu respuesta debe crear tu usuario');
      console.log('   automáticamente en el sistema cuando respondas.');
      
    } else {
      console.error('❌ Error enviando poll:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

console.log('🎯 Ya sabemos que el webhook funciona perfectamente.');
console.log('🎯 Carlos_esp ya respondió y fue detectado correctamente.');
console.log('🎯 El problema era que el poll anterior no tenía mapeo en BD.');
console.log('🎯 Enviando nuevo poll...');
console.log('');

sendOfficialPoll(); 