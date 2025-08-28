import { PrismaClient } from '@prisma/client';

/**
 * 🗑️ SCRIPT: ELIMINAR TODOS LOS TORNEOS PROGRAMADOS
 * 
 * Este script elimina todos los torneos con estado 'SCHEDULED'
 */

async function deleteAllScheduledTournaments() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗑️ ===== ELIMINANDO TORNEOS PROGRAMADOS =====\n');
    
    // 1. ANÁLISIS INICIAL
    console.log('🔍 Analizando torneos programados...');
    
    const totalTournaments = await prisma.tournament.count();
    console.log(`📊 Total de torneos en sistema: ${totalTournaments}`);
    
    const scheduledTournaments = await prisma.tournament.count({
      where: {
        status: 'SCHEDULED'
      }
    });
    
    console.log(`⏰ Torneos programados (SCHEDULED): ${scheduledTournaments}`);
    
    if (scheduledTournaments === 0) {
      console.log('\n✅ ¡No hay torneos programados que eliminar!');
      return;
    }
    
    // 2. MOSTRAR EJEMPLOS DE TORNEOS QUE SE VAN A ELIMINAR
    console.log('\n📋 Ejemplos de torneos que se eliminarán:');
    const sampleTournaments = await prisma.tournament.findMany({
      where: {
        status: 'SCHEDULED'
      },
      select: {
        name: true,
        scheduleddate: true,  // Corregido: scheduleddate en minúsculas
        status: true
      },
      take: 10,
      orderBy: {
        scheduleddate: 'asc'  // Corregido: scheduleddate en minúsculas
      }
    });
    
    sampleTournaments.forEach(tournament => {
      if (tournament.scheduleddate) {  // Corregido: scheduleddate en minúsculas
        console.log(`   - ${tournament.name}: ${new Date(tournament.scheduleddate).toLocaleDateString('es-ES')} (${tournament.status})`);
      }
    });
    
    if (scheduledTournaments > 10) {
      console.log(`   ... y ${scheduledTournaments - 10} torneos más`);
    }
    
    // 3. ELIMINAR TORNEOS PROGRAMADOS
    console.log('\n🗑️ Eliminando torneos programados...');
    
    const deleteResult = await prisma.tournament.deleteMany({
      where: {
        status: 'SCHEDULED'
      }
    });
    
    console.log(`✅ Eliminados: ${deleteResult.count} torneos programados`);
    
    // 4. VERIFICACIÓN FINAL
    console.log('\n📊 Verificación final...');
    const finalCount = await prisma.tournament.count();
    const remainingScheduled = await prisma.tournament.count({
      where: { status: 'SCHEDULED' }
    });
    
    console.log(`📈 Torneos restantes: ${finalCount}`);
    console.log(`⏰ Torneos programados restantes: ${remainingScheduled}`);
    
    console.log('\n🎊 ¡ELIMINACIÓN COMPLETADA EXITOSAMENTE!');
    
  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
deleteAllScheduledTournaments().catch(console.error);