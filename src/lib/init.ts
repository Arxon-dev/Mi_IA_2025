import { prisma, testPrismaConnection } from './prisma';

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return true;
  
  console.log('🔄 Inicializando conexión a base de datos...');
  
  try {
    // Verificar conexión
    const connected = await testPrismaConnection();
    
    if (connected) {
      console.log('✅ Base de datos inicializada correctamente');
      initialized = true;
      return true;
    } else {
      console.error('❌ No se pudo inicializar la base de datos');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    return false;
  }
}

// Inicializar automáticamente si estamos en el servidor
if (typeof window === 'undefined') {
  initializeDatabase().catch(console.error);
} 