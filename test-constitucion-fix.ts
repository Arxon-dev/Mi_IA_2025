import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Función para validar longitud de opciones (copiada del servicio)
 */
function validateOptionLengths(options: string[]): boolean {
  const MAX_OPTION_LENGTH = 100;
  return options.every(option => option.length <= MAX_OPTION_LENGTH);
}

/**
 * Función para parsear opciones JSON (copiada del servicio)
 */
function parseOptionsFromJSON(optionsString: string): string[] {
  try {
    const parsed = JSON.parse(optionsString);
    if (Array.isArray(parsed)) {
      return parsed.filter(option => 
        typeof option === 'string' && 
        option.trim().length > 0
      );
    }
    return [];
  } catch (error) {
    console.error('Error parsing options JSON:', error.message);
    return [];
  }
}

async function testConstitucionFix() {
  console.log('🧪 PROBANDO CORRECCIÓN DE TABLA CONSTITUCION');
  console.log('=' .repeat(60));
  
  try {
    // 1. Probar las preguntas específicas que causaban problemas
    const problematicQuestionIds = [
      'a1ececf6-ea5b-4881-b8a5-c829a3f617fb',
      'f24f326b-c78c-4a0d-9d1d-425864398d64'
    ];
    
    console.log('\n🔍 VERIFICANDO PREGUNTAS PROBLEMÁTICAS ESPECÍFICAS:');
    for (const questionId of problematicQuestionIds) {
      const question = await prisma.constitucion.findUnique({
        where: { id: questionId }
      });
      
      if (question) {
        console.log(`\n   Pregunta ${question.questionnumber} (${questionId}):`);
        console.log(`     Tipo opciones: ${typeof question.options}`);
        
        if (question.options) {
          const parsedOptions = parseOptionsFromJSON(question.options);
          console.log(`     Opciones parseadas: ${parsedOptions.length}`);
          console.log(`     Opciones válidas: ${validateOptionLengths(parsedOptions) ? '✅ SÍ' : '❌ NO'}`);
          
          parsedOptions.forEach((opt, i) => {
            console.log(`       ${i + 1}. "${opt}" (${opt.length} chars)`);
          });
        } else {
          console.log(`     ❌ Sin opciones`);
        }
      } else {
        console.log(`   ❌ Pregunta ${questionId} no encontrada`);
      }
    }
    
    // 2. Simular selección de preguntas como lo haría el servicio
    console.log('\n\n🎯 SIMULANDO SELECCIÓN DE PREGUNTAS PARA /constitucion10:');
    console.log('-' .repeat(60));
    
    // Obtener preguntas activas ordenadas por sendcount (como en el servicio)
    const availableQuestions = await prisma.constitucion.findMany({
      where: {
        isactive: true,
        options: { not: null }
      },
      orderBy: {
        sendcount: 'asc'
      },
      take: 20 // Tomar más de las necesarias para simular selección
    });
    
    console.log(`\n📊 Preguntas disponibles: ${availableQuestions.length}`);
    
    let validQuestions = 0;
    let invalidQuestions = 0;
    
    for (const question of availableQuestions.slice(0, 15)) { // Probar las primeras 15
      const parsedOptions = parseOptionsFromJSON(question.options || '');
      const isValid = parsedOptions.length >= 2 && validateOptionLengths(parsedOptions);
      
      if (isValid) {
        validQuestions++;
        console.log(`   ✅ Pregunta ${question.questionnumber}: ${parsedOptions.length} opciones válidas`);
      } else {
        invalidQuestions++;
        console.log(`   ❌ Pregunta ${question.questionnumber}: ${parsedOptions.length} opciones, válidas: ${validateOptionLengths(parsedOptions)}`);
      }
    }
    
    console.log(`\n📈 RESULTADOS DE SIMULACIÓN:`);
    console.log(`   ✅ Preguntas válidas: ${validQuestions}`);
    console.log(`   ❌ Preguntas inválidas: ${invalidQuestions}`);
    console.log(`   📊 Porcentaje válido: ${((validQuestions / (validQuestions + invalidQuestions)) * 100).toFixed(1)}%`);
    
    // 3. Verificar estadísticas generales
    console.log('\n\n📊 ESTADÍSTICAS GENERALES POST-CORRECCIÓN:');
    console.log('-' .repeat(60));
    
    const totalQuestions = await prisma.constitucion.count();
    const activeQuestions = await prisma.constitucion.count({
      where: { isactive: true }
    });
    const questionsWithOptions = await prisma.constitucion.count({
      where: {
        isactive: true,
        options: { not: null }
      }
    });
    
    console.log(`   📋 Total preguntas: ${totalQuestions}`);
    console.log(`   ✅ Preguntas activas: ${activeQuestions}`);
    console.log(`   📝 Preguntas con opciones: ${questionsWithOptions}`);
    
    // 4. Probar algunas preguntas aleatorias
    console.log('\n\n🎲 MUESTRA ALEATORIA DE PREGUNTAS CORREGIDAS:');
    console.log('-' .repeat(60));
    
    const randomQuestions = await prisma.constitucion.findMany({
      where: {
        isactive: true,
        options: { not: null }
      },
      take: 5,
      skip: Math.floor(Math.random() * Math.max(1, questionsWithOptions - 5))
    });
    
    randomQuestions.forEach((q, i) => {
      console.log(`\n   ${i + 1}. Pregunta ${q.questionnumber}:`);
      const parsedOptions = parseOptionsFromJSON(q.options || '');
      console.log(`      Opciones: ${parsedOptions.length}`);
      console.log(`      Válidas: ${validateOptionLengths(parsedOptions) ? '✅' : '❌'}`);
      console.log(`      SendCount: ${q.sendcount}`);
    });
    
    // 5. Conclusión
    console.log('\n\n' + '=' .repeat(60));
    if (validQuestions >= 10) {
      console.log('🎉 ¡CORRECCIÓN EXITOSA!');
      console.log('   El comando /constitucion10 debería funcionar correctamente ahora.');
      console.log('   Se encontraron suficientes preguntas válidas para enviar.');
    } else {
      console.log('⚠️ ADVERTENCIA:');
      console.log('   Puede que aún haya problemas con algunas preguntas.');
      console.log('   Se recomienda revisar manualmente las preguntas inválidas.');
    }
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
testConstitucionFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());