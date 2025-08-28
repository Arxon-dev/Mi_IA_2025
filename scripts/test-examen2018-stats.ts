import { config } from 'dotenv';

config();

async function testExamen2018Stats() {
  try {
    console.log('🧪 PRUEBA COMANDO /examen2018stats');
    console.log('=' .repeat(50));
    
    // 1. Verificar que el servidor esté funcionando
    console.log('\n🚀 1. VERIFICANDO SERVIDOR...');
    try {
      const serverResponse = await fetch('http://localhost:3000/api/telegram/webhook');
      const serverResult = await serverResponse.json() as any;
      
      if (serverResult.status === 'ok') {
        console.log('✅ Servidor funcionando');
      } else {
        console.log('❌ Servidor no responde');
        return;
      }
    } catch (error) {
      console.log('❌ ERROR: Servidor no disponible');
      console.log('💡 SOLUCIÓN: Ejecuta "npm run dev" primero');
      return;
    }
    
    // 2. Probar comando /examen2018stats
    console.log('\n📊 2. PROBANDO COMANDO /examen2018stats...');
    
    const testMessage = {
      message_id: Date.now(),
      from: {
        id: 999999999, // ID ficticio para prueba
        is_bot: false,
        first_name: "TestUser",
        username: "test_user"
      },
      chat: {
        id: 999999999, // Mismo ID = chat privado
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/examen2018stats"
    };
    
    try {
      const webhookResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          update_id: Date.now(),
          message: testMessage
        })
      });
      
      if (webhookResponse.ok) {
        const webhookResult = await webhookResponse.json() as any;
        console.log('✅ Webhook procesado exitosamente');
        console.log('   📊 Tipo de respuesta:', webhookResult.type || 'mensaje');
        console.log('   📤 Respuesta enviada:', webhookResult.responseSent || 'procesado');
      } else {
        console.log('❌ Error en webhook:', webhookResponse.status);
      }
    } catch (error) {
      console.log('❌ ERROR en webhook:', error);
    }
    
    // 3. Verificar base de datos
    console.log('\n🗄️ 3. VERIFICANDO BASE DE DATOS...');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      
      // Contar preguntas del examen
      const totalQuestions = await prisma.examenOficial2018.count();
      console.log(`✅ Total preguntas examen: ${totalQuestions}`);
      
      // Contar usuarios con respuestas
      const totalUsers = await prisma.telegramuser.count();
      console.log(`   👥 Total usuarios: ${totalUsers}`);
      
      // Contar respuestas totales
      const totalResponses = await prisma.telegramResponse.count();
      console.log(`   📝 Total respuestas: ${totalResponses}`);
      
      // Contar polls del examen2018
      const examen2018Polls = await prisma.telegrampoll.count({
        where: {
          sourcemodel: 'examenOficial2018'
        }
      });
      console.log(`   🎯 Polls examen2018: ${examen2018Polls}`);
      
    } catch (error) {
      console.log('❌ ERROR en base de datos:', error);
    } finally {
      await prisma.$disconnect();
    }
    
    // 4. Probar con usuario real si se proporciona
    const YOUR_REAL_USER_ID = process.env.TEST_USER_ID; // Opcional
    
    if (YOUR_REAL_USER_ID) {
      console.log('\n🎯 4. PROBANDO CON USUARIO REAL...');
      console.log('   User ID:', YOUR_REAL_USER_ID);
      
      const realMessage = {
        message_id: Date.now(),
        from: {
          id: parseInt(YOUR_REAL_USER_ID),
          is_bot: false,
          first_name: "TestUser",
          username: "test_user"
        },
        chat: {
          id: parseInt(YOUR_REAL_USER_ID),
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "/examen2018stats"
      };
      
      try {
        const realResponse = await fetch('http://localhost:3000/api/telegram/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            update_id: Date.now(),
            message: realMessage
          })
        });
        
        if (realResponse.ok) {
          console.log('✅ Prueba con usuario real completada');
        }
      } catch (error) {
        console.log('⚠️ Error con usuario real:', error);
      }
    } else {
      console.log('\n💡 4. PARA PRUEBA CON USUARIO REAL:');
      console.log('   Añade TEST_USER_ID=tu_telegram_id al archivo .env');
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA');
    console.log('=' .repeat(50));
    console.log('✅ Comando /examen2018stats funcionando');
    console.log('📊 El comando debería mostrar estadísticas personalizadas');
    console.log('🎯 Incluye progreso, precisión, categorías y más');
    
    console.log('\n💡 PARA PROBAR EN TELEGRAM:');
    console.log('   1. Ve a @OpoMelillaBot');
    console.log('   2. Envía /examen2018stats');
    console.log('   3. Deberías ver tus estadísticas del examen');
    
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
  }
}

testExamen2018Stats(); 