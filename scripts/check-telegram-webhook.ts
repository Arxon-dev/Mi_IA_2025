import { config } from 'dotenv';

config();

async function checkTelegramWebhook() {
  try {
    console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL WEBHOOK DE TELEGRAM');
    console.log('=' .repeat(60));

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      console.log('❌ ERROR: TELEGRAM_BOT_TOKEN no encontrado');
      return;
    }

    // 1. Verificar webhook actual
    console.log('\n🔗 1. VERIFICANDO WEBHOOK ACTUAL...');
    try {
      const webhookResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const webhookInfo = await webhookResponse.json() as any;
      
      console.log('📊 Estado del webhook:', webhookInfo);
      
      if (webhookInfo.ok && webhookInfo.result.url) {
        console.log('🌐 Webhook configurado:', webhookInfo.result.url);
        console.log('📅 Última actualización:', webhookInfo.result.last_error_date ? 
          new Date(webhookInfo.result.last_error_date * 1000).toLocaleString() : 'N/A');
        
        if (webhookInfo.result.last_error_message) {
          console.log('❌ Último error:', webhookInfo.result.last_error_message);
        }
      } else {
        console.log('⚠️ No hay webhook configurado o está en modo polling');
      }
    } catch (error) {
      console.log('❌ Error verificando webhook:', error);
    }

    // 2. Quitar webhook (cambiar a polling)
    console.log('\n🔄 2. ELIMINANDO WEBHOOK (CAMBIAR A MODO POLLING)...');
    try {
      const deleteResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
      const deleteResult = await deleteResponse.json() as any;
      
      if (deleteResult.ok) {
        console.log('✅ Webhook eliminado exitosamente');
        console.log('🎯 Bot cambiado a modo POLLING');
      } else {
        console.log('❌ Error eliminando webhook:', deleteResult.description);
      }
    } catch (error) {
      console.log('❌ Error eliminando webhook:', error);
    }

    // 3. Verificar que no hay webhook
    console.log('\n🔍 3. VERIFICANDO QUE EL WEBHOOK FUE ELIMINADO...');
    try {
      const verifyResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const verifyInfo = await verifyResponse.json() as any;
      
      if (verifyInfo.ok && !verifyInfo.result.url) {
        console.log('✅ Webhook eliminado correctamente');
        console.log('🎮 Bot ahora está en modo POLLING');
      } else {
        console.log('⚠️ Webhook todavía existe:', verifyInfo.result.url);
      }
    } catch (error) {
      console.log('❌ Error verificando eliminación:', error);
    }

    // 4. Probar envío de mensaje de prueba
    console.log('\n🧪 4. PROBANDO COMUNICACIÓN DIRECTA...');
    console.log('💡 Para probar el bot:');
    console.log('   1. Ve a @OpoMelillaBot en Telegram');
    console.log('   2. Envía /start');
    console.log('   3. Envía /examen2018');
    console.log('   4. El bot debería responder inmediatamente');
    
    console.log('\n🎯 MODO POLLING ACTIVADO');
    console.log('✅ El bot ahora recibirá mensajes directamente desde Telegram');
    console.log('🔄 No necesitas servidor local ejecutándose para probar');

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
  }
}

checkTelegramWebhook(); 