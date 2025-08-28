import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedQuestion {
  title: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

// Función para validar límites estrictos de Telegram
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
      issues.push(`Opción ${i + 1}: "${option}" (${option?.length || 0} caracteres, límite: 1-100)`);
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

function parseGiftContent(content: string): ParsedQuestion | null {
  try {
    // Dividir por líneas y limpiar
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    // Buscar el título (primera línea sin caracteres especiales)
    let title = '';
    let questionStartIndex = 0;
    
    if (lines.length > 0 && !lines[0].includes('{') && !lines[0].includes('::')) {
      title = lines[0];
      questionStartIndex = 1;
    }
    
    // Encontrar la pregunta y las opciones
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
    
    // Limpiar texto de pregunta
    questionText = questionText.replace(/\{[^}]*\}/, '').trim();
    
    // Parsear opciones GIFT
    const options: string[] = [];
    let correctAnswerIndex = -1;
    let explanation = '';
    
    optionsText = optionsText.replace(/}$/, '');
    
    // Buscar explicación con ####
    const explanationMatch = optionsText.match(/####[^~=]*$/);
    if (explanationMatch) {
      explanation = explanationMatch[0].replace(/^####\s*/, '').trim();
      explanation = explanation.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (explanation.length > 200) {
        explanation = explanation.substring(0, 190).trim() + '...';
      }
      
      optionsText = optionsText.replace(/####[^~=]*$/, '');
    }
    
    // Dividir por ~ y = para encontrar opciones
    const optionParts = optionsText.split(/[~=]/).filter(part => part.trim());
    
    for (let i = 0; i < optionParts.length; i++) {
      let optionText = optionParts[i].trim();
      
      const fullText = optionsText;
      const optionPosition = fullText.indexOf(optionText);
      const textBefore = fullText.substring(0, optionPosition);
      const isCorrect = textBefore.lastIndexOf('=') > textBefore.lastIndexOf('~');
      
      if (isCorrect && correctAnswerIndex === -1) {
        correctAnswerIndex = options.length;
      }
      
      options.push(optionText);
    }
    
    if (!questionText || options.length < 2 || correctAnswerIndex === -1) {
      return null;
    }
    
    return {
      title: title || '',
      question: questionText,
      options,
      correctAnswerIndex,
      explanation: explanation || 'Respuesta correcta'
    };
    
  } catch (error) {
    return null;
  }
}

async function verificarPreguntasBD() {
  try {
    console.log('🔍 =================== VERIFICANDO PREGUNTAS EN BASE DE DATOS ===================');
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('');

    // 1. Obtener todas las preguntas activas
    const todasLasPreguntas = await prisma.question.findMany({
      where: {
        archived: false
      },
      select: {
        id: true,
        type: true,
        difficulty: true,
        content: true,
        sendCount: true,
        lastSuccessfulSendAt: true,
        createdAt: true
      },
      orderBy: [
        { sendCount: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log('📊 RESUMEN GENERAL');
    console.log('==================');
    console.log(`   📝 Total preguntas activas: ${todasLasPreguntas.length}`);
    console.log('');

    if (todasLasPreguntas.length === 0) {
      console.log('❌ NO HAY PREGUNTAS EN LA BASE DE DATOS');
      console.log('💡 Necesitas importar preguntas para que el sistema funcione');
      return;
    }

    // 2. Analizar cada pregunta
    let validasParaTelegram = 0;
    let formatoJSON = 0;
    let formatoGIFT = 0;
    let noParseables = 0;
    
    console.log('📋 ANÁLISIS DETALLADO');
    console.log('====================');
    
    for (let i = 0; i < Math.min(10, todasLasPreguntas.length); i++) {
      const pregunta = todasLasPreguntas[i];
      
      console.log(`\n${i + 1}️⃣  PREGUNTA: ${pregunta.id.substring(0, 8)}...`);
      console.log(`   📊 Tipo: ${pregunta.type} | Dificultad: ${pregunta.difficulty}`);
      console.log(`   📤 Enviada: ${pregunta.sendCount} veces`);
      console.log(`   🕐 Último envío: ${pregunta.lastSuccessfulSendAt ? pregunta.lastSuccessfulSendAt.toLocaleDateString() : 'Nunca'}`);
      
      let parsedData: ParsedQuestion | null = null;
      let formato = '';
      
      // Intentar JSON primero
      try {
        const jsonData = JSON.parse(pregunta.content);
        if (jsonData.question && jsonData.options && jsonData.options.length >= 2) {
          parsedData = {
            title: jsonData.title || '',
            question: jsonData.question,
            options: jsonData.options,
            correctAnswerIndex: jsonData.correct || 0,
            explanation: jsonData.explanation || 'Respuesta correcta'
          };
          formato = 'JSON';
          formatoJSON++;
        }
      } catch {
        // Intentar GIFT
        parsedData = parseGiftContent(pregunta.content);
        if (parsedData) {
          formato = 'GIFT';
          formatoGIFT++;
        }
      }
      
      if (!parsedData) {
        console.log('   ❌ NO PARSEABLE - Formato no reconocido');
        noParseables++;
        continue;
      }
      
      console.log(`   ✅ PARSEABLE como ${formato}`);
      console.log(`   ❓ Pregunta: "${parsedData.question.substring(0, 50)}${parsedData.question.length > 50 ? '...' : ''}"`);
      console.log(`   📝 Opciones (${parsedData.options.length}): [${parsedData.options.map(o => `"${o.substring(0, 20)}${o.length > 20 ? '...' : ''}"`).join(', ')}]`);
      
      // Validar límites de Telegram
      const validacion = validateTelegramLimits(parsedData);
      
      if (validacion.valid) {
        console.log('   🎯 ✅ VÁLIDA PARA TELEGRAM');
        validasParaTelegram++;
      } else {
        console.log('   🚫 ❌ NO VÁLIDA PARA TELEGRAM');
        console.log('   📋 Problemas encontrados:');
        validacion.issues.forEach(issue => {
          console.log(`      • ${issue}`);
        });
      }
    }
    
    if (todasLasPreguntas.length > 10) {
      console.log(`\n... y ${todasLasPreguntas.length - 10} preguntas más`);
    }
    
    console.log('');
    console.log('📊 =================== RESUMEN FINAL ===================');
    console.log(`   📝 Total preguntas: ${todasLasPreguntas.length}`);
    console.log(`   📄 Formato JSON: ${formatoJSON}`);
    console.log(`   🎁 Formato GIFT: ${formatoGIFT}`);
    console.log(`   ❌ No parseables: ${noParseables}`);
    console.log(`   🎯 Válidas para Telegram: ${validasParaTelegram}`);
    console.log('');
    
    if (validasParaTelegram === 0) {
      console.log('🚨 =================== PROBLEMA CRÍTICO ===================');
      console.log('❌ NO HAY PREGUNTAS VÁLIDAS PARA TELEGRAM');
      console.log('');
      console.log('💡 SOLUCIONES:');
      console.log('   1. Revisar formato de preguntas en la base de datos');
      console.log('   2. Asegurar que las preguntas tengan máximo 200 caracteres');
      console.log('   3. Asegurar que cada opción tenga máximo 100 caracteres');
      console.log('   4. Verificar que tengan al menos 2 opciones');
      console.log('   5. Revisar formato GIFT o JSON');
      console.log('');
      console.log('🔧 RECOMENDACIÓN:');
      console.log('   • El sistema NO enviará preguntas automáticamente');
      console.log('   • Solo enviará preguntas manuales de debug hasta que se arreglen');
    } else {
      console.log('✅ =================== SISTEMA LISTO ===================');
      console.log(`🎯 Hay ${validasParaTelegram} preguntas válidas para envío automático`);
      console.log('🚀 El sistema puede enviar preguntas automáticamente');
    }
    
  } catch (error) {
    console.error('❌ Error verificando preguntas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarPreguntasBD(); 