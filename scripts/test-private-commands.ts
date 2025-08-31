// Script para probar que los comandos se envían al privado
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrivateCommands() {
  try {
    console.log('🧪 PRUEBA DE COMANDOS PRIVADOS');
    console.log('============================');
    console.log('Este script simula comandos en grupo para verificar el envío privado');
    
    // Lista de comandos que deberían ir al privado
    const privateCommands = [
      // 📊 Estadísticas personales
      '/stats', '/ranking', '/logros', '/prediccion', '/metas', '/racha',
      
      // 📚 Exámenes oficiales  
      '/examen2018', '/examen2018stats', '/examen2024', '/examen2024stats',
      '/ranking_oficial2018', '/ranking_oficial2024', '/comparativa_examenes',
      
      // 🎓 Simulacros
      '/simulacro', '/simulacro_historial', '/simulacro2024', '/simulacro_oficial',
      
      // 🏆 Torneos
      '/torneo', '/torneos', '/torneo_historial'
    ];
    
    console.log(`\n📋 Comandos configurados para privado: ${privateCommands.length}`);
    privateCommands.forEach((cmd, index) => {
      console.log(`   ${index + 1}. ${cmd}`);
    });
    
    // Verificar que el servidor esté funcionando
    console.log('\n🚀 1. VERIFICANDO SERVIDOR...');
    try {
      const serverResponse = await fetch('http://localhost:3000/api/telegram/webhook');
      const serverResult = await serverResponse.json() as any;
      
      if (serverResult.status === 'ok') {
        console.log('✅ Servidor funcionando correctamente');
      } else {
        throw new Error('Servidor no responde correctamente');
      }
    } catch (error) {
      console.log('❌ ERROR: Servidor no disponible');
      console.log('💡 SOLUCIÓN: Ejecuta "npm run dev" primero');
      return;
    }
    
    // Probar algunos comandos clave
    const testCommands = ['/ranking', '/torneo', '/stats', '/examen2018'];
    
    console.log('\n📨 2. PROBANDO COMANDOS CLAVE...');
    
    for (const command of testCommands) {
      console.log(`\n🧪 Probando: ${command}`);
      
      const testMessage = {
        update_id: Date.now(),
        message: {
          message_id: Date.now(),
          from: {
            id: 999999999, // Usuario de prueba
            is_bot: false,
            first_name: "TestUser",
            username: "test_user"
          },
          chat: {
            id: -1002519334308, // ID del grupo (simulación)
            type: "supergroup"
          },
          date: Math.floor(Date.now() / 1000),
          text: command
        }
      };
      
      try {
        const response = await fetch('http://localhost:3000/api/telegram/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testMessage),
        });
        
        const result = await response.json() as any;
        
        console.log(`   📊 Status: ${response.status} | OK: ${response.ok}`);
        console.log(`   📄 Tipo de respuesta: ${result.type || 'no_type'}`);
        
        if (response.ok && result.type === 'command_handled') {
          console.log(`   ✅ ${command}: Comando procesado`);
          console.log(`   📨 Respuesta enviada: ${result.responseSent ? 'Sí' : 'No'}`);
          if (result.intelligentResult) {
            console.log(`   🧠 Sistema inteligente: ${result.intelligentResult.method}`);
          }
        } else {
          console.log(`   ❌ ${command}: Error procesando comando`);
          console.log(`   📄 Resultado completo:`, JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.log(`   ❌ ${command}: Error de conexión`);
      }
      
      // Pequeña pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ PRUEBA COMPLETADA');
    console.log('====================');
    console.log('📱 Verifica tu chat privado con el bot para ver los mensajes');
    console.log('🎯 Verifica el grupo para ver los mensajes de confirmación');
    console.log('💡 Los comandos deberían llegar al privado, no al grupo');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await testPrivateCommands();
}

main(); 