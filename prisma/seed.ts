const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Asegúrate de que estos datos coincidan con tu modelo BloomLevel en schema.prisma,
// especialmente los campos 'keywords', 'percentage', y 'enabled'.
const defaultBloomLevelsData = [
  { name: 'Recordar', description: 'Reconocer y recordar información específica', keywords: ['definir', 'identificar', 'listar', 'nombrar', 'reconocer', 'recordar', 'repetir'], percentage: 10, enabled: true },
  { name: 'Comprender', description: 'Entender e interpretar información', keywords: ['clasificar', 'describir', 'explicar', 'identificar', 'interpretar', 'parafrasear', 'resumir'], percentage: 15, enabled: true },
  { name: 'Aplicar', description: 'Usar la información en situaciones nuevas', keywords: ['aplicar', 'calcular', 'demostrar', 'implementar', 'resolver', 'usar', 'utilizar'], percentage: 25, enabled: true },
  { name: 'Analizar', description: 'Examinar y descomponer información', keywords: ['analizar', 'comparar', 'contrastar', 'diferenciar', 'distinguir', 'examinar', 'relacionar'], percentage: 25, enabled: true },
  { name: 'Evaluar', description: 'Juzgar el valor de la información', keywords: ['argumentar', 'concluir', 'criticar', 'decidir', 'evaluar', 'justificar', 'valorar'], percentage: 15, enabled: true },
  { name: 'Crear', description: 'Generar nuevas ideas o perspectivas', keywords: ['construir', 'crear', 'desarrollar', 'diseñar', 'formular', 'planificar', 'proponer'], percentage: 10, enabled: true },
];

async function main() {
  console.log(`Start seeding BloomLevel table...`);
  for (const levelData of defaultBloomLevelsData) {
    const level = await prisma.bloomLevel.upsert({
      where: { name: levelData.name }, // Esto AHORA debería funcionar después de añadir @unique a name y regenerar cliente
      update: {
        description: levelData.description,
        keywords: levelData.keywords,
        percentage: levelData.percentage,
        enabled: levelData.enabled, // Corregido a 'enabled'
      },
      create: {
        name: levelData.name,
        description: levelData.description,
        keywords: levelData.keywords,
        percentage: levelData.percentage,
        enabled: levelData.enabled, // Corregido a 'enabled'
      },
    });
    console.log(`Created/updated BloomLevel with id: ${level.id} (Name: ${level.name})`);
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });