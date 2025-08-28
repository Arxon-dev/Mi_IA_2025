import fetch from 'node-fetch';

async function createTestTournament() {
  try {
    console.log('🏆 CREANDO TORNEO DE PRUEBA');
    console.log('==========================');
    
    // Crear un torneo que inicie en 2 minutos
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + 2);
    
    const tournamentData = {
      name: `Test Tournament ${new Date().getTime()}`,
      description: '🧪 Torneo de prueba para verificar el sistema',
      startTime: startTime.toISOString(),
      totalquestions: 2, // Solo 2 preguntas para prueba rápida
      duration: 10, // 10 minutos de duración
      examSource: '2024', // Solo del 2024 para simplicidad
      difficulty: 'mixed',
      questionCategory: 'mixed'
    };
    
    console.log(`📅 Torneo programado para: ${startTime.toLocaleString()}`);
    console.log(`📝 ${tournamentData.totalquestions} preguntas del examen ${tournamentData.examSource}`);
    
    const response = await fetch('http://localhost:3000/api/admin/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournamentData)
    });
    
    const result = await response.json() as any;
    
    if (response.ok) {
      console.log('✅ TORNEO CREADO EXITOSAMENTE!');
      console.log(`   🆔 ID: ${result.tournament.id}`);
      console.log(`   📝 Nombre: ${result.tournament.name}`);
      console.log(`   📅 Inicio: ${new Date(result.tournament.startTime).toLocaleString()}`);
      console.log(`   🎯 Preguntas: ${result.tournament.totalquestions}`);
      
      console.log('\n📋 PRÓXIMOS PASOS PARA PROBAR:');
      console.log('1. ✅ Torneo creado');
      console.log('2. 🎫 Únete al torneo: /torneo_unirse [número del torneo]');
      console.log('3. ⏰ Espera 2 minutos para que inicie automáticamente');
      console.log('4. 📝 Responde la primera pregunta');
      console.log('5. 🔄 Verifica que llegue la segunda pregunta automáticamente');
      console.log('6. 📝 Responde la segunda pregunta');
      console.log('7. 🏁 Verifica el mensaje de finalización');
      
      console.log('\n🔍 COMANDOS ÚTILES:');
      console.log('• /torneo - Ver torneos disponibles');
      console.log('• tail -f npm-debug.log - Ver logs en tiempo real');
      
      return result.tournament;
    } else {
      console.error('❌ Error creando torneo:', result);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

async function main() {
  const tournament = await createTestTournament();
  
  if (tournament) {
    console.log('\n🎯 PREPARADO PARA PRUEBA COMPLETA');
    console.log('================================');
    console.log('El sistema ahora debería funcionar correctamente:');
    console.log('• ✅ Poll answers llegan al webhook');
    console.log('• ✅ Sistema anti-repetición mejorado');
    console.log('• ✅ Flujo: pregunta → respuesta → siguiente pregunta');
  }
}

main(); 