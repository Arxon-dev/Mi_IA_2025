import fetch from 'node-fetch';

// Simular una respuesta de poll enviándola directamente a nuestro webhook
async function testPollWebhook() {
  try {
    console.log('🧪 PRUEBA DE WEBHOOK - Respuesta de Poll');
    console.log('=======================================');
    console.log('');
    
    // Datos simulados de una respuesta de poll de Telegram
    const pollAnswerUpdate = {
      update_id: 123456789,
      poll_answer: {
        poll_id: "5890778548200801200", // El poll_id del poll que enviamos antes
        user: {
          id: 12345678,
          is_bot: false,
          first_name: "Usuario",
          last_name: "Prueba",
          username: "usuario_prueba"
        },
        option_ids: [0] // Respuesta: "Madrid" (índice 0)
      }
    };
    
    console.log('📤 Enviando respuesta simulada al webhook...');
    console.log('   🗳️  Poll ID:', pollAnswerUpdate.poll_answer.poll_id);
    console.log('   👤 Usuario:', pollAnswerUpdate.poll_answer.user.first_name);
    console.log('   ✅ Opción seleccionada:', pollAnswerUpdate.poll_answer.option_ids[0], '(Madrid)');
    console.log('');
    
    // Enviar al webhook local
    const response = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pollAnswerUpdate)
    });
    
    const result = await response.text();
    
    console.log('📨 Respuesta del webhook:');
    console.log('   📊 Status:', response.status);
    console.log('   📝 Response:', result);
    
    if (response.ok) {
      console.log('');
      console.log('✅ ¡ÉXITO! El webhook procesó la respuesta del poll');
      console.log('');
      console.log('🎯 El sistema ahora debería:');
      console.log('   1. ✅ Registrar al usuario en la base de datos');
      console.log('   2. 📊 Asignar puntos por respuesta correcta');
      console.log('   3. 📈 Actualizar estadísticas y ranking');
      console.log('   4. 💬 Enviar mensaje de confirmación al grupo');
      console.log('');
      console.log('📋 Próximos pasos:');
      console.log('   • Usa /ranking para ver el ranking actualizado');
      console.log('   • Usa /stats para ver estadísticas del usuario');
      console.log('   • Envía más polls desde la base de datos');
      
    } else {
      console.log('');
      console.log('❌ Error procesando respuesta del poll');
      console.log('   💡 Verifica que el servidor esté ejecutándose');
      console.log('   💡 Revisa los logs del servidor para más detalles');
    }
    
  } catch (error) {
    console.error('❌ Error enviando al webhook:', error);
    console.log('');
    console.log('💡 SOLUCIONES:');
    console.log('   1. Asegúrate de que el servidor esté ejecutándose:');
    console.log('      npm run dev');
    console.log('   2. Verifica que el puerto sea 3000');
    console.log('   3. Revisa los logs del servidor');
  }
}

testPollWebhook(); 