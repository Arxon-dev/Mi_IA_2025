import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Document } from '@prisma/client';

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      take: 5,
      orderBy: {
        createdat: 'desc'
      },
      select: {
        id: true,
        title: true,
        createdat: true,
        questioncount: true,
        type: true
      }
    });

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      createdAt: doc.createdat.toISOString(),
      questionCount: doc.questioncount
    }));

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    console.error('Error al obtener documentos recientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 