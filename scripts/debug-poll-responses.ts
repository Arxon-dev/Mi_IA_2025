// Script para diagnosticar por qué los usuarios no reciben puntos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugPollResponses() {
  try {
    console.log('🔍 DIAGNÓSTICO: ¿Por qué los usuarios no reciben puntos?');
    console.log('=========================================================');
    
    // 1. Verificar polls registrados recientemente
    console.log('📊 1. POLLS ENVIADOS RECIENTEMENTE:');
    console.log('=====================================');
    
    const recentPolls = await prisma.telegrampoll.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`✅ Encontrados ${recentPolls.length} polls registrados:`);
    recentPolls.forEach((poll, index) => {
      console.log(`   ${index + 1}. Poll ID: ${poll.pollid}`);
      console.log(`      Question ID: ${poll.questionid}`);
      console.log(`      Source: ${poll.sourcemodel}`);
      console.log(`      Enviado: ${poll.createdAt.toLocaleString('es-ES')}`);
      console.log(`      Chat ID: ${poll.chatid}`);
      console.log('');
    });
    
    // 2. Verificar respuestas registradas recientemente
    console.log('💬 2. RESPUESTAS REGISTRADAS RECIENTEMENTE:');
    console.log('=============================================');
    
    const recentResponses = await prisma.telegramResponse.findMany({
      orderBy: { answeredAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstname: true,
            username: true,
            telegramuserid: true
          }
        }
      }
    });
    
    console.log(`✅ Encontradas ${recentResponses.length} respuestas registradas:`);
    recentResponses.forEach((response, index) => {
      console.log(`   ${index + 1}. ${response.user.firstname} (@${response.user.username || 'sin_username'})`);
      console.log(`      Telegram ID: ${response.user.telegramuserid}`);
      console.log(`      Question ID: ${response.questionid}`);
      console.log(`      Correcto: ${response.iscorrect ? '✅' : '❌'}`);
      console.log(`      Puntos: ${response.points}`);
      console.log(`      Respondido: ${response.answeredAt.toLocaleString('es-ES')}`);
      console.log('');
    });
    
    // 3. Verificar si hay polls sin respuestas
    console.log('🔗 3. ANÁLISIS DE CORRESPONDENCIA POLLS-RESPUESTAS:');
    console.log('===================================================');
    
    const pollsWithoutResponses = [];
    
    for (const poll of recentPolls) {
      // Buscar respuestas para este poll específico
      const responsesForPoll = await prisma.telegramResponse.findMany({
        where: {
          OR: [
            { telegramMsgId: poll.pollid },
            { questionid: poll.questionid }
          ]
        },
        include: {
          user: {
            select: {
              firstname: true,
              username: true
            }
          }
        }
      });
      
      if (responsesForPoll.length === 0) {
        pollsWithoutResponses.push(poll);
        console.log(`❌ Poll ${poll.pollid} SIN RESPUESTAS:`);
        console.log(`   Question ID: ${poll.questionid}`);
        console.log(`   Source: ${poll.sourcemodel}`);
        console.log(`   Enviado: ${poll.createdAt.toLocaleString('es-ES')}`);
      } else {
        console.log(`✅ Poll ${poll.pollid} con ${responsesForPoll.length} respuestas:`);
        responsesForPoll.forEach(resp => {
          console.log(`   - ${resp.user.firstname} (${resp.iscorrect ? 'correcto' : 'incorrecto'})`);
        });
      }
      console.log('');
    }
    
    // 4. Verificar estructura de la base de datos
    console.log('🏗️ 4. VERIFICACIÓN DE ESTRUCTURA DE BD:');
    console.log('========================================');
    
    // Verificar tabla TelegramPoll
    const pollCount = await prisma.telegrampoll.count();
    console.log(`📊 Total polls registrados: ${pollCount}`);
    
    // Verificar tabla TelegramResponse
    const responseCount = await prisma.telegramResponse.count();
    console.log(`💬 Total respuestas registradas: ${responseCount}`);
    
    // Verificar tabla TelegramUser
    const userCount = await prisma.telegramuser.count();
    console.log(`👥 Total usuarios registrados: ${userCount}`);
    
    // 5. Buscar último poll ID específico para testing
    console.log('\\n🎯 5. VERIFICACIÓN DE POLL ESPECÍFICO:');
    console.log('======================================');
    
    const latestPoll = recentPolls[0];
    if (latestPoll) {
      console.log(`🔍 Analizando poll más reciente: ${latestPoll.pollid}`);
      
      // Simular respuesta de poll_answer
      const simulatedPollAnswer = {
        poll_id: latestPoll.pollid,
        user: {
          id: 998877665,
          username: 'test_user',
          first_name: 'Usuario Prueba',
          is_bot: false
        },
        option_ids: [0]
      };
      
      console.log('🧪 Datos simulados de poll_answer:');
      console.log(JSON.stringify(simulatedPollAnswer, null, 2));
      
      // Verificar si findQuestionByPollId funcionaría
      const questionData = await prisma.telegrampoll.findUnique({
        where: { pollid: latestPoll.pollid }
      });
      
      if (questionData) {
        console.log('✅ Poll encontrado en BD para findQuestionByPollId:');
        console.log(`   Question ID: ${questionData.questionid}`);
        console.log(`   Respuesta correcta: ${questionData.correctanswerindex}`);
        console.log(`   Source: ${questionData.sourcemodel}`);
      } else {
        console.log('❌ Poll NO encontrado en BD (PROBLEMA CRÍTICO)');
      }
    } else {
      console.log('❌ No hay polls recientes para analizar');
    }
    
    // 6. Verificar usuarios que deberían estar recibiendo puntos
    console.log('\\n👤 6. ANÁLISIS DE USUARIOS SIN PUNTOS RECIENTES:');
    console.log('=================================================');
    
    const usersWithoutRecentResponses = await prisma.telegramuser.findMany({
      where: {
        totalpoints: {
          gt: 0 // Usuarios con puntos (han participado antes)
        },
        responses: {
          none: {
            answeredAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Sin respuestas en las últimas 24h
            }
          }
        }
      },
      select: {
        firstname: true,
        username: true,
        telegramuserid: true,
        totalpoints: true,
        lastActivity: true
      },
      take: 10
    });
    
    console.log(`⚠️ Usuarios con puntos pero sin respuestas recientes: ${usersWithoutRecentResponses.length}`);
    usersWithoutRecentResponses.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstname} (@${user.username || 'sin_username'})`);
      console.log(`      Telegram ID: ${user.telegramuserid}`);
      console.log(`      Puntos: ${user.totalpoints}`);
      console.log(`      Última actividad: ${user.lastActivity?.toLocaleString('es-ES') || 'N/A'}`);
      console.log('');
    });
    
    // 7. DIAGNÓSTICO FINAL
    console.log('📋 7. DIAGNÓSTICO FINAL:');
    console.log('========================');
    
    if (pollsWithoutResponses.length > 0) {
      console.log('🚨 PROBLEMA IDENTIFICADO:');
      console.log(`   ${pollsWithoutResponses.length} polls enviados recientemente NO tienen respuestas`);
      console.log('   Esto indica que las respuestas no se están procesando correctamente');
      console.log('');
      console.log('💡 POSIBLES CAUSAS:');
      console.log('   1. El webhook no está recibiendo poll_answers');
      console.log('   2. La función findQuestionByPollId está fallando');
      console.log('   3. El sistema de gamificación no está funcionando');
      console.log('   4. Error en la estructura de datos poll_answer');
    } else {
      console.log('✅ Los polls recientes SÍ tienen respuestas registradas');
      console.log('   El problema puede estar en otro lado...');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

async function main() {
  await debugPollResponses();
} 