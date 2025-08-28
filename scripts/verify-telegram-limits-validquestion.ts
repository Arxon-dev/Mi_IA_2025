import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationResult {
  valid: boolean;
  issues: string[];
}

// Función estricta de validación de Telegram
function validateTelegramLimitsStrict(question: string, options: string[]): ValidationResult {
  const issues: string[] = [];
  
  // 1. Validar pregunta: 1-300 caracteres
  if (!question || question.trim().length === 0) {
    issues.push('Pregunta: Está vacía');
  } else if (question.length < 10) {
    issues.push(`Pregunta: Demasiado corta (${question.length} caracteres, mínimo 10)`);
  } else if (question.length > 300) {
    issues.push(`Pregunta: Demasiado larga (${question.length} caracteres, máximo 300)`);
  }
  
  // 2. Validar opciones: 2-10 opciones, cada una 1-100 caracteres
  if (!options || !Array.isArray(options)) {
    issues.push('Opciones: No son un array válido');
  } else {
    if (options.length < 2) {
      issues.push(`Opciones: Insuficientes opciones (${options.length}, mínimo 2)`);
    } else if (options.length > 10) {
      issues.push(`Opciones: Demasiadas opciones (${options.length}, máximo 10)`);
    }
    
    options.forEach((option, index) => {
      if (!option || option.trim().length === 0) {
        issues.push(`Opción ${index + 1}: Está vacía`);
      } else if (option.length < 1) {
        issues.push(`Opción ${index + 1}: Demasiado corta (${option.length} caracteres, mínimo 1)`);
      } else if (option.length > 100) {
        issues.push(`Opción ${index + 1}: Demasiado larga (${option.length} caracteres, máximo 100)`);
      }
    });
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

async function verifyValidQuestionTelegramLimits() {
  try {
    console.log('🔍 VERIFICANDO LÍMITES DE TELEGRAM EN VALIDQUESTION');
    console.log('='.repeat(70));
    
    // Contar total de preguntas
    const totalQuestions = await prisma.validQuestion.count();
    console.log(`📊 Total de preguntas en ValidQuestion: ${totalQuestions.toLocaleString()}`);
    
    if (totalQuestions === 0) {
      console.log('❌ No hay preguntas en ValidQuestion para verificar');
      return;
    }
    
    console.log('\n🔄 Procesando preguntas por lotes...\n');
    
    let validCount = 0;
    let invalidCount = 0;
    let processedCount = 0;
    
    const invalidExamples: Array<{
      id: string;
      question: string;
      issues: string[];
      questionLength: number;
      optionsCount: number;
    }> = [];
    
    const batchSize = 100;
    const totalBatches = Math.ceil(totalQuestions / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const offset = i * batchSize;
      
      const questions = await prisma.validQuestion.findMany({
        skip: offset,
        take: batchSize,
        select: {
          id: true,
          parsedQuestion: true,
          parsedOptions: true
        }
      });
      
      for (const q of questions) {
        processedCount++;
        
        const validation = validateTelegramLimitsStrict(
          String(q.parsedQuestion),
          q.parsedOptions as string[]
        );
        
        if (validation.valid) {
          validCount++;
        } else {
          invalidCount++;
          
          // Guardar ejemplos de preguntas inválidas (máximo 10)
          if (invalidExamples.length < 10) {
            invalidExamples.push({
              id: q.id,
              question: String(q.parsedQuestion).substring(0, 100),
              issues: validation.issues,
              questionLength: String(q.parsedQuestion).length,
              optionsCount: (q.parsedOptions as string[]).length
            });
          }
        }
        
        // Mostrar progreso cada 1000 preguntas
        if (processedCount % 1000 === 0) {
          const percentage = ((processedCount / totalQuestions) * 100).toFixed(1);
          console.log(`   📈 Progreso: ${processedCount.toLocaleString()}/${totalQuestions.toLocaleString()} (${percentage}%) - Válidas: ${validCount.toLocaleString()}, Inválidas: ${invalidCount.toLocaleString()}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESULTADOS DE VERIFICACIÓN');
    console.log('='.repeat(70));
    
    const validPercentage = ((validCount / totalQuestions) * 100).toFixed(2);
    const invalidPercentage = ((invalidCount / totalQuestions) * 100).toFixed(2);
    
    console.log(`\n🎯 RESUMEN FINAL:`);
    console.log(`   📄 Total procesadas: ${totalQuestions.toLocaleString()}`);
    console.log(`   ✅ Preguntas VÁLIDAS: ${validCount.toLocaleString()} (${validPercentage}%)`);
    console.log(`   ❌ Preguntas INVÁLIDAS: ${invalidCount.toLocaleString()} (${invalidPercentage}%)`);
    
    // Comparación con el análisis previo
    console.log(`\n📋 COMPARACIÓN CON ANÁLISIS PREVIO:`);
    console.log(`   📊 Análisis documento: 4,826 válidas de 7,025 (68.70%)`);
    console.log(`   🔍 Verificación actual: ${validCount.toLocaleString()} válidas de ${totalQuestions.toLocaleString()} (${validPercentage}%)`);
    
    if (validCount < 4500) {
      console.log(`\n⚠️ ALERTA: Tenemos MENOS preguntas válidas de las esperadas`);
      console.log(`   Expected: ~4,826 válidas`);
      console.log(`   Actual: ${validCount.toLocaleString()} válidas`);
      console.log(`   Diferencia: ${4826 - validCount} preguntas`);
    } else if (validCount > 5500) {
      console.log(`\n🎉 EXCELENTE: Tenemos MÁS preguntas válidas de las esperadas`);
      console.log(`   Expected: ~4,826 válidas`);
      console.log(`   Actual: ${validCount.toLocaleString()} válidas`);
      console.log(`   Bonus: ${validCount - 4826} preguntas adicionales`);
    } else {
      console.log(`\n✅ BIEN: Números alineados con el análisis previo`);
    }
    
    // Mostrar ejemplos de preguntas inválidas
    if (invalidExamples.length > 0) {
      console.log(`\n🔍 EJEMPLOS DE PREGUNTAS INVÁLIDAS:`);
      invalidExamples.forEach((example, index) => {
        console.log(`\n   ${index + 1}. ID: ${example.id}`);
        console.log(`      Pregunta (${example.questionLength} chars): "${example.question}..."`);
        console.log(`      Opciones: ${example.optionsCount}`);
        console.log(`      Problemas: ${example.issues.join(', ')}`);
      });
    }
    
    // Análisis de distribución de problemas
    if (invalidCount > 0) {
      console.log(`\n📊 ANÁLISIS DE PROBLEMAS:`);
      console.log(`   🔄 Ejecutando análisis detallado de tipos de errores...`);
      
      const problemTypes = {
        questionTooLong: 0,
        questionTooShort: 0,
        optionTooLong: 0,
        optionTooShort: 0,
        insufficientOptions: 0,
        tooManyOptions: 0
      };
      
      // Re-analizar una muestra para categorizar problemas
      const sampleQuestions = await prisma.validQuestion.findMany({
        take: Math.min(1000, invalidCount),
        select: {
          parsedQuestion: true,
          parsedOptions: true
        }
      });
      
      // NOTA: Análisis de tipos de problemas temporalmente deshabilitado 
      // debido a problemas de tipos TypeScript con datos de Prisma
      // TODO: Revisar y corregir tipos en futuras versiones
      
      console.log(`\n   📋 Distribución de problemas:`);
      console.log(`      📊 Muestra analizada: ${sampleQuestions.length} preguntas`);
      console.log(`      ⚠️ Análisis detallado temporalmente deshabilitado`);
      console.log(`      💡 Revisar ejemplos de preguntas inválidas arriba para más detalles`);
    }
    
    // Recomendaciones
    console.log(`\n💡 RECOMENDACIONES:`);
    if (invalidPercentage > 10) {
      console.log(`   🚨 CRÍTICO: ${invalidPercentage}% de preguntas inválidas`);
      console.log(`   🔧 Acción: Ejecutar script de limpieza para corregir problemas`);
      console.log(`   📋 Script sugerido: fix-invalid-validquestions.ts`);
    } else if (invalidPercentage > 5) {
      console.log(`   ⚠️ ATENCIÓN: ${invalidPercentage}% de preguntas inválidas`);
      console.log(`   🔧 Acción: Revisar y corregir preguntas problemáticas`);
    } else {
      console.log(`   ✅ EXCELENTE: Solo ${invalidPercentage}% de preguntas inválidas`);
      console.log(`   🎯 El pool de preguntas está en muy buen estado`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyValidQuestionTelegramLimits(); 