import { NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';
import fs from 'fs/promises';
import path from 'path';

// Importar los prompts estáticamente para tener los valores por defecto
import { expertPrompt } from '@/config/prompts/expertPrompt';
import { formatPrompt } from '@/config/prompts/formatPrompt';
import { difficultyPrompt } from '@/config/prompts/difficultyPrompt';
import { distractorsPrompt } from '@/config/prompts/distractorsPrompt';
import { documentationPrompt } from '@/config/prompts/documentationPrompt';
import { qualityPrompt } from '@/config/prompts/qualityPrompt';

const DEFAULT_PROMPTS = {
  expertPrompt: {
    name: 'Prompt de Experto',
    content: expertPrompt,
    file: 'expertPrompt'
  },
  formatPrompt: {
    name: 'Prompt de Formato',
    content: formatPrompt,
    file: 'formatPrompt'
  },
  difficultyPrompt: {
    name: 'Prompt de Dificultad',
    content: difficultyPrompt,
    file: 'difficultyPrompt'
  },
  distractorsPrompt: {
    name: 'Prompt de Distractores',
    content: distractorsPrompt,
    file: 'distractorsPrompt'
  },
  documentationPrompt: {
    name: 'Prompt de Documentación',
    content: documentationPrompt,
    file: 'documentationPrompt'
  },
  qualityPrompt: {
    name: 'Prompt de Calidad',
    content: qualityPrompt,
    file: 'qualityPrompt'
  }
};

// Función helper para normalizar nombres de archivos
function normalizeFileKey(file: string): string {
  // Remover extensión .ts
  let fileKey = file.replace('.ts', '');
  
  // Remover sufijos como _final, _v1, etc.
  fileKey = fileKey.replace(/_final$/, '').replace(/_v\d+$/, '');
  
  return fileKey;
}

export async function GET() {
  try {
    console.log('🔍 Obteniendo todos los prompts');
    const prompts = await PrismaService.getAllPrompts();
    console.log(`✅ ${prompts.length} prompts encontrados`);
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('❌ Error al obtener los prompts:', error);
    return NextResponse.json(
      { error: 'Error al obtener los prompts' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('🔧 PUT /api/prompts - Inicio del procesamiento');
    
    const body = await request.json();
    console.log('📝 Datos recibidos:', JSON.stringify(body, null, 2));
    
    const { file, content } = body;
    
    console.log('🔍 Validando datos:', {
      file: file ? `"${file}" (${typeof file})` : 'undefined/null',
      content: content ? `${content.length} caracteres` : 'undefined/null',
      contentType: typeof content
    });
    
    if (!file || !content) {
      console.log('❌ Validación fallida - datos faltantes:', {
        file: !file ? 'FALTANTE' : 'OK',
        content: !content ? 'FALTANTE' : 'OK'
      });
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Normalizar el nombre del archivo para buscar en DEFAULT_PROMPTS
    const fileKey = normalizeFileKey(file);
    console.log('🔧 Procesando file:', {
      original: file,
      normalized: fileKey,
      step1: file.replace('.ts', ''),
      step2: fileKey
    });

    // Verificar que el prompt existe en los predeterminados
    const defaultPrompt = DEFAULT_PROMPTS[fileKey as keyof typeof DEFAULT_PROMPTS];
    if (!defaultPrompt) {
      console.log('❌ Prompt no válido:', {
        file,
        fileKey,
        availablePrompts: Object.keys(DEFAULT_PROMPTS)
      });
      return NextResponse.json(
        { error: `Prompt no válido. Prompts disponibles: ${Object.keys(DEFAULT_PROMPTS).join(', ')}` },
        { status: 400 }
      );
    }

    console.log('✅ Prompt válido encontrado:', {
      originalFile: file,
      normalizedKey: fileKey,
      defaultFile: defaultPrompt.file,
      name: defaultPrompt.name
    });

    try {
      console.log('💾 Intentando guardar en la base de datos...');
      // Guardar en la base de datos usando el file original (el que viene del frontend)
      const updatedPrompt = await PrismaService.updatePrompt(file, {
        name: defaultPrompt.name,
        content,
        file
      });

      console.log('✅ Guardado en BD exitoso:', {
        id: updatedPrompt.id,
        file: updatedPrompt.file,
        name: updatedPrompt.name
      });

      // Actualizar el archivo físico usando fileKey normalizado (sin sufijos)
      console.log('📂 Intentando actualizar archivo físico...');
      const promptsDir = path.join(process.cwd(), 'src/config/prompts');
      const filePath = path.join(promptsDir, `${fileKey}.ts`);
      console.log('📍 Ruta del archivo:', filePath);
      
      await fs.writeFile(filePath, `export const ${fileKey} = \`${content}\`;\n`, 'utf-8');
      console.log('✅ Archivo físico actualizado');

      console.log('🎉 PUT /api/prompts - Completado exitosamente');
      return NextResponse.json(updatedPrompt);
    } catch (dbError) {
      console.error('❌ Error al guardar en la base de datos:', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        code: (dbError as any)?.code,
        meta: (dbError as any)?.meta
      });
      return NextResponse.json(
        { error: 'Error al guardar en la base de datos' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error al procesar la solicitud:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 