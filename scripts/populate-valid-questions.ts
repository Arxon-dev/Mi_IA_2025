import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función para generar preguntas genéricas para ValidQuestion
function generateValidQuestions(count: number = 50) {
  const questions = [];
  
  const categories = ['Cultura General', 'Ciencias', 'Historia', 'Geografía', 'Deportes'];
  const difficulties = ['easy', 'medium', 'hard'];
  
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    const questionText = `Pregunta de ${category} número ${i}. ¿Cuál de las siguientes opciones es correcta?`;
    const options = [
      `Opción A para pregunta ${i}`,
      `Opción B para pregunta ${i}`,
      `Opción C para pregunta ${i}`,
      `Opción D para pregunta ${i}`
    ];
    const correctanswerindex = Math.floor(Math.random() * 4);
    
    questions.push({
      originalQuestionId: `generic-${i}`,
      content: JSON.stringify({
        question: questionText,
        options: options,
        correctanswerindex: correctanswerindex,
        explanation: `La respuesta correcta es "${options[correctanswerindex]}" para la pregunta ${i} de ${category}.`
      }),
      parsedQuestion: questionText,
      parsedOptions: options,
      correctanswerindex: correctanswerindex,
      parsedExplanation: `Explicación para pregunta ${i} de ${category}`,
      parseMethod: 'JSON',
      type: 'multiple_choice',
      difficulty: difficulty,
      bloomLevel: 'Comprensión',
      documentId: 'doc-generic',
      sendCount: 0,
      lastsuccessfulsendat: null,
      isactive: true
    });
  }
  
  return questions;
}

async function populateValidQuestions() {
  try {
    console.log('🚀 Poblando tabla ValidQuestion...\n');
    
    // Limpiar tabla existente
    console.log('🗑️ Limpiando tabla ValidQuestion...');
    await prisma.validQuestion.deleteMany({});
    
    // Generar preguntas genéricas
    console.log('📝 Generando preguntas genéricas...');
    const questions = generateValidQuestions(50);
    
    // Insertar preguntas en lotes
    console.log('💾 Insertando preguntas en la base de datos...');
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      try {
        await prisma.validQuestion.createMany({
          data: batch
        });
        insertedCount += batch.length;
        console.log(`✅ Insertadas ${insertedCount}/${questions.length} preguntas...`);
      } catch (error) {
        console.error(`❌ Error insertando lote ${i / batchSize + 1}:`, error);
      }
    }
    
    // Verificar inserción
    const totalValid = await prisma.validQuestion.count();
    console.log(`\n🎯 Total de preguntas ValidQuestion: ${totalValid}`);
    
    // Mostrar muestra
    const sampleQuestions = await prisma.validQuestion.findMany({
      take: 3,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        parsedQuestion: true,
        difficulty: true,
        parseMethod: true,
        isactive: true
      }
    });
    
    console.log('\n📋 Muestra de preguntas ValidQuestion:');
    sampleQuestions.forEach((q, index) => {
      console.log(`  ${index + 1}. ${q.parsedQuestion.substring(0, 60)}...`);
      console.log(`     Dificultad: ${q.difficulty}, Activa: ${q.isactive}`);
    });
    
    console.log('\n✅ Población de ValidQuestion completada!');
    console.log('🎮 El sistema de gamificación ya puede usar estas preguntas');
    
  } catch (error) {
    console.error('❌ Error poblando ValidQuestion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateValidQuestions(); 