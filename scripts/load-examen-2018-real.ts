#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Respuestas correctas del examen 2018 (del corrector proporcionado)
const RESPUESTAS_CORRECTAS_2018: Record<number, string> = {
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

interface ParsedQuestion {
  questionnumber: number;
  question: string;
  options: string[];
  correctanswerindex: number;
  category: string;
}

function parseExamen2018Content(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  // Dividir en líneas y procesar
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let currentOptions: string[] = [];
  
  for (const line of lines) {
    // Detectar nueva pregunta (formato: "1º) ¿...")
    const questionMatch = line.match(/^(\d+)º?\)\s*(.+)$/);
    if (questionMatch) {
      // Guardar pregunta anterior si existe
      if (currentQuestion && currentOptions.length >= 2) {
        const questionNum = currentQuestion.questionnumber!;
        const correctLetter = RESPUESTAS_CORRECTAS_2018[questionNum];
        const correctIndex = correctLetter ? ['A', 'B', 'C', 'D'].indexOf(correctLetter) : 0;
        
        questions.push({
          questionnumber: questionNum,
          question: currentQuestion.question!,
          options: [...currentOptions],
          correctanswerindex: correctIndex,
          category: categorizarPregunta(currentQuestion.question!)
        });
      }
      
      // Iniciar nueva pregunta
      const questionnumber = parseInt(questionMatch[1]);
      currentQuestion = {
        questionnumber,
        question: questionMatch[2]
      };
      currentOptions = [];
      continue;
    }
    
    // Detectar opciones (formato: "A) ...", "B) ...", etc.)
    const optionMatch = line.match(/^[A-D]\)\s*(.+)$/);
    if (optionMatch && currentQuestion) {
      currentOptions.push(optionMatch[1]);
      continue;
    }
    
    // Si la línea no es pregunta ni opción pero hay una pregunta activa, puede ser continuación
    if (currentQuestion && !line.includes('CORRECTOR') && !line.includes('EXAMEN') && line.length > 10) {
      // Continuación de pregunta o opción
      if (currentOptions.length === 0) {
        // Continuación de pregunta
        currentQuestion.question += ' ' + line;
      } else {
        // Posible continuación de última opción
        if (currentOptions.length > 0) {
          currentOptions[currentOptions.length - 1] += ' ' + line;
        }
      }
    }
  }
  
  // Procesar última pregunta
  if (currentQuestion && currentOptions.length >= 2) {
    const questionNum = currentQuestion.questionnumber!;
    const correctLetter = RESPUESTAS_CORRECTAS_2018[questionNum];
    const correctIndex = correctLetter ? ['A', 'B', 'C', 'D'].indexOf(correctLetter) : 0;
    
    questions.push({
      questionnumber: questionNum,
      question: currentQuestion.question!,
      options: [...currentOptions],
      correctanswerindex: correctIndex,
      category: categorizarPregunta(currentQuestion.question!)
    });
  }
  
  return questions.filter(q => q.questionnumber <= 100);
}

function categorizarPregunta(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('brigada') || q.includes('regimiento') || q.includes('división') || 
      q.includes('ejercito') || q.includes('militar') || q.includes('subinspección') || 
      q.includes('mando') || q.includes('et ') || q.includes('eae') || q.includes('armada')) {
    return 'Organización Militar';
  }
  
  if (q.includes('otan') || q.includes('onu') || q.includes('tratado') || 
      q.includes('unión europea') || q.includes('ue') || q.includes('osce')) {
    return 'Organizaciones Internacionales';
  }
  
  if (q.includes('constitución') || q.includes('congreso') || q.includes('senado') || 
      q.includes('gobierno') || q.includes('ministro') || q.includes('recurso') || 
      q.includes('administrativo') || q.includes('ley') || q.includes('derecho')) {
    return 'Derecho y Administración';
  }
  
  if (q.includes('falta') || q.includes('sanción') || q.includes('disciplina') || 
      q.includes('procedimiento') || q.includes('arresto') || q.includes('acoso')) {
    return 'Régimen Disciplinario';
  }
  
  if (q.includes('carrera militar') || q.includes('ascenso') || q.includes('empleo') || 
      q.includes('compromiso') || q.includes('servicio') || q.includes('mtm') || 
      q.includes('excedencia') || q.includes('red')) {
    return 'Carrera Militar';
  }
  
  if (q.includes('seguridad nacional') || q.includes('defensa') || q.includes('estrategia') || 
      q.includes('operaciones') || q.includes('combate') || q.includes('pdc')) {
    return 'Seguridad y Defensa';
  }
  
  return 'General';
}

async function clearExistingData() {
  const existingCount = await prisma.examenOficial2018.count();
  if (existingCount > 0) {
    console.log(`🗑️ Eliminando ${existingCount} preguntas existentes...`);
    await prisma.examenOficial2018.deleteMany({});
    console.log('✅ Datos existentes eliminados');
  }
}

