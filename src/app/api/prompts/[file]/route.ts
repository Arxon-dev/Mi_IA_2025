import { NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';
import { promises as fs } from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'src/config/prompts');

export async function GET(
  request: Request,
  { params }: { params: { file: string } }
) {
  try {
    console.log(`🔍 Buscando prompt: ${params.file}`);
    
    // Primero intentar obtener de la base de datos
    const dbPrompt = await PrismaService.getPrompt(params.file);
    if (dbPrompt) {
      console.log(`✅ Prompt encontrado en BD: ${dbPrompt.name}`);
      return NextResponse.json(dbPrompt);
    }

    // Si no está en la BD, intentar leer del archivo
    try {
      const filePath = path.join(PROMPTS_DIR, `${params.file}.ts`);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const match = content.match(/export const \w+ = \`([\s\S]*)\`;/);
      if (!match) {
        console.log(`❌ Formato inválido en archivo: ${params.file}`);
        return NextResponse.json(
          { error: 'Formato de prompt inválido' },
          { status: 400 }
        );
      }

      console.log(`✅ Prompt encontrado en archivo: ${params.file}`);
      return NextResponse.json({
        name: params.file.replace('Prompt', ''),
        content: match[1],
        file: params.file
      });
    } catch (fileError) {
      console.error(`❌ Error al leer archivo de prompt ${params.file}:`, fileError);
    }

    console.log(`❌ No se encontró el prompt: ${params.file}`);
    return NextResponse.json(
      { error: 'Prompt no encontrado' },
      { status: 404 }
    );
  } catch (error) {
    console.error(`❌ Error al obtener el prompt ${params.file}:`, error);
    return NextResponse.json(
      { error: 'Error al obtener el prompt' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { file: string } }
) {
  try {
    const data = await request.json();
    console.log(`📝 Actualizando prompt: ${params.file}`, data);

    // Guardar en la base de datos
    const prompt = await PrismaService.updatePrompt(params.file, {
      name: data.name,
      content: data.content,
      file: params.file
    });

    // Actualizar el archivo físico
    try {
      const filePath = path.join(PROMPTS_DIR, `${params.file}.ts`);
      await fs.writeFile(filePath, `export const ${params.file} = \`${data.content}\`;\n`, 'utf-8');
      console.log(`✅ Archivo actualizado: ${params.file}`);
    } catch (fileError) {
      console.error(`⚠️ Error al actualizar archivo ${params.file}:`, fileError);
      // No fallamos si el archivo no se puede actualizar, solo lo registramos
    }

    console.log(`✅ Prompt actualizado: ${prompt.name}`);
    return NextResponse.json(prompt);
  } catch (error) {
    console.error(`❌ Error al actualizar el prompt ${params.file}:`, error);
    return NextResponse.json(
      { error: 'Error al actualizar el prompt' },
      { status: 500 }
    );
  }
} 