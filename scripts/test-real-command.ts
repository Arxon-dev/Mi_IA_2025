import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

async function testRealCommand() {
  try {
    console.log('🎯 ENVIANDO /help directamente al grupo...');
    
    // Enviar comando /help al grupo
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: '/help'
      }),
    });

    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('✅ Comando /help enviado exitosamente');
      console.log('📩 ID del mensaje:', result.result.message_id);
      
      // Esperar unos segundos para que el webhook procese
      console.log('⏳ Esperando respuesta del bot... (10 segundos)');
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Obtener últimos mensajes del chat
      console.log('📥 Obteniendo últimos mensajes del chat...');
      
      const updatesResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=10&offset=-10`);
      const updatesResult = await updatesResponse.json() as any;
      
      if (updatesResult.ok) {
        const botMessages = updatesResult.result.filter((update: any) => 
          update.message?.from?.is_bot && 
          update.message?.chat?.id?.toString() === CHAT_ID.toString()
        );
        
        if (botMessages.length > 0) {
          console.log('✅ ¡EL BOT SÍ ESTÁ RESPONDIENDO!');
          console.log('🤖 Últimas respuestas del bot:');
          botMessages.forEach((msg: any, index: number) => {
            console.log(`   ${index + 1}. "${msg.message.text?.substring(0, 50)}..."`);
          });
        } else {
          console.log('❌ No se encontraron respuestas del bot');
        }
      }
      
    } else {
      console.log('❌ Error enviando comando:', result.description);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRealCommand(); 