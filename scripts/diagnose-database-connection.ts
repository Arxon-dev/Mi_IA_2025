import { config } from 'dotenv';

config();

async function diagnoseDatabaseConnection() {
  try {
    console.log('🔍 DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS');
    console.log('=' .repeat(60));
    
    // 1. Verificar variables de entorno
    console.log('\n📋 1. VERIFICANDO VARIABLES DE ENTORNO...');
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;
    
    if (!databaseUrl) {
      console.log('❌ DATABASE_URL no encontrada');
      return;
    }
    
    console.log('✅ DATABASE_URL encontrada');
    console.log('   📝 Longitud:', databaseUrl.length, 'caracteres');
    
    // Extraer información de la URL sin mostrar credenciales
    try {
      const url = new URL(databaseUrl);
      console.log('   🌐 Host:', url.hostname);
      console.log('   🔌 Puerto:', url.port || '5432');
      console.log('   🗄️ Base de datos:', url.pathname.slice(1));
      console.log('   👤 Usuario:', url.username ? '***' + url.username.slice(-3) : 'no encontrado');
    } catch (error) {
      console.log('❌ ERROR: DATABASE_URL malformada');
      console.log('   💡 SOLUCIÓN: Verifica el formato de la URL');
      return;
    }
    
    if (directUrl) {
      console.log('✅ DIRECT_URL también encontrada');
    } else {
      console.log('⚠️ DIRECT_URL no encontrada (opcional)');
    }
    
    // 2. Probar conexión con Prisma
    console.log('\n🔗 2. PROBANDO CONEXIÓN CON PRISMA...');
    
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: databaseUrl
          }
        }
      });
      
      console.log('   🚀 Cliente Prisma creado');
      
      // Intentar conectar con timeout
      console.log('   ⏳ Intentando conectar...');
      const connectPromise = prisma.$connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      console.log('   ✅ Conexión exitosa');
      
      // Probar una query simple
      console.log('   📊 Probando query simple...');
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('   ✅ Query simple exitosa:', result);
      
      // Verificar tablas específicas
      console.log('   🏗️ Verificando tabla ExamenOficial2018...');
      const count = await prisma.examenOficial2018.count();
      console.log('   ✅ Tabla accesible, registros:', count);
      
      await prisma.$disconnect();
      console.log('   🔌 Desconectado exitosamente');
      
    } catch (error: any) {
      console.log('   ❌ ERROR EN CONEXIÓN PRISMA:');
      console.log('   💥', error.message);
      
      if (error.message.includes('Can\'t reach database server')) {
        console.log('\n🔧 POSIBLES SOLUCIONES:');
        console.log('   1️⃣ Base de datos pausada en Supabase');
        console.log('   2️⃣ Problema de conectividad de red');
        console.log('   3️⃣ Límite de conexiones alcanzado');
        console.log('   4️⃣ Credenciales incorrectas');
      }
      
      return;
    }
    
    // 3. Verificar estado de Supabase
    console.log('\n🌐 3. VERIFICANDO ESTADO DE SUPABASE...');
    
    try {
      // Extraer el proyecto ID de la URL
      const url = new URL(databaseUrl);
      const projectMatch = url.hostname.match(/^([^.]+)\.supabase/);
      
      if (projectMatch) {
        const projectId = projectMatch[1];
        console.log('   🆔 Project ID detectado:', projectId);
        
        // Verificar si podemos hacer ping al host
        console.log('   🏓 Verificando conectividad al host...');
        
        // Intentar hacer una conexión TCP simple
        const net = await import('net');
        const socket = new net.Socket();
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            socket.destroy();
            reject(new Error('Timeout conectando al servidor'));
          }, 5000);
          
          socket.connect(5432, url.hostname, () => {
            clearTimeout(timeout);
            socket.destroy();
            console.log('   ✅ Servidor responde en puerto 5432');
            resolve(true);
          });
          
          socket.on('error', (err) => {
            clearTimeout(timeout);
            console.log('   ❌ Error conectando al servidor:', err.message);
            reject(err);
          });
        });
        
      } else {
        console.log('   ⚠️ No se pudo extraer Project ID de la URL');
      }
      
    } catch (error: any) {
      console.log('   ❌ Error verificando Supabase:', error.message);
    }
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('❌ ERROR GENERAL EN DIAGNÓSTICO:', error);
  }
}

diagnoseDatabaseConnection(); 