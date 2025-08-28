import { PrismaClient } from '@prisma/client';

async function analyzeSectionQuestion() {
  console.log('🔍 ANÁLISIS DE LA TABLA SECTIONQUESTION');
  console.log('='.repeat(50));
  
  const prisma = new PrismaClient();
  
  try {
    // Obtener el conteo total
    const totalCount = await prisma.sectionQuestion.count();
    console.log(`📊 Total de preguntas en SectionQuestion: ${totalCount}`);
    
    // Obtener las primeras 10 preguntas ordenadas por sendCount
    const questions = await prisma.sectionQuestion.findMany({
      orderBy: { sendCount: 'asc' },
      take: 10
    });
    
    console.log(`\n📋 Analizando las primeras ${questions.length} preguntas:\n`);
    
    for (const [index, question] of questions.entries()) {
      console.log(`${index + 1}. ID: ${question.id}`);
      console.log(`   sendCount: ${question.sendCount}`);
      console.log(`   isactive: ${question.isactive}`);
      
      // Analizar el contenido
      console.log(`   content (raw): ${question.content.substring(0, 100)}...`);
      console.log(`   content length: ${question.content.length} chars`);
      
      // Intentar parsear como JSON
      let parsedData;
      try {
        parsedData = JSON.parse(question.content);
        console.log(`   ✅ Contenido es JSON válido`);
        console.log(`   question field: ${parsedData.question ? parsedData.question.substring(0, 100) : 'NO ENCONTRADO'}...`);
        console.log(`   question length: ${parsedData.question ? parsedData.question.length : 0} chars`);
        
        if (parsedData.options) {
          console.log(`   options: ${JSON.stringify(parsedData.options)}`);
        }
        
        if (parsedData.correctanswerindex !== undefined) {
          console.log(`   correctanswerindex: ${parsedData.correctanswerindex}`);
        }
        
        // Simular el formato que usa Telegram
        const telegramFormat = `🧪 PRUEBA SECTIONQUESTION\n\n${parsedData.question}`;
        console.log(`   📱 Longitud con formato Telegram: ${telegramFormat.length} chars`);
        console.log(`   📏 ¿Supera límite de 300?: ${telegramFormat.length > 300 ? '❌ SÍ' : '✅ NO'}`);
        
      } catch (error) {
        console.log(`   ❌ Contenido NO es JSON válido`);
        console.log(`   Error: ${error}`);
        
        // Si no es JSON, usar el contenido directamente
        const telegramFormat = `🧪 PRUEBA SECTIONQUESTION\n\n${question.content}`;
        console.log(`   📱 Longitud con formato Telegram: ${telegramFormat.length} chars`);
        console.log(`   📏 ¿Supera límite de 300?: ${telegramFormat.length > 300 ? '❌ SÍ' : '✅ NO'}`);
      }
      
      console.log(`   ` + '-'.repeat(80));
    }
    
    // Buscar preguntas que NO superen el límite
    console.log('\n🔍 BUSCANDO PREGUNTAS QUE SÍ CUMPLAN CON EL LÍMITE...\n');
    
    let validQuestions = 0;
    let checkedQuestions = 0;
    const maxCheck = 50; // Revisar máximo 50 preguntas
    
    const allQuestions = await prisma.sectionQuestion.findMany({
      orderBy: { sendCount: 'asc' },
      take: maxCheck
    });
    
    for (const question of allQuestions) {
      checkedQuestions++;
      
      let questionText;
      try {
        const parsed = JSON.parse(question.content);
        questionText = parsed.question || question.content;
      } catch {
        questionText = question.content;
      }
      
      const telegramFormat = `🧪 PRUEBA SECTIONQUESTION\n\n${questionText}`;
      
      if (telegramFormat.length <= 300) {
        validQuestions++;
        console.log(`✅ PREGUNTA VÁLIDA ENCONTRADA:`);
        console.log(`   ID: ${question.id}`);
        console.log(`   Longitud: ${telegramFormat.length}/300 chars`);
        console.log(`   Pregunta: ${questionText.substring(0, 150)}...`);
        console.log(`   ` + '-'.repeat(50));
        
        if (validQuestions >= 5) break; // Mostrar máximo 5 válidas
      }
    }
    
    console.log(`\n📊 RESUMEN DEL ANÁLISIS:`);
    console.log(`   Preguntas revisadas: ${checkedQuestions}/${totalCount}`);
    console.log(`   Preguntas válidas (≤300 chars): ${validQuestions}`);
    console.log(`   Porcentaje de preguntas válidas: ${((validQuestions / checkedQuestions) * 100).toFixed(1)}%`);
    
    if (validQuestions === 0) {
      console.log(`\n⚠️  PROBLEMA IDENTIFICADO: Ninguna de las ${checkedQuestions} preguntas revisadas cumple con el límite de 300 caracteres`);
      console.log(`💡 SOLUCIÓN RECOMENDADA: Truncar las preguntas o procesarlas antes de enviarlas`);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error);
    await prisma.$disconnect();
  }
}

// Ejecutar el análisis
analyzeSectionQuestion().catch(console.error); 