import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Lista de todas las tablas específicas de preguntas
const QUESTION_TABLES = [
  'constitucion', 'defensanacional', 'rio', 'minisdef', 'organizacionfas',
  'emad', 'et', 'armada', 'aire', 'carrera', 'tropa', 'rroo',
  'derechosydeberes', 'regimendisciplinario', 'iniciativasyquejas',
  'igualdad', 'omi', 'pac', 'seguridadnacional', 'pdc', 'onu', 'otan',
  'osce', 'ue', 'misionesinternacionales'
];

// GET - Obtener una pregunta específica (INTELIGENTE - detecta tabla automáticamente)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let question: any = null;
    let tableSource = '';

    // 🎯 DETECCIÓN INTELIGENTE: Buscar en qué tabla está la pregunta
    try {
      // 2. Buscar en Question
      const questionRecord = await prisma.question.findUnique({
        where: { id: params.id }
      });

      if (questionRecord) {
        // Obtener título del documento por separado
        let documentTitle: string | null = null;
        if (questionRecord.documentid) {
          const documentRecord = await prisma.document.findUnique({
            where: { id: questionRecord.documentid },
            select: { title: true }
          });
          documentTitle = documentRecord?.title ?? null;
        }

        question = {
          id: questionRecord.id,
          parsedquestion: questionRecord.content,
          questionText: questionRecord.content,
          content: questionRecord.content,
          type: questionRecord.type,
          difficulty: questionRecord.difficulty,
          isactive: !questionRecord.archived,
          documentTitle: documentTitle,
          parsedOptions: [], // Campos vacíos para preguntas básicas
          correctanswerindex: null,
          parsedexplanation: null,
          bloomlevel: null
        };
        tableSource = 'Question';
      }
    } catch (error) {
      console.log('No encontrado en Question, buscando en SectionQuestion...');
    }

    if (!question) {
      try {
        // 3. Buscar en SectionQuestion
        const sectionQuestion = await prisma.sectionquestion.findUnique({
          where: { id: params.id }
        });

        if (sectionQuestion) {
          question = {
            id: sectionQuestion.id,
            parsedquestion: sectionQuestion.content,
            questionText: sectionQuestion.content,
            content: sectionQuestion.content,
            type: sectionQuestion.type,
            difficulty: sectionQuestion.difficulty,
            isactive: true, // SectionQuestion no tiene campo archived
            documentTitle: null, // No hay relación con document
            sectionTitle: null, // No hay relación con section
            parsedOptions: [], // Campos vacíos para preguntas básicas
            correctanswerindex: null,
            parsedexplanation: null,
            bloomlevel: null
          };
          tableSource = 'SectionQuestion';
        }
      } catch (error) {
        console.log('No encontrado en SectionQuestion');
      }
    }

    // 🔥 NUEVO: Buscar en todas las tablas específicas (Pdc, Constitucion, etc.)
    if (!question) {
      for (const tableName of QUESTION_TABLES) {
        try {
          const record = await (prisma as any)[tableName].findUnique({
            where: { id: params.id }
          });

          if (record) {
            // Reconstruir formato GIFT completo si existe
            let giftContent = '';
            if (record.title && record.question) {
              giftContent = `${record.title}\n${record.question}`;
              
              if (record.options && Array.isArray(record.options)) {
                giftContent += ' {\n';
                record.options.forEach((option: string, index: number) => {
                  const prefix = index === record.correctanswerindex ? '=' : '~';
                  giftContent += `${prefix}${option}\n`;
                });
                giftContent += '}';
              }
            }

            // 🔥 DEBUG - Ver qué datos tenemos
            console.log(`🔍 DEBUG [GET] - Encontrado en tabla ${tableName}:`, {
              id: record.id,
              question: record.question?.substring(0, 100) + '...',
              title: record.title,
              hasCompleteGift: record.question?.includes('####')
            });

            question = {
              id: record.id,
              parsedquestion: record.question || record.content || '', // Para el backend
              questionText: record.question || record.content || '', // 🔥 CONTENIDO GIFT COMPLETO para el frontend
              content: record.question || record.content || '', // Contenido original
              type: record.type || 'gift',
              difficulty: record.difficulty,
              isactive: record.isactive !== false, 
              parsedOptions: record.options || [],
              correctanswerindex: record.correctanswerindex,
              parsedexplanation: record.explanation || null,
              bloomlevel: record.bloomlevel || null,
              // Campos específicos de metadatos
              title: record.title || null,
              titleQuestionNumber: record.titleQuestionNumber || null,
              titleSourceDocument: record.titleSourceDocument || null,
              titleSourceReference: record.titleSourceReference || null,
              titleRawMetadata: record.titleRawMetadata || null
            };
            tableSource = tableName.charAt(0).toUpperCase() + tableName.slice(1);
            break;
          }
        } catch (error) {
          // Continuar con la siguiente tabla
        }
      }
    }

    if (!question) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada en ninguna tabla' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...question,
      source: tableSource
    });

  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una pregunta (INTELIGENTE - detecta tabla automáticamente)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { 
      parsedQuestion, // 🔧 FIX: Cambiar de parsedquestion a parsedQuestion para coincidir con frontend
      parsedOptions, 
      correctanswerindex, 
      parsedExplanation, // 🔧 FIX: Cambiar de parsedexplanation a parsedExplanation
      type,
      difficulty,
      bloomLevel, // 🔧 FIX: Cambiar de bloomlevel a bloomLevel
      isActive, // 🔧 FIX: Cambiar de isactive a isActive
      // Nuevos campos de metadatos
      title,
      titleQuestionNumber,
      titleSourceDocument,
      titleSourceReference,
      titleRawMetadata
    } = body;

    // Validaciones básicas
    if (!parsedQuestion || parsedQuestion.trim().length === 0) {
      return NextResponse.json(
        { error: 'La pregunta es requerida' },
        { status: 400 }
      );
    }

    if (parsedQuestion.length > 300) {
      return NextResponse.json(
        { error: 'La pregunta no puede superar 300 caracteres' },
        { status: 400 }
      );
    }

    if (!Array.isArray(parsedOptions) || parsedOptions.length < 2) {
      return NextResponse.json(
        { error: 'Datos de pregunta inválidos' },
        { status: 400 }
      );
    }

    if (correctanswerindex < 0 || correctanswerindex >= parsedOptions.length) {
      return NextResponse.json(
        { error: 'Índice de respuesta correcta inválido' },
        { status: 400 }
      );
    }

    // Validar límites de Telegram
    for (let i = 0; i < parsedOptions.length; i++) {
      if (parsedOptions[i].length > 150) {
        return NextResponse.json(
          { error: `La opción ${i + 1} no puede superar 150 caracteres` },
          { status: 400 }
        );
      }
    }

    // 🎯 DETECCIÓN INTELIGENTE: Buscar en qué tabla está la pregunta
    let updatedQuestion: any = null;
    let tableSource = '';
    let wasPromoted = false;

    try {
      // 1. Intentar ValidQuestion primero
      const validQuestion = await prisma.validquestion.findUnique({
        where: { id: params.id }
      });

      if (validQuestion) {
        updatedQuestion = await prisma.validquestion.update({
          where: { id: params.id },
          data: {
            parsedquestion: parsedQuestion,
            parsedoptions: JSON.stringify(parsedOptions),
            correctanswerindex,
            parsedexplanation: parsedExplanation,
            type,
            difficulty,
            bloomlevel: bloomLevel,
            isactive: isActive
          }
        });
        tableSource = 'ValidQuestion';
      }
    } catch (error) {
      // Si falla ValidQuestion, continuar con otras tablas
      console.log('No encontrado en ValidQuestion, buscando en otras tablas...');
    }

    if (!updatedQuestion) {
      try {
        // 2. Buscar en Question
        const question = await prisma.question.findUnique({
          where: { id: params.id }
        });

        if (question) {
          // 🚀 PROMOCIÓN AUTOMÁTICA: Si tiene opciones completas, promover a ValidQuestion
          if (parsedOptions && parsedOptions.length > 0 && correctanswerindex !== null) {
            console.log('📈 Promoviendo pregunta de Question a ValidQuestion...');
            
            // Crear en ValidQuestion
            updatedQuestion = await prisma.validquestion.create({
              data: {
                id: params.id, // Mantener el mismo ID
                originalquestionid: question.id,
                content: question.content,
                parsedquestion: parsedQuestion,
                parsedoptions: JSON.stringify(parsedOptions),
                correctanswerindex,
                parsedexplanation: parsedExplanation,
                parsemethod: 'manual_edit',
                type,
                difficulty,
                bloomlevel: bloomLevel || null,
                documentid: question.documentid,
                sendcount: 0,
                isactive: isActive,
                updatedat: new Date()
              }
            });

            // Eliminar de Question original
            await prisma.question.delete({
              where: { id: params.id }
            });

            tableSource = 'ValidQuestion';
            wasPromoted = true;
          } else {
            // Solo actualizar campos básicos en Question
            updatedQuestion = await prisma.question.update({
              where: { id: params.id },
              data: {
                content: parsedQuestion,
                type,
                difficulty,
                archived: !isActive
              }
            });
            tableSource = 'Question';
          }
        }
      } catch (error) {
        console.log('No encontrado en Question, buscando en SectionQuestion...');
      }
    }

    if (!updatedQuestion) {
      try {
        // 3. Buscar en SectionQuestion
        const sectionQuestion = await prisma.sectionquestion.findUnique({
          where: { id: params.id }
        });

        if (sectionQuestion) {
          // 🚀 PROMOCIÓN AUTOMÁTICA: Si tiene opciones completas, promover a ValidQuestion
          if (parsedOptions && parsedOptions.length > 0 && correctanswerindex !== null) {
            console.log('📈 Promoviendo pregunta de SectionQuestion a ValidQuestion...');
            
            // Crear en ValidQuestion
            updatedQuestion = await prisma.validquestion.create({
              data: {
                id: params.id, // Mantener el mismo ID
                originalquestionid: sectionQuestion.id,
                content: sectionQuestion.content,
                parsedquestion: parsedQuestion,
                parsedoptions: JSON.stringify(parsedOptions),
                correctanswerindex,
                parsedexplanation: parsedExplanation,
                parsemethod: 'manual_edit',
                type,
                difficulty,
                bloomlevel: bloomLevel || null,
                documentid: null, // SectionQuestion puede no tener documentId directo
                sendcount: 0,
                isactive: isActive,
                updatedat: new Date()
              }
            });

            // Eliminar de SectionQuestion original
            await prisma.sectionquestion.delete({
              where: { id: params.id }
            });

            tableSource = 'ValidQuestion';
            wasPromoted = true;
          } else {
            // Solo actualizar campos básicos en SectionQuestion
            updatedQuestion = await prisma.sectionquestion.update({
              where: { id: params.id },
              data: {
                content: parsedQuestion,
                type,
                difficulty
              }
            });
            tableSource = 'SectionQuestion';
          }
        }
      } catch (error) {
        console.log('No encontrado en SectionQuestion');
      }
    }

    // 🔥 NUEVO: Buscar y actualizar en tablas específicas (Pdc, Constitucion, etc.)
    if (!updatedQuestion) {
      for (const tableName of QUESTION_TABLES) {
        try {
          const record = await (prisma as any)[tableName].findUnique({
            where: { id: params.id }
          });

          if (record) {
            console.log(`✅ Encontrado en tabla ${tableName}, actualizando...`);
            console.log(`🔍 DEBUG [PUT] - Datos recibidos:`, {
              parsedQuestion: parsedQuestion?.substring(0, 100) + '...',
              title,
              optionsCount: parsedOptions?.length || 0,
              correctanswerindex
            });
            
            // Preparar datos para actualización
            const updateData: any = {
              question: parsedQuestion,
              options: JSON.stringify(parsedOptions), // 🔧 Convertir array a JSON string para tablas temáticas
              correctanswerindex,
              type,
              difficulty,
              isactive: isActive
            };

            // Agregar campos opcionales si existen (solo si la tabla los soporta)
            // NOTA: No todas las tablas tienen el campo 'explanation'
            // TODO: Verificar schema de cada tabla antes de agregar campos
            if (bloomLevel) updateData.bloomlevel = bloomLevel;
            
            // Agregar campos de metadatos si se proporcionan
            if (title !== undefined) updateData.title = title;
            if (titleQuestionNumber !== undefined) updateData.titleQuestionNumber = titleQuestionNumber;
            if (titleSourceDocument !== undefined) updateData.titleSourceDocument = titleSourceDocument;
            if (titleSourceReference !== undefined) updateData.titleSourceReference = titleSourceReference;
            if (titleRawMetadata !== undefined) updateData.titleRawMetadata = titleRawMetadata;

            // Actualizar en la tabla específica
            updatedQuestion = await (prisma as any)[tableName].update({
              where: { id: params.id },
              data: updateData
            });

            console.log(`✅ Actualización exitosa en tabla ${tableName}`);
            tableSource = tableName.charAt(0).toUpperCase() + tableName.slice(1);
            break;
          }
        } catch (error) {
          console.log(`❌ Error actualizando en tabla ${tableName}:`, error);
          // Continuar con la siguiente tabla
        }
      }
    }

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada en ninguna tabla' },
        { status: 404 }
      );
    }

    // Procesar respuesta según la tabla de origen
    const responseQuestion = tableSource === 'ValidQuestion' 
      ? {
          ...updatedQuestion,
          parsedOptions: Array.isArray(updatedQuestion.parsedoptions) 
            ? updatedQuestion.parsedoptions 
            : JSON.parse(updatedQuestion.parsedoptions as string)
        }
      : {
          ...updatedQuestion,
          source: tableSource,
          // Campos de compatibilidad para tablas específicas
          parsedquestion: updatedQuestion.question || updatedQuestion.content,
          parsedOptions: updatedQuestion.options || [],
          correctanswerindex: updatedQuestion.correctanswerindex
        };

    return NextResponse.json({
      success: true,
      question: responseQuestion,
      source: tableSource,
      wasPromoted,
      message: wasPromoted 
        ? `Pregunta promovida exitosamente de ${tableSource.replace('ValidQuestion', 'tabla original')} a ValidQuestion`
        : `Pregunta actualizada exitosamente en ${tableSource}`
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una pregunta permanentemente (INTELIGENTE - detecta tabla automáticamente)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let deletedQuestion: any = null;
    let tableSource = '';

    // 🎯 DETECCIÓN INTELIGENTE: Buscar en qué tabla está la pregunta para eliminarla
    try {
      // 1. Intentar ValidQuestion primero
      const validQuestion = await prisma.validquestion.findUnique({
        where: { id: params.id }
      });

      if (validQuestion) {
        // Eliminar respuestas relacionadas primero
        await prisma.duelresponse.deleteMany({
          where: { questionid: validQuestion.originalquestionid }
        });

        // Eliminar la pregunta
        deletedQuestion = await prisma.validquestion.delete({
          where: { id: params.id }
        });
        tableSource = 'ValidQuestion';
      }
    } catch (error) {
      console.log('No encontrado en ValidQuestion, buscando en otras tablas...');
    }

    if (!deletedQuestion) {
      try {
        // 2. Buscar en Question
        const question = await prisma.question.findUnique({
          where: { id: params.id }
        });

        if (question) {
          // Eliminar registros relacionados primero (si existen)
          await prisma.telegrampoll.deleteMany({
            where: { questionid: question.id }
          });

          // Eliminar la pregunta
          deletedQuestion = await prisma.question.delete({
            where: { id: params.id }
          });
          tableSource = 'Question';
        }
      } catch (error) {
        console.log('No encontrado en Question, buscando en SectionQuestion...');
      }
    }

    if (!deletedQuestion) {
      try {
        // 3. Buscar en SectionQuestion
        const sectionQuestion = await prisma.sectionquestion.findUnique({
          where: { id: params.id }
        });

        if (sectionQuestion) {
          // Eliminar registros relacionados primero (si existen)
          await prisma.telegrampoll.deleteMany({
            where: { questionid: sectionQuestion.id }
          });

          // Eliminar la pregunta
          deletedQuestion = await prisma.sectionquestion.delete({
            where: { id: params.id }
          });
          tableSource = 'SectionQuestion';
        }
      } catch (error) {
        console.log('No encontrado en SectionQuestion');
      }
    }

    // 🔥 NUEVO: Buscar en todas las tablas específicas (Pdc, Constitucion, etc.)
    if (!deletedQuestion) {
      for (const tableName of QUESTION_TABLES) {
        try {
          const record = await (prisma as any)[tableName].findUnique({
            where: { id: params.id }
          });

          if (record) {
            console.log(`🔍 DEBUG [DELETE] - Encontrado en tabla ${tableName}, eliminando...`);
            
            // Eliminar registros relacionados primero (si existen)
            // Nota: Se usa el id directamente ya que las tablas específicas usan su propio id
            await prisma.telegrampoll.deleteMany({
              where: { questionid: record.id }
            });

            // Eliminar la pregunta de la tabla específica
            deletedQuestion = await (prisma as any)[tableName].delete({
              where: { id: params.id }
            });
            
            tableSource = tableName.charAt(0).toUpperCase() + tableName.slice(1);
            console.log(`✅ Pregunta eliminada exitosamente de tabla ${tableName}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Error eliminando de tabla ${tableName}:`, error);
          // Continuar con la siguiente tabla
        }
      }
    }

    if (!deletedQuestion) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada en ninguna tabla' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Pregunta eliminada permanentemente de ${tableSource}`,
      deletedQuestion: {
        id: deletedQuestion.id,
        questionText: tableSource === 'ValidQuestion' 
          ? deletedQuestion.parsedquestion 
          : (deletedQuestion.question || deletedQuestion.content || 'Sin título'),
        source: tableSource
      }
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}