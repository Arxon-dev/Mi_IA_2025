import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPollDatabase() {
  try {
    console.log('🔍 VERIFICANDO BASE DE DATOS');
    console.log('============================');
    
    // Verificar polls en la base de datos
    console.log('📊 Buscando polls registrados...');
    const polls = await prisma.telegrampoll.findMany({
      orderBy: { sentAt: 'desc' },
      take: 5
    });
    
    console.log(`✅ Encontrados ${polls.length} polls:`);
    polls.forEach((poll, index) => {
      console.log(`   ${index + 1}. Poll ID: ${poll.pollid}`);
      console.log(`      Pregunta ID: ${poll.questionid}`);
      console.log(`      Enviado: ${poll.sentAt.toLocaleString()}`);
      console.log(`      Respuesta correcta: Opción ${poll.correctanswerindex}`);
      console.log(`      Chat ID: ${poll.chatid}`);
      console.log('');
    });
    
    // Verificar usuarios registrados
    console.log('👥 Verificando usuarios registrados...');
    const users = await prisma.telegramuser.findMany();
    console.log(`✅ Encontrados ${users.length} usuarios:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstname} (@${user.username || 'sin_username'})`);
      console.log(`      Telegram ID: ${user.telegramuserid}`);
      console.log(`      Puntos: ${user.totalpoints}`);
      console.log(`      Se unió: ${user.joinedAt.toLocaleString()}`);
      console.log('');
    });
    
    // Verificar respuestas registradas
    console.log('💬 Verificando respuestas registradas...');
    const responses = await prisma.telegramResponse.findMany({
      orderBy: { answeredAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstname: true,
            username: true
          }
        }
      }
    });
    
    console.log(`✅ Encontradas ${responses.length} respuestas:`);
    responses.forEach((response, index) => {
      console.log(`   ${index + 1}. ${response.user.firstname} (@${response.user.username || 'sin_username'})`);
      console.log(`      Pregunta ID: ${response.questionid}`);
      console.log(`      Correcto: ${response.iscorrect ? '✅' : '❌'}`);
      console.log(`      Puntos: ${response.points}`);
      console.log(`      Respondido: ${response.answeredAt.toLocaleString()}`);
      console.log('');
    });
    
    // Buscar específicamente la pregunta final
    console.log('🎯 Buscando la pregunta final específicamente...');
    const finalPoll = await prisma.telegrampoll.findFirst({
      where: {
        pollid: '5890795620695803130' // Poll ID de la pregunta final
      }
    });
    
    if (finalPoll) {
      console.log('✅ Pregunta final encontrada en la base de datos:');
      console.log(`   Poll ID: ${finalPoll.pollid}`);
      console.log(`   Pregunta ID: ${finalPoll.questionid}`);
      console.log(`   Respuesta correcta: Opción ${finalPoll.correctanswerindex}`);
      console.log(`   Enviado: ${finalPoll.sentAt.toLocaleString()}`);
    } else {
      console.log('❌ La pregunta final NO se encontró en la base de datos');
      console.log('   Esto explica por qué no se procesan las respuestas');
    }
    
  } catch (error) {
    console.error('❌ Error verificando base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPollDatabase(); 