import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanMalformedOptionsJSON } from '@/utils/optionsParser';

// ✅ FUNCIÓN PARA CALCULAR PRIZEPOOL AUTOMÁTICAMENTE
function calculateBaseprizepool(participantCount: number, questionscount: number): number {
  // Fórmula: Base por pregunta + bonus por participante + multiplicador de competitividad
  const basePerQuestion = 5; // 5 puntos base por pregunta
  const participantBonus = participantCount * 10; // 10 puntos adicionales por participante
  const competitivenessMultiplier = participantCount > 10 ? 1.5 : 1.2; // Más atractivo con más gente
  
  const basePrize = (questionscount * basePerQuestion) + participantBonus;
  const finalPrize = Math.round(basePrize * competitivenessMultiplier);
  
  // Mínimo garantizado de 100 puntos para que sea atractivo
  return Math.max(finalPrize, 100);
}

// Función para mezclar un array aleatoriamente (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Función para crear notificaciones automáticas del torneo
async function createTournamentNotifications(tournamentId: string, scheduledDate: Date) {
  const notifications = [
    {
      type: 'REMINDER',
      minutesBefore: 1440, // 1 día antes
      message: '⏰ ¡TORNEO MAÑANA! Prepárate para la competición más emocionante con preguntas de exámenes oficiales de años anteriores'
    },
    {
      type: 'COUNTDOWN_60',
      minutesBefore: 60, // 1 hora antes
      message: '🕒 ¡TORNEO EN 1 HORA! Prepárate para la competición con preguntas reales de exámenes oficiales'
    },
    {
      type: 'COUNTDOWN_10',
      minutesBefore: 10,
      message: '🚨 ¡TORNEO EN 10 MINUTOS! Verifica que puedes recibir mensajes del bot. Preguntas de exámenes oficiales te esperan'
    },
    {
      type: 'COUNTDOWN_5',
      minutesBefore: 5,
      message: '🔥 ¡TORNEO EN 5 MINUTOS! ¡Prepárate para enfrentar preguntas reales de exámenes anteriores!'
    },
    {
      type: 'COUNTDOWN_3',
      minutesBefore: 3,
      message: '⚡ ¡ÚLTIMOS 3 MINUTOS! El torneo con preguntas de exámenes oficiales está a punto de comenzar'
    },
    {
      type: 'COUNTDOWN_1',
      minutesBefore: 1,
      message: '🏆 ¡1 MINUTO! El torneo con preguntas reales de exámenes oficiales comenzará muy pronto'
    }
  ];

  for (const notification of notifications) {
    const scheduledFor = new Date(scheduledDate.getTime() - (notification.minutesBefore * 60 * 1000));
    
    // Solo crear notificaciones para fechas futuras
    if (scheduledFor > new Date()) {
      await prisma.tournamentnotification.create({
        data: {
          id: crypto.randomUUID(), // Generate unique ID for the notification
          tournamentid: tournamentId,
          type: notification.type as any,
          scheduledfor: scheduledFor,
          message: notification.message,
          status: 'pending'
        }
      });
    }
  }
  
  console.log(`✅ Notificaciones programadas creadas para torneo ${tournamentId}`);
}

