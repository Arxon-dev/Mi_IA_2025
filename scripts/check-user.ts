import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser(username: string) {
  try {
    console.log(`🔍 Buscando usuario: ${username}`);
    console.log('===============================');
    
    // Buscar por username
    const userByUsername = await prisma.telegramuser.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive'
        }
      }
    });
    
    // Buscar por firstName que contenga Carlos
    const userByName = await prisma.telegramuser.findMany({
      where: {
        firstname: {
          contains: 'Carlos',
          mode: 'insensitive'
        }
      }
    });
    
    // Mostrar todos los usuarios para comparar
    const allUsers = await prisma.telegramuser.findMany({
      orderBy: { totalpoints: 'desc' },
      select: {
        id: true,
        telegramuserid: true,
        username: true,
        firstname: true,
        lastname: true,
        totalpoints: true,
        level: true,
        joinedAt: true,
        responses: {
          select: {
            id: true,
            answeredAt: true
          }
        }
      }
    });
    
    console.log('\n📋 TODOS LOS USUARIOS REGISTRADOS:');
    console.log('==================================');
    allUsers.forEach((user, index) => {
      const name = `${user.firstname} ${user.lastname || ''}`.trim();
      console.log(`${index + 1}. ${name}`);
      console.log(`   📧 Username: ${user.username || 'Sin username'}`);
      console.log(`   🆔 Telegram ID: ${user.telegramuserid}`);
      console.log(`   🏆 Puntos: ${user.totalpoints}`);
      console.log(`   📊 Nivel: ${user.level}`);
      console.log(`   💬 Respuestas: ${user.responses.length}`);
      console.log(`   📅 Registrado: ${user.joinedAt.toLocaleString()}`);
      
      if (user.responses.length > 0) {
        console.log(`   🕐 Última respuesta: ${user.responses[user.responses.length - 1].answeredAt.toLocaleString()}`);
      }
      console.log('');
    });
    
    if (userByUsername.length > 0) {
      console.log('\n✅ USUARIO ENCONTRADO POR USERNAME:');
      console.log('===================================');
      userByUsername.forEach(user => {
        console.log(`Nombre: ${user.firstname} ${user.lastname || ''}`);
        console.log(`Username: ${user.username}`);
        console.log(`Telegram ID: ${user.telegramuserid}`);
        console.log(`Puntos: ${user.totalpoints}`);
      });
    } else {
      console.log(`\n❌ NO se encontró usuario con username que contenga: ${username}`);
    }
    
    if (userByName.length > 0) {
      console.log('\n✅ USUARIOS CON NOMBRE CARLOS:');
      console.log('==============================');
      userByName.forEach(user => {
        console.log(`Nombre: ${user.firstname} ${user.lastname || ''}`);
        console.log(`Username: ${user.username || 'Sin username'}`);
        console.log(`Telegram ID: ${user.telegramuserid}`);
        console.log(`Puntos: ${user.totalpoints}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener username del argumento o usar Carlos_esp por defecto
const username = process.argv[2] || 'Carlos_esp';
checkUser(username); 