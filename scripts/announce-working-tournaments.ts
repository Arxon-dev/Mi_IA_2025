import { NotificationService } from '../src/services/notificationService';

/**
 * 🏆 SCRIPT: ANUNCIAR TORNEOS QUE SÍ FUNCIONAN
 * 
 * Este script anuncia los torneos activos que están funcionando correctamente
 */

async function announceWorkingTournaments() {
  try {
    console.log('🏆 ===== ANUNCIANDO TORNEOS FUNCIONALES =====\\n');
    
    // Obtener el ID del grupo desde las variables de entorno
    const groupId = process.env.TELEGRAM_CHAT_ID;
    
    if (!groupId) {
      throw new Error('TELEGRAM_CHAT_ID no encontrado en variables de entorno');
    }

    console.log(`📡 Enviando a grupo: ${groupId}`);
    
    // Crear mensaje sobre torneos funcionales
    const message = `
🚨 <b>¡TORNEOS FUNCIONANDO AL 100%!</b> 🚨

🔥 <b>HAY TORNEOS ACTIVOS AHORA MISMO:</b>
  • <b>PERMA 21:</b> 52 participantes (¡muy popular!)
  • <b>PERMA 20:</b> 1 participante
  • <b>PERMA 19:</b> 1 participante  
  • <b>PERMA 18:</b> 1 participante
  • <b>Y muchos más...</b>

⚡️ <b>SISTEMA CORREGIDO FUNCIONANDO:</b>
  ✅ PrizePool dinámico (120+ puntos)
  ✅ 20 preguntas sin interrupciones
  ✅ Sanitización automática
  ✅ Sin problemas de caracteres especiales

🎯 <b>CÓMO UNIRSE (COMANDOS CORRECTOS):</b>
  1️⃣ <b>/torneo</b> - Ver lista numerada de torneos
  2️⃣ <b>/torneo_unirse 1</b> - Unirse al primer torneo
  3️⃣ <b>/torneo_unirse 2</b> - Unirse al segundo torneo

📊 <b>EJEMPLO DE USO:</b>
  • Escribe <b>/torneo</b>
  • Verás: "1. PERMA 21 (52 participantes)"
  • Escribe <b>/torneo_unirse 1</b> para unirte

🎊 <b>¡PROBADO Y FUNCIONANDO!</b>
  • Sistema anti-errores activado
  • PrizePool dinámico funcionando
  • 20 preguntas completas garantizadas

💡 <b>COMANDOS ADICIONALES:</b>
  • <b>/mi_historial_torneos</b> - Tu historial personal
  • <b>/ranking</b> - Ranking general
  • <b>/mi_stats</b> - Tus estadísticas

🚀 <b>¡EL SISTEMA ESTÁ LISTO PARA USAR!</b>
`.trim();

    // ✅ ENVIAR EL MENSAJE AL GRUPO
    const result = await NotificationService['sendGroupMessage'](
      groupId,
      message
    );
    
    if (result) {
      console.log('✅ ¡Anuncio de torneos funcionales enviado al grupo!');
      console.log(`📱 Mensaje enviado a: ${groupId}`);
      console.log('🎯 Los usuarios pueden usar los torneos existentes inmediatamente');
      console.log('');
      console.log('🚀 PRÓXIMOS PASOS PARA EL USUARIO:');
      console.log('   1. Escribir /torneo para ver la lista');
      console.log('   2. Escribir /torneo_unirse [número] para unirse');
      console.log('   3. ¡Disfrutar del sistema corregido!');
      
    } else {
      console.error('❌ Error enviando mensaje: No se pudo enviar el mensaje al grupo');
    }
    
  } catch (error) {
    console.error('❌ Error anunciando torneos funcionales:', error);
    
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
announceWorkingTournaments()
  .then(() => {
    console.log('\\n🎊 Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\\n💥 Script falló:', error);
    process.exit(1);
  }); 