import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/prismaService';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/ai-config/sync-question-config: Iniciando sincronización...');
    
    // Implementamos directamente la función que sabemos que funciona
    // en lugar de usar el método de clase
    try {
      // 1. Obtener configuración de IA
      const aiConfig = await prisma.aIConfig.findFirst();
      if (!aiConfig) {
        console.log('⚠️ No se encontró configuración de IA para sincronizar');
        return NextResponse.json(
          { success: false, message: 'No se encontró configuración de IA' },
          { status: 404 }
        );
      }
      
      console.log('✅ AIConfig encontrada:', {
        id: aiConfig.id,
        provider: aiConfig.provider,
        model: aiConfig.model
      });
      
      // 2. Obtener o crear configuración de preguntas
      let questionConfig = await prisma.questionConfig.findFirst();
      if (!questionConfig) {
        console.log('⚠️ No se encontró configuración de preguntas, creando una nueva');
        questionConfig = await prisma.questionConfig.create({
          data: {
            id: randomUUID(),
            types: {},
            difficulties: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log('✅ QuestionConfig creada con ID:', questionConfig.id);
      } else {
        console.log('✅ QuestionConfig encontrada:', {
          id: questionConfig.id
        });
      }
      
      // 3. Parsear y sincronizar questionTypes
      console.log('🔄 Sincronizando questionTypes');
      let questionTypes = null;
      try {
        questionTypes = aiConfig.questionTypes ? JSON.parse(aiConfig.questionTypes) : null;
      } catch (e) {
        console.error('❌ Error al parsear questionTypes:', e);
      }
      
      // 4. Parsear y sincronizar difficultyLevels
      console.log('🔄 Sincronizando difficultyLevels');
      let difficultyLevels = null;
      try {
        difficultyLevels = aiConfig.difficultyLevels ? JSON.parse(aiConfig.difficultyLevels) : null;
      } catch (e) {
        console.error('❌ Error al parsear difficultyLevels:', e);
      }
      
      // 5. Preparar actualización de configuración de preguntas
      const updateData: any = {
        updatedAt: new Date()
      };
      
      if (questionTypes) {
        // Ordenar las propiedades para garantizar consistencia
        const sortedQuestionTypes = {};
        Object.keys(questionTypes).sort().forEach(key => {
          sortedQuestionTypes[key] = questionTypes[key];
        });
        updateData.types = sortedQuestionTypes;
      }
      
      if (difficultyLevels) {
        // Ordenar las propiedades para garantizar consistencia
        const sortedDifficultyLevels = {};
        Object.keys(difficultyLevels).sort().forEach(key => {
          sortedDifficultyLevels[key] = difficultyLevels[key];
        });
        updateData.difficulties = sortedDifficultyLevels;
      }
      
      // 6. Actualizar configuración de preguntas
      console.log('🔄 Actualizando QuestionConfig con datos sincronizados...');
      if (Object.keys(updateData).length > 1) { // > 1 porque siempre tiene updatedAt
        await prisma.questionConfig.update({
          where: {
            id: questionConfig.id
          },
          data: updateData
        });
        console.log('✅ QuestionConfig actualizada correctamente');
      } else {
        console.log('⚠️ No hay datos válidos para actualizar QuestionConfig');
      }
      
      console.log('✅ POST /api/ai-config/sync-question-config: Sincronización completada exitosamente');
      return NextResponse.json({ success: true, message: 'Configuración sincronizada correctamente' });
    } catch (syncError) {
      console.error('❌ Error durante la sincronización:', syncError);
      return NextResponse.json(
        { success: false, message: 'Error durante la sincronización', error: syncError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ POST /api/ai-config/sync-question-config: Error general:', error);
    return NextResponse.json(
      { success: false, message: 'Error al sincronizar configuración', error: error.message },
      { status: 500 }
    );
  }
} 