import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanMalformedOptionsJSON, cleanOptionPercentages } from '@/utils/optionsParser';

// Configuración para forzar renderizado dinámico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Listar preguntas con paginación y búsqueda desde múltiples tablas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const showInactive = searchParams.get('showInactive') === 'true';
    const source = searchParams.get('source') || 'Question'; // Nuevo parámetro
    
    console.log(`🔍 Source recibido: "${source}"`);

    const skip = (page - 1) * limit;

    // Función helper para obtener preguntas según la fuente
    const getQuestionsFromSource = async (source: string) => {
      console.log(`🎯 Ejecutando switch con source: "${source}"`);
      switch (source) {
        case 'ValidQuestion':
          console.log('✅ Ejecutando getValidQuestions()');
          return getValidQuestions();
        case 'Question':
          return getRegularQuestions();
        case 'SectionQuestion':
          return getSectionQuestions();
        case 'Constitucion':
          return getConstitucionQuestions();
        case 'DefensaNacional':
          return getDefensaNacionalQuestions();
        case 'Rio':
          return getRioQuestions();
        case 'Minsdef':
          return getMinsdefQuestions();
        case 'OrganizacionFas':
          return getOrganizacionFasQuestions();
        case 'Emad':
          return getEmadQuestions();
        case 'Et':
          return getEtQuestions();
        case 'Armada':
          return getArmadaQuestions();
        case 'Aire':
          return getAireQuestions();
        case 'Carrera':
          return getCarreraQuestions();
        case 'Tropa':
          return getTropaQuestions();
        case 'Rroo':
          return getRrooQuestions();
        case 'DerechosYDeberes':
          return getDerechosYDeberesQuestions();
        case 'RegimenDisciplinario':
          return getRegimenDisciplinarioQuestions();
        case 'IniciativasQuejas':
          return getIniciativasQuejasQuestions();
        case 'Igualdad':
          return getIgualdadQuestions();
        case 'Omi':
          return getOmiQuestions();
        case 'Pac':
          return getPacQuestions();
        case 'SeguridadNacional':
          return getSeguridadNacionalQuestions();
        case 'Pdc':
          return getPdcQuestions();
        case 'Onu':
          return getOnuQuestions();
        case 'Otan':
          return getOtanQuestions();
        case 'Osce':
          return getOsceQuestions();
        case 'Ue':
          return getUeQuestions();
        case 'MisionesInternacionales':
          return getMisionesInternacionalesQuestions();
        case 'All':
          return getAllQuestionsCombined();
        default:
          return getRegularQuestions();
      }
    };


    // Función para ValidQuestion
    const getValidQuestions = async () => {
      console.log('🔥 DENTRO DE getValidQuestions()');
      const where: any = {};
      
      if (!showInactive) {
        where.isactive = true;
      }

      if (search && search.trim() !== '') {
        console.log(`Buscando en ValidQuestion con término: "${search}"`);
        where.OR = [
          { parsedquestion: { contains: search } },
          { id: { contains: search } },
          { type: { contains: search } },
          { difficulty: { contains: search } },
          { parsemethod: { contains: search } }
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'sendCount') {
        orderBy.sendcount = sortOrder;
      } else if (sortBy === 'lastSent') {
        orderBy.lastsuccessfulsendat = { sort: sortOrder, nulls: 'last' };
      } else if (sortBy === 'createdAt') {
        orderBy.createdat = sortOrder;
      } else if (sortBy === 'updatedAt') {
        orderBy.updatedat = sortOrder;
      } else if (sortBy === 'difficulty') {
        orderBy.difficulty = sortOrder;
      } else {
        // Fallback a createdat si el campo no existe
        orderBy.createdat = sortOrder;
      }

      const [questions, totalCount] = await Promise.all([
        prisma.validquestion.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        prisma.validquestion.count({ where })
      ]);

      // Procesar para formato uniforme
      const processedQuestions = questions.map(q => ({
        id: q.id,
        originalQuestionId: q.originalquestionid || q.id,
        questionText: q.parsedquestion,
        questionTitle: '', // ValidQuestion no tiene título separado
        questionPreview: q.parsedquestion.length > 200 ? q.parsedquestion.substring(0, 200) + '...' : q.parsedquestion,
        parsedOptions: (() => {
          try {
            return q.parsedoptions ? JSON.parse(q.parsedoptions) : [];
          } catch (e) {
            return [];
          }
        })(),
        correctanswerindex: q.correctanswerindex,
        parsedExplanation: q.parsedexplanation,
        parseMethod: q.parsemethod,
        type: q.type,
        difficulty: q.difficulty,
        bloomLevel: q.bloomlevel,
        sendCount: q.sendcount,
        lastsuccessfulsendat: q.lastsuccessfulsendat,
        isactive: q.isactive,
        createdAt: q.createdat,
        updatedAt: q.updatedat,
        source: 'ValidQuestion',
        status: q.isactive ? 'active' : 'inactive'
      }));

      return { questions: processedQuestions, totalCount };
    };

    // Función para Question
    const getRegularQuestions = async () => {
      const where: any = {};
      
      if (!showInactive) {
        where.archived = false;
      }

      if (search && search.trim() !== '') {
        console.log(`Buscando en Question con término: "${search}"`);
        where.OR = [
          { content: { contains: search } },
          { id: { contains: search } },
          { type: { contains: search } },
          { difficulty: { contains: search } }
          // Nota: La tabla 'question' no tiene campo 'options'
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'sendCount') {
        orderBy.sendcount = sortOrder;
      } else if (sortBy === 'lastSent') {
        orderBy.lastsuccessfulsendat = { sort: sortOrder, nulls: 'last' };
      } else if (sortBy === 'createdAt') {
        orderBy.createdat = sortOrder;
      } else if (sortBy === 'updatedAt') {
        orderBy.updatedat = sortOrder;
      } else if (sortBy === 'difficulty') {
        orderBy.difficulty = sortOrder;
      } else {
        // Fallback a createdat si el campo no existe
        orderBy.createdat = sortOrder;
      }

      // Consulta sin include para evitar el error de relación
      const [questions, totalCount] = await Promise.all([
        prisma.question.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        prisma.question.count({ where })
      ]);

      // Obtener los documentos por separado para las preguntas encontradas
      const documentIds = Array.from(new Set(questions.map(q => q.documentid)));
      const documents = await prisma.document.findMany({
        where: {
          id: {
            in: documentIds
          }
        },
        select: {
          id: true,
          title: true
        }
      });

      // Crear un mapa de documentos para acceso rápido
      const documentMap = new Map(documents.map(doc => [doc.id, doc]));

      // Procesar para formato uniforme
      const processedQuestions = questions.map(q => ({
        id: q.id,
        originalQuestionId: q.id,
        questionText: q.content,
        questionPreview: q.content.length > 100 ? q.content.substring(0, 100) + '...' : q.content,
        parsedOptions: [], // Las preguntas regulares no tienen opciones parseadas
        correctanswerindex: null,
        parsedExplanation: null,
        parseMethod: 'original',
        type: q.type,
        difficulty: q.difficulty,
        bloomLevel: q.bloomlevel,
        sendCount: q.sendcount,
        lastsuccessfulsendat: q.lastsuccessfulsendat,
        isactive: !q.archived,
        createdAt: q.createdat,
        updatedAt: q.createdat, // Question no tiene updatedAt
        source: 'Question',
        status: q.archived ? 'archived' : 'active',
        documentTitle: documentMap.get(q.documentid)?.title || 'Documento eliminado' // Usar el mapa de documentos
      }));

      return { questions: processedQuestions, totalCount };
    };

    // Función para SectionQuestion
    const getSectionQuestions = async () => {
      const where: any = {};

      if (search && search.trim() !== '') {
        console.log(`Buscando en SectionQuestion con término: "${search}"`);
        where.OR = [
          { content: { contains: search } },
          { id: { contains: search } },
          { type: { contains: search } },
          { difficulty: { contains: search } },
          { options: { contains: search } }, // 🔥 AGREGADO: Buscar en las opciones
          { sectionTitle: { contains: search } }, // 🔥 AGREGADO: Buscar en el título de la sección
          { documentTitle: { contains: search } } // 🔥 AGREGADO: Buscar en el título del documento
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'sendCount') {
        orderBy.sendcount = sortOrder;
      } else if (sortBy === 'lastSent') {
        orderBy.lastsuccessfulsendat = { sort: sortOrder, nulls: 'last' };
      } else if (sortBy === 'createdAt') {
        orderBy.createdat = sortOrder;
      } else if (sortBy === 'updatedAt') {
        orderBy.updatedat = sortOrder;
      } else if (sortBy === 'difficulty') {
        orderBy.difficulty = sortOrder;
      } else {
        // Fallback a createdat si el campo no existe
        orderBy.createdat = sortOrder;
      }

      // Primero obtener las preguntas sin include
      const [questions, totalCount] = await Promise.all([
        prisma.sectionquestion.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        prisma.sectionquestion.count({ where })
      ]);

      // Obtener las secciones por separado
      const sectionIds = Array.from(new Set(questions.map(q => q.sectionid)));
      const sections = await prisma.section.findMany({
        where: {
          id: {
            in: sectionIds
          }
        },
        select: {
          id: true,
          title: true,
          documentid: true
        }
      });

      // Crear un mapa de secciones para acceso rápido
      const sectionMap = new Map(sections.map(section => [section.id, section]));

      // Procesar para formato uniforme
      const processedQuestions = questions.map(q => {
        const section = sectionMap.get(q.sectionid);
        return {
          id: q.id,
          originalQuestionId: q.id,
          questionText: q.content,
          questionPreview: q.content.length > 100 ? q.content.substring(0, 100) + '...' : q.content,
          parsedOptions: [], // Las preguntas de sección no tienen opciones parseadas
          correctanswerindex: null,
          parsedExplanation: null,
          parseMethod: 'section',
          type: q.type,
          difficulty: q.difficulty,
          bloomLevel: q.bloomlevel,
          sendCount: q.sendcount,
          lastsuccessfulsendat: q.lastsuccessfulsendat,
          isactive: true,
          createdAt: q.createdat,
          updatedAt: q.updatedat,
          source: 'SectionQuestion',
          status: 'active',
          sectionTitle: section?.title || 'Sección eliminada',
          documentTitle: 'Documento eliminado' // o usar section?.documentid como ID
        };
      });

      return { questions: processedQuestions, totalCount };
    };

    // 🔥 FUNCIONES PARA LAS NUEVAS TABLAS CATEGORIZADAS
    // Función helper genérica para tablas categorizadas
    const getCategorizedQuestions = async (tableName: string, displayname: string) => {
      const where: any = {};
      
      if (!showInactive) {
        where.isactive = true;
      }

      if (search && search.trim() !== '') {
        console.log(`Buscando en tabla ${tableName} con término: "${search}"`);
        // Búsqueda sin mode para compatibilidad con esta configuración de Prisma
        where.OR = [
          { question: { contains: search } },
          { title: { contains: search } },
          { feedback: { contains: search } },
          { sourcesection: { contains: search } },
          { id: { contains: search } },
          { type: { contains: search } },
          { difficulty: { contains: search } },
          { category: { contains: search } },
          { options: { contains: search } }
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'sendCount') {
        orderBy.sendcount = sortOrder;
      } else if (sortBy === 'lastSent') {
        orderBy.lastsuccessfulsendat = { sort: sortOrder, nulls: 'last' };
      } else if (sortBy === 'createdAt') {
        orderBy.createdat = sortOrder;
      } else if (sortBy === 'updatedAt') {
        orderBy.updatedat = sortOrder;
      } else if (sortBy === 'difficulty') {
        orderBy.difficulty = sortOrder;
      } else {
        // Fallback a createdat si el campo no existe
        orderBy.createdat = sortOrder;
      }

      // Usar Prisma dinámicamente según la tabla
      const model = (prisma as any)[tableName.toLowerCase()];
      
      const [questions, totalCount] = await Promise.all([
        model.findMany({
          where,
          orderBy,
          skip,
          take: limit
        }),
        model.count({ where })
      ]);

      // Procesar para formato uniforme
      const processedQuestions = questions.map((q: any) => {
        // 🔥 GENERAR FORMATO GIFT COMPLETO DINÁMICAMENTE
        const generateGiftContent = (question: any, displayname: string) => {
          const title = question.title || `${displayname} (Texto Provisto)`;
          const questionText = question.question || '';

          // Construir contenido GIFT directamente sin comentarios
          let giftContent = `<b>${title}</b><br><br>\n${questionText} {\n`;

          // Agregar opciones con porcentajes
          // 🔧 PARSEAR OPCIONES: Convertir string JSON a array
          let options: string[] = [];
          if (typeof question.options === 'string' && question.options) {
            options = cleanMalformedOptionsJSON(question.options);
          } else if (Array.isArray(question.options)) {
            options = question.options;
          }
          
          options.forEach((option: string, index: number) => {
            const prefix = index === question.correctanswerindex ? '=' : '~%-33.33333%';
            const cleanOption = cleanOptionPercentages(option);
            giftContent += `${prefix}${cleanOption}\n`;
          });

          // Añadir retroalimentación
          if (question.feedback) {
            giftContent += `#### RETROALIMENTACIÓN:\n${question.feedback}\n`;
          }

          giftContent += '}';
          return giftContent;
        };

        return {
          id: q.id,
          originalQuestionId: q.id,
          questionText: generateGiftContent(q, displayname), // 🔥 GENERAR CONTENIDO GIFT COMPLETO DINÁMICAMENTE
          questionTitle: q.title, // 🔥 MAPEAR EL TÍTULO PARA EL FRONTEND
          questionPreview: q.question.length > 200 ? q.question.substring(0, 200) + '...' : q.question, // 🔥 PREVIEW DE LA PREGUNTA SIMPLE
          parsedOptions: (() => {
            // 🔧 PARSEAR OPCIONES: Convertir string JSON a array para parsedOptions
            let options: string[] = [];
            if (typeof q.options === 'string' && q.options) {
              options = cleanMalformedOptionsJSON(q.options);
            } else if (Array.isArray(q.options)) {
              options = q.options;
            }
            // Limpiar porcentajes existentes de las opciones
            return options.map(option => cleanOptionPercentages(option));
          })(),
          correctanswerindex: q.correctanswerindex,
          parsedExplanation: null,
          parseMethod: 'categorized',
          type: q.type || 'gift',
          difficulty: q.difficulty || 'OFICIAL',
          bloomLevel: q.bloomLevel,
          sendCount: q.sendCount,
          lastsuccessfulsendat: q.lastsuccessfulsendat,
          isactive: q.isactive,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          source: tableName,
          status: q.isactive ? 'active' : 'inactive',
          category: q.category || displayname.toLowerCase()
        };
      });

      return { questions: processedQuestions, totalCount };
    };

    // Funciones específicas para cada tabla
    const getConstitucionQuestions = () => getCategorizedQuestions('Constitucion', 'Constitución');
    const getDefensaNacionalQuestions = () => getCategorizedQuestions('DefensaNacional', 'Defensa Nacional');
    const getRioQuestions = () => getCategorizedQuestions('Rio', 'RIO');
    const getMinsdefQuestions = () => getCategorizedQuestions('Minsdef', 'MINSDEF');
    const getOrganizacionFasQuestions = () => getCategorizedQuestions('OrganizacionFas', 'Organización FAS');
    const getEmadQuestions = () => getCategorizedQuestions('Emad', 'EMAD');
    const getEtQuestions = () => getCategorizedQuestions('Et', 'ET');
    const getArmadaQuestions = () => getCategorizedQuestions('Armada', 'Armada');
    const getAireQuestions = () => getCategorizedQuestions('Aire', 'Aire');
    const getCarreraQuestions = () => getCategorizedQuestions('Carrera', 'Carrera');
    const getTropaQuestions = () => getCategorizedQuestions('Tropa', 'Tropa');
    const getRrooQuestions = () => getCategorizedQuestions('Rroo', 'RROO');
    const getDerechosYDeberesQuestions = () => getCategorizedQuestions('DerechosYDeberes', 'Derechos y Deberes');
    const getRegimenDisciplinarioQuestions = () => getCategorizedQuestions('RegimenDisciplinario', 'Régimen Disciplinario');
    const getIniciativasQuejasQuestions = () => getCategorizedQuestions('IniciativasQuejas', 'Iniciativas y Quejas');
    const getIgualdadQuestions = () => getCategorizedQuestions('Igualdad', 'Igualdad');
    const getOmiQuestions = () => getCategorizedQuestions('Omi', 'OMI');
    const getPacQuestions = () => getCategorizedQuestions('Pac', 'PAC');
    const getSeguridadNacionalQuestions = () => getCategorizedQuestions('SeguridadNacional', 'Seguridad Nacional');
    const getPdcQuestions = () => getCategorizedQuestions('Pdc', 'PDC');
    const getOnuQuestions = () => getCategorizedQuestions('Onu', 'ONU');
    const getOtanQuestions = () => getCategorizedQuestions('Otan', 'OTAN');
    const getOsceQuestions = () => getCategorizedQuestions('Osce', 'OSCE');
    const getUeQuestions = () => getCategorizedQuestions('Ue', 'UE');
    const getMisionesInternacionalesQuestions = () => getCategorizedQuestions('MisionesInternacionales', 'Misiones Internacionales');

    // Función para obtener todas las preguntas combinadas
    const getAllQuestionsCombined = async () => {
      // Para "All", obtenemos de cada tabla por separado y las combinamos
      const validQuestionsResult = await getValidQuestions();
      const regularQuestionsResult = await getRegularQuestions();
      const sectionQuestionsResult = await getSectionQuestions();
      
      // 🔥 INCLUIR TODAS LAS NUEVAS TABLAS CATEGORIZADAS
      const categorizedResults = await Promise.all([
        getConstitucionQuestions(),
        getDefensaNacionalQuestions(),
        getRioQuestions(),
        getMinsdefQuestions(),
        getOrganizacionFasQuestions(),
        getEmadQuestions(),
        getEtQuestions(),
        getArmadaQuestions(),
        getAireQuestions(),
        getCarreraQuestions(),
        getTropaQuestions(),
        getRrooQuestions(),
        getDerechosYDeberesQuestions(),
        getRegimenDisciplinarioQuestions(),
        getIniciativasQuejasQuestions(),
        getIgualdadQuestions(),
        getOmiQuestions(),
        getPacQuestions(),
        getSeguridadNacionalQuestions(),
        getPdcQuestions(),
        getOnuQuestions(),
        getOtanQuestions(),
        getOsceQuestions(),
        getUeQuestions(),
        getMisionesInternacionalesQuestions()
      ]);

      const allQuestions = [
        ...validQuestionsResult.questions,
        ...regularQuestionsResult.questions,
        ...sectionQuestionsResult.questions,
        ...categorizedResults.flatMap(result => result.questions)
      ];

      // Ordenar todas las preguntas combinadas
      allQuestions.sort((a, b) => {
        if (sortBy === 'createdAt') {
          return sortOrder === 'desc' 
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'sendCount') {
          return sortOrder === 'desc' ? b.sendCount - a.sendCount : a.sendCount - b.sendCount;
        }
        return 0;
      });

      // Aplicar paginación manual
      const paginatedQuestions = allQuestions.slice(skip, skip + limit);
      const totalCount = allQuestions.length;

      return { questions: paginatedQuestions, totalCount };
    };

    // Obtener preguntas según la fuente seleccionada
    const result = await getQuestionsFromSource(source);
    const totalPages = Math.ceil(result.totalCount / limit);

    // Calcular estadísticas según la fuente
    const getStats = async () => {
      switch (source) {
        case 'ValidQuestion':
          return {
            total: result.totalCount,
            active: await prisma.validquestion.count({ where: { isactive: true } }),
            inactive: await prisma.validquestion.count({ where: { isactive: false } }),
            neverSent: await prisma.validquestion.count({ where: { sendcount: 0 } }),
            sentOnce: await prisma.validquestion.count({ where: { sendcount: 1 } }),
            sentMultiple: await prisma.validquestion.count({ where: { sendcount: { gt: 1 } } })
          };
        case 'Question':
          return {
            total: result.totalCount,
            active: await prisma.question.count({ where: { archived: false } }),
            inactive: await prisma.question.count({ where: { archived: true } }),
            neverSent: await prisma.question.count({ where: { sendcount: 0 } }),
            sentOnce: await prisma.question.count({ where: { sendcount: 1 } }),
            sentMultiple: await prisma.question.count({ where: { sendcount: { gt: 1 } } })
          };
        case 'SectionQuestion':
          return {
            total: result.totalCount,
            active: await prisma.sectionquestion.count(),
            inactive: 0,
            neverSent: await prisma.sectionquestion.count({ where: { sendcount: 0 } }),
            sentOnce: await prisma.sectionquestion.count({ where: { sendcount: 1 } }),
            sentMultiple: await prisma.sectionquestion.count({ where: { sendcount: { gt: 1 } } })
          };
        // 🔥 ESTADÍSTICAS PARA TABLAS CATEGORIZADAS
        case 'Constitucion':
        case 'DefensaNacional':
        case 'Rio':
        case 'Minsdef':
        case 'OrganizacionFas':
        case 'Emad':
        case 'Et':
        case 'Armada':
        case 'Aire':
        case 'Carrera':
        case 'Tropa':
        case 'Rroo':
        case 'DerechosYDeberes':
        case 'RegimenDisciplinario':
        case 'IniciativasQuejas':
        case 'Igualdad':
        case 'Omi':
        case 'Pac':
        case 'SeguridadNacional':
        case 'Pdc':
        case 'Onu':
        case 'Otan':
        case 'Osce':
        case 'Ue':
        case 'MisionesInternacionales':
          const model = (prisma as any)[source.toLowerCase()];
          return {
            total: result.totalCount,
            active: await model.count({ where: { isactive: true } }),
            inactive: await model.count({ where: { isactive: false } }),
            neverSent: await model.count({ where: { sendcount: 0 } }),
            sentOnce: await model.count({ where: { sendcount: 1 } }),
            sentMultiple: await model.count({ where: { sendcount: { gt: 1 } } })
          };
        case 'All':
          const questionStats = await prisma.question.aggregate({
            _count: true,
            _sum: { sendcount: true }
          });
          const sectionStats = await prisma.sectionquestion.aggregate({
            _count: true,
            _sum: { sendcount: true }
          });
          
          return {
            total: result.totalCount,
            active: result.totalCount,
            inactive: 0,
            neverSent: 0, // Sería complejo calcular esto para todas las tablas
            sentOnce: 0,
            sentMultiple: 0
          };
        default:
          return {
            total: 0,
            active: 0,
            inactive: 0,
            neverSent: 0,
            sentOnce: 0,
            sentMultiple: 0
          };
      }
    };

    const stats = await getStats();

    return NextResponse.json({
      questions: result.questions,
      pagination: {
        page,
        limit,
        totalCount: result.totalCount,
        totalPages,
        hasMore: page < totalPages
      },
      stats,
      source: source // Incluir información sobre la fuente
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}