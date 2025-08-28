import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSimulacroCorrupto() {
  try {
    console.log('🔧 CORRIGIENDO SIMULACRO CORRUPTO');
    console.log('================================');

    const CARLOS_TELEGRAM_ID = '5793286375';

    // 1. Buscar usuario Carlos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: CARLOS_TELEGRAM_ID }
    });

    if (!user) {
      console.error('❌ Usuario Carlos no encontrado');
      return;
    }

    console.log('✅ Usuario Carlos encontrado:', user.firstname);

    // 2. Buscar simulacro corrupto (en progreso)
    const corruptoSimulacro = await prisma.simulacro.findFirst({
      where: {
        userid: user.id,
        status: 'in_progress'
      }
    });

    if (!corruptoSimulacro) {
      console.log('ℹ️ No hay simulacro en progreso para limpiar');
      return;
    }

    console.log('🎯 Simulacro corrupto encontrado:', {
      id: corruptoSimulacro.id,
      status: corruptoSimulacro.status,
      startedAt: corruptoSimulacro.startedAt,
      currentQuestionIndex: corruptoSimulacro.currentQuestionIndex
    });

    // 3. Verificar si está realmente corrupto
    const responsesCount = await prisma.simulacroResponse.count({
      where: { simulacroId: corruptoSimulacro.id }
    });

    const answeredCount = await prisma.simulacroResponse.count({
      where: { 
        simulacroId: corruptoSimulacro.id,
        answeredAt: { not: null }
      }
    });

    const nullAnswersCount = await prisma.simulacroResponse.count({
      where: { 
        simulacroId: corruptoSimulacro.id,
        selectedOption: null,
        iscorrect: null
      }
    });

    console.log('📊 Estado actual del simulacro:');
    console.log(`   Total responses: ${responsesCount}`);
    console.log(`   Marcadas como respondidas: ${answeredCount}`);
    console.log(`   Con selectedOption/iscorrect null: ${nullAnswersCount}`);

    if (answeredCount === responsesCount && nullAnswersCount === responsesCount) {
      console.log('🚨 CONFIRMADO: Simulacro está corrupto (todas respondidas pero con datos null)');
      
      // 4. Eliminar el simulacro corrupto y sus respuestas
      console.log('\n🗑️ LIMPIANDO SIMULACRO CORRUPTO...');
      
      // Primero eliminar las respuestas
      const deletedResponses = await prisma.simulacroResponse.deleteMany({
        where: { simulacroId: corruptoSimulacro.id }
      });
      console.log(`✅ Eliminadas ${deletedResponses.count} respuestas corruptas`);

      // Luego eliminar el simulacro
      await prisma.simulacro.delete({
        where: { id: corruptoSimulacro.id }
      });
      console.log('✅ Simulacro corrupto eliminado');

      // 5. Verificar que se limpió correctamente
      const verificacion = await prisma.simulacro.findFirst({
        where: {
          userid: user.id,
          status: 'in_progress'
        }
      });

      if (!verificacion) {
        console.log('✅ Verificación exitosa: No hay simulacros en progreso');
        console.log('\n🎉 CORRECCIÓN COMPLETADA');
        console.log('============================');
        console.log('✅ El simulacro corrupto ha sido eliminado');
        console.log('✅ Carlos ya puede usar /simulacro para iniciar uno nuevo');
        console.log('✅ El nuevo simulacro funcionará correctamente');
        
        console.log('\n💡 INSTRUCCIONES PARA CARLOS:');
        console.log('1. Usa /simulacro para iniciar un nuevo examen');
        console.log('2. Esta vez funcionará correctamente');
        console.log('3. Recibirás las preguntas una por una');
        
      } else {
        console.error('❌ Error: Aún hay un simulacro en progreso después de la limpieza');
      }

    } else {
      console.log('ℹ️ El simulacro no parece corrupto o tiene un patrón diferente');
      console.log('📋 Diagnóstico detallado:');
      
      // Mostrar algunas respuestas de ejemplo
      const sampleResponses = await prisma.simulacroResponse.findMany({
        where: { simulacroId: corruptoSimulacro.id },
        orderBy: { questionnumber: 'asc' },
        take: 5
      });

      sampleResponses.forEach((r, i) => {
        console.log(`   Q${r.questionnumber}: answeredAt=${r.answeredAt ? 'SET' : 'NULL'}, option=${r.selectedOption}, correct=${r.iscorrect}`);
      });
    }

  } catch (error) {
    console.error('❌ Error corrigiendo simulacro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la corrección
fixSimulacroCorrupto(); 