import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function testWithRealUserId() {
  try {
    console.log('🎯 PRUEBA CON USER ID REAL');
    console.log('=' .repeat(50));
    
    // ⚠️ REEMPLAZA ESTE NÚMERO CON TU USER ID REAL DE TELEGRAM
    const YOUR_REAL_USER_ID = "TU_USER_ID_AQUI"; // ← CÁMBIALO
    
    if (YOUR_REAL_USER_ID === "TU_USER_ID_AQUI") {
      console.log('❌ NECESITAS EDITAR EL SCRIPT PRIMERO');
      console.log('📝 Reemplaza "TU_USER_ID_AQUI" con tu User ID real');
      console.log('');
      console.log('💡 Para obtener tu User ID:');
      console.log('   1. Ve a @userinfobot en Telegram');
      console.log('   2. Envía cualquier mensaje');
      console.log('   3. Copia el User ID');
      console.log('   4. Edita este script');
      console.log('   5. Ejecuta de nuevo');
      return;
    }
    
    console.log('🎯 Probando comando /examen2018 con User ID:', YOUR_REAL_USER_ID);
    
    // Simular mensaje desde chat privado con tu User ID real
    const realPrivateMessage = {
      message_id: 12345,
      from: {
        id: parseInt(YOUR_REAL_USER_ID),
        is_bot: false,
        first_name: "TuNombre",
        username: "tu_username"
      },
      chat: {
        id: parseInt(YOUR_REAL_USER_ID), // MISMO ID = CHAT PRIVADO
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/examen2018"
    };
    
    // Probar envío directo a Telegram API primero
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    console.log('📨 Probando envío directo a Telegram...');
    
    const testResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: YOUR_REAL_USER_ID,
        text: '🧪 ¡Prueba exitosa! Tu User ID funciona correctamente.'
      })
    });
    
    const testResult = await testResponse.json() as any;
    
    if (testResult.ok) {
      console.log('✅ ¡ENVÍO EXITOSO! Deberías haber recibido un mensaje');
      
      // Ahora probar el webhook completo
      console.log('🌐 Probando webhook completo...');
      
      const webhookResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: Date.now(),
          message: realPrivateMessage
        })
      });
      
      if (webhookResponse.ok) {
        const webhookResult = await webhookResponse.json() as any;
        console.log('✅ Webhook procesado:', webhookResult.type);
        console.log('📊 Respuesta enviada:', webhookResult.responseSent);
        
        if (webhookResult.responseSent) {
          console.log('🎉 ¡TODO FUNCIONANDO! Deberías haber recibido el quiz');
        } else {
          console.log('⚠️ Webhook procesado pero no envió respuesta');
        }
      }
      
    } else {
      console.log('❌ Error:', testResult.description);
      console.log('💡 Verifica que el User ID sea correcto');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

console.log('🚀 INSTRUCCIONES:');
console.log('1. Obtén tu User ID real de @userinfobot');
console.log('2. Edita este archivo y reemplaza "TU_USER_ID_AQUI"');
console.log('3. Ejecuta de nuevo: npx tsx scripts/test-with-real-userid.ts');
console.log('');

testWithRealUserId(); 