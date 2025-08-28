import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function getCurrentNgrokUrl() {
  try {
    // Intentar obtener la URL de ngrok desde su API local
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data = await response.json() as any;
    
    if (data.tunnels && data.tunnels.length > 0) {
      const tunnel = data.tunnels.find((t: any) => t.proto === 'https');
      if (tunnel) {
        return tunnel.public_url;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ No se pudo obtener URL de ngrok automáticamente');
    return null;
  }
}

async function setupWebhook(ngrokUrl?: string) {
  try {
    console.log('🔧 CONFIGURANDO WEBHOOK DE TELEGRAM');
    console.log('===================================');
    
    let webhookUrl = ngrokUrl;
    
    if (!webhookUrl) {
      webhookUrl = await getCurrentNgrokUrl();
    }
    
    if (!webhookUrl) {
      console.log('⚠️  No se pudo detectar ngrok automáticamente.');
      console.log('');
      console.log('🔍 Pasos manuales:');
      console.log('1. Ejecuta: ngrok http 3000');
      console.log('2. Copia la URL que aparece (https://xxxx.ngrok.io)');
      console.log('3. Ejecuta: npx tsx scripts/setup-webhook.ts https://xxxx.ngrok.io');
      return;
    }
    
    console.log(`🌐 URL de ngrok detectada: ${webhookUrl}`);
    
    const fullWebhookUrl = `${webhookUrl}/api/telegram/webhook`;
    
    // Configurar webhook
    const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
    
    console.log(`🔗 Configurando webhook: ${fullWebhookUrl}`);
    
    const response = await fetch(setWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: fullWebhookUrl,
        allowed_updates: ['poll_answer', 'message', 'new_chat_members']
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('✅ WEBHOOK CONFIGURADO EXITOSAMENTE!');
      console.log(`   🌐 URL: ${fullWebhookUrl}`);
      console.log('   📋 Eventos: poll_answer, message');
      
      // Verificar configuración
      console.log('\n🔍 Verificando configuración...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const checkResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const checkResult = await checkResponse.json() as any;
      
      if (checkResult.ok) {
        const info = checkResult.result;
        console.log('📋 Estado del webhook:');
        console.log(`   🌐 URL: ${info.url}`);
        console.log(`   📤 Actualizaciones pendientes: ${info.pending_update_count}`);
        console.log(`   ❌ Último error: ${info.last_error_message || 'Ninguno'}`);
        
        if (info.pending_update_count > 0) {
          console.log(`\n⚠️  HAY ${info.pending_update_count} ACTUALIZACIONES PENDIENTES`);
          console.log('   Estas son probablemente tus respuestas anteriores.');
          console.log('   El sistema las procesará automáticamente ahora.');
        }
      }
      
      console.log('\n�� PRÓXIMOS PASOS:');
      console.log('==================');
      console.log('1. ✅ Webhook configurado correctamente');
      console.log('2. 🗳️  Ve al grupo y responde a un poll');
      console.log('3. 🏆 Verifica el ranking en http://localhost:3000/dashboard');
      console.log('4. 📊 Las respuestas anteriores se procesarán automáticamente');
      
    } else {
      console.error('❌ Error configurando webhook:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  const ngrokUrl = process.argv[2];
  await setupWebhook(ngrokUrl);
}

main(); 