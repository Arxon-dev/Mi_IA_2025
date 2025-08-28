import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function checkWebhook() {
  try {
    console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL WEBHOOK');
    console.log('=========================================');
    
    // Obtener información actual del webhook
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const webhookInfo = await response.json() as any;
    
    if (webhookInfo.ok) {
      const info = webhookInfo.result;
      console.log('📋 INFORMACIÓN ACTUAL DEL WEBHOOK:');
      console.log('----------------------------------');
      console.log(`🌐 URL: ${info.url || 'NO CONFIGURADA'}`);
      console.log(`✅ Tiene certificado: ${info.has_custom_certificate}`);
      console.log(`📤 Actualizaciones pendientes: ${info.pending_update_count}`);
      console.log(`🕐 Última actualización: ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : 'Nunca'}`);
      console.log(`❌ Último error: ${info.last_error_message || 'Ninguno'}`);
      console.log(`🎯 Eventos permitidos: ${info.allowed_updates?.join(', ') || 'Todos'}`);
      console.log('');
      
      if (!info.url) {
        console.log('⚠️  PROBLEMA: No hay webhook configurado!');
        console.log('   El bot no puede recibir actualizaciones de Telegram.');
        console.log('   Necesitas configurar el webhook con ngrok.');
      } else if (info.url.includes('localhost')) {
        console.log('⚠️  PROBLEMA: Webhook apunta a localhost!');
        console.log('   Telegram no puede acceder a localhost desde internet.');
        console.log('   Necesitas usar ngrok.');
      } else if (info.url.includes('ngrok')) {
        console.log('✅ WEBHOOK CONFIGURADO CON NGROK');
        if (info.pending_update_count > 0) {
          console.log(`⚠️  Hay ${info.pending_update_count} actualizaciones pendientes.`);
        }
      }
      
      if (info.last_error_message) {
        console.log(`\n❌ ÚLTIMO ERROR: ${info.last_error_message}`);
        console.log('   Esto indica que hay un problema con el webhook.');
      }
      
    } else {
      console.error('❌ Error obteniendo información del webhook:', webhookInfo);
    }
    
    console.log('\n📋 PASOS PARA CONFIGURAR CORRECTAMENTE:');
    console.log('=======================================');
    console.log('1. 🚀 Ejecutar: ngrok http 3000');
    console.log('2. 📋 Copiar la URL de ngrok (https://xxxx.ngrok.io)');
    console.log('3. 🔧 Configurar webhook con: npx tsx scripts/setup-webhook.ts');
    console.log('4. ✅ Verificar que funciona respondiendo a un poll');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function getBotInfo() {
  try {
    console.log('\n🤖 INFORMACIÓN DEL BOT:');
    console.log('========================');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botInfo = await response.json() as any;
    
    if (botInfo.ok) {
      const bot = botInfo.result;
      console.log(`📛 Nombre: ${bot.first_name}`);
      console.log(`📧 Username: @${bot.username}`);
      console.log(`🆔 ID: ${bot.id}`);
      console.log(`✅ Es bot: ${bot.is_bot}`);
      console.log(`🔗 Puede unirse a grupos: ${bot.can_join_groups}`);
      console.log(`👥 Puede leer mensajes en grupos: ${bot.can_read_all_group_messages}`);
      console.log(`📞 Soporta comandos inline: ${bot.supports_inline_queries}`);
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo info del bot:', error);
  }
}

async function main() {
  await getBotInfo();
  await checkWebhook();
}

main(); 