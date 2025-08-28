async function testWebhookConnection() {
  try {
    console.log('🔍 DIAGNÓSTICO DEL WEBHOOK');
    console.log('=' .repeat(50));
    
    // 1. Verificar que el webhook endpoint esté funcionando
    console.log('1. 🌐 PROBANDO ENDPOINT DEL WEBHOOK...');
    
    const webhookUrl = 'http://localhost:3000/api/telegram/webhook'; // Ajusta la URL según tu configuración
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET'
      });
      
      const result = await response.json();
      console.log('   ✅ Endpoint accesible:', result);
    } catch (error) {
      console.log('   ❌ Error accediendo al endpoint:', error);
      console.log('   📝 Esto podría indicar que el servidor no está ejecutándose');
    }
    
    // 2. Verificar configuración del bot
    console.log('\\n2. 🤖 VERIFICANDO CONFIGURACIÓN DEL BOT...');
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      console.log('   ❌ TELEGRAM_BOT_TOKEN no está configurado');
      return;
    }
    
    console.log('   ✅ Bot token encontrado:', BOT_TOKEN.substring(0, 10) + '...');
    
    // 3. Verificar estado del webhook en Telegram
    console.log('\\n3. 📡 VERIFICANDO WEBHOOK EN TELEGRAM...');
    
    try {
      const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const webhookInfo = await webhookInfoResponse.json();
      
      if (webhookInfo.ok) {
        console.log('   📊 Estado del webhook:', webhookInfo.result);
        
        if (webhookInfo.result.url) {
          console.log('   ✅ Webhook configurado en:', webhookInfo.result.url);
        } else {
          console.log('   ❌ NO HAY WEBHOOK CONFIGURADO');
          console.log('   📝 Esto explica por qué no funcionan los comandos');
        }
        
        if (webhookInfo.result.last_error_date) {
          console.log('   ⚠️  Último error:', new Date(webhookInfo.result.last_error_date * 1000));
          console.log('   📝 Mensaje de error:', webhookInfo.result.last_error_message);
        }
      }
    } catch (error) {
      console.log('   ❌ Error verificando webhook:', error);
    }
    
    // 4. Probar envío directo de comando
    console.log('\\n4. 🧪 PROBANDO ENVÍO DIRECTO AL WEBHOOK...');
    
    const testUpdate = {
      update_id: 123456789,
      message: {
        message_id: 123,
        from: {
          id: 123456789,
          is_bot: false,
          first_name: "TestUser",
          username: "test_user"
        },
        chat: {
          id: -1001234567890,
          type: "supergroup"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/examen2018"
      }
    };
    
    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUpdate)
      });
      
      const webhookResult = await webhookResponse.json();
      console.log('   📤 Respuesta del webhook:', webhookResult);
      
      if (webhookResponse.ok) {
        console.log('   ✅ Webhook procesó el comando correctamente');
      } else {
        console.log('   ❌ Error en el webhook:', webhookResponse.status);
      }
    } catch (error) {
      console.log('   ❌ Error enviando al webhook local:', error);
      console.log('   📝 Verificar que el servidor Next.js esté ejecutándose');
    }
    
    console.log('\\n🎯 DIAGNÓSTICO COMPLETADO');
    console.log('\\n📋 PRÓXIMOS PASOS RECOMENDADOS:');
    console.log('   1. Verificar que el servidor Next.js esté ejecutándose (npm run dev)');
    console.log('   2. Configurar el webhook de Telegram con la URL pública');
    console.log('   3. Verificar que el puerto 3000 esté accesible');
    console.log('   4. Revisar los logs del servidor para errores');
    
  } catch (error) {
    console.error('❌ ERROR EN EL DIAGNÓSTICO:', error);
  }
}

testWebhookConnection(); 