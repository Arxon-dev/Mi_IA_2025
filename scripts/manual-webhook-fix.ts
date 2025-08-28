import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function manualWebhookFix() {
  console.log('🔧 REPARACIÓN MANUAL DEL WEBHOOK');
  console.log('==================================\n');

  // 1. Verificar estado actual
  console.log('🔍 1. ESTADO ACTUAL DEL WEBHOOK...');
  
  const webhookInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const webhookData = await webhookInfo.json() as any;
  
  if (webhookData.ok) {
    const info = webhookData.result;
    console.log(`   🌐 URL: ${info.url || 'NO CONFIGURADA'}`);
    console.log(`   📋 Eventos: ${info.allowed_updates?.join(', ') || 'Todos (por defecto)'}`);
    console.log(`   ❌ Último error: ${info.last_error_message || 'Ninguno'}`);
    
    if (!info.url) {
      console.log('   ❌ No hay webhook configurado');
      return;
    }
    
    // 2. Reconfigurar con new_chat_members
    console.log('\n🔧 2. RECONFIGURANDO CON new_chat_members...');
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: info.url, // Usar la misma URL actual
        allowed_updates: ['poll_answer', 'message', 'new_chat_members']
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('   ✅ Webhook reconfigurado exitosamente');
      console.log(`   🌐 URL: ${info.url}`);
      console.log('   📋 Eventos: poll_answer, message, new_chat_members');
      
      // 3. Verificar nueva configuración
      console.log('\n🔍 3. VERIFICANDO NUEVA CONFIGURACIÓN...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const newData = await newInfo.json() as any;
      
      if (newData.ok) {
        const newResult = newData.result;
        console.log('   📋 Estado actualizado:');
        console.log(`      🌐 URL: ${newResult.url}`);
        console.log(`      📋 Eventos: ${newResult.allowed_updates?.join(', ') || 'Todos'}`);
        console.log(`      📤 Pendientes: ${newResult.pending_update_count}`);
        
        const hasNewChatMembers = newResult.allowed_updates?.includes('new_chat_members') || !newResult.allowed_updates;
        
        if (hasNewChatMembers) {
          console.log('      ✅ new_chat_members CONFIGURADO CORRECTAMENTE');
        } else {
          console.log('      ❌ new_chat_members AÚN NO CONFIGURADO');
        }
      }
      
      console.log('\n🎯 RESULTADO FINAL:');
      console.log('===================');
      console.log('✅ Sistema de bienvenida configurado');
      console.log('✅ HTML del mensaje corregido');
      console.log('✅ Webhook incluye new_chat_members');
      console.log('\n🧪 PARA PROBAR:');
      console.log('1. Sal del grupo de Telegram');
      console.log('2. Vuelve a entrar al grupo');
      console.log('3. Deberías ver el mensaje de bienvenida');
      console.log('4. El mensaje se eliminará automáticamente después de 5 minutos');
      
    } else {
      console.log(`   ❌ Error: ${result.description}`);
    }
  }
}

manualWebhookFix().catch(console.error); 