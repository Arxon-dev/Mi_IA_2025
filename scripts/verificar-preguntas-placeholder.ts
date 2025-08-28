import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarPreguntasPlaceholder() {
  console.log('🔍 VERIFICANDO PREGUNTAS CON CONTENIDO PLACEHOLDER...\n');
  
  try {
    // Buscar preguntas con contenido de placeholder
    const allQuestions = await (prisma as any).examenOficial2024.findMany({
      orderBy: { questionnumber: 'asc' }
    });
    
    console.log(`📋 Total de preguntas: ${allQuestions.length}\n`);
    
    const placeholderQuestions = [];
    const problematicQuestions = [];
    
    allQuestions.forEach((question: any) => {
      // Verificar si tiene contenido de placeholder
      const isPlaceholder = 
        question.question.includes('Pregunta del examen oficial 2024 número') ||
        question.question.includes('PLACEHOLDER') ||
        question.options.some((opt: string) => opt.includes('Opción A') || opt.includes('Opción B') || opt.includes('Opción C') || opt.includes('Opción D'));
      
      // Verificar si la pregunta es muy corta o sospechosa
      const isSuspicious = 
        question.question.length < 20 ||
        question.options.length !== 4 ||
        question.options.some((opt: string) => opt.length < 3);
      
      if (isPlaceholder) {
        placeholderQuestions.push(question);
      }
      
      if (isSuspicious) {
        problematicQuestions.push(question);
      }
    });
    
    console.log('🚫 PREGUNTAS CON PLACEHOLDER:');
    console.log('═════════════════════════════════════');
    if (placeholderQuestions.length > 0) {
      placeholderQuestions.forEach((q: any) => {
        console.log(`❌ Pregunta ${q.questionnumber}: "${q.question.substring(0, 100)}..."`);
        console.log(`   Opciones: ${q.options.join(', ')}`);
        console.log(`   Respuesta correcta: ${q.correctanswerindex}`);
        console.log('');
      });
    } else {
      console.log('✅ No se encontraron preguntas con placeholder explícito');
    }
    
    console.log('\n⚠️ PREGUNTAS SOSPECHOSAS (cortas o malformadas):');
    console.log('═════════════════════════════════════════════════');
    if (problematicQuestions.length > 0) {
      problematicQuestions.forEach((q: any) => {
        console.log(`⚠️ Pregunta ${q.questionnumber}: "${q.question}"`);
        console.log(`   Opciones (${q.options.length}): ${q.options.join(' | ')}`);
        console.log(`   Respuesta correcta: ${q.correctanswerindex}`);
        console.log('');
      });
    } else {
      console.log('✅ No se encontraron preguntas sospechosas');
    }
    
    // Verificar preguntas que podrían faltar
    console.log('\n📊 ANÁLISIS GENERAL:');
    console.log('═════════════════════');
    
    const missingNumbers = [];
    for (let i = 1; i <= 100; i++) {
      const found = allQuestions.find((q: any) => q.questionnumber === i);
      if (!found) {
        missingNumbers.push(i);
      }
    }
    
    if (missingNumbers.length > 0) {
      console.log(`❌ Preguntas faltantes: ${missingNumbers.join(', ')}`);
    } else {
      console.log('✅ Todas las preguntas 1-100 están presentes');
    }
    
    console.log(`📋 Preguntas con placeholder: ${placeholderQuestions.length}`);
    console.log(`⚠️ Preguntas sospechosas: ${problematicQuestions.length}`);
    console.log(`📊 Preguntas aparentemente correctas: ${allQuestions.length - placeholderQuestions.length - problematicQuestions.length}`);
    
    if (placeholderQuestions.length > 0 || problematicQuestions.length > 0) {
      console.log('\n🛠️ PRÓXIMOS PASOS:');
      console.log('1. Revisar el archivo original del examen 2024');
      console.log('2. Re-importar las preguntas problemáticas');
      console.log('3. Verificar que las respuestas correctas estén bien asignadas');
    }
    
  } catch (error) {
    console.error('❌ Error verificando preguntas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPreguntasPlaceholder(); 