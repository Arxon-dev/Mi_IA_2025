import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';

async function testUserRegistration() {
  try {
    console.log('🧪 SIMULANDO REGISTRO DE USUARIO @Carlos_esp');
    console.log('=============================================');
    
    // Datos del usuario Carlos_esp
    const testUser = {
      telegramuserid: '9999999999', // ID ficticio para test
      username: 'Carlos_esp',
      firstname: 'Carlos',
      lastname: 'Espejo'
    };
    
    console.log('👤 Datos del usuario:');
    console.log(`   🆔 Telegram ID: ${testUser.telegramuserid}`);
    console.log(`   📧 Username: ${testUser.username}`);
    console.log(`   📝 Nombre: ${testUser.firstname} ${testUser.lastname}`);
    console.log('');
    
    // Verificar si ya existe
    const existingUser = await prisma.telegramuser.findUnique({
      where: { telegramuserid: testUser.telegramuserid }
    });
    
    if (existingUser) {
      console.log('⚠️  Usuario de prueba ya existe, eliminando...');
      await prisma.telegramuser.delete({
        where: { telegramuserid: testUser.telegramuserid }
      });
    }
    
    // Crear usuario
    console.log('✅ Registrando usuario...');
    const newUser = await prisma.telegramuser.create({
      data: testUser
    });
    
    console.log('✅ Usuario registrado exitosamente!');
    console.log(`   🆔 ID interno: ${newUser.id}`);
    console.log(`   🏆 Puntos iniciales: ${newUser.totalpoints}`);
    console.log(`   📊 Nivel inicial: ${newUser.level}`);
    console.log('');
    
    // Simular una respuesta correcta
    console.log('📝 Simulando respuesta correcta...');
    const testResponse = await prisma.telegramResponse.create({
      data: {
        userid: newUser.id,
        questionid: 'test-question-id',
        iscorrect: true,
        points: 20,
        responsetime: 15
      }
    });
    
    // Actualizar puntos del usuario
    await prisma.telegramuser.update({
      where: { id: newUser.id },
      data: {
        totalpoints: { increment: 20 },
        level: 2
      }
    });
    
    console.log('✅ Respuesta registrada!');
    console.log(`   💬 ID respuesta: ${testResponse.id}`);
    console.log(`   🎯 Correcta: ${testResponse.iscorrect}`);
    console.log(`   🏆 Puntos ganados: ${testResponse.points}`);
    console.log('');
    
    // Verificar que aparezca en el ranking
    console.log('🏆 Verificando ranking actualizado...');
    const topUsers = await prisma.telegramuser.findMany({
      orderBy: { totalpoints: 'desc' },
      take: 10,
      select: {
        username: true,
        firstname: true,
        lastname: true,
        totalpoints: true,
        level: true,
        responses: { select: { id: true } }
      }
    });
    
    console.log('\n🏆 RANKING ACTUALIZADO:');
    console.log('========================');
    topUsers.forEach((user, index) => {
      const name = `${user.firstname} ${user.lastname || ''}`.trim();
      const highlight = user.username === 'Carlos_esp' ? '👈 ¡AQUÍ ESTÁS!' : '';
      console.log(`${index + 1}. ${name} (@${user.username || 'sin username'}) - ${user.totalpoints} pts ${highlight}`);
    });
    
    // Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    await prisma.telegramResponse.deleteMany({
      where: { userid: newUser.id }
    });
    await prisma.telegramuser.delete({
      where: { id: newUser.id }
    });
    
    console.log('✅ Datos de prueba eliminados');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkTelegramInfo() {
  try {
    console.log('\n🔍 VERIFICANDO INFORMACIÓN DE TELEGRAM');
    console.log('=======================================');
    
    // Obtener información del bot
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const botInfo = await response.json() as any;
    
    if (botInfo.ok) {
      console.log('🤖 Bot conectado correctamente:');
      console.log(`   📛 Nombre: ${botInfo.result.first_name}`);
      console.log(`   📧 Username: @${botInfo.result.username}`);
      console.log(`   🆔 ID: ${botInfo.result.id}`);
    }
    
    // Obtener información del chat
    const CHAT_ID = '-1002352049779';
    const chatResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${CHAT_ID}`);
    const chatInfo = await chatResponse.json() as any;
    
    if (chatInfo.ok) {
      console.log('\n💬 Información del grupo:');
      console.log(`   📛 Título: ${chatInfo.result.title}`);
      console.log(`   🆔 ID: ${chatInfo.result.id}`);
      console.log(`   👥 Tipo: ${chatInfo.result.type}`);
    }
    
    console.log('\n❓ PARA APARECER EN EL RANKING DEBES:');
    console.log('====================================');
    console.log('1. 📍 Estar en el grupo correcto (Mi_IA_11_38_Telegram_Moodle)');
    console.log('2. 💬 Responder a los polls que envía el bot');
    console.log('3. ✅ Asegurarte de que el webhook funciona');
    console.log('4. 🔔 El bot debe poder "verte" y procesar tus respuestas');
    
  } catch (error) {
    console.error('❌ Error verificando Telegram:', error);
  }
}

async function main() {
  await testUserRegistration();
  await checkTelegramInfo();
}

main(); 