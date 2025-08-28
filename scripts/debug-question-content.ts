#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Examinando estructura de preguntas...');
  
  const samples = await prisma.question.findMany({
    take: 5,
    select: {
      id: true,
      content: true,
      type: true,
      difficulty: true
    }
  });
  
  console.log(`\n📊 Total de preguntas en la tabla: ${await prisma.question.count()}`);
  console.log('\n📋 Ejemplos de contenido:');
  
  samples.forEach((q, i) => {
    console.log(`\n--- Pregunta ${i + 1} ---`);
    console.log('ID:', q.id);
    console.log('Type:', q.type);
    console.log('Difficulty:', q.difficulty);
    console.log('Content Length:', q.content.length);
    console.log('Content (primeros 300 chars):');
    console.log(q.content.substring(0, 300));
    console.log('...');
    
    // Intentar parsear JSON
    try {
      const parsed = JSON.parse(q.content);
      console.log('✅ JSON válido. Estructura:');
      console.log('  - Claves:', Object.keys(parsed));
      if (parsed.question) console.log('  - Pregunta:', parsed.question.substring(0, 100) + '...');
      if (parsed.options) console.log('  - Opciones:', parsed.options.length);
    } catch (error) {
      console.log('❌ JSON inválido. Error:', error instanceof Error ? error.message : 'Unknown error');
    }
  });
  
  await prisma.$disconnect();
}

main().catch(console.error); 