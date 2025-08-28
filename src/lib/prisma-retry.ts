import { prisma, ensurePrismaConnection } from './prisma';

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  operationName: string = 'database operation'
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verificar conexión antes de cada intento
      if (attempt > 1) {
        console.log(`🔄 Intento ${attempt}/${maxRetries} para ${operationName}...`);
        await ensurePrismaConnection();
      }
      
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} exitosa en intento ${attempt}`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Si es un error de conexión, intentar reconectar
      if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
        console.warn(`⚠️ Error de conexión en ${operationName} (intento ${attempt}/${maxRetries})`);
        
        if (attempt < maxRetries) {
          console.log('🔄 Intentando reconectar...');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Backoff exponencial
          continue;
        }
      } else {
        // Para otros errores, no reintentar
        throw error;
      }
    }
  }
  
  console.error(`❌ ${operationName} falló después de ${maxRetries} intentos`);
  throw lastError;
}

// Wrapper específico para operaciones de Prisma comunes
export const prismaWithRetry = {
  async findUnique<T>(model: any, args: any): Promise<T> {
    return withRetry(() => model.findUnique(args), 3, 'findUnique');
  },
  
  async findMany<T>(model: any, args: any): Promise<T[]> {
    return withRetry(() => model.findMany(args), 3, 'findMany');
  },
  
  async create<T>(model: any, args: any): Promise<T> {
    return withRetry(() => model.create(args), 3, 'create');
  },
  
  async update<T>(model: any, args: any): Promise<T> {
    return withRetry(() => model.update(args), 3, 'update');
  },
  
  async upsert<T>(model: any, args: any): Promise<T> {
    return withRetry(() => model.upsert(args), 3, 'upsert');
  },
  
  async delete<T>(model: any, args: any): Promise<T> {
    return withRetry(() => model.delete(args), 3, 'delete');
  },
  
  async queryRaw<T>(query: any): Promise<T> {
    return withRetry(() => prisma.$queryRaw(query), 3, 'queryRaw');
  }
}; 