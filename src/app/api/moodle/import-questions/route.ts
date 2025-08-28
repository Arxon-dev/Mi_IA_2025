import { NextRequest, NextResponse } from 'next/server';
import MoodleApiService from '@/services/moodleApiService';

const moodleUrl = process.env.MOODLE_API_URL;
const moodleToken = process.env.MOODLE_WEBSERVICE_TOKEN;

const MOODLE_API_IMPORT_LOG_PREFIX = '[Moodle API /import-questions]';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!moodleUrl || !moodleToken) {
            console.error(`${MOODLE_API_IMPORT_LOG_PREFIX} Moodle URL o Token no configurados.`);
            return NextResponse.json({ message: 'Error de configuración del servidor: Moodle URL o Token no configurados.' }, { status: 500 });
        }

        const moodleApiService = new MoodleApiService(moodleUrl, moodleToken);

        const { contextid: contextId, categoryid: categoryId, filename, filecontent } = body;

        // Validación de parámetros
        if (typeof contextId !== 'number' || contextId <= 0) {
            console.warn(`${MOODLE_API_IMPORT_LOG_PREFIX} contextId inválido:`, contextId);
            return NextResponse.json({ message: 'El campo contextId (numérico positivo) es requerido.' }, { status: 400 });
        }
        if (typeof categoryId !== 'number' || categoryId <= 0) {
            console.warn(`${MOODLE_API_IMPORT_LOG_PREFIX} categoryId inválido:`, categoryId);
            return NextResponse.json({ message: 'El campo categoryId (numérico positivo) es requerido.' }, { status: 400 });
        }
        if (!filename || typeof filename !== 'string' || filename.trim() === '') {
            console.warn(`${MOODLE_API_IMPORT_LOG_PREFIX} filename inválido:`, filename);
            return NextResponse.json({ message: 'El campo filename (string no vacío) es requerido.' }, { status: 400 });
        }
        if (!filecontent || typeof filecontent !== 'string' || filecontent.trim() === '') {
            console.warn(`${MOODLE_API_IMPORT_LOG_PREFIX} filecontent inválido o no proporcionado.`);
            return NextResponse.json({ message: 'El campo filecontent (string no vacío, Base64) es requerido.' }, { status: 400 });
        }
        // Validación simple para base64 (puede no ser exhaustiva)
        try {
            Buffer.from(filecontent, 'base64');
        } catch (e) {
            console.warn(`${MOODLE_API_IMPORT_LOG_PREFIX} filecontent no es una cadena base64 válida.`);
            return NextResponse.json({ message: 'El campo filecontent debe ser una cadena Base64 válida.' }, { status: 400 });
        }

        try {
            console.log(`${MOODLE_API_IMPORT_LOG_PREFIX} Iniciando importación para filename: ${filename}, contextId: ${contextId}, categoryId: ${categoryId}`);
            const importResult = await moodleApiService.importQuestions(
                contextId,
                categoryId,
                filename,
                filecontent
            );
            console.log(`${MOODLE_API_IMPORT_LOG_PREFIX} Importación completada para ${filename}. Resultado:`, importResult);
            
            if (importResult.status) {
                return NextResponse.json(importResult, { status: 200 });
            } else {
                console.error(`${MOODLE_API_IMPORT_LOG_PREFIX} Error funcional durante la importación de ${filename}:`, importResult.message);
                return NextResponse.json({ 
                    message: `Error durante la importación en Moodle: ${importResult.message}`,
                    details: importResult
                }, { status: 400 });
            }

        } catch (error: any) {
            console.error(`${MOODLE_API_IMPORT_LOG_PREFIX} Error al importar preguntas ${filename}:`, error.message, error.stack);
            return NextResponse.json({ 
                message: `Error interno del servidor al importar preguntas: ${error.message}`
            }, { status: 500 });
        }
    } catch (error) {
        console.error(`${MOODLE_API_IMPORT_LOG_PREFIX} Error al parsear el body del request:`, error);
        return NextResponse.json({ message: 'Error al parsear el cuerpo de la solicitud.' }, { status: 400 });
    }
} 