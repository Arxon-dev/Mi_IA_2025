import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002519334308';

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

    const result = await response.json() as any;
    return result.ok;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return false;
  }
}

async function testLogrosCommand() {
  console.log('🧪 PRUEBA DEL COMANDO /logros');
  console.log('=============================');
  console.log('');
  
  const testMessage = `🎮 <b>PRUEBA DEL NUEVO COMANDO /logros</b> 🎮

¡Hola equipo! Hemos implementado el comando <b>/logros</b> para ver tus achievements desbloqueados.

🏆 <b>NUEVO COMANDO DISPONIBLE:</b>
• <code>/logros</code> - Ver todos tus logros desbloqueados

🎯 <b>CÓMO PROBARLO:</b>
1️⃣ Escribe <code>/logros</code> en este chat
2️⃣ El bot te mostrará todos tus achievements
3️⃣ Verás detalles de cada logro (rareza, puntos, fecha)

💡 <b>TAMBIÉN FUNCIONA:</b>
• <code>/achievements</code> (en inglés)

📊 <b>INFORMACIÓN QUE VERÁS:</b>
• 🏆 Nombre del logro con icono
• 📝 Descripción del achievement
• ⭐ Rareza (Common, Rare, Epic, Legendary)
• 💰 Puntos ganados
• 📅 Fecha de desbloqueo
• 💎 Total de puntos por logros

¡Pruébenlo ahora! 🚀`;

  console.log('📤 Enviando mensaje de prueba...');
  const sent = await sendMessage(testMessage);
  
  if (sent) {
    console.log('✅ ¡Mensaje de prueba enviado correctamente!');
    console.log('');
    console.log('🎯 INSTRUCCIONES PARA LA PRUEBA:');
    console.log('================================');
    console.log('1. Ve al grupo de Telegram');
    console.log('2. Escribe: /logros');
    console.log('3. El bot debería responder con tus logros');
    console.log('4. Si no tienes logros, verás consejos para obtenerlos');
    console.log('');
    console.log('📋 CASOS DE PRUEBA:');
    console.log('• Usuario con logros → Lista formateada');
    console.log('• Usuario sin logros → Mensaje motivacional');
    console.log('• Diferentes raridades → Emojis correctos');
    console.log('');
    console.log('🔧 Si hay problemas, revisa los logs del webhook');
    
  } else {
    console.log('❌ Error enviando mensaje de prueba');
  }
}

async function sendUsageExamples() {
  console.log('📚 Enviando ejemplos de uso...');
  
  const examplesMessage = `📚 <b>EJEMPLOS DE USO DEL COMANDO /logros</b>

🎯 <b>EJEMPLO 1 - Usuario con logros:</b>
<code>/logros</code>

<i>Respuesta esperada:</i>
🏆 <b>TUS LOGROS</b> 🏆

🎖️ <b>Tienes 3 logros desbloqueados:</b>

🎯 <b>Primera Respuesta</b> ⚪
   Responde tu primera pregunta
   💰 +50 pts | 📅 15/12/2024

🔥 <b>Racha de 3 días</b> 🔵  
   Responde preguntas durante 3 días consecutivos
   💰 +100 pts | 📅 18/12/2024

⚡ <b>Velocista</b> 🔵
   Responde 10 preguntas en menos de 10 segundos
   💰 +200 pts | 📅 20/12/2024

💎 <b>Puntos totales por logros:</b> 350

---

🎯 <b>EJEMPLO 2 - Usuario sin logros:</b>
<code>/logros</code>

<i>Respuesta esperada:</i>
🏆 <b>TUS LOGROS</b> 🏆

❌ Aún no has desbloqueado ningún logro.

💡 <b>CÓMO OBTENER LOGROS:</b>
🎯 Responde preguntas para ganar puntos
🔥 Mantén rachas diarias 
⚡ Responde rápidamente
🎯 Mejora tu precisión

¡Empieza respondiendo preguntas! 🚀

---

¡Prueben ambos casos! 🧪`;

  const sent = await sendMessage(examplesMessage);
  
  if (sent) {
    console.log('✅ Ejemplos enviados correctamente');
  } else {
    console.log('❌ Error enviando ejemplos');
  }
}

async function main() {
  await testLogrosCommand();
  console.log('');
  console.log('⏳ Esperando 2 segundos...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await sendUsageExamples();
}

main().catch(console.error); 