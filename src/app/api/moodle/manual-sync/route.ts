import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import mysql from 'mysql2/promise';

// ==========================================
// 🔄 API PARA SINCRONIZACIÓN MANUAL MOODLE
// ==========================================

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 ======== SINCRONIZACIÓN MANUAL MOODLE ========');
    
    const body = await request.json();
    const { telegramuserid, forceSync } = body;

    if (!telegramuserid) {
      return NextResponse.json({
        success: false,
        message: 'telegramuserid es requerido'
      }, { status: 400 });
    }

    console.log(`🔄 Iniciando sincronización manual para usuario: ${telegramuserid}`);

    // 1. Obtener datos de vinculación
    const linkRecords = await prisma.$queryRaw<any[]>`
      SELECT * FROM moodleuserlink 
      WHERE telegramuserid = ${telegramuserid}
      AND isactive = 1
      LIMIT 1
    `;

    if (linkRecords.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Usuario no está vinculado con Moodle'
      }, { status: 400 });
    }

    const userLink = linkRecords[0];
    console.log(`✅ Usuario vinculado encontrado: ${userLink.moodleusername}`);

    // 2. Obtener última actividad sincronizada
    let lastSyncDate = new Date('2025-06-30'); // Fecha por defecto
    
    if (!forceSync) {
      const lastActivityRecords = await prisma.$queryRaw<any[]>`
        SELECT MAX(processedat) as lastActivity
        FROM moodleactivity 
        WHERE telegramuserid = ${telegramuserid}
      `;
      
      if (lastActivityRecords[0]?.lastActivity) {
        lastSyncDate = new Date(lastActivityRecords[0].lastActivity);
      }
    }

    console.log(`📅 Sincronizando desde: ${lastSyncDate.toISOString()}`);

    // 3. Conectar a MySQL de Moodle
    const connection = await mysql.createConnection({
      host: process.env.MOODLE_DB_HOST || 'localhost',
      user: process.env.MOODLE_DB_USER || 'root',
      password: process.env.MOODLE_DB_PASSWORD || '',
      database: process.env.MOODLE_DB_NAME || 'moodle',
      port: parseInt(process.env.MOODLE_DB_PORT || '3306')
    });

    try {
      // 4. Obtener actividades recientes de Moodle (sin filtro de fecha)
      const [moodleActivities] = await connection.execute(`
        SELECT 
          qa.id as attempt_id,
          qa.quiz,
          qa.userid,
          qa.timestart,
          qa.timefinish,
          qa.sumgrades,
          q.grade as maxgrade,
          q.name as quiz_name,
          (SELECT COUNT(DISTINCT slot) FROM mdl_question_attempts qatt 
           WHERE qatt.questionusageid = qa.uniqueid) as question_count,
          (SELECT COUNT(*) FROM mdl_question_attempts qatt 
           JOIN mdl_question_attempt_steps qas ON qatt.id = qas.questionattemptid 
           WHERE qatt.questionusageid = qa.uniqueid 
           AND qas.state LIKE '%right%') as correct_answers
        FROM mdl_quiz_attempts qa
        JOIN mdl_quiz q ON qa.quiz = q.id
        WHERE qa.userid = ? 
        AND qa.state = 'finished'
        ORDER BY qa.timefinish DESC
        LIMIT 50
      `, [userLink.moodleuserid]);

      const activities = moodleActivities as any[];
      console.log(`📊 Encontradas ${activities.length} actividades nuevas en Moodle`);

      if (activities.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No hay actividades nuevas para sincronizar',
          syncedActivities: 0,
          lastSyncDate: lastSyncDate
        });
      }

      // 5. Procesar cada actividad
      let syncedCount = 0;
      let totalQuestionsProcessed = 0;
      let alreadySyncedCount = 0;

      for (const activity of activities) {
        // Comprobar si ya existe este intento sincronizado
        const existing = await prisma.$queryRaw<any[]>`
          SELECT id FROM moodleactivity 
          WHERE moodleuserid = ${userLink.moodleuserid}
            AND telegramuserid = ${telegramuserid}
            AND processedat = ${new Date(activity.timefinish * 1000)}
          LIMIT 1
        `;
        if (existing.length > 0) {
          alreadySyncedCount++;
          continue; // Saltar este intento, ya está sincronizado
        }

        const questionsInQuiz = parseInt(activity.question_count) || 10;
        const correctAnswers = parseInt(activity.correct_answers) || 0;
        const incorrectAnswers = questionsInQuiz - correctAnswers;

        // === DETECTAR TEMA DEL QUIZ ===
        const quizName = (activity.quiz_name || '').toLowerCase();
        // Mapeo de palabras clave a tema
        const subjectMap: { [key: string]: string } = {
          'constitución': 'Constitución Española',
          'defensa nacional': 'Defensa Nacional',
          'carrera militar': 'Carrera Militar',
          'régimen jurídico': 'Régimen Jurídico del Sector Público',
          'ministerio de defensa': 'Ministerio de Defensa',
          'organización de las fas': 'Organización de las FAS',
          'estado mayor': 'Estado Mayor de la Defensa',
          'ejército de tierra': 'Ejército de Tierra',
          'armada española': 'Armada Española',
          'ejército del aire': 'Ejército del Aire',
          'doctrina fas': 'Doctrina FAS',
          // ... añade todos los temas que tengas
        };
        let detectedSubject = 'general';
        for (const keyword in subjectMap) {
          if (quizName.includes(keyword)) {
            detectedSubject = subjectMap[keyword];
            break;
          }
        }

        // Simular preguntas individuales basadas en el resultado del quiz
        for (let i = 0; i < questionsInQuiz; i++) {
          const iscorrect = i < correctAnswers; // Las primeras N son correctas
          const activityId = crypto.randomUUID();
          await prisma.$executeRaw`
            INSERT INTO moodleactivity (
              id, moodleuserid, telegramuserid, questioncorrect,
              responsetime, subject, difficulty, processedat
            ) VALUES (
              ${activityId}, ${userLink.moodleuserid}, ${telegramuserid},
              ${iscorrect ? 1 : 0}, ${30}, ${detectedSubject}, ${'medium'}, ${new Date(activity.timefinish * 1000)}
            )
          `;
          totalQuestionsProcessed++;
        }
        syncedCount++;
        console.log(`✅ Quiz sincronizado: ${activity.quiz_name} (${questionsInQuiz} preguntas, tema: ${detectedSubject})`);
      }

      console.log(`🎉 Sincronización completada: ${syncedCount} quizzes nuevos, ${alreadySyncedCount} ya estaban sincronizados, ${totalQuestionsProcessed} preguntas nuevas procesadas`);

      // Al finalizar la sincronización, actualizar puntos y precisión en telegramuser
      // 1. Sumar puntos: 10 por cada correcta, -2 por cada incorrecta
      const pointsResult = await prisma.$queryRaw<any[]>`
        SELECT 
          SUM(CASE WHEN questioncorrect = 1 THEN 10 ELSE -2 END) as totalpoints,
          SUM(questioncorrect) as correctanswers,
          COUNT(*) as totalquestions
        FROM moodleactivity
        WHERE telegramuserid = ${telegramuserid}
      `;
      const totalpoints = pointsResult[0]?.totalpoints ? Number(pointsResult[0].totalpoints) : 0;
      const correctanswers = pointsResult[0]?.correctanswers ? Number(pointsResult[0].correctanswers) : 0;
      const totalquestions = pointsResult[0]?.totalquestions ? Number(pointsResult[0].totalquestions) : 0;
      const accuracy = totalquestions > 0 ? Math.round(1000 * correctanswers / totalquestions) / 10 : 0;
      await prisma.$executeRaw`
        UPDATE telegramuser SET totalpoints = ${totalpoints}, accuracy = ${accuracy}
        WHERE telegramuserid = ${telegramuserid}
      `;
      console.log(`🔄 Usuario actualizado: ${totalpoints} puntos, ${accuracy}% precisión`);

      // === ACTUALIZAR RENDIMIENTO POR TEMAS (MISMA LÓGICA QUE EN generate-topic-performance.php) ===
      const topicMap: Record<string, string> = {
        constitucion: 'Constitución Española',
        defensanacional: 'Defensa Nacional',
        rio: 'Régimen Jurídico del Sector Público',
        minsdef: 'Ministerio de Defensa',
        organizacionfas: 'Organización de las FAS',
        emad: 'Estado Mayor de la Defensa',
        et: 'Ejército de Tierra',
        armada: 'Armada Española',
        aire: 'Ejército del Aire',
        carrera: 'Carrera Militar',
        tropa: 'Tropa y Marinería',
        rroo: 'Reales Ordenanzas',
        derechosydeberes: 'Derechos y Deberes',
        regimendisciplinario: 'Régimen Disciplinario',
        iniciativasquejas: 'Iniciativas y Quejas',
        igualdad: 'Ley de Igualdad',
        omi: 'Observatorio Militar Igualdad',
        pac: 'Procedimiento Administrativo',
        seguridadnacional: 'Seguridad Nacional',
        pdc: 'Doctrina FAS',
        onu: 'ONU',
        otan: 'OTAN',
        osce: 'OSCE',
        ue: 'Unión Europea',
        misionesinternacionales: 'Misiones Internacionales',
      };
      for (const [table, topicName] of Object.entries(topicMap)) {
        // 1. Contar preguntas activas en la tabla del tema
        let totalQuestions = 0;
        try {
          const [rows] = await connection.execute(`SHOW TABLES LIKE ?`, [table]);
          if (Array.isArray(rows) && rows.length > 0) {
            const [countRows] = await connection.execute(`SELECT COUNT(*) as total FROM ${table} WHERE isactive = 1`);
            totalQuestions = countRows[0]?.total ? Number(countRows[0].total) : 0;
          }
        } catch (e) { totalQuestions = 0; }
        if (totalQuestions === 0) continue;
        // 2. Contar respuestas correctas/incorrectas del usuario en moodleactivity para ese tema
        console.log(`🔍 Actualizando tema: ${topicName} para usuario: ${telegramuserid}`);
        const [activityRows] = await connection.execute(`
          SELECT 
            SUM(questioncorrect = 1) as correct,
            SUM(questioncorrect = 0) as incorrect,
            MAX(processedat) as last_activity
          FROM moodleactivity
          WHERE telegramuserid = ? AND subject = ?
        `, [telegramuserid, topicName]);
        const correct = activityRows[0]?.correct ? Number(activityRows[0].correct) : 0;
        const incorrect = activityRows[0]?.incorrect ? Number(activityRows[0].incorrect) : 0;
        console.log(`🔍 Respuestas encontradas para ${topicName}: correctas=${correct}, incorrectas=${incorrect}`);
        const totalAnswered = correct + incorrect;
        const accuracy = totalAnswered > 0 ? Math.round(1000 * correct / totalAnswered) / 10 : 0;
        // 3. Insertar o actualizar en mdl_local_telegram_user_topic_performance
        const [existingRows] = await connection.execute(`
          SELECT id FROM mdl_local_telegram_user_topic_performance
          WHERE telegramuserid = ? AND sectionname = ?
          LIMIT 1
        `, [telegramuserid, topicName]);
        if (Array.isArray(existingRows) && existingRows.length > 0) {
          await connection.execute(`
            UPDATE mdl_local_telegram_user_topic_performance SET 
              totalquestions = ?, correctanswers = ?, incorrectanswers = ?, accuracy = ?, lastactivity = ?
            WHERE telegramuserid = ? AND sectionname = ?
          `, [totalQuestions, correct, incorrect, accuracy, activityRows[0]?.last_activity || null, telegramuserid, topicName]);
        } else {
          await connection.execute(`
            INSERT INTO mdl_local_telegram_user_topic_performance 
              (telegramuserid, sectionname, totalquestions, correctanswers, incorrectanswers, accuracy, lastactivity, createdat)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `, [telegramuserid, topicName, totalQuestions, correct, incorrect, accuracy, activityRows[0]?.last_activity || null]);
        }
      }
      console.log('🔄 Rendimiento por temas actualizado tras sincronización.');

      return NextResponse.json({
        success: true,
        message: `Sincronización exitosa: ${totalQuestionsProcessed} preguntas procesadas (${syncedCount} quizzes nuevos, ${alreadySyncedCount} ya estaban)` ,
        syncedActivities: syncedCount,
        alreadySynced: alreadySyncedCount,
        totalquestions: totalQuestionsProcessed,
        lastSyncDate: new Date()
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('❌ Error en sincronización manual:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en sincronización manual',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 