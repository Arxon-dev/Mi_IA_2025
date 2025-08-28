import { PrismaClient } from '@prisma/client';

// Configuración global para evitar múltiples instancias
declare global {
  var __prisma: PrismaClient | undefined;
}

// Crear una instancia de Prisma con configuración optimizada para MySQL
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: ['error'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

export { prisma };

/**
 * 🚀 FUNCIÓN PARA CERRAR CONEXIONES CORRECTAMENTE
 */
export async function closePrismaConnection() {
  await prisma.$disconnect();
  console.log('🔌 Conexión Prisma cerrada correctamente');
}

/**
 * 🧪 FUNCIÓN PARA PROBAR LA CONEXIÓN
 */
export async function testPrismaConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return false;
  }
}

/**
 * 🔄 FUNCIÓN PARA RECONECTAR EN CASO DE ERROR
 */
export async function ensurePrismaConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('⚠️ Conexión perdida, intentando reconectar...');
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Reconexión exitosa');
      return true;
    } catch (reconnectError) {
      console.error('❌ Error al reconectar:', reconnectError);
      return false;
    }
  }
} 