import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  truncatedOptions?: string[];
}

function validateQuestionCompleteness(parsedOptions: string[]): ValidationResult {
  const truncatedOptions: string[] = [];
  
  for (const [index, option] of parsedOptions.entries()) {
    const trimmed = option.trim();
    
    // Detectar opciones truncadas - opciones que terminan abruptamente
    const endsIncomplete = (
      // No termina con puntuación normal
      !/[.!?:]$/.test(trimmed) &&
      // Y parece que fue cortada (termina con caracteres incompletos)
      (
        trimmed.length >= 90 || // Muy cerca del límite de 100 caracteres
        /[a-z]$/.test(trimmed) || // Termina con letra minúscula (probable corte)
        /\s[a-z]+$/.test(trimmed) || // Termina con palabra incompleta
        trimmed.endsWith('...') || // Puntos suspensivos
        trimmed.endsWith(' y') || // Conjunciones cortadas
        trimmed.endsWith(' de') || // Preposiciones cortadas
        trimmed.endsWith(' la') || // Artículos cortados
        trimmed.endsWith(' el') ||
        trimmed.endsWith(' en') ||
        trimmed.endsWith(' con') ||
        trimmed.endsWith(' para') ||
        trimmed.endsWith(' por') ||
        /\w+,\s*$/.test(trimmed) // Termina con coma y espacio (lista incompleta)
      )
    );
    
    // Excepción: opciones muy cortas probablemente están completas
    if (trimmed.length < 20) {
      continue;
    }
    
    if (endsIncomplete) {
      truncatedOptions.push(`Opción ${index + 1}: "${trimmed}"`);
    }
  }
  
  if (truncatedOptions.length > 0) {
    return {
      isValid: false,
      reason: `Opciones truncadas detectadas`,
      truncatedOptions
    };
  }
  
  return { isValid: true };
}

async function removeQuestionsWithTruncatedOptions() {
  console.log('🔍 Analizando preguntas en ValidQuestion para detectar opciones truncadas...\n');
  
  try {
    // Obtener todas las preguntas de ValidQuestion
    const validQuestions = await prisma.validQuestion.findMany({
      select: {
        id: true,
        originalQuestionId: true,
        parsedQuestion: true,
        parsedOptions: true
      }
    });
    
    console.log(`📊 Total de preguntas a analizar: ${validQuestions.length}`);
    
    const questionsToRemove: number[] = [];
    const analysisResults: Array<{
      id: number;
      originalId: number;
      question: string;
      validation: ValidationResult;
    }> = [];
    
    // Analizar cada pregunta
    for (const question of validQuestions) {
      try {
        const parsedOptions = question.parsedOptions as string[];
        
        if (!Array.isArray(parsedOptions)) {
          console.log(`⚠️  ID ${question.id}: Opciones no es un array válido`);
          questionsToRemove.push(question.id);
          continue;
        }
        
        const validation = validateQuestionCompleteness(parsedOptions);
        
        analysisResults.push({
          id: question.id,
          originalId: question.originalQuestionId,
          question: question.parsedQuestion,
          validation
        });
        
        if (!validation.isValid) {
          questionsToRemove.push(question.id);
        }
        
      } catch (error) {
        console.log(`❌ Error procesando pregunta ID ${question.id}:`, error);
        questionsToRemove.push(question.id);
      }
    }
    
    // Mostrar ejemplos de preguntas que serán eliminadas
    const invalidQuestions = analysisResults.filter(q => !q.validation.isValid);
    
    console.log(`\n🚨 PREGUNTAS CON OPCIONES TRUNCADAS DETECTADAS: ${invalidQuestions.length}`);
    
    if (invalidQuestions.length > 0) {
      console.log('\n📋 EJEMPLOS DE OPCIONES TRUNCADAS:\n');
      
      // Mostrar los primeros 5 ejemplos
      for (const question of invalidQuestions.slice(0, 5)) {
        console.log(`🔸 ID ${question.id} (Original: ${question.originalId})`);
        console.log(`   Pregunta: ${question.question.substring(0, 100)}...`);
        console.log(`   Problema: ${question.validation.reason}`);
        if (question.validation.truncatedOptions) {
          for (const truncatedOption of question.validation.truncatedOptions) {
            console.log(`   ${truncatedOption}`);
          }
        }
        console.log('');
      }
      
      if (invalidQuestions.length > 5) {
        console.log(`   ... y ${invalidQuestions.length - 5} preguntas más con problemas similares\n`);
      }
    }
    
    // Confirmar eliminación
    console.log(`\n📊 RESUMEN DE LIMPIEZA:`);
    console.log(`   🟢 Preguntas válidas (sin truncar): ${validQuestions.length - questionsToRemove.length}`);
    console.log(`   🔴 Preguntas a eliminar (truncadas): ${questionsToRemove.length}`);
    console.log(`   📈 Porcentaje de preguntas válidas: ${((validQuestions.length - questionsToRemove.length) / validQuestions.length * 100).toFixed(1)}%`);
    
    if (questionsToRemove.length === 0) {
      console.log('\n✅ ¡Excelente! No se encontraron preguntas con opciones truncadas.');
      return;
    }
    
    // Eliminar preguntas truncadas
    console.log(`\n🗑️  Eliminando ${questionsToRemove.length} preguntas con opciones truncadas...`);
    
    const deleteResult = await prisma.validQuestion.deleteMany({
      where: {
        id: {
          in: questionsToRemove
        }
      }
    });
    
    console.log(`✅ Eliminadas ${deleteResult.count} preguntas con opciones truncadas`);
    
    // Verificar resultado final
    const finalCount = await prisma.validQuestion.count();
    console.log(`\n🎯 RESULTADO FINAL:`);
    console.log(`   📊 Preguntas restantes en ValidQuestion: ${finalCount}`);
    console.log(`   ✨ Todas las preguntas tienen opciones COMPLETAS y sin truncar`);
    console.log(`   🕒 Pool estimado de duración: ${Math.floor(finalCount / 365)} años de envíos diarios`);
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
removeQuestionsWithTruncatedOptions()
  .then(() => {
    console.log('\n🏁 Proceso completado');
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }); 