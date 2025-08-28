import { prisma, closePrismaConnection } from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';

interface ParsedQuestion {
  question: string;
  options: string[];
  correctanswerindex: number;
  feedback?: string;
  title?: string;
  sourceReference?: string;
}

function parseGiftFile(filePath: string): ParsedQuestion[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const questions: ParsedQuestion[] = [];
  
  // Dividir por preguntas individuales (cada pregunta empieza con <b>55/2021 DEL EMAD</b>)
  const questionBlocks = content.split('<b>55/2021 DEL EMAD</b><br><br>').filter(block => block.trim().length > 0);
  
  let questionnumber = 1;
  
  for (const block of questionBlocks) {
    try {
      const parsedQuestion = parseQuestionBlock(block.trim(), questionnumber);
      if (parsedQuestion) {
        questions.push(parsedQuestion);
        questionnumber++;
      }
    } catch (error) {
      console.error(`Error al parsear pregunta ${questionnumber}:`, error);
    }
  }
  
  return questions;
}

function parseQuestionBlock(block: string, questionnumber: number): ParsedQuestion | null {
  // Extraer la pregunta principal (hasta el primer {)
  const questionMatch = block.match(/^([^{]+)\{/);
  if (!questionMatch) {
    console.warn(`No se pudo extraer la pregunta del bloque ${questionnumber}`);
    return null;
  }
  
  const question = questionMatch[1].trim();
  
  // Extraer opciones (entre { y })
  const optionsMatch = block.match(/\{([^}]+)\}/);
  if (!optionsMatch) {
    console.warn(`No se pudieron extraer las opciones del bloque ${questionnumber}`);
    return null;
  }
  
  const optionsSection = optionsMatch[1];
  const options: string[] = [];
  let correctanswerindex = -1;
  
  // Parsear opciones
  const optionLines = optionsSection.split('\n').filter(line => line.trim().length > 0);
  
  for (const line of optionLines) {
    const trimmedLine = line.trim();
    
    // Respuesta correcta (=)
    if (trimmedLine.startsWith('=')) {
      correctanswerindex = options.length;
      options.push(trimmedLine.substring(1).trim());
    }
    // Respuesta incorrecta (~)
    else if (trimmedLine.startsWith('~')) {
      // Remover el porcentaje negativo si existe
      const cleanOption = trimmedLine.replace(/^~%-?\d+(\.\d+)?%/, '').trim();
      if (cleanOption) {
        options.push(cleanOption);
      }
    }
    // Ignorar líneas que no son opciones
    else if (!trimmedLine.startsWith('####') && !trimmedLine.startsWith('<b>') && !trimmedLine.startsWith('"')) {
      // Podría ser continuación de una opción anterior
      continue;
    }
  }
  
  // Extraer feedback (después de ####RETROALIMENTACIÓN:)
  let feedback = '';
  const feedbackMatch = block.match(/####RETROALIMENTACIÓN:<br>\s*([^]*?)(?=<b>REGLA CLAVE:<\/b>|$)/);
  if (feedbackMatch) {
    feedback = feedbackMatch[1].trim()
      .replace(/<br>/g, '\n')
      .replace(/"/g, '')
      .trim();
  }
  
  // Extraer reglas clave
  const rulesMatch = block.match(/<b>REGLA CLAVE:<\/b><br>\s*([^]*?)(?=\}|$)/);
  if (rulesMatch) {
    const rules = rulesMatch[1].trim()
      .replace(/<br>/g, '\n')
      .replace(/"/g, '')
      .trim();
    
    if (feedback) {
      feedback += '\n\nREGLA CLAVE:\n' + rules;
    } else {
      feedback = 'REGLA CLAVE:\n' + rules;
    }
  }
  
  if (correctanswerindex === -1) {
    console.warn(`No se encontró respuesta correcta en la pregunta ${questionnumber}`);
    return null;
  }
  
  if (options.length < 2) {
    console.warn(`Pregunta ${questionnumber} tiene menos de 2 opciones`);
    return null;
  }
  
  return {
    question,
    options,
    correctanswerindex,
    feedback: feedback || undefined,
    title: `Pregunta ${questionnumber} - EMAD 55/2021`,
    sourceReference: '55/2021 DEL EMAD'
  };
}

async function importQuestions() {
  try {
    console.log('🚀 Iniciando importación de preguntas EMAD...');
    
    const filePath = path.join(process.cwd(), 'docs', 'emad.gift');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`No se encontró el archivo: ${filePath}`);
    }
    
    console.log('📖 Parseando archivo GIFT...');
    const questions = parseGiftFile(filePath);
    
    console.log(`✅ Se parsearon ${questions.length} preguntas`);
    
    if (questions.length === 0) {
      console.log('⚠️  No se encontraron preguntas para importar');
      return;
    }
    
    console.log('🔌 Conectando a la base de datos...');
    // No necesitamos llamar explícitamente $connect() ya que Prisma se conecta automáticamente
    
    console.log('🗄️  Importando preguntas a la base de datos...');
    
    // Limpiar tabla existente si es necesario
    console.log('🔍 Verificando tabla existente...');
    const existingCount = await prisma.emad.count();
    if (existingCount > 0) {
      console.log(`⚠️  Se encontraron ${existingCount} preguntas existentes en la tabla emad`);
      console.log('🧹 Eliminando preguntas existentes...');
      await prisma.emad.deleteMany({});
      console.log('✅ Tabla limpiada');
    }
    
    // Importar preguntas en lotes más pequeños para reducir la carga
    const batchSize = 20;
    let imported = 0;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      const dataToInsert = batch.map((q, index) => ({
        questionnumber: i + index + 1,
        question: q.question,
        options: q.options,
        correctanswerindex: q.correctanswerindex,
        category: 'emad',
        difficulty: 'OFICIAL',
        isactive: true,
        feedback: q.feedback,
        type: 'gift',
        title: q.title,
        titleSourceReference: q.sourceReference,
        titleSourceDocument: '55/2021 DEL EMAD'
      }));
      
      await prisma.emad.createMany({
        data: dataToInsert
      });
      
      imported += batch.length;
      console.log(`📝 Importadas ${imported}/${questions.length} preguntas`);
      
      // Pequeña pausa entre lotes para evitar sobrecargar la DB
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Importación completada exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - Preguntas importadas: ${imported}`);
    console.log(`   - Tabla: emad`);
    console.log(`   - Formato: GIFT`);
    console.log(`   - Documento fuente: 55/2021 DEL EMAD`);
    
    // Verificar importación
    const finalCount = await prisma.emad.count();
    console.log(`🔍 Verificación: ${finalCount} preguntas en la tabla emad`);
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    throw error;
  } finally {
    console.log('🔌 Cerrando conexión a la base de datos...');
    await closePrismaConnection();
  }
}

// Manejar señales de interrupción correctamente
process.on('SIGINT', async () => {
  console.log('\n🔌 Cerrando conexiones por interrupción...');
  await closePrismaConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔌 Cerrando conexiones por terminación...');
  await closePrismaConnection();
  process.exit(0);
});

process.on('beforeExit', async () => {
  await closePrismaConnection();
});

// Ejecutar solo si se llama directamente
if (require.main === module) {
  importQuestions().catch(console.error);
}

export { importQuestions, parseGiftFile }; 