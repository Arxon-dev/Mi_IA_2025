// Contenido inicial para lib/moodle.ts

/**
 * Realiza una llamada a un web service de Moodle.
 * ¡¡¡ATENCIÓN!!! Esta es una implementación genérica.
 * DEBES ADAPTARLA O REEMPLAZARLA con tu lógica específica para comunicarte con Moodle,
 * incluyendo el manejo de la URL base de tu Moodle (process.env.MOODLE_API_URL)
 * y el formato exacto de los parámetros y errores.
 */
export const callMoodleWebService = async <T>(
    token: string,
    wsfunction: string,
    params: Record<string, any> = {},
    // moodleApiUrlOverride?: string // Podrías necesitar esto si la URL no siempre es la misma
): Promise<T> => {
    const moodleApiUrl = process.env.MOODLE_API_URL; // Lee la URL base de Moodle desde .env

    if (!moodleApiUrl) {
        throw new Error('MOODLE_API_URL no está configurada en las variables de entorno.');
    }

    const fullUrl = `${moodleApiUrl}/webservice/rest/server.php`;

    const formData = new URLSearchParams();
    formData.append('wstoken', token);
    formData.append('wsfunction', wsfunction);
    formData.append('moodlewsrestformat', 'json');

    for (const key in params) {
        const value = params[key];
        if (Array.isArray(value)) {
            value.forEach((item: any, index: number) => {
                if (typeof item === 'object' && item !== null) {
                    // Si el item es un objeto, iteramos sobre sus propiedades
                    for (const subKey in item) {
                        if (Object.prototype.hasOwnProperty.call(item, subKey)) {
                            formData.append(`${key}[${index}][${subKey}]`, item[subKey].toString());
                        }
                    }
                } else {
                    // Si el item no es un objeto (es un escalar)
                    formData.append(`${key}[${index}]`, item.toString());
                }
            });
        } else if (typeof value === 'object' && value !== null) {
            // Si es un objeto (pero no un array), iteramos sobre sus propiedades
            for (const subKey in value) {
                if (Object.prototype.hasOwnProperty.call(value, subKey)) {
                    formData.append(`${key}[${subKey}]`, value[subKey].toString());
                }
            }
        } else {
            // Si es un valor escalar
            formData.append(key, value.toString());
        }
    }

    console.log('Llamando a Moodle Web Service (con serialización mejorada):', { fullUrl, wsfunction, tokenPresent: !!token });

    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.ok) {
            // Intenta obtener más detalles si la respuesta no es OK
            let errorBody;
            try {
                errorBody = await response.json();
            } catch (e) {
                errorBody = await response.text();
            }
            console.error('Error en la respuesta del web service de Moodle (no OK):', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody,
            });
            throw new Error(`Error del servidor de Moodle: ${response.status} ${response.statusText}. Detalles: ${JSON.stringify(errorBody)}`);
        }

        const data = await response.json();

        // Moodle a veces devuelve errores dentro de una respuesta JSON con estado 200
        if (data && (data.exception || data.errorcode)) {
            console.error('Error devuelto por el web service de Moodle (en JSON):', data);
            throw new Error(data.message || `Error de Moodle: ${data.errorcode}. Excepción: ${data.exception}. Debug: ${data.debuginfo}`);
        }
        
        return data as T;

    } catch (error: any) {
        console.error(`Error en callMoodleWebService (${wsfunction}):`, error);
        // Re-lanzar el error para que sea manejado por la función que llama
        throw error; // Podrías querer envolverlo en un error más específico
    }
};

/**
 * Llama al endpoint de la API de Next.js para importar preguntas a Moodle.
 */
export const importQuestionsToMoodle = async (
    giftContent: string,
    contextId: number,
    categoryId: number,
    token: string // Token de Moodle para autenticar la llamada a la API interna
): Promise<{ success: boolean; message?: string; data?: any; error?: any }> => {
    console.log('Llamando a /api/moodle/import-questions desde lib/moodle.ts con:', {
        giftContentLenght: giftContent.length,
        contextId,
        categoryId,
        tokenPresent: !!token,
    });

    try {
        const response = await fetch('/api/moodle/import-questions', { // Llama a tu endpoint de Next.js
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                giftContent: giftContent,
                contextid: contextId,   // Coincide con lo que espera tu API /api/moodle/import-questions
                categoryid: categoryId, // Coincide con lo que espera tu API
                wstoken: token,         // Coincide con lo que espera tu API
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Error en la respuesta de /api/moodle/import-questions:', result);
            return {
                success: false,
                message: result.message || 'Error desde el servidor al importar preguntas (lib/moodle.ts).',
                error: result.error || result.debuginfo || result.exception || result,
                data: result.data // Podría haber notificaciones aquí
            };
        }
        
        // Asume que tu API devuelve { success: boolean, message?: string, data?: any, error?: any }
        console.log('Respuesta de /api/moodle/import-questions (lib/moodle.ts):', result);
        return result;

    } catch (error: any) {
        console.error('Excepción en importQuestionsToMoodle (lib/moodle.ts):', error);
        return {
            success: false,
            message: error.message || 'Error de red o excepción al intentar importar preguntas (lib/moodle.ts).',
            error: error,
        };
    }
};

// Puedes añadir otras funciones de Moodle aquí si es necesario 