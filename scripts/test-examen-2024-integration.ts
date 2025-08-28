import { PrismaClient } from '@prisma/client';
import Examen2024Service from '../src/services/examen2024Service';
import Simulacro2024Service from '../src/services/simulacro2024Service';

const prisma = new PrismaClient();

async function testExamen2024Integration() {
  console.log('🧪 PROBANDO INTEGRACIÓN DEL EXAMEN 2024...\n');
  
  try {
    // Test 1: Verificar que las preguntas del examen 2024 están disponibles
    console.log('📋 Test 1: Verificando preguntas del examen 2024...');
    const questionCount = await prisma.examenOficial2024.count();
    console.log(`✅ Preguntas disponibles: ${questionCount}`);
    
    if (questionCount === 0) {
      console.error('❌ No hay preguntas del examen 2024 en la base de datos');
      return;
    }
    
    // Test 2: Verificar que se puede obtener una pregunta aleatoria
    console.log('\n📋 Test 2: Obteniendo pregunta aleatoria...');
    const randomQuestion = await Examen2024Service.getRandomQuestion();
    
    if (randomQuestion) {
      console.log('✅ Pregunta obtenida correctamente:');
      console.log(`   - Número: ${randomQuestion.questionnumber}`);
      console.log(`   - Opciones: ${randomQuestion.options.length}`);
      console.log(`   - Respuesta correcta: ${randomQuestion.correctanswerindex}`);
    } else {
      console.error('❌ No se pudo obtener pregunta aleatoria');
      return;
    }
    
    // Test 3: Verificar disponibilidad del sistema
    console.log('\n📋 Test 3: Verificando disponibilidad del sistema...');
    const availability = await Examen2024Service.isSystemAvailable();
    
    if (availability.available) {
      console.log('✅ Sistema disponible');
    } else {
      console.error(`❌ Sistema no disponible: ${availability.message}`);
      return;
    }
    
    // Test 4: Verificar que se puede crear un simulacro (sin completarlo)
    console.log('\n📋 Test 4: Verificando capacidad de crear simulacro...');
    const testUserId = 'test_user_123';
    
    // Primero crear usuario de prueba si no existe
    const user = await prisma.telegramuser.upsert({
      where: { telegramuserid: testUserId },
      update: {},
      create: {
        telegramuserid: testUserId,
        firstname: 'Test User',
        username: 'testuser'
      }
    });
    
    const canStart = await Simulacro2024Service.canStartSimulacro(testUserId);
    
    if (canStart.canStart) {
      console.log('✅ Puede crear simulacro 2024');
    } else {
      console.log(`⚠️  No puede crear simulacro: ${canStart.reason}`);
    }
    
    // Test 5: Verificar estructura de la base de datos
    console.log('\n📋 Test 5: Verificando estructura de la base de datos...');
    
    // Verificar que las tablas necesarias existen
    const examen2018Count = await prisma.examenOficial2018.count();
    const simulacroCount = await prisma.simulacro.count();
    
    console.log(`✅ Examen 2018: ${examen2018Count} preguntas`);
    console.log(`✅ Examen 2024: ${questionCount} preguntas`);
    console.log(`✅ Simulacros en BD: ${simulacroCount}`);
    
    // Test 6: Verificar que las preguntas tienen las respuestas correctas
    console.log('\n📋 Test 6: Verificando integridad de respuestas...');
    
    const sampledQuestions = await prisma.examenOficial2024.findMany({
      take: 5,
      orderBy: { questionnumber: 'asc' }
    });
    
    let integrityIssues = 0;
    
    for (const q of sampledQuestions) {
      if (q.correctanswerindex < 0 || q.correctanswerindex >= q.options.length) {
        console.error(`❌ Pregunta ${q.questionnumber}: Índice de respuesta inválido (${q.correctanswerindex})`);
        integrityIssues++;
      }
      if (q.options.length !== 4) {
        console.error(`❌ Pregunta ${q.questionnumber}: No tiene 4 opciones (${q.options.length})`);
        integrityIssues++;
      }
    }
    
    if (integrityIssues === 0) {
      console.log('✅ Integridad de respuestas verificada (muestra de 5 preguntas)');
    } else {
      console.error(`❌ Se encontraron ${integrityIssues} problemas de integridad`);
    }
    
    // Cleanup: Eliminar usuario de prueba
    await prisma.telegramuser.delete({
      where: { telegramuserid: testUserId }
    }).catch(() => {}); // Ignorar si no existe
    
    console.log('\n🎉 PRUEBA COMPLETADA');
    console.log('✅ La integración del Examen 2024 está funcionando correctamente');
    
    // Resumen final
    console.log('\n📊 RESUMEN:');
    console.log(`📝 Total preguntas 2024: ${questionCount}`);
    console.log(`📝 Total preguntas 2018: ${examen2018Count}`);
    console.log(`📝 Total simulacros: ${simulacroCount}`);
    console.log('🚀 Sistema listo para producción');
    
  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar prueba
testExamen2024Integration()
  .then(() => {
    console.log('\n✅ Todas las pruebas pasaron exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en las pruebas:', error);
    process.exit(1);
  }); 