import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugJavierHSQuestions() {
  console.log('🔍 DEBUGGING: Preguntas problemáticas para Javier HS');
  console.log('=' .repeat(60));
  
  // IDs problemáticos mencionados en los logs
  const problematicIds = [
    'a1ececf6-ea5b-4881-b8a5-c829a3f617fb',
    'f24f326b-c78c-4a0d-9d1d-425864398d64'
  ];
  
  console.log('\n📋 Verificando preguntas específicas:');
  
  for (const id of problematicIds) {
    console.log(`\n🔎 Pregunta ID: ${id}`);
    console.log('-'.repeat(50));
    
    try {
      // Buscar en tabla Constitucion
      const question = await prisma.constitucion.findUnique({
        where: { id }
      });
      
      if (question) {
        console.log('✅ Pregunta encontrada en tabla Constitucion:');
        console.log(`   Número: ${question.questionnumber}`);
        console.log(`   Pregunta: ${question.question.substring(0, 100)}...`);
        console.log(`   Opciones tipo: ${typeof question.options}`);
        console.log(`   Opciones raw: ${JSON.stringify(question.options)}`);
        console.log(`   Número de opciones: ${Array.isArray(question.options) ? question.options.length : 'No es array'}`);
        console.log(`   Índice respuesta correcta: ${question.correctanswerindex}`);
        console.log(`   Activa: ${question.isactive}`);
        console.log(`   Send count: ${question.sendcount}`);
        
        // Analizar opciones
        if (Array.isArray(question.options)) {
          console.log('\n📝 Análisis de opciones:');
          question.options.forEach((option, index) => {
            const length = option ? option.length : 0;
            const isValid = option && option.trim().length > 0 && option.length <= 100;
            console.log(`   ${index + 1}. [${length} chars] ${isValid ? '✅' : '❌'} "${option}"`);
          });
          
          const validOptions = question.options.filter(opt => opt && opt.trim().length > 0 && opt.length <= 100);
          console.log(`\n📊 Opciones válidas: ${validOptions.length}/${question.options.length}`);
          
          if (validOptions.length < 2) {
            console.log('❌ PROBLEMA: Menos de 2 opciones válidas - Esta pregunta será rechazada por Telegram');
          } else {
            console.log('✅ Suficientes opciones válidas para Telegram');
          }
        } else {
          console.log('❌ PROBLEMA: Las opciones no son un array');
        }
      } else {
        console.log('❌ Pregunta NO encontrada en tabla Constitucion');
      }
    } catch (error) {
      console.log(`❌ Error consultando pregunta: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Verificando historial de preguntas completadas para Javier HS:');
  console.log('-'.repeat(60));
  
  const javierUserId = 366286880;
  
  try {
    // Buscar historial de preguntas completadas
    const userProgress = await prisma.userprogress.findMany({
      where: {
        userid: javierUserId,
        subject: 'constitucion'
      },
      orderBy: {
        timecreated: 'desc'
      },
      take: 10
    });
    
    console.log(`\n📈 Progreso de usuario ${javierUserId} en constitucion:`);
    console.log(`   Registros encontrados: ${userProgress.length}`);
    
    userProgress.forEach((progress, index) => {
      console.log(`\n   ${index + 1}. ID: ${progress.id}`);
      console.log(`      Preguntas completadas: ${progress.questionscompleted || 'null'}`);
      console.log(`      Fecha: ${new Date(progress.timecreated * 1000).toLocaleString()}`);
      
      if (progress.questionscompleted) {
        try {
          const completed = JSON.parse(progress.questionscompleted);
          console.log(`      IDs completadas: ${Array.isArray(completed) ? completed.length : 'No es array'} preguntas`);
          if (Array.isArray(completed) && completed.length > 0) {
            console.log(`      Últimas 5: ${completed.slice(-5).join(', ')}`);
          }
        } catch (e) {
          console.log(`      Error parseando completadas: ${e.message}`);
        }
      }
    });
  } catch (error) {
    console.log(`❌ Error consultando progreso de usuario: ${error.message}`);
  }
  
  console.log('\n🔍 Verificando preguntas aleatorias de constitucion:');
  console.log('-'.repeat(60));
  
  try {
    // Obtener algunas preguntas aleatorias para comparar
    const randomQuestions = await prisma.constitucion.findMany({
      where: {
        isactive: true
      },
      take: 5,
      orderBy: {
        sendcount: 'asc'
      }
    });
    
    console.log(`\n📋 Muestra de preguntas activas en constitucion:`);
    randomQuestions.forEach((q, index) => {
      const validOptions = Array.isArray(q.options) 
        ? q.options.filter(opt => opt && opt.trim().length > 0 && opt.length <= 100).length
        : 0;
      
      console.log(`\n   ${index + 1}. ID: ${q.id}`);
      console.log(`      Número: ${q.questionnumber}`);
      console.log(`      Opciones válidas: ${validOptions}/${Array.isArray(q.options) ? q.options.length : 0}`);
      console.log(`      Send count: ${q.sendcount}`);
      console.log(`      Activa: ${q.isactive}`);
    });
  } catch (error) {
    console.log(`❌ Error consultando preguntas aleatorias: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ DEBUG COMPLETADO');
  console.log('=' .repeat(60));
}

// Ejecutar el debug
debugJavierHSQuestions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());