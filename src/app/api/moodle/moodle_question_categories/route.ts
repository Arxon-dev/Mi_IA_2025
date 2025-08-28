import { NextRequest, NextResponse } from 'next/server';
import MoodleApiService from '@/services/moodleApiService';

// Interfaces
interface PluginCategory {
    id: number;
    name: string;
    parent?: number;
    contextid: number;
    questioncount?: number;
}

interface PluginCreatedCategory extends PluginCategory {}

interface ErrorResponse {
    message: string;
    error?: any;
}

const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_WEBSERVICE_TOKEN = process.env.MOODLE_WEBSERVICE_TOKEN;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    console.log('[API /api/moodle/moodle_question_categories] Solicitud GET recibida:', { query: Object.fromEntries(searchParams) });

    if (!MOODLE_API_URL || !MOODLE_WEBSERVICE_TOKEN) {
        console.error('[API /api/moodle/moodle_question_categories] Error: Las variables de entorno MOODLE_API_URL o MOODLE_WEBSERVICE_TOKEN no están configuradas.');
        return NextResponse.json({ message: 'Error de configuración del servidor: contacte al administrador.' }, { status: 500 });
    }

    const moodleService = new MoodleApiService(MOODLE_API_URL, MOODLE_WEBSERVICE_TOKEN);
    console.log(`[API /api/moodle/moodle_question_categories] Instanciado MoodleApiService con URL: ${MOODLE_API_URL}`);

    const contextId = searchParams.get('contextId');

    if (!contextId) {
        console.warn('[API /api/moodle/moodle_question_categories] Solicitud GET inválida: Falta el parámetro contextId.', Object.fromEntries(searchParams));
        return NextResponse.json({ message: 'Parámetro contextId requerido.' }, { status: 400 });
    }
    
    const parsedContextId = parseInt(contextId, 10);
    if (isNaN(parsedContextId)) {
        console.warn('[API /api/moodle/moodle_question_categories] Solicitud GET inválida: contextId no es un número válido.', Object.fromEntries(searchParams));
        return NextResponse.json({ message: 'El parámetro contextId debe ser un número válido.' }, { status: 400 });
    }

    try {
        console.log('[API /api/moodle/moodle_question_categories] Llamando a moodleService.getQuestionCategories...');
        const categories = await moodleService.getQuestionCategories(parsedContextId);
        console.log(`[API /api/moodle/moodle_question_categories] Categorías obtenidas (${categories.length}):`, categories);
        return NextResponse.json(categories, { status: 200 });
    } catch (error: any) {
        console.error('[API /api/moodle/moodle_question_categories] Error al obtener categorías:', error);
        return NextResponse.json({ 
            message: error.message || 'Error interno del servidor al obtener categorías.',
            error: error.stack
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[API /api/moodle/moodle_question_categories] Solicitud POST recibida:', { body });

        if (!MOODLE_API_URL || !MOODLE_WEBSERVICE_TOKEN) {
            console.error('[API /api/moodle/moodle_question_categories] Error: Las variables de entorno MOODLE_API_URL o MOODLE_WEBSERVICE_TOKEN no están configuradas.');
            return NextResponse.json({ message: 'Error de configuración del servidor: contacte al administrador.' }, { status: 500 });
        }

        const moodleService = new MoodleApiService(MOODLE_API_URL, MOODLE_WEBSERVICE_TOKEN);
        console.log(`[API /api/moodle/moodle_question_categories] Instanciado MoodleApiService con URL: ${MOODLE_API_URL}`);

        const { name, contextid, parentid } = body;

        if (!name || !contextid) {
            console.error(`[API /api/moodle/moodle_question_categories] Solicitud POST inválida: Faltan parámetros name o contextid.`, body);
            return NextResponse.json({ message: 'Parámetros incompletos. Se requieren name y contextid.' }, { status: 400 });
        }

        const parsedContextId = typeof contextid === 'number' ? contextid : parseInt(contextid as string, 10);
        let parsedParentId;
        if (parentid !== undefined && parentid !== null && parentid !== 0) {
            parsedParentId = typeof parentid === 'number' ? parentid : parseInt(parentid as string, 10);
            if (isNaN(parsedParentId)) {
                console.warn('[API /api/moodle/moodle_question_categories] parentid proporcionado no es un número válido:', parentid);
                return NextResponse.json({ message: "El 'parentid' proporcionado no es un número válido." }, { status: 400 });
            }
            console.log(`[API /api/moodle/moodle_question_categories] Usando parentId explícito proporcionado: ${parsedParentId}`);
        } else {
            console.log(`[API /api/moodle/moodle_question_categories] No se proporcionó parentId explícito. Intentando determinar el padre por defecto para contextId: ${parsedContextId}`);
            try {
                if (parsedContextId === 1) {
                    parsedParentId = 1;
                    console.log(`[API /api/moodle/moodle_question_categories] ContextId es Sistema (1). Usando parentId por defecto: ${parsedParentId}`);
                } else {
                    const courseLevelDefaultCategories = await moodleService.getQuestionCategories(parsedContextId);
                    const actualDefaultCategory = courseLevelDefaultCategories.find(cat => cat.parent === 0);

                    if (actualDefaultCategory) {
                        parsedParentId = actualDefaultCategory.id;
                        console.log(`[API /api/moodle/moodle_question_categories] Encontrada categoría por defecto (parent=0) para contextId ${parsedContextId}. Usando parentId: ${parsedParentId}`);
                    } else {
                        console.warn(`[API /api/moodle/moodle_question_categories] No se encontró categoría por defecto con parent=0 para contextId: ${parsedContextId}. Usando 0 como fallback. ¡Esto podría causar que la categoría no sea visible!`);
                        parsedParentId = 0;
                    }
                }
            } catch (error) {
                console.error(`[API /api/moodle/moodle_question_categories] Error al obtener la categoría padre por defecto para contextId ${parsedContextId}:`, error);
                parsedParentId = 0;
                console.warn(`[API /api/moodle/moodle_question_categories] Fallback a parentId 0 debido a error en la determinación del padre por defecto.`);
            }
        }

        if (isNaN(parsedContextId)) {
            return NextResponse.json({ message: "El 'contextid' proporcionado no es un número válido." }, { status: 400 });
        }

        try {
            console.log('[API /api/moodle/moodle_question_categories] Llamando a moodleService.createQuestionCategory...');
            const newCategory = await moodleService.createQuestionCategory(parsedContextId, name, parsedParentId);
            console.log('[API /api/moodle/moodle_question_categories] Categoría creada:', newCategory);
            return NextResponse.json(newCategory, { status: 201 }); // 201 Created
        } catch (error: any) {
            console.error('[API /api/moodle/moodle_question_categories] Error al crear categoría:', error);
            return NextResponse.json({ 
                message: error.message || 'Error interno del servidor al crear la categoría.',
                error: error.stack
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[API /api/moodle/moodle_question_categories] Error al parsear el body del request:', error);
        return NextResponse.json({ message: 'Error al parsear el cuerpo de la solicitud.' }, { status: 400 });
    }
} 