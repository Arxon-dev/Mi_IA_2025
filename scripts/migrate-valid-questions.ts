import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedQuestionData {
  title: string;
  question: string;
  options: string[];
  correctanswerindex: number;
  explanation: string;
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  details: {
    questionLength: number;
    optionsCount: number;
    optionLengths: number[];
    hasCorrectAnswer: boolean;
    parseMethod: 'JSON' | 'GIFT' | 'FAILED';
  };
}

// Función para truncar explicaciones
function truncateExplanation(explanation: string, maxLength: number = 200): string {
  if (!explanation || explanation.length <= maxLength) {
    return explanation || 'Respuesta correcta';
  }
  
  const truncated = explanation.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

// Función completa para parsear GIFT (copiada del análisis)
function parseGiftContent(content: string): ParsedQuestionData | null {
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) return null;
    
    let title = '';
    let questionText = '';
    let optionsText = '';
    let foundOptionsStart = false;
    
    for (const line of lines) {
      if (line.includes('::') && !title) {
        const parts = line.split('::');
        if (parts.length >= 2) {
          title = parts[0].trim();
          const afterTitle = parts.slice(1).join('::').trim();
          if (afterTitle) {
            questionText += ' ' + afterTitle;
          }
        }
        continue;
      }
      
      if (line.includes('{')) {
        foundOptionsStart = true;
        const beforeBrace = line.split('{')[0].trim();
        if (beforeBrace && !questionText) {
          questionText = beforeBrace;
        }
        
        const afterBrace = line.split('{')[1];
        if (afterBrace) {
          optionsText += afterBrace;
        }
        continue;
      }
      
      if (foundOptionsStart) {
        optionsText += ' ' + line;
      } else if (!questionText) {
        questionText += ' ' + line;
      }
    }
    
    questionText = questionText.replace(/\{[^}]*\}/, '').trim();
    
    const options: string[] = [];
    let correctanswerindex = -1;
    let explanation = '';
    
    optionsText = optionsText.replace(/}$/, '');
    
    const explanationMatch = optionsText.match(/####[^~=]*$/);
    if (explanationMatch) {
      explanation = explanationMatch[0].replace(/^####\s*/, '').trim();
      explanation = explanation.replace(/RETROALIMENTACIÓN[^:]*:\s*/i, '');
      explanation = explanation.replace(/Explicación detallada[^:]*:\s*/i, '');
      explanation = explanation.replace(/^\s*-\s*/, '');
      explanation = explanation.replace(/^\n+/, '');
      
      if (explanation.length > 200) {
        explanation = truncateExplanation(explanation);
      } else {
        explanation = explanation.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      }
      
      optionsText = optionsText.replace(/####[^~=]*$/, '');
    }
    
    const optionParts = optionsText.split(/[~=]/).filter(part => part.trim());
    
    for (let i = 0; i < optionParts.length; i++) {
      const part = optionParts[i].trim();
      if (part) {
        if (optionsText.includes('=' + part) && correctanswerindex === -1) {
          correctanswerindex = options.length;
        }
        
        let cleanOption = part.replace(/####.*$/, '').trim();
        
        // NO truncar opciones - dejar que la validación las rechace
        if (cleanOption) {
          options.push(cleanOption);
        }
      }
    }
    
    if (!questionText || options.length < 2 || correctanswerindex === -1) {
      return null;
    }
    
    return {
      title,
      question: questionText,
      options,
      correctanswerindex,
      explanation: explanation || 'Respuesta correcta'
    };
    
  } catch (error) {
    return null;
  }
}

// Función para validar límites de Telegram
function validateTelegramLimits(parsedData: ParsedQuestionData): ValidationResult {
  const issues: string[] = [];
  
  // Validar pregunta: 1-200 caracteres
  if (!parsedData.question || parsedData.question.length < 1 || parsedData.question.length > 200) {
    issues.push(`Pregunta: ${parsedData.question?.length || 0} caracteres (límite: 1-200)`);
  }
  
  // Validar opciones: 1-100 caracteres cada una
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
  
  // Validar respuesta correcta
  if (parsedData.correctanswerindex < 0 || parsedData.correctanswerindex >= parsedData.options.length) {
    issues.push(`Índice de respuesta correcta inválido: ${parsedData.correctanswerindex}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    details: {
      questionLength: parsedData.question?.length || 0,
      optionsCount: parsedData.options.length,
      optionLengths: parsedData.options.map(opt => opt?.length || 0),
      hasCorrectAnswer: parsedData.correctanswerindex >= 0 && parsedData.correctanswerindex < parsedData.options.length,
      parseMethod: 'GIFT'
    }
  };
}

// Función para validar pregunta
function validateQuestion(questionContent: string, questionid: string): ValidationResult {
  // Intentar parsear como JSON primero
  try {
    const jsonData = JSON.parse(questionContent);
    if (jsonData.question && jsonData.options && jsonData.options.length >= 2) {
      const parsedData: ParsedQuestionData = {
        title: jsonData.title || '',
        question: jsonData.question,
        options: jsonData.options,
        correctanswerindex: jsonData.correct || 0,
        explanation: truncateExplanation(jsonData.explanation || 'Respuesta correcta')
      };
      
      const result = validateTelegramLimits(parsedData);
      result.details.parseMethod = 'JSON';
      return result;
    }
  } catch {
    // No es JSON válido, intentar GIFT
  }
  
  // Intentar parsear como GIFT
  const parsedGift = parseGiftContent(questionContent);
  if (parsedGift) {
    return validateTelegramLimits(parsedGift);
  }
  
  // No se pudo parsear
  return {
    isValid: false,
    issues: ['No se pudo parsear el contenido como JSON ni GIFT'],
    details: {
      questionLength: 0,
      optionsCount: 0,
      optionLengths: [],
      hasCorrectAnswer: false,
      parseMethod: 'FAILED'
    }
  };
}

// Función actualizada para parsear contenido
function parseQuestionContent(content: string): ParsedQuestionData | null {
  // Intentar JSON primero
  try {
    const jsonData = JSON.parse(content);
    if (jsonData.question && jsonData.options && jsonData.options.length >= 2) {
      return {
        title: jsonData.title || '',
        question: jsonData.question,
        options: jsonData.options,
        correctanswerindex: jsonData.correct || 0,
        explanation: jsonData.explanation || 'Respuesta correcta'
      };
    }
  } catch {
    // Intentar GIFT
    return parseGiftContent(content);
  }
  
  return null;
}

async function migrateValidQuestions() {
  console.log('🚀 MIGRACIÓN DE PREGUNTAS VÁLIDAS A NUEVA TABLA');
  console.log('='.repeat(60));
  
  let totalProcessed = 0;
  let totalMigrated = 0;
  let errors = 0;
  
  try {
    // Obtener el total para progreso
    const totalQuestions = await prisma.question.count();
    console.log(`📊 Total de preguntas a procesar: ${totalQuestions.toLocaleString()}`);
    
    const batchSize = 100;
    let offset = 0;
    
    // Limpiar tabla destino si existe contenido
    const existingValid = await prisma.validQuestion.count();
    if (existingValid > 0) {
      console.log(`⚠️  Tabla ValidQuestion ya contiene ${existingValid} registros`);
      console.log('🗑️  Limpiando tabla antes de migración...');
      await prisma.validQuestion.deleteMany();
      console.log('✅ Tabla limpiada');
    }
    
    console.log('\n🔄 Iniciando migración por lotes...\n');
    
    while (offset < totalQuestions) {
      // Obtener lote de preguntas
      const questions = await prisma.question.findMany({
        skip: offset,
        take: batchSize,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          content: true,
          type: true,
          difficulty: true,
          bloomLevel: true,
          documentId: true,
          sendCount: true,
          lastsuccessfulsendat: true
        }
      });
      
      const validQuestions = [];
      
      for (const question of questions) {
        totalProcessed++;
        
        // Validar pregunta
        const validation = validateQuestion(question.content, question.id);
        
        if (validation.isValid) {
          // Parsear contenido para extraer datos estructurados
          const parsedData = parseQuestionContent(question.content);
          
          if (parsedData) {
            validQuestions.push({
              originalQuestionId: question.id,
              content: question.content,
              parsedQuestion: parsedData.question,
              parsedOptions: parsedData.options,
              correctanswerindex: parsedData.correctanswerindex,
              parsedExplanation: parsedData.explanation,
              parseMethod: validation.details.parseMethod,
              type: question.type,
              difficulty: question.difficulty,
              bloomLevel: question.bloomLevel,
              documentId: question.documentId,
              sendCount: question.sendCount,
              lastsuccessfulsendat: question.lastsuccessfulsendat,
              isactive: true
            });
          }
        }
        
        // Mostrar progreso cada 1000 preguntas
        if (totalProcessed % 1000 === 0) {
          const percentage = ((totalProcessed / totalQuestions) * 100).toFixed(1);
          console.log(`   📈 Progreso: ${totalProcessed.toLocaleString()}/${totalQuestions.toLocaleString()} (${percentage}%) - Válidas encontradas: ${validQuestions.length + totalMigrated}`);
        }
      }
      
      // Insertar lote de preguntas válidas
      if (validQuestions.length > 0) {
        try {
          await prisma.validQuestion.createMany({
            data: validQuestions
          });
          totalMigrated += validQuestions.length;
        } catch (error) {
          console.error(`❌ Error insertando lote en offset ${offset}:`, error);
          errors++;
        }
      }
      
      offset += batchSize;
    }
    
    // Estadísticas finales
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DE LA MIGRACIÓN');
    console.log('='.repeat(60));
    
    const finalCount = await prisma.validQuestion.count();
    
    console.log(`\n🎯 RESUMEN:`);
    console.log(`   📄 Preguntas procesadas: ${totalProcessed.toLocaleString()}`);
    console.log(`   ✅ Preguntas migradas: ${totalMigrated.toLocaleString()}`);
    console.log(`   📊 Verificación en BD: ${finalCount.toLocaleString()}`);
    console.log(`   ❌ Errores durante migración: ${errors}`);
    console.log(`   📈 Tasa de éxito: ${((totalMigrated / totalProcessed) * 100).toFixed(2)}%`);
    
    // Verificar índices y optimizaciones
    console.log(`\n🔧 VERIFICANDO OPTIMIZACIONES:`);
    
    // Test de consulta rápida
    const startTime = Date.now();
    const testQuery = await prisma.validQuestion.findMany({
      where: { isactive: true },
      orderBy: [
        { sendCount: 'asc' },
        { lastsuccessfulsendat: { sort: 'asc', nulls: 'first' } }
      ],
      take: 10
    });
    const queryTime = Date.now() - startTime;
    
    console.log(`   ⚡ Consulta de test: ${queryTime}ms (10 registros)`);
    console.log(`   📊 Registros disponibles: ${testQuery.length}`);
    
    if (finalCount === totalMigrated && finalCount > 4000) {
      console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('✅ La nueva tabla ValidQuestion está lista para uso');
      console.log('⚡ Rendimiento optimizado para consultas rápidas');
      
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('1. ✅ Migración de Prisma completada');
      console.log('2. ✅ Datos migrados exitosamente');
      console.log('3. ⏳ Actualizar código para usar ValidQuestion');
      console.log('4. ⏳ Probar sistema de envío optimizado');
      console.log('5. ⏳ Monitorear rendimiento mejorado');
    } else {
      console.log('\n⚠️  Migración completada con observaciones');
      console.log('🔍 Revisar logs para posibles problemas');
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para verificar la integridad de la migración
async function verifyMigration() {
  console.log('\n🔍 VERIFICANDO INTEGRIDAD DE LA MIGRACIÓN...');
  
  try {
    const originalValid = await prisma.question.count({
      where: {
        // Simular el filtro que usaría la validación
        archived: false
      }
    });
    
    const migratedCount = await prisma.validQuestion.count({
      where: { isactive: true }
    });
    
    console.log(`📊 Comparación de conteos:`);
    console.log(`   📄 Preguntas originales (no archivadas): ${originalValid.toLocaleString()}`);
    console.log(`   ✅ Preguntas válidas migradas: ${migratedCount.toLocaleString()}`);
    
    // Test de contenido
    const sampleMigrated = await prisma.validQuestion.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (sampleMigrated) {
      console.log(`\n🔍 Muestra de registro migrado:`);
      console.log(`   🆔 ID: ${sampleMigrated.id}`);
      console.log(`   📝 Pregunta: "${sampleMigrated.parsedQuestion.substring(0, 100)}..."`);
      console.log(`   📊 Opciones: ${Array.isArray(sampleMigrated.parsedOptions) ? (sampleMigrated.parsedOptions as string[]).length : 'Error'}`);
      console.log(`   🎯 Método: ${sampleMigrated.parseMethod}`);
      console.log(`   📈 Envíos: ${sampleMigrated.sendCount}`);
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error durante verificación:', error);
  }
}

if (require.main === module) {
  migrateValidQuestions()
    .then(() => verifyMigration())
    .catch(console.error);
}

export { migrateValidQuestions, verifyMigration }; 