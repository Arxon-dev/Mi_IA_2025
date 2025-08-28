import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function setupLocalWebhook() {
  try {
    console.log('🔧 CONFIGURANDO WEBHOOK LOCAL PARA DESARROLLO');
    console.log('=' .repeat(60));
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      console.log('❌ TELEGRAM_BOT_TOKEN no encontrado en .env');
      return;
    }
    
    console.log('✅ Token del bot encontrado');
    
    // Opción 1: Quitar webhook (modo polling para development)
    console.log('\\n🔄 QUITANDO WEBHOOK EXISTENTE...');
    
    try {
      const deleteResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);
      const deleteResult = await deleteResponse.json();
      
      if (deleteResult.ok) {
        console.log('   ✅ Webhook eliminado exitosamente');
        console.log('   📝 Ahora el bot funcionará en modo polling (para desarrollo)');
      } else {
        console.log('   ⚠️  Error eliminando webhook:', deleteResult.description);
      }
    } catch (error) {
      console.log('   ❌ Error en deleteWebhook:', error);
    }
    
    // Verificar estado actual
    console.log('\\n📊 VERIFICANDO ESTADO ACTUAL...');
    
    try {
      const infoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const infoResult = await infoResponse.json();
      
      if (infoResult.ok) {
        console.log('   📋 Estado del webhook:', {
          url: infoResult.result.url || 'NINGUNA (modo polling)',
          pendingUpdates: infoResult.result.pending_update_count || 0,
          lastError: infoResult.result.last_error_message || 'Ninguno'
        });
      }
    } catch (error) {
      console.log('   ❌ Error verificando estado:', error);
    }
    
    // Información para el usuario
    console.log('\\n🎯 CONFIGURACIÓN COMPLETADA');
    console.log('\\n📋 CÓMO PROBAR AHORA:');
    console.log('   1. ✅ Servidor Next.js ejecutándose (localhost:3000)');
    console.log('   2. ✅ Webhook eliminado (modo desarrollo)');
    console.log('   3. 🧪 Prueba el comando /examen2018 en Telegram');
    console.log('');
    console.log('💡 NOTA: En desarrollo, Telegram enviará comandos directamente al bot');
    console.log('   sin usar webhook. Esto es normal y funcional.');
    console.log('');
    console.log('🔧 SI NECESITAS WEBHOOK REAL:');
    console.log('   • Usa ngrok: npx ngrok http 3000');
    console.log('   • Configura webhook con: https://tu-ngrok-url.ngrok.io/api/telegram/webhook');
    
  } catch (error) {
    console.error('❌ ERROR CONFIGURANDO WEBHOOK:', error);
  }
}

setupLocalWebhook(); 