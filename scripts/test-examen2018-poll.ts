import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function testExamen2018Poll() {
  try {
    console.log('🧪 PRUEBA DEL COMANDO /examen2018 COMO POLL INTERACTIVO');
    console.log('=' .repeat(70));
    
    // Simular una llamada al webhook para comando /examen2018
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
    
    console.log('📱 SIMULANDO MENSAJE /examen2018:');
    console.log('   👤 Usuario:', mockMessage.from.first_name);
    console.log('   💬 Comando:', mockMessage.text);
    console.log('   🆔 User ID:', mockMessage.from.id);
    
    // Enviar al webhook
    const response = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        update_id: 123456789,
        message: mockMessage
      })
    });
    
    if (!response.ok) {
      console.log('❌ Error en la respuesta del webhook:', response.status);
      const errorText = await response.text();
      console.log('   📝 Detalle:', errorText);
      return;
    }
    
    const result = await response.json() as any;
    console.log('\\n✅ RESPUESTA DEL WEBHOOK:');
    console.log('   📊 Status:', response.status);
    console.log('   🎯 Resultado:', result);
    
    if (result.ok) {
      console.log('\\n🎉 ¡COMANDO PROCESADO EXITOSAMENTE!');
      console.log('\\n📋 VERIFICACIONES RECOMENDADAS:');
      console.log('   1. ✅ Revisa los logs del servidor para ver el poll enviado');
      console.log('   2. 🗳️ Verifica que se haya creado un registro en TelegramPoll');
      console.log('   3. 📱 Prueba el comando en Telegram real (@OpoMelillaBot)');
      console.log('   4. 🎮 Confirma que aparece como quiz interactivo (no texto)');
    } else {
      console.log('\\n⚠️ El comando fue procesado pero revisa la respuesta');
    }
    
  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:', error);
    console.log('\\n🔧 POSIBLES CAUSAS:');
    console.log('   • Servidor Next.js no está ejecutándose');
    console.log('   • Puerto 3000 no está disponible');
    console.log('   • Error en la configuración del webhook');
  }
}

testExamen2018Poll(); 