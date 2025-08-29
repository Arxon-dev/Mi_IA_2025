import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';
import { GamificationService } from '@/services/gamificationService';
import { ExamRankingService } from '@/services/examRankingService';
import { DuelService } from '@/services/duelService';
import { NotificationService } from '@/services/notificationService';
import { Examen2024Service } from '@/services/examen2024Service';
import { SimulacroService } from '@/services/simulacroService';
import { Simulacro2024Service } from '@/services/simulacro2024Service';
import { DuelManager } from '@/services/duelManager';
import { TournamentService } from '@/services/tournamentService';
import { StudySessionService } from '@/services/studySessionService';
import { PaymentService } from '@/services/paymentServiceRedsys';
import { SubscriptionCommandsSimple } from '@/services/subscriptionCommandsSimple';
import { SubscriptionCommands } from '@/services/subscriptionCommands';
import { cleanMalformedOptionsJSON } from '@/utils/optionsParser';
import { SubscriptionService } from '@/services/subscriptionService';
import { handleAnalisisAvanzado } from '../commands/analytics-advanced';
import { StudyCommandHandler } from '@/services/studyCommandHandler';
import { handlePayPalPayment } from './subscriptionCommands';
import { MilitarySimulationService } from '@/services/militarySimulationService';
import { v4 as uuidv4 } from 'uuid';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

// Función para generar IDs únicos
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Usando instancia centralizada de prisma

// Función para asegurar que prisma esté disponible
function ensurePrisma() {
  if (!prisma) {
    console.error('❌ Prisma instance is undefined, using centralized instance');
    const { prisma: centralizedPrisma } = require('@/lib/prisma');
    return centralizedPrisma;
  }
  return prisma;
}

// Instancia del servicio de sesiones de estudio
const studySessionService = new StudySessionService();

// 🏆 SISTEMA DE TORNEOS INTEGRADO - Paso 3 completado
// Using TypeScript tournament service to avoid webpack issues

// Inicializar sistema de torneos automáticamente
let tournamentSystemInitialized = false;

async function initializeTournamentSystem() {
  if (!tournamentSystemInitialized) {
    console.log('🏆 Inicializando sistema de torneos integrado...');
    await TournamentService.getInstance().ensureTournamentManagerRunning();
    tournamentSystemInitialized = true;
    console.log('✅ Sistema de torneos integrado iniciado');
  }
}

// 🪖 NOTA: Los sistemas militares se probarán con script independiente
// Para integración completa, se requiere configuración adicional de TypeScript

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
    // 🆕 NUEVO: Agregar detección de nuevos miembros
    new_chat_members?: Array<{
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    }>;
    // 💰 NUEVO: Agregar soporte para pagos exitosos
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
  // 💳 NUEVO: Agregar soporte para pre-checkout queries
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
  // 🔄 NUEVO: Agregar soporte para callback queries
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
      date: number;
    };
    data?: string;
  };
}

// Función para extraer el ID de la pregunta del mensaje original
function extractQuestionId(text: string): string | null {
  // Buscar patrones como "ID: 123" o "#123" en el texto
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

// Función para verificar si la respuesta es correcta
function checkAnswer(userAnswer: string, correctAnswers: string[]): boolean {
  const normalizedUserAnswer = userAnswer.toLowerCase().trim();
  
  return correctAnswers.some(answer => 
    answer.toLowerCase().trim() === normalizedUserAnswer
  );
}

// Función para calcular el tiempo de respuesta
function calculateResponseTime(questionTime: number, responsetime: number): number {
  return Math.max(0, responsetime - questionTime);
}

// Función para enviar mensajes a Telegram
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
        parse_mode: 'HTML'  // Cambiado de Markdown a HTML
      }),
    });

    const result = await response.json();
    
    console.log('Respuesta de Telegram API:', result);
    
    if (!result.ok) {
      console.error('Error enviando mensaje a Telegram:', result.description);
      
      // Intentar enviar sin formato si falla
      const fallbackResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatid,
          text: message.replace(/<[^>]*>/g, '') // Quitar HTML tags
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

// GET endpoint for testing
export async function GET() {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Telegram webhook endpoint is working!',
    timestamp: new Date().toISOString()
  }, { headers });
}

// ============ FUNCIONES AUXILIARES PARA FEEDBACK INMEDIATO ============

/**
 * Calcula los puntos ganados por una respuesta
 * NOTA: Esta función es solo para feedback inmediato.
 * El cálculo real se hace en gamificationService.ts con el sistema híbrido completo.
 */
function calculatePointsEarned(iscorrect: boolean, responsetime?: number): number {
  // Esta función es solo para mostrar feedback inmediato aproximado
  // El cálculo real con protecciones se hace en gamificationService.ts
  
  const basePoints = iscorrect ? 10 : -2; // Aproximación para feedback inmediato
  
  let bonusPoints = 0;

  // Bonus por velocidad (respuesta rápida < 30 segundos)
  if (responsetime && responsetime < 30) {
    bonusPoints += 5;
  }

  // Bonus extra por respuesta muy rápida (< 10 segundos)
  if (responsetime && responsetime < 10) {
    bonusPoints += 5;
  }

  return basePoints + bonusPoints;
}

/**
 * Genera mensaje de feedback inmediato para el usuario
 */
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
  
  // Mostrar puntos ganados/perdidos
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

// ============ INTERFAZ BOT PARA SUSCRIPCIONES ============

/**
 * Crear interfaz del bot para comandos de suscripción
 */
function createBotInterface(chatid: number) {
  return {
    async sendMessage(targetchatid: number, text: string, options?: any): Promise<any> {
      return await sendTelegramMessage(targetchatid, text);
    },
    async editMessageText(text: string, options?: any): Promise<any> {
      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            parse_mode: options?.parse_mode || 'HTML',
            ...options
          })
        });
        
        const result = await response.json();
        console.log('✏️ Mensaje editado:', result.ok ? '✅ Exitoso' : '❌ Falló');
        return result;
      } catch (error) {
        console.error('❌ Error editando mensaje:', error);
        throw error;
      }
    },
    async sendInvoice(targetchatid: number, invoiceData: any): Promise<any> {
      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetchatid,
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

// ============ FUNCIÓN PRINCIPAL ============

export async function POST(request: NextRequest) {
  // Headers para ngrok y CORS
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  try {
    const update: TelegramUpdate = await request.json();
    
    // 🏆 Inicializar sistema de torneos automáticamente al recibir cualquier update
    initializeTournamentSystem();
    
    // FILTRAR HEALTH CHECKS ANTES DE LOGGING COMPLETO
    if (update && typeof update === 'object' && 'test' in update && update.test === 'health_check') {
      // Log mínimo para health checks
      console.log(`💓 Health check: ${new Date().toLocaleTimeString()}`);
      return NextResponse.json({ status: 'ok', type: 'health_check' }, { headers });
    }
    
    // LOGGING COMPLETO SOLO PARA UPDATES IMPORTANTES
    console.log('🔔 ============ WEBHOOK UPDATE RECIBIDO ============');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🆔 Update ID:', update.update_id);
    console.log('📊 UPDATE COMPLETO (RAW JSON):', JSON.stringify(update, null, 2));
    console.log('📋 Tipo de update:', {
      hasMessage: !!update.message,
      hasPollAnswer: !!update.poll_answer,
      hasCallbackQuery: !!update.callback_query, // ✅ Agregar esta línea
      hasPreCheckout: !!update.pre_checkout_query,
      hasOther: !update.message && !update.poll_answer && !update.callback_query && !update.pre_checkout_query
    });
    
    // ✅ AGREGAR LOG ESPECÍFICO PARA CALLBACK_QUERY
    if (update.callback_query) {
      console.log('🔄 ======== CALLBACK QUERY DETECTADO ========');
      console.log('📋 Callback Query completo:', JSON.stringify(update.callback_query, null, 2));
    } else {
      console.log('❌ NO HAY CALLBACK_QUERY en este update');
    }
    
    // 💳 MANEJAR PAGOS DE TELEGRAM PRIMERO (PRE-CHECKOUT Y PAGOS EXITOSOS)
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

      // Responder a Telegram
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

      return NextResponse.json({ ok: true, preCheckoutHandled: isValid }, { headers });
    }

    // 🟦 MANEJAR CALLBACKS DE PAYPAL Y REDSYS
    if (update.callback_query) {
      console.log('🔄 ======== CALLBACK QUERY DETECTADO ========');
      console.log('📋 Callback Query completo:', JSON.stringify(update.callback_query, null, 2));
      
      const callbackQuery = update.callback_query;
      const callbackData = callbackQuery.data;
      
      // RESPONDER SIEMPRE AL CALLBACK PARA QUITAR EL EFECTO VISUAL
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          callback_query_id: callbackQuery.id
        })
      });
      
      // MANEJAR CALLBACK "VOLVER A PLANES"
      if (callbackData === 'show_plans') {
        // Verificar que el mensaje existe
        if (!callbackQuery.message) {
          console.error('❌ callbackQuery.message es undefined para show_plans');
          return NextResponse.json({ ok: false, error: 'Message not found' }, { headers });
        }

        const planesMessage = `💰 <b>PLANES DE SUSCRIPCIÓN OPOMELILLA</b>\n\n` +
          `🥉 <b>PLAN BÁSICO</b>\n` +
          `💶 <b>€4.99/mes</b> (IVA incluido)\n` +
          `📝 100 preguntas/día, sistema de preguntas falladas, estadísticas básicas\n\n` +
          `🥈 <b>PLAN PREMIUM</b>\n` +
          `💶 <b>€9.99/mes</b> (IVA incluido)\n` +
          `📝 Preguntas ilimitadas, integración Moodle, estadísticas avanzadas\n\n` +
          `🎯 <b>¿Qué plan te interesa?</b>`;
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: '🥉 Plan Básico (€4.99)', callback_data: 'select_basic' },
              { text: '🥈 Plan Premium (€9.99)', callback_data: 'select_premium' }
            ]
          ]
        };
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: planesMessage,
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            parse_mode: 'HTML',
            reply_markup: keyboard
          })
        });
        
        return NextResponse.json({ ok: true, type: 'show_plans_handled' }, { headers });
      }
      
      // MANEJAR SELECCIÓN DE PLANES
      if (callbackData === 'select_basic' || callbackData === 'select_premium') {
        // Verificar que el mensaje existe
        if (!callbackQuery.message) {
          console.error('❌ callbackQuery.message es undefined para selección de plan');
          return NextResponse.json({ ok: false, error: 'Message not found' }, { headers });
        }

        const planType = callbackData === 'select_basic' ? 'basic' : 'premium';
        
        // Validar que callbackQuery.from existe
        if (!callbackQuery.from || !callbackQuery.from.id) {
          console.log('⚠️  Callback query ignorado: sin información de usuario');
          return NextResponse.json({ ok: false, error: 'Sin información de usuario' }, { headers });
        }
        
        const userid = callbackQuery.from.id.toString();
        
        // Buscar el plan en la base de datos
        const plan = await prisma.subscriptionplan.findFirst({
          where: { name: planType, isactive: true }
        });
        
        if (plan) {
          // Crear botMock completo para usar con SubscriptionCommands
          const botMock = {
            sendMessage: async (chatId: number, text: string, options?: any) => {
              return await sendTelegramMessage(chatId, text);
            },
            sendInvoice: async (chatId: number, invoiceData: any) => {
              const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, ...invoiceData })
              });
              return response.json();
            },
            editMessageText: async (text: string, options: any) => {
              const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, ...options })
              });
              return response.json();
            },
            answerCallbackQuery: async (callbackQueryId: string, options: any) => {
              const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: callbackQueryId, ...options })
              });
              return response.json();
            }
          
          };
          
          // Obtener o crear usuario
          let user = await prisma.telegramuser.findUnique({
            where: { telegramuserid: userid }
          });
          
          if (!user) {
            user = await prisma.telegramuser.create({
              data: {
                id: generateId(),
                telegramuserid: userid,
                username: callbackQuery.from.username,
                firstname: callbackQuery.from.first_name,
                lastname: callbackQuery.from.last_name
              }
            });
          }
          
          // Mostrar opciones de pago
          await SubscriptionCommands.showPaymentOptions(callbackQuery.message.chat.id, plan, user.id, botMock);
        }
        
        return NextResponse.json({ ok: true, type: 'plan_selected' }, { headers });
      }
      
      // MANEJAR CALLBACK DE REDSYS
      if (callbackData?.startsWith('pay_redsys_')) {
        // Implementación temporal - Redsys próximamente disponible
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            callback_query_id: update.callback_query.id,
            text: "💳 Redsys próximamente disponible. Contacta @Carlos_esp",
            show_alert: true
          })
        });
        return NextResponse.json({ ok: true }, { headers });
      }
      
      if (callbackData?.startsWith('pp_')) {
        console.log('🔍 DEBUGGING PayPal callback:', {
          callbackData,
          startsWith_pp: callbackData?.startsWith('pp_')
        });
        
        // Extraer método y sessionId completo
        const method = callbackData.substring(0, 2); // 'pp'
        const sessionId = callbackData.substring(3); // Todo después de 'pp_'
        
        console.log('🔍 Datos extraídos:', {
          method,
          sessionId
        });
        
        // Buscar la sesión de pago por sessionId en metadata
        const paymentSession = await prisma.paymenttransaction.findFirst({
          where: {
            status: 'session_created',
            metadata: {
              contains: sessionId
            }
          },
          orderBy: { createdat: 'desc' }
        });
        
        console.log('🔍 Resultados de búsqueda en BD:', {
          sessionFound: !!paymentSession,
          sessionId: paymentSession?.id
        });
        
        if (paymentSession) {
          console.log('✅ Sesión encontrada, creando botMock...');
          // Crear botMock completo
          const botMock = {
            sendMessage: async (chatId: number, text: string, options?: any) => {
              return await sendTelegramMessage(chatId, text);
            },
            sendInvoice: async (chatId: number, invoiceData: any) => {
              const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, ...invoiceData })
              });
              return response.json();
            },
            editMessageText: async (text: string, options: any) => {
              const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, ...options })
              });
              return response.json();
            },
            answerCallbackQuery: async (callbackQueryId: string, options: any) => {
              const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: callbackQueryId, ...options })
              });
              return response.json();
            }
          };
          
          if (method === 'pp') {
            console.log('💳 Llamando a handlePayPalPayment con sessionId:', sessionId);
            console.log('🟦 PAYPAL: Procesando pago con PayPal');
            console.log('🔍 PAYPAL: SessionId extraído:', sessionId); 
            // ✅ CORRECCIÓN: Llamar a la función importada directamente
            await handlePayPalPayment(botMock, callbackQuery);
          }
        } else {
          console.log('❌ No se encontró sesión de pago en la base de datos');
        }
        
        return NextResponse.json({ ok: true, type: 'callback_handled' }, { headers });
      }
      

      
    }
    
    // Si NO es poll_answer, mensaje, callback_query, ni pre_checkout_query, mostrar debugging limitado
    if (!update.poll_answer && !update.message && !update.pre_checkout_query && !update.callback_query) {
      console.log('🔍 DEBUGGING - Propiedades del update:');
      console.log('   - Object.keys(update):', Object.keys(update));
      console.log('   - Todas las propiedades:', update);
      console.log('ℹ️  Update ignorado: sin mensaje, poll_answer, callback_query ni pre_checkout_query');
      return NextResponse.json({ ok: true }, { headers });
    }
    
    // Manejar respuestas de polls (SISTEMA PRINCIPAL + TORNEOS)
    if (update.poll_answer) {
      console.log('🗳️  ======== POLL ANSWER DETECTADO ========');
      console.log('👤 Usuario que responde:', {
        telegramId: update.poll_answer.user.id,
        username: `@${update.poll_answer.user.username || 'SIN_USERNAME'}`,
        firstname: update.poll_answer.user.first_name,
        lastname: update.poll_answer.user.last_name || '',
        isBot: update.poll_answer.user.is_bot
      });
      console.log('🗳️  Poll details:', {
        pollid: update.poll_answer.poll_id,
        selectedOptions: update.poll_answer.option_ids,
        optionCount: update.poll_answer.option_ids.length
      });
      
      // 🏆 PASO 3: Intentar manejar con sistema de torneos primero
      const tournamentPollAnswer = {
        poll_id: update.poll_answer.poll_id,
        user: update.poll_answer.user,
        option_ids: update.poll_answer.option_ids
      };
      const handledByTournament = await TournamentService.getInstance().handleTournamentPollAnswer(tournamentPollAnswer);
      
      if (handledByTournament) {
        console.log('🏆 Poll answer manejado por sistema de torneos');
        return NextResponse.json({ ok: true, handledBy: 'tournament' }, { headers });
      }
      
      // Si no fue manejado por torneos, usar sistema normal
      console.log('📋 Poll answer manejado por sistema normal');
      return await handlePollAnswer(update.poll_answer);
    }

    // 🆕 NUEVO: Manejar nuevos miembros del grupo
    if (update.message?.new_chat_members && update.message.new_chat_members.length > 0) {
      console.log('👋 ======== NUEVOS MIEMBROS DETECTADOS ========');
      return await handleNewChatMembers(update.message);
    }

    // 💰 MANEJAR PAGOS EXITOSOS
    if (update.message?.successful_payment) {
      console.log('💰 ======== PAGO EXITOSO DETECTADO ========');
      const payment = update.message.successful_payment;
      
      // Validar que message.from existe
      if (!update.message.from || !update.message.from.id) {
        console.log('⚠️  Pago exitoso ignorado: sin información de usuario');
        return NextResponse.json({ ok: true, message: 'Sin información de usuario en pago' });
      }
      
      const userid = update.message.from.id.toString();
      
      console.log('💳 Detalles del pago:', {
        userid,
        currency: payment.currency,
        totalAmount: payment.total_amount,
        payloadInfo: payment.invoice_payload?.substring(0, 50) + '...'
      });
      
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
        
        // Generar mensaje de confirmación usando PaymentService
        const payloadParts = payment.invoice_payload.split('_');
        const planName = payloadParts[1] || 'premium';
        const confirmationMessage = PaymentService.generatePaymentConfirmation(planName, payment.total_amount);

        await sendTelegramMessage(update.message.chat.id, confirmationMessage);
      } else {
        console.log('❌ Error procesando pago exitoso');
        await sendTelegramMessage(update.message.chat.id, 
          '❌ Hubo un problema procesando tu pago. Contacta con soporte: @Carlos_esp'
        );
      }

      return NextResponse.json({ ok: true, paymentProcessed: success });
    }



    const message = update.message;
    
    if (!message) {
      console.log('ℹ️  Update ignorado: sin mensaje');
      return NextResponse.json({ ok: true });
    }
    
    const user = message.from;
    
    // Validar que message.from existe
    if (!user || !user.id) {
      console.log('⚠️  Mensaje ignorado: sin información de usuario');
      return NextResponse.json({ ok: true, message: 'Sin información de usuario' });
    }
    
    // FILTRAR MENSAJES DEL BOT - No procesar sus propios mensajes
    if (user.is_bot) {
      console.log('🤖 Ignorando mensaje del bot:', user.first_name);
      return NextResponse.json({ ok: true, message: 'Mensaje del bot ignorado' });
    }
    
    console.log('💬 ======== MENSAJE RECIBIDO ========');
    console.log('📝 Detalles del mensaje:', {
      messageId: message.message_id,
      from: `${user.first_name} (@${user.username || 'sin_username'})`,
      text: message.text ? (message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text) : 'Sin texto',
      chat: message.chat.id,
      isBot: user.is_bot,
      isCommand: message.text?.startsWith('/') || false
    });

    // Manejar comandos del bot con sistema inteligente
    const commandResponse = await handleBotCommands(message);
    
    if (commandResponse === 'INTELLIGENT_SYSTEM_HANDLED') {
      // El sistema inteligente ya manejó el envío
      return NextResponse.json({ 
      ok: true, 
      type: 'command_handled',
      command: message.text,
      responseSent: true,
      intelligentSystem: true
    }, { headers });
    }
    
    if (commandResponse) {
      // Comando tradicional (sin sistema inteligente)
      const sent = await sendTelegramMessage(message.chat.id, commandResponse);
      console.log(' Mensaje enviado:', sent ? '✅ Exitoso' : '❌ Falló');
      
      return NextResponse.json({ 
        ok: true, 
        type: 'command_handled',
        command: message.text,
        responseSent: sent,
        intelligentSystem: false
      }, { headers });
    }

    // 🚫 NUEVA FUNCIONALIDAD: Detectar confirmación de cancelación de suscripción
    if (message.text && !message.text.startsWith('/')) {
      const text = message.text.trim().toUpperCase();
      
      if (text === 'CANCELAR SUSCRIPCION') {
        // Verificar si el usuario está en proceso de cancelación
        const userid = message.from.id.toString();
        await handleCancellationConfirmation(userid, message);
        return NextResponse.json({ ok: true, type: 'cancellation_processed' }, { headers });
      }
    }

    // SISTEMA LEGACY: Verificar si es una respuesta a una pregunta (mantenemos para compatibilidad)
    if (!message.reply_to_message?.text) {
      console.log('ℹ️  Mensaje ignorado: no es comando ni respuesta a pregunta');
      return NextResponse.json({ ok: true, message: 'No es una respuesta a pregunta' }, { headers });
    }

    // Extraer información de la pregunta original
    const originalMessage = message.reply_to_message.text || '';
    const questionid = extractQuestionId(originalMessage);

    if (!questionid) {
      console.log('⚠️  No se pudo extraer ID de pregunta del mensaje original');
      return NextResponse.json({ ok: true }, { headers });
    }

    // Obtener la pregunta de la base de datos para verificar la respuesta
    // Aquí necesitarías implementar la lógica para obtener la pregunta
    // Por ahora, simularemos que todas las respuestas son correctas para testing
    const iscorrect = true; // TODO: Implementar verificación real

    // Calcular tiempo de respuesta (en segundos)
    const responsetime = calculateResponseTime(
      message.reply_to_message?.date || message.date,
      message.date
    );

    console.log('🎮 Procesando respuesta legacy:', {
      questionid,
      iscorrect: iscorrect,
      responsetime: responsetime,
      telegramuser: `${user.first_name} (@${user.username || 'sin_username'})`
    });

    // Procesar la respuesta con el sistema de gamificación
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

    // Enviar respuesta de confirmación al usuario
    const responseMessage = formatResponseMessage(userStats, iscorrect);
    
    // Generar mensaje de respuesta personalizado  
    console.log('💬 Sistema inteligente: procesando respuesta de quiz...');
    
    // Datos temporales para la respuesta legacy (sistema principal está en poll answers)
    const tempQuestionData = {
      questionid: questionid,
      correctanswerindex: 0,
      createdat: new Date(message.reply_to_message?.date || message.date),
      chatid: message.chat.id
    };
    
    // Usar sistema inteligente para enviar respuesta de quiz
    const quizResult = await NotificationService.sendIntelligentQuizResponse(
      userStats,
      iscorrect,
      tempQuestionData,
      {
        telegramuserid: user.id.toString(),
        firstName: user.first_name,
        username: user.username
      },
      message.chat.id.toString()
    );
    
    console.log('📤 Resultado sistema inteligente quiz:', quizResult.method, '|', quizResult.message);

    console.log('✅ Respuesta legacy procesada:', {
      telegramuser: user.username || user.first_name,
      questionid,
      iscorrect: iscorrect,
      responsetime: responsetime,
      newStats: userStats
    });

    return NextResponse.json({ 
      ok: true, 
      processed: true,
      userStats 
    }, { headers });

  } catch (error) {
    console.error('❌ ============ ERROR EN WEBHOOK ============');
    console.error('💥 Error completo:', error);
    console.error('📊 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    }, { status: 500, headers });
  }
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

// Función para manejar comandos del bot con sistema inteligente
export async function handleBotCommands(message: any): Promise<string | null> {
  const text = message.text?.toLowerCase().trim();
  
  if (!text || !text.startsWith('/')) {
    return null;
  }

  // Validar que message.from existe
  if (!message.from || !message.from.id) {
    console.log('⚠️  Comando ignorado: sin información de usuario');
    return null;
  }

  const userid = message.from.id.toString();
  const isGroupChat = message.chat.type === 'group' || message.chat.type === 'supergroup';
  const originalCommand = message.text.trim();
  
  // Buscar el usuario en la base de datos para el sistema inteligente
  let telegramuser: { telegramuserid: string; firstname?: string } | null = null;
  try {
    const prismaUser = await prisma.telegramuser.findUnique({
      where: { telegramuserid: userid }
    });
    
    if (prismaUser) {
      telegramuser = {
        telegramuserid: prismaUser.telegramuserid,
        firstname: prismaUser.firstname || undefined
      };
    }
  } catch (error) {
    console.log('⚠️ Error buscando usuario para sistema inteligente:', error);
  }
  
  // Si no hay usuario, crear registro básico
  if (!telegramuser) {
    telegramuser = {
      telegramuserid: userid,
      firstname: message.from.first_name || message.from.username || 'Usuario'
    };
  }
  
  // Extraer el comando base (primera palabra)
  const commandBase = text.split(' ')[0];
  
  console.log(`🔍 DEBUG: Procesando comando: "${commandBase}" | Original: "${originalCommand}"`);
  
  let commandResponse: string | null = null;

  switch (commandBase) {
    case '/start':
      // Registrar usuario en la base de datos si no existe
      try {
        const existingUser = await prisma.telegramuser.findUnique({
          where: { telegramuserid: userid }
        });

        if (!existingUser) {
          // Crear nuevo usuario en la base de datos con puntos iniciales para duelos
          await prisma.telegramuser.create({
                          data: {
                id: generateId(),
                telegramuserid: userid,
                username: message.from.username,
                firstname: message.from.first_name,
              lastname: message.from.last_name,
              totalpoints: 25, // 🎁 Puntos iniciales para poder participar en duelos
              lastactivity: new Date()
            }
          });
          
          console.log('✅ Nuevo usuario registrado en BD con puntos iniciales:', {
            telegramuserid: userid,
            username: message.from.username,
            firstname: message.from.first_name,
            initialPoints: 25
          });
        } else {
          console.log('ℹ️ Usuario ya existe en BD:', existingUser.username || existingUser.firstname);
        }
      } catch (error) {
        console.error('❌ Error registrando usuario en /start:', error);
      }

      return `🎉 <b>¡BIENVENIDO A OPOMELILLA!</b> 🎉

¡Hola! Te has registrado exitosamente.

🎁 <b>REGALO DE BIENVENIDA:</b>
✅ Has recibido 25 puntos iniciales
✅ ¡Ya puedes participar en duelos!

🎯 <b>¿QUÉ PUEDES HACER AHORA?</b>
📊 Responder preguntas para ganar puntos
🏆 Competir en el ranking general
🔥 Mantener rachas diarias de estudio
🗡️ Retar a duelos contra otros usuarios (¡YA DISPONIBLE!)
🏅 Desbloquear logros únicos

⚡ <b>CONFIGURACIÓN COMPLETADA:</b>
✅ Perfil creado y listo
✅ Notificaciones privadas activadas
✅ Sistema de puntos inicializado (25 pts)
✅ ¡Listo para participar en duelos!

🚀 <b>PRIMEROS PASOS:</b>
• Ve al grupo y responde algunas preguntas
• Usa <code>/stats</code> para ver tu progreso
• Usa <code>/ranking</code> para ver la competencia
• Usa <code>/duelo @usuario</code> para retar a alguien (¡ya puedes!)

💡 <b>TIP:</b> A partir de ahora recibirás notificaciones privadas detalladas en lugar de mensajes breves en el grupo.

¡Buena suerte en tu preparación para obtener tu plaza de PERMANENTE! 🍀`;

    case '/ranking':
    case '/leaderboard':
      console.log('🏆 RANKING COMMAND - Usuario solicitó ranking:', {
        userid,
        username: message.from.username,
        firstname: message.from.first_name,
        timestamp: new Date().toISOString()
      });
      
      const leaderboard = await GamificationService.getLeaderboard(10);
      console.log('🏆 RANKING RESULT - Datos obtenidos:', {
        totalUsers: leaderboard.length,
        toptelegramuser: leaderboard[0] ? {
          name: leaderboard[0].user.firstName || leaderboard[0].user.username || 'Usuario',
          points: leaderboard[0].points
        } : 'No hay usuarios'
      });
      
      commandResponse = formatLeaderboard(leaderboard);
      break;

    case '/ranking_semanal':
      console.log('📅 RANKING_SEMANAL COMMAND - Usuario solicitó ranking semanal:', {
        userid,
        username: message.from.username,
        firstname: message.from.first_name,
        timestamp: new Date().toISOString()
      });
      
      const weeklyLeaderboard = await GamificationService.getWeeklyLeaderboard(10);
      console.log('📅 RANKING_SEMANAL RESULT - Datos obtenidos:', {
        totalUsers: weeklyLeaderboard.length,
        toptelegramuser: weeklyLeaderboard[0] ? {
          name: weeklyLeaderboard[0].user.firstName || weeklyLeaderboard[0].user.username || 'Usuario',
          points: weeklyLeaderboard[0].points
        } : 'No hay usuarios'
      });
      
      commandResponse = formatLeaderboard(weeklyLeaderboard, 'RANKING SEMANAL', 'semanal');
      break;

    case '/ranking_mensual':
      console.log('📅 RANKING_MENSUAL COMMAND - Usuario solicitó ranking mensual:', {
        userid,
        username: message.from.username,
        firstname: message.from.first_name,
        timestamp: new Date().toISOString()
      });
      
      const monthlyLeaderboard = await GamificationService.getMonthlyLeaderboard(10);
      console.log('📅 RANKING_MENSUAL RESULT - Datos obtenidos:', {
        totalUsers: monthlyLeaderboard.length,
        toptelegramuser: monthlyLeaderboard[0] ? {
          name: monthlyLeaderboard[0].user.firstName || monthlyLeaderboard[0].user.username || 'Usuario',
          points: monthlyLeaderboard[0].points
        } : 'No hay usuarios'
      });
      
      commandResponse = formatLeaderboard(monthlyLeaderboard, 'RANKING MENSUAL', 'mensual');
      break;

    case '/stats':
    case '/mi_stats':
      const userStats = await GamificationService.getUserStats(userid);
      if (!userStats) {
        commandResponse = '❌ No tienes estadísticas aún. ¡Responde algunas preguntas para empezar!';
      } else {
        commandResponse = formatUserStats(userStats);
      }
      break;

    case '/miprogreso':
      console.log('📊 MIPROGRESO COMMAND - Ver progreso personal de graduaciones');
      return await handleMiProgresoCommand(userid, message.from);

    case '/estadisticas':
      console.log('📈 ESTADISTICAS COMMAND - Ver estadísticas por materia');
      return await handleEstadisticasCommand(userid, message.from);

    case '/graduadas':
      console.log('🎓 GRADUADAS COMMAND - Ver preguntas graduadas');
      return await handleGraduadasCommand(userid, message.from);

    case '/reiniciar_graduacion':
      console.log('🔄 REINICIAR_GRADUACION COMMAND - Reset de graduaciones');
      return await handleReiniciarGraduacionCommand(userid, message.from);

    case '/reiniciar_graduacion_confirmar':
      console.log('✅ REINICIAR_GRADUACION_CONFIRMAR COMMAND - Confirmar reset');
      return await handleReiniciarGraduacionConfirmarCommand(userid, message.from);

    case '/configurar_notificaciones':
      console.log('⚙️ CONFIGURAR_NOTIFICACIONES COMMAND - Configurar sistema de notificaciones');
      return await handleConfigurarNotificacionesCommand(userid, message.from);

    case '/analisis_avanzado':
      console.log('📊 ANALISIS_AVANZADO COMMAND - Analytics avanzados con IA');
      await handleAnalisisAvanzado(createBotInterface(message.chat.id), message);
      return 'INTELLIGENT_SYSTEM_HANDLED';
    // ==========================================
    // 🔔 COMANDOS ESPECÍFICOS DE NOTIFICACIONES
    // ==========================================
    
    case '/notificaciones_graduacion':
      console.log('🎓 NOTIFICACIONES_GRADUACION COMMAND - Configurar notificaciones de graduación');
      return await handleNotificacionesGraduacionCommand(userid, message.from, message.text);

    case '/notificaciones_logros':
      console.log('🏆 NOTIFICACIONES_LOGROS COMMAND - Configurar notificaciones de logros');
      return await handleNotificacionesLogrosCommand(userid, message.from, message.text);

    case '/notificaciones_recordatorios':
      console.log('⏰ NOTIFICACIONES_RECORDATORIOS COMMAND - Configurar recordatorios');
      return await handleNotificacionesRecordatoriosCommand(userid, message.from, message.text);

    case '/notificaciones_semanales':
      console.log('📊 NOTIFICACIONES_SEMANALES COMMAND - Configurar reportes semanales');
      return await handleNotificacionesSemanalesCommand(userid, message.from, message.text);

    case '/horario_notificaciones':
      console.log('🕐 HORARIO_NOTIFICACIONES COMMAND - Configurar horario');
      return await handleHorarioNotificacionesCommand(userid, message.from, message.text);

    // ==========================================
    // 📊 COMANDOS DE QUOTAS Y LÍMITES
    // ==========================================
    
    case '/mi_quota':
    case '/cuantas_me_quedan':
    case '/limite_diario':
      console.log('📊 MI_QUOTA COMMAND - Ver límites y uso actual');
      return await handleMiQuotaCommand(userid, message.from);

    case '/racha':
      const streakStats = await GamificationService.getUserStats(userid);
      if (!streakStats) {
        commandResponse = '❌ No tienes estadísticas aún. ¡Responde algunas preguntas para empezar!';
      } else {
        commandResponse = formatStreakInfo(streakStats);
      }
      break;

    case '/logros':
    case '/achievements':
      const achievements = await getUserAchievements(userid);
      commandResponse = formatUserAchievements(achievements, userid);
      break;

    case '/prediccion':
    case '/prediction':
      const predictionStats = await GamificationService.getUserStats(userid);
      if (!predictionStats) {
        commandResponse = '❌ No tienes estadísticas aún. ¡Responde algunas preguntas para empezar!';
      } else {
        commandResponse = formatLevelPrediction(predictionStats);
      }
      break;

    case '/metas':
    case '/goals':
      const userGoals = await getUserGoals(userid);
      commandResponse = formatUserGoals(userGoals, userid);
      break;

    case '/duelo':
    case '/duel':
      return await handleDuelCommand(message.text, userid, message.from, message.chat.id);

    case '/duelos':
    case '/duels':
      const userDuels = await DuelService.getUserDuels(userid);
      commandResponse = formatUserDuels(userDuels, userid);
      break;

    case '/aceptar':
    case '/accept':
      return await handleAcceptDuel(message.text, userid);

    case '/rechazar':
    case '/reject':
      return await handleRejectDuel(message.text, userid);

    case '/notificaciones':
    case '/notifications':
      commandResponse = formatNotificationHelp();
      break;

    case '/privadas':
    case '/private':
      commandResponse = formatPrivateMessageHelp();
      break;

    case '/test':
    case '/prueba':
      return await handleTestCommand(userid, message.from);

    case '/help':
      commandResponse = formatHelpMessage();
      break;

    case '/duelos':
      console.log('📊 DUELOS COMMAND - Ver duelos del usuario');
      commandResponse = await handleUserDuels(userid);
      break;

    case '/examen2018':
      console.log('🎯 EXAMEN2018 COMMAND - Pregunta específica del examen oficial 2018');
      return await handleExamen2018Command(userid, message.from);

    case '/examen2018stats':
      console.log('📊 EXAMEN2018STATS COMMAND - Estadísticas del examen oficial');
      return await handleExamen2018StatsCommand(userid, message.from);

    case '/examen2024':
      console.log('🎯 EXAMEN2024 COMMAND - Pregunta específica del examen oficial 2024');
      return await handleExamen2024Command(userid, message.from);

    case '/examen2024stats':
      console.log('📊 EXAMEN2024STATS COMMAND - Estadísticas del examen oficial 2024');
      return await handleExamen2024StatsCommand(userid, message.from);

    case '/simulacro2018':
      console.log('🎯 SIMULACRO2018 COMMAND - Iniciar simulacro del examen oficial 2018');
      return await handleSimulacroCommand(userid, message.from);

    case '/simulacro_continuar':
      console.log('▶️ SIMULACRO_CONTINUAR COMMAND - Continuar simulacro en progreso');
      return await handleSimulacroResumeCommand(userid, message.from);

    case '/simulacro_abandonar':
      console.log('🚪 SIMULACRO_ABANDONAR COMMAND - Abandonar simulacro actual');
      return await handleSimulacroAbandonCommand(userid, message.from);

    case '/simulacro_historial':
      console.log('📋 SIMULACRO_HISTORIAL COMMAND - Ver historial de simulacros');
      return await handleSimulacroHistoryCommand(userid, message.from);

    case '/simulacro2024':
      console.log('🎯 SIMULACRO2024 COMMAND - Iniciar simulacro del examen oficial 2024');
      return await handleSimulacro2024Command(userid, message.from);

    case '/ranking_oficial2018':
      console.log('🏆 RANKING_OFICIAL2018 COMMAND - Ranking específico del examen 2018');
      return await handleRankingOficial2018Command(userid, message.from);

    case '/ranking_oficial2024':
      console.log('🏆 RANKING_OFICIAL2024 COMMAND - Ranking específico del examen 2024');
      return await handleRankingOficial2024Command(userid, message.from);

    case '/comparativa_examenes':
      console.log('📊 COMPARATIVA_EXAMENES COMMAND - Comparativa personal entre exámenes');
      return await handleComparativaExamenesCommand(userid, message.from);

    case '/simulacro_oficial':
      console.log('🎯 SIMULACRO_OFICIAL COMMAND - Selector de simulacro oficial');
      return await handleSimulacroOficialCommand(userid, message.from);

    case '/torneo':
    case '/tournament':
      console.log('🏆 TORNEO COMMAND - Gestión de torneos');
      return await handleTorneoCommand(userid, message.from, message.text);

    case '/torneos':
    case '/tournaments':
      console.log('🏆 TORNEOS COMMAND - Ver torneos disponibles');
      return await handleTorneosListCommand(userid, message.from);

    case '/torneo_unirse':
      console.log('✅ TORNEO_UNIRSE COMMAND - Unirse a torneo');
      return await handleTorneoJoinCommand(userid, message.from, message.text);

    case '/torneo_salir':
      console.log('❌ TORNEO_SALIR COMMAND - Salir de torneo');
      return await handleTorneoLeaveCommand(userid, message.from, message.text);

    case '/torneo_historial':
      console.log('📊 TORNEO_HISTORIAL COMMAND - Historial de torneos');
      return await handleTorneoHistoryCommand(userid, message.from);

    // ==========================================
    // 💰 COMANDOS DE SUSCRIPCIONES Y PAGOS - ESPAÑA
    // ==========================================
    
    case '/planes':
      console.log('💰 PLANES COMMAND - Ver planes de suscripción disponibles');
      const botMockPlanes = {
        sendMessage: async (chatId: number, text: string, options?: any) => {
          const requestBody: any = {
            chat_id: chatId,
            text: text,
            parse_mode: options?.parse_mode || 'HTML'
          };
          
          // Agregar reply_markup si existe
          if (options?.reply_markup) {
            requestBody.reply_markup = options.reply_markup;
          }
          
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          return response.json();
        },
        sendInvoice: async (chatId: number, invoiceData: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, ...invoiceData })
          });
          return response.json();
        },
        editMessageText: async (text: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, ...options })
          });
          return response.json();
        },
        answerCallbackQuery: async (callbackQueryId: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, ...options })
          });
          return response.json();
        }
      };
      await SubscriptionCommands.handlePlanesCommand(message, botMockPlanes);
      return 'INTELLIGENT_SYSTEM_HANDLED';

    case '/basico':
      console.log('🥉 BASICO COMMAND - Iniciando procesamiento');
      const botMockBasico = {
        sendMessage: async (chatId: number, text: string, options?: any) => {
          const requestBody: any = {
            chat_id: chatId,
            text: text,
            parse_mode: options?.parse_mode || 'HTML'
          };
          
          // Agregar reply_markup si existe
          if (options?.reply_markup) {
            requestBody.reply_markup = options.reply_markup;
          }
          
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          return response.json();
        },
        sendInvoice: async (chatId: number, invoiceData: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, ...invoiceData })
          });
          return response.json();
        },
        editMessageText: async (text: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, ...options })
          });
          return response.json();
        },
        answerCallbackQuery: async (callbackQueryId: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, ...options })
          });
          return response.json();
        }
      };
      await SubscriptionCommands.handleBasicoCommand(message, botMockBasico);
      return 'INTELLIGENT_SYSTEM_HANDLED';

    case '/premium':
      console.log('🥈 PREMIUM COMMAND - Iniciando procesamiento');
      const botMockPremium = {
        sendMessage: async (chatId: number, text: string, options?: any) => {
          const requestBody: any = {
            chat_id: chatId,
            text: text,
            parse_mode: options?.parse_mode || 'HTML'
          };
          
          // Agregar reply_markup si existe
          if (options?.reply_markup) {
            requestBody.reply_markup = options.reply_markup;
          }
          
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          return response.json();
        },
        sendInvoice: async (chatId: number, invoiceData: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, ...invoiceData })
          });
          return response.json();
        },
        editMessageText: async (text: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, ...options })
          });
          return response.json();
        },
        answerCallbackQuery: async (callbackQueryId: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, ...options })
          });
          return response.json();
        }
      };
      await SubscriptionCommands.handlePremiumCommand(message, botMockPremium);
      return 'INTELLIGENT_SYSTEM_HANDLED';

    case '/mi_plan':
      console.log('👤 MI_PLAN COMMAND - Ver estado de suscripción actual');
      const botMockMiPlan = {
        sendMessage: async (chatId: number, text: string, options?: any) => {
          return await sendTelegramMessage(chatId, text);
        },
        sendInvoice: async (chatId: number, invoiceData: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, ...invoiceData })
          });
          return response.json();
        },
        editMessageText: async (text: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, ...options })
          });
          return response.json();
        },
        answerCallbackQuery: async (callbackQueryId: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, ...options })
          });
          return response.json();
        }
      };
      await SubscriptionCommands.handleMiPlanCommand(message, botMockMiPlan);
      return 'INTELLIGENT_SYSTEM_HANDLED';

    case '/cancelar':
      console.log('🚫 CANCELAR COMMAND - Proceso de cancelación de suscripción');
      const botMockCancelar = {
        sendMessage: async (chatId: number, text: string, options?: any) => {
          return await sendTelegramMessage(chatId, text);
        },
        sendInvoice: async (chatId: number, invoiceData: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, ...invoiceData })
          });
          return response.json();
        },
        editMessageText: async (text: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, ...options })
          });
          return response.json();
        },
        answerCallbackQuery: async (callbackQueryId: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, ...options })
          });
          return response.json();
        }
      };
      await SubscriptionCommands.handleCancelarCommand(message, botMockCancelar);
      return 'INTELLIGENT_SYSTEM_HANDLED';

    case '/facturas':
      console.log('📄 FACTURAS COMMAND - Ver historial de transacciones');
      const botMockFacturas = {
        sendMessage: async (chatId: number, text: string, options?: any) => {
          return await sendTelegramMessage(chatId, text);
        },
        sendInvoice: async (chatId: number, invoiceData: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, ...invoiceData })
          });
          return response.json();
        },
        editMessageText: async (text: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, ...options })
          });
          return response.json();
        },
        answerCallbackQuery: async (callbackQueryId: string, options: any) => {
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, ...options })
          });
          return response.json();
        }
      };
      await SubscriptionCommands.handleFacturasCommand(message, botMockFacturas);
      return 'INTELLIGENT_SYSTEM_HANDLED';

    // ==========================================
    // 💎 COMANDOS AVANZADOS DE SUSCRIPCIÓN (FASE 2)
    // ==========================================
    
    case '/renovar':
      console.log('🔄 RENOVAR COMMAND - Renovación manual de suscripción');
      const { handleRenovarCommand } = await import('@/services/advancedSubscriptionCommands');
      return await handleRenovarCommand(userid, message.from);

    case '/cambiar_plan':
      console.log('🔄 CAMBIAR_PLAN COMMAND - Upgrade/downgrade entre planes');
      const { handleCambiarPlanCommand } = await import('@/services/advancedSubscriptionCommands');
      return await handleCambiarPlanCommand(userid, message.from);

    // ==========================================
    // 🎖️ COMANDOS DE SIMULACROS MILITARES PREMIUM (FASE 3)
    // ==========================================
    
    case '/simulacro_premium_et':
      console.log('🎖️ SIMULACRO_PREMIUM_ET COMMAND - Simulacro Ejército de Tierra Premium');
      const { handleSimulacroEjercitoTierraCommand } = await import('@/services/militarySimulationCommands');
      return await handleSimulacroEjercitoTierraCommand(userid, message.from);

    case '/simulacro_premium_aire':
      console.log('✈️ SIMULACRO_PREMIUM_AIRE COMMAND - Simulacro Ejército del Aire Premium');
      const { handleSimulacroEjercitoAireCommand } = await import('@/services/militarySimulationCommands');
      return await handleSimulacroEjercitoAireCommand(userid, message.from);

    case '/simulacro_premium_armada':
      console.log('⚓ SIMULACRO_PREMIUM_ARMADA COMMAND - Simulacro Armada Premium');
      const { handleSimulacroArmadaCommand } = await import('@/services/militarySimulationCommands');
      return await handleSimulacroArmadaCommand(userid, message.from);

    case '/simulacros_premium':
      console.log('🎖️ SIMULACROS_PREMIUM COMMAND - Información de simulacros militares');
      const { handleSimulacrosPremiumInfoCommand } = await import('@/services/militarySimulationCommands');
      return await handleSimulacrosPremiumInfoCommand(userid, message.from);

    // ==========================================
    // 🎓 COMANDOS DE INTEGRACIÓN MOODLE (FASE 4)
    // ==========================================
    
    case '/vincular_moodle':
      console.log('🔗 VINCULAR_MOODLE COMMAND - Generar código de verificación');
      const { handleVincularMoodleCommand } = await import('@/services/moodleGamificationCommands');
      return await handleVincularMoodleCommand(userid, message.from);

    case '/estado_moodle':
      console.log('📊 ESTADO_MOODLE COMMAND - Ver estado de vinculación');
      const { handleEstadoMoodleCommand } = await import('@/services/moodleGamificationCommands');
      return await handleEstadoMoodleCommand(userid, message.from);

    case '/estadisticas_unificadas':
      console.log('📈 ESTADISTICAS_UNIFICADAS COMMAND - Ver estadísticas Premium unificadas');
      const { handleEstadisticasUnificadasCommand } = await import('@/services/moodleGamificationCommands');
      return await handleEstadisticasUnificadasCommand(userid, message.from);

    case '/codigo_moodle':
      console.log('🔑 CODIGO_MOODLE COMMAND - Introducir código generado en Moodle');
      const commandParts = message.text.trim().split(' ');
      const moodleCode = commandParts[1];
      
      if (!moodleCode) {
        return `❌ **Uso incorrecto del comando**

**📋 Formato correcto:**
\`/codigo_moodle ABC123\`

**🔍 Dónde encontrar el código:**
1. Ve a opomelilla.com
2. Accede a: Perfil → Preferencias → Integración con Telegram   
3. Haz clic en "Generar código"
4. Copia el código de 6 caracteres
5. Úsalo aquí: \`/codigo_moodle TU_CODIGO\`

💡 Los códigos expiran en 15 minutos.`;
      }
      
      const { handleCodigoMoodleCommand } = await import('@/services/moodleGamificationCommands');
      return await handleCodigoMoodleCommand(userid, moodleCode, message.from);

    case '/sincronizar_moodle':
      console.log('🔄 SINCRONIZAR_MOODLE COMMAND - Sincronización manual de actividades');
      const { handleSincronizarMoodleCommand } = await import('@/services/moodleGamificationCommands');
      return await handleSincronizarMoodleCommand(userid, message.from);

    // ==========================================
    // 🎯 COMANDOS DE SESIONES DE ESTUDIO PRIVADAS
    // ==========================================
    
    case '/stop':
      console.log('🛑 STOP COMMAND - Cancelar sesión de estudio');
      return await handleStopStudySession(userid, message);

    case '/progreso':
      console.log('📊 Comando /progreso recibido');
      await StudyCommandHandler.handleProgressCommand(message.from.id.toString());
      return 'INTELLIGENT_SYSTEM_HANDLED';

    // ==========================================
    // ✅ COMANDOS DE CONFIRMACIÓN DE SUSCRIPCIÓN
    // ==========================================
    


    // Comandos de confirmación de cambio de plan
    case '/SI':
    case '/si':
    case '/SÍ':
    case '/sí': {
      console.log('✅ MATCH: Comando /si detectado correctamente');
      console.log('🔄 Procesando confirmación de cambio de plan');
      
      const botMockConfirmacion = {
        async sendMessage(targetchatid: number, text: string, options?: any): Promise<any> {
          // Si hay reply_markup, usar la API completa de Telegram
          if (options?.reply_markup) {
            try {
              const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: targetchatid,
                  text: text,
                  parse_mode: options.parse_mode || 'HTML',
                  reply_markup: options.reply_markup
                })
              });
              
              const result = await response.json();
              console.log('📤 Mensaje con botones enviado:', result.ok ? '✅ Exitoso' : '❌ Falló');
              if (!result.ok) {
                console.error('❌ Error detallado:', result.description);
              }
              return result;
            } catch (error) {
              console.error('❌ Error enviando mensaje con botones:', error);
              // Fallback a mensaje simple sin botones
              const fallbackText = text + '\n\n⚠️ Los botones no están disponibles. Usa /planes para ver opciones.';
              return await sendTelegramMessage(targetchatid, fallbackText);
            }
          } else {
            // Mensaje simple sin botones
            return await sendTelegramMessage(targetchatid, text);
          }
        },
        editMessageText: async (text: string, options?: any) => {
          console.log('editMessageText llamado:', text);
          return Promise.resolve();
        },
        sendInvoice: async (targetchatid: number, invoiceData: any) => {
          console.log('sendInvoice llamado para confirmación');
          return Promise.resolve();
        },
        answerCallbackQuery: async (callbackQueryId: string, options?: any) => {
          console.log('answerCallbackQuery llamado:', callbackQueryId);
          return Promise.resolve();
        }
      };
      
      await SubscriptionCommands.handlePlanChangeConfirmation(message, botMockConfirmacion);
      return 'INTELLIGENT_SYSTEM_HANDLED';
    }

    // ========================================
    // 🎯 DETECTAR COMANDOS DE ESTUDIO (incluyendo /falladas)
    // ========================================
    default:
      console.log(`🔍 DEFAULT CASE: Comando "${commandBase}" no coincide con casos específicos`);
      const studyCommand = StudySessionService.parseStudyCommand(commandBase);
      if (studyCommand) {
        console.log(`🎯 STUDY COMMAND - Materia: ${studyCommand.subject}, Cantidad: ${studyCommand.quantity}, Tipo: ${studyCommand.type || 'normal'}`);
        return await handleStudyCommand(userid, message, studyCommand);
      }
      
      return null;
  }
  
  // Si no hay respuesta, salir
  if (!commandResponse) {
    return null;
  }
  
  console.log(`📧 COMANDO INTELIGENTE: ${originalCommand} | Usuario: ${telegramuser?.firstname || 'Usuario'} | Grupo: ${isGroupChat}`);
  
  // Usar el sistema inteligente para enviar la respuesta
  try {
    const userForNotification = {
      telegramuserid: telegramuser!.telegramuserid,
      firstname: telegramuser!.firstname
    };
    
    const result = await NotificationService.sendIntelligentCommandResponse(
      originalCommand,
      commandResponse,
      userForNotification,
      message.chat.id.toString(),
      isGroupChat
    );
    
    console.log(`📨 RESULTADO INTELIGENTE: ${result.method} | Success: ${result.success} | ${result.message}`);
    
    // Si el sistema inteligente manejó el envío, devolver indicador especial
    if (result.success) {
      return 'INTELLIGENT_SYSTEM_HANDLED';
    }
    
    // Si falló todo, devolver la respuesta normal como fallback
    return commandResponse;
    
  } catch (error) {
    console.log('⚠️ Error en sistema inteligente, usando fallback normal:', error);
    return commandResponse;
  }
}

