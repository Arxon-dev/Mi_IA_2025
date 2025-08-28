import { PrismaClient } from '@prisma/client';
import { bloomLevels } from '../src/services/bloomTaxonomyService';

const prisma = new PrismaClient();

async function initBloomLevels() {
  try {
    console.log('🧠 Inicializando niveles de Bloom en la base de datos...');

    for (const level of bloomLevels) {
      await prisma.bloomLevel.create({
        data: {
          id: level.id, // 'recordar', 'comprender', etc.
          name: level.name,
          description: level.description,
          keywords: level.verbos, // verbos como keywords
          percentage: level.porcentaje,
          enabled: true, // Puedes ajustar esto si tienes lógica para enabled
        },
      });
      console.log(`  - Nivel insertado: ${level.name}`);
    }

    console.log('✅ Niveles de Bloom inicializados correctamente.');
  } catch (error) {
    console.error('❌ Error al inicializar niveles de Bloom:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initBloomLevels(); 