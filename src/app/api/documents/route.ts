import { NextResponse } from 'next/server';
import { PrismaService } from '@/services/prismaService';
import type { Document as PrismaDocument } from '@prisma/client';

export async function GET() {
  try {
    const documents = await PrismaService.getDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await PrismaService.deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return NextResponse.json(
      { error: 'Error al eliminar documento' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Especificar más detalladamente el tipo esperado del cuerpo de la solicitud para POST
    type DocumentCreatePayload = Partial<Omit<PrismaDocument, 'createdAt' | 'updatedAt' | 'id'>> & 
                                 { title: string, content: string, date: string, type: string, id?: string };
    const documentData: DocumentCreatePayload = await request.json();
    
    if (!documentData.title || !documentData.content || !documentData.date || !documentData.type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos en el documento (título, contenido, fecha, tipo)' },
        { status: 400 }
      );
    }

    let documentDate;
    try {
      documentDate = new Date(documentData.date);
      if (isNaN(documentDate.getTime())) throw new Error('Fecha inválida');
    } catch (error) {
      return NextResponse.json({ error: 'La fecha proporcionada no es válida' }, { status: 400 });
    }

    // Construir el objeto para PrismaService.saveDocument
    // El tipo de `PrismaService.saveDocument` es Omit<Document, 'createdAt' | 'updatedAt'> & { id?: string, sections?, questions? }
    // PrismaDocument tiene id como string (no opcional), pero para la creación en upsert, el id puede ser undefined para que se autogenere.
    const documentToSave: Omit<PrismaDocument, 'createdAt' | 'updatedAt'> = {
      id: documentData.id || require('cuid')(), // Generar CUID si no se provee, o pasar el existente si es un upsert a través de POST
      title: documentData.title.trim(),
      content: documentData.content,
      date: documentDate,
      type: documentData.type,
      questionCount: documentData.questionCount || 0,
      processingTime: documentData.processingTime === undefined ? null : documentData.processingTime,
      tokens: documentData.tokens === undefined ? null : documentData.tokens,
      // sections y questions no se manejan aquí, sino en PrismaService.saveDocument si es necesario
    };
    
    // Si documentData.id NO venía en el request, el id generado arriba es nuevo.
    // Si SÍ venía, estamos intentando un upsert con ese id.
    // La lógica de `PrismaService.saveDocument` con `upsert` se encargará.

    console.log('Intentando guardar documento (POST):', documentToSave);
    const savedDocument = await PrismaService.saveDocument(documentToSave);
    
    console.log('Documento guardado exitosamente (POST):', { id: savedDocument.id, title: savedDocument.title });
    return NextResponse.json(savedDocument);
  } catch (error: any) {
    console.error('Error detallado al guardar documento (POST):', { error, message: error.message });
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Conflicto: Ya existe un recurso con identificadores similares.' }, { status: 409 });
    }
    return NextResponse.json({ error: `Error al guardar documento: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const documentDataToUpdate: Partial<PrismaDocument> & { id: string } = await request.json();

    if (!documentDataToUpdate.id) {
      return NextResponse.json(
        { error: 'El ID del documento es requerido para actualizar' },
        { status: 400 }
      );
    }

    const { id, ...dataToUpdate } = documentDataToUpdate;

    if (dataToUpdate.date) {
      try {
        const newDate = new Date(dataToUpdate.date);
        if (isNaN(newDate.getTime())) {
          throw new Error('Fecha inválida para la actualización');
        }
        dataToUpdate.date = newDate;
      } catch (error: any) {
        console.error('Error al procesar la fecha en PUT:', error);
        return NextResponse.json(
          { error: 'La fecha proporcionada para la actualización no es válida' },
          { status: 400 }
        );
      }
    }
    
    if (typeof dataToUpdate.title === 'string') {
      dataToUpdate.title = dataToUpdate.title.trim();
    }

    const documentForSave: any = { id, ...dataToUpdate };

    const updatedDocument = await PrismaService.saveDocument(documentForSave);

    return NextResponse.json(updatedDocument);
  } catch (error: any) {
    console.error('Error en PUT /api/documents:', error);
    if (error.code === 'P2025') { 
      return NextResponse.json(
        { error: 'Documento no encontrado para actualizar' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Error al actualizar el documento' },
      { status: 500 }
    );
  }
} 