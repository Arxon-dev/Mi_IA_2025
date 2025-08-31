import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configuración para forzar renderizado dinámico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lista de todas las tablas de preguntas identificadas en el esquema
const QUESTION_TABLES = [
  'aire',
  'armada', 
  'carrera',
  'constitucion',
  'defensanacional',
  'derechosydeberes',
  'emad',
  'et',
  'examenoficial2018',
  'examenoficial2024',
  'igualdad',
  'iniciativasquejas',
  'minsdef',
  'omi',
  'onu',
  'organizacionfas',
  'osce',
  'otan',
  'pac',
  'pdc',
  'regimendisciplinario',
  'rio',
  'rroo',
  'seguridadnacional',
  'tropa',
  'ue'
];

interface SearchParams {
  query?: string;
  table?: string;
  category?: string;
  difficulty?: string;
  page?: string;
  limit?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const table = searchParams.get('table') || '';
    const category = searchParams.get('category') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let results: any[] = [];
    let totalCount = 0;

    // Si se especifica una tabla específica
    if (table && QUESTION_TABLES.includes(table.toLowerCase())) {
      const tableName = table.toLowerCase();
      const searchResults = await searchInTable(tableName, {
        query,
        category,
        difficulty,
        limit,
        offset
      });
      results = searchResults.questions;
      totalCount = searchResults.total;
    } else {
      // Buscar en todas las tablas
      const searchPromises = QUESTION_TABLES.map(async (tableName) => {
        try {
          const tableResults = await searchInTable(tableName, {
            query,
            category,
            difficulty,
            limit: Math.ceil(limit / QUESTION_TABLES.length), // Distribuir el límite
            offset: 0
          });
          return {
            table: tableName,
            questions: tableResults.questions,
            total: tableResults.total
          };
        } catch (error) {
          console.error(`Error searching in table ${tableName}:`, error);
          return {
            table: tableName,
            questions: [],
            total: 0
          };
        }
      });

      const allResults = await Promise.all(searchPromises);
      
      // Combinar resultados de todas las tablas
      results = allResults.flatMap(result => result.questions);
      totalCount = allResults.reduce((sum, result) => sum + result.total, 0);
      
      // Aplicar paginación a los resultados combinados
      results = results.slice(offset, offset + limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        questions: results,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        availableTables: QUESTION_TABLES
      }
    });

  } catch (error) {
    console.error('Error searching questions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al buscar preguntas' 
      },
      { status: 500 }
    );
  }
}

async function searchInTable(
  tableName: string, 
  params: {
    query: string;
    category: string;
    difficulty: string;
    limit: number;
    offset: number;
  }
) {
  const { query, category, difficulty, limit, offset } = params;
  
  // Construir condiciones de búsqueda
  const whereConditions: any = {
    isactive: true // Solo preguntas activas
  };

  // Búsqueda por texto en pregunta, título y opciones
  if (query) {
    const searchConditions: any[] = [
      {
        question: {
          contains: query
        }
      },
      {
        options: {
          contains: query
        }
      }
    ];
    
    // Solo añadir búsqueda por título si la tabla lo tiene
    if (!['examenoficial2018', 'examenoficial2024'].includes(tableName)) {
      searchConditions.push({
        title: {
          contains: query
        }
      });
    }
    
    whereConditions.OR = searchConditions;
  }

  // Filtro por categoría
  if (category) {
    whereConditions.category = {
      contains: category
    };
  }

  // Filtro por dificultad
  if (difficulty) {
    whereConditions.difficulty = difficulty;
  }

  // Obtener el modelo de Prisma dinámicamente
  const model = (prisma as any)[tableName];
  
  if (!model) {
    throw new Error(`Tabla ${tableName} no encontrada`);
  }

  // Campos base que todas las tablas tienen
  const baseSelect = {
    id: true,
    questionnumber: true,
    question: true,
    options: true,
    correctanswerindex: true,
    category: true,
    difficulty: true,
    createdat: true
  };

  // Campos opcionales que no todas las tablas tienen
  const optionalFields = ['type', 'bloomlevel', 'title', 'updatedat'];
  const selectFields = { ...baseSelect };
  
  // Solo añadir campos opcionales si la tabla los tiene
  if (!['examenoficial2018', 'examenoficial2024'].includes(tableName)) {
    optionalFields.forEach(field => {
      selectFields[field] = true;
    });
  }

  // Ejecutar búsqueda
  const [questions, total] = await Promise.all([
    model.findMany({
      where: whereConditions,
      select: selectFields,
      orderBy: {
        questionnumber: 'asc'
      },
      skip: offset,
      take: limit
    }),
    model.count({
      where: whereConditions
    })
  ]);

  // Añadir información de la tabla a cada pregunta
  const questionsWithTable = questions.map((q: any) => ({
    ...q,
    tableName,
    // Parsear opciones si es string JSON
    options: typeof q.options === 'string' ? 
      (q.options.startsWith('[') ? JSON.parse(q.options) : q.options) : 
      q.options
  }));

  return {
    questions: questionsWithTable,
    total
  };
}