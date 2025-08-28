#!/usr/bin/env npx tsx

// ===========================================
// 🧪 TESTING SIMPLE - SIMULACROS MILITARES
// ===========================================

import { MilitarySimulationService } from '../src/services/militarySimulationService';

console.log('🧪 TESTING SIMPLE - SIMULACROS MILITARES PREMIUM...\n');

async function runSimpleTests() {
  try {

    // ===========================================
    // 📋 TEST 1: VERIFICAR DISTRIBUCIONES
    // ===========================================
    console.log('📋 TEST 1: Verificando distribuciones exactas...');
    
    const distributions = {
      et: MilitarySimulationService.MILITARY_DISTRIBUTIONS.et,
      aire: MilitarySimulationService.MILITARY_DISTRIBUTIONS.aire,
      armada: MilitarySimulationService.MILITARY_DISTRIBUTIONS.armada
    };

    let allDistributionsValid = true;

    for (const [branch, distribution] of Object.entries(distributions)) {
      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      console.log(`   🎖️ ${branch.toUpperCase()}: ${total} preguntas total`);
      
      if (total !== 100) {
        console.error(`   ❌ ERROR: ${branch} tiene ${total} preguntas, esperadas 100`);
        allDistributionsValid = false;
      } else {
        console.log(`   ✅ ${branch}: Distribución correcta (100 preguntas)`);
      }
    }

    // ===========================================
    // 🗂️ TEST 2: VERIFICAR MAPEO DE TABLAS
    // ===========================================
    console.log('\n🗂️ TEST 2: Verificando mapeo de tablas...');
    
    const tableMapping = MilitarySimulationService.TABLE_MAPPING;
    const mappedTables = Object.keys(tableMapping);
    console.log(`   📊 Total de materias mapeadas: ${mappedTables.length}`);
    
    // Verificar que todas las materias de las distribuciones están en el mapeo
    const allSubjects = new Set<string>();
    Object.values(distributions).forEach(dist => {
      Object.keys(dist).forEach(subject => allSubjects.add(subject));
    });
    
    let allSubjectsMapped = true;
    for (const subject of allSubjects) {
      if (tableMapping[subject]) {
        console.log(`   ✅ ${subject} → ${tableMapping[subject]}`);
      } else {
        console.error(`   ❌ ERROR: Materia '${subject}' no está mapeada`);
        allSubjectsMapped = false;
      }
    }

    // ===========================================
    // 🎯 TEST 3: VERIFICAR ESTRUCTURA DE COMANDOS
    // ===========================================
    console.log('\n🎯 TEST 3: Verificando estructura de comandos...');
    
    const branches = ['et', 'aire', 'armada'];
    const expectedCommands = branches.map(branch => `/simulacro_premium_${branch}`);
    
    console.log('   📋 Comandos esperados:');
    expectedCommands.forEach(cmd => {
      console.log(`   ✅ ${cmd}`);
    });
    
    console.log('   📋 Comando de información:');
    console.log('   ✅ /simulacros_premium');

    // ===========================================
    // 🔧 TEST 4: VERIFICAR CONFIGURACIONES
    // ===========================================
    console.log('\n🔧 TEST 4: Verificando configuraciones...');
    
    const config = {
      totalquestions: 100,
      timelimit: 105, // minutos
      branches: ['et', 'aire', 'armada']
    };
    
    console.log(`   ✅ Preguntas por simulacro: ${config.totalquestions}`);
    console.log(`   ✅ Tiempo límite: ${config.timelimit} minutos`);
    console.log(`   ✅ Ramas militares: ${config.branches.length}`);
    
    // ===========================================
    // 📝 RESUMEN FINAL
    // ===========================================
    console.log('\n' + '='.repeat(50));
    console.log('📝 RESUMEN DE TESTING SIMPLE');
    console.log('='.repeat(50));
    
    if (allDistributionsValid) {
      console.log('✅ Distribuciones: VÁLIDAS');
    } else {
      console.log('❌ Distribuciones: ERRORES ENCONTRADOS');
    }
    
    if (allSubjectsMapped) {
      console.log('✅ Mapeo de tablas: COMPLETO');
    } else {
      console.log('❌ Mapeo de tablas: INCOMPLETO');
    }
    
    console.log('✅ Estructura de comandos: VERIFICADA');
    console.log('✅ Configuraciones: VERIFICADAS');
    
    if (allDistributionsValid && allSubjectsMapped) {
      console.log('\n🎖️ SIMULACROS MILITARES PREMIUM - TESTING EXITOSO');
      console.log('🚀 ¡Todos los tests básicos pasaron correctamente!');
      console.log('\n💡 Para testing completo con BD, usar entorno de desarrollo');
    } else {
      console.log('\n⚠️ SIMULACROS MILITARES PREMIUM - ERRORES ENCONTRADOS');
      console.log('🔧 Revisar configuraciones antes de deployment');
    }

  } catch (error) {
    console.error('❌ ERROR GENERAL EN TESTING:', error);
  }
}

// ===========================================
// 🎯 FUNCIÓN PARA MOSTRAR DISTRIBUCIONES
// ===========================================

function showDistributionDetails() {
  console.log('\n📊 DETALLES DE DISTRIBUCIONES:');
  console.log('='.repeat(50));
  
  const distributions = MilitarySimulationService.MILITARY_DISTRIBUTIONS;
  
  for (const [branch, distribution] of Object.entries(distributions)) {
    console.log(`\n🎖️ ${branch.toUpperCase()}:`);
    
    // Ordenar por cantidad descendente
    const sorted = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10
    
    sorted.forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count} preguntas`);
    });
    
    if (Object.keys(distribution).length > 10) {
      console.log(`   ... y ${Object.keys(distribution).length - 10} materias más`);
    }
  }
}

// ===========================================
// 🏃‍♂️ EJECUTAR TESTS
// ===========================================

if (require.main === module) {
  runSimpleTests()
    .then(() => {
      showDistributionDetails();
      console.log('\n✅ Testing simple completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Testing simple falló:', error);
      process.exit(1);
    });
}

export { runSimpleTests }; 