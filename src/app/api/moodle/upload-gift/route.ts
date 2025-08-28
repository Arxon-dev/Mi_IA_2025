import { NextRequest, NextResponse } from 'next/server';
import MoodleApiService from '@/services/moodleApiService';

// Interfaces
interface MoodleUploadedFile {
    contextid: number;
    component: string;
    filearea: string;
    itemid: number;
    filepath: string;
    filename: string;
    url: string;
}

interface ErrorResponse {
    message: string;
    error?: any;
}

const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_WEBSERVICE_TOKEN = process.env.MOODLE_WEBSERVICE_TOKEN;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[API /api/moodle/upload-gift] Solicitud POST recibida:', { body });

        if (!MOODLE_API_URL || !MOODLE_WEBSERVICE_TOKEN) {
            console.error('[API /api/moodle/upload-gift] Error: Las variables de entorno MOODLE_API_URL o MOODLE_WEBSERVICE_TOKEN no están configuradas.');
            return NextResponse.json({ message: 'Error de configuración del servidor: contacte al administrador.' }, { status: 500 });
        }

        const { giftContent, filename, userIdForContext } = body;

        if (!giftContent || !filename || userIdForContext === undefined) {
            console.warn('[API /api/moodle/upload-gift] Solicitud POST inválida: Faltan parámetros.', body);
            return NextResponse.json({ message: 'Parámetros incompletos. Se requieren giftContent, filename y userIdForContext.' }, { status: 400 });
        }
        
        if (typeof userIdForContext !== 'number') {
            console.warn('[API /api/moodle/upload-gift] Solicitud POST inválida: userIdForContext debe ser un número.', body);
            return NextResponse.json({ message: 'El parámetro userIdForContext debe ser un número.' }, { status: 400 });
        }

        try {
            console.log(`[API /api/moodle/upload-gift] Instanciando MoodleApiService con URL: ${MOODLE_API_URL}`);
            const moodleService = new MoodleApiService(MOODLE_API_URL, MOODLE_WEBSERVICE_TOKEN);
            
            console.log('[API /api/moodle/upload-gift] Llamando a moodleService.uploadGiftFileToDraft...');
            const uploadedFile = await moodleService.uploadGiftFileToDraft(giftContent, filename, userIdForContext);
            
            console.log('[API /api/moodle/upload-gift] Archivo subido exitosamente:', uploadedFile);
            return NextResponse.json(uploadedFile, { status: 200 });

        } catch (error: any) {
            console.error('[API /api/moodle/upload-gift] Error al procesar la subida del archivo:', error);
            return NextResponse.json({ 
                message: error.message || 'Error interno del servidor al subir el archivo.',
                error: error.stack
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[API /api/moodle/upload-gift] Error al parsear el body del request:', error);
        return NextResponse.json({ message: 'Error al parsear el cuerpo de la solicitud.' }, { status: 400 });
    }
} 