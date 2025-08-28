import { PrismaClient } from '@prisma/client';

async function compareTableStructures() {
  console.log('🔍 COMPARACIÓN DE ESTRUCTURAS DE LAS 4 TABLAS DE PREGUNTAS');
  console.log('='.repeat(70));
  
  const prisma = new PrismaClient();
  
  try {
    // 1. VALIDQUESTION
    console.log('\n1️⃣ VALIDQUESTION:');
    console.log('-'.repeat(40));
    
    const validQuestion = await prisma.validQuestion.findFirst({
      orderBy: { sendCount: 'asc' }
    });
    
    if (validQuestion) {
      console.log('📋 Campos disponibles:');
      Object.keys(validQuestion).forEach(key => {
        const value = (validQuestion as any)[key];
        const type = typeof value;
        const length = type === 'string' ? value.length : 'N/A';
        console.log(`   ${key}: ${type} (${length} chars)`);
      });
      
      console.log('\n📄 Contenido de ejemplo:');
      console.log(`   content: ${validQuestion.content.substring(0, 150)}...`);
      console.log(`   parsedQuestion: ${validQuestion.parsedQuestion?.substring(0, 100) || 'NULL'}...`);
      console.log(`   parsedOptions: ${JSON.stringify(validQuestion.parsedOptions)}`);
      console.log(`   correctanswerindex: ${validQuestion.correctanswerindex}`);
    }

    // 2. EXAMENOFICIAL2018
    console.log('\n\n2️⃣ EXAMENOFICIAL2018:');
    console.log('-'.repeat(40));
    
    const examen2018 = await prisma.examenOficial2018.findFirst({
      orderBy: { sendCount: 'asc' }
    });
    
    if (examen2018) {
      console.log('📋 Campos disponibles:');
      Object.keys(examen2018).forEach(key => {
        const value = (examen2018 as any)[key];
        const type = typeof value;
        const length = type === 'string' ? value.length : 'N/A';
        console.log(`   ${key}: ${type} (${length} chars)`);
      });
      
      console.log('\n📄 Contenido de ejemplo:');
      console.log(`   question: ${examen2018.question.substring(0, 150)}...`);
      console.log(`   options: ${JSON.stringify(examen2018.options)}`);
      console.log(`   correctanswerindex: ${examen2018.correctanswerindex}`);
    }

    // 3. EXAMENOFICIAL2024
    console.log('\n\n3️⃣ EXAMENOFICIAL2024:');
    console.log('-'.repeat(40));
    
    const examen2024 = await (prisma as any).examenOficial2024.findFirst({
      orderBy: { sendCount: 'asc' }
    });
    
    if (examen2024) {
      console.log('📋 Campos disponibles:');
      Object.keys(examen2024).forEach(key => {
        const value = (examen2024 as any)[key];
        const type = typeof value;
        const length = type === 'string' ? value.length : 'N/A';
        console.log(`   ${key}: ${type} (${length} chars)`);
      });
      
      console.log('\n📄 Contenido de ejemplo:');
      console.log(`   question: ${examen2024.question.substring(0, 150)}...`);
      console.log(`   options: ${JSON.stringify(examen2024.options)}`);
      console.log(`   correctanswerindex: ${examen2024.correctanswerindex}`);
    }

    // 4. SECTIONQUESTION
    console.log('\n\n4️⃣ SECTIONQUESTION:');
    console.log('-'.repeat(40));
    
    const sectionQuestion = await prisma.sectionQuestion.findFirst({
      orderBy: { sendCount: 'asc' }
    });
    
    if (sectionQuestion) {
      console.log('📋 Campos disponibles:');
      Object.keys(sectionQuestion).forEach(key => {
        const value = (sectionQuestion as any)[key];
        const type = typeof value;
        const length = type === 'string' ? value.length : 'N/A';
        console.log(`   ${key}: ${type} (${length} chars)`);
      });
      
      console.log('\n📄 Contenido de ejemplo:');
      console.log(`   content: ${sectionQuestion.content.substring(0, 200)}...`);
      
      // Intentar extraer partes de la pregunta del content
      console.log('\n🔍 Análisis del content de SectionQuestion:');
      const content = sectionQuestion.content;
      
      // Buscar patrones comunes
      if (content.includes('a)') || content.includes('A)')) {
        console.log('   ✅ Parece contener opciones de respuesta (a), b), c)...)');
      }
      
      if (content.includes('<b>') || content.includes('<br>')) {
        console.log('   ✅ Contiene HTML (títulos, saltos de línea)');
      }
      
      if (content.includes('::')) {
        console.log('   ✅ Contiene separadores de artículos/secciones (::)');
      }
      
      // Intentar extraer solo la pregunta principal
      let questionOnly = content;
      
      // Remover comentarios iniciales
      questionOnly = questionOnly.replace(/^\/\/[^\n]*\n/, '');
      
      // Remover HTML tags
      questionOnly = questionOnly.replace(/<[^>]*>/g, ' ');
      
      // Buscar donde termina la pregunta (antes de las opciones)
      const optionsStart = questionOnly.search(/[a-d]\)\s/i);
      if (optionsStart > 0) {
        questionOnly = questionOnly.substring(0, optionsStart);
      }
      
      console.log(`   📝 Pregunta extraída: ${questionOnly.trim().substring(0, 150)}...`);
      console.log(`   📏 Longitud de pregunta extraída: ${questionOnly.trim().length} chars`);
      
      // Verificar si la pregunta extraída cumple el límite
      const telegramFormat = `🧪 PRUEBA SECTIONQUESTION\n\n${questionOnly.trim()}`;
      console.log(`   📱 Con formato Telegram: ${telegramFormat.length} chars`);
      console.log(`   📏 ¿Cumple límite?: ${telegramFormat.length <= 300 ? '✅ SÍ' : '❌ NO'}`);
    }

    // RESUMEN COMPARATIVO
    console.log('\n\n📊 RESUMEN COMPARATIVO:');
    console.log('='.repeat(70));
    
    console.log('🏗️  ESTRUCTURA:');
    console.log('   ValidQuestion: content + parsedQuestion + parsedOptions + correctanswerindex');
    console.log('   ExamenOficial2018: question + options + correctanswerindex');
    console.log('   ExamenOficial2024: question + options + correctanswerindex');
    console.log('   SectionQuestion: content (TODO EN UNO)');
    
    console.log('\n💡 OBSERVACIONES:');
    console.log('   - Las tablas de examen tienen campos separados para pregunta y opciones');
    console.log('   - ValidQuestion tiene campos parseados además del content original');
    console.log('   - SectionQuestion almacena TODO en el campo content');
    console.log('   - Esto explica por qué SectionQuestion supera el límite de caracteres');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error en la comparación:', error);
    await prisma.$disconnect();
  }
}

// Ejecutar la comparación
compareTableStructures().catch(console.error); 