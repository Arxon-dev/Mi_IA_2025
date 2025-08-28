import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function monitorResponses() {
  console.log('👀 MONITOREANDO RESPUESTAS EN TIEMPO REAL');
  console.log('==========================================');
  console.log('🔄 Presiona Ctrl+C para parar');
  console.log('');
  
  let lastUserCount = 0;
  let lastResponseCount = 0;
  
  const monitor = setInterval(async () => {
    try {
      const users = await prisma.telegramuser.count();
      const responses = await prisma.telegramResponse.count();
      
      if (users !== lastUserCount || responses !== lastResponseCount) {
        const now = new Date().toLocaleTimeString();
        console.log(`🎉 [${now}] ¡CAMBIO DETECTADO!`);
        console.log(`   👥 Usuarios: ${lastUserCount} → ${users}`);
        console.log(`   💬 Respuestas: ${lastResponseCount} → ${responses}`);
        
        if (users > 0) {
          // Mostrar usuario registrado
          const user = await prisma.telegramuser.findFirst({
            orderBy: { joinedAt: 'desc' }
          });
          console.log(`   🙋‍♂️ Usuario: ${user?.firstname} (@${user?.username || 'sin_username'})`);
          console.log(`   🏆 Puntos: ${user?.totalpoints}`);
          console.log('');
          console.log('✅ ¡ÉXITO! ¡El sistema funciona!');
          console.log('📊 Ve al dashboard: http://localhost:3000/dashboard');
        }
        
        lastUserCount = users;
        lastResponseCount = responses;
        console.log('');
      } else {
        const now = new Date().toLocaleTimeString();
        console.log(`⏳ [${now}] Esperando respuesta... (${users} usuarios, ${responses} respuestas)`);
      }
    } catch (error) {
      console.error('❌ Error monitoreando:', error);
    }
  }, 2000);
  
  process.on('SIGINT', async () => {
    clearInterval(monitor);
    await prisma.$disconnect();
    console.log('\n🛑 Monitoreo detenido');
    process.exit(0);
  });
}

monitorResponses(); 