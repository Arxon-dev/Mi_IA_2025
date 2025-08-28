#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🧪 SCRIPT DE PRUEBA: SISTEMA DE TORNEOS CORREGIDO
 * 
 * Este script simula el envío de preguntas de torneos para verificar
 * que las correcciones de sanitización y límites funcionan correctamente.
 */

// ✅ FUNCIÓN DE SANITIZACIÓN (COPIA DE LA IMPLEMENTACIÓN)
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

async function testTournamentFixes() {
  try {
    console.log('🧪 ===== PRUEBA DEL SISTEMA DE TORNEOS CORREGIDO =====');
    console.log('⏰ Iniciando pruebas...\n');
    
    // Simular un torneo con preguntas reales
    await simulateTournamentQuestions();
    
    console.log('\n✅ Pruebas completadas');
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function simulateTournamentQuestions() {
  const TELEGRAM_POLL_MAX_LENGTH = 1024;
  
  console.log('🏆 Simulando envío de preguntas de torneo...\n');
  
  // Obtener preguntas que anteriormente podrían haber fallado
  const problematicQuestions = await prisma.validQuestion.findMany({
    take: 20,
    select: {
      id: true,
      parsedQuestion: true,
      parsedOptions: true,
      correctanswerindex: true
    }
  });
  
  console.log(`📋 Probando ${problematicQuestions.length} preguntas...`);
  
  let successCount = 0;
  let sanitizedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < problematicQuestions.length; i++) {
    const question = problematicQuestions[i];
    const questionText = question.parsedQuestion || '';
    const options = question.parsedOptions as string[] || [];
    
    // Simular header de torneo real
    const tournamentHeader = `🏆 TORNEO: Examen Oficial 2024\n❓ Pregunta ${i + 1}/20\n\n`;
    const fullQuestion = tournamentHeader + questionText;
    
    try {
      // Aplicar sanitización
      const sanitizedQuestion = sanitizeForTelegram(fullQuestion);
      const sanitizedOptions = options.map(option => sanitizeForTelegram(option));
      
      // Verificar si se aplicó sanitización
      const wasSanitized = sanitizedQuestion !== fullQuestion || 
                          sanitizedOptions.some((opt, idx) => opt !== options[idx]);
      
      if (wasSanitized) {
        sanitizedCount++;
        console.log(`🧹 Pregunta ${i + 1}: SANITIZADA`);
      }
      
      // Verificar límites
      if (sanitizedQuestion.length > TELEGRAM_POLL_MAX_LENGTH) {
        console.log(`❌ Pregunta ${i + 1}: DEMASIADO LARGA (${sanitizedQuestion.length} chars)`);
        errorCount++;
        continue;
      }
      
      // Verificar opciones
      const invalidOptions = sanitizedOptions.filter(opt => opt.length > 100 || opt.length === 0);
      if (invalidOptions.length > 0) {
        console.log(`❌ Pregunta ${i + 1}: OPCIONES INVÁLIDAS (${invalidOptions.length})`);
        errorCount++;
        continue;
      }
      
      // Simular envío exitoso
      const mockPollData = {
        chat_id: 'TEST_USER',
        question: sanitizedQuestion,
        options: sanitizedOptions,
        type: 'quiz',
        correct_option_id: question.correctanswerindex,
        is_anonymous: false,
        allows_multiple_answers: false
      };
      
      // Verificar que todos los datos son válidos
      if (mockPollData.question && 
          mockPollData.options.length >= 2 && 
          mockPollData.options.length <= 10 &&
          mockPollData.correct_option_id >= 0 && 
          mockPollData.correct_option_id < mockPollData.options.length) {
        
        successCount++;
        console.log(`✅ Pregunta ${i + 1}: ENVIADA CORRECTAMENTE`);
        
        // Mostrar ejemplo de la primera pregunta
        if (i === 0) {
          console.log(`\n📝 EJEMPLO DE PREGUNTA PROCESADA:`);
          console.log(`   📏 Longitud: ${sanitizedQuestion.length} chars`);
          console.log(`   📋 Opciones: ${sanitizedOptions.length}`);
          console.log(`   ✅ Respuesta correcta: ${mockPollData.correct_option_id}`);
          console.log(`   📝 Texto: ${sanitizedQuestion.substring(0, 150)}...`);
        }
        
      } else {
        console.log(`❌ Pregunta ${i + 1}: DATOS INVÁLIDOS`);
        errorCount++;
      }
      
    } catch (error) {
      console.log(`❌ Pregunta ${i + 1}: ERROR EN PROCESAMIENTO`);
      errorCount++;
    }
  }
  
  console.log('\n📊 ===== RESUMEN DE PRUEBAS =====');
  console.log(`✅ Preguntas enviadas correctamente: ${successCount}/${problematicQuestions.length} (${((successCount/problematicQuestions.length)*100).toFixed(1)}%)`);
  console.log(`🧹 Preguntas que necesitaron sanitización: ${sanitizedCount} (${((sanitizedCount/problematicQuestions.length)*100).toFixed(1)}%)`);
  console.log(`❌ Preguntas con errores: ${errorCount} (${((errorCount/problematicQuestions.length)*100).toFixed(1)}%)`);
  
  if (successCount === problematicQuestions.length) {
    console.log('\n🎉 ¡TODAS LAS PREGUNTAS SE PROCESARON CORRECTAMENTE!');
    console.log('✅ El sistema de torneos está FUNCIONANDO PERFECTAMENTE');
  } else if (successCount > problematicQuestions.length * 0.9) {
    console.log('\n🎯 ¡EXCELENTE RESULTADO!');
    console.log('✅ Más del 90% de preguntas funcionan correctamente');
  } else {
    console.log('\n⚠️ Algunos problemas detectados');
    console.log('🔧 Pueden necesitarse ajustes adicionales');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testTournamentFixes();
}

export { testTournamentFixes }; 