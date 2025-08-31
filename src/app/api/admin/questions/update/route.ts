import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configuración para forzar renderizado dinámico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lista de todas las tablas de preguntas
const QUESTION_TABLES = [
  'aire',
  'armada', 
  'carrera',
  'constitucion',
  'defensanacional',
  'derechosydeberes',
  'emad',
  'et',
  'examenoficial2024',
  'igualdad',
  'iniciativasquejas',
  'minsdef',
  'misionesinternacionales',
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

interface UpdateQuestionData {
  question?: string;
  options?: string | string[];
  correctanswerindex?: number;
  category?: string;
  difficulty?: string;
  type?: string;
  bloomlevel?: string;
  title?: string;
  feedback?: string;
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('📥 Datos recibidos en PUT /api/admin/questions/update:', JSON.stringify(body, null, 2));
    
    const { table, id, ...updateData }: { table: string; id: string } & UpdateQuestionData = body;

    console.log('🔍 Datos extraídos:');
    console.log('  - table:', table);
    console.log('  - id:', id);
    console.log('  - updateData:', JSON.stringify(updateData, null, 2));

    // Validar que la tabla existe
    if (!table || !QUESTION_TABLES.includes(table.toLowerCase())) {
      console.log('❌ Error: Tabla no válida:', table);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tabla no válida. Debe ser una de las tablas de preguntas disponibles.' 
        },
        { status: 400 }
      );
    }

    // Validar que se proporciona un ID
    if (!id) {
      console.log('❌ Error: ID no proporcionado');
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID de pregunta requerido.' 
        },
        { status: 400 }
      );
    }

    // Validar datos de actualización
    console.log('🔍 Validando datos de actualización...');
    const validationError = validateUpdateData(updateData);
    if (validationError) {
      console.log('❌ Error de validación:', validationError);
      return NextResponse.json(
        { 
          success: false, 
          error: validationError 
        },
        { status: 400 }
      );
    }
    console.log('✅ Validación exitosa');

    const tableName = table.toLowerCase();
    const model = (prisma as any)[tableName];
    
    if (!model) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Modelo para tabla ${tableName} no encontrado` 
        },
        { status: 500 }
      );
    }

    // Verificar que la pregunta existe
    const existingQuestion = await model.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Pregunta no encontrada' 
        },
        { status: 404 }
      );
    }

    // Preparar datos para actualización
    const dataToUpdate: any = {
      ...updateData
    };

    // Convertir opciones a string JSON si es array
    if (updateData.options && Array.isArray(updateData.options)) {
      dataToUpdate.options = JSON.stringify(updateData.options);
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
    const optionalFields = ['type', 'bloomlevel', 'title', 'feedback', 'updatedat'];
    const selectFields = { ...baseSelect };
    
    // Solo añadir campos opcionales si la tabla los tiene
    if (!['examenoficial2018', 'examenoficial2024'].includes(table)) {
      optionalFields.forEach(field => {
        selectFields[field] = true;
      });
    }

    // Actualizar la pregunta
    const updatedQuestion = await model.update({
      where: { id },
      data: dataToUpdate,
      select: selectFields
    });

    // Parsear opciones para la respuesta
    const responseQuestion = {
      ...updatedQuestion,
      tableName,
      options: typeof updatedQuestion.options === 'string' ? 
        (updatedQuestion.options.startsWith('[') ? JSON.parse(updatedQuestion.options) : updatedQuestion.options) : 
        updatedQuestion.options
    };

    return NextResponse.json({
      success: true,
      data: {
        question: responseQuestion,
        message: 'Pregunta actualizada exitosamente'
      }
    });

  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor al actualizar la pregunta' 
      },
      { status: 500 }
    );
  }
}

function validateUpdateData(data: UpdateQuestionData): string | null {
  // Validar pregunta
  if (data.question !== undefined) {
    if (typeof data.question !== 'string' || data.question.trim().length === 0) {
      return 'La pregunta debe ser un texto no vacío';
    }
    if (data.question.length > 5000) {
      return 'La pregunta no puede exceder 5000 caracteres';
    }
  }

  // Validar opciones
  if (data.options !== undefined) {
    if (Array.isArray(data.options)) {
      if (data.options.length < 2) {
        return 'Debe haber al menos 2 opciones de respuesta';
      }
      if (data.options.length > 10) {
        return 'No puede haber más de 10 opciones de respuesta';
      }
      for (const option of data.options) {
        if (typeof option !== 'string' || option.trim().length === 0) {
          return 'Todas las opciones deben ser texto no vacío';
        }
      }
    } else if (typeof data.options === 'string') {
      if (data.options.trim().length === 0) {
        return 'Las opciones no pueden estar vacías';
      }
    } else {
      return 'Las opciones deben ser un array de strings o un string';
    }
  }

  // Validar índice de respuesta correcta
  if (data.correctanswerindex !== undefined) {
    if (!Number.isInteger(data.correctanswerindex) || data.correctanswerindex < 0) {
      return 'El índice de respuesta correcta debe ser un número entero no negativo';
    }
    // Si hay opciones, validar que el índice esté en rango
    if (data.options && Array.isArray(data.options)) {
      if (data.correctanswerindex >= data.options.length) {
        return 'El índice de respuesta correcta debe estar dentro del rango de opciones';
      }
    }
  }

  // Validar categoría
  if (data.category !== undefined && typeof data.category !== 'string') {
    return 'La categoría debe ser un texto';
  }

  // Validar dificultad
  if (data.difficulty !== undefined) {
    const validDifficulties = ['Fácil', 'Medio', 'Difícil', 'facil', 'medio', 'dificil'];
    if (typeof data.difficulty !== 'string' || !validDifficulties.includes(data.difficulty)) {
      return 'La dificultad debe ser: Fácil, Medio o Difícil';
    }
  }

  // Validar tipo
  if (data.type !== undefined && typeof data.type !== 'string') {
    return 'El tipo debe ser un texto';
  }

  // Validar nivel de Bloom
  if (data.bloomlevel !== undefined && typeof data.bloomlevel !== 'string') {
    return 'El nivel de Bloom debe ser un texto';
  }

  // Validar título
  if (data.title !== undefined && typeof data.title !== 'string') {
    return 'El título debe ser un texto';
  }

  // Validar feedback
  if (data.feedback !== undefined && typeof data.feedback !== 'string') {
    return 'El feedback debe ser un texto';
  }

  return null;
}