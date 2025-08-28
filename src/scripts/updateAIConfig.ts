import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAIConfig() {
  try {
    // Buscar la configuración existente
    const existingConfig = await prisma.aIConfig.findFirst();

    if (existingConfig) {
      // Actualizar la configuración existente
      await prisma.aIConfig.update({
        where: { id: existingConfig.id },
        data: {
          model: 'gemini-pro',
          provider: 'google',
          temperature: 0.3,
          maxTokens: 30720
        }
      });
      console.log('Configuración de AI actualizada correctamente');
    } else {
      // Crear nueva configuración
      await prisma.aIConfig.create({
        data: {
          model: 'gemini-pro',
          provider: 'google',
          temperature: 0.3,
          maxTokens: 30720
        }
      });
      console.log('Nueva configuración de AI creada correctamente');
    }
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAIConfig(); 