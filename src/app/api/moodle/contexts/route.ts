import { NextRequest, NextResponse } from 'next/server';
import { callMoodleWebService } from '@/lib/moodle';

// Definición de tipo para la respuesta del frontend (debe coincidir con la de question-generator.tsx)
interface MoodleContext {
  id: number; // Este será el contextid
  name: string;
}

// Tipo para la respuesta de core_webservice_get_site_info
interface MoodleSiteInfo {
  sitename: string;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  lang: string;
  userid: number;
  siteurl: string;
  userpictureurl: string;
  functions: { name: string; version: string }[];
  downloadfiles: number;
  uploadfiles: number;
  release: string;
  version: string;
  mobilecssurl: string;
  advancedfeatures: { name: string; value: number }[];
  usercanmanageownfiles: boolean;
  userquota: number;
  usermaxuploadfilesize: number;
  userhomepage: number;
  siteid: number; // Opcional, si Moodle lo devuelve
  // ... otros campos que pueda devolver
}

// Tipo para la respuesta de tu función local_opomoodletools_get_user_courses_with_contexts
// Asegúrate de que coincida con lo que devuelve tu función PHP
interface UserCourseWithContext {
  id: number; // course id
  fullname: string;
  shortname: string;
  contextid: number;
  // ... otros campos que pueda devolver tu función
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moodleToken = searchParams.get('token');

  if (!moodleToken) {
    return NextResponse.json({ message: 'Token de Moodle no proporcionado.' }, { status: 400 });
  }

  try {
    // 1. Obtener el userid del token
    let siteInfo: MoodleSiteInfo;
    try {
      siteInfo = await callMoodleWebService<MoodleSiteInfo>(
        moodleToken,
        'core_webservice_get_site_info'
      );
    } catch (error) {
      console.error('Error al obtener site_info de Moodle:', error);
      return NextResponse.json(
        { message: 'Error al verificar el token de Moodle.', error: (error as any).message }, 
        { status: 500 }
      );
    }

    if (!siteInfo || !siteInfo.userid) {
        return NextResponse.json(
          { message: 'No se pudo obtener el userid del token de Moodle.' }, 
          { status: 500 }
        );
    }
    const userid = siteInfo.userid;

    // 2. Obtener los cursos del usuario con sus contextid
    // Usando tu función local_opomoodletools_get_user_courses_with_contexts
    let userCourses: UserCourseWithContext[];
    try {
      userCourses = await callMoodleWebService<UserCourseWithContext[]>(
        moodleToken,
        'local_opomoodletools_get_user_courses_with_contexts',
        { userid: userid }
      );
    } catch (error) {
      console.error('Error al obtener cursos del usuario de Moodle:', error);
      // Continuar incluso si falla, para al menos devolver el contexto del sistema
      userCourses = [];
      // Considera notificar al frontend de este error parcial si es importante
    }
    
    const moodleContexts: MoodleContext[] = [];

    // 3. Añadir contexto del Sistema
    // El contextid del sistema es convencionalmente 1
    // Puedes verificarlo en tu Moodle en la tabla mdl_context donde contextlevel = 10 (CONTEXT_SYSTEM)
    moodleContexts.push({ id: 1, name: 'Sistema (Por defecto)' });
    
    // 4. Mapear los cursos a MoodleContext
    if (userCourses && userCourses.length > 0) {
      userCourses.forEach(course => {
        // Asegurarse de no añadir duplicados si un contextid ya existe (poco probable aquí)
        if (course.contextid && !moodleContexts.find(c => c.id === course.contextid)) {
            moodleContexts.push({
                id: course.contextid,
                name: course.fullname || course.shortname || `Curso ID: ${course.id}`,
            });
        }
      });
    }

    return NextResponse.json(moodleContexts, { status: 200 });

  } catch (error) {
    console.error('Error en el manejador de /api/moodle/contexts:', error);
    const message = (error as any).response?.data?.message || (error as any).message || 'Error desconocido al procesar la solicitud de contextos.';
    return NextResponse.json(
      { message, error: (error as any).exception || (error as any).debuginfo || 'Detalles no disponibles' }, 
      { status: 500 }
    );
  }
} 