import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTablesStatus() {
  try {
    console.log('🔍 Verificando estado de las tablas...\n');
    
    // Verificar tabla Question
    const questionsCount = await prisma.question.count();
    console.log(`📄 Tabla Question: ${questionsCount} registros`);
    
    // Verificar tabla ValidQuestion
    const validQuestionsCount = await prisma.validQuestion.count();
    console.log(`✅ Tabla ValidQuestion: ${validQuestionsCount} registros`);
    
    // Verificar tabla ExamenOficial2018
    const examenCount = await prisma.examenOficial2018.count();
    console.log(`🎯 Tabla ExamenOficial2018: ${examenCount} registros`);
    
    console.log('\n📊 Resumen:');
    if (questionsCount > 0) {
      console.log('✅ Tabla Question tiene datos para migrar a ValidQuestion');
    } else {
      console.log('❌ Tabla Question está vacía - necesitamos poblarla primero');
    }
    
    if (validQuestionsCount > 0) {
      console.log('✅ Tabla ValidQuestion ya tiene datos');
    } else {
      console.log('❌ Tabla ValidQuestion está vacía - necesita población');
    }
    
    if (examenCount >= 100) {
      console.log('✅ Tabla ExamenOficial2018 tiene las 100 preguntas');
    } else {
      console.log(`❌ Tabla ExamenOficial2018 solo tiene ${examenCount} preguntas`);
    }
    
  } catch (error) {
    console.error('❌ Error verificando tablas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTablesStatus(); 