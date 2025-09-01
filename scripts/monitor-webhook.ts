import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function monitorWebhook() {
  console.log('🔍 MONITOR DEL WEBHOOK - Verificando actividad...\n');
  
  try {
    // 1. Verificar webhook configurado
    console.log('📋 1. Verificando configuración del webhook...');
    const webhookInfoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const webhookInfo = await webhookInfoResponse.json() as any;
    
    if (webhookInfo.ok) {
      console.log('✅ Webhook configurado:');
      console.log('   📍 URL:', webhookInfo.result.url || 'NO CONFIGURADO');
      console.log('   🔄 Últimas actualizaciones:', webhookInfo.result.pending_update_count || 0);
      console.log('   ⚡ Último error:', webhookInfo.result.last_error_message || 'Ninguno');
      console.log('   📅 Última entrega exitosa:', webhookInfo.result.last_synchronization_error_date ? 
        new Date(webhookInfo.result.last_synchronization_error_date * 1000).toLocaleString() : 'N/A');
      
      if (!webhookInfo.result.url) {
        console.log('❌ PROBLEMA: No hay webhook configurado');
        return;
      }
      
      if (webhookInfo.result.pending_update_count > 0) {
        console.log('⚠️  Hay actualizaciones pendientes, esto es normal si acabas de enviar comandos');
      }
      
      if (webhookInfo.result.last_error_message) {
        console.log('🚨 ÚLTIMO ERROR EN WEBHOOK:', webhookInfo.result.last_error_message);
      }
    }
    
    console.log('\n📋 2. Verificando estado del servidor local...');
    
    // 2. Verificar que nuestro webhook local funciona
    const localTestResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'GET'
    });
    
    if (localTestResponse.ok) {
      console.log('✅ Servidor local (puerto 3000) funcionando');
    } else {
      console.log('❌ PROBLEMA: Servidor local no responde');
      return;
    }
    
    console.log('\n📋 3. Probando webhook con comando simulado...');
    
    // 3. Simular comando para ver si funciona
    const testUpdate = {
      update_id: 999999999,
      message: {
        message_id: 999,
        from: {
          id: 999999999,
          is_bot: false,
          first_name: "MonitorTest",
          username: "monitor_test"
        },
        chat: {
          id: -1002352049779,
          type: "supergroup"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/help"
      }
    };

    const webhookTestResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUpdate),
    });

    const webhookResult = await webhookTestResponse.json();
    
    if (webhookTestResponse.ok && webhookResult.type === 'command_handled') {
      console.log('✅ Webhook local procesando comandos correctamente');
      console.log('✅ Respuesta enviada:', webhookResult.responseSent);
    } else {
      console.log('❌ PROBLEMA: Webhook local no procesa comandos correctamente');
      console.log('📄 Respuesta:', JSON.stringify(webhookResult, null, 2));
    }
    
    console.log('\n🎯 DIAGNÓSTICO:');
    
    if (webhookInfo.result.url && webhookInfo.result.url.includes('ngrok')) {
      console.log('✅ Webhook está configurado con ngrok');
      
      if (webhookInfo.result.last_error_message) {
        console.log('❌ PROBLEMA: Telegram no puede conectar con tu webhook');
        console.log('💡 SOLUCIÓN: Verifica que ngrok sigue ejecutándose');
      } else {
        console.log('✅ Telegram puede conectar con tu webhook');
        console.log('💡 Si no recibes respuestas, revisa los logs del servidor Next.js');
      }
    } else {
      console.log('❌ PROBLEMA: Webhook no está configurado con ngrok');
      console.log('💡 SOLUCIÓN: Vuelve a configurar el webhook con la URL de ngrok');
    }
    
  } catch (error) {
    console.error('❌ Error en el monitor:', error);
  }
}

monitorWebhook(); 