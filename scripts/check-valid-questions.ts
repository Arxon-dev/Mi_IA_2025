#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkValidQuestions() {
  try {
    const count = await prisma.validQuestion.count();
    console.log('📊 Preguntas en ValidQuestion:', count);
    
    if (count > 0) {
      const sample = await prisma.validQuestion.findFirst({
        select: { 
          id: true, 
          parsedQuestion: true, 
          parseMethod: true, 
          createdAt: true 
        }
      });
      console.log('📋 Ejemplo de pregunta migrada:', sample);
    } else {
      console.log('✅ La tabla ValidQuestion está vacía - no se han hecho migraciones reales aún');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkValidQuestions(); 