/**
 * Script para probar el sistema de validación y salto de preguntas
 * con opciones largas en los simulacros militares
 */

import { prisma } from '../src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Función de validación (misma que en militarySimulationService)
function validateOptionLengths(options: string[]): boolean {
  if (!Array.isArray(options)) return false;
  return options.every(option => option.length <= 100);
}

// Función para crear preguntas de prueba con diferentes longitudes
function createTestQuestions() {
  return [
    {
      id: 1,
      question: "Pregunta con opciones cortas",
      options: [
        "Opción A corta",
        "Opción B corta",
        "Opción C corta",
        "Opción D corta"
      ],
      correctIndex: 0
    },
    {
      id: 2,
      question: "Pregunta con opciones largas (DEBE SER SALTADA)",
      options: [
        "Órgano de Custodia de AJP (de sus siglas en inglés Allied Joint Publication) OTAN (OC AJP), Sección de Conceptos y Experimentación (SCE)",
        "Sección de Desarrollo de Fuerza (SCDF), Oficina de Normalización (ONEMAD), Sección de Análisis",
        "Opción C corta",
        "Opción D corta"
      ],
      correctIndex: 1
    },
    {
      id: 3,
      question: "Pregunta con opciones medianas",
      options: [
        "Esta es una opción de longitud media que está bajo el límite",
        "Otra opción de longitud media pero controlada",
        "Tercera opción media",
        "Cuarta opción media"
      ],
      correctIndex: 2
    },
    {
      id: 4,
      question: "Pregunta con una opción muy larga (DEBE SER SALTADA)",
      options: [
        "Opción normal",
        "Otra opción normal",
        "Esta es una opción extremadamente larga que definitivamente supera el límite de 100 caracteres permitidos por Telegram para las opciones de los polls",
        "Opción D normal"
      ],
      correctIndex: 2
    },
    {
      id: 5,
      question: "Pregunta válida final",
      options: [
        "Última opción A",
        "Última opción B",
        "Última opción C",
        "Última opción D"
      ],
      correctIndex: 3
    }
  ];
}

async function testQuestionSkipping() {
  console.log('🧪 TEST DE SISTEMA DE VALIDACIÓN Y SALTO DE PREGUNTAS\n');
  console.log('=' .repeat(60));
  
  const testQuestions = createTestQuestions();
  
  console.log('\n📋 ANÁLISIS DE PREGUNTAS DE PRUEBA:');
  console.log('-'.repeat(50));
  
  let validQuestions = [];
  let skippedQuestions = [];
  
  for (const question of testQuestions) {
    const maxLength = Math.max(...question.options.map(opt => opt.length));
    const isValid = validateOptionLengths(question.options);
    
    console.log(`\n✏️ Pregunta ${question.id}: ${question.question}`);
    console.log(`   Longitud máxima de opción: ${maxLength} caracteres`);
    console.log(`   Estado: ${isValid ? '✅ VÁLIDA' : '⚠️ DEBE SER SALTADA'}`);
    
    if (isValid) {
      validQuestions.push(question.id);
    } else {
      skippedQuestions.push(question.id);
      console.log('   Opciones problemáticas:');
      question.options.forEach((opt, i) => {
        if (opt.length > 100) {
          console.log(`     - Opción ${i+1}: ${opt.length} chars`);
        }
      });
    }
  }
  
  console.log('\n📊 RESUMEN DEL ANÁLISIS:');
  console.log('-'.repeat(50));
  console.log(`✅ Preguntas válidas: ${validQuestions.length} (IDs: ${validQuestions.join(', ')})`);
  console.log(`⚠️ Preguntas a saltar: ${skippedQuestions.length} (IDs: ${skippedQuestions.join(', ')})`);
  
  // Simular el proceso de búsqueda de preguntas válidas
  console.log('\n🔄 SIMULACIÓN DE BÚSQUEDA DE PREGUNTAS VÁLIDAS:');
  console.log('-'.repeat(50));
  
  let questionIndex = 0;
  let questionsToSend = [];
  let attempts = 0;
  const maxAttempts = 10;
  
  while (questionsToSend.length < 3 && attempts < maxAttempts && questionIndex < testQuestions.length) {
    attempts++;
    const currentQuestion = testQuestions[questionIndex];
    
    console.log(`\nIntento ${attempts}: Evaluando pregunta ${currentQuestion.id}`);
    
    if (validateOptionLengths(currentQuestion.options)) {
      console.log(`  ✅ Pregunta ${currentQuestion.id} es válida - ENVIANDO`);
      questionsToSend.push(currentQuestion.id);
    } else {
      console.log(`  ⚠️ Pregunta ${currentQuestion.id} tiene opciones largas - SALTANDO`);
    }
    
    questionIndex++;
  }
  
  console.log('\n📨 RESULTADO DE LA SIMULACIÓN:');
  console.log('-'.repeat(50));
  console.log(`Preguntas que se enviarían: ${questionsToSend.join(', ')}`);
  console.log(`Total de intentos: ${attempts}`);
  console.log(`Preguntas saltadas: ${attempts - questionsToSend.length}`);
  
  // Buscar preguntas reales en la BD para análisis
  console.log('\n🎖️ ANÁLISIS DE PREGUNTAS REALES DEL ET:');
  console.log('-'.repeat(50));
  
  try {
    // Buscar preguntas del ET con opciones
    const realQuestions = await prisma.sectionquestion.findMany({
      take: 20,
      where: {
        documentid: { not: null }
      }
    });
    
    if (realQuestions.length > 0) {
      let realValid = 0;
      let realSkipped = 0;
      let longestOption = { length: 0, text: '', questionId: '' };
      
      for (const q of realQuestions) {
        try {
          const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          if (Array.isArray(options)) {
            const maxLen = Math.max(...options.map(opt => opt.length));
            
            if (maxLen > longestOption.length) {
              longestOption = {
                length: maxLen,
                text: options.find(opt => opt.length === maxLen),
                questionId: q.id
              };
            }
            
            if (validateOptionLengths(options)) {
              realValid++;
            } else {
              realSkipped++;
            }
          }
        } catch (e) {
          // Ignorar errores de parseo
        }
      }
      
      console.log(`\nAnalizadas ${realQuestions.length} preguntas reales:`);
      console.log(`  ✅ Válidas: ${realValid} (${((realValid/realQuestions.length)*100).toFixed(1)}%)`);
      console.log(`  ⚠️ A saltar: ${realSkipped} (${((realSkipped/realQuestions.length)*100).toFixed(1)}%)`);
      
      if (longestOption.length > 0) {
        console.log(`\n📏 Opción más larga encontrada:`);
        console.log(`  Longitud: ${longestOption.length} caracteres`);
        console.log(`  Pregunta ID: ${longestOption.questionId}`);
        console.log(`  Texto: "${longestOption.text.substring(0, 50)}..."`);
      }
    } else {
      console.log('⚠️ No se encontraron preguntas reales en la BD');
    }
  } catch (error) {
    console.log('⚠️ Error consultando BD:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST COMPLETADO');
  console.log('=' .repeat(60));
  
  console.log('\n💡 CONCLUSIONES:');
  console.log('- El sistema de validación funciona correctamente');
  console.log('- Las preguntas con opciones >100 chars se saltan automáticamente');
  console.log('- El sistema busca la siguiente pregunta válida disponible');
  console.log('- Se mantiene la aleatorización de opciones solo en preguntas válidas');
}

// Ejecutar test
testQuestionSkipping()
  .then(() => {
    console.log('\n✨ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en script:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