function formatLeaderboard(leaderboard: any[], title: string = 'RANKING GENERAL', type: string = 'general'): string {
  const timestamp = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const date = new Date().toLocaleDateString('es-ES');
  
  let message = `🏆 <b>${title}</b> 🏆\n`;
  message += `📅 ${date} - 🕐 ${timestamp}\n\n`;
  
  if (leaderboard.length === 0) {
    message += '📊 <i>No hay usuarios registrados aún</i>\n\n';
    message += '💡 <b>¡Sé el primero!</b>\n';
    message += 'Responde preguntas para aparecer en el ranking.';
    return message;
  }
  
  leaderboard.forEach((entry, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔸';
    // Priorizar firstname/firstName, luego username, luego "Usuario"
    const name = entry.user.firstName || entry.user.firstname || entry.user.username || 'Usuario';
    
    message += `${medal} <b>${entry.rank}.</b> ${name}\n`;
    message += `   📊 ${entry.points} pts | ${getLevelEmoji(entry.level)} Nv.${entry.level} | 🔥 ${entry.streak}\n\n`;
  });

  // Mensaje motivacional personalizado según el tipo
  if (type === 'semanal') {
    message += `\n💡 <b>TIP:</b> 📅 ¡Sigue así esta semana para mantener tu posición!`;
  } else if (type === 'mensual') {
    message += `\n💡 <b>TIP:</b> 📅 ¡Continúa estudiando para dominar este mes!`;
  } else {
    message += `\n💡 <b>TIP:</b> Usa /stats para ver tus estadísticas detalladas`;
  }
  
  return message;
}
  
// Función para formatear estadísticas del usuario
function formatUserStats(telegramuser: any): string {
  const winRate = telegramuser.totalDuels > 0 ? Math.round((telegramuser.wonDuels / telegramuser.totalDuels) * 100) : 0;
  const incorrectResponses = (telegramuser.totalResponses || 0) - (telegramuser.correctResponses || 0);
  const accuracyPercentage = telegramuser.accuracy ? Math.round(telegramuser.accuracy) : 0;
  
  return `📊 <b>TUS ESTADÍSTICAS</b> 📊

👤 <b>${telegramuser.firstname || telegramuser.username || 'Usuario'}</b>

📚 <b>PREGUNTAS:</b>
   📝 Total respondidas: ${telegramuser.totalResponses || 0}
   ✅ Acertadas: ${telegramuser.correctResponses || 0}
   ❌ Falladas: ${incorrectResponses}
   🎯 Precisión: ${accuracyPercentage}%

🗡️ <b>DUELOS:</b>
   📈 Total disputados: ${telegramuser.totalDuels || 0}
   🏆 Ganados: ${telegramuser.wonDuels || 0}
   😔 Perdidos: ${telegramuser.lostDuels || 0}
   📊 Porcentaje victoria: ${winRate}%
   🔥 Racha actual: ${telegramuser.currentStreak || 0}

💰 <b>PUNTOS:</b>
   💎 Total: ${telegramuser.totalpoints || 0}
   📊 Nivel: ${telegramuser.level || 1}
   ⚡ Racha respuestas: ${telegramuser.streak || 0}
   🏅 Mejor racha: ${telegramuser.beststreak || 0}

🎯 <b>ACTIVIDAD:</b>
   📅 Se unió: ${telegramuser.joinedAt ? new Date(telegramuser.joinedAt).toLocaleDateString() : 'N/A'}
   🕐 Última actividad: ${telegramuser.lastActivity ? new Date(telegramuser.lastActivity).toLocaleDateString() : 'N/A'}

🎮 <b>ACCIONES DISPONIBLES:</b>
• <code>/pdc10, /constitucion15, /pac20, etc..</code>
• <code>/falladas5, /falladas10, /constitucionfalladas5, etc...</code>
• <code>/simulacro2024</code>
• <code>/graduadas</code> - Ver preguntas graduadas
• <code>/mi_quota</code> - Ver mi cuota actual
• <code>/limite_diario</code>
• <code>/logros</code> - Ver mis logros
• <code>/ranking</code> - Ver clasificación general

⚔️ <b>¿Listo para más?</b>`;
}

function formatStreakInfo(stats: any): string {
  const streakEmoji = stats.streak >= 7 ? '🔥🔥🔥' : stats.streak >= 3 ? '🔥🔥' : '🔥';
  
  return `${streakEmoji} <b>INFORMACIÓN DE RACHA</b> ${streakEmoji}

🔥 Racha actual: <b>${stats.streak} días</b>
🏅 Mejor racha: <b>${stats.beststreak} días</b>
📅 Última actividad: ${stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Hoy'}

${getStreakMotivation(stats.streak)}`;
}

function formatHelpMessage(): string {
  return `🤖 <b>AYUDA - OPOMELILLA BOT</b> 🤖

📚 <b>COMANDOS BÁSICOS:</b>
• <code>/help</code> - Ver esta ayuda
• <code>/stats</code> - Ver tus estadísticas

🎯 <b>EXÁMENES OFICIALES:</b>
• <code>/examen2018</code> - Pregunta del examen 2018
• <code>/examen2024</code> - Pregunta del examen 2024
• <code>/examen2018stats</code> - Estadísticas del examen 2018
• <code>/examen2024stats</code> - Estadísticas del examen 2024

🏆 <b>RANKINGS ESPECÍFICOS:</b>
• <code>/ranking</code> - Ver el ranking general
• <code>/ranking_semanal</code> - Ranking de la semana actual  
• <code>/ranking_mensual</code> - Ranking del mes actual
• <code>/ranking_oficial2018</code> - Ranking del examen 2018
• <code>/ranking_oficial2024</code> - Ranking del examen 2024
• <code>/comparativa_examenes</code> - Comparar tu rendimiento

🎮 <b>SIMULACROS:</b>
• <code>/simulacro_oficial</code> - Selector de simulacros
• <code>/simulacro2018</code> - Simulacro examen 2018
• <code>/simulacro2024</code> - Simulacro examen 2024
• <code>/simulacro_continuar</code> - Continuar simulacro
• <code>/simulacro_abandonar</code> - Abandonar simulacro
• <code>/simulacro_historial</code> - Ver historial

🎯 <b>METAS Y LOGROS:</b>
• <code>/metas</code> - Ver tus objetivos
• <code>/logros</code> - Ver tus logros
• <code>/prediccion</code> - Predicción de nivel

📊 <b>ESTADÍSTICAS DE ESTUDIO:</b>
• <code>/miprogreso</code> - Ver preguntas graduadas
• <code>/estadisticas</code> - Precisión por materia
• <code>/graduadas</code> - Lista de preguntas graduadas
• <code>/reiniciar_graduacion</code> - Reset para repaso intensivo

🔔 <b>CONFIGURACIÓN:</b>
• <code>/configurar_notificaciones</code> - Configurar alertas y recordatorios

📧 <b>NOTIFICACIONES:</b>
• <code>/notificaciones</code> - Configurar notificaciones
• <code>/privadas</code> - Configurar mensajes privados

💰 <b>SUSCRIPCIONES PREMIUM:</b>
• <code>/planes</code> - Ver planes disponibles (Básico €4.99, Premium €9.99)
• <code>/basico</code> - Suscribirse al plan Básico
• <code>/premium</code> - Suscribirse al plan Premium
• <code>/mi_plan</code> - Ver tu suscripción actual
• <code>/cancelar</code> - Cancelar suscripción
• <code>/facturas</code> - Ver historial de pagos

🇪🇸 <b>PAGO SEGURO ESPAÑA:</b>
✅ PayPal (Visa, Mastercard, cuenta PayPal)
✅ Facturación con IVA incluido

💡 <b>¡Responde las preguntas para ganar puntos y subir de nivel!</b>
🏆 Compite con otros usuarios en el ranking
📈 Mantén tu racha diaria para obtener bonificaciones
💎 <b>¡Hazte Premium para funciones avanzadas!</b>`;
}

function formatNotificationHelp(): string {
  return `📬 <b>CONFIGURAR NOTIFICACIONES</b> 📬

🔔 <b>¿CÓMO FUNCIONA?</b>
El bot puede enviarte notificaciones de dos formas:

✅ <b>PRIVADAS (RECOMENDADO)</b>
• Mensajes detallados solo para ti
• Incluyen botones y comandos
• No molestan al grupo
• Más información y opciones

📢 <b>EN GRUPO (FALLBACK)</b>
• Mensajes muy breves en el grupo
• Solo cuando falla la privada
• Máximo 50 caracteres

🔧 <b>CÓMO CONFIGURAR PRIVADAS:</b>
1. Haz clic aquí: @OpoMelillaBot
2. Envía <code>/start</code> al bot
3. ¡Configurado! Ya recibirás notificaciones privadas

💡 <b>¿QUÉ NOTIFICACIONES RECIBES?</b>
🗡️ Duelos recibidos
🏅 Logros desbloqueados
🎯 Metas completadas
📊 Actualizaciones importantes

⚡ <b>¡Es súper fácil!</b> Solo tienes que hablar una vez con el bot privadamente.`;
}

function formatPrivateMessageHelp(): string {
  return `💬 <b>MENSAJES PRIVADOS CON EL BOT</b> 💬

🤔 <b>¿NO SABES CÓMO HABLAR CON UN BOT PRIVADAMENTE?</b>
¡No te preocupes! Te explicamos paso a paso:

📱 <b>MÉTODO 1: DESDE TELEGRAM</b>
1. Abre Telegram
2. Toca en el ícono de búsqueda 🔍
3. Escribe: <code>@OpoMelillaBot</code>
4. Selecciona el bot de la lista
5. Envía <code>/start</code>
6. ¡Listo! 🎉

🔗 <b>MÉTODO 2: DESDE EL GRUPO</b>
1. Toca el nombre del bot: @OpoMelillaBot
2. Esto abrirá su perfil
3. Toca "Enviar mensaje"
4. Envía <code>/start</code>
5. ¡Configurado! ✅

🎯 <b>BENEFICIOS DE LOS MENSAJES PRIVADOS:</b>
• Notificaciones detalladas de duelos
• Información completa de logros
• No spam en el grupo principal
• Comandos y botones interactivos
• Configuración personalizada

❓ <b>¿DUDAS?</b>
¡Es exactamente igual que chatear con un amigo, pero el amigo es un robot! 🤖

💪 Una vez que lo pruebes, ¡verás que es súper fácil!`;
}

function getProgressMessage(stats: any): string {
  const nextLevelPoints = GamificationService.calculateLevel(stats.totalpoints + 1) > stats.level ? 
    getPointsForLevel(stats.level + 1) - stats.totalpoints : 0;
  
  if (nextLevelPoints > 0) {
    return `🎯 Te faltan ${nextLevelPoints} puntos para el siguiente nivel!`;
  }
  
  return '🌟 ¡Has alcanzado un nivel alto! ¡Sigue así!';
}

function getPointsForLevel(level: number): number {
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  if (level <= 10) {
    return levelThresholds[level] || 5500 + (level - 10) * 1000;
  }
  return 5500 + (level - 10) * 1000;
}

function getStreakMotivation(streak: number): string {
  if (streak === 0) {
    return '💪 ¡Empieza tu racha respondiendo una pregunta hoy!';
  } else if (streak < 3) {
    return '🎯 ¡Sigue así! Cada día cuenta para tu racha.';
  } else if (streak < 7) {
    return '🔥 ¡Excelente! Estás construyendo una gran racha.';
  } else if (streak < 30) {
    return '🌟 ¡Increíble! Tu dedicación es admirable.';
  } else {
    return '👑 ¡LEYENDA! Tu racha es épica. ¡Eres imparable!';
  }
}

// Función para obtener logros del usuario
async function getUserAchievements(telegramuserid: string) {
  try {
    const userAchievements = await prisma.userachievement.findMany({
      where: {
        userid: telegramuserid
      },
      orderBy: {
        unlockedat: 'desc'
      }
    });
    
    return userAchievements;
  } catch (error) {
    console.error('Error obteniendo logros del usuario:', error);
    return [];
  }
}

// Función para formatear los logros del usuario
function formatUserAchievements(achievements: any[], userid: string): string {
  if (achievements.length === 0) {
    return `🏆 <b>TUS LOGROS</b> 🏆

❌ Aún no has desbloqueado ningún logro.

💡 <b>CÓMO OBTENER LOGROS:</b>
🎯 Responde preguntas para ganar puntos
🔥 Mantén rachas diarias 
⚡ Responde rápidamente
🎯 Mejora tu precisión

¡Empieza respondiendo preguntas! 🚀`;
  }

  let message = `🏆 <b>TUS LOGROS</b> 🏆\n\n`;
  message += `🎖️ <b>Tienes ${achievements.length} logro${achievements.length === 1 ? '' : 's'} desbloqueado${achievements.length === 1 ? '' : 's'}:</b>\n\n`;
  
  achievements.forEach((userAchievement, index) => {
    const achievement = userAchievement.achievement;
    const rarityEmoji = getRarityEmoji(achievement.rarity);
    const date = new Date(userAchievement.unlockedat).toLocaleDateString();
    
    message += `${achievement.icon} <b>${achievement.name}</b> ${rarityEmoji}\n`;
    message += `   ${achievement.description}\n`;
    message += `   💰 +${achievement.points} pts | 📅 ${date}\n\n`;
  });
  
  // Calcular puntos totales de logros
  const totalAchievementPoints = achievements.reduce((sum, ua) => sum + ua.achievement.points, 0);
  message += `💎 <b>Puntos totales por logros:</b> ${totalAchievementPoints}\n\n`;
  
  message += `🎯 <b>¡Sigue jugando para desbloquear más logros!</b>`;
  
  return message;
}

// Función para obtener emoji de rareza
function getRarityEmoji(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'common': return '⚪';
    case 'uncommon': return '🟢';
    case 'rare': return '🔵';
    case 'epic': return '🟣';
    case 'legendary': return '🟡';
    default: return '⭐';
  }
}

// Función para formatear predicción de nivel
function formatLevelPrediction(stats: any): string {
  const currentLevel = stats.level;
  const currentPoints = stats.totalpoints;
  const nextLevel = currentLevel + 1;
  
  // Calcular puntos necesarios para el siguiente nivel
  const pointsForNextLevel = getPointsForLevel(nextLevel);
  const pointsNeeded = pointsForNextLevel - currentPoints;
  
  // Calcular puntos para el nivel después del siguiente
  const levelAfterNext = nextLevel + 1;
  const pointsForLevelAfterNext = getPointsForLevel(levelAfterNext);
  const pointsNeededForLevelAfterNext = pointsForLevelAfterNext - currentPoints;
  
  // Calcular progreso actual
  const pointsForCurrentLevel = currentLevel === 1 ? 0 : getPointsForLevel(currentLevel);
  const progressInCurrentLevel = currentPoints - pointsForCurrentLevel;
  const totalPointsForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
  const progressPercentage = Math.max(0, Math.min(100, Math.round((progressInCurrentLevel / totalPointsForNextLevel) * 100)));
  
  // Calcular preguntas necesarias (promedio de 15 puntos por pregunta correcta)
  const avgPointsPerQuestion = 15;
  const questionsNeeded = Math.max(1, Math.ceil(pointsNeeded / avgPointsPerQuestion));
  
  // Estimación de tiempo basada en actividad (asumiendo 1 pregunta por día)
  const daysEstimated = questionsNeeded;
  
  // Calcular barra de progreso de forma segura
  const progressBars = Math.max(0, Math.min(10, Math.floor(progressPercentage / 10)));
  const emptyBars = Math.max(0, 10 - progressBars);
  
  return `🔮 <b>PREDICCIÓN DE NIVEL</b> 🔮

${getLevelEmoji(currentLevel)} <b>Nivel actual:</b> ${currentLevel}
📊 <b>Puntos actuales:</b> ${currentPoints}

🎯 <b>PRÓXIMO NIVEL (${nextLevel}):</b>
• 🎯 Puntos necesarios: <b>${Math.max(0, pointsNeeded)}</b>
• 📝 Preguntas estimadas: <b>~${questionsNeeded}</b>
• ⏰ Tiempo estimado: <b>~${daysEstimated} días</b>
• 📈 Progreso: <b>${progressPercentage}%</b>

${'█'.repeat(progressBars)}${'░'.repeat(emptyBars)} ${progressPercentage}%

🚀 <b>NIVEL ${levelAfterNext}:</b>
• 🎯 Puntos necesarios: <b>${Math.max(0, pointsNeededForLevelAfterNext)}</b>
• 📝 Preguntas estimadas: <b>~${Math.ceil(Math.max(0, pointsNeededForLevelAfterNext) / avgPointsPerQuestion)}</b>

💡 <b>CONSEJOS PARA SUBIR MÁS RÁPIDO:</b>
• ⚡ Responde rápido (+5-10 pts extra)
• 🔥 Mantén tu racha diaria
• 🎯 Mejora tu precisión
• 🏆 Desbloquea logros (+pts bonus)

${getLevelPredictionMotivation(Math.max(0, pointsNeeded), questionsNeeded)}`;
}

// Función para obtener mensaje motivacional de predicción
function getLevelPredictionMotivation(pointsNeeded: number, questionsNeeded: number): string {
  if (pointsNeeded <= 50) {
    return '🔥 ¡Estás súper cerca! ¡Solo unas pocas preguntas más!';
  } else if (pointsNeeded <= 100) {
    return '💪 ¡Casi ahí! Con un poco de esfuerzo llegarás pronto.';
  } else if (questionsNeeded <= 10) {
    return '🎯 ¡El siguiente nivel está al alcance! ¡Sigue así!';
  } else if (questionsNeeded <= 20) {
    return '🌟 Con constancia, pronto subirás de nivel. ¡Tú puedes!';
  } else {
    return '🚀 El camino es largo pero cada pregunta te acerca. ¡No te rindas!';
  }
}

// Función para obtener metas del usuario
async function getUserGoals(telegramuserid: string) {
  try {
    const userGoals = await prisma.usergoal.findMany({
      where: {
        userid: telegramuserid
      },
      orderBy: [
        { completed: 'asc' },
        { deadline: 'asc' }
      ]
    });
    
    return userGoals;
  } catch (error) {
    console.error('Error obteniendo metas del usuario:', error);
    return [];
  }
}

