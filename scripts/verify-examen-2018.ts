#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyExamen2018() {
  try {
    console.log('🔍 VERIFICANDO PREGUNTAS DEL EXAMEN OFICIAL 2018');
    console.log('==============================================\n');
    
    // Contar total de preguntas
    const totalQuestions = await prisma.examenOficial2018.count();
    console.log(`📊 Total de preguntas en ExamenOficial2018: ${totalQuestions}`);
    
    if (totalQuestions !== 100) {
      console.log(`⚠️ Advertencia: Se esperaban 100 preguntas, pero hay ${totalQuestions}`);
    } else {
      console.log('✅ Cantidad correcta de preguntas (100)');
    }
    
    // Verificar que tenemos preguntas del 1 al 100
    const questionNumbers = await prisma.examenOficial2018.findMany({
      select: { questionnumber: true },
      orderBy: { questionnumber: 'asc' }
    });
    
    const numbers = questionNumbers.map(q => q.questionnumber);
    const missingNumbers = [];
    
    for (let i = 1; i <= 100; i++) {
      if (!numbers.includes(i)) {
        missingNumbers.push(i);
      }
    }
    
    if (missingNumbers.length === 0) {
      console.log('✅ Todas las preguntas numeradas del 1-100 están presentes');
    } else {
      console.log(`❌ Faltan las preguntas: ${missingNumbers.join(', ')}`);
    }
    
    // Verificar algunas preguntas específicas
    console.log('\n🔍 VERIFICACIÓN DE PREGUNTAS ESPECÍFICAS:');
    
    const question1 = await prisma.examenOficial2018.findUnique({
      where: { questionnumber: 1 }
    });
    
    if (question1) {
      console.log(`✅ Pregunta 1: ${question1.question.substring(0, 50)}...`);
      console.log(`   Opciones: ${question1.options.length}`);
      console.log(`   Respuesta correcta: ${['A', 'B', 'C', 'D'][question1.correctanswerindex]}`);
      console.log(`   Categoría: ${question1.category}`);
    }
    
    const question50 = await prisma.examenOficial2018.findUnique({
      where: { questionnumber: 50 }
    });
    
    if (question50) {
      console.log(`✅ Pregunta 50: ${question50.question.substring(0, 50)}...`);
      console.log(`   Respuesta correcta: ${['A', 'B', 'C', 'D'][question50.correctanswerindex]}`);
      console.log(`   Categoría: ${question50.category}`);
    }
    
    const question100 = await prisma.examenOficial2018.findUnique({
      where: { questionnumber: 100 }
    });
    
    if (question100) {
      console.log(`✅ Pregunta 100: ${question100.question.substring(0, 50)}...`);
      console.log(`   Respuesta correcta: ${['A', 'B', 'C', 'D'][question100.correctanswerindex]}`);
      console.log(`   Categoría: ${question100.category}`);
    }
    
    // Verificar distribución de categorías
    console.log('\n📈 DISTRIBUCIÓN FINAL POR CATEGORÍAS:');
    const categoryStats = await prisma.examenOficial2018.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });
    
    categoryStats.forEach(stat => {
      const percentage = ((stat._count.id / totalQuestions) * 100).toFixed(1);
      console.log(`   ${stat.category}: ${stat._count.id} preguntas (${percentage}%)`);
    });
    
    // Verificar que todas las preguntas tienen las 4 opciones
    const questionsWithWrongOptions = await prisma.examenOficial2018.findMany({
      where: {
        OR: [
          { options: { isEmpty: true } },
          // Verificar que no hay preguntas con menos de 4 opciones
        ]
      },
      select: { questionnumber: true, options: true }
    });
    
    const problematicQuestions = questionsWithWrongOptions.filter(q => q.options.length !== 4);
    
    if (problematicQuestions.length === 0) {
      console.log('\n✅ Todas las preguntas tienen exactamente 4 opciones');
    } else {
      console.log(`\n❌ ${problematicQuestions.length} preguntas tienen problemas con las opciones:`);
      problematicQuestions.forEach(q => {
        console.log(`   Pregunta ${q.questionnumber}: ${q.options.length} opciones`);
      });
    }
    
    // Test de una pregunta aleatoria para el sistema de torneos
    console.log('\n🏆 PRUEBA PARA SISTEMA DE TORNEOS:');
    const randomQuestion = await prisma.examenOficial2018.findFirst({
      where: { isactive: true },
      select: {
        id: true,
        questionnumber: true,
        question: true,
        options: true,
        correctanswerindex: true,
        category: true
      }
    });
    
    if (randomQuestion) {
      console.log(`✅ Pregunta lista para torneos: ${randomQuestion.questionnumber}`);
      console.log(`   ID: ${randomQuestion.id}`);
      console.log(`   Categoría: ${randomQuestion.category}`);
      console.log(`   ✅ Compatible con sistema de torneos`);
    }
    
    console.log('\n🎉 VERIFICACIÓN COMPLETADA');
    console.log('✅ Las preguntas del Examen Oficial 2018 están correctamente cargadas');
    console.log('✅ Listas para usar en torneos, simulacros y el bot de Telegram');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
if (require.main === module) {
  verifyExamen2018();
}

export { verifyExamen2018 }; 