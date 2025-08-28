import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugQuestion() {
  try {
    const questionid = '59667b79-8b26-47f8-96c9-39d69a287e69';
    
    const question = await prisma.question.findUnique({
      where: { id: questionid }
    });
    
    if (!question) {
      console.log('❌ Pregunta no encontrada');
      return;
    }
    
    console.log('🔍 DEBUG - CONTENIDO COMPLETO DE LA PREGUNTA');
    console.log('============================================');
    console.log('');
    console.log('📋 ID:', question.id);
    console.log('📄 Tipo:', question.type);
    console.log('📊 Dificultad:', question.difficulty);
    console.log('');
    console.log('📝 CONTENIDO COMPLETO:');
    console.log('----------------------');
    console.log(question.content);
    console.log('');
    console.log('📏 Longitud:', question.content.length, 'caracteres');
    
    // Analizar estructura
    console.log('');
    console.log('🔍 ANÁLISIS DE ESTRUCTURA:');
    console.log('---------------------------');
    
    if (question.content.includes('::')) {
      console.log('✅ Contiene título (::)');
    }
    
    if (question.content.includes('{') && question.content.includes('}')) {
      console.log('✅ Contiene opciones ({ })');
      const optionsMatch = question.content.match(/\{([^}]+)\}/);
      if (optionsMatch) {
        console.log('📊 Opciones encontradas:', optionsMatch[1]);
      }
    } else {
      console.log('❌ NO contiene opciones ({ })');
    }
    
    if (question.content.includes('####')) {
      console.log('✅ Contiene retroalimentación (####)');
    }
    
    if (question.content.includes('RETROALIMENTACIÓN')) {
      console.log('✅ Contiene palabra RETROALIMENTACIÓN');
    }
    
    if (question.content.includes('Referencia')) {
      console.log('✅ Contiene palabra Referencia');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuestion(); 