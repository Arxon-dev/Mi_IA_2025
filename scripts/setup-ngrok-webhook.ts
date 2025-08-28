import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function getNgrokUrl() {
  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data = await response.json() as any;
    
    if (data.tunnels && data.tunnels.length > 0) {
      // Buscar el túnel HTTPS
      const httpsTunnel = data.tunnels.find((tunnel: any) => tunnel.proto === 'https');
      if (httpsTunnel) {
        return httpsTunnel.public_url;
      }
      // Si no hay HTTPS, usar el primero disponible
      return data.tunnels[0].public_url;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo URL de ngrok:', error);
    return null;
  }
}

async function setupWebhook() {
  try {
    console.log('🔧 CONFIGURANDO WEBHOOK CON NGROK');
    console.log('==================================');
    
    // Obtener URL de ngrok
    console.log('📡 Obteniendo URL de ngrok...');
    const ngrokUrl = await getNgrokUrl();
    
    if (!ngrokUrl) {
      console.error('❌ No se pudo obtener la URL de ngrok');
      console.log('');
      console.log('🔍 VERIFICA QUE:');
      console.log('  • ngrok esté ejecutándose en otra terminal');
      console.log('  • El comando sea: ngrok http 3000');
      console.log('  • La interfaz web esté disponible en http://127.0.0.1:4040');
      return;
    }
    
    console.log(`✅ URL de ngrok obtenida: ${ngrokUrl}`);
    
    // Configurar webhook
    const webhookUrl = `${ngrokUrl}/api/telegram/webhook`;
    console.log(`🎯 Configurando webhook: ${webhookUrl}`);
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['poll_answer', 'message', 'new_chat_members']
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('🎉 ¡WEBHOOK CONFIGURADO EXITOSAMENTE!');
      console.log(`   🌐 URL: ${webhookUrl}`);
      console.log('   📋 Eventos: poll_answer, message, new_chat_members');
      
      // Verificar configuración
      console.log('\n🔍 Verificando configuración...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const checkResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const checkResult = await checkResponse.json() as any;
      
      if (checkResult.ok) {
        const info = checkResult.result;
        console.log('\n📋 ESTADO ACTUAL DEL WEBHOOK:');
        console.log('----------------------------');
        console.log(`🌐 URL: ${info.url}`);
        console.log(`📤 Actualizaciones pendientes: ${info.pending_update_count}`);
        console.log(`❌ Último error: ${info.last_error_message || 'Ninguno'}`);
        console.log(`📅 Última actualización: ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : 'N/A'}`);
        
        if (info.pending_update_count > 0) {
          console.log(`\n⚡ HAY ${info.pending_update_count} ACTUALIZACIONES PENDIENTES`);
          console.log('   Estas incluyen respuestas anteriores que se procesarán automáticamente.');
        }
        
        console.log('\n🎯 PRÓXIMOS PASOS PARA @Carlos_esp:');
        console.log('===================================');
        console.log('1. 🗳️  Ve al grupo "OpoMelilla" en Telegram');
        console.log('2. 🔍 Busca cualquier poll disponible');
        console.log('3. 👆 Responde al poll');
        console.log('4. ⏱️  Espera 10-30 segundos');
        console.log('5. 🏆 Ejecuta /ranking para verificar si apareces');
        console.log('6. 📊 También puedes ver el dashboard: http://localhost:3000/dashboard');
        
        if (info.pending_update_count > 0) {
          console.log('\n🚀 LAS RESPUESTAS ANTERIORES SE PROCESARÁN AUTOMÁTICAMENTE');
          console.log('   Si ya respondiste polls antes, deberías aparecer en el ranking pronto.');
        }
        
      }
      
    } else {
      console.error('❌ Error configurando webhook:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

setupWebhook(); 