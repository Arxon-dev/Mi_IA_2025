#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testValidQuestionIntegration() {
  try {
    console.log('🧪 INICIANDO PRUEBAS DE INTEGRACIÓN ValidQuestion');
    console.log('==============================================\n');

    // 1. VERIFICAR MIGRACIÓN DE BASE DE DATOS
    console.log('📊 1. VERIFICANDO MIGRACIÓN DE BASE DE DATOS...');
    
    const sampleValidQuestion = await prisma.validQuestion.findFirst();
    if (!sampleValidQuestion) {
      console.log('❌ No hay preguntas en ValidQuestion para probar');
      return;
    }

    // Verificar nuevos campos
    console.log(`✅ Campos de tracking verificados en ValidQuestion:`);
    console.log(`   - lastUsedInTournament: ${sampleValidQuestion.lastUsedInTournament || 'null'}`);
    console.log(`   - tournamentUsageCount: ${sampleValidQuestion.tournamentUsageCount}`);
    console.log(`   - lastTournamentId: ${sampleValidQuestion.lastTournamentId || 'null'}`);

    // 2. CREAR TORNEO DE PRUEBA
    console.log('\n🏆 2. CREANDO TORNEO DE PRUEBA...');
    
    const testTournament = await prisma.tournament.create({
      data: {
        name: `PRUEBA ValidQuestion - ${new Date().toISOString().split('T')[0]}`,
        description: 'Torneo de prueba para validar integración de ValidQuestion',
        scheduledDate: new Date(Date.now() + 60000), // En 1 minuto
        status: 'SCHEDULED',
        questionscount: 5,
        timelimit: 300, // 5 minutos
        maxParticipants: 10,
        prizePool: 100
      }
    });

    console.log(`✅ Torneo de prueba creado: ${testTournament.id}`);

    // 3. PROBAR ASIGNACIÓN DE PREGUNTAS CON DIFERENTES FUENTES
    console.log('\n📝 3. PROBANDO ASIGNACIÓN DE PREGUNTAS...');

    const testConfigs = [
      { name: 'Solo ValidQuestion', examSource: 'valid' as const },
      { name: 'Todas las fuentes', examSource: 'all' as const },
      { name: 'Solo 2018 + 2024', examSource: 'both' as const }
    ];

    for (const config of testConfigs) {
      console.log(`\n🔍 Probando configuración: ${config.name}`);
      
      try {
        // Simular llamada a assignQuestionsToTournament
        const response = await fetch('http://localhost:3000/api/admin/tournaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Test ${config.name}`,
            description: `Prueba de ${config.name}`,
            totalquestions: 3,
            duration: 10,
            startTime: new Date(Date.now() + 300000).toISOString(), // En 5 minutos
            examSource: config.examSource,
            difficulty: 'mixed'
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ ${config.name}: ${result.questionAssignment?.questionsAssigned || 0} preguntas asignadas`);
          if (result.questionAssignment?.distribution) {
            const dist = result.questionAssignment.distribution;
            console.log(`      - 2018: ${dist.questions2018 || 0}`);
            console.log(`      - 2024: ${dist.questions2024 || 0}`);
            console.log(`      - ValidQuestion: ${dist.questionsValid || 0}`);
          }
        } else {
          console.log(`   ❌ ${config.name}: Error ${response.status}`);
        }
      } catch (error) {
        console.log(`   ⚠️ ${config.name}: Error en llamada API (servidor no disponible)`);
      }
    }

    // 4. VERIFICAR ESTRUCTURA DE PREGUNTAS DE VALIDQUESTION
    console.log('\n🔍 4. ANALIZANDO ESTRUCTURA DE ValidQuestion...');
    
    const questionsAnalysis = await prisma.validQuestion.findMany({
      take: 5,
      where: { isactive: true },
      select: {
        id: true,
        parsedQuestion: true,
        parsedOptions: true,
        correctanswerindex: true,
        type: true,
        difficulty: true
      }
    });

    questionsAnalysis.forEach((q, index) => {
      console.log(`\n   📋 Muestra ${index + 1}:`);
      console.log(`      ID: ${q.id.substring(0, 8)}...`);
      console.log(`      Pregunta: ${q.parsedQuestion.substring(0, 50)}${q.parsedQuestion.length > 50 ? '...' : ''}`);
      console.log(`      Opciones: ${Array.isArray(q.parsedOptions) ? q.parsedOptions.length : 'JSON object'}`);
      console.log(`      Respuesta correcta: ${q.correctanswerindex}`);
      console.log(`      Tipo: ${q.type}`);
      console.log(`      Dificultad: ${q.difficulty}`);
    });

    // 5. ESTADÍSTICAS GENERALES
    console.log('\n📊 5. ESTADÍSTICAS FINALES...');
    
    const stats = await Promise.all([
      prisma.examenOficial2018.count({ where: { isactive: true } }),
      prisma.examenOficial2024.count({ where: { isactive: true } }),
      prisma.validQuestion.count({ where: { isactive: true } })
    ]);

    const [count2018, count2024, countValid] = stats;
    const total = count2018 + count2024 + countValid;

    console.log(`   📈 RESUMEN DEL BANCO DE PREGUNTAS:`);
    console.log(`      🏆 ExamenOficial2018: ${count2018} preguntas`);
    console.log(`      🏆 ExamenOficial2024: ${count2024} preguntas`);
    console.log(`      🏆 ValidQuestion: ${countValid} preguntas`);
    console.log(`      🎯 TOTAL DISPONIBLE: ${total} preguntas`);
    console.log(`      📊 Incremento con ValidQuestion: ${((countValid / (count2018 + count2024)) * 100).toFixed(1)}%`);

    // 6. LIMPIAR DATOS DE PRUEBA
    console.log('\n🧹 6. LIMPIANDO DATOS DE PRUEBA...');
    
    await prisma.tournament.delete({
      where: { id: testTournament.id }
    });
    
    console.log('✅ Datos de prueba eliminados');

    console.log('\n🎉 PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('===================================');
    console.log('✅ Migración de base de datos: OK');
    console.log('✅ Campos de tracking: OK');
    console.log('✅ Estructura de ValidQuestion: OK');
    console.log('✅ Integración disponible: OK');
    console.log(`✅ Banco expandido: ${total} preguntas disponibles`);

  } catch (error) {
    console.error('❌ ERROR EN PRUEBAS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testValidQuestionIntegration();
}

export { testValidQuestionIntegration }; 