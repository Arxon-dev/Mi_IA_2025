import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002519334308';

async function testBotMessage() {
  try {
    console.log('🧪 Probando envío de mensaje del bot...');
    console.log('📋 Bot Token:', BOT_TOKEN.substring(0, 10) + '...');
    console.log('📋 Chat ID:', CHAT_ID);
    
    const message = '🤖 Test del bot - Si ves este mensaje, ¡el bot funciona correctamente!';
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      }),
    });

    const result = await response.json() as any;
    
    console.log('📤 Respuesta de Telegram:', JSON.stringify(result, null, 2));
    
    if (result.ok) {
      console.log('✅ ¡Mensaje enviado exitosamente!');
      console.log('📩 ID del mensaje:', result.result.message_id);
    } else {
      console.log('❌ Error enviando mensaje:');
      console.log('💥 Descripción:', result.description);
      console.log('💥 Código de error:', result.error_code);
      
      // Diagnóstico de errores comunes
      if (result.error_code === 403) {
        console.log('🚫 PROBLEMA: El bot no tiene permisos para enviar mensajes al grupo');
        console.log('💡 SOLUCIÓN: Agrega el bot como administrador del grupo o dale permisos de escritura');
      } else if (result.error_code === 400) {
        console.log('🚫 PROBLEMA: Chat ID incorrecto o bot bloqueado');
        console.log('💡 SOLUCIÓN: Verifica el Chat ID del grupo');
      }
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

testBotMessage(); 