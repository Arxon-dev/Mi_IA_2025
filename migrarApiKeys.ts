// migrarApiKeys.ts
// Script temporal para migrar las API keys desde .env.local a la tabla relacional AIProviderKey
// Uso: npx tsx -r dotenv/config migrarApiKeys.ts

import { PrismaService } from './src/services/prismaService';

(async () => {
  try {
    await PrismaService.migrateEnvApiKeysToProviderKeys();
    console.log('✅ Migración de API keys completada.');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    process.exit(0);
  }
})(); 