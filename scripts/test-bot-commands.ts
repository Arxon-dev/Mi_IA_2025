import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
}

async function sendMessage(text: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json() as TelegramResponse;
    return result.ok;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return false;
  }
}

async function testBotCommands() {
  console.log('🤖 PRUEBA DE COMANDOS DEL BOT');
  console.log('=============================');
  console.log('');
  
  // Lista de comandos a probar
  const commands = [
    {
      name: '/help',
      description: 'Ayuda general del bot'
    },
    {
      name: '/ranking',
      description: 'Ranking de usuarios'
    },
    {
      name: '/stats',
      description: 'Estadísticas personales (solo funciona si escribes como usuario)'
    }
  ];
  
  // Enviar mensaje de inicio de pruebas
  const startMessage = `🧪 <b>INICIO DE PRUEBAS DEL SISTEMA</b> 🧪

¡Hola a todos! Vamos a probar que todos los comandos del bot funcionen correctamente.

📋 <b>COMANDOS A PROBAR:</b>
• /help - Ver ayuda completa
• /ranking - Ver ranking actual
• /stats - Ver tus estadísticas personales

🎯 <b>POLL ENVIADO:</b> Arriba tienes una nueva pregunta para responder

⚡ <b>INSTRUCCIONES:</b>
1️⃣ Responde al poll de arriba
2️⃣ Prueba los comandos escribiéndolos en el chat
3️⃣ Verifica que recibes respuestas del bot

¡Vamos a probarlo! 🚀`;

  console.log('📤 Enviando mensaje de inicio de pruebas...');
  const sent = await sendMessage(startMessage);
  
  if (sent) {
    console.log('✅ Mensaje de inicio enviado correctamente');
    console.log('');
    console.log('🎯 PRUEBAS ACTIVAS EN EL GRUPO:');
    console.log('--------------------------------');
    console.log('1️⃣ Poll enviado - Los usuarios pueden responder');
    console.log('2️⃣ Comandos listos para probar:');
    commands.forEach((cmd, index) => {
      console.log(`   ${index + 1}. ${cmd.name} - ${cmd.description}`);
    });
    console.log('');
    console.log('📱 Ve al grupo de Telegram y:');
    console.log('   • Responde al poll');
    console.log('   • Escribe /help, /ranking, /stats');
    console.log('   • Verifica que el bot responde');
    console.log('');
    console.log('⏰ Después de las pruebas, ejecuta: npx tsx scripts/monitor-system.ts');
    
  } else {
    console.log('❌ Error enviando mensaje de inicio');
  }
}

async function sendTestResults() {
  const resultsMessage = `📊 <b>RESULTADOS DE LAS PRUEBAS</b> 📊

✅ <b>¿QUÉ DEBERÍAMOS VER SI TODO FUNCIONA?</b>

🗳️ <b>POLL:</b>
• Botones nativos funcionando
• Feedback inmediato al responder
• Puntos asignados automáticamente

🤖 <b>COMANDOS:</b>
• /help → Mensaje con ayuda completa
• /ranking → Lista de usuarios y puntos
• /stats → Estadísticas personales del usuario

📈 <b>GAMIFICACIÓN:</b>
• Puntos actualizados tras responder
• Niveles calculados correctamente
• Rachas funcionando

🔧 Si algo no funciona, reporta en el chat y revisaremos el sistema.

¡Gracias por ayudar con las pruebas! 🙏`;

  console.log('📤 Enviando resumen de resultados esperados...');
  const sent = await sendMessage(resultsMessage);
  
  if (sent) {
    console.log('✅ Resumen de pruebas enviado');
  } else {
    console.log('❌ Error enviando resumen');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--results')) {
    await sendTestResults();
  } else if (args.includes('--help')) {
    console.log('🧪 PRUEBAS DEL BOT:');
    console.log('');
    console.log('  🚀 Iniciar pruebas:');
    console.log('     npx tsx scripts/test-bot-commands.ts');
    console.log('');
    console.log('  📊 Enviar resumen de resultados:');
    console.log('     npx tsx scripts/test-bot-commands.ts --results');
    console.log('');
    console.log('  📋 Mostrar ayuda:');
    console.log('     npx tsx scripts/test-bot-commands.ts --help');
  } else {
    await testBotCommands();
  }
}

main(); 