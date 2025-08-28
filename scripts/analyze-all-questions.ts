import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedQuestion {
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

interface AnalysisStats {
  total: number;
  valid: number;
  invalid: number;
  failedToParse: number;
  issueBreakdown: {
    [key: string]: number;
  };
  validBySource: {
    questions: number;
    sectionQuestions: number;
  };
  invalidBySource: {
    questions: number;
    sectionQuestions: number;
  };
}

// Función para truncar explicación
function truncateExplanation(explanation: string, maxLength: number = 200): string {
  if (explanation.length <= maxLength) {
    return explanation;
  }
  
  const cleanExplanation = explanation.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (cleanExplanation.length <= maxLength) {
    return cleanExplanation;
  }
  
  const sentences = cleanExplanation.split(/[.!?]/);
  let truncatedExplanation = '';
  
  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    if (cleanSentence && cleanSentence.length > 10) {
      if ((truncatedExplanation + cleanSentence + '.').length <= maxLength - 3) {
        truncatedExplanation += (truncatedExplanation ? ' ' : '') + cleanSentence + '.';
      } else {
        break;
      }
    }
  }
  
  if (truncatedExplanation.length < 30) {
    truncatedExplanation = cleanExplanation.substring(0, maxLength - 3).trim() + '...';
  }
  
  return truncatedExplanation;
}

