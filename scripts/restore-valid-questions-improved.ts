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

// Función para validar límites de Telegram
function validateTelegramLimits(parsedData: ParsedQuestion): { valid: boolean; issues: string[] } {
  const issues = [];
  
  // Quiz question: 1-200 caracteres
  if (!parsedData.question || parsedData.question.length < 1 || parsedData.question.length > 200) {
    issues.push(`Pregunta: ${parsedData.question?.length || 0} caracteres (límite: 1-200)`);
  }
  
  // Poll options: 1-100 caracteres cada una
  for (let i = 0; i < parsedData.options.length; i++) {
    const option = parsedData.options[i];
    if (!option || option.length < 1 || option.length > 100) {
      issues.push(`Opción ${i + 1}: "${option?.substring(0, 20)}..." (${option?.length || 0} caracteres, límite: 1-100)`);
    }
  }
  
  // Mínimo 2 opciones requeridas
  if (parsedData.options.length < 2) {
    issues.push(`Insuficientes opciones: ${parsedData.options.length} (mínimo: 2)`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Función para parsear el formato específico de permanencia
function parsePermQuestion(content: string): ParsedQuestion | null {
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
    
    // Buscar las opciones
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
            
            // Truncar si es muy largo
            const finalOption = cleanOption.length > 100 ? cleanOption.substring(0, 97) + '...' : cleanOption;
            options.push(finalOption);
          }
        } else if (trimmedLine.startsWith('~')) {
          // Opción incorrecta
          let optionText = trimmedLine.substring(1).trim();
          
          // Limpiar texto de la opción
          const cleanOption = optionText.split('####')[0].trim();
          
          if (cleanOption && cleanOption.length > 0) {
            // Truncar si es muy largo
            const finalOption = cleanOption.length > 100 ? cleanOption.substring(0, 97) + '...' : cleanOption;
            options.push(finalOption);
          }
        }
      }
    }
    
    // Extraer explicación (retroalimentación)
    let explanation = '';
    const feedbackMatch = decodedContent.match(/####\s*RETROALIMENTACIÓN[^:]*:(.*?)(?:\}|$)/s);
    if (feedbackMatch) {
      explanation = feedbackMatch[1].trim();
      // Truncar explicación si es muy larga
      if (explanation.length > 200) {
        explanation = explanation.substring(0, 197) + '...';
      }
    } else {
      explanation = 'Respuesta correcta según examen oficial de permanencia';
    }
    
    // Limpiar y validar la pregunta
    if (!questionText || questionText.length < 5) {
      // Intentar extraer de otra forma
      const simpleMatch = decodedContent.match(/([^{:=~]{20,})/);
      if (simpleMatch) {
        questionText = simpleMatch[1].trim();
      }
    }
    
    // Truncar pregunta si es necesaria
    if (questionText.length > 200) {
      questionText = questionText.substring(0, 197) + '...';
    }
    
    // Validar que tenemos datos mínimos
    if (!questionText || options.length < 2 || correctanswerindex === -1) {
      return null;
    }
    
    return {
      title: title || 'Pregunta de Permanencia',
      question: questionText,
      options,
      correctanswerindex,
      explanation
    };
    
  } catch (error) {
    return null;
  }
}

async function restoreValidQuestionsImproved() {
  try {
    console.log('🚀 RESTAURACIÓN MEJORADA DE PREGUNTAS VÁLIDAS');
    console.log('='.repeat(60));
    
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
    
    // Procesar preguntas por lotes
    const batchSize = 20; // Reducido para mejor seguimiento
    let validQuestions = 0;
    let invalidQuestions = 0;
    let processedCount = 0;
    
    console.log('🔄 Procesando preguntas con parser mejorado...\n');
    
    for (let i = 0; i < questionBlocks.length; i += batchSize) {
      const batch = questionBlocks.slice(i, i + batchSize);
      const validBatch = [];
      
      for (const block of batch) {
        processedCount++;
        
        const parsed = parsePermQuestion(block);
        if (parsed) {
          const validation = validateTelegramLimits(parsed);
          
          if (validation.valid) {
            // Crear registro para ValidQuestion
            validBatch.push({
              originalQuestionId: `perm-${processedCount}`,
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
              parseMethod: 'GIFT-PERM',
              type: 'multiple_choice',
              difficulty: 'medium',
              bloomLevel: 'Comprensión',
              documentId: 'permanencia-2018',
              sendCount: 0,
              lastsuccessfulsendat: null,
              isactive: true
            });
            validQuestions++;
          } else {
            invalidQuestions++;
            
            // Debug: mostrar primeras preguntas inválidas
            if (invalidQuestions <= 5) {
              console.log(`   🔍 Debug - Pregunta inválida ${invalidQuestions}:`);
              console.log(`      Problemas: ${validation.issues.join(', ')}`);
              console.log(`      Pregunta: "${parsed?.question?.substring(0, 50)}..."`);
              console.log(`      Opciones: ${parsed?.options?.length || 0}`);
            }
          }
        } else {
          invalidQuestions++;
        }
        
        // Mostrar progreso cada 100 preguntas
        if (processedCount % 100 === 0) {
          const percentage = ((processedCount / questionBlocks.length) * 100).toFixed(1);
          console.log(`   📈 Progreso: ${processedCount.toLocaleString()}/${questionBlocks.length.toLocaleString()} (${percentage}%) - Válidas: ${validQuestions}`);
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
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DE LA RESTAURACIÓN MEJORADA');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 RESUMEN:`);
    console.log(`   📄 Bloques procesados: ${processedCount.toLocaleString()}`);
    console.log(`   ✅ Preguntas válidas: ${validQuestions.toLocaleString()}`);
    console.log(`   ❌ Preguntas inválidas: ${invalidQuestions.toLocaleString()}`);
    console.log(`   📊 Verificación en BD: ${finalCount.toLocaleString()}`);
    console.log(`   📈 Tasa de éxito: ${((validQuestions / processedCount) * 100).toFixed(2)}%`);
    
    // Mostrar muestra de preguntas válidas
    if (finalCount > 0) {
      console.log('\n📋 MUESTRA DE PREGUNTAS RESTAURADAS:');
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
        console.log(`\n   ${index + 1}. "${q.parsedQuestion.substring(0, 80)}..."`);
        console.log(`      Opciones: ${(q.parsedOptions as string[]).length}`);
        console.log(`      Respuesta correcta: "${(q.parsedOptions as string[])[q.correctanswerindex].substring(0, 40)}..."`);
      });
    }
    
    if (finalCount > 1000) {
      console.log('\n🎉 ¡RESTAURACIÓN MEJORADA EXITOSA!');
      console.log('✅ Tabla ValidQuestion poblada con preguntas de permanencia');
      console.log('🚀 El sistema de gamificación está listo para usar');
    } else {
      console.log('\n⚠️ Restauración completada pero con resultados limitados');
      console.log('🔍 Revisar formato de preguntas o ajustar parser');
    }
    
  } catch (error) {
    console.error('❌ Error durante la restauración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreValidQuestionsImproved(); 