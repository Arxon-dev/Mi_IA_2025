import { NextRequest, NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const doc = await PrismaService.getDocumentById(id);
    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }
    return NextResponse.json(doc, { status: 200 });
  } catch (error) {
    console.error('Error al obtener documento:', error);
    return NextResponse.json({ error: 'Error interno al obtener el documento' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await PrismaService.deleteDocument(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 });
  }
} 