// Función para enviar anuncio inmediato de nuevo torneo
async function sendNewTournamentAnnouncement(tournament: any, questionsAssigned: number) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002519334308';
    
    const timeUntilStart = new Date(tournament.scheduledDate).getTime() - Date.now();
    const hoursUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60));
    const daysUntilStart = Math.ceil(timeUntilStart / (1000 * 60 * 60 * 24));
    
    let timeText = '';
    if (daysUntilStart > 1) {
      timeText = `en ${daysUntilStart} días`;
    } else if (hoursUntilStart > 24) {
      timeText = 'mañana';
    } else if (hoursUntilStart > 1) {
      timeText = `en ${hoursUntilStart} horas`;
    } else {
      timeText = 'muy pronto';
    }

    const message = `🏆 <b>¡NUEVO TORNEO ANUNCIADO!</b> 🏆

🎯 <b>${tournament.name}</b>
📅 ${new Date(tournament.scheduledDate).toLocaleString('es-ES')}
⏰ Comienza ${timeText}

📋 <b>DETALLES:</b>
📝 ${questionsAssigned} preguntas de exámenes oficiales de años anteriores
⏱️ Máximo ${Math.floor(tournament.timelimit / 60)} minutos
💰 ${tournament.prizePool} puntos en juego
👥 Hasta ${tournament.maxParticipants} participantes

🎓 <b>PREGUNTAS REALES:</b> Todas las preguntas provienen de exámenes oficiales anteriores

🚀 <b>¡Inscríbete ya!</b>
• Usa <code>/torneo</code> para ver detalles
• Usa <code>/torneo_unirse 1</code> para registrarte

💡 <b>Recuerda:</b> El torneo se ejecuta completamente por mensajes privados
🤖 Asegúrate de poder recibir mensajes de @OpoMelillaBot

⚡ ¡Que comience la competición!`;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json() as any;
    
    if (result.ok) {
      console.log(`✅ Anuncio de nuevo torneo enviado: ${tournament.name}`);
    } else {
      console.log(`❌ Error enviando anuncio de torneo: ${result.description}`);
    }
  } catch (error) {
    console.error('❌ Error enviando anuncio de nuevo torneo:', error);
  }
}

// 🎯 SISTEMA ROBUSTO: Función para obtener preguntas ya usadas en torneos recientes
// (Versión temporal usando TournamentQuestion hasta que los nuevos campos estén listos)
async function getRecentlyUsedQuestions(daysPeriod: number = 30, tournamentId?: string) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysPeriod);
    
    // SISTEMA MEJORADO: Buscar preguntas de torneos creados o iniciados recientemente
    const usedQuestions = await prisma.tournamentquestion.findMany({
      where: {
        tournamentid: {
          in: [
            // Tournaments that have already started
            ...(await prisma.tournament.findMany({
              where: {
                actualstarttime: {
                  gte: cutoffDate
                }
              },
              select: {
                id: true
              }
            })).map(t => t.id),
            // Torneos creados recientemente (aunque no hayan iniciado)
            ...(await prisma.tournament.findMany({
              where: {
                createdat: {
                  gte: cutoffDate
                }
              },
              select: {
                id: true
              }
            })).map(t => t.id)
          ]
        },
        // Excluir el torneo actual si se especifica
        ...(tournamentId ? { tournamentid: { not: tournamentId } } : {})
      },
      select: {
        questionid: true,
        sourcetable: true
      },
      distinct: ['questionid', 'sourcetable']
    });

    console.log(`🔍 SISTEMA MEJORADO: Encontradas ${usedQuestions.length} preguntas usadas en los últimos ${daysPeriod} días`);
    console.log(`📊 Incluyendo torneos creados y/o iniciados desde: ${cutoffDate.toLocaleDateString()}`);
    
    if (usedQuestions.length === 0) {
      console.log(`💡 PRIMERA VEZ: No hay preguntas usadas recientemente. Todas las preguntas están disponibles.`);
    } else {
      // Log de debug para ver qué preguntas están siendo excluidas
      const questionIds2018 = usedQuestions.filter(q => q.sourcetable === 'ExamenOficial2018').length;
      const questionIds2024 = usedQuestions.filter(q => q.sourcetable === 'examenoficial2024').length;
      console.log(`📋 Preguntas a excluir: ${questionIds2018} del 2018, ${questionIds2024} del 2024`);
    }
    
    return usedQuestions.map(q => ({
      questionid: q.questionid,
      sourceTable: q.sourcetable
    }));
  } catch (error) {
    console.error('❌ Error obteniendo preguntas usadas recientemente:', error);
    return [];
  }
}

