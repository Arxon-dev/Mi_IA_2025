import { handleBotCommands } from '../src/app/api/telegram/webhook/route';

async function testExamen2018Webhook() {
  try {
    console.log('🧪 PRUEBA DEL WEBHOOK PARA /examen2018');
    console.log('=' .repeat(60));
    
    // Simular un mensaje de Telegram con el comando /examen2018
    const mockMessage = {
      message_id: 12345,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "TestUser",
        last_name: "Prueba",
        username: "test_user"
      },
      chat: {
        id: -1001234567890,
        type: "supergroup"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/examen2018"
    };
    
    console.log('📱 SIMULANDO MENSAJE:');
    console.log('   👤 Usuario:', mockMessage.from.first_name);
    console.log('   💬 Comando:', mockMessage.text);
    console.log('   🆔 Chat ID:', mockMessage.chat.id);
    
    console.log('\\n🔄 PROCESANDO COMANDO...');
    
    // Llamar directamente al manejador de comandos
    const response = await handleBotCommands(mockMessage);
    
    console.log('\\n📤 RESPUESTA DEL BOT:');
    console.log('─'.repeat(60));
    
    if (response) {
      console.log('✅ COMANDO PROCESADO EXITOSAMENTE');
      console.log(`📏 Longitud de respuesta: ${response.length} caracteres`);
      console.log('');
      console.log(response);
    } else {
      console.log('❌ NO SE GENERÓ RESPUESTA');
      console.log('   Esto podría significar que:');
      console.log('   - El comando fue manejado de otra forma');
      console.log('   - Se envió por mensaje privado');
      console.log('   - Hubo algún error');
    }
    
    console.log('\\n─'.repeat(60));
    console.log('🎯 PRUEBA COMPLETADA');
    
  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:', error);
    console.error('📊 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

testExamen2018Webhook(); 