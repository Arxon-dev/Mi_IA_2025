import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🧪 SCRIPT DE PRUEBA: SANITIZACIÓN DE PREGUNTAS DE TORNEOS
 * 
 * Este script verifica que las preguntas de torneos cumplan con los
 * nuevos límites y sanitización de caracteres para Telegram.
 */

// ✅ FUNCIÓN DE SANITIZACIÓN PARA TELEGRAM (COPIA DE LA IMPLEMENTACIÓN)
function sanitizeForTelegram(text: string): string {
  if (!text) return '';
  
  // Limpiar caracteres especiales problemáticos para la API de Telegram
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Eliminar caracteres de espacio en blanco invisibles
    .replace(/[^\x00-\x7F]/g, (char) => {   // Manejar caracteres Unicode problemáticos
      // Mantener caracteres UTF-8 comunes pero problemáticos
      const safeUnicode = 'áéíóúñÁÉÍÓÚÑ¿¡üÜ€';
      return safeUnicode.includes(char) ? char : '';
    })
    .replace(/[`*_\[\]()~>#+=|{}.!-]/g, '') // Eliminar caracteres que pueden interferir con Markdown
    .replace(/\s+/g, ' ')                   // Normalizar espacios múltiples
    .trim();
}

async function testQuestionSanitization() {
  try {
    console.log('🧪 ===== ANÁLISIS DE PREGUNTAS DE TORNEOS =====');
    console.log('⏰ Iniciando análisis...\n');
    
    const TELEGRAM_POLL_MAX_LENGTH = 1024;
    const HEADER_LENGTH = 60; // Estimación del header del torneo
    
    let totalQuestions = 0;
    let problematicQuestions = 0;
    let tooLongQuestions = 0;
    let sanitizedQuestions = 0;
    
    // Analizar ExamenOficial2018
    await analyzeTable('ExamenOficial2018', 
      await prisma.examenOficial2018.findMany({ take: 100, orderBy: { questionnumber: 'asc' } }));
    
    // Analizar ExamenOficial2024
    await analyzeTable('ExamenOficial2024', 
      await prisma.examenOficial2024.findMany({ take: 100, orderBy: { questionnumber: 'asc' } }));
    
    // Analizar ValidQuestion
    await analyzeTable('ValidQuestion', 
      await prisma.validQuestion.findMany({ take: 100, orderBy: { createdAt: 'asc' } }));
    
    async function analyzeTable(tableName: string, questions: any[]) {
      console.log(`\n📋 ANALIZANDO: ${tableName}`);
      console.log('─'.repeat(50));
      
      totalQuestions += questions.length;
      console.log(`📊 Preguntas encontradas: ${questions.length}`);
      
      let tableProblematic = 0;
      let tableTooLong = 0;
      let tableSanitized = 0;
      
      for (const question of questions) {
        const questionText = question.question || question.parsedQuestion || '';
        const originalLength = questionText.length;
        
        // Simular header de torneo
        const tournamentHeader = `🏆 TORNEO: Examen Oficial\n❓ Pregunta 1/50\n\n`;
        const fullQuestion = tournamentHeader + questionText;
        
        // Aplicar sanitización
        const sanitizedQuestion = sanitizeForTelegram(fullQuestion);
        const sanitizedLength = sanitizedQuestion.length;
        
        // Verificar si hubo cambios por sanitización
        if (sanitizedQuestion !== fullQuestion) {
          tableSanitized++;
          sanitizedQuestions++;
        }
        
        // Verificar si excede límites
        if (sanitizedLength > TELEGRAM_POLL_MAX_LENGTH) {
          tableTooLong++;
          tooLongQuestions++;
          console.log(`❌ DEMASIADO LARGA: Q${question.questionnumber || question.id} - ${sanitizedLength} chars`);
          console.log(`   📝 Texto: ${questionText.substring(0, 100)}...`);
        }
        
        // Verificar caracteres problemáticos
        const hasProblematicChars = /[\u200B-\u200D\uFEFF]/.test(questionText) ||
                                   /[`*_\[\]()~>#+=|{}.!-]/.test(questionText);
        
        if (hasProblematicChars) {
          tableProblematic++;
          problematicQuestions++;
        }
      }
      
      console.log(`📊 Resumen ${tableName}:`);
      console.log(`   🧹 Sanitizadas: ${tableSanitized}`);
      console.log(`   ❌ Demasiado largas: ${tableTooLong}`);
      console.log(`   ⚠️ Caracteres problemáticos: ${tableProblematic}`);
    }
    
    console.log('\n🎯 ===== RESUMEN GLOBAL =====');
    console.log(`📊 Total preguntas analizadas: ${totalQuestions}`);
    console.log(`🧹 Preguntas que necesitaron sanitización: ${sanitizedQuestions} (${((sanitizedQuestions/totalQuestions)*100).toFixed(1)}%)`);
    console.log(`❌ Preguntas demasiado largas: ${tooLongQuestions} (${((tooLongQuestions/totalQuestions)*100).toFixed(1)}%)`);
    console.log(`⚠️ Preguntas con caracteres problemáticos: ${problematicQuestions} (${((problematicQuestions/totalQuestions)*100).toFixed(1)}%)`);
    
    // Probar opciones también
    console.log('\n🔍 ===== ANÁLISIS DE OPCIONES =====');
    await testOptions();
    
    console.log('\n✅ Análisis completado');
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testOptions() {
  try {
    const validQuestions = await prisma.validQuestion.findMany({
      take: 50,
      select: { parsedOptions: true, id: true }
    });
    
    let problematicOptions = 0;
    let totalOptions = 0;
    
    for (const question of validQuestions) {
      const options = question.parsedOptions as string[];
      if (Array.isArray(options)) {
        totalOptions += options.length;
        
        for (const option of options) {
          const sanitized = sanitizeForTelegram(option);
          if (sanitized !== option) {
            problematicOptions++;
          }
          
          if (sanitized.length > 100) { // Límite de Telegram para opciones
            console.log(`❌ OPCIÓN DEMASIADO LARGA: ${sanitized.length} chars - "${sanitized.substring(0, 50)}..."`);
          }
        }
      }
    }
    
    console.log(`📊 Total opciones analizadas: ${totalOptions}`);
    console.log(`🧹 Opciones que necesitaron sanitización: ${problematicOptions} (${((problematicOptions/totalOptions)*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error analizando opciones:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testQuestionSanitization();
}

export { testQuestionSanitization, sanitizeForTelegram }; 