import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/documents/[id]/questions/archive
// Archiva o desarchiva preguntas en lote
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const documentId = params.id;

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    const { questionIds, archived, archiveAll } = await request.json();

    let result;

    if (archiveAll) {
      // Archivar todas las preguntas activas del documento
      result = await prisma.question.updateMany({
        where: {
          documentId: documentId,
          archived: false
        },
        data: {
          archived: true
        }
      });
      console.log(`[API] Archived all ${result.count} active questions for doc ${documentId}.`);
    } else if (questionIds && Array.isArray(questionIds)) {
      // Archivar/desarchivar preguntas específicas por ID
      result = await prisma.question.updateMany({
        where: {
          documentId: documentId,
          id: { in: questionIds }
        },
        data: {
          archived: archived
        }
      });
      console.log(`[API] Updated archived status to ${archived} for ${result.count} questions in doc ${documentId}.`);
    } else {
      return NextResponse.json({ error: 'Either questionIds array or archiveAll flag is required' }, { status: 400 });
    }

    // Obtener contadores actualizados
    const activeCount = await prisma.question.count({
      where: { documentId, archived: false }
    });

    const archivedCount = await prisma.question.count({
      where: { documentId, archived: true }
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      counts: {
        active: activeCount,
        archived: archivedCount,
        total: activeCount + archivedCount
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[API] Error archiving questions for doc ${documentId}:`, error);
    return NextResponse.json({ error: 'Failed to archive questions' }, { status: 500 });
  }
}

// PUT /api/documents/[id]/questions/archive
// Restaurar todas las preguntas archivadas
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const documentId = params.id;

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    // Desarchivar todas las preguntas del documento
    const result = await prisma.question.updateMany({
      where: {
        documentId: documentId,
        archived: true
      },
      data: {
        archived: false
      }
    });

    console.log(`[API] Restored ${result.count} archived questions for doc ${documentId}.`);

    // Obtener contadores actualizados
    const activeCount = await prisma.question.count({
      where: { documentId, archived: false }
    });

    const archivedCount = await prisma.question.count({
      where: { documentId, archived: true }
    });

    return NextResponse.json({
      success: true,
      restored: result.count,
      counts: {
        active: activeCount,
        archived: archivedCount,
        total: activeCount + archivedCount
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[API] Error restoring questions for doc ${documentId}:`, error);
    return NextResponse.json({ error: 'Failed to restore questions' }, { status: 500 });
  }
} 