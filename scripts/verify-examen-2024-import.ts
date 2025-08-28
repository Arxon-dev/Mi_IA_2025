import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyExamen2024Import() {
  try {
    console.log('🔍 VERIFICANDO IMPORTACIÓN EXAMEN OFICIAL 2024');
    console.log('===============================================');

    // Contar total de preguntas
    const totalCount = await prisma.examenOficial2024.count();
    console.log(`📊 Total de preguntas importadas: ${totalCount}`);

    // Verificar continuidad de preguntas (1-100)
    const questions = await prisma.examenOficial2024.findMany({
      select: {
        questionnumber: true,
        question: true,
        options: true,
        correctanswerindex: true,
        category: true
      },
      orderBy: { questionnumber: 'asc' }
    });

    console.log('\n🔢 ANÁLISIS DE CONTINUIDAD:');
    const existingNumbers = questions.map(q => q.questionnumber);
    const missingNumbers = [];
    
    for (let i = 1; i <= 100; i++) {
      if (!existingNumbers.includes(i)) {
        missingNumbers.push(i);
      }
    }

    if (missingNumbers.length === 0) {
      console.log('✅ Todas las preguntas del 1 al 100 están presentes');
    } else {
      console.log(`❌ Faltan ${missingNumbers.length} preguntas:`);
      console.log(`   Números faltantes: ${missingNumbers.join(', ')}`);
    }

    // Verificar preguntas con respuestas correctas válidas
    console.log('\n🎯 ANÁLISIS DE RESPUESTAS CORRECTAS:');
    const invalidAnswers = questions.filter(q => 
      q.correctanswerindex < 0 || 
      q.correctanswerindex >= q.options.length
    );

    if (invalidAnswers.length === 0) {
      console.log('✅ Todas las respuestas correctas son válidas');
    } else {
      console.log(`❌ ${invalidAnswers.length} preguntas con respuestas incorrectas:`);
      invalidAnswers.forEach(q => {
        console.log(`   Pregunta ${q.questionnumber}: índice ${q.correctanswerindex} (opciones: ${q.options.length})`);
      });
    }

    // Estadísticas por categoría
    console.log('\n📊 ESTADÍSTICAS POR CATEGORÍA:');
    const stats = await prisma.examenOficial2024.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    stats.forEach(stat => {
      console.log(`   ${stat.category}: ${stat._count.id} preguntas`);
    });

    // Verificar distribución de respuestas correctas
    console.log('\n📈 DISTRIBUCIÓN DE RESPUESTAS CORRECTAS:');
    const answerDistribution = {
      a: questions.filter(q => q.correctanswerindex === 0).length,
      b: questions.filter(q => q.correctanswerindex === 1).length,
      c: questions.filter(q => q.correctanswerindex === 2).length,
      d: questions.filter(q => q.correctanswerindex === 3).length
    };

    Object.entries(answerDistribution).forEach(([letter, count]) => {
      const percentage = ((count / totalCount) * 100).toFixed(1);
      console.log(`   Opción ${letter.toUpperCase()}: ${count} preguntas (${percentage}%)`);
    });

    // Mostrar algunas preguntas de muestra
    console.log('\n🔍 MUESTRA DE PREGUNTAS (primeras 5):');
    const sampleQuestions = questions.slice(0, 5);
    
    sampleQuestions.forEach(q => {
      const correctLetter = String.fromCharCode(97 + q.correctanswerindex);
      console.log(`\n📝 Pregunta ${q.questionnumber}:`);
      console.log(`   ${q.question.substring(0, 120)}...`);
      console.log(`   Opciones: ${q.options.length}`);
      console.log(`   Respuesta correcta: ${correctLetter}) ${q.options[q.correctanswerindex]?.substring(0, 60)}...`);
      console.log(`   Categoría: ${q.category}`);
    });

    // Verificar si hay preguntas con números > 100 (reservas)
    const reserveQuestions = await prisma.examenOficial2024.findMany({
      where: { questionnumber: { gt: 100 } },
      select: { questionnumber: true }
    });

    if (reserveQuestions.length > 0) {
      console.log(`\n⚠️ Se encontraron ${reserveQuestions.length} preguntas de reserva (números > 100):`);
      console.log(`   Números: ${reserveQuestions.map(q => q.questionnumber).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error verificando importación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyExamen2024Import().catch(console.error); 