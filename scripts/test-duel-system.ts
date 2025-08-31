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

async function testDuelSystem() {
  console.log('🗡️ PRUEBA DEL SISTEMA DE DUELOS');
  console.log('================================');
  console.log('');
  
  const testMessage = `🗡️ <b>¡SISTEMA DE DUELOS ACTIVADO!</b> ⚔️

¡El sistema de <b>Duelos 1v1</b> ya está disponible!

🎮 <b>NUEVOS COMANDOS DISPONIBLES:</b>
• <code>/duelo @usuario</code> - Retar a duelo
• <code>/duelos</code> - Ver tus duelos
• <code>/aceptar</code> - Aceptar duelos pendientes
• <code>/rechazar</code> - Rechazar duelos pendientes

⚔️ <b>¿CÓMO FUNCIONA UN DUELO?</b>
1. Retas a un usuario: <code>/duelo @juan_estudiante</code>
2. El usuario puede aceptar o rechazar
3. Si acepta, ¡comienza el duelo en tiempo real!
4. Ambos reciben las mismas preguntas
5. ¡El que más aciertos tenga GANA!

🏆 <b>TIPOS DE DUELO DISPONIBLES:</b>
🗡️ <b>Estándar</b> - 5 preguntas, 5 minutos
⚡ <b>Velocidad</b> - 3 preguntas, 2 minutos
🎯 <b>Precisión</b> - 7 preguntas, 10 minutos

🎮 <b>MECÁNICAS ESPECIALES:</b>
• 💰 Puedes apostar puntos en el duelo
• ⏰ Los duelos expiran si no se aceptan
• 📊 Se trackean todas tus estadísticas
• 🏅 Rachas de victorias
• 📈 Rankings de duelos

🎯 <b>EJEMPLOS DE USO:</b>

<b>Retar a alguien:</b>
<code>/duelo @Carlos</code>
<code>/duelo Luis</code>
<code>/duelo @juan_estudiante</code>

<b>Ver tus duelos:</b>
<code>/duelos</code>

<b>Si te retan:</b>
<code>/aceptar</code> (ver duelos pendientes)
<code>/aceptar abc123</code> (aceptar duelo específico)

⚔️ <b>¡COMIENZA LA BATALLA!</b>
¡Reta a tus amigos y demuestra quién es el verdadero maestro de los conocimientos!`;

  console.log('📤 Enviando mensaje de prueba del sistema de duelos...');
  const sent = await sendMessage(testMessage);
  
  if (sent) {
    console.log('✅ ¡Mensaje del sistema de duelos enviado correctamente!');
    console.log('');
    console.log('🗡️ CÓMO PROBAR EL SISTEMA:');
    console.log('========================');
    console.log('1. Ve al grupo de Telegram');
    console.log('2. Prueba estos comandos:');
    console.log('   - /duelo @usuario - Para retar');
    console.log('   - /duelos - Para ver tus duelos');
    console.log('   - /aceptar - Para aceptar duelos');
    console.log('   - /rechazar - Para rechazar duelos');
    console.log('');
    console.log('🎮 QUE ESPERAR:');
    console.log('• Sistema completo de retos');
    console.log('• Notificaciones automáticas');
    console.log('• Estados de duelos (pendiente/activo/completado)');
    console.log('• Tracking de victorias y derrotas');
    console.log('• Expiración automática de duelos');
    
  } else {
    console.log('❌ Error enviando mensaje de prueba');
  }
}