// Función para formatear las metas del usuario
function formatUserGoals(goals: any[], userid: string): string {
  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);
  
  if (goals.length === 0) {
    return `🎯 <b>TUS METAS</b> 🎯

❌ No tienes metas establecidas aún.

💡 <b>¿QUÉ SON LAS METAS?</b>
Las metas te ayudan a enfocarte en objetivos específicos y ganar recompensas extra.

🎯 <b>EJEMPLOS DE METAS:</b>
• 📊 Ganar 200 puntos esta semana
• 🔥 Mantener racha de 5 días
• 📝 Responder 20 preguntas este mes
• 🎯 Alcanzar 95% de precisión

🚀 <b>PRÓXIMAMENTE:</b>
¡Podrás crear tus propias metas personalizadas!

¡Mientras tanto, sigue respondiendo preguntas! 💪`;
  }

  let message = `🎯 <b>TUS METAS</b> 🎯\n\n`;

  // Metas activas
  if (activeGoals.length > 0) {
    message += `🔄 <b>METAS ACTIVAS (${activeGoals.length}):</b>\n\n`;
    
    activeGoals.forEach((goal, index) => {
      const progressPercentage = Math.round((goal.current / goal.target) * 100);
      const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const isUrgent = daysLeft <= 1;
      const typeEmoji = getGoalTypeEmoji(goal.type);
      
      // Calcular barra de progreso de forma segura
      const progressBars = Math.max(0, Math.min(10, Math.floor(progressPercentage / 10)));
      const emptyBars = Math.max(0, 10 - progressBars);
      
      message += `${typeEmoji} <b>${getGoalTypeName(goal.type)}</b>\n`;
      message += `📈 Progreso: ${goal.current}/${goal.target} (${progressPercentage}%)\n`;
      message += `${'█'.repeat(progressBars)}${'░'.repeat(emptyBars)} ${progressPercentage}%\n`;
      message += `💰 Recompensa: +${goal.reward} pts\n`;
      message += `⏰ ${isUrgent ? '🚨' : ''} ${daysLeft > 0 ? `${daysLeft} día${daysLeft === 1 ? '' : 's'} restante${daysLeft === 1 ? '' : 's'}` : 'VENCIDA'}\n\n`;
    });
  }

  // Metas completadas (últimas 3)
  if (completedGoals.length > 0) {
    const recentCompleted = completedGoals.slice(-3);
    message += `✅ <b>METAS COMPLETADAS RECIENTES:</b>\n\n`;
    
    recentCompleted.forEach((goal, index) => {
      const typeEmoji = getGoalTypeEmoji(goal.type);
      const completedDate = new Date(goal.deadline).toLocaleDateString();
      
      message += `${typeEmoji} <b>${getGoalTypeName(goal.type)}</b> ✅\n`;
      message += `🏆 ${goal.current}/${goal.target} - ${completedDate}\n`;
      message += `💰 +${goal.reward} pts obtenidos\n\n`;
    });
    
    if (completedGoals.length > 3) {
      message += `<i>...y ${completedGoals.length - 3} más completadas</i>\n\n`;
    }
  }

  // Estadísticas generales
  const totalRewardsEarned = completedGoals.reduce((sum, goal) => sum + goal.reward, 0);
  message += `📊 <b>ESTADÍSTICAS DE METAS:</b>\n`;
  message += `🏆 Completadas: ${completedGoals.length}\n`;
  message += `🔄 Activas: ${activeGoals.length}\n`;
  message += `💎 Puntos ganados: ${totalRewardsEarned}\n\n`;

  message += `🚀 <b>¡Sigue trabajando en tus metas!</b>`;
  
  return message;
}

// Función para obtener emoji del tipo de meta
function getGoalTypeEmoji(type: string): string {
  switch (type.toLowerCase()) {
    case 'daily': return '📅';
    case 'weekly': return '📈';
    case 'monthly': return '🗓️';
    case 'custom': return '🎯';
    default: return '⭐';
  }
}

// Función para obtener nombre del tipo de meta
function getGoalTypeName(type: string): string {
  switch (type.toLowerCase()) {
    case 'daily': return 'Meta Diaria';
    case 'weekly': return 'Meta Semanal';
    case 'monthly': return 'Meta Mensual';
    case 'custom': return 'Meta Personalizada';
    default: return 'Meta';
  }
}

