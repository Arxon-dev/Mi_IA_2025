import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function getNgrokUrl(): Promise<string | null> {
  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data = await response.json() as any;
    
    const httpsTunnel = data.tunnels?.find((tunnel: any) => 
      tunnel.public_url?.startsWith('https://') && 
      tunnel.config?.addr === 'localhost:3000'
    );
    
    return httpsTunnel?.public_url || null;
  } catch (error) {
    return null;
  }
}

async function fixWelcomeSystem() {
  console.log('🔧 REPARANDO SISTEMA DE BIENVENIDA');
  console.log('===================================\n');

  // 1. Verificar estado actual del webhook
  console.log('🔍 1. VERIFICANDO ESTADO ACTUAL...');
  
  const webhookInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const webhookData = await webhookInfo.json() as any;
  
  if (webhookData.ok) {
    const info = webhookData.result;
    console.log(`   🌐 URL actual: ${info.url || 'NO CONFIGURADA'}`);
    console.log(`   📋 Eventos permitidos: ${info.allowed_updates?.join(', ') || 'Todos (por defecto)'}`);
    console.log(`   ❌ Último error: ${info.last_error_message || 'Ninguno'}`);
    
    // Verificar si new_chat_members está incluido
    const hasNewChatMembers = info.allowed_updates?.includes('new_chat_members') || !info.allowed_updates;
    
    if (!hasNewChatMembers) {
      console.log('   ❌ PROBLEMA DETECTADO: new_chat_members NO está en allowed_updates');
    } else {
      console.log('   ✅ new_chat_members está configurado');
    }
    
    if (info.last_error_message) {
      console.log('   ⚠️  HAY ERRORES EN EL WEBHOOK - necesita reparación');
    }
  }
  
  // 2. Obtener URL de ngrok actual
  console.log('\n🔍 2. VERIFICANDO NGROK...');
  const ngrokUrl = await getNgrokUrl();
  
  if (!ngrokUrl) {
    console.log('   ❌ ngrok no está ejecutándose o no está disponible');
    console.log('\n🚨 ACCIÓN REQUERIDA:');
    console.log('   1. Ejecuta en otra terminal: ngrok http 3000');
    console.log('   2. Asegúrate de que tu aplicación Next.js esté ejecutándose');
    console.log('   3. Vuelve a ejecutar este script');
    return;
  }
  
  console.log(`   ✅ ngrok ejecutándose: ${ngrokUrl}`);
  
  // 3. Reconfigurar webhook con new_chat_members
  console.log('\n🔧 3. RECONFIGURANDO WEBHOOK...');
  
  const webhookUrl = `${ngrokUrl}/api/telegram/webhook`;
  
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
    console.log('   ✅ Webhook reconfigurado exitosamente');
    console.log(`   🌐 URL: ${webhookUrl}`);
    console.log('   📋 Eventos: poll_answer, message, new_chat_members');
  } else {
    console.log(`   ❌ Error reconfigurando webhook: ${result.description}`);
    return;
  }
  
  // 4. Verificar la nueva configuración
  console.log('\n🔍 4. VERIFICANDO NUEVA CONFIGURACIÓN...');
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
  
  const newWebhookInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const newWebhookData = await newWebhookInfo.json() as any;
  
  if (newWebhookData.ok) {
    const info = newWebhookData.result;
    console.log('   📋 Estado actualizado:');
    console.log(`      🌐 URL: ${info.url}`);
    console.log(`      📋 Eventos: ${info.allowed_updates?.join(', ') || 'Todos'}`);
    console.log(`      📤 Pendientes: ${info.pending_update_count}`);
    console.log(`      ❌ Errores: ${info.last_error_message || 'Ninguno'}`);
    
    const hasNewChatMembers = info.allowed_updates?.includes('new_chat_members') || !info.allowed_updates;
    
    if (hasNewChatMembers) {
      console.log('      ✅ new_chat_members CONFIGURADO CORRECTAMENTE');
    } else {
      console.log('      ❌ new_chat_members AÚN NO CONFIGURADO');
    }
  }
  
  // 5. Probar la aplicación
  console.log('\n🧪 5. PROBANDO APLICACIÓN...');
  
  try {
    const testResponse = await fetch(`${ngrokUrl}/api/health`);
    if (testResponse.ok) {
      console.log('   ✅ Aplicación Next.js respondiendo correctamente');
    } else {
      console.log('   ⚠️  Aplicación responde pero con errores');
    }
  } catch (error) {
    console.log('   ❌ No se puede contactar con la aplicación');
    console.log('      Asegúrate de que Next.js esté ejecutándose (npm run dev)');
  }
  
  // 6. Instrucciones finales
  console.log('\n🎯 ESTADO FINAL:');
  console.log('================');
  
  if (result.ok) {
    console.log('✅ Sistema de bienvenida REPARADO');
    console.log('\n🧪 PARA PROBAR:');
    console.log('1. Sal del grupo de Telegram');
    console.log('2. Vuelve a entrar al grupo');
    console.log('3. Deberías ver un mensaje de bienvenida automático');
    console.log('4. El mensaje se eliminará automáticamente después de 5 minutos');
    
    console.log('\n📋 LOGS A VERIFICAR:');
    console.log('En la consola de Next.js deberías ver:');
    console.log('  👋 ======== NUEVOS MIEMBROS DETECTADOS ========');
    console.log('  ✅ NUEVOS MIEMBROS - Mensaje de bienvenida enviado');
    
  } else {
    console.log('❌ No se pudo reparar el sistema');
    console.log('Revisa los errores anteriores');
  }
}

// Ejecutar reparación
fixWelcomeSystem().catch(console.error); 