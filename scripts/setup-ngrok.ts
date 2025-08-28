import { spawn } from 'child_process';
import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function setupNgrokWebhook() {
  console.log('🚀 Configurando webhook con ngrok...\n');

  try {
    // Verificar si ngrok está instalado
    console.log('🔍 Verificando ngrok...');
    
    // Instrucciones para descargar ngrok si no está instalado
    console.log('📋 Para usar ngrok:');
    console.log('1. Descarga ngrok: https://ngrok.com/download');
    console.log('2. Extrae el archivo en una carpeta');
    console.log('3. Ejecuta: ngrok http 3000');
    console.log('4. Copia la URL HTTPS que aparece');
    console.log('5. Ejecuta este script con la URL\n');

    // Si se proporciona una URL como argumento
    const args = process.argv.slice(2);
    const ngrokUrl = args.find(arg => arg.startsWith('https://'));

    if (!ngrokUrl) {
      console.log('❌ No se proporcionó URL de ngrok');
      console.log('\nUso: npx tsx scripts/setup-ngrok.ts <URL_NGROK>');
      console.log('Ejemplo: npx tsx scripts/setup-ngrok.ts https://abc123.ngrok.io');
      process.exit(1);
    }

    const webhookUrl = `${ngrokUrl}/api/telegram/webhook`;

    console.log(`🔗 Configurando webhook con URL: ${webhookUrl}`);

    // Verificar que el bot es válido
    console.log('🤖 Verificando bot...');
    const botResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botInfo = await botResponse.json() as any;

    if (!botInfo.ok) {
      throw new Error(`Bot no válido: ${botInfo.description}`);
    }

    console.log('✅ Bot verificado:', botInfo.result.first_name);

    // Eliminar webhook anterior
    console.log('🧹 Eliminando webhook anterior...');
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`);

    // Configurar nuevo webhook
    console.log('📡 Configurando nuevo webhook...');
    const webhookResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        max_connections: 40,
        allowed_updates: ['poll_answer', 'message', 'new_chat_members']
      })
    });

    const webhookResult = await webhookResponse.json() as any;

    if (!webhookResult.ok) {
      throw new Error(`Error configurando webhook: ${webhookResult.description}`);
    }

    console.log('✅ Webhook configurado exitosamente!');

    // Verificar configuración
    console.log('📊 Verificando configuración...');
    const infoResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const webhookInfo = await infoResponse.json() as any;

    if (webhookInfo.ok) {
      console.log('✅ Información del webhook:', {
        url: webhookInfo.result.url,
        pending_update_count: webhookInfo.result.pending_update_count,
        max_connections: webhookInfo.result.max_connections
      });
    }

    console.log('\n🎉 ¡Webhook configurado correctamente!');
    console.log('\n📝 Ahora puedes:');
    console.log('1. Ve a tu grupo de Telegram');
    console.log('2. Responde a la pregunta que ya envié (mensaje ID: 430)');
    console.log('3. El bot debería responder con tus estadísticas');
    console.log('4. Usa /ranking, /stats, /racha para probar comandos');
    console.log('5. Revisa el dashboard: http://localhost:3000/dashboard/gamification');

  } catch (error) {
    console.error('❌ Error configurando webhook:', error);
    
    if (error instanceof Error) {
      console.error('Detalles:', error.message);
    }
    
    process.exit(1);
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log('🚀 Script de configuración de webhook con ngrok\n');
  console.log('Este script configura el webhook de Telegram usando una URL de ngrok.\n');
  
  console.log('📋 Pasos previos:');
  console.log('1. Descargar ngrok: https://ngrok.com/download');
  console.log('2. Extraer el archivo');
  console.log('3. Ejecutar: ngrok http 3000');
  console.log('4. Copiar la URL HTTPS\n');
  
  console.log('Uso:');
  console.log('  npx tsx scripts/setup-ngrok.ts <URL_NGROK>\n');
  
  console.log('Ejemplo:');
  console.log('  npx tsx scripts/setup-ngrok.ts https://abc123.ngrok.io\n');
  
  console.log('Opciones:');
  console.log('  --help, -h    Mostrar esta ayuda');
}

// Verificar argumentos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else {
  setupNgrokWebhook();
} 