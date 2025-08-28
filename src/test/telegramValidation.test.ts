/**
 * Test básico para verificar la funcionalidad de validación de Telegram
 */

import { TelegramValidationService, TelegramQuestionData } from '../services/telegramValidationService';

// Test data
const validTelegramQuestion: TelegramQuestionData = {
  question: "¿Qué establece el Art. 65.1 Ley 40/2015 sobre Secretarios generales técnicos?", // 82 chars
  options: [
    "Competencias sobre servicios comunes", // 35 chars
    "Dependencia directa del Ministro", // 32 chars
    "Funciones de coordinación", // 25 chars
    "Gestión presupuestaria exclusiva" // 32 chars
  ],
  feedback: "Art. 65.1: Los Secretarios generales técnicos tienen competencias sobre servicios comunes según RD de estructura." // 118 chars
};

const invalidTelegramQuestion: TelegramQuestionData = {
  question: "Según el Artículo 65.1 de la Ley 40/2015, de 1 de octubre, de Régimen Jurídico del Sector Público, en relación con las competencias de los Secretarios generales técnicos, bajo la inmediata dependencia del Subsecretario, ¿cuál de las siguientes afirmaciones sobre sus competencias es correcta?", // 320+ chars
  options: [
    "Tendrán las competencias sobre servicios comunes que les atribuya el Real Decreto de estructura del Departamento ministerial correspondiente", // 140+ chars
    "Dependencia directa del Ministro sin intermediarios organizativos", // 67 chars
    "Exclusivamente funciones de coordinación administrativa", // 55 chars
    "Competencias limitadas únicamente a la gestión presupuestaria" // 62 chars
  ],
  feedback: "El Artículo 65.1 de la Ley 40/2015 establece que los Secretarios generales técnicos, bajo la inmediata dependencia del Subsecretario, tendrán las competencias sobre servicios comunes que les atribuya el Real Decreto de estructura del Departamento y, en todo caso, respecto a la gestión económica y presupuestaria." // 300+ chars
};

// Test functions
export function testTelegramValidation() {
  console.log('🧪 Iniciando tests de validación de Telegram...');
  
  // Test 1: Pregunta válida
  console.log('\n📝 Test 1: Pregunta válida');
  const validResult = TelegramValidationService.validateQuestion(validTelegramQuestion);
  console.log('Resultado:', validResult);
  console.log('✅ Válida:', validResult.isValid);
  console.log('📊 Longitudes:', {
    pregunta: validResult.questionLength,
    opciones: validResult.optionLengths,
    feedback: validResult.feedbackLength
  });
  
  // Test 2: Pregunta inválida
  console.log('\n📝 Test 2: Pregunta inválida');
  const invalidResult = TelegramValidationService.validateQuestion(invalidTelegramQuestion);
  console.log('Resultado:', invalidResult);
  console.log('❌ Válida:', invalidResult.isValid);
  console.log('🚨 Errores:', invalidResult.errors);
  console.log('📊 Longitudes:', {
    pregunta: invalidResult.questionLength,
    opciones: invalidResult.optionLengths,
    feedback: invalidResult.feedbackLength
  });
  
  // Test 3: Truncamiento de feedback
  console.log('\n📝 Test 3: Truncamiento de feedback');
  const longFeedback = "Este es un feedback muy largo que excede los 200 caracteres permitidos por Telegram. Necesitamos verificar que el sistema puede truncar automáticamente este texto manteniendo palabras completas cuando sea posible y añadiendo puntos suspensivos al final.";
  const truncated = TelegramValidationService.truncateFeedback(longFeedback);
  console.log('Original:', longFeedback.length, 'chars');
  console.log('Truncado:', truncated.length, 'chars');
  console.log('Texto truncado:', truncated);
  
  // Test 4: Reporte de validación
  console.log('\n📝 Test 4: Reporte de validación múltiple');
  const questions = [validTelegramQuestion, invalidTelegramQuestion];
  const report = TelegramValidationService.getValidationReport(questions);
  console.log('Reporte:', report);
  
  console.log('\n✅ Tests de validación de Telegram completados');
}

// Test de límites específicos
export function testTelegramLimits() {
  console.log('\n🔍 Verificando límites de Telegram...');
  const limits = TelegramValidationService.getLimits();
  console.log('Límites configurados:', limits);
  
  // Verificar que los límites son correctos
  const expectedLimits = {
    question: 300,
    option: 150,
    feedback: 200
  };
  
  const limitsMatch = JSON.stringify(limits) === JSON.stringify(expectedLimits);
  console.log('✅ Límites correctos:', limitsMatch);
  
  if (!limitsMatch) {
    console.error('❌ Los límites no coinciden con los esperados');
    console.error('Esperados:', expectedLimits);
    console.error('Actuales:', limits);
  }
}

// Ejecutar tests si se ejecuta directamente
if (typeof window === 'undefined' && require.main === module) {
  testTelegramValidation();
  testTelegramLimits();
} 