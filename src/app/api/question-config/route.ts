import { NextRequest, NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';

// GET /api/question-config
export async function GET() {
  try {
    const config = await PrismaService.getQuestionConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error al obtener QuestionConfig:', error);
    return NextResponse.json({ error: 'Error al obtener configuración de preguntas' }, { status: 500 });
  }
}

// PUT /api/question-config
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Mapeo de nombres del frontend a los del modelo Prisma
    const prismaData: any = {
      types: data.questionTypes ? JSON.stringify(data.questionTypes) : undefined,
      difficulties: data.difficultyLevels ? JSON.stringify(data.difficultyLevels) : undefined,
      bloomlevels: data.bloomLevels ? JSON.stringify(data.bloomLevels) : undefined,
      optionlength: data.optionLength ? JSON.stringify(data.optionLength) : undefined,
      updatedat: new Date(),
    };
    Object.keys(prismaData).forEach(key => prismaData[key] === undefined && delete prismaData[key]);

    const updated = await PrismaService.saveQuestionConfig(prismaData);

    // Sincronizar con AIConfig si hay cambios en questionTypes o difficultyLevels
    if (data.questionTypes || data.difficultyLevels) {
      try {
        console.log('🔄 PUT /api/question-config: Sincronizando con AIConfig...');
        
        // Obtener la configuración de IA actual
        const aiConfig = await PrismaService.getAIConfig();
        
        if (aiConfig) {
          const updates: any = {};
          
          // Actualizar solo si hay cambios
          if (data.questionTypes) {
            updates.questionTypes = data.questionTypes;
          }
          
          if (data.difficultyLevels) {
            updates.difficultyLevels = data.difficultyLevels;
          }
          
          // Guardar los cambios en AIConfig
          if (Object.keys(updates).length > 0) {
            await PrismaService.saveAIConfig({
              ...aiConfig,
              ...updates
            });
            console.log('✅ PUT /api/question-config: AIConfig actualizada correctamente');
          }
        }
      } catch (syncError) {
        console.error('⚠️ PUT /api/question-config: Error al sincronizar con AIConfig:', syncError);
        // No fallamos la operación principal si la sincronización falla
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error al guardar QuestionConfig:', error);
    return NextResponse.json({ error: 'Error al guardar configuración de preguntas' }, { status: 500 });
  }
} 