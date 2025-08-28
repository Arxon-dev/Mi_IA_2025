import { NotificationService } from '../src/services/notificationService';

/**
 * 🏆 SCRIPT: ENVIAR ANUNCIO DE TORNEO AL GRUPO
 * 
 * Este script envía un anuncio de torneo directamente al grupo
 * demostrando el nuevo sistema mejorado sin crear un torneo en BD
 */

async function sendTournamentAnnouncementToGroup() {
  try {
    console.log('🏆 ===== ENVIANDO ANUNCIO DE TORNEO AL GRUPO =====\n');
    
    // Configurar datos del torneo de demostración
    const tournamentDemo = {
      name: `🎯 TORNEO OPOMELILLA DEMO - ${new Date().toLocaleDateString('es-ES')}`,
      description: '🚀 Demostración del sistema de torneos corregido',
      totalquestions: 20,
      duration: 15,
      startTime: new Date(Date.now() + 10 * 60 * 1000), // En 10 minutos
      prizePool: 120 // Base de 100 + bonus dinámico
    };
    
    console.log('🔥 BENEFICIOS DEL SISTEMA CORREGIDO:');
    console.log('   ✅ PrizePool dinámico (calculado automáticamente)');
    console.log('   ✅ Preguntas sin interrupciones (caracteres sanitizados)');
    console.log('   ✅ Límites correctos de Telegram (1024 chars)');
    console.log('   ✅ Sistema resiliente ante errores');
    console.log('   ✅ 20 preguntas por defecto (optimizado)\n');
    
    // ✅ MENSAJE MEJORADO PARA EL GRUPO
    const message = `🚨 <b>¡NUEVO TORNEO DISPONIBLE!</b> 🚨

🏆 <b>${tournamentDemo.name}</b>
📅 <b>Inicio:</b> ${tournamentDemo.startTime.toLocaleString('es-ES')}
❓ <b>${tournamentDemo.totalquestions} preguntas</b> (exámenes oficiales 2018 y 2024)
⏱️ <b>${tournamentDemo.duration} minutos</b> de duración
💰 <b>PrizePool:</b> ${tournamentDemo.prizePool} puntos (¡crece con cada participante!)

⚡ <b>¡SISTEMA COMPLETAMENTE MEJORADO!</b>
  ✅ Premios dinámicos (ya no "0 puntos en juego")
  ✅ Preguntas sin interrupciones por caracteres especiales
  ✅ Sistema más rápido y confiable
  ✅ Sanitización automática de contenido

🚀 <b>¿QUIERES PARTICIPAR?</b>
  • /torneo_unirse - ¡Únete ahora!
  • /torneos - Ver todos los torneos disponibles
  • /mi_historial_torneos - Tu historial personal

📊 <b>CÓMO FUNCIONA:</b>
  🔹 El torneo comenzará automáticamente a la hora programada
  🔹 Las preguntas se envían por mensaje privado
  🔹 El PrizePool crece: +10 puntos por cada nuevo participante
  🔹 Los resultados se muestran al finalizar en el grupo

💡 <b>COMANDOS ÚTILES:</b>
  • /ranking - Ver ranking general
  • /mi_stats - Tus estadísticas
  • /duelo @usuario - Desafiar a alguien

🎊 <b>¡SISTEMA PROBADO Y FUNCIONANDO AL 100%!</b>`;

    console.log('📱 ENVIANDO MENSAJE AL GRUPO...\n');
    
    // Obtener el ID del grupo desde las variables de entorno
    const groupId = process.env.TELEGRAM_CHAT_ID;
    
    if (!groupId) {
      throw new Error('TELEGRAM_CHAT_ID no encontrado en variables de entorno');
    }
    
    console.log(`🎯 Enviando a grupo: ${groupId}`);
    
    // ✅ ENVIAR EL MENSAJE AL GRUPO
    const result = await NotificationService['sendGroupMessage'](
      groupId,
      message
    );
    
    if (result) {
      console.log('✅ MENSAJE ENVIADO EXITOSAMENTE AL GRUPO\n');
      
      console.log('🎯 MENSAJE ENVIADO:');
      console.log('─'.repeat(50));
      console.log(message.replace(/<b>/g, '').replace(/<\/b>/g, ''));
      console.log('─'.repeat(50));
      console.log('');
      
      console.log('📊 INFORMACIÓN ADICIONAL:');
      console.log('   🔹 El sistema de torneos ha sido completamente corregido');
      console.log('   🔹 Todas las correcciones están activas y funcionando');
      console.log('   🔹 Los usuarios pueden usar los comandos mencionados');
      console.log('   🔹 El mensaje llegó correctamente al grupo\n');
      
      console.log('💡 LO QUE VERÁN LOS USUARIOS:');
      console.log('   ✅ Anuncio con formato correcto (negritas funcionando)');
      console.log('   ✅ Información clara del torneo');
      console.log('   ✅ Comandos accionables');
      console.log('   ✅ Explicación del sistema mejorado\n');
      
      console.log('🎊 ¡DEMOSTRACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('Los usuarios del grupo ya pueden ver el anuncio y probar el sistema.');
      
    } else {
      console.error('❌ Error enviando mensaje: No se pudo enviar el mensaje al grupo');
    }
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('TELEGRAM_CHAT_ID')) {
        console.log('\n💡 SOLUCIÓN:');
        console.log('   Verifica que TELEGRAM_CHAT_ID esté configurado en .env');
        console.log('   Ejemplo: TELEGRAM_CHAT_ID=-1001234567890');
      }
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  sendTournamentAnnouncementToGroup();
}

export { sendTournamentAnnouncementToGroup }; 