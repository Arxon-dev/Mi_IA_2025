import { PrismaClient } from '@prisma/client';
import { parseGiftQuestion } from '@/utils/giftParser';
import { cleanMalformedOptionsJSON } from '@/utils/optionsParser';

// Instancia global de Prisma
const prisma = new PrismaClient();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

export interface DuelQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctanswerindex: number;
  sourcemodel: 'document' | 'section';
}

export interface DuelParticipant {
  id: string;
  telegramuserid: string;
  firstname: string;
  username?: string;
}

export interface ActiveDuel {
  id: string;
  challenger: DuelParticipant;
  challenged: DuelParticipant;
  questionscount: number;
  timelimit: number;
  stake: number;
  currentQuestion: number;
  questions: DuelQuestion[];
  status: string;
}

export class DuelManager {
  
  /**
   * Iniciar un duelo aceptado - cambiar a activo y enviar primera pregunta
   */
  static async startActiveDuel(duelId: string): Promise<boolean> {
    try {
      console.log('🚀 DuelManager.startActiveDuel - Iniciando duelo:', duelId);
      
      // 1. Obtener datos del duelo
      const duel = await prisma.duel.findUnique({
        where: { id: duelId }
      });
      
      if (!duel) {
        console.error('❌ Duelo no encontrado:', duelId);
        return false;
      }
      
      if (duel.status !== 'accepted') {
        console.error('❌ El duelo no está en estado "accepted":', duel.status);
        return false;
      }
      
      // Obtener datos de challenger y challenged por separado
      const challenger = await prisma.telegramuser.findUnique({
        where: { id: duel.challengerid }
      });
      
      const challenged = await prisma.telegramuser.findUnique({
        where: { id: duel.challengedid }
      });
      
      if (!challenger || !challenged) {
        console.error('❌ No se encontraron los participantes del duelo');
        return false;
      }
      
      console.log('✅ Duelo encontrado:', `${challenger.firstname} VS ${challenged.firstname}`);
      
      // 2. Seleccionar preguntas aleatorias
      console.log('🎲 Seleccionando', duel.questionscount, 'preguntas aleatorias para duelo...');
      console.log('🔍 DEBUG: Entrando a selectQuestionsForDuel...');
      
      const selectedQuestions = await this.selectQuestionsForDuel(duel.questionscount);
      
      console.log('🔍 DEBUG: selectQuestionsForDuel devolvió:', selectedQuestions.length, 'preguntas');
      
      if (selectedQuestions.length < duel.questionscount) {
        console.error('❌ No hay suficientes preguntas disponibles. Necesarias:', duel.questionscount, ', Encontradas:', selectedQuestions.length);
        console.error('🔍 DEBUG: Este es probablemente el problema');
        return false;
      }
      
      console.log('✅ Seleccionadas', selectedQuestions.length, 'preguntas válidas para el duelo');
      
      // 3. Cambiar estado a activo y guardar IDs de preguntas
      console.log('🔍 DEBUG: Guardando preguntas en base de datos...');
      
      await prisma.duel.update({
        where: { id: duelId },
        data: {
          status: 'active',
          startedat: new Date()
        }
      });
      
      // Crear las preguntas del duelo por separado
      for (let index = 0; index < selectedQuestions.length; index++) {
        await prisma.duelquestion.create({
          data: {
            id: `${duelId}_q${index + 1}_${Date.now()}`,
            duelid: duelId,
            questionid: selectedQuestions[index].id,
            order: index + 1
          }
        });
      }
      
      console.log('✅ Duelo actualizado a estado "active" con preguntas asignadas');
      console.log('🔍 DEBUG: Preguntas guardadas:', selectedQuestions.map(q => q.id));
      
      // 4. Enviar primera pregunta
      console.log('🔍 DEBUG: Enviando primera pregunta...');
      const firstQuestionSent = await this.sendDuelQuestion(duelId, 1, selectedQuestions[0]);
      
      if (!firstQuestionSent) {
        console.error('❌ Error enviando primera pregunta del duelo');
        return false;
      }
      
      console.log('✅ Primera pregunta del duelo enviada exitosamente');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error en startActiveDuel:', error);
      console.error('🔍 DEBUG: Error stack:', error.stack);
      return false;
    }
  }
  
