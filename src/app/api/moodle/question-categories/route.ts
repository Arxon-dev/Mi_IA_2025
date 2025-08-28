import { NextRequest, NextResponse } from 'next/server';
import { callMoodleWebService } from '@/lib/moodle';

// Definición de tipo para la respuesta del frontend
interface MoodleCategoryFE {
  id: number;
  name: string;
}

// Tipos para la respuesta de core_question_get_question_categories
// Estos tipos reflejan la estructura que devuelve Moodle para las categorías
interface MoodleQuestionCategory {
  id: number;
  name: string;
  contextid: number;
  info: string;
  infoformat: number;
  stamp: string;
  parent: number;
  sortorder: number;
  coursecount: number; // Número de cursos que usan esta categoría (generalmente 0 para categorías de preguntas)
  questioncount: number;
  subcategories: MoodleQuestionCategory[]; // Moodle devuelve las subcategorías anidadas
}

// Función auxiliar para aplanar las categorías y construir nombres jerárquicos
const flattenCategories = (categories: MoodleQuestionCategory[], parentName: string = ''): MoodleCategoryFE[] => {
  let flatList: MoodleCategoryFE[] = [];
  categories.forEach(category => {
    const currentName = parentName ? `${parentName} / ${category.name}` : category.name;
    flatList.push({
      id: category.id,
      name: currentName,
    });
    if (category.subcategories && category.subcategories.length > 0) {
      flatList = flatList.concat(flattenCategories(category.subcategories, currentName));
    }
  });
  return flatList;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moodleToken = searchParams.get('token');
  const contextIdString = searchParams.get('contextid');

  if (!moodleToken) {
    return NextResponse.json({ message: 'Token de Moodle no proporcionado.' }, { status: 400 });
  }
  if (!contextIdString) {
    return NextResponse.json({ message: 'Context ID no proporcionado.' }, { status: 400 });
  }

  const contextid = parseInt(contextIdString, 10);
  if (isNaN(contextid)) {
    return NextResponse.json({ message: 'Context ID inválido.' }, { status: 400 });
  }

  try {
    const params = {
      contextid: contextid,
      // sortby: 'sortorder', // Opcional: puedes especificar cómo ordenar
      // sortasc: true,        // Opcional: dirección de ordenación
    };

    // La función core_question_get_question_categories devuelve un array de categorías de primer nivel
    // para ese contexto, y cada una puede tener subcategorías anidadas.
    const moodleCategories = await callMoodleWebService<MoodleQuestionCategory[]>(
      moodleToken,
      'core_question_get_question_categories',
      params
    );

    if (!moodleCategories) {
      // Esto podría suceder si no hay categorías o si la llamada falla sutilmente
      return NextResponse.json([], { status: 200 });
    }

    // Aplanar la lista de categorías para el Select del frontend
    const frontendCategories = flattenCategories(moodleCategories);
    
    return NextResponse.json(frontendCategories, { status: 200 });

  } catch (error) {
    console.error('Error en el manejador de /api/moodle/question-categories:', error);
    const message = (error as any).response?.data?.message || (error as any).message || 'Error desconocido al procesar la solicitud de categorías.';
    return NextResponse.json(
      { message, error: (error as any).exception || (error as any).debuginfo || 'Detalles no disponibles' }, 
      { status: 500 }
    );
  }
} 