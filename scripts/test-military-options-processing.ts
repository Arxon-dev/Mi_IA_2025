/**
 * Script para probar el truncado inteligente y aleatorización de opciones
 * en los simulacros militares
 */

import { prisma } from '../src/lib/prisma';

// Función de truncado inteligente (misma que en militarySimulationService)
function truncateOption(option: string): string {
  if (option.length > 100) {
    // Intentar cortar en el último espacio antes del límite
    const lastSpaceIndex = option.lastIndexOf(' ', 97);
    if (lastSpaceIndex > 80) {
      // Si hay un espacio razonable, cortar ahí
      return option.substring(0, lastSpaceIndex) + '...';
    } else {
      // Si no, cortar directo
      return option.substring(0, 97) + '...';
    }
  }
  return option;
}

// Función de aleatorización Fisher-Yates
function shuffleOptions(options: string[], correctIndex: number) {
  const optionsWithIndex = options.map((option, index) => ({
    option,
    originalIndex: index
  }));
  
  // Aplicar Fisher-Yates shuffle
  for (let i = optionsWithIndex.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
  }
  
  // Extraer opciones mezcladas y encontrar nuevo índice correcto
  const shuffledOptions = optionsWithIndex.map(item => item.option);
  const newCorrectIndex = optionsWithIndex.findIndex(item => item.originalIndex === correctIndex);
  
  return {
    shuffledOptions,
    newCorrectIndex
  };
}

async function testOptionsProcessing() {
  console.log('🧪 TEST DE PROCESAMIENTO DE OPCIONES PARA SIMULACROS MILITARES\n');
  console.log('=' .repeat(60));

  // Caso de prueba 1: Opciones largas que necesitan truncado
  console.log('\n📏 TEST 1: Truncado inteligente de opciones largas');
  console.log('-'.repeat(50));
  
  const longOptions = [
    'Órgano de Custodia de AJP (de sus siglas en inglés Allied Joint Publication) OTAN (OC AJP), Sección de Conceptos y Experimentación (SCE) y Sección de Análisis y Lecciones Aprendidas (SALA)',
    'Sección de Desarrollo de Fuerza (SCDF), Oficina de Normalización (ONEMAD), Sección de Análisis y Lecciones Aprendidas (SALA)',
    'Sección de Planeamiento Operativo, Sección de Inteligencia Militar, Sección de Apoyo Logístico y Sección de Recursos Humanos',
    'Órgano Custodia AJP OTAN (OCA), Sección Análisis Estratégico (SAE), Sección Conceptos y Experimentación (SCE)'
  ];
  
  console.log('Opciones originales:');
  longOptions.forEach((opt, i) => {
    console.log(`  ${i+1}. [${opt.length} chars] ${opt.substring(0, 50)}...`);
  });
  
  const truncatedOptions = longOptions.map(truncateOption);
  console.log('\nOpciones truncadas:');
  truncatedOptions.forEach((opt, i) => {
    console.log(`  ${i+1}. [${opt.length} chars] ${opt}`);
  });
  
  // Verificar que ninguna opción supera 100 caracteres
  const allUnder100 = truncatedOptions.every(opt => opt.length <= 100);
  console.log(`\n✅ Todas las opciones están bajo 100 caracteres: ${allUnder100}`);

  // Caso de prueba 2: Aleatorización de opciones
  console.log('\n🎲 TEST 2: Aleatorización de opciones');
  console.log('-'.repeat(50));
  
  const testOptions = ['Opción A', 'Opción B (Correcta)', 'Opción C', 'Opción D'];
  const correctIndex = 1; // B es la correcta
  
  console.log('Opciones originales:');
  testOptions.forEach((opt, i) => {
    console.log(`  ${i}: ${opt} ${i === correctIndex ? '✅' : ''}`);
  });
  
  // Hacer 10 pruebas de aleatorización para ver distribución
  const positionCounts = [0, 0, 0, 0];
  console.log('\nEjecutando 10 aleatorizaciones...');
  
  for (let test = 0; test < 10; test++) {
    const { shuffledOptions, newCorrectIndex } = shuffleOptions(testOptions, correctIndex);
    positionCounts[newCorrectIndex]++;
    
    console.log(`\nPrueba ${test + 1}:`);
    shuffledOptions.forEach((opt, i) => {
      const isCorrect = i === newCorrectIndex;
      console.log(`  ${i}: ${opt} ${isCorrect ? '✅' : ''}`);
    });
  }
  
  console.log('\n📊 Distribución de la respuesta correcta:');
  positionCounts.forEach((count, pos) => {
    const percentage = (count / 10) * 100;
    console.log(`  Posición ${pos}: ${count} veces (${percentage}%)`);
  });
  
  // Caso de prueba 3: Pregunta real del Ejército de Tierra
  console.log('\n🎖️ TEST 3: Pregunta real del ET con opciones largas');
  console.log('-'.repeat(50));
  
  try {
    // Buscar una pregunta con opciones largas
    const longQuestion = await prisma.sectionquestion.findFirst({
      where: {
        AND: [
          { section: { contains: 'Décimo' } },
          { question: { contains: 'CCDC' } }
        ]
      }
    });
    
    if (longQuestion) {
      console.log(`\nPregunta encontrada: ${longQuestion.question.substring(0, 100)}...`);
      
      // Parsear opciones
      let options = [];
      try {
        options = typeof longQuestion.options === 'string' 
          ? JSON.parse(longQuestion.options)
          : longQuestion.options;
      } catch (e) {
        console.log('⚠️ Error parseando opciones, usando valores de ejemplo');
        options = longOptions;
      }
      
      // Procesar opciones
      const processedOptions = options.map(truncateOption);
      const { shuffledOptions, newCorrectIndex } = shuffleOptions(
        processedOptions, 
        longQuestion.correctanswerindex || 0
      );
      
      console.log('\nOpciones procesadas y aleatorizadas:');
      shuffledOptions.forEach((opt, i) => {
        const isCorrect = i === newCorrectIndex;
        console.log(`  ${String.fromCharCode(65 + i)}. [${opt.length} chars] ${opt} ${isCorrect ? '✅' : ''}`);
      });
      
      console.log(`\n✅ Índice correcto original: ${longQuestion.correctanswerindex}`);
      console.log(`✅ Nuevo índice después de aleatorizar: ${newCorrectIndex}`);
    } else {
      console.log('⚠️ No se encontró pregunta con opciones largas en la BD');
    }
  } catch (error) {
    console.log('⚠️ Error consultando BD:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTS COMPLETADOS');
  console.log('=' .repeat(60));
}

// Ejecutar tests
testOptionsProcessing()
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
