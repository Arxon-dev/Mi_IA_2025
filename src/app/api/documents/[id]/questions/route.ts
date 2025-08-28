import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/prisma-retry';

// GET /api/documents/[id]/questions
// Obtiene preguntas para un documento específico con paginación y filtros
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const documentId = params.id;
  const url = new URL(request.url);

  // Parámetros de paginación
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const showArchived = url.searchParams.get('showArchived') === 'true';
  const searchTerm = url.searchParams.get('search') || '';

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    // Construir filtros - usando nombres de campos en minúsculas para MySQL
    const whereClause: any = {
      documentid: documentId, // Cambiado de documentId a documentid
    };

    // Solo mostrar archivadas si se solicita explícitamente
    if (!showArchived) {
      whereClause.archived = false;
    }

    // Filtro de búsqueda por contenido
    if (searchTerm) {
      whereClause.content = {
        contains: searchTerm,
        mode: 'insensitive'
      };
    }

    // Obtener preguntas con paginación
    const questions = await withRetry(async () => {
      return await prisma.question.findMany({
        where: whereClause,
        orderBy: { createdat: 'desc' }, // Cambiado de createdAt a createdat
        skip: (page - 1) * limit,
        take: limit,
      });
    }, 3, `getQuestions(${documentId})`);

    // Obtener conteos totales
    const totalQuestions = await withRetry(async () => {
      return await prisma.question.count({
        where: whereClause,
      });
    }, 3, `countQuestions(${documentId})`);

    // Obtener conteos por estado
    const archivedCount = await withRetry(async () => {
      return await prisma.question.count({
        where: {
          documentid: documentId, // Cambiado de documentId a documentid
          archived: true,
        },
      });
    }, 3, `countArchivedQuestions(${documentId})`);

    const activeCount = await withRetry(async () => {
      return await prisma.question.count({
        where: {
          documentid: documentId, // Cambiado de documentId a documentid
          archived: false,
        },
      });
    }, 3, `countActiveQuestions(${documentId})`);

    // Calcular información de paginación
    const totalPages = Math.ceil(totalQuestions / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      questions,
      pagination: {
        currentPage: page,
        totalPages,
        totalQuestions,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
      counts: {
        total: totalQuestions,
        active: activeCount,
        archived: archivedCount,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching questions for doc', documentId, ':', error);
    return NextResponse.json(
      { error: 'Error fetching questions' },
      { status: 500 }
    );
  }
}

// POST /api/documents/[id]/questions
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const documentId = params.id;

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { content, type, difficulty, bloomlevel, sectionid } = body;

    if (!content || !type) {
      return NextResponse.json(
        { error: 'Content and type are required' },
        { status: 400 }
      );
    }

    // Generar ID único
    const questionid = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const question = await prisma.question.create({
      data: {
        id: questionid,
        documentid: documentId, // Cambiado de documentId a documentid
        content,
        type,
        difficulty: difficulty || 'medium',
        bloomlevel: bloomlevel || null,
        sectionid: sectionid || null,
        archived: false,
        sendcount: 0,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating question for doc', documentId, ':', error);
    return NextResponse.json(
      { error: 'Error creating question' },
      { status: 500 }
    );
  }
} 