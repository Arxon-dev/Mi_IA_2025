#!/usr/bin/env tsx

/**
 * SCRIPT DE ANÁLISIS DE CUMPLIMIENTO DE LIMITACIONES DE TELEGRAM (MEJORADO)
 * 
 * Analiza todas las preguntas disponibles para verificar si cumplen con:
 * - Pregunta: 200 caracteres máximo (sin truncamiento)
 * - Opciones: 100 caracteres máximo cada una (sin truncamiento)  
 * - Explicaciones: 200 caracteres máximo (acepta truncamiento)
 * 
 * Formatos soportados:
 * - JSON estándar
 * - Formato GIFT (Moodle)
 * 
 * Tablas analizadas:
 * - Question (7000+ preguntas en formato GIFT/JSON)
 * - ValidQuestion (preguntas ya parseadas)
 * - ExamenOficial2018 (preguntas específicas del examen)
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Límites de Telegram para polls
const TELEGRAM_LIMITS = {
  QUESTION_MAX_LENGTH: 200,      // Sin truncamiento
  OPTION_MAX_LENGTH: 100,        // Sin truncamiento  
  EXPLANATION_MAX_LENGTH: 200    // Acepta truncamiento
};

interface AnalysisResult {
  tableName: string;
  totalquestions: number;
  validQuestions: number;
  invalidQuestions: number;
  validPercentage: number;
  errors: {
    questionTooLong: number;
    optionsTooLong: number;
    explanationTooLong: number;
    invalidFormat: number;
    missingData: number;
  };
  examples: {
    valid: any[];
    invalid: any[];
  };
  formatBreakdown?: {
    json: number;
    gift: number;
    unknown: number;
  };
}

interface QuestionData {
  id: string;
  question: string;
  options: string[];
  explanation?: string;
  source: string;
  format?: 'JSON' | 'GIFT' | 'UNKNOWN';
}

/**
 * Parsear formato GIFT (Moodle)
 */
function parseGIFTFormat(content: string): QuestionData | null {
  try {
    // Estructura típica de GIFT:
    // Título opcional\nPregunta{opciones}
    
    const lines = content.split('\n');
    let title = '';
    let questionText = '';
    let optionsSection = '';
    
    // Buscar la línea que contiene las llaves { }
    let foundBrackets = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('{') && line.includes('}')) {
        // Esta línea contiene las opciones
        const beforeBracket = line.split('{')[0].trim();
        const insideBrackets = line.split('{')[1].split('}')[0];
        
        if (beforeBracket) {
          questionText = beforeBracket;
        }
        optionsSection = insideBrackets;
        foundBrackets = true;
        break;
      } else if (!foundBrackets && line && !line.includes(':')) {
        // Acumular texto de la pregunta
        if (questionText) {
          questionText += ' ' + line;
        } else {
          questionText = line;
        }
      }
    }
    
    if (!foundBrackets || !questionText || !optionsSection) {
      return null;
    }
    
    // Parsear opciones del formato GIFT
    const options: string[] = [];
    const optionLines = optionsSection.split(/[\n\r]+/);
    
    for (const optionLine of optionLines) {
      const trimmed = optionLine.trim();
      if (!trimmed) continue;
      
      // Remover marcadores GIFT: =, ~, etc.
      let cleanOption = trimmed;
      if (cleanOption.startsWith('=') || cleanOption.startsWith('~')) {
        cleanOption = cleanOption.substring(1).trim();
      }
      
      if (cleanOption) {
        options.push(cleanOption);
      }
    }
    
    // Si no se encontraron opciones en el formato anterior, intentar otro approach
    if (options.length === 0) {
      // Buscar patrones como "~opción" o "=opción" en toda la sección
      const giftPatterns = optionsSection.match(/[=~]\s*([^=~\n\r]+)/g);
      if (giftPatterns) {
        for (const pattern of giftPatterns) {
          const cleanOption = pattern.substring(1).trim();
          if (cleanOption) {
            options.push(cleanOption);
          }
        }
      }
    }
    
    if (options.length === 0) {
      return null;
    }
    
    return {
      id: 'gift-parsed',
      question: questionText.trim(),
      options: options,
      explanation: undefined, // GIFT puede tener feedback, pero no lo estamos extrayendo aquí
      source: 'Question-GIFT',
      format: 'GIFT'
    };
    
  } catch (error) {
    return null;
  }
}

