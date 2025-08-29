import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const { searchParams } = new URL(request.url);
    
    // Parámetros de consulta
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const showArchived = searchParams.get('showArchived') === 'true';
    const difficulty = searchParams.get('difficulty');
    const bloomLevel = searchParams.get('bloomLevel');
    const search = searchParams.get('search');

    console.log(`🔍 [API /sections/${sectionId}/questions] Parámetros:`, {
      sectionId,
      page,
      limit,
      showArchived,
      difficulty,
      bloomLevel,
      search
    });

    // Verificar que la sección existe
    const section = await prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      console.log(`❌ [API /sections/${sectionId}/questions] Sección no encontrada`);
      return NextResponse.json(
        { error: 'Sección no encontrada' },
        { status: 404 }
      );
    }

    // Construir filtros
    const where: any = {
      sectionId: sectionId,
      isactive: true,  // 🆕 SOLO mostrar preguntas activas (mantiene historial en BD)
    };

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (bloomLevel) {
      where.bloomLevel = bloomLevel;
    }

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Obtener preguntas con paginación
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      prisma.sectionquestion.findMany({
        where,
        orderBy: [
          { createdat: 'desc' }
        ],
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          type: true,
          difficulty: true,
          bloomlevel: true,
          createdat: true,
          sectionid: true,
          isactive: true, // 🔧 FIX: Incluir isActive en la selección para debugging
          lastscheduledsendat: true
        }
      }),
      prisma.sectionquestion.count({ where })
    ]);

    // Obtener conteos adicionales
    const totalSectionQuestions = total;

    const activeCount = totalSectionQuestions;
    const archivedCount = 0;

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    const response = {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      },
      counts: {
        active: activeCount,
        archived: archivedCount,
        total: activeCount + archivedCount
      },
      section: {
        id: section.id,
        title: section.title
      }
    };

    console.log(`✅ [API /sections/${sectionId}/questions] Devolviendo ${questions.length} preguntas`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ [API /sections/${params.sectionId}/questions] Error:`, error);
    
    // Manejo específico para errores de conexión de base de datos
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      return NextResponse.json(
        { 
          error: 'Base de datos temporalmente no disponible',
          details: 'La base de datos de Supabase puede estar pausada. Por favor, verifica tu panel de Supabase.',
          questions: [],
          totalCount: 0,
          activeCount: 0,
          archivedCount: 0
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener preguntas de la sección' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;
    const body = await request.json();

    console.log(`📝 [API POST /sections/${sectionId}/questions] Creando preguntas para sección`);

    // Verificar que la sección existe
    const section = await prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      console.log(`❌ [API POST /sections/${sectionId}/questions] Sección no encontrada`);
      return NextResponse.json(
        { error: 'Sección no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si el body es un array (múltiples preguntas) o un objeto (una pregunta)
    const questionsData = Array.isArray(body) ? body : [body];

    console.log(`📝 [API POST /sections/${sectionId}/questions] Creando ${questionsData.length} pregunta(s)`);

    // Función para generar ID único
    const generateUniqueId = (): string => {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    // Preparar datos para inserción masiva
    const questionsToCreate = questionsData.map((questionData: any) => ({
      id: generateUniqueId(), // 🔧 FIX: Agregar ID único requerido por el modelo
      content: questionData.content,
      type: questionData.type || 'gift',
      difficulty: questionData.difficulty || 'medium',
      bloomlevel: questionData.bloomLevel || null,
      sectionid: sectionId,
      isactive: questionData.isactive !== undefined ? questionData.isactive : true, // 🔧 FIX: Asegurar que isActive se establece explícitamente
      lastscheduledsendat: questionData.lastScheduledSendAt || null
    }));

    // Crear preguntas en batch
    // const createdQuestions = await prisma.question.createMany({
    //   data: questionsToCreate,
    //   skipDuplicates: true
    // });

    // console.log(`✅ [API POST /sections/${sectionId}/questions] ${createdQuestions.count} pregunta(s) creada(s) exitosamente`);

    // Responder con el número de preguntas creadas
    // return NextResponse.json({
    //   success: true,
    //   created: createdQuestions.count,
    //   message: `${createdQuestions.count} pregunta(s) creada(s) exitosamente en la sección`
    // }, { status: 201 });

    const createdQuestionsList: any[] = [];

    for (const questionPayload of questionsToCreate) {
      try {
        const createdQuestion = await prisma.sectionquestion.create({
          data: questionPayload,
        });
        createdQuestionsList.push(createdQuestion);
      } catch (error: any) {
        // P2002 es el código de error de Prisma para violación de restricción única
        // Asumimos que podrías tener una restricción única en (sectionId, content) o similar
        if (error.code === 'P2002') { 
          console.warn(`[API POST /sections/${sectionId}/questions] Pregunta duplicada omitida (basado en constraint): ${questionPayload.content.substring(0,50)}...`);
        } else {
          console.error(`[API POST /sections/${sectionId}/questions] Error creando una pregunta específica:`, error);
          // Considerar si se debe continuar o devolver un error parcial/total aquí.
          // Por ahora, se omite la pregunta fallida y se continúa.
        }
      }
    }

    console.log(`✅ [API POST /sections/${sectionId}/questions] ${createdQuestionsList.length} pregunta(s) realmente creada(s) exitosamente`);
    console.log(`[API POST /sections/${sectionId}/questions] Contenido de createdQuestionsList:`, JSON.stringify(createdQuestionsList, null, 2));

    // Responder con las preguntas creadas (incluyendo sus IDs)
    return NextResponse.json({
      success: true,
      createdCount: createdQuestionsList.length,
      questions: createdQuestionsList, // Devolver la lista completa de preguntas creadas
      message: `${createdQuestionsList.length} pregunta(s) creada(s) exitosamente en la sección`
    }, { status: 201 });

  } catch (error) {
    console.error(`❌ [API POST /sections/${params.sectionId}/questions] Error:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor al crear preguntas de la sección' },
      { status: 500 }
    );
  }
}