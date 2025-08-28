import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function setupWebhookManual() {
  console.log('🔧 CONFIGURACIÓN MANUAL DEL WEBHOOK');
  console.log('===================================');
  console.log('');
  console.log('Como ngrok no está instalado, puedes usar cloudflared:');
  console.log('');
  console.log('📥 INSTALACIÓN DE CLOUDFLARED:');
  console.log('------------------------------');
  console.log('1. Ve a: https://github.com/cloudflare/cloudflared/releases');
  console.log('2. Descarga: cloudflared-windows-amd64.exe');
  console.log('3. Renómbralo a: cloudflared.exe');
  console.log('4. Muévelo a tu carpeta del proyecto');
  console.log('');
  console.log('🚀 USO DE CLOUDFLARED:');
  console.log('----------------------');
  console.log('1. Abre una nueva terminal');
  console.log('2. Ejecuta: .\\cloudflared.exe tunnel --url http://localhost:3000');
  console.log('3. Copia la URL que aparece (algo como https://xxxx.trycloudflare.com)');
  console.log('4. Ejecuta: npx tsx scripts/setup-webhook-cloudflared.ts https://xxxx.trycloudflare.com');
  console.log('');
  console.log('⚡ ALTERNATIVA MÁS SIMPLE:');
  console.log('-------------------------');
  console.log('Usar serveo.net (no requiere instalación):');
  console.log('1. Ejecuta: ssh -R 80:localhost:3000 serveo.net');
  console.log('2. Copia la URL que aparece');
  console.log('3. Usa esa URL para configurar el webhook');
  console.log('');
  
  const ngrokUrl = process.argv[2];
  
  if (!ngrokUrl) {
    console.log('❌ No se proporcionó URL del túnel');
    console.log('');
    console.log('Uso: npx tsx scripts/setup-webhook-cloudflared.ts <URL_DEL_TUNEL>');
    console.log('Ejemplo: npx tsx scripts/setup-webhook-cloudflared.ts https://abc123.trycloudflare.com');
    return;
  }
  
  console.log(`🌐 Configurando webhook con: ${ngrokUrl}`);
  
  const fullWebhookUrl = `${ngrokUrl}/api/telegram/webhook`;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
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
      console.log('   📋 Eventos: poll_answer, message, new_chat_members');
      
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
          console.log('   Estas incluyen tus respuestas anteriores.');
          console.log('   Se procesarán automáticamente ahora.');
        }
      }
      
      console.log('\n🎯 PRÓXIMOS PASOS:');
      console.log('==================');
      console.log('1. ✅ Privacy mode debe estar DESHABILITADO');
      console.log('2. ✅ Webhook configurado correctamente');
      console.log('3. 🗳️  Ve al grupo y responde a un poll');
      console.log('4. 🏆 Verifica el ranking en http://localhost:3000/dashboard');
      console.log('5. 📊 Las respuestas anteriores se procesarán automáticamente');
      
    } else {
      console.error('❌ Error configurando webhook:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setupWebhookManual(); 