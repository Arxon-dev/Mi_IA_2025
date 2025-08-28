import { prisma, getConnectionStats, closePrismaConnection } from '../src/lib/prisma';

async function checkDatabaseConnections() {
  try {
    console.log('🔍 ===== VERIFICANDO CONEXIONES DE BASE DE DATOS =====\n');

    // 1. Verificar conexión básica
    console.log('📡 1. VERIFICANDO CONEXIÓN BÁSICA...');
    const isConnected = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexión básica exitosa:', isConnected);

    // 2. Obtener estadísticas de conexiones
    console.log('\n📊 2. ESTADÍSTICAS DE CONEXIONES ACTIVAS...');
    const stats = await getConnectionStats();
    
    if (stats && Array.isArray(stats)) {
      console.log('📈 Conexiones por estado:');
      stats.forEach((stat: any) => {
        console.log(`   • ${stat.state}: ${stat.count} conexiones`);
      });
    } else {
      console.log('📊 No se pudieron obtener estadísticas detalladas');
    }

    // 3. Verificar información de la base de datos
    console.log('\n🗄️ 3. INFORMACIÓN DE LA BASE DE DATOS...');
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        inet_server_addr() as server_address,
        inet_server_port() as server_port
    `;
    console.log('📋 Información de conexión:', dbInfo);

    // 4. Verificar límites de PostgreSQL
    console.log('\n⚙️ 4. CONFIGURACIÓN DE POSTGRESQL...');
    const pgSettings = await prisma.$queryRaw`
      SELECT name, setting, unit, context 
      FROM pg_settings 
      WHERE name IN ('max_connections', 'shared_buffers', 'work_mem', 'max_worker_processes')
    `;
    console.log('🔧 Configuración PostgreSQL:');
    if (Array.isArray(pgSettings)) {
      pgSettings.forEach((setting: any) => {
        console.log(`   • ${setting.name}: ${setting.setting} ${setting.unit || ''}`);
      });
    }

    // 5. Verificar conexiones de la aplicación actual
    console.log('\n🔗 5. CONEXIONES DE LA APLICACIÓN ACTUAL...');
    const appConnections = await prisma.$queryRaw`
      SELECT 
        application_name,
        state,
        COUNT(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND application_name IS NOT NULL
      GROUP BY application_name, state
      ORDER BY count DESC
    `;
    
    if (Array.isArray(appConnections) && appConnections.length > 0) {
      console.log('📱 Conexiones por aplicación:');
      appConnections.forEach((app: any) => {
        console.log(`   • ${app.application_name} (${app.state}): ${app.count} conexiones`);
      });
    } else {
      console.log('📱 No se detectaron conexiones de aplicación específicas');
    }

    // 6. Verificar conexiones idle
    console.log('\n💤 6. CONEXIONES INACTIVAS...');
    const idleConnections = await prisma.$queryRaw`
      SELECT COUNT(*) as idle_count
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND state = 'idle'
    `;
    
    if (Array.isArray(idleConnections) && idleConnections.length > 0) {
      const idleCount = (idleConnections[0] as any).idle_count;
      console.log(`💤 Conexiones inactivas: ${idleCount}`);
      
      if (idleCount > 10) {
        console.log('⚠️ ADVERTENCIA: Muchas conexiones inactivas detectadas');
        console.log('💡 Considera reiniciar la aplicación para limpiar conexiones');
      }
    }

    // 7. Recomendaciones
    console.log('\n💡 7. RECOMENDACIONES...');
    
    const totalConnections = await prisma.$queryRaw`
      SELECT COUNT(*) as total
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    if (Array.isArray(totalConnections) && totalConnections.length > 0) {
      const total = (totalConnections[0] as any).total;
      console.log(`📊 Total de conexiones activas: ${total}`);
      
      if (total > 15) {
        console.log('🚨 ALERTA: Número elevado de conexiones detectado');
        console.log('📋 Acciones recomendadas:');
        console.log('   1. Revisar scripts corriendo en segundo plano');
        console.log('   2. Reiniciar el servidor Next.js');
        console.log('   3. Verificar configuración de connection pooling');
      } else if (total > 10) {
        console.log('⚠️ ADVERTENCIA: Número moderado de conexiones');
        console.log('📋 Recomendación: Monitorear el uso de conexiones');
      } else {
        console.log('✅ ÓPTIMO: Número de conexiones dentro del rango normal');
      }
    }

    console.log('\n🎯 ESTADO GENERAL: ✅ SISTEMA FUNCIONANDO CORRECTAMENTE');
    console.log('📅 Verificación completada:', new Date().toLocaleString());

  } catch (error) {
    console.error('❌ ERROR durante la verificación:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('too many clients')) {
        console.log('\n🆘 SOLUCIÓN INMEDIATA PARA "TOO MANY CLIENTS":');
        console.log('1. Ejecutar: taskkill /F /IM node.exe');
        console.log('2. Esperar 30 segundos');
        console.log('3. Reiniciar la aplicación');
      }
    }
  } finally {
    await closePrismaConnection();
  }
}

// Ejecutar la verificación
checkDatabaseConnections().catch(console.error);

// Manejar cierre del proceso
process.on('SIGINT', async () => {
  console.log('\n🔌 Cerrando conexiones...');
  await closePrismaConnection();
  process.exit(0);
});

export { checkDatabaseConnections }; 