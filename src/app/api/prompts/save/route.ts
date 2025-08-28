import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const PROMPTS_DIR = path.join(process.cwd(), 'src/config/prompts');

// Importar los prompts estáticamente
import { expertPrompt } from '@/config/prompts/expertPrompt';
import { formatPrompt } from '@/config/prompts/formatPrompt';
import { difficultyPrompt } from '@/config/prompts/difficultyPrompt';
import { distractorsPrompt } from '@/config/prompts/distractorsPrompt';
import { documentationPrompt } from '@/config/prompts/documentationPrompt';
import { qualityPrompt } from '@/config/prompts/qualityPrompt';

const DEFAULT_PROMPTS = {
  expertPrompt,
  formatPrompt,
  difficultyPrompt,
  distractorsPrompt,
  documentationPrompt,
  qualityPrompt
};

const VALID_PROMPTS = Object.keys(DEFAULT_PROMPTS);

export async function POST(request: Request) {
  try {
    const { fileName, content } = await request.json();
    
    if (!fileName || !content) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Validar que el archivo está en la lista de prompts válidos
    if (!VALID_PROMPTS.includes(fileName)) {
      return NextResponse.json(
        { error: 'Nombre de archivo no permitido' },
        { status: 400 }
      );
    }

    const filePath = path.join(PROMPTS_DIR, `${fileName}.ts`);
    const fileContent = `export const ${fileName} = \`${content}\`;\n`;
    
    await fs.writeFile(filePath, fileContent, 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al guardar el prompt:', error);
    return NextResponse.json(
      { error: 'No se pudo guardar el prompt' },
      { status: 500 }
    );
  }
} 