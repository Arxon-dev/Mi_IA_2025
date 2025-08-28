import { config } from 'dotenv';

config();

async function testExamen2018WithRealData() {
  try {
    console.log('🧪 PROBANDO /examen2018stats CON DATOS REALES');
    console.log('=' .repeat(60));
    
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    
    // 1. Verificar datos existentes
    console.log('\n🔍 1. VERIFICANDO DATOS EXISTENTES...');
    
    const totalUsers = await prisma.telegramuser.count();
    const totalResponses = await prisma.telegramResponse.count();
    const totalPolls = await prisma.telegrampoll.count({
      where: { sourcemodel: 'examenOficial2018' }
    });
    
    console.log(`   👥 Usuarios: ${totalUsers}`);
    console.log(`   📝 Respuestas: ${totalResponses}`);
    console.log(`   🎯 Polls examen2018: ${totalPolls}`);
    
    // 2. Buscar usuario de prueba
    const testUserId = '5793286375'; // Carlos
    const testUser = await prisma.telegramuser.findUnique({
      where: { telegramuserid: testUserId }
    });
    
    if (!testUser) {
      console.log('\n❌ Usuario de prueba no encontrado, creando...');
      
      const newUser = await prisma.telegramuser.create({
        data: {
          telegramuserid: testUserId,
          username: 'Carlos_esp',
          firstname: 'Carlos',
          totalpoints: 100,
          level: 2,
          streak: 3
        }
      });
      
      console.log('✅ Usuario creado:', newUser.firstname);
    } else {
      console.log('✅ Usuario encontrado:', testUser.firstname);
    }
    
    // 3. Verificar respuestas del usuario al examen2018
    console.log('\n📊 3. VERIFICANDO RESPUESTAS DEL USUARIO...');
    
    const userExamenResponses = await prisma.$queryRaw`
      SELECT 
        tr."iscorrect",
        tr."answeredAt",
        tp."questionid",
        eo."questionnumber",
        eo.category
      FROM "TelegramResponse" tr
      JOIN "TelegramPoll" tp ON tr."questionid" = tp."pollid"
      JOIN "ExamenOficial2018" eo ON tp."questionid" = eo.id
      JOIN "TelegramUser" tu ON tr."userid" = tu.id
      WHERE tu."telegramuserid" = ${testUserId}
      AND tp."sourcemodel" = 'examenOficial2018'
      ORDER BY tr."answeredAt" DESC
      LIMIT 10
    ` as any[];
    
    console.log(`   📝 Respuestas del usuario al examen: ${userExamenResponses.length}`);
    
    if (userExamenResponses.length > 0) {
      console.log('   🎯 Últimas respuestas:');
      userExamenResponses.slice(0, 3).forEach((response, index) => {
        const emoji = response.iscorrect ? '✅' : '❌';
        console.log(`      ${emoji} P${response.questionnumber} - ${response.category}`);
      });
    }
    
    // 4. Si no hay respuestas, crear algunas de prueba
    if (userExamenResponses.length === 0) {
      console.log('\n🔧 4. CREANDO DATOS DE PRUEBA...');
      
      // Obtener algunas preguntas del examen
      const sampleQuestions = await prisma.examenOficial2018.findMany({
        take: 5,
        orderBy: { questionnumber: 'asc' }
      });
      
      if (sampleQuestions.length > 0) {
        console.log(`   📝 Encontradas ${sampleQuestions.length} preguntas para crear respuestas`);
        
        // Crear polls ficticios para las pruebas
        for (const question of sampleQuestions) {
          // Crear poll ficticio
          const poll = await prisma.telegrampoll.create({
            data: {
              pollid: `test-poll-${question.id}`,
              questionid: question.id,
              sourcemodel: 'examenOficial2018',
              correctanswerindex: question.correctanswerindex,
              options: question.options,
              chatid: testUserId
            }
          });
          
          // Crear respuesta ficticia
          await prisma.telegramResponse.create({
            data: {
              userid: testUser!.id,
              questionid: poll.pollid,
              iscorrect: Math.random() > 0.3, // 70% de acierto
              responsetime: Math.floor(Math.random() * 30) + 10, // 10-40 segundos
              points: Math.random() > 0.3 ? 20 : 0,
              answeredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Última semana
            }
          });
        }
        
        console.log('✅ Datos de prueba creados');
      }
    }
    
    // 5. Probar el comando stats
    console.log('\n🎯 5. PROBANDO COMANDO /examen2018stats...');
    
    const testMessage = {
      message_id: Date.now(),
      from: {
        id: parseInt(testUserId),
        is_bot: false,
        first_name: "Carlos",
        username: "Carlos_esp"
      },
      chat: {
        id: parseInt(testUserId),
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/examen2018stats"
    };
    
    const webhookResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: Date.now(),
        message: testMessage
      })
    });
    
    if (webhookResponse.ok) {
      console.log('✅ Comando procesado exitosamente');
      console.log('💬 El bot debería haber enviado estadísticas por privado');
    } else {
      console.log('❌ Error en webhook:', webhookResponse.status);
    }
    
    await prisma.$disconnect();
    
    console.log('\n🎉 PRUEBA COMPLETADA');
    console.log('📱 Ve a tu chat privado con @OpoMelillaBot para ver las estadísticas');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

testExamen2018WithRealData(); 