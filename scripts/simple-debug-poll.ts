// Script simple para debuggear por qué no funcionan las respuestas
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugPollIssue() {
  try {
    console.log('🔍 DEBUG: ¿Por qué no se procesan las respuestas?');
    console.log('================================================');
    
    // 1. Verificar polls recientes
    console.log('📊 1. POLLS RECIENTES:');
    console.log('======================');
    
    const recentPolls = await prisma.telegrampoll.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    
    console.log(`✅ Encontrados ${recentPolls.length} polls:`);
    recentPolls.forEach((poll, i) => {
      console.log(`   ${i + 1}. Poll ID: ${poll.pollid}`);
      console.log(`      Source: ${poll.sourcemodel}`);
      console.log(`      Fecha: ${poll.createdAt.toLocaleString('es-ES')}`);
      console.log('');
    });
    
    if (recentPolls.length > 0) {
      const latestPoll = recentPolls[0];
      
      // 2. Verificar si hay TournamentResponse para este poll (problema principal)
      console.log('🔍 2. ¿HAY CONFLICTO CON TORNEOS?');
      console.log('==================================');
      
      const tournamentConflict = await prisma.tournamentResponse.findMany({
        where: {
          pollid: latestPoll.pollid
        }
      });
      
      if (tournamentConflict.length > 0) {
        console.log('🚨 PROBLEMA ENCONTRADO: Este poll aparece en TournamentResponse!');
        console.log(`   Hay ${tournamentConflict.length} registros conflictivos`);
        console.log('   Esto hace que handleTournamentPollAnswer devuelva TRUE');
        console.log('   Y impide que se procese como pregunta regular');
        
        return { problem: 'tournament_conflict', pollid: latestPoll.pollid };
      } else {
        console.log('✅ No hay conflicto con torneos');
      }
      
      // 3. Verificar si hay respuestas regulares
      console.log('\n📊 3. RESPUESTAS REGULARES:');
      console.log('============================');
      
      // Buscar en todas las tablas posibles de respuestas
      const tables = ['duelResponse', 'simulationResponse'];
      
      for (const table of tables) {
        try {
          const query = `SELECT COUNT(*) as count FROM "${table}" WHERE "telegramMsgId" = $1`;
          const result = await prisma.$queryRawUnsafe(query, latestPoll.pollid);
          console.log(`   ${table}: ${(result as any)[0]?.count || 0} respuestas`);
        } catch (error) {
          console.log(`   ${table}: No disponible o error`);
        }
      }
    }
    
    // 4. Verificar el estado general del sistema
    console.log('\n🔍 4. VERIFICACIÓN GENERAL:');
    console.log('============================');
    
    const totalTournamentResponses = await prisma.tournamentResponse.count();
    const activeTournaments = await prisma.tournament.count({
      where: { status: 'IN_PROGRESS' }
    });
    
    console.log(`📊 Total TournamentResponse: ${totalTournamentResponses}`);
    console.log(`🏆 Torneos activos: ${activeTournaments}`);
    
    // 5. Revisar polls sin respuestas recientes
    console.log('\n📅 5. ANÁLISIS DE ACTIVIDAD:');
    console.log('=============================');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const pollsYesterday = await prisma.telegrampoll.count({
      where: {
        createdAt: { gte: yesterday }
      }
    });
    
    console.log(`📊 Polls enviados últimas 24h: ${pollsYesterday}`);
    
    // 6. Instrucciones para el usuario
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('===================');
    console.log('1. 📱 Responde la pregunta más reciente en Telegram');
    console.log('2. ⏱️ Espera 10 segundos');
    console.log('3. 🔄 Ejecuta: npx tsx scripts/simple-debug-poll.ts');
    console.log('4. 📊 Si sigues sin puntos, el problema persiste');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await debugPollIssue();
}

main(); 