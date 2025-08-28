import fetch from 'node-fetch';

interface Tournament {
  id: string;
  name: string;
  startTime: string;
  totalquestions: number;
  duration: number;
  participants: number;
}

/**
 * 🏆 SCRIPT: CREAR TORNEO REAL AHORA
 * 
 * Este script crea un torneo real usando la API
 */

async function createRealTournamentNow() {
  try {
    console.log('🏆 ===== CREANDO TORNEO REAL =====\\n');
    
    // Configurar fecha de inicio - en 20 minutos para dar tiempo a registrarse
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + 20);
    
    console.log(`📅 Torneo programado para: ${startTime.toLocaleString('es-ES')}`);
    console.log(`⏰ Tiempo para registro: 20 minutos\\n`);

    const tournamentData = {
      name: '🎯 TORNEO REAL DE PRUEBA',
      description: 'Torneo con sistema corregido - Comandos precisos',
      startTime: startTime.toISOString(),
      duration: 15,
      totalquestions: 20,
      examSource: 'all',
      difficulty: 'mixed'
    };
    
    console.log('📊 Datos del torneo:', JSON.stringify(tournamentData, null, 2));
    
    // Crear el torneo usando la API
    const response = await fetch('http://localhost:3000/api/admin/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournamentData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    
    const result = await response.json() as Tournament;
    
    console.log('✅ ¡Torneo real creado exitosamente!');
    console.log(`🆔 ID del torneo: ${result.id}`);
    console.log(`🏆 Nombre: ${result.name}`);
    console.log(`📅 Inicio: ${new Date(result.startTime).toLocaleString('es-ES')}`);
    console.log(`💰 PrizePool inicial: Dinámico (crece con participantes)`);
    console.log(`❓ Preguntas: ${result.totalquestions}`);
    console.log(`👥 Participantes actuales: ${result.participants}`);
    
    console.log('\\n🎮 CÓMO PARTICIPAR:');
    console.log('1. Los usuarios deben enviar: /torneo');
    console.log('2. Ver el torneo en la lista numerada');
    console.log('3. Unirse con: /torneo_unirse [número]');
    
    console.log('\\n🚨 IMPORTANTE:');
    console.log('- El torneo se anunciará automáticamente en el grupo');
    console.log('- Las preguntas se envían por privado');
    console.log('- Los resultados aparecen al finalizar');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error creando torneo real:', error);
    
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      console.log('\\n💡 POSIBLE SOLUCIÓN:');
      console.log('   El servidor Next.js no está ejecutándose.');
      console.log('   Ejecuta: npm run dev');
      console.log('   Y luego vuelve a ejecutar este script.');
    }
    
    throw error;
  }
}

// Ejecutar el script
if (require.main === module) {
  createRealTournamentNow()
    .then((tournament) => {
      console.log('\\n🎉 Torneo real creado y listo!');
      console.log(`🏆 Los usuarios ya pueden ver el torneo "${tournament.name}" en la lista`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error ejecutando script:', error);
      process.exit(1);
    });
}

export { createRealTournamentNow }; 