// Función para asignar preguntas automáticamente al torneo
async function assignQuestionsToTournament(
  tournamentId: string, 
  config: {
    totalquestions: number;
    examSource: 'both' | '2018' | '2024' | 'all' | 'valid';
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    questionCategory?: string;
  }
) {
  try {
    console.log(`🎯 Asignando ${config.totalquestions} preguntas al torneo ${tournamentId}`);
    console.log(`📊 Configuración: fuente=${config.examSource}, dificultad=${config.difficulty}`);
    
    // Obtener preguntas ya usadas recientemente para evitar repetición
    const recentlyUsedQuestions = await getRecentlyUsedQuestions(30, tournamentId); // No repetir en 30 días
    const usedQuestionIds2018 = recentlyUsedQuestions
      .filter(q => q.sourceTable === 'ExamenOficial2018')
      .map(q => q.questionid);
    const usedQuestionIds2024 = recentlyUsedQuestions
      .filter(q => q.sourceTable === 'examenoficial2024')
      .map(q => q.questionid);
    const usedQuestionIdsValid = recentlyUsedQuestions
      .filter(q => q.sourceTable === 'ValidQuestion')
      .map(q => q.questionid);
    
    console.log(`🚫 Excluyendo ${usedQuestionIds2018.length} preguntas del 2018, ${usedQuestionIds2024.length} del 2024 y ${usedQuestionIdsValid.length} de ValidQuestion usadas recientemente`);
    
    let selectedQuestions: Array<{ questionid: string; sourceTable: string; questionnumber: number; }> = [];

    // Calcular distribución de preguntas entre fuentes
    let questions2018Count = 0;
    let questions2024Count = 0;
    let questionsValidCount = 0;
    
    if (config.examSource === 'both') {
      questions2018Count = Math.floor(config.totalquestions / 2);
      questions2024Count = config.totalquestions - questions2018Count;
    } else if (config.examSource === '2018') {
      questions2018Count = config.totalquestions;
    } else if (config.examSource === '2024') {
      questions2024Count = config.totalquestions;
    } else if (config.examSource === 'valid') {
      questionsValidCount = config.totalquestions;
    } else if (config.examSource === 'all') {
      // Distribución personalizada: 40% 2018, 40% 2024, 20% ValidQuestion
      questions2018Count = Math.round(config.totalquestions * 0.4);
      questions2024Count = Math.round(config.totalquestions * 0.4);
      questionsValidCount = config.totalquestions - questions2018Count - questions2024Count;
      
      console.log(`📊 Distribución personalizada aplicada:`);
      console.log(`   🏆 2018: ${questions2018Count} preguntas (${((questions2018Count/config.totalquestions)*100).toFixed(1)}%)`);
      console.log(`   🏆 2024: ${questions2024Count} preguntas (${((questions2024Count/config.totalquestions)*100).toFixed(1)}%)`);
      console.log(`   🏆 ValidQuestion: ${questionsValidCount} preguntas (${((questionsValidCount/config.totalquestions)*100).toFixed(1)}%)`);
    }

    // Seleccionar preguntas de ExamenOficial2018
    if (questions2018Count > 0) {
      const whereClause: any = { isactive: true };
      
      // Excluir preguntas ya usadas recientemente
      if (usedQuestionIds2018.length > 0) {
        whereClause.id = { notIn: usedQuestionIds2018 };
      }
      
      // Filtrar por categoría si se especifica
      if (config.questionCategory && config.questionCategory !== 'mixed') {
        whereClause.category = config.questionCategory;
      }
      
      // Filtrar por dificultad si no es "mixed"
      if (config.difficulty !== 'mixed') {
        whereClause.difficulty = config.difficulty.toUpperCase();
      }

      const questions2018 = await prisma.examenoficial2018.findMany({
        where: whereClause,
        orderBy: [
          { sendcount: 'asc' },  // Priorizar preguntas menos usadas
          { questionnumber: 'asc' }
        ],
        take: questions2018Count * 3 // Tomar más para tener variedad y filtrar preguntas largas
      });

      // ✅ FILTRAR PREGUNTAS DEMASIADO LARGAS PARA POLLS DE TELEGRAM
      const TELEGRAM_POLL_MAX_LENGTH = 300;
      const tournamentHeaderLength = 60; // Estimación promedio del header de torneo
      const maxQuestionLength = TELEGRAM_POLL_MAX_LENGTH - tournamentHeaderLength;
      
      const filteredQuestions2018 = questions2018.filter((q: any) => {
        const isValidLength = q.question.length <= maxQuestionLength;
        if (!isValidLength) {
          console.log(`⚠️ Pregunta ${q.questionnumber} del 2018 filtrada por longitud (${q.question.length} chars)`);
        }
        return isValidLength;
      });

      console.log(`📚 Encontradas ${questions2018.length} preguntas del 2018, ${filteredQuestions2018.length} válidas para torneos (excluyendo ${usedQuestionIds2018.length} usadas recientemente)`);

      // Si no hay suficientes preguntas sin usar, usar las usadas recientemente como fallback
      let availableQuestions2018 = filteredQuestions2018;
              if (filteredQuestions2018.length < questions2018Count) {
        console.log(`⚠️ Preguntas válidas disponibles insuficientes del 2018. Habilitando preguntas usadas recientemente como fallback...`);
        
        const fallbackWhereClause = { ...whereClause };
        delete fallbackWhereClause.id; // Remover la exclusión
        
        const fallbackQuestions = await prisma.examenoficial2018.findMany({
          where: fallbackWhereClause,
          orderBy: [
            { sendcount: 'asc' },
            { questionnumber: 'asc' }
          ]
        });
        
        // También filtrar preguntas largas en el fallback
        const filteredFallbackQuestions = fallbackQuestions.filter((q: any) => {
          const isValidLength = q.question.length <= maxQuestionLength;
          if (!isValidLength) {
            console.log(`⚠️ Pregunta fallback ${q.questionnumber} del 2018 filtrada por longitud (${q.question.length} chars)`);
          }
          return isValidLength;
        });
        
        availableQuestions2018 = filteredFallbackQuestions;
        console.log(`🔄 Usando ${filteredFallbackQuestions.length} preguntas válidas del 2018 incluyendo las usadas recientemente`);
      }

      // Seleccionar aleatoriamente la cantidad necesaria
      const shuffled2018 = shuffleArray(availableQuestions2018).slice(0, questions2018Count);
      
      selectedQuestions.push(...shuffled2018.map((q, index) => ({
        questionid: q.id,
        sourceTable: 'ExamenOficial2018',
        questionnumber: index + 1
      })));

      // Si no se obtuvieron suficientes preguntas del 2018, ajustar el conteo para 2024
      const actualQuestions2018 = shuffled2018.length;
      if (actualQuestions2018 < questions2018Count) {
        const deficit = questions2018Count - actualQuestions2018;
        questions2024Count += deficit;
        console.log(`⚠️ Solo se encontraron ${actualQuestions2018} preguntas del 2018 de ${questions2018Count} requeridas. Compensando con ${deficit} adicionales del 2024`);
      }
    }

    // Seleccionar preguntas de examenoficial2024
    if (questions2024Count > 0) {
      const whereClause: any = { isactive: true };
      
      // Excluir preguntas ya usadas recientemente
      if (usedQuestionIds2024.length > 0) {
        whereClause.id = { notIn: usedQuestionIds2024 };
      }
      
      // Filtrar por categoría si se especifica
      if (config.questionCategory && config.questionCategory !== 'mixed') {
        whereClause.category = config.questionCategory;
      }
      
      // Filtrar por dificultad si no es "mixed"
      if (config.difficulty !== 'mixed') {
        whereClause.difficulty = config.difficulty.toUpperCase();
      }

      const questions2024 = await prisma.examenoficial2024.findMany({
        where: whereClause,
        orderBy: [
          { sendcount: 'asc' },  // Priorizar preguntas menos usadas
          { questionnumber: 'asc' }
        ],
        take: questions2024Count * 3 // Tomar más para tener variedad y filtrar preguntas largas
      });

      // ✅ FILTRAR PREGUNTAS DEMASIADO LARGAS PARA POLLS DE TELEGRAM
      const TELEGRAM_POLL_MAX_LENGTH = 300;
      const tournamentHeaderLength = 60; // Estimación promedio del header de torneo
      const maxQuestionLength = TELEGRAM_POLL_MAX_LENGTH - tournamentHeaderLength;
      
      const filteredQuestions2024 = questions2024.filter((q: any) => {
        const isValidLength = q.question.length <= maxQuestionLength;
        if (!isValidLength) {
          console.log(`⚠️ Pregunta ${q.questionnumber} del 2024 filtrada por longitud (${q.question.length} chars)`);
        }
        return isValidLength;
      });

      console.log(`📚 Encontradas ${questions2024.length} preguntas del 2024, ${filteredQuestions2024.length} válidas para torneos (excluyendo ${usedQuestionIds2024.length} usadas recientemente)`);

      // Si no hay suficientes preguntas sin usar, usar las usadas recientemente como fallback
      let availableQuestions2024 = filteredQuestions2024;
              if (filteredQuestions2024.length < questions2024Count) {
        console.log(`⚠️ Preguntas válidas disponibles insuficientes del 2024. Habilitando preguntas usadas recientemente como fallback...`);
        
        const fallbackWhereClause = { ...whereClause };
        delete fallbackWhereClause.id; // Remover la exclusión
        
        const fallbackQuestions = await prisma.examenoficial2024.findMany({
          where: fallbackWhereClause,
          orderBy: [
            { sendcount: 'asc' },
            { questionnumber: 'asc' }
          ]
        });
        
        // También filtrar preguntas problemáticas en el fallback
        const filteredFallbackQuestions = fallbackQuestions.filter(q => {
          const isValidLength = q.question.length <= maxQuestionLength;
          const options = cleanMalformedOptionsJSON(q.options as string) as string[];
          const hasValidOptions = Array.isArray(options) && options.length >= 2 && options.length <= 4;
          const hasValidAnswer = q.correctanswerindex >= 0 && q.correctanswerindex < (options?.length || 0);
          
          if (!isValidLength) {
            console.log(`⚠️ Pregunta ValidQuestion ${q.id.substring(0, 8)} filtrada por longitud (${q.question.length} chars)`);
          }
          if (!hasValidOptions) {
            console.log(`⚠️ Pregunta ValidQuestion ${q.id.substring(0, 8)} filtrada por opciones inválidas`);
          }
          if (!hasValidAnswer) {
            console.log(`⚠️ Pregunta ValidQuestion ${q.id.substring(0, 8)} filtrada por respuesta correcta inválida`);
          }
          
          return isValidLength && hasValidOptions && hasValidAnswer;
        });
        
        availableQuestions2024 = filteredFallbackQuestions;
        console.log(`🔄 Usando ${filteredFallbackQuestions.length} preguntas válidas del 2024 incluyendo las usadas recientemente`);
      }

      // Seleccionar aleatoriamente la cantidad necesaria
      const shuffled2024 = shuffleArray(availableQuestions2024).slice(0, questions2024Count);
      
      selectedQuestions.push(...shuffled2024.map((q, index) => ({
        questionid: q.id,
        sourceTable: 'examenoficial2024',
        questionnumber: selectedQuestions.length + index + 1
      })));

      // Verificar si se obtuvieron suficientes preguntas en total
      const actualQuestions2024 = shuffled2024.length;
      if (actualQuestions2024 < questions2024Count) {
        const deficit = questions2024Count - actualQuestions2024;
        questionsValidCount += deficit;
        console.log(`⚠️ Solo se encontraron ${actualQuestions2024} preguntas del 2024 de ${questions2024Count} requeridas. Compensando con ${deficit} adicionales de ValidQuestion`);
      }
    }

    // Seleccionar preguntas de ValidQuestion
    if (questionsValidCount > 0) {
      const whereClause: any = { isactive: true };
      
      // Excluir preguntas ya usadas recientemente
      if (usedQuestionIdsValid.length > 0) {
        whereClause.id = { notIn: usedQuestionIdsValid };
      }
      
      // Filtrar por categoría si se especifica
      if (config.questionCategory && config.questionCategory !== 'mixed') {
        whereClause.type = config.questionCategory;
      }
      
      // Filtrar por dificultad si no es "mixed"
      if (config.difficulty !== 'mixed') {
        whereClause.difficulty = config.difficulty.toLowerCase();
      }

      const questionsValid = await prisma.validquestion.findMany({
        where: whereClause,
        orderBy: [
          { sendcount: 'asc' },  // Priorizar preguntas menos usadas
          { createdat: 'asc' }
        ],
        take: questionsValidCount * 3 // Tomar más para tener variedad y filtrar preguntas largas
      });

      // ✅ FILTRAR PREGUNTAS DEMASIADO LARGAS PARA POLLS DE TELEGRAM
      const TELEGRAM_POLL_MAX_LENGTH = 300;
      const tournamentHeaderLength = 60; // Estimación promedio del header de torneo
      const maxQuestionLength = TELEGRAM_POLL_MAX_LENGTH - tournamentHeaderLength;
      
      const filteredQuestionsValid = questionsValid.filter(q => {
        const isValidLength = q.parsedquestion.length <= maxQuestionLength;
        const options = cleanMalformedOptionsJSON(q.parsedoptions as string) as string[];
        const hasValidOptions = Array.isArray(options) && options.length >= 2 && options.length <= 4;
        const hasValidAnswer = q.correctanswerindex >= 0 && q.correctanswerindex < (options?.length || 0);
        
        if (!isValidLength) {
          console.log(`⚠️ Pregunta ValidQuestion ${q.id.substring(0, 8)} filtrada por longitud (${q.parsedquestion.length} chars)`);
        }
        if (!hasValidOptions) {
          console.log(`⚠️ Pregunta ValidQuestion ${q.id.substring(0, 8)} filtrada por opciones inválidas`);
        }
        if (!hasValidAnswer) {
          console.log(`⚠️ Pregunta ValidQuestion ${q.id.substring(0, 8)} filtrada por respuesta correcta inválida`);
        }
        
        return isValidLength && hasValidOptions && hasValidAnswer;
      });

      console.log(`📚 Encontradas ${questionsValid.length} preguntas de ValidQuestion, ${filteredQuestionsValid.length} válidas para torneos (excluyendo ${usedQuestionIdsValid.length} usadas recientemente)`);

      // Si no hay suficientes preguntas sin usar, usar las usadas recientemente como fallback
      let availableQuestionsValid = filteredQuestionsValid;
      if (filteredQuestionsValid.length < questionsValidCount) {
        console.log(`⚠️ Preguntas válidas disponibles insuficientes de ValidQuestion. Habilitando preguntas usadas recientemente como fallback...`);
        
        const fallbackWhereClause = { ...whereClause };
        delete fallbackWhereClause.id; // Remover la exclusión
        
        const fallbackQuestions = await prisma.validquestion.findMany({
          where: fallbackWhereClause,
          orderBy: [
            { sendcount: 'asc' },
            { createdat: 'asc' }
          ]
        });
        
        // También filtrar preguntas problemáticas en el fallback
        const filteredFallbackQuestions = fallbackQuestions.filter(q => {
          const isValidLength = q.parsedquestion.length <= maxQuestionLength;
          const options = cleanMalformedOptionsJSON(q.parsedoptions as string) as string[];
          const hasValidOptions = Array.isArray(options) && options.length >= 2 && options.length <= 4;
          const hasValidAnswer = q.correctanswerindex >= 0 && q.correctanswerindex < (options?.length || 0);
          
          return isValidLength && hasValidOptions && hasValidAnswer;
        });
        
        availableQuestionsValid = filteredFallbackQuestions;
        console.log(`🔄 Usando ${filteredFallbackQuestions.length} preguntas válidas de ValidQuestion incluyendo las usadas recientemente`);
      }

      // Seleccionar aleatoriamente la cantidad necesaria
      const shuffledValid = shuffleArray(availableQuestionsValid).slice(0, questionsValidCount);
      
      selectedQuestions.push(...shuffledValid.map((q, index) => ({
        questionid: q.id,
        sourceTable: 'ValidQuestion',
        questionnumber: selectedQuestions.length + index + 1
      })));

      // Verificar si se obtuvieron suficientes preguntas en total
      const actualQuestionsValid = shuffledValid.length;
      if (actualQuestionsValid < questionsValidCount) {
        console.log(`⚠️ Solo se encontraron ${actualQuestionsValid} preguntas de ValidQuestion de ${questionsValidCount} requeridas`);
      }
    }

    // Mezclar todas las preguntas seleccionadas y renumerar
    const finalQuestions = shuffleArray(selectedQuestions).map((q, index) => ({
      ...q,
      questionnumber: index + 1
    }));

    console.log(`🔀 Mezcladas ${finalQuestions.length} preguntas para asignación final`);

    // Crear registros en TournamentQuestion
    const createdQuestions = await Promise.all(
      finalQuestions.map(async (q) => {
        return await prisma.tournamentquestion.create({
          data: {
            id: crypto.randomUUID(), // ✅ Agregar ID único
            tournamentid: tournamentId,
            questionid: q.questionid,
            questionnumber: q.questionnumber,
            sourcetable: q.sourceTable
          }
        });
      })
    );

    console.log(`✅ Asignadas ${createdQuestions.length} preguntas al torneo`);
    
    // 🎯 ACTUALIZAR CAMPOS DE TRACKING EN LAS PREGUNTAS USADAS
    await updateQuestionTrackingFields(tournamentId, finalQuestions);
    
    console.log(`📊 Resumen de exclusión: ${recentlyUsedQuestions.length} preguntas excluidas de torneos recientes`);
    console.log(`🔄 Sistema robusto de anti-repetición activado`);
    
    return {
      success: true,
      questionsAssigned: createdQuestions.length,
      distribution: {
        questions2018: questions2018Count,
        questions2024: questions2024Count,
        questionsValid: questionsValidCount
      },
      exclusionInfo: {
        recentlyUsedQuestions: recentlyUsedQuestions.length,
        usedQuestions2018: usedQuestionIds2018.length,
        usedQuestions2024: usedQuestionIds2024.length,
        usedQuestionsValid: usedQuestionIdsValid.length,
        exclusionPeriodDays: 30
      }
    };

  } catch (error) {
    console.error('❌ Error asignando preguntas:', error);
    throw error;
  }
}

