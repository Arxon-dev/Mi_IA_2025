import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSimulacroResponses() {
  try {
    console.log('🔍 VERIFICANDO ESTRUCTURA DE RESPUESTAS DEL SIMULACRO');
    console.log('===================================================');

    const CARLOS_TELEGRAM_ID = '5793286375';

    // 1. Buscar usuario Carlos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: CARLOS_TELEGRAM_ID }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    // 2. Buscar simulacro activo
    const activeSimulacro = await prisma.simulacro.findFirst({
      where: {
        userid: user.id,
        status: 'in_progress'
      },
      orderBy: { startedAt: 'desc' }
    });

    if (!activeSimulacro) {
      console.log('❌ No hay simulacro activo');
      return;
    }

    console.log('✅ Simulacro activo:', activeSimulacro.id);

    // 3. Obtener TODAS las respuestas del simulacro
    const allResponses = await prisma.simulacroResponse.findMany({
      where: { simulacroId: activeSimulacro.id },
      orderBy: { questionnumber: 'asc' }
    });

    console.log(`📊 Total respuestas en el simulacro: ${allResponses.length}`);

    // 4. Verificar secuencia de números de pregunta
    console.log('\n🔢 VERIFICANDO SECUENCIA DE NÚMEROS...');
    console.log('====================================');

    const questionNumbers = allResponses.map(r => r.questionnumber).sort((a, b) => a - b);
    console.log('Números de pregunta disponibles:', questionNumbers.slice(0, 20), '...');

    // Buscar gaps en la secuencia
    const gaps = [];
    for (let i = 1; i <= 100; i++) {
      if (!questionNumbers.includes(i)) {
        gaps.push(i);
      }
    }

    if (gaps.length > 0) {
      console.log('🚨 GAPS ENCONTRADOS en números de pregunta:', gaps.slice(0, 10));
      console.log(`Total gaps: ${gaps.length}`);
    } else {
      console.log('✅ Secuencia completa 1-100');
    }

    // 5. Verificar si hay duplicados
    const duplicates = questionNumbers.filter((num, index) => questionNumbers.indexOf(num) !== index);
    if (duplicates.length > 0) {
      console.log('🚨 DUPLICADOS encontrados:', [...new Set(duplicates)]);
    } else {
      console.log('✅ No hay números duplicados');
    }

    // 6. Verificar estado de respuestas por rango
    console.log('\n📋 ESTADO POR RANGOS...');
    console.log('======================');

    const ranges = [
      { start: 1, end: 10 },
      { start: 11, end: 20 },
      { start: 21, end: 30 },
      { start: 31, end: 40 }
    ];

    for (const range of ranges) {
      const rangeResponses = allResponses.filter(r => 
        r.questionnumber >= range.start && r.questionnumber <= range.end
      );
      
      const answered = rangeResponses.filter(r => r.answeredAt !== null).length;
      const pending = rangeResponses.filter(r => r.answeredAt === null).length;
      
      console.log(`Preguntas ${range.start}-${range.end}: Total=${rangeResponses.length}, Respondidas=${answered}, Pendientes=${pending}`);
      
      if (rangeResponses.length !== 10) {
        console.log(`   🚨 PROBLEMA: Faltan ${10 - rangeResponses.length} preguntas en este rango`);
      }
    }

    // 7. Buscar específicamente la pregunta 12
    console.log('\n🎯 ANÁLISIS ESPECÍFICO PREGUNTA 12...');
    console.log('===================================');

    const pregunta12 = allResponses.find(r => r.questionnumber === 12);
    if (pregunta12) {
      console.log('✅ Pregunta 12 encontrada:', {
        questionid: pregunta12.questionid,
        answeredAt: pregunta12.answeredAt,
        selectedOption: pregunta12.selectedOption
      });
      
      // Verificar que la pregunta del examen existe
      const examenQuestion12 = await prisma.examenOficial2018.findUnique({
        where: { id: pregunta12.questionid }
      });
      
      if (examenQuestion12) {
        console.log('✅ Pregunta del examen oficial 12 existe:', {
          questionnumber: examenQuestion12.questionnumber,
          category: examenQuestion12.category,
          questionLength: examenQuestion12.question.length
        });
      } else {
        console.log('❌ PROBLEMA: Pregunta del examen oficial 12 NO EXISTE');
      }
    } else {
      console.log('❌ PROBLEMA: Pregunta 12 NO ENCONTRADA en respuestas del simulacro');
      
      // Verificar si existe en el examen oficial
      const examenQuestion12 = await prisma.examenOficial2018.findFirst({
        where: { questionnumber: 12, isactive: true }
      });
      
      if (examenQuestion12) {
        console.log('✅ Pregunta 12 SÍ EXISTE en examen oficial:', {
          id: examenQuestion12.id,
          questionnumber: examenQuestion12.questionnumber,
          category: examenQuestion12.category
        });
        console.log('🚨 PROBLEMA: La pregunta existe pero NO se creó la respuesta en el simulacro');
      } else {
        console.log('❌ PROBLEMA: Pregunta 12 tampoco existe en examen oficial');
      }
    }

    // 8. Comparar con preguntas del examen oficial
    console.log('\n📚 COMPARANDO CON EXAMEN OFICIAL...');
    console.log('==================================');

    const examenQuestions = await prisma.examenOficial2018.findMany({
      where: { isactive: true },
      orderBy: { questionnumber: 'asc' },
      select: { id: true, questionnumber: true }
    });

    console.log(`Total preguntas en examen oficial: ${examenQuestions.length}`);
    
    // Verificar si todas las preguntas del examen tienen respuesta en el simulacro
    const missingInSimulacro = [];
    
    for (const examenQ of examenQuestions.slice(0, 20)) { // Verificar primeras 20
      const hasResponse = allResponses.some(r => r.questionid === examenQ.id);
      if (!hasResponse) {
        missingInSimulacro.push(examenQ.questionnumber);
      }
    }

    if (missingInSimulacro.length > 0) {
      console.log('🚨 Preguntas del examen SIN respuesta en simulacro:', missingInSimulacro);
    } else {
      console.log('✅ Todas las preguntas del examen tienen respuesta en simulacro (primeras 20 verificadas)');
    }

  } catch (error) {
    console.error('❌ Error verificando respuestas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSimulacroResponses(); 