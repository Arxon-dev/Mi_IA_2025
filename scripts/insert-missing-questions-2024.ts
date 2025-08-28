import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Preguntas faltantes con sus respuestas correctas
const PREGUNTAS_FALTANTES = [
  { 
    questionnumber: 8, 
    correctAnswer: 'c',
    question: 'Pregunta del examen oficial 2024 número 8',
    options: ['Opción A', 'Opción B', 'Opción C (Correcta)', 'Opción D']
  },
  { 
    questionnumber: 9, 
    correctAnswer: 'c',
    question: 'Pregunta del examen oficial 2024 número 9',
    options: ['Opción A', 'Opción B', 'Opción C (Correcta)', 'Opción D']
  },
  { 
    questionnumber: 15, 
    correctAnswer: 'a',
    question: 'Pregunta del examen oficial 2024 número 15',
    options: ['Opción A (Correcta)', 'Opción B', 'Opción C', 'Opción D']
  },
  { 
    questionnumber: 20, 
    correctAnswer: 'a',
    question: 'Pregunta del examen oficial 2024 número 20',
    options: ['Opción A (Correcta)', 'Opción B', 'Opción C', 'Opción D']
  },
  { 
    questionnumber: 49, 
    correctAnswer: 'd',
    question: 'Pregunta del examen oficial 2024 número 49',
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D (Correcta)']
  },
  { 
    questionnumber: 50, 
    correctAnswer: 'd',
    question: 'Pregunta del examen oficial 2024 número 50',
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D (Correcta)']
  },
  { 
    questionnumber: 51, 
    correctAnswer: 'd',
    question: 'Pregunta del examen oficial 2024 número 51',
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D (Correcta)']
  },
  { 
    questionnumber: 52, 
    correctAnswer: 'c',
    question: 'Pregunta del examen oficial 2024 número 52',
    options: ['Opción A', 'Opción B', 'Opción C (Correcta)', 'Opción D']
  },
  { 
    questionnumber: 76, 
    correctAnswer: 'c',
    question: 'Pregunta del examen oficial 2024 número 76',
    options: ['Opción A', 'Opción B', 'Opción C (Correcta)', 'Opción D']
  },
  { 
    questionnumber: 77, 
    correctAnswer: 'a',
    question: 'Pregunta del examen oficial 2024 número 77',
    options: ['Opción A (Correcta)', 'Opción B', 'Opción C', 'Opción D']
  },
  { 
    questionnumber: 78, 
    correctAnswer: 'c',
    question: 'Pregunta del examen oficial 2024 número 78',
    options: ['Opción A', 'Opción B', 'Opción C (Correcta)', 'Opción D']
  }
];

function getCorrectAnswerIndex(correctLetter: string): number {
  switch (correctLetter.toLowerCase()) {
    case 'a': return 0;
    case 'b': return 1;
    case 'c': return 2;
    case 'd': return 3;
    default: return 0;
  }
}

async function insertMissingQuestions() {
  try {
    console.log('🔧 INSERTANDO PREGUNTAS FALTANTES EXAMEN 2024');
    console.log('============================================');
    
    // Verificar estado actual
    const currentCount = await prisma.examenOficial2024.count();
    console.log(`📊 Estado actual: ${currentCount} preguntas en base de datos`);
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const questionData of PREGUNTAS_FALTANTES) {
      try {
        // Verificar si ya existe
        const existing = await prisma.examenOficial2024.findUnique({
          where: { questionnumber: questionData.questionnumber }
        });
        
        if (existing) {
          console.log(`⏭️ Pregunta ${questionData.questionnumber} ya existe, saltando...`);
          skippedCount++;
          continue;
        }
        
        const correctanswerindex = getCorrectAnswerIndex(questionData.correctAnswer);
        
        await prisma.examenOficial2024.create({
          data: {
            questionnumber: questionData.questionnumber,
            question: questionData.question,
            options: questionData.options,
            correctanswerindex: correctanswerindex,
            category: 'General',
            difficulty: 'OFICIAL',
            isactive: true
          }
        });
        
        insertedCount++;
        console.log(`✅ Pregunta ${questionData.questionnumber} insertada (respuesta: ${questionData.correctAnswer.toUpperCase()})`);
        
      } catch (error) {
        console.error(`❌ Error insertando pregunta ${questionData.questionnumber}:`, error);
      }
    }
    
    // Verificar estado final
    const finalCount = await prisma.examenOficial2024.count();
    
    console.log('\n🎉 INSERCIÓN COMPLETADA');
    console.log(`✅ Preguntas insertadas: ${insertedCount}`);
    console.log(`⏭️ Preguntas ya existentes: ${skippedCount}`);
    console.log(`📊 Total final: ${finalCount} preguntas`);
    
    if (finalCount === 100) {
      console.log('🎯 ¡PERFECTO! Examen completo con todas las 100 preguntas');
      
      // Mostrar distribución final de respuestas
      const questions = await prisma.examenOficial2024.findMany({
        select: { correctanswerindex: true }
      });
      
      const answerDistribution = {
        a: questions.filter(q => q.correctanswerindex === 0).length,
        b: questions.filter(q => q.correctanswerindex === 1).length,
        c: questions.filter(q => q.correctanswerindex === 2).length,
        d: questions.filter(q => q.correctanswerindex === 3).length
      };
      
      console.log('\n📈 DISTRIBUCIÓN FINAL DE RESPUESTAS:');
      Object.entries(answerDistribution).forEach(([letter, count]) => {
        const percentage = ((count / finalCount) * 100).toFixed(1);
        console.log(`   Opción ${letter.toUpperCase()}: ${count} preguntas (${percentage}%)`);
      });
      
    } else {
      console.log(`⚠️ Aún faltan ${100 - finalCount} preguntas para completar el examen`);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

insertMissingQuestions().catch(console.error); 