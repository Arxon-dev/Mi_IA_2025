import fetch from 'node-fetch';

const webhookUrl = 'http://localhost:3001/api/telegram/webhook';

async function testWebhookCommand() {
  try {
    console.log('🧪 Probando comando /ranking en webhook...');
    
    // Simular un mensaje /ranking desde Telegram
    const testUpdate = {
      update_id: 123456789,
      message: {
        message_id: 999,
        from: {
          id: 123456789,
          is_bot: false,
          first_name: "TestUser",
          username: "testuser"
        },
        chat: {
          id: -1002519334308,
          type: "supergroup"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/ranking"
      }
    };

    console.log('📤 Enviando comando al webhook...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUpdate),
    });

    const result = await response.json();
    
    console.log('📥 Respuesta del webhook:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Webhook procesó el comando correctamente');
    } else {
      console.log('❌ Error en el webhook:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

testWebhookCommand(); 