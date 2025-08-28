import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ParsedQuestion {
  title: string;
  question: string;
  options: string[];
  correctanswerindex: number;
  explanation: string;
}

// Función para decodificar caracteres especiales
function decodeSpecialChars(text: string): string {
  return text
    .replace(/Ã³/g, 'ó')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã­/g, 'í')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ã'/g, 'Ñ')
    .replace(/Ã/g, 'Í')
    .replace(/Ã/g, 'Á')
    .replace(/Ã/g, 'É')
    .replace(/Ã/g, 'Ú')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Función ESTRICTA de validación (sin truncamientos)
function validateTelegramLimitsStrict(parsedData: ParsedQuestion): { valid: boolean; issues: string[] } {
  const issues = [];
  
  // 1. Quiz question: 1-200 caracteres (SIN TRUNCAR)
  if (!parsedData.question || parsedData.question.length < 1 || parsedData.question.length > 200) {
    issues.push(`Pregunta: ${parsedData.question?.length || 0} caracteres (límite: 1-200) - RECHAZADA`);
  }
  
  // 2. Poll options: 1-100 caracteres cada una (SIN TRUNCAR)
  for (let i = 0; i < parsedData.options.length; i++) {
    const option = parsedData.options[i];
    if (!option || option.length < 1 || option.length > 100) {
      issues.push(`Opción ${i + 1}: "${option?.substring(0, 20)}..." (${option?.length || 0} caracteres, límite: 1-100) - RECHAZADA`);
    }
  }
  
  // 3. Mínimo 2 opciones requeridas
  if (parsedData.options.length < 2) {
    issues.push(`Insuficientes opciones: ${parsedData.options.length} (mínimo: 2) - RECHAZADA`);
  }
  
  // 4. Máximo 10 opciones
  if (parsedData.options.length > 10) {
    issues.push(`Demasiadas opciones: ${parsedData.options.length} (máximo: 10) - RECHAZADA`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Función para parsear el formato específico de permanencia (SIN TRUNCAMIENTOS)
function parsePermQuestionStrict(content: string): ParsedQuestion | null {
  try {
    // Decodificar caracteres especiales
    const decodedContent = decodeSpecialChars(content);
    
    // Buscar el patrón del título (entre ::)
    const titleMatch = decodedContent.match(/::(.*?)::/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Buscar el texto de la pregunta principal
    let questionText = '';
    
    // Patrón 1: buscar después del segundo ::
    const questionMatch1 = decodedContent.match(/::[^:]*::[^:]*::([^{]+)\{/);
    if (questionMatch1) {
      questionText = questionMatch1[1].trim();
    } else {
      // Patrón 2: buscar antes de las opciones
      const questionMatch2 = decodedContent.match(/\}\s*([^{]+)\{/);
      if (questionMatch2) {
        questionText = questionMatch2[1].trim();
      } else {
        // Patrón 3: extraer el primer texto coherente
        const lines = decodedContent.split(/[\r\n]+/).map(line => line.trim()).filter(line => line);
        for (const line of lines) {
          if (!line.includes('//') && !line.includes('::') && !line.includes('{') && 
              !line.includes('=') && !line.includes('~') && line.length > 10) {
            questionText = line;
            break;
          }
        }
      }
    }
    
    // Si no encontramos pregunta, buscar en el contenido entre llaves
    if (!questionText) {
      const bracesContent = decodedContent.match(/\{([^}]+)\}/);
      if (bracesContent) {
        const beforeOptions = bracesContent[1].split(/[=~]/)[0];
        if (beforeOptions && beforeOptions.length > 10) {
          questionText = beforeOptions.trim();
        }
      }
    }
    
    // Buscar las opciones (SIN TRUNCAR)
    const options: string[] = [];
    let correctanswerindex = -1;
    
    const bracesMatch = decodedContent.match(/\{([^}]+)\}/);
    if (bracesMatch) {
      const optionsContent = bracesMatch[1];
      
      // Dividir por = y ~ para encontrar las opciones
      const optionLines = optionsContent.split(/(?=[=~])/).filter(line => line.trim());
      
      for (const line of optionLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('=')) {
          // Opción correcta
          let optionText = trimmedLine.substring(1).trim();
          
          // Limpiar texto de la opción (remover retroalimentación)
          const cleanOption = optionText.split('####')[0].trim();
          
          if (cleanOption && cleanOption.length > 0) {
            correctanswerindex = options.length;
            // NO TRUNCAR - mantener texto original
            options.push(cleanOption);
          }
        } else if (trimmedLine.startsWith('~')) {
          // Opción incorrecta
          let optionText = trimmedLine.substring(1).trim();
          
          // Limpiar texto de la opción
          const cleanOption = optionText.split('####')[0].trim();
          
          if (cleanOption && cleanOption.length > 0) {
            // NO TRUNCAR - mantener texto original
            options.push(cleanOption);
          }
        }
      }
    }
    
    // Extraer explicación (SOLO ESTA SE PUEDE TRUNCAR)
    let explanation = '';
    const feedbackMatch = decodedContent.match(/####\s*RETROALIMENTACIÓN[^:]*:(.*?)(?:\}|$)/s);
    if (feedbackMatch) {
      explanation = feedbackMatch[1].trim();
      // SOLO truncar explicación si es muy larga
      if (explanation.length > 200) {
        explanation = explanation.substring(0, 197) + '...';
      }
    } else {
      explanation = 'Respuesta correcta según examen oficial de permanencia';
    }
    
    // Limpiar y validar la pregunta (SIN TRUNCAR)
    if (!questionText || questionText.length < 5) {
      // Intentar extraer de otra forma
      const simpleMatch = decodedContent.match(/([^{:=~]{20,})/);
      if (simpleMatch) {
        questionText = simpleMatch[1].trim();
      }
    }
    
    // NO TRUNCAR LA PREGUNTA - validar que tenemos datos mínimos
    if (!questionText || options.length < 2 || correctanswerindex === -1) {
      return null;
    }
    
    return {
      title: title || 'Pregunta de Permanencia',
      question: questionText, // SIN TRUNCAR
      options, // SIN TRUNCAR
      correctanswerindex,
      explanation // Solo esta se trunca si es necesario
    };
    
  } catch (error) {
    return null;
  }
}

async function rebuildValidQuestionNoTruncate() {
  try {
    console.log('🚀 RECONSTRUYENDO VALIDQUESTION SIN TRUNCAMIENTOS');
    console.log('='.repeat(70));
    
    const backupFile = 'preguntas-Permanencia-top-20250516-1103.txt';
    const backupPath = path.join(process.cwd(), backupFile);
    
    // Verificar que el archivo existe
    try {
      await fs.access(backupPath);
      console.log(`✅ Archivo de backup encontrado: ${backupFile}`);
    } catch (error) {
      console.error(`❌ Archivo de backup no encontrado: ${backupPath}`);
      return;
    }
    
    // Leer archivo
    console.log('📖 Leyendo archivo de backup...');
    const content = await fs.readFile(backupPath, 'utf-8');
    
    console.log('📏 Tamaño del archivo:', content.length.toLocaleString(), 'caracteres');
    
    // Dividir por preguntas usando el patrón específico
    console.log('🔍 Dividiendo contenido por preguntas...');
    const questionBlocks = content.split(/(?=\/\/ question:)/g).filter(block => block.trim() && block.includes('::'));
    
    console.log(`📊 Encontrados ${questionBlocks.length.toLocaleString()} bloques de preguntas`);
    
    // Limpiar tabla ValidQuestion existente
    console.log('🗑️ Limpiando tabla ValidQuestion...');
    await prisma.validQuestion.deleteMany({});
    
    // Contadores detallados
    let validQuestions = 0;
    let invalidQuestions = 0;
    let processedCount = 0;
    
    // Contadores por tipo de problema
    const rejectionReasons = {
      questionTooLong: 0,
      questionTooShort: 0,
      optionTooLong: 0,
      optionTooShort: 0,
      insufficientOptions: 0,
      tooManyOptions: 0,
      parseError: 0
    };
    
    console.log('🔄 Procesando preguntas SIN TRUNCAMIENTOS...\n');
    console.log('📝 POLÍTICA: Solo se aceptan preguntas que cumplan 100% los límites');
    console.log('✂️ TRUNCAMIENTO: Solo se aplica a explicaciones >200 caracteres\n');
    
    // Procesar preguntas por lotes
    const batchSize = 20;
    
    for (let i = 0; i < questionBlocks.length; i += batchSize) {
      const batch = questionBlocks.slice(i, i + batchSize);
      const validBatch = [];
      
      for (const block of batch) {
        processedCount++;
        
        const parsed = parsePermQuestionStrict(block);
        if (parsed) {
          const validation = validateTelegramLimitsStrict(parsed);
          
          if (validation.valid) {
            // Solo insertar preguntas que cumplan 100% los límites
            validBatch.push({
              originalQuestionId: `strict-${processedCount}`,
              content: JSON.stringify({
                title: parsed.title,
                question: parsed.question,
                options: parsed.options,
                correct: parsed.correctanswerindex,
                explanation: parsed.explanation
              }),
              parsedQuestion: parsed.question,
              parsedOptions: parsed.options,
              correctanswerindex: parsed.correctanswerindex,
              parsedExplanation: parsed.explanation,
              parseMethod: 'GIFT-STRICT',
              type: 'multiple_choice',
              difficulty: 'medium',
              bloomLevel: 'Comprensión',
              documentId: 'permanencia-2018-strict',
              sendCount: 0,
              lastsuccessfulsendat: null,
              isactive: true
            });
            validQuestions++;
          } else {
            invalidQuestions++;
            
            // Categorizar motivos de rechazo
            validation.issues.forEach(issue => {
              if (issue.includes('Pregunta:') && issue.includes('200')) {
                if (parsed.question.length > 200) rejectionReasons.questionTooLong++;
                else rejectionReasons.questionTooShort++;
              } else if (issue.includes('Opción') && issue.includes('100')) {
                // Verificar si alguna opción es demasiado larga o corta
                let hasLongOption = false;
                let hasShortOption = false;
                for (const option of parsed.options) {
                  if (option.length > 100) hasLongOption = true;
                  if (option.length < 1) hasShortOption = true;
                }
                if (hasLongOption) rejectionReasons.optionTooLong++;
                if (hasShortOption) rejectionReasons.optionTooShort++;
              } else if (issue.includes('Insuficientes opciones')) {
                rejectionReasons.insufficientOptions++;
              } else if (issue.includes('Demasiadas opciones')) {
                rejectionReasons.tooManyOptions++;
              }
            });
          }
        } else {
          invalidQuestions++;
          rejectionReasons.parseError++;
        }
        
        // Mostrar progreso cada 1000 preguntas
        if (processedCount % 1000 === 0) {
          const percentage = ((processedCount / questionBlocks.length) * 100).toFixed(1);
          console.log(`   📈 Progreso: ${processedCount.toLocaleString()}/${questionBlocks.length.toLocaleString()} (${percentage}%) - Válidas: ${validQuestions.toLocaleString()}, Rechazadas: ${invalidQuestions.toLocaleString()}`);
        }
      }
      
      // Insertar lote de preguntas válidas
      if (validBatch.length > 0) {
        try {
          await prisma.validQuestion.createMany({
            data: validBatch
          });
        } catch (error) {
          console.error(`❌ Error insertando lote ${Math.floor(i / batchSize) + 1}:`, error);
        }
      }
    }
    
    // Verificar inserción final
    const finalCount = await prisma.validQuestion.count();
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESULTADOS DE RECONSTRUCCIÓN ESTRICTA');
    console.log('='.repeat(70));
    
    console.log(`\n🎯 RESUMEN FINAL:`);
    console.log(`   📄 Bloques procesados: ${processedCount.toLocaleString()}`);
    console.log(`   ✅ Preguntas VÁLIDAS (sin truncar): ${validQuestions.toLocaleString()}`);
    console.log(`   ❌ Preguntas RECHAZADAS: ${invalidQuestions.toLocaleString()}`);
    console.log(`   📊 Verificación en BD: ${finalCount.toLocaleString()}`);
    console.log(`   📈 Tasa de aceptación: ${((validQuestions / processedCount) * 100).toFixed(2)}%`);
    
    // Mostrar análisis detallado de rechazos
    console.log(`\n🔍 ANÁLISIS DE RECHAZOS:`);
    console.log(`   📏 Preguntas demasiado largas (>200 chars): ${rejectionReasons.questionTooLong.toLocaleString()}`);
    console.log(`   📏 Preguntas demasiado cortas (<1 char): ${rejectionReasons.questionTooShort.toLocaleString()}`);
    console.log(`   📝 Opciones demasiado largas (>100 chars): ${rejectionReasons.optionTooLong.toLocaleString()}`);
    console.log(`   📝 Opciones demasiado cortas (<1 char): ${rejectionReasons.optionTooShort.toLocaleString()}`);
    console.log(`   📊 Pocas opciones (<2): ${rejectionReasons.insufficientOptions.toLocaleString()}`);
    console.log(`   📊 Muchas opciones (>10): ${rejectionReasons.tooManyOptions.toLocaleString()}`);
    console.log(`   🚫 Errores de parseo: ${rejectionReasons.parseError.toLocaleString()}`);
    
    // Mostrar muestra de preguntas válidas
    if (finalCount > 0) {
      console.log('\n📋 MUESTRA DE PREGUNTAS VÁLIDAS (SIN TRUNCAR):');
      const sampleQuestions = await prisma.validQuestion.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          parsedQuestion: true,
          parsedOptions: true,
          correctanswerindex: true,
          parseMethod: true
        }
      });
      
      sampleQuestions.forEach((q, index) => {
        console.log(`\n   ${index + 1}. [${(q.parsedQuestion as string).length} chars] "${(q.parsedQuestion as string).substring(0, 80)}..."`);
        console.log(`      Opciones: ${(q.parsedOptions as string[]).length}`);
        console.log(`      Longitudes: [${(q.parsedOptions as string[]).map(opt => opt.length).join(', ')}] chars`);
        console.log(`      Respuesta correcta: "${(q.parsedOptions as string[])[q.correctanswerindex].substring(0, 40)}..."`);
      });
    }
    
    console.log(`\n🎯 CONCLUSIÓN:`);
    if (finalCount >= 4000) {
      console.log('🎉 ¡EXCELENTE! Pool robusto de preguntas 100% válidas sin truncamientos');
      console.log('✅ Todas las preguntas mantienen su integridad original');
      console.log('🚀 Sistema listo para producción con calidad garantizada');
    } else if (finalCount >= 2000) {
      console.log('✅ BUENO: Pool aceptable de preguntas válidas sin truncamientos');
      console.log('💡 Considerar ajustar filtros o mejorar datos fuente');
    } else {
      console.log('⚠️ LIMITADO: Pool pequeño pero de alta calidad');
      console.log('🔍 Revisar datos fuente para incrementar preguntas válidas');
    }
    
  } catch (error) {
    console.error('❌ Error durante la reconstrucción:', error);
  } finally {
    await prisma.$disconnect();
  }
}

rebuildValidQuestionNoTruncate(); 