async function sendDetailedExamples() {
  console.log('📋 Enviando ejemplos detallados del sistema...');
  
  const examplesMessage = `📋 <b>EJEMPLOS DEL SISTEMA DE DUELOS</b>

🗡️ <b>EJEMPLO 1 - Retar a un usuario:</b>
<code>/duelo @Carlos</code>

<i>Respuesta esperada:</i>
🗡️ <b>¡DUELO ENVIADO!</b> 🗡️

🎯 Has retado a <b>Carlos</b> a un duelo

📋 <b>DETALLES:</b>
🗡️ Tipo: Estándar
📝 Preguntas: 5
⏱️ Tiempo: 5 min
💰 En juego: 0 pts
⏰ Expira: 14:30:00

📬 <b>NOTIFICACIÓN ENVIADA</b>
Carlos recibirá una notificación para aceptar o rechazar tu desafío.

⏳ <b>Ahora hay que esperar...</b>
El duelo expira en 30 minutos si no es aceptado.

---

🗡️ <b>EJEMPLO 2 - Ver duelos activos:</b>
<code>/duelos</code>

<i>Respuesta esperada:</i>
🗡️ <b>TUS DUELOS</b> 🗡️

⏳ <b>PENDIENTES (1):</b>

🎯 Retaste a <b>Carlos</b>
⏰ Expira en 25 min

🔥 <b>ACTIVOS (1):</b>

⚔️ VS <b>Luis</b>
📊 2-1
📝 3/5

🏆 <b>RECIENTES (2):</b>

🏆 VS <b>María</b> - VICTORIA
📊 4-2
📅 15/12/2024

😔 VS <b>Juan</b> - Derrota
📊 2-3
📅 14/12/2024

---

🗡️ <b>EJEMPLO 3 - Cuando te retan:</b>
<i>Notificación automática:</i>

🗡️ <b>¡TE HAN RETADO A DUELO!</b> 🗡️

👤 <b>Carlos</b> te ha desafiado a un duelo

🎮 <b>DETALLES DEL DUELO:</b>
🗡️ Tipo: Estándar
📝 Preguntas: 5
⏱️ Tiempo límite: 5 minutos
💰 En juego: 0 puntos
⏰ Expira: 14:30:00

🎯 <b>¿ACEPTAS EL DESAFÍO?</b>
✅ <code>/aceptar abc123def</code>
❌ <code>/rechazar abc123def</code>

⚔️ ¡La hora de la verdad ha llegado!

¡El sistema está completamente funcional! 🎮`;

  const sent = await sendMessage(examplesMessage);
  
  if (sent) {
    console.log('✅ Ejemplos detallados enviados correctamente');
  } else {
    console.log('❌ Error enviando ejemplos');
  }
}

async function sendAdvancedFeatures() {
  console.log('🌟 Enviando características avanzadas...');
  
  const featuresMessage = `🌟 <b>CARACTERÍSTICAS AVANZADAS DE DUELOS</b>

⚔️ <b>SISTEMA INTELIGENTE:</b>
• 🎯 Búsqueda flexible de usuarios (@username o nombre)
• ⏰ Auto-expiración de duelos (30 min)
• 📬 Notificaciones automáticas cruzadas
• 🔄 Estados dinámicos (pendiente → activo → completado)
• 🚫 Prevención de duelos duplicados

🏆 <b>ESTADÍSTICAS COMPLETAS:</b>
• 📊 Historial completo de duelos
• 🏅 Racha de victorias
• 📈 Porcentaje de victorias
• ⚡ Tiempos de respuesta promedio
• 🎯 Precisión en duelos vs general

🎮 <b>TIPOS DE DUELO (FUTURO):</b>
🗡️ <b>Estándar</b> - El clásico 5v5
⚡ <b>Velocidad</b> - 3 preguntas, 2 min máximo
🎯 <b>Precisión</b> - 7 preguntas, sin límite de tiempo
💰 <b>Apuestas</b> - Con puntos en juego
🏆 <b>Torneo</b> - Eliminatorias múltiples

🔮 <b>FUNCIONES PRÓXIMAS:</b>
• 👥 Duelos en equipo (2v2, 3v3)
• 🏆 Torneos automáticos
• 📊 Rankings de duelos separados
• 🎨 Temas especializados por materia
• 💎 Recompensas especiales por victorias

🎯 <b>COMANDOS AVANZADOS (DESARROLLO):</b>
• <code>/duelo_rapido @usuario</code> - Duelo velocidad
• <code>/duelo_precision @usuario</code> - Duelo precisión
• <code>/apostar @usuario 50</code> - Duelo con apuesta
• <code>/torneo</code> - Unirse a torneo
• <code>/estadisticas_duelos</code> - Stats completas

⚔️ <b>¿POR QUÉ SON GENIALES LOS DUELOS?</b>
1. 🎯 <b>Competencia directa</b> - 1v1 real
2. ⚡ <b>Tiempo real</b> - Ambos al mismo tiempo
3. 🏆 <b>Motivación extra</b> - Ganar/perder contra amigos
4. 📊 <b>Métricas precisas</b> - Comparación directa
5. 🎮 <b>Diversión social</b> - Interacción entre usuarios

<b>¡El sistema de duelos lleva la gamificación al siguiente nivel!</b>

🚀 <b>Empiecen a retarse y que gane el mejor!</b> 🚀`;

  const sent = await sendMessage(featuresMessage);
  
  if (sent) {
    console.log('✅ Características avanzadas enviadas correctamente');
  } else {
    console.log('❌ Error enviando características');
  }
}

