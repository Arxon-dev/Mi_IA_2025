import fetch from 'node-fetch';

const BOT_TOKEN = '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = '-1002352049779';

interface TelegramPollResponse {
  ok: boolean;
  result?: {
    message_id: number;
    poll: {
      id: string;
      question: string;
      options: Array<{
        text: string;
        voter_count: number;
      }>;
    };
  };
  description?: string;
}

async function sendSimplePoll() {
  try {
    console.log('🎯 Enviando poll de prueba...');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        question: "🔧 PRUEBA DEL SISTEMA DE POLLS\n\n¿Cuál es la capital de España?",
        options: [
          "Madrid",
          "Barcelona", 
          "Valencia",
          "Sevilla"
        ],
        type: 'quiz',
        correct_option_id: 0, // Madrid es la respuesta correcta (índice 0)
        is_anonymous: false,
        explanation: "✅ ¡Correcto! Madrid es la capital de España.\n\n🎮 Este es un poll de prueba del sistema de gamificación.",
        explanation_parse_mode: 'HTML'
      }),
    });

    const result = await response.json() as TelegramPollResponse;
    
    if (result.ok && result.result) {
      console.log('✅ Poll enviado exitosamente:');
      console.log('   📩 Message ID:', result.result.message_id);
      console.log('   🗳️  Poll ID:', result.result.poll.id);
      console.log('   📝 Pregunta:', result.result.poll.question);
      console.log('   📊 Opciones:', result.result.poll.options.map((opt: any) => opt.text));
      
      console.log('\n🎯 INSTRUCCIONES:');
      console.log('1. Ve al grupo de Telegram y responde el poll');
      console.log('2. Observa los logs del webhook para ver si se procesa');
      console.log('3. Verifica que el sistema de gamificación funcione');
      
    } else {
      console.error('❌ Error enviando poll:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendSimplePoll(); 