import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanSimulacroData() {
  try {
    console.log('🧹 LIMPIANDO DATOS ERRÓNEOS DE SIMULACRO...');
    
    // Eliminar todos los simulacros existentes para empezar limpio
    console.log('🗑️ Eliminando simulacros existentes...');
    await prisma.simulacroResponse.deleteMany({});
    await prisma.simulacro.deleteMany({});
    
    console.log('✅ Datos de simulacro limpiados');
    console.log('🎯 Ahora puedes probar /simulacro otra vez');
    
    // Verificar que está limpio
    const remainingSimulacros = await prisma.simulacro.count();
    const remainingResponses = await prisma.simulacroResponse.count();
    
    console.log('\n📊 VERIFICACIÓN:');
    console.log('   Simulacros restantes:', remainingSimulacros);
    console.log('   Respuestas restantes:', remainingResponses);
    
    if (remainingSimulacros === 0 && remainingResponses === 0) {
      console.log('✅ LIMPIEZA EXITOSA - Todo listo para nuevo simulacro');
    } else {
      console.log('⚠️ Algunos datos no se eliminaron completamente');
    }
    
  } catch (error) {
    console.error('❌ Error limpiando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanSimulacroData().catch(console.error); 