async function insertQuestions(questions: ParsedQuestion[]) {
  console.log(`📥 Insertando ${questions.length} preguntas en ExamenOficial2018...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const question of questions) {
    try {
      await prisma.examenOficial2018.create({
        data: {
          questionnumber: question.questionnumber,
          question: question.question,
          options: question.options,
          correctanswerindex: question.correctanswerindex,
          category: question.category,
          difficulty: 'OFICIAL',
          isactive: true,
          sendCount: 0
        }
      });
      
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`   ✅ ${successCount} preguntas insertadas...`);
      }
      
    } catch (error) {
      console.error(`❌ Error en pregunta ${question.questionnumber}:`, error);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

async function showStatistics() {
  const totalQuestions = await prisma.examenOficial2018.count();
  console.log(`📊 Total de preguntas: ${totalQuestions}`);
  
  const categoryStats = await prisma.examenOficial2018.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  
  console.log('\n📈 DISTRIBUCIÓN POR CATEGORÍAS:');
  categoryStats.forEach(stat => {
    const percentage = ((stat._count.id / totalQuestions) * 100).toFixed(1);
    console.log(`   ${stat.category}: ${stat._count.id} preguntas (${percentage}%)`);
  });
  
  // Mostrar distribución de respuestas correctas
  const answerStats = await prisma.examenOficial2018.groupBy({
    by: ['correctanswerindex'],
    _count: { id: true },
    orderBy: { correctanswerindex: 'asc' }
  });
  
  console.log('\n📈 DISTRIBUCIÓN DE RESPUESTAS CORRECTAS:');
  answerStats.forEach(stat => {
    const letter = ['A', 'B', 'C', 'D'][stat.correctanswerindex];
    const percentage = ((stat._count.id / totalQuestions) * 100).toFixed(1);
    console.log(`   Opción ${letter}: ${stat._count.id} preguntas (${percentage}%)`);
  });
}

async function showSample() {
  console.log('\n🔍 MUESTRA DE PREGUNTAS CARGADAS:');
  const sampleQuestions = await prisma.examenOficial2018.findMany({
    take: 3,
    orderBy: { questionnumber: 'asc' },
    select: {
      questionnumber: true,
      question: true,
      options: true,
      correctanswerindex: true,
      category: true
    }
  });
  
  sampleQuestions.forEach(q => {
    console.log(`\n${q.questionnumber}. ${q.question}`);
    q.options.forEach((option, index) => {
      const letter = ['A', 'B', 'C', 'D'][index];
      const marker = index === q.correctanswerindex ? ' ✅' : '';
      console.log(`   ${letter}) ${option}${marker}`);
    });
    console.log(`   Categoría: ${q.category}`);
  });
}

async function main() {
  try {
    console.log('🚀 CARGANDO EXAMEN OFICIAL PERMANENCIA 2018');
    console.log('==========================================\n');
    
    // Verificar archivo (intentar múltiples ubicaciones)
    const possiblePaths = [
      path.join(process.cwd(), '..', '..', 'OPOMELILLA', 'Examenes oficiales', 'formato txt', 'Examen Permanencia año 2018.txt'),
      path.join(process.cwd(), 'Examen Permanencia año 2018.txt'),
      path.join(process.cwd(), 'examenes', 'Examen Permanencia año 2018.txt')
    ];
    
    let filePath = '';
    let fileFound = false;
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        filePath = testPath;
        fileFound = true;
        break;
      }
    }
    
    if (!fileFound) {
      console.error(`❌ No se encuentra el archivo en ninguna de las ubicaciones probadas:`);
      possiblePaths.forEach(p => console.log(`   - ${p}`));
      console.log('\n💡 Por favor, asegúrate de que el archivo está en una de estas ubicaciones');
      return;
    }
    
    console.log(`📖 Leyendo archivo: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`✅ Archivo leído: ${content.length} caracteres`);
    
    // Parsear preguntas
    console.log('\n🔍 Parseando preguntas...');
    const questions = parseExamen2018Content(content);
    console.log(`✅ ${questions.length} preguntas parseadas correctamente`);
    
    if (questions.length === 0) {
      console.error('❌ No se pudieron extraer preguntas del archivo');
      return;
    }
    
    // Verificar que tenemos las 100 preguntas
    if (questions.length !== 100) {
      console.log(`⚠️ Advertencia: Se esperaban 100 preguntas, se parsearon ${questions.length}`);
    }
    
    // Verificar algunas preguntas clave
    const question1 = questions.find(q => q.questionnumber === 1);
    if (question1) {
      console.log(`\n🔍 Verificación - Pregunta 1: ${question1.question.substring(0, 50)}...`);
    }
    
    // Limpiar datos existentes
    await clearExistingData();
    
    // Insertar preguntas
    const { successCount, errorCount } = await insertQuestions(questions);
    
    console.log('\n🎉 CARGA COMPLETADA');
    console.log(`✅ Preguntas insertadas: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    
    if (successCount === 100) {
      console.log('🎯 ¡PERFECTO! Las 100 preguntas del examen oficial 2018 han sido cargadas');
    }
    
    // Mostrar estadísticas
    await showStatistics();
    
    // Mostrar muestra
    await showSample();
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
if (require.main === module) {
  main();
}

export { parseExamen2018Content, categorizarPregunta }; 