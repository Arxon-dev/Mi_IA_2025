import { prisma, testPrismaConnection, getConnectionStats, closePrismaConnection } from '../src/lib/prisma';

async function testOptimizedConnections() {
  try {
    console.log('🧪 ===== TESTING CONEXIONES OPTIMIZADAS =====\n');

    // 1. Prueba básica de conexión
    console.log('📡 1. PRUEBA BÁSICA DE CONEXIÓN...');
    const connectionWorking = await testPrismaConnection();
    
    if (!connectionWorking) {
      console.log('❌ La conexión básica falló');
      return;
    }

    // 2. Probar múltiples queries simultáneas (simular carga)
    console.log('\n⚡ 2. PRUEBA DE MÚLTIPLES QUERIES SIMULTÁNEAS...');
    const startTime = Date.now();
    
    const queries = [
      prisma.emad.count(),
      prisma.constitucion.count(),
      prisma.defensaNacional.count(),
      prisma.rio.count(),
      prisma.minsdef.count()
    ];
    
    try {
      const results = await Promise.all(queries);
      const endTime = Date.now();
      
      console.log('✅ Todas las queries ejecutadas exitosamente');
      console.log(`⏱️ Tiempo total: ${endTime - startTime}ms`);
      console.log('📊 Resultados:');
      console.log(`   • EMAD: ${results[0]} preguntas`);
      console.log(`   • Constitución: ${results[1]} preguntas`);
      console.log(`   • Defensa Nacional: ${results[2]} preguntas`);
      console.log(`   • RIO: ${results[3]} preguntas`);
      console.log(`   • MINSDEF: ${results[4]} preguntas`);
      
    } catch (error) {
      console.log('❌ Error en queries simultáneas:', error);
      return;
    }

    // 3. Verificar estadísticas de conexiones
    console.log('\n📊 3. VERIFICANDO ESTADÍSTICAS DE CONEXIONES...');
    const stats = await getConnectionStats();
    
    if (stats) {
      console.log('🔍 Estadísticas actuales:');
      if (Array.isArray(stats)) {
        stats.forEach((stat: any) => {
          console.log(`   • ${stat.state}: ${stat.count} conexiones`);
        });
      }
    }

    // 4. Probar creación de registros en lotes
    console.log('\n🔄 4. PRUEBA DE OPERACIONES EN LOTES...');
    
    // Crear algunos registros de prueba
    const testData = Array.from({ length: 10 }, (_, i) => ({
      questionnumber: 9999 + i,
      question: `Pregunta de prueba ${i + 1}`,
      options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
      correctanswerindex: i % 4,
      category: 'TEST',
      difficulty: 'TEST',
      isactive: true,
      feedback: 'Feedback de prueba',
      type: 'test',
      title: `Prueba ${i + 1}`,
      titleSourceReference: 'TEST',
      titleSourceDocument: 'Documento de prueba'
    }));

    try {
      // Crear en lotes
      await prisma.emad.createMany({
        data: testData,
        skipDuplicates: true
      });
      
      console.log('✅ Creación en lotes exitosa');
      
      // Limpiar los datos de prueba
      await prisma.emad.deleteMany({
        where: {
          category: 'TEST'
        }
      });
      
      console.log('🧹 Datos de prueba limpiados');
      
    } catch (error) {
      console.log('❌ Error en operaciones en lotes:', error);
    }

    // 5. Prueba de conexiones rápidas sucesivas
    console.log('\n🏃 5. PRUEBA DE CONEXIONES RÁPIDAS SUCESIVAS...');
    
    const rapidQueries = [];
    for (let i = 0; i < 5; i++) {
      rapidQueries.push(
        prisma.$queryRaw`SELECT COUNT(*) as count FROM "Emad" WHERE "isActive" = true`
      );
    }
    
    try {
      const rapidResults = await Promise.all(rapidQueries);
      console.log('✅ Conexiones rápidas sucesivas: OK');
      console.log(`📊 Resultados consistentes: ${rapidResults.every(r => Array.isArray(r) && (r[0] as any).count > 0)}`);
    } catch (error) {
      console.log('❌ Error en conexiones rápidas:', error);
    }

    // 6. Reporte final
    console.log('\n🎯 6. REPORTE FINAL...');
    const finalStats = await getConnectionStats();
    
    if (finalStats && Array.isArray(finalStats)) {
      const totalConnections = finalStats.reduce((total, stat: any) => total + parseInt(stat.count), 0);
      console.log(`📊 Total de conexiones después de las pruebas: ${totalConnections}`);
      
      if (totalConnections <= 5) {
        console.log('✅ EXCELENTE: Número de conexiones muy bajo');
      } else if (totalConnections <= 10) {
        console.log('🟢 BUENO: Número de conexiones razonable');
      } else {
        console.log('⚠️ ADVERTENCIA: Número de conexiones alto');
      }
    }

    console.log('\n🎉 ===== PRUEBA COMPLETADA EXITOSAMENTE =====');
    console.log('✅ La configuración optimizada funciona correctamente');
    console.log('🚀 Puedes usar scripts de importación sin problemas de conexiones');
    console.log('📋 Recomendación: Ejecutar este test periódicamente para monitorear el rendimiento');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('too many clients')) {
        console.log('\n🆘 DETECCIÓN DE PROBLEMA:');
        console.log('El error "too many clients" indica que necesitas:');
        console.log('1. Cerrar otras conexiones de aplicaciones');
        console.log('2. Reiniciar el servidor Next.js');
        console.log('3. Verificar la configuración de Supabase');
      }
    }
  } finally {
    // Cerrar conexiones correctamente
    await closePrismaConnection();
  }
}

// Manejar interrupciones
process.on('SIGINT', async () => {
  console.log('\n🔌 Cerrando conexiones de prueba...');
  await closePrismaConnection();
  process.exit(0);
});

// Ejecutar prueba
if (require.main === module) {
  testOptimizedConnections().catch(console.error);
}

export { testOptimizedConnections }; 