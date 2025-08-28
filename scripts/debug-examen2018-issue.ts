import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function debugExamen2018Issue() {
  try {
    console.log('🔍 DEBUGGING COMANDO /examen2018 DESDE CHAT PRIVADO');
    console.log('=' .repeat(70));
    
    // Simular un mensaje desde CHAT PRIVADO (no grupo)
    const privateMessage = {
      message_id: 12345,
      from: {
        id: 123456789, // Tu user ID de Telegram
        is_bot: false,
        first_name: "TestUser",
        username: "test_user"
      },
      chat: {
        id: 123456789, // ✅ MISMO ID = CHAT PRIVADO
        type: "private" // ✅ TIPO PRIVADO
      },
      date: Math.floor(Date.now() / 1000),
      text: "/examen2018"
    };
    
    console.log('📱 SIMULANDO MENSAJE DESDE CHAT PRIVADO:');
    console.log('   👤 Usuario ID:', privateMessage.from.id);
    console.log('   💬 Chat ID:', privateMessage.chat.id);
    console.log('   🔒 Tipo de chat:', privateMessage.chat.type);
    console.log('   ✅ Es chat privado:', privateMessage.from.id === privateMessage.chat.id);
    
    // Probar conectividad con Telegram API primero
    console.log('\\n🔗 PROBANDO CONECTIVIDAD CON TELEGRAM API...');
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      console.log('❌ No se encontró TELEGRAM_BOT_TOKEN en .env');
      return;
    }
    
    // Probar getMe para verificar que el token funciona
    try {
      const getMeResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
      const getMeResult = await getMeResponse.json() as any;
      
      if (getMeResult.ok) {
        console.log('   ✅ Bot token válido:', getMeResult.result.username);
      } else {
        console.log('   ❌ Token inválido:', getMeResult.description);
        return;
      }
    } catch (error) {
      console.log('   ❌ Error conectando con Telegram:', error);
      return;
    }
    
    // Probar envío de mensaje de prueba
    console.log('\\n📨 PROBANDO ENVÍO DE MENSAJE DE PRUEBA...');
    console.log('   🎯 Enviando a chat ID:', privateMessage.chat.id);
    
    try {
      const testMsgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: privateMessage.chat.id,
          text: '🧪 Mensaje de prueba del debugging'
        })
      });
      
      const testMsgResult = await testMsgResponse.json() as any;
      console.log('   📤 Resultado:', testMsgResult.ok ? '✅ Éxito' : '❌ Error');
      
      if (!testMsgResult.ok) {
        console.log('   📝 Error:', testMsgResult.description);
        console.log('\\n🔍 POSIBLE CAUSA:');
        console.log('   • El chat ID 123456789 es ficticio');
        console.log('   • Necesitas usar tu verdadero User ID de Telegram');
        console.log('   • Para obtenerlo, envía /start al bot y revisa los logs');
      }
    } catch (error) {
      console.log('   ❌ Error en envío:', error);
    }
    
    // Ahora probar el webhook
    console.log('\\n🌐 PROBANDO WEBHOOK CON MENSAJE PRIVADO...');
    
    const webhookResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: 123456789,
        message: privateMessage
      })
    });
    
    if (webhookResponse.ok) {
      const result = await webhookResponse.json() as any;
      console.log('   ✅ Webhook procesado:', result.type);
      console.log('   📊 Mensaje enviado:', result.responseSent);
    } else {
      console.log('   ❌ Error en webhook:', webhookResponse.status);
    }
    
    console.log('\\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Obtén tu User ID real de Telegram');
    console.log('   2. Usa ese ID en lugar del ficticio 123456789');
    console.log('   3. Verifica que el bot puede enviarte mensajes');
    
  } catch (error) {
    console.error('❌ ERROR EN DEBUGGING:', error);
  }
}

// Función para obtener el User ID real
async function getMyTelegramUserId() {
  try {
    console.log('\\n📋 CÓMO OBTENER TU USER ID REAL:');
    console.log('1. Ve al bot @userinfobot en Telegram');
    console.log('2. Envía cualquier mensaje');
    console.log('3. Te dará tu User ID');
    console.log('4. O revisa los logs cuando uses /start con @OpoMelillaBot');
  } catch (error) {
    console.error('Error:', error);
  }
}

debugExamen2018Issue();
getMyTelegramUserId(); 