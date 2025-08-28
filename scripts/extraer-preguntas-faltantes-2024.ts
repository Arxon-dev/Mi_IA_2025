import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

// Preguntas que necesitamos extraer del archivo original
const preguntasFaltantes = [8, 9, 15, 20, 49, 50, 51, 52, 76, 77, 78];

// Respuestas correctas (del corrector oficial)
const respuestasCorrectas = {
  8: 1,  // B
  9: 1,  // B  
  15: 0, // A
  20: 0, // A
  49: 2, // C
  50: 3, // D
  51: 0, // A
  52: 1, // B
  76: 0, // A
  77: 3, // D
  78: 2  // C
};

function extractQuestionData(text: string, questionnumber: number): { question: string; options: string[] } | null {
  try {
    // Encontrar el inicio de la pregunta específica
    const questionRegex = new RegExp(`^${questionnumber}\\.\\s*`, 'm');
    const nextQuestionRegex = new RegExp(`^${questionnumber + 1}\\.\\s*`, 'm');
    
    const questionStart = text.search(questionRegex);
    if (questionStart === -1) return null;
    
    // Encontrar el final (donde empieza la siguiente pregunta)
    const nextQuestionStart = text.search(nextQuestionRegex);
    const questionText = nextQuestionStart !== -1 
      ? text.substring(questionStart, nextQuestionStart)
      : text.substring(questionStart);
    
    // Dividir en líneas y limpiar
    const lines = questionText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Remover el número de pregunta de la primera línea
    if (lines[0]) {
      lines[0] = lines[0].replace(/^\d+\.\s*/, '').trim();
    }
    
    // Encontrar donde empiezan las opciones
    let optionsStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^[a-d]\)/)) {
        optionsStartIndex = i;
        break;
      }
    }
    
    if (optionsStartIndex === -1) return null;
    
    // Construir la pregunta (todo antes de las opciones)
    const questionLines = lines.slice(0, optionsStartIndex);
    const question = questionLines.join(' ').replace(/\s+/g, ' ').trim();
    
    // Extraer opciones
    const options: string[] = [];
    let currentOption = '';
    
    for (let i = optionsStartIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.match(/^[a-d]\)/)) {
        // Si ya hay una opción construida, guardarla
        if (currentOption.trim()) {
          options.push(currentOption.trim());
        }
        // Empezar nueva opción
        currentOption = line.replace(/^[a-d]\)\s*/, '').trim();
      } else {
        // Continuar con la opción actual
        if (currentOption) {
          currentOption += ' ' + line;
        }
      }
    }
    
    // Agregar la última opción
    if (currentOption.trim()) {
      options.push(currentOption.trim());
    }
    
    // Validar que tenemos 4 opciones
    if (options.length !== 4) {
      console.log(`⚠️ Pregunta ${questionnumber}: Se esperaban 4 opciones, se encontraron ${options.length}`);
      return null;
    }
    
    return { question, options };
  } catch (error) {
    console.error(`Error parseando pregunta ${questionnumber}:`, error);
    return null;
  }
}

async function extraerPreguntasFaltantes() {
  console.log('🔧 EXTRAYENDO PREGUNTAS FALTANTES DEL EXAMEN 2024...\n');
  
  try {
    // Leer el archivo original
    const filePath = 'src/documentos/Examenes_oficiales/Examen_AÑO_2024.txt';
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const preguntasExtraidas = [];
    
    for (const questionnumber of preguntasFaltantes) {
      console.log(`🔍 Buscando pregunta ${questionnumber}...`);
      
      const questionData = extractQuestionData(fileContent, questionnumber);
      
      if (questionData) {
        preguntasExtraidas.push({
          questionnumber,
          question: questionData.question,
          options: questionData.options,
          correctanswerindex: respuestasCorrectas[questionnumber as keyof typeof respuestasCorrectas]
        });
        
        console.log(`✅ Pregunta ${questionnumber} extraída exitosamente`);
        console.log(`   Pregunta: "${questionData.question.substring(0, 80)}..."`);
        console.log(`   Opciones: ${questionData.options.length}`);
        console.log(`   Respuesta correcta: ${respuestasCorrectas[questionnumber as keyof typeof respuestasCorrectas]} (${['A', 'B', 'C', 'D'][respuestasCorrectas[questionnumber as keyof typeof respuestasCorrectas]]})`);
        console.log('');
      } else {
        console.log(`❌ No se pudo extraer la pregunta ${questionnumber}`);
      }
    }
    
    console.log(`📊 RESUMEN: ${preguntasExtraidas.length}/${preguntasFaltantes.length} preguntas extraídas exitosamente\n`);
    
    if (preguntasExtraidas.length > 0) {
      console.log('💾 ACTUALIZANDO BASE DE DATOS...');
      
      for (const pregunta of preguntasExtraidas) {
        await (prisma as any).examenOficial2024.update({
          where: { questionnumber: pregunta.questionnumber },
          data: {
            question: pregunta.question,
            options: pregunta.options,
            correctanswerindex: pregunta.correctanswerindex
          }
        });
        
        console.log(`✅ Pregunta ${pregunta.questionnumber} actualizada en BD`);
      }
      
      console.log('\n🎉 TODAS LAS PREGUNTAS FALTANTES HAN SIDO ACTUALIZADAS');
      console.log('\n🧪 EJECUTAR VERIFICACIÓN:');
      console.log('npx tsx scripts/verificar-preguntas-placeholder.ts');
    }
    
  } catch (error) {
    console.error('❌ Error extrayendo preguntas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

extraerPreguntasFaltantes(); 