import { NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';

// Importar los prompts estáticamente
import { expertPrompt } from '@/config/prompts/expertPrompt';
import { formatPrompt } from '@/config/prompts/formatPrompt';
import { difficultyPrompt } from '@/config/prompts/difficultyPrompt';
import { distractorsPrompt } from '@/config/prompts/distractorsPrompt';
import { documentationPrompt } from '@/config/prompts/documentationPrompt';
import { qualityPrompt } from '@/config/prompts/qualityPrompt';

const DEFAULT_PROMPTS = [
  {
    name: 'Prompt de Experto',
    content: expertPrompt,
    file: 'expertPrompt'
  },
  {
    name: 'Prompt de Formato',
    content: formatPrompt,
    file: 'formatPrompt'
  },
  {
    name: 'Prompt de Dificultad',
    content: difficultyPrompt,
    file: 'difficultyPrompt'
  },
  {
    name: 'Prompt de Distractores',
    content: distractorsPrompt,
    file: 'distractorsPrompt'
  },
  {
    name: 'Prompt de Documentación',
    content: documentationPrompt,
    file: 'documentationPrompt'
  },
  {
    name: 'Prompt de Calidad',
    content: qualityPrompt,
    file: 'qualityPrompt'
  }
];

export async function POST() {
  try {
    console.log('🔄 Inicializando prompts por defecto...');
    
    const results = [];
    const errors = [];

    // Guardar cada prompt en la base de datos de forma secuencial
    for (const prompt of DEFAULT_PROMPTS) {
      try {
        console.log(`⏳ Procesando prompt: ${prompt.file}`);
        const savedPrompt = await PrismaService.updatePrompt(prompt.file, prompt);
        console.log(`✅ Prompt ${prompt.file} guardado correctamente:`, {
          id: savedPrompt.id,
          name: savedPrompt.name
        });
        results.push(savedPrompt);
      } catch (error) {
        console.error(`❌ Error al guardar el prompt ${prompt.file}:`, error);
        errors.push({
          file: prompt.file,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    if (errors.length > 0) {
      console.warn('⚠️ Algunos prompts no pudieron ser guardados:', errors);
      return NextResponse.json(
        { 
          warning: 'Algunos prompts no pudieron ser guardados',
          errors,
          successfulPrompts: results 
        },
        { status: 207 }
      );
    }

    console.log('✅ Todos los prompts han sido inicializados correctamente');
    return NextResponse.json({ 
      success: true, 
      prompts: results,
      message: 'Todos los prompts han sido inicializados correctamente'
    });
  } catch (error) {
    console.error('❌ Error crítico al inicializar los prompts:', error);
    return NextResponse.json(
      { 
        error: 'No se pudieron inicializar los prompts',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 