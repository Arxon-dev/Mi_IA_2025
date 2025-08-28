import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface QuestionExample {
  id: string;
  content: string;
  issue: string;
  originalLength?: number;
  proposedSolution?: string;
}

// Función para truncar preguntas inteligentemente
function smartTruncateQuestion(question: string, maxLength: number = 195): string {
  if (question.length <= maxLength) return question;
  
  // Buscar el último punto, interrogación o exclamación antes del límite
  const punctuationRegex = /[.!?]/g;
  let lastPunctuation = -1;
  let match;
  
  while ((match = punctuationRegex.exec(question)) !== null) {
    if (match.index <= maxLength - 5) { // Dejar espacio para "..."
      lastPunctuation = match.index;
    } else {
      break;
    }
  }
  
  if (lastPunctuation > maxLength / 2) { // Si encontramos un punto razonable
    return question.substring(0, lastPunctuation + 1);
  }
  
  // Buscar último espacio antes del límite
  const lastSpace = question.lastIndexOf(' ', maxLength - 3);
  if (lastSpace > maxLength / 2) {
    return question.substring(0, lastSpace) + '...';
  }
  
  // Truncamiento forzado
  return question.substring(0, maxLength - 3) + '...';
}

// Función para intentar reparar contenido no parseable
function attemptContentRepair(content: string): { repaired: boolean; newContent: string } {
  try {
    // Limpiar caracteres problemáticos
    let cleaned = content
      .replace(/\u0000/g, '') // Null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Caracteres de control
      .replace(/\r\n/g, '\n') // Normalizar saltos de línea
      .trim();
    
    // Intentar reparar JSON mal formado
    if (cleaned.includes('{') && cleaned.includes('}')) {
      // Intentar agregar llaves faltantes
      if (!cleaned.startsWith('{')) cleaned = '{' + cleaned;
      if (!cleaned.endsWith('}')) cleaned = cleaned + '}';
      
      try {
        JSON.parse(cleaned);
        return { repaired: true, newContent: cleaned };
      } catch {
        // JSON no reparable
      }
    }
    
    // Intentar reparar formato GIFT
    if (cleaned.includes('::') || cleaned.includes('{')) {
      // Asegurar que haya estructura básica GIFT
      if (!cleaned.includes('::') && cleaned.includes('{')) {
        cleaned = 'Pregunta:: ' + cleaned;
      }
      
      return { repaired: true, newContent: cleaned };
    }
    
    return { repaired: false, newContent: content };
  } catch {
    return { repaired: false, newContent: content };
  }
}

async function examineInvalidQuestions() {
  console.log('🔍 EXAMEN DETALLADO DE PREGUNTAS INVÁLIDAS');
  console.log('='.repeat(50));
  
  try {
    // Obtener muestra de preguntas inválidas de diferentes tipos
    const longQuestions = await prisma.question.findMany({
      select: { id: true, content: true },
      take: 5,
      orderBy: { id: 'asc' }
    });
    
    const examples: QuestionExample[] = [];
    
    console.log('🔍 Analizando muestra de preguntas...\n');
    
    for (const question of longQuestions) {
      try {
        // Intentar parsear como JSON
        const jsonData = JSON.parse(question.content);
        if (jsonData.question) {
          const questionText = jsonData.question;
          
          if (questionText.length > 200) {
            const truncated = smartTruncateQuestion(questionText);
            examples.push({
              id: question.id,
              content: questionText,
              issue: `Pregunta demasiado larga (${questionText.length} caracteres)`,
              originalLength: questionText.length,
              proposedSolution: `Truncar a: "${truncated}" (${truncated.length} caracteres)`
            });
          }
        }
      } catch {
        // Intentar como GIFT o problema de parsing
        const repairAttempt = attemptContentRepair(question.content);
        
        examples.push({
          id: question.id,
          content: question.content.substring(0, 200) + '...', // Preview
          issue: 'No se puede parsear como JSON ni GIFT',
          proposedSolution: repairAttempt.repaired 
            ? `Contenido reparado disponible`
            : 'Requiere revisión manual o regeneración'
        });
      }
      
      if (examples.length >= 10) break; // Limitar ejemplos
    }
    
    // Mostrar ejemplos detallados
    console.log('📋 EJEMPLOS DE PREGUNTAS INVÁLIDAS Y SOLUCIONES:\n');
    
    examples.forEach((example, index) => {
      console.log(`${index + 1}. 🆔 ID: ${example.id}`);
      console.log(`   ❌ Problema: ${example.issue}`);
      
      if (example.originalLength) {
        console.log(`   📏 Longitud original: ${example.originalLength} caracteres`);
      }
      
      console.log(`   📄 Contenido (preview):`);
      console.log(`      "${example.content.substring(0, 150)}..."`);
      
      if (example.proposedSolution) {
        console.log(`   💡 Solución propuesta:`);
        console.log(`      ${example.proposedSolution}`);
      }
      
      console.log('');
    });
    
    // Estadísticas de reparación
    console.log('📊 POTENCIAL DE REPARACIÓN:');
    
    const longQuestionsCount = examples.filter(e => e.issue.includes('demasiado larga')).length;
    const unparseableCount = examples.filter(e => e.issue.includes('No se puede parsear')).length;
    
    console.log(`   📏 Preguntas largas reparables: ${longQuestionsCount} (truncamiento inteligente)`);
    console.log(`   🔧 Preguntas no parseables: ${unparseableCount} (requieren análisis manual)`);
    
    // Recomendaciones de implementación
    console.log('\n💡 RECOMENDACIONES DE IMPLEMENTACIÓN:');
    console.log('');
    console.log('1. 📏 **Truncamiento Automático:**');
    console.log('   - Implementar smartTruncateQuestion() en sistema de envío');
    console.log('   - Priorizar corte en puntuación natural');
    console.log('   - Mantener coherencia del mensaje');
    console.log('');
    console.log('2. 🔧 **Reparación de Contenido:**');
    console.log('   - Limpiar caracteres de control en pipeline');
    console.log('   - Validar JSON antes de guardar en BD');
    console.log('   - Implementar fallbacks para formatos corruptos');
    console.log('');
    console.log('3. 📊 **Monitoreo de Calidad:**');
    console.log('   - Ejecutar análisis periódico de validez');
    console.log('   - Alertas cuando % de preguntas válidas baja');
    console.log('   - Dashboard de métricas de calidad');
    console.log('');
    console.log('4. 🎯 **Optimización de Selección:**');
    console.log('   - Priorizar preguntas válidas en algoritmo de selección');
    console.log('   - Cache de preguntas pre-validadas');
    console.log('   - Blacklist de preguntas problemáticas');
    
    console.log('\n✅ EXAMEN COMPLETADO');
    console.log('📈 Análisis detallado disponible para optimización del sistema');
    
  } catch (error) {
    console.error('❌ Error durante el examen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para generar script de reparación automática
async function generateRepairScript() {
  console.log('\n🔧 GENERANDO SCRIPT DE REPARACIÓN...');
  
  const repairScript = `
-- Script SQL para reparar preguntas en lote
-- EJECUTAR CON PRECAUCIÓN - HACER BACKUP PRIMERO

-- 1. Identificar preguntas con contenido JSON válido pero pregunta larga
WITH long_questions AS (
  SELECT 
    id,
    content,
    length((content::json->>'question')) as question_length
  FROM "Question" 
  WHERE 
    content::json ? 'question' 
    AND length((content::json->>'question')) > 200
)
SELECT 
  id,
  question_length,
  'Truncar pregunta' as action_needed
FROM long_questions
LIMIT 20;

-- 2. Identificar preguntas no parseables
SELECT 
  id,
  length(content) as content_length,
  left(content, 100) as content_preview
FROM "Question"
WHERE 
  NOT (content::text ~ '^\\s*\\{') -- No empieza con JSON
  AND NOT (content ~ '::.*\\{') -- No tiene formato GIFT
LIMIT 10;
`;

  console.log('📄 Script SQL generado para identificar preguntas reparables:');
  console.log(repairScript);
}

if (require.main === module) {
  examineInvalidQuestions()
    .then(() => generateRepairScript())
    .catch(console.error);
}

export { examineInvalidQuestions, smartTruncateQuestion, attemptContentRepair }; 