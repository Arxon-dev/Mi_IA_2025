import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/prisma-retry';
import type { QuestionTableName } from '@/types/questionTables';

// 🎯 API Endpoint para guardar preguntas en diferentes tablas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableName, questions, sectionId, documentId } = body;

    // Validar datos de entrada
    if (!tableName || !questions) {
      return NextResponse.json(
        { error: 'tableName y questions son requeridos' },
        { status: 400 }
      );
    }

    // Si questions es un string (formato GIFT), convertirlo a array
    let questionsArray: any[];
    if (typeof questions === 'string') {
      // Parsear el texto GIFT en preguntas individuales
      const giftQuestions = questions.split(/\n\n/).filter(q => q.includes('{') && q.includes('}'));
      questionsArray = giftQuestions.map((giftText, index) => ({
        content: giftText.trim(),
        type: 'gift',
        id: `gift-${Date.now()}-${index}`
      }));
    } else if (Array.isArray(questions)) {
      questionsArray = questions;
    } else {
      return NextResponse.json(
        { error: 'questions debe ser un string o array' },
        { status: 400 }
      );
    }

    if (questionsArray.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron preguntas válidas' },
        { status: 400 }
      );
    }

    console.log(`[API /questions/custom-table] Guardando ${questionsArray.length} preguntas en ${tableName}`);

    // Procesar preguntas según la tabla destino
    let savedQuestions: any[] = [];

    if (tableName === 'SectionQuestion') {
      // Si es SectionQuestion, usar el método tradicional
      if (!sectionId) {
        return NextResponse.json(
          { error: 'sectionId es requerido para SectionQuestion' },
          { status: 400 }
        );
      }

      savedQuestions = await createSectionQuestions(sectionId, questionsArray);
    } else {
      // Para las nuevas tablas temáticas
      savedQuestions = await createCustomTableQuestions(tableName, questionsArray, sectionId, documentId);
    }

    return NextResponse.json({
      success: true,
      tableName,
      questions: savedQuestions,
      count: savedQuestions.length
    });

  } catch (error) {
    console.error('[API /questions/custom-table] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Función para crear preguntas en SectionQuestion (método tradicional)
async function createSectionQuestions(sectionId: string, questions: any[]) {
  const questionsData = questions.map(q => ({
    id: q.id || `${sectionId}-${Date.now()}-${Math.random()}`,
    sectionid: sectionId,  // Cambiar sectionId a sectionid
    content: q.content || q.question || '',
    type: q.type || 'gift',
    difficulty: q.difficulty || 'medium',
    bloomlevel: q.bloomLevel || null,  // Cambiar bloomLevel a bloomlevel
    lastscheduledsendat: q.lastScheduledSendAt || null,  // Cambiar lastScheduledSendAt a lastscheduledsendat
    sendcount: q.sendCount || 0,  // Cambiar sendCount a sendcount
    lastsuccessfulsendat: q.lastsuccessfulsendat || null,
    isactive: q.isactive !== undefined ? q.isactive : true
  }));

  const result = await withRetry(async () => {
    return await prisma.sectionquestion.createMany({
      data: questionsData,
      skipDuplicates: true
    });
  }, 3, `createSectionQuestions(${sectionId})`);

  // Retornar las preguntas creadas
  return await withRetry(async () => {
    return await prisma.sectionquestion.findMany({
      where: { sectionid: sectionId },
      orderBy: { createdat: 'desc' },
      take: questions.length
    });
  }, 3, `findSectionQuestions(${sectionId})`);
}

// Función para crear preguntas en tablas temáticas
async function createCustomTableQuestions(
  tableName: QuestionTableName, 
  questions: any[], 
  sectionId?: string, 
  documentId?: string
) {
  console.log(`[createCustomTableQuestions] Iniciando guardado en tabla: ${tableName}`);
  console.log(`[createCustomTableQuestions] Número de preguntas: ${questions.length}`);
  
  // Obtener el siguiente número de pregunta
  const nextQuestionNumber = await getNextQuestionNumber(tableName);
  console.log(`[createCustomTableQuestions] Siguiente número de pregunta: ${nextQuestionNumber}`);
  
  // Mapear datos de pregunta al formato requerido por las nuevas tablas
  const questionsData = questions.map((q, index) => {
    // Extraer datos de la pregunta en formato GIFT
    const questionContent = q.content || q.question || '';
    const parsedQuestion = parseGiftQuestion(questionContent);
    
    // Generar ID único para cada pregunta
    const questionId = `${tableName}-${nextQuestionNumber + index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: questionId, // 🔑 Campo ID requerido por las tablas personalizadas
      title: q.customTitle || parsedQuestion?.title || null,
      feedback: parsedQuestion?.feedback || null,
      questionnumber: nextQuestionNumber + index,
      question: parsedQuestion?.pregunta || questionContent,
      options: JSON.stringify(parsedQuestion?.opciones || []), // 🔧 Convertir array a JSON string
      correctanswerindex: parsedQuestion?.respuestaCorrecta || 0,
      category: getTableCategory(tableName),
      difficulty: q.difficulty || 'OFICIAL',
      isactive: q.isactive !== undefined ? q.isactive : true,
      sendcount: q.sendCount || 0, // 🔧 Corregido: sendCount → sendcount
      lastsuccessfulsendat: q.lastsuccessfulsendat || null,
      lastusedintournament: q.lastUsedInTournament || null, // 🔧 Corregido: lastUsedInTournament → lastusedintournament
      tournamentusagecount: q.tournamentUsageCount || 0, // 🔧 Corregido: tournamentUsageCount → tournamentusagecount
      lasttournamentid: q.lastTournamentId || null, // 🔧 Corregido: lastTournamentId → lasttournamentid
      
      // 🔗 Campos de compatibilidad y trazabilidad
      type: q.type || 'gift',
      bloomlevel: q.bloomLevel || null, // 🔧 Corregido: bloomLevel → bloomlevel
      sectionid: sectionId || null, // 🔧 Corregido: sectionId → sectionid
      documentid: documentId || null, // 🔧 Corregido: documentId → documentid
      sourcesection: sectionId ? `Section-${sectionId}` : null, // 🔧 Corregido: sourceSection → sourcesection
      updatedat: new Date() // 🔧 Agregado: campo updatedat requerido
    };
  });

  // Usar el nombre de tabla dinámicamente con Prisma
  const modelName = getModelName(tableName);
  console.log(`[createCustomTableQuestions] Modelo de Prisma: ${modelName}`);
  console.log(`[createCustomTableQuestions] Datos de preguntas preparados:`, questionsData.length);
  
  // Crear las preguntas usando acceso dinámico
  const result = await withRetry(async () => {
    console.log(`[createCustomTableQuestions] Intentando crear preguntas en ${modelName}...`);
    const createResult = await (prisma as any)[modelName].createMany({
      data: questionsData,
      skipDuplicates: true
    });
    console.log(`[createCustomTableQuestions] Preguntas creadas exitosamente:`, createResult);
    return createResult;
  }, 3, `createCustomTableQuestions-${tableName}`);

  // Retornar las preguntas creadas
  const savedQuestions = await withRetry(async () => {
    console.log(`[createCustomTableQuestions] Buscando preguntas guardadas en ${modelName}...`);
    const foundQuestions = await (prisma as any)[modelName].findMany({
      orderBy: { createdat: 'desc' },  // Cambiar createdAt a createdat
      take: questions.length
    });
    console.log(`[createCustomTableQuestions] Preguntas encontradas:`, foundQuestions.length);
    return foundQuestions;
  }, 3, `findCustomTableQuestions-${tableName}`);
  
  return savedQuestions;
}

// Helper: Parsear pregunta en formato GIFT
function parseGiftQuestion(giftText: string) {
  try {
    // 1. Extraer título de la etiqueta <b>
    const titleMatch = giftText.match(/<b>(.*?)<\/b>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    // 2. Extraer el contenido dentro de las llaves {}
    const blockMatch = giftText.match(/\{([\s\S]*?)\}/);
    const blockContent = blockMatch ? blockMatch[1] : '';

    // 3. Extraer opciones y respuesta correcta
    const optionsPart = blockContent.split('#### RETROALIMENTACIÓN:')[0];
    const lines = optionsPart.trim().split('\n').filter(line => line.trim() !== '');
    const opciones = lines.map(line => line.substring(1).trim());
    const respuestaCorrecta = lines.findIndex(line => line.startsWith('='));

    // 4. Extraer feedback
    const feedbackMatch = blockContent.match(/#### RETROALIMENTACIÓN:([\s\S]*)/);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : null;

    // 5. Extraer el cuerpo de la pregunta (todo antes de las llaves)
    let pregunta = '';
    const questionBodyEnd = giftText.indexOf('{');
    if (questionBodyEnd !== -1) {
      pregunta = giftText.substring(0, questionBodyEnd).trim();
    }

    // Quitar el título del cuerpo de la pregunta para no duplicarlo
    pregunta = pregunta.replace(/<b>.*?<\/b><br><br>/i, '').trim();

    return {
      title,
      pregunta, // Contiene el comentario y el texto de la pregunta
      opciones,
      respuestaCorrecta: respuestaCorrecta !== -1 ? respuestaCorrecta : null,
      feedback,
    };
  } catch (error) {
    console.error('Error al parsear la pregunta GIFT:', error);
    return null;
  }
}

// Helper: Obtener siguiente número de pregunta para una tabla
async function getNextQuestionNumber(tableName: QuestionTableName): Promise<number> {
  const modelName = getModelName(tableName);
  
  try {
    const lastQuestion = await withRetry(async () => {
      return await (prisma as any)[modelName].findFirst({
        orderBy: { questionnumber: 'desc' },
        select: { questionnumber: true }
      });
    }, 3, `getNextQuestionNumber(${tableName})`);
    
    return (lastQuestion?.questionnumber || 0) + 1;
  } catch (error) {
    console.error(`Error getting next question number for ${tableName}:`, error);
    return 1;
  }
}

// Helper: Obtener categoría según nombre de tabla
function getTableCategory(tableName: QuestionTableName): string {
  const categoryMap: Record<QuestionTableName, string> = {
    'SectionQuestion': 'section',
    'Constitucion': 'constitucion',
    'DefensaNacional': 'defensanacional',
    'Rio': 'rio',
    'Minsdef': 'minsdef',
    'OrganizacionFas': 'organizacionfas',
    'Emad': 'emad',
    'Et': 'et',
    'Armada': 'armada',
    'Aire': 'aire',
    'Carrera': 'carrera',
    'Tropa': 'tropa',
    'Rroo': 'rroo',
    'DerechosYDeberes': 'derechosydeberes',
    'RegimenDisciplinario': 'regimendisciplinario',
    'IniciativasQuejas': 'iniciativasquejas',
    'Igualdad': 'igualdad',
    'Omi': 'omi',
    'Pac': 'pac',
    'SeguridadNacional': 'seguridadnacional',
    'Pdc': 'pdc',
    'Onu': 'onu',
    'Otan': 'otan',
    'Osce': 'osce',
    'Ue': 'ue',
    'MisionesInternacionales': 'misionesinternacionales'
  };
  
  return categoryMap[tableName] || tableName.toLowerCase();
}

// Helper: Convertir nombre de tabla a nombre de modelo de Prisma
function getModelName(tableName: QuestionTableName): string {
  const modelMap: Record<QuestionTableName, string> = {
    'SectionQuestion': 'sectionquestion',
    'Armada': 'armada',
    'Constitucion': 'constitucion',
    'DefensaNacional': 'defensanacional',
    'Rio': 'rio',
    'Minsdef': 'minsdef',
    'OrganizacionFas': 'organizacionfas',
    'Emad': 'emad',
    'Et': 'et',
    'Aire': 'aire',
    'Carrera': 'carrera',
    'Tropa': 'tropa',
    'Rroo': 'rroo',
    'DerechosYDeberes': 'derechosydeberes', // 🔧 CORREGIDO: era 'derechosYDeberes'
    'RegimenDisciplinario': 'regimendisciplinario', // 🔧 CORREGIDO: era 'regimenDisciplinario'
    'IniciativasQuejas': 'iniciativasquejas', // 🔧 CORREGIDO: era 'iniciativasQuejas'
    'Igualdad': 'igualdad',
    'Omi': 'omi',
    'Pac': 'pac',
    'SeguridadNacional': 'seguridadnacional', // 🔧 CORREGIDO: era 'seguridadNacional'
    'Pdc': 'pdc',
    'Onu': 'onu',
    'Otan': 'otan',
    'Osce': 'osce',
    'Ue': 'ue',
    'MisionesInternacionales': 'misionesinternacionales' // 🔧 CORREGIDO: era 'misionesInternacionales'
  };
  
  return modelMap[tableName] || tableName.toLowerCase();
}