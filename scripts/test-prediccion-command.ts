import fetch from 'node-fetch';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

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

async function testPrediccionCommand() {
  console.log('🔮 PRUEBA DEL COMANDO /prediccion');
  console.log('=================================');
  console.log('');
  
  const testMessage = `🔮 <b>NUEVO COMANDO: /prediccion</b> 🔮

¡Hemos implementado el comando más motivador del bot!

🎯 <b>NUEVO COMANDO DISPONIBLE:</b>
• <code>/prediccion</code> - Predicción de tu próximo nivel

🔮 <b>QUÉ HACE ESTE COMANDO:</b>
• 📊 Te muestra tu progreso actual hacia el siguiente nivel
• 🎯 Calcula exactamente cuántos puntos necesitas
• 📝 Estima cuántas preguntas tienes que responder
• ⏰ Te dice cuánto tiempo te tomará (aprox.)
• 📈 Muestra una barra de progreso visual
• 💡 Te da consejos para subir de nivel más rápido

💡 <b>TAMBIÉN FUNCIONA:</b>
• <code>/prediction</code> (en inglés)

🎮 <b>EJEMPLO DE LO QUE VERÁS:</b>

🔮 <b>PREDICCIÓN DE NIVEL</b> 🔮

🌟 <b>Nivel actual:</b> 2
📊 <b>Puntos actuales:</b> 145

🎯 <b>PRÓXIMO NIVEL (3):</b>
• 🎯 Puntos necesarios: <b>155</b>
• 📝 Preguntas estimadas: <b>~11</b>
• ⏰ Tiempo estimado: <b>~11 días</b>
• 📈 Progreso: <b>48%</b>

████░░░░░░ 48%

💡 <b>CONSEJOS PARA SUBIR MÁS RÁPIDO:</b>
• ⚡ Responde rápido (+5-10 pts extra)
• 🔥 Mantén tu racha diaria
• 🎯 Mejora tu precisión

¡Pruébenlo ahora escribiendo <code>/prediccion</code>! 🚀`;

  console.log('📤 Enviando mensaje de prueba...');
  const sent = await sendMessage(testMessage);
  
  if (sent) {
    console.log('✅ ¡Mensaje de prueba enviado correctamente!');
    console.log('');
    console.log('🎯 CÓMO PROBAR:');
    console.log('==============');
    console.log('1. Ve al grupo de Telegram');
    console.log('2. Escribe: /prediccion');
    console.log('3. El bot te mostrará tu predicción personalizada');
    console.log('');
    console.log('📊 QUE ESPERAR:');
    console.log('• Información del nivel actual');
    console.log('• Puntos necesarios para el siguiente nivel');
    console.log('• Estimación de preguntas y tiempo');
    console.log('• Barra de progreso visual');
    console.log('• Consejos personalizados');
    console.log('• Mensaje motivacional adaptado a tu progreso');
    
  } else {
    console.log('❌ Error enviando mensaje de prueba');
  }
}

async function sendDetailedExamples() {
  console.log('📋 Enviando ejemplos detallados...');
  
  const examplesMessage = `📋 <b>EJEMPLOS DEL COMANDO /prediccion</b>

🎯 <b>EJEMPLO PARA USUARIO PRINCIPIANTE:</b>
<code>/prediccion</code>

<i>Respuesta esperada:</i>
🔮 <b>PREDICCIÓN DE NIVEL</b> 🔮

⭐ <b>Nivel actual:</b> 1
📊 <b>Puntos actuales:</b> 15

🎯 <b>PRÓXIMO NIVEL (2):</b>
• 🎯 Puntos necesarios: <b>85</b>
• 📝 Preguntas estimadas: <b>~6</b>
• ⏰ Tiempo estimado: <b>~6 días</b>
• 📈 Progreso: <b>15%</b>

█░░░░░░░░░ 15%

💡 <b>CONSEJOS PARA SUBIR MÁS RÁPIDO:</b>
• ⚡ Responde rápido (+5-10 pts extra)
• 🔥 Mantén tu racha diaria

🎯 ¡El siguiente nivel está al alcance! ¡Sigue así!

---

🚀 <b>EJEMPLO PARA USUARIO AVANZADO:</b>
<code>/prediccion</code>

<i>Respuesta esperada:</i>
🔮 <b>PREDICCIÓN DE NIVEL</b> 🔮

🏆 <b>Nivel actual:</b> 3
📊 <b>Puntos actuales:</b> 580

🎯 <b>PRÓXIMO NIVEL (4):</b>
• 🎯 Puntos necesarios: <b>20</b>
• 📝 Preguntas estimadas: <b>~2</b>
• ⏰ Tiempo estimado: <b>~2 días</b>
• 📈 Progreso: <b>97%</b>

█████████░ 97%

🔥 ¡Estás súper cerca! ¡Solo unas pocas preguntas más!

---

¡El comando se adapta a tu progreso específico! 🎮`;

  const sent = await sendMessage(examplesMessage);
  
  if (sent) {
    console.log('✅ Ejemplos enviados correctamente');
  } else {
    console.log('❌ Error enviando ejemplos');
  }
}

async function sendFeatureComplete() {
  console.log('🎉 Enviando resumen de comandos completados...');
  
  const completeMessage = `🎉 <b>¡COMANDOS AVANZADOS LISTOS!</b> 🎉

🤖 <b>NUEVOS COMANDOS IMPLEMENTADOS:</b>

1️⃣ <code>/logros</code> 🏆
   • Ver todos tus achievements desbloqueados
   • Información de rareza y puntos
   • Consejos para obtener más logros

2️⃣ <code>/prediccion</code> 🔮
   • Predicción de próximo nivel
   • Estimaciones de tiempo y preguntas
   • Barra de progreso visual
   • Consejos personalizados

🎯 <b>COMANDOS EXISTENTES:</b>
• <code>/ranking</code> - Leaderboard general
• <code>/stats</code> - Tus estadísticas completas
• <code>/racha</code> - Información de racha diaria
• <code>/help</code> - Lista de comandos

💡 <b>PRÓXIMOS COMANDOS EN DESARROLLO:</b>
• <code>/comparar @usuario</code> - Comparar estadísticas
• <code>/duelo @usuario</code> - Retar a duelo
• <code>/metas</code> - Sistema de objetivos
• <code>/tienda</code> - Canjear recompensas

🎮 <b>¡El bot cada vez está más gamificado!</b>

¡Prueben todos los comandos nuevos! 🚀`;

  const sent = await sendMessage(completeMessage);
  
  if (sent) {
    console.log('✅ Resumen de comandos enviado correctamente');
  } else {
    console.log('❌ Error enviando resumen');
  }
}

async function main() {
  await testPrediccionCommand();
  console.log('');
  console.log('⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sendDetailedExamples();
  console.log('');
  console.log('⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sendFeatureComplete();
}

main().catch(console.error); 