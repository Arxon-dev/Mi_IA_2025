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

async function testMetasCommand() {
  console.log('🎯 PRUEBA DEL COMANDO /metas');
  console.log('============================');
  console.log('');
  
  const testMessage = `🎯 <b>NUEVO COMANDO: /metas</b> 🎯

¡El sistema de <b>Metas Personales</b> ya está disponible!

🎯 <b>NUEVO COMANDO DISPONIBLE:</b>
• <code>/metas</code> - Ver tus metas y objetivos

🎮 <b>QUÉ SON LAS METAS:</b>
• 📊 Objetivos específicos con recompensas
• 🔄 Trackeo automático de progreso
• 💰 Puntos extra al completarlas
• ⏰ Con fechas límite para motivarte
• 📈 Diferentes tipos: diarias, semanales, mensuales

💡 <b>TAMBIÉN FUNCIONA:</b>
• <code>/goals</code> (en inglés)

🏆 <b>TIPOS DE METAS DISPONIBLES:</b>
📅 <b>Diarias</b> - Objetivos para hoy
📈 <b>Semanales</b> - Metas de 7 días
🗓️ <b>Mensuales</b> - Desafíos de 30 días
🎯 <b>Personalizadas</b> - Objetivos únicos

🎮 <b>EJEMPLO DE LO QUE VERÁS:</b>

🎯 <b>TUS METAS</b> 🎯

🔄 <b>METAS ACTIVAS (2):</b>

📈 <b>Meta Semanal</b>
📈 Progreso: 35/50 (70%)
███████░░░ 70%
💰 Recompensa: +100 pts
⏰ 3 días restantes

📅 <b>Meta Diaria</b>
📈 Progreso: 1/3 (33%)
███░░░░░░░ 33%
💰 Recompensa: +25 pts
⏰ 🚨 1 día restante

¡Pruébenlo escribiendo <code>/metas</code>! 🚀`;

  console.log('📤 Enviando mensaje de prueba...');
  const sent = await sendMessage(testMessage);
  
  if (sent) {
    console.log('✅ ¡Mensaje de prueba enviado correctamente!');
    console.log('');
    console.log('🎯 CÓMO PROBAR:');
    console.log('==============');
    console.log('1. Ve al grupo de Telegram');
    console.log('2. Escribe: /metas');
    console.log('3. El bot te mostrará tus metas personales');
    console.log('');
    console.log('📊 QUE ESPERAR:');
    console.log('• Lista de metas activas con progreso');
    console.log('• Barras de progreso visuales');
    console.log('• Fechas límite y urgencias');
    console.log('• Recompensas por completar');
    console.log('• Historial de metas completadas');
    console.log('• Estadísticas generales');
    
  } else {
    console.log('❌ Error enviando mensaje de prueba');
  }
}

async function sendDetailedExamples() {
  console.log('📋 Enviando ejemplos detallados...');
  
  const examplesMessage = `📋 <b>EJEMPLOS DEL COMANDO /metas</b>

🎯 <b>EJEMPLO 1 - Usuario con metas activas:</b>
<code>/metas</code>

<i>Respuesta esperada:</i>
🎯 <b>TUS METAS</b> 🎯

🔄 <b>METAS ACTIVAS (3):</b>

📈 <b>Meta Semanal</b>
📈 Progreso: 35/50 (70%)
███████░░░ 70%
💰 Recompensa: +100 pts
⏰ 3 días restantes

📅 <b>Meta Diaria</b>
📈 Progreso: 2/3 (67%)
██████░░░░ 67%
💰 Recompensa: +25 pts
⏰ 🚨 1 día restante

🎯 <b>Meta Personalizada</b>
📈 Progreso: 7/10 (70%)
███████░░░ 70%
💰 Recompensa: +75 pts
⏰ 2 días restantes

✅ <b>METAS COMPLETADAS RECIENTES:</b>

🗓️ <b>Meta Mensual</b> ✅
🏆 200/200 - 15/12/2024
💰 +300 pts obtenidos

📊 <b>ESTADÍSTICAS DE METAS:</b>
🏆 Completadas: 5
🔄 Activas: 3
💎 Puntos ganados: 875

🚀 ¡Sigue trabajando en tus metas!

---

🎯 <b>EJEMPLO 2 - Usuario sin metas:</b>
<code>/metas</code>

<i>Respuesta esperada:</i>
🎯 <b>TUS METAS</b> 🎯

❌ No tienes metas establecidas aún.

💡 <b>¿QUÉ SON LAS METAS?</b>
Las metas te ayudan a enfocarte en objetivos específicos y ganar recompensas extra.

🎯 <b>EJEMPLOS DE METAS:</b>
• 📊 Ganar 200 puntos esta semana
• 🔥 Mantener racha de 5 días
• 📝 Responder 20 preguntas este mes
• 🎯 Alcanzar 95% de precisión

🚀 <b>PRÓXIMAMENTE:</b>
¡Podrás crear tus propias metas personalizadas!

¡Mientras tanto, sigue respondiendo preguntas! 💪

---

¡El comando se adapta a tu progreso específico! 🎮`;

  const sent = await sendMessage(examplesMessage);
  
  if (sent) {
    console.log('✅ Ejemplos enviados correctamente');
  } else {
    console.log('❌ Error enviando ejemplos');
  }
}

