import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugGraduacionFalladas() {
  try {
    console.log('🔍 ===== DEBUG GRADUACIÓN FALLADAS =====');
    
    // Tu user ID de Telegram
    const userid = '1629320726';
    
    console.log(`\n📊 INVESTIGANDO USUARIO: ${userid}`);
    
    // 1. Buscar todas las respuestas del usuario por subject
    console.log('\n1️⃣ RESPUESTAS POR SUBJECT:');
    const allResponses = await prisma.studyresponse.findMany({
      where: { userid },
      select: { subject: true, iscorrect: true }
    });
    
    const subjectStats: Record<string, { total: number, correct: number }> = {};
    allResponses.forEach(r => {
      if (!subjectStats[r.subject]) {
        subjectStats[r.subject] = { total: 0, correct: 0 };
      }
      subjectStats[r.subject].total++;
      if (r.iscorrect) subjectStats[r.subject].correct++;
    });
    
    Object.entries(subjectStats).forEach(([subject, stats]) => {
      console.log(`   📚 ${subject}: ${stats.total} respuestas, ${stats.correct} correctas`);
    });
    
    // 2. Buscar respuestas específicas a la pregunta problemática de Defensa Nacional
    console.log('\n2️⃣ PREGUNTA PROBLEMÁTICA - DEFENSA NACIONAL:');
    const defenseResponses = await prisma.studyresponse.findMany({
      where: { 
        userid,
        subject: 'defensanacional'
      },
      orderBy: { answeredAt: 'asc' },
      select: {
        id: true,
        questionid: true,
        iscorrect: true,
        answeredAt: true,
        pollid: true
      }
    });
    
    console.log(`   📝 Total respuestas defensanacional: ${defenseResponses.length}`);
    
    // Agrupar por questionid
    const responsesByQuestion: Record<string, typeof defenseResponses> = {};
    defenseResponses.forEach(response => {
      if (!responsesByQuestion[response.questionid]) {
        responsesByQuestion[response.questionid] = [];
      }
      responsesByQuestion[response.questionid].push(response);
    });
    
    // Analizar cada pregunta
    for (const [questionid, responses] of Object.entries(responsesByQuestion)) {
      console.log(`\n   🎯 PREGUNTA ID: ${questionid}`);
      console.log(`   📊 Total respuestas: ${responses.length}`);
      
      // Encontrar primer fallo
      const failedResponses = responses.filter(r => !r.iscorrect);
      const correctResponses = responses.filter(r => r.iscorrect);
      
      console.log(`   ❌ Fallos: ${failedResponses.length}`);
      console.log(`   ✅ Aciertos: ${correctResponses.length}`);
      
      if (failedResponses.length > 0) {
        const lastFail = failedResponses[failedResponses.length - 1];
        console.log(`   🔍 Último fallo: ${lastFail.answeredAt}`);
        
        // Contar aciertos después del último fallo
        const aciertosPostFallo = correctResponses.filter(r => 
          r.answeredAt && lastFail.answeredAt && r.answeredAt > lastFail.answeredAt
        ).length;
        
        console.log(`   🎯 Aciertos después del último fallo: ${aciertosPostFallo}`);
        console.log(`   🎓 ¿Debería graduarse? ${aciertosPostFallo >= 3 ? 'SÍ' : 'NO'}`);
        
        // Mostrar detalle de los últimos intentos
        const recent = responses.slice(-10);
        console.log('   📝 Últimos 10 intentos:');
        recent.forEach((r, i) => {
          console.log(`     ${i+1}. ${r.iscorrect ? '✅' : '❌'} - ${r.answeredAt} - Poll: ${r.pollid}`);
        });
      }
    }
    
    // 3. Ejecutar la consulta SQL real que usa el sistema
    console.log('\n3️⃣ CONSULTA SQL REAL DEL SISTEMA:');
    const query = `
      WITH failed_questions AS (
        SELECT DISTINCT 
          sr."questionid",
          sr.subject,
          MAX(sr."answeredAt") as last_failed_at
        FROM "StudyResponse" sr 
        WHERE sr."userid" = $1 
          AND sr."iscorrect" = false 
          AND sr."answeredAt" IS NOT NULL
          AND sr.subject = 'defensanacional'
        GROUP BY sr."questionid", sr.subject
      ),
      total_successes AS (
        SELECT 
          fq."questionid",
          fq.subject,
          fq.last_failed_at,
          COUNT(sr2.id) as total_successes_since_last_fail
        FROM failed_questions fq
        LEFT JOIN "StudyResponse" sr2 ON sr2."questionid" = fq."questionid" 
          AND sr2."userid" = $1 
          AND sr2."iscorrect" = true 
          AND sr2."answeredAt" > fq.last_failed_at
          AND sr2.subject = fq.subject
        GROUP BY fq."questionid", fq.subject, fq.last_failed_at
      )
      SELECT 
        ts."questionid",
        ts.subject,
        ts.total_successes_since_last_fail,
        ts.last_failed_at
      FROM total_successes ts
      WHERE ts.total_successes_since_last_fail < 3
      ORDER BY ts.last_failed_at ASC
    `;
    
    const sqlResult = await prisma.$queryRawUnsafe(query, userid) as any[];
    
    console.log(`   🔍 Preguntas que NO han graduado según SQL: ${sqlResult.length}`);
    sqlResult.forEach(row => {
      console.log(`     📚 ${row.subject} - Q${row.questionid} - ${row.total_successes_since_last_fail}/3 aciertos`);
    });
    
    // 4. Verificar si hay discrepancia
    console.log('\n4️⃣ ANÁLISIS DE DISCREPANCIA:');
    for (const [questionid, responses] of Object.entries(responsesByQuestion)) {
      const failedResponses = responses.filter(r => !r.iscorrect);
      if (failedResponses.length > 0) {
        const sqlRow = sqlResult.find(r => r.questionid === questionid);
        
        if (sqlRow) {
          console.log(`   🔍 Pregunta ${questionid}:`);
          console.log(`     💭 Mi cálculo manual: Debería ${responses.filter(r => r.iscorrect).length >= 3 ? 'graduarse' : 'NO graduarse'}`);
          console.log(`     🤖 SQL del sistema: ${sqlRow.total_successes_since_last_fail}/3 aciertos`);
          console.log(`     ⚖️ Estado: ${sqlRow.total_successes_since_last_fail >= 3 ? 'GRADUADA' : 'NO GRADUADA'}`);
        }
      }
    }
    
    // 5. Investigar el subject PDC que se graduó rápido
    console.log('\n5️⃣ INVESTIGANDO PDC (se graduó con 1 acierto):');
    const pdcResponses = await prisma.studyresponse.findMany({
      where: { 
        userid,
        subject: 'pdc'
      },
      orderBy: { answeredAt: 'desc' },
      take: 20,
      select: {
        id: true,
        questionid: true,
        iscorrect: true,
        answeredAt: true
      }
    });
    
    console.log(`   📝 Total respuestas PDC: ${pdcResponses.length}`);
    
    // Agrupar por questionid
    const pdcByQuestion = {};
    pdcResponses.forEach(response => {
      if (!pdcByQuestion[response.questionid]) {
        pdcByQuestion[response.questionid] = [];
      }
      pdcByQuestion[response.questionid].push(response);
    });
    
    console.log(`   🎯 Preguntas distintas de PDC: ${Object.keys(pdcByQuestion).length}`);
    
    // Verificar si hay preguntas de PDC que deberían estar en falladas
    const pdcQuery = query.replace("AND sr.subject = 'defensanacional'", "AND sr.subject = 'pdc'");
    const pdcSqlResult = await prisma.$queryRawUnsafe(pdcQuery, userid) as any[];
    console.log(`   🔍 Preguntas PDC que NO han graduado según SQL: ${pdcSqlResult.length}`);
    
    if (pdcSqlResult.length === 0) {
      console.log('   ✅ PDC: Todas las preguntas falladas están graduadas (por eso no aparecen en /falladas)');
    } else {
      console.log('   ❌ PDC: Hay preguntas que deberían aparecer en /falladas:');
      pdcSqlResult.forEach(row => {
        console.log(`     📚 Q${row.questionid} - ${row.total_successes_since_last_fail}/3 aciertos`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGraduacionFalladas(); 