// Función para parsear contenido GIFT
function parseGiftContent(content: string): ParsedQuestion | null {
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    let title = '';
    let questionStartIndex = 0;
    
    if (lines.length > 0 && !lines[0].includes('{') && !lines[0].includes('::')) {
      title = lines[0];
      questionStartIndex = 1;
    }
    
    let questionText = '';
    let optionsText = '';
    let foundOptionsStart = false;
    
    for (let i = questionStartIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('::') && !foundOptionsStart) {
        const parts = line.split('::');
        if (parts.length > 1) {
          questionText = parts[parts.length - 1].trim();
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
        
        if (cleanOption.length > 95) {
          cleanOption = cleanOption.substring(0, 92) + '...';
        }
        
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
function validateTelegramLimits(parsedData: ParsedQuestion): ValidationResult {
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

// Función para validar una pregunta individual
function validateQuestion(questionContent: string, questionid: string): ValidationResult {
  // Intentar parsear como JSON primero
  try {
    const jsonData = JSON.parse(questionContent);
    if (jsonData.question && jsonData.options && jsonData.options.length >= 2) {
      const parsedData: ParsedQuestion = {
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

// Función principal de análisis
async function analyzeAllQuestions() {
  console.log('🔍 ANÁLISIS COMPLETO DE PREGUNTAS EN BASE DE DATOS');
  console.log('='.repeat(60));
  
  const stats: AnalysisStats = {
    total: 0,
    valid: 0,
    invalid: 0,
    failedToParse: 0,
    issueBreakdown: {},
    validBySource: { questions: 0, sectionQuestions: 0 },
    invalidBySource: { questions: 0, sectionQuestions: 0 }
  };
  
  let processedCount = 0;
  const batchSize = 100;
  const invalidExamples: Array<{id: string, source: string, issues: string[]}> = [];
  
  try {
    // Obtener count total
    const [questionsCount, sectionQuestionsCount] = await Promise.all([
      prisma.question.count(),
      prisma.sectionQuestion.count()
    ]);
    
    stats.total = questionsCount + sectionQuestionsCount;
    console.log(`📊 Total de preguntas a analizar: ${stats.total.toLocaleString()}`);
    console.log(`   📄 Questions: ${questionsCount.toLocaleString()}`);
    console.log(`   📝 SectionQuestions: ${sectionQuestionsCount.toLocaleString()}`);
    console.log('');
    
    // Procesar Questions por lotes
    console.log('🔄 Analizando tabla "Question"...');
    let questionOffset = 0;
    
    while (questionOffset < questionsCount) {
      const questions = await prisma.question.findMany({
        select: { id: true, content: true },
        skip: questionOffset,
        take: batchSize,
        orderBy: { id: 'asc' }
      });
      
      for (const question of questions) {
        const result = validateQuestion(question.content, question.id);
        processedCount++;
        
        if (result.isValid) {
          stats.valid++;
          stats.validBySource.questions++;
        } else {
          stats.invalid++;
          stats.invalidBySource.questions++;
          
          if (result.details.parseMethod === 'FAILED') {
            stats.failedToParse++;
          }
          
          // Guardar ejemplo de error (limitado a 10)
          if (invalidExamples.length < 10) {
            invalidExamples.push({
              id: question.id,
              source: 'Question',
              issues: result.issues
            });
          }
          
          // Contar tipos de errores
          result.issues.forEach(issue => {
            const key = issue.split(':')[0];
            stats.issueBreakdown[key] = (stats.issueBreakdown[key] || 0) + 1;
          });
        }
        
        // Mostrar progreso cada 1000 registros
        if (processedCount % 1000 === 0) {
          const percentage = ((processedCount / stats.total) * 100).toFixed(1);
          console.log(`   📈 Progreso: ${processedCount.toLocaleString()}/${stats.total.toLocaleString()} (${percentage}%)`);
        }
      }
      
      questionOffset += batchSize;
    }
    
    // Procesar SectionQuestions por lotes
    console.log('🔄 Analizando tabla "SectionQuestion"...');
    let sectionOffset = 0;
    
    while (sectionOffset < sectionQuestionsCount) {
      const sectionQuestions = await prisma.sectionQuestion.findMany({
        select: { id: true, content: true },
        skip: sectionOffset,
        take: batchSize,
        orderBy: { id: 'asc' }
      });
      
      for (const sectionQuestion of sectionQuestions) {
        const result = validateQuestion(sectionQuestion.content, sectionQuestion.id);
        processedCount++;
        
        if (result.isValid) {
          stats.valid++;
          stats.validBySource.sectionQuestions++;
        } else {
          stats.invalid++;
          stats.invalidBySource.sectionQuestions++;
          
          if (result.details.parseMethod === 'FAILED') {
            stats.failedToParse++;
          }
          
          // Guardar ejemplo de error (limitado a 10)
          if (invalidExamples.length < 10) {
            invalidExamples.push({
              id: sectionQuestion.id,
              source: 'SectionQuestion',
              issues: result.issues
            });
          }
          
          // Contar tipos de errores
          result.issues.forEach(issue => {
            const key = issue.split(':')[0];
            stats.issueBreakdown[key] = (stats.issueBreakdown[key] || 0) + 1;
          });
        }
        
        // Mostrar progreso cada 1000 registros
        if (processedCount % 1000 === 0) {
          const percentage = ((processedCount / stats.total) * 100).toFixed(1);
          console.log(`   📈 Progreso: ${processedCount.toLocaleString()}/${stats.total.toLocaleString()} (${percentage}%)`);
        }
      }
      
      sectionOffset += batchSize;
    }
    
    // Mostrar resultados finales
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DEL ANÁLISIS COMPLETO');
    console.log('='.repeat(60));
    
    const validPercentage = ((stats.valid / stats.total) * 100).toFixed(2);
    const invalidPercentage = ((stats.invalid / stats.total) * 100).toFixed(2);
    
    console.log(`\n🎯 RESUMEN GENERAL:`);
    console.log(`   📊 Total procesadas: ${stats.total.toLocaleString()}`);
    console.log(`   ✅ Válidas: ${stats.valid.toLocaleString()} (${validPercentage}%)`);
    console.log(`   ❌ Inválidas: ${stats.invalid.toLocaleString()} (${invalidPercentage}%)`);
    console.log(`   🚫 No parseables: ${stats.failedToParse.toLocaleString()}`);
    
    console.log(`\n📄 DESGLOSE POR FUENTE:`);
    console.log(`   Questions válidas: ${stats.validBySource.questions.toLocaleString()}`);
    console.log(`   Questions inválidas: ${stats.invalidBySource.questions.toLocaleString()}`);
    console.log(`   SectionQuestions válidas: ${stats.validBySource.sectionQuestions.toLocaleString()}`);
    console.log(`   SectionQuestions inválidas: ${stats.invalidBySource.sectionQuestions.toLocaleString()}`);
    
    console.log(`\n🐛 TIPOS DE ERRORES MÁS FRECUENTES:`);
    const sortedIssues = Object.entries(stats.issueBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    sortedIssues.forEach(([issue, count]) => {
      const percentage = ((count / stats.invalid) * 100).toFixed(1);
      console.log(`   • ${issue}: ${count.toLocaleString()} (${percentage}%)`);
    });
    
    console.log(`\n🔍 EJEMPLOS DE PREGUNTAS INVÁLIDAS:`);
    invalidExamples.forEach((example, index) => {
      console.log(`\n   ${index + 1}. ID: ${example.id} (${example.source})`);
      example.issues.forEach(issue => {
        console.log(`      • ${issue}`);
      });
    });
    
    console.log(`\n💡 CRITERIOS DE VALIDACIÓN APLICADOS:`);
    console.log(`   • Pregunta: 1-200 caracteres`);
    console.log(`   • Opciones: 1-100 caracteres cada una`);
    console.log(`   • Mínimo: 2 opciones por pregunta`);
    console.log(`   • Respuesta correcta: debe tener índice válido`);
    console.log(`   • Formato: JSON o GIFT parseable`);
    
    console.log(`\n✅ ANÁLISIS COMPLETADO EXITOSAMENTE`);
    console.log(`🎯 ${stats.valid.toLocaleString()} preguntas están listas para enviarse a Telegram`);
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar análisis
if (require.main === module) {
  analyzeAllQuestions().catch(console.error);
}

export { analyzeAllQuestions, validateQuestion }; 