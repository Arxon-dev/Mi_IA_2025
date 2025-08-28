#!/usr/bin/env ts-node

/**
 * Script para configurar pagos de Telegram
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://tu-dominio.com/api/telegram/webhook';

async function setupTelegramPayments() {
  console.log('🔧 ==========================================');
  console.log('🔧 CONFIGURANDO PAGOS DE TELEGRAM');
  console.log('🔧 ==========================================\n');

  if (!BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN no configurado');
    return;
  }

  try {
    // 1. Configurar webhook
    console.log('🔗 Configurando webhook...');
    const webhookResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message', 'poll_answer', 'pre_checkout_query', 'successful_payment']
      })
    });
    
    const webhookResult = await webhookResponse.json();
    console.log('📤 Webhook configurado:', webhookResult.ok ? '✅' : '❌');
    
    if (!webhookResult.ok) {
      console.error('   Error:', webhookResult.description);
    }

    // 2. Verificar webhook
    console.log('\n🔍 Verificando webhook...');
    const infoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const infoResult = await infoResponse.json();
    
    if (infoResult.ok) {
      console.log('📋 Estado del webhook:');
      console.log(`   URL: ${infoResult.result.url}`);
      console.log(`   Certificado válido: ${infoResult.result.has_custom_certificate ? 'Sí' : 'No'}`);
      console.log(`   Updates permitidos: ${infoResult.result.allowed_updates?.join(', ') || 'Todos'}`);
      console.log(`   Último error: ${infoResult.result.last_error_message || 'Ninguno'}`);
    }

    // 3. Verificar información del bot
    console.log('\n🤖 Verificando información del bot...');
    const botResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botResult = await botResponse.json();
    
    if (botResult.ok) {
      console.log('🤖 Bot configurado:');
      console.log(`   Nombre: ${botResult.result.first_name}`);
      console.log(`   Username: @${botResult.result.username}`);
      console.log(`   Puede recibir pagos: ${botResult.result.can_receive_payments ? '✅ Sí' : '❌ No'}`);
    }

    console.log('\n🎯 ==========================================');
    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('🎯 ==========================================');
    console.log('1. 💳 Obtener clave de Stripe España');
    console.log('2. 🔑 Configurar variables de entorno');
    console.log('3. 💸 Realizar prueba con €0.01');
    console.log('4. 🚀 ¡Lanzar a beta testing!');
    console.log('');
    console.log('💡 Para probar: envía /planes en tu bot');

  } catch (error) {
    console.error('💥 Error configurando pagos:', error);
  }
}

if (require.main === module) {
  setupTelegramPayments().catch(console.error);
}

export { setupTelegramPayments }; 