async function sendFeatureHighlights() {
  console.log('🌟 Enviando destacados de la función...');
  
  const highlightsMessage = `🌟 <b>¿POR QUÉ LAS METAS SON GENIALES?</b> 🌟

🎯 <b>MOTIVACIÓN EXTRA:</b>
• Te enfocas en objetivos claros
• Ves tu progreso en tiempo real
• Ganas puntos bonus al completar
• Te mantiene comprometido diariamente

📊 <b>SISTEMA INTELIGENTE:</b>
• 🔄 Tracking automático del progreso
• ⏰ Alertas de fechas límite
• 📈 Barras de progreso visuales
• 🎖️ Recompensas proporcionales

🏆 <b>TIPOS DE DESAFÍOS:</b>
📅 <b>Diarias</b> - Logros rápidos (ej: 3 preguntas hoy)
📈 <b>Semanales</b> - Objetivos medios (ej: 50 puntos en 7 días)
🗓️ <b>Mensuales</b> - Desafíos grandes (ej: 200 puntos en 30 días)
🎯 <b>Custom</b> - Metas únicas (ej: 10 respuestas en 5 días)

💎 <b>RECOMPENSAS INTELIGENTES:</b>
• 📅 Metas diarias: 25-50 pts bonus
• 📈 Metas semanales: 100-150 pts bonus
• 🗓️ Metas mensuales: 300+ pts bonus
• 🎯 Metas custom: Según dificultad

🚀 <b>PRÓXIMAS FUNCIONES:</b>
• ✨ Crear metas personalizadas
• 🏅 Metas de logros específicos
• 👥 Metas colaborativas en grupo
• 🏆 Metas de precisión y velocidad

🎮 <b>¡Ya tienes metas creadas para probar!</b>
Escribe <code>/metas</code> y comienza tu journey! 🚀`;

  const sent = await sendMessage(highlightsMessage);
  
  if (sent) {
    console.log('✅ Destacados enviados correctamente');
  } else {
    console.log('❌ Error enviando destacados');
  }
}

async function sendCompleteSummary() {
  console.log('🎉 Enviando resumen completo...');
  
  const summaryMessage = `🎉 <b>¡SISTEMA DE METAS COMPLETO!</b> 🎉

🎮 <b>COMANDOS AVANZADOS DISPONIBLES:</b>

1️⃣ <code>/logros</code> 🏆
   • Ver achievements desbloqueados
   • Rareza, puntos y fechas
   
2️⃣ <code>/prediccion</code> 🔮
   • Predicción de próximo nivel
   • Estimaciones de tiempo y preguntas
   
3️⃣ <code>/metas</code> 🎯
   • Sistema de objetivos personales
   • Progreso en tiempo real
   • Recompensas por completar

🎯 <b>COMANDOS EXISTENTES:</b>
• <code>/ranking</code> - Leaderboard general
• <code>/stats</code> - Estadísticas completas
• <code>/racha</code> - Info de racha diaria
• <code>/help</code> - Lista de comandos

💡 <b>PRÓXIMOS COMANDOS EN DESARROLLO:</b>
• <code>/comparar @usuario</code> - Comparar estadísticas
• <code>/duelo @usuario</code> - Retar a duelo
• <code>/tienda</code> - Canjear recompensas

🎮 <b>FUNCIONALIDADES COMPLETADAS:</b>
✅ Sistema de Puntos Inteligente
✅ Rachas Motivacionales  
✅ Rankings Dinámicos
✅ Analytics Avanzados
✅ Gamificación Completa
✅ Sistema de Logros
✅ Predicciones de Nivel
✅ <b>Sistema de Metas Personales</b> 🆕

<b>¡El bot está cada vez más gamificado!</b>

¡Prueben todas las funciones nuevas! 🚀`;

  const sent = await sendMessage(summaryMessage);
  
  if (sent) {
    console.log('✅ Resumen completo enviado correctamente');
  } else {
    console.log('❌ Error enviando resumen');
  }
}

async function main() {
  await testMetasCommand();
  console.log('');
  console.log('⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sendDetailedExamples();
  console.log('');
  console.log('⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sendFeatureHighlights();
  console.log('');
  console.log('⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sendCompleteSummary();
}

main().catch(console.error); 