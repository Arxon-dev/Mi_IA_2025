import { config } from 'dotenv';

config();

async function monitorDatabaseRecovery() {
  console.log('🔄 MONITOREANDO RECUPERACIÓN DE BASE DE DATOS');
  console.log('=' .repeat(50));
  console.log('⏳ Verificando cada 10 segundos...');
  console.log('🛑 Presiona Ctrl+C para detener\n');
  
  let attempts = 0;
  const maxAttempts = 30; // 5 minutos máximo
  
  while (attempts < maxAttempts) {
    attempts++;
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      console.log(`🔍 [${timestamp}] Intento ${attempts}/${maxAttempts}...`);
      
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Intentar conectar con timeout de 5 segundos
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      console.log(`✅ [${timestamp}] ¡CONEXIÓN EXITOSA!`);
      
      // Verificar que las tablas están accesibles
      const count = await prisma.examenOficial2018.count();
      console.log(`📊 [${timestamp}] Tabla ExamenOficial2018: ${count} registros`);
      
      await prisma.$disconnect();
      
      console.log('\n🎉 ¡BASE DE DATOS RECUPERADA!');
      console.log('✅ Ahora puedes probar los comandos del bot:');
      console.log('   📝 /examen2018');
      console.log('   📊 /examen2018stats');
      
      break;
      
    } catch (error: any) {
      if (error.message.includes('Can\'t reach database server')) {
        console.log(`⏳ [${timestamp}] Aún no accesible, reintentando...`);
      } else {
        console.log(`⚠️ [${timestamp}] Error diferente:`, error.message);
      }
    }
    
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Esperar 10 segundos
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('\n❌ TIMEOUT: Base de datos aún no accesible después de 5 minutos');
    console.log('💡 VERIFICA en Supabase Dashboard que hayas reactivado el proyecto');
  }
}

monitorDatabaseRecovery(); 