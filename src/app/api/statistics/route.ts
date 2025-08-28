import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Obtener todos los documentos con los campos necesarios
    const documents = await prisma.document.findMany({
      select: {
        questioncount: true
      }
    });

    // Calcular estadísticas
    const stats = {
      totalDocuments: documents.length,
      totalquestions: documents.reduce((sum, doc) => sum + (doc.questioncount || 0), 0),
      totalTokens: 0, // Por ahora dejamos esto en 0 hasta que implementemos el tracking de tokens
      averageProcessingTime: 0 // Por ahora dejamos esto en 0 hasta que implementemos el tracking de tiempo
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
} 