/**
 * 🏆 SCRIPT: CREAR TORNEO REAL PARA EL GRUPO
 * 
 * Este script crea un torneo real usando la API que automáticamente:
 * - Se anuncia en el grupo de Telegram
 * - Usa el nuevo sistema de prizePool dinámico
 * - Tiene 20 preguntas por defecto
 * - Permite registro inmediato de participantes
 */

async function createRealTournamentForGroup() {
  try {
    console.log('🏆 ===== CREANDO TORNEO REAL PARA EL GRUPO =====\n');
    
    // Configurar fecha de inicio - en 10 minutos para dar tiempo a registrarse
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + 10);
    
    console.log(`📅 Torneo programado para: ${startTime.toLocaleString('es-ES')}`);
    console.log(`⏰ Tiempo para registro: 10 minutos\n`);
    
    // ✅ CONFIGURACIÓN DEL TORNEO REAL
    const tournamentData = {
      name: `🎯 TORNEO OPOMELILLA - ${new Date().toLocaleDateString('es-ES')}`,
      description: '🚀 Torneo de prueba del sistema corregido - ¡Premios dinámicos y sin interrupciones!',
      totalQuestions: 20, // ✅ Cambiar de 'totalquestions' a 'totalQuestions'
      duration: 15, // 15 minutos de duración
      startTime: startTime.toISOString(),
      questionCategory: 'mixed',
      difficulty: 'mixed',
      examSource: 'both' // Mezcla de exámenes 2018 y 2024
    };
    
    console.log('📝 CONFIGURACIÓN DEL TORNEO:');
    console.log(`   📛 Nombre: ${tournamentData.name}`);
    console.log(`   📄 Descripción: ${tournamentData.description}`);
    console.log(`   ❓ Preguntas: ${tournamentData.totalquestions} (nuevo default)`);
    console.log(`   ⏱️ Duración: ${tournamentData.duration} minutos`);
    console.log(`   📚 Fuente: Mezcla de exámenes 2018 y 2024`);
    console.log(`   🎲 Dificultad: Mixta\n`);
    
    console.log('🔥 BENEFICIOS DEL NUEVO SISTEMA:');
    console.log('   ✅ PrizePool dinámico (ya no "0 puntos en juego")');
    console.log('   ✅ Preguntas sin interrupciones (caracteres sanitizados)');
    console.log('   ✅ Límites correctos de Telegram (1024 chars)');
    console.log('   ✅ Sistema resiliente ante errores\n');
    
    // ✅ CREAR TORNEO USANDO LA API
    console.log('🚀 CREANDO TORNEO Y ENVIANDO AL GRUPO...\n');
    
    const response = await fetch('http://localhost:3000/api/admin/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournamentData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json() as any;
    
    console.log('✅ TORNEO CREADO EXITOSAMENTE:');
    console.log(`   🆔 ID: ${result.id}`);
    console.log(`   📛 Nombre: ${result.name}`);
    console.log(`   ❓ Preguntas: ${result.totalquestions}`);
    console.log(`   👥 Participantes: ${result.participants}`);
    console.log(`   📊 Estado: ${result.status}`);
    console.log(`   📅 Inicio: ${new Date(result.startTime).toLocaleString('es-ES')}\n`);
    
    console.log('📱 NOTIFICACIÓN ENVIADA AL GRUPO:');
    console.log('   ✅ Anuncio automático enviado a Telegram');
    console.log('   ✅ Los usuarios pueden unirse con /torneo_unirse');
    console.log('   ✅ PrizePool se actualizará dinámicamente\n');
    
    console.log('🎯 MENSAJE QUE APARECERÁ EN EL GRUPO:');
    console.log('─'.repeat(50));
    console.log('🚨 ¡NUEVO TORNEO DISPONIBLE! 🚨');
    console.log('');
    console.log(`🏆 ${result.name}`);
    console.log(`📅 Inicio: ${new Date(result.startTime).toLocaleString('es-ES')}`);
    console.log(`❓ ${result.totalquestions} preguntas`);
    console.log(`⏱️ ${tournamentData.duration} minutos de duración`);
    console.log(`💰 PrizePool: Se calculará automáticamente según participantes`);
    console.log('');
    console.log('🚀 ¿QUIERES PARTICIPAR?');
    console.log(`  • /torneo_unirse - ¡Únete ahora!`);
    console.log('  • /torneos - Ver todos los torneos');
    console.log('');
    console.log('⚡ ¡NUEVO SISTEMA MEJORADO!');
    console.log('  • Premios dinámicos (ya no "0 puntos")');
    console.log('  • Preguntas sin interrupciones');
    console.log('  • Sistema más rápido y confiable');
    console.log('─'.repeat(50));
    console.log('');
    
    console.log('📊 INFORMACIÓN PARA LOS PARTICIPANTES:');
    console.log('   🔹 El torneo comenzará automáticamente a la hora programada');
    console.log('   🔹 Las preguntas se enviarán por mensaje privado');
    console.log('   🔹 El PrizePool crecerá con cada nuevo participante');
    console.log('   🔹 Los resultados se mostrarán al finalizar\n');
    
    console.log('💡 COMANDOS ÚTILES PARA LOS USUARIOS:');
    console.log('   • /torneo_unirse - Unirse al torneo');
    console.log('   • /torneos - Ver torneos disponibles');
    console.log('   • /torneo_historial - Ver historial personal');
    console.log('   • /ranking - Ver ranking general\n');
    
    console.log('🎊 ¡TORNEO REAL CREADO Y ANUNCIADO EN EL GRUPO!');
    console.log('🚀 Los usuarios ya pueden registrarse y probar el sistema corregido.');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error creando torneo real:', error);
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 POSIBLE SOLUCIÓN:');
      console.log('   El servidor Next.js no está ejecutándose.');
      console.log('   Ejecuta: npm run dev');
      console.log('   Y luego vuelve a ejecutar este script.');
    }
    
    throw error;
  }
}

// 🎯 EJECUTAR EL SCRIPT
// Using a more descriptive name to avoid duplication with createRealTournamentForGroup
async function executeCreateTournamentScript() {
  try {
    await createRealTournamentForGroup();
  } catch (error) {
    console.error('❌ Error en el script principal:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  executeCreateTournamentScript();
}