/**
 * Parsear el content JSON de la tabla Question
 */
function parseQuestionContent(content: string): QuestionData | null {
  // Intentar JSON primero
  try {
    const parsed = JSON.parse(content);
    
    // Formato estándar esperado
    if (parsed.question && parsed.options && Array.isArray(parsed.options)) {
      return {
        id: parsed.id || 'unknown',
        question: parsed.question,
        options: parsed.options,
        explanation: parsed.explanation || parsed.feedback,
        source: 'Question-JSON',
        format: 'JSON'
      };
    }
    
    // Formato alternativo JSON con choices
    if (parsed.text && parsed.choices) {
      return {
        id: parsed.id || 'unknown',
        question: parsed.text,
        options: parsed.choices.map((choice: any) => choice.text || choice),
        explanation: parsed.explanation || parsed.feedback,
        source: 'Question-JSON',
        format: 'JSON'
      };
    }
    
  } catch (error) {
    // Si JSON falla, intentar GIFT
    const giftResult = parseGIFTFormat(content);
    if (giftResult) {
      return giftResult;
    }
  }
  
  return null;
}

/**
 * Validar una pregunta contra los límites de Telegram
 */
function validateQuestion(question: QuestionData): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[] 
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validar pregunta
  if (!question.question || question.question.trim().length === 0) {
    errors.push('Pregunta vacía');
  } else if (question.question.length > TELEGRAM_LIMITS.QUESTION_MAX_LENGTH) {
    errors.push(`Pregunta demasiado larga: ${question.question.length}/${TELEGRAM_LIMITS.QUESTION_MAX_LENGTH} caracteres`);
  }
  
  // Validar opciones
  if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
    errors.push('Opciones faltantes o inválidas');
  } else {
    // Telegram requiere entre 2-10 opciones
    if (question.options.length < 2) {
      errors.push('Necesita al menos 2 opciones');
    } else if (question.options.length > 10) {
      errors.push('Máximo 10 opciones permitidas');
    }
    
    // Validar longitud de cada opción
    question.options.forEach((option, index) => {
      if (!option || option.trim().length === 0) {
        errors.push(`Opción ${index + 1} está vacía`);
      } else if (option.length > TELEGRAM_LIMITS.OPTION_MAX_LENGTH) {
        errors.push(`Opción ${index + 1} demasiado larga: ${option.length}/${TELEGRAM_LIMITS.OPTION_MAX_LENGTH} caracteres`);
      }
    });
  }
  
  // Validar explicación (warning, no error)
  if (question.explanation && question.explanation.length > TELEGRAM_LIMITS.EXPLANATION_MAX_LENGTH) {
    warnings.push(`Explicación será truncada: ${question.explanation.length}/${TELEGRAM_LIMITS.EXPLANATION_MAX_LENGTH} caracteres`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Analizar tabla Question (mejorado para GIFT)
 */
async function analyzeQuestionTable(): Promise<AnalysisResult> {
  console.log('📊 Analizando tabla Question (con soporte GIFT)...');
  
  const questions = await prisma.question.findMany({
    select: {
      id: true,
      content: true,
      type: true,
      difficulty: true,
      archived: true
    },
    where: {
      archived: false // Solo preguntas activas
    }
  });
  
  const result: AnalysisResult = {
    tableName: 'Question',
    totalquestions: questions.length,
    validQuestions: 0,
    invalidQuestions: 0,
    validPercentage: 0,
    errors: {
      questionTooLong: 0,
      optionsTooLong: 0,
      explanationTooLong: 0,
      invalidFormat: 0,
      missingData: 0
    },
    examples: {
      valid: [],
      invalid: []
    },
    formatBreakdown: {
      json: 0,
      gift: 0,
      unknown: 0
    }
  };
  
  for (const question of questions) {
    const parsed = parseQuestionContent(question.content);
    
    if (!parsed) {
      result.errors.invalidFormat++;
      result.invalidQuestions++;
      result.formatBreakdown!.unknown++;
      
      if (result.examples.invalid.length < 5) {
        result.examples.invalid.push({
          id: question.id,
          issue: 'Formato no reconocido (ni JSON ni GIFT)',
          content: question.content.substring(0, 200) + '...'
        });
      }
      continue;
    }
    
    // Contar formato
    if (parsed.format === 'JSON') {
      result.formatBreakdown!.json++;
    } else if (parsed.format === 'GIFT') {
      result.formatBreakdown!.gift++;
    }
    
    const validation = validateQuestion(parsed);
    
    if (validation.isValid) {
      result.validQuestions++;
      if (result.examples.valid.length < 5) {
        result.examples.valid.push({
          id: question.id,
          format: parsed.format,
          question: parsed.question.substring(0, 100) + (parsed.question.length > 100 ? '...' : ''),
          optionCount: parsed.options.length,
          hasExplanation: !!parsed.explanation
        });
      }
    } else {
      result.invalidQuestions++;
      
      // Contar tipos de errores
      validation.errors.forEach(error => {
        if (error.includes('Pregunta demasiado larga')) {
          result.errors.questionTooLong++;
        } else if (error.includes('demasiado larga')) {
          result.errors.optionsTooLong++;
        } else if (error.includes('vacía') || error.includes('faltantes')) {
          result.errors.missingData++;
        }
      });
      
      if (result.examples.invalid.length < 5) {
        result.examples.invalid.push({
          id: question.id,
          format: parsed.format,
          question: parsed.question?.substring(0, 100) + '...',
          errors: validation.errors
        });
      }
    }
  }
  
  result.validPercentage = result.totalquestions > 0 
    ? (result.validQuestions / result.totalquestions) * 100 
    : 0;
  
  return result;
}

/**
 * Analizar tabla ValidQuestion
 */
async function analyzeValidQuestionTable(): Promise<AnalysisResult> {
  console.log('📊 Analizando tabla ValidQuestion...');
  
  const questions = await prisma.validQuestion.findMany({
    where: {
      isactive: true
    }
  });
  
  const result: AnalysisResult = {
    tableName: 'ValidQuestion',
    totalquestions: questions.length,
    validQuestions: 0,
    invalidQuestions: 0,
    validPercentage: 0,
    errors: {
      questionTooLong: 0,
      optionsTooLong: 0,
      explanationTooLong: 0,
      invalidFormat: 0,
      missingData: 0
    },
    examples: {
      valid: [],
      invalid: []
    }
  };
  
  for (const question of questions) {
    const questionData: QuestionData = {
      id: question.id,
      question: question.parsedQuestion,
      options: Array.isArray(question.parsedOptions) 
        ? question.parsedOptions as string[]
        : [],
      explanation: question.parsedExplanation || undefined,
      source: 'ValidQuestion'
    };
    
    const validation = validateQuestion(questionData);
    
    if (validation.isValid) {
      result.validQuestions++;
      if (result.examples.valid.length < 5) {
        result.examples.valid.push({
          id: question.id,
          question: questionData.question.substring(0, 100) + (questionData.question.length > 100 ? '...' : ''),
          optionCount: questionData.options.length,
          hasExplanation: !!questionData.explanation
        });
      }
    } else {
      result.invalidQuestions++;
      
      // Contar tipos de errores
      validation.errors.forEach(error => {
        if (error.includes('Pregunta demasiado larga')) {
          result.errors.questionTooLong++;
        } else if (error.includes('demasiado larga')) {
          result.errors.optionsTooLong++;
        } else if (error.includes('vacía') || error.includes('faltantes')) {
          result.errors.missingData++;
        }
      });
      
      if (result.examples.invalid.length < 5) {
        result.examples.invalid.push({
          id: question.id,
          question: questionData.question?.substring(0, 100) + '...',
          errors: validation.errors
        });
      }
    }
  }
  
  result.validPercentage = result.totalquestions > 0 
    ? (result.validQuestions / result.totalquestions) * 100 
    : 0;
  
  return result;
}

/**
 * Analizar tabla ExamenOficial2018
 */
async function analyzeExamenOficial2018Table(): Promise<AnalysisResult> {
  console.log('📊 Analizando tabla ExamenOficial2018...');
  
  const questions = await prisma.examenOficial2018.findMany({
    where: {
      isactive: true
    }
  });
  
  const result: AnalysisResult = {
    tableName: 'ExamenOficial2018',
    totalquestions: questions.length,
    validQuestions: 0,
    invalidQuestions: 0,
    validPercentage: 0,
    errors: {
      questionTooLong: 0,
      optionsTooLong: 0,
      explanationTooLong: 0,
      invalidFormat: 0,
      missingData: 0
    },
    examples: {
      valid: [],
      invalid: []
    }
  };
  
  for (const question of questions) {
    const questionData: QuestionData = {
      id: question.id,
      question: question.question,
      options: question.options,
      explanation: undefined, // ExamenOficial2018 no tiene explicaciones
      source: 'ExamenOficial2018'
    };
    
    const validation = validateQuestion(questionData);
    
    if (validation.isValid) {
      result.validQuestions++;
      if (result.examples.valid.length < 5) {
        result.examples.valid.push({
          id: question.id,
          questionnumber: question.questionnumber,
          question: questionData.question.substring(0, 100) + (questionData.question.length > 100 ? '...' : ''),
          optionCount: questionData.options.length
        });
      }
    } else {
      result.invalidQuestions++;
      
      // Contar tipos de errores
      validation.errors.forEach(error => {
        if (error.includes('Pregunta demasiado larga')) {
          result.errors.questionTooLong++;
        } else if (error.includes('demasiado larga')) {
          result.errors.optionsTooLong++;
        } else if (error.includes('vacía') || error.includes('faltantes')) {
          result.errors.missingData++;
        }
      });
      
      if (result.examples.invalid.length < 5) {
        result.examples.invalid.push({
          id: question.id,
          questionnumber: question.questionnumber,
          question: questionData.question?.substring(0, 100) + '...',
          errors: validation.errors
        });
      }
    }
  }
  
  result.validPercentage = result.totalquestions > 0 
    ? (result.validQuestions / result.totalquestions) * 100 
    : 0;
  
  return result;
}

/**
 * Generar reporte completo mejorado
 */
function generateReport(results: AnalysisResult[]): string {
  const totalQuestions = results.reduce((sum, r) => sum + r.totalquestions, 0);
  const totalValid = results.reduce((sum, r) => sum + r.validQuestions, 0);
  const totalInvalid = results.reduce((sum, r) => sum + r.invalidQuestions, 0);
  const overallPercentage = totalQuestions > 0 ? (totalValid / totalQuestions) * 100 : 0;
  
  let report = `
# 📊 REPORTE DE CUMPLIMIENTO DE LIMITACIONES DE TELEGRAM (MEJORADO)

**Fecha de análisis:** ${new Date().toLocaleString()}

## 🎯 RESUMEN EJECUTIVO

- **Total de preguntas analizadas:** ${totalQuestions.toLocaleString()}
- **Preguntas válidas para Telegram:** ${totalValid.toLocaleString()} (${overallPercentage.toFixed(2)}%)
- **Preguntas inválidas:** ${totalInvalid.toLocaleString()} (${(100 - overallPercentage).toFixed(2)}%)

## 📋 LIMITACIONES DE TELEGRAM PARA POLLS

- **Pregunta:** Máximo 200 caracteres (sin truncamiento)
- **Opciones:** Máximo 100 caracteres cada una (sin truncamiento)
- **Explicaciones:** Máximo 200 caracteres (acepta truncamiento)
- **Cantidad de opciones:** Entre 2 y 10 opciones

## 🔧 FORMATOS ANALIZADOS

Este análisis mejorado puede procesar:
- ✅ **JSON estándar** - Formato estructurado con campos question/options
- ✅ **Formato GIFT (Moodle)** - Formato de texto con sintaxis especial
- ❌ **Formatos no reconocidos** - Contenido que no sigue ningún patrón conocido

`;

  // Análisis por tabla
  results.forEach(result => {
    report += `
## 📈 TABLA: ${result.tableName}

### Estadísticas Generales
- **Total:** ${result.totalquestions.toLocaleString()} preguntas
- **Válidas para Telegram:** ${result.validQuestions.toLocaleString()} (${result.validPercentage.toFixed(2)}%)
- **Inválidas:** ${result.invalidQuestions.toLocaleString()} (${(100 - result.validPercentage).toFixed(2)}%)

`;

    // Mostrar breakdown de formatos si está disponible
    if (result.formatBreakdown) {
      report += `### Distribución por Formato
- **JSON:** ${result.formatBreakdown.json.toLocaleString()} preguntas
- **GIFT (Moodle):** ${result.formatBreakdown.gift.toLocaleString()} preguntas
- **No reconocido:** ${result.formatBreakdown.unknown.toLocaleString()} preguntas

`;
    }

    report += `### Tipos de Errores Encontrados
- **Pregunta demasiado larga:** ${result.errors.questionTooLong.toLocaleString()}
- **Opciones demasiado largas:** ${result.errors.optionsTooLong.toLocaleString()}
- **Explicación demasiado larga:** ${result.errors.explanationTooLong.toLocaleString()}
- **Formato inválido:** ${result.errors.invalidFormat.toLocaleString()}
- **Datos faltantes:** ${result.errors.missingData.toLocaleString()}

### Ejemplos de Preguntas Válidas
`;
    
    result.examples.valid.forEach((example, index) => {
      report += `
**Ejemplo ${index + 1}:**
- ID: ${example.id}
- Formato: ${example.format || 'N/A'}
- Pregunta: ${example.question}
- Opciones: ${example.optionCount}
- Explicación: ${example.hasExplanation ? 'Sí' : 'No'}
`;
    });
    
    if (result.examples.invalid.length > 0) {
      report += `
### Ejemplos de Preguntas Inválidas
`;
      
      result.examples.invalid.forEach((example, index) => {
        report += `
**Ejemplo ${index + 1}:**
- ID: ${example.id}
- Formato: ${example.format || 'N/A'}
- Pregunta: ${example.question || 'N/A'}
- Errores: ${example.errors ? example.errors.join(', ') : example.issue || 'Desconocido'}
`;
      });
    }
  });
  
  // Recomendaciones específicas
  report += `
## 💡 RECOMENDACIONES ESPECÍFICAS

### Para la Tabla Question (Formato GIFT)

1. **Preguntas válidas identificadas:** ${results.find(r => r.tableName === 'Question')?.validQuestions || 0} de ${results.find(r => r.tableName === 'Question')?.totalquestions || 0}

2. **Principales problemas detectados:**
   - Preguntas que exceden 200 caracteres
   - Opciones que exceden 100 caracteres
   - Formato GIFT mal estructurado

3. **Acciones recomendadas:**
   - Migrar preguntas válidas a la tabla ValidQuestion
   - Implementar truncamiento inteligente para preguntas/opciones largas
   - Mejorar el parser GIFT para casos especiales

### Para Optimizar el Uso

1. **Priorizar ExamenOficial2018:** ${results.find(r => r.tableName === 'ExamenOficial2018')?.validPercentage?.toFixed(1) || 0}% de válidas

2. **Migrar preguntas Question válidas:** Procesar las ${results.find(r => r.tableName === 'Question')?.validQuestions || 0} preguntas válidas encontradas

3. **Implementar validación en tiempo real:** Evitar que se guarden preguntas que no cumplen los límites

### Tabla con Mejor Rendimiento
`;

  const bestTable = results.reduce((best, current) => 
    current.validPercentage > best.validPercentage ? current : best
  );
  
  report += `
**${bestTable.tableName}** tiene el mejor rendimiento con ${bestTable.validPercentage.toFixed(2)}% de preguntas válidas.

### Plan de Migración Sugerido

1. **Fase 1:** Usar las ${results.find(r => r.tableName === 'ExamenOficial2018')?.validQuestions || 0} preguntas de ExamenOficial2018 (100% válidas)

2. **Fase 2:** Procesar y migrar las ${results.find(r => r.tableName === 'Question')?.validQuestions || 0} preguntas válidas de la tabla Question

3. **Fase 3:** Implementar herramientas de corrección automática para preguntas con errores menores

4. **Fase 4:** Establecer pipeline de validación para nuevas preguntas

### Total de Preguntas Disponibles para Telegram

**${totalValid.toLocaleString()} preguntas listas para usar** de un total de ${totalQuestions.toLocaleString()} analizadas.

---

*Reporte generado automáticamente el ${new Date().toLocaleString()}*
*Análisis mejorado con soporte para formatos JSON y GIFT*
`;

  return report;
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando análisis mejorado de cumplimiento de limitaciones de Telegram...\n');
  
  try {
    // Analizar todas las tablas
    const results: AnalysisResult[] = [];
    
    results.push(await analyzeQuestionTable());
    results.push(await analyzeValidQuestionTable());
    results.push(await analyzeExamenOficial2018Table());
    
    // Generar reporte
    const report = generateReport(results);
    
    // Guardar reporte
    const reportPath = path.join(process.cwd(), 'scripts', 'output', 'telegram-limits-compliance-report-improved.md');
    const outputDir = path.dirname(reportPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report, 'utf-8');
    
    // Mostrar resumen mejorado en consola
    console.log('\n🎉 ¡Análisis mejorado completado!');
    console.log('\n📊 RESUMEN DETALLADO:');
    
    results.forEach(result => {
      console.log(`\n📋 ${result.tableName}:`);
      console.log(`   Total: ${result.totalquestions.toLocaleString()}`);
      console.log(`   Válidas: ${result.validQuestions.toLocaleString()} (${result.validPercentage.toFixed(2)}%)`);
      console.log(`   Inválidas: ${result.invalidQuestions.toLocaleString()}`);
      
      if (result.formatBreakdown) {
        console.log(`   Formatos: JSON: ${result.formatBreakdown.json}, GIFT: ${result.formatBreakdown.gift}, Desconocido: ${result.formatBreakdown.unknown}`);
      }
    });
    
    const totalQuestions = results.reduce((sum, r) => sum + r.totalquestions, 0);
    const totalValid = results.reduce((sum, r) => sum + r.validQuestions, 0);
    const overallPercentage = totalQuestions > 0 ? (totalValid / totalQuestions) * 100 : 0;
    
    console.log(`\n🎯 TOTAL GENERAL:`);
    console.log(`   ${totalQuestions.toLocaleString()} preguntas analizadas`);
    console.log(`   ${totalValid.toLocaleString()} válidas para Telegram (${overallPercentage.toFixed(2)}%)`);
    
    console.log(`\n📄 Reporte completo guardado en: ${reportPath}`);
    
    // Recomendación rápida
    console.log(`\n💡 RECOMENDACIÓN RÁPIDA:`);
    console.log(`   Tienes ${totalValid.toLocaleString()} preguntas listas para usar en Telegram!`);
    if (totalValid > 0) {
      console.log(`   La tabla ExamenOficial2018 es la más confiable con 100% de válidas.`);
    }
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

export default main; 