// Nueva función para manejar respuestas de polls
async function handlePollAnswer(pollAnswer: any) {
  try {
    console.log('🗳️  ============ POLL ANSWER RECIBIDO ============');
    console.log('📥 Datos completos del poll_answer:', JSON.stringify(pollAnswer, null, 2));
    console.log('👤 Usuario que responde:', {
      telegramId: pollAnswer.user.id,
      username: pollAnswer.user.username || 'SIN_USERNAME',
      firstname: pollAnswer.user.first_name || 'SIN_NOMBRE',
      lastname: pollAnswer.user.last_name || 'SIN_APELLIDO',
      isBot: pollAnswer.user.is_bot
    });
    console.log('🗳️  Poll details:', {
      pollid: pollAnswer.poll_id,
      selectedOptions: pollAnswer.option_ids,
      optionCount: pollAnswer.option_ids.length
    });

    const user = pollAnswer.user;
    const pollid = pollAnswer.poll_id;
    const selectedOptionIds = pollAnswer.option_ids;
    
    // Un usuario solo puede seleccionar una opción en un quiz
    if (selectedOptionIds.length !== 1) {
      console.log('⚠️  Poll answer ignorado: múltiples opciones seleccionadas');
      console.log('❌ RAZÓN: Usuario seleccionó', selectedOptionIds.length, 'opciones');
      return NextResponse.json({ ok: true, message: 'Poll answer ignorado' });
    }
    
    const selectedOptionId = selectedOptionIds[0];
    console.log('✅ Opción seleccionada válida:', selectedOptionId);
    
    // 🔥 NUEVA FUNCIONALIDAD: VERIFICAR SI ES UNA RESPUESTA DE DUELO
    console.log('🗡️  ======== VERIFICANDO SI ES RESPUESTA DE DUELO ========');
    
    // Intentar procesar como respuesta de duelo PRIMERO
    try {
      const duelProcessed = await DuelManager.processDuelResponse(
        pollid,
        user.id.toString(),  // ✅ CORREGIDO: user.id ES el telegramuserid de Telegram
        selectedOptionId,
        undefined // Tiempo de respuesta se calcula internamente
      );
      
      if (duelProcessed) {
        console.log('⚔️  RESPUESTA DE DUELO PROCESADA EXITOSAMENTE');
        
        return NextResponse.json({ 
          ok: true, 
          type: 'duel_answer_processed',
          processed: true,
          duelResponse: true,
          debug: {
            pollid,
            userid: user.id,
            username: user.username,
            selectedoption: selectedOptionId,
            isDuelResponse: true
          }
        }, { 
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
      } else {
        console.log('ℹ️  No es respuesta de duelo, continuando con procesamiento normal...');
      }
      
    } catch (duelError) {
      console.log('⚠️  Error procesando como duelo (continuando con proceso normal):', duelError);
    }
    
    // 🎯 NUEVA FUNCIONALIDAD: VERIFICAR SI ES UNA RESPUESTA DE SESIÓN DE ESTUDIO
    console.log('🎯 ======== VERIFICANDO SI ES RESPUESTA DE SESIÓN DE ESTUDIO ========');
    
    // Verificar si existe un mapping de sesión de estudio (primero en memoria, luego en BD)
    let studyMapping: { questionid: string; subject: string; timestamp: number } | null = null;
    let isStudyResponse = false;
    
    // 1. Buscar en memoria (legacy)
    if (global.studyPollMappings && global.studyPollMappings.has(pollid)) {
      studyMapping = global.studyPollMappings.get(pollid);
      isStudyResponse = true;
      console.log('🎯 ¡RESPUESTA DE SESIÓN DE ESTUDIO DETECTADA EN MEMORIA!', studyMapping);
    } 
    // 2. Buscar en base de datos (nuevo sistema persistente)
    else {
      try {
        const safePrisma = ensurePrisma();
    const dbMapping = await ensurePrisma().telegrampollmapping.findUnique({
          where: { pollid: pollid }
        });
        
        if (dbMapping) {
          studyMapping = {
            questionid: dbMapping.questionid,
            subject: dbMapping.subject,
            timestamp: dbMapping.createdat.getTime() // Convertir a timestamp para compatibilidad
          };
          isStudyResponse = true;
          console.log('🎯 ¡RESPUESTA DE SESIÓN DE ESTUDIO DETECTADA EN BD!', studyMapping);
        }
      } catch (dbError) {
        console.log('⚠️ Error buscando mapping en BD:', dbError);
      }
    }
    
    if (isStudyResponse && studyMapping) {
      
      try {
        // Calcular tiempo de respuesta (desde cuando se envió el poll)
        const responsetime = Math.floor((Date.now() - studyMapping!.timestamp) / 1000);
        
        // Procesar respuesta de estudio usando el servicio
        console.log('🎯 Procesando respuesta de sesión de estudio...');
        
        // Usar el método processPollAnswer del StudySessionService
        await studySessionService.processPollAnswer(
          pollid,
          user.id.toString(),
          selectedOptionId // Solo una opción seleccionada (Telegram quiz)
        );
        
        // Limpiar mapping después del procesamiento
        if (global.studyPollMappings && global.studyPollMappings.has(pollid)) {
          global.studyPollMappings.delete(pollid);
        } else {
          // Limpiar de la base de datos
          try {
            await prisma.telegrampollmapping.delete({
              where: { pollid: pollid }
            });
            console.log('🧹 Mapping eliminado de la base de datos');
          } catch (deleteError) {
            console.log('⚠️ Error eliminando mapping de BD:', deleteError);
          }
        }
        
        console.log('✅ Respuesta de estudio procesada exitosamente');
        
        return NextResponse.json({ 
          ok: true, 
          type: 'study_answer_processed',
          processed: true,
          debug: {
            pollid,
            userid: user.id,
            username: user.username,
            selectedoption: selectedOptionId,
            isStudyResponse: true,
            responsetime
          }
        }, { 
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
        
      } catch (studyError) {
        console.error('❌ Error procesando sesión de estudio:', studyError);
        // Continuar con procesamiento normal si falla
      }
    }
    
    // 🎯 NUEVA FUNCIONALIDAD: VERIFICAR SI ES UNA RESPUESTA DE SIMULACRO
    console.log('🎯 ======== VERIFICANDO SI ES RESPUESTA DE SIMULACRO ========');
    console.log('🎯 DEBUG - Poll ID recibido:', pollid);
    console.log('🎯 DEBUG - Usuario que responde:', user.id.toString());
    
    // Buscar si es una pregunta de simulacro
    const simulacroQuestionData = await findQuestionByPollId(pollid);
    console.log('🎯 DEBUG - Datos encontrados para poll:', simulacroQuestionData);
    
    // Detectar simulacros 2018, 2024 y MILITARES PREMIUM
    const isSimulacro2018 = simulacroQuestionData && simulacroQuestionData.sourcemodel === 'simulacro';
    const isSimulacro2024 = simulacroQuestionData && simulacroQuestionData.sourcemodel === 'simulacro2024';
    const isSimulacroMilitar = simulacroQuestionData && (
      simulacroQuestionData.sourcemodel === 'military_simulation' ||
      simulacroQuestionData.sourcemodel === 'simulacro_premium_et' ||
      simulacroQuestionData.sourcemodel === 'simulacro_premium_aire' ||
      simulacroQuestionData.sourcemodel === 'simulacro_premium_armada'
    );
    
    if (isSimulacro2018 || isSimulacro2024 || isSimulacroMilitar) {
      const simulacroType = isSimulacroMilitar ? 'MILITAR' : (isSimulacro2024 ? '2024' : '2018');
      console.log(`🎯 ¡RESPUESTA DE SIMULACRO ${simulacroType} DETECTADA!`);
      console.log('📊 Datos de la pregunta de simulacro:', {
        questionid: simulacroQuestionData.questionid,
        sourcemodel: simulacroQuestionData.sourcemodel,
        pollid: pollid,
        type: simulacroType
      });
      
      try {
        if (isSimulacro2024) {
          // Procesar simulacro 2024 de manera simple
          console.log('🎯 Procesando simulacro 2024...');
          
          // Asegurar que prisma esté disponible
          const safePrisma = ensurePrisma();
          
          // Buscar usuario
          const userFound = await ensurePrisma().telegramuser.findUnique({
            where: { telegramuserid: user.id.toString() }
          });


          
          if (!userFound) {
            console.error('❌ Usuario no encontrado');
            throw new Error('Usuario no encontrado');
          }
          
          // Buscar simulacro activo del usuario
          const activeSimulacro = await ensurePrisma().simulacro.findFirst({
            where: {
              userid: userFound.id.toString(),
              status: 'in_progress'
            }
          });
          
          if (!activeSimulacro) {
            console.error('❌ No se encontró simulacro activo');
            throw new Error('Simulacro activo no encontrado');
          }
          
          // Buscar la pregunta del examen 2024
          const question = await ensurePrisma().examenoficial2024.findUnique({
            where: { id: simulacroQuestionData.questionid }
          });
          
          if (!question) {
            console.error('❌ Pregunta del examen 2024 no encontrada');
            throw new Error('Pregunta no encontrada');
          }
          
          // Verificar si es correcta
          const iscorrect = selectedOptionId === question.correctanswerindex;
          const responsetime = Math.floor((Date.now() - simulacroQuestionData.createdat.getTime()) / 1000);
          
          // Buscar la respuesta del simulacro
          const simulacroResponse = await ensurePrisma().simulacroresponse.findFirst({
            where: {
              simulacroid: activeSimulacro.id,
              questionid: simulacroQuestionData.questionid
            }
          });
          
          if (simulacroResponse) {
            // Actualizar la respuesta
            await ensurePrisma().simulacroresponse.update({
              where: { id: simulacroResponse.id },
              data: {
                selectedoption: selectedOptionId,
                iscorrect: iscorrect,
                responsetime: responsetime,
                answeredat: new Date()
              }
            });
          }
          
          // Calcular tiempo restante
          const timeElapsed = Math.floor((Date.now() - activeSimulacro.startedat.getTime()) / 1000);
          const timeRemaining = Math.max(0, 10800 - timeElapsed);
          const hoursRemaining = Math.floor(timeRemaining / 3600);
          const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
          
          // Buscar siguiente pregunta sin responder
          const nextResponse = await ensurePrisma().simulacroresponse.findFirst({
            where: {
              simulacroid: activeSimulacro.id,
              answeredat: null
            },
            orderBy: { questionnumber: 'asc' }
          });
          
          const feedbackMessage = iscorrect ? '✅ ¡Correcto!' : '❌ Incorrecto';
          let responseMessage = `🎯 <b>SIMULACRO 2024 - Pregunta ${question.questionnumber}/100</b>\n\n${feedbackMessage}`;
          
          if (nextResponse) {
            // Hay más preguntas
            const nextQuestion = await ensurePrisma().examenoficial2024.findUnique({
              where: { id: nextResponse.questionid }
            });
            
            if (nextQuestion) {
              responseMessage += '\n\n⏳ Enviando siguiente pregunta...';
              await sendTelegramMessage(userFound.telegramuserid, responseMessage);
              
              // Enviar la siguiente pregunta
              const header = `🎯 SIMULACRO EXAMEN 2024 - Pregunta ${nextQuestion.questionnumber}/100\n⏰ Tiempo restante: ${hoursRemaining}h ${minutesRemaining}m\n\n`;
              const pollQuestion = truncatePollQuestion(header, nextQuestion.question);
              
              // Parsear las opciones desde JSON string
              let parsedOptions: string[];
              try {
                parsedOptions = typeof nextQuestion.options === 'string' 
                  ? cleanMalformedOptionsJSON(nextQuestion.options)
                  : (nextQuestion.options || []);
              } catch (error) {
                console.error('❌ Error parseando opciones de siguiente pregunta 2024:', error);
                await sendTelegramMessage(userFound.telegramuserid, '❌ Error en formato de pregunta. Usa /simulacro_continuar');
                return;
              }

              const nextPollSent = await sendTelegramPoll(
                userFound.telegramuserid,
                pollQuestion,
                parsedOptions,
                nextQuestion.correctanswerindex,
                nextQuestion.id,
                'simulacro2024'
              );
              
              if (nextPollSent) {
                console.log(`✅ Siguiente pregunta 2024 enviada: ${nextQuestion.questionnumber}/100`);
              } else {
                console.error('❌ Error enviando siguiente pregunta del simulacro 2024');
                await sendTelegramMessage(userFound.telegramuserid, '❌ Error enviando siguiente pregunta. Usa /simulacro_continuar');
              }
            }
          } else {
            // Simulacro completado
            
            // Obtener resumen de respuestas correctas e incorrectas
            const simulacroResponses = await ensurePrisma().simulacroresponse.findMany({
              where: { simulacroid: activeSimulacro.id },
              orderBy: { questionnumber: 'asc' }
            });
            
            const correctAnswers = simulacroResponses.filter(r => r.iscorrect).length;
            const incorrectAnswers = simulacroResponses.filter(r => !r.iscorrect).length;
            
            // Obtener números de preguntas incorrectas (máximo 10 para no sobrecargar el mensaje)
            const incorrectQuestions = simulacroResponses
              .filter(r => !r.iscorrect)
              .map(r => r.questionnumber)
              .slice(0, 10);
            
            const incorrectQuestionsText = incorrectQuestions.length > 0 
              ? `\n❌ Preguntas incorrectas: ${incorrectQuestions.join(', ')}${incorrectQuestions.length < incorrectAnswers ? '...' : ''}` 
              : '';
            
            responseMessage += `\n\n🎉 <b>¡SIMULACRO 2024 COMPLETADO!</b>\n\n📊 Resumen:\n✅ Correctas: ${correctAnswers}\n❌ Incorrectas: ${incorrectAnswers}${incorrectQuestionsText}\n\n📋 <code>/simulacro_historial</code> - Ver resultados`;
            
            // Marcar simulacro como completado
            await ensurePrisma().simulacro.update({
              where: { id: activeSimulacro.id },
              data: {
                status: 'completed',
                completedat: new Date()
              }
            });
            
            await sendTelegramMessage(userFound.telegramuserid, responseMessage);
            console.log('🎉 Simulacro 2024 completado');
          }
          
        } else if (isSimulacroMilitar) {
          // =========================================
          // 🎖️ PROCESAR SIMULACRO PERMANENCIA PREMIUM
          // =========================================
          console.log('🎖️ Procesando simulacro militar premium...');
          
          // Buscar usuario
          const safePrisma = ensurePrisma();

    const userFound = await ensurePrisma().telegramuser.findUnique({
            where: { telegramuserid: user.id.toString() }
          });
          
          if (!userFound) {
            console.error('❌ Usuario no encontrado');
            throw new Error('Usuario no encontrado');
          }
          
          // Primero buscar el simulacro activo del usuario
          const activeSimulacro = await ensurePrisma().simulacro.findFirst({
            where: {
              userid: user.id.toString(), // Telegram user ID, así se creó la simulación militar
              status: 'in_progress',
              examtype: {
                in: ['simulacro_premium_et', 'simulacro_premium_aire', 'simulacro_premium_armada']
              }
            }
          });
          
          if (!activeSimulacro) {
            console.error('❌ No se encontró simulacro militar activo');
            throw new Error('Simulacro militar activo no encontrado');
          }
          
          // Extraer número de pregunta del questionid del poll (formato: military-simulationId-questionNumber)
          const questionNumberMatch = simulacroQuestionData.questionid.match(/military-.*-(\d+)$/);
          if (!questionNumberMatch) {
            console.error('❌ Formato de questionid inválido:', simulacroQuestionData.questionid);
            throw new Error('Formato de questionid inválido para simulacro militar');
          }
          
          const questionNumber = parseInt(questionNumberMatch[1]);
          console.log('🔍 Número de pregunta extraído:', questionNumber);
          
          // Buscar la respuesta del simulacro específica del usuario, simulacro y número de pregunta
          const simulacroResponse = await ensurePrisma().simulacroresponse.findFirst({
            where: {
              simulacroid: activeSimulacro.id,
              questionnumber: questionNumber
            }
          });
          
          if (!simulacroResponse) {
            console.error('❌ No se encontró respuesta del simulacro militar para pregunta:', questionNumber);
            throw new Error('Respuesta del simulacro militar no encontrada');
          }
          
          console.log('✅ Simulacro militar activo encontrado:', {
            simulacroid: activeSimulacro.id,
            examtype: activeSimulacro.examtype,
            startedAt: activeSimulacro.startedat
          });
          
          // Calcular tiempo de respuesta
          const responsetime = Math.floor((Date.now() - simulacroQuestionData.createdat.getTime()) / 1000);
          
          console.log('🎖️ Procesando respuesta con MilitarySimulationService...');
          
          // Usar el servicio militar para procesar la respuesta
          const result = await MilitarySimulationService.processAnswer(
            activeSimulacro.id,
            questionNumber,
            selectedOptionId,
            responsetime,
            user.id.toString(),
            pollid
          );
          
          console.log('📊 Resultado del procesamiento militar:', result);
          
          // Enviar mensaje de feedback
          const isCorrect = result.isCorrect;
          const responseMessage = isCorrect 
            ? `✅ <b>¡Correcto!</b>\n\n🎖️ Pregunta ${questionNumber}/100 respondida correctamente`
            : `❌ <b>Incorrecto</b>\n\n🎖️ Pregunta ${questionNumber}/100 - La respuesta correcta era la opción ${simulacroQuestionData.correctanswerindex + 1}`;
          
          if (result.isCompleted) {
            // Simulacro completado
            const finalMessage = responseMessage + '\n\n🎉 <b>¡SIMULACRO PERMANENCIA COMPLETADO!</b>\n\n📋 <code>/simulacro_historial</code> - Ver resultados';
            await sendTelegramMessage(userFound.telegramuserid, finalMessage);
            console.log('🎉 Simulacro militar completado');
          } else if (result.nextQuestionSent) {
            // Siguiente pregunta enviada automáticamente
            await sendTelegramMessage(userFound.telegramuserid, responseMessage + '\n\n⏳ Siguiente pregunta enviada...');
            console.log('📤 Siguiente pregunta militar enviada automáticamente');
          } else {
            // Error enviando siguiente pregunta
            await sendTelegramMessage(userFound.telegramuserid, responseMessage + '\n\n❌ Error enviando siguiente pregunta. Usa <code>/simulacro_continuar</code>');
            console.log('❌ Error enviando siguiente pregunta militar');
          }
        } else {
          // Procesar simulacro 2018 (código existente)
          // Extraer simulacroId y questionnumber del questionid
          // Formato esperado: "simulacro-{simulacroId}-{questionnumber}"
          const match = simulacroQuestionData.questionid.match(/^simulacro-([a-f0-9-]+)-(\d+)$/);
          
          if (!match) {
            console.error('❌ Formato de questionid de simulacro inválido:', simulacroQuestionData.questionid);
            throw new Error('Formato de questionid inválido para simulacro');
          }
          
          const simulacroId = match[1];
          const questionnumber = parseInt(match[2]);
          
          console.log('🎯 Extraídos datos del simulacro 2018:', {
            simulacroId,
            questionnumber,
            selectedoption: selectedOptionId
          });
          
          // Buscar usuario
          const userFound = await ensurePrisma().telegramuser.findUnique({
            where: { telegramuserid: user.id.toString() }
          });
          
          if (!userFound) {
            console.error('❌ Usuario no encontrado');
            throw new Error('Usuario no encontrado');
          }
          
          // Verificar que el usuario tiene este simulacro activo
          const activeSimulacro = await ensurePrisma().simulacro.findFirst({
            where: {
              id: simulacroId,
              status: 'in_progress',
              userid: userFound.id.toString()
            }
          });
          
          if (!activeSimulacro) {
            console.error('❌ No se encontró simulacro activo para este usuario');
            throw new Error('Simulacro no encontrado o no activo');
          }
          
          console.log('✅ Simulacro activo verificado');
          
          // Procesar la respuesta del simulacro
          const { SimulacroService } = await import('../../../../services/simulacroService');
          
          const responsetime = Math.floor((Date.now() - simulacroQuestionData.createdat.getTime()) / 1000);
          
          console.log('🔄 Procesando respuesta de simulacro...');
          const result = await SimulacroService.processAnswer(
            simulacroId,
            questionnumber,
            selectedOptionId,
            responsetime
          );
          
          console.log('✅ Respuesta de simulacro procesada:', {
            isCorrect: result.isCorrect,
            isCompleted: result.isCompleted,
            hasNextQuestion: !!result.nextQuestion
          });
          
          // Enviar mensaje de feedback al usuario
          const feedbackMessage = result.isCorrect ?
            '✅ ¡Correcto!' : 
            '❌ Incorrecto';
          
          let responseMessage = `🎯 <b>SIMULACRO - Pregunta ${questionnumber}/100</b>\n\n${feedbackMessage}`;
          
          if (result.isCompleted) {
            // Simulacro completado
            
            // Obtener resumen de respuestas correctas e incorrectas
            const simulacroResponses = await prisma.simulacroresponse.findMany({
              where: { simulacroid: activeSimulacro.id },
              orderBy: { questionnumber: 'asc' }
            });
            
            const correctAnswers = simulacroResponses.filter(r => r.iscorrect).length;
            const incorrectAnswers = simulacroResponses.filter(r => !r.iscorrect).length;
            
            // Obtener números de preguntas incorrectas (máximo 10 para no sobrecargar el mensaje)
            const incorrectQuestions = simulacroResponses
              .filter(r => !r.iscorrect)
              .map(r => r.questionnumber)
              .slice(0, 10);
            
            const incorrectQuestionsText = incorrectQuestions.length > 0 
              ? `\n❌ Preguntas incorrectas: ${incorrectQuestions.join(', ')}${incorrectQuestions.length < incorrectAnswers ? '...' : ''}` 
              : '';
            
            responseMessage += `\n\n🎉 <b>¡SIMULACRO COMPLETADO!</b>\n\n📊 Resumen:\n✅ Correctas: ${correctAnswers}\n❌ Incorrectas: ${incorrectAnswers}${incorrectQuestionsText}\n\n📋 <code>/simulacro_historial</code> - Ver resultados`;
            
            await sendTelegramMessage(userFound.telegramuserid, responseMessage);
            
            console.log('🎉 Simulacro completado, mensaje enviado');
          } else if (result.nextQuestion) {
            // Enviar siguiente pregunta
            responseMessage += '\n\n⏳ Enviando siguiente pregunta...';
            
            await sendTelegramMessage(userFound.telegramuserid, responseMessage);
            
            // Enviar la siguiente pregunta
            const timeElapsed = Math.floor((Date.now() - activeSimulacro.startedat.getTime()) / 1000);
            const timeRemaining = Math.max(0, 10800 - timeElapsed);
            const hoursRemaining = Math.floor(timeRemaining / 3600);
            const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
            
            const header = `🎯 SIMULACRO ${result.nextQuestion.questionnumber}/100 ⏱️${hoursRemaining}h${minutesRemaining}m\n\n`;
            const pollQuestion = truncatePollQuestion(header, result.nextQuestion.question);
            
            // Parsear las opciones desde JSON string
            let parsedOptions: string[];
            try {
              parsedOptions = typeof result.nextQuestion.options === 'string' 
                ? cleanMalformedOptionsJSON(result.nextQuestion.options)
                : result.nextQuestion.options;
            } catch (error) {
              console.error('❌ Error parseando opciones de siguiente pregunta simulacro:', error);
              await sendTelegramMessage(userFound.telegramuserid, '❌ Error en formato de pregunta. Usa /simulacro_continuar');
              return;
            }

            const nextPollSent = await sendTelegramPoll(
              userFound.telegramuserid,
              pollQuestion,
              parsedOptions,
              result.nextQuestion.correctAnswerIndex,
              `simulacro-${simulacroId}-${result.nextQuestion.questionnumber}`,
              'simulacro'
            );
            
            if (nextPollSent) {
              console.log(`✅ Siguiente pregunta enviada: ${result.nextQuestion.questionnumber}/100`);
            } else {
              console.error('❌ Error enviando siguiente pregunta del simulacro');
              await sendTelegramMessage(userFound.telegramuserid, '❌ Error enviando siguiente pregunta. Usa /simulacro_continuar');
            }
          } else {
            // Caso inesperado: ni completado ni hay siguiente pregunta
            console.error('⚠️ CASO INESPERADO: Simulacro no está completado pero no hay siguiente pregunta');
            responseMessage += '\n\n⚠️ Estado del simulacro inesperado. Usa <code>/simulacro_continuar</code>';
            await sendTelegramMessage(userFound.telegramuserid, responseMessage);
          }
        }
        
        // ✅ ELIMINAR POLL DESPUÉS DE PROCESARLO EXITOSAMENTE
        try {
          await ensurePrisma().telegrampoll.delete({
            where: { pollid: pollid }
          });
          console.log('✅ Poll de simulacro eliminado exitosamente:', pollid);
        } catch (deleteError) {
          console.error('⚠️ Error eliminando poll (no crítico):', deleteError);
        }
        
      } catch (simulacroError) {
        console.error('❌ Error procesando respuesta de simulacro:', simulacroError);
        
        // ❌ ELIMINAR POLL TAMBIÉN EN CASO DE ERROR PARA EVITAR REPETICIONES
        try {
          await ensurePrisma().telegrampoll.delete({
            where: { pollid: pollid }
          });
          console.log('✅ Poll de simulacro eliminado después de error:', pollid);
        } catch (deleteError) {
          console.error('⚠️ Error eliminando poll después de error:', deleteError);
        }
        
        // Enviar mensaje de error al usuario
        await sendTelegramMessage(user.id, 
          '❌ <b>Error procesando respuesta de simulacro</b>\n\nUsa <code>/simulacro_continuar</code> para continuar.'
        );
        
        return NextResponse.json({ 
          ok: false, 
          error: 'Error procesando respuesta de simulacro',
          details: simulacroError instanceof Error ? simulacroError.message : 'Unknown error'
        }, { status: 500, headers: {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
      }
    }
    
    // Si no es duelo ni simulacro, continuar con procesamiento normal de pregunta regular
    console.log('📚 ======== PROCESANDO COMO PREGUNTA REGULAR ========');
    
    // Buscar la pregunta relacionada con este poll
    console.log('🔍 Buscando información de la pregunta...');
    const questionData = await findQuestionByPollId(pollid);
    
    if (!questionData) {
      console.log('❌ ERROR CRÍTICO: No se encontró pregunta para poll ID:', pollid);
      console.log('🔍 Este puede ser el problema principal');
      return NextResponse.json({ ok: true, message: 'Pregunta no encontrada' }, { 
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
    }
    
    console.log('✅ Pregunta encontrada:', {
      questionid: questionData.questionid,
      correctanswerindex: questionData.correctanswerindex,
      createdat: questionData.createdat,
      chatid: questionData.chatid,
      sourcemodel: questionData.sourcemodel
    });
    
    // Determinar si la respuesta es correcta
    const iscorrect = selectedOptionId === questionData.correctanswerindex;
    
    console.log('📊 Evaluando respuesta:', {
      questionid: questionData.questionid,
      selectedoption: selectedOptionId,
      correctOption: questionData.correctanswerindex,
      iscorrect: iscorrect ? '✅ CORRECTA' : '❌ INCORRECTA'
    });
    
    // Calcular tiempo de respuesta (diferencia entre envío del poll y respuesta)
    const responsetime = Math.floor((Date.now() - questionData.createdat.getTime()) / 1000);
    console.log('⏱️  Tiempo de respuesta:', responsetime, 'segundos');
    
    // Preparar datos para GamificationService
    const gamificationData = {
      telegramuserid: user.id.toString(),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      questionid: questionData.questionid,
      telegramMsgId: pollid, // Usamos pollid como identificador
      iscorrect: iscorrect,
      responsetime: responsetime
    };
    
    console.log('🎮 Enviando datos a GamificationService:', gamificationData);
    
    // Procesar respuesta con sistema de gamificación
    const userStats = await GamificationService.processUserResponse(gamificationData);
    
    console.log('✅ GamificationService procesó la respuesta:', {
      telegramuserid: userStats.telegramuserid,
      username: userStats.username,
      firstname: userStats.firstName,
      totalpoints: userStats.totalpoints,
      level: userStats.level,
      streak: userStats.streak,
      accuracy: userStats.accuracy,
      rank: userStats.rank
    });

    // 🎯 NUEVA FUNCIONALIDAD: FEEDBACK INMEDIATO CON PUNTOS GANADOS
    const pointsEarned = calculatePointsEarned(iscorrect, responsetime);
    const feedbackMessage = generateImmediateFeedback(userStats, iscorrect, pointsEarned, responsetime);
    
    // 🚨 DESHABILITADO: Ya no enviamos mensajes privados porque el quiz de Telegram muestra automáticamente si es correcto
    // Enviar feedback inmediato al usuario
    // await sendTelegramMessage(user.id, feedbackMessage);
    console.log('📤 Feedback NO enviado (quiz automático):', feedbackMessage.substring(0, 100) + '...');

    // Generar mensaje de respuesta personalizado  
    console.log('💬 Sistema inteligente: procesando respuesta de quiz...');
    
    // Datos temporales para la respuesta legacy (sistema principal está en poll answers)
    const tempQuestionData = {
      questionid: questionData.questionid,
      correctanswerindex: questionData.correctanswerindex,
      createdat: questionData.createdat,
      chatid: questionData.chatid
    };
    
    // 🚨 DESHABILITADO: Ya no enviamos mensajes inteligentes porque el quiz es automático
    // Usar sistema inteligente para enviar respuesta de quiz
    /* const quizResult = await NotificationService.sendIntelligentQuizResponse(
      userStats,
      iscorrect: iscorrect,
      tempQuestionData,
      {
        telegramuserid: user.id.toString(),
        firstName: user.first_name,
        username: user.username
      },
      questionData.chatid.toString()
    ); */
    
    const quizResult = { method: 'none', message: 'Quiz automático - no se envían mensajes adicionales' };
    
    console.log('📤 Resultado sistema inteligente quiz:', quizResult.method, '|', quizResult.message);

    console.log('🎉 ============ POLL ANSWER PROCESADO EXITOSAMENTE ============');
    console.log('📈 Resumen final:', {
      usuario: `${user.first_name} (@${user.username || 'sin_username'})`,
      telegramId: user.id,
      questionid: questionData.questionid,
      respuestaCorrecta: iscorrect,
      tiempoRespuesta: responsetime,
      puntosNuevos: userStats.totalpoints,
      nivel: userStats.level,
      mensajeEnviado: quizResult.method === 'private'
    });

    return NextResponse.json({ 
      ok: true, 
      type: 'poll_answer_processed',
      processed: true,
      userStats,
      debug: {
        pollid,
        userid: user.id,
        username: user.username,
        iscorrect: iscorrect,
        responsetime: responsetime,
        messageSent: quizResult.method === 'private',
        isDuelResponse: false
      }
    }, { 
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});

  } catch (error) {
    console.error('❌ ============ ERROR EN POLL ANSWER ============');
    console.error('💥 Error completo:', error);
    console.error('📊 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('📥 Poll answer data:', JSON.stringify(pollAnswer, null, 2));
    
    return NextResponse.json({ 
      ok: false, 
      error: 'Error procesando poll answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500, headers: {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
  }
}

// Función para buscar pregunta por Poll ID
async function findQuestionByPollId(pollid: string) {
  try {
    console.log('🔍 Buscando pregunta para poll ID:', pollid);
    
    const safePrisma = ensurePrisma();
    
    // Buscar primero en la tabla de mapeo de polls normales
    const pollMapping = await ensurePrisma().telegrampoll.findUnique({
      where: { pollid: pollid }
    });
    
    if (pollMapping) {
      console.log('✅ Mapeo encontrado en TelegramPoll:', {
        questionid: pollMapping.questionid,
        correctanswerindex: pollMapping.correctanswerindex,
        sourcemodel: pollMapping.sourcemodel,
        chatid: pollMapping.chatid,
        createdat: pollMapping.createdat
      });
      
      return {
        questionid: pollMapping.questionid,
        correctanswerindex: pollMapping.correctanswerindex,
        sourcemodel: pollMapping.sourcemodel,
        chatid: pollMapping.chatid,
        createdat: pollMapping.createdat,
        subject: 'general' // Default para polls normales
      };
    }
    
    // Si no se encuentra, buscar en la tabla de mapeo de sesiones de estudio
    const studyMapping = await ensurePrisma().telegrampollmapping.findUnique({
      where: { pollid: pollid }
    });
    
    if (studyMapping) {
      console.log('✅ Mapeo encontrado en TelegramPollMapping:', {
        questionid: studyMapping.questionid,
        subject: studyMapping.subject,
        createdat: studyMapping.createdat
      });
      
      // 🔧 FIX: Obtener el correctanswerindex real de la pregunta
      let correctanswerindex = 0;
      try {
        // Mapeo de subjects a nombres de tabla
        const TABLE_MAPPING: Record<string, string> = {
          'constitucion': 'constitucion',
          'defensanacional': 'defensanacional',
          'aire': 'aire',
          'rjsp': 'rio',
          'rio': 'rio',
          'tropa': 'tropamarineria',
          'rroo': 'rroo',
          'seguridadnacional': 'seguridadnacional',
          'ue': 'ue',
          'proteccioncivil': 'proteccioncivil',
          'armada': 'armada',
          'carrera': 'carrera',
          'derechosydeberes': 'derechosydeberes',
          'regimendisciplinario': 'regimendisciplinario',
          'igualdad': 'igualdad',
          'minsdef': 'minsdef',
          'organizacionfas': 'organizacionfas',
          'emad': 'emad',
          'et': 'et',
          'iniciativasyquejas': 'iniciativasyquejas',
          'omi': 'omi',
          'pac': 'pac',
          'pdc': 'pdc',
          'onu': 'onu',
          'otan': 'otan',
          'osce': 'osce',
          'misiones': 'misionesinternacionales'
        };
        
        if (studyMapping.subject === 'all') {
          // Para subject 'all', buscar en todas las tablas
          for (const [tableSubject, tableName] of Object.entries(TABLE_MAPPING)) {
            try {
              const query = `SELECT correctanswerindex FROM ${tableName} WHERE id = ?`;
              const result = await ensurePrisma().$queryRawUnsafe(query, studyMapping.questionid);
              const questions = result as any[];
              
              if (questions.length > 0) {
                correctanswerindex = questions[0].correctanswerindex;
                console.log(`✅ correctanswerindex encontrado: ${correctanswerindex} en tabla ${tableName}`);
                break;
              }
            } catch (tableError) {
              continue; // Continuar con la siguiente tabla
            }
          }
        } else {
          // Para subjects específicos
          const tableName = TABLE_MAPPING[studyMapping.subject];
          if (tableName) {
            const query = `SELECT correctanswerindex FROM ${tableName} WHERE id = ?`;
            const result = await ensurePrisma().$queryRawUnsafe(query, studyMapping.questionid);
            const questions = result as any[];
            
            if (questions.length > 0) {
              correctanswerindex = questions[0].correctanswerindex;
              console.log(`✅ correctanswerindex encontrado: ${correctanswerindex} en tabla ${tableName}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error obteniendo correctanswerindex:', error);
        correctanswerindex = 0; // Fallback
      }
      
      return {
        questionid: studyMapping.questionid,
        subject: studyMapping.subject,
        createdat: studyMapping.createdat,
        correctanswerindex: correctanswerindex, // 🔧 FIX: Usar el valor real
        sourcemodel: 'study_session',
        chatid: '0' // Default para sesiones de estudio
      };
    }
    
    console.log('❌ No se encontró mapeo para poll ID:', pollid);
    return null;
    
  } catch (error) {
    console.error('❌ Error buscando pregunta por poll ID:', error);
    return null;
  }
}

// Función para formatear respuesta personalizada de poll
function formatPollResponseMessage(stats: any, iscorrect: boolean, questionData: any): string {
  const correctEmoji = iscorrect ? '✅' : '❌';
  const levelEmoji = getLevelEmoji(stats.level);
  
  const baseMessage = `${correctEmoji} ${iscorrect ? '¡Correcto!' : 'Incorrecto'}

🏆 <b>Tus estadísticas actualizadas:</b>
📊 Puntos: ${stats.totalpoints}
${levelEmoji} Nivel: ${stats.level}
🔥 Racha: ${stats.streak} días
🎯 Precisión: ${stats.accuracy}%
📈 Ranking: #${stats.rank}

${getMotivationalMessage(stats, iscorrect)}`;

  return baseMessage;
}

// Función para manejar comando de duelo
async function handleDuelCommand(command: string, userid: string, fromtelegramuser: any, chatid: number): Promise<string | null> {
  try {
    console.log('🗡️ DUELO COMMAND - Iniciando:', {
      command,
      userid,
      fromtelegramuser: fromtelegramuser.first_name || fromtelegramuser.username
    });
    
    const parts = command.trim().split(' ');
    console.log('🗡️ DUELO COMMAND - Partes del comando:', parts);
    
    if (parts.length < 2) {
      console.log('🗡️ DUELO COMMAND - Formato incorrecto, devolviendo ayuda');
      return `🗡️ <b>COMANDO DUELO</b> 🗡️

❌ Formato incorrecto. Uso:
<code>/duelo @usuario</code>
<code>/duelo nombre</code>

🎯 <b>EJEMPLOS:</b>
<code>/duelo @juan_estudiante</code>
<code>/duelo Carlos</code>
<code>/duelo Luis</code>

🎮 <b>TIPOS DE DUELO:</b>
🗡️ <b>Estándar</b> - 5 preguntas, 5 min
⚡ <b>Velocidad</b> - 3 preguntas, 2 min  
🎯 <b>Precisión</b> - 7 preguntas, 10 min

¡Reta a tus amigos y demuestra quién sabe más! 💪`;
    }
    
    const targetIdentifier = parts.slice(1).join(' ');
    console.log('🗡️ DUELO COMMAND - Buscando usuario:', targetIdentifier);
    
    // Buscar usuario objetivo
    const targetUser = await DuelService.findUserByIdentifier(targetIdentifier);
    console.log('🗡️ DUELO COMMAND - Usuario encontrado:', targetUser ? 'Sí' : 'No', targetUser);
    
    if (!targetUser) {
      console.log('🗡️ DUELO COMMAND - Usuario no encontrado, devolviendo error');
      return `❌ <b>Usuario no encontrado</b>

🔍 <b>No se encontró ningún usuario con:</b>
"<i>${targetIdentifier}</i>"

💡 <b>POSIBLES CAUSAS:</b>
🤖 El usuario no ha iniciado el bot con <code>/start</code>
📝 El @username no es exacto
🔤 El nombre no coincide

🔧 <b>SOLUCIONES:</b>
1️⃣ Pide al usuario que busque <code>@OpoMelillaBot</code> y haga <code>/start</code>
2️⃣ Verifica el @username exacto en su perfil
3️⃣ Prueba con su nombre de pila

🎯 <b>EJEMPLO CORRECTO:</b>
<code>/duelo @juan_estudiante</code>
<code>/duelo Carlos</code>

⚠️ <b>IMPORTANTE:</b> Todos los usuarios deben iniciar el bot antes de poder participar en duelos.`;
    }
    
    if (targetUser.telegramuserid === userid) {
      console.log('🗡️ DUELO COMMAND - Usuario se retó a sí mismo');
      return `🤔 <b>¡No puedes retarte a ti mismo!</b>

😅 Eso sería un poco extraño, ¿no crees?

🎯 <b>En su lugar, puedes:</b>
• Retar a un amigo: <code>/duelo @amigo</code>
• Ver el ranking: <code>/ranking</code>
• Practicar solo respondiendo preguntas normales

¡Busca un oponente digno! 🗡️`;
    }
    
    console.log('🗡️ DUELO COMMAND - Creando duelo...');
    // Crear duelo
    const duel = await DuelService.createDuel({
      challengerTelegramId: userid,
      challengedTelegramId: targetUser.telegramuserid,
      type: 'standard' // Por defecto estándar
    });
    
    console.log('🗡️ DUELO COMMAND - Duelo creado:', duel ? 'Sí' : 'No', duel?.id);
    
    if (!duel) {
      console.log('🗡️ DUELO COMMAND - No se pudo crear duelo');
      
      // Verificar específicamente si el usuario retado existe en la base de datos
      const challengedUserExists = await ensurePrisma().telegramuser.findUnique({
        where: { telegramuserid: targetUser.telegramuserid }
      });
      
      if (!challengedUserExists) {
        // El usuario retado no ha hecho /start con el bot
        return `❌ <b>No se puede crear el duelo</b>

🤖 <b>PROBLEMA:</b> <b>${targetUser.firstname || targetUser.username || 'El usuario'}</b> aún no ha iniciado el bot

🔧 <b>SOLUCIÓN:</b>
@${targetUser.username || targetUser.firstname || 'usuario'}, necesitas:

1️⃣ Buscar <code>@OpoMelillaBot</code> en Telegram
2️⃣ Hacer clic en <b>INICIAR</b> o enviar <code>/start</code>
3️⃣ ¡Listo! Ya podrás participar en duelos

💡 <b>¿Por qué es necesario?</b>
• Para recibir preguntas por privado (sin spam al grupo)
• Para gestionar tu puntuación y estadísticas
• Para enviar/recibir notificaciones de duelos

⚡ Una vez hecho esto, el duelo se podrá crear normalmente.`;
      }
      
      // Otros errores posibles
      return `❌ <b>No se pudo crear el duelo</b>

🔍 <b>Posibles causas:</b>
• Ya hay un duelo pendiente entre ustedes
• El usuario retado no tiene puntos suficientes
• El usuario no ha iniciado el bot con /start
• Error temporal del sistema

🔧 <b>Soluciones:</b>
• Espera a que termine el duelo actual
• Verifica que ambos tengan puntos suficientes
• Pide al usuario que busque @OpoMelillaBot y haga /start
• Inténtalo de nuevo en unos minutos

📱 Usa <code>/duelos</code> para ver duelos pendientes`;
    }
    
    // Enviar notificación inteligente al usuario retado
    const targetName = targetUser.firstname || targetUser.username || 'Usuario';
    const challengerName = fromtelegramuser.first_name || fromtelegramuser.username || 'Retador';
    
    console.log('🗡️ DUELO COMMAND - Enviando notificación inteligente para:', targetName);
    
    // Datos para la notificación
    const notificationData = {
      id: duel.id,
      challenger: {
        firstname: challengerName,
        telegramuserid: userid
      },
      challenged: {
        firstname: targetName,
        telegramuserid: targetUser.telegramuserid
      },
      type: 'Estándar',
      questionscount: duel.questionscount,
      timelimit: duel.timelimit,
      stake: duel.stake,
      expiresAt: duel.expiresAt
    };
    
    // Usar sistema inteligente de notificaciones
    const notificationResult = await NotificationService.sendIntelligentNotification(
      'duel',
      {
        telegramuserid: targetUser.telegramuserid,
        firstName: targetUser.firstName
      },
      notificationData,
      chatid.toString()
    );
    
    console.log('🗡️ DUELO COMMAND - Resultado notificación:', notificationResult.method);
    
    // Preparar respuesta basada en el resultado de la notificación
    let responseMessage = `🗡️ <b>¡DUELO ENVIADO!</b> ⚔️

🎯 Has retado a <b>${targetName}</b> a un duelo

📋 <b>DETALLES:</b>
🗡️ Tipo: Estándar  
📝 Preguntas: ${duel.questionscount}
⏱️ Tiempo: ${Math.floor(duel.timelimit / 60)} min
💰 En juego: ${duel.stake} pts
⏰ Expira: ${duel.expiresAt.toLocaleTimeString()}

`;

    // Mensaje adaptado según el método de notificación
    if (notificationResult.method === 'private') {
      responseMessage += `✅ <b>NOTIFICACIÓN PRIVADA ENVIADA</b>
${targetName} ha recibido una notificación privada detallada del bot.

⏳ <b>Ahora hay que esperar...</b>
El duelo expira en 30 minutos si no es aceptado.`;
    } 
    else if (notificationResult.method === 'group') {
      responseMessage += `📢 <b>NOTIFICACIÓN EN GRUPO</b>
Se envió una notificación breve en el grupo.

💡 <b>TIP PARA ${targetName}:</b>
Para recibir notificaciones privadas detalladas:
1. Busca <code>@OpoMelillaBot</code> en Telegram
2. Envía <code>/start</code> al bot
3. ¡Listo! Futuras notificaciones serán privadas

⏳ El duelo expira en 30 minutos si no es aceptado.`;
    }
    else {
      responseMessage += `⚠️ <b>NOTIFICACIÓN NO ENVIADA</b>
No se pudo notificar automáticamente a ${targetName}.

📣 <b>AVÍSALE MANUALMENTE:</b>
"¡Te he retado a un duelo! Usa <code>/duelos</code> para verlo"

💡 <b>TIP PARA ${targetName}:</b>
Para recibir notificaciones automáticas:
1. Busca <code>@OpoMelillaBot</code> en Telegram  
2. Envía <code>/start</code> al bot
3. ¡Configurado!

⏳ El duelo expira en 30 minutos si no es aceptado.`;
    }
    
    responseMessage += `

🎮 Usa <code>/duelos</code> para ver el estado`;

    console.log('🗡️ DUELO COMMAND - Respuesta preparada');
    return responseMessage;
    
  } catch (error) {
    console.error('🗡️ DUELO COMMAND - Error general:', error);
    return `❌ <b>Error inesperado</b>

Hubo un problema al procesar tu duelo. 
Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar aceptar duelo
async function handleAcceptDuel(command: string, userid: string): Promise<string | null> {
  try {
    const parts = command.trim().split(' ');
    
    if (parts.length < 2) {
      const pendingDuels = await DuelService.getPendingDuels(userid);
      
      if (pendingDuels.length === 0) {
        return `✅ <b>ACEPTAR DUELO</b>

❌ No tienes duelos pendientes para aceptar.

🎯 <b>¿QUÉ PUEDES HACER?</b>
• Retar a alguien: <code>/duelo @usuario</code>
• Ver tus duelos: <code>/duelos</code>
• Esperar a que te reten

🗡️ ¡Los duelos están esperándote!`;
      }
      
      let message = `✅ <b>ACEPTAR DUELO</b>

🎯 <b>Tienes ${pendingDuels.length} duelo${pendingDuels.length === 1 ? '' : 's'} pendiente${pendingDuels.length === 1 ? '' : 's'}:</b>

`;
      
      pendingDuels.slice(0, 3).forEach((duel, index) => {
        const challenger = duel.challenger.firstName || duel.challenger.username || 'Usuario';
        message += `🗡️ <b>${index + 1}.</b> ${challenger} te retó\n`;
        message += `   📝 ${duel.questionscount} preguntas | ⏱️ ${Math.floor(duel.timelimit / 60)} min\n`;
        message += `   💰 ${duel.stake} pts | 🆔 ${duel.id}\n\n`;
      });
      
      if (pendingDuels.length > 3) {
        message += `<i>...y ${pendingDuels.length - 3} más</i>\n\n`;
      }
      
      message += `⚡ <b>USAR:</b>
<code>/aceptar ${pendingDuels[0].id}</code> - Aceptar duelo específico
<code>/rechazar ${pendingDuels[0].id}</code> - Rechazar duelo específico

💡 <b>TIP:</b> Usa el ID del duelo que quieres aceptar/rechazar`;
      
      return message;
    }
    
    const duelId = parts[1];
    const result = await DuelService.acceptDuel(duelId, userid);
    
    if (!result) {
      return `❌ <b>No se pudo aceptar el duelo</b>

🔍 <b>Posibles causas:</b>
• El ID del duelo es incorrecto
• El duelo ya no está pendiente
• Ha expirado (30 min límite)
• Solo el retado puede aceptar

Usa <code>/duelos</code> para ver tus duelos actuales.`;
    }
    
    return `⚔️ <b>¡DUELO ACEPTADO!</b> ⚔️

🎯 Has aceptado el duelo de <b>${result.challenger.firstName}</b>

🎮 <b>¡QUE COMIENCE LA BATALLA!</b>
El duelo iniciará en breve...

📊 <b>DETALLES:</b>
🗡️ Tipo: ${result.type}
📝 Preguntas: ${result.questionscount}
⏱️ Tiempo: ${Math.floor(result.timelimit / 60)} min
💰 En juego: ${result.stake} pts

🔥 ¡Buena suerte!`;
    
  } catch (error) {
    console.error('Error manejando aceptar duelo:', error);
    return `❌ <b>Error inesperado</b>

Hubo un problema al aceptar el duelo.
Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar rechazar duelo
async function handleRejectDuel(command: string, userid: string): Promise<string | null> {
  try {
    const parts = command.trim().split(' ');
    
    if (parts.length < 2) {
      const pendingDuels = await DuelService.getPendingDuels(userid);
      
      if (pendingDuels.length === 0) {
        return `❌ <b>RECHAZAR DUELO</b>

❌ No tienes duelos pendientes para rechazar.

🎯 <b>¿QUÉ PUEDES HACER?</b>
• Retar a alguien: <code>/duelo @usuario</code>
• Ver tus duelos: <code>/duelos</code>
• Esperar a que te reten

🗡️ ¡Los duelos están esperándote!`;
      }
      
      let message = `❌ <b>RECHAZAR DUELO</b>

🎯 <b>Tienes ${pendingDuels.length} duelo${pendingDuels.length === 1 ? '' : 's'} pendiente${pendingDuels.length === 1 ? '' : 's'}:</b>

`;
      
      pendingDuels.slice(0, 3).forEach((duel, index) => {
        const challenger = duel.challenger.firstName || duel.challenger.username || 'Usuario';
        message += `🗡️ <b>${index + 1}.</b> ${challenger} te retó\n`;
        message += `   📝 ${duel.questionscount} preguntas | ⏱️ ${Math.floor(duel.timelimit / 60)} min\n`;
        message += `   💰 ${duel.stake} pts | 🆔 ${duel.id}\n\n`;
      });
      
      if (pendingDuels.length > 3) {
        message += `<i>...y ${pendingDuels.length - 3} más</i>\n\n`;
      }
      
      message += `⚡ <b>USAR:</b>
<code>/rechazar ${pendingDuels[0].id}</code> - Rechazar duelo específico
<code>/aceptar ${pendingDuels[0].id}</code> - Aceptar duelo específico

💡 <b>TIP:</b> Usa el ID del duelo que quieres rechazar`;
      
      return message;
    }
    
    const duelId = parts[1];
    const success = await DuelService.rejectDuel(duelId, userid);
    
    if (!success) {
      return `❌ <b>No se pudo rechazar el duelo</b>

🔍 <b>Posibles causas:</b>
• El ID del duelo es incorrecto
• El duelo ya no está pendiente
• Ha expirado
• Solo el retado puede rechazar

Usa <code>/duelos</code> para ver tus duelos actuales.`;
    }
    
    // Para obtener información del duelo rechazado, buscamos en los duelos del usuario
    const userDuels = await DuelService.getUserDuels(userid);
    const rejectedDuel = userDuels.find(d => d.id === duelId);
    const challengerName = rejectedDuel?.challenger?.firstName || 'Usuario';
    
    return `❌ <b>DUELO RECHAZADO</b>

Has rechazado el duelo de <b>${challengerName}</b>

💭 <b>Decisión respetada</b>
No todos los duelos deben ser aceptados.

🎯 <b>ALTERNATIVAS:</b>
• Practica con preguntas normales
• Reta tú a otros usuarios: <code>/duelo @usuario</code>
• Ve el ranking: <code>/ranking</code>

¡Siempre habrá más oportunidades! 💪`;
    
  } catch (error) {
    console.error('Error manejando rechazar duelo:', error);
    return `❌ <b>Error inesperado</b>

Hubo un problema al rechazar el duelo.
Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para formatear duelos del usuario
function formatUserDuels(duels: any[], userid: string): string {
  if (duels.length === 0) {
    return `🗡️ <b>TUS DUELOS</b> 🗡️

❌ No tienes duelos activos.

🎯 <b>¿QUIERES ACCIÓN?</b>
• Reta a alguien: <code>/duelo @usuario</code>
• Ve el ranking: <code>/ranking</code>
• Practica con preguntas normales

¡Los duelos te están esperando! ⚔️`;
  }

  const pending = duels.filter(d => d.status === 'pending');
  const active = duels.filter(d => d.status === 'active');
  const completed = duels.filter(d => d.status === 'completed');

  let message = `🗡️ <b>TUS DUELOS</b> 🗡️\n\n`;

  // Duelos pendientes
  if (pending.length > 0) {
    message += `⏳ <b>PENDIENTES (${pending.length}):</b>\n\n`;
    pending.slice(0, 3).forEach((duel, index) => {
      const opponent = duel.challengerTelegramId === userid ? 
        (duel.challenged.firstname || duel.challenged.username) :
        (duel.challenger.firstName || duel.challenger.username);
      const isChallenger = duel.challengerTelegramId === userid;
      
      message += `🗡️ <b>${index + 1}.</b> ${isChallenger ? 'Retaste a' : 'Te retó'} ${opponent}\n`;
      message += `   📝 ${duel.questionscount} preguntas | ⏱️ ${Math.floor(duel.timelimit / 60)} min\n`;
      message += `   💰 ${duel.stake} pts | 🆔 ${duel.id}\n`;
      
      if (!isChallenger) {
        message += `   ⚡ <code>/aceptar ${duel.id}</code> | <code>/rechazar ${duel.id}</code>\n`;
      }
      message += '\n';
    });
  }

  // Duelos activos
  if (active.length > 0) {
    message += `🔥 <b>ACTIVOS (${active.length}):</b>\n\n`;
    active.slice(0, 2).forEach((duel, index) => {
      const opponent = duel.challengerTelegramId === userid ? 
        (duel.challenged.firstname || duel.challenged.username) :
        (duel.challenger.firstName || duel.challenger.username);
      
      message += `⚔️ <b>${index + 1}.</b> VS ${opponent}\n`;
      message += `   🎯 En progreso...\n`;
      message += `   💰 ${duel.stake} pts en juego\n\n`;
    });
  }

  // Duelos recientes completados
  if (completed.length > 0) {
    message += `✅ <b>RECIENTES (${Math.min(completed.length, 2)}):</b>\n\n`;
    completed.slice(-2).forEach((duel, index) => {
      const opponent = duel.challengerTelegramId === userid ? 
        (duel.challenged.firstname || duel.challenged.username) :
        (duel.challenger.firstName || duel.challenger.username);
      const won = duel.winnerId === userid;
      
      message += `${won ? '🏆' : '💀'} VS ${opponent} - ${won ? 'GANASTE' : 'PERDISTE'}\n`;
      message += `   💰 ${won ? '+' : '-'}${duel.stake} pts\n\n`;
    });
  }

  // Estadísticas generales
  const wins = completed.filter(d => d.winnerId === userid).length;
  const losses = completed.filter(d => d.winnerId && d.winnerId !== userid).length;
  const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;

  message += `📊 <b>ESTADÍSTICAS:</b>\n`;
  message += `🏆 Ganados: ${wins} | 💀 Perdidos: ${losses}\n`;
  message += `📈 Tasa de victoria: ${winRate}%\n\n`;

  message += `🎮 <code>/duelo @usuario</code> para retar`;

  return message;
}

// Función para manejar comando de prueba
async function handleTestCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🧪 TEST COMMAND - Iniciando para:', fromtelegramuser.first_name);
    
    // Verificar si el usuario puede recibir mensajes privados
    const canReceivePrivate = await NotificationService.canReceivePrivateMessages(userid);
    
    console.log('🧪 TEST COMMAND - Puede recibir privados:', canReceivePrivate);
    
    if (canReceivePrivate) {
      // Enviar mensaje de prueba privado
      const testMessage = `🧪 <b>¡PRUEBA EXITOSA!</b> ✅

🎉 <b>¡Perfecto!</b> Tu configuración está correcta.

📱 <b>YA PUEDES RECIBIR:</b>
🗡️ Notificaciones de duelos
🏅 Alertas de logros  
🎯 Actualizaciones de metas
📊 Respuestas detalladas de comandos

🔥 <b>¡TODO FUNCIONANDO!</b>
A partir de ahora recibirás notificaciones privadas ricas en lugar de mensajes breves en el grupo.

⚡ Usa cualquier comando como <code>/stats</code> para probarlo`;

      const privateSent = await sendTelegramMessage(userid, testMessage);
      
      if (privateSent) {
        return `✅ <b>¡PRUEBA EXITOSA!</b> 🎉

📱 Te he enviado un mensaje privado detallado.

🔥 <b>CONFIGURACIÓN PERFECTA:</b>
Tu bot está listo para notificaciones privadas.

🎯 <b>PRÓXIMOS PASOS:</b>
• Prueba comandos como <code>/stats</code>
• Los duelos llegaran por privado
• Respuestas de quiz también

¡Ya no habrá más spam en el grupo! 💪`;
      }
    }
    
    // Fallback si no puede recibir privadas
    return `❌ <b>CONFIGURACIÓN PENDIENTE</b> 🔧

🔍 <b>PROBLEMA DETECTADO:</b>
No puedes recibir mensajes privados del bot.

✅ <b>SOLUCIÓN (súper fácil):</b>
1. Busca <code>@OpoMelillaBot</code> en Telegram
2. Toca "Enviar mensaje"  
3. Envía <code>/start</code> al bot
4. Vuelve aquí y usa <code>/test</code> otra vez

💡 <b>¿POR QUÉ ES IMPORTANTE?</b>
Sin esto, solo recibirás mensajes breves en el grupo.
Con esto, recibirás notificaciones detalladas y privadas.

🎯 <b>¡Vale la pena configurarlo!</b> Solo toma 30 segundos.`;
    
  } catch (error) {
    console.error('Error en comando test:', error);
    return `❌ <b>Error en la prueba</b>

Hubo un problema técnico.
Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar duelos del usuario
async function handleUserDuels(userid: string): Promise<string | null> {
  try {
    const userDuels = await DuelService.getUserDuels(userid);
    return formatUserDuels(userDuels, userid);
  } catch (error) {
    console.error('Error obteniendo duelos del usuario:', error);
    return `❌ <b>Error al obtener duelos</b>

Hubo un problema al obtener tus duelos. Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar estadísticas de duelos
async function handleDuelStats(userid: string): Promise<string | null> {
  try {
    // Obtener datos del usuario
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });
    
    if (!user) {
      return `❌ <b>Usuario no encontrado</b>

Parece que aún no has iniciado el bot. Usa <code>/start</code> para comenzar.`;
    }
    
    // Obtener estadísticas de duelos
    const duelStats = await DuelService.getDuelStatistics(userid);
    
    if (!duelStats) {
      return `📊 <b>TUS ESTADÍSTICAS</b> 📊

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

🗡️ <b>DUELOS:</b>
   📈 Total disputados: 0
   🏆 Ganados: 0
   😔 Perdidos: 0
   📊 Porcentaje victoria: 0%
   🔥 Racha actual: 0

💰 <b>PUNTOS:</b>
   💎 Total: ${user.totalpoints || 0}
   📊 Nivel: ${user.level || 1}
   ⚡ Racha respuestas: ${user.streak || 0}
   🏅 Mejor racha: ${user.beststreak || 0}

🎮 <b>¡COMIENZA TU PRIMER DUELO!</b>
• <code>/duelo @usuario</code> - Retar a alguien
• <code>/ranking</code> - Ver clasificación

⚔️ ¡Es hora de demostrar tus conocimientos!`;
    }
    
    // Combinar datos del usuario con estadísticas de duelos
    const combinedStats = {
      ...user,
      totalDuels: duelStats.totalDuels,
      wonDuels: duelStats.wonDuels,
      lostDuels: duelStats.lostDuels,
      currentStreak: duelStats.currentStreak
    };
    
    return formatUserStats(combinedStats);
    
  } catch (error) {
    console.error('Error obteniendo estadísticas de duelos:', error);
    return `❌ <b>Error al obtener estadísticas</b>

Hubo un problema al obtener tus estadísticas de duelos. Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /examen2018 - Pregunta específica del examen oficial
async function handleExamen2018Command(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🎯 EXAMEN2018 - Obteniendo pregunta para usuario:', fromtelegramuser.first_name);
    
    // Obtener una pregunta aleatoria del examen oficial 2018
    const randomQuestion = await ensurePrisma().examenoficial2018.findFirst({
      where: {
        isactive: true
      },
      orderBy: {
        sendcount: 'asc' // Priorizar preguntas menos enviadas para rotación equitativa
      },
      skip: Math.floor(Math.random() * 10) // Pequeña aleatoriedad dentro de las menos enviadas
    });
    
    if (!randomQuestion) {
      return `❌ <b>Sin preguntas disponibles</b>

🔧 El sistema de preguntas del Examen Oficial 2018 no tiene preguntas activas.
Contacta con los administradores.`;
    }
    
    // Incrementar el contador de envíos
    await ensurePrisma().examenoficial2018.update({
      where: { id: randomQuestion.id },
      data: { 
        sendcount: { increment: 1 },
        lastsuccessfulsendat: new Date()
      }
    });
    
    // Intentar enviar como poll interactivo primero
    const canReceivePrivate = await NotificationService.canReceivePrivateMessages(userid);
    
    if (canReceivePrivate) {
      // Crear poll interactivo
      const pollSent = await sendTelegramPoll(
        userid,
        `🎯 EXAMEN OFICIAL PERMANENCIA 2018 🎯\n\n📝 Pregunta ${randomQuestion.questionnumber}/100:\n\n${randomQuestion.question}`,
        (randomQuestion.options && randomQuestion.options !== null) ? cleanMalformedOptionsJSON(randomQuestion.options) : [],
        randomQuestion.correctanswerindex,
        randomQuestion.id,
        'examenOficial2018'
      );
      
      if (pollSent) {
        console.log('✅ Poll examen2018 enviado por privado exitosamente');
        return `🎯 <b>¡Quiz Examen 2018 enviado!</b> ✅

📱 Te he enviado un quiz interactivo del Examen Oficial de Permanencia 2018 por mensaje privado.

🎭 <b>Pregunta ${randomQuestion.questionnumber}/100</b>
🏷️ Categoría: ${randomQuestion.category}

💡 <b>Responde el quiz y recibirás:</b>
✅ Resultado inmediato (correcto/incorrecto)
💡 Explicación detallada
📊 Puntos y estadísticas actualizadas

🔄 <code>/examen2018</code> - Otra pregunta`;
      }
    }
    
    // Fallback: enviar mensaje de configuración
    return `📝 <b>¡QUIZ EXAMEN 2018 LISTO!</b> 🎯

🔍 <b>PROBLEMA:</b> No puedo enviarte el quiz interactivo por aquí (evitar spam en grupo).

✅ <b>SOLUCIÓN RÁPIDA:</b>
1. Busca <code>@OpoMelillaBot</code> en Telegram
2. Envía <code>/start</code> al bot
3. Vuelve aquí y usa <code>/examen2018</code> otra vez

💡 <b>¿QUÉ GANAS?</b>
🎮 Quiz interactivo del Examen Oficial 2018
✅ Respuestas instantáneas con explicaciones
📊 Seguimiento de tu progreso
🎯 100 preguntas reales de permanencia

⚡ Solo toma 30 segundos configurarlo y recibirás los quiz completos!`;
    
  } catch (error) {
    console.error('❌ Error en comando /examen2018:', error);
    return `❌ <b>Error obteniendo pregunta</b>

Hubo un problema al obtener la pregunta del Examen Oficial 2018.
Inténtalo de nuevo en unos minutos.`;
  }
}


// Función para enviar polls/quiz interactivos a Telegram
async function sendTelegramPoll(
  chatid: number | string, 
  question: string, 
  options: string[], 
  correctanswerindex: number, 
  questionid: string,
  sourcemodel: string = 'validQuestion'
): Promise<boolean> {
  try {
    // Asegurar límites de Telegram
    let questionText = typeof question === 'string' ? question : String(question);
    if (questionText.length > 300) {
      console.warn(`⚠️ Pregunta demasiado larga (${questionText.length}), truncando a 300`);
      questionText = questionText.substring(0, 297) + '...';
    }

    const sanitizedOptions = (options || []).slice(0, 10).map((raw, idx) => {
      let text = typeof raw === 'string' ? raw : String(raw);
      // Limpiezas robustas: corchetes/residuos de JSON y comillas externas
      // 1) recortar espacios
      text = text.trim();
      // 2) eliminar corchetes sobrantes al inicio/fin
      text = text.replace(/^\[+/, '').replace(/\]+$/, '');
      // 3) eliminar comillas dobles externas
      text = text.replace(/^"+|"+$/g, '');
      // 4) eliminar coma inicial residual
      text = text.replace(/^,\s*/, '');
      // 5) recortar final otra vez
      text = text.trim();
      if (text.length > 100) {
        console.warn(`⚠️ Opción demasiado larga (${text.length}) en índice ${idx}, truncando a 100`);
        text = text.substring(0, 97) + '...';
      }
      if (text.length === 0) {
        text = `Opción ${idx + 1}`;
      }
      return text;
    });

    console.log('🗳️ Enviando poll a Telegram:', { 
      chatid, 
      questionLength: questionText.length,
      optionCount: sanitizedOptions.length,
      sourcemodel 
    });
    
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatid,
        question: questionText,
        options: sanitizedOptions,
        type: 'quiz', // Quiz tipo con respuesta correcta
        correct_option_id: correctanswerindex,
        is_anonymous: false, // Permitir ver quién responde
        allows_multiple_answers: false,
        explanation: `💡 Explicación disponible después de responder.`,
        explanation_parse_mode: 'HTML'
      }),
    });

    const result = await response.json();
    console.log('🗳️ Respuesta de Telegram sendPoll:', result);
    
    if (!result.ok) {
      console.error('❌ Error enviando poll a Telegram:', result.description);
      return false;
    }

    // Registrar el poll en la base de datos para tracking
    try {
      await ensurePrisma().telegrampoll.create({
        data: {
          id: `poll-${result.result.poll.id}-${Date.now()}`,
          pollid: result.result.poll.id,
          questionid: questionid,
          chatid: chatid.toString(),
          correctanswerindex: correctanswerindex,
          options: JSON.stringify(sanitizedOptions), // Guardar opciones ya saneadas
          sourcemodel: sourcemodel,
          createdat: new Date()
        }
      });
      console.log('✅ Poll registrado en BD con ID:', result.result.poll.id);
    } catch (dbError) {
      console.error('⚠️ Error registrando poll en BD:', dbError);
      // No fallar el envío por error de BD
    }

    console.log('✅ Poll enviado exitosamente a Telegram');
    return true;
  } catch (error) {
    console.error('❌ Error en sendTelegramPoll:', error);
    return false;
  }
}

// Función para manejar comando /examen2018stats - Estadísticas avanzadas del examen oficial
async function handleExamen2018StatsCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('📊 EXAMEN2018STATS - Generando estadísticas para usuario:', fromtelegramuser.first_name);
    
    // Obtener todas las respuestas del usuario a preguntas del examen2018
    // CORREGIDO: Usar la estructura correcta de las tablas
    const userResponses = await prisma.$queryRaw`
      SELECT 
        tr.iscorrect,
        tr.responsetime,
        tr.points,
        tr.answeredAt,
        tp.questionid,
        eo.questionnumber,
        eo.category,
        eo.difficulty
      FROM TelegramResponse tr
      JOIN TelegramPoll tp ON tr.questionid = tp.pollid
      JOIN examenoficial2018 eo ON tp.questionid = eo.id
      JOIN telegramuser tu ON tr.userid = tu.id
      WHERE tu.telegramuserid = ${userid}
      AND tp.sourcemodel = 'examenOficial2018'
      ORDER BY tr.answeredAt DESC
    ` as any[];

    // Calcular estadísticas generales
    const totalQuestionsAnswered = userResponses.length;
    const correctAnswers = userResponses.filter(r => r.iscorrect).length;
    const totalQuestions = await ensurePrisma().examenoficial2018.count();
    const accuracy = totalQuestionsAnswered > 0 ? Math.round((correctAnswers / totalQuestionsAnswered) * 100) : 0;
    
    // Estadísticas por categoría
    const categoryStats = new Map();
    userResponses.forEach(response => {
      const category = response.category;
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { total: 0, correct: 0 });
      }
      const stats = categoryStats.get(category);
      stats.total++;
      if (response.iscorrect) stats.correct++;
    });

    // Preguntas únicas respondidas
    const uniqueQuestions = new Set(userResponses.map(r => r.questionnumber));
    const questionsAnswered = uniqueQuestions.size;
    const progress = Math.round((questionsAnswered / totalQuestions) * 100);

    // Tiempo promedio de respuesta (solo respuestas con tiempo válido)
    const responsesWithTime = userResponses.filter(r => r.responsetime && r.responsetime > 0);
    const avgResponseTime = responsesWithTime.length > 0 
      ? Math.round(responsesWithTime.reduce((sum, r) => sum + r.responsetime, 0) / responsesWithTime.length)
      : 0;

    // Puntos totales del examen
    const totalPoints = userResponses.reduce((sum, r) => sum + (r.points || 0), 0);

    // Racha actual y mejor racha
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    
    // Analizar racha (respuestas ordenadas por fecha descendente)
    for (let i = 0; i < userResponses.length; i++) {
      if (userResponses[i].iscorrect) {
        tempStreak++;
        if (i === 0) currentStreak = tempStreak; // La más reciente
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        if (i === 0) currentStreak = 0; // La más reciente fue incorrecta
        tempStreak = 0;
      }
    }

    // Obtener últimas 5 respuestas para mostrar historial reciente
    const recentResponses = userResponses.slice(0, 5);

    // Construir mensaje de estadísticas
    let statsMessage = `📊 <b>ESTADÍSTICAS EXAMEN OFICIAL 2018</b> 🎯\n\n`;
    
    // Progreso general
    statsMessage += `🎯 <b>PROGRESO GENERAL:</b>\n`;
    statsMessage += `   📝 Preguntas respondidas: ${questionsAnswered}/${totalQuestions} (${progress}%)\n`;
    statsMessage += `   🔄 Total intentos: ${totalQuestionsAnswered}\n`;
    statsMessage += `   ✅ Respuestas correctas: ${correctAnswers}\n`;
    statsMessage += `   📈 Precisión: ${accuracy}%\n`;
    statsMessage += `   💎 Puntos obtenidos: ${totalPoints}\n\n`;

    // Rendimiento
    statsMessage += `⚡ <b>RENDIMIENTO:</b>\n`;
    statsMessage += `   🔥 Racha actual: ${currentStreak} aciertos\n`;
    statsMessage += `   🏆 Mejor racha: ${bestStreak} aciertos\n`;
    if (avgResponseTime > 0) {
      statsMessage += `   ⏱️ Tiempo promedio: ${avgResponseTime}s\n`;
    }
    statsMessage += `\n`;

    // Estadísticas por categoría
    if (categoryStats.size > 0) {
      statsMessage += `📚 <b>RENDIMIENTO POR CATEGORÍA:</b>\n`;
      Array.from(categoryStats.entries())
        .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))
        .forEach(([category, stats]) => {
          const categoryAccuracy = Math.round((stats.correct / stats.total) * 100);
          const categoryEmoji = categoryAccuracy >= 80 ? '🟢' : categoryAccuracy >= 60 ? '🟡' : '🔴';
          statsMessage += `   ${categoryEmoji} ${category}: ${stats.correct}/${stats.total} (${categoryAccuracy}%)\n`;
        });
      statsMessage += `\n`;
    }

    // Historial reciente
    if (recentResponses.length > 0) {
      statsMessage += `📋 <b>ÚLTIMAS RESPUESTAS:</b>\n`;
      recentResponses.forEach((response, index) => {
        const resultEmoji = response.iscorrect ? '✅' : '❌';
        const date = new Date(response.answeredAt).toLocaleDateString('es-ES');
        const points = response.points || 0;
        statsMessage += `   ${resultEmoji} P${response.questionnumber} - ${response.category} (+${points}pts) - ${date}\n`;
      });
      statsMessage += `\n`;
    }

    // Objetivos y motivación
    if (progress < 100) {
      const questionsRemaining = totalQuestions - questionsAnswered;
      statsMessage += `🎯 <b>PRÓXIMO OBJETIVO:</b>\n`;
      if (progress < 25) {
        statsMessage += `   🚀 Completa 25 preguntas (faltan ${25 - questionsAnswered})\n`;
      } else if (progress < 50) {
        statsMessage += `   🎪 Alcanza el 50% del examen (faltan ${questionsRemaining} preguntas)\n`;
      } else if (progress < 75) {
        statsMessage += `   🎭 ¡Supera el 75%! (faltan ${questionsRemaining} preguntas)\n`;
      } else {
        statsMessage += `   🏆 ¡Completa el examen! (faltan ${questionsRemaining} preguntas)\n`;
      }
      statsMessage += `\n`;
    } else {
      statsMessage += `🎉 <b>¡EXAMEN COMPLETADO!</b>\n`;
      statsMessage += `   🏆 Has respondido todas las preguntas oficiales\n`;
      statsMessage += `   💪 ¡Sigue practicando para mejorar tu precisión!\n\n`;
    }

    // Comandos útiles
    statsMessage += `🔧 <b>COMANDOS ÚTILES:</b>\n`;
    statsMessage += `   📝 <code>/examen2018</code> - Nueva pregunta\n`;
    statsMessage += `   📊 <code>/stats</code> - Estadísticas generales\n`;
    statsMessage += `   🏆 <code>/ranking</code> - Ver clasificación\n`;

    return statsMessage;

  } catch (error) {
    console.error('❌ Error en comando /examen2018stats:', error);
    return `❌ <b>Error obteniendo estadísticas</b>

Hubo un problema al generar tus estadísticas del Examen Oficial 2018.
Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /simulacro2018 - Iniciar simulacro del examen oficial 2018
async function handleSimulacroCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🎯 SIMULACRO - Verificando si puede iniciar simulacro para usuario:', fromtelegramuser.first_name);
    
    // Verificar si el usuario puede recibir mensajes privados
    const canReceivePrivate = await NotificationService.canReceivePrivateMessages(userid);
    
    if (!canReceivePrivate) {
      return `⚠️ <b>CONFIGURACIÓN REQUERIDA</b> 🔧

🎯 <b>MODO SIMULACRO</b> requiere mensajes privados para funcionar correctamente.

✅ <b>CONFIGURACIÓN (30 segundos):</b>
1. Busca <code>@OpoMelillaBot</code> en Telegram
2. Envía <code>/start</code> al bot
3. Vuelve aquí y usa <code>/simulacro2018</code> otra vez

💡 <b>¿POR QUÉ ES NECESARIO?</b>
🎯 El simulacro son 100 preguntas (3 horas)
📱 Se envían quiz interactivos por privado
⏰ Evita spam en el grupo durante 3 horas
🎮 Experiencia completa como el examen real

🚀 <b>¡Vale la pena configurarlo! Solo toma 30 segundos.</b>`;
    }
    
    // Verificar si ya tiene un simulacro activo
    const activeSimulacro = await prisma.$queryRaw`
      SELECT s.id, s.startedat, s.timeelapsed, s.currentquestionindex, s.totalquestions
      FROM simulacro s
      JOIN telegramuser tu ON s.userid = tu.id
      WHERE tu.telegramuserid = ${userid}
      AND s.status = 'in_progress'
      LIMIT 1
    ` as any[];
    
    if (activeSimulacro.length > 0) {
      const simulacro = activeSimulacro[0];
      const timeElapsed = Math.floor((Date.now() - new Date(simulacro.startedat).getTime()) / 1000);
      const timeRemaining = Math.max(0, 10800 - timeElapsed); // 3 horas límite
      const hoursRemaining = Math.floor(timeRemaining / 3600);
      const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
      
      return `🎯 <b>SIMULACRO EN PROGRESO</b> ⏳

Ya tienes un simulacro del Examen Oficial 2018 en curso.

📊 <b>PROGRESO ACTUAL:</b>
📝 Pregunta: ${simulacro.currentquestionindex}/${simulacro.totalquestions}
⏰ Tiempo restante: ${hoursRemaining}h ${minutesRemaining}m
🗓️ Iniciado: ${new Date(simulacro.startedat).toLocaleString()}

🎮 <b>OPCIONES:</b>
▶️ <code>/simulacro_continuar</code> - Continuar examen
🚪 <code>/simulacro_abandonar</code> - Abandonar (perderás progreso)
📊 <code>/simulacro_historial</code> - Ver historial

💡 <b>TIP:</b> Solo puedes tener un simulacro activo a la vez para mantener la concentración.`;
    }
    
    // Verificar que hay suficientes preguntas
    const questionCount = await ensurePrisma().examenoficial2018.count({
      where: { isactive: true }
    });
    
    if (questionCount < 100) {
      return `❌ <b>Sistema no disponible</b>

🔧 No hay suficientes preguntas del Examen Oficial 2018.
📞 Contacta con los administradores.`;
    }
    
    // Iniciar nuevo simulacro
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });
    
    if (!user) {
      return `❌ <b>Usuario no registrado</b>

Usa <code>/start</code> para registrarte primero.`;
    }
    
    // Crear simulacro
    const simulacro = await ensurePrisma().simulacro.create({
      data: {
        id: uuidv4(),
        userid: user.id.toString(),
        status: 'in_progress',
        timelimit: 10800,
        totalquestions: 100,
        updatedat: new Date(),
        examtype: 'simulacro'
      }
    });
    
    // Obtener todas las preguntas y crear las respuestas
    const questions = await ensurePrisma().examenoficial2018.findMany({
      where: { isactive: true },
      orderBy: { questionnumber: 'asc' },
      take: 100
    });
    
    // Crear respuestas del simulacro usando también ORM
    const simulacroResponses = questions.map((question, index) => ({
      id: `${simulacro.id}-${index + 1}`,
      examtype: 'simulacro',
      simulacroid: simulacro.id,
      questionid: question.id,
      questionnumber: question.questionnumber,
      questioncategory: question.category,
      questiondifficulty: question.difficulty,
      answeredat: null,
      selectedoption: null,
      iscorrect: null,
      responsetime: null,
      skipped: false
    }));
    
    await ensurePrisma().simulacroresponse.createMany({
      data: simulacroResponses
    });
    
    // Enviar primera pregunta
    // Primero enviar la notificación de inicio
    const notificationMessage = `🎯 <b>¡SIMULACRO INICIADO!</b> 🚀

📋 <b>INSTRUCCIONES IMPORTANTES:</b>
⏰ <b>Tiempo límite:</b> 3 horas (180 minutos)
📝 <b>Preguntas:</b> 100 del examen oficial
🚫 <b>Sin pausas:</b> Una vez iniciado, debe completarse
📊 <b>Aprobado:</b> 50% o más (≥50 correctas)

🎮 <b>COMANDOS DURANTE EL EXAMEN:</b>
▶️ <code>/simulacro_continuar</code> - Si se interrumpe
🚪 <code>/simulacro_abandonar</code> - Abandonar examen

🍀 <b>¡BUENA SUERTE!</b> Responde con calma y concentración.

💡 <b>TIP:</b> Este es un simulacro del examen real de permanencia 2018.`;
    
    // Enviar notificación primero
    await sendTelegramMessage(userid, notificationMessage);
    
    // Luego enviar primera pregunta
    const firstQuestion = questions[0];
    const firstHeader = `🎯 SIMULACRO 1/100 ⏱️3h\n\n`;
    const firstPollQuestion = truncatePollQuestion(firstHeader, firstQuestion.question);
    
    const pollSent = await sendTelegramPoll(
      userid,
      firstPollQuestion,
      (firstQuestion.options && firstQuestion.options !== null) ? cleanMalformedOptionsJSON(firstQuestion.options) : [],
      firstQuestion.correctanswerindex,
      `simulacro-${simulacro.id}-${firstQuestion.questionnumber}`,
      'simulacro'
    );
    
    if (pollSent) {
      // Devolver null porque ya enviamos la notificación antes
      return null;
    } else {
      return `❌ <b>Error enviando pregunta</b>

No se pudo enviar la primera pregunta. Inténtalo de nuevo.`;
    }
    
  } catch (error) {
    console.error('❌ Error en comando /simulacro2018:', error);
    return `❌ <b>Error iniciando simulacro</b>

Hubo un problema al iniciar el simulacro del Examen Oficial 2018.
Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /simulacro_continuar - Continuar simulacro en progreso
async function handleSimulacroResumeCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('▶️ SIMULACRO_CONTINUAR - Para usuario:', fromtelegramuser.first_name);
    
    // Buscar simulacro 2024 activo primero
    const activeSimulacro2024 = await Simulacro2024Service.getActiveSimulacro(userid);
    
    if (activeSimulacro2024) {
      console.log('🎯 SIMULACRO 2024 activo encontrado, continuando...');
      
      // Obtener la siguiente pregunta del simulacro 2024
      const nextQuestion = await Simulacro2024Service.getCurrentQuestion(activeSimulacro2024.id);
      
      if (!nextQuestion) {
        return `✅ <b>SIMULACRO COMPLETADO</b>

¡Has completado todas las preguntas!

📋 <code>/simulacro_historial</code> - Ver resultados`;
      }
      
      // Calcular tiempo restante
      const timeElapsed = Math.floor((Date.now() - new Date(activeSimulacro2024.startedat).getTime()) / 1000);
      const timeRemaining = Math.max(0, 10800 - timeElapsed);
      const hoursRemaining = Math.floor(timeRemaining / 3600);
      const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
      
      // Parsear las opciones desde JSON string
      let parsedOptions: string[];
      try {
        parsedOptions = typeof nextQuestion.options === 'string' 
          ? cleanMalformedOptionsJSON(nextQuestion.options)
          : nextQuestion.options;
      } catch (error) {
        console.error('❌ Error parseando opciones del simulacro 2024:', error);
        return `❌ <b>Error en formato de pregunta</b>\n\nLa pregunta tiene un formato incorrecto. Inténtalo de nuevo.`;
      }

      // Enviar pregunta actual
      const pollSent = await sendTelegramPoll(
        userid,
        `🎯 SIMULACRO EXAMEN 2024 - Pregunta ${nextQuestion.questionnumber}/100\n⏰ Tiempo restante: ${hoursRemaining}h ${minutesRemaining}m\n\n${nextQuestion.question}`,
        parsedOptions,
        nextQuestion.correctanswerindex,
        nextQuestion.id,
        'simulacro2024'
      );
      
      if (pollSent) {
        return `▶️ <b>SIMULACRO 2024 CONTINUADO</b> ✅

Te he enviado la pregunta actual por mensaje privado.

📊 <b>PROGRESO:</b>
📝 Pregunta: ${nextQuestion.questionnumber}/100
⏰ Tiempo restante: ${hoursRemaining}h ${minutesRemaining}m

💪 ¡Sigue adelante con el Examen 2024!`;
      } else {
        return `❌ <b>Error enviando pregunta</b>

No se pudo enviar la pregunta. Inténtalo de nuevo.`;
      }
    }
    
    // Si no hay simulacro 2024 activo, buscar simulacros militares premium
    const activeMilitarySimulation = await MilitarySimulationService.getActiveSimulation(userid);
    
    if (activeMilitarySimulation) {
      console.log('🎖️ SIMULACRO PERMANENCIA activo encontrado:', activeMilitarySimulation.examtype);
      
      // Determinar el tipo de simulacro militar
      const branchNames = {
        'simulacro_premium_et': '🎖️ Ejército de Tierra',
        'simulacro_premium_aire': '✈️ Ejército del Aire',
        'simulacro_premium_armada': '⚓ Armada'
      };
      
      const branchName = branchNames[activeMilitarySimulation.examtype] || 'Simulacro Militar';
      const progress = activeMilitarySimulation.currentquestionindex || 0;
      const total = activeMilitarySimulation.totalquestions || 100;
      const timeElapsed = activeMilitarySimulation.timeelapsed || 0;
      const timeRemaining = Math.max(0, activeMilitarySimulation.timelimit - timeElapsed);
      const minutesRemaining = Math.floor(timeRemaining / 60);
      
      // Intentar enviar la primera pregunta si el progreso es 0
      if (progress === 0) {
        console.log('📤 Enviando primera pregunta del simulacro militar...');
        const questionSent = await MilitarySimulationService.sendFirstQuestion(activeMilitarySimulation.id, userid);
        
        if (questionSent) {
          return `🎖️ <b>SIMULACRO PERMANENCIA CONTINUADO</b> ✅\n\n` +
            `📊 <b>Progreso:</b> ${progress}/${total} preguntas\n` +
            `⏱️ <b>Tiempo restante:</b> ${minutesRemaining} minutos\n` +
            `🎯 <b>Tipo:</b> ${branchName}\n\n` +
            `✅ <b>Primera pregunta enviada por privado</b>\n` +
            `💡 Responde la pregunta para continuar el simulacro\n\n` +
            `📞 **Soporte:** @Carlos_esp si necesitas ayuda`;
        } else {
          return `🎖️ <b>SIMULACRO PERMANENCIA ACTIVO</b> ⚠️\n\n` +
            `📊 <b>Progreso:</b> ${progress}/${total} preguntas\n` +
            `⏱️ <b>Tiempo restante:</b> ${minutesRemaining} minutos\n` +
            `🎯 <b>Tipo:</b> ${branchName}\n\n` +
            `❌ <b>Error enviando primera pregunta</b>\n` +
            `💡 Inténtalo de nuevo en unos momentos\n\n` +
            `📞 <b>Soporte:</b> @Carlos_esp si necesitas ayuda`;
        }
      }
      
      return `🎖️ <b>SIMULACRO PERMANENCIA ACTIVO</b>\n\n` +
        `📊 <b>Progreso:</b> ${progress}/${total} preguntas\n` +
        `⏱️ <b>Tiempo restante:</b> ${minutesRemaining} minutos\n` +
        `🎯 <b>Tipo:</b> ${branchName}\n\n` +
        `💡 <b>Información:</b>\n` +
        `Los simulacros militares premium se gestionan automáticamente.\n` +
        `Las preguntas se envían secuencialmente por mensaje privado.\n\n` +
        `🔄 <b>Estado:</b> En progreso\n` +
        `📞 <b>Soporte:</b> @Carlos_esp si necesitas ayuda`;
    }
    
    // Si no hay simulacros militares, buscar simulacro 2018 activo
    const activeSimulacro = await prisma.$queryRaw`
      SELECT s.id, s.startedat, s.timeelapsed, s.currentquestionindex, s.totalquestions
      FROM simulacro s
      JOIN telegramuser tu ON s.userid = tu.id
      WHERE tu.telegramuserid = ${userid}
      AND s.status = 'in_progress'
      LIMIT 1
    ` as any[];
    
    if (activeSimulacro.length === 0) {
      return `❌ <b>No hay simulacro activo</b>

No tienes ningún simulacro en progreso.

🎯 <b>OPCIONES:</b>
🚀 <code>/simulacro2018</code> - Iniciar simulacro 2018
🚀 <code>/simulacro2024</code> - Iniciar simulacro 2024
📋 <code>/simulacro_historial</code> - Ver historial`;
    }
    
    const simulacro = activeSimulacro[0];
    
    // Verificar si el simulacro tiene formato de ID incorrecto (formato anterior)
    if (simulacro.id && simulacro.id.includes('simulacro_')) {
      console.log('🔧 Detectado simulacro con formato de ID incorrecto, abandonando automáticamente:', simulacro.id);
      
      // Marcar como abandonado automáticamente
      await prisma.$queryRaw`
        UPDATE simulacro 
        SET status = 'abandoned', completedat = CURRENT_TIMESTAMP
        WHERE id = ${simulacro.id}
      `;
      
      return `🔧 <b>SIMULACRO MIGRADO</b>

Tu simulacro anterior tenía un formato incompatible y ha sido migrado automáticamente.

🎯 <b>SIGUIENTE PASO:</b>
🚀 <code>/simulacro2018</code> - Iniciar nuevo simulacro con formato actualizado

💡 <i>Esta migración es necesaria para mejorar la compatibilidad del sistema.</i>`;
    }
    
    const timeElapsed = Math.floor((Date.now() - new Date(simulacro.startedat).getTime()) / 1000);
    
    // Verificar si ha expirado
    if (timeElapsed >= 10800) {
      // Marcar como expirado
      await prisma.$queryRaw`
        UPDATE simulacro 
        SET status = 'expired', completedat = CURRENT_TIMESTAMP
        WHERE id = ${simulacro.id}
      `;
      
      return `⏰ <b>SIMULACRO EXPIRADO</b>

Tu simulacro ha expirado (límite de 3 horas).

📊 <b>PROGRESO FINAL:</b>
📝 Pregunta alcanzada: ${simulacro.currentquestionindex}/${simulacro.totalquestions}
⏰ Tiempo transcurrido: 3h 0m

🚀 <b>SIGUIENTE PASO:</b>
<code>/simulacro2018</code> - Iniciar nuevo simulacro`;
    }
    
    // Obtener siguiente pregunta sin responder
    const nextQuestion = await prisma.$queryRaw`
      SELECT sr.questionnumber, eo.question, eo.options, eo.correctanswerindex
      FROM simulacroresponse sr
      JOIN examenoficial2018 eo ON sr.questionid = eo.id
      WHERE sr.simulacroid = ${simulacro.id}
      AND sr.answeredat IS NULL
      AND sr.skipped = false
      ORDER BY sr.questionnumber ASC
      LIMIT 1
    ` as any[];
    
    if (nextQuestion.length === 0) {
      return `✅ <b>SIMULACRO COMPLETADO</b>

¡Has completado todas las preguntas!

📋 <code>/simulacro_historial</code> - Ver resultados`;
    }
    
    const question = nextQuestion[0];
    const timeRemaining = Math.max(0, 10800 - timeElapsed);
    const hoursRemaining = Math.floor(timeRemaining / 3600);
    const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
    
    // Parsear las opciones desde JSON string
    let parsedOptions: string[];
    try {
      parsedOptions = typeof question.options === 'string' 
        ? cleanMalformedOptionsJSON(question.options)
        : question.options;
    } catch (error) {
      console.error('❌ Error parseando opciones:', error);
      return `❌ <b>Error en formato de pregunta</b>\n\nLa pregunta tiene un formato incorrecto. Inténtalo de nuevo.`;
    }

    // Enviar pregunta actual
    const pollSent = await sendTelegramPoll(
      userid,
      `🎯 SIMULACRO ${question.questionnumber}/100 ⏱️${hoursRemaining}h${minutesRemaining}m\n\n${question.question}`,
      parsedOptions,
      question.correctanswerindex,
      `simulacro-${simulacro.id}-${question.questionnumber}`,
      'simulacro'
    );
    
    if (pollSent) {
      return `▶️ <b>SIMULACRO CONTINUADO</b> ✅

Te he enviado la pregunta actual por mensaje privado.

📊 <b>PROGRESO:</b>
📝 Pregunta: ${question.questionnumber}/100
⏰ Tiempo restante: ${hoursRemaining}h ${minutesRemaining}m

💪 ¡Sigue adelante!`;
    } else {
      return `❌ <b>Error enviando pregunta</b>

No se pudo enviar la pregunta. Inténtalo de nuevo.`;
    }
    
  } catch (error) {
    console.error('❌ Error en simulacro_continuar:', error);
    return `❌ <b>Error continuando simulacro</b>

Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /simulacro_abandonar - Abandonar simulacro actual
async function handleSimulacroAbandonCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🚪 SIMULACRO_ABANDONAR - Para usuario:', fromtelegramuser.first_name);
    
    // Primero intentar abandonar simulacro militar
    const militaryResult = await MilitarySimulationService.abandonMilitarySimulation(userid);
    
    if (militaryResult.success) {
      const simulation = militaryResult.simulationInfo;
      const branchNames = {
        'simulacro_premium_et': '🎖️ Ejército de Tierra',
        'simulacro_premium_aire': '✈️ Ejército del Aire',
        'simulacro_premium_armada': '⚓ Armada'
      };
      
      const branchName = branchNames[simulation.examtype] || 'Simulacro Militar';
      const timeElapsed = Math.floor((Date.now() - new Date(simulation.startedat).getTime()) / 1000);
      const hoursElapsed = Math.floor(timeElapsed / 3600);
      const minutesElapsed = Math.floor((timeElapsed % 3600) / 60);
      
      return `🚪 <b>SIMULACRO PERMANENCIA ABANDONADO</b>

` +
        `🎖️ <b>Tipo:</b> ${branchName}
` +
        `📊 <b>Progreso al abandonar:</b> ${simulation.currentquestionindex || 0}/100 preguntas
` +
        `⏰ <b>Tiempo transcurrido:</b> ${hoursElapsed}h ${minutesElapsed}m
` +
        `📅 <b>Iniciado:</b> ${new Date(simulation.startedat).toLocaleString()}

` +
        `💡 <b>IMPORTANTE:</b>
` +
        `El progreso no se guarda al abandonar.

` +
        `🚀 <b>PRÓXIMOS PASOS:</b>
` +
        `🎖️ <code>/simulacro_premium_et</code> - Nuevo simulacro Ejército de Tierra
` +
        `✈️ <code>/simulacro_premium_aire</code> - Nuevo simulacro Ejército del Aire
` +
        `⚓ <code>/simulacro_premium_armada</code> - Nuevo simulacro Armada

` +
        `🎯 ¡No te desanimes! Los simulacros son para practicar.`;
    }
    
    // Si no hay simulacro militar, buscar simulacro regular
    const activeSimulacro = await prisma.$queryRaw`
      SELECT s.id, s.startedat, s.currentquestionindex, s.totalquestions, s.examtype
      FROM simulacro s
      JOIN telegramuser tu ON s.userid = tu.id
      WHERE tu.telegramuserid = ${userid}
      AND s.status = 'in_progress'
      AND s.examtype NOT IN ('simulacro_premium_et', 'simulacro_premium_aire', 'simulacro_premium_armada')
      LIMIT 1
    ` as any[];
    
    if (activeSimulacro.length === 0) {
      return `❌ <b>No hay simulacro activo</b>

` +
        `No tienes ningún simulacro en progreso para abandonar.

` +
        `🎯 <b>OPCIONES DISPONIBLES:</b>
` +
        `🚀 <code>/simulacro2018</code> - Iniciar simulacro 2018
` +
        `🚀 <code>/simulacro2024</code> - Iniciar simulacro 2024
` +
        `🎖️ <code>/simulacro_premium_et</code> - Simulacro Ejército de Tierra
` +
        `✈️ <code>/simulacro_premium_aire</code> - Simulacro Ejército del Aire
` +
        `⚓ <code>/simulacro_premium_armada</code> - Simulacro Armada`;
    }
    
    const simulacro = activeSimulacro[0];
    
    // Marcar como abandonado
    await prisma.$queryRaw`
      UPDATE \`simulacro\` 
      SET status = 'abandoned', \`completedAt\` = CURRENT_TIMESTAMP
      WHERE id = ${simulacro.id}
    `;
    
    const timeElapsed = Math.floor((Date.now() - new Date(simulacro.startedat).getTime()) / 1000);
    const hoursElapsed = Math.floor(timeElapsed / 3600);
    const minutesElapsed = Math.floor((timeElapsed % 3600) / 60);
    
    return `🚪 <b>SIMULACRO ABANDONADO</b>

` +
      `📊 <b>PROGRESO AL ABANDONAR:</b>
` +
      `📝 Pregunta alcanzada: ${simulacro.currentquestionindex}/${simulacro.totalquestions}
` +
      `⏰ Tiempo transcurrido: ${hoursElapsed}h ${minutesElapsed}m
` +
      `📅 Iniciado: ${new Date(simulacro.startedat).toLocaleString()}

` +
      `💡 <b>IMPORTANTE:</b>
` +
      `El progreso no se guarda al abandonar.

` +
      `🚀 <b>PRÓXIMO PASO:</b>
` +
      `<code>/simulacro2018</code> - Iniciar nuevo simulacro cuando estés listo
` +
      `<code>/simulacro2024</code> - Iniciar nuevo simulacro cuando estés listo

` +
      `🎯 ¡No te desanimes! Los simulacros son para practicar.`;
    
  } catch (error) {
    console.error('❌ Error en simulacro_abandonar:', error);
    return `❌ <b>Error abandonando simulacro</b>

Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /simulacro_historial - Ver historial de simulacros
async function handleSimulacroHistoryCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('📋 SIMULACRO_HISTORIAL - Para usuario:', fromtelegramuser.first_name);
    
    // Obtener historial de simulacros
    const simulacros = await prisma.$queryRaw`
      SELECT s.id, s.status, s.startedat, s.completedat, s.timeelapsed,
             s.finalscore, s.finalpercentage, s.passed, s.totalquestions,
              s.averageresponsetime
      FROM simulacro s
      JOIN telegramuser tu ON s.userid = tu.id
      WHERE tu.telegramuserid = ${userid}
      ORDER BY s.startedat DESC
      LIMIT 10
    ` as any[];
    
    if (simulacros.length === 0) {
      return `📋 <b>HISTORIAL DE SIMULACROS</b>

❌ Aún no has realizado ningún simulacro.

🎯 <b>¿QUÉ ES UN SIMULACRO?</b>
🎓 Examen completo de 100 preguntas del oficial 2018/2024
⏰ Tiempo límite: 3 horas (como el real)
📊 Puntuación oficial: ≥50% para aprobar
🏆 Práctica en condiciones reales

🚀 <b>INICIAR PRIMER SIMULACRO:</b>
<code>/simulacro2018</code> - Simulacro oficial 2018
<code>/simulacro2024</code> - Simulacro oficial 2024

💡 <b>TIP:</b> Es la mejor forma de prepararse para el examen real.`;
    }
    
    let message = `📋 <b>HISTORIAL DE SIMULACROS</b>\n\n`;
    message += `🎯 <b>Total realizados:</b> ${simulacros.length}\n\n`;
    
    // Estadísticas generales
    const completed = simulacros.filter(s => s.status === 'completed');
    const passed = completed.filter(s => s.passed);
    const avgScore = completed.length > 0 
      ? Math.round(completed.reduce((sum, s) => sum + s.finalscore, 0) / completed.length)
      : 0;
    
    if (completed.length > 0) {
      message += `📊 <b>ESTADÍSTICAS GENERALES:</b>\n`;
      message += `✅ Completados: ${completed.length}\n`;
      message += `🏆 Aprobados: ${passed.length} (${Math.round((passed.length / completed.length) * 100)}%)\n`;
      message += `📈 Puntuación promedio: ${avgScore}/100\n\n`;
    }
    
    message += `📋 <b>ÚLTIMOS SIMULACROS:</b>\n\n`;
    
    simulacros.slice(0, 5).forEach((sim, index) => {
      const date = new Date(sim.startedat).toLocaleDateString();
      const statusEmoji = {
        'completed': sim.passed ? '🏆' : '📝',
        'abandoned': '🚪',
        'expired': '⏰',
        'in_progress': '▶️'
      }[sim.status] || '📄';
      
      const statusText = {
        'completed': sim.passed ? `APROBADO (${sim.finalscore}/100)` : `SUSPENDIDO (${sim.finalscore}/100)`,
        'abandoned': 'ABANDONADO',
        'expired': 'EXPIRADO',
        'in_progress': 'EN PROGRESO'
      }[sim.status] || 'UNKNOWN';
      
      message += `${statusEmoji} <b>${index + 1}.</b> ${statusText}\n`;
      message += `   📅 ${date}`;
      
      if (sim.status === 'completed') {
        const percentage = Math.round(sim.finalpercentage);
        const timeInMinutes = Math.round(sim.timeelapsed / 60);
        const avgTime = sim.averageresponsetime ? Math.round(sim.averageresponsetime) : 0;
        message += ` | 📊 ${percentage}% | ⏱️ ${timeInMinutes}min`;
        if (avgTime > 0) {
          message += ` | 🕐 ${avgTime}s/preg`;
        }
      }
      
      message += `\n\n`;
    });
    
    if (simulacros.length > 5) {
      message += `<i>...y ${simulacros.length - 5} más</i>\n\n`;
    }
    
    // Simulacro activo
    const activeSimulacro = simulacros.find(s => s.status === 'in_progress');
    if (activeSimulacro) {
      message += `▶️ <b>SIMULACRO ACTIVO:</b>\n`;
      message += `<code>/simulacro_continuar</code> - Continuar examen\n\n`;
    } else {
      message += `🚀 <b>SIGUIENTE PASO:</b>\n`;
      message += `<code>/simulacro2018</code> - Nuevo simulacro\n`;
      message += `<code>/simulacro2024</code> - Nuevo simulacro 2024\n\n`;
    }
    
    message += `💡 <b>TIP:</b> Practica regularmente para mejorar tu puntuación.`;
    
    return message;
    
  } catch (error) {
    console.error('❌ Error en simulacro_historial:', error);
    return `❌ <b>Error obteniendo historial</b>

Inténtalo de nuevo en unos minutos.`;
  }
}

// Helper function to truncate poll question if it exceeds Telegram's 300 char limit
function truncatePollQuestion(header: string, question: string, maxLength: number = 300): string {
  const fullText = `${header}${question}`;
  
  if (fullText.length <= maxLength) {
    return fullText;
  }
  
  // Calculate how much space we have for the question after the header
  const availableSpace = maxLength - header.length - 3; // -3 for "..."
  
  if (availableSpace < 50) {
    // If header is too long, truncate it too
    const shortHeader = header.substring(0, Math.floor(maxLength * 0.3));
    const questionSpace = maxLength - shortHeader.length - 3;
    return `${shortHeader}${question.substring(0, questionSpace)}...`;
  }
  
  // Truncate question and add ellipsis
  return `${header}${question.substring(0, availableSpace)}...`;
}

// Helper function to calculate current streak of correct answers
function calculateCurrentStreak(responses: boolean[]): number {
  let streak = 0;
  for (const iscorrect of responses) {
    if (iscorrect) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Función para manejar confirmación de cancelación de suscripción
async function handleCancellationConfirmation(userid: string, message: any) {
  try {
    console.log('🚫 Procesando confirmación de cancelación para usuario:', userid);
    
    // Buscar usuario
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });
    
    if (!user) {
      await sendTelegramMessage(message.chat.id, 
        '❌ <b>Usuario no encontrado</b>\n\n' +
        'No se pudo encontrar tu información de usuario.\n' +
        'Contacta con soporte: @Carlos_esp'
      );
      return;
    }
    
    // Buscar suscripción activa SIN include
    const activeSubscription = await ensurePrisma().usersubscription.findFirst({
      where: {
        userid: user.id.toString(),
        status: 'active'
      }
    });
    
    if (!activeSubscription) {
      await sendTelegramMessage(message.chat.id, 
        '❌ <b>No hay suscripción activa</b>\n\n' +
        'No tienes ninguna suscripción activa para cancelar.\n\n' +
        '💡 <b>Comandos útiles:</b>\n' +
        '• <code>/mi_plan</code> - Ver estado actual\n' +
        '• <code>/planes</code> - Ver planes disponibles'
      );
      return;
    }
    
    // Obtener el plan por separado
    const plan = await ensurePrisma().subscriptionplan.findUnique({
      where: { id: activeSubscription.planid }
    });
    
    // Procesar cancelación
    const now = new Date();
    const endDate = activeSubscription.enddate ? new Date(activeSubscription.enddate) : null;
    
    // Marcar como cancelada pero mantener activa hasta el final del período
    await ensurePrisma().usersubscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: 'cancelled',
        cancelreason: 'Usuario solicitó cancelación',
        autorenew: false,
        updatedat: now
      }
    });
    
    // Calcular días restantes
    const daysRemaining = endDate ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    
    const confirmationMessage = `✅ <b>SUSCRIPCIÓN CANCELADA</b>\n\n` +
      `👤 <b>Usuario:</b> ${user.firstname || user.username || 'Usuario'}\n` +
      `💎 <b>Plan cancelado:</b> ${plan?.displayname || 'Plan desconocido'}\n` +
      `📅 <b>Fecha de cancelación:</b> ${now.toLocaleDateString('es-ES')}\n\n` +
      `⏰ <b>IMPORTANTE:</b>\n` +
      `• Tu suscripción seguirá activa hasta: <b>${endDate ? endDate.toLocaleDateString('es-ES') : 'Fecha no disponible'}</b>\n` +
      `• Días restantes: <b>${daysRemaining} días</b>\n` +
      `• Podrás usar todas las funcionalidades hasta entonces\n` +
      `• No se realizarán más cobros automáticos\n\n` +
      `💡 <b>¿Cambias de opinión?</b>\n` +
      `Puedes reactivar tu suscripción en cualquier momento:\n` +
      `• <code>/planes</code> - Ver planes disponibles\n` +
      `• <code>/mi_plan</code> - Ver estado actual\n\n` +
      `📞 <b>Soporte:</b> @Carlos_esp\n\n` +
      `🙏 <b>¡Gracias por haber sido parte de OpoMelilla!</b>`;
    
    await sendTelegramMessage(message.chat.id, confirmationMessage);
    
    console.log('✅ Cancelación procesada exitosamente:', {
      userid,
      subscriptionId: activeSubscription.id,
      planName: plan?.name || 'Desconocido',
      daysRemaining
    });
    
  } catch (error) {
    console.error('❌ Error en handleCancellationConfirmation:', error);
    await sendTelegramMessage(message.chat.id, 
      '❌ <b>Error procesando cancelación</b>\n\n' +
      'Hubo un problema técnico. Contacta con soporte: @Carlos_esp'
    );
  }
}



// ======== FUNCIONES PARA EXAMEN 2024 ========

// Función para manejar comando /examen2024 - Pregunta del examen oficial 2024
async function handleExamen2024Command(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🎯 EXAMEN2024 - Para usuario:', fromtelegramuser.first_name);
    
    // Obtener pregunta aleatoria del examen 2024
    const questions = await (prisma as any).examenoficial2024.findMany({
      where: { isactive: true },
      orderBy: { questionnumber: 'asc' }
    });
    
    if (questions.length === 0) {
      return `❌ <b>NO HAY PREGUNTAS DISPONIBLES</b>\n\nEl Examen Oficial 2024 no está disponible en este momento.\nContacta al administrador.`;
    }
    
    // Seleccionar pregunta aleatoria
    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestion = questions[randomIndex];
    
    // Incrementar contador de envíos
    await (prisma as any).examenoficial2024.update({
      where: { id: randomQuestion.id },
      data: { sendcount: { increment: 1 }, lastsuccessfulsendat: new Date() }
    });
    
    // Preparar header con información
    const header = `🎯 <b>EXAMEN OFICIAL 2024 - Pregunta ${randomQuestion.questionnumber}/100</b>\n\n`;
    const pollQuestion = truncatePollQuestion(header, randomQuestion.question);
    
    // Parsear opciones correctamente
    let parsedOptions;
    try {
      if (typeof randomQuestion.options === 'string') {
        // Las opciones están almacenadas como string, necesitamos parsearlas
        // Primero, intentar corregir el formato JSON malformado
        parsedOptions = cleanMalformedOptionsJSON(randomQuestion.options);
      } else {
        parsedOptions = randomQuestion.options;
      }
      
      console.log('✅ Opciones parseadas correctamente:', parsedOptions.length, 'opciones');
    } catch (parseError) {
      console.error('❌ Error parseando opciones:', parseError);
      console.log('📊 Opciones originales:', randomQuestion.options);
      return `❌ <b>ERROR EN FORMATO DE PREGUNTA</b>\n\nLa pregunta ${randomQuestion.questionnumber} tiene un formato incorrecto.\nContacta al administrador.`;
    }
    
    // Verificar que no exceda el límite de Telegram (10 opciones)
    if (parsedOptions.length > 10) {
      console.warn('⚠️ Pregunta con más de 10 opciones, tomando solo las primeras 10');
      parsedOptions = parsedOptions.slice(0, 10);
      // Ajustar índice de respuesta correcta si es necesario
      if (randomQuestion.correctanswerindex >= 10) {
        console.warn('⚠️ Respuesta correcta fuera del rango, marcando como incorrecta');
      }
    }
    
    // Enviar poll de Telegram
    const pollSent = await sendTelegramPoll(
      userid,
      pollQuestion,
      parsedOptions,
      randomQuestion.correctanswerindex,
      randomQuestion.id,
      'examenoficial2024'
    );
    
    if (pollSent) {
      console.log('✅ EXAMEN2024 - Poll enviado exitosamente');
      return null; // Poll enviado, no necesitamos texto adicional
    } else {
      console.error('❌ EXAMEN2024 - Error enviando poll');
      return `❌ <b>ERROR ENVIANDO PREGUNTA</b>\n\nHubo un problema técnico.\nIntenta nuevamente en unos momentos.`;
    }
    
  } catch (error) {
    console.error('❌ Error en handleExamen2024Command:', error);
    return `❌ <b>ERROR INTERNO</b>\n\nHubo un problema procesando tu solicitud.\nContacta al administrador si persiste.`;
  }
}

// Función para manejar comando /examen2024stats - Estadísticas del examen oficial 2024
async function handleExamen2024StatsCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('📊 EXAMEN2024STATS - Para usuario:', fromtelegramuser.first_name);
    
    // Obtener estadísticas usando query directo para evitar problemas de tipos
    const userResponses = await prisma.$queryRaw`
      SELECT 
        tr.iscorrect,
        tr.responsetime,
        tr.points,
        tr.answeredAt,
        tp.questionid,
        eo.questionnumber,
        eo.category,
        eo.difficulty
      FROM TelegramResponse tr
      JOIN TelegramPoll tp ON tr.questionid = tp.pollid
      JOIN examenoficial2024 eo ON tp.questionid = eo.id
      WHERE tr.telegramuserid = ${userid}
        AND tp.sourcemodel = 'examenoficial2024'
      ORDER BY tr.answeredAt DESC
    ` as any[];
    
    if (userResponses.length === 0) {
      return `📊 <b>ESTADÍSTICAS EXAMEN 2024</b>\n\n❓ Aún no has respondido ninguna pregunta del examen oficial 2024.\n\n🎯 Usa <code>/examen2024</code> para empezar a practicar.`;
    }
    
    // Calcular estadísticas
    const totalAnswered = userResponses.length;
    const correctAnswers = userResponses.filter((r: any) => r.iscorrect === true).length;
    const accuracy = totalAnswered > 0 ? (correctAnswers / totalAnswered * 100) : 0;
    
    // Distribución por categorías
    const categoryStats: { [key: string]: { total: number; correct: number } } = {};
    userResponses.forEach((response: any) => {
      const category = response.category || 'Sin categoría';
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, correct: 0 };
      }
      categoryStats[category].total++;
      if (response.iscorrect) {
        categoryStats[category].correct++;
      }
    });
    
    // Tiempo promedio de respuesta
    const responsesWithTime = userResponses.filter((r: any) => r.responsetime && r.responsetime > 0);
    const avgResponseTime = responsesWithTime.length > 0 ? 
      responsesWithTime.reduce((sum: number, r: any) => sum + r.responsetime, 0) / responsesWithTime.length : 0;
    
    // Preguntas únicas respondidas
    const uniqueQuestions = new Set(userResponses.map((r: any) => r.questionnumber)).size;
    
    // Crear mensaje de respuesta
    let statsMessage = `📊 <b>ESTADÍSTICAS EXAMEN OFICIAL 2024</b>\n\n`;
    statsMessage += `📈 <b>RENDIMIENTO GENERAL:</b>\n`;
    statsMessage += `• Preguntas respondidas: ${totalAnswered}\n`;
    statsMessage += `• Preguntas únicas: ${uniqueQuestions}/100\n`;
    statsMessage += `• Respuestas correctas: ${correctAnswers}/${totalAnswered}\n`;
    statsMessage += `• Precisión: ${accuracy.toFixed(1)}%\n`;
    
    if (avgResponseTime > 0) {
      statsMessage += `• Tiempo promedio: ${avgResponseTime.toFixed(1)}s\n`;
    }
    
    // Mostrar estadísticas por categoría (las primeras 3)
    const categoryEntries = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 3);
    
    if (categoryEntries.length > 0) {
      statsMessage += `\n📚 <b>POR CATEGORÍAS (TOP 3):</b>\n`;
      categoryEntries.forEach(([category, stats]) => {
        const categoryAccuracy = stats.total > 0 ? (stats.correct / stats.total * 100) : 0;
        statsMessage += `• ${category}: ${stats.correct}/${stats.total} (${categoryAccuracy.toFixed(1)}%)\n`;
      });
    }
    
    // Racha actual (últimas 10 respuestas)
    const recent10 = userResponses.slice(0, 10);
    const currentStreak = calculateCurrentStreak(recent10.map((r: any) => r.iscorrect));
    
    if (currentStreak > 0) {
      statsMessage += `\n🔥 <b>RACHA ACTUAL:</b> ${currentStreak} respuestas correctas`;
    }
    
    statsMessage += `\n\n🎯 <code>/examen2024</code> - Practicar más\n📊 <code>/ranking</code> - Ver ranking general`;
    
    return statsMessage;
    
  } catch (error) {
    console.error('❌ Error en handleExamen2024StatsCommand:', error);
    return `❌ <b>ERROR OBTENIENDO ESTADÍSTICAS</b>\n\nHubo un problema procesando tus estadísticas del examen 2024.\nContacta al administrador si persiste.`;
  }
}

// Función para manejar comando /simulacro2024 - Iniciar simulacro del examen oficial 2024
async function handleSimulacro2024Command(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🎯 SIMULACRO2024 - Para usuario:', fromtelegramuser.first_name);
    
    // Verificar si puede iniciar simulacro
    const canStart = await Simulacro2024Service.canStartSimulacro(userid);
    if (!canStart.canStart) {
      const reason = canStart.reason || 'No se puede iniciar el simulacro';
      return `❌ <b>NO PUEDES INICIAR SIMULACRO 2024</b>

${reason}

💡 <b>OPCIONES DISPONIBLES:</b>
${reason.includes('progreso') ? 
  '▶️ <code>/simulacro_continuar</code> - Continuar simulacro actual\n🚪 <code>/simulacro_abandonar</code> - Abandonar simulacro actual' : 
  '🎯 <code>/examen2024</code> - Preguntas individuales del 2024\n🎯 <code>/examen2018</code> - Preguntas del examen 2018'
}`;
    }
    
    // Iniciar simulacro
    const result = await Simulacro2024Service.startSimulacro(userid);
    if (!result) {
      return `❌ <b>ERROR INICIANDO SIMULACRO 2024</b>

No se pudo iniciar el simulacro. Inténtalo de nuevo en unos minutos.`;
    }
    
    const { simulacro, firstQuestion } = result;
    
    console.log('🎯 SIMULACRO2024 INICIADO:', {
      simulacroid: simulacro.id,
      firstquestionnumber: firstQuestion.questionnumber
    });
    
    // Primero enviar la notificación de inicio
    const notificationMessage = `🎯 <b>SIMULACRO EXAMEN 2024 INICIADO</b>\n\n📋 <b>INFORMACIÓN DEL SIMULACRO:</b>\n📝 Preguntas: 100 (del examen oficial 2024)\n⏰ Tiempo límite: 3 horas\n🎯 Para aprobar: ≥50 respuestas correctas\n\n📊 <b>PRIMERA PREGUNTA A CONTINUACIÓN</b>\nResponde el poll que recibirás en breve.\n\n💡 <b>COMANDOS ÚTILES:</b>\n▶️ <code>/simulacro_continuar</code> - Si pierdes el hilo\n🚪 <code>/simulacro_abandonar</code> - Para abandonar\n\n🍀 <b>¡Buena suerte con el Examen 2024!</b>`;
    
    // Enviar notificación primero
    await sendTelegramMessage(fromtelegramuser.id, notificationMessage);
    
    // Luego enviar primera pregunta
    const pollHeader = `🎯 SIMULACRO EXAMEN 2024 - Pregunta ${firstQuestion.questionnumber}/100\n⏰ Tiempo límite: 3 horas\n\n`;
    const pollQuestion = truncatePollQuestion(pollHeader, firstQuestion.question);
    
    // Parsear las opciones desde JSON string
    let parsedOptions: string[];
    try {
      parsedOptions = typeof firstQuestion.options === 'string' 
        ? cleanMalformedOptionsJSON(firstQuestion.options) 
        : firstQuestion.options;
    } catch (error) {
      console.error('❌ Error parseando opciones de primera pregunta simulacro 2024:', error);
      return `❌ <b>Error en formato de pregunta</b>\n\nLa primera pregunta tiene un formato incorrecto. Contacta al administrador.`;
    }

    const success = await sendTelegramPoll(
      fromtelegramuser.id,
      pollQuestion,
      parsedOptions,
      firstQuestion.correctanswerindex,
      firstQuestion.id,
      'simulacro2024'
    );
    
    if (!success) {
      // Si falla el envío, marcar simulacro como abandonado
      await ensurePrisma().simulacro.update({
        where: { id: simulacro.id },
        data: { status: 'abandoned' }
      });
      
      return `❌ <b>ERROR ENVIANDO PREGUNTA</b>

No se pudo enviar la primera pregunta del simulacro. Solo puedes usar este comando en el chat privado con el bot @OpoMelillaBot.`;
    }
    
    // Devolver null porque ya enviamos la notificación antes
    return null;
    
  } catch (error) {
    console.error('❌ Error en simulacro2024:', error);
    return `❌ <b>Error iniciando simulacro 2024</b>

Ha ocurrido un error. Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /ranking_oficial2018 - Ranking específico del examen 2018
async function handleRankingOficial2018Command(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🏆 RANKING_OFICIAL2018 COMMAND - Ranking específico del examen 2018');
    
    // Obtener ranking específico del examen 2018
    const ranking = await ExamRankingService.getExam2018Ranking(10);
    
    if (!ranking || ranking.length === 0) {
      return `❌ <b>No hay datos disponibles</b>

📊 El ranking del examen oficial 2018 no tiene datos suficientes aún.

💡 <b>Para aparecer en el ranking:</b>
• Usa <code>/simulacro2018</code> para practicar
• Responde preguntas del examen 2018

🎯 <code>/examen2018</code> - Practicar más`;
    }
    
    return formatExamRanking(ranking, '2018');
    
  } catch (error) {
    console.error('❌ Error en ranking_oficial2018:', error);
    return `❌ <b>Error obteniendo ranking</b>

Hubo un problema al obtener el ranking específico del examen 2018. Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /ranking_oficial2024 - Ranking específico del examen 2024
async function handleRankingOficial2024Command(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🏆 RANKING_OFICIAL2024 COMMAND - Ranking específico del examen 2024');
    
    // Obtener ranking específico del examen 2024
    const ranking = await ExamRankingService.getExam2024Ranking(10);
    
    if (!ranking || ranking.length === 0) {
      return `❌ <b>No hay datos disponibles</b>

📊 El ranking del examen oficial 2024 no tiene datos suficientes aún.

💡 <b>Para aparecer en el ranking:</b>
• Usa <code>/simulacro2024</code> para practicar
• Responde preguntas del examen 2024

🎯 <code>/examen2024</code> - Practicar más`;
    }
    
    return formatExamRanking(ranking, '2024');
    
  } catch (error) {
    console.error('❌ Error en ranking_oficial2024:', error);
    return `❌ <b>Error obteniendo ranking</b>

Hubo un problema al obtener el ranking específico del examen 2024. Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /comparativa_examenes - Comparativa personal entre exámenes
async function handleComparativaExamenesCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('📊 COMPARATIVA_EXAMENES COMMAND - Comparativa personal entre exámenes');
    
    // Obtener comparativa personal de ambos exámenes
    const comparison = await ExamRankingService.getUserExamComparison(userid);
    
    if (!comparison) {
      return `❌ <b>Error obteniendo comparación</b>

Hubo un problema al obtener la comparación entre los exámenes. Inténtalo de nuevo en unos minutos.`;
    }
    
    return formatExamComparison(comparison, fromtelegramuser.first_name || fromtelegramuser.username || 'Usuario');
    
  } catch (error) {
    console.error('❌ Error en comparativa_examenes:', error);
    return `❌ <b>Error obteniendo comparación</b>

Hubo un problema al obtener la comparación entre los exámenes. Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para manejar comando /simulacro_oficial - Selector de simulacro oficial
async function handleSimulacroOficialCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🎯 SIMULACRO_OFICIAL COMMAND - Selector de simulacro oficial');
    
    return `🎯 <b>SELECCIONA TU SIMULACRO OFICIAL</b> 🎯

📋 <b>Exámenes oficiales disponibles:</b>

🥇 <b>EXAMEN 2018</b>
• 100 preguntas del examen oficial
• Tiempo: 3 horas (180 minutos)
• Comando: <code>/simulacro2018</code>

🥈 <b>EXAMEN 2024</b>
• 100 preguntas del examen oficial
• Tiempo: 3 horas (180 minutos)
• Comando: <code>/simulacro2024</code>

📊 <b>COMPARAR TUS RESULTADOS:</b>
• <code>/comparativa_examenes</code> - Tu rendimiento en ambos

🏆 <b>VER RANKINGS:</b>
• <code>/ranking_oficial2018</code> - Mejores del 2018
• <code>/ranking_oficial2024</code> - Mejores del 2024

💡 <b>¿Cuál prefieres practicar?</b>`;
    
  } catch (error) {
    console.error('❌ Error en simulacro_oficial:', error);
    return `❌ <b>Error obteniendo selector</b>

Hubo un problema al obtener el selector de simulacro oficial. Inténtalo de nuevo en unos minutos.`;
  }
}

// Función para formatear ranking específico de exámen
function formatExamRanking(ranking: any[], examYear: string): string {
  let message = `🏆 <b>RANKING OFICIAL ${examYear}</b> 🏆\n\n`;
  
  ranking.forEach((entry, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔸';
    // Priorizar firstname/firstName, luego username, luego "Usuario"
    const name = entry.user.firstName || entry.user.firstname || entry.user.username || 'Usuario';
    
    message += `${medal} <b>${entry.rank}.</b> ${name}\n`;
    message += `   📊 ${entry.correctanswers}/${entry.totalquestions} correctas (${Math.round(entry.accuracy)}%)\n`;
    message += `   ⏱️ Tiempo promedio: ${Math.round(entry.averageTime)}s\n`;
    message += `   📅 Último intento: ${entry.lastAttempt.toLocaleDateString()}\n\n`;
  });

  message += `🎯 <b>¡Usa /simulacro${examYear === '2024' ? '2024' : ''} para mejorar tu posición!</b>`;

  return message;
}

// Función para formatear comparativa de exámenes
function formatExamComparison(comparison: any, userName: string): string {
  let message = `📊 <b>COMPARATIVA DE EXÁMENES</b>\n`;
  message += `👤 ${userName}\n\n`;
  
  // Examen 2018
  message += `🥇 <b>EXAMEN 2018:</b>\n`;
  if (comparison.exam2018.attempted) {
    message += `   📊 ${comparison.exam2018.correctanswers}/${comparison.exam2018.totalquestions} correctas (${Math.round(comparison.exam2018.accuracy)}%)\n`;
    message += `   ⏱️ Tiempo promedio: ${Math.round(comparison.exam2018.averageTime)}s\n`;
    if (comparison.exam2018.rank) {
      message += `   🏆 Posición en ranking: #${comparison.exam2018.rank}\n`;
    }
    message += `   📅 Último intento: ${comparison.exam2018.lastAttempt?.toLocaleDateString() || 'N/A'}\n`;
  } else {
    message += `   ❌ No has intentado este examen\n`;
  }
  
  message += `\n🥈 <b>EXAMEN 2024:</b>\n`;
  if (comparison.exam2024.attempted) {
    message += `   📊 ${comparison.exam2024.correctanswers}/${comparison.exam2024.totalquestions} correctas (${Math.round(comparison.exam2024.accuracy)}%)\n`;
    message += `   ⏱️ Tiempo promedio: ${Math.round(comparison.exam2024.averageTime)}s\n`;
    if (comparison.exam2024.rank) {
      message += `   🏆 Posición en ranking: #${comparison.exam2024.rank}\n`;
    }
    message += `   📅 Último intento: ${comparison.exam2024.lastAttempt?.toLocaleDateString() || 'N/A'}\n`;
  } else {
    message += `   ❌ No has intentado este examen\n`;
  }
  
  // Resumen general
  message += `\n📈 <b>RESUMEN GENERAL:</b>\n`;
  message += `   🎯 Total preguntas: ${comparison.overall.totalquestions}\n`;
  message += `   📊 Precisión global: ${Math.round(comparison.overall.globalAccuracy)}%\n`;
  
  if (comparison.overall.strongerExam !== 'equal') {
    const stronger = comparison.overall.strongerExam === '2024' ? 'EXAMEN 2024' : 'EXAMEN 2018';
    const icon = comparison.overall.strongerExam === '2024' ? '🚀' : '📈';
    message += `   ${icon} Tu fuerte: ${stronger}\n`;
  }
  
  if (Math.abs(comparison.overall.improvement) > 1) {
    const icon = comparison.overall.improvement > 0 ? '📈' : '📉';
    const direction = comparison.overall.improvement > 0 ? 'mejora' : 'disminución';
    message += `   ${icon} ${direction}: ${Math.abs(Math.round(comparison.overall.improvement))}%\n`;
  }
  
  message += `\n💡 <b>Comandos útiles:</b>\n`;
  message += `• <code>/simulacro2018</code> - Practicar 2018\n`;
  message += `• <code>/simulacro2024</code> - Practicar 2024\n`;
  message += `• <code>/ranking_oficial2018</code> - Ver ranking 2018\n`;
  message += `• <code>/ranking_oficial2024</code> - Ver ranking 2024`;
  
  return message;
}

// 🆕 NUEVO: Función para manejar nuevos miembros
async function handleNewChatMembers(message: any): Promise<NextResponse> {
  try {
    const chatid = message.chat.id;
    const chatType = message.chat.type;
    const newMembers = message.new_chat_members;

    // Solo procesar en grupos/supergrupos
    if (chatType !== 'group' && chatType !== 'supergroup') {
      console.log('👋 NUEVOS MIEMBROS - Ignorado: no es un grupo');
      return NextResponse.json({ ok: true, message: 'No es grupo' });
    }

    console.log('👋 NUEVOS MIEMBROS - Procesando:', {
      chatid,
      chatType,
      memberCount: newMembers.length,
      members: newMembers.map((member: any) => ({
        id: member.id,
        firstname: member.first_name,
        username: member.username,
        isBot: member.is_bot
      }))
    });

    // Filtrar solo usuarios humanos (no bots)
    const humanMembers = newMembers.filter((member: any) => !member.is_bot);

    if (humanMembers.length === 0) {
      console.log('👋 NUEVOS MIEMBROS - Solo bots detectados, ignorando');
      return NextResponse.json({ ok: true, message: 'Solo bots' });
    }

    // Crear mensaje de bienvenida personalizado
    const memberNames = humanMembers.map((member: any) => 
      member.first_name || member.username || 'Usuario'
    ).join(', ');

    const welcomeMessage = `🎉 ¡Bienvenid${humanMembers.length > 1 ? 'os' : 'o'} al sistema de gamificación Permanencia OpoMelilla!

👋 ¡Hola ${memberNames}!

🎯 <b>PASOS IMPORTANTES PARA EMPEZAR:</b>

1️⃣ <b>Configura el bot privado:</b>
   • Busca <code>@OpoMelillaBot</code> en Telegram
   • Envía <code>/start</code> al bot
   • ¡Solo toma 10 segundos!

2️⃣ <b>¿Por qué es necesario?</b>
   • Para recibir notificaciones privadas
   • Para test privado en el chat del bot
   • Para test sin spam en grupo
   • Para gestionar tu perfil y estadísticas

🎮 <b>COMANDOS PRINCIPALES:</b>
• <code>/ranking</code> - Ver clasificación general
• <code>/stats</code> - Consultar tus estadísticas
• <code>/constitucion10</code> - Realiza test por temas
• <code>/examen2024</code> - Examen oficial de 2024
• <code>/simulacro2018</code> - Simulacro completo

⚠️ <b>IMPORTANTE:</b> 
Primero debes interactuar con <code>@OpoMelillaBot</code> en privado para que funcionen todos los comandos del grupo.

🏆 <b>SISTEMA DE PUNTOS:</b>
• ✅ Respuesta correcta: 10 puntos
• ❌ Respuesta incorrecta: Resta puntos dependiendo el nivel  
• 🔥 Bonus velocidad: +5 pts (&lt; 30s)
• ⚡ Bonus ultra rápido: +10 pts (&lt; 10s)

💡 <b>¡Responde preguntas, mantén rachas diarias y compite por el primer lugar!</b>

🚀 ¡Que comience la diversión!`;

    // Enviar mensaje de bienvenida
    const result = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatid,
        text: welcomeMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
    });

    const responseData = await result.json();

    if (responseData.ok) {
      console.log('✅ NUEVOS MIEMBROS - Mensaje de bienvenida enviado exitosamente');
      
      // Opcional: Programar borrado del mensaje después de 5 minutos para evitar spam
      setTimeout(async () => {
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatid,
              message_id: responseData.result.message_id
            })
          });
          console.log('🗑️ Mensaje de bienvenida eliminado después de 5 minutos');
        } catch (error) {
          console.log('⚠️ No se pudo eliminar el mensaje de bienvenida:', error);
        }
      }, 5 * 60 * 1000); // 5 minutos

    } else {
      console.error('❌ NUEVOS MIEMBROS - Error enviando mensaje:', responseData);
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Nuevos miembros procesados',
      membersWelcomed: humanMembers.length
    }, { headers: {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});

  } catch (error) {
    console.error('❌ NUEVOS MIEMBROS - Error general:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Error procesando nuevos miembros' 
    }, { headers: {
    'ngrok-skip-browser-warning': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
});
  }
}

// 🏆 SISTEMA DE TORNEOS - FUNCIONES DE MANEJO
// ===============================================

async function handleTorneoCommand(userid: string, fromtelegramuser: any, messageText: string): Promise<string | null> {
  try {
    console.log('🏆 TORNEO COMMAND - Procesando:', { userid, messageText });

    // Verificar si el usuario existe en la base de datos
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 <b>Solución:</b>\n1. Envía <code>/start</code> al bot privado\n2. Luego usa <code>/torneo</code> nuevamente\n\n💡 <b>Tip:</b> Necesitas estar registrado para participar en torneos.`;
    }

    // Verificar puntos mínimos para participar (10 puntos)
    if ((user.totalpoints || 0) < 10) {
      return `⚠️ <b>Puntos insuficientes para torneos</b>\n\n💰 <b>Tu situación:</b>\n• Puntos actuales: ${user.totalpoints || 0}\n• Puntos requeridos: 10\n\n🎯 <b>¿Cómo conseguir puntos?</b>\n• <code>/examen2024</code> - Quiz oficial (+10 pts)\n• <code>/simulacro2018</code> - Simulacro completo (+50 pts)\n• Responder preguntas en el grupo (+10 pts)\n\n💡 <b>¡Gana puntos y vuelve a intentarlo!</b>`;
    }

    await TournamentService.getInstance().ensureTournamentManagerRunning();
    
    // Obtener todos los torneos desde la base de datos
    const allTournaments = await TournamentService.getInstance().getTournamentList(user.id);

    if (allTournaments.length === 0) {
      return `🏆 <b>SISTEMA DE TORNEOS</b>\n\n` +
             `⚠️ <b>No hay torneos disponibles ahora mismo</b>\n\n` +
             `🕐 Los torneos se crean automáticamente cada hora\n` +
             `📅 Próximo torneo: Consulta en unos minutos\n\n` +
             `💡 <b>Comandos útiles:</b>\n` +
             `• <code>/torneos</code> - Ver lista completa\n` +
             `• <code>/torneo_historial</code> - Tu historial`;
    }

    // 📅 FILTRAR SOLO TORNEOS DE LA SEMANA ACTUAL
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Inicio de la semana (domingo)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Final de la semana (sábado)
    endOfWeek.setHours(23, 59, 59, 999);

    // Filtrar torneos de esta semana que estén programados o en progreso
    const availableTournaments = allTournaments.filter(tournament => {
      const tournamentDate = new Date(tournament.scheduleddate);
      const isInWeek = tournamentDate >= startOfWeek && tournamentDate <= endOfWeek;
      const isAvailable = tournament.status === 'SCHEDULED' || tournament.status === 'IN_PROGRESS';
      return isInWeek && isAvailable;
    });

    if (availableTournaments.length === 0) {
      return `🏆 <b>TORNEOS DISPONIBLES</b>\n\n` +
             `📅 <b>No hay torneos disponibles esta semana</b>\n\n` +
             `🔮 <b>Próximos torneos:</b>\n` +
             `• Los torneos se crean automáticamente\n` +
             `• Nuevos horarios: 10:30, 16:00, 20:00\n` +
             `• Martes, Jueves, Sábados y Domingos\n\n` +
             `💡 <b>Comandos útiles:</b>\n` +
             `• <code>/torneos</code> - Ver lista completa de la semana\n` +
             `• <code>/torneo_historial</code> - Tu historial\n\n` +
             `ℹ️ <i>Solo se muestran torneos disponibles de esta semana</i>`;
    }

    let message = `🏆 <b>TORNEOS DISPONIBLES</b>\n`;
    message += `📅 ${startOfWeek.toLocaleDateString('es-ES')} - ${endOfWeek.toLocaleDateString('es-ES')}\n\n`;
    
    availableTournaments.forEach((tournament, index) => {
      const date = new Date(tournament.scheduleddate);
      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const status = tournament.status === 'SCHEDULED' ? '⏰ Programado' : '🔥 En curso';
      
      message += `${index + 1}. <b>${tournament.name}</b>\n`;
      message += `   📅 ${timeStr} | ${status}\n`;
      message += `   👥 ${tournament._count.participants} | 💰 ${tournament.prizepool || 100} pts\n`;
      message += `   📝 ${tournament.questionscount} preguntas\n`;
      message += `   🎫 <code>/torneo_unirse ${index + 1}</code>\n\n`;
    });

    message += `💡 <b>Cómo participar:</b>\n`;
    message += `1. Usa <code>/torneo_unirse [número]</code>\n`;
    message += `2. ¡Espera a que inicie el torneo!\n`;
    message += `3. Responde las preguntas rápidamente\n\n`;
    message += `⚡ <b>Respuesta instantánea:</b> En cuanto respondas, recibes la siguiente pregunta\n\n`;
    message += `ℹ️ <i>Solo se muestran torneos disponibles de esta semana</i>`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleTorneoCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleTorneosListCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🏆 TORNEOS LIST COMMAND - Procesando:', { userid });

    // Obtener todos los torneos usando el servicio
    const allTournaments = await TournamentService.getInstance().getTournamentList(userid);

    if (allTournaments.length === 0) {
      return `🏆 <b>No hay torneos registrados</b>\n\n💡 ¡Sé el primero en crear actividad competitiva!`;
    }

    // 📅 FILTRAR SOLO TORNEOS DE LA SEMANA ACTUAL
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Inicio de la semana (domingo)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Final de la semana (sábado)
    endOfWeek.setHours(23, 59, 59, 999);

    // Filtrar torneos de esta semana
    const tournaments = allTournaments.filter(tournament => {
      const tournamentDate = new Date(tournament.scheduleddate);
      return tournamentDate >= startOfWeek && tournamentDate <= endOfWeek;
    });

    if (tournaments.length === 0) {
      return `🏆 <b>TORNEOS DE ESTA SEMANA</b>\n\n` +
             `📅 <b>No hay torneos programados para esta semana</b>\n\n` +
             `🔮 <b>Próxima semana:</b>\n` +
             `• Los torneos continúan automáticamente\n` +
             `• Nuevos horarios: 10:30, 16:00, 20:00\n` +
             `• Martes, Jueves, Sábados y Domingos\n\n` +
             `💡 <b>Comandos útiles:</b>\n` +
             `• <code>/torneo</code> - Ver torneos disponibles\n` +
             `• <code>/torneo_historial</code> - Tu historial`;
    }

    let message = `🏆 <b>TORNEOS DE ESTA SEMANA</b>\n`;
    message += `📅 ${startOfWeek.toLocaleDateString('es-ES')} - ${endOfWeek.toLocaleDateString('es-ES')}\n\n`;

    const scheduled = tournaments.filter(t => t.status === 'SCHEDULED');
    const inProgress = tournaments.filter(t => t.status === 'IN_PROGRESS');
    const completed = tournaments.filter(t => t.status === 'COMPLETED').slice(0, 3);

    // Torneos programados
    if (scheduled.length > 0) {
      message += `⏰ <b>PRÓXIMOS TORNEOS:</b>\n`;
      scheduled.forEach((tournament, index) => {
        const timeUntilStart = tournament.scheduleddate.getTime() - now.getTime();
        const minutesUntilStart = Math.ceil(timeUntilStart / (1000 * 60));
        const participantCount = tournament._count.participants;

        message += `${index + 1}️⃣ ${tournament.name}\n`;
        message += `   📅 ${tournament.scheduleddate.toLocaleString('es-ES')}\n`;
        message += `   ⏰ En ${minutesUntilStart > 0 ? `${minutesUntilStart} min` : '¡Ya!'}\n`;
        message += `   👥 ${participantCount}/${tournament.maxparticipants} participantes\n\n`;
      });
    }

    // Torneos en progreso
    if (inProgress.length > 0) {
      message += `🔥 <b>EN PROGRESO:</b>\n`;
      inProgress.forEach((tournament) => {
        const participantCount = tournament._count.participants;
        
        message += `🎯 ${tournament.name}\n`;
        message += `   👥 ${participantCount} participantes activos\n`;
        message += `   📊 Estado: En desarrollo\n\n`;
      });
    }

    // Torneos recientes completados
    if (completed.length > 0) {
      message += `🏁 <b>RECIENTES COMPLETADOS:</b>\n`;
      completed.forEach((tournament) => {
        const participantCount = tournament._count.participants;
        
        message += `✅ ${tournament.name}\n`;
        message += `   📅 ${tournament.scheduleddate.toLocaleDateString('es-ES')}\n`;
        message += `   👥 ${participantCount} participantes\n`;
        message += `   🏆 Premio: ${tournament.prizepool} pts\n\n`;
      });
    }

    message += `📊 <b>RESUMEN SEMANAL:</b>\n`;
    message += `• Programados: ${scheduled.length}\n`;
    message += `• En progreso: ${inProgress.length}\n`;
    message += `• Completados: ${completed.length}\n\n`;

    message += `🎮 <b>COMANDOS:</b>\n`;
    message += `• <code>/torneo</code> - Unirse a torneo disponible\n`;
    message += `• <code>/torneo_historial</code> - Tu historial completo\n`;
    message += `• <code>/ranking</code> - Ver clasificación general\n\n`;

    message += `ℹ️ <i>Solo se muestran torneos de esta semana</i>`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleTorneosListCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleTorneoJoinCommand(userid: string, fromtelegramuser: any, messageText: string): Promise<string | null> {
  try {
    console.log('🏆 TORNEO JOIN COMMAND - Procesando:', { userid, messageText });

    // Extraer parámetro del torneo (número o UUID)
    const match = messageText.match(/\/torneo_unirse\s+(\S+)/);
    if (!match) {
      return `❌ <b>Formato incorrecto</b>

🔧 <b>Uso correcto:</b>
<code>/torneo_unirse [número o ID]</code>

💡 <b>Ejemplos:</b>
<code>/torneo_unirse 1</code> - Unirse al primer torneo
<code>/torneo_unirse abc123-def456</code> - Unirse por ID del torneo

ℹ️ Usa <code>/torneo</code> para ver torneos disponibles con números.`;
    }

    const tournamentParam = match[1];
    let selectedTournament;

    // Verificar usuario
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> al bot privado primero.`;
    }

    // Verificar puntos mínimos
    if ((user.totalpoints || 0) < 10) {
      return `⚠️ <b>Puntos insuficientes</b>\n\nNecesitas al menos 10 puntos para participar.\nPuntos actuales: ${user.totalpoints || 0}`;
    }

    // Determinar si es un número o un UUID
    const isNumber = /^\d+$/.test(tournamentParam);
    
    if (isNumber) {
      // Lógica original: buscar por número en la lista
      const tournamentNumber = parseInt(tournamentParam);
      
      // Obtener torneos disponibles
      const availableTournaments = await TournamentService.getInstance().getTournamentList(user.id);

      if (availableTournaments.length === 0) {
        return `❌ <b>No hay torneos disponibles</b>\n\n💡 Usa <code>/torneos</code> para ver el estado actual.`;
      }

      if (tournamentNumber < 1 || tournamentNumber > availableTournaments.length) {
        return `❌ <b>Número de torneo inválido</b>\n\n📊 <b>Torneos disponibles:</b> 1 a ${availableTournaments.length}\n\n💡 Usa <code>/torneo</code> para ver la lista con números.`;
      }

      selectedTournament = availableTournaments[tournamentNumber - 1];
    } else {
      // Nueva lógica: buscar por UUID directamente
      try {
        selectedTournament = await ensurePrisma().tournament.findUnique({
          where: { id: tournamentParam }
        });

        if (!selectedTournament) {
          return `❌ <b>Torneo no encontrado</b>\n\nEl ID del torneo no es válido o el torneo ya no existe.\n\n💡 Usa <code>/torneo</code> para ver torneos disponibles.`;
        }

        // Obtener el conteo de participantes por separado
        const participantCount = await ensurePrisma().tournamentparticipant.count({
          where: { tournamentid: selectedTournament.id }
        });

        // Agregar el conteo al objeto selectedTournament
        (selectedTournament as any)._count = { participants: participantCount };

        // Verificar que el torneo esté disponible para el usuario
        const now = new Date();
        if (selectedTournament.scheduleddate <= now) {
          return `❌ <b>Torneo ya iniciado</b>\n\n🏆 <b>Torneo:</b> ${selectedTournament.name}\n⏰ El torneo ya ha comenzado.\n\n💡 Usa <code>/torneo</code> para ver otros torneos disponibles.`;
        }

        // Verificar si el usuario ya está registrado
        const existingParticipation = await ensurePrisma().tournamentparticipant.findFirst({
          where: {
            tournamentid: selectedTournament.id,
            userid: user.id
          }
        });

        if (existingParticipation) {
          return `ℹ️ <b>Ya estás registrado</b>\n\n🏆 <b>Torneo:</b> ${selectedTournament.name}\n📅 <b>Inicio:</b> ${selectedTournament.scheduleddate.toLocaleString('es-ES')}\n\n💡 Usa <code>/torneo_salir</code> si quieres salir del torneo.`;
        }
      } catch (error) {
        console.error('Error buscando torneo por UUID:', error);
        return `❌ <b>Error al buscar torneo</b>\n\nEl ID proporcionado no es válido.\n\n💡 Usa <code>/torneo</code> para ver torneos disponibles.`;
      }
    }

    // Verificar si el torneo está lleno
    const maxParticipants = selectedTournament.maxparticipants || 100; // Default 100 si es null
    if (selectedTournament._count.participants >= maxParticipants) {
      return `❌ <b>Torneo lleno</b>

🏆 <b>Torneo:</b> ${selectedTournament.name}
👥 <b>Participantes:</b> ${selectedTournament._count.participants}/${maxParticipants}

💡 Prueba con otro torneo usando <code>/torneo</code>.`;
    }

    // Verificar si el torneo está muy cerca del inicio (menos de 2 minutos)
    const timeUntilStart = selectedTournament.scheduleddate.getTime() - Date.now();
    const minutesUntilStart = Math.floor(timeUntilStart / (1000 * 60));
    const secondsUntilStart = Math.floor(timeUntilStart / 1000);

    // Si faltan menos de 2 minutos (120 segundos), cerrar inscripciones
    if (secondsUntilStart < 120) {
      const displayMinutes = Math.max(0, minutesUntilStart);
      return `⏰ <b>Demasiado tarde</b>

🏆 <b>Torneo:</b> ${selectedTournament.name}
⏰ <b>Inicio:</b> En ${displayMinutes} minuto(s)

❌ Las inscripciones se cierran 2 minutos antes del inicio.

💡 Usa <code>/torneo</code> para ver otros torneos disponibles.`;
    }

    // Intentar unirse al torneo usando el servicio
    const joinResult = await TournamentService.getInstance().joinTournament(selectedTournament.id, user.id);

    if (!joinResult.success) {
      return `❌ <b>No se pudo unir al torneo</b>\n\n${joinResult.message}`;
    }

    // Actualizar contador de participantes
    const updatedCount = selectedTournament._count.participants + 1;
    const spotsLeft = maxParticipants - updatedCount;

    const successMessage = `✅ <b>¡Registrado exitosamente!</b>

🏆 <b>Torneo:</b> ${selectedTournament.name}
📝 <b>Descripción:</b> ${selectedTournament.description}
📅 <b>Inicio:</b> ${selectedTournament.scheduleddate.toLocaleString('es-ES')}
⏰ <b>En:</b> ${minutesUntilStart} minutos
🎯 <b>Preguntas:</b> ${selectedTournament.questionscount}
💰 <b>Premios por posición:</b>
   🥇 1° lugar: 100 puntos
   🥈 2° lugar: 90 puntos  
   🥉 3° lugar: 80 puntos
   📊 4° lugar y siguientes: decreciente
👥 <b>Participantes:</b> ${updatedCount}/${maxParticipants}

${spotsLeft <= 3 && spotsLeft > 0 ? `🔥 ¡Solo quedan ${spotsLeft} lugares!` : ''}
${spotsLeft === 0 ? '🎉 ¡Torneo completo!' : ''}

🎮 <b>SIGUIENTE PASO:</b>
Espera al inicio del torneo. Recibirás las preguntas automáticamente en privado.

💡 <b>Comandos útiles:</b>
• <code>/torneo_salir</code> - Salir del torneo (si no ha iniciado)
• <code>/torneos</code> - Ver otros torneos

🍀 ¡Buena suerte!`;

    console.log('✅ Usuario registrado en torneo:', {
      userid,
      tournamentId: selectedTournament.id,
      joinResult: joinResult.success
    });

    return successMessage;

  } catch (error) {
    console.error('❌ Error en handleTorneoJoinCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleTorneoLeaveCommand(userid: string, fromtelegramuser: any, messageText: string): Promise<string | null> {
  try {
    console.log('🏆 TORNEO LEAVE COMMAND - Procesando:', { userid });

    // Verificar usuario
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> al bot privado primero.`;
    }

    // Intentar salir usando el servicio (simplificado por ahora)
    return `ℹ️ <b>Función en desarrollo</b>

🔧 La función de salir del torneo está siendo actualizada.

💡 <b>Mientras tanto:</b>
• Usa <code>/torneo</code> para ver torneos disponibles
• Usa <code>/torneo_historial</code> para ver tu historial`;

  } catch (error) {
    console.error('❌ Error en handleTorneoLeaveCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleTorneoHistoryCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🏆 TORNEO HISTORY COMMAND - Procesando:', { userid });

    // Verificar usuario
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> al bot privado primero.`;
    }

    // Obtener historial usando el servicio
    const participations = await TournamentService.getInstance().getUserTournamentHistory(user.id);

    if (participations.length === 0) {
      return `📊 <b>Historial de Torneos</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

❌ <b>No has participado en torneos aún</b>

🎮 <b>¡Comienza tu historia competitiva!</b>
• <code>/torneo</code> - Ver torneos disponibles
• <code>/torneos</code> - Lista completa de torneos

💡 <b>Los torneos te permiten:</b>
• Competir contra otros usuarios
• Ganar puntos extra
• Demostrar tu conocimiento
• ¡Divertirte mientras estudias!`;
    }

    let message = `📊 <b>HISTORIAL DE TORNEOS</b>\n\n`;
    message += `👤 <b>${user.firstname || user.username || 'Usuario'}</b>\n\n`;

    // Calcular estadísticas generales
    const completed = participations.filter(p => p.status === 'COMPLETED');
    const inProgress = participations.filter(p => p.status === 'IN_PROGRESS');
    const registered = participations.filter(p => p.status === 'REGISTERED');
    
    const totalScore = completed.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalCorrect = completed.reduce((sum, p) => sum + (p.correctanswers || 0), 0);
    const totalQuestions = completed.reduce((sum, p) => sum + p.responses.length, 0);
    const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    message += `📈 <b>ESTADÍSTICAS GENERALES:</b>\n`;
    message += `🏆 Torneos completados: ${completed.length}\n`;
    message += `⏳ En progreso: ${inProgress.length}\n`;
    message += `📝 Registrado: ${registered.length}\n`;
    message += `💰 Puntos totales ganados: ${totalScore}\n`;
    message += `🎯 Precisión promedio: ${averageAccuracy}%\n\n`;

    // Mostrar últimos 5 torneos
    const recentParticipations = participations.slice(0, 5);

    message += `📋 <b>PARTICIPACIONES RECIENTES:</b>\n`;

    recentParticipations.forEach((participation, index) => {
      const tournament = participation.tournament;
      const status = participation.status;
      const score = participation.score || 0;
      const correctAnswers = participation.correctanswers || 0;
      const totalResponses = participation.responses.length;

      let statusEmoji = '';
      let statusText = '';

      switch (status) {
        case 'COMPLETED':
          statusEmoji = '✅';
          statusText = 'Completado';
          break;
        case 'IN_PROGRESS':
          statusEmoji = '⏳';
          statusText = 'En progreso';
          break;
        case 'REGISTERED':
          statusEmoji = '📝';
          statusText = 'Registrado';
          break;
        default:
          statusEmoji = '❓';
          statusText = status;
      }

      message += `${index + 1}️⃣ <b>${tournament.name}</b>\n`;
      message += `   📅 ${tournament.scheduleddate.toLocaleDateString('es-ES')}\n`;
      message += `   ${statusEmoji} Estado: ${statusText}\n`;
      
      if (status === 'COMPLETED') {
        message += `   💰 Puntos: ${score}\n`;
        message += `   🎯 Correctas: ${correctAnswers}/${tournament.questionscount}\n`;
        const accuracy = tournament.questionscount > 0 ? Math.round((correctAnswers / tournament.questionscount) * 100) : 0;
        message += `   📊 Precisión: ${accuracy}%\n`;
      } else if (status === 'IN_PROGRESS') {
        message += `   🎯 Progreso: ${totalResponses}/${tournament.questionscount} preguntas\n`;
        if (totalResponses > 0) {
          message += `   💰 Puntos actuales: ${score}\n`;
        }
      } else if (status === 'REGISTERED') {
        const timeUntilStart = tournament.scheduleddate.getTime() - Date.now();
        const minutesUntilStart = Math.ceil(timeUntilStart / (1000 * 60));
        if (minutesUntilStart > 0) {
          message += `   ⏰ Inicia en: ${minutesUntilStart} minutos\n`;
        } else {
          message += `   🔥 ¡Iniciando pronto!\n`;
        }
      }
      
      message += `\n`;
    });

    if (participations.length > 5) {
      message += `📊 <i>... y ${participations.length - 5} más en tu historial</i>\n\n`;
    }

    // Mejores resultados
    if (completed.length > 0) {
      const bestScore = Math.max(...completed.map(p => p.score || 0));
      const bestAccuracy = Math.max(...completed.map(p => {
        const correct = p.correctanswers || 0;
        const total = p.tournament.questionscount;
        return total > 0 ? Math.round((correct / total) * 100) : 0;
      }));

      message += `🏅 <b>MEJORES RESULTADOS:</b>\n`;
      message += `💰 Mayor puntuación: ${bestScore} puntos\n`;
      message += `🎯 Mejor precisión: ${bestAccuracy}%\n\n`;
    }

    message += `🎮 <b>COMANDOS:</b>\n`;
    message += `• <code>/torneo</code> - Unirse a nuevo torneo\n`;
    message += `• <code>/torneos</code> - Ver torneos disponibles\n`;
    message += `• <code>/ranking</code> - Clasificación general`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleTorneoHistoryCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

// ==============================================
// 🎯 HANDLERS DE SESIONES DE ESTUDIO PRIVADAS
// ==============================================

async function handleStudyCommand(
  userid: string, 
  message: any, 
  studyCommand: { subject: string; quantity: number; type?: 'normal' | 'failed' | 'random' }
): Promise<string | null> {
  try {
    const sessionType = studyCommand.type || 'normal';
    console.log(`🎯 STUDY COMMAND - Usuario: ${userid}, Materia: ${studyCommand.subject}, Cantidad: ${studyCommand.quantity}, Tipo: ${sessionType}`);

    // Verificar que es un chat privado
    if (message.chat && message.chat.type !== 'private') {
      const commandExample = sessionType === 'failed' ? 
        (studyCommand.subject === 'all' ? '/falladas5' : `/${studyCommand.subject}falladas${studyCommand.quantity}`) :
        `/${studyCommand.subject}${studyCommand.quantity}`;
        
      return `⚠️ <b>Solo chat privado</b>\n\n` +
             `🔒 Los comandos de estudio solo funcionan en <b>chat privado</b> con el bot.\n\n` +
             `💡 <b>Cómo usarlo:</b>\n` +
             `1. Abre un chat privado con @OpoMelillaBot\n` +
             `2. Usa el comando: ${commandExample}\n\n` +
             `📚 <b>Comandos disponibles:</b>\n` +
             `• /constitucion10, /defensanacional5, /rjsp15\n` +
             `• /falladas, /constitucionfalladas5\n` +
             `• /stop, /progreso`;
    }

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n` +
             `🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // ⭐ NUEVA FUNCIONALIDAD: Verificar permisos y cuotas de suscripción
    console.log('🔐 Verificando permisos de suscripción para comandos de estudio...');
    
    // Verificación directa de suscripción usando SQL (similar a /mi_plan que funciona)
    const subscriptionCheck = await prisma.$queryRaw`
      SELECT 
        tu.telegramuserid,
        tu.firstname,
        s.id as subscriptionId,
        s.status,
        s.enddate,
        p.name as planName,
        p.displayname as planDisplayName,
        p.canusefailedquestions
      FROM telegramuser tu
      LEFT JOIN usersubscription s ON tu.id = s.userid AND s.status = 'active' AND s.enddate >= NOW()
      LEFT JOIN subscriptionplan p ON s.planid = p.id
      WHERE tu.telegramuserid = ${userid}
      LIMIT 1
    ` as any[];

    const userSubscription = subscriptionCheck[0];
    const featureType = sessionType === 'failed' ? 'failed_questions' : 'questions';
    
    // Verificar acceso a la funcionalidad
    let accessResult: { allowed: boolean; reason?: string; currentPlan?: string; requiredPlan?: string; remainingQuota?: number };
    
    if (!userSubscription) {
      accessResult = {
        allowed: false,
        reason: 'Usuario no encontrado'
      };
    } else if (!userSubscription.planName) {
      // Usuario sin suscripción (plan gratuito)
      accessResult = {
        allowed: false,
        reason: 'Las preguntas falladas requieren suscripción',
        currentPlan: 'Gratuito',
        requiredPlan: 'Básico'
      };
    } else if (featureType === 'failed_questions' && !userSubscription.canusefailedquestions) {
      // Plan que no incluye preguntas falladas
      accessResult = {
        allowed: false,
        reason: 'Tu plan no incluye acceso a preguntas falladas',
        currentPlan: userSubscription.planDisplayName,
        requiredPlan: 'Básico'
      };
    } else {
      // Todo correcto
      accessResult = { allowed: true };
      console.log(`✅ Acceso autorizado: Usuario ${userSubscription.firstname} con plan ${userSubscription.planDisplayName}`);
    }

    if (!accessResult.allowed) {
      console.log('❌ Acceso denegado por límites de suscripción:', accessResult.reason);
      
      // Generar mensaje de upgrade personalizado
      let upgradeMessage = `🔒 <b>Límite de Suscripción Alcanzado</b>\n\n`;
      upgradeMessage += `❌ ${accessResult.reason}\n\n`;
      
      if (accessResult.currentPlan) {
        upgradeMessage += `📋 <b>Tu plan actual:</b> ${accessResult.currentPlan}\n`;
      }
      
      if (accessResult.remainingQuota !== undefined && accessResult.remainingQuota > 0) {
        upgradeMessage += `📊 <b>Restante hoy:</b> ${accessResult.remainingQuota} preguntas\n`;
      }
      
      if (accessResult.requiredPlan) {
        upgradeMessage += `💎 <b>Plan requerido:</b> ${accessResult.requiredPlan}\n\n`;
        
        if (accessResult.requiredPlan === 'Premium') {
          upgradeMessage += `🚀 <b>¡Actualiza a Premium!</b>\n`;
          upgradeMessage += `• ♾️ Preguntas ilimitadas\n`;
          upgradeMessage += `• 🎯 Simulacros personalizados\n`;
          upgradeMessage += `• 📊 Estadísticas avanzadas\n`;
          upgradeMessage += `• 🔗 Integración Moodle\n`;
          upgradeMessage += `• 🤖 Análisis con IA\n\n`;
          upgradeMessage += `💳 <code>/premium</code> - Ver planes Premium`;
        } else {
          upgradeMessage += `📚 <b>¡Suscríbete al plan Básico!</b>\n`;
          upgradeMessage += `• 100 preguntas diarias\n`;
          upgradeMessage += `• Sistema de preguntas falladas\n`;
          upgradeMessage += `• Estadísticas básicas\n\n`;
          upgradeMessage += `💳 <code>/basico</code> - Ver plan Básico (€4.99/mes)`;
        }
      } else {
        upgradeMessage += `💡 <b>Opciones:</b>\n`;
        upgradeMessage += `• <code>/planes</code> - Ver todos los planes\n`;
        upgradeMessage += `• <code>/mi_plan</code> - Ver tu suscripción actual`;
      }
      
      return upgradeMessage;
    }

    console.log('✅ Permisos verificados - usuario puede acceder a la funcionalidad');

    // Crear instancia del servicio
    const studyService = new StudySessionService();

    // Iniciar sesión de estudio (normal, falladas o aleatorias)
    const result = await studyService.startStudySession(
      userid, 
      studyCommand.subject, 
      studyCommand.quantity,
      sessionType
    );

    // ⭐ FUNCIONALIDAD: Tracking de cuota para planes básicos
    if (result.success) {
      console.log('✅ Sesión de estudio iniciada exitosamente');
      
      // Incrementar cuota solo si el usuario tiene suscripción activa
      if (userSubscription && userSubscription.planName) {
        try {
          // Implementación directa del tracking de cuotas usando SQL
          const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
          
          // Verificar si existe registro de uso de hoy
          const existingUsage = await prisma.$queryRaw`
            SELECT * FROM userquotausage 
            WHERE userid = ${user.id} AND date = ${today}
            LIMIT 1
          ` as any[];

          if (existingUsage.length > 0) {
            // Actualizar uso existente
            const currentQuestions = existingUsage[0].questionsUsed || 0;
            const currentFailed = existingUsage[0].failedQuestionsUsed || 0;
            
            if (featureType === 'questions') {
              await prisma.$executeRaw`
                UPDATE userquotausage 
                SET questionsused = ${currentQuestions + studyCommand.quantity},
                    updatedat = NOW()
                WHERE userid = ${user.id} AND date = ${today}
              `;
            } else if (featureType === 'failed_questions') {
              await prisma.$executeRaw`
                UPDATE userquotausage 
                SET failedquestionsused = ${currentFailed + studyCommand.quantity},
                    updatedat = NOW()
                WHERE userid = ${user.id} AND date = ${today}
              `;
            }
          } else {
            // Crear nuevo registro de uso - REQUIERE subscriptionId
            const questionsUsed = featureType === 'questions' ? studyCommand.quantity : 0;
            const failedQuestionsUsed = featureType === 'failed_questions' ? studyCommand.quantity : 0;
            
            // ⚠️ VALIDACIÓN CRÍTICA: Verificar que tenemos subscriptionId
            if (!userSubscription.subscriptionId) {
              console.error(`❌ TRACKING ERROR: No se puede crear registro sin subscriptionId para usuario ${userid}`);
              throw new Error('subscriptionId requerido para crear registro de cuotas');
            }
            
            await prisma.$executeRaw`
              INSERT INTO userquotausage (id, userid, subscriptionid, date, questionsused, failedquestionsused, createdat, updatedat)
              VALUES (UUID(), ${user.id}, ${userSubscription.subscriptionId}, ${today}, ${questionsUsed}, ${failedQuestionsUsed}, NOW(), NOW())
            `;
            
            console.log(`✅ TRACKING: Nuevo registro creado con subscriptionId = ${userSubscription.subscriptionId}`);
          }
          
          console.log(`✅ Cuota incrementada: ${studyCommand.quantity} ${featureType}`);
        } catch (quotaError) {
          console.error('⚠️ Error incrementando cuota (no crítico):', quotaError);
          // No bloquear la funcionalidad si falla el tracking
        }
      } else {
        console.log('ℹ️ Usuario sin suscripción - no se hace tracking de cuota');
      }
    }

    return result.message;

  } catch (error) {
    console.error('❌ Error en handleStudyCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleStopStudySession(userid: string, message: any): Promise<string | null> {
  try {
    console.log(`🛑 STOP STUDY SESSION - Usuario: ${userid}`);

    // Verificar que es un chat privado
    if (message.chat && message.chat.type !== 'private') {
      return `⚠️ <b>Solo chat privado</b>\n\n` +
             `🔒 Los comandos de estudio solo funcionan en <b>chat privado</b> con el bot.`;
    }

    const studyService = new StudySessionService();
    const result = await studyService.stopSession(userid);
    return result.message;

  } catch (error) {
    console.error('❌ Error en handleStopStudySession:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleStudyProgress(userid: string, message: any): Promise<string | null> {
  try {
    console.log(`📊 STUDY PROGRESS - Usuario: ${userid}`);

    // Verificar que es un chat privado
    if (message.chat && message.chat.type !== 'private') {
      return `⚠️ <b>Solo chat privado</b>\n\n` +
             `🔒 Los comandos de estudio solo funcionan en <b>chat privado</b> con el bot.`;
    }

    const studyService = new StudySessionService();
    const result = await studyService.getSessionProgress(userid);
    return result.message;

  } catch (error) {
    console.error('❌ Error en handleStudyProgress:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function sendStudyPoll(userid: string, questionData: any): Promise<boolean> {
  try {
    console.log(`📊 ENVIANDO POLL DE ESTUDIO - Usuario: ${userid}, Pregunta: ${questionData.id}`);

    const question = questionData.question || questionData.pregunta || 'Pregunta no disponible';
    
    // Las opciones pueden venir como array de strings o campos individuales
    let options: string[] = [];
    if (Array.isArray(questionData.options)) {
      // Limpiar opciones eliminando porcentajes al inicio (ej: "%100%texto" -> "texto")
      options = questionData.options.map((option: string) => {
        // Eliminar porcentajes al inicio como "%100%" o "%-33.33333%"
        return option.replace(/^%[-\d.]+%/, '').trim();
      }).filter((option: string) => option && option.length > 0);
    } else {
      // Fallback para formato anterior
      options = [
        questionData.a || questionData.option1,
        questionData.b || questionData.option2, 
        questionData.c || questionData.option3,
        questionData.d || questionData.option4
      ].filter(option => option && option.trim() !== '');
    }

    if (options.length < 2) {
      console.error('❌ Opciones insuficientes para la pregunta:', questionData.id);
      return false;
    }

    // 📏 TRUNCAR OPCIONES QUE SUPEREN EL LÍMITE DE TELEGRAM (100 caracteres por opción)
    const maxOptionLength = options.reduce((max, option) => Math.max(max, option.length), 0);
    if (maxOptionLength > 100) {
      console.log(`⚠️ OPCIONES LARGAS DETECTADAS: Opción más larga (${maxOptionLength} caracteres, máximo 100) - ID: ${questionData.id}`);
      console.log('📋 Opciones problemáticas:', options.map((opt, i) => `${i+1}. ${opt.length} chars: ${opt.substring(0, 50)}...`));
      console.log(`🔧 TRUNCANDO OPCIONES automáticamente para cumplir límites de Telegram`);
      
      // Truncar opciones largas automáticamente
      options = options.map((option, index) => {
        if (option.length > 100) {
          const truncated = option.substring(0, 97) + '...';
          console.log(`   📝 Opción ${index + 1}: ${option.length} → 100 caracteres`);
          return truncated;
        }
        return option;
      });
      
      console.log(`✅ OPCIONES TRUNCADAS: Pregunta ${questionData.id} ahora es compatible con Telegram`);
    }

    // El correctanswerindex ya viene 0-indexed desde la base de datos
    const originalCorrectIndex = questionData.correctanswerindex !== undefined ? 
      questionData.correctanswerindex : 
      (questionData.correcta ? questionData.correcta - 1 : 0);

    // 🎲 RANDOMIZAR OPCIONES PARA EVITAR QUE LA RESPUESTA CORRECTA SIEMPRE SEA LA A
    // Crear array con opciones y sus índices originales
    const optionsWithIndex = options.map((option: string, index: number) => ({
      option,
      originalIndex: index
    }));

    // Mezclar las opciones aleatoriamente
    const shuffledOptions = [...optionsWithIndex].sort(() => Math.random() - 0.5);
    
    // Encontrar la nueva posición de la respuesta correcta después del shuffle
    const newCorrectIndex = shuffledOptions.findIndex(
      item => item.originalIndex === originalCorrectIndex
    );

    // Extraer solo las opciones mezcladas para el poll
    const finalOptions = shuffledOptions.map(item => item.option);

    console.log('🎲 Opciones randomizadas:', {
      original: options,
      shuffled: finalOptions,
      originalCorrectIndex,
      newCorrectIndex,
      correctAnswer: finalOptions[newCorrectIndex]
    });

    // Formatear header con información de progreso
    const header = `🎯 PREGUNTA ${questionData.currentindex}/${questionData.totalquestions}\n` +
                  `📚 ${StudySessionService.getDisplayName(questionData.subject)}\n` +
                  `⏱️ Tiempo límite: 1 minuto\n\n`;

    const fullQuestion = truncatePollQuestion(header, question, 280);

    const pollData = {
      chat_id: userid,
      question: fullQuestion,
      options: JSON.stringify(finalOptions), // Usar opciones mezcladas
      type: 'quiz',
      correct_option_id: newCorrectIndex, // Usar nuevo índice después del shuffle
      is_anonymous: false,
      allows_multiple_answers: false,
      explanation: `✅ La respuesta correcta es: ${finalOptions[newCorrectIndex]}`,
      open_period: 60 // 1 minuto límite
    };

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pollData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error enviando poll de estudio:', errorData);
      return false;
    }

    const data = await response.json();
    const pollid = data.result.poll.id;

    // Guardar mapping temporal en memoria para poder procesar respuesta después
    // TODO: Implementar con Redis o tabla específica para producción
    global.studyPollMappings = global.studyPollMappings || new Map();
    const mappingData = {
      questionid: questionData.id.toString(),
      userid: userid,
      subject: questionData.subject,
      timestamp: Date.now(),
      // 🎲 Guardar el índice correcto después del shuffle para validar respuestas
      correctanswerindex: newCorrectIndex,
      originalCorrectIndex: originalCorrectIndex
    };
    global.studyPollMappings.set(pollid, mappingData);

    // ⏰ PROGRAMAR TIMEOUT PARA ENVIAR SIGUIENTE PREGUNTA SI NO HAY RESPUESTA
    setTimeout(async () => {
      try {
        // Verificar si el poll aún está en el mapping (no fue respondido)
        if (global.studyPollMappings && global.studyPollMappings.has(pollid)) {
          console.log(`⏰ TIMEOUT: Poll ${pollid} no fue respondido en 65 segundos, procesando automáticamente...`);
          
          // Procesar timeout como respuesta no respondida usando el StudySessionService
          console.log('⏰ Procesando timeout automáticamente con StudySessionService...');
          
          // Usar el método processPollAnswer con opción inválida (-1) para indicar timeout
          await studySessionService.processPollAnswer(
            pollid,
            userid.toString(),
            -1 // Opción inválida para indicar timeout
          );
          
          // Limpiar mapping después del procesamiento
          global.studyPollMappings.delete(pollid);
          
          console.log('✅ Timeout procesado exitosamente por StudySessionService');
        }
      } catch (error) {
        console.error('❌ Error procesando timeout de poll:', error);
      }
    }, 65000); // 65 segundos (5 segundos después del límite de Telegram)

    console.log(`✅ Poll de estudio enviado - ID: ${pollid}`);
    return true;

  } catch (error) {
    console.error('❌ Error enviando poll de estudio:', error);
    return false;
  }
}

// ==============================================
// 📊 HANDLERS DE COMANDOS DE ESTADÍSTICAS PERSONALES
// ==============================================

async function handleMiProgresoCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('📊 MI PROGRESO COMMAND - Ver progreso personal de graduaciones');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Obtener estadísticas de graduación usando el servicio de estudio
    const studyService = new StudySessionService();
    
    // Contar total de preguntas falladas y graduadas por materia
    const subjectMappings = StudySessionService.getSubjectMappings();
    const stats: Record<string, { total: number, graduated: number }> = {};
    
    for (const [command, subjectName] of Object.entries(subjectMappings)) {
      const subjectKey = command.replace('/', '');
      
      // Contar preguntas falladas (no graduadas)
      const failedCount = await studyService.getFailedQuestionsCount(userid, subjectKey);
      
      // Contar total de respuestas incorrectas únicamente (estimado de preguntas que han fallado alguna vez)
      const uniqueFailedQuestions = await ensurePrisma().studyresponse.findMany({
        where: {
          userid: userid,
          subject: subjectKey,
          iscorrect: false
        },
        select: {
          questionid: true
        },
        distinct: ['questionid']
      });
      const totalFailedEver = uniqueFailedQuestions.length;
      
      // Graduadas = Total que fallaron alguna vez - Actuales falladas
      const graduated = Math.max(0, totalFailedEver - failedCount);
      
      if (totalFailedEver > 0) {
        stats[subjectName] = {
          total: totalFailedEver,
          graduated: graduated
        };
      }
    }

    if (Object.keys(stats).length === 0) {
      return `📊 <b>MI PROGRESO</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

❌ <b>Aún no tienes preguntas graduadas</b>

💡 <b>¿Cómo funciona la graduación?</b>
• Cuando fallas una pregunta, va a tu lista de "falladas"
• Cuando aciertas 1 vez esa pregunta → ¡Se gradúa! 🎓
• Las preguntas graduadas ya no aparecen en /falladas

🎯 <b>Para empezar:</b>
• Responde preguntas en el grupo
• Usa <code>/falladas</code> para repasar las que hayas fallado
• ¡Observa cómo van graduándose!

📚 <b>Comandos útiles:</b>
• <code>/estadisticas</code> - Ver precisión por materia
• <code>/graduadas</code> - Ver lista de preguntas graduadas`;
    }

    let message = `📊 <b>MI PROGRESO DE GRADUACIÓN</b>\n\n`;
    message += `👤 <b>${user.firstname || user.username || 'Usuario'}</b>\n\n`;

    // Calcular estadísticas generales
    const totalFailed = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
    const totalGraduated = Object.values(stats).reduce((sum, s) => sum + s.graduated, 0);
    const graduationRate = totalFailed > 0 ? Math.round((totalGraduated / totalFailed) * 100) : 0;

    message += `🎓 <b>RESUMEN GENERAL:</b>\n`;
    message += `📚 Total preguntas falladas alguna vez: ${totalFailed}\n`;
    message += `✅ Preguntas graduadas: ${totalGraduated}\n`;
    message += `📊 Tasa de graduación: ${graduationRate}%\n\n`;

    // Mostrar desglose por materia
    message += `📋 <b>DESGLOSE POR MATERIA:</b>\n`;
    
    const sortedStats = Object.entries(stats).sort((a, b) => b[1].graduated - a[1].graduated);
    
    sortedStats.forEach(([subject, data]) => {
      const rate = data.total > 0 ? Math.round((data.graduated / data.total) * 100) : 0;
      const emoji = rate >= 80 ? '🎯' : rate >= 60 ? '📈' : rate >= 40 ? '⚡' : '📚';
      
      message += `${emoji} <b>${subject}</b>\n`;
      message += `   🎓 Graduadas: ${data.graduated}/${data.total} (${rate}%)\n`;
      message += `   📝 Pendientes: ${data.total - data.graduated}\n\n`;
    });

    // Motivación personalizada
    if (graduationRate >= 80) {
      message += `🏆 <b>¡EXCELENTE!</b> Tienes una tasa de graduación muy alta.\n`;
    } else if (graduationRate >= 60) {
      message += `👍 <b>¡MUY BIEN!</b> Estás en buen camino con tus graduaciones.\n`;
    } else if (graduationRate >= 40) {
      message += `💪 <b>¡SIGUE ASÍ!</b> Vas progresando en tus graduaciones.\n`;
    } else {
      message += `🚀 <b>¡A POR ELLO!</b> Practica con /falladas para graduar más preguntas.\n`;
    }

    message += `\n📚 <b>COMANDOS ÚTILES:</b>\n`;
    message += `• <code>/falladas</code> - Repasar preguntas pendientes\n`;
    message += `• <code>/estadisticas</code> - Ver precisión por materia\n`;
    message += `• <code>/graduadas</code> - Ver lista detallada`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleMiProgresoCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleEstadisticasCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('📈 ESTADISTICAS COMMAND - Ver estadísticas por materia');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Obtener estadísticas por materia
    const subjectMappings = StudySessionService.getSubjectMappings();
    const stats: Record<string, { total: number, correct: number, accuracy: number }> = {};
    
    for (const [command, subjectName] of Object.entries(subjectMappings)) {
      const subjectKey = command.replace('/', '');
      
      // Contar respuestas por materia
      const responses = await ensurePrisma().studyresponse.findMany({
        where: {
          userid: userid,
          subject: subjectKey
        }
      });
      
      let total = responses.length;
      let correct = responses.filter(r => r.iscorrect).length;
      
      if (total > 0) {
        const accuracy = Math.round((correct / total) * 100);
        stats[subjectName] = { total, correct, accuracy };
      }
    }

    if (Object.keys(stats).length === 0) {
      return `📈 <b>ESTADÍSTICAS POR MATERIA</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

❌ <b>Aún no tienes estadísticas</b>

🎯 <b>Para generar estadísticas:</b>
• Responde preguntas en el grupo
• Usa comandos de estudio como <code>/constitucion5</code>
• Practica con <code>/falladas</code>

📚 <b>Comandos de estudio disponibles:</b>
• <code>/constitucion10</code> - Preguntas de Constitución
• <code>/defensanacional5</code> - Preguntas de Defensa Nacional
• <code>/falladas</code> - Repasar preguntas falladas`;
    }

    let message = `📈 <b>ESTADÍSTICAS POR MATERIA</b>\n\n`;
    message += `👤 <b>${user.firstname || user.username || 'Usuario'}</b>\n\n`;

    // Calcular estadísticas generales
    const totalResponses = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
    const totalCorrect = Object.values(stats).reduce((sum, s) => sum + s.correct, 0);
    const overallAccuracy = totalResponses > 0 ? Math.round((totalCorrect / totalResponses) * 100) : 0;

    message += `🎯 <b>RESUMEN GENERAL:</b>\n`;
    message += `📊 Total respuestas: ${totalResponses}\n`;
    message += `✅ Respuestas correctas: ${totalCorrect}\n`;
    message += `🎯 Precisión general: ${overallAccuracy}%\n\n`;

    // Mostrar estadísticas por materia (ordenadas por precisión)
    message += `📋 <b>DESGLOSE POR MATERIA:</b>\n`;
    
    const sortedStats = Object.entries(stats).sort((a, b) => b[1].accuracy - a[1].accuracy);
    
    sortedStats.forEach(([subject, data]) => {
      let emoji = '📚';
      if (data.accuracy >= 90) emoji = '🏆';
      else if (data.accuracy >= 80) emoji = '🥇';
      else if (data.accuracy >= 70) emoji = '🥈';
      else if (data.accuracy >= 60) emoji = '🥉';
      else if (data.accuracy >= 50) emoji = '📈';
      else emoji = '⚡';
      
      message += `${emoji} <b>${subject}</b>\n`;
      message += `   🎯 Precisión: ${data.accuracy}% (${data.correct}/${data.total})\n`;
      message += `   📊 Total respuestas: ${data.total}\n\n`;
    });

    // Consejos personalizados
    const worstSubject = sortedStats[sortedStats.length - 1];
    const bestSubject = sortedStats[0];
    
    if (overallAccuracy >= 80) {
      message += `🎉 <b>¡EXCELENTE RENDIMIENTO!</b> Tu precisión general es muy alta.\n`;
    } else if (overallAccuracy >= 70) {
      message += `👍 <b>¡BUEN TRABAJO!</b> Tienes una precisión sólida.\n`;
    } else if (overallAccuracy >= 60) {
      message += `💪 <b>¡SIGUE MEJORANDO!</b> Vas por buen camino.\n`;
    } else {
      message += `🚀 <b>¡A POR ELLO!</b> Cada respuesta te hace mejorar.\n`;
    }

    if (worstSubject && worstSubject[1].accuracy < 70) {
      message += `💡 <b>TIP:</b> Considera repasar más ${worstSubject[0]} (${worstSubject[1].accuracy}%)\n`;
    }

    message += `\n📚 <b>COMANDOS ÚTILES:</b>\n`;
    message += `• <code>/miprogreso</code> - Ver preguntas graduadas\n`;
    message += `• <code>/falladas</code> - Repasar preguntas falladas\n`;
    message += `• <code>/graduadas</code> - Lista de preguntas graduadas`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleEstadisticasCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleGraduadasCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🎓 GRADUADAS COMMAND - Ver preguntas graduadas');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Obtener preguntas graduadas (que han tenido >= 1 acierto desde último fallo)
    const graduatedQuestions = await prisma.$queryRaw`
      WITH failed_questions AS (
        SELECT 
          questionid,
          subject,
          MAX(answeredAt) as last_failed_at
        FROM studyresponse 
        WHERE userid = ${userid} 
          AND iscorrect = false
        GROUP BY questionid, subject
      ),
      total_successes AS (
        SELECT 
          fq.questionid,
          fq.subject,
          fq.last_failed_at,
          COUNT(sr2.id) as total_successes_since_last_fail
        FROM failed_questions fq
        LEFT JOIN studyresponse sr2 ON sr2.questionid = fq.questionid 
          AND sr2.userid = ${userid} 
          AND sr2.iscorrect = true 
          AND sr2.answeredAt > fq.last_failed_at
          AND sr2.subject = fq.subject
        GROUP BY fq.questionid, fq.subject, fq.last_failed_at
      )
      SELECT * FROM total_successes 
      WHERE total_successes_since_last_fail >= 1
      ORDER BY subject, questionid
    `;

    if (!graduatedQuestions || (graduatedQuestions as any[]).length === 0) {
      return `🎓 <b>PREGUNTAS GRADUADAS</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

❌ <b>Aún no tienes preguntas graduadas</b>

💡 <b>¿Cómo graduar preguntas?</b>
1. Al fallar una pregunta, va a tu lista de "falladas"
2. Usa <code>/falladas</code> para repasarla
3. Al acertarla 1 vez → ¡Se gradúa! 🎓
4. Ya no aparecerá más en /falladas

🎯 <b>Para empezar:</b>
• Responde preguntas en el grupo
• Usa <code>/falladas</code> para repasar
• ¡Observa cómo se gradúan!

📚 <b>Comandos útiles:</b>
• <code>/miprogreso</code> - Ver progreso general
• <code>/estadisticas</code> - Ver precisión por materia`;
    }

    const questions = graduatedQuestions as any[];
    
    let message = `🎓 <b>PREGUNTAS GRADUADAS</b>\n\n`;
    message += `👤 <b>${user.firstname || user.username || 'Usuario'}</b>\n\n`;
    
    message += `✅ <b>Total graduadas: ${questions.length}</b>\n\n`;

    // Agrupar por materia
    const questionsBySubject: Record<string, any[]> = {};
    const subjectMappings = StudySessionService.getSubjectMappings();
    
    questions.forEach(q => {
      const subjectName = Object.entries(subjectMappings)
        .find(([cmd, name]) => cmd.replace('/', '') === q.subject)?.[1] || q.subject;
      
      if (!questionsBySubject[subjectName]) {
        questionsBySubject[subjectName] = [];
      }
      questionsBySubject[subjectName].push(q);
    });

    // Mostrar por materia
    message += `📋 <b>POR MATERIA:</b>\n`;
    
    Object.entries(questionsBySubject)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([subject, subjectQuestions]) => {
        message += `📚 <b>${subject}</b>: ${subjectQuestions.length} graduadas\n`;
        
        // Mostrar las primeras 3 preguntas como ejemplo
        const samplesToShow = Math.min(3, subjectQuestions.length);
                 for (let i = 0; i < samplesToShow; i++) {
           const q = subjectQuestions[i];
           message += `   🎓 ID: ${q.questionid} (${Number(q.total_successes_since_last_fail)} aciertos)\n`;
         }
        
        if (subjectQuestions.length > 3) {
          message += `   📊 ... y ${subjectQuestions.length - 3} más\n`;
        }
        
        message += `\n`;
      });

    // Estadísticas adicionales (convertir BigInt a number)
    const successCounts = questions.map(q => Number(q.total_successes_since_last_fail));
    const avgSuccesses = successCounts.length > 0 ? 
      Math.round(successCounts.reduce((sum, count) => sum + count, 0) / successCounts.length * 10) / 10 : 0;

    message += `📊 <b>ESTADÍSTICAS:</b>\n`;
    message += `🎯 Promedio aciertos por pregunta: ${avgSuccesses}\n`;
    message += `📅 Última actualización: ${new Date().toLocaleDateString('es-ES')}\n\n`;

    message += `🎉 <b>¡Felicidades por tu progreso!</b>\n`;
    message += `Cada pregunta graduada es una victoria. 🏆\n\n`;

    message += `📚 <b>COMANDOS ÚTILES:</b>\n`;
    message += `• <code>/falladas</code> - Repasar preguntas pendientes\n`;
    message += `• <code>/miprogreso</code> - Ver progreso general\n`;
    message += `• <code>/reiniciar_graduacion</code> - Reset para repasar`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleGraduadasCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleReiniciarGraduacionCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🔄 REINICIAR_GRADUACION COMMAND - Reset de graduaciones');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Contar preguntas que serían afectadas
    const graduatedCount = await prisma.$queryRaw`
      WITH failed_questions AS (
        SELECT 
          questionid,
          subject,
          MAX(answeredAt) as last_failed_at
        FROM studyresponse 
        WHERE userid = ${userid} 
          AND iscorrect = false
        GROUP BY questionid, subject
      ),
      total_successes AS (
        SELECT 
          fq.questionid,
          fq.subject,
          COUNT(sr2.id) as total_successes_since_last_fail
        FROM failed_questions fq
        LEFT JOIN studyresponse sr2 ON sr2.questionid = fq.questionid 
          AND sr2.userid = ${userid} 
          AND sr2.iscorrect = true 
          AND sr2.answeredAt > fq.last_failed_at
          AND sr2.subject = fq.subject
        GROUP BY fq.questionid, fq.subject
      )
      SELECT COUNT(*) as count FROM total_successes 
      WHERE total_successes_since_last_fail >= 1
    `;

    const count = Number((graduatedCount as any[])[0]?.count || 0);

    if (count === 0) {
      return `🔄 <b>REINICIAR GRADUACIÓN</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

ℹ️ <b>No hay preguntas graduadas que reiniciar</b>

💡 <b>¿Qué hace este comando?</b>
• Resetea todas las graduaciones
• Las preguntas "graduadas" vuelven a aparecer en /falladas
• Útil para repasar todo desde cero

🎯 <b>Para tener graduaciones que resetear:</b>
• Usa <code>/falladas</code> para repasar preguntas
• Acierta preguntas para graduarlas
• Luego podrás usar este reset

📚 <b>Comandos útiles:</b>
• <code>/miprogreso</code> - Ver progreso actual
• <code>/graduadas</code> - Ver preguntas graduadas`;
    }

    return `🔄 <b>REINICIAR GRADUACIÓN</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

⚠️ <b>CONFIRMACIÓN REQUERIDA</b>

📊 <b>Preguntas graduadas encontradas: ${count}</b>

💡 <b>¿Qué pasará si confirmas?</b>
• Se borrarán todas las respuestas correctas de preguntas falladas
• Las ${count} preguntas graduadas volverán a aparecer en /falladas
• Podrás repasarlas desde cero
• No se perderán las estadísticas generales

⚠️ <b>IMPORTANTE:</b> Esta acción NO se puede deshacer.

🤔 <b>¿Estás seguro?</b>
Este comando está diseñado para casos especiales de repaso intensivo.

💡 <b>Alternativas recomendadas:</b>
• <code>/falladas</code> - Repasar solo preguntas pendientes
• <code>/constitucionfalladas5</code> - Repasar por materia específica
• <code>/miprogreso</code> - Ver estado actual

🔄 <b>Para confirmar el reset completo:</b>
Usa <code>/reiniciar_graduacion_confirmar</code>

❌ <b>Para cancelar:</b>
Simplemente ignora este mensaje.`;

  } catch (error) {
    console.error('❌ Error en handleReiniciarGraduacionCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleReiniciarGraduacionConfirmarCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('✅ REINICIAR_GRADUACION_CONFIRMAR COMMAND - Ejecutar reset de graduaciones');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Ejecutar el reset en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Contar preguntas afectadas antes del reset
      const beforeCount = await tx.$queryRaw`
        WITH failed_questions AS (
          SELECT 
            questionid,
            subject,
            MAX(answeredAt) as last_failed_at
          FROM studyresponse 
          WHERE userid = ${userid} 
            AND iscorrect = false
          GROUP BY questionid, subject
        ),
        total_successes AS (
          SELECT 
            fq.questionid,
            fq.subject,
            COUNT(sr2.id) as total_successes_since_last_fail
          FROM failed_questions fq
          LEFT JOIN studyresponse sr2 ON sr2.questionid = fq.questionid 
            AND sr2.userid = ${userid} 
            AND sr2.iscorrect = true 
            AND sr2.answeredAt > fq.last_failed_at
            AND sr2.subject = fq.subject
          GROUP BY fq.questionid, fq.subject
        )
        SELECT COUNT(*) as count FROM total_successes 
        WHERE total_successes_since_last_fail >= 1
      `;

      const graduatedCount = Number((beforeCount as any[])[0]?.count || 0);

      if (graduatedCount === 0) {
        return { success: false, count: 0 };
      }

      // Eliminar TODAS las respuestas correctas de preguntas que habían sido falladas
      // Esto hace que las preguntas "graduadas" vuelvan a ser "falladas"
      const deletedResponses = await tx.$executeRaw`
        DELETE FROM studyresponse 
        WHERE userid = ${userid} 
          AND iscorrect = true 
          AND questionid IN (
            SELECT DISTINCT questionid 
            FROM studyresponse 
            WHERE userid = ${userid} 
              AND iscorrect = false
          )
      `;

      return { success: true, count: graduatedCount, deleted: Number(deletedResponses) };
    });

    if (!result.success) {
      return `🔄 <b>RESET GRADUACIÓN</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

ℹ️ <b>No hay preguntas graduadas para resetear</b>

💡 <b>Estado actual:</b>
• No tienes preguntas graduadas actualmente
• Todas las preguntas falladas ya están disponibles para repaso

🎯 <b>Puedes usar:</b>
• <code>/falladas</code> - Ver preguntas pendientes de repaso
• <code>/miprogreso</code> - Ver tu progreso actual`;
    }

    return `✅ <b>GRADUACIÓN RESETEADA</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

🎉 <b>Reset completado exitosamente</b>

📊 <b>Resultados:</b>
• ${result.count} preguntas des-graduadas
• ${result.deleted} respuestas correctas eliminadas
• Todas las preguntas vuelven a estar disponibles para repaso

💡 <b>¿Qué significa esto?</b>
• Las preguntas que habías "graduado" vuelven a aparecer en /falladas
• Puedes repasarlas desde cero
• Tus estadísticas generales se mantienen intactas

🎯 <b>Próximos pasos:</b>
• Usa <code>/falladas</code> para empezar el repaso intensivo
• Usa <code>/miprogreso</code> para ver el nuevo estado
• Usa <code>/estadisticas</code> para ver tu rendimiento

🚀 <b>¡Ideal para repaso intensivo pre-examen!</b>

💡 <b>Consejo:</b> Ahora tienes la oportunidad de repasar todo desde cero y consolidar tu conocimiento.`;

  } catch (error) {
    console.error('❌ Error en handleReiniciarGraduacionConfirmarCommand:', error);
    return `❌ <b>Error interno</b>\n\nNo se pudo completar el reset. Inténtalo de nuevo en unos segundos.`;
  }
}

async function handleConfigurarNotificacionesCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('⚙️ CONFIGURAR_NOTIFICACIONES COMMAND - Configurar sistema de notificaciones');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Obtener configuraciones actuales
    const { NotificationService } = await import('@/services/notificationService');
    const notificationService = new NotificationService();
    const settings = await notificationService.getUserNotificationSettings(user.id);

    const graduationEnabled = settings?.graduationNotifications !== false;
    const milestoneEnabled = settings?.milestoneNotifications !== false;
    const reminderEnabled = settings?.reminderNotifications !== false;
    const weeklyEnabled = settings?.weeklyReportNotifications !== false;

    const startHour = settings?.notificationStartHour || 8;
    const endHour = settings?.notificationEndHour || 22;
    const reminderDays = settings?.reminderDaysThreshold || 3;

    return `⚙️ <b>CONFIGURACIÓN DE NOTIFICACIONES</b>

👤 ${fromtelegramuser.first_name || 'Usuario'}

🔔 <b>TIPOS DE NOTIFICACIONES:</b>
🎓 Graduaciones: ${graduationEnabled ? '✅ Activada' : '❌ Desactivada'}
🏆 Logros: ${milestoneEnabled ? '✅ Activada' : '❌ Desactivada'}
⏰ Recordatorios: ${reminderEnabled ? '✅ Activada' : '❌ Desactivada'}
📊 Reportes semanales: ${weeklyEnabled ? '✅ Activada' : '❌ Desactivada'}

⏰ <b>HORARIO:</b>
🕐 Desde: ${startHour}:00
🕙 Hasta: ${endHour}:00

⚠️ <b>RECORDATORIOS:</b>
📅 Cada ${reminderDays} días sin estudiar

🔧 <b>COMANDOS DE CONFIGURACIÓN:</b>
• <code>/notificaciones_graduacion on/off</code>
• <code>/notificaciones_logros on/off</code>
• <code>/notificaciones_recordatorios on/off</code>
• <code>/notificaciones_semanales on/off</code>
• <code>/horario_notificaciones 8 22</code>

💡 <b>Ejemplo:</b>
<code>/notificaciones_graduacion off</code> - Desactivar notificaciones de graduación
<code>/horario_notificaciones 9 21</code> - Recibir notificaciones de 9:00 a 21:00`;

  } catch (error) {
    console.error('❌ Error en handleConfigurarNotificacionesCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

// ==========================================
// 🔔 FUNCIONES DE COMANDOS ESPECÍFICOS DE NOTIFICACIONES
// ==========================================

async function handleNotificacionesGraduacionCommand(userid: string, fromtelegramuser: any, messageText: string): Promise<string | null> {
  try {
    console.log('🎓 NOTIFICACIONES_GRADUACION COMMAND - Configurar notificaciones de graduación');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Parsear comando
    const parts = messageText.trim().split(' ');
    if (parts.length < 2) {
      return `❌ <b>Uso incorrecto</b>\n\n🔧 <b>Uso correcto:</b>\n<code>/notificaciones_graduacion on</code> - Activar\n<code>/notificaciones_graduacion off</code> - Desactivar\n\n💡 <b>Ejemplo:</b>\n<code>/notificaciones_graduacion on</code>`;
    }

    const setting = parts[1].toLowerCase();
    if (setting !== 'on' && setting !== 'off') {
      return `❌ <b>Parámetro inválido</b>\n\n✅ <b>Opciones válidas:</b>\n• <code>on</code> - Activar\n• <code>off</code> - Desactivar\n\n💡 <b>Ejemplo:</b>\n<code>/notificaciones_graduacion on</code>`;
    }

    const enabled = setting === 'on';

    // Actualizar configuración
    const { NotificationService } = await import('@/services/notificationService');
    const notificationService = new NotificationService();
    await notificationService.updateUserNotificationSettings(user.id, {
      graduationNotifications: enabled
    });

    const status = enabled ? '✅ activadas' : '❌ desactivadas';
    const emoji = enabled ? '🎉' : '😴';
    
    return `${emoji} <b>NOTIFICACIONES DE GRADUACIÓN ${status.toUpperCase()}</b>

👤 ${fromtelegramuser.first_name || 'Usuario'}

🎓 <b>Estado:</b> ${status}

${enabled ? 
  `🔔 <b>Recibirás notificaciones cuando:</b>\n• Gradúes una pregunta fallada\n• Alcances hitos de graduación (5, 10, 25, etc.)\n• Completes sesiones exitosas de repaso\n\n💡 <b>Tip:</b> Las notificaciones respetan tu horario configurado.` :
  `😴 <b>No recibirás notificaciones de:</b>\n• Preguntas graduadas\n• Hitos de graduación\n• Sesiones de repaso completadas\n\n💡 <b>Tip:</b> Puedes reactivarlas cuando quieras.`
}

🔧 <b>Otros comandos:</b>
• <code>/configurar_notificaciones</code> - Ver todas las configuraciones
• <code>/notificaciones_logros ${enabled ? 'off' : 'on'}</code> - ${enabled ? 'Desactivar' : 'Activar'} notificaciones de logros`;

  } catch (error) {
    console.error('❌ Error en handleNotificacionesGraduacionCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleNotificacionesLogrosCommand(userid: string, fromtelegramuser: any, messageText: string): Promise<string | null> {
  try {
    console.log('🏆 NOTIFICACIONES_LOGROS COMMAND - Configurar notificaciones de logros');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Parsear comando
    const parts = messageText.trim().split(' ');
    if (parts.length < 2) {
      return `❌ <b>Uso incorrecto</b>\n\n🔧 <b>Uso correcto:</b>\n<code>/notificaciones_logros on</code> - Activar\n<code>/notificaciones_logros off</code> - Desactivar\n\n💡 <b>Ejemplo:</b>\n<code>/notificaciones_logros on</code>`;
    }

    const setting = parts[1].toLowerCase();
    if (setting !== 'on' && setting !== 'off') {
      return `❌ <b>Parámetro inválido</b>\n\n✅ <b>Opciones válidas:</b>\n• <code>on</code> - Activar\n• <code>off</code> - Desactivar\n\n💡 <b>Ejemplo:</b>\n<code>/notificaciones_logros on</code>`;
    }

    const enabled = setting === 'on';

    // Actualizar configuración
    const { NotificationService } = await import('@/services/notificationService');
    const notificationService = new NotificationService();
    await notificationService.updateUserNotificationSettings(user.id, {
      milestoneNotifications: enabled
    });

    const status = enabled ? '✅ activadas' : '❌ desactivadas';
    const emoji = enabled ? '🏆' : '😴';
    
    return `${emoji} <b>NOTIFICACIONES DE LOGROS ${status.toUpperCase()}</b>

👤 ${fromtelegramuser.first_name || 'Usuario'}

🏆 <b>Estado:</b> ${status}

${enabled ? 
  `🔔 <b>Recibirás notificaciones cuando:</b>\n• Alcances hitos importantes (5, 10, 25, 50, 100 graduaciones)\n• Consigas rachas destacadas\n• Desbloquees nuevos niveles\n• Logres precisión excepcional\n\n🎉 <b>¡Celebra tus logros!</b>` :
  `😴 <b>No recibirás notificaciones de:</b>\n• Hitos de graduación\n• Rachas destacadas\n• Nuevos niveles\n• Logros desbloqueados\n\n💡 <b>Tip:</b> Puedes reactivarlas cuando quieras.`
}

🔧 <b>Otros comandos:</b>
• <code>/configurar_notificaciones</code> - Ver todas las configuraciones
• <code>/notificaciones_graduacion ${enabled ? 'off' : 'on'}</code> - ${enabled ? 'Desactivar' : 'Activar'} notificaciones de graduación`;

  } catch (error) {
    console.error('❌ Error en handleNotificacionesLogrosCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleNotificacionesRecordatoriosCommand(userid: string, fromtelegramuser: any, messageText: string): Promise<string | null> {
  try {
    console.log('⏰ NOTIFICACIONES_RECORDATORIOS COMMAND - Configurar recordatorios');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Parsear comando
    const parts = messageText.trim().split(' ');
    if (parts.length < 2) {
      return `❌ <b>Uso incorrecto</b>\n\n🔧 <b>Uso correcto:</b>\n<code>/notificaciones_recordatorios on</code> - Activar\n<code>/notificaciones_recordatorios off</code> - Desactivar\n\n💡 <b>Ejemplo:</b>\n<code>/notificaciones_recordatorios on</code>`;
    }

    const setting = parts[1].toLowerCase();
    if (setting !== 'on' && setting !== 'off') {
      return `❌ <b>Parámetro inválido</b>\n\n✅ <b>Opciones válidas:</b>\n• <code>on</code> - Activar\n• <code>off</code> - Desactivar\n\n💡 <b>Ejemplo:</b>\n<code>/notificaciones_recordatorios on</code>`;
    }

    const enabled = setting === 'on';

    // Actualizar configuración
    const { NotificationService } = await import('@/services/notificationService');
    const notificationService = new NotificationService();
    await notificationService.updateUserNotificationSettings(user.id, {
      reminderNotifications: enabled
    });

    const status = enabled ? '✅ activados' : '❌ desactivados';
    const emoji = enabled ? '⏰' : '😴';
    
    return `${emoji} <b>RECORDATORIOS ${status.toUpperCase()}</b>

👤 ${fromtelegramuser.first_name || 'Usuario'}

⏰ <b>Estado:</b> ${status}

${enabled ? 
  `🔔 <b>Recibirás recordatorios cuando:</b>\n• Pases 3 días sin estudiar\n• Tengas preguntas falladas pendientes\n• Haya sido mucho tiempo desde tu última sesión\n\n💡 <b>Frecuencia:</b> Máximo 1 recordatorio cada 3 días\n⏰ <b>Horario:</b> Respeta tu horario configurado` :
  `😴 <b>No recibirás recordatorios de:</b>\n• Inactividad prolongada\n• Preguntas pendientes\n• Sesiones de estudio\n\n💡 <b>Tip:</b> Puedes reactivarlos cuando quieras.`
}

🔧 <b>Otros comandos:</b>
• <code>/configurar_notificaciones</code> - Ver todas las configuraciones
• <code>/horario_notificaciones 8 22</code> - Configurar horario
• <code>/notificaciones_semanales ${enabled ? 'off' : 'on'}</code> - ${enabled ? 'Desactivar' : 'Activar'} reportes semanales`;

  } catch (error) {
    console.error('❌ Error en handleNotificacionesRecordatoriosCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleNotificacionesSemanalesCommand(userid: string, fromtelegramuser: any, messageText: string): Promise<string | null> {
  try {
    console.log('📊 NOTIFICACIONES_SEMANALES COMMAND - Configurar reportes semanales');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Parsear comando
    const parts = messageText.trim().split(' ');
    if (parts.length < 2) {
      return `❌ <b>Uso incorrecto</b>\n\n🔧 <b>Uso correcto:</b>\n<code>/notificaciones_semanales on</code> - Activar\n<code>/notificaciones_semanales off</code> - Desactivar\n\n💡 <b>Ejemplo:</b>\n<code>/notificaciones_semanales on</code>`;
    }

    const setting = parts[1].toLowerCase();
    if (setting !== 'on' && setting !== 'off') {
      return `❌ <b>Parámetro inválido</b>\n\n✅ <b>Opciones válidas:</b>\n• <code>on</code> - Activar\n• <code>off</code> - Desactivar\n\n💡 <b>Ejemplo:</b>\n<code>/notificaciones_semanales on</code>`;
    }

    const enabled = setting === 'on';

    // Actualizar configuración
    const { NotificationService } = await import('@/services/notificationService');
    const notificationService = new NotificationService();
    await notificationService.updateUserNotificationSettings(user.id, {
      weeklyReportNotifications: enabled
    });

    const status = enabled ? '✅ activados' : '❌ desactivados';
    const emoji = enabled ? '📊' : '😴';
    
    return `${emoji} <b>REPORTES SEMANALES ${status.toUpperCase()}</b>

👤 ${fromtelegramuser.first_name || 'Usuario'}

📊 <b>Estado:</b> ${status}

${enabled ? 
  `🔔 <b>Recibirás cada domingo:</b>\n• Resumen de tu progreso semanal\n• Preguntas graduadas en la semana\n• Estadísticas de precisión\n• Comparativa con semana anterior\n• Recomendaciones personalizadas\n\n📅 <b>Cuándo:</b> Domingos por la mañana\n⏰ <b>Horario:</b> Respeta tu horario configurado` :
  `😴 <b>No recibirás:</b>\n• Resúmenes semanales\n• Estadísticas de progreso\n• Comparativas semanales\n• Recomendaciones personalizadas\n\n💡 <b>Tip:</b> Puedes reactivarlos cuando quieras.`
}

🔧 <b>Otros comandos:</b>
• <code>/configurar_notificaciones</code> - Ver todas las configuraciones
• <code>/notificaciones_recordatorios ${enabled ? 'off' : 'on'}</code> - ${enabled ? 'Desactivar' : 'Activar'} recordatorios
• <code>/estadisticas</code> - Ver tus estadísticas actuales`;

  } catch (error) {
    console.error('❌ Error en handleNotificacionesSemanalesCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

// ==============================================
// 📊 HANDLER DE COMANDO DE QUOTAS Y LÍMITES
// ==============================================

async function handleMiQuotaCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('📊 MI QUOTA COMMAND - Ver límites y uso actual');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Obtener suscripción actual usando SQL directo
    const subscriptionCheck = await prisma.$queryRaw`
      SELECT 
        tu.telegramuserid,
        tu.firstname,
        s.status,
        s.enddate,
        p.name as planName,
        p.displayname as planDisplayName,
        p.price,
        p.dailyquestionslimit,
        p.maxSimulationsPerDay,
        p.canusefailedquestions,
        p.canuseadvancedstats,
        p.canusesimulations,
        p.canuseaianalysis,
        p.canusemoodleintegration
      FROM telegramuser tu
      LEFT JOIN usersubscription s ON tu.id = s.userid AND s.status = 'active' AND s.enddate >= NOW()
      LEFT JOIN subscriptionplan p ON s.planid = p.id
      WHERE tu.telegramuserid = ${userid}
      LIMIT 1
    ` as any[];
    
    const userSubscription = subscriptionCheck[0];
    
    if (!userSubscription || !userSubscription.planName) {
      return `🔒 <b>SIN SUSCRIPCIÓN ACTIVA</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

❌ <b>No tienes una suscripción activa</b>

🆓 <b>Límites actuales (gratuito):</b>
• 📚 Preguntas privadas: 0/día
• 🔄 Preguntas falladas: No disponible
• 🎯 Simulacros: No disponible
• 📊 Estadísticas avanzadas: No disponible

💡 <b>¿Quieres más funcionalidades?</b>

💰 <b>PLAN BÁSICO (€4.99/mes):</b>
• 📚 100 preguntas diarias en privado
• 🔄 Sistema de preguntas falladas
• 📊 Estadísticas básicas

💎 <b>PLAN PREMIUM (€9.99/mes):</b>
• ♾️ Preguntas ilimitadas
• 🎯 Simulacros personalizados
• 📊 Estadísticas avanzadas
• 🔗 Integración Moodle
• 🤖 Análisis con IA

🚀 <b>Suscríbete ahora:</b>
• <code>/basico</code> - Plan Básico
• <code>/premium</code> - Plan Premium
• <code>/planes</code> - Comparar todos los planes`;
    }

    // Obtener uso actual del día usando SQL directo
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    const usageStats = await prisma.$queryRaw`
      SELECT 
        questionsUsed,
        failedQuestionsUsed,
        simulationsUsed
      FROM userquotausage
      WHERE userid = ${user.id} AND date = ${today}
      LIMIT 1
    ` as any[];
    
    const todayUsage = usageStats[0] || {
      questionsUsed: 0,
      failedQuestionsUsed: 0,
      simulationsUsed: 0
    };

    const questionsUsed = (todayUsage.questionsUsed || 0) + (todayUsage.failedQuestionsUsed || 0);
    const simulationsUsed = todayUsage.simulationsUsed || 0;

    // Calcular días restantes de suscripción
    const endDate = userSubscription.enddate ? new Date(userSubscription.enddate) : null;
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    let message = `📊 <b>MI ESTADO DE SUSCRIPCIÓN</b>\n\n`;
    message += `👤 <b>${user.firstname || user.username || 'Usuario'}</b>\n\n`;

    // Estado de la suscripción
    message += `💎 <b>PLAN ACTUAL:</b> ${userSubscription.planDisplayName}\n`;
    message += `💰 <b>Precio:</b> €${userSubscription.price}/mes\n`;
    message += `📋 <b>Estado:</b> ✅ Activa\n`;
    
    if (daysRemaining !== null) {
      message += `📅 <b>Renovación:</b> ${daysRemaining} días\n`;
    }
    
    message += `\n📊 <b>USO DE HOY:</b>\n`;

    // Mostrar límites y uso actual
    if (userSubscription.dailyquestionslimit === null) {
      message += `📚 <b>Preguntas:</b> ♾️ ILIMITADAS\n`;
    } else {
      const questionsLimit = userSubscription.dailyquestionslimit || 100;
      const remaining = Math.max(0, questionsLimit - questionsUsed);
      message += `📚 <b>Preguntas:</b> ${questionsUsed}/${questionsLimit} (${remaining} restantes)\n`;
    }

    if (userSubscription.maxSimulationsPerDay === null) {
      message += `🎯 <b>Simulacros:</b> ♾️ ILIMITADOS\n`;
    } else {
      const simulationsLimit = userSubscription.maxSimulationsPerDay || 1;
      const remainingSimulations = Math.max(0, simulationsLimit - simulationsUsed);
      message += `🎯 <b>Simulacros:</b> ${simulationsUsed}/${simulationsLimit} (${remainingSimulations} restantes)\n`;
    }

    // Funcionalidades disponibles
    message += `\n🎮 <b>FUNCIONALIDADES ACTIVAS:</b>\n`;
    message += `${userSubscription.canusefailedquestions ? '✅' : '❌'} Preguntas falladas\n`;
    message += `${userSubscription.canuseadvancedstats ? '✅' : '❌'} Estadísticas avanzadas\n`;
    message += `${userSubscription.canusesimulations ? '✅' : '❌'} Simulacros personalizados\n`;
    message += `${userSubscription.canuseaianalysis ? '✅' : '❌'} Análisis con IA\n`;
    message += `${userSubscription.canusemoodleintegration ? '✅' : '❌'} Integración Moodle\n`;

    // Motivación y acciones
    if (userSubscription.planName === 'basic') {
      const remainingQuestions = userSubscription.dailyquestionslimit ? Math.max(0, userSubscription.dailyquestionslimit - questionsUsed) : 0;
      if (remainingQuestions <= 10) {
        message += `\n⚠️ <b>POCAS PREGUNTAS RESTANTES</b>\n`;
        message += `Te quedan solo ${remainingQuestions} preguntas hoy.\n\n`;
        message += `🚀 <b>¿Quieres más?</b>\n`;
        message += `• <code>/premium</code> - Actualizar a Premium (ilimitado)`;
      } else {
        message += `\n💡 <b>¿Quieres más funcionalidades?</b>\n`;
        message += `• <code>/premium</code> - Actualizar a Premium`;
      }
    } else if (userSubscription.planName === 'premium') {
      message += `\n🎉 <b>¡Tienes acceso completo!</b>\n`;
      message += `Disfruta de todas las funcionalidades sin límites.`;
    }

    message += `\n\n📞 <b>GESTIONAR SUSCRIPCIÓN:</b>\n`;
    message += `• <code>/mi_plan</code> - Detalles completos\n`;
    message += `• <code>/facturas</code> - Historial de pagos\n`;
    message += `• <code>/cancelar</code> - Cancelar suscripción`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleMiQuotaCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

async function handleHorarioNotificacionesCommand(userid: string, fromtelegramuser: any, messageText: string): Promise<string | null> {
  try {
    console.log('🕐 HORARIO_NOTIFICACIONES COMMAND - Configurar horario');

    // Verificar usuario registrado
    const user = await ensurePrisma().telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Parsear comando
    const parts = messageText.trim().split(' ');
    if (parts.length < 3) {
      return `❌ <b>Uso incorrecto</b>\n\n🔧 <b>Uso correcto:</b>\n<code>/horario_notificaciones [hora_inicio] [hora_fin]</code>\n\n💡 <b>Ejemplos:</b>\n<code>/horario_notificaciones 8 22</code> - De 8:00 a 22:00\n<code>/horario_notificaciones 9 21</code> - De 9:00 a 21:00\n<code>/horario_notificaciones 7 23</code> - De 7:00 a 23:00\n\n📝 <b>Nota:</b> Usa formato 24 horas (0-23)`;
    }

    const startHour = parseInt(parts[1]);
    const endHour = parseInt(parts[2]);

    // Validar horas
    if (isNaN(startHour) || isNaN(endHour)) {
      return `❌ <b>Horas inválidas</b>\n\n🔧 <b>Formato correcto:</b>\nUsa números enteros de 0 a 23\n\n💡 <b>Ejemplos válidos:</b>\n<code>/horario_notificaciones 8 22</code>\n<code>/horario_notificaciones 9 21</code>`;
    }

    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      return `❌ <b>Horas fuera de rango</b>\n\n⏰ <b>Rango válido:</b> 0 a 23 horas\n\n💡 <b>Ejemplos válidos:</b>\n• <code>/horario_notificaciones 8 22</code> - 8:00 AM a 10:00 PM\n• <code>/horario_notificaciones 9 21</code> - 9:00 AM a 9:00 PM\n• <code>/horario_notificaciones 0 23</code> - 12:00 AM a 11:00 PM`;
    }

    if (startHour >= endHour) {
      return `❌ <b>Horario inválido</b>\n\n🕐 <b>Problema:</b> La hora de inicio debe ser menor que la hora de fin\n\n💡 <b>Ejemplos correctos:</b>\n• <code>/horario_notificaciones 8 22</code> ✅\n• <code>/horario_notificaciones 9 21</code> ✅\n\n❌ <b>Ejemplos incorrectos:</b>\n• <code>/horario_notificaciones 22 8</code> ❌\n• <code>/horario_notificaciones 15 15</code> ❌`;
    }

    // Actualizar configuración
    const { NotificationService } = await import('@/services/notificationService');
    const notificationService = new NotificationService();
    await notificationService.updateUserNotificationSettings(user.id, {
      notificationStartHour: startHour,
      notificationEndHour: endHour
    });

    const startTime = `${startHour.toString().padStart(2, '0')}:00`;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;
    const duration = endHour - startHour;
    
    return `🕐 <b>HORARIO DE NOTIFICACIONES ACTUALIZADO</b>

👤 ${fromtelegramuser.first_name || 'Usuario'}

⏰ <b>Nuevo horario:</b>
🌅 Inicio: ${startTime}
🌙 Fin: ${endTime}
⏱️ Duración: ${duration} horas

🔔 <b>¿Qué significa esto?</b>
• Solo recibirás notificaciones entre ${startTime} y ${endTime}
• Notificaciones fuera de este horario se pospondrán
• Recordatorios y reportes respetarán este horario
• Notificaciones urgentes (como duelos) pueden llegar en cualquier momento

💡 <b>Recomendaciones por horario:</b>
${startHour <= 8 && endHour >= 20 ? 
  '✅ <b>Horario amplio</b> - Ideal para recibir todas las notificaciones' :
  startHour >= 9 && endHour <= 21 ? 
  '⏰ <b>Horario moderado</b> - Perfecto para horario laboral/estudios' :
  '🌙 <b>Horario restringido</b> - Algunas notificaciones pueden posponerse'
}

🔧 <b>Otros comandos:</b>
• <code>/configurar_notificaciones</code> - Ver todas las configuraciones
• <code>/notificaciones_recordatorios on/off</code> - Configurar recordatorios
• <code>/notificaciones_semanales on/off</code> - Configurar reportes semanales`;

  } catch (error) {
    console.error('❌ Error en handleHorarioNotificacionesCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

// Exportar funciones para uso en otros servicios
export { sendTelegramPoll };


