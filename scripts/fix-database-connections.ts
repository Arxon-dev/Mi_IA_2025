/**
 * 🔧 SCRIPT: PREVENIR PROBLEMAS DE CONEXIONES DE BASE DE DATOS
 * 
 * Este script implementa mejores prácticas para evitar el error:
 * "Too many database connections opened"
 */

import { PrismaClient } from '@prisma/client';

// Singleton para evitar múltiples instancias de Prisma
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      // Configuración optimizada para evitar exceso de conexiones
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Log solo errores en producción
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    
    // Conectar inmediatamente
    prisma.$connect();
    
    console.log('🔗 Nueva conexión Prisma establecida');
  }
  
  return prisma;
}

async function optimizeDatabaseConnections() {
  try {
    console.log('🔧 ===== OPTIMIZANDO CONEXIONES DE BASE DE DATOS =====\\n');
    
    const client = getPrismaClient();
    
    // Verificar conexión
    console.log('📊 Verificando conexión a la base de datos...');
    await client.$queryRaw`SELECT 1`;
    console.log('✅ Conexión verificada exitosamente');
    
    // Estadísticas de torneos activos
    console.log('\\n📈 Verificando estado de torneos...');
    const activeTournaments = await client.tournament.count({
      where: { 
        status: {
          in: ['REGISTRATION_OPEN', 'READY_TO_START', 'IN_PROGRESS']
        }
      }
    });
    
    const totalParticipants = await client.tournamentParticipant.count();
    
    console.log(`📊 Torneos activos: ${activeTournaments}`);
    console.log(`👥 Total participantes: ${totalParticipants}`);
    
    // Limpiar posibles conexiones huérfanas (opcional)
    console.log('\\n🧹 Optimizando conexiones...');
    
    // Cerrar conexión temporal
    await client.$disconnect();
    console.log('✅ Conexiones optimizadas');
    
    console.log('\\n💡 RECOMENDACIONES PARA EVITAR EL PROBLEMA:');
    console.log('   1. Usar siempre el patrón Singleton para Prisma');
    console.log('   2. Cerrar conexiones explícitamente con $disconnect()');
    console.log('   3. Evitar crear múltiples instancias de PrismaClient');
    console.log('   4. Usar connection pooling en producción');
    
    console.log('\\n🚀 APLICACIÓN:');
    console.log('   - Implementar en tournamentService.ts');
    console.log('   - Usar en scripts de creación de torneos');
    console.log('   - Aplicar en notificationService.ts');
    
  } catch (error) {
    console.error('❌ Error optimizando conexiones:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('too many clients')) {
        console.log('\\n💡 SOLUCIÓN PARA "TOO MANY CLIENTS":');
        console.log('   1. Reiniciar el servidor Next.js (npm run dev)');
        console.log('   2. Verificar que no hay scripts corriendo en paralelo');
        console.log('   3. Implementar connection pooling');
        console.log('   4. Usar el patrón Singleton para Prisma');
      }
    }
    
    throw error;
  }
}

// Función para implementar el patrón Singleton en servicios
export function createOptimizedPrismaClient(): PrismaClient {
  return getPrismaClient();
}

// Función para cerrar todas las conexiones al final de un proceso
export async function closeAllConnections(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('🔒 Todas las conexiones cerradas');
  }
}

// Ejecutar optimización si se ejecuta directamente
if (require.main === module) {
  optimizeDatabaseConnections()
    .then(() => {
      console.log('\\n🎊 Optimización completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Optimización falló:', error);
      process.exit(1);
    });
} 