  /**
   * Seleccionar preguntas aleatorias para un duelo
   */
  static async selectQuestionsForDuel(count: number): Promise<DuelQuestion[]> {
    try {
      console.log('🔍 DEBUG: selectQuestionsForDuel iniciado, buscando', count, 'preguntas');
      const validQuestions: DuelQuestion[] = [];
      let questionsProcessed = 0;
      let questionsSkipped = 0;
      
      // Obtener preguntas de la tabla Question
      console.log('🔍 DEBUG: Obteniendo preguntas de tabla Question...');
      const documentQuestions = await prisma.question.findMany({
        where: { archived: false },
        take: 100, // 🔥 AUMENTAR para tener más opciones ante fallos de parsing
        orderBy: { createdat: 'desc' }
      });
      
      console.log('🔍 DEBUG: Encontradas', documentQuestions.length, 'preguntas no archivadas');
      
      // Procesar preguntas de documentos
      let validDocumentCount = 0;
      for (const q of documentQuestions) {
        questionsProcessed++;
        
        try {
          // 🔥 CAMBIO PRINCIPAL: Usar parser GIFT en lugar de JSON.parse
          const parsedQuestion = parseGiftQuestion(q.content);
          
          if (parsedQuestion.enunciado && 
              parsedQuestion.opciones && 
              parsedQuestion.opciones.length >= 2 &&
              parsedQuestion.opciones.some(opt => opt.iscorrect)) {
            
            const correctIndex = parsedQuestion.opciones.findIndex(opt => opt.iscorrect);
            
            validQuestions.push({
              id: q.id,
              questionText: parsedQuestion.enunciado,
              options: parsedQuestion.opciones.map(opt => opt.text),
              correctanswerindex: correctIndex,
              sourcemodel: 'document'
            });
            
            validDocumentCount++;
            console.log(`✅ Pregunta document ${q.id.substring(0, 8)} parseada exitosamente`);
            
            // 🔥 OPTIMIZACIÓN: Si ya tenemos suficientes preguntas, podemos parar
            if (validQuestions.length >= count) {
              console.log(`🎯 Ya tenemos suficientes preguntas (${validQuestions.length}), terminando búsqueda temprano`);
              break;
            }
          } else {
            console.warn(`⚠️ Pregunta document ${q.id} parseada pero estructura inválida`);
            questionsSkipped++;
          }
          
        } catch (parseError) {
          console.warn(`⚠️ Error parseando pregunta document ${q.id}:`, (parseError as Error).message);
          questionsSkipped++;
          // 🔥 CONTINUAR en lugar de terminar - esto es la clave
          continue;
        }
      }
      
      console.log(`🔍 DEBUG: Preguntas document válidas: ${validDocumentCount} de ${documentQuestions.length} (saltadas: ${questionsSkipped})`);
      
      // Si aún no tenemos suficientes preguntas, buscar en SectionQuestion
      if (validQuestions.length < count) {
        console.log('🔍 DEBUG: Obteniendo preguntas de tabla SectionQuestion...');
        const sectionQuestions = await prisma.sectionquestion.findMany({
          take: 50, // 🔥 AUMENTAR para compensar fallos de parsing
          orderBy: { createdat: 'desc' }
        });
        
        console.log('🔍 DEBUG: Encontradas', sectionQuestions.length, 'preguntas de sección');
        
        // Procesar preguntas de secciones
        let validSectionCount = 0;
        for (const q of sectionQuestions) {
          questionsProcessed++;
          
          try {
            // 🔥 CAMBIO PRINCIPAL: Usar parser GIFT en lugar de JSON.parse
            const parsedQuestion = parseGiftQuestion(q.content);
            
            if (parsedQuestion.enunciado && 
                parsedQuestion.opciones && 
                parsedQuestion.opciones.length >= 2 &&
                parsedQuestion.opciones.some(opt => opt.iscorrect)) {
              
              const correctIndex = parsedQuestion.opciones.findIndex(opt => opt.iscorrect);
              
              validQuestions.push({
                id: q.id,
                questionText: parsedQuestion.enunciado,
                options: parsedQuestion.opciones.map(opt => opt.text),
                correctanswerindex: correctIndex,
                sourcemodel: 'section'
              });
              
              validSectionCount++;
              console.log(`✅ Pregunta section ${q.id.substring(0, 8)} parseada exitosamente`);
              
              // 🔥 OPTIMIZACIÓN: Si ya tenemos suficientes preguntas, podemos parar
              if (validQuestions.length >= count) {
                console.log(`🎯 Ya tenemos suficientes preguntas (${validQuestions.length}), terminando búsqueda`);
                break;
              }
            } else {
              console.warn(`⚠️ Pregunta section ${q.id} parseada pero estructura inválida`);
              questionsSkipped++;
            }
            
          } catch (parseError) {
            console.warn(`⚠️ Error parseando pregunta section ${q.id}:`, (parseError as Error).message);
            questionsSkipped++;
            // 🔥 CONTINUAR en lugar de terminar - esto es la clave
            continue;
          }
        }
        
        console.log(`🔍 DEBUG: Preguntas section válidas: ${validSectionCount} de ${sectionQuestions.length}`);
      }
      
      console.log(`🔍 DEBUG: RESUMEN FINAL:`);
      console.log(`   📊 Total preguntas procesadas: ${questionsProcessed}`);
      console.log(`   ✅ Preguntas válidas encontradas: ${validQuestions.length}`);
      console.log(`   ⚠️ Preguntas saltadas por errores: ${questionsSkipped}`);
      console.log(`   🎯 Preguntas solicitadas: ${count}`);
      
      // 🔥 VERIFICACIÓN FINAL: Asegurar que tenemos suficientes preguntas
      if (validQuestions.length < count) {
        console.warn(`⚠️ Solo se encontraron ${validQuestions.length} preguntas válidas de ${count} solicitadas`);
        
        // Si no tenemos ni una sola pregunta válida, esto es un error crítico
        if (validQuestions.length === 0) {
          throw new Error(`❌ CRÍTICO: No se pudo parsear ninguna pregunta válida. Preguntas procesadas: ${questionsProcessed}, Errores: ${questionsSkipped}`);
        }
        
        // Si tenemos algunas pero no suficientes, continuar con las que tenemos
        console.log(`ℹ️ Continuando con ${validQuestions.length} preguntas disponibles`);
      }
      
      // Mezclar las preguntas y devolver la cantidad solicitada
      const shuffled = validQuestions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);
      
      console.log(`🎯 Devolviendo ${selected.length} preguntas seleccionadas para el duelo`);
      
      return selected;
      
    } catch (error) {
      console.error('❌ Error crítico en selectQuestionsForDuel:', error);
      throw error;
    }
  }
  
  /**
   * Enviar pregunta de duelo a Telegram - VERSIÓN HÍBRIDA CON FALLBACK INTELIGENTE
   */
  static async sendDuelQuestion(duelId: string, questionnumber: number, questionData: DuelQuestion): Promise<boolean> {
    try {
      console.log(`📤 Enviando pregunta ${questionnumber} del duelo ${duelId} (MODO HÍBRIDO CON FALLBACK)`);
      
      // Obtener datos del duelo
      const duel = await prisma.duel.findUnique({
        where: { id: duelId }
      });
      
      if (!duel) {
        console.error('❌ Duelo no encontrado');
        return false;
      }
      
      // Obtener datos de challenger y challenged por separado
      const challenger = await prisma.telegramuser.findUnique({
        where: { id: duel.challengerid }
      });
      
      const challenged = await prisma.telegramuser.findUnique({
        where: { id: duel.challengedid }
      });
      
      if (!challenger || !challenged) {
        console.error('❌ No se encontraron los participantes del duelo');
        return false;
      }
      
      const totalQuestions = duel.questionscount;
      
      // 🎯 ANUNCIO MÍNIMO EN GRUPO (solo primera pregunta)
      if (questionnumber === 1) {
        const groupAnnouncement = `🗡️ ¡DUELO INICIADO! ⚔️\n\n` +
          `${challenger.firstname} vs ${challenged.firstname}\n` +
          `💰 ${duel.stake} puntos en juego\n` +
          `📝 ${totalQuestions} preguntas\n\n` +
          `🔒 <i>Las preguntas se envían por privado a los participantes</i>`;
        
        await this.sendGroupMessage(groupAnnouncement);
        console.log('📢 Anuncio de inicio enviado al grupo');
      }
      
      // 🔒 FORMATEAR PREGUNTA PARA ENVÍO PRIVADO
      const duelTitle = `🗡️ DUELO ${questionnumber}/${totalQuestions} ⚔️`;
      const stake = `💰 En juego: ${duel.stake} puntos`;
      
      const explanation = `⚔️ Pregunta ${questionnumber}/${totalQuestions} de tu duelo.\n\n🎯 ¡Tu respuesta cuenta para ganar o perder puntos!`;
      
      // 🤖 VERIFICAR SI ES DUELO CONTRA IA SIMULADA
      const isSimulatedIA = (
        challenger.telegramuserid === '999999999' || 
        challenged.telegramuserid === '999999999'
      );
      
      if (isSimulatedIA) {
        console.log('🤖 DUELO CONTRA IA SIMULADA - Solo enviando al participante humano');
        
        // Identificar el participante humano
        const humanParticipant = challenger.telegramuserid === '999999999' 
          ? challenged 
          : challenger;
        
        const iaParticipant = challenger.telegramuserid === '999999999' 
          ? challenger 
          : challenged;
        
        // Formatear pregunta para el humano
        const pollQuestion = `${duelTitle}\nTu oponente: ${iaParticipant.firstname}\n${stake}\n\n${questionData.questionText}`;
        
        let finalQuestion = pollQuestion;
        if (finalQuestion.length > 280) {
          finalQuestion = finalQuestion.substring(0, 277) + '...';
        }
        
        // 🚀 ENVIAR PREGUNTA SOLO AL PARTICIPANTE HUMANO
        console.log(`📨 Enviando pregunta privada solo a ${humanParticipant.firstname}...`);
        const humanPollRequest = {
          chat_id: humanParticipant.telegramuserid,
          question: finalQuestion,
          options: questionData.options,
          type: 'quiz',
          correct_option_id: questionData.correctanswerindex,
          is_anonymous: false,
          explanation: explanation,
          explanation_parse_mode: 'HTML'
        };
        
        const humanResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(humanPollRequest)
        });
        
        const humanResult = await humanResponse.json() as any;
        
        if (humanResult.ok && humanResult.result) {
          const humanPollId = humanResult.result.poll.id;
          
          console.log('✅ Pregunta de duelo IA enviada exitosamente:');
          console.log(`   👤 Human Poll ID: ${humanPollId}`);
          
          // 🤖 GUARDAR MAPEO SOLO PARA EL HUMANO
          await prisma.telegrampoll.create({
            data: {
              id: `poll-${humanPollId}-${Date.now()}`,
              pollid: humanPollId,
              questionid: `duel_${duelId}_q${questionnumber}`,
              sourcemodel: 'duel',
              correctanswerindex: questionData.correctanswerindex,
              options: JSON.stringify(questionData.options),
              chatid: humanParticipant.telegramuserid.toString(),
              createdat: new Date()
            }
          });
          
          // 🤖 SIMULAR RESPUESTA INMEDIATA DE LA IA (ALEATORIA)
          console.log('🤖 Simulando respuesta automática de IA...');
          setTimeout(async () => {
            try {
              // IA responde aleatoriamente (40% de acierto para que sea realista)
              const iaCorrect = Math.random() < 0.4;
              const iaResponse = iaCorrect ? questionData.correctanswerindex : 
                (questionData.correctanswerindex + 1) % questionData.options.length;
              
              console.log(`🤖 IA responde opción ${iaResponse} (${iaCorrect ? 'correcta' : 'incorrecta'})`);
              
              // Buscar usuario IA en la base de datos
              const iaUser = await prisma.telegramuser.findFirst({
                where: { telegramuserid: iaParticipant.telegramuserid }
              });
              
              if (iaUser) {
                // Guardar respuesta simulada de la IA
                await prisma.duelresponse.create({
                  data: {
                    id: `response-${duelId}-${questionnumber}-${iaUser.id}-${Date.now()}`,
                    duelid: duelId,
                    userid: iaUser.id,
                    questionid: `duel_${duelId}_q${questionnumber}`,
                    selectedoption: iaResponse,
                    iscorrect: iaCorrect,
                    points: iaCorrect ? 10 : 0,
                    responsetime: Math.floor(Math.random() * 15000) + 5000 // 5-20 segundos
                  }
                });
                
                console.log('🤖 Respuesta simulada de IA guardada');
              }
            } catch (error) {
              console.error('❌ Error simulando respuesta de IA:', error);
            }
          }, 3000); // IA responde después de 3 segundos
          
          console.log('✅ Mapeo de pregunta de duelo IA guardado en base de datos');
          
          return true;
          
        } else {
          console.error('❌ Error enviando pregunta de duelo IA:', humanResult.description);
          
          // 🚨 FALLBACK: Si falla envío privado, enviar al grupo
          console.log('🔄 FALLBACK: Enviando pregunta de duelo IA al grupo...');
          return await this.sendDuelQuestionToGroup(duelId, questionnumber, questionData);
        }
      }
      
      // 🚀 DUELO NORMAL ENTRE HUMANOS - ENVIAR A AMBOS PARTICIPANTES
      console.log('👥 DUELO ENTRE HUMANOS - Enviando a ambos participantes por privado...');
      
      const challengerQuestion = `${duelTitle}\nTu oponente: ${challenged.firstname}\n${stake}\n\n${questionData.questionText}`;
      const challengedQuestion = `${duelTitle}\nTu oponente: ${challenger.firstname}\n${stake}\n\n${questionData.questionText}`;
      
      let challengerFinalQuestion = challengerQuestion;
      let challengedFinalQuestion = challengedQuestion;
      
      if (challengerFinalQuestion.length > 280) {
        challengerFinalQuestion = challengerFinalQuestion.substring(0, 277) + '...';
      }
      if (challengedFinalQuestion.length > 280) {
        challengedFinalQuestion = challengedFinalQuestion.substring(0, 277) + '...';
      }
      
      // 🚀 ENVIAR PREGUNTA PRIVADA AL CHALLENGER
      console.log('📨 Enviando pregunta privada al challenger...');
      const challengerPollRequest = {
        chat_id: challenger.telegramuserid,
        question: challengerFinalQuestion,
        options: questionData.options,
        type: 'quiz',
        correct_option_id: questionData.correctanswerindex,
        is_anonymous: false,
        explanation: explanation,
        explanation_parse_mode: 'HTML'
      };
      
      const challengerResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengerPollRequest)
      });
      
      const challengerResult = await challengerResponse.json() as any;
      
      // 🚀 ENVIAR PREGUNTA PRIVADA AL CHALLENGED
      console.log('📨 Enviando pregunta privada al challenged...');
      const challengedPollRequest = {
        chat_id: challenged.telegramuserid,
        question: challengedFinalQuestion,
        options: questionData.options,
        type: 'quiz',
        correct_option_id: questionData.correctanswerindex,
        is_anonymous: false,
        explanation: explanation,
        explanation_parse_mode: 'HTML'
      };
      
      const challengedResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengedPollRequest)
      });
      
      const challengedResult = await challengedResponse.json() as any;
      
      // ✅ VERIFICAR QUE AMBOS POLLS SE ENVIARON CORRECTAMENTE
      if (challengerResult.ok && challengerResult.result && challengedResult.ok && challengedResult.result) {
        const challengerPollId = challengerResult.result.poll.id;
        const challengedPollId = challengedResult.result.poll.id;
        
        console.log('✅ Preguntas de duelo privadas enviadas exitosamente:');
        console.log(`   🗡️ Challenger Poll ID: ${challengerPollId}`);
        console.log(`   🛡️ Challenged Poll ID: ${challengedPollId}`);
        
        // 📊 GUARDAR AMBOS MAPEOS (uno por cada participante)
        await prisma.telegrampoll.create({
          data: {
            id: `poll-${challengerPollId}-${Date.now()}`,
            pollid: challengerPollId,
            questionid: `duel_${duelId}_q${questionnumber}`,
            sourcemodel: 'duel',
            correctanswerindex: questionData.correctanswerindex,
            options: JSON.stringify(questionData.options),
            chatid: challenger.telegramuserid.toString(),
            createdat: new Date()
          }
        });
        
        await prisma.telegrampoll.create({
          data: {
            id: `poll-${challengedPollId}-${Date.now()}`,
            pollid: challengedPollId,
            questionid: `duel_${duelId}_q${questionnumber}`,
            sourcemodel: 'duel',
            correctanswerindex: questionData.correctanswerindex,
            options: JSON.stringify(questionData.options),
            chatid: challenged.telegramuserid.toString(),
            createdat: new Date()
          }
        });
        
        console.log('✅ Mapeos de preguntas de duelo privadas guardadas en base de datos');
        
        return true;
        
      } else {
        console.error('❌ Error enviando una o ambas preguntas de duelo humano:', {
          challengerError: challengerResult.description || 'OK',
          challengedError: challengedResult.description || 'OK'
        });
        
        // 🚨 FALLBACK: Si falla envío privado, enviar al grupo como antes
        console.log('🔄 FALLBACK: Enviando pregunta de duelo al grupo...');
        return await this.sendDuelQuestionToGroup(duelId, questionnumber, questionData);
      }
      
    } catch (error) {
      console.error('❌ Error en sendDuelQuestion:', error);
      
      // 🚨 FALLBACK: En caso de error, intentar envío al grupo
      console.log('🔄 FALLBACK: Intentando envío al grupo tras error...');
      return await this.sendDuelQuestionToGroup(duelId, questionnumber, questionData);
    }
  }
  
  /**
   * FALLBACK: Enviar pregunta de duelo al grupo (método original)
   */
  static async sendDuelQuestionToGroup(duelId: string, questionnumber: number, questionData: DuelQuestion): Promise<boolean> {
    try {
      console.log(`📤 FALLBACK: Enviando pregunta ${questionnumber} del duelo ${duelId} al GRUPO`);
      
      // Obtener datos del duelo
      const duel = await prisma.duel.findUnique({
        where: { id: duelId }
      });
      
      if (!duel) {
        console.error('❌ Duelo no encontrado en fallback');
        return false;
      }
      
      // Obtener datos de challenger y challenged por separado
      const challenger = await prisma.telegramuser.findUnique({
        where: { id: duel.challengerid }
      });
      
      const challenged = await prisma.telegramuser.findUnique({
        where: { id: duel.challengedid }
      });
      
      if (!challenger || !challenged) {
        console.error('❌ No se encontraron los participantes del duelo en fallback');
        return false;
      }
      
      const totalQuestions = duel.questionscount;
      
      // Formatear pregunta para duelo (versión grupo)
      const duelTitle = `🗡️ DUELO ${questionnumber}/${totalQuestions} ⚔️`;
      const participants = `${challenger.firstname} vs ${challenged.firstname}`;
      const stake = `💰 Apuesta: ${duel.stake} puntos`;
      
      const pollQuestion = `${duelTitle}\n${participants}\n${stake}\n\n${questionData.questionText}`;
      
      // Truncar si es muy largo para Telegram
      let finalQuestion = pollQuestion;
      if (finalQuestion.length > 280) {
        finalQuestion = finalQuestion.substring(0, 277) + '...';
      }
      
      const explanation = `⚔️ Pregunta de duelo entre ${challenger.firstname} y ${challenged.firstname}.\n\n✅ ¡Solo los participantes del duelo pueden ganar/perder puntos con esta pregunta!`;
      
      // Enviar poll al grupo (método original)
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          question: finalQuestion,
          options: questionData.options,
          type: 'quiz',
          correct_option_id: questionData.correctanswerindex,
          is_anonymous: false,
          explanation: explanation,
          explanation_parse_mode: 'HTML'
        })
      });
      
      const result = await response.json() as any;
      
      if (result.ok && result.result) {
        const pollid = result.result.poll.id;
        const messageId = result.result.message_id;
        
        console.log('✅ Pregunta de duelo FALLBACK enviada al grupo:');
        console.log(`   📩 Message ID: ${messageId}`);
        console.log(`   🗳️ Poll ID: ${pollid}`);
        
        // Guardar mapeo para el grupo
        await prisma.telegrampoll.create({
          data: {
            id: `poll-${pollid}-${Date.now()}`,
            pollid: pollid,
            questionid: `duel_${duelId}_q${questionnumber}`,
            sourcemodel: 'duel',
            correctanswerindex: questionData.correctanswerindex,
            options: JSON.stringify(questionData.options),
            chatid: CHAT_ID,
            createdat: new Date()
          }
        });
        
        console.log('✅ Mapeo de pregunta de duelo FALLBACK guardado');
        
        return true;
        
      } else {
        console.error('❌ Error en envío FALLBACK:', result);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error en sendDuelQuestionToGroup:', error);
      return false;
    }
  }
  
  /**
   * Procesa una respuesta de duelo desde Telegram
   */
  static async processDuelResponse(
    pollid: string, 
    telegramuserid: string, 
    selectedOptionId: number, 
    responsetime?: number
  ): Promise<boolean> {
    try {
      console.log('🗡️ DuelManager.processDuelResponse - Procesando respuesta de duelo');
      console.log(`   🗳️ Poll ID: ${pollid}`);
      console.log(`   👤 Usuario: ${telegramuserid}`);
      console.log(`   ✅ Opción seleccionada: ${selectedOptionId}`);
      
      // Buscar si este poll corresponde a un duelo
      const pollMapping = await prisma.telegrampoll.findUnique({
        where: { pollid: pollid }
      });
      
      if (!pollMapping || pollMapping.sourcemodel !== 'duel') {
        console.log('ℹ️ Este poll no es de un duelo');
        return false; // No es duelo, manejar como pregunta normal
      }

      console.log('🗡️ ¡Es un duelo! Procesando respuesta...');
      
      // Extraer información del questionid del duelo
      const questionIdParts = pollMapping.questionid.split('_');
      if (questionIdParts.length !== 3 || questionIdParts[0] !== 'duel') {
        console.error('❌ Formato de questionid inválido:', pollMapping.questionid);
        return false;
      }
      
      const duelId = questionIdParts[1];
      const questionnumber = parseInt(questionIdParts[2].replace('q', ''));
      
      console.log(`🗡️ Duelo ID: ${duelId}, Pregunta: ${questionnumber}`);
      
      // Buscar el duelo
      const duel = await prisma.duel.findUnique({
        where: { id: duelId }
      });
      
      if (!duel) {
        console.error('❌ Duelo no encontrado:', duelId);
        return false;
      }
      
      // Obtener datos de challenger y challenged por separado
      const challenger = await prisma.telegramuser.findUnique({
        where: { id: duel.challengerid }
      });
      
      const challenged = await prisma.telegramuser.findUnique({
        where: { id: duel.challengedid }
      });
      
      if (!challenger || !challenged) {
        console.error('❌ No se encontraron los participantes del duelo');
        return false;
      }
      
      // Determinar si es el retador o el retado
      const isChallenger = challenger.telegramuserid.toString() === telegramuserid;
      const isChallenged = challenged.telegramuserid.toString() === telegramuserid;
      
      if (!isChallenger && !isChallenged) {
        console.error('❌ Usuario no pertenece a este duelo');
        return false;
      }
      
      const userRole = isChallenger ? 'challenger' : 'challenged';
      console.log(`🗡️ Usuario es el: ${userRole}`);
      
      // Verificar si ya respondió esta pregunta
      const existingResponse = await prisma.duelresponse.findFirst({
        where: {
          duelid: duelId,
          questionid: `duel_${duelId}_q${questionnumber}`,
          userid: telegramuserid
        }
      });
      
      if (existingResponse) {
        console.log('⚠️ Usuario ya respondió esta pregunta');
        return true; // Ya procesada
      }
      
      // Determinar si la respuesta es correcta
      const iscorrect = selectedOptionId === pollMapping.correctanswerindex;
      const points = iscorrect ? 10 : 0;
      
      console.log(`🎯 Respuesta ${iscorrect ? 'correcta' : 'incorrecta'} - ${points} puntos`);
      
      // Crear respuesta del duelo
      await prisma.duelresponse.create({
        data: {
          id: `${duelId}_${questionnumber}_${telegramuserid}_${Date.now()}`,
          duelid: duelId,
          questionid: `duel_${duelId}_q${questionnumber}`,
          userid: telegramuserid,
          selectedoption: selectedOptionId,
          iscorrect: iscorrect,
          points: points,
          responsetime: responsetime || 0
        }
      });
      
      console.log('✅ Respuesta de duelo guardada correctamente');
      
      // Verificar si ambos jugadores han respondido todas las preguntas
      await DuelManager.checkDuelCompletion(duelId);
      
      return true;
      
    } catch (error) {
      console.error('❌ Error procesando respuesta de duelo:', error);
      return false;
    }
  }
  
  /**
   * Verificar si el duelo está completo
   */
  static async checkDuelCompletion(duelId: string): Promise<void> {
    try {
      console.log(`🔍 Verificando completitud del duelo ${duelId}`);
      
      // Obtener duelo con respuestas
      const duel = await prisma.duel.findUnique({
        where: { id: duelId }
      });
      
      if (!duel) {
        console.error('❌ Duelo no encontrado para verificar completitud');
        return;
      }
      
      // Obtener todas las respuestas del duelo
      const responses = await prisma.duelresponse.findMany({
        where: { duelid: duelId }
      });
      
      console.log(`📊 Respuestas encontradas: ${responses.length}`);
      
      // Verificar si tenemos respuestas para todas las preguntas
      const totalQuestions = duel.questionscount;
      const questionsAnswered = new Set(responses.map(r => {
        // Extraer el número de pregunta del questionid (formato: "duel_${duelId}_q${number}")
        const match = r.questionid.match(/duel_.*_q(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }));
      
      console.log(`🎯 Preguntas respondidas: ${questionsAnswered.size}/${totalQuestions}`);
      
      // Para cada pregunta, verificar si ambos participantes han respondido
      for (let questionNumber = 1; questionNumber <= totalQuestions; questionNumber++) {
        const questionResponses = responses.filter(r => r.questionid === `duel_${duelId}_q${questionNumber}`);
        
        // Verificar si es duelo contra IA (solo necesita 1 respuesta humana)
        const challenger = await prisma.telegramuser.findUnique({
          where: { id: duel.challengerid }
        });
        
        const challenged = await prisma.telegramuser.findUnique({
          where: { id: duel.challengedid }
        });
        
        if (!challenger || !challenged) {
          console.error('❌ No se encontraron los participantes');
          continue;
        }
        
        const isSimulatedIA = (
          challenger.telegramuserid === '999999999' || 
          challenged.telegramuserid === '999999999'
        );
        
        const expectedResponses = isSimulatedIA ? 1 : 2;
        
        if (questionResponses.length >= expectedResponses) {
          console.log(`✅ Pregunta ${questionNumber} completada`);
          await this.handleBothParticipantsResponded(duelId, questionNumber);
        } else {
          console.log(`⏳ Pregunta ${questionNumber} pendiente (${questionResponses.length}/${expectedResponses})`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error verificando completitud del duelo:', error);
    }
  }
  
  /**
   * Manejar cuando ambos participantes han respondido una pregunta
   */
  static async handleBothParticipantsResponded(duelId: string, questionnumber: number): Promise<void> {
    try {
      console.log(`🎯 Procesando resultados de pregunta ${questionnumber} del duelo ${duelId}`);
      
      // Obtener duelo con datos completos
      const duel = await prisma.duel.findUnique({
        where: { id: duelId }
      });
      
      if (!duel) {
        console.error('❌ Error: duelo no encontrado');
        return;
      }
      
      // Obtener challenger y challenged por separado
      const challenger = await prisma.telegramuser.findUnique({
        where: { id: duel.challengerid }
      });
      
      const challenged = await prisma.telegramuser.findUnique({
        where: { id: duel.challengedid }
      });
      
      if (!challenger || !challenged) {
        console.error('❌ No se encontraron los participantes del duelo');
        return;
      }
      
      // Obtener respuestas para esta pregunta específica
      const responses = await prisma.duelresponse.findMany({
        where: { 
          duelid: duelId,
          questionid: `duel_${duelId}_q${questionnumber}`
        }
      });
      
      // Obtener preguntas del duelo
      const questions = await prisma.duelquestion.findMany({
        where: { duelid: duelId },
        orderBy: { order: 'asc' }
      });
      
      // 🤖 VERIFICAR SI ES DUELO CONTRA IA SIMULADA
      const isSimulatedIA = (
        challenger.telegramuserid === '999999999' || 
        challenged.telegramuserid === '999999999'
      );
      
      if (isSimulatedIA) {
        console.log('🤖 PROCESANDO DUELO CONTRA IA SIMULADA');
        
        // En duelos contra IA, solo necesitamos 1 respuesta humana
        if (responses.length < 1) {
          console.log('⏳ Esperando respuesta del participante humano...');
          return;
        }
        
        // Identificar participantes
        const humanParticipant = challenger.telegramuserid === '999999999' 
          ? challenged 
          : challenger;
        
        const iaParticipant = challenger.telegramuserid === '999999999' 
          ? challenger 
          : challenged;
        
        // Buscar respuesta humana
        const humanResponse = responses.find(r => r.userid === humanParticipant.id);
        
        if (!humanResponse) {
          console.log('⏳ Esperando respuesta del participante humano...');
          return;
        }
        
        // Buscar o crear respuesta de IA si no existe
        let iaResponse = responses.find(r => r.userid === iaParticipant.id);
        
        if (!iaResponse) {
          console.log('🤖 Generando respuesta automática de IA...');
          
          // Buscar usuario IA
          const iaUser = await prisma.telegramuser.findFirst({
            where: { telegramuserid: iaParticipant.telegramuserid }
          });
          
          if (iaUser) {
            // IA responde aleatoriamente (40% de acierto)
            const iaCorrect = Math.random() < 0.4;
            
            // Necesitamos obtener los datos de la pregunta para saber las opciones
            const pollMapping = await prisma.telegrampoll.findFirst({
              where: { questionid: `duel_${duelId}_q${questionnumber}` }
            });
            
            let iaResponseOption = 0;
            if (pollMapping && pollMapping.options) {
              let optionsArray: string[] = [];
              try {
                optionsArray = typeof pollMapping.options === 'string' 
                  ? cleanMalformedOptionsJSON(pollMapping.options) 
                  : pollMapping.options;
              } catch (e) {
                console.error('Error parsing options:', e);
                optionsArray = ['A', 'B', 'C', 'D']; // fallback
              }
              
              iaResponseOption = iaCorrect ? pollMapping.correctanswerindex : 
                (pollMapping.correctanswerindex + 1) % optionsArray.length;
            }
            
            // Crear respuesta simulada de IA
            iaResponse = await prisma.duelresponse.create({
              data: {
                id: `response-${duelId}-${questionnumber}-${iaUser.id}-${Date.now()}`,
                duelid: duelId,
                userid: iaUser.id,
                questionid: `duel_${duelId}_q${questionnumber}`,
                selectedoption: iaResponseOption,
                iscorrect: iaCorrect,
                points: iaCorrect ? 10 : 0,
                responsetime: Math.floor(Math.random() * 15000) + 5000
              }
            });
            
            console.log(`🤖 IA responde opción ${iaResponseOption} (${iaCorrect ? 'correcta' : 'incorrecta'})`);
          }
        }
        
        if (!iaResponse) {
          console.error('❌ No se pudo crear respuesta de IA');
          return;
        }
        
        // Enviar resultado solo al participante humano
        const resultMessage = `⚔️ RESULTADO PREGUNTA ${questionnumber}\n\n` +
          `Tu respuesta: ${humanResponse.iscorrect ? '✅ Correcta' : '❌ Incorrecta'} (${humanResponse.points} pts)\n` +
          `${iaParticipant.firstname}: ${iaResponse.iscorrect ? '✅ Correcta' : '❌ Incorrecta'} (${iaResponse.points} pts)\n\n` +
          `📊 Continúa el duelo...`;
        
        await this.sendPrivateMessage(
          humanParticipant.telegramuserid,
          resultMessage
        );
        
        console.log('📊 Resultado enviado al participante humano');
        
      } else {
        console.log('👥 PROCESANDO DUELO ENTRE HUMANOS');
        
        // En duelos humanos, necesitamos exactamente 2 respuestas
        if (responses.length !== 2) {
          console.log(`⏳ Esperando más respuestas (${responses.length}/2)...`);
          return;
        }
        
        // Enviar resultados a ambos participantes humanos
        for (const response of responses) {
          const otherResponse = responses.find(r => r.userid !== response.userid);
          
          // Obtener datos del otro usuario
          const otherUser = await prisma.telegramuser.findUnique({
            where: { id: otherResponse?.userid || '' }
          });
          
          // Obtener datos del usuario actual
          const currentUser = await prisma.telegramuser.findUnique({
            where: { id: response.userid }
          });
          
          if (!currentUser) continue;
          
          const resultMessage = `⚔️ RESULTADO PREGUNTA ${questionnumber}\n\n` +
            `Tu respuesta: ${response.iscorrect ? '✅ Correcta' : '❌ Incorrecta'} (${response.points} pts)\n` +
            `${otherUser?.firstname || 'Oponente'}: ${otherResponse?.iscorrect ? '✅ Correcta' : '❌ Incorrecta'} (${otherResponse?.points || 0} pts)\n\n` +
            `📊 Estado actual del duelo se actualizará pronto...`;
          
          await this.sendPrivateMessage(
            currentUser.telegramuserid,
            resultMessage
          );
        }
        
        console.log('📊 Resultados enviados a ambos participantes humanos');
      }
      
      // Verificar si el duelo ha terminado
      const totalQuestions = duel.questionscount;
      
      if (questionnumber >= totalQuestions) {
        console.log('🏆 DUELO COMPLETADO - Calculando ganador...');
        await this.finalizeDuel(duelId);
      } else {
        console.log(`📤 Enviando siguiente pregunta ${questionnumber + 1}/${totalQuestions}`);
        
        // 🔧 ARREGLO PRINCIPAL: Usar las preguntas pre-seleccionadas del duelo
        const nextQuestionOrder = questionnumber + 1;
        const nextDuelQuestion = questions.find(q => q.order === nextQuestionOrder);
        
        if (!nextDuelQuestion) {
          console.error(`❌ No se encontró la pregunta ${nextQuestionOrder} pre-seleccionada para este duelo`);
          return;
        }
        
        console.log(`🎯 Usando pregunta pre-seleccionada: ${nextDuelQuestion.questionid}`);
        
        // Obtener los datos completos de la pregunta desde la base de datos
        let questionData: DuelQuestion | null = null;
        
        // Intentar encontrar en Question primero
        const documentQuestion = await prisma.question.findUnique({
          where: { id: nextDuelQuestion.questionid }
        });
        
        if (documentQuestion) {
          try {
            const parsedQuestion = parseGiftQuestion(documentQuestion.content);
            if (parsedQuestion.enunciado && 
                parsedQuestion.opciones && 
                parsedQuestion.opciones.length >= 2 &&
                parsedQuestion.opciones.some(opt => opt.iscorrect)) {
              
              const correctIndex = parsedQuestion.opciones.findIndex(opt => opt.iscorrect);
              
              questionData = {
                id: documentQuestion.id,
                questionText: parsedQuestion.enunciado,
                options: parsedQuestion.opciones.map(opt => opt.text),
                correctanswerindex: correctIndex,
                sourcemodel: 'document'
              };
            }
          } catch (parseError) {
            console.warn(`⚠️ Error parseando pregunta document ${documentQuestion.id}:`, parseError);
          }
        }
        
        // Si no está en Question, buscar en SectionQuestion
        if (!questionData) {
          const sectionQuestion = await prisma.sectionquestion.findUnique({
            where: { id: nextDuelQuestion.questionid }
          });
          
          if (sectionQuestion) {
            try {
              const parsedQuestion = parseGiftQuestion(sectionQuestion.content);
              if (parsedQuestion.enunciado && 
                  parsedQuestion.opciones && 
                  parsedQuestion.opciones.length >= 2 &&
                  parsedQuestion.opciones.some(opt => opt.iscorrect)) {
                
                const correctIndex = parsedQuestion.opciones.findIndex(opt => opt.iscorrect);
                
                questionData = {
                  id: sectionQuestion.id,
                  questionText: parsedQuestion.enunciado,
                  options: parsedQuestion.opciones.map(opt => opt.text),
                  correctanswerindex: correctIndex,
                  sourcemodel: 'section'
                };
              }
            } catch (parseError) {
              console.warn(`⚠️ Error parseando pregunta section ${sectionQuestion.id}:`, parseError);
            }
          }
        }
        
        if (!questionData) {
          console.error(`❌ No se pudieron obtener los datos de la pregunta ${nextDuelQuestion.questionid}`);
          return;
        }
        
        // Enviar la siguiente pregunta usando los datos pre-seleccionados
        await this.sendDuelQuestion(duelId, nextQuestionOrder, questionData);
      }
      
    } catch (error) {
      console.error('❌ Error manejando respuestas completas:', error);
    }
  }
  
  /**
   * Finalizar duelo y determinar ganador
   */
  static async finalizeDuel(duelId: string): Promise<void> {
    try {
      console.log('🏆 Finalizando duelo:', duelId);
      
      // Obtener duelo
      const duel = await prisma.duel.findUnique({
        where: { id: duelId }
      });
      
      if (!duel) {
        console.error('❌ Duelo no encontrado para finalizar');
        return;
      }
      
      // Obtener challenger y challenged por separado
      const challenger = await prisma.telegramuser.findUnique({
        where: { id: duel.challengerid }
      });
      
      const challenged = await prisma.telegramuser.findUnique({
        where: { id: duel.challengedid }
      });
      
      if (!challenger || !challenged) {
        console.error('❌ No se encontraron los participantes del duelo');
        return;
      }
      
      // Obtener todas las respuestas del duelo
      const responses = await prisma.duelresponse.findMany({
        where: { duelid: duelId }
      });
      
      // Calcular puntos totales por participante
      const challengerResponses = responses.filter(r => r.userid === duel.challengerid);
      const challengedResponses = responses.filter(r => r.userid === duel.challengedid);
      
      const challengerPoints = challengerResponses.reduce((sum, r) => sum + (r.points || 0), 0);
      const challengedPoints = challengedResponses.reduce((sum, r) => sum + (r.points || 0), 0);
      
      console.log('📊 PUNTUACIONES FINALES:');
      console.log(`   🗡️ ${challenger.firstname || challenger.username || 'Usuario'}: ${challengerPoints} puntos`);
      console.log(`   🛡️ ${challenged.firstname || challenged.username || 'Usuario'}: ${challengedPoints} puntos`);
      
      // Determinar ganador
      let winnerId: string | null = null;
      let winnerName: string = '';
      let loserName: string = '';
      let resultStatus: string;
      
      if (challengerPoints > challengedPoints) {
        winnerId = duel.challengerid;
        winnerName = challenger.firstname || challenger.username || 'Usuario';
        loserName = challenged.firstname || challenged.username || 'Usuario';
        resultStatus = 'challenger_win';
      } else if (challengedPoints > challengerPoints) {
        winnerId = duel.challengedid;
        winnerName = challenged.firstname || challenged.username || 'Usuario';
        loserName = challenger.firstname || challenger.username || 'Usuario';
        resultStatus = 'challenged_win';
      } else {
        resultStatus = 'tie';
        winnerName = '';
        loserName = '';
      }
      
      // Actualizar duelo
      await prisma.duel.update({
        where: { id: duelId },
        data: {
          status: 'completed',
          winnerid: winnerId,
          result: resultStatus,
          completedat: new Date()
        }
      });
      
      // Aplicar transferencia de puntos
      if (resultStatus !== 'tie' && winnerId) {
        await prisma.telegramuser.update({
          where: { id: winnerId },
          data: { totalpoints: { increment: duel.stake } }
        });
        
        const loserId = winnerId === duel.challengerid ? duel.challengedid : duel.challengerid;
        await prisma.telegramuser.update({
          where: { id: loserId },
          data: { totalpoints: { decrement: duel.stake } }
        });
        
        console.log(`💰 Transferidos ${duel.stake} puntos de ${loserName} a ${winnerName}`);
      }
      
      // Enviar resultados finales solo por privado (anti-spam)
      const challengerName = challenger.firstname || challenger.username || 'Usuario';
      const challengedName = challenged.firstname || challenged.username || 'Usuario';
      
      const finalMessage = resultStatus === 'tie' 
        ? `🤝 DUELO EMPATADO\n\n${challengerName}: ${challengerPoints} pts\n${challengedName}: ${challengedPoints} pts\n\n¡Ningún punto fue transferido!`
        : `🏆 GANADOR: ${winnerName}\n\n${challengerName}: ${challengerPoints} pts\n${challengedName}: ${challengedPoints} pts\n\n💰 ${winnerName} gana ${duel.stake} puntos!\n\n¡Felicidades por el duelo!`;
      
      // Enviar solo a ambos participantes por privado (consistente con envío de preguntas)
      await this.sendPrivateMessage(challenger.telegramuserid, 
        `🏆 DUELO FINALIZADO\n\n${challengerName} vs ${challengedName}\n\n${finalMessage}`);
      await this.sendPrivateMessage(challenged.telegramuserid, 
        `🏆 DUELO FINALIZADO\n\n${challengerName} vs ${challengedName}\n\n${finalMessage}`);
      
      console.log('✅ Duelo finalizado exitosamente (solo notificaciones privadas)');
      
    } catch (error) {
      console.error('❌ Error finalizando duelo:', error);
    }
  }
  
  /**
   * Enviar mensaje privado a usuario
   */
  static async sendPrivateMessage(telegramuserid: string, message: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramuserid,
          text: message,
          parse_mode: 'HTML'
        })
      });
      
      const result = await response.json() as any;
      return result.ok;
      
    } catch (error) {
      console.error('❌ Error enviando mensaje privado:', error);
      return false;
    }
  }
  
  /**
   * Enviar mensaje al grupo
   */
  static async sendGroupMessage(message: string): Promise<boolean> {
    try {
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
      return result.ok;
      
    } catch (error) {
      console.error('❌ Error enviando mensaje al grupo:', error);
      return false;
    }
  }
  
  static async updateDuelStatus(duelId: string, status: string): Promise<boolean> {
    try {
      await prisma.duel.update({
        where: { id: duelId },
        data: { status }
      });
      return true;
    } catch (error) {
      console.error('Error actualizando estado del duelo:', error);
      return false;
    }
  }
}