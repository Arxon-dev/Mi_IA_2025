import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

interface SystemHealth {
  database: boolean;
  webhook: boolean;
  telegram: boolean;
  ngrok?: boolean;
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database error:', error);
    return false;
  }
}

async function checkWebhookHealth(): Promise<boolean> {
  try {
    const webhookResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'health_check' })
    });
    return webhookResponse.ok;
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return false;
  }
}

async function checkTelegramBot(): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const data = await response.json() as any;
    return data.ok;
  } catch (error) {
    console.error('❌ Telegram bot error:', error);
    return false;
  }
}

async function getSystemStatistics() {
  try {
    // Estadísticas básicas
    const totalUsers = await prisma.telegramuser.count();
    const totalPollsSent = await prisma.telegrampoll.count();
    const totalResponses = await prisma.telegramresponse.count();
    
    // Actividad reciente (últimas 24 horas)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentPollsSent = await prisma.telegrampoll.count({
      where: { createdat: { gte: last24Hours } }
    });
    
    const recentResponses = await prisma.telegramresponse.count({
      where: { answeredat: { gte: last24Hours } }
    });
    
    // Top 5 usuarios más activos
    const topUsers = await prisma.telegramuser.findMany({
      orderBy: { totalpoints: 'desc' },
      take: 5,
      select: {
        firstname: true,
        lastname: true,
        totalpoints: true,
        level: true
      }
    });
    
    // Obtener conteo de respuestas por usuario
    const processedUsers = await Promise.all(topUsers.map(async (user: any) => {
      const responseCount = await prisma.telegramresponse.count({
        where: { userid: user.id }
      });
      
      return {
        firstname: user.firstname,
        lastname: user.lastname,
        totalpoints: user.totalpoints,
        currentLevel: user.level,
        totalResponses: responseCount
      };
    }));
    
    // Últimos polls enviados (sin relación a question)
    const recentPolls = await prisma.telegrampoll.findMany({
      orderBy: { createdat: 'desc' },
      take: 3,
      select: {
        id: true,
        pollid: true,
        questionid: true,
        sourcemodel: true,
        createdat: true
      }
    });
    
    return {
      totalUsers,
      totalPollsSent,
      totalResponses,
      recentPollsSent,
      recentResponses,
      topUsers: processedUsers,
      recentPolls
    };
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return null;
  }
}

async function runSystemCheck() {
  console.log('🔍 MONITOREO DEL SISTEMA DE POLLS');
  console.log('=================================');
  console.log('');
  
  const health: SystemHealth = {
    database: await checkDatabaseHealth(),
    webhook: await checkWebhookHealth(), 
    telegram: await checkTelegramBot()
  };
  
  // Mostrar estado de componentes
  console.log('🏥 ESTADO DE COMPONENTES:');
  console.log('-------------------------');
  console.log(`📊 Base de datos: ${health.database ? '✅ OK' : '❌ ERROR'}`);
  console.log(`🌐 Webhook (puerto 3000): ${health.webhook ? '✅ OK' : '❌ ERROR'}`);
  console.log(`🤖 Bot de Telegram: ${health.telegram ? '✅ OK' : '❌ ERROR'}`);
  console.log('');
  
  // Estado general del sistema
  const isHealthy = health.database && health.webhook && health.telegram;
  console.log(`🎯 ESTADO GENERAL: ${isHealthy ? '✅ SISTEMA FUNCIONANDO' : '❌ SISTEMA CON PROBLEMAS'}`);
  console.log('');
  
  // Obtener estadísticas
  const stats = await getSystemStatistics();
  
  if (stats) {
    console.log('📊 ESTADÍSTICAS DEL SISTEMA:');
    console.log('-----------------------------');
    console.log(`👥 Total usuarios registrados: ${stats.totalUsers}`);
    console.log(`🗳️  Total polls enviados: ${stats.totalPollsSent}`);
    console.log(`💬 Total respuestas: ${stats.totalResponses}`);
    console.log('');
    
    console.log('📈 ACTIVIDAD ÚLTIMAS 24 HORAS:');
    console.log('-------------------------------');
    console.log(`🗳️  Polls enviados: ${stats.recentPollsSent}`);
    console.log(`💬 Respuestas recibidas: ${stats.recentResponses}`);
    console.log('');
    
    if (stats.topUsers.length > 0) {
      console.log('🏆 TOP 5 USUARIOS MÁS ACTIVOS:');
      console.log('-------------------------------');
      stats.topUsers.forEach((user: any, index: number) => {
        const name = `${user.firstname} ${user.lastname || ''}`.trim();
        console.log(`${index + 1}. ${name} - 🏆 ${user.totalpoints} pts - 📊 Nivel ${user.currentLevel} - 💬 ${user.totalResponses} respuestas`);
      });
      console.log('');
    }
    
    if (stats.recentPolls.length > 0) {
      console.log('📝 ÚLTIMOS POLLS ENVIADOS:');
      console.log('---------------------------');
      stats.recentPolls.forEach((poll: any, index: number) => {
        console.log(`${index + 1}. Poll ID: ${poll.pollid}`);
        console.log(`   📋 Pregunta ID: ${poll.questionid}`);
        console.log(`   📂 Fuente: ${poll.sourcemodel}`);
        console.log(`   📅 ${poll.createdat.toLocaleString()}`);
        console.log('');
      });
    }
  }
  
  console.log('');
  console.log('🔄 Para ejecutar de nuevo: npx tsx scripts/monitor-system.ts');
  console.log('⏰ Para scheduler automático: npx tsx scripts/scheduler.ts');
  console.log('📤 Para envío manual: npx tsx scripts/send-poll-question.ts --list');
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
      console.log('📋 MONITOREO DEL SISTEMA:');
      console.log('');
      console.log('  🔍 Ejecutar chequeo completo:');
      console.log('     npx tsx scripts/monitor-system.ts');
      console.log('');
      console.log('  📋 Mostrar esta ayuda:');
      console.log('     npx tsx scripts/monitor-system.ts --help');
      console.log('');
      console.log('🔍 WHAT THIS SCRIPT CHECKS:');
      console.log('   • Database connectivity');
      console.log('   • Webhook server status');
      console.log('   • Telegram bot status');
      console.log('   • System statistics');
      console.log('   • Recent activity');
      console.log('   • Top users');
      return;
    }
    
    await runSystemCheck();
    
  } catch (error) {
    console.error('❌ Error en monitoreo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 