async function sendCompleteSummary() {
  console.log('🎉 Enviando resumen completo del sistema...');
  
  const summaryMessage = `🎉 <b>¡SISTEMA DE DUELOS COMPLETADO!</b> 🎉

🎮 <b>COMANDOS AVANZADOS AHORA DISPONIBLES:</b>

1️⃣ <code>/logros</code> 🏆 - Ver achievements
2️⃣ <code>/prediccion</code> 🔮 - Predicción de nivel
3️⃣ <code>/metas</code> 🎯 - Objetivos personales
4️⃣ <code>/duelo @usuario</code> ⚔️ - Retar a duelo
5️⃣ <code>/duelos</code> 🗡️ - Ver tus duelos
6️⃣ <code>/aceptar</code> ✅ - Aceptar duelos
7️⃣ <code>/rechazar</code> ❌ - Rechazar duelos

🎯 <b>COMANDOS BÁSICOS:</b>
• <code>/ranking</code> - Leaderboard general
• <code>/stats</code> - Estadísticas completas
• <code>/racha</code> - Info de racha diaria
• <code>/help</code> - Lista completa de comandos

🚀 <b>PRÓXIMOS COMANDOS EN DESARROLLO:</b>
• <code>/tienda</code> - Canjear recompensas
• <code>/comparar @usuario</code> - Comparar stats
• <code>/torneo</code> - Torneos automáticos
• <code>/apostar @usuario</code> - Duelos con apuesta

🎮 <b>FUNCIONALIDADES 100% COMPLETADAS:</b>
✅ Sistema de Puntos Inteligente
✅ Rachas Motivacionales
✅ Rankings Dinámicos
✅ Analytics Avanzados
✅ Gamificación Completa
✅ Sistema de Logros
✅ Predicciones de Nivel
✅ Sistema de Metas Personales
✅ <b>Sistema de Duelos 1v1</b> 🆕

⚔️ <b>CARACTERÍSTICAS DE DUELOS:</b>
🎯 Retos instantáneos entre usuarios
⏰ Sistema de expiración automática
📬 Notificaciones cruzadas
📊 Tracking completo de estadísticas
🏆 Rankings y rachas de duelos
🔄 Estados dinámicos de duelos

<b>¡El bot de gamificación más completo está listo!</b>

¡Prueben todas las funciones y que comience la competencia! 🏆`;

  const sent = await sendMessage(summaryMessage);
  
  if (sent) {
    console.log('✅ Resumen completo enviado correctamente');
  } else {
    console.log('❌ Error enviando resumen');
  }
}

async function main() {
  await testDuelSystem();
  console.log('');
  console.log('⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sendDetailedExamples();
  console.log('');
  console.log('⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sendAdvancedFeatures();
  console.log('');
  console.log('⏳ Esperando 3 segundos...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await sendCompleteSummary();
}

main().catch(console.error); 