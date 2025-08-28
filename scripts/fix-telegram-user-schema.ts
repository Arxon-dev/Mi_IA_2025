import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTelegramUserSchema() {
  try {
    console.log('🔧 Actualizando usuarios existentes antes de la migración...');
    
    // Verificar usuarios existentes con lastActivity NULL
    const usersWithNullActivity = await prisma.$queryRaw`
      SELECT * FROM "TelegramUser" WHERE "lastActivity" IS NULL;
    `;
    
    console.log('📊 Usuarios con lastActivity NULL:', usersWithNullActivity);
    
    // Actualizar usuarios con lastActivity NULL
    const updateResult = await prisma.$executeRaw`
      UPDATE "TelegramUser" 
      SET "lastActivity" = COALESCE("joinedAt", NOW())
      WHERE "lastActivity" IS NULL;
    `;
    
    console.log('✅ Usuarios actualizados:', updateResult);
    
    // Verificar el estado después de la actualización
    const finalCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "TelegramUser" WHERE "lastActivity" IS NULL;
    `;
    
    console.log('🔍 Verificación final - usuarios con lastActivity NULL:', finalCheck);
    
    console.log('✅ Preparación completada. Ahora puedes ejecutar "npx prisma db push"');
    
  } catch (error) {
    console.error('❌ Error actualizando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTelegramUserSchema(); 