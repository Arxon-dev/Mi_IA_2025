import { PrismaClient } from '@prisma/client';

/**
 * 🧹 SCRIPT: LIMPIAR TORNEOS FUTUROS
 * 
 * Este script elimina torneos programados después del 31 de julio 2025
 * para solucionar el problema de exceso de conexiones de base de datos
 */

async function cleanupFutureTournaments() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 ===== LIMPIANDO TORNEOS FUTUROS =====\n');
    
    // Fecha límite: 31 de julio 2025 a las 23:59:59
    const cutoffDate = new Date('2025-07-31T23:59:59.999Z');
    
    console.log(`📅 Eliminando torneos programados después de: ${cutoffDate.toLocaleDateString('es-ES')}`);
    console.log(`⏰ Fecha límite: ${cutoffDate.toISOString()}\n`);
    
    // 1. ANÁLISIS INICIAL
    console.log('🔍 Analizando torneos...');
    
    const totalTournaments = await prisma.tournament.count();
    console.log(`📊 Total de torneos en sistema: ${totalTournaments}`);
    
    const tournamentsToDelete = await prisma.tournament.count({
      where: {
        startTime: {
          gt: cutoffDate
        }
      }
    });
    
    const tournamentsToKeep = totalTournaments - tournamentsToDelete;
    
    console.log(`✅ Torneos a mantener (hasta julio): ${tournamentsToKeep}`);
    console.log(`❌ Torneos a eliminar (agosto-octubre): ${tournamentsToDelete}`);
    
    if (tournamentsToDelete === 0) {
      console.log('\n✅ ¡No hay torneos futuros que eliminar!');
      return;
    }
    
    // 2. MOSTRAR EJEMPLOS DE FECHAS QUE SE VAN A ELIMINAR
    console.log('\n📋 Ejemplos de fechas que se eliminarán:');
    const sampleTournaments = await prisma.tournament.findMany({
      where: {
        startTime: {
          gt: cutoffDate
        }
      },
      select: {
        name: true,
        startTime: true
      },
      take: 10,
      orderBy: {
        startTime: 'asc'
      }
    });
    
    sampleTournaments.forEach(tournament => {
      if (tournament.startTime) {
        console.log(`   - ${tournament.name}: ${new Date(tournament.startTime).toLocaleDateString('es-ES')}`);
      }
    });
    
    if (tournamentsToDelete > 10) {
      console.log(`   ... y ${tournamentsToDelete - 10} torneos más`);
    }
    
    // 3. ELIMINAR TORNEOS FUTUROS
    console.log('\n🗑️ Eliminando torneos futuros...');
    
    const deleteResult = await prisma.tournament.deleteMany({
      where: {
        startTime: {
          gt: cutoffDate
        }
      }
    });
    
    console.log(`✅ Eliminados: ${deleteResult.count} torneos`);
    
    // 4. VERIFICACIÓN FINAL
    console.log('\n📊 Verificación final...');
    const finalCount = await prisma.tournament.count();
    const savedConnections = totalTournaments - finalCount;
    
    console.log(`📈 Torneos restantes: ${finalCount}`);
    console.log(`💾 Conexiones de BD liberadas: ~${savedConnections * 5} (estimado)`);
    
    // 5. ANÁLISIS DE FECHAS RESTANTES
    console.log('\n📅 Rango de fechas restantes:');
    const oldestTournament = await prisma.tournament.findFirst({
      orderBy: { startTime: 'asc' },
      select: { startTime: true }
    });
    
    const newestTournament = await prisma.tournament.findFirst({
      orderBy: { startTime: 'desc' },
      select: { startTime: true }
    });
    
    if (oldestTournament && oldestTournament.startTime && newestTournament && newestTournament.startTime) {
      console.log(`   Desde: ${new Date(oldestTournament.startTime).toLocaleDateString('es-ES')}`);
      console.log(`   Hasta: ${new Date(newestTournament.startTime).toLocaleDateString('es-ES')}`);
    }
    
    console.log('\n🎊 ¡LIMPIEZA COMPLETADA EXITOSAMENTE!');
    console.log('💡 Esto debería solucionar el problema de "too many database connections"');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
cleanupFutureTournaments().catch(console.error); 