// 🎯 FUNCIÓN PARA ACTUALIZAR CAMPOS DE TRACKING EN PREGUNTAS USADAS
// (Versión temporal - se activará cuando el cliente Prisma tenga los nuevos campos)
async function updateQuestionTrackingFields(
  tournamentId: string, 
  selectedQuestions: Array<{ questionid: string; sourceTable: string; questionnumber }>
) {
  try {
    console.log(`📝 [SISTEMA ROBUSTO] Preparado para actualizar tracking de ${selectedQuestions.length} preguntas...`);
    console.log(`🚧 [TEMPORAL] Los nuevos campos de tracking están en proceso de despliegue`);
    
    // TODO: Activar cuando el cliente Prisma tenga los nuevos campos:
    // - lastUsedInTournament: DateTime
    // - tournamentUsageCount: Int  
    // - lastTournamentId: String
    
    console.log(`🎯 Sistema de tracking robusto preparado para la próxima actualización`);
    
  } catch (error) {
    console.error('❌ Error en sistema de tracking:', error);
    // No fallar el torneo por un error de tracking
  }
}

// GET /api/admin/tournaments - Obtener todos los torneos
export async function GET() {
  try {
    // Consultar todos los torneos de la base de datos real
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        createdat: 'desc',
      },
    });

    console.log(`📊 Encontrados ${tournaments.length} torneos en la base de datos`);

    // Transformar los datos para que coincidan con la interfaz
    const formattedTournaments = tournaments.map(tournament => {
      let status: 'draft' | 'active' | 'completed' | 'cancelled' = 'draft';
      
      switch (tournament.status) {
        case 'SCHEDULED':
        case 'REGISTRATION_OPEN':
        case 'READY_TO_START':
          status = 'draft';
          break;
        case 'IN_PROGRESS':
          status = 'active';
          break;
        case 'COMPLETED':
          status = 'completed';
          break;
        case 'CANCELLED':
          status = 'cancelled';
          break;
        default:
          status = 'draft';
      }

      return {
        id: tournament.id.toString(),
        name: tournament.name,
        description: tournament.description || 'Sin descripción',
        totalquestions: tournament.questionscount || 0,
        duration: Math.round((tournament.timelimit || 600) / 60),
        startTime: tournament.scheduleddate?.toISOString() || tournament.createdat.toISOString(),
        endTime: tournament.endtime?.toISOString() || null,
        status,
        participants: tournament.maxparticipants || 0,
        questions: [], // ✅ Cambiar a array vacío en lugar de questions?.map(...)
        createdAt: tournament.createdat.toISOString(),
      };
    });

    return NextResponse.json(formattedTournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Error al obtener los torneos' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tournaments - Crear un nuevo torneo con preguntas asignadas automáticamente
export async function POST(req: Request) {
  console.log('--- INICIO DE SOLICITUD POST /api/admin/tournaments ---');
  try {
    const body = await req.json();
    console.log('Cuerpo de la solicitud (parsed):', body);

    const {
      name,
      description,
      totalQuestions,
      duration,
      startTime,
      questionCategory = 'mixed',
      difficulty = 'mixed',
      examSource = 'all'
    } = body;

    console.log('🏆 Creando nuevo torneo:', { name, totalQuestions, difficulty, examSource });

    // Validaciones básicas
    if (!name || !startTime || !totalQuestions || !duration) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, startTime, totalQuestions, duration' },
        { status: 400 }
      );
    }

    if (totalQuestions < 1 || totalQuestions > 100) {
      return NextResponse.json(
        { error: 'El número de preguntas debe estar entre 1 y 100' },
        { status: 400 }
      );
    }

    const initialParticipants = 0;
    const questionsCount = parseInt(totalQuestions.toString());
    const basePrizePool = calculateBaseprizepool(initialParticipants, questionsCount);

    const tournament = await prisma.tournament.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description: description || `Torneo de ${totalQuestions} preguntas`,
        scheduleddate: new Date(startTime),
        starttime: new Date(startTime),
        status: 'SCHEDULED',
        questionscount: questionsCount,
        timelimit: parseInt(duration.toString()) * 60,
        maxparticipants: 100,
        prizepool: basePrizePool,
        updatedat: new Date()
      }
    });

    console.log(`✅ Torneo creado con ID: ${tournament.id}`);

    const questionAssignmentResult = await assignQuestionsToTournament(tournament.id, {
      totalquestions: parseInt(totalQuestions.toString()),
      examSource: examSource as 'both' | '2018' | '2024' | 'all' | 'valid',
      difficulty: difficulty as 'easy' | 'medium' | 'hard' | 'mixed',
      questionCategory
    });

    const completeTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id }
    });

    if (!completeTournament) {
      throw new Error('Error al obtener el torneo creado');
    }

    const formattedTournament = {
      id: completeTournament.id.toString(),
      name: completeTournament.name,
      description: completeTournament.description || 'Sin descripción',
      totalquestions: completeTournament.questionscount || 0,
      duration: Math.round((completeTournament.timelimit || 600) / 60),
      startTime: completeTournament.scheduleddate?.toISOString() || completeTournament.createdat.toISOString(),
      endTime: completeTournament.endtime?.toISOString() || null,
      status: 'draft' as const,
      participants: completeTournament.maxparticipants || 0,
      questions: [],
      createdAt: completeTournament.createdat.toISOString(),
    };

    console.log(`🎉 Torneo "${name}" creado exitosamente con ${questionAssignmentResult.questionsAssigned} preguntas`);

    await createTournamentNotifications(tournament.id, new Date(startTime));
    await sendNewTournamentAnnouncement(tournament, questionAssignmentResult.questionsAssigned);

    return NextResponse.json({
      ...formattedTournament,
      questionAssignment: questionAssignmentResult
    });

  } catch (error) {
    console.error('❌ Error creating tournament:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Stack de error:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json(
      { 
        error: 'Error al crear el torneo',
        details: errorMessage
      },
      { status: 500 }
    );
  } finally {
    console.log('--- FIN DE SOLICITUD POST /api/admin/tournaments ---');
    await prisma.$disconnect();
  }
}