import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GamificationService } from '@/services/gamificationService';
import { ExamRankingService } from '@/services/examRankingService';
import { DuelService } from '@/services/duelService';
import { NotificationService } from '@/services/notificationService';
import { Examen2024Service } from '@/services/examen2024Service';
import { SimulacroService } from '@/services/simulacroService';
import { Simulacro2024Service } from '@/services/simulacro2024Service';
import { DuelManager } from '@/services/duelManager';
import { tournamentService } from '@/services/tournamentService';
import { StudySessionService } from '@/services/studySessionService';
import { StudyCommandHandler } from '@/services/studyCommandHandler';
import { PaymentService } from '@/services/paymentServiceRedsys';
import { SubscriptionCommandsSimple } from '@/services/subscriptionCommandsSimple';
import { SubscriptionService } from '@/services/subscriptionService';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

// Instancia del servicio de sesiones de estudio
const studySessionService = new StudySessionService();

// Inicializar sistema de torneos automáticamente
let tournamentSystemInitialized = false;

// ============ INTERFACES ============

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    reply_to_message?: {
      message_id: number;
      date?: number;
      text?: string;
    };
    new_chat_members?: Array<{
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    }>;
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      shipping_option_id?: string;
      order_info?: any;
      telegram_payment_charge_id: string;
      provider_payment_charge_id: string;
    };
  };
  poll_answer?: {
    poll_id: string;
    user: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    option_ids: number[];
  };
  pre_checkout_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    currency: string;
    total_amount: number;
    invoice_payload: string;
    shipping_option_id?: string;
    order_info?: any;
  };
}

// ============ UTILITY FUNCTIONS ============

async function initializeTournamentSystem() {
  if (!tournamentSystemInitialized) {
    console.log('🏆 Inicializando sistema de torneos integrado...');
    await tournamentService.ensureTournamentManagerRunning();
    tournamentSystemInitialized = true;
    console.log('✅ Sistema de torneos integrado iniciado');
  }
}

function extractQuestionId(text: string): string | null {
  const patterns = [
    /ID:\s*([a-zA-Z0-9-]+)/i,
    /#([a-zA-Z0-9-]+)/,
    /Pregunta\s+([a-zA-Z0-9-]+)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function extractRankingType(text: string): 'general' | 'semanal' | 'mensual' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('semanal') || lowerText.includes('semana')) {
    return 'semanal';
  } else if (lowerText.includes('mensual') || lowerText.includes('mes')) {
    return 'mensual';
  } else {
    return 'general';
  }
}

function checkAnswer(userAnswer: string, correctAnswers: string[]): boolean {
  const normalizedUserAnswer = userAnswer.toLowerCase().trim();
  
  return correctAnswers.some(answer => 
    answer.toLowerCase().trim() === normalizedUserAnswer
  );
}

function calculateResponseTime(questionTime: number, responsetime: number): number {
  return Math.max(0, responsetime - questionTime);
}

async function sendTelegramMessage(chatid: number | string, message: string): Promise<boolean> {
  try {
    console.log('Enviando mensaje a Telegram:', { chatid, messageLength: message.length });
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatid,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    const result = await response.json();
    
    console.log('Respuesta de Telegram API:', result);
    
    if (!result.ok) {
      console.error('Error enviando mensaje a Telegram:', result.description);
      
      const fallbackResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatid,
          text: message.replace(/<[^>]*>/g, '')
        }),
      });
      
      const fallbackResult = await fallbackResponse.json();
      console.log('Respuesta fallback:', fallbackResult);
      
      return fallbackResult.ok;
    }

    console.log('✅ Mensaje enviado exitosamente a Telegram');
    return true;
  } catch (error) {
    console.error('❌ Error en sendTelegramMessage:', error);
    return false;
  }
}

function calculatePointsEarned(iscorrect: boolean, responsetime?: number): number {
  const basePoints = iscorrect ? 10 : -2;
  
  let bonusPoints = 0;

  if (responsetime && responsetime < 30) {
    bonusPoints += 5;
  }

  if (responsetime && responsetime < 10) {
    bonusPoints += 5;
  }

  return basePoints + bonusPoints;
}

function generateImmediateFeedback(
  userStats: any, 
  iscorrect: boolean, 
  pointsEarned: number, 
  responsetime?: number
): string {
  const timestamp = new Date().toLocaleTimeString('es-ES');
  const correctIcon = iscorrect ? '✅' : '❌';
  const resultText = iscorrect ? '¡Correcto!' : 'Incorrecto';
  
  let message = `${correctIcon} <b>${resultText}</b>\n`;
  
  if (pointsEarned >= 0) {
    message += `🎯 <b>+${pointsEarned} puntos</b> ganados\n`;
  } else {
    message += `📉 <b>${pointsEarned} puntos</b> (puntos reales calculados con protecciones)\n`;
  }
  
  if (responsetime) {
    message += `⏱️ Tiempo: ${responsetime}s`;
    if (responsetime < 10) {
      message += ' ⚡ ¡Súper rápido!';
    } else if (responsetime < 30) {
      message += ' 🚀 ¡Rápido!';
    }
    message += '\n';
  }
  
  message += `\n📊 <b>Estado actual:</b>\n`;
  message += `• Total: <b>${userStats.totalpoints}</b> puntos\n`;
  message += `• Nivel: <b>${userStats.level}</b>\n`;
  message += `• Ranking: <b>#${userStats.rank}</b>\n`;
  message += `• Racha: <b>${userStats.streak}</b> días\n`;
  message += `• Precisión: <b>${userStats.accuracy}%</b>\n`;
  message += `\n🕐 Actualizado: ${timestamp}`;
  
  return message;
}

function createBotInterface(chatid: number) {
  return {
    async sendMessage(targetChatId: number, text: string, options?: any): Promise<any> {
      return await sendTelegramMessage(targetChatId, text);
    },
    async sendInvoice(targetChatId: number, invoiceData: any): Promise<any> {
      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            ...invoiceData
          })
        });
        
        const result = await response.json();
        console.log('📧 Invoice enviada:', result.ok ? '✅ Exitoso' : '❌ Falló');
        return result;
      } catch (error) {
        console.error('❌ Error enviando invoice:', error);
        throw error;
      }
    }
  };
}

function formatResponseMessage(stats: any, iscorrect: boolean): string {
  const correctEmoji = iscorrect ? '✅' : '❌';
  const levelEmoji = getLevelEmoji(stats.level);
  
  return `${correctEmoji} ${iscorrect ? 'Correcto' : 'Incorrecto'}!

🏆 <b>Tus estadísticas:</b>
📊 Puntos: ${stats.totalpoints}
${levelEmoji} Nivel: ${stats.level}
🔥 Racha: ${stats.streak} días
🎯 Precisión: ${stats.accuracy}%
📈 Ranking: #${stats.rank}

${getMotivationalMessage(stats, iscorrect)}`;
}

function getLevelEmoji(level: number): string {
  if (level <= 2) return '🥉';
  if (level <= 5) return '🥈';
  if (level <= 10) return '🥇';
  return '💎';
}

function getMotivationalMessage(stats: any, iscorrect: boolean): string {
  const messages = {
    correct: [
      '¡Excelente trabajo! 🎉',
      '¡Sigue así! 💪',
      '¡Imparable! ⚡',
      '¡Genial! 🌟'
    ],
    incorrect: [
      '¡No te rindas! La próxima será mejor 💪',
      '¡Cada error es una oportunidad de aprender! 📚',
      '¡Sigue intentando! 🎯',
      '¡La práctica hace al maestro! ⭐'
    ]
  };

  const messageArray = iscorrect ? messages.correct : messages.incorrect;
  return messageArray[Math.floor(Math.random() * messageArray.length)];
}

// ============ POLL ANSWER HANDLER ============

async function handlePollAnswer(pollAnswer: any) {
  const userid = pollAnswer.user.id.toString();
  const pollid = pollAnswer.poll_id;
  const selectedOptions = pollAnswer.option_ids;

  console.log('🗳️ Poll Answer Processing:', {
    userid,
    pollid,
    selectedOptions,
    user: pollAnswer.user
  });

  try {
    // Buscar pregunta por poll ID
    const questionData = await findQuestionByPollId(pollid);
    
    if (!questionData) {
      console.log('❌ Pregunta no encontrada para poll ID:', pollid);
      return NextResponse.json({ ok: true, message: 'Pregunta no encontrada' });
    }

    console.log('📋 Pregunta encontrada:', {
      questionid: questionData.questionid,
      table: questionData.sourcemodel,
      correctAnswer: questionData.correctanswerindex
    });

    // Verificar respuesta
    const iscorrect = selectedOptions.includes(questionData.correctanswerindex);
    const responsetime = Math.floor((Date.now() - new Date(questionData.createdAt).getTime()) / 1000);

    console.log('🎯 Respuesta procesada:', {
      iscorrect,
      responsetime,
      selectedOptions,
      correctanswerindex: questionData.correctanswerindex
    });

    // Procesar respuesta con gamificación
    const userStats = await GamificationService.processUserResponse({
      telegramuserid: userid,
      username: pollAnswer.user.username,
      firstName: pollAnswer.user.first_name,
      lastName: pollAnswer.user.last_name,
      questionid: questionData.questionid,
      telegramMsgId: pollid,
      iscorrect: iscorrect,
      responsetime: responsetime
    });

    console.log('📊 Stats actualizados:', userStats);

    // Envío inteligente de respuesta
    const notificationResult = await NotificationService.sendIntelligentQuizResponse(
      userStats,
      iscorrect,
      questionData,
      {
        telegramuserid: userid,
        firstName: pollAnswer.user.first_name,
        username: pollAnswer.user.username
      },
      questionData.chatid.toString()
    );

    console.log('📤 Respuesta enviada:', notificationResult.method, '|', notificationResult.message);

    return NextResponse.json({ 
      ok: true, 
      processed: true,
      iscorrect,
      userStats: {
        totalpoints: userStats.totalpoints,
        level: userStats.level,
        rank: userStats.rank
      }
    });

  } catch (error) {
    console.error('❌ Error procesando poll answer:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Error procesando respuesta' 
    }, { status: 500 });
  }
}

// ============ NEW CHAT MEMBERS HANDLER ============

async function handleNewChatMembers(message: any): Promise<NextResponse> {
  console.log('👋 Nuevos miembros detectados:', message.new_chat_members.length);
  
  try {
    for (const newMember of message.new_chat_members) {
      if (newMember.is_bot) {
        console.log('🤖 Miembro bot ignorado:', newMember.first_name);
        continue;
      }

      console.log('👤 Procesando nuevo miembro:', {
        id: newMember.id,
        firstname: newMember.first_name,
        username: newMember.username
      });

      // Verificar si el usuario ya existe
      const existingUser = await prisma.telegramuser.findUnique({
        where: { telegramuserid: newMember.id.toString() }
      });

      if (!existingUser) {
        // Crear nuevo usuario
        await prisma.telegramuser.create({
          data: {
            id: `telegram_${newMember.id}_${Date.now()}`, // ID único
            telegramuserid: newMember.id.toString(),
            username: newMember.username,
            firstname: newMember.first_name,
            lastname: newMember.last_name,
            totalpoints: 25, // Puntos iniciales
            lastactivity: new Date()
          }
        });
        
        console.log('✅ Nuevo usuario creado con puntos iniciales');
      }

      // Mensaje de bienvenida
      const welcomeMessage = `🎉 ¡Bienvenido/a @${newMember.username || newMember.first_name}!

🎯 Te has unido al grupo de OPOMELILLA
🎁 Has recibido 25 puntos de bienvenida
📚 ¡Ya puedes empezar a responder preguntas!

💡 Usa /start en privado para configurar tu cuenta`;

      await sendTelegramMessage(message.chat.id, welcomeMessage);
    }

    return NextResponse.json({ ok: true, message: 'Nuevos miembros procesados' });
    
  } catch (error) {
    console.error('❌ Error procesando nuevos miembros:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Error procesando nuevos miembros' 
    }, { status: 500 });
  }
}

// ============ PLACEHOLDER FUNCTIONS (TO BE IMPLEMENTED) ============

async function findQuestionByPollId(pollid: string): Promise<{
  questionid: string;
  sourcemodel: string;
  correctanswerindex: number;
  createdAt: Date;
  chatid: number;
} | null> {
  // This function needs to be implemented based on your database structure
  // For now, returning null to prevent compilation errors
  return null;
}

export async function handleBotCommands(message: any): Promise<string | null> {
  const text = message.text?.toLowerCase().trim();
  const originalText = message.text?.trim(); // Mantener texto original para comandos case-sensitive
  
  if (!text || !text.startsWith('/')) {
    return null;
  }

  const userid = message.from?.id?.toString();
  if (!userid) {
    return '❌ No se pudo identificar el usuario.';
  }

  try {
    // ============ COMANDOS BÁSICOS ============
    if (text === '/start') {
      // Registrar usuario si no existe
      await prisma.telegramuser.upsert({
        where: { id: userid },
        update: {
          firstname: message.from.first_name || '',
          lastname: message.from.last_name || '',
          username: message.from.username || ''
        },
        create: {
          id: userid,
          firstname: message.from.first_name || '',
          lastname: message.from.last_name || '',
          username: message.from.username || '',
          createdat: new Date()
        }
      });
      
      return `🎉 ¡Bienvenido a Permanencia OPOMELILLA! 

📚 **SESIONES DE ESTUDIO PRIVADAS**
• /pdc2 - 2 preguntas de PDC
• /constitucion10 - 10 preguntas de Constitución
• /aleatorias5 - 5 preguntas aleatorias
• /falladas - Repasar preguntas falladas

💰 **SUSCRIPCIONES**
• /planes - Ver planes disponibles
• /premium - Suscribirse al plan premium
• /basico - Suscribirse al plan básico

📊 **ESTADÍSTICAS**
• /stats - Mis estadísticas
• /ranking - Ver ranking

❓ /help - Ver todos los comandos`;
    }

    if (text === '/help') {
      return `📋 <b>COMANDOS DISPONIBLES:</b>

🎓 <b>SESIONES DE ESTUDIO:</b>
/pdc[X] - Preguntas de PDC
/constitucion[X] - Constitución
/defensanacional[X] - Defensa Nacional
/rjsp[X] o /rio[X] - RJP
/et[X] - Ejército de Tierra
/armada[X] - Armada
/aire[X] - Ejército del Aire
/aleatorias[X] - Preguntas aleatorias
/falladas[X] - Preguntas falladas

💰 <b>SUSCRIPCIONES:</b>
/planes - Ver planes
/premium - Plan premium
/basico - Plan básico
/mi_plan - Ver mi suscripción

📊 <b>ESTADÍSTICAS:</b>
/stats - Mis estadísticas
/ranking - Ver ranking

🛠️ <b>GESTIÓN:</b>
/stop - Cancelar sesión
/progreso - Ver progreso

<i>Ejemplo: /pdc2 para 2 preguntas de PDC</i>`;
    }

    // ============ COMANDOS DE SUSCRIPCIÓN ============
    if (text === '/planes') {
      return await SubscriptionCommandsSimple.handlePlanesCommand(message, createBotInterface(message.chat.id));
    }

    if (text === '/premium') {
      await SubscriptionCommandsSimple.handlePremiumCommand(message, createBotInterface(message.chat.id));
      return 'INTELLIGENT_SYSTEM_HANDLED'; // Indica que el sistema inteligente ya manejó la respuesta
    }

    if (text === '/basico') {
      await SubscriptionCommandsSimple.handleBasicoCommand(message, createBotInterface(message.chat.id));
      return 'INTELLIGENT_SYSTEM_HANDLED';
    }

    if (text === '/mi_plan') {
      const subscription = await SubscriptionService.getUserSubscription(userid);
      if (subscription) {
        const plan = subscription.plan;
        return `📋 <b>TU SUSCRIPCIÓN ACTUAL</b>\n\n` +
               `🎯 Plan: <b>${plan.displayname}</b>\n` +
               `💰 Precio: <b>€${plan.price}/mes</b>\n` +
               `📅 Activa desde: ${subscription.createdat.toLocaleDateString()}\n` +
               `📊 Estado: <b>${subscription.isactive ? '✅ Activa' : '❌ Inactiva'}</b>\n\n` +
               `🎓 Límite diario: ${plan.dailyquestionslimit || 'Ilimitado'} preguntas\n` +
               `📈 Estadísticas avanzadas: ${plan.canuseadvancedstats ? '✅' : '❌'}\n` +
               `🎯 Simulacros: ${plan.canusesimulations ? '✅' : '❌'}\n` +
               `🤖 Análisis IA: ${plan.canuseaianalysis ? '✅' : '❌'}`;
      } else {
        return `❌ <b>No tienes suscripción activa</b>\n\n` +
               `💡 Usa /planes para ver los planes disponibles\n` +
               `🎯 Usa /premium o /basico para suscribirte`;
      }
    }

    // ============ COMANDOS DE SESIONES DE ESTUDIO ============
    // Importar StudyCommandHandler dinámicamente para evitar dependencias circulares
    const { StudyCommandHandler } = await import('@/services/studyCommandHandler');
    
    if (StudyCommandHandler.isStudyCommand(originalText)) {
      const result = await StudyCommandHandler.handleStudyCommand(originalText, userid);
      return result.message;
    }

    if (text === '/stop') {
      const result = await StudyCommandHandler.handleStopCommand(userid);
      return result.message;
    }

    if (text === '/progreso') {
      const result = await StudyCommandHandler.handleProgressCommand(userid);
      return result.message;
    }

    // ============ COMANDOS DE ESTADÍSTICAS ============
    if (text === '/stats') {
      const userStats = await GamificationService.getUserStats(userid);
      if (userStats) {
        return `📊 <b>TUS ESTADÍSTICAS</b>\n\n` +
               `🎯 Preguntas respondidas: <b>${userStats.totalanswered}</b>\n` +
               `✅ Respuestas correctas: <b>${userStats.totalcorrect}</b>\n` +
               `📈 Porcentaje de aciertos: <b>${userStats.accuracypercentage}%</b>\n` +
               `🔥 Racha actual: <b>${userStats.currentstreak}</b>\n` +
               `🏆 Mejor racha: <b>${userStats.beststreak}</b>\n` +
               `⭐ Puntos totales: <b>${userStats.totalpoints}</b>\n` +
               `📊 Nivel: <b>${userStats.level}</b> ${getLevelEmoji(userStats.level)}`;
      } else {
        return '❌ No se encontraron estadísticas. ¡Responde algunas preguntas primero!';
      }
    }

    if (text === '/ranking') {
      const ranking = await ExamRankingService.getGeneralRanking(10);
      let response = '🏆 <b>RANKING GENERAL</b>\n\n';
      
      ranking.forEach((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        response += `${medal} ${user.firstname} - ${user.totalpoints} pts\n`;
      });
      
      return response;
    }

    // ============ COMANDOS NO RECONOCIDOS ============
    return `❓ Comando no reconocido: ${originalText}\n\n💡 Usa /help para ver todos los comandos disponibles.`;

  } catch (error) {
    console.error('Error en handleBotCommands:', error);
    return '❌ Error procesando comando. Inténtalo de nuevo.';
  }
}

// ============ MAIN HANDLERS ============

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Telegram webhook endpoint is working!',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    
    // Inicializar sistema de torneos
    initializeTournamentSystem();
    
    // FILTRAR HEALTH CHECKS
    if (update && typeof update === 'object' && 'test' in update && (update as any).test === 'health_check') {
      console.log(`💓 Health check: ${new Date().toLocaleTimeString()}`);
      return NextResponse.json({ status: 'ok', type: 'health_check' });
    }
    
    console.log('🔔 ============ WEBHOOK UPDATE RECIBIDO ============');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🆔 Update ID:', update.update_id);
    
    // MANEJAR PRE-CHECKOUT QUERIES
    if (update.pre_checkout_query) {
      console.log('💳 ======== PRE-CHECKOUT QUERY DETECTADO ========');
      const preCheckout = update.pre_checkout_query;
      
      const isValid = await PaymentService.validatePreCheckout({
        id: preCheckout.id,
        from: preCheckout.from,
        currency: preCheckout.currency,
        total_amount: preCheckout.total_amount,
        invoice_payload: preCheckout.invoice_payload,
        shipping_option_id: preCheckout.shipping_option_id,
        order_info: preCheckout.order_info
      });

      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pre_checkout_query_id: preCheckout.id,
            ok: isValid,
            error_message: isValid ? undefined : 'Error validando el pago. Inténtalo de nuevo.'
          })
        });
        
        console.log('📤 Pre-checkout query respondido:', isValid ? '✅ Aprobado' : '❌ Rechazado');
      } catch (error) {
        console.error('❌ Error respondiendo pre-checkout query:', error);
      }

      return NextResponse.json({ ok: true, preCheckoutHandled: isValid });
    }

    // MANEJAR POLL ANSWERS
    if (update.poll_answer) {
      console.log('🗳️  ======== POLL ANSWER DETECTADO ========');
      
      // Intentar manejar con sistema de torneos primero
      const handledByTournament = await tournamentService.handleTournamentPollAnswer(update.poll_answer);
      
      if (handledByTournament) {
        console.log('🏆 Poll answer manejado por sistema de torneos');
        return NextResponse.json({ ok: true, handledBy: 'tournament' });
      }
      
      console.log('📋 Poll answer manejado por sistema normal');
      return await handlePollAnswer(update.poll_answer);
    }

    const message = update.message;
    
    if (!message) {
      console.log('ℹ️  Update ignorado: sin mensaje');
      return NextResponse.json({ ok: true });
    }

    // MANEJAR NUEVOS MIEMBROS
    if (message.new_chat_members && message.new_chat_members.length > 0) {
      console.log('👋 ======== NUEVOS MIEMBROS DETECTADOS ========');
      return await handleNewChatMembers(message);
    }

    // MANEJAR PAGOS EXITOSOS
    if (message.successful_payment) {
      console.log('💰 ======== PAGO EXITOSO DETECTADO ========');
      const payment = message.successful_payment;
      const userid = message.from.id.toString();
      
      const success = await PaymentService.processSuccessfulPayment(userid, {
        currency: payment.currency,
        total_amount: payment.total_amount,
        invoice_payload: payment.invoice_payload,
        shipping_option_id: payment.shipping_option_id,
        order_info: payment.order_info,
        telegram_payment_charge_id: payment.telegram_payment_charge_id,
        provider_payment_charge_id: payment.provider_payment_charge_id
      });

      if (success) {
        console.log('✅ Pago procesado exitosamente, suscripción activada');
        
        const payloadParts = payment.invoice_payload.split('_');
        const planName = payloadParts[1] || 'premium';
        const confirmationMessage = PaymentService.generatePaymentConfirmation(planName, payment.total_amount);

        await sendTelegramMessage(message.chat.id, confirmationMessage);
      } else {
        console.log('❌ Error procesando pago exitoso');
        await sendTelegramMessage(message.chat.id, 
          '❌ Hubo un problema procesando tu pago. Contacta con soporte: @Carlos_esp'
        );
      }

      return NextResponse.json({ ok: true, paymentProcessed: success });
    }
    
    const user = message.from;
    
    // FILTRAR MENSAJES DEL BOT
    if (user.is_bot) {
      console.log('🤖 Ignorando mensaje del bot:', user.first_name);
      return NextResponse.json({ ok: true, message: 'Mensaje del bot ignorado' });
    }
    
    console.log('💬 ======== MENSAJE RECIBIDO ========');

    // Manejar comandos del bot
    const commandResponse = await handleBotCommands(message);
    
    if (commandResponse === 'INTELLIGENT_SYSTEM_HANDLED') {
      return NextResponse.json({ 
        ok: true, 
        type: 'command_handled',
        command: message.text,
        responseSent: true,
        intelligentSystem: true
      });
    }
    
    if (commandResponse) {
      const sent = await sendTelegramMessage(message.chat.id, commandResponse);
      console.log('📤 Mensaje enviado:', sent ? '✅ Exitoso' : '❌ Falló');
      
      return NextResponse.json({ 
        ok: true, 
        type: 'command_handled',
        command: message.text,
        responseSent: sent,
        intelligentSystem: false
      });
    }

    // SISTEMA LEGACY para respuestas a preguntas
    if (!message.reply_to_message?.text) {
      console.log('ℹ️  Mensaje ignorado: no es comando ni respuesta a pregunta');
      return NextResponse.json({ ok: true, message: 'No es una respuesta a pregunta' });
    }

    const originalMessage = message.reply_to_message.text || '';
    const questionid = extractQuestionId(originalMessage);

    if (!questionid) {
      console.log('⚠️  No se pudo extraer ID de pregunta del mensaje original');
      return NextResponse.json({ ok: true });
    }

    const iscorrect = true; // TODO: Implementar verificación real
    const responsetime = calculateResponseTime(
      message.reply_to_message?.date || message.date,
      message.date
    );

    const userStats = await GamificationService.processUserResponse({
      telegramuserid: user.id.toString(),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      questionid: questionid,
      telegramMsgId: message.message_id.toString(),
      iscorrect: iscorrect,
      responsetime: responsetime
    });

    const tempQuestionData = {
      questionid: questionid,
      correctanswerindex: 0,
      createdAt: new Date(message.reply_to_message?.date || message.date),
      chatid: message.chat.id
    };
    
    const quizResult = await NotificationService.sendIntelligentQuizResponse(
      userStats,
      iscorrect,
      tempQuestionData,
      {
        telegramuserid: user.id.toString(),
        firstname: user.first_name,
        username: user.username
      },
      message.chat.id.toString()
    );
    
    console.log('📤 Resultado sistema inteligente quiz:', quizResult.method, '|', quizResult.message);

    return NextResponse.json({ 
      ok: true, 
      processed: true,
      userStats 
    });

  } catch (error) {
    console.error('❌ ============ ERROR EN WEBHOOK ============');
    console.error('💥 Error completo:', error);
    console.error('📊 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}