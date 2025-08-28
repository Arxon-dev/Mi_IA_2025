#!/usr/bin/env node

import { 
  getSuggestedQuestions, 
  getSuggestedQuestionsLegacyFloor, 
  getSuggestedQuestionsLegacyRound 
} from '../src/utils/questionUtils';

console.log('🧪 Probando función centralizada getSuggestedQuestions...\n');

// Casos de prueba
const testCases = [
  {
    name: 'Texto vacío',
    text: '',
    expected: { floor: 1, round: 1, default: 1 }
  },
  {
    name: 'Texto muy corto (50 palabras)',
    text: 'Este es un texto de prueba que contiene exactamente cincuenta palabras para validar el comportamiento de la función de sugerencia de preguntas. Necesitamos verificar que el cálculo sea correcto tanto para el método floor como para round. Texto adicional aquí para completar.',
    expected: { floor: 1, round: 1, default: 1 }
  },
  {
    name: 'Texto mediano (150 palabras)',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
    expected: { floor: 1, round: 2, default: 2 }
  },
  {
    name: 'Texto largo (250 palabras)',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Mauris ultricies ligula sed magna dictum porta. Donec rutrum congue leo eget malesuada. Nulla quis lorem ut libero malesuada feugiat. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Sed porttitor lectus nibh. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Mauris ultricies ligula sed magna dictum porta. Donec rutrum congue leo eget malesuada. Nulla quis lorem ut libero malesuada feugiat. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Sed porttitor lectus nibh. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Mauris ultricies ligula sed magna dictum porta. Donec rutrum congue leo eget malesuada. Nulla quis lorem ut libero malesuada feugiat. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Sed porttitor lectus nibh. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a.',
    expected: { floor: 2, round: 2, default: 2 }
  },
  {
    name: 'Texto con espacios múltiples',
    text: 'Palabra1    palabra2        palabra3     palabra4     palabra5     palabra6     palabra7     palabra8     palabra9     palabra10',
    expected: { floor: 1, round: 1, default: 1 }
  }
];

let allTestsPassed = true;

testCases.forEach((testCase, index) => {
  console.log(`📝 Test ${index + 1}: ${testCase.name}`);
  
  const resultFloor = getSuggestedQuestionsLegacyFloor(testCase.text);
  const resultRound = getSuggestedQuestionsLegacyRound(testCase.text);
  const resultDefault = getSuggestedQuestions(testCase.text);
  
  console.log(`   Texto: "${testCase.text.substring(0, 60)}${testCase.text.length > 60 ? '...' : ''}"`);
  console.log(`   Palabras: ${testCase.text.trim().split(/\s+/).filter(Boolean).length}`);
  console.log(`   Resultados:`);
  console.log(`     - Legacy Floor: ${resultFloor} (esperado: ${testCase.expected.floor})`);
  console.log(`     - Legacy Round: ${resultRound} (esperado: ${testCase.expected.round})`);
  console.log(`     - Por defecto:  ${resultDefault} (esperado: ${testCase.expected.default})`);
  
  const floorPassed = resultFloor === testCase.expected.floor;
  const roundPassed = resultRound === testCase.expected.round;
  const defaultPassed = resultDefault === testCase.expected.default;
  
  if (floorPassed && roundPassed && defaultPassed) {
    console.log(`   ✅ PASÓ\n`);
  } else {
    console.log(`   ❌ FALLÓ`);
    if (!floorPassed) console.log(`      - Floor: esperado ${testCase.expected.floor}, obtuvo ${resultFloor}`);
    if (!roundPassed) console.log(`      - Round: esperado ${testCase.expected.round}, obtuvo ${resultRound}`);
    if (!defaultPassed) console.log(`      - Default: esperado ${testCase.expected.default}, obtuvo ${resultDefault}`);
    console.log();
    allTestsPassed = false;
  }
});

// Pruebas de configuración personalizada
console.log('⚙️ Probando configuración personalizada...\n');

const customText = 'Este es un texto de prueba para validar configuraciones personalizadas de la función getSuggestedQuestions.';

console.log('📝 Configuraciones personalizadas:');
console.log(`   Texto: "${customText}"`);
console.log(`   Palabras: ${customText.trim().split(/\s+/).filter(Boolean).length}`);

const configTests = [
  { config: { wordsPerQuestion: 50 }, name: '50 palabras por pregunta' },
  { config: { wordsPerQuestion: 200 }, name: '200 palabras por pregunta' },
  { config: { roundingMethod: 'ceil' as const }, name: 'Redondeo hacia arriba' },
  { config: { useRobustTextProcessing: false }, name: 'Procesamiento simple' }
];

configTests.forEach(({ config, name }) => {
  const result = getSuggestedQuestions(customText, config);
  console.log(`   - ${name}: ${result} preguntas`);
});

console.log(`\n🎯 Resultado final: ${allTestsPassed ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGUNOS TESTS FALLARON'}`);

process.exit(allTestsPassed ? 0 : 1); 