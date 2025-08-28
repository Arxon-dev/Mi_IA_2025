import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function verifyAndFixWebhookConfig() {
  try {
    console.log('🔍 VERIFICACIÓN AUTOMÁTICA DEL WEBHOOK');
    console.log('=====================================');
    
    // 1. Obtener configuración actual
    console.log('📊 1. OBTENIENDO CONFIGURACIÓN ACTUAL...');
    const webhookInfo = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const webhookData = await webhookInfo.json() as any;
    
    if (!webhookData.ok) {
      console.log('❌ Error obteniendo información del webhook:', webhookData.description);
      return;
    }
    
    const info = webhookData.result;
    console.log(`   🌐 URL: ${info.url || 'NO CONFIGURADA'}`);
    console.log(`   📋 Eventos: ${info.allowed_updates?.join(', ') || 'Todos (por defecto)'}`);
    console.log(`   📤 Pendientes: ${info.pending_update_count}`);
    console.log(`   ❌ Último error: ${info.last_error_message || 'Ninguno'}`);
    
    // 2. Verificar si tiene poll_answer
    const requiredEvents = ['poll_answer', 'message', 'new_chat_members'];
    const currentEvents = info.allowed_updates || [];
    
    const missingEvents = requiredEvents.filter(event => !currentEvents.includes(event));
    
    if (!info.url) {
      console.log('\n❌ PROBLEMA: No hay webhook configurado');
      console.log('   💡 Solución: Ejecuta setup-ngrok-webhook.ts o setup-webhook.ts');
      return;
    }
    
    if (missingEvents.length === 0) {
      console.log('\n✅ CONFIGURACIÓN CORRECTA: Todos los eventos necesarios están configurados');
      console.log('   📋 Eventos configurados:', currentEvents.join(', '));
      return;
    }
    
    // 3. Hay eventos faltantes - corregir automáticamente
    console.log('\n⚠️  PROBLEMA DETECTADO: Faltan eventos importantes');
    console.log(`   ❌ Eventos faltantes: ${missingEvents.join(', ')}`);
    console.log('   🔧 Corrigiendo automáticamente...');
    
    // Reconfigurar webhook con los eventos correctos
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: info.url, // Mantener la misma URL
        allowed_updates: requiredEvents
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('   ✅ Webhook reconfigurado exitosamente');
      console.log(`   📋 Nuevos eventos: ${requiredEvents.join(', ')}`);
      
      // Verificar que se aplicó correctamente
      console.log('\n🔍 4. VERIFICANDO CORRECCIÓN...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const verifyResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const verifyData = await verifyResponse.json() as any;
      
      if (verifyData.ok) {
        const verifyInfo = verifyData.result;
        const finalEvents = verifyInfo.allowed_updates || [];
        
        const stillMissing = requiredEvents.filter(event => !finalEvents.includes(event));
        
        if (stillMissing.length === 0) {
          console.log('   ✅ CORRECCIÓN EXITOSA: Todos los eventos están configurados');
          console.log(`   📋 Eventos finales: ${finalEvents.join(', ')}`);
        } else {
          console.log('   ❌ AÚN HAY PROBLEMAS: Algunos eventos no se configuraron');
          console.log(`   ❌ Aún faltan: ${stillMissing.join(', ')}`);
        }
      }
      
    } else {
      console.log('   ❌ Error reconfigurando webhook:', result.description);
    }
    
    // 5. Mostrar resumen y recomendaciones
    console.log('\n📋 RESUMEN:');
    console.log('===========');
    console.log('✅ poll_answer: Necesario para procesar respuestas de polls');
    console.log('✅ message: Necesario para procesar comandos');
    console.log('✅ new_chat_members: Necesario para dar la bienvenida a nuevos usuarios');
    console.log('');
    console.log('💡 RECOMENDACIONES:');
    console.log('- Ejecuta este script periódicamente para verificar la configuración');
    console.log('- Si usas otros scripts de setup, asegúrate de que incluyan poll_answer');
    console.log('- Revisa setup-ngrok.ts si sigues teniendo problemas');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Función para mostrar cuáles scripts pueden causar problemas
async function auditSetupScripts() {
  console.log('\n🔍 AUDITORÍA DE SCRIPTS DE CONFIGURACIÓN');
  console.log('========================================');
  
  const scripts = [
    'scripts/setup-webhook.ts',
    'scripts/setup-ngrok-webhook.ts', 
    'scripts/setup-webhook-cloudflared.ts',
    'scripts/setup-ngrok.ts',
    'scripts/manual-webhook-fix.ts',
    'scripts/fix-welcome-system.ts'
  ];
  
  console.log('📋 Scripts que pueden configurar webhooks:');
  scripts.forEach(script => {
    console.log(`   📄 ${script}`);
  });
  
  console.log('');
  console.log('⚠️  NOTA IMPORTANTE:');
  console.log('   Si ejecutas cualquiera de estos scripts, pueden cambiar la configuración del webhook.');
  console.log('   Asegúrate de que TODOS incluyan poll_answer en allowed_updates.');
  console.log('   Este script de verificación puede corregir automáticamente cualquier problema.');
}

async function main() {
  await verifyAndFixWebhookConfig();
  await auditSetupScripts();
  
  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('==================');
  console.log('1. ✅ Configuración verificada y corregida si era necesario');
  console.log('2. 🗳️  Prueba respondiendo a un poll en el grupo');
  console.log('3. 🔍 Ejecuta scripts/test-poll-answer.ts para verificar');
  console.log('4. 📅 Programa este script para ejecutarse automáticamente');
  console.log('');
  console.log('💡 TIP: Añade este script a tu rutina de mantenimiento semanal');
}

main(); 