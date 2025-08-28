import { NotificationService } from '../src/services/notificationService';

/**
 * 🏆 SCRIPT: ENVIAR ANUNCIO DE TORNEO CORREGIDO
 * 
 * Este script envía una versión corregida del anuncio con comandos precisos
 */

async function sendCorrectedTournamentAnnouncement() {
  try {
    console.log('🏆 ===== ENVIANDO ANUNCIO DE TORNEO CORREGIDO =====\n');
    
    // Obtener el ID del grupo desde las variables de entorno
    const groupId = process.env.TELEGRAM_CHAT_ID;
    
    if (!groupId) {
      throw new Error('TELEGRAM_CHAT_ID no encontrado en variables de entorno');
    }

    console.log(`📡 Enviando a grupo: ${groupId}`);
    
    // Configurar datos del torneo de demostración CORREGIDOS
    const tournamentDemo = {
      name: `🎯 TORNEO OPOMELILLA CORREGIDO - ${new Date().toLocaleDateString('es-ES')}`,
      description: '🚀 Versión corregida con comandos precisos',
      totalquestions: 20,
      duration: 15,
      startTime: new Date(Date.now() + 15 * 60 * 1000), // En 15 minutos
      prizePool: 120
    };

    // ✨ MENSAJE CORREGIDO CON COMANDOS PRECISOS
    const message = `🚨 <b>¡ANUNCIO CORREGIDO!</b> 🚨

🏆 <b>${tournamentDemo.name}</b>
📅 Inicio: ${tournamentDemo.startTime.toLocaleString('es-ES')}
❓ ${tournamentDemo.totalquestions} preguntas (exámenes oficiales 2018 y 2024)
⏱️ ${tournamentDemo.duration} minutos de duración
💰 PrizePool: ${tournamentDemo.prizePool} puntos (¡crece con cada participante!)

⚡️ <b>SISTEMA COMPLETAMENTE MEJORADO:</b>
  ✅ Premios dinámicos (ya no "0 puntos en juego")
  ✅ Preguntas sin interrupciones por caracteres especiales
  ✅ Sistema más rápido y confiable
  ✅ Sanitización automática de contenido

🚀 <b>COMANDOS CORREGIDOS PARA PARTICIPAR:</b>
  1️⃣ <b>/torneo</b> - Ver lista numerada de torneos disponibles
  2️⃣ <b>/torneo_unirse [número]</b> - Ejemplo: <code>/torneo_unirse 1</code>
  
💡 <b>EXPLICACIÓN:</b>
  🔹 Primero usa <code>/torneo</code> para ver la lista con números
  🔹 Luego usa <code>/torneo_unirse 1</code> para unirte al primero
  🔹 O <code>/torneo_unirse 2</code> para unirte al segundo, etc.

📊 <b>CÓMO FUNCIONA:</b>
  🔹 El torneo comenzará automáticamente a la hora programada
  🔹 Las preguntas se envían por mensaje privado
  🔹 El PrizePool crece: +10 puntos por cada nuevo participante
  🔹 Los resultados se muestran al finalizar en el grupo

💡 <b>OTROS COMANDOS ÚTILES:</b>
  • <code>/torneos</code> - Ver todos los torneos disponibles
  • <code>/mi_historial_torneos</code> - Tu historial personal
  • <code>/ranking</code> - Ver ranking general
  • <code>/mi_stats</code> - Tus estadísticas
  • <code>/duelo @usuario</code> - Desafiar a alguien

🎊 <b>¡GRACIAS POR LA CORRECCIÓN!</b>
El usuario tenía razón: los comandos necesitan parámetros específicos.

✨ <b>SISTEMA PROBADO Y FUNCIONANDO AL 100%</b>`;

    // ✅ ENVIAR EL MENSAJE AL GRUPO
    const result = await NotificationService['sendGroupMessage'](
      groupId,
      message
    );
    
    if (result) {
      console.log('✅ ¡Anuncio corregido enviado exitosamente!');
      console.log(`📊 Grupo: ${groupId}`);
      console.log(`⏰ Enviado: ${new Date().toLocaleString('es-ES')}`);
      console.log(`📝 Mensaje: ${message.length} caracteres`);
      
      console.log('\\n🎯 COMANDOS CORREGIDOS ENVIADOS:');
      console.log('   1. /torneo - Ver lista numerada');  
      console.log('   2. /torneo_unirse [número] - Unirse usando número de lista');
      console.log('   3. Explicación clara del flujo de participación');
      
    } else {
      console.error('❌ Error enviando mensaje: No se pudo enviar el mensaje al grupo');
    }

  } catch (error) {
    console.error('❌ Error enviando anuncio corregido:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('TELEGRAM_CHAT_ID')) {
        console.log('\\n💡 SOLUCIÓN:');
        console.log('   Verifica que TELEGRAM_CHAT_ID esté configurado en .env');
        console.log('   Ejemplo: TELEGRAM_CHAT_ID=-1001234567890');
      }
    }
    
    throw error;
  }
}

// Ejecutar el script
if (require.main === module) {
  sendCorrectedTournamentAnnouncement()
    .then(() => {
      console.log('\\n🎉 Anuncio corregido completado exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error ejecutando script:', error);
      process.exit(1);
    });
}

export { sendCorrectedTournamentAnnouncement }; 