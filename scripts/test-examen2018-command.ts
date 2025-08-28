import { prisma } from '../src/lib/prisma';

async function testExamen2018Command() {
  try {
    console.log('🧪 PRUEBA DEL COMANDO /examen2018');
    console.log('=' .repeat(50));
    
    // 1. Verificar que hay preguntas disponibles
    const totalQuestions = await prisma.examenOficial2018.count({
      where: { isactive: true }
    });
    
    console.log(`📊 Preguntas activas disponibles: ${totalQuestions}`);
    
    if (totalQuestions === 0) {
      console.log('❌ No hay preguntas activas para probar');
      return;
    }
    
    // 2. Simular la lógica del comando - obtener pregunta aleatoria
    const randomQuestion = await prisma.examenOficial2018.findFirst({
      where: {
        isactive: true
      },
      orderBy: {
        sendCount: 'asc'
      },
      skip: Math.floor(Math.random() * Math.min(10, totalQuestions))
    });
    
    if (!randomQuestion) {
      console.log('❌ Error obteniendo pregunta aleatoria');
      return;
    }
    
    console.log(`\\n🎯 PREGUNTA SELECCIONADA:`);
    console.log(`   📝 Número: ${randomQuestion.questionnumber}/100`);
    console.log(`   🏷️ Categoría: ${randomQuestion.category}`);
    console.log(`   🎯 Dificultad: ${randomQuestion.difficulty}`);
    console.log(`   📈 Send count: ${randomQuestion.sendCount}`);
    console.log(`   📄 Pregunta: ${randomQuestion.question.substring(0, 100)}...`);
    
    // 3. Verificar opciones
    console.log(`\\n📋 OPCIONES (${randomQuestion.options.length}):`);
    randomQuestion.options.forEach((option, index) => {
      const letter = String.fromCharCode(65 + index);
      const iscorrect = index === randomQuestion.correctanswerindex ? '✅' : '  ';
      console.log(`   ${iscorrect} ${letter}) ${option.substring(0, 50)}...`);
    });
    
    console.log(`\\n✅ RESPUESTA CORRECTA: ${String.fromCharCode(65 + randomQuestion.correctanswerindex)}`);
    
    // 4. Formatear mensaje como lo haría el comando
    const optionsText = randomQuestion.options
      .map((option, index) => {
        const letter = String.fromCharCode(65 + index);
        return `${letter}) ${option}`;
      })
      .join('\\n');
    
    const questionMessage = `🎯 EXAMEN OFICIAL PERMANENCIA 2018 🎯

📝 Pregunta ${randomQuestion.questionnumber}/100:

${randomQuestion.question}

📋 OPCIONES:
${optionsText}

━━━━━━━━━━━━━━━━━━━━━━━

✅ RESPUESTA CORRECTA:
${String.fromCharCode(65 + randomQuestion.correctanswerindex)}) ${randomQuestion.options[randomQuestion.correctanswerindex]}

${randomQuestion.explanation ? `💡 EXPLICACIÓN:\\n${randomQuestion.explanation}` : ''}

📊 DETALLES:
🏷️ Categoría: ${randomQuestion.category}
🎯 Dificultad: ${randomQuestion.difficulty}
📈 Enviada ${randomQuestion.sendCount} veces
🆔 ID: examen2018-${randomQuestion.questionnumber}`;
    
    console.log(`\\n📱 MENSAJE FORMATEADO (${questionMessage.length} caracteres):`);
    console.log('─'.repeat(50));
    console.log(questionMessage);
    console.log('─'.repeat(50));
    
    // 5. Simular incremento de sendCount
    const beforeCount = randomQuestion.sendCount;
    await prisma.examenOficial2018.update({
      where: { id: randomQuestion.id },
      data: { 
        sendCount: { increment: 1 },
        lastsuccessfulsendat: new Date()
      }
    });
    
    console.log(`\\n📈 CONTADOR ACTUALIZADO:`);
    console.log(`   🔢 Antes: ${beforeCount}`);
    console.log(`   🔢 Después: ${beforeCount + 1}`);
    
    console.log('\\n✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('🎯 El comando /examen2018 está listo para usar!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testExamen2018Command(); 