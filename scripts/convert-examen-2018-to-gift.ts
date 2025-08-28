import { promises as fs } from 'fs';
import path from 'path';

// Interfaz para una pregunta parseada
interface ParsedQuestion {
  number: number;
  question: string;
  options: string[];
  correctAnswer: string; // A, B, C, D
  correctIndex: number; // 0, 1, 2, 3
}

// Mapeo del corrector (respuestas correctas)
const CORRECTOR_2018: Record<number, string> = {
  1: 'A', 2: 'B', 3: 'B', 4: 'B', 5: 'C',
  6: 'D', 7: 'B', 8: 'B', 9: 'D', 10: 'A',
  11: 'A', 12: 'D', 13: 'A', 14: 'D', 15: 'B',
  16: 'B', 17: 'A', 18: 'B', 19: 'C', 20: 'D',
  21: 'A', 22: 'D', 23: 'D', 24: 'C', 25: 'A',
  26: 'A', 27: 'C', 28: 'B', 29: 'D', 30: 'A',
  31: 'B', 32: 'B', 33: 'D', 34: 'A', 35: 'C',
  36: 'B', 37: 'D', 38: 'B', 39: 'D', 40: 'A',
  41: 'A', 42: 'B', 43: 'A', 44: 'D', 45: 'D',
  46: 'A', 47: 'C', 48: 'D', 49: 'B', 50: 'A',
  51: 'C', 52: 'D', 53: 'A', 54: 'A', 55: 'C',
  56: 'C', 57: 'C', 58: 'B', 59: 'C', 60: 'B',
  61: 'D', 62: 'B', 63: 'B', 64: 'D', 65: 'A',
  66: 'B', 67: 'A', 68: 'C', 69: 'A', 70: 'C',
  71: 'B', 72: 'A', 73: 'D', 74: 'A', 75: 'D',
  76: 'C', 77: 'C', 78: 'C', 79: 'B', 80: 'C',
  81: 'B', 82: 'A', 83: 'B', 84: 'C', 85: 'D',
  86: 'B', 87: 'C', 88: 'B', 89: 'B', 90: 'A',
  91: 'D', 92: 'D', 93: 'B', 94: 'D', 95: 'A',
  96: 'D', 97: 'B', 98: 'A', 99: 'C', 100: 'C'
};

// Función para generar retroalimentación automática
async function generateFeedback(question: ParsedQuestion): Promise<string> {
  // Por ahora genero retroalimentación básica, después integraremos IA
  const correctOption = question.options[question.correctIndex];
  const questionType = detectQuestionType(question.question);
  
  let feedback = '';
  
  switch (questionType) {
    case 'brigada':
      feedback = `La respuesta correcta es "${correctOption}". Esta información forma parte de la organización territorial del Ejército español.`;
      break;
    case 'organizacion':
      feedback = `"${correctOption}" es la respuesta correcta según la estructura organizativa de las FAS y la administración pública española.`;
      break;
    case 'normativa':
      feedback = `La respuesta correcta es "${correctOption}". Este punto está recogido en la normativa militar y administrativa vigente.`;
      break;
    case 'internacional':
      feedback = `"${correctOption}" es correcto. Esta información corresponde a las relaciones internacionales y organizaciones supranacionales.`;
      break;
    case 'procedimiento':
      feedback = `La respuesta correcta es "${correctOption}". Esto está establecido en los procedimientos administrativos correspondientes.`;
      break;
    default:
      feedback = `La respuesta correcta es "${correctOption}". Fundamental para el conocimiento militar y administrativo requerido.`;
  }
  
  // Limitar a 200 caracteres
  if (feedback.length > 200) {
    feedback = feedback.substring(0, 197) + '...';
  }
  
  return feedback;
}

// Función para detectar el tipo de pregunta
function detectQuestionType(question: string): string {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('brigada') || lowerQ.includes('regimiento') || lowerQ.includes('división')) {
    return 'brigada';
  }
  if (lowerQ.includes('depende') || lowerQ.includes('encuadra') || lowerQ.includes('organiz')) {
    return 'organizacion';
  }
  if (lowerQ.includes('ley') || lowerQ.includes('real decreto') || lowerQ.includes('norma')) {
    return 'normativa';
  }
  if (lowerQ.includes('otan') || lowerQ.includes('onu') || lowerQ.includes('tratado') || lowerQ.includes('ue')) {
    return 'internacional';
  }
  if (lowerQ.includes('procedimiento') || lowerQ.includes('recurso') || lowerQ.includes('plazo')) {
    return 'procedimiento';
  }
  
  return 'general';
}

// Función para limpiar y normalizar texto
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// Función para extraer el número de pregunta
function extractQuestionNumber(text: string): number | null {
  const match = text.match(/^(\d+)º?\)/);
  return match ? parseInt(match[1]) : null;
}

// Función principal para parsear el archivo
async function parseExamenFile(filePath: string): Promise<ParsedQuestion[]> {
  console.log('📖 Leyendo archivo del examen...');
  
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const questions: ParsedQuestion[] = [];
  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let currentOptions: string[] = [];
  
  console.log('🔍 Parseando preguntas...');
  
  for (const line of lines) {
    // Detectar inicio de pregunta
    const questionnumber = extractQuestionNumber(line);
    
    if (questionnumber && questionnumber <= 100) {
      // Guardar pregunta anterior si existe
      if (currentQuestion && currentQuestion.number) {
        const correctAnswer = CORRECTOR_2018[currentQuestion.number];
        if (correctAnswer && currentOptions.length === 4) {
          const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswer);
          
          questions.push({
            number: currentQuestion.number,
            question: currentQuestion.question || '',
            options: currentOptions,
            correctAnswer,
            correctIndex
          });
        }
      }
      
      // Iniciar nueva pregunta
      currentQuestion = {
        number: questionnumber,
        question: cleanText(line.replace(/^\d+º?\)\s*/, ''))
      };
      currentOptions = [];
      
    } else if (line.match(/^[A-D]\)/)) {
      // Opción de respuesta
      const optionText = cleanText(line.replace(/^[A-D]\)\s*/, ''));
      if (optionText) {
        currentOptions.push(optionText);
      }
    } else if (currentQuestion && !currentQuestion.question?.includes(line)) {
      // Continuar texto de la pregunta
      currentQuestion.question = (currentQuestion.question || '') + ' ' + cleanText(line);
    }
    
    // Si encontramos "EXAMEN PERMANENCIA", hemos llegado al final
    if (line.includes('EXAMEN PERMANENCIA')) {
      break;
    }
  }
  
  // Guardar última pregunta
  if (currentQuestion && currentQuestion.number) {
    const correctAnswer = CORRECTOR_2018[currentQuestion.number];
    if (correctAnswer && currentOptions.length === 4) {
      const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswer);
      
      questions.push({
        number: currentQuestion.number,
        question: currentQuestion.question || '',
        options: currentOptions,
        correctAnswer,
        correctIndex
      });
    }
  }
  
  console.log(`✅ Parseadas ${questions.length} preguntas correctamente`);
  return questions;
}

// Función para convertir a formato GIFT
async function convertToGIFT(questions: ParsedQuestion[]): Promise<string> {
  console.log('🎁 Convirtiendo a formato GIFT...');
  
  let giftContent = '';
  
  for (const question of questions) {
    console.log(`   Procesando pregunta ${question.number}...`);
    
    // Generar retroalimentación
    const feedback = await generateFeedback(question);
    
    // Determinar categoría basada en el contenido
    let category = 'General';
    const lowerQ = question.question.toLowerCase();
    if (lowerQ.includes('brigada') || lowerQ.includes('división')) category = 'Organización Militar';
    if (lowerQ.includes('otan') || lowerQ.includes('onu')) category = 'Organizaciones Internacionales';
    if (lowerQ.includes('ley') || lowerQ.includes('decreto')) category = 'Normativa';
    if (lowerQ.includes('procedimiento') || lowerQ.includes('recurso')) category = 'Procedimientos Administrativos';
    
    // Crear pregunta en formato GIFT
    giftContent += `$CATEGORY: ${category}\n\n`;
    giftContent += `Permanencia 2018 - Pregunta ${question.number}\\n${question.question}{\n`;
    
    // Añadir opciones (correcta con = y incorrectas con ~)
    for (let i = 0; i < question.options.length; i++) {
      const prefix = i === question.correctIndex ? '=' : '~';
      giftContent += `\t${prefix}${question.options[i]}\n`;
    }
    
    // Añadir retroalimentación
    giftContent += `\t#### RETROALIMENTACIÓN:\\n${feedback}\n`;
    giftContent += '}\n\n';
  }
  
  return giftContent;
}

// Función principal
async function main() {
  try {
    console.log('🚀 INICIANDO CONVERSIÓN EXAMEN PERMANENCIA 2018 A GIFT');
    console.log('=' .repeat(60));
    
    // Rutas de archivos
    const inputFile = path.join('f:', 'Permanencia', 'Perma2024', 'OPOMELILLA', 'Examenes oficiales', 'formato txt', 'Examen Permanencia año 2018.txt');
    const outputFile = path.join('scripts', 'output', 'examen-permanencia-2018.gift');
    
    // Crear directorio de salida si no existe
    const outputDir = path.dirname(outputFile);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Parsear archivo
    const questions = await parseExamenFile(inputFile);
    
    if (questions.length === 0) {
      throw new Error('No se pudieron parsear preguntas del archivo');
    }
    
    console.log(`\n📊 ESTADÍSTICAS:`);
    console.log(`   Total preguntas: ${questions.length}`);
    console.log(`   Con respuesta correcta: ${questions.filter(q => q.correctAnswer).length}`);
    
    // Verificar que tenemos las 100 preguntas
    if (questions.length !== 100) {
      console.warn(`⚠️  ADVERTENCIA: Se esperaban 100 preguntas pero se parsearon ${questions.length}`);
    }
    
    // Convertir a GIFT
    const giftContent = await convertToGIFT(questions);
    
    // Guardar archivo
    await fs.writeFile(outputFile, giftContent, 'utf-8');
    
    console.log(`\n✅ CONVERSIÓN COMPLETADA:`);
    console.log(`   📄 Archivo generado: ${outputFile}`);
    console.log(`   📏 Tamaño: ${Math.round(giftContent.length / 1024)} KB`);
    console.log(`   🎯 ${questions.length} preguntas convertidas a formato GIFT`);
    console.log(`   💡 Retroalimentación automática incluida`);
    
    // Mostrar muestra de algunas preguntas
    console.log(`\n📋 MUESTRA DE PREGUNTAS CONVERTIDAS:`);
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const q = questions[i];
      console.log(`   ${q.number}. ${q.question.substring(0, 60)}...`);
      console.log(`      Respuesta correcta: ${q.correctAnswer}) ${q.options[q.correctIndex].substring(0, 40)}...`);
    }
    
  } catch (error) {
    console.error('❌ ERROR en la conversión:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 ¡Proceso completado exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { main, parseExamenFile